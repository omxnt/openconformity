/**
 * The library function's pure part: the rows a catalogue shows under an
 * expansion and a filter, the checked state of a row over the picks,
 * what an import copies, and the copy into a project where the user
 * stands. Run from this directory.
 */

import './shim.js';
import { libraryRows, checkState, togglePick, importPlan, importInto, previewValue, previewSections } from '../app/modules/library.js';
import { LIBRARIES, catalogueOf, ACTS, addressOf } from '../app/library/index.js';
import { loadProject } from '../app/modules/files.js';
import { createModel, addEntity, addFolder, relate, nodeOf, childrenOf } from '../app/modules/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';

// --- V-TST-069 The catalogues the software ships (F-PER-002, F-PER-012) ------

deepEqual(LIBRARIES.map((held) => held.name), ['Project structure', 'European legislation', 'System phases'], 'the software ships three catalogues, the root folders of the library project in their order');
ok(LIBRARIES.every((held) => loadProject(held.project).ok), 'and each passes the gates a project file passes');
const library = loadProject(LIBRARIES.find((held) => held.name === 'European legislation').project);
/** The entity of the legislation catalogue carrying a reference, found as the specification writes it. */
const byRef = (reference) => [...library.model.nodes.values()].find((node) => node.kind === 'entity' && node.attributes.reference === reference);
const MR = byRef('Regulation (EU) 2023/1230').id;
const ANNEX = byRef('Annex III').id;
const PART_A = byRef('Annex III, Part A').id;
const PART_B = byRef('Annex III, Part B').id;
const POINT_1 = byRef('Annex III, Part B, point 1').id;
const HEADING = byRef('Annex III, Part B, point 1.1').id;
const CLAUSE = byRef('Annex III, Part B, point 1.1.1').id;
const NEXT_CLAUSE = byRef('Annex III, Part B, point 1.1.2').id;
const EMERGENCY = byRef('Annex III, Part B, point 1.2.4.3').id;
const acts = [...library.model.nodes.values()].filter((node) => node.kind === 'entity' && node.type === 'LEG');
equal(acts.length, 5, 'five acts stand in the legislation catalogue');
ok(acts.every((act) => act.parent === null), 'each at the root of the catalogue, lifted out of the folder that was its shelf');
ok([...library.model.relationships.values()].every((held) => held.type === 'leg-contains-esr' && nodeOf(library.model, held.source)?.type === 'LEG' && nodeOf(library.model, held.target)), 'and every relationship is an act owning one of its requirements');
equal([...library.model.relationships.values()].filter((held) => held.source === MR).length, 213, 'the Machinery Regulation owning 213');

{
  const project = { format: 'x', schemaVersion: 1, name: 'lib', attributes: {}, counters: {}, folders: [{ id: 'F-1', name: 'A', parent: null, order: 0 }, { id: 'F-2', name: 'B', parent: null, order: 1 }, { id: 'F-3', name: 'Inner', parent: 'F-2', order: 0 }], entities: [{ id: 'HAZ-001', type: 'HAZ', parent: 'F-1', order: 0, attributes: {} }, { id: 'HAZ-002', type: 'HAZ', parent: 'F-3', order: 0, attributes: {} }, { id: 'ELM-001', type: 'ELM', parent: 'F-2', order: 1, attributes: {} }], relationships: [{ type: 'elm-exhibits-haz', source: 'ELM-001', target: 'HAZ-002' }, { type: 'elm-exhibits-haz', source: 'ELM-001', target: 'HAZ-001' }] };
  const a = catalogueOf(project, 'F-1');
  deepEqual([a.name, a.folders, a.entities.map((e) => [e.id, e.parent]), a.relationships], ['A', [], [['HAZ-001', null]], []], 'a root folder is cut out as a catalogue of its own, named after it, what stood in it at the root, and no relationship to what is outside');
  const b = catalogueOf(project, 'F-2');
  deepEqual([b.folders.map((f) => [f.id, f.parent]), b.entities.map((e) => [e.id, e.parent]), b.relationships.length], [[['F-3', null]], [['HAZ-002', 'F-3'], ['ELM-001', null]], 1], 'a nested folder stays a shelf inside it, and the relationship between two of its entities travels');
}

