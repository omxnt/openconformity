/**
 * The model, and the rules that hold it to the metamodel. Every mutation
 * goes through this module; nothing else in the software writes to a model.
 *
 * A model holds one collection of nodes — folders and entities, told apart
 * by their `kind` — the relationships keyed by their triple, and the
 * counters that issue identifiers. Sibling order is collection order: the
 * children of a parent, read in collection order, are the order the tree
 * draws, folders and entities interleaved.
 *
 * Every check the interface can ask has a mutation that answers the same
 * way: a `can*` function and its `do` return the same `{ ok, reason }`,
 * and a mutation runs its check before it writes.
 */

import { ENTITY_TYPES, RELATIONSHIP_TYPES } from './metamodel.js';

/**
 * @typedef {Object} Folder
 * @property {string} id
 * @property {'folder'} kind
 * @property {string} name
 * @property {string|null} parent  the node it is filed in, or null at the top
 *
 * @typedef {Object} Entity
 * @property {string} id
 * @property {'entity'} kind
 * @property {string} type  entity type code
 * @property {string|null} parent  the node it is filed in, or null at the top
 * @property {Object<string, string>} attributes
 *
 * @typedef {Folder|Entity} Node
 *
 * @typedef {Object} Relationship
 * @property {string} type    relationship type id
 * @property {string} source  entity id
 * @property {string} target  entity id
 *
 * @typedef {Object} Model
 * @property {string} name
 * @property {Object<string, string>} attributes  the project's own values, carried like an entity's
 * @property {Map<string, Node>} nodes
 * @property {Map<string, Relationship>} relationships  keyed by `type source target`
 * @property {Object<string, number>} counters  the next number to issue, per entity type code and F for folders
 *
 * @typedef {{ ok: true } | { ok: false, reason: string }} Outcome
 */

/** @returns {Model} */
export function createModel() {
  /** @type {Object<string, number>} */
  const counters = { F: 1 };
  for (const code of Object.keys(ENTITY_TYPES)) counters[code] = 1;
  return { name: '', attributes: {}, nodes: new Map(), relationships: new Map(), counters };
}

/**
 * The node with this identifier, or null.
 * @param {Model} model
 * @param {string|null} id
 * @returns {Node|null}
 */
export function nodeOf(model, id) {
  if (id === null || id === undefined) return null;
  return model.nodes.get(id) ?? null;
}

/**
 * The nodes filed in a parent, in sibling order. Pass null for the top of
 * the tree.
 * @param {Model} model
 * @param {string|null} parentId
 * @returns {Node[]}
 */
export function childrenOf(model, parentId) {
  return [...model.nodes.values()].filter((node) => node.parent === parentId);
}

/**
 * Whether a node is another node or filed anywhere beneath it. The walk
 * upwards is guarded, so a cycle that reached the model some other way
 * cannot hang it.
 * @param {Model} model
 * @param {string} id
 * @param {string} containerId
 * @returns {boolean}
 */
function isWithin(model, id, containerId) {
  const seen = new Set();
  let current = nodeOf(model, id);
  while (current && !seen.has(current.id)) {
    if (current.id === containerId) return true;
    seen.add(current.id);
    current = nodeOf(model, current.parent);
  }
  return false;
}

// --- Creation ----------------------------------------------------------

/**
 * @param {Model} model
 * @param {string|null} parent
 * @returns {Outcome}
 */
function checkParent(model, parent) {
  if (parent !== null && !model.nodes.has(parent)) {
    return { ok: false, reason: 'The parent is not in the model.' };
  }
  return { ok: true };
}

/**
 * @param {Model} model
 * @param {string} id
 * @param {string} prefix
 * @returns {Outcome}
 */
function checkSuppliedId(model, id, prefix) {
  if (!id.startsWith(`${prefix}-`)) {
    return { ok: false, reason: `The identifier ${id} does not carry the type code ${prefix}.` };
  }
  if (model.nodes.has(id)) return { ok: false, reason: `${id} is already in the model.` };
  return { ok: true };
}

