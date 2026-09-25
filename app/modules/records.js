/**
 * The records: an attribute of the entities kind holds the identifiers of
 * the entities a relationship joined to its owner when the group that
 * writes it last changed. This module reads a record against the model as
 * it stands, says whether one has been written at all, and finds every
 * record in a model that no longer matches, which is what the checks list
 * shows. Pure functions over the model and the attribute definitions.
 */

import { nodeOf } from './model.js';
import { ENTITY_TYPES } from './metamodel.js';
import { typeOf, groupsOf, isOutcome, isRationale } from './attributes.js';
import { entityLabel, relatedIds } from './queries.js';

/** What an entry out of step with the record says beneath its label, by state, given the name of the group that wrote the record. */
export const staleText = (recorded) => ({ unlinked: `Unlinked after the ${recorded.toLowerCase()}.`, deleted: `Deleted after the ${recorded.toLowerCase()}.`, added: `Related after the ${recorded.toLowerCase()}.` });

/** A record of entities as it is stored: the identifiers in ascending order, parted by semicolons. */
export const recordOf = (ids) => [...new Set(ids)].sort().join('; ');

/**
 * The state of each entity a record names, against the model as it
 * stands: linked while the relationship holds, unlinked where the
 * entity stands but the relationship is gone, deleted where the entity
 * is gone; then, after them, each entity the relationship joins now
 * that the record does not name, added. Each with the label it has, or
 * its identifier where it is gone.
 * @param {string|undefined} record
 * @param {import('./model.js').Model} model
 * @param {string|null} subjectId
 * @param {string} relationship  a relationship type id
 * @returns {Array<{ id: string, label: string, state: 'linked'|'unlinked'|'deleted'|'added' }>}
 */
export function recordedStates(record, model, subjectId, relationship) {
  const ids = String(record ?? '').split(';').map((held) => held.trim()).filter(Boolean);
  const linked = new Set(subjectId === null ? [] : relatedIds(model, subjectId, relationship));
  const named = new Set(ids);
  const recorded = ids.map((id) => {
    const entity = nodeOf(model, id);
    const state = !entity ? 'deleted' : linked.has(id) ? 'linked' : 'unlinked';
    return { id, label: entity ? entityLabel(entity) : id, state };
  });
  const added = [...linked].filter((id) => !named.has(id)).map((id) => ({ id, label: entityLabel(nodeOf(model, id)), state: 'added' }));
  return [...recorded, ...added];
}

/**
 * Whether the group that writes a record holds a value: one of its
 * attributes, its rationales, outcomes and records aside, is set. Until
 * then nothing was recorded.
 * @param {string} code  the entity type
 * @param {{ recorded: string }} definition  the record's definition
 * @param {Object<string, string>} values  the entity's, or the draft's
 */
export function recordWritten(code, definition, values) {
  return groupsOf(code)
    .filter((group) => group.name === definition.recorded)
    .some((group) => group.attributes.some((held) => !isOutcome(held) && !isRationale(held) && held.kind !== 'entities' && (values[held.key] ?? '').trim() !== ''));
}

/** What a record's cell says beneath it once the record no longer matches. */
export const changedText = (definition) => `The ${definition.name.toLowerCase()} have changed since the ${definition.recorded.toLowerCase()}.`;

/**
 * The tab an attribute stands on, by the name of the tab group that
 * holds it, at any depth; null for one on the first tab.
 * @param {string} code
 * @param {string} key
 * @returns {string|null}
 */
export function tabNameOf(code, key) {
  const holds = (group) => group.attributes.some((held) => held.key === key) || (group.groups ?? []).some(holds);
  return (typeOf(code)?.groups ?? []).find((group) => group.tab && holds(group))?.name ?? null;
}

/**
 * @typedef {Object} Finding
 * @property {string} id  the entity
 * @property {string} type
 * @property {string} label
 * @property {import('./attributes.js').AttributeDefinition} definition  the record
 * @property {ReturnType<typeof recordedStates>} states
 * @property {string} text
 */

/**
 * Every record in the model that no longer matches what is related: a
 * written record naming an entity since unlinked or deleted, or missing
 * one since related. One finding per record, in the model's order.
 * @param {import('./model.js').Model} model
 * @returns {Finding[]}
 */
export function findings(model) {
  const records = Object.keys(ENTITY_TYPES).flatMap((code) =>
    groupsOf(code).flatMap((group) => group.attributes.filter((held) => held.kind === 'entities').map((definition) => ({ code, definition })))
  );
  const found = [];
  for (const node of model.nodes.values()) {
    if (node.kind !== 'entity') continue;
    for (const { code, definition } of records) {
      if (node.type !== code || !recordWritten(code, definition, node.attributes)) continue;
      const states = recordedStates(node.attributes[definition.key], model, node.id, definition.relationship);
      if (!states.some((held) => held.state !== 'linked')) continue;
      found.push({ id: node.id, type: node.type, label: entityLabel(node), definition, states, text: changedText(definition) });
    }
  }
  return found;
}

/**
 * The checks summary as the status bar says it: the entities to revisit,
 * counted by type, "2 accident scenarios and 1 single hazard to revisit";
 * empty with nothing to say.
 * @param {Finding[]} found
 */
export function checksText(found) {
  /** @type {Map<string, Set<string>>} */
  const byType = new Map();
  for (const { type, id } of found) byType.set(type, new Set([...(byType.get(type) ?? []), id]));
  const parts = [...byType].map(([type, ids]) => {
    const name = ENTITY_TYPES[type].name.toLowerCase();
    return `${ids.size} ${ids.size === 1 ? name : `${name}s`}`;
  });
  if (parts.length === 0) return '';
  const listed = parts.length < 2 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
  return `${listed} to revisit`;
}

/**
 * The model's size as the status bar says it: the entities and the
 * relationships it holds.
 * @param {import('./model.js').Model} model
 */
export function sizeText(model) {
  const entities = [...model.nodes.values()].filter((node) => node.kind === 'entity').length;
  const relationships = model.relationships.size;
  const count = (n, noun) => `${n} ${n === 1 ? noun : `${noun}s`}`;
  return `${count(entities, 'entity').replace('entitys', 'entities')} and ${count(relationships, 'relationship')}`;
}
