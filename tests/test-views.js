/**
 * The views as pure descriptions: the risk assessment built from the
 * example project, its sections, columns and cells; the rating columns
 * under a method; and the renderer's pure parts, the text of a cell,
 * the sort and the group edges. The pane itself is driven in the
 * browser. Run from this directory.
 */

import './shim.js';
import { buildRiskView, ratingColumns, ratingCells, RISK_VIEW } from '../app/modules/view-risk.js';
import { buildSafetyView, specifiedFields } from '../app/modules/view-safety.js';
import { ATTRIBUTES } from '../app/modules/attributes.js';
import { asColumn, columnText, cellText, exportText, viewSheets, savedPart, sectionMarkdown, sortRows, groupEdges } from '../app/modules/views.js';
import { VIEWS } from '../app/modules/view-registry.js';
import { EXAMPLE_PROJECT } from '../app/modules/example.js';
import { loadProject } from '../app/modules/files.js';
import { entityLabel } from '../app/modules/queries.js';
import { ok, equal, deepEqual, summary } from './harness.js';

/** The example with no method chosen and no scenario rated, the state these checks describe; the shipped example itself is rated by the risk matrix. */
function unrated() {
  const held = loadProject(EXAMPLE_PROJECT).model;
  held.attributes.estimationMethod = '';
  for (const node of held.nodes.values()) {
    if (node.kind !== 'entity' || node.type !== 'SCN') continue;
    for (const key of Object.keys(node.attributes)) if (/^(initial|residual)/.test(key)) delete node.attributes[key];
  }
  return held;
}
const model = unrated();
const labelOf = (id) => entityLabel(model.nodes.get(id));

// --- The registry (F-VIE-001) ---------------------------------------------

deepEqual(VIEWS.map((view) => [view.id, view.name, typeof view.build]), [['risk', 'Risk assessment', 'function'], ['safety', 'Safety function specification', 'function']], 'the risk assessment, then the safety function specification, each built by a function of the model');
equal(RISK_VIEW.build, buildRiskView, 'registered under its builder');

// --- The risk assessment over the example (F-VIE-001) ----------------------

/** The index of a column by its text and, where it has one, its group. */
const at = (columns, name, group = null) => columns.map(asColumn).findIndex((column) => column.text === name && (column.group ?? null) === group);

{
  const view = buildRiskView(model);
  equal(view.title, 'Risk assessment', 'titled, which names the saved file');
  deepEqual(
    view.sections.map((section) => [section.name, section.tables[0].rows.length]),
    [['All scenarios (4)', 4], ['L-1 Installation (0)', 0], ['L-2 Operation (1)', 1], ['L-3 Maintenance (3)', 3], ['L-4 Decommissioning (0)', 0]],
    'every scenario on the first tab, then each phase holding the scenarios its tasks give rise to, each tab counting its rows in its name'
  );
  ok(view.sections.every((section) => !('lead' in section)), 'and no text above a table, the tab naming what it holds');
  const columns = view.sections[0].tables[0].columns.map(asColumn);
  deepEqual(
    columns.map((column) => [column.text, column.group ?? null]),
    [
      ['Accident scenario', 'Accident scenario'], ['Hazardous event', 'Accident scenario'], ['Potential consequence', 'Accident scenario'],
      ['Single hazards', 'Hazardous situation'], ['System actors', 'Hazardous situation'], ['System tasks', 'Hazardous situation'],
      ['Rating', 'Initial risk estimation'],
      ['Protective measures', 'Risk reduction'],
      ['Rating', 'Residual risk estimation'],
    ],
    'the order the assessment is made in, and only what relates to the scenario directly: the scenario with its event and consequence, its hazardous situation walked from the links, the ratings around the measures reducing its risk; each related column named for its type; with no scenario rated, each rating is one column under its group'
  );
  const row = view.sections[0].tables[0].rows[0];
  equal(row.id, 'SCN-001', 'a row is about its scenario');
  const cell = (name, group = null) => row.cells[at(columns, name, group)];
  deepEqual(cell('Accident scenario', 'Accident scenario'), { entities: ['SCN-001'] }, 'and opens on the scenario itself');
  deepEqual(cell('Single hazards', 'Hazardous situation'), { entities: ['HAZ-001'] }, 'then the hazards contributing to it');
  deepEqual(cell('System actors', 'Hazardous situation'), { entities: ['ACT-001'] }, 'the actors exposed in it');
  deepEqual(cell('System tasks', 'Hazardous situation'), { entities: ['TSK-002'] }, 'the tasks giving rise to it');
  deepEqual([cell('Hazardous event', 'Accident scenario'), cell('Potential consequence', 'Accident scenario')].map((held) => held.lines.length > 0 && held.lines.every((line) => typeof line === 'string')), [true, true], "the scenario's event and consequence as lines of its own text");
  equal(cell('Hazardous event', 'Accident scenario').lines.join('\n'), model.nodes.get('SCN-001').attributes.hazardousEvent.trim(), 'as the scenario holds it');
  deepEqual(cell('Rating', 'Initial risk estimation'), '', 'an unrated initial risk, typed since the example chooses no method, and empty');
  deepEqual(cell('Protective measures', 'Risk reduction'), { entities: ['PRM-001', 'PRM-002', 'PRM-003'] }, 'the measures reducing its risk');
  equal(columns.some((column) => column.text === 'Safety functions'), false, 'and no safety function, which relates to the scenario only through a measure');
  deepEqual(cell('Rating', 'Residual risk estimation'), { lines: ['', model.nodes.get('SCN-001').attributes.evaluation.trim()] }, 'an unrated residual risk likewise, with the evaluation of it beneath');
  equal(view.sections[3].tables[0].rows.map((held) => held.id).join(' '), 'SCN-002 SCN-003 SCN-004', 'Maintenance holds the scenarios its tasks give rise to, in id order');
}

