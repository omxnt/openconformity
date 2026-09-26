/**
 * The views as pure descriptions: the risk assessment built from the
 * example project, its sections, columns and cells; the rating columns
 * under a method; and the renderer's pure parts, the text of a cell,
 * the sort and the group edges. The pane itself is driven in the
 * browser. Run from this directory.
 */

import './shim.js';
import { buildRiskView, ratingColumns, ratingCells, RISK_VIEW } from '../app/modules/view-risk.js';
import { VIEWS, asColumn, columnText, cellText, sortRows, groupEdges } from '../app/modules/views.js';
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

// --- The registry ---------------------------------------------------------

deepEqual(VIEWS.map((view) => [view.id, view.name, typeof view.build]), [['risk', 'Risk assessment', 'function']], 'the first view is the risk assessment, built by a function of the model');
equal(RISK_VIEW.build, buildRiskView, 'registered under its builder');

// --- The risk assessment over the example ----------------------------------

/** The index of a column by its text and, where it has one, its group. */
const at = (columns, name, group = null) => columns.map(asColumn).findIndex((column) => column.text === name && (column.group ?? null) === group);

{
  const view = buildRiskView(model);
  equal(view.title, 'Risk assessment', 'titled for print');
  deepEqual(
    view.sections.map((section) => [section.name, section.tables[0].rows.length]),
    [['All scenarios (4)', 4], ['L-1 Installation (0)', 0], ['L-2 Operation (1)', 1], ['L-3 Maintenance (3)', 3], ['L-4 Decommissioning (0)', 0]],
    'every scenario on the first tab, then each phase holding the scenarios its tasks give rise to, each tab counting its rows in its name'
  );
  ok(view.sections.every((section) => typeof section.lead === 'string' && section.lead.length > 0), 'each section says what it holds');
  const columns = view.sections[0].tables[0].columns.map(asColumn);
  deepEqual(
    columns.map((column) => [column.text, column.group ?? null]),
    [
      ['Accident scenario', null],
      ['Hazards', 'Arises from'], ['Exposed persons', 'Arises from'], ['Tasks', 'Arises from'],
      ['Rating', 'Initial risk estimation'],
      ['Protective measures', 'Risk reduction'], ['Safety functions', 'Risk reduction'],
      ['Rating', 'Residual risk estimation'],
    ],
    'an index: the scenario as the subject, what it arises from walked from the links, then the ratings around what reduces it, and nothing an entity says for itself; with no scenario rated, each rating is one column under its group'
  );
  const row = view.sections[0].tables[0].rows[0];
  equal(row.id, 'SCN-001', 'a row is about its scenario');
  const cell = (name, group = null) => row.cells[at(columns, name, group)];
  deepEqual(cell('Accident scenario'), { entities: ['SCN-001'] }, 'and opens on the scenario itself');
  deepEqual(cell('Hazards', 'Arises from'), { entities: ['HAZ-001'] }, 'then the hazards contributing to it');
  deepEqual(cell('Exposed persons', 'Arises from'), { entities: ['ACT-001'] }, 'the actors exposed in it');
  deepEqual(cell('Tasks', 'Arises from'), { entities: ['TSK-002'] }, 'the tasks giving rise to it');
  equal(at(columns, 'Hazardous event'), -1, "and nothing of the scenario's own prose, which the editor holds");
  deepEqual(cell('Rating', 'Initial risk estimation'), '', 'an unrated initial risk, typed since the example chooses no method, and empty');
  deepEqual(cell('Protective measures', 'Risk reduction'), { entities: ['PRM-001', 'PRM-002', 'PRM-003'] }, 'the measures reducing its risk');
  deepEqual(cell('Safety functions', 'Risk reduction'), { entities: ['SAF-001', 'SAF-002'] }, 'the safety functions realising them');
  equal(at(columns, 'System requirements', 'Risk reduction'), -1, 'and no requirements or verifications, which are traceability for other views');
  deepEqual(cell('Rating', 'Residual risk estimation'), '', 'an unrated residual risk likewise');
  equal(at(columns, 'Risk evaluation', 'Residual risk estimation'), -1, 'and no evaluation, the editor holding it');
  equal(view.sections[3].tables[0].rows.map((held) => held.id).join(' '), 'SCN-002 SCN-003 SCN-004', 'Maintenance holds the scenarios its tasks give rise to, in id order');
}

