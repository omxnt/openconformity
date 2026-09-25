/**
 * The library function's pure part: the keys entities are recognised by
 * across files, what a project already holds of a library, the rows a
 * library shows under a filter, what a pick brings with it, and the copy
 * into a project. Run from this directory.
 */

import './shim.js';
import { referenceCore, joinKey, presence, libraryRows, importPlan, importInto } from '../app/modules/library.js';
import { LIBRARIES } from '../app/library/index.js';
import { EXAMPLE_PROJECT } from '../app/modules/example.js';
import { loadProject } from '../app/modules/files.js';
import { createModel, addEntity, addFolder, nodeOf, childrenOf } from '../app/modules/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';

// --- The keys -----------------------------------------------------------------

{
  const model = createModel();
  const regulation = addEntity(model, 'LEG', { attributes: { reference: '(EU) 2023/1230', title: 'Machinery Regulation' } }).entity;
  const directive = addEntity(model, 'LEG', { attributes: { reference: '2006/42/EC' } }).entity;
  const bare = addEntity(model, 'LEG', { attributes: { title: 'Unnamed act' } }).entity;
  equal(referenceCore(regulation), '2023/1230', 'an act is known by the year and number at the core of its citation');
  equal(referenceCore(directive), '2006/42', 'whichever way the citation writes them');
  equal(referenceCore(bare), null, 'and not at all without a reference');
  equal(joinKey(model, regulation), 'LEG:2023/1230', 'the key carries the type');
  equal(joinKey(model, addEntity(model, 'LEG', { attributes: { reference: 'Regulation (EU) 2023/1230' } }).entity), 'LEG:2023/1230', 'and survives a longer citation of the same act');

  const standard = addEntity(model, 'HST', { attributes: { reference: 'EN  ISO 12100' } }).entity;
  equal(joinKey(model, standard), 'HST:en iso 12100', 'a standard is known by its designation, spacing and case flattened');
  const clause = addEntity(model, 'HSR', { parent: standard.id, attributes: { reference: '5.4' } }).entity;
  equal(joinKey(model, clause), 'HST:en iso 12100/HSR:5.4', "a standard's clause by the standard's key and its own");
  const essential = addEntity(model, 'ESR', { parent: regulation.id, attributes: { reference: '1.3.7' } }).entity;
  equal(joinKey(model, essential), 'LEG:2023/1230/ESR:1.3.7', "an essential requirement by its act's key and its clause");
  const loose = addEntity(model, 'ESR', { attributes: { reference: '1.3.7' } }).entity;
  equal(joinKey(model, loose), null, 'a requirement outside its act has no key');
  equal(joinKey(model, addEntity(model, 'HAZ', { attributes: { title: 'Moving parts' } }).entity), null, 'a hazard has none');
  equal(joinKey(model, addFolder(model, 'Things').folder), null, 'nor a folder');
  equal(joinKey(model, null), null, 'nor nothing');
}

// --- Presence, the rows and the plan against the stand-in library ---------------

const library = loadProject(LIBRARIES[0].project);
ok(library.ok, 'the stand-in library passes the gates a project file passes');
const example = loadProject(EXAMPLE_PROJECT).model;

{
  const found = presence(example, library.model);
  ok([...found.values()].every((id) => id !== null), 'the example holds everything the stand-in offers, since the stand-in is its legislation');
  equal(found.get('LEG-001'), 'LEG-001', 'the act by its citation');
  equal(found.get('ESR-002'), 'ESR-002', 'and a clause by the act and its number');

  const empty = presence(createModel(), library.model);
  ok([...empty.values()].every((id) => id === null), 'an empty project holds none of it');

  const rows = libraryRows(library.model);
  deepEqual(rows.slice(0, 3).map(({ node, depth }) => [node.id, depth]), [['LEG-001', 0], ['ESR-001', 1], ['ESR-002', 1]], 'the rows are the tree depth first, each act at the root with its clauses beneath');
  deepEqual(libraryRows(library.model, 'emergency').map(({ node }) => node.id), ['LEG-001', 'ESR-001'], 'a filter keeps a matching clause and the act above it');
  deepEqual(libraryRows(library.model, 'emc').map(({ node }) => node.id), ['LEG-002', 'ESR-006', 'ESR-007'], 'a matching act keeps its clauses');
  deepEqual(libraryRows(library.model, 'nothing here'), [], 'or nothing');

  deepEqual(importPlan(library.model, ['ESR-002']).map((node) => node.id), ['LEG-001', 'ESR-002'], 'a picked clause brings its act, act first');
  deepEqual(importPlan(library.model, ['ESR-007', 'ESR-006']).map((node) => node.id), ['LEG-002', 'ESR-006', 'ESR-007'], 'in the tree order, whatever the order picked');
  deepEqual(importPlan(library.model, ['LEG-001']).map((node) => node.id), ['LEG-001'], 'a picked act brings nothing beneath it');
}

// --- The copy -----------------------------------------------------------------------

{
  const project = createModel();
  const folder = addFolder(project, 'Legislation').folder;
  const outcome = importInto(project, library.model, ['ESR-002', 'ESR-001'], folder.id);
  ok(outcome.ok, 'a copy into an empty project succeeds');
  deepEqual(outcome.added, ['LEG-001', 'ESR-001', 'ESR-002'], "the act and its two clauses, with the project's own identifiers");
  deepEqual(outcome.kept, [], 'nothing was there to keep');
  equal(nodeOf(project, 'LEG-001').parent, folder.id, 'the act lands in the target folder');
  equal(nodeOf(project, 'ESR-001').parent, 'LEG-001', 'and its clauses beneath the copy of it');
  equal(nodeOf(project, 'ESR-002').attributes.reference, '1.3.7', 'with their attributes');
  equal(nodeOf(project, 'LEG-001').attributes.reference, '(EU) 2023/1230', 'the act too');
  deepEqual(childrenOf(project, 'LEG-001').map((node) => node.id), ['ESR-001', 'ESR-002'], 'in the library order');

  const again = importInto(project, library.model, ['ESR-003'], null);
  ok(again.ok, 'a later copy from the same library succeeds');
  deepEqual(again.added, ['ESR-003'], 'and adds only the clause');
  deepEqual(again.kept, ['LEG-001'], 'since the act is recognised as already held');
  equal(nodeOf(project, 'ESR-003').parent, 'LEG-001', "under the project's own act, wherever the target points");

  const nothing = importInto(project, library.model, ['ESR-002'], null);
  deepEqual([nothing.ok, nothing.added, nothing.kept], [true, [], ['LEG-001', 'ESR-002']], 'a pick the project already holds copies nothing');
}

{
  const project = createModel();
  const outcome = importInto(project, library.model, ['LEG-002'], null);
  ok(outcome.ok && nodeOf(project, outcome.added[0]).parent === null, 'with no target the copy lands at the root');
  const held = nodeOf(project, outcome.added[0]);
  equal(held.type, 'LEG', 'as the act it is');
  equal(held.attributes.reference, '2014/30/EU', 'the directive');
}

summary('test-library');
