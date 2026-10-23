/**
 * Verifies the attribute transcription against `specs/attributes.md`: every
 * type's table, tab by tab, a rating row read through the methods of
 * chapter 7 and a level row through the standards of chapter 8, compared
 * definition by definition. Run from this directory.
 */

import { ATTRIBUTES, attributesFor, groupsOf, SHARED_HELP, PROJECT, typeOf, isParameter } from '../app/modules/attributes.js';
import { RELATIONSHIP_TYPES, ENTITY_TYPES } from '../app/modules/metamodel.js';
import { METHODS } from '../app/modules/risk.js';
import { firstTabName } from '../app/modules/fields.js';
import { ok, equal, deepEqual, summary } from './harness.js';

/** The closed list of kinds a definition in the code uses. */
const ATTRIBUTE_KINDS = ['text', 'multiline', 'choice', 'set', 'hyperlink', 'number', 'date', 'table', 'drawing', 'computed', 'rationale', 'entities'];
/** The kinds a row of the document may use: the code's, and the three the document alone has. */
const DOCUMENT_KINDS = [...ATTRIBUTE_KINDS, 'identifier', 'rating', 'level'];
/** What a table's column may be. */
const COLUMN_KINDS = ['text', 'multiline', 'date', 'choice', 'number'];

// --- V-TST-005 Parse the document (F-MOD-003) --------------------------------

const document = readFile('../specs/attributes.md');

/** What the document's structure gets wrong, if anything, gathered as it is read. */
const problems = [];

/**
 * Every table of the document outside a fence, each with the heading it
 * stands under, the section heading above that, its header and its rows.
 * The template's table is fenced, so it is not read as content.
 */
function tablesOf(text) {
  const tables = [];
  let fenced = false;
  let section = '';
  let heading = '';
  let table = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('```')) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    if (line.startsWith('#')) {
      heading = line;
      if (/^##?#? /.test(line)) section = line;
      table = null;
      continue;
    }
    if (!line.startsWith('|')) {
      table = null;
      continue;
    }
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.every((cell) => /^-+$/.test(cell))) continue;
    if (!table) {
      table = { section, heading, header: cells, rows: [] };
      tables.push(table);
      continue;
    }
    table.rows.push(cells);
  }
  return tables;
}

const list = (text) => text.split(';').map((value) => value.trim()).filter((value) => value !== '');
/** A reader of one row's cells by the table's header. */
const cellsOf = (table) => {
  const columns = Object.fromEntries(table.header.map((name, i) => [name, i]));
  return (row) => (name) => row[columns[name]] ?? '';
};

/**
 * A definition as the code holds it, from a row's name, kind, values and
 * key: the values read as the kind reads them.
 */
function define(key, name, kind, values) {
  const definition = { key, name, kind };
  if (kind === 'number') [definition.min, definition.max] = list(values).map(Number);
  else if (kind === 'computed') definition.method = values;
  else if (kind === 'rationale') definition.parameter = values;
  else if (kind === 'entities') [definition.relationship, definition.recorded] = list(values);
  else if (list(values).length > 0) definition.values = list(values);
  return definition;
}

const tables = tablesOf(document);

