/**
 * Exercises gate 1 against the fixture files, keyword mutations of the
 * valid fixture, and a behavioural sweep of the schema's enumerations.
 * Run from this directory.
 */

import './shim.js';
import { validate } from '../app/validator.js';
import { ok, equal, summary } from './harness.js';

const valid = JSON.parse(readFile('fixtures/valid.json'));

/**
 * A validation that failed, with a problem naming what the fixture
 * breaks.
 * @param {any} data
 * @param {string} needle
 * @param {string} message
 */
function refusedOver(data, needle, message) {
  const judged = validate(data, 1);
  ok(
    judged.ok === false && judged.problems.some((problem) => problem.includes(needle)),
    `${message}${judged.ok === false ? ` (problems: ${judged.problems.join(' | ')})` : ' (passed)'}`
  );
}

/**
 * The valid fixture with one change applied.
 * @param {(data: any) => void} change
 * @returns {any}
 */
function mutated(change) {
  const copy = structuredClone(valid);
  change(copy);
  return copy;
}

// --- The fixtures ------------------------------------------------------

equal(validate(valid, 1).ok, true, 'the valid fixture passes');
equal(validate(JSON.parse(readFile('fixtures/null-parent.json')), 1).ok, true, 'a null parent passes: the pattern applies to strings only');

refusedOver(JSON.parse(readFile('fixtures/duplicate-id.json')), 'ELM-001', 'a duplicate identifier is refused');
refusedOver(JSON.parse(readFile('fixtures/unresolved-parent.json')), 'F-9', 'an unresolved parent is refused');
refusedOver(JSON.parse(readFile('fixtures/filing-cycle.json')), 'sits inside itself', 'a filing cycle is refused');
refusedOver(JSON.parse(readFile('fixtures/order-collision.json')), 'share the order', 'an order collision is refused, across both kinds');
refusedOver(JSON.parse(readFile('fixtures/wrong-endpoints.json')), 'is not a', 'wrong endpoint types are refused');
refusedOver(JSON.parse(readFile('fixtures/duplicate-triple.json')), 'appears more than once', 'a duplicate triple is refused');
refusedOver(JSON.parse(readFile('fixtures/second-owner.json')), 'owned through composition more than once', 'a second composition owner is refused');
refusedOver(JSON.parse(readFile('fixtures/composition-cycle.json')), 'owns itself', 'a composition cycle is refused');
refusedOver(JSON.parse(readFile('fixtures/counter-behind.json')), 'counter does not exceed', 'a counter not exceeding an issued number is refused');

equal(validate(valid, 99).ok, false, 'an unknown schema version has no transcription');
equal(validate(valid, 0).ok, false, 'nor does version 0');

// --- Keyword mutations -------------------------------------------------

refusedOver(mutated((data) => delete data.name), 'has no name', 'a missing required key is refused');
refusedOver(mutated((data) => { data.extra = 1; }), 'extra', 'an unknown root key is refused');
refusedOver(mutated((data) => { data.format = 'something-else'; }), 'format', 'a wrong format is refused');
refusedOver(mutated((data) => { data.schemaVersion = 2; }), 'schemaVersion', 'a version other than the transcription judged against is refused');
refusedOver(mutated((data) => { data.name = 42; }), 'name is not text', 'a non-text name is refused');

refusedOver(mutated((data) => delete data.counters.F), 'has no F', 'a missing counter is refused');
refusedOver(mutated((data) => { data.counters.X = 1; }), 'holds X', 'an unknown counter is refused');
refusedOver(mutated((data) => { data.counters.SCN = 0; }), 'SCN counter', 'a counter below 1 is refused');
refusedOver(mutated((data) => { data.counters.SCN = '2'; }), 'SCN counter', 'a counter held as text is refused');
refusedOver(mutated((data) => { data.counters.SCN = 1.5; }), 'SCN counter', 'a fractional counter is refused');

refusedOver(mutated((data) => { data.folders[0].name = ''; }), 'name', 'an empty folder name is refused');
refusedOver(mutated((data) => { data.folders[0].id = 'folder-1'; }), 'identifier', 'a malformed folder identifier is refused');
refusedOver(mutated((data) => { data.folders[0].order = -1; }), 'order', 'a negative order is refused');
refusedOver(mutated((data) => { data.folders[0].order = 1.5; }), 'order', 'a fractional order is refused');
refusedOver(mutated((data) => { data.folders[0].parent = 'G-1'; }), 'parent', 'a parent outside both identifier shapes is refused');
refusedOver(mutated((data) => { data.folders[0].parent = 7; }), 'parent', 'a non-text parent is refused');
refusedOver(mutated((data) => { data.folders[0].extra = 1; }), 'extra', 'an unknown folder key is refused');

