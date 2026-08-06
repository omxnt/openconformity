/**
 * The model, and the rules that hold it to the metamodel.
 *
 * A model is a set of entities and a set of relationships between them. Every
 * mutation goes through this module, which refuses anything the metamodel does
 * not define. Nothing else in the software writes to a model.
 *
 * Folders are the one thing here that the metamodel says nothing about. They
 * carry no meaning and take part in no relationship: they exist so the user can
 * group things in the navigator, the way a filing cabinet groups paper. They
 * are kept apart from the entities for that reason.
 *
 * Filing is free. Every folder and entity carries a `parent`, which is the
 * folder or entity it sits inside, or null for the top of the tree. Anything
 * nests inside anything, to any depth, and the only arrangement refused is one
 * that would put something inside itself. Where a thing sits says nothing about
 * what it is or what it is related to: the metamodel decides which entities can
 * exist and which relationships are allowed, and nothing else.
 */

import {
  ENTITY_TYPES,
  RELATIONSHIP_TYPES,
  relationshipsFrom,
  relationshipsTo,
  storedAttributesFor,
} from './metamodel.js';

/**
 * @typedef {Object} Entity
 * @property {string} id
 * @property {string} type       entity type code
 * @property {string|null} parent  the folder or entity it sits in, if any
 * @property {Object<string, string>} attributes
 *
 * @typedef {Object} Relationship
 * @property {string} id
 * @property {string} type       relationship type id
 * @property {string} source     entity id
 * @property {string} target     entity id
 *
 * @typedef {Object} Folder
 * @property {string} id
 * @property {string} name
 * @property {string|null} parent  the folder or entity it sits in, if any
 *
 * A `Node` below means either of the two: the things the tree files.
 *
 * @typedef {Object} Model
 * @property {string} name
 * @property {Map<string, Entity>} entities
 * @property {Map<string, Relationship>} relationships
 * @property {Map<string, Folder>} folders
 * @property {Set<string>} relationshipKeys  one key per triple, for the duplicate check
 * @property {Object<string, number>} counters
 * @property {number} relationshipCounter
 * @property {number} folderCounter
 */

/**
 * @param {string} name
 * @returns {Model}
 */
export function createModel(name) {
  return {
    name: name || 'Untitled project',
    entities: new Map(),
    relationships: new Map(),
    folders: new Map(),
    relationshipKeys: new Set(),
    counters: {},
    relationshipCounter: 0,
    folderCounter: 0,
  };
}

/**
 * @param {Model} model
 * @param {string} code
 * @returns {string}
 */
function nextEntityId(model, code) {
  const next = (model.counters[code] ?? 0) + 1;
  model.counters[code] = next;
  return `${code}-${String(next).padStart(3, '0')}`;
}

/**
 * @param {Model} model
 * @param {string} code
 * @param {Object<string, string>} [attributes]
 * @param {Object} [options]
 * @param {string|null} [options.parent]
 * @param {string} [options.id]  only supplied when loading an existing model
 * @returns {Entity}
 */
export function addEntity(model, code, attributes = {}, options = {}) {
  if (!Object.hasOwn(ENTITY_TYPES, code)) throw new Error(`No such entity type: ${code}`);
  const type = ENTITY_TYPES[code];

  const entityId = options.id ?? nextEntityId(model, code);
  /** @type {Entity} */
  const entity = { id: entityId, type: code, parent: options.parent ?? null, attributes: {} };
  for (const attribute of storedAttributesFor(code)) {
    entity.attributes[attribute.key] = attributes[attribute.key] ?? '';
  }
  if (!entity.attributes.title) entity.attributes.title = `New ${type.name}`;

  model.entities.set(entityId, entity);
  return entity;
}

/**
 * Write a set of attribute values at once, which is what the editor commits
 * when the user saves.
 * @param {Model} model
 * @param {string} id
 * @param {Object<string, string>} values
 */
export function updateEntity(model, id, values) {
  const entity = model.entities.get(id);
  if (!entity) return;
  for (const attribute of storedAttributesFor(entity.type)) {
    if (attribute.key in values) entity.attributes[attribute.key] = values[attribute.key];
  }
}

