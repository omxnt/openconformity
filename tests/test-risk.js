/**
 * The risk estimation methods against chapter 6 of the working draft:
 * every cell of every table, read through the scenario's own choice
 * values, so the code and the document cannot drift apart. Run from
 * this directory.
 */

import './shim.js';
import { estimate, METHODS, ESTIMATED, GRAPH, GRAPH_COLUMNS, GRAPH_TREE, graphPath, graphLive, graphBand, SCORING_CLASSES, scoreOf, levelTone, MATRIX, MATRIX_SEVERITY, MATRIX_PROBABILITY } from '../app/modules/risk.js';
import { ATTRIBUTES, attributesFor } from '../app/modules/attributes.js';
import { ok, equal, deepEqual, summary } from './harness.js';

const MATRIX_METHOD = 'Risk matrix (ISO/TR 14121-2:2012, 6.2.2)';
const GRAPH_METHOD = 'Risk graph (ISO/TR 14121-2:2012, 6.3.2)';
const SCORING_METHOD = 'Numerical scoring (ISO/TR 14121-2:2012, 6.4.2)';

const document = readFile('../docs/attributes.md');
const chapter = document.slice(document.indexOf('## 6. Risk estimation'), document.indexOf('## 7. References'));
ok(chapter.length > 0, 'the document carries the risk estimation chapter, before the references');

/** The tables of one section of the chapter, each its header and its rows. */
function tablesOf(title) {
  const start = chapter.indexOf(`### ${title}`);
  ok(start >= 0, `the chapter has a section ${title}`);
  const rest = chapter.slice(start + 1);
  const end = rest.search(/\n### /);
  const held = [];
  let table = null;
  for (const raw of rest.slice(0, end < 0 ? undefined : end).split('\n')) {
    const line = raw.trim();
    if (!line.startsWith('|')) {
      table = null;
      continue;
    }
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.every((cell) => /^-+$/.test(cell))) continue;
    if (!table) {
      table = { header: cells, rows: [] };
      held.push(table);
      continue;
    }
    table.rows.push(cells);
  }
  return held;
}

/** The scenario's own definitions for one method's initial rating, the rationales left aside. */
const rating = (method) =>
  ATTRIBUTES.SCN.groups[0].groups.find((group) => group.name === 'Initial risk estimation' && group.when?.value === method).attributes.filter((definition) => definition.kind !== 'rationale');
const valueStarting = (definition, prefix) => definition.values.find((value) => value.split(' ')[0] === prefix);

deepEqual(
  METHODS,
  attributesFor('PROJECT').find((definition) => definition.key === 'estimationMethod').values,
  'the methods are those the project offers its scenarios, in order'
);
deepEqual(METHODS, [MATRIX_METHOD, GRAPH_METHOD, SCORING_METHOD], "three methods ship, the report's examples, each naming the report and its clause");
ok(!chapter.includes('Hybrid') && !chapter.includes('### 6.4'), "the report's hybrid tool is not transcribed");

// --- Risk matrix, 6.2.2 Table 1 ---------------------------------------------

{
  const [table] = tablesOf('6.1 Risk matrix');
  const severities = table.header.slice(1);
  deepEqual(severities, MATRIX_SEVERITY, 'the severities across, as Table 1 has them');
  deepEqual(table.rows.map((row) => row[0]), MATRIX_PROBABILITY, 'the probabilities down, as Table 1 has them');
  deepEqual(Object.keys(MATRIX), MATRIX_PROBABILITY, 'the estimator keys its rows by them');
  let checked = 0;
  for (const [probability, ...levels] of table.rows) {
    severities.forEach((severity, i) => {
      equal(estimate(MATRIX_METHOD, [severity, probability]), levels[i], `risk matrix: ${severity}, ${probability} is ${levels[i]}`);
      checked += 1;
    });
  }
  equal(checked, 16, 'all sixteen cells of Table 1 are read');
  const [severity, probability] = rating(MATRIX_METHOD);
  deepEqual([severity.values, probability.values], [MATRIX_SEVERITY, MATRIX_PROBABILITY], "the scenario's own values are the matrix's classes, in its order");
  equal(estimate(MATRIX_METHOD, ['Serious', '']), null, 'a missing parameter gives no level');
  equal(estimate(MATRIX_METHOD, [' Serious ', ' Likely ']), 'High', 'values are read trimmed');
  equal(estimate('Hybrid tool', ['Se 4', 'Fr 2', 'Pr 1', 'Av 1']), null, 'a method not known reads nothing');
}

// --- Risk graph, 6.3.2 Figures 3 and 4 --------------------------------------