// --- Rated scenarios spread over parameter columns (F-VIE-001) --------------

{
  const rated = unrated();
  Object.assign(rated.attributes, { estimationMethod: 'Risk graph (ISO/TR 14121-2:2012, 6.3.2)' });
  Object.assign(rated.nodes.get('SCN-001').attributes, {
    initialS: 'S2', initialF: 'F2', initialO: 'O3', initialA: 'A2', initialSRationale: 'Amputation is credible at the tool',
    residualS: 'S2', residualF: 'F1', residualO: 'O1', residualA: 'A2',
    evaluation: 'Acceptable.',
  });
  const view = buildRiskView(rated);
  const columns = view.sections[0].tables[0].columns.map(asColumn);
  const initial = at(columns, 'Severity', 'Initial risk estimation');
  deepEqual(
    columns.slice(initial, initial + 5).map((column) => [column.text, column.group, column.narrow === true]),
    [
      ['Severity', 'Initial risk estimation', true],
      ['Exposure', 'Initial risk estimation', true],
      ['Occurrence', 'Initial risk estimation', true],
      ['Avoidance', 'Initial risk estimation', true],
      ['Rating', 'Initial risk estimation', true],
    ],
    "under the project's method, one column per parameter headed by its name, then the rating, and no column for a rationale"
  );
  const first = view.sections[0].tables[0].rows[0].cells;
  deepEqual(first.slice(initial, initial + 4).map((held) => held.code), ['S2', 'F2', 'O3', 'A2'], 'the codes stand in their columns');
  deepEqual([first[initial].title, first[initial].note], ['Severity: S2', 'Amputation is credible at the tool'], 'each with its parameter and value behind it, and the rationale given for it beneath');
  deepEqual([first[initial + 1].title, first[initial + 1].note], ['Exposure: F2', ''], 'and no note where no rationale is given');
  equal(first[initial + 4].outcome.outcome, 'RI 6 (highest)', 'and the rating it comes to');
  equal(first[initial + 4].outcome.tone, 'high', 'with its tone');
  equal(first[at(columns, 'Rating', 'Residual risk estimation')].outcome.outcome, 'RI 2 (lowest)', 'the residual likewise');
  equal(first[at(columns, 'Rating', 'Residual risk estimation')].note, 'Acceptable.', 'with the risk evaluation beneath it');
  const second = view.sections[0].tables[0].rows[1].cells;
  deepEqual(second.slice(initial, initial + 4), [{ code: '', title: '', note: '' }, { code: '', title: '', note: '' }, { code: '', title: '', note: '' }, { code: '', title: '', note: '' }], 'an unrated scenario shows empty cells under the same columns');
  equal(second[initial + 4].outcome.outcome, null, 'and no outcome');
  deepEqual(ratingColumns('Initial risk estimation', 'No such method'), [{ text: 'Rating', group: 'Initial risk estimation', narrow: true }], 'an unknown method gives the rating column alone');
  deepEqual(ratingColumns('Initial risk estimation', 'Risk matrix (ISO/TR 14121-2:2012, 6.2.2)').map((column) => column.text), ['Severity', 'Probability', 'Rating'], 'each method heads its columns by the names of its parameters');
  deepEqual(ratingCells(rated.nodes.get('SCN-001'), 'Initial risk estimation', 'No such method'), [{ outcome: null }], 'and an empty outcome');
  deepEqual(ratingColumns('Initial risk estimation', ''), [{ text: 'Rating', group: 'Initial risk estimation' }], 'with no method chosen the typed rating is one column, wide enough for words');
  const typed = unrated();
  Object.assign(typed.nodes.get('SCN-001').attributes, { initialRating: ' Tolerable ' });
  deepEqual(ratingCells(typed.nodes.get('SCN-001'), 'Initial risk estimation', ''), ['Tolerable'], 'holding what was typed, trimmed');
  deepEqual(ratingCells(typed.nodes.get('SCN-002'), 'Initial risk estimation', ''), [''], 'or nothing');
}

