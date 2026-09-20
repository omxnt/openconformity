/**
 * The risk estimation methods against chapter 6 of the working draft:
 * every cell of every table, read through the scenario's own choice
 * values, so the code and the document cannot drift apart.
 * Run from this directory.
 */

import './shim.js';
import { estimate, METHODS, ESTIMATED, PL_METHOD, PL_GRAPH, PL_TREE, PL_LEVELS, reducePL, SIL_METHOD, SIL_BANDS, SIL_MATRIX, GRAPH, GRAPH_COLUMNS, GRAPH_TREE, graphPath, graphPick, graphLive, graphBand, SCORING_CLASSES, scoreOf, levelTone } from '../app/risk.js';
import { ATTRIBUTES } from '../app/attributes.js';
import { ok, equal, deepEqual, summary } from './harness.js';

const document = readFile('../attributes.md');
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

/** The scenario's own definitions for one method's initial rating. */
const rating = (method) => ATTRIBUTES.SCN.groups[0].groups.find((group) => group.name === 'Initial risk' && group.when?.value === method).attributes;
const valueStarting = (definition, prefix) => definition.values.find((value) => value.split(' ')[0] === prefix);

deepEqual(
  METHODS,
  ATTRIBUTES.SCN.groups[0].groups[0].attributes.find((definition) => definition.key === 'method').values,
  'the methods are those the scenario offers, in order'
);

// --- Risk matrix, 6.2.2 Table 1 ---------------------------------------------

{
  const [table] = tablesOf('6.1 Risk matrix');
  const severities = table.header.slice(1);
  let checked = 0;
  for (const [probability, ...levels] of table.rows) {
    severities.forEach((severity, i) => {
      equal(estimate('Risk matrix', [severity, probability]), levels[i], `risk matrix: ${severity}, ${probability} is ${levels[i]}`);
      checked += 1;
    });
  }
  equal(checked, 16, 'all sixteen cells of Table 1 are read');
  equal(estimate('Risk matrix', ['Serious', '']), null, 'a missing parameter gives no level');
  equal(estimate('Risk matrix', [' Serious ', ' Likely ']), 'High', 'values are read trimmed');
}

// --- Risk graph, 6.3.2 Figures 3 and 4 --------------------------------------

