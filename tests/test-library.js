/**
 * The library function's pure part: the rows a catalogue shows under an
 * expansion and a filter, the checked state of a row over the picks,
 * what an import copies, and the copy into a project where the user
 * stands. Run from this directory.
 */

import './shim.js';
import { libraryRows, checkState, togglePick, carriedBy, importPlan, importInto, previewValue, previewSections } from '../app/modules/library.js';
import { LIBRARIES, catalogueOf } from '../app/library/index.js';
import { loadProject } from '../app/modules/files.js';
import { createModel, addEntity, addFolder, relate, nodeOf, childrenOf } from '../app/modules/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';

ok(LIBRARIES.length >= 1 && LIBRARIES[0].name === 'European legislation' && LIBRARIES[0].date === '2026-09-26', 'the first catalogue is European legislation, dated as the library project is');
const library = loadProject(LIBRARIES[0].project);
ok(library.ok, 'the catalogue passes the gates a project file passes');
equal(nodeOf(library.model, 'LEG-001').parent, null, 'the act stands at the root of its catalogue, lifted out of the folder that was its shelf');
ok(library.model.relationships.size === 215 && [...library.model.relationships.values()].every((held) => held.source === 'LEG-001' && nodeOf(library.model, held.target)), 'and owns every one of its requirements');

{
  const project = { format: 'x', schemaVersion: 1, name: 'lib', attributes: {}, counters: {}, folders: [{ id: 'F-1', name: 'A', parent: null, order: 0 }, { id: 'F-2', name: 'B', parent: null, order: 1 }, { id: 'F-3', name: 'Inner', parent: 'F-2', order: 0 }], entities: [{ id: 'HAZ-001', type: 'HAZ', parent: 'F-1', order: 0, attributes: {} }, { id: 'HAZ-002', type: 'HAZ', parent: 'F-3', order: 0, attributes: {} }, { id: 'ELM-001', type: 'ELM', parent: 'F-2', order: 1, attributes: {} }], relationships: [{ type: 'elm-exhibits-haz', source: 'ELM-001', target: 'HAZ-002' }, { type: 'elm-exhibits-haz', source: 'ELM-001', target: 'HAZ-001' }] };
  const a = catalogueOf(project, 'F-1');
  deepEqual([a.name, a.folders, a.entities.map((e) => [e.id, e.parent]), a.relationships], ['A', [], [['HAZ-001', null]], []], 'a root folder is cut out as a catalogue of its own, named after it, what stood in it at the root, and no relationship to what is outside');
  const b = catalogueOf(project, 'F-2');
  deepEqual([b.folders.map((f) => [f.id, f.parent]), b.entities.map((e) => [e.id, e.parent]), b.relationships.length], [[['F-3', null]], [['HAZ-002', 'F-3'], ['ELM-001', null]], 1], 'a nested folder stays a shelf inside it, and the relationship between two of its entities travels');
}

// --- The rows -----------------------------------------------------------------