// --- The renderer's pure parts (F-VIE-001) ---------------------------------

equal(columnText('Scenario'), 'Scenario', 'a bare column is its name');
equal(columnText({ text: 'S', title: 'Severity', group: 'Initial risk estimation' }), 'Severity', 'a column exports its full name, its group standing in a row of its own');
equal(columnText({ text: 'V1', sub: 'Emergency Stop Test', group: 'Test' }), 'V1 Emergency Stop Test', 'a sub-line follows');

equal(cellText('plain', labelOf), 'plain', 'text is itself');
equal(cellText({ entities: ['SCN-001', 'HAZ-001'] }, labelOf), 'SCN-001 S-1 Contact with Moving Parts; HAZ-001 H-1 Moving Parts', 'entities read as identifier and label');
equal(cellText({ code: 'S2', title: 'Severity: S2' }, labelOf), 'S2', 'a parameter is its code');
equal(cellText({ outcome: { outcome: '6 (highest)', tone: 'high', parameters: [] } }, labelOf), '6 (highest)', 'a rating is its outcome');
equal(cellText({ outcome: null }, labelOf), '', 'an unrated one is empty');
equal(cellText({ choice: 'Yes' }, labelOf), 'Yes', 'a choice is its value');
equal(cellText({ choices: ['Mechanical', 'Software'] }, labelOf), 'Mechanical; Software', 'a set lists its values');
equal(cellText({ mark: true }, labelOf), 'x', 'a mark is an x');
equal(cellText({ lines: ['a', 'b'] }, labelOf), 'a; b', 'lines join');
equal(cellText(null, labelOf), '', 'nothing is empty');

{
  const rows = [
    { id: 'SCN-002', cells: [{ entities: ['SCN-002'] }, { outcome: { outcome: '2 (lowest)', tone: 'low', parameters: [] } }, 'b'] },
    { id: 'SCN-001', cells: [{ entities: ['SCN-001'] }, { outcome: { outcome: '6 (highest)', tone: 'high', parameters: [] } }, 'a'] },
    { id: 'SCN-003', cells: [{ entities: ['SCN-003'] }, { outcome: null }, ''] },
  ];
  const ids = (sorted) => sorted.map((row) => row.id).join(' ');
  equal(ids(sortRows(rows, null, labelOf)), 'SCN-002 SCN-001 SCN-003', 'no sort keeps the order');
  equal(ids(sortRows(rows, { column: 0, direction: 'asc' }, labelOf)), 'SCN-001 SCN-002 SCN-003', 'entities sort by identifier');
  equal(ids(sortRows(rows, { column: 0, direction: 'desc' }, labelOf)), 'SCN-003 SCN-002 SCN-001', 'and back');
  equal(ids(sortRows(rows, { column: 1, direction: 'asc' }, labelOf)), 'SCN-002 SCN-001 SCN-003', 'ratings sort by their number, the unrated last');
  equal(ids(sortRows(rows, { column: 1, direction: 'desc' }, labelOf)), 'SCN-001 SCN-002 SCN-003', 'the unrated last either way');
  equal(ids(sortRows(rows, { column: 2, direction: 'asc' }, labelOf)), 'SCN-001 SCN-002 SCN-003', 'text sorts as text, the empty last');
  equal(rows[0].id, 'SCN-002', 'the rows given are not reordered');
}

deepEqual(groupEdges(['A', { text: 'b', group: 'G' }, { text: 'c', group: 'G' }, { text: 'd', group: 'H' }, 'E']), ['', 'first', 'last', 'first last', ''], 'a group knows its first and last column, a lone one is both');

// --- Saved as an Excel workbook (F-VIE-001) ----------------------------------

