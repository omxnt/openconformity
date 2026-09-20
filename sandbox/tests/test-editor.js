/**
 * Exercises the editor logic that needs no page: whether a draft differs
 * from the entity it edits. The rendered editor is checked in the
 * browser. Run from this directory.
 */

import { draftChanged, linkable, ratingView, codeShown, firstTabName, setValues, joinSet } from '../app/editor.js';
import { ATTRIBUTES, attributesFor, groupsOf } from '../app/attributes.js';
import { ok, equal, deepEqual, summary } from './harness.js';

const definitions = attributesFor('ELM');

equal(draftChanged(definitions, {}, {}), false, 'an empty draft over an empty entity is clean');
equal(draftChanged(definitions, {}, { title: '' }), false, 'an empty field over an unset key is clean: absence stands for the empty value');
equal(draftChanged(definitions, { title: 'Mixer' }, { title: 'Mixer' }), false, 'matching values are clean');
equal(draftChanged(definitions, { title: 'Mixer' }, { title: 'Blender' }), true, 'a changed value is a change');
equal(draftChanged(definitions, {}, { title: 'Mixer' }), true, 'a value typed over an unset key is a change');
equal(draftChanged(definitions, { title: 'Mixer' }, { title: '' }), true, 'an emptied value is a change');
equal(draftChanged(definitions, { title: 'Mixer' }, {}), true, 'a field missing from the draft stands for emptying it');
equal(
  draftChanged(definitions, { title: 'Mixer', legacy: 'kept as written' }, { title: 'Mixer' }),
  false,
  'a key the editor does not present never makes a draft dirty'
);
equal(draftChanged([], { title: 'Mixer' }, {}), false, 'with no definitions there is nothing to change');

// --- A hyperlink is presented as a link only when it is a web address ----

equal(linkable('https://eur-lex.europa.eu/eli/reg/2023/1230/oj'), true, 'an https address is followable');
equal(linkable('http://example.org'), true, 'so is http');
equal(linkable('  https://example.org  '), true, 'surrounding space is not the value');
equal(linkable('javascript:alert(1)'), false, 'a javascript value is never armed by rendering it');
equal(linkable('mailto:info@openconformity.org'), false, 'nor is any other scheme followed');
equal(linkable('eur-lex.europa.eu'), false, 'a bare host is text until it says its scheme');
equal(linkable(''), false, 'and an empty value is nothing');

// --- What a type's form holds ---------------------------------------------

