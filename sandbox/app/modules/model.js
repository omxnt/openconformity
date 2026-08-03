/**
 * The model, and the rules that hold it to the metamodel.
 *
 * A model is a set of entities and a set of relationships between them. Every
 * mutation goes through this module, which refuses anything the metamodel does
 * not define. Nothing else in the software writes to a model.
 *
 * Folders are the one thing here that the metamodel says nothing about. They
 * carry no meaning and take part in no relationship: they exist so the user can
 * group entities of one type in the navigator, the way a filing cabinet groups
 * paper. They are kept apart from the entities for that reason.
 */

import {
  ENTITY_TYPES,
  RELATIONSHIP_TYPES,
  relationshipsFrom,
  relationshipsTo,
  selfComposition,
  storedAttributesFor,
} from './metamodel.js';

/**
 * @typedef {Object} Entity
 * @property {string} id
 * @property {string} type       entity type code
 * @property {string|null} folder  the folder it is filed in, if any
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
 * @property {string} type       the entity type this folder files
 * @property {string|null} parent  the folder it sits in, if any
 *
 * @typedef {Object} Model
 * @property {string} name
 * @property {Map<string, Entity>} entities
 * @property {Map<string, Relationship>} relationships
 * @property {Map<string, Folder>} folders
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
 * @param {string|null} [options.folder]
 * @param {string} [options.id]  only supplied when loading an existing model
 * @returns {Entity}
 */