// --- The rows (no requirement) -----------------------------------------------------------

{
  deepEqual(libraryRows(library.model).map(({ node, depth, hasChildren, expanded }) => [node.type, depth, hasChildren, expanded]), acts.map(() => ['LEG', 0, true, false]), 'the tree starts collapsed at its roots, the act a row with a chevron');
  const under = (rows, root) => rows.slice(rows.findIndex(({ node }) => node.id === root)).filter(({ node, depth }, i, held) => i === 0 || held.slice(1, i + 1).every((row) => row.depth > 0)).map(({ node }) => node.id);
  deepEqual(under(libraryRows(library.model, '', new Set([MR])), MR), [MR, ANNEX], 'an expanded act shows its annex');
  deepEqual(under(libraryRows(library.model, '', new Set([MR, ANNEX])), MR), [MR, ANNEX, PART_A, PART_B], 'and an expanded annex its parts');
  const chain = [];
  for (let held = nodeOf(library.model, EMERGENCY); held; held = nodeOf(library.model, held.parent)) chain.unshift(held.id);
  deepEqual(libraryRows(library.model, 'emergency').map(({ node }) => node.id), chain, 'a filter keeps the matching clause and everything above it, opened');
  deepEqual(libraryRows(library.model, 'nothing here'), [], 'or nothing');

  const shelves = createModel();
  const shelf = addFolder(shelves, 'Mechanical').folder;
  addEntity(shelves, 'HAZ', { parent: shelf.id, attributes: { title: 'Crushing' } });
  addEntity(shelves, 'HAZ', { attributes: { title: 'Shearing' } });
  deepEqual(libraryRows(shelves).map(({ node }) => node.id), [shelf.id, 'HAZ-002'], 'a folder is a row like any other');
  deepEqual(libraryRows(shelves, 'mech').map(({ node }) => node.id), [shelf.id, 'HAZ-001'], 'and matches by its name, keeping what it holds');
}

// --- V-TST-070 The picks (F-MOD-010) -----------------------------------------