/**
 * Add an entity of a metamodel type, filed last among the parent's
 * children. A new entity starts with no attribute keys; attributes passed
 * in are carried verbatim. An identifier is issued from the type's counter
 * unless one is supplied, which only the file loader does.
 * @param {Model} model
 * @param {string} code
 * @param {Object} [options]
 * @param {string|null} [options.parent]
 * @param {string} [options.id]
 * @param {Object<string, string>} [options.attributes]
 * @returns {Outcome & { entity?: Entity }}
 */
export function addEntity(model, code, options = {}) {
  if (!Object.hasOwn(ENTITY_TYPES, code)) {
    return { ok: false, reason: 'The metamodel defines no such entity type.' };
  }
  const parent = options.parent ?? null;
  const parentCheck = checkParent(model, parent);
  if (!parentCheck.ok) return parentCheck;

  let id = options.id;
  if (id === undefined) {
    id = `${code}-${String(model.counters[code]).padStart(3, '0')}`;
    model.counters[code] += 1;
  } else {
    const idCheck = checkSuppliedId(model, id, code);
    if (!idCheck.ok) return idCheck;
  }

  /** @type {Entity} */
  const entity = { id, kind: 'entity', type: code, parent, attributes: { ...(options.attributes ?? {}) } };
  model.nodes.set(id, entity);
  return { ok: true, entity };
}

/**
 * Add a folder, filed last among the parent's children. A folder carries a
 * name and nothing else, and the name cannot be empty. An identifier is
 * issued from the folder counter unless one is supplied, which only the
 * file loader does.
 * @param {Model} model
 * @param {string} name
 * @param {Object} [options]
 * @param {string|null} [options.parent]
 * @param {string} [options.id]
 * @returns {Outcome & { folder?: Folder }}
 */
export function addFolder(model, name, options = {}) {
  if (typeof name !== 'string' || name === '') {
    return { ok: false, reason: 'A folder needs a name.' };
  }
  const parent = options.parent ?? null;
  const parentCheck = checkParent(model, parent);
  if (!parentCheck.ok) return parentCheck;

  let id = options.id;
  if (id === undefined) {
    id = `F-${model.counters.F}`;
    model.counters.F += 1;
  } else {
    const idCheck = checkSuppliedId(model, id, 'F');
    if (!idCheck.ok) return idCheck;
  }

  /** @type {Folder} */
  const folder = { id, kind: 'folder', name, parent };
  model.nodes.set(id, folder);
  return { ok: true, folder };
}

// --- Editing -----------------------------------------------------------

/**
 * Write a set of attribute values at once, which is what the editor
 * commits when the user saves. An empty value removes its key, so an
 * entity carries only what is set.
 * @param {Model} model
 * @param {string} id
 * @param {Object<string, string>} values
 * @returns {Outcome}
 */
export function updateEntity(model, id, values) {
  const node = nodeOf(model, id);
  if (!node || node.kind !== 'entity') {
    return { ok: false, reason: 'The entity is not in the model.' };
  }
  for (const [key, value] of Object.entries(values)) {
    if (value === '') delete node.attributes[key];
    else node.attributes[key] = value;
  }
  return { ok: true };
}

/**
 * @param {Model} model
 * @param {string} id
 * @param {string} name
 * @returns {Outcome}
 */
export function renameFolder(model, id, name) {
  const node = nodeOf(model, id);
  if (!node || node.kind !== 'folder') {
    return { ok: false, reason: 'The folder is not in the model.' };
  }
  if (typeof name !== 'string' || name === '') {
    return { ok: false, reason: 'A folder needs a name.' };
  }
  node.name = name;
  return { ok: true };
}

// --- Filing ------------------------------------------------------------

