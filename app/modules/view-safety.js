/**
 * The safety function specification as a view: one block per safety
 * function, holding only what the function says for itself and what
 * relates to it directly. Its heading and description, then its
 * relationships, then a table of field and value for each of its tabs
 * that carries the specification, Behaviour, Characteristics and Fault
 * handling, with the required integrity level of the standard in force
 * after the standard. The diagram and the notes stay in the editor. One
 * tab holds every function, and one tab each holds a function alone. A
 * pure function of the model, returning the description views.js renders
 * and saves.
 *
 * A table may open a block: `heading` names the entity the block is
 * about and `text` stands beneath it, and `caption` names the table.
 */

import { ATTRIBUTES, groupShown } from './attributes.js';
import { entityLabel } from './queries.js';
import { setValues } from './fields.js';

/** The tabs of a safety function that make up its specification, in the editor's order. */
const SPECIFIED = ['Behaviour', 'Characteristics', 'Fault handling'];

/** The relationships a safety function takes part in, as the specification names them from its side. */
const RELATIONSHIPS = [
  { name: 'Part of', type: 'saf-decomposes-into-saf', side: 'source' },
  { name: 'Decomposes into', type: 'saf-decomposes-into-saf', side: 'target' },
  { name: 'Realises', type: 'saf-realises-prm', side: 'target' },
  { name: 'Allocated to', type: 'saf-allocated-to-elm', side: 'target' },
  { name: 'Expressed by', type: 'req-expresses-saf', side: 'source' },
];

/**
 * A field's value as a cell: text as its lines, a choice as its tag, a
 * set as its tags, nothing as nothing.
 * @param {import('./attributes.js').AttributeDefinition} definition
 * @param {string|undefined} value
 */
function valueCell(definition, value) {
  const text = String(value ?? '').trim();
  if (definition.kind === 'choice') return { choice: text };
  if (definition.kind === 'set') return { choices: setValues(definition, text) };
  return { lines: text === '' ? [''] : text.split('\n') };
}

/**
 * A tab's fields in the order the specification reads them: its own, with
 * the variant of a sub-group in force set right after the field it waits
 * on.
 * @param {import('./attributes.js').AttributeGroup} group
 * @param {Object<string, string>} values
 */
export function specifiedFields(group, values) {
  const fields = [...group.attributes];
  for (const sub of group.groups ?? []) {
    if (!groupShown(sub, values)) continue;
    const after = sub.when ? fields.findIndex((definition) => definition.key === sub.when.key) : -1;
    fields.splice(after === -1 ? fields.length : after + 1, 0, ...sub.attributes);
  }
  return fields;
}

/**
 * @param {import('./model.js').Model} model
 */
export function buildSafetyView(model) {
  const functions = [...model.nodes.values()].filter((node) => node.kind === 'entity' && node.type === 'SAF').sort((a, b) => a.id.localeCompare(b.id));
  const ends = (id, type, side) =>
    [...model.relationships.values()]
      .filter((relationship) => relationship.type === type && relationship[side === 'target' ? 'source' : 'target'] === id)
      .map((relationship) => relationship[side])
      .sort();

  const block = (saf) => {
    const values = saf.attributes;
    const relationships = {
      heading: saf.id,
      text: (values.description ?? '').trim(),
      caption: 'Relationships',
      spec: true,
      sortable: false,
      columns: ['Relationship', 'Entities'],
      rows: RELATIONSHIPS.map((held) => ({ id: null, cells: [held.name, { entities: ends(saf.id, held.type, held.side) }] })),
    };
    const tabs = ATTRIBUTES.SAF.groups
      .filter((group) => SPECIFIED.includes(group.name))
      .map((group) => ({
        caption: group.name,
        spec: true,
        sortable: false,
        columns: ['Field', 'Value'],
        rows: specifiedFields(group, values).map((definition) => ({ id: null, cells: [definition.name, valueCell(definition, values[definition.key])] })),
      }));
    return [relationships, ...tabs];
  };

  return {
    id: 'safety',
    title: 'Safety function specification',
    exports: ['markdown'],
    sections: [
      { name: `All functions (${functions.length})`, tables: functions.flatMap(block) },
      ...functions.map((saf) => ({ name: entityLabel(saf) || saf.id, tables: block(saf) })),
    ],
  };
}

export const SAFETY_VIEW = { id: 'safety', name: 'Safety function specification', build: buildSafetyView };