{
  const picks = new Set();
  equal(checkState(library.model, picks, MR), 'none', 'nothing picked, nothing checked');
  togglePick(library.model, picks, CLAUSE);
  deepEqual([...picks], [CLAUSE], 'checking a clause picks it');
  equal(checkState(library.model, picks, HEADING), 'mixed', 'and its heading stands partly checked');
  equal(checkState(library.model, picks, MR), 'mixed', 'as does the act');
  deepEqual(importPlan(library.model, picks).map((node) => node.id), [CLAUSE], 'and the partly checked headings above it travel nowhere');
  togglePick(library.model, picks, HEADING);
  equal(checkState(library.model, picks, HEADING), 'checked', 'checking a partly checked heading picks all of it');
  equal(picks.size, 1 + childrenOf(library.model, HEADING).length, 'the heading and every clause beneath it');
  togglePick(library.model, picks, CLAUSE);
  equal(checkState(library.model, picks, HEADING), 'checked', 'unchecking one clause leaves the heading checked, since the heading itself still travels');
  ok(picks.has(HEADING), 'and it is still picked');
  togglePick(library.model, picks, HEADING);
  equal(picks.size, 0, 'so clicking it unpicks it and everything beneath');
  togglePick(library.model, picks, CLAUSE);
  equal(checkState(library.model, picks, HEADING), 'mixed', 'a heading not picked over a picked clause shows the dash');
  togglePick(library.model, picks, HEADING);
  equal(checkState(library.model, picks, HEADING), 'checked', 'and clicking the dash picks it with everything beneath');
  togglePick(library.model, picks, HEADING);
  equal(picks.size, 0, 'and the check unpicks all');
  togglePick(library.model, picks, MR);
  equal(picks.size, 214, 'checking the act picks it and all 213 requirements');
  picks.clear();

  togglePick(library.model, picks, PART_B, true);
  deepEqual([...picks], [PART_B], 'Alt picks a part without what is beneath it');
  equal(checkState(library.model, picks, PART_B), 'checked', 'and it shows checked, since it travels');
  equal(checkState(library.model, picks, POINT_1), 'none', 'while what is beneath it shows nothing');
  deepEqual(importPlan(library.model, picks).map((node) => node.id), [PART_B], 'and it travels by itself');
  togglePick(library.model, picks, PART_B, true);
  equal(picks.size, 0, 'Alt again unpicks it by itself');
  togglePick(library.model, picks, HEADING);
  togglePick(library.model, picks, HEADING, true);
  equal(picks.size, childrenOf(library.model, HEADING).length, 'Alt on a checked heading drops the heading and keeps its clauses');

  const shelves = createModel();
  const shelf = addFolder(shelves, 'Mechanical').folder;
  addEntity(shelves, 'HAZ', { parent: shelf.id });
  addEntity(shelves, 'HAZ', { parent: shelf.id });
  const held = new Set();
  togglePick(shelves, held, shelf.id);
  deepEqual([...held], [shelf.id, 'HAZ-001', 'HAZ-002'], 'checking a folder picks it and what it holds');
  equal(checkState(shelves, held, shelf.id), 'checked', 'and it shows checked');
  togglePick(shelves, held, 'HAZ-002');
  equal(checkState(shelves, held, shelf.id), 'mixed', 'unchecking one inside leaves the folder partly checked');
  togglePick(shelves, held, shelf.id);
  equal(held.size, 3, 'and clicking the dash picks the folder with everything in it');
  togglePick(shelves, held, shelf.id);
  equal(held.size, 0, 'and the check unpicks all');
  togglePick(shelves, held, shelf.id, true);
  equal(held.size, 0, 'Alt does nothing on a folder');
  equal(checkState(createModel(), held, 'F-9'), 'none', 'a row that is not there is none');
}

// --- V-TST-071 The plan and the copy (F-MOD-010) -----------------------------