export function addEntity(model, code, attributes = {}, options = {}) {
  const type = ENTITY_TYPES[code];
  if (!type) throw new Error(`No such entity type: ${code}`);

  const entityId = options.id ?? nextEntityId(model, code);
  /** @type {Entity} */
  const entity = { id: entityId, type: code, folder: options.folder ?? null, attributes: {} };
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
 * @param {string} typeCode
 * @param {string} name
 * @param {string|null} [parent]
 * @param {string} [id]
 * @returns {Folder}
 */
export function addFolder(model, typeCode, name, parent = null, id) {
  model.folderCounter += 1;
  const folderId = id ?? `F-${model.folderCounter}`;
  /** @type {Folder} */
  const folder = { id: folderId, name: name || 'New folder', type: typeCode, parent };
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
  for (const other of model.folders.values()) {
    if (other.parent === folderId) other.parent = folder.parent;
  }
  for (const entity of model.entities.values()) {
    if (entity.folder === folderId) entity.folder = folder.parent;
  }
  model.folders.delete(folderId);
}

/**
 * @param {Model} model
 * @param {string} typeCode
 * @param {string|null} parent
 * @returns {Folder[]}
 */
export function childFolders(model, typeCode, parent) {
  return [...model.folders.values()].filter((folder) => folder.type === typeCode && folder.parent === parent);
}

/**
 * @param {Model} model
 * @param {string} folderId
 * @returns {number}  entities filed in this folder and in the folders under it
 */
export function folderCount(model, folderId) {
  const folder = model.folders.get(folderId);
  if (!folder) return 0;
  let count = [...model.entities.values()].filter((entity) => entity.folder === folderId).length;
  for (const child of childFolders(model, folder.type, folderId)) count += folderCount(model, child.id);
  return count;
}

// --- Moving ------------------------------------------------------------

/**
 * @typedef {{ kind: 'type'|'folder'|'entity', id: string }} MoveTarget
 */

/**
 * Whether an entity can be moved somewhere, and why not when it cannot.
 *
 * An entity moves within its own kind: between the folders that file its type,
 * and under another entity of its type where the metamodel gives that type a
 * decomposition. It never moves into another type, so a System Element cannot
 * be dropped into a Single Hazard.
 *
 * @param {Model} model
 * @param {string} entityId
 * @param {MoveTarget} target
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canMoveEntity(model, entityId, target) {
  const entity = model.entities.get(entityId);
  if (!entity) return { ok: false, reason: 'The entity is not in the model.' };
  const type = ENTITY_TYPES[entity.type];

  if (target.kind === 'type') {
    if (target.id !== entity.type) {
      return { ok: false, reason: `A ${type.name} is filed with the ${type.plural}.` };
    }
    return entity.folder === null && !decompositionParent(model, entityId)
      ? { ok: false, reason: 'It is already there.' }
      : { ok: true };
  }

  if (target.kind === 'folder') {
    const folder = model.folders.get(target.id);
    if (!folder) return { ok: false, reason: 'The folder is not in the model.' };
    if (folder.type !== entity.type) {
      return { ok: false, reason: `That folder files ${ENTITY_TYPES[folder.type].plural}, not ${type.plural}.` };
    }
    return entity.folder === folder.id && !decompositionParent(model, entityId)
      ? { ok: false, reason: 'It is already there.' }
      : { ok: true };
  }

  if (target.kind === 'entity') {
    const parent = model.entities.get(target.id);
    if (!parent) return { ok: false, reason: 'The entity is not in the model.' };
    if (parent.id === entity.id) return { ok: false, reason: 'An entity cannot be moved into itself.' };
    if (parent.type !== entity.type) {
      return { ok: false, reason: `The metamodel gives no composition from ${ENTITY_TYPES[parent.type].name} to ${type.name}.` };
    }
    if (!selfComposition(entity.type)) {
      return { ok: false, reason: `${type.plural} do not decompose into one another.` };
    }
    if (isDescendant(model, parent.id, entity.id)) {
      return { ok: false, reason: 'That would put the entity inside itself.' };
    }
    return decompositionParent(model, entityId)?.id === parent.id
      ? { ok: false, reason: 'It is already there.' }
      : { ok: true };
  }

  return { ok: false, reason: 'Nothing can be filed there.' };
}

/**
 * @param {Model} model
 * @param {string} entityId
 * @param {MoveTarget} target
 * @returns {{ ok: boolean, reason?: string }}
 */
export function moveEntity(model, entityId, target) {
  const check = canMoveEntity(model, entityId, target);
  if (!check.ok) return check;

  if (target.kind === 'entity') {
    attachEntity(model, entityId, target.id, model.entities.get(target.id).folder);
  } else {
    attachEntity(model, entityId, null, target.kind === 'folder' ? target.id : null);
  }
  return { ok: true };
}

/**
 * Hang an entity under a decomposition parent, or under none, and file it in a
 * folder. Rewiring the parent means rewriting the composition that carried the
 * old ownership, which is the only relationship a move ever touches.
 * @param {Model} model
 * @param {string} entityId
 * @param {string|null} parentId
 * @param {string|null} folderId
 */
function attachEntity(model, entityId, parentId, folderId) {
  const entity = model.entities.get(entityId);
  if (!entity) return;
  const current = decompositionParent(model, entityId);

  if ((current?.id ?? null) !== parentId) {
    if (current) {
      for (const [relationshipId, relationship] of model.relationships) {
        if (
          relationship.target === entityId &&
          relationship.source === current.id &&
          RELATIONSHIP_TYPES[relationship.type].kind === 'composition'
        ) {
          model.relationships.delete(relationshipId);
        }
      }
    }
    const composition = parentId ? selfComposition(entity.type) : null;
    if (composition) addRelationship(model, composition.id, parentId, entityId);
  }
  entity.folder = folderId;
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
 * The entities that sit alongside this one: same type, same folder, same
 * decomposition parent, in the order they are drawn.
 * @param {Model} model
 * @param {string} entityId
 * @returns {Entity[]}
 */
export function siblingsOf(model, entityId) {
  const entity = model.entities.get(entityId);
  if (!entity) return [];
  const parent = decompositionParent(model, entityId)?.id ?? null;
  return [...model.entities.values()].filter(
    (other) =>
      other.type === entity.type &&
      other.folder === entity.folder &&
      (decompositionParent(model, other.id)?.id ?? null) === parent
  );
}

/**
 * @param {Model} model
 * @param {string} folderId
 * @returns {Folder[]}
 */
export function folderSiblingsOf(model, folderId) {
  const folder = model.folders.get(folderId);
  if (!folder) return [];
  return [...model.folders.values()].filter((other) => other.type === folder.type && other.parent === folder.parent);
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
  const isEntity = what.kind === 'entity';
  const map = isEntity ? model.entities : model.folders;
  const siblings = isEntity ? siblingsOf(model, what.id) : folderSiblingsOf(model, what.id);
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
  if (source.kind !== target.kind) return { ok: false, reason: 'A folder and an entity do not sit alongside one another.' };
  if (source.id === target.id) return { ok: false, reason: 'It is already there.' };

  if (source.kind === 'folder') {
    const one = model.folders.get(source.id);
    const other = model.folders.get(target.id);
    if (!one || !other) return { ok: false, reason: 'The folder is not in the model.' };
    if (one.type !== other.type) return { ok: false, reason: 'The two folders file different entity types.' };
    // Sitting beside the other folder means taking its parent, so refuse when
    // that parent is inside the folder being moved.
    let walk = other.parent ? model.folders.get(other.parent) : null;
    while (walk) {
      if (walk.id === one.id) return { ok: false, reason: 'That would put the folder inside itself.' };
      walk = walk.parent ? model.folders.get(walk.parent) : null;
    }
    return { ok: true };
  }

  const one = model.entities.get(source.id);
  const other = model.entities.get(target.id);
  if (!one || !other) return { ok: false, reason: 'The entity is not in the model.' };
  if (one.type !== other.type) {
    return { ok: false, reason: `A ${ENTITY_TYPES[one.type].name} does not sit alongside a ${ENTITY_TYPES[other.type].name}.` };
  }
  const parent = decompositionParent(model, target.id);
  if (parent && (parent.id === one.id || isDescendant(model, parent.id, one.id))) {
    return { ok: false, reason: 'That would put the entity inside itself.' };
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

  if (source.kind === 'folder') {
    model.folders.get(source.id).parent = model.folders.get(target.id).parent;
    reorderMap(model.folders, source.id, target.id, position);
    return { ok: true };
  }

  const other = model.entities.get(target.id);
  attachEntity(model, source.id, decompositionParent(model, target.id)?.id ?? null, other.folder);
  reorderMap(model.entities, source.id, target.id, position);
  return { ok: true };
}

/**
 * @param {Model} model
 * @param {string} folderId
 * @param {MoveTarget} target
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canMoveFolder(model, folderId, target) {
  const folder = model.folders.get(folderId);
  if (!folder) return { ok: false, reason: 'The folder is not in the model.' };

  if (target.kind === 'type') {
    if (target.id !== folder.type) return { ok: false, reason: `That folder files ${ENTITY_TYPES[folder.type].plural}.` };
    return folder.parent === null ? { ok: false, reason: 'It is already there.' } : { ok: true };
  }

  if (target.kind === 'folder') {
    const parent = model.folders.get(target.id);
    if (!parent) return { ok: false, reason: 'The folder is not in the model.' };
    if (parent.type !== folder.type) return { ok: false, reason: 'The two folders file different entity types.' };
    if (parent.id === folder.id) return { ok: false, reason: 'A folder cannot be moved into itself.' };
    let walk = parent;
    while (walk) {
      if (walk.id === folder.id) return { ok: false, reason: 'That would put the folder inside itself.' };
      walk = walk.parent ? model.folders.get(walk.parent) : null;
    }
    return folder.parent === parent.id ? { ok: false, reason: 'It is already there.' } : { ok: true };
  }

  return { ok: false, reason: 'A folder cannot be filed there.' };
}

/**
 * @param {Model} model
 * @param {string} folderId
 * @param {MoveTarget} target
 * @returns {{ ok: boolean, reason?: string }}
 */
export function moveFolder(model, folderId, target) {
  const check = canMoveFolder(model, folderId, target);
  if (!check.ok) return check;
  model.folders.get(folderId).parent = target.kind === 'folder' ? target.id : null;
  return { ok: true };
}

// --- Relationships -----------------------------------------------------

/**
 * Whether a relationship can be created, and why not when it cannot. The
 * metamodel is the first gate: a triple it does not define is never allowed.
 * @param {Model} model
 * @param {string} relationshipTypeId
 * @param {string} sourceId
 * @param {string} targetId
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canRelate(model, relationshipTypeId, sourceId, targetId) {
  const type = RELATIONSHIP_TYPES[relationshipTypeId];
  if (!type) return { ok: false, reason: 'The metamodel defines no such relationship.' };

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

  for (const relationship of model.relationships.values()) {
    if (relationship.type === relationshipTypeId && relationship.source === sourceId && relationship.target === targetId) {
      return { ok: false, reason: 'The relationship already exists.' };
    }
  }

  if (type.kind === 'composition') {
    const owner = ownerOf(model, targetId);
    if (owner) return { ok: false, reason: `${targetId} is already owned by ${owner.id}.` };
    if (isDescendant(model, sourceId, targetId)) {
      return { ok: false, reason: 'A composition cannot form a cycle.' };
    }
  }

  return { ok: true };
}

/**
 * @param {Model} model
 * @param {string} relationshipTypeId
 * @param {string} sourceId
 * @param {string} targetId
 * @param {string} [id]  only supplied when loading an existing model
 * @returns {{ ok: boolean, reason?: string, relationship?: Relationship }}
 */
export function addRelationship(model, relationshipTypeId, sourceId, targetId, id) {
  const check = canRelate(model, relationshipTypeId, sourceId, targetId);
  if (!check.ok) return check;

  model.relationshipCounter += 1;
  const relationshipId = id ?? `R-${model.relationshipCounter}`;
  /** @type {Relationship} */
  const relationship = { id: relationshipId, type: relationshipTypeId, source: sourceId, target: targetId };
  model.relationships.set(relationshipId, relationship);
  return { ok: true, relationship };
}

/**
 * Removing a relationship leaves both entities in place (metamodel 3.2).
 * @param {Model} model
 * @param {string} relationshipId
 */
export function removeRelationship(model, relationshipId) {
  model.relationships.delete(relationshipId);
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
 * @param {string} code
 * @returns {Array<{ direction: 'outgoing'|'incoming', type: import('./metamodel.js').RelationshipType }>}
 */
export function availableRelationships(code) {
  return [
    ...relationshipsFrom(code).map((type) => ({ direction: /** @type {const} */ ('outgoing'), type })),
    ...relationshipsTo(code).map((type) => ({ direction: /** @type {const} */ ('incoming'), type })),
  ];
}

// --- Composition -------------------------------------------------------

/**
 * The entity that owns this one through any composition, if any.
 * @param {Model} model
 * @param {string} entityId
 * @returns {Entity | null}
 */
export function ownerOf(model, entityId) {
  for (const relationship of model.relationships.values()) {
    if (relationship.target !== entityId) continue;
    if (RELATIONSHIP_TYPES[relationship.type].kind !== 'composition') continue;
    return model.entities.get(relationship.source) ?? null;
  }
  return null;
}

/**
 * The entities this one owns through any composition.
 * @param {Model} model
 * @param {string} entityId
 * @returns {Entity[]}
 */
export function ownedBy(model, entityId) {
  const owned = [];
  for (const relationship of model.relationships.values()) {
    if (relationship.source !== entityId) continue;
    if (RELATIONSHIP_TYPES[relationship.type].kind !== 'composition') continue;
    const entity = model.entities.get(relationship.target);
    if (entity) owned.push(entity);
  }
  return owned;
}

/**
 * The owner through a composition of a type with itself, which is the only
 * ownership the navigator nests by. A hazard is owned by an element, but it is
 * not a kind of element, so it is filed with the hazards rather than drawn
 * inside the element.
 * @param {Model} model
 * @param {string} entityId
 * @returns {Entity | null}
 */
export function decompositionParent(model, entityId) {
  const entity = model.entities.get(entityId);
  const owner = entity ? ownerOf(model, entityId) : null;
  return owner && owner.type === entity.type ? owner : null;
}

/**
 * @param {Model} model
 * @param {string} entityId
 * @returns {Entity[]}
 */
export function decompositionChildren(model, entityId) {
  const entity = model.entities.get(entityId);
  if (!entity) return [];
  return ownedBy(model, entityId).filter((owned) => owned.type === entity.type);
}

/**
 * @param {Model} model
 * @param {string} entityId
 * @param {string} possibleAncestorId
 * @returns {boolean}
 */
function isDescendant(model, entityId, possibleAncestorId) {
  let current = ownerOf(model, entityId);
  const seen = new Set();
  while (current && !seen.has(current.id)) {
    if (current.id === possibleAncestorId) return true;
    seen.add(current.id);
    current = ownerOf(model, current.id);
  }
  return false;
}

// --- Deletion ----------------------------------------------------------

/**
 * The entities a deletion would remove: the entity itself and, since
 * composition carries ownership, everything it owns (metamodel 3.2).
 * @param {Model} model
 * @param {string} entityId
 * @returns {Entity[]}
 */
export function deletionSet(model, entityId) {
  const collected = [];
  const seen = new Set();
  const walk = (id) => {
    if (seen.has(id)) return;
    seen.add(id);
    const entity = model.entities.get(id);
    if (!entity) return;
    collected.push(entity);
    for (const owned of ownedBy(model, id)) walk(owned.id);
  };
  walk(entityId);
  return collected;
}

/**
 * @param {Model} model
 * @param {string} entityId
 * @returns {Entity[]}  the entities that were removed
 */
export function removeEntity(model, entityId) {
  const doomed = deletionSet(model, entityId);
  const ids = new Set(doomed.map((entity) => entity.id));

  for (const [relationshipId, relationship] of model.relationships) {
    if (ids.has(relationship.source) || ids.has(relationship.target)) {
      model.relationships.delete(relationshipId);
    }
  }
  for (const id of ids) model.entities.delete(id);
  return doomed;
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
      folder: entity.folder,
      attributes: { ...entity.attributes },
    })),
    relationships: [...model.relationships.values()].map((relationship) => ({ ...relationship })),
  };
}

