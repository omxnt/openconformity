/**
 * The pure reading and writing of field values: whether a draft differs
 * from what is stored, how a set, a table and a hyperlink are read and
 * stored, how a rating reads and the code a value shows, what a save
 * removes as the question tells it, and the first tab's name. Nothing
 * here touches the page.
 */

import { isOutcome, isRationale, isParameter } from './attributes.js';
import { estimate, levelTone } from './risk.js';
import { ENTITY_TYPES } from './metamodel.js';
import { listed } from './text.js';

/**
 * Whether a draft differs from the entity it edits: a defined key whose
 * field no longer matches the stored value. An unset key stands for the
 * empty value, and keys the editor does not present never make a draft
 * dirty.
 * @param {Array<{ key: string }>} definitions
 * @param {Object<string, string>} attributes
 * @param {Object<string, string>} values
 * @returns {boolean}
 */
export function draftChanged(definitions, attributes, values) {
  return definitions.some(
    (definition) => (attributes[definition.key] ?? '') !== (values[definition.key] ?? '')
  );
}

/**
 * A rating as the card shows it: the name of the attribute it computes,
 * what it comes to and its tone, null and none while a parameter is
 * missing, and the parameters by name, in order, an unset one an empty
 * value, each with the rationale given for it.
 * @param {Array<Object>} definitions  the rating's, the computed one and the rationales among them
 * @param {Object<string, string>} values
 * @returns {{ name: string, outcome: string|null, tone: string, parameters: Array<{ name: string, value: string, code: string, rationale: string }> }}
 */
export function ratingView(definitions, values) {
  const parameters = definitions.filter(isParameter);
  const closing = definitions.find(isOutcome);
  const rationaleOf = (definition) => definitions.find((held) => isRationale(held) && held.parameter === definition.key);
  const outcome = closing ? estimate(closing.method, parameters.map((definition) => values[definition.key] ?? '')) : null;
  return {
    name: closing?.name ?? '',
    outcome,
    tone: levelTone(outcome),
    parameters: parameters.map((definition) => {
      const value = (values[definition.key] ?? '').trim();
      return { name: definition.name, value, code: codeShown(value, definition), rationale: (values[rationaleOf(definition)?.key] ?? '').trim() };
    }),
  };
}

/** The initials of a name — `SS` of `Severity score` — as the report abbreviates its scores. */
export const initials = (name) => String(name ?? '').split(/\s+/).filter(Boolean).map((word) => word[0].toUpperCase()).join('');

/**
 * The code a rating shows for a value: its first word, and its second
 * where the first holds no digit, `S1`, `Se 4`, `Very likely`, or `4`
 * of `4 words after`, and for a number the initials of its name before
 * it, `SS 95`.
 * @param {string} value
 * @param {{ kind: string, name: string }} [definition]  the parameter the value is of
 */
export function codeShown(value, definition = null) {
  const words = String(value ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (definition?.kind === 'number') return `${initials(definition.name)} ${words[0]}`;
  return /\d/.test(words[0]) ? words[0] : words.slice(0, 2).join(' ');
}

/**
 * What a save removes, as the question before it tells it: the groups by
 * the value they stood under, in order, as "A and B under X; C under Y."
 * @param {Array<{ name: string, value: string }>} entries
 * @returns {string}
 */
export function removalText(entries) {
  /** @type {Map<string, Array<string>>} */
  const byValue = new Map();
  for (const { name, value } of entries) byValue.set(value, [...(byValue.get(value) ?? []), name]);
  return `${[...byValue].map(([value, names]) => `${listed(names)} under ${value}`).join(', and ')}.`;
}

/**
 * The first tab's name: the type's own noun, the last word of its name,
 * Legislation, Requirement, Function.
 * @param {string} code
 */
export function firstTabName(code) {
  if (code === 'PROJECT') return 'Project';
  return (ENTITY_TYPES[code]?.name ?? 'Description').split(' ').at(-1);
}


/**
 * The values a set holds, as the definition lists them: what is stored
 * is read, trimmed, and kept only where the definition offers it, in
 * the definition's order.
 * @param {{ values?: string[] }} definition
 * @param {string|undefined} value
 * @returns {string[]}
 */
export function setValues(definition, value) {
  const held = new Set(String(value ?? '').split(';').map((item) => item.trim()));
  return (definition.values ?? []).filter((item) => held.has(item));
}

/**
 * A set as it is stored: the values chosen, separated by semicolons, in
 * the order the definition lists them; nothing chosen stores nothing.
 * @param {{ values?: string[] }} definition
 * @param {Iterable<string>} chosen
 * @returns {string}
 */
export function joinSet(definition, chosen) {
  const held = new Set(chosen);
  return (definition.values ?? []).filter((item) => held.has(item)).join('; ');
}

/** A cell as a table stores it: quoted as a CSV cell is where it holds a tab, a break or a quotation mark, the marks within doubled. */
const quoteCell = (cell) => (/[\t\n"]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell);

/**
 * A table as it is stored, read back as rows: one row per line, the
 * cells parted by tabs in column order, a quoted cell holding what it
 * holds, breaks and tabs among it; cells trimmed, missing cells empty,
 * a blank line no row.
 * @param {{ columns: Array<{ key: string }> }} definition
 * @param {string|undefined} value
 * @returns {string[][]}
 */
export function tableRows(definition, value) {
  const text = String(value ?? '').replace(/\r\n?/g, '\n');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const endCell = () => {
    row.push(cell);
    cell = '';
  };
  const endRow = () => {
    endCell();
    if (row.some((held) => held.trim() !== '')) rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i += 1) {
    const held = text[i];
    if (quoted) {
      if (held !== '"') cell += held;
      else if (text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else quoted = false;
    } else if (held === '"' && cell === '') quoted = true;
    else if (held === '\t') endCell();
    else if (held === '\n') endRow();
    else cell += held;
  }
  endRow();
  return rows.map((held) => definition.columns.map((column, i) => (held[i] ?? '').trim()));
}

/**
 * Rows as a table is stored: one line per row, the cells parted by
 * tabs, a cell holding a tab, a break or a quotation mark quoted; a
 * row with every cell empty is dropped.
 * @param {{ columns: Array<{ key: string }> }} definition
 * @param {string[][]} rows
 * @returns {string}
 */
export function joinTable(definition, rows) {
  return rows
    .map((row) => definition.columns.map((column, i) => String(row[i] ?? '').replace(/\r\n?/g, '\n').trim()))
    .filter((row) => row.some((cell) => cell !== ''))
    .map((row) => row.map(quoteCell).join('\t'))
    .join('\n');
}

/**
 * Whether a hyperlink value may be presented as a link. Only the web
 * schemes are followed, anything else, a `javascript:` value above all,
 * renders as the text it is.
 * @param {string} value
 * @returns {boolean}
 */
export function linkable(value) {
  return /^https?:\/\/\S/i.test((value ?? '').trim());
}
