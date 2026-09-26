/**
 * The library function's pure part: the rows a catalogue shows under an
 * expansion and a filter, the checked state of a row over the picks,
 * what an import copies, and the copy into a project where the user
 * stands. Run from this directory.
 */

import './shim.js';
import { libraryRows, checkState, togglePick, importPlan, importInto, previewValue, previewSections } from '../app/modules/library.js';
import { LIBRARIES } from '../app/library/index.js';
import { loadProject } from '../app/modules/files.js';
import { createModel, addEntity, addFolder, relate, nodeOf, childrenOf } from '../app/modules/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';

const library = loadProject(LIBRARIES[0].project);
ok(library.ok, 'the stand-in catalogue passes the gates a project file passes');
ok(library.model.relationships.size > 0 && [...library.model.relationships.values()].every((held) => nodeOf(library.model, held.source) && nodeOf(library.model, held.target)), 'and keeps the relationships between what it holds, each act owning its clauses');

// --- The rows -----------------------------------------------------------------

{
  deepEqual(libraryRows(library.model).map(({ node, depth, hasChildren, expanded }) => [node.id, depth, hasChildren, expanded]), [['LEG-001', 0, true, false], ['LEG-002', 0, true, false]], 'the tree starts collapsed at its root, each act a row with a chevron');
  deepEqual(libraryRows(library.model, '', new Set(['LEG-002'])).map(({ node }) => node.id), ['LEG-001', 'LEG-002', 'ESR-006', 'ESR-007'], 'an expanded row shows its clauses');
  deepEqual(libraryRows(library.model, 'emergency').map(({ node, expanded }) => [node.id, expanded]), [['LEG-001', true], ['ESR-001', false]], 'a filter keeps a matching clause and the act above it, opened');
  deepEqual(libraryRows(library.model, 'emc').map(({ node }) => node.id), ['LEG-002', 'ESR-006', 'ESR-007'], 'a matching act keeps its clauses');
  deepEqual(libraryRows(library.model, 'nothing here'), [], 'or nothing');

  const shelves = createModel();
  const shelf = addFolder(shelves, 'Mechanical').folder;
  addEntity(shelves, 'HAZ', { parent: shelf.id, attributes: { title: 'Crushing' } });
  addEntity(shelves, 'HAZ', { attributes: { title: 'Shearing' } });
  deepEqual(libraryRows(shelves).map(({ node }) => node.id), [shelf.id, 'HAZ-002'], 'a folder is a row like any other');
  deepEqual(libraryRows(shelves, 'mech').map(({ node }) => node.id), [shelf.id, 'HAZ-001'], 'and matches by its name, keeping what it holds');
}

// --- The picks ------------------------------------------------------------------

{
  const picks = new Set();
  equal(checkState(library.model, picks, 'LEG-001'), 'none', 'nothing picked, nothing checked');
  togglePick(library.model, picks, 'ESR-002');
  deepEqual([...picks], ['ESR-002'], 'checking a clause picks it');
  equal(checkState(library.model, picks, 'LEG-001'), 'mixed', 'and its act stands partly checked');
  equal(checkState(library.model, picks, 'ESR-002'), 'checked', 'the clause fully');
  togglePick(library.model, picks, 'LEG-001');
  equal(checkState(library.model, picks, 'LEG-001'), 'checked', 'checking a partly checked act picks all of it');
  equal(picks.size, 1 + childrenOf(library.model, 'LEG-001').length, 'the act and every clause beneath it');
  togglePick(library.model, picks, 'ESR-001');
  equal(checkState(library.model, picks, 'LEG-001'), 'mixed', 'unchecking one clause leaves the act partly checked');
  ok(picks.has('LEG-001'), 'and the act itself still picked');
  togglePick(library.model, picks, 'LEG-001');
  equal(checkState(library.model, picks, 'LEG-001'), 'checked', 'partly checked checks all again');
  togglePick(library.model, picks, 'LEG-001');
  equal(picks.size, 0, 'and checked unpicks all');

  const shelves = createModel();
  const shelf = addFolder(shelves, 'Mechanical').folder;
  addEntity(shelves, 'HAZ', { parent: shelf.id });
  addEntity(shelves, 'HAZ', { parent: shelf.id });
  const held = new Set();
  togglePick(shelves, held, shelf.id);
  deepEqual([...held], ['HAZ-001', 'HAZ-002'], 'checking a folder picks what it holds and never the folder');
  equal(checkState(shelves, held, shelf.id), 'checked', 'and it shows checked');
  equal(checkState(createModel(), held, 'F-9'), 'none', 'a row that is not there is none');
}

// --- The plan and the copy ----------------------------------------------------------