/**
 * Whether a node can be filed in a parent, and why not when it cannot.
 * Filing is free: anything files inside anything, to any depth, and the
 * only arrangements refused are one that changes nothing and one that
 * would put a node inside itself.
 * @param {Model} model
 * @param {string} nodeId
 * @param {string|null} parentId
 * @returns {Outcome}
 */
export function canFile(model, nodeId, parentId) {
  const node = nodeOf(model, nodeId);
  if (!node) return { ok: false, reason: 'It is not in the model.' };
  if (parentId !== null) {
    if (!model.nodes.has(parentId)) return { ok: false, reason: 'The destination is not in the model.' };
    if (isWithin(model, parentId, nodeId)) {
      return { ok: false, reason: 'Nothing can be filed inside itself.' };
    }
  }
  if (node.parent === parentId) return { ok: false, reason: 'It is already there.' };
  return { ok: true };
}

/**
 * File a node in a parent, last among the children there.
 * @param {Model} model
 * @param {string} nodeId
 * @param {string|null} parentId
 * @returns {Outcome}
 */
export function file(model, nodeId, parentId) {
  const check = canFile(model, nodeId, parentId);
  if (!check.ok) return check;
  const node = /** @type {Node} */ (nodeOf(model, nodeId));
  node.parent = parentId;
  model.nodes.delete(nodeId);
  model.nodes.set(nodeId, node);
  return { ok: true };
}

/**
 * Whether a node can be placed beside another, taking that node's parent.
 * @param {Model} model
 * @param {string} nodeId
 * @param {string} targetId
 * @returns {Outcome}
 */
export function canPlaceBeside(model, nodeId, targetId) {
  const node = nodeOf(model, nodeId);
  const target = nodeOf(model, targetId);
  if (!node || !target) return { ok: false, reason: 'It is not in the model.' };
  if (nodeId === targetId) return { ok: false, reason: 'It is already there.' };
  if (target.parent !== null && isWithin(model, target.parent, nodeId)) {
    return { ok: false, reason: 'Nothing can be filed inside itself.' };
  }
  return { ok: true };
}

/**
 * Place a node directly before or after another, in that node's parent.
 * @param {Model} model
 * @param {string} nodeId
 * @param {string} targetId
 * @param {'before'|'after'} position
 * @returns {Outcome}
 */
export function placeBeside(model, nodeId, targetId, position) {
  const check = canPlaceBeside(model, nodeId, targetId);
  if (!check.ok) return check;
  const node = /** @type {Node} */ (nodeOf(model, nodeId));
  node.parent = /** @type {Node} */ (nodeOf(model, targetId)).parent;

  const entries = [...model.nodes].filter(([id]) => id !== nodeId);
  const at = entries.findIndex(([id]) => id === targetId);
  entries.splice(position === 'after' ? at + 1 : at, 0, [nodeId, node]);
  model.nodes.clear();
  for (const [id, entry] of entries) model.nodes.set(id, entry);
  return { ok: true };
}

// --- Relationships -----------------------------------------------------

/**
 * The key a relationship is held under: its triple, which is its identity.
 * @param {string} type
 * @param {string} source
 * @param {string} target
 * @returns {string}
 */
function relationshipKey(type, source, target) {
  return `${type} ${source} ${target}`;
}

/**
 * The entity that owns this one through a composition relationship, or
 * null.
 * @param {Model} model
 * @param {string} entityId
 * @returns {string|null}
 */
function ownerOf(model, entityId) {
  for (const relationship of model.relationships.values()) {
    if (relationship.target === entityId && RELATIONSHIP_TYPES[relationship.type].composition) {
      return relationship.source;
    }
  }
  return null;
}

/**
 * Whether making `sourceId` own `targetId` would close an ownership cycle:
 * true when the source is the target or owned by it, directly or through
 * what owns it. The walk upwards is guarded.
 * @param {Model} model
 * @param {string} sourceId
 * @param {string} targetId
 * @returns {boolean}
 */
