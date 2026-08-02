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

import { ENTITY_TYPES, RELATIONSHIP_TYPES, attributesFor, relationshipsFrom, relationshipsTo } from './metamodel.js';

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
    name: name || 'Untitled model',
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
  for (const attribute of attributesFor(code)) {
    entity.attributes[attribute.key] = attributes[attribute.key] ?? '';
  }
  if (!entity.attributes.name) entity.attributes.name = `New ${type.name}`;

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
  for (const attribute of attributesFor(entity.type)) {
    if (attribute.key in values) entity.attributes[attribute.key] = values[attribute.key];
  }
}

/**
 * The name an entity is shown by, falling back to its identifier.
 * @param {Entity} entity
 * @returns {string}
 */
export function labelOf(entity) {
  const name = (entity.attributes.name ?? '').trim();
  return name || entity.id;
}

/**
 * The name with the user's own designation in front of it, which is how an
 * entity reads everywhere it is listed.
 * @param {Entity} entity
 * @returns {string}
 */
export function displayLabel(entity) {
  const designation = (entity.attributes.designation ?? '').trim();
  return designation ? `[${designation}] ${labelOf(entity)}` : labelOf(entity);
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

/**
 * @param {Model} model
 * @param {string} entityId
 * @param {string|null} folderId
 */
export function setEntityFolder(model, entityId, folderId) {
  const entity = model.entities.get(entityId);
  if (!entity) return;
  const folder = folderId ? model.folders.get(folderId) : null;
  entity.folder = folder && folder.type === entity.type ? folder.id : null;
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
 * Point an existing relationship at a different entity, keeping its type and
 * its direction. The new end is checked exactly as a new relationship is, and
 * the relationship is left untouched if the check fails.
 * @param {Model} model
 * @param {string} relationshipId
 * @param {'outgoing'|'incoming'} direction  which end the selected entity is on
 * @param {string} otherId
 * @returns {{ ok: boolean, reason?: string }}
 */
export function retargetRelationship(model, relationshipId, direction, otherId) {
  const relationship = model.relationships.get(relationshipId);
  if (!relationship) return { ok: false, reason: 'The relationship is no longer in the model.' };

  const source = direction === 'outgoing' ? relationship.source : otherId;
  const target = direction === 'outgoing' ? otherId : relationship.target;
  if (source === relationship.source && target === relationship.target) return { ok: true };

  model.relationships.delete(relationshipId);
  const check = canRelate(model, relationship.type, source, target);
  model.relationships.set(relationshipId, relationship);
  if (!check.ok) return check;

  relationship.source = source;
  relationship.target = target;
  return { ok: true };
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
    for (const attribute of attributesFor(raw.type)) {
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