// --- Rated scenarios spread over parameter columns --------------------------

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
  const initial = at(columns, 'S', 'Initial risk estimation');
  deepEqual(
    columns.slice(initial, initial + 5).map((column) => [column.text, column.title ?? null, column.group, column.narrow === true]),
    [
      ['S', 'Severity', 'Initial risk estimation', true],
      ['F', 'Exposure', 'Initial risk estimation', true],
      ['O', 'Occurrence', 'Initial risk estimation', true],
      ['A', 'Avoidance', 'Initial risk estimation', true],
      ['Rating', null, 'Initial risk estimation', true],
    ],
    "under the project's method, one narrow column per parameter headed by its letters, the name behind, then the rating, and no column for a rationale"
  );
  const first = view.sections[0].tables[0].rows[0].cells;
  deepEqual(first.slice(initial, initial + 4).map((held) => held.code), ['S2', 'F2', 'O3', 'A2'], 'the codes stand in their columns');
  equal(first[initial].title, 'Severity: S2\nAmputation is credible at the tool', 'each with its parameter and value behind it, and the rationale given for it beneath');
  equal(first[initial + 1].title, 'Exposure: F2', 'or the parameter and value alone where none is made');
  equal(first[initial + 4].outcome.outcome, 'RI 6 (highest)', 'and the rating it comes to');
  equal(first[initial + 4].outcome.tone, 'high', 'with its tone');
  equal(first[at(columns, 'Rating', 'Residual risk estimation')].outcome.outcome, 'RI 2 (lowest)', 'the residual likewise');
  const second = view.sections[0].tables[0].rows[1].cells;
  deepEqual(second.slice(initial, initial + 4), [{ code: '', title: '' }, { code: '', title: '' }, { code: '', title: '' }, { code: '', title: '' }], 'an unrated scenario shows empty cells under the same columns');
  equal(second[initial + 4].outcome.outcome, null, 'and no outcome');
  deepEqual(ratingColumns('Initial risk estimation', 'No such method'), [{ text: 'Rating', group: 'Initial risk estimation', narrow: true }], 'an unknown method gives the rating column alone');
  deepEqual(ratingColumns('Initial risk estimation', 'Risk matrix (ISO/TR 14121-2:2012, 6.2.2)').map((column) => column.text), ['S', 'P', 'Rating'], 'a method whose values are words heads its columns by the initial of the name');
  deepEqual(ratingColumns('Initial risk estimation', 'Numerical scoring (ISO/TR 14121-2:2012, 6.4.2)').map((column) => column.text), ['SS', 'PS', 'Rating'], "and one whose values are numbers by the initials of the name, as the report abbreviates them");
  deepEqual(ratingCells(rated.nodes.get('SCN-001'), 'Initial risk estimation', 'No such method'), [{ outcome: null }], 'and an empty outcome');
  deepEqual(ratingColumns('Initial risk estimation', ''), [{ text: 'Rating', group: 'Initial risk estimation' }], 'with no method chosen the typed rating is one column, wide enough for words');
  const typed = unrated();
  Object.assign(typed.nodes.get('SCN-001').attributes, { initialRating: ' Tolerable ' });
  deepEqual(ratingCells(typed.nodes.get('SCN-001'), 'Initial risk estimation', ''), ['Tolerable'], 'holding what was typed, trimmed');
  deepEqual(ratingCells(typed.nodes.get('SCN-002'), 'Initial risk estimation', ''), [''], 'or nothing');
  ok(buildRiskView(typed).sections[0].lead.includes('typed with no method chosen'), 'and the lead says so');
}

// --- The renderer's pure parts ---------------------------------------------

equal(columnText('Scenario'), 'Scenario', 'a bare column is its name');
equal(columnText({ text: 'S', title: 'Severity', group: 'Initial risk estimation' }), 'Initial risk estimation · Severity', 'a grouped column exports its group and full name');
equal(columnText({ text: 'V1', sub: 'Emergency Stop Test', group: 'Test' }), 'Test · V1 · Emergency Stop Test', 'a sub-line follows');

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

summary('test-views');