/**
 * The title an entity is shown by, falling back to its identifier.
 * @param {Entity} entity
 * @returns {string}
 */
export function labelOf(entity) {
  const title = (entity.attributes.title ?? '').trim();
  return title || entity.id;
}

// --- Folders -----------------------------------------------------------

/**
 * @param {Model} model
 * @param {string} name
 * @param {string|null} [parent]
 * @param {string} [id]
 * @returns {Folder}
 */
export function addFolder(model, name, parent = null, id) {
  model.folderCounter += 1;
  const folderId = id ?? `F-${model.folderCounter}`;
  /** @type {Folder} */
  const folder = { id: folderId, name: name || 'New folder', parent };
  model.folders.set(folderId, folder);
  return folder;
}

/**
 * @param {Model} model
 * @param {string} folderId
 * @param {string} name
 */
export function renameFolder(model, folderId, name) {
  const folder = model.folders.get(folderId);
  if (folder) folder.name = name || folder.name;
}

/**
 * Deleting a folder never deletes entities. Its contents move up to where the
 * folder itself sat.
 * @param {Model} model
 * @param {string} folderId
 */
export function removeFolder(model, folderId) {
  const folder = model.folders.get(folderId);
  if (!folder) return;
  reparentChildren(model, folderId, folder.parent);
  model.folders.delete(folderId);
}

/**
 * Move everything filed inside a node up to where that node sat, which is what
 * deleting it does to its contents.
 * @param {Model} model
 * @param {string} nodeId
 * @param {string|null} to
 */
function reparentChildren(model, nodeId, to) {
  for (const folder of model.folders.values()) {
    if (folder.parent === nodeId) folder.parent = to;
  }
  for (const entity of model.entities.values()) {
    if (entity.parent === nodeId) entity.parent = to;
  }
}

// --- The tree ----------------------------------------------------------

/**
 * The folder or entity with this identifier. The two are kept in separate maps
 * but file the same way, so the tree reaches them through one lookup.
 * @param {Model} model
 * @param {string|null} id
 * @returns {Folder|Entity|null}
 */
export function nodeOf(model, id) {
  if (!id) return null;
  return model.folders.get(id) ?? model.entities.get(id) ?? null;
}

/**
 * @param {Model} model
 * @param {string|null} parent
 * @returns {Folder[]}
 */
export function childFolders(model, parent) {
  return [...model.folders.values()].filter((folder) => folder.parent === parent);
}

/**
 * @param {Model} model
 * @param {string|null} parent
 * @returns {Entity[]}
 */
export function childEntities(model, parent) {
  return [...model.entities.values()].filter((entity) => entity.parent === parent);
}

/**
 * Whether one node sits anywhere above another. Walking upwards is guarded, so
 * a cycle that reached the model some other way cannot hang this.
 * @param {Model} model
 * @param {string} possibleAncestorId
 * @param {string} nodeId
 * @returns {boolean}
 */
function isAncestor(model, possibleAncestorId, nodeId) {
  const seen = new Set();
  let current = nodeOf(model, nodeId);
  while (current && !seen.has(current.id)) {
    if (current.id === possibleAncestorId) return true;
    seen.add(current.id);
    current = nodeOf(model, current.parent);
  }
  return false;
}

/**
 * The entities filed anywhere beneath each node, counted in one pass: every
 * entity adds one to each node above it. Walking upwards is guarded, as in
 * isAncestor.
 * @param {Model} model
 * @returns {Map<string, number>}
 */
export function contentCounts(model) {
  const counts = new Map();
  for (const entity of model.entities.values()) {
    const seen = new Set();
    let current = nodeOf(model, entity.parent);
    while (current && !seen.has(current.id)) {
      counts.set(current.id, (counts.get(current.id) ?? 0) + 1);
      seen.add(current.id);
      current = nodeOf(model, current.parent);
    }
  }
  return counts;
}

/**
 * @param {Model} model
 * @param {string} nodeId
 * @returns {number}  the entities filed anywhere beneath this node
 */
export function contentCount(model, nodeId) {
  return contentCounts(model).get(nodeId) ?? 0;
}

