/**
 * The project's choices as the entities read them: a group of a type may
 * wait on an attribute of the project (§1.4), and stands or falls with
 * the project's choice, so changing a choice on the project removes what
 * every entity held under the old one. This module says what a save of
 * the project would remove, for the question asked before it and the
 * commit after, and what a file holds that no choice in force presents
 * or no definition knows, for the question and the notice on opening.
 */

import { ATTRIBUTES, attributesFor, groupsOf, isOutcome, leaderOf, groupShown } from './attributes.js';
import { ENTITY_TYPES } from './metamodel.js';
import { plural } from './text.js';

/**
 * What saving the project with these values removes: for every
 * attribute of the project whose value changes, the keys of the groups
 * of every type waiting on it that stood under any other value, on
 * every entity still holding any of them. The count is the entities
 * losing something; the text says so, for the question, one clause per
 * type and choice changed.
 * @param {import('./model.js').Model} model
 * @param {Object<string, string>} values  the project's draft
 * @returns {{ entities: Array<{ id: string, keys: string[] }>, count: number, text: string }}
 */
export function projectSweep(model, values) {
  /** @type {Map<string, Set<string>>} the keys swept per entity */
  const swept = new Map();
  const parts = [];
  for (const leader of attributesFor('PROJECT')) {
    const before = model.attributes[leader.key] ?? '';
    const after = (values[leader.key] ?? '').trim();
    if (before === after) continue;
    for (const code of Object.keys(ATTRIBUTES)) {
      if (attributesFor(code).some((definition) => definition.key === leader.key)) continue;
      const waiting = groupsOf(code).filter((group) => group.when?.key === leader.key && group.when.value !== after);
      const keys = [...new Set(waiting.flatMap((group) => group.attributes.filter((definition) => !isOutcome(definition)).map((definition) => definition.key)))];
      let held = 0;
      for (const node of model.nodes.values()) {
        if (node.kind !== 'entity' || node.type !== code) continue;
        const holding = keys.filter((key) => (node.attributes[key] ?? '') !== '');
        if (holding.length === 0) continue;
        const bag = swept.get(node.id) ?? new Set();
        for (const key of holding) bag.add(key);
        swept.set(node.id, bag);
        held += 1;
      }
      if (held > 0) parts.push(`what ${plural(held, ENTITY_TYPES[code].name.toLowerCase())} ${held === 1 ? 'holds' : 'hold'} under ${before || `no ${leader.name.toLowerCase()}`}`);
    }
  }
  const entities = [...swept].map(([id, keys]) => ({ id, keys: [...keys] }));
  return { entities, count: swept.size, text: parts.join(' and ') };
}

/**
 * What a file holds under choices not in force: for every entity, the
 * keys of the groups of its type waiting on a choice, its own or the
 * project's, that stands on another value, where the entity still holds
 * any of them. The count is the entities holding something; the lines
 * say so, one per type and the value the content stood under.
 * @param {import('./model.js').Model} model
 * @returns {{ entities: Array<{ id: string, keys: string[] }>, count: number, lines: string[] }}
 */
export function hiddenContent(model) {
  const entities = [];
  /** @type {Map<string, number>} entities holding something, per type and value */
  const held = new Map();
  for (const node of model.nodes.values()) {
    if (node.kind !== 'entity') continue;
    const values = { ...model.attributes, ...node.attributes };
    const keys = new Set();
    const under = new Set();
    for (const group of groupsOf(node.type)) {
      if (groupShown(group, values)) continue;
      for (const definition of group.attributes) {
        if (isOutcome(definition) || (node.attributes[definition.key] ?? '') === '') continue;
        keys.add(definition.key);
        under.add(group.when.value || `no ${leaderName(node.type, group.when.key)}`);
      }
    }
    if (keys.size === 0) continue;
    entities.push({ id: node.id, keys: [...keys] });
    for (const value of under) {
      const line = `${node.type}\u0000${value}`;
      held.set(line, (held.get(line) ?? 0) + 1);
    }
  }
  const lines = [...held].map(([line, count]) => {
    const [code, value] = line.split('\u0000');
    return `${plural(count, ENTITY_TYPES[code].name.toLowerCase())} under ${value}`;
  });
  return { entities, count: entities.length, lines };
}

/**
 * What a file holds that no definition of this revision presents: for
 * the project and for every entity, the attribute keys none of its
 * type's definitions name, where they hold a value. The project comes
 * first, as null.
 * @param {import('./model.js').Model} model
 * @returns {Array<{ id: string|null, keys: string[] }>}
 */
export function unknownContent(model) {
  const found = [];
  const strange = (code, attributes) => {
    const known = new Set(attributesFor(code).map((definition) => definition.key));
    return Object.keys(attributes).filter((key) => !known.has(key) && (attributes[key] ?? '') !== '');
  };
  const project = strange('PROJECT', model.attributes);
  if (project.length > 0) found.push({ id: null, keys: project });
  for (const node of model.nodes.values()) {
    if (node.kind !== 'entity') continue;
    const keys = strange(node.type, node.attributes);
    if (keys.length > 0) found.push({ id: node.id, keys });
  }
  return found;
}

/** The name of the attribute a group waits on, lowercased for a sentence. */
const leaderName = (code, key) => (leaderOf(code, key)?.name ?? key).toLowerCase();