refusedOver(mutated((data) => { data.entities[0].type = 'XXX'; }), 'type', 'an unknown entity type is refused');
refusedOver(mutated((data) => { data.entities[0].id = 'ELM-01'; }), 'identifier', 'an identifier of fewer than three digits is refused');
refusedOver(mutated((data) => { data.entities[0].id = 'HAZ-009'; data.counters.HAZ = 10; }), 'type code', 'an identifier of another type code is refused');
refusedOver(mutated((data) => { data.entities[0].attributes = 42; }), 'attributes', 'non-object attributes are refused');
refusedOver(mutated((data) => { data.entities[0].attributes = { title: 1 }; }), 'title attribute', 'a non-text attribute value is refused');
refusedOver(mutated((data) => { data.entities[0].attributes = { '': 'x' }; }), 'empty', 'an empty attribute key is refused');
refusedOver(mutated((data) => delete data.entities[0].attributes), 'has no attributes', 'an entity without attributes is refused');

refusedOver(mutated((data) => { data.relationships[0].type = 'elm-owns-elm'; }), 'type', 'an unknown relationship type is refused');
refusedOver(mutated((data) => { data.relationships[0].source = 'F-1'; }), 'source', 'a folder identifier as an endpoint is refused');
refusedOver(mutated((data) => delete data.relationships[0].target), 'has no target', 'a relationship without a target is refused');
refusedOver(mutated((data) => { data.relationships[0].extra = 1; }), 'extra', 'an unknown relationship key is refused');

refusedOver(mutated((data) => { data.folders = {}; }), 'not an array', 'folders held as an object are refused');
ok(validate('text', 1).ok === false, 'a file that is not an object is refused');
ok(validate(null, 1).ok === false, 'null is refused');
ok(validate([], 1).ok === false, 'an array is refused');

// --- The enumerations, behaviourally -----------------------------------

const schema = JSON.parse(readFile('../../schema/project.schema.json'));
const relationshipIds = schema.$defs.relationship.properties.type.enum;
const typeCodes = schema.$defs.entity.properties.type.enum;
const compositionIds = [
  'leg-contains-esr',
  'hst-contains-hsr',
  'osp-contains-osr',
  'req-decomposes-into-req',
  'saf-decomposes-into-saf',
  'elm-decomposes-into-elm',
];

/**
 * A minimal file holding these entities and relationships, with counters
 * exceeding every issued number.
 * @param {Array<{ id: string, type: string }>} entities
 * @param {Array<{ type: string, source: string, target: string }>} relationships
 * @returns {any}
 */
function fileWith(entities, relationships) {
  const counters = {};
  for (const code of typeCodes) counters[code] = 1;
  counters.F = 1;
  for (const entity of entities) {
    const number = parseInt(entity.id.slice(entity.id.indexOf('-') + 1), 10);
    counters[entity.type] = Math.max(counters[entity.type], number + 1);
  }
  return {
    format: 'openconformity-project',
    schemaVersion: 1,
    name: '',
    counters,
    folders: [],
    entities: entities.map((entity, index) => ({ ...entity, parent: null, order: index, attributes: {} })),
    relationships,
  };
}

for (const code of typeCodes) {
  equal(validate(fileWith([{ id: `${code}-001`, type: code }], []), 1).ok, true, `an entity of type ${code} passes`);
}

for (const id of relationshipIds) {
  const parts = id.split('-');
  const source = parts[0].toUpperCase();
  const target = parts[parts.length - 1].toUpperCase();

  const wellFormed =
    source === target
      ? fileWith(
          [{ id: `${source}-001`, type: source }, { id: `${source}-002`, type: source }],
          [{ type: id, source: `${source}-001`, target: `${source}-002` }]
        )
      : fileWith(
          [{ id: `${source}-001`, type: source }, { id: `${target}-001`, type: target }],
          [{ type: id, source: `${source}-001`, target: `${target}-001` }]
        );
  equal(validate(wellFormed, 1).ok, true, `a well-formed ${id} passes`);

  const twoOnOneTarget =
    source === target
      ? fileWith(
          [
            { id: `${source}-001`, type: source },
            { id: `${source}-002`, type: source },
            { id: `${source}-003`, type: source },
          ],
          [
            { type: id, source: `${source}-002`, target: `${source}-001` },
            { type: id, source: `${source}-003`, target: `${source}-001` },
          ]
        )
      : fileWith(
          [
            { id: `${source}-001`, type: source },
            { id: `${source}-002`, type: source },
            { id: `${target}-001`, type: target },
          ],
          [
            { type: id, source: `${source}-001`, target: `${target}-001` },
            { type: id, source: `${source}-002`, target: `${target}-001` },
          ]
        );
  equal(
    validate(twoOnOneTarget, 1).ok,
    !compositionIds.includes(id),
    `two ${id} onto one target ${compositionIds.includes(id) ? 'break the single owner rule' : 'are allowed'}`
  );
}

summary('test-validator');
