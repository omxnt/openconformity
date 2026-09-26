/**
 * The model-query layer: pure derivations over the model and the
 * metamodel, shared by the flows, the action list, and the panes.
 * Nothing here holds state, touches the page, or writes to the model —
 * each function reads what it is given and returns data.
 */

import { nodeOf, childrenOf, canRelate, canFile, deletionOf, filedBeneath } from './model.js';
import { ENTITY_TYPES, RELATIONSHIP_TYPES, relationshipsFrom, relationshipsTo } from './metamodel.js';

/**
 * The decisions that set an entity out of play: the value of an attribute
 * that excludes the entity it stands on. Applicable No excludes an act, a
 * standard, a specification or a requirement of theirs; Eliminated Yes a
 * hazard designed out.
 */
export const EXCLUSIONS = { applicable: 'No', eliminated: 'Yes' };

/**
 * Whether an entity is excluded: considered and set out of play by one of
 * the decisions above. It stays in the model, related and selectable, and
 * is shown as standing aside.
 * @param {import('./model.js').Node|null|undefined} node
 */
export function excluded(node) {
  if (!node || node.kind !== 'entity') return false;
  return Object.entries(EXCLUSIONS).some(([key, value]) => node.attributes?.[key] === value);
}

/**
 * The relationship forms an entity can take part in right now: each form
 * the metamodel offers for its type, in either direction, with the
 * entities the model still allows at the far end. A form with no
 * candidate is not offered.
 * @param {import('./model.js').Model} model
 * @param {string} subjectId
 * @returns {Array<{ type: import('./metamodel.js').RelationshipType, direction: 'outgoing'|'incoming', candidates: import('./model.js').Entity[] }>}
 */
export function relationshipOptions(model, subjectId) {
  const subject = nodeOf(model, subjectId);
  if (!subject || subject.kind !== 'entity') return [];

  const entities = [...model.nodes.values()].filter((node) => node.kind === 'entity');
  const options = [];
  for (const type of relationshipsFrom(subject.type)) {
    const candidates = entities.filter((node) => canRelate(model, type.id, subjectId, node.id).ok);
    if (candidates.length > 0) options.push({ type, direction: 'outgoing', candidates });
  }
  for (const type of relationshipsTo(subject.type)) {
    const candidates = entities.filter((node) => canRelate(model, type.id, node.id, subjectId).ok);
    if (candidates.length > 0) options.push({ type, direction: 'incoming', candidates });
  }
  return options;
}

/**
 * What a form is called wherever one is offered: the relationship's
 * label and the type at the far end, in reading order — label first when
 * the subject is the source, far type first when it is the target.
 * @param {{ typeId: string, direction: 'outgoing'|'incoming' }} form
 * @returns {string}
 */
export function formLabel(form) {
  const type = RELATIONSHIP_TYPES[form.typeId];
  const other = ENTITY_TYPES[form.direction === 'outgoing' ? type.target : type.source].name;
  return form.direction === 'outgoing' ? `${type.label} — ${other}` : `${other} — ${type.label}`;
}

/**
 * The types a new related entity could take, with every relationship the
 * metamodel admits between the subject and a new entity of that type. A
 * composition whose new entity would be a second owner of the subject is
 * left out; nothing else narrows, because a new entity has no
 * relationships to collide with. In metamodel order, so a menu groups by
 * pillar.
 * @param {import('./model.js').Model} model
 * @param {string} subjectId
 * @returns {Array<{ code: string, forms: Array<{ typeId: string, direction: 'outgoing'|'incoming' }> }>}
 */
export function relatedTypeOffer(model, subjectId) {
  const subject = nodeOf(model, subjectId);
  if (!subject || subject.kind !== 'entity') return [];
  const owned = [...model.relationships.values()].some(
    (relationship) => relationship.target === subjectId && RELATIONSHIP_TYPES[relationship.type].composition
  );

  const byCode = new Map();
  const add = (code, form) => {
    if (!byCode.has(code)) byCode.set(code, []);
    byCode.get(code).push(form);
  };
  for (const type of relationshipsFrom(subject.type)) {
    add(type.target, { typeId: type.id, direction: 'outgoing' });
  }
  for (const type of relationshipsTo(subject.type)) {
    if (type.composition && owned) continue;
    add(type.source, { typeId: type.id, direction: 'incoming' });
  }
  return Object.keys(ENTITY_TYPES)
    .filter((code) => byCode.has(code))
    .map((code) => ({ code, forms: byCode.get(code) }));
}

/**
 * What an entity is called, wherever a label is shown. A type carrying a
 * reference composes reference then title, separated by a single space —
 * `(EU) 2023/1230 Machinery Regulation` — the citation's own format
 * standing as the delimiter, so nothing is bracketed or punctuated
 * around it; either part alone stands when the other is unset. The
 * composition happens at display and is never stored.
 * @param {import('./model.js').Entity} entity
 * @returns {string}  the label, empty when the entity carries neither part
 */
export function entityLabel(entity) {
  const reference = (entity.attributes.reference ?? '').trim();
  const title = (entity.attributes.title ?? '').trim();
  return [reference, title].filter(Boolean).join(' ');
}