{
  equal(exportText({ entities: ['SCN-001', 'HAZ-001'] }, labelOf), 'SCN-001 S-1 Contact with Moving Parts\nHAZ-001 H-1 Moving Parts', 'entities on lines of their own');
  equal(exportText({ code: 'Serious', title: 'Severity: Serious', note: 'An injury that does not heal.' }, labelOf), 'Serious: An injury that does not heal.', 'a rating value followed by its rationale');
  equal(exportText({ outcome: { outcome: 'Low', tone: 'low', parameters: [] }, note: 'Acceptable.' }, labelOf), 'Low: Acceptable.', 'a rating followed by the evaluation');
  equal(exportText({ code: 'Serious', title: '', note: '' }, labelOf), 'Serious', 'a value alone where no text is given');
  equal(exportText({ outcome: null, note: '' }, labelOf), '', 'an unrated one empty');
  equal(exportText({ lines: ['Crushing.', ''] }, labelOf), 'Crushing.', 'text as written');
  const sheets = viewSheets(buildRiskView(model), labelOf);
  deepEqual(sheets.map((sheet) => [sheet.name, sheet.rows.length]), [['All scenarios (4)', 4], ['L-1 Installation (0)', 0], ['L-2 Operation (1)', 1], ['L-3 Maintenance (3)', 3], ['L-4 Decommissioning (0)', 0]], 'a sheet per tab, named as the tab');
  deepEqual([sheets[0].groups.slice(0, 4), sheets[0].headers.slice(0, 4)], [['Accident scenario', 'Accident scenario', 'Accident scenario', 'Hazardous situation'], ['Accident scenario', 'Hazardous event', 'Potential consequence', 'Single hazards']], 'with the groups and the column names');
  equal(sheets[0].rows[0][0].text, 'SCN-001 S-1 Contact with Moving Parts', 'and each cell as the exports write it');
  const view = buildRiskView(model);
  const whole = savedPart(view, 0);
  deepEqual([whole.filename, whole.built.sections.length], ['Risk assessment.xlsx', 5], 'saved from the first tab, which holds every row, the whole view goes, every tab a sheet');
  const phase = savedPart(view, 3);
  deepEqual([phase.filename, phase.built.sections.map((section) => section.name)], ['Risk assessment - L-3 Maintenance.xlsx', ['L-3 Maintenance (3)']], 'saved from another tab, that tab alone, the file named for it');
}

// --- The safety function specification over the example (F-VIE-001) ---------

{
  const view = buildSafetyView(model);
  deepEqual([view.title, view.exports], ['Safety function specification', ['markdown']], 'titled, and saved as Markdown');
  deepEqual(view.sections.map((section) => section.name), ['All functions (4)', 'SF-1 Emergency Stop', 'SF-2 Door Interlock', 'SF-2.1 Position Detection', 'SF-2.2 Safe Torque Off'], 'a tab holding every function, then a tab each');
  const block = view.sections[1].tables;
  deepEqual(block.map((table) => table.caption), ['Relationships', 'Behaviour', 'Characteristics', 'Fault handling'], 'a function is its relationships and the three tabs that specify it, its diagram and notes left in the editor');
  deepEqual([block[0].heading, block[0].text], ['SAF-001', model.nodes.get('SAF-001').attributes.description.trim()], 'the block opens on the function and its description');
  deepEqual(block[0].rows.map((row) => row.cells[0]), ['Part of', 'Decomposes into', 'Realises', 'Allocated to', 'Expressed by'], 'the relationships named from its side');
  const saf2 = view.sections[2].tables[0].rows;
  deepEqual([saf2[1].cells[1], view.sections[3].tables[0].rows[0].cells[1]], [{ entities: ['SAF-003', 'SAF-004'] }, { entities: ['SAF-002'] }], 'a function lists the functions it decomposes into, and each of those the one it is part of');
  const characteristics = block[2].rows.map((row) => row.cells[0]);
  equal(characteristics.slice(0, 2).join(', '), 'Functional safety standard, Required integrity level', 'the required integrity level stands right after the standard it follows');
  equal(characteristics.filter((name) => name === 'Required integrity level').length, 1, 'once, the variant of the standard in force');
  const group = ATTRIBUTES.SAF.groups.find((held) => held.name === 'Characteristics');
  deepEqual([specifiedFields(group, { standard: 'EN IEC 62061:2021' })[1].key, specifiedFields(group, {})[1].key], ['sil', 'ownLevel'], 'under the other standard the level in SIL, under none the level typed');
  ok(block.every((table) => table.spec && table.sortable === false), 'each table reads as a form, never sorted');
  equal(view.sections[0].tables.length, 16, 'the first tab holds every function, four tables each');
  const text = sectionMarkdown(view, view.sections[1], labelOf);
  ok(text.startsWith('# Safety function specification\n\n## SAF-001 SF-1 Emergency Stop\n\n') && text.includes('### Behaviour\n\n| Field | Value |\n|---|---|\n| Priority | '), 'the Markdown opens on the view, then the function, then its tables');
  deepEqual([savedPart(view, 0, 'md').filename, savedPart(view, 1, 'md').filename], ['Safety function specification.md', 'Safety function specification - SF-1 Emergency Stop.md'], 'saved from the first tab under the view, from a function under its name');
}

summary('test-views');
