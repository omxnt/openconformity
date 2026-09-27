/**
 * The safety function specification as a view: one block per safety
 * function, holding only what the function says for itself and what
 * relates to it directly, in the order of its tabs in the editor. Its
 * heading and description, then its relationships, each kind under a
 * heading of its own as a table of identifier and title, then a table of
 * field and value for Behaviour, Characteristics and Fault handling,
 * with the required integrity level of the standard in force after the
 * standard, then its diagram, then its notes. One tab holds every
 * function, and one tab each holds a function alone. A pure function of
 * the model, returning the description views.js renders and saves.
 *
 * A table may open a block: `heading` names the entity the block is
 * about and `text` stands beneath it. `caption` names a part of the
 * block and `subcaption` a table within it. A part may be a figure in
 * place of a table, the drawing it shows or null for none.
 */

import { ATTRIBUTES, groupShown } from './attributes.js';
import { entityLabel } from './queries.js';
import { setValues } from './fields.js';
import { checkDrawing } from './drawing.js';

/** The tabs of a safety function specified as fields, in the editor's order, the diagram standing before the last. */
const SPECIFIED = ['Behaviour', 'Characteristics', 'Fault handling'];
const CLOSING = ['Notes'];

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

  const fields = (names, values) =>
    ATTRIBUTES.SAF.groups
      .filter((group) => names.includes(group.name))
      .map((group) => ({
        caption: group.name,
        spec: true,
        sortable: false,
        columns: ['Field', 'Value'],
        rows: specifiedFields(group, values).map((definition) => ({ id: null, cells: [definition.name, valueCell(definition, values[definition.key])] })),
      }));

  const block = (saf) => {
    const values = saf.attributes;
    const relationships = RELATIONSHIPS.map((held, i) => {
      const ids = ends(saf.id, held.type, held.side);
      return {
        ...(i === 0 ? { heading: saf.id, text: (values.description ?? '').trim(), caption: 'Relationships' } : {}),
        subcaption: held.name,
        spec: true,
        list: true,
        sortable: false,
        columns: ['Identifier', 'Title'],
        rows: ids.length === 0 ? [{ id: null, cells: ['', ''] }] : ids.map((id) => ({ id: null, cells: [{ identifier: id }, entityLabel(model.nodes.get(id))] })),
      };
    });
    const drawing = (values.drawing ?? '').trim();
    const diagram = { caption: 'Diagram', figure: drawing !== '' && checkDrawing(drawing).ok ? { id: saf.id, drawing } : null };
    return [...relationships, ...fields(SPECIFIED, values), diagram, ...fields(CLOSING, values)];
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