// --- Moving ------------------------------------------------------------

/**
 * Where something can be filed: inside a folder, inside an entity, or at the
 * top of the tree.
 * @typedef {{ kind: 'root'|'folder'|'entity', id: string }} MoveTarget
 */

/**
 * Whether a folder or an entity can be filed somewhere, and why not when it
 * cannot. Filing is free and a folder and an entity hold things alike, so the
 * only moves refused are one that changes nothing and one that would put
 * something inside itself.
 *
 * @param {Model} model
 * @param {string} nodeId
 * @param {MoveTarget} target
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canMoveNode(model, nodeId, target) {
  const node = nodeOf(model, nodeId);
  if (!node) return { ok: false, reason: 'It is not in the model.' };

  const to = target.kind === 'root' ? null : target.id;
  if (to !== null && !nodeOf(model, to)) return { ok: false, reason: 'That is not in the model.' };
  if (to === nodeId) return { ok: false, reason: 'Nothing can be filed inside itself.' };
  if (to !== null && isAncestor(model, nodeId, to)) {
    return { ok: false, reason: 'That would put it inside itself.' };
  }
  return node.parent === to ? { ok: false, reason: 'It is already there.' } : { ok: true };
}

/**
 * @param {Model} model
 * @param {string} nodeId
 * @param {MoveTarget} target
 * @returns {{ ok: boolean, reason?: string }}
 */
export function moveNode(model, nodeId, target) {
  const check = canMoveNode(model, nodeId, target);
  if (!check.ok) return check;
  const node = nodeOf(model, nodeId);
  node.parent = target.kind === 'root' ? null : target.id;
  // Filed last among its kind there, so where it lands is predictable.
  const map = model.folders.has(nodeId) ? model.folders : model.entities;
  map.delete(nodeId);
  map.set(nodeId, node);
  return { ok: true };
}

// --- Order -------------------------------------------------------------

/**
 * Order is the order the entities sit in the model, so moving one up or down
 * is a change to where it sits rather than a number stored on it. A file that
 * is read back keeps the order it was written in.
 * @param {Map<string, any>} map
 * @param {string} movingId
 * @param {string} referenceId
 * @param {'before'|'after'} position
 */
function reorderMap(map, movingId, referenceId, position) {
  const entries = [...map];
  const from = entries.findIndex(([id]) => id === movingId);
  if (from < 0) return;
  const [entry] = entries.splice(from, 1);
  const to = entries.findIndex(([id]) => id === referenceId);
  if (to < 0) return;
  entries.splice(position === 'after' ? to + 1 : to, 0, entry);
  map.clear();
  for (const [id, value] of entries) map.set(id, value);
}

/**
 * The things that sit alongside this one: filed in the same place and of the
 * same kind, in the order they are drawn. Folders are drawn above entities, so
 * the two are ordered separately.
 * @param {Model} model
 * @param {string} nodeId
 * @returns {Array<Folder|Entity>}
 */
export function siblingsOf(model, nodeId) {
  const node = nodeOf(model, nodeId);
  if (!node) return [];
  return model.folders.has(nodeId) ? childFolders(model, node.parent) : childEntities(model, node.parent);
}

/**
 * Move an entity or a folder one place up or down among the things it sits
 * beside.
 * @param {Model} model
 * @param {{ kind: 'entity'|'folder', id: string }} what
 * @param {-1|1} delta
 * @returns {{ ok: boolean, reason?: string }}
 */
export function moveOrder(model, what, delta) {
  const map = what.kind === 'entity' ? model.entities : model.folders;
  const siblings = siblingsOf(model, what.id);
  const index = siblings.findIndex((item) => item.id === what.id);
  if (index < 0) return { ok: false, reason: 'It is not in the model.' };

  const other = siblings[index + delta];
  if (!other) return { ok: false, reason: delta < 0 ? 'It is already first.' : 'It is already last.' };

  reorderMap(map, what.id, other.id, delta < 0 ? 'before' : 'after');
  return { ok: true };
}

