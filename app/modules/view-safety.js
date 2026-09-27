/**
 * The safety function specification as a view: one block per safety
 * function, holding only what the function says for itself and what
 * relates to it directly, as a numbered chapter whose parts number
 * within it in the order of its tabs in the editor: its description, its relationships, each kind a numbered
 * sub-part with a table of identifier and title, a table of field and
 * value for Behaviour, Characteristics and Fault handling, with the
 * required integrity level of the standard in force after the standard,
 * its diagram, and its notes. A function is followed by the functions it
 * decomposes into, depth first. One tab holds every function, and one
 * tab each holds a function alone, the tabs in the same order. A pure
 * function of the model, returning the description views.js renders and
 * saves.
 *
 * A part opens a block where it carries `heading`, the entity the block
 * is about, and `chapter`, its number. `number` and `caption` name a part and `subnumber` and
 * `subcaption` a table within it. A part holds a table, or `prose` in
 * its place, or `figure`, the drawing it shows or null for none.
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
  const all = [...model.nodes.values()].filter((node) => node.kind === 'entity' && node.type === 'SAF').sort((a, b) => a.id.localeCompare(b.id));
  const ends = (id, type, side) =>
    [...model.relationships.values()]
      .filter((relationship) => relationship.type === type && relationship[side === 'target' ? 'source' : 'target'] === id)
      .map((relationship) => relationship[side])
      .sort();
  const partOf = new Set(all.flatMap((saf) => ends(saf.id, 'saf-decomposes-into-saf', 'target')));
  /** A function followed by every function it decomposes into, depth first, in identifier order among siblings. */
  const tree = (saf, seen = new Set()) => {
    if (seen.has(saf.id)) return [];
    seen.add(saf.id);
    return [saf, ...ends(saf.id, 'saf-decomposes-into-saf', 'target').map((id) => model.nodes.get(id)).filter(Boolean).flatMap((child) => tree(child, seen))];
  };
  const roots = all.filter((saf) => !partOf.has(saf.id));
  const ordered = roots.flatMap((root) => tree(root));

  const block = (saf, chapter) => {
    const values = saf.attributes;
    let number = 1;
    const part = (caption, rest) => ({ number: `${chapter}.${number++}`, caption, ...rest });
    const description = part('Description', { heading: saf.id, chapter: String(chapter), prose: (values.description ?? '').trim() });
    const at = `${chapter}.${number++}`;
    const relationships = RELATIONSHIPS.map((held, i) => {
      const ids = ends(saf.id, held.type, held.side);
      return {
        ...(i === 0 ? { number: String(at), caption: 'Relationships' } : {}),
        subnumber: `${at}.${i + 1}`,
        subcaption: held.name,
        spec: true,
        sortable: false,
        columns: ['Identifier', 'Title'],
        rows: ids.length === 0 ? [{ id: null, cells: ['', ''] }] : ids.map((id) => ({ id: null, cells: [{ identifier: id }, entityLabel(model.nodes.get(id))] })),
      };
    });
    const fields = (names) =>
      ATTRIBUTES.SAF.groups
        .filter((group) => names.includes(group.name))
        .map((group) =>
          part(group.name, {
            spec: true,
            sortable: false,
            columns: ['Field', 'Value'],
            rows: specifiedFields(group, values).map((definition) => ({ id: null, cells: [definition.name, valueCell(definition, values[definition.key])] })),
          })
        );
    const specified = fields(SPECIFIED);
    const drawing = (values.drawing ?? '').trim();
    const diagram = part('Diagram', { figure: drawing !== '' && checkDrawing(drawing).ok ? { id: saf.id, drawing } : null });
    return [description, ...relationships, ...specified, diagram, ...fields(CLOSING)];
  };

  return {
    id: 'safety',
    title: 'Safety function specification',
    exports: ['markdown'],
    sections: [
      { name: `All functions (${all.length})`, tables: ordered.flatMap((saf, i) => block(saf, i + 1)) },
      ...ordered.map((saf) => ({ name: entityLabel(saf) || saf.id, tables: block(saf, 1) })),
    ],
  };
}

export const SAFETY_VIEW = { id: 'safety', name: 'Safety function specification', build: buildSafetyView };