function wouldOwnItself(model, sourceId, targetId) {
  const seen = new Set();
  let current = sourceId;
  while (current !== null && !seen.has(current)) {
    if (current === targetId) return true;
    seen.add(current);
    current = ownerOf(model, current);
  }
  return false;
}

/**
 * Whether a relationship can be created, and why not when it cannot. The
 * metamodel is the first gate: a triple it does not define is refused. A
 * composition is additionally refused when the target is already owned or
 * the ownership would close a cycle.
 * @param {Model} model
 * @param {string} typeId
 * @param {string} sourceId
 * @param {string} targetId
 * @returns {Outcome}
 */
export function canRelate(model, typeId, sourceId, targetId) {
  if (!Object.hasOwn(RELATIONSHIP_TYPES, typeId)) {
    return { ok: false, reason: 'The metamodel defines no such relationship.' };
  }
  const type = RELATIONSHIP_TYPES[typeId];

  const source = nodeOf(model, sourceId);
  const target = nodeOf(model, targetId);
  if (!source || source.kind !== 'entity' || !target || target.kind !== 'entity') {
    return { ok: false, reason: 'One of the entities is not in the model.' };
  }
  if (source.type !== type.source || target.type !== type.target) {
    return {
      ok: false,
      reason: `The metamodel defines "${type.label}" from ${ENTITY_TYPES[type.source].name} to ${ENTITY_TYPES[type.target].name} only.`,
    };
  }
  if (model.relationships.has(relationshipKey(typeId, sourceId, targetId))) {
    return { ok: false, reason: 'The relationship already exists.' };
  }
  if (type.composition) {
    if (ownerOf(model, targetId) !== null) {
      return { ok: false, reason: 'It is already part of another entity.' };
    }
    if (wouldOwnItself(model, sourceId, targetId)) {
      return { ok: false, reason: 'That would make an entity part of itself.' };
    }
  }
  return { ok: true };
}

/**
 * @param {Model} model
 * @param {string} typeId
 * @param {string} sourceId
 * @param {string} targetId
 * @returns {Outcome & { relationship?: Relationship }}
 */
export function relate(model, typeId, sourceId, targetId) {
  const check = canRelate(model, typeId, sourceId, targetId);
  if (!check.ok) return check;
  /** @type {Relationship} */
  const relationship = { type: typeId, source: sourceId, target: targetId };
  model.relationships.set(relationshipKey(typeId, sourceId, targetId), relationship);
  return { ok: true, relationship };
}

/**
 * Remove a relationship. Both entities stay in place.
 * @param {Model} model
 * @param {string} typeId
 * @param {string} sourceId
 * @param {string} targetId
 * @returns {Outcome}
 */
export function unrelate(model, typeId, sourceId, targetId) {
  if (!model.relationships.delete(relationshipKey(typeId, sourceId, targetId))) {
    return { ok: false, reason: 'The relationship is not in the model.' };
  }
  return { ok: true };
}

/**
 * Every relationship the entity takes part in, split by direction.
 * @param {Model} model
 * @param {string} entityId
 * @returns {{ outgoing: Relationship[], incoming: Relationship[] }}
 */
export function relationshipsOf(model, entityId) {
  const outgoing = [];
  const incoming = [];
  for (const relationship of model.relationships.values()) {
    if (relationship.source === entityId) outgoing.push(relationship);
    if (relationship.target === entityId) incoming.push(relationship);
  }
  return { outgoing, incoming };
}

// --- Deletion ----------------------------------------------------------

/**
 * The entities a deletion removes: the entity itself and, through the
 * composition relationships, everything it owns, transitively, in the
 * order the ownership walk reaches them. This is the statement the
 * cascade confirmation makes before removeEntity acts on it. Empty when
 * the identifier names no entity.
 * @param {Model} model
 * @param {string} entityId
 * @returns {Entity[]}
 */
