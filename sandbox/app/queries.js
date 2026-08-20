/**
 * The model-query layer: pure derivations over the model and the
 * metamodel, shared by the flows, the action list, and the panes.
 * Nothing here holds state, touches the page, or writes to the model —
 * each function reads what it is given and returns data.
 */

import { nodeOf, childrenOf, canRelate, canFile, deletionOf } from './model.js';
import { ENTITY_TYPES, RELATIONSHIP_TYPES, relationshipsFrom, relationshipsTo } from './metamodel.js';

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
 * How an entity reads in a list: its identifier, then its label when it
 * carries one.
 * @param {import('./model.js').Entity} entity
 * @returns {string}
 */
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
 * The question a cascade deletion asks, as data: the title counts the
 * entities taken, the message counts the relationships severed — every
 * relationship touching anything in the cascade.
 * @param {import('./model.js').Model} model
 * @param {string} id
 * @returns {{ title: string, message: string, doomed: import('./model.js').Entity[] }}
 */
export function cascadeQuestion(model, id) {
  const doomed = deletionOf(model, id);
  const doomedIds = new Set(doomed.map((entity) => entity.id));
  const severed = [...model.relationships.values()].filter(
    (relationship) => doomedIds.has(relationship.source) || doomedIds.has(relationship.target)
  ).length;
  return {
    title: `Delete ${doomed.length} entities?`,
    message: `Deleting ${id} also deletes everything it contains through composition and severs ${severed} relationship${severed === 1 ? '' : 's'}:`,
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