/**
 * Whether an entity answers a filter: its identifier or its label holds
 * the text, case aside; an empty filter matches everything.
 * @param {import('./model.js').Entity} entity
 * @param {string} filter  as typed
 * @returns {boolean}
 */
export function entityMatches(entity, filter) {
  const query = (filter ?? '').trim().toLowerCase();
  if (query === '') return true;
  return entity.id.toLowerCase().includes(query) || entityLabel(entity).toLowerCase().includes(query);
}

/**
 * How an entity reads in a list: its identifier, then its label when it
 * carries one.
 * @param {import('./model.js').Entity} entity
 * @returns {string}
 */
/**
 * The entities one relationship type joins to an entity, whichever end
 * it stands on, by id in order.
 * @param {import('./model.js').Model} model
 * @param {string} id
 * @param {string} type  a relationship type id
 * @returns {string[]}
 */
export function relatedIds(model, id, type) {
  const held = [];
  for (const relationship of model.relationships.values()) {
    if (relationship.type !== type) continue;
    if (relationship.source === id) held.push(relationship.target);
    else if (relationship.target === id) held.push(relationship.source);
  }
  return [...new Set(held)].sort();
}

export function designated(entity) {
  const label = entityLabel(entity);
  return label ? `${entity.id}  ${label}` : entity.id;
}

/**
 * Every place a node could be filed, for the Move to… dialog: the top of
 * the tree and every folder and entity the model allows, in the order the
 * tree draws them — the same ground dragging covers, reachable without a
 * pointer.
 * @param {import('./model.js').Model} model
 * @param {string|null} id
 * @returns {Array<{ parentId: string|null, label: string, depth: number }>}
 */
export function moveTargets(model, id) {
  if (nodeOf(model, id) === null) return [];
  const targets = [];
  const offer = (parentId, label, depth) => {
    if (canFile(model, id, parentId).ok) targets.push({ parentId, label, depth });
  };
  offer(null, model.name.trim() || 'Untitled', 0);
  const walk = (parentId, depth) => {
    for (const child of childrenOf(model, parentId)) {
      offer(child.id, child.kind === 'folder' ? child.name : designated(child), depth);
      walk(child.id, depth + 1);
    }
  };
  walk(null, 1);
  return targets;
}

/**
 * What the confirmation says before a deletion: for an entity, what goes
 * with it and what is severed; for a folder, what is filed in it, what
 * those entities own elsewhere, and what is severed.
 * @param {import('./model.js').Model} model
 * @param {string} id
 * @returns {{ title: string, message: string, doomed: import('./model.js').Entity[] }}
 */
export function deletionQuestion(model, id) {
  const node = nodeOf(model, id);
  const doomed = deletionOf(model, id);
  const doomedIds = new Set(doomed.map((entity) => entity.id));
  const severed = [...model.relationships.values()].filter(
    (relationship) => doomedIds.has(relationship.source) || doomedIds.has(relationship.target)
  ).length;
  const relationships = `${severed} relationship${severed === 1 ? '' : 's'}`;
  const entities = (n) => `${n} ${n === 1 ? 'entity' : 'entities'}`;
  if (node && node.kind === 'folder') {
    const title = `Delete the folder ${node.name}?`;
    if (doomed.length === 0) return { title, message: `${node.name} holds no entity.`, doomed };
    const beneath = new Set(filedBeneath(model, id).map((held) => held.id));
    const held = doomed.filter((entity) => beneath.has(entity.id)).length;
    const owned = doomed.length - held;
    const message = `Deleting ${node.name} also deletes the ${entities(held)} filed in it${owned > 0 ? ` and ${entities(owned)} they own elsewhere` : ''}${severed > 0 ? `${owned > 0 ? ',' : ''} and severs ${relationships}` : ''}:`;
    return { title, message, doomed };
  }
  if (doomed.length === 1) {
    return {
      title: `Delete ${id}?`,
      message: severed === 0 ? `${id} takes part in no relationship.` : `Deleting ${id} severs ${relationships}.`,
      doomed,
    };
  }
  return {
    title: `Delete ${doomed.length} entities?`,
    message: `Deleting ${id} also deletes everything it contains through composition and severs ${relationships}:`,
    doomed,
  };
}

/**
 * Whether a node has a sibling above it to change places with.
 * @param {import('./model.js').Model} model
 * @param {string|null} id
 * @returns {boolean}
 */
export function canMoveUp(model, id) {
  const node = nodeOf(model, id);
  if (!node) return false;
  return childrenOf(model, node.parent).findIndex((sibling) => sibling.id === id) > 0;
}

/**
 * Whether a node has a sibling below it to change places with.
 * @param {import('./model.js').Model} model
 * @param {string|null} id
 * @returns {boolean}
 */
export function canMoveDown(model, id) {
  const node = nodeOf(model, id);
  if (!node) return false;
  const siblings = childrenOf(model, node.parent);
  const index = siblings.findIndex((sibling) => sibling.id === id);
  return index >= 0 && index < siblings.length - 1;
}
