/**
 * The project's choices as the entities read them: a group of a type may
 * wait on an attribute of the project (§1.4), and stands or falls with
 * the project's choice, so changing a choice on the project removes what
 * every entity held under the old one. This module says what a save of
 * the project would remove, for the question asked before it and the
 * commit after.
 */

import { ATTRIBUTES, attributesFor, groupsOf, isOutcome } from './attributes.js';
import { ENTITY_TYPES } from './metamodel.js';

const plural = (name, count) => (count === 1 ? name : `${name}s`);

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
      if (held > 0) parts.push(`what ${held} ${plural(ENTITY_TYPES[code].name.toLowerCase(), held)} ${held === 1 ? 'holds' : 'hold'} under ${before || `no ${leader.name.toLowerCase()}`}`);
    }
  }
  const entities = [...swept].map(([id, keys]) => ({ id, keys: [...keys] }));
  return { entities, count: swept.size, text: parts.join(' and ') };
}