{
  deepEqual(importPlan(library.model, new Set([NEXT_CLAUSE, HEADING, CLAUSE])).map((node) => node.id), [HEADING, CLAUSE, NEXT_CLAUSE], 'the plan is the picks in filing order, whatever the order picked');
  deepEqual(importPlan(library.model, new Set([CLAUSE])).map((node) => node.id), [CLAUSE], 'a picked clause brings nothing above it');

  const project = createModel();
  const folder = addFolder(project, 'Legislation').folder;
  const outcome = importInto(project, library.model, new Set([MR, ANNEX, PART_A]), folder.id);
  ok(outcome.ok, 'a copy into a folder succeeds');
  deepEqual(outcome.added, ['LEG-001', 'ESR-001', 'ESR-002'], "the act, its annex and a part, with the project's own identifiers");
  equal(outcome.related, 2, 'and the two relationships from the act to them');
  equal(nodeOf(project, 'LEG-001').parent, folder.id, 'the act lands in the folder');
  equal(nodeOf(project, 'ESR-001').parent, 'LEG-001', 'the annex beneath the copy of the act');
  equal(nodeOf(project, 'ESR-002').parent, 'ESR-001', 'and the part beneath the copy of the annex');
  equal(nodeOf(project, 'ESR-002').attributes.reference, 'Annex III, Part A', 'with their attributes');
  ok([...project.relationships.values()].some((held) => held.type === 'leg-contains-esr' && held.source === 'LEG-001' && held.target === 'ESR-002'), 'the copy of the act owns the copy of the part');

  const again = importInto(project, library.model, new Set([PART_B]), 'LEG-001');
  ok(again.ok && again.added.length === 1 && again.related === 0, 'a part picked under an unchecked heading lands where the user stands, with no relationship to bring');
  equal(nodeOf(project, again.added[0]).parent, 'LEG-001', "under the project's act, since that is what was selected");

  const chained = createModel();
  const chain = new Set();
  for (let held = nodeOf(library.model, CLAUSE); held && held.kind === 'entity'; held = nodeOf(library.model, held.parent)) chain.add(held.id);
  const withHeadings = importInto(chained, library.model, chain, null);
  equal(withHeadings.added.length, 6, 'checking a clause and every heading above it brings the chain, the act, the annex, the part and three headings');
  const clause = [...chained.nodes.values()].find((node) => node.attributes?.reference === 'Annex III, Part B, point 1.1.1');
  equal(nodeOf(chained, clause.parent).attributes.reference, 'Annex III, Part B, point 1.1', 'and the clause lands under its heading as the catalogue files it');
  equal(nodeOf(chained, withHeadings.added[0]).parent, null, 'the act at the root');
  equal(withHeadings.related, 5, 'the act owning each copied requirement');

  const twice = importInto(project, library.model, new Set([MR]), null);
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
  deepEqual(outcome.added, ['ELM-001', 'ELM-002'], 'the two picked elements, the one between and the shelf never');
  equal(nodeOf(project, 'ELM-002').parent, 'ELM-001', 'the lower lands under the copy of the nearest picked entity above it');
  equal(outcome.related, 0, 'the relationships to what was not picked stay behind');
  equal(nodeOf(project, 'ELM-002').attributes.title, 'Guard', 'and it is the guard');

  const shelved = createModel();
  const withShelf = importInto(shelved, catalogue, new Set([shelf.id, 'ELM-001']), null);
  deepEqual(withShelf.added, ['F-1', 'ELM-001'], 'a picked folder travels as a folder, before what it holds');
  equal(nodeOf(shelved, 'F-1').name, 'Elements', 'with its name');
  equal(nodeOf(shelved, 'ELM-001').parent, 'F-1', 'and the element lands in its copy');
}

// --- V-TST-072 A project structure, folders alone (F-MOD-010) ----------------

{
  const structure = createModel();
  const top = addFolder(structure, 'Project structure').folder;
  const first = addFolder(structure, '1. Legislation and standards', { parent: top.id }).folder;
  addFolder(structure, '1.1. European legislation', { parent: first.id });
  addFolder(structure, '2. System and hazards', { parent: top.id });
  const picks = new Set();
  togglePick(structure, picks, top.id);
  equal(picks.size, 4, 'checking the top folder picks every folder in it');
  deepEqual(importPlan(structure, picks).map((node) => node.name), ['Project structure', '1. Legislation and standards', '1.1. European legislation', '2. System and hazards'], 'and the plan is the folders in filing order');

  const project = createModel();
  const outcome = importInto(project, structure, picks, null);
  ok(outcome.ok, 'folders alone import');
  equal(outcome.added.length, 4, 'all four');
  equal(outcome.related, 0, 'with nothing to relate');
  const copies = outcome.added.map((id) => nodeOf(project, id));
  deepEqual(copies.map((node) => [node.kind, node.name]), [['folder', 'Project structure'], ['folder', '1. Legislation and standards'], ['folder', '1.1. European legislation'], ['folder', '2. System and hazards']], 'as folders with their names');
  equal(copies[1].parent, copies[0].id, 'nested as the catalogue nests them');
  equal(copies[2].parent, copies[1].id, 'two deep');
  equal(copies[3].parent, copies[0].id, 'and beside each other where they stood beside');

  const bare = createModel();
  const alone = importInto(bare, structure, new Set([first.id]), null);
  equal(alone.added.length, 1, 'a folder picked by itself imports as an empty folder');
  deepEqual([nodeOf(bare, alone.added[0]).name, childrenOf(bare, alone.added[0]).length], ['1. Legislation and standards', 0], 'with its name and nothing in it');
}