/**
 * Whether one thing can be dropped next to another, which both reorders it and,
 * when the two sit in different places, moves it to where the other one is.
 * @param {Model} model
 * @param {{ kind: 'entity'|'folder', id: string }} source
 * @param {{ kind: 'entity'|'folder', id: string }} target
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canPlaceBeside(model, source, target) {
  if (source.id === target.id) return { ok: false, reason: 'It is already there.' };

  const one = nodeOf(model, source.id);
  const other = nodeOf(model, target.id);
  if (!one || !other) return { ok: false, reason: 'It is not in the model.' };
  // Sitting beside the other one means taking its parent, so refuse when that
  // parent is inside the thing being moved.
  if (other.parent && isAncestor(model, source.id, other.parent)) {
    return { ok: false, reason: 'That would put it inside itself.' };
  }
  return { ok: true };
}

/**
 * @param {Model} model
 * @param {{ kind: 'entity'|'folder', id: string }} source
 * @param {{ kind: 'entity'|'folder', id: string }} target
 * @param {'before'|'after'} position
 * @returns {{ ok: boolean, reason?: string }}
 */
export function placeBeside(model, source, target, position) {
  const check = canPlaceBeside(model, source, target);
  if (!check.ok) return check;

  nodeOf(model, source.id).parent = nodeOf(model, target.id).parent;
  const map = source.kind === 'folder' ? model.folders : model.entities;
  if (source.kind === target.kind) {
    reorderMap(map, source.id, target.id, position);
    return { ok: true };
  }

  // Across kinds there is no shared order: folders draw above entities. An
  // entity dropped beside a folder goes first among the entities there, and a
  // folder dropped beside an entity goes last among the folders, which is the
  // closest either can sit to where it was dropped.
  const siblings = siblingsOf(model, source.id).filter((sibling) => sibling.id !== source.id);
  if (siblings.length > 0) {
    if (source.kind === 'entity') reorderMap(map, source.id, siblings[0].id, 'before');
    else reorderMap(map, source.id, siblings[siblings.length - 1].id, 'after');
  }
  return { ok: true };
}

// --- Relationships -----------------------------------------------------

/**
 * The key a triple is indexed under in `relationshipKeys`.
 * @param {string} type
 * @param {string} source
 * @param {string} target
 * @returns {string}
 */
function relationshipKey(type, source, target) {
  return JSON.stringify([type, source, target]);
}

/**
 * Whether a relationship can be created, and why not when it cannot. The
 * metamodel is the first gate: a triple it does not define is never allowed.
 * @param {Model} model
 * @param {string} relationshipTypeId
 * @param {string} sourceId
 * @param {string} targetId
 * @returns {{ ok: boolean, reason?: string }}
 */
function canRelate(model, relationshipTypeId, sourceId, targetId) {
  if (!Object.hasOwn(RELATIONSHIP_TYPES, relationshipTypeId)) {
    return { ok: false, reason: 'The metamodel defines no such relationship.' };
  }
  const type = RELATIONSHIP_TYPES[relationshipTypeId];

  const source = model.entities.get(sourceId);
  const target = model.entities.get(targetId);
  if (!source || !target) return { ok: false, reason: 'One of the entities is not in the model.' };

  if (source.type !== type.source || target.type !== type.target) {
    return {
      ok: false,
      reason: `The metamodel defines "${type.label}" from ${ENTITY_TYPES[type.source].name} to ${ENTITY_TYPES[type.target].name} only.`,
    };
  }

  if (sourceId === targetId) return { ok: false, reason: 'An entity cannot be related to itself.' };

  if (model.relationshipKeys.has(relationshipKey(relationshipTypeId, sourceId, targetId))) {
    return { ok: false, reason: 'The relationship already exists.' };
  }

  return { ok: true };
}

/**
 * @param {Model} model
 * @param {string} relationshipTypeId
 * @param {string} sourceId
 * @param {string} targetId
 * @returns {{ ok: boolean, reason?: string, relationship?: Relationship }}
 */
