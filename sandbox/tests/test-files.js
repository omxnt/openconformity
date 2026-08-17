/**
 * Exercises the file layer: serialisation to the schema's shape with dense
 * per-parent orders, byte-stable round-trips, verbatim attribute carriage,
 * counters carried as recorded, and the gates in their ruled order. Run
 * from this directory.
 */

import { SCHEMA_VERSION, toFileObject, serialise, openProject, loadProject, filenameFor } from '../app/files.js';
import { createModel, addEntity, addFolder, updateEntity, relate, file, nodeOf, childrenOf } from '../app/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';

/** The identifiers of a parent's children, in sibling order. */
function childIds(model, parentId) {
  return childrenOf(model, parentId).map((node) => node.id);
}

// --- Loading the valid fixture -----------------------------------------

const fixtureText = readFile('fixtures/valid.json');
const opened = openProject(fixtureText);
equal(opened.ok, true, 'the valid fixture opens');
deepEqual(opened.notices, [], 'with no migration notices while the chain is empty');

{
  const model = opened.model;
  equal(model.name, 'Fixture project', 'the name is carried');
  equal(model.nodes.size, 8, 'every folder and entity is placed');
  deepEqual(childIds(model, null), ['F-1', 'LEG-001', 'F-2'], 'root siblings sort by their order integers, both kinds in one order');
  deepEqual(childIds(model, 'ELM-001'), ['ELM-003', 'ELM-002'], 'sibling order follows the integers, not the array');
  deepEqual(nodeOf(model, 'ELM-003').attributes, { legacy: 'kept as written' }, 'an unpresented key is carried verbatim');
  deepEqual(nodeOf(model, 'ELM-002').attributes, {}, 'no keys are seeded on load, and no default titles');
  equal(model.counters.ESR, 3, 'the counters are carried as recorded, holes included');
  equal(model.counters.ELM, 4, 'not recomputed from the issued numbers');
  equal(model.relationships.size, 4, 'every relationship is replayed');
}

// --- Round-trip stability ----------------------------------------------

{
  const second = serialise(opened.model);
  const reopened = openProject(second);
  equal(reopened.ok, true, 'what the software writes, the software opens');
  equal(serialise(reopened.model), second, 'a round-trip is byte-stable');
  ok(second.endsWith('}\n'), 'the file ends with a newline');

  const written = JSON.parse(second);
  deepEqual(
    Object.keys(written),
    ['format', 'schemaVersion', 'name', 'counters', 'folders', 'entities', 'relationships'],
    'the file holds the schema keys in the schema order'
  );
  equal(written.format, 'openconformity-project', 'the format is recorded');
  equal(written.schemaVersion, SCHEMA_VERSION, 'the current schema version is recorded');
  deepEqual(Object.keys(written.counters).length, 19, 'every counter is written');

  deepEqual(written.folders.map((folder) => [folder.id, folder.order]), [['F-1', 0], ['F-2', 2]], 'folder orders are rewritten dense per parent');
  deepEqual(
    written.entities.map((entity) => [entity.id, entity.order]),
    [['ELM-001', 0], ['ELM-003', 0], ['ELM-002', 1], ['LEG-001', 1], ['ESR-002', 0], ['HAZ-001', 0]],
    'entity orders are rewritten dense per parent, in filing-tree order'
  );
  deepEqual(written.entities[1].attributes, { legacy: 'kept as written' }, 'an unpresented key is written back unchanged');
}

// --- Round-trip from a built model -------------------------------------

{
  const model = createModel();
  addFolder(model, 'Zone');
  addEntity(model, 'ELM', { parent: 'F-1' });
  addEntity(model, 'HAZ');
  updateEntity(model, 'ELM-001', { title: 'Assembly', description: 'Two lines.\nOf text.' });
  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001');
  file(model, 'HAZ-001', 'F-1');

  const text = serialise(model);
  const reopened = openProject(text);
  equal(reopened.ok, true, 'a built model opens from its own file');
  equal(serialise(reopened.model), text, 'and round-trips byte-stable');
  deepEqual(childIds(reopened.model, 'F-1'), childIds(model, 'F-1'), 'sibling order survives the trip');
  deepEqual(nodeOf(reopened.model, 'ELM-001').attributes, nodeOf(model, 'ELM-001').attributes, 'attribute values survive, line breaks included');
  deepEqual(reopened.model.counters, { ...model.counters }, 'the counters survive');
}

// --- The gates, in order -----------------------------------------------

{
  const newer = openProject(readFile('fixtures/newer-version.json'));
  equal(newer.ok, false, 'a newer file is refused');
  equal(newer.code, 'newer', 'as newer, although it is also invalid under the current schema');
  ok(newer.statement.includes('newer version'), 'stating it was written by a newer version');

  const invalid = openProject(readFile('fixtures/duplicate-id.json'));
  equal(invalid.ok, false, 'an invalid file is refused');
  equal(invalid.code, 'invalid', 'as invalid');
  ok(invalid.statement.includes('not opened'), 'stating it was not opened');
  ok(Array.isArray(invalid.problems) && invalid.problems.length > 0, 'carrying what the validator found');

  equal(openProject('nonsense{').code, 'invalid', 'text that is not JSON is invalid');
  equal(openProject('"a string"').code, 'invalid', 'JSON that is not an object is invalid');
  equal(openProject('[]').code, 'invalid', 'an array is invalid');
  equal(openProject('{"format":"something-else","schemaVersion":1}').code, 'invalid', 'another format is invalid');
  equal(loadProject({ format: 'openconformity-project' }).code, 'invalid', 'a missing version is invalid');
  equal(loadProject({ format: 'openconformity-project', schemaVersion: '2' }).code, 'invalid', 'a version held as text is invalid, not newer');
  equal(loadProject({ format: 'openconformity-project', schemaVersion: 0 }).code, 'invalid', 'version 0 has no transcription');
  equal(loadProject({ format: 'openconformity-project', schemaVersion: 999 }).code, 'newer', 'any later version refuses as newer');
}

// --- The filename ------------------------------------------------------

{
  equal(filenameFor(''), 'untitled.json', 'an unnamed project saves as untitled');
  equal(filenameFor('Mixer Line 2'), 'mixer-line-2.json', 'the name slugifies: lowercased, spaces to dashes');
  equal(filenameFor('  Blandare — Åsa/Örebro  '), 'blandare-asa-orebro.json', 'marks strip and runs of anything else become one dash');
  equal(filenameFor('$$$'), 'untitled.json', 'a name nothing survives of saves as untitled');
  equal(filenameFor('A --- B'), 'a-b.json', 'dashes never run');
  equal(filenameFor('café'), 'cafe.json', 'diacritics fold to their letters');
}

// --- The blob path -----------------------------------------------------

{
  const asBlobProject = loadProject(toFileObject(opened.model));
  equal(asBlobProject.ok, true, 'the file object passes the same loader the file text does');
  equal(serialise(asBlobProject.model), serialise(opened.model), 'and rebuilds the same model');
}

summary('test-files');