// --- The preview (no requirement) ------------------------------------------------------------------

{
  equal(previewValue({ key: 'title', name: 'Title', kind: 'text' }, 'Crushing'), 'Crushing', 'a text shows as stored');
  equal(previewValue({ key: 'title', name: 'Title', kind: 'text' }, ''), null, 'an empty one shows nowhere');
  equal(previewValue({ key: 'technologies', name: 'Technologies', kind: 'set', values: ['Mechanical', 'Hydraulic', 'Electrical'] }, 'Electrical;Mechanical'), 'Mechanical, Electrical', 'a set as its values in the order defined');
  equal(previewValue({ key: 'runs', name: 'Runs', kind: 'table', columns: [] }, [{}, {}]), '2 rows', 'a table as its row count');
  equal(previewValue({ key: 'rating', name: 'Rating', kind: 'computed' }, 'High'), null, 'a computed value shows nowhere');

  const sections = previewSections(nodeOf(library.model, CLAUSE));
  deepEqual(sections.map((section) => [section.name, section.fields.length > 0]), [['Requirement', true], ['Guidance', false], ['Applicability', false], ['Notes', false]], "a clause shows every tab of its type as a section, the first named as the editor's first tab, the empty ones empty");
  deepEqual(sections[0].fields.map((field) => field.name).slice(0, 3), ['Reference', 'Title', 'Requirement'], "with its attributes in the editor's order");
  const catalogue = createModel();
  const hazard = addEntity(catalogue, 'HAZ', { attributes: { title: 'Crushing', eliminated: 'Yes' } }).entity;
  deepEqual(previewSections(hazard).slice(0, 2).map((section) => [section.name, section.fields.map((field) => field.value)]), [['Hazard', ['Crushing']], ['Elimination', ['Yes']]], 'a hazard eliminated shows its Elimination tab as a second section');
  deepEqual(previewSections(addEntity(catalogue, 'HAZ').entity).map((section) => section.fields.length), previewSections(hazard).map(() => 0), 'an entity holding nothing shows the same sections, each empty');
}

// --- V-TST-178 The acts the library ships, as About names them (C-PRJ-005, F-PER-012) ---

{
  const filed = LIBRARIES.flatMap((library) => library.project.entities).filter((entity) => entity.type === 'LEG');
  equal(ACTS.length, filed.length, `every act in the library is listed (${ACTS.length})`);
  ok(ACTS.length >= 5, 'five at least, the Machinery Regulation among its neighbours');
  deepEqual(ACTS.map((act) => act.reference), filed.sort((a, b) => a.order - b.order).map((entity) => entity.attributes.reference), 'in the filed order, by the reference the library writes');
  deepEqual(ACTS.map((act) => act.title), filed.map((entity) => entity.attributes.title), 'with the title the library writes');
  ok(ACTS.every((act) => /^https:\/\/eur-lex\.europa\.eu\/eli\/(reg|dir)\/\d{4}\/\d+\/oj$/.test(act.address)), 'each at its permanent address on EUR-Lex');
  const machinery = ACTS.find((act) => act.reference === 'Regulation (EU) 2023/1230');
  deepEqual(machinery, { reference: 'Regulation (EU) 2023/1230', title: 'Machinery Regulation (MR)', address: 'https://eur-lex.europa.eu/eli/reg/2023/1230/oj' }, 'the Machinery Regulation reads like the others');
  equal(addressOf('Directive 2011/65/EU'), 'https://eur-lex.europa.eu/eli/dir/2011/65/oj', 'a directive resolves to its identifier');
  equal(addressOf('Regulation (EC) No 765/2008'), null, 'a reference in neither form gives no address, so the library\'s own link stands in');
}

summary('test-library');
