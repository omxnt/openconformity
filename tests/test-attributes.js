/**
 * Verifies the attribute transcription against `notes/attributes.md`: every
 * type section, its ungrouped table, its groups, and its kinds, compared
 * definition by definition. Run from this directory.
 */

import { ATTRIBUTES, attributesFor, groupsOf, SHARED_HELP, PROJECT, typeOf, isParameter } from '../app/modules/attributes.js';
import { RELATIONSHIP_TYPES } from '../app/modules/metamodel.js';
import { ESTIMATED } from '../app/modules/risk.js';

/** The closed list of kinds, as plan §5.9 rules it. */
const ATTRIBUTE_KINDS = ['text', 'multiline', 'choice', 'set', 'hyperlink', 'number', 'date', 'table', 'drawing', 'computed', 'rationale', 'entities'];
/** What a table's column may be. */
const COLUMN_KINDS = ['text', 'multiline', 'date', 'choice', 'number'];

/** The project's tables as §1.10 records them, read beside the types. */
let documentProject = null;
import { ENTITY_TYPES } from '../app/modules/metamodel.js';
import { ok, equal, deepEqual, summary } from './harness.js';

// --- Parse the document ------------------------------------------------

const document = readFile('../notes/attributes.md');

/**
 * The type sections of the document: per code its name, status, ungrouped
 * rows, and groups, in document order. Fenced code blocks are skipped, so
 * the template's placeholder tables are not read as content.
 */
/** What the document's structure gets wrong, if anything, gathered as it is read. */
const problems = [];