{
  deepEqual(libraryRows(library.model).map(({ node, depth, hasChildren, expanded }) => [node.id, depth, hasChildren, expanded]), [['LEG-001', 0, true, false]], 'the tree starts collapsed at its root, the act a row with a chevron');
  deepEqual(libraryRows(library.model, '', new Set(['LEG-001'])).map(({ node }) => node.id), ['LEG-001', 'ESR-001'], 'an expanded act shows its annex');
  deepEqual(libraryRows(library.model, '', new Set(['LEG-001', 'ESR-001'])).map(({ node }) => node.id), ['LEG-001', 'ESR-001', 'ESR-002', 'ESR-004'], 'and an expanded annex its parts');
  const chain = [];
  for (let held = nodeOf(library.model, 'ESR-023'); held; held = nodeOf(library.model, held.parent)) chain.unshift(held.id);
  deepEqual(libraryRows(library.model, 'emergency').map(({ node }) => node.id), chain, 'a filter keeps the matching clause and everything above it, opened');
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
  togglePick(library.model, picks, 'ESR-007');
  deepEqual([...picks], ['ESR-007'], 'checking a clause picks it');
  equal(checkState(library.model, picks, 'ESR-006'), 'mixed', 'and its heading stands partly checked');
  equal(checkState(library.model, picks, 'LEG-001'), 'mixed', 'as does the act, carried as a heading');
  deepEqual([...carriedBy(library.model, picks)].sort(), ['ESR-001', 'ESR-004', 'ESR-005', 'ESR-006', 'LEG-001'], 'a pick carries every heading above it');
  deepEqual([...carriedBy(library.model, picks, false)], [], 'or none with the headings switched off');
  equal(checkState(library.model, picks, 'LEG-001', false), 'mixed', 'the act stays partly checked either way, since a pick stands beneath it');
  equal(checkState(library.model, picks, 'ESR-004', false), 'mixed', 'as does every heading over the pick');
  equal(checkState(library.model, picks, 'ESR-007'), 'checked', 'the clause fully');
  togglePick(library.model, picks, 'ESR-006');
  equal(checkState(library.model, picks, 'ESR-006'), 'checked', 'checking a partly checked heading picks all of it');
  equal(picks.size, 1 + childrenOf(library.model, 'ESR-006').length, 'the heading and every clause beneath it');
  togglePick(library.model, picks, 'ESR-007');
  equal(checkState(library.model, picks, 'ESR-006'), 'mixed', 'unchecking one clause leaves the heading partly checked');
  ok(picks.has('ESR-006'), 'and the heading itself still picked');
  togglePick(library.model, picks, 'ESR-006');
  equal(checkState(library.model, picks, 'ESR-006'), 'checked', 'partly checked checks all again');
  togglePick(library.model, picks, 'ESR-006');
  equal(picks.size, 0, 'and checked unpicks all');
  togglePick(library.model, picks, 'LEG-001');
  equal(picks.size, 216, 'checking the act picks it and all 215 requirements');
  picks.clear();
  const lone = new Set();
  togglePick(library.model, picks, 'ESR-004', true, lone);
  deepEqual([[...picks], [...lone]], [['ESR-004'], ['ESR-004']], 'alone, a part is picked by itself, nothing beneath it, and remembered as lone');
  equal(checkState(library.model, picks, 'ESR-004', true, lone), 'mixed', 'and shows partly checked, since what is beneath it is not');
  deepEqual([...carriedBy(library.model, picks, true, lone)], [], 'a lone pick carries no heading, whatever the switch says');
  deepEqual(importPlan(library.model, picks, true, lone).map((node) => node.id), ['ESR-004'], 'so the plan is the part and nothing else');
  togglePick(library.model, picks, 'ESR-004', true, lone);
  equal(picks.size + lone.size, 0, 'and alone again unpicks it by itself');
  togglePick(library.model, picks, 'ESR-006', false, lone);
  togglePick(library.model, picks, 'ESR-006', true, lone);
  equal(picks.size, childrenOf(library.model, 'ESR-006').length, 'alone on a checked heading drops the heading and keeps its clauses');
  togglePick(library.model, picks, 'ESR-007', true, lone);
  togglePick(library.model, picks, 'ESR-006', false, lone);
  equal(lone.size, 0, 'a plain pick over a lone one takes it into the cascade again');

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
  deepEqual(importPlan(library.model, new Set(['ESR-008', 'ESR-006', 'ESR-007']), false).map((node) => node.id), ['ESR-006', 'ESR-007', 'ESR-008'], 'alone, the plan is the picks in filing order, whatever the order picked');
  deepEqual(importPlan(library.model, new Set(['ESR-007'])).map((node) => node.id), ['LEG-001', 'ESR-001', 'ESR-004', 'ESR-005', 'ESR-006', 'ESR-007'], 'with the headings, a picked clause brings the chain above it, the act first');

  const project = createModel();
  const folder = addFolder(project, 'Legislation').folder;
  const outcome = importInto(project, library.model, new Set(['LEG-001', 'ESR-001', 'ESR-002']), folder.id);
  ok(outcome.ok, 'a copy into a folder succeeds');
  deepEqual(outcome.added, ['LEG-001', 'ESR-001', 'ESR-002'], "the act, its annex and a part, with the project's own identifiers");
  equal(outcome.related, 2, 'and the two relationships from the act to them');
  equal(nodeOf(project, 'LEG-001').parent, folder.id, 'the act lands in the folder');
  equal(nodeOf(project, 'ESR-001').parent, 'LEG-001', 'the annex beneath the copy of the act');
  equal(nodeOf(project, 'ESR-002').parent, 'ESR-001', 'and the part beneath the copy of the annex');
  equal(nodeOf(project, 'ESR-002').attributes.reference, 'Part A', 'with their attributes');
  ok([...project.relationships.values()].some((held) => held.type === 'leg-contains-esr' && held.source === 'LEG-001' && held.target === 'ESR-002'), 'the copy of the act owns the copy of the part');

  const again = importInto(project, library.model, new Set(['ESR-004']), 'LEG-001', false);
  ok(again.ok && again.added.length === 1 && again.related === 0, 'a part picked alone lands where the user stands, with no relationship to bring');
  equal(nodeOf(project, again.added[0]).parent, 'LEG-001', "under the project's act, since that is what was selected");

  const chained = createModel();
  const withHeadings = importInto(chained, library.model, new Set(['ESR-007']), null);
  equal(withHeadings.added.length, 6, 'with the headings a clause brings its chain, the act, the annex, the part and three headings');
  const clause = [...chained.nodes.values()].find((node) => node.attributes?.reference === '1.1.1.');
  equal(nodeOf(chained, clause.parent).attributes.reference, '1.1.', 'and lands under its heading as the catalogue files it');
  equal(nodeOf(chained, withHeadings.added[0]).parent, null, 'the act at the root');
  equal(withHeadings.related, 5, 'the act owning each copied requirement');

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
  const outcome = importInto(project, catalogue, new Set(['ELM-001', 'ELM-003']), null, false);
  ok(outcome.ok, 'a pick with an unpicked entity between succeeds');
  deepEqual(outcome.added, ['ELM-001', 'ELM-002'], 'alone, the two picked elements, the shelf never');
  equal(nodeOf(project, 'ELM-002').parent, 'ELM-001', 'the lower lands under the copy of the nearest copied entity above it');
  equal(outcome.related, 0, 'the relationships to what was not picked stay behind');
  equal(nodeOf(project, 'ELM-002').attributes.title, 'Guard', 'and it is the guard');
  const carried = importInto(createModel(), catalogue, new Set(['ELM-001', 'ELM-003']), null);
  deepEqual([carried.added.length, carried.related], [3, 1], 'with the headings the one between is carried, and the relationship to it travels');
}