/** Chapter 7: each method's name and its parameters, with bare keys, in document order. */
const methods = tables
  .filter((table) => table.section.startsWith('### 7.') && table.header[0] === 'Parameter')
  .map((table) => {
    const cell = cellsOf(table);
    return {
      name: table.section.replace(/^### [\d.]+ /, ''),
      parameters: table.rows.map((row) => define(cell(row)('Key'), cell(row)('Parameter'), cell(row)('Kind'), cell(row)('Values'))),
    };
  });

/** Chapter 8: each standard's name, the level it offers as a definition without a name, in document order. */
const standards = tables
  .filter((table) => table.section.startsWith('## 8.') && table.header[0] === 'Standard')
  .flatMap((table) => table.rows.map(([standard, values, key]) => ({ standard, key, kind: values === 'text' ? 'text' : 'choice', ...(values === 'text' ? {} : { values: list(values) }) })));

/**
 * One type's table read as the editor shows it: per tab its name and its
 * definitions in order, a rating row expanded to every method's
 * parameters and the text held with no method, a level row to every
 * standard's level, and a column row added to the table above it.
 */
function readType(table) {
  const heading = table.section.match(/^### [\d.]+ (.+) \((\w+)\)$/);
  const type = { code: heading ? heading[2] : 'PROJECT', name: heading ? heading[1] : 'Project', tabs: [], names: [] };
  const cell = cellsOf(table);
  if (!['Tab', 'Attribute', 'Kind', 'Values', 'Help', 'Key'].every((name) => table.header.includes(name))) problems.push(`${type.code}: a table without the six columns`);
  let tab = null;
  for (const row of table.rows) {
    const of = cell(row);
    const [name, kind, values, help, key] = [of('Attribute'), of('Kind'), of('Values'), of('Help'), of('Key')];
    if (tab?.name !== of('Tab')) {
      if (type.tabs.some((held) => held.name === of('Tab'))) problems.push(`${type.code}: the tab ${of('Tab')} is split`);
      tab = { name: of('Tab'), attributes: [] };
      type.tabs.push(tab);
    }
    if (!DOCUMENT_KINDS.includes(kind)) problems.push(`${type.code}: ${key} uses a kind the document does not define, ${kind}`);
    type.names.push(name);
    if (kind === 'identifier') {
      if (type.tabs.length !== 1 || tab.attributes.length !== 0 || type.identifier) problems.push(`${type.code}: the identifier is not the first row`);
      type.identifier = { key, help };
      continue;
    }
    if (type.code === 'PROJECT' && key === 'name') {
      type.projectName = { kind, help };
      continue;
    }
    const dotted = key.match(/^(\w+)\.(\w+)$/);
    if (dotted) {
      const owner = tab.attributes.find((held) => held.key === dotted[1] && held.kind === 'table');
      if (!owner) problems.push(`${type.code}: a column ${key} with no table above it on its tab`);
      else (owner.columns ??= []).push({ key: dotted[2], name, kind, ...(list(values).length > 0 ? { values: list(values) } : {}) });
      continue;
    }
    if (kind === 'rating') {
      if (values !== '') problems.push(`${type.code}: the rating ${key} carries values`);
      if (help !== SHARED_HELP[name]) problems.push(`${type.code}: the rating ${key} is not explained as the software explains ${name}`);
      for (const method of methods) {
        for (const parameter of method.parameters) {
          const held = { ...parameter, key: key + parameter.key };
          if (held.parameter !== undefined) held.parameter = key + held.parameter;
          tab.attributes.push(held);
        }
      }
      tab.attributes.push({ key: `${key}Rating`, name, kind: 'text' });
      (type.ratings ??= []).push(name);
      continue;
    }
    if (kind === 'level') {
      if (help !== SHARED_HELP[name]) problems.push(`${type.code}: the level ${key} is not explained as the software explains ${name}`);
      deepEqual(list(key), standards.map((held) => held.key), `${type.code}: the level's keys are the standards' of chapter 8, in order`);
      for (const standard of standards) tab.attributes.push({ key: standard.key, name, kind: standard.kind, ...(standard.values ? { values: standard.values } : {}) });
      (type.levels ??= []).push({ name, chooser: values });
      continue;
    }
    const definition = define(key, name, kind, values);
    if (help !== '') definition.help = help;
    tab.attributes.push(definition);
  }
  return type;
}

const documentTypes = tables.filter((table) => table.header[0] === 'Tab' && /^### [\d.]+ .+ \(\w+\)$/.test(table.section)).map(readType);
const documentProject = tables.filter((table) => table.header[0] === 'Tab' && table.section === '## 2. Project').map(readType)[0] ?? null;

deepEqual(problems, [], 'every type has its six columns, its identifier first, its tabs unsplit, its columns under a table, and its ratings and levels explained as the software explains them');
for (const type of [...documentTypes, documentProject ?? []].flat()) equal(type.tabs[0]?.name, firstTabName(type.code), `${type.code}'s first tab is named as the editor names it, by the last word of the type's name`);
ok(documentProject?.identifier === undefined, 'the project carries no identifier');
for (const type of documentTypes) {
  ok(type.identifier?.key === 'id' && type.identifier.help === SHARED_HELP.Identifier, `${type.code} records the identifier under id, explained as the software explains it`);
  deepEqual(type.tabs.slice(-2).map((tab) => tab.name), ['Diagram', 'Notes'], `${type.code} ends with a Diagram tab and a Notes tab`);
}
deepEqual(methods.map((method) => method.name), METHODS, 'chapter 7 holds the methods the software knows, in order');
for (const method of methods) {
  for (const parameter of method.parameters) {
    ok(['choice', 'number', 'rationale', 'computed'].includes(parameter.kind), `${method.name}: ${parameter.key} is a choice, a number, a rationale or a computed`);
    if (parameter.kind === 'computed') equal(parameter.method, method.name, `${method.name}: ${parameter.key} is computed by its own method`);
    if (parameter.kind === 'rationale') ok(method.parameters.some((held) => held.key === parameter.parameter && isParameter(held)), `${method.name}: ${parameter.key} is given for a parameter of its method`);
  }
}
ok(standards.length > 1 && standards.at(-1).kind === 'text' && standards.slice(0, -1).every((held) => held.kind === 'choice'), 'chapter 8 offers a choice per standard and a text with none');

// --- V-TST-006 The project (F-MOD-003) ---------------------------------------

/** The code's definitions per tab, as the document lays them out: the ungrouped first, then each tab's groups flattened. */
const groupAttributes = (group) => [...group.attributes, ...(group.groups ?? []).flatMap(groupAttributes)];
const codeTabs = (type, code) => [{ name: firstTabName(code), attributes: type.attributes }, ...type.groups.filter((group) => group.tab).map((group) => ({ name: group.name, attributes: groupAttributes(group) }))];

ok(documentProject !== null, 'the document has its Project chapter');
deepEqual(codeTabs(PROJECT, 'PROJECT'), documentProject?.tabs, "the project's definitions match the document, tab by tab");
ok(documentProject?.projectName?.kind === 'text' && typeof documentProject.projectName.help === 'string', "the project's name stands in the document as a text, explained, and not as a definition");
deepEqual(attributesFor('PROJECT').map((definition) => definition.key), ['designation', 'organisation', 'description', 'version', 'date', 'author', 'role', 'changes', 'estimationMethod', 'notes'], 'attributesFor reads the project in document order');
ok(typeOf('PROJECT') === PROJECT && typeOf('SCN') === ATTRIBUTES.SCN && typeOf('XYZ') === null, 'typeOf finds the project, a type, and nothing for a stranger');
for (const definition of attributesFor('PROJECT')) {
  ok(ATTRIBUTE_KINDS.includes(definition.kind) && definition.kind !== 'rationale' && definition.kind !== 'computed', `PROJECT.${definition.key} uses a defined kind, and rates nothing`);
  ok(typeof (definition.help ?? SHARED_HELP[definition.name]) === 'string', `PROJECT.${definition.key} explains itself`);
}

// --- V-TST-007 The shared help (F-MOD-003) -----------------------------------

const sharedNames = ['Identifier', ...documentTypes.flatMap((type) => [...(type.ratings ?? []), ...(type.levels ?? []).map((level) => level.name)])];
deepEqual([...Object.keys(SHARED_HELP)].sort(), [...new Set(sharedNames)].sort(), 'the help the software holds by name is the identifier, the rating rows and the level rows, and nothing else');
const everyGroup = (type) => type.groups.flatMap((group) => [group, ...(group.groups ?? [])]);
const isRating = (group) => group.attributes.some((definition) => definition.kind === 'computed');
for (const type of documentTypes) {
  const tables = [{ attributes: ATTRIBUTES[type.code]?.attributes ?? [] }, ...everyGroup(ATTRIBUTES[type.code] ?? { groups: [] })];
  for (const table of tables) {
    if (isRating(table)) continue;
    for (const definition of table.attributes) {
      ok(typeof (definition.help ?? SHARED_HELP[definition.name]) === 'string', `${type.code}.${definition.key} explains itself, by its own help or its name's`);
    }
  }
}

// --- V-TST-008 The transcription (F-MOD-003) ---------------------------------

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
  deepEqual(transcribed ? codeTabs(transcribed, type.code).map((tab) => tab.name) : [], type.tabs.map((tab) => tab.name), `${type.code} has the document's tabs, in order`);
  for (const tab of type.tabs) {
    deepEqual(transcribed ? codeTabs(transcribed, type.code).find((held) => held.name === tab.name)?.attributes : undefined, tab.attributes, `${type.code} tab ${tab.name} matches the document`);
  }
  for (const level of type.levels ?? []) {
    const chooser = type.tabs.flatMap((tab) => tab.attributes).find((held) => held.key === level.chooser);
    deepEqual(chooser?.values, standards.slice(0, -1).map((held) => held.standard), `${type.code}: the level's standards are those ${level.chooser} offers, in order`);
  }

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
      ok(type.tabs.some((tab) => tab.name === definition.recorded) || (type.ratings ?? []).includes(definition.recorded), `${type.code}.${definition.key} names a tab or a rating of the document: ${definition.recorded}`);
      ok(!('values' in definition), `${type.code}.${definition.key} offers no values of its own`);
    } else if (definition.kind === 'computed') {
      ok(METHODS.includes(definition.method), `${type.code}.${definition.key} is read by a method the software knows`);
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

// --- V-TST-009 Lookups (F-MOD-003) -------------------------------------------

for (const type of documentTypes) {
  deepEqual(
    attributesFor(type.code),
    (ATTRIBUTES[type.code] ? codeTabs(ATTRIBUTES[type.code], type.code) : []).flatMap((tab) => tab.attributes),
    `attributesFor(${type.code}) flattens the first tab, then each tab with its groups`
  );
}
deepEqual(attributesFor('XXX'), [], 'attributesFor of an unknown code is empty');
deepEqual(attributesFor('constructor'), [], 'attributesFor of an inherited object key is empty');

summary('test-attributes');