{
  const [table, bands] = tablesOf('6.2 Risk graph');
  const [s, f, o, a] = rating('Risk graph');
  const bandOf = (index) => bands.rows.find(([indices]) => indices.split(';').map((held) => held.trim()).includes(String(index)))[1];
  let checked = 0;
  for (const [sf, ...indices] of table.rows) {
    const [S, F] = sf.split(' ');
    table.header.slice(1).forEach((oa, i) => {
      const [O, A] = oa.split(' ');
      const index = Number(indices[i]);
      equal(
        estimate('Risk graph', [valueStarting(s, S), valueStarting(f, F), valueStarting(o, O), valueStarting(a, A)]),
        `${index} (${bandOf(index)})`,
        `risk graph: ${sf} ${oa} is ${index}`
      );
      checked += 1;
    });
  }
  equal(checked, 24, 'all twenty-four leaves of Figure 3 are read');
  equal(estimate('Risk graph', ['S2', 'F2', 'O3', '']), null, 'a missing parameter gives no index');
  ok(JSON.stringify(GRAPH_TREE).split('"label":"').slice(1).every((held) => /^(Start|[SFOA]\d(, [SFOA]\d)*)"/.test(held)), 'the drawn graph carries the codes alone');
}

// --- Numerical scoring, 6.4.2 Table 2 ---------------------------------------

{
  const [severityClasses, probabilityClasses, table] = tablesOf('6.3 Numerical scoring');
  const classesOf = (held) => held.rows.map(([range, name]) => [Number(range.split(' ')[0]), name]);
  deepEqual(SCORING_CLASSES.severity, classesOf(severityClasses), 'the severity classes are as the document has them, highest first');
  deepEqual(SCORING_CLASSES.probability, classesOf(probabilityClasses), 'and the probability classes');
  for (const [from, to, category] of table.rows) {
    for (const total of [Number(from), Number(to)]) {
      const severity = Math.min(100, total);
      equal(estimate('Numerical scoring', [String(severity), String(total - severity)]), `${total} (${category})`, `numerical scoring: ${total} is ${category}`);
    }
  }
  equal(estimate('Numerical scoring', ['60', '40']), '100 (low)', '60 and 40 make 100, low');
  equal(estimate('Numerical scoring', ['95', '']), null, 'a missing score gives no risk score');
  equal(estimate('Numerical scoring', ['95', 'eighty']), null, 'nor does one that is not a number');
}

// --- Hybrid tool, 6.5.2 -------------------------------------------------------

{
  const [table] = tablesOf('6.4 Hybrid tool');
  const columns = table.header.slice(1).map((cell) => cell.match(/(\d+) \u2013 (\d+)/).slice(1, 3).map(Number));
  const levelOf = (se, cl) => table.rows.find(([held]) => Number(held) === se)[1 + columns.findIndex(([low, high]) => cl >= low && cl <= high)];
  const [se, fr, pr, av] = rating('Hybrid tool');
  let checked = 0;
  for (const seValue of se.values) {
    for (const frValue of fr.values) {
      for (const prValue of pr.values) {
        for (const avValue of av.values) {
          const cl = [frValue, prValue, avValue].reduce((sum, held) => sum + scoreOf(held), 0);
          const expected = `Cl ${cl} (${levelOf(scoreOf(seValue), cl)})`;
          equal(estimate('Hybrid tool', [seValue, frValue, prValue, avValue]), expected, `hybrid: ${seValue}, ${frValue} + ${prValue} + ${avValue} is ${expected}`);
          checked += 1;
        }
      }
    }
  }
  equal(checked, 240, 'every combination of the four scales is read');
  deepEqual([se.values, fr.values, pr.values, av.values], [['Se 1', 'Se 2', 'Se 3', 'Se 4'], ['Fr 2', 'Fr 3', 'Fr 4', 'Fr 5'], ['Pr 1', 'Pr 2', 'Pr 3', 'Pr 4', 'Pr 5'], ['Av 1', 'Av 3', 'Av 5']], "the scales carry the report's scores alone");
  equal(estimate('Hybrid tool', ['Se 4', 'Fr 2', 'Pr 1', 'Av 1']), 'Cl 4 (medium)', 'the lowest class the scales allow, 4, reads as the lowest column');
}

equal(estimate('Fault tree', ['x']), null, 'a method the report does not describe estimates nothing');

// --- ISO 13849-1's risk graph, Annex A ---------------------------------------

{
  deepEqual(ESTIMATED, [...METHODS, PL_METHOD, SIL_METHOD], "the estimator knows the scenario's four methods and the two standards' levels");
  const [table, reduction] = tablesOf('6.5 Performance level risk graph');
  const [s, f, p, o] = ATTRIBUTES.SAF.groups[2].groups[0].attributes;
  deepEqual(reduction.rows, PL_LEVELS.map((level) => [level, reducePL(level)]), 'a low occurrence reduces each level as the document has it, PL a staying PL a');
  equal(o.values.at(-1), 'Low', 'the occurrence is chosen low');
  let checked = 0;
  for (const [S, F, P, level] of table.rows) {
    equal(PL_GRAPH[`${S} ${F} ${P}`], level, `the graph reads ${S} ${F} ${P} as ${level}, as the document has it`);
    equal(estimate(PL_METHOD, [valueStarting(s, S), valueStarting(f, F), valueStarting(p, P)]), `PL ${level}`, `and estimates PL ${level} from the function's own values`);
    equal(estimate(PL_METHOD, [S, F, P, 'High']), `PL ${level}`, 'a high occurrence leaving it');
    equal(estimate(PL_METHOD, [S, F, P, 'Low']), `PL ${reducePL(level)}`, `a low one reducing it to PL ${reducePL(level)}`);
    const path = graphPath([S, F, P], PL_TREE);
    equal(path.length, 4, `the drawn graph runs ${S} ${F} ${P} from the start to a leaf`);
    equal(path.at(-1).outcome, level, `whose leaf is ${level}`);
    checked += 1;
  }
  equal(checked, 8, 'for all eight branches of Figure A.1');
  equal(estimate(PL_METHOD, ['S2', 'F1', '', 'Low']), null, 'a missing parameter gives no level, whatever the occurrence');
  equal(levelTone('PL e'), 'none', 'a required level wears no tone');
  equal(graphPath(['S1', '', ''], PL_TREE).length, 2, 'a rating begun follows the graph as far as it goes');
  ok(JSON.stringify(PL_TREE).split('"label":"').slice(1).every((held) => /^(Start|[SFP][12])"/.test(held)), 'the drawn graph carries the codes alone');
}

// --- IEC 62061's matrix, Annex A ---------------------------------------------

{
  const [table] = tablesOf('6.6 Safety integrity level matrix');
  deepEqual(
    table.header.slice(1).map((cell) => cell.match(/(\d+)\D+(\d+)/).slice(1, 3).map(Number)),
    SIL_BANDS,
    'the class is banded as the document has it'
  );
  const [se, fr, pr, av] = ATTRIBUTES.SAF.groups[2].groups[1].attributes;
  let checked = 0;
  for (const [severity, ...levels] of table.rows) {
    deepEqual(SIL_MATRIX[Number(severity)], levels, `severity ${severity} reads as the document has it`);
    const seValue = se.values.find((value) => scoreOf(value) === Number(severity));
    for (const frValue of fr.values) {
      for (const prValue of pr.values) {
        for (const avValue of av.values) {
          const cl = scoreOf(frValue) + scoreOf(prValue) + scoreOf(avValue);
          const expected = levels[SIL_BANDS.findIndex(([low, high]) => cl >= low && cl <= high)];
          equal(estimate(SIL_METHOD, [seValue, frValue, prValue, avValue]), expected, `${seValue}, ${frValue} + ${prValue} + ${avValue} is ${expected}`);
          checked += 1;
        }
      }
    }
  }
  equal(checked, 300, 'for every combination of the four scores');
  equal(estimate(SIL_METHOD, ['Se 2', 'Fr 3', 'Pr 4', 'Av 5']), 'SIL 1', 'Se 2 at a class of 12 is SIL 1');
  equal(estimate(SIL_METHOD, ['Se 3', 'Fr 4', 'Pr 5', '']), null, 'a missing score gives no level');
  deepEqual([levelTone('SIL 3'), levelTone('OM'), levelTone('No SIL')], ['none', 'none', 'none'], 'a required level wears no tone');
  deepEqual([scoreOf('Se 4'), scoreOf('4 words after'), scoreOf('95'), scoreOf('Very likely')], [4, 4, 95, NaN], 'a score is read wherever the value holds it');
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
  equal(graphPath(['S2', 'F1', '', '']).length, 3, 'a rating half made follows the graph half way');
  equal(graphPath(['', '', '', '']).length, 1, 'and one not begun stands at the start');
  deepEqual([1, 2, 3, 4, 5, 6].map(graphBand), ['lowest', 'lowest', 'medium', 'medium', 'highest', 'highest'], 'the indices band as 6.3.2 reads them');
}

// --- Picking in the graph: a branch decides its level and every single ancestor ---

{
  const [S1, S2] = GRAPH_TREE.children;
  const F12 = S1.children[0];
  const O12 = F12.children[0];
  const [F1, F2] = S2.children;
  const O2 = F1.children[1];
  const none = ['', '', '', ''];
  deepEqual(graphPick(none, [S2, F1, O2], 'A2'), ['S2', 'F1', 'O2', 'A2'], 'a leaf under single branches decides the whole rating');
  deepEqual(graphPick(none, [S1, F12], 'O3'), ['S1', '', 'O3', ''], 'a merged ancestor is left undecided: F1 or F2 is still to pick');
  deepEqual(graphPick(['S2', 'F1', 'O2', 'A2'], [S2], 'F2'), ['S2', 'F2', 'O2', 'A2'], 'picking a branch above keeps what stands below it');
  deepEqual(graphPick(['S1', 'F2', 'O1', 'A1'], [S2, F1], 'O2'), ['S2', 'F1', 'O2', 'A1'], 'and moving to the other severity carries its single ancestors along');
  ok(graphLive(none, [S2, F1]), 'with nothing chosen every branch is live');
  ok(graphLive(['S1', '', 'O3', ''], [S1, F12]), 'under the chosen severity a merged branch is live whatever stands below');
  ok(!graphLive(['S1', '', '', ''], [S2]), 'the other severity is not');
  ok(graphLive(['S1', 'F2', '', ''], [S1, F12, O12]), 'a merged branch carrying the chosen code keeps its subtree live');
  ok(!graphLive(['S2', 'F2', '', ''], [S2, F1]), 'and a single branch not chosen dims its subtree');
}

// --- A level's tone, whichever method said it -------------------------------------

{
  deepEqual(['High', '5 (highest)', '175 (high)', 'Cl 11 (high)'].map(levelTone), ['high', 'high', 'high', 'high'], 'high, in every method\'s word');
  deepEqual(['Medium', '3 (medium)', 'Cl 9 (medium)'].map(levelTone), ['medium', 'medium', 'medium'], 'medium');
  deepEqual(['Low', '1 (lowest)', '95 (low)'].map(levelTone), ['low', 'low', 'low'], 'low');
  deepEqual(['Negligible', '40 (negligible)', null, ''].map(levelTone), ['none', 'none', 'none', 'none'], 'and none for negligible or nothing');
}

summary('test-risk');
