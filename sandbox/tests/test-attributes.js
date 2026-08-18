/**
 * Verifies the attribute transcription against `docs/attributes.md`: every
 * type section, its ungrouped table, its groups, and its kinds, compared
 * definition by definition. Run from this directory.
 */

import { ATTRIBUTES, attributesFor } from '../app/attributes.js';

/** The closed list of kinds, as plan §5.9 rules it. */
const ATTRIBUTE_KINDS = ['text', 'multiline', 'choice', 'hyperlink'];
import { ENTITY_TYPES } from '../app/metamodel.js';
import { ok, equal, deepEqual, summary } from './harness.js';

// --- Parse the document ------------------------------------------------

const document = readFile('../../docs/attributes.md');

/**
 * The type sections of the document: per code its name, status, ungrouped
 * rows, and groups, in document order. Fenced code blocks are skipped, so
 * the template's placeholder tables are not read as content.
 */
function parseDocument(text) {
  const types = [];
  let fenced = false;
  let current = null;
  let table = null;

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
    if (line.startsWith('## ') || (line.startsWith('### ') && !heading)) {
      current = null;
      table = null;
      continue;
    }
    if (!current) continue;

    const group = line.match(/^#### (.+)$/);
    if (group) {
      table = [];
      current.groups.push({ name: group[1], attributes: table });
      continue;
    }

    if (line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
      if (cells[0] === 'Key' || cells.every((cell) => /^-+$/.test(cell))) continue;
      const definition = { key: cells[0], name: cells[1], kind: cells[2] };
      const values = (cells[3] ?? '').split(';').map((value) => value.trim()).filter((value) => value !== '');
      if (values.length > 0) definition.values = values;
      table.push(definition);
    }
  }
  return types;
}

const documentTypes = parseDocument(document);

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

  const keys = [...type.attributes, ...type.groups.flatMap((group) => group.attributes)].map(
    (definition) => definition.key
  );
  equal(new Set(keys).size, keys.length, `${type.code} keys are unique across its tables`);
  for (const definition of attributesFor(type.code)) {
    ok(ATTRIBUTE_KINDS.includes(definition.kind), `${type.code}.${definition.key} uses a defined kind`);
    if (definition.kind === 'choice') {
      ok(Array.isArray(definition.values) && definition.values.length > 0, `${type.code}.${definition.key} lists its choices`);
    } else {
      ok(!('values' in definition), `${type.code}.${definition.key} carries no values`);
    }
  }
  ok(!keys.includes('id'), `${type.code} does not carry the identifier as an attribute`);
}

// --- Lookups -----------------------------------------------------------

for (const type of documentTypes) {
  deepEqual(
    attributesFor(type.code),
    [...type.attributes, ...type.groups.flatMap((group) => group.attributes)],
    `attributesFor(${type.code}) flattens ungrouped then groups`
  );
}
deepEqual(attributesFor('XXX'), [], 'attributesFor of an unknown code is empty');
deepEqual(attributesFor('constructor'), [], 'attributesFor of an inherited object key is empty');

summary('test-attributes');