/**
 * Rebuild a model from parsed JSON. Data is treated as untrusted: entities of
 * unknown types and relationships the metamodel does not define are dropped,
 * and the reasons are returned for reporting.
 * @param {any} data
 * @returns {{ model: Model, rejected: string[] }}
 */
export function fromJSON(data) {
  const model = createModel(typeof data?.name === 'string' ? data.name : 'Untitled model');
  const rejected = [];

  for (const raw of Array.isArray(data?.folders) ? data.folders : []) {
    if (typeof raw?.id !== 'string' || !ENTITY_TYPES[raw?.type]) {
      rejected.push(`Folder ${String(raw?.id)} has no valid entity type.`);
      continue;
    }
    addFolder(model, raw.type, String(raw.name ?? 'Folder'), typeof raw.parent === 'string' ? raw.parent : null, raw.id);
    const number = Number.parseInt(String(raw.id).split('-')[1] ?? '', 10);
    if (Number.isFinite(number)) model.folderCounter = Math.max(model.folderCounter, number);
  }
  for (const folder of model.folders.values()) {
    if (folder.parent && !model.folders.has(folder.parent)) folder.parent = null;
  }

  for (const raw of Array.isArray(data?.entities) ? data.entities : []) {
    if (typeof raw?.id !== 'string' || !ENTITY_TYPES[raw?.type]) {
      rejected.push(`Entity ${String(raw?.id)} has no valid type.`);
      continue;
    }
    if (model.entities.has(raw.id)) {
      rejected.push(`Entity ${raw.id} appears more than once.`);
      continue;
    }
    /** @type {Object<string, string>} */
    const attributes = {};
    for (const attribute of storedAttributesFor(raw.type)) {
      const value = raw.attributes?.[attribute.key];
      attributes[attribute.key] = typeof value === 'string' ? value : '';
    }
    const folder = typeof raw.folder === 'string' && model.folders.get(raw.folder)?.type === raw.type ? raw.folder : null;
    addEntity(model, raw.type, attributes, { id: raw.id, folder });

    const number = Number.parseInt(String(raw.id).split('-')[1] ?? '', 10);
    if (Number.isFinite(number)) {
      model.counters[raw.type] = Math.max(model.counters[raw.type] ?? 0, number);
    }
  }

  for (const raw of Array.isArray(data?.relationships) ? data.relationships : []) {
    const result = addRelationship(model, raw?.type, raw?.source, raw?.target);
    if (!result.ok) {
      rejected.push(`Relationship ${String(raw?.source)} ${String(raw?.type)} ${String(raw?.target)}: ${result.reason}`);
    }
  }

  return { model, rejected };
}