{
  deepEqual(
    attributesFor('SCN'),
    [...ATTRIBUTES.SCN.attributes, ...groupsOf('SCN').flatMap((group) => group.attributes)],
    'a type flattens to its ungrouped table, then its groups in render order, sub-groups after their group'
  );
  const keys = (code) => attributesFor(code).map((definition) => definition.key);
  const groups = (code) => ATTRIBUTES[code].groups.map((group) => group.name);

  deepEqual(
    ATTRIBUTES.LEG.attributes.map((definition) => definition.key),
    ['reference', 'title', 'link'],
    'a legislation reads its act with no heading over it'
  );
  deepEqual(groups('LEG'), ['Applicability', 'Notes'], 'then whether it applies, then the notes');
  equal(ATTRIBUTES.LEG.groups[0].tab, true, 'on a tab of its own');
  deepEqual(
    ['LEG', 'ESR', 'HST', 'OSP', 'ELM', 'ACT', 'PHS', 'SCN', 'PRM', 'SAF', 'REQ', 'VER', 'HSR', 'OSR', 'HAZ', 'TSK', 'CAS', 'NTB'].map(firstTabName),
    ['Legislation', 'Requirement', 'Standard', 'Specification', 'Element', 'Actor', 'Phase', 'Scenario', 'Measure', 'Function', 'Requirement', 'Verification', 'Requirement', 'Requirement', 'Hazard', 'Task', 'Assessment', 'Body'],
    'the first tab is named for the type, by the last word of its name'
  );
  equal(firstTabName('XYZ'), 'Description', 'a type the metamodel does not know falls back');
  deepEqual(
    Object.entries(ATTRIBUTES).flatMap(([code, type]) => type.groups.filter((group) => group.tab && group.name !== 'Notes').map((group) => `${code}:${group.name}`)),
    ['LEG:Applicability', 'HST:Applicability', 'OSP:Applicability', 'SCN:Risk', 'SAF:Behaviour', 'SAF:Faults', 'SAF:Characteristics', 'ESR:Applicability', 'HSR:Applicability', 'OSR:Applicability'],
    "the tabs in the model beside the notes: every verdict, a scenario's risk, a safety function's behaviour, faults and characteristics"
  );
  for (const [code, type] of Object.entries(ATTRIBUTES)) {
    const last = type.groups.at(-1);
    ok(last.tab === true && last.name === 'Notes', `${code} closes on a Notes tab`);
    deepEqual(last.attributes, [{ key: 'notes', name: 'Notes', kind: 'multiline' }], `${code}'s notes are one multiline field`);
  }

  deepEqual(
    ATTRIBUTES.SAF.attributes.map((definition) => definition.key),
    ['reference', 'title', 'description', 'relevantStandards'],
    'a safety function reads what it is: its designation, title, description, and the standards that apply'
  );
  equal(ATTRIBUTES.SAF.attributes[0].name, 'Designation', 'the reference a safety function carries is its designation');
  deepEqual(groups('SAF'), ['Behaviour', 'Faults', 'Characteristics', 'Notes'], 'then what it does, what it does when it fails, what it must achieve, and its notes, each a tab');
  deepEqual(
    ATTRIBUTES.SAF.groups[0].attributes.map((definition) => definition.key),
    ['priority', 'operatingMode', 'trigger', 'reaction', 'safeState', 'restart'],
    'behaviour as a state machine: its priority and the context it is armed in, the path from trigger to safe state, and the way out again'
  );
  deepEqual(
    ATTRIBUTES.SAF.groups[1].attributes.map((definition) => [definition.key, definition.name]),
    [['faultDetection', 'Fault detection'], ['faultHandling', 'Reaction to faults'], ['faultIndication', 'Fault indication'], ['powerLoss', 'Power loss behaviour']],
    'fault handling, the story of a fault: detected, reacted to, indicated, and the reaction to losing power'
  );
  deepEqual(
    ATTRIBUTES.SAF.groups[2].attributes.map((definition) => definition.key),
    ['standard', 'responseTime', 'faultReactionTime', 'demandRate', 'technology', 'interfaces'],
    'characteristics, every quantity and interface: the standard first, the two timings side by side, demand, technology, interfaces'
  );
  const characteristics = ATTRIBUTES.SAF.groups[2];
  deepEqual(
    characteristics.groups.map((group) => `${group.name} | ${group.when.key} = ${group.when.value}`),
    ['Integrity level | standard = EN ISO 13849-1', 'Integrity level | standard = EN IEC 62061'],
    'the integrity level is one slot waiting on the design standard: read by the graph under ISO 13849-1, by the matrix under IEC 62061'
  );
  equal(characteristics.attributes[0].name, 'Design standard', 'the standard is the one the function is designed to');
  deepEqual(
    characteristics.groups[0].attributes.map((definition) => [definition.key, definition.kind]),
    [['plS', 'choice'], ['plF', 'choice'], ['plP', 'choice'], ['plO', 'choice'], ['plr', 'computed']],
    'the performance level is read from S, F and P, and the probability of occurrence'
  );
  equal(characteristics.groups[0].attributes.at(-1).method, 'PL risk graph', "by ISO 13849-1's risk graph");
  deepEqual(
    characteristics.groups[0].attributes.slice(0, 4).map((definition) => definition.values),
    [['S1', 'S2'], ['F1', 'F2'], ['P1', 'P2'], ['High', 'Low']],
    "the parameters carry the standard's codes alone"
  );
  deepEqual(
    characteristics.groups[1].attributes.map((definition) => [definition.key, definition.kind]),
    [['silSe', 'choice'], ['silFr', 'choice'], ['silPr', 'choice'], ['silAv', 'choice'], ['sil', 'computed']],
    'the safety integrity level is read from Se, Fr, Pr and Av'
  );
  equal(characteristics.groups[1].attributes.at(-1).method, 'SIL matrix', "by IEC 62061's matrix");
  deepEqual(
    characteristics.groups[1].attributes.slice(0, 4).map((definition) => definition.values),
    [['Se 1', 'Se 2', 'Se 3', 'Se 4'], ['Fr 1', 'Fr 2', 'Fr 3', 'Fr 4', 'Fr 5'], ['Pr 1', 'Pr 2', 'Pr 3', 'Pr 4', 'Pr 5'], ['Av 1', 'Av 3', 'Av 5']],
    "as the standard's scores, and no more"
  );
  deepEqual(
    ratingView(characteristics.groups[0].attributes, { plS: 'S1', plF: 'F2', plP: 'P1' }),
    {
      outcome: 'PL b',
      tone: 'none',
      parameters: [
        { name: 'Severity of injury', value: 'S1', code: 'S1' },
        { name: 'Frequency and exposure', value: 'F2', code: 'F2' },
        { name: 'Possibility of avoidance', value: 'P1', code: 'P1' },
        { name: 'Probability of occurrence', value: '', code: '' },
      ],
    },
    'S1 F2 P1 reads as PL b, in no tone: a required level is neither good nor bad; the occurrence unset reduces nothing'
  );
  equal(ratingView(characteristics.groups[0].attributes, { plS: 'S1', plF: 'F2', plP: 'P1', plO: 'Low' }).outcome, 'PL a', 'and as PL a where the probability of occurrence is low');
  equal(ratingView(characteristics.groups[1].attributes, { silSe: 'Se 2', silFr: 'Fr 3', silPr: 'Pr 4', silAv: 'Av 5' }).outcome, 'SIL 1', 'Se 2 at a class of 12 reads as SIL 1');
  const technology = attributesFor('SAF').find((definition) => definition.key === 'technology');
  deepEqual(
    [technology.kind, technology.values],
    ['set', ['Mechanical', 'Hydraulic', 'Pneumatic', 'Electrical', 'Electronic', 'Software']],
    "the technologies are a set of those ISO 13849-1 names in its scope, software for the programmable electronic"
  );
  deepEqual(setValues(technology, 'Electrical; Pneumatic'), ['Pneumatic', 'Electrical'], 'a stored set reads in the listed order, whatever order it was stored in');
  deepEqual(setValues(technology, ' Electrical ;Hydraulics; Firmware'), ['Electrical'], 'trimmed, and only what the set offers');
  deepEqual([setValues(technology, ''), setValues(technology, undefined)], [[], []], 'nothing stored is nothing chosen');
  equal(joinSet(technology, new Set(['Software', 'Electrical'])), 'Electrical; Software', 'and joins back in the listed order');
  equal(joinSet(technology, []), '', 'nothing chosen stores nothing, so the key is dropped');
  for (const code of ['LEG', 'HST', 'OSP']) {
    deepEqual(
      ATTRIBUTES[code].attributes.map((definition) => definition.key),
      ['reference', 'title', 'link'],
      `${code} reads as a published document with no heading over it: what it is and where it lives`
    );
  }
  for (const code of ['ESR', 'HSR', 'OSR']) {
    deepEqual(
      ATTRIBUTES[code].attributes.map((definition) => definition.key),
      ['reference', 'title', 'requirement'],
      `${code} reads as a requirement with no heading over it: its citation and its text`
    );
  }
  for (const code of ['LEG', 'HST', 'OSP', 'ESR', 'HSR', 'OSR']) {
    equal(groups(code)[0], 'Applicability', `${code} then judges applicability apart`);
    equal(ATTRIBUTES[code].groups[0].tab, true, `${code}'s judgement is a tab of its own`);
    deepEqual(ATTRIBUTES[code].groups[0].attributes.map((definition) => definition.key), ['applicable', 'rationale'], `${code} holds the verdict with its reasoning there`);
  }

  deepEqual(
    ATTRIBUTES.SCN.attributes.map((definition) => definition.key),
    ['title', 'hazardZone', 'hazardousEvent', 'consequence'],
    'a scenario reads where, what happens, and what it leads to'
  );
  const estimation = ATTRIBUTES.SCN.groups[0];
  ok(ATTRIBUTES.SCN.groups.length === 2 && estimation.name === 'Risk' && estimation.tab === true, 'then rates its risk on a tab of its own, before its notes');
  deepEqual(estimation.attributes.map((definition) => [definition.key, definition.name, definition.values]), [['standard', 'Estimation standard', ['ISO/TR 14121-2']]], 'the tab opens on the estimation standard');
  deepEqual(
    estimation.groups[0],
    { name: 'Estimation method', when: { key: 'standard', value: 'ISO/TR 14121-2' }, attributes: [{ key: 'method', name: 'Estimation method', kind: 'choice', values: ['Risk matrix', 'Risk graph', 'Numerical scoring', 'Hybrid tool'] }] },
    "and the method beside it, offered under the report whose methods they are"
  );
  const ratings = estimation.groups.filter((group) => group.when?.key === 'method');
  deepEqual(
    estimation.groups.map((group) => (group.when ? `${group.name} | ${group.when.key} = ${group.when.value}` : group.name)),
    [
      'Estimation method | standard = ISO/TR 14121-2',
      ...['Risk matrix', 'Risk graph', 'Numerical scoring', 'Hybrid tool'].map((method) => `Initial risk | method = ${method}`),
      ...['Risk matrix', 'Risk graph', 'Numerical scoring', 'Hybrid tool'].map((method) => `Residual risk | method = ${method}`),
      'Protective measures',
    ],
    'the method, the initial ratings, then the residual ones, each shown only under its method, then the measures beneath the two'
  );
  for (const group of ratings) {
    const last = group.attributes.at(-1);
    ok(last.kind === 'computed' && last.method === group.when.value, `${group.name} under ${group.when.value} closes on what the rating comes to, read by that method`);
    ok(group.attributes.slice(0, -1).every((definition) => definition.kind !== 'computed'), `with the parameters before it, under ${group.when.value}`);
  }
  const measures = estimation.groups.find((group) => group.name === 'Protective measures').attributes;
  deepEqual(measures, [{ key: 'measures', name: 'Measures in place for the residual risk', kind: 'related', relationship: 'prm-reduces-risk-of-scn' }], 'the measures are the ones that reduce the risk of the scenario, in place when the residual risk is rated');
  deepEqual(groupsOf('SCN').map((group) => group.name).slice(0, 3), ['Risk', 'Estimation method', 'Initial risk'], 'the groups walk in render order, sub-groups after their group');


  const scores = ratings.find((group) => group.when.value === 'Numerical scoring').attributes.filter((definition) => definition.kind === 'number');
  deepEqual(scores.map((definition) => [definition.min, definition.max]), [[0, 100], [0, 100]], 'the two scores run from 0 to 100');

  const graph = ratings.find((group) => group.name === 'Initial risk' && group.when.value === 'Risk graph').attributes;
  deepEqual(
    ratingView(graph, { initialS: 'S2', initialF: 'F2', initialO: 'O2', initialA: 'A2' }),
    {
      outcome: '5 (highest)',
      tone: 'high',
      parameters: [
        { name: 'Severity of harm', value: 'S2', code: 'S2' },
        { name: 'Frequency and duration of exposure', value: 'F2', code: 'F2' },
        { name: 'Probability of occurrence of a hazardous event', value: 'O2', code: 'O2' },
        { name: 'Possibility of avoidance', value: 'A2', code: 'A2' },
      ],
    },
    'a rating reads as what it comes to, its tone, and its parameters by name, each with the code it shows'
  );
  deepEqual(
    ['K1 word', '4 words after', 'Se 4', 'Very likely', 'Catastrophic', '95', '', ' Low ', undefined].map(codeShown),
    ['K1', '4', 'Se 4', 'Very likely', 'Catastrophic', '95', '', 'Low', ''],
    "a code is a value's first word, and its second where the first holds no digit"
  );
  const half = ratingView(graph, { initialS: 'S2', initialF: ' F2 ' });
  equal(half.outcome, null, 'a rating half made comes to nothing yet');
  equal(half.tone, 'none', 'and wears no tone');
  deepEqual(half.parameters.map((parameter) => parameter.value), ['S2', 'F2', '', ''], 'its parameters read trimmed, the unset ones empty');
  const scoring = ratings.find((group) => group.name === 'Residual risk' && group.when.value === 'Numerical scoring').attributes;
  deepEqual(
    [ratingView(scoring, { residualSeverityScore: '60', residualProbabilityScore: '40' }).outcome, ratingView(scoring, { residualSeverityScore: '10', residualProbabilityScore: '10' }).tone],
    ['100 (low)', 'none'],
    'a score comes to its category, negligible wearing no tone'
  );
  for (const code of ['LEG', 'HST', 'OSP', 'ESR', 'HSR', 'OSR']) {
    const applicable = attributesFor(code).find((definition) => definition.key === 'applicable');
    deepEqual(applicable.values, ['Yes', 'No'], `${code} offers the same two verdicts`);
    ok(keys(code).includes('rationale'), `and ${code} carries the reasoning beside it`);
  }
}

summary('test-editor');