{
  const [table, bands] = tablesOf('6.2 Risk graph');
  const [s, f, o, a] = rating(GRAPH_METHOD);
  deepEqual([s.values, f.values, o.values, a.values], [['S1', 'S2'], ['F1', 'F2'], ['O1', 'O2', 'O3'], ['A1', 'A2']], "the scenario's own values are the graph's codes, and nothing more");
  const bandOf = (index) => bands.rows.find(([indices]) => indices.split(';').map((held) => held.trim()).includes(String(index)))[1];
  let checked = 0;
  for (const [sf, ...indices] of table.rows) {
    const [S, F] = sf.split(' ');
    table.header.slice(1).forEach((oa, i) => {
      const [O, A] = oa.split(' ');
      const index = Number(indices[i]);
      equal(
        estimate(GRAPH_METHOD, [valueStarting(s, S), valueStarting(f, F), valueStarting(o, O), valueStarting(a, A)]),
        `RI ${index} (${bandOf(index)})`,
        `risk graph: ${sf} ${oa} is ${index}`
      );
      checked += 1;
    });
  }
  equal(checked, 24, 'all twenty-four leaves of Figure 3 are read');
  equal(estimate(GRAPH_METHOD, ['S2', 'F2', 'O3', '']), null, 'a missing parameter gives no index');
  ok(JSON.stringify(GRAPH_TREE).split('"label":"').slice(1).every((held) => /^(Start|[SFOA]\d(, [SFOA]\d)*)"/.test(held)), 'the drawn graph carries the codes alone');
}

// --- Numerical scoring, 6.4.2 Table 2 ---------------------------------------

{
  const [severityClasses, probabilityClasses, table] = tablesOf('6.3 Numerical scoring');
  const classesOf = (held) => held.rows.map(([range, name]) => [Number(range.split(' ')[0]), name]);
  deepEqual(SCORING_CLASSES.severity, classesOf(severityClasses), 'the severity classes are as the document has them, highest first');
  deepEqual(SCORING_CLASSES.probability, classesOf(probabilityClasses), 'and the probability classes');
  const [severity, probability] = rating(SCORING_METHOD);
  deepEqual([severity.min, severity.max, probability.min, probability.max], [0, 100, 0, 100], 'each score runs from 0 to 100');
  for (const [from, to, category] of table.rows) {
    for (const total of [Number(from), Number(to)]) {
      const held = Math.min(100, total);
      equal(estimate(SCORING_METHOD, [String(held), String(total - held)]), `RS ${total} (${category})`, `numerical scoring: ${total} is ${category}`);
    }
  }
  equal(estimate(SCORING_METHOD, ['60', '40']), 'RS 100 (low)', '60 and 40 make 100, low, under the abbreviation the report gives the score');
  equal(estimate(SCORING_METHOD, ['95', '']), null, 'a missing score gives no risk score');
  equal(estimate(SCORING_METHOD, ['95', 'eighty']), null, 'nor does one that is not a number');
  deepEqual(['95', ' 7 ', '', 'Se 4', '-1', '1.5'].map(scoreOf), [95, 7, NaN, NaN, NaN, NaN], 'a score is a whole number and nothing else');
}

// --- The graph as drawn agrees with the graph as tabled ------------------------

{
  let checked = 0;
  for (const [sf, indices] of Object.entries(GRAPH)) {
    const [S, F] = sf.split(' ');
    GRAPH_COLUMNS.forEach((oa, i) => {
      const [O, A] = oa.split(' ');
      const path = graphPath([S, F, O, A]);
      equal(path.length, 5, `the path ${S} ${F} ${O} ${A} runs from the start to a leaf`);
      equal(path.at(-1).index, indices[i], `and the leaf it reaches is index ${indices[i]}`);
      checked += 1;
    });
  }
  equal(checked, 24, 'for every branch of Figure 3');
  const sketch = (node) => (node.children ? `${node.label}(${node.children.map(sketch).join(' ')})` : `${node.label}=${node.index}`);
  equal(
    sketch(GRAPH_TREE),
    'Start(S1(F1, F2(O1, O2(A1, A2=1) O3(A1, A2=2))) S2(F1(O1(A1, A2=2) O2(A1=2 A2=3) O3(A1=3 A2=4)) F2(O1(A1=3 A2=4) O2(A1=4 A2=5) O3(A1=5 A2=6))))',
    'the tree is merged as Figure 3 merges it: F1 with F2 and O1 with O2 under S1, A1 with A2 wherever the index is the same, and nowhere else'
  );
  equal(graphPath(['S2', 'F1', '', '']).length, 3, 'a rating half made follows the graph half way');
  equal(graphPath(['', '', '', '']).length, 1, 'and one not begun stands at the start');
  deepEqual([1, 2, 3, 4, 5, 6].map(graphBand), ['lowest', 'lowest', 'medium', 'medium', 'highest', 'highest'], 'the indices band as 6.3.2 reads them');
  const [S1, S2] = GRAPH_TREE.children;
  const F12 = S1.children[0];
  const [F1] = S2.children;
  ok(graphLive(['', '', '', ''], [S2, F1]), 'with nothing chosen every branch is live');
  ok(graphLive(['S1', '', 'O3', ''], [S1, F12]), 'under the chosen severity a merged branch is live whatever stands below');
  ok(!graphLive(['S1', '', '', ''], [S2]), 'the other severity is not');
  ok(!graphLive(['S2', 'F2', '', ''], [S2, F1]), 'and a single branch not chosen dims its subtree');
}

// --- A level's tone, whichever method said it -------------------------------------

{
  deepEqual(['High', 'RI 5 (highest)', 'RS 175 (high)'].map(levelTone), ['high', 'high', 'high'], "high, in every method's word");
  deepEqual(['Medium', '3 (medium)', '130 (medium)'].map(levelTone), ['medium', 'medium', 'medium'], 'medium');
  deepEqual(['Low', '1 (lowest)', '95 (low)'].map(levelTone), ['low', 'low', 'low'], 'low');
  deepEqual(['Negligible', 'RS 40 (negligible)'].map(levelTone), ['negligible', 'negligible'], "negligible, in the matrix's word and the score's");
  deepEqual([null, '', 'Whatever was typed'].map(levelTone), ['none', 'none', 'none'], 'and none for nothing, or a typed rating');
}

// --- Every method names its source ---------------------------------------------

ok(METHODS.every((method) => /^\w[\w ]+ \(ISO\/TR 14121-2:2012, 6\.\d\.2\)$/.test(method)), 'each method names the report, its year and the clause its example stands in, as a citation after its name, so the choice reads as one wherever it is shown');
deepEqual(ESTIMATED, METHODS, "the estimator knows the project's three methods and no more");

summary('test-risk');