function parseDocument(text) {
  const types = [];
  let fenced = false;
  let current = null;
  let table = null;
  /** where the table being read keeps its help, -1 where it has none */
  let helpColumn = -1;

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('```')) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;

    const heading = line.match(/^### [\d.]+ (.+) \((\w+)\) `(\w+)`$/);
    if (heading) {
      current = { code: heading[2], name: heading[1], status: heading[3], attributes: [], groups: [] };
      table = current.attributes;
      types.push(current);
      continue;
    }
    if (/^### [\d.]+ Project$/.test(line)) {
      current = { code: 'PROJECT', name: 'Project', status: 'draft', attributes: [], groups: [] };
      table = current.attributes;
      documentProject = current;
      continue;
    }
    if (line.startsWith('## ') || (line.startsWith('### ') && !heading)) {
      current = null;
      table = null;
      continue;
    }
    if (!current) continue;

    const group = line.match(/^(####|#####) (.+?)((?: `[^`]+`)*)$/);
    if (group) {
      table = [];
      const tags = {};
      for (const [, tag] of group[3].matchAll(/`([^`]+)`/g)) {
        const when = tag.match(/^when (\w+) =(?: (.+))?$/);
        const after = tag.match(/^after (\w+)$/);
        if (tag === 'tab') tags.tab = true;
        else if (when) tags.when = { key: when[1], value: when[2] ?? '' };
        else if (after) tags.after = after[1];
        else tags.tag = tag;
      }
      const held = { name: group[2], ...tags, attributes: table };
      if (group[1] === '#####') {
        const parent = current.groups.at(-1);
        if (!parent) problems.push(`${current.code}: a sub-group "${held.name}" with no group above it`);
        else (parent.groups ??= []).push(held);
      } else {
        current.groups.push(held);
      }
      continue;
    }

    if (line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
      if (cells[0] === 'Key') {
        helpColumn = cells.indexOf('Help');
        continue;
      }
      if (cells.every((cell) => /^-+$/.test(cell))) continue;
      const list = (cell) => (cell ?? '').split(';').map((value) => value.trim()).filter((value) => value !== '');
      const dotted = cells[0].match(/^(\w+)\.(\w+)$/);
      if (dotted) {
        const owner = table.find((held) => held.key === dotted[1] && held.kind === 'table');
        if (!owner) problems.push(`${current.code}: a column ${cells[0]} with no table above it`);
        else (owner.columns ??= []).push({ key: dotted[2], name: cells[1], kind: cells[2], ...(list(cells[3]).length > 0 ? { values: list(cells[3]) } : {}) });
        continue;
      }
      const definition = { key: cells[0], name: cells[1], kind: cells[2] };
      if (definition.kind === 'number') [definition.min, definition.max] = list(cells[3]).map(Number);
      else if (definition.kind === 'computed') definition.method = cells[3];
      else if (definition.kind === 'rationale') definition.parameter = cells[3];
      else if (definition.kind === 'entities') [definition.relationship, definition.recorded] = list(cells[3]);
      else if (list(cells[3]).length > 0) definition.values = list(cells[3]);
      if (helpColumn >= 0 && (cells[helpColumn] ?? '') !== '') definition.help = cells[helpColumn];
      table.push(definition);
    }
  }
  return types;
}

/**
 * §1.9's table: the help a shared name carries, by name.
 * @param {string} text
 * @returns {Object<string, string>}
 */
function parseSharedHelp(text) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => /^### [\d.]+ Help$/.test(line));
  /** @type {Object<string, string>} */
  const help = {};
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('#')) break;
    if (!line.startsWith('| ')) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells[0] === 'Name' || cells.every((cell) => /^-+$/.test(cell))) continue;
    help[cells[0]] = cells[1];
  }
  return help;
}

const documentTypes = parseDocument(document);
deepEqual(problems, [], 'the document nests every sub-group under a group and every column under a table');

// --- The project -------------------------------------------------------

ok(documentProject !== null, 'the document has its Project section');
deepEqual(PROJECT.attributes, documentProject?.attributes, "the project's own definitions match the document");
deepEqual(PROJECT.groups, documentProject?.groups, "the project's groups match the document");
deepEqual(attributesFor('PROJECT').map((definition) => definition.key), ['designation', 'organisation', 'description', 'version', 'date', 'author', 'role', 'changes', 'estimationMethod', 'notes'], 'attributesFor reads the project under PROJECT, the notes last');
ok(typeOf('PROJECT') === PROJECT && typeOf('SCN') === ATTRIBUTES.SCN && typeOf('XYZ') === null, 'typeOf finds the project, a type, and nothing for a stranger');
for (const definition of attributesFor('PROJECT')) {
  ok(ATTRIBUTE_KINDS.includes(definition.kind) && definition.kind !== 'rationale' && definition.kind !== 'computed', `PROJECT.${definition.key} uses a defined kind, and rates nothing`);
  ok(typeof (definition.help ?? SHARED_HELP[definition.name]) === 'string', `PROJECT.${definition.key} explains itself`);
}

// --- The shared help ---------------------------------------------------

deepEqual(SHARED_HELP, parseSharedHelp(document), 'the help a shared name carries matches §1.9, name for name');
const everyGroup = (type) => type.groups.flatMap((group) => [group, ...(group.groups ?? [])]);
const isRating = (group) => group.attributes.some((definition) => definition.kind === 'computed');
for (const name of Object.keys(SHARED_HELP)) {
  if (name === 'Identifier') continue;
  const asAttribute = documentTypes.filter((type) => [type.attributes, ...everyGroup(type).map((group) => group.attributes)].flat().some((definition) => definition.name === name)).length;
  const asGroup = documentTypes.flatMap(everyGroup).filter((group) => group.name === name).length;
  ok(asAttribute > 1 || asGroup > 1, `${name} is a name several types or variants share: ${asAttribute} types, ${asGroup} groups`);
}
for (const type of documentTypes) {
  const tables = [{ attributes: type.attributes }, ...everyGroup(type)];
  for (const table of tables) {
    if (isRating(table)) continue;
    for (const definition of table.attributes) {
      ok(typeof (definition.help ?? SHARED_HELP[definition.name]) === 'string', `${type.code}.${definition.key} explains itself, by its own help or its name's`);
    }
  }
}

// --- The transcription -------------------------------------------------

equal(documentTypes.length, 18, 'the document specifies 18 types');
deepEqual(
  Object.keys(ATTRIBUTES),
  documentTypes.map((type) => type.code),
  'ATTRIBUTES holds the 18 codes in document order'
);
deepEqual(
  [...Object.keys(ATTRIBUTES)].sort(),
  [...Object.keys(ENTITY_TYPES)].sort(),
  'the attribute codes are the metamodel codes'
);

for (const type of documentTypes) {
  equal(ENTITY_TYPES[type.code]?.name, type.name, `${type.code} is named as the metamodel names it`);
  const transcribed = ATTRIBUTES[type.code];
  deepEqual(transcribed?.attributes, type.attributes, `${type.code} ungrouped definitions match the document`);
  deepEqual(transcribed?.groups, type.groups, `${type.code} groups match the document`);

  const keys = attributesFor(type.code).map((definition) => definition.key);
  equal(new Set(keys).size, keys.length, `${type.code} keys are unique across its tables`);
  for (const definition of attributesFor(type.code)) {
    ok(ATTRIBUTE_KINDS.includes(definition.kind), `${type.code}.${definition.key} uses a defined kind`);
    if (definition.kind === 'choice' || definition.kind === 'set') {
      ok(Array.isArray(definition.values) && definition.values.length > 0, `${type.code}.${definition.key} lists its values`);
      ok(new Set(definition.values).size === definition.values.length, `${type.code}.${definition.key} lists each value once`);
    } else if (definition.kind === 'number') {
      ok(Number.isInteger(definition.min) && Number.isInteger(definition.max) && definition.min < definition.max, `${type.code}.${definition.key} is bounded below and above`);
    } else if (definition.kind === 'rationale') {
      const group = groupsOf(type.code).find((held) => held.attributes.includes(definition));
      ok(group !== undefined && group.attributes.some((held) => held.key === definition.parameter && isParameter(held)), `${type.code}.${definition.key} is given for a parameter of its own rating: ${definition.parameter}`);
      ok(!('values' in definition), `${type.code}.${definition.key} offers no values of its own`);
    } else if (definition.kind === 'table') {
      ok(Array.isArray(definition.columns) && definition.columns.length > 0, `${type.code}.${definition.key} has columns`);
      for (const column of definition.columns ?? []) {
        ok(COLUMN_KINDS.includes(column.kind), `${type.code}.${definition.key}.${column.key} is a text, a multiline, a date, a choice or a number`);
        if (column.kind === 'choice') ok(Array.isArray(column.values) && column.values.length > 0, `${type.code}.${definition.key}.${column.key} lists its values`);
        else ok(!('values' in column), `${type.code}.${definition.key}.${column.key} carries no values`);
      }
      ok(!('values' in definition), `${type.code}.${definition.key} carries no values of its own`);
    } else if (definition.kind === 'entities') {
      ok(Object.hasOwn(RELATIONSHIP_TYPES, definition.relationship), `${type.code}.${definition.key} records the far ends of a relationship type the metamodel defines`);
      ok(groupsOf(type.code).some((group) => group.name === definition.recorded), `${type.code}.${definition.key} is recorded when a group of the type changes: ${definition.recorded}`);
      ok(!('values' in definition), `${type.code}.${definition.key} offers no values of its own`);
    } else if (definition.kind === 'computed') {
      ok(ESTIMATED.includes(definition.method), `${type.code}.${definition.key} is read by a method the software knows`);
      const group = groupsOf(type.code).find((held) => held.attributes.includes(definition));
      ok(group !== undefined && group.attributes.some(isParameter), `${type.code}.${definition.key} has parameters beside it to read`);
    } else {
      ok(!('values' in definition), `${type.code}.${definition.key} carries no values`);
    }
  }
  ok(!keys.includes('id'), `${type.code} does not carry the identifier as an attribute`);
  for (const group of groupsOf(type.code)) {
    ok(!(group.groups ?? []).some((sub) => (sub.groups ?? []).length > 0), `${type.code} "${group.name}" nests one level at most`);
    for (const sub of group.groups ?? []) {
      if (sub.after === undefined) continue;
      ok(sub.when !== undefined && group.attributes.some((held) => held.key === sub.after), `${type.code} "${sub.name}" stands after an attribute of its group: ${sub.after}`);
    }
    if (!group.when) continue;
    const offered = attributesFor(type.code).find((held) => held.key === group.when.key) ?? attributesFor('PROJECT').find((held) => held.key === group.when.key);
    ok(
      offered?.kind === 'choice' && (group.when.value === '' || (offered.values ?? []).includes(group.when.value)),
      `${type.code} "${group.name}" waits on a value ${group.when.key} offers, on the type or the project, or on nothing chosen: ${group.when.value || '(nothing)'}`
    );
  }
}

// --- Lookups -----------------------------------------------------------

for (const type of documentTypes) {
  deepEqual(
    attributesFor(type.code),
    [...type.attributes, ...type.groups.flatMap((group) => [...group.attributes, ...(group.groups ?? []).flatMap((sub) => sub.attributes)])],
    `attributesFor(${type.code}) flattens ungrouped, then each group with its sub-groups`
  );
}
deepEqual(attributesFor('XXX'), [], 'attributesFor of an unknown code is empty');
deepEqual(attributesFor('constructor'), [], 'attributesFor of an inherited object key is empty');

summary('test-attributes');