{
  deepEqual(importPlan(library.model, new Set(['ESR-007', 'LEG-002', 'ESR-006'])).map((node) => node.id), ['LEG-002', 'ESR-006', 'ESR-007'], 'the plan is the picks in filing order, whatever the order picked');
  deepEqual(importPlan(library.model, new Set(['ESR-002'])).map((node) => node.id), ['ESR-002'], 'a picked clause brings nothing above it');

  const project = createModel();
  const folder = addFolder(project, 'Legislation').folder;
  const outcome = importInto(project, library.model, new Set(['LEG-001', 'ESR-001', 'ESR-002']), folder.id);
  ok(outcome.ok, 'a copy into a folder succeeds');
  deepEqual(outcome.added, ['LEG-001', 'ESR-001', 'ESR-002'], "the act and its two clauses, with the project's own identifiers");
  equal(outcome.related, 2, 'and the two relationships between them');
  equal(nodeOf(project, 'LEG-001').parent, folder.id, 'the act lands in the folder');
  equal(nodeOf(project, 'ESR-001').parent, 'LEG-001', 'and its clauses beneath the copy of it');
  equal(nodeOf(project, 'ESR-002').attributes.reference, '1.3.7', 'with their attributes');
  ok([...project.relationships.values()].some((held) => held.type === 'leg-contains-esr' && held.source === 'LEG-001' && held.target === 'ESR-002'), 'the copy of the act owns the copy of its clause');

  const again = importInto(project, library.model, new Set(['ESR-003']), 'LEG-001');
  ok(again.ok && again.added.length === 1 && again.related === 0, 'a clause picked alone lands where the user stands, with no relationship to bring');
  equal(nodeOf(project, again.added[0]).parent, 'LEG-001', "under the project's act, since that is what was selected");

  const twice = importInto(project, library.model, new Set(['LEG-001']), null);
  ok(twice.ok, 'the same act again is copied again');
  equal(project.nodes.size, 6, 'nothing is recognised as already there');
  equal(nodeOf(project, twice.added[0]).parent, null, 'and with no selection it lands at the root');
}

{
  const catalogue = createModel();
  const shelf = addFolder(catalogue, 'Elements').folder;
  addEntity(catalogue, 'ELM', { parent: shelf.id, attributes: { title: 'Press' } });
  addEntity(catalogue, 'ELM', { parent: 'ELM-001', attributes: { title: 'Ram' } });
  addEntity(catalogue, 'ELM', { parent: 'ELM-002', attributes: { title: 'Guard' } });
  addEntity(catalogue, 'HAZ', { attributes: { title: 'Crushing' } });
  relate(catalogue, 'elm-decomposes-into-elm', 'ELM-001', 'ELM-002');
  relate(catalogue, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001');

  const project = createModel();
  const outcome = importInto(project, catalogue, new Set(['ELM-001', 'ELM-003']), null);
  ok(outcome.ok, 'a pick with an unpicked entity between succeeds');
  deepEqual(outcome.added, ['ELM-001', 'ELM-002'], 'the two picked elements, the shelf never');
  equal(nodeOf(project, 'ELM-002').parent, 'ELM-001', 'the lower lands under the copy of the nearest picked entity above it');
  equal(outcome.related, 0, 'the relationships to what was not picked stay behind');
  equal(nodeOf(project, 'ELM-002').attributes.title, 'Guard', 'and it is the guard');
}

// --- The preview ------------------------------------------------------------------------

{
  equal(previewValue({ key: 'title', name: 'Title', kind: 'text' }, 'Crushing'), 'Crushing', 'a text shows as stored');
  equal(previewValue({ key: 'title', name: 'Title', kind: 'text' }, ''), null, 'an empty one shows nowhere');
  equal(previewValue({ key: 'technologies', name: 'Technologies', kind: 'set', values: ['Mechanical', 'Hydraulic', 'Electrical'] }, 'Electrical;Mechanical'), 'Mechanical, Electrical', 'a set as its values in the order defined');
  equal(previewValue({ key: 'runs', name: 'Runs', kind: 'table', columns: [] }, [{}, {}]), '2 rows', 'a table as its row count');
  equal(previewValue({ key: 'rating', name: 'Rating', kind: 'computed' }, 'High'), null, 'a computed value shows nowhere');

  const sections = previewSections(nodeOf(library.model, 'ESR-002'));
  deepEqual(sections.map((section) => section.name), ['Requirement', 'Applicability'], "a clause shows a section per tab that holds a value, the first named as the editor's first tab");
  deepEqual(sections[0].fields.map((field) => field.name).slice(0, 3), ['Reference', 'Title', 'Requirement'], "with its attributes in the editor's order");
  const catalogue = createModel();
  const hazard = addEntity(catalogue, 'HAZ', { attributes: { title: 'Crushing', eliminated: 'Yes' } }).entity;
  deepEqual(previewSections(hazard).map((section) => [section.name, section.fields.map((field) => field.value)]), [['Hazard', ['Crushing']], ['Elimination', ['Yes']]], 'a hazard eliminated shows its Elimination tab as a second section');
  deepEqual(previewSections(addEntity(catalogue, 'HAZ', { attributes: { title: 'Shearing' } }).entity).map((section) => section.name), ['Hazard'], 'and a tab holding nothing is left out');
  deepEqual(previewSections(addEntity(catalogue, 'HAZ').entity), [], 'an entity holding nothing shows no section');
}

summary('test-library');