export function deletionOf(model, entityId) {
  const entity = nodeOf(model, entityId);
  if (!entity || entity.kind !== 'entity') return [];

  const doomed = [];
  const seen = new Set([entityId]);
  const queue = [entityId];
  while (queue.length > 0) {
    const id = /** @type {string} */ (queue.shift());
    doomed.push(/** @type {Entity} */ (nodeOf(model, id)));
    for (const relationship of model.relationships.values()) {
      if (
        relationship.source === id &&
        RELATIONSHIP_TYPES[relationship.type].composition &&
        !seen.has(relationship.target)
      ) {
        seen.add(relationship.target);
        queue.push(relationship.target);
      }
    }
  }
  return doomed;
}

/**
 * Delete an entity: the entities it owns go with it, every relationship
 * touching a removed entity goes with them, and whatever was filed inside
 * a removed entity moves up to its nearest surviving ancestor. Entities
 * related without composition are left in place.
 * @param {Model} model
 * @param {string} entityId
 * @returns {Outcome & { removed?: Entity[] }}
 */
export function removeEntity(model, entityId) {
  const doomed = deletionOf(model, entityId);
  if (doomed.length === 0) return { ok: false, reason: 'The entity is not in the model.' };
  const gone = new Set(doomed.map((entity) => entity.id));

  for (const [key, relationship] of [...model.relationships]) {
    if (gone.has(relationship.source) || gone.has(relationship.target)) {
      model.relationships.delete(key);
    }
  }

  for (const node of model.nodes.values()) {
    if (gone.has(node.id) || node.parent === null || !gone.has(node.parent)) continue;
    const seen = new Set();
    let ancestorId = node.parent;
    while (ancestorId !== null && gone.has(ancestorId) && !seen.has(ancestorId)) {
      seen.add(ancestorId);
      ancestorId = /** @type {Node} */ (nodeOf(model, ancestorId)).parent;
    }
    node.parent = ancestorId;
  }

  for (const id of gone) model.nodes.delete(id);
  return { ok: true, removed: doomed };
}

/**
 * Delete a folder. Deleting a folder removes filing, never the entities
 * filed in it: its contents move up to where the folder itself sat.
 * @param {Model} model
 * @param {string} folderId
 * @returns {Outcome}
 */
export function removeFolder(model, folderId) {
  const folder = nodeOf(model, folderId);
  if (!folder || folder.kind !== 'folder') {
    return { ok: false, reason: 'The folder is not in the model.' };
  }
  for (const node of model.nodes.values()) {
    if (node.parent === folderId) node.parent = folder.parent;
  }
  model.nodes.delete(folderId);
  return { ok: true };
}

/**
 * Name the project, or clear its name: the schema lets a project exist
 * before it is named.
 * @param {Model} model
 * @param {string} name
 * @returns {Outcome}
 */
export function renameProject(model, name) {
  if (typeof name !== 'string') return { ok: false, reason: 'A name is text.' };
  model.name = name;
  return { ok: true };
}

/**
 * Set one of the project's own attribute values, like an entity's: an
 * empty value removes the key, so the project carries only what is set.
 * @param {Model} model
 * @param {string} key
 * @param {string} value
 * @returns {Outcome}
 */
export function setProjectAttribute(model, key, value) {
  if (typeof key !== 'string' || key === '') {
    return { ok: false, reason: 'An attribute needs a key.' };
  }
  if (typeof value !== 'string') {
    return { ok: false, reason: 'An attribute value is text.' };
  }
  if (value === '') delete model.attributes[key];
  else model.attributes[key] = value;
  return { ok: true };
}

// --- Loading -----------------------------------------------------------

/**
 * Install the counters a file records, replacing the issued state. The
 * loader's final step: a file's counters are authoritative, and may exceed
 * the next unissued number where undone creations left holes.
 * @param {Model} model
 * @param {Object<string, number>} counters
 */
export function restoreCounters(model, counters) {
  model.counters = { ...counters };
}