// --- The preview ------------------------------------------------------------------------

{
  equal(previewValue({ key: 'title', name: 'Title', kind: 'text' }, 'Crushing'), 'Crushing', 'a text shows as stored');
  equal(previewValue({ key: 'title', name: 'Title', kind: 'text' }, ''), null, 'an empty one shows nowhere');
  equal(previewValue({ key: 'technologies', name: 'Technologies', kind: 'set', values: ['Mechanical', 'Hydraulic', 'Electrical'] }, 'Electrical;Mechanical'), 'Mechanical, Electrical', 'a set as its values in the order defined');
  equal(previewValue({ key: 'runs', name: 'Runs', kind: 'table', columns: [] }, [{}, {}]), '2 rows', 'a table as its row count');
  equal(previewValue({ key: 'rating', name: 'Rating', kind: 'computed' }, 'High'), null, 'a computed value shows nowhere');

  const sections = previewSections(nodeOf(library.model, 'ESR-007'));
  deepEqual(sections.map((section) => [section.name, section.fields.length > 0]), [['Requirement', true], ['Guidance', false], ['Applicability', false], ['Notes', false]], "a clause shows every tab of its type as a section, the first named as the editor's first tab, the empty ones empty");
  deepEqual(sections[0].fields.map((field) => field.name).slice(0, 3), ['Reference', 'Title', 'Requirement'], "with its attributes in the editor's order");
  const catalogue = createModel();
  const hazard = addEntity(catalogue, 'HAZ', { attributes: { title: 'Crushing', eliminated: 'Yes' } }).entity;
  deepEqual(previewSections(hazard).slice(0, 2).map((section) => [section.name, section.fields.map((field) => field.value)]), [['Hazard', ['Crushing']], ['Elimination', ['Yes']]], 'a hazard eliminated shows its Elimination tab as a second section');
  deepEqual(previewSections(addEntity(catalogue, 'HAZ').entity).map((section) => section.fields.length), previewSections(hazard).map(() => 0), 'an entity holding nothing shows the same sections, each empty');
}

summary('test-library');