export function addRelationship(model, relationshipTypeId, sourceId, targetId) {
  const check = canRelate(model, relationshipTypeId, sourceId, targetId);
  if (!check.ok) return check;

  model.relationshipCounter += 1;
  const relationshipId = `R-${model.relationshipCounter}`;
  /** @type {Relationship} */
  const relationship = { id: relationshipId, type: relationshipTypeId, source: sourceId, target: targetId };
  model.relationships.set(relationshipId, relationship);
  model.relationshipKeys.add(relationshipKey(relationshipTypeId, sourceId, targetId));
  return { ok: true, relationship };
}

/**
 * Removing a relationship leaves both entities in place.
 * @param {Model} model
 * @param {string} relationshipId
 */
export function removeRelationship(model, relationshipId) {
  const relationship = model.relationships.get(relationshipId);
  if (!relationship) return;
  model.relationships.delete(relationshipId);
  model.relationshipKeys.delete(relationshipKey(relationship.type, relationship.source, relationship.target));
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

/**
 * The entities an entity could still be related to, per direction and
 * relationship type. `keep` is an entity that stays on offer even though it is
 * already related, so a relationship being edited can show its current end.
 * @param {Model} model
 * @param {string} relationshipTypeId
 * @param {string} entityId
 * @param {'outgoing'|'incoming'} direction
 * @param {string} [keep]
 * @returns {Entity[]}
 */
export function candidatesFor(model, relationshipTypeId, entityId, direction, keep) {
  const type = RELATIONSHIP_TYPES[relationshipTypeId];
  if (!type) return [];
  const wanted = direction === 'outgoing' ? type.target : type.source;
  const candidates = [];
  for (const entity of model.entities.values()) {
    if (entity.type !== wanted) continue;
    if (entity.id === keep) {
      candidates.push(entity);
      continue;
    }
    const check =
      direction === 'outgoing'
        ? canRelate(model, relationshipTypeId, entityId, entity.id)
        : canRelate(model, relationshipTypeId, entity.id, entityId);
    if (check.ok) candidates.push(entity);
  }
  return candidates;
}

/**
 * The relationship types available from the relationship pane of an entity of
 * this type, in both directions.
 *
 * Ordered by the entity type at the far end, since that is what the user is
 * looking for: the same list is read in the New related entity menu, where
 * the far type is the label, and in the panel that adds a relationship. The
 * relationship's own name breaks a tie, so a type reachable two ways is
 * listed once for each in a settled order.
 *
 * @param {string} code
 * @returns {Array<{ direction: 'outgoing'|'incoming', type: import('./metamodel.js').RelationshipType }>}
 */
export function availableRelationships(code) {
  const far = (option) => ENTITY_TYPES[option.direction === 'outgoing' ? option.type.target : option.type.source].name;
  const byFarType = (one, other) => far(one).localeCompare(far(other)) || one.type.label.localeCompare(other.type.label);

  return [
    ...relationshipsFrom(code).map((type) => ({ direction: /** @type {const} */ ('outgoing'), type })).sort(byFarType),
    ...relationshipsTo(code).map((type) => ({ direction: /** @type {const} */ ('incoming'), type })).sort(byFarType),
  ];
}

// --- Deletion ----------------------------------------------------------

/**
 * Deleting an entity removes it and every relationship that touches it. The
 * entities at the other end are left alone: no relationship in the metamodel
 * makes one entity the owner of another, so a deletion never reaches past the
 * one entity. Whatever was filed inside it moves up to where it sat, exactly as
 * for a folder.
 * @param {Model} model
 * @param {string} entityId
 * @returns {Entity | null}  the entity that was removed
 */
export function removeEntity(model, entityId) {
  const entity = model.entities.get(entityId);
  if (!entity) return null;

  for (const [relationshipId, relationship] of model.relationships) {
    if (relationship.source === entityId || relationship.target === entityId) {
      removeRelationship(model, relationshipId);
    }
  }
  reparentChildren(model, entityId, entity.parent);
  model.entities.delete(entityId);
  return entity;
}

// --- Serialisation -----------------------------------------------------

/**
 * @param {Model} model
 * @returns {Object}
 */
export function toJSON(model) {
  return {
    format: 'openconformity-model',
    version: 1,
    name: model.name,
    folders: [...model.folders.values()].map((folder) => ({ ...folder })),
    entities: [...model.entities.values()].map((entity) => ({
      id: entity.id,
      type: entity.type,
      parent: entity.parent,
      attributes: { ...entity.attributes },
    })),
    relationships: [...model.relationships.values()].map((relationship) => ({ ...relationship })),
  };
}

/** The highest number a counter is restored from when a file is read. */
const COUNTER_LIMIT = 2 ** 40;

/**
 * Rebuild a model from parsed JSON. Data is treated as untrusted: entities of
 * unknown types and relationships the metamodel does not define are dropped,
 * and the reasons are returned for reporting.
 * @param {any} data
 * @returns {{ model: Model, rejected: string[] }}
 */
export function fromJSON(data) {
  const model = createModel(typeof data?.name === 'string' ? data.name : 'Untitled project');
  const rejected = [];

  if (typeof data !== 'object' || data === null) {
    return { model, rejected: ['The file does not hold a project.'] };
  }
  if (data.format !== 'openconformity-model') {
    rejected.push('The file is not an openconformity project file.');
  }
  if (data.version !== 1) {
    rejected.push(`The file records format version ${String(data.version)}; this software reads version 1.`);
  }
  for (const key of ['folders', 'entities', 'relationships']) {
    if (!Array.isArray(data[key])) rejected.push(`The file holds no ${key} list.`);
  }
  if (rejected.length > 0) return { model, rejected };

  for (const raw of data.folders) {
    if (typeof raw?.id !== 'string') {
      rejected.push(`Folder ${String(raw?.id)} has no identifier.`);
      continue;
    }
    if (model.folders.has(raw.id)) {
      rejected.push(`Folder ${raw.id} appears more than once.`);
      continue;
    }
    addFolder(model, String(raw.name ?? 'Folder'), typeof raw.parent === 'string' ? raw.parent : null, raw.id);
    const number = Number.parseInt(String(raw.id).split('-')[1] ?? '', 10);
    if (Number.isFinite(number) && number < COUNTER_LIMIT) {
      model.folderCounter = Math.max(model.folderCounter, number);
    }
  }
  for (const raw of data.entities) {
    if (typeof raw?.id !== 'string' || !Object.hasOwn(ENTITY_TYPES, raw?.type)) {
      rejected.push(`Entity ${String(raw?.id)} has no valid type.`);
      continue;
    }
    if (model.entities.has(raw.id)) {
      rejected.push(`Entity ${raw.id} appears more than once.`);
      continue;
    }
    if (model.folders.has(raw.id)) {
      rejected.push(`${raw.id} names both a folder and an entity.`);
      continue;
    }
    /** @type {Object<string, string>} */
    const attributes = {};
    for (const attribute of storedAttributesFor(raw.type)) {
      const value = raw.attributes?.[attribute.key];
      attributes[attribute.key] = typeof value === 'string' ? value : '';
    }
    addEntity(model, raw.type, attributes, {
      id: raw.id,
      parent: typeof raw.parent === 'string' ? raw.parent : null,
    });

    const number = Number.parseInt(String(raw.id).split('-')[1] ?? '', 10);
    if (Number.isFinite(number) && number < COUNTER_LIMIT) {
      model.counters[raw.type] = Math.max(model.counters[raw.type] ?? 0, number);
    }
  }

  // Parents are settled once both kinds are loaded, since either can hold the
  // other. A parent that is not in the model is dropped; one that points back
  // into its own chain is refused rather than repaired, because the tree is
  // walked upwards in several places and such a node has nowhere for a walk to
  // end.
  for (const node of [...model.folders.values(), ...model.entities.values()]) {
    if (node.parent && !nodeOf(model, node.parent)) node.parent = null;
  }
  for (const node of [...model.folders.values(), ...model.entities.values()]) {
    if (isAncestor(model, node.id, node.parent)) {
      rejected.push(`${node.id} sits inside itself.`);
    }
  }

  for (const raw of data.relationships) {
    const result = addRelationship(model, raw?.type, raw?.source, raw?.target);
    if (!result.ok) {
      rejected.push(`Relationship ${String(raw?.source)} ${String(raw?.type)} ${String(raw?.target)}: ${result.reason}`);
    }
  }

  return { model, rejected };
}
