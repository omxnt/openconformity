/**
 * Verifies the attribute transcription against `sandbox/attributes.md` —
 * the working draft that supersedes `docs/attributes.md` while the
 * attribute-definition work runs, promoted over it when that work lands: every
 * type section, its ungrouped table, its groups, and its kinds, compared
 * definition by definition. Run from this directory.
 */

import { ATTRIBUTES, attributesFor, groupsOf } from '../app/attributes.js';
import { RELATIONSHIP_TYPES } from '../app/metamodel.js';
import { ESTIMATED } from '../app/risk.js';

/** The closed list of kinds, as plan §5.9 rules it. */
const ATTRIBUTE_KINDS = ['text', 'multiline', 'choice', 'set', 'hyperlink', 'number', 'computed', 'related'];
import { ENTITY_TYPES } from '../app/metamodel.js';
import { ok, equal, deepEqual, summary } from './harness.js';

// --- Parse the document ------------------------------------------------

const document = readFile('../attributes.md');

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

    const group = line.match(/^(####|#####) (.+?)(?: `(.+?)`)?$/);
    if (group) {
      table = [];
      const when = (group[3] ?? '').match(/^when (\w+) = (.+)$/);
      const tag =
        group[3] === undefined ? {} : group[3] === 'tab' ? { tab: true } : when ? { when: { key: when[1], value: when[2] } } : { tag: group[3] };
      const held = { name: group[2], ...tag, attributes: table };
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
      if (cells[0] === 'Key' || cells.every((cell) => /^-+$/.test(cell))) continue;
      const list = (cell) => (cell ?? '').split(';').map((value) => value.trim()).filter((value) => value !== '');
      const definition = { key: cells[0], name: cells[1], kind: cells[2] };
      if (definition.kind === 'number') [definition.min, definition.max] = list(cells[3]).map(Number);
      else if (definition.kind === 'computed') definition.method = cells[3];
      else if (definition.kind === 'related') definition.relationship = cells[3];
      else if (list(cells[3]).length > 0) definition.values = list(cells[3]);
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

  const keys = attributesFor(type.code).map((definition) => definition.key);
  equal(new Set(keys).size, keys.length, `${type.code} keys are unique across its tables`);
  for (const definition of attributesFor(type.code)) {
    ok(ATTRIBUTE_KINDS.includes(definition.kind), `${type.code}.${definition.key} uses a defined kind`);
    if (definition.kind === 'choice' || definition.kind === 'set') {
      ok(Array.isArray(definition.values) && definition.values.length > 0, `${type.code}.${definition.key} lists its values`);
      ok(new Set(definition.values).size === definition.values.length, `${type.code}.${definition.key} lists each value once`);
    } else if (definition.kind === 'number') {
      ok(Number.isInteger(definition.min) && Number.isInteger(definition.max) && definition.min < definition.max, `${type.code}.${definition.key} is bounded below and above`);
    } else if (definition.kind === 'computed') {
      ok(ESTIMATED.includes(definition.method), `${type.code}.${definition.key} is read by a method the software knows`);
      const group = groupsOf(type.code).find((held) => held.attributes.includes(definition));
      ok(group !== undefined && group.attributes.some((held) => held.kind !== 'computed'), `${type.code}.${definition.key} has parameters beside it to read`);
    } else if (definition.kind === 'related') {
      const relationship = RELATIONSHIP_TYPES[definition.relationship];
      ok(relationship !== undefined, `${type.code}.${definition.key} lists a relationship type the metamodel defines`);
      ok(relationship?.source === type.code || relationship?.target === type.code, `${type.code}.${definition.key} lists a relationship ${type.code} takes part in`);
    } else {
      ok(!('values' in definition), `${type.code}.${definition.key} carries no values`);
    }
  }
  ok(!keys.includes('id'), `${type.code} does not carry the identifier as an attribute`);
  for (const group of groupsOf(type.code)) {
    ok(!(group.groups ?? []).some((sub) => (sub.groups ?? []).length > 0), `${type.code} "${group.name}" nests one level at most`);
    if (!group.when) continue;
    const leader = attributesFor(type.code).find((held) => held.key === group.when.key);
    ok(
      leader?.kind === 'choice' && (leader.values ?? []).includes(group.when.value),
      `${type.code} "${group.name}" waits on a value ${group.when.key} offers: ${group.when.value}`
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
