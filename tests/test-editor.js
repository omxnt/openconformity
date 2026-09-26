/**
 * Exercises the editor logic that needs no page: whether a draft differs
 * from the entity it edits. The rendered editor is checked in the
 * browser. Run from this directory.
 */

import { draftChanged, linkable, ratingView, codeShown, firstTabName, setValues, joinSet, tableRows, joinTable, removalText } from '../app/modules/editor.js';
import { recordedStates, recordOf, staleText } from '../app/modules/records.js';
import { createModel, addEntity, relate, removeEntity, unrelate } from '../app/modules/model.js';
import { ATTRIBUTES, attributesFor, groupsOf, SHARED_HELP } from '../app/modules/attributes.js';
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
    ['ELM:Data', 'ELM:Diagram', 'ACT:Assumptions', 'TSK:Conditions', 'LEG:Applicability', 'HST:Applicability', 'OSP:Applicability', 'NTB:Notification', 'HAZ:Elimination', 'SCN:Risk', 'PRM:Diagram', 'SAF:Behaviour', 'SAF:Characteristics', 'SAF:Fault handling', 'SAF:Diagram', 'ESR:Guidance', 'ESR:Applicability', 'HSR:Guidance', 'HSR:Applicability', 'OSR:Guidance', 'OSR:Applicability', 'VER:Result'],
    "the tabs in the model beside the notes: an element's data, an actor's assumptions, a task's conditions, every verdict, a notified body's notification, a hazard's elimination, a scenario's risk, a safety function's behaviour, characteristics and faults, a verification's result, and a drawing on an element, a measure and a function"
  );
  for (const [code, type] of Object.entries(ATTRIBUTES)) {
    const last = type.groups.at(-1);
    ok(last.tab === true && last.name === 'Notes', `${code} closes on a Notes tab`);
    deepEqual(last.attributes, [{ key: 'notes', name: 'Notes', kind: 'multiline' }], `${code}'s notes are one multiline field`);
  }

  deepEqual(
    ATTRIBUTES.SAF.attributes.map((definition) => definition.key),
    ['reference', 'title', 'description'],
    'a safety function reads what it is: its designation, title, description, and the standards that apply'
  );
  equal(ATTRIBUTES.SAF.attributes[0].name, 'Designation', 'the reference a safety function carries is its designation');
  deepEqual(attributesFor('CAS')[0], { key: 'reference', name: 'Reference', kind: 'text', help: 'The annex, module or part of the legislation the procedure follows, as cited.' }, 'a conformity assessment opens on the annex or module it follows, cited from the legislation');
  deepEqual(attributesFor('NTB')[0], { key: 'reference', name: 'Reference', kind: 'text', help: 'The identification number of the notified body, as cited.' }, 'a notified body opens on the number the Commission lists it under');
  for (const code of ['ELM', 'ACT', 'TSK', 'PHS', 'HAZ', 'SCN', 'PRM']) {
    deepEqual(attributesFor(code)[0], { key: 'reference', name: 'Designation', kind: 'text' }, `${code} opens on a designation of the modeller's own, composed into its label before the title`);
  }
  deepEqual(Object.keys(SHARED_HELP), ['Identifier', 'Designation', 'Notes', 'Link', 'Applicable', 'Rationale', 'Diagram', 'Initial risk estimation', 'Residual risk estimation', 'Required integrity level'], 'the names shared across types, and the rating names shared across methods, carry one help each');
  equal(attributesFor('REQ').find((definition) => definition.key === 'rationale').help, 'Why the system requirement exists.', "a system requirement's rationale says its own thing, so it carries its own help");
  equal(attributesFor('HST').find((definition) => definition.key === 'title').help, "The title of the standard, as published.", 'a harmonised standard says its title is the standard\'s');
  equal(attributesFor('ESR').find((definition) => definition.key === 'reference').help, 'The clause number of the essential requirement within the legislation.', 'an essential requirement says its reference is the clause');
  deepEqual(
    ATTRIBUTES.REQ.attributes.map((definition) => [definition.key, definition.name, definition.kind, definition.values]),
    [['reference', 'Designation', 'text', undefined], ['title', 'Title', 'text', undefined], ['type', 'Type', 'choice', ['Function/Performance', 'Fit/Operational', 'Form', 'Quality', 'Compliance']], ['verificationMethod', 'Verification method', 'choice', ['Inspection', 'Analysis', 'Demonstration', 'Test']], ['description', 'Requirement', 'multiline', undefined], ['rationale', 'Rationale', 'multiline', undefined]],
    "a system requirement reads its designation, title, its type among SEBoK's five categories, the method it is to be verified by beside it, text and rationale"
  );
  deepEqual(
    ATTRIBUTES.VER.attributes.map((definition) => [definition.key, definition.name, definition.kind, definition.values]),
    [['reference', 'Designation', 'text', undefined], ['title', 'Title', 'text', undefined], ['method', 'Verification method', 'choice', ['Inspection', 'Analysis', 'Demonstration', 'Test']], ['responsible', 'Responsible party', 'text', undefined], ['setup', 'Verification setup', 'multiline', undefined], ['description', 'Verification procedure', 'multiline', undefined], ['acceptanceCriteria', 'Acceptance criteria', 'multiline', undefined]],
    'a verification reads its designation, title, method and who carries it out beside it, what it is carried out with, the procedure and the acceptance criteria'
  );
  deepEqual(attributesFor('REQ').find((definition) => definition.key === 'verificationMethod').values, attributesFor('VER').find((definition) => definition.key === 'method').values, "the requirement's intended method and the verification's actual one are chosen from the one list, so the two can be compared");
  deepEqual(groups('VER'), ['Result', 'Notes'], 'a verification records what happened on a tab of its own, before its notes');
  const runs = ATTRIBUTES.VER.groups[0].attributes[0];
  deepEqual(
    [ATTRIBUTES.VER.groups[0].attributes.length, runs.key, runs.kind, runs.columns.map((column) => [column.key, column.kind, column.values ?? null])],
    [1, 'runs', 'table', [['date', 'date', null], ['by', 'text', null], ['result', 'choice', ['Passed', 'Failed']], ['remarks', 'multiline', null]]],
    'the result is a table of runs, each when and by whom, passed or failed, and remarks; no rows while the verification is not carried out'
  );
  const three = { columns: [{ key: 'a' }, { key: 'b' }, { key: 'c' }] };
  deepEqual(tableRows(three, '2026-09-01\tFailed\tTR-015\n\n 2026-09-24 \tPassed\tTR-017 \n2026-10-01'), [['2026-09-01', 'Failed', 'TR-015'], ['2026-09-24', 'Passed', 'TR-017'], ['2026-10-01', '', '']], 'a stored table reads as rows, one per line, cells parted by tabs, trimmed, missing cells empty, blank lines no rows');
  deepEqual(tableRows(three, undefined), [], 'nothing stored is no rows');
  equal(joinTable(three, [['2026-09-01', 'Failed', 'TR-015'], ['', '', ''], ['2026-09-24', 'Passed', ' TR-017 says\n"all stopped"\tin time ']]), '2026-09-01\tFailed\tTR-015\n2026-09-24\tPassed\t"TR-017 says\n""all stopped""\tin time"', 'rows store one per line, a row left empty dropped, a cell holding a break, a quotation mark or a tab quoted as a CSV cell is');
  deepEqual(tableRows(three, '2026-09-24\tPassed\t"TR-017 says\n""all stopped""\tin time"\n2026-10-01\t"Failed"\tplain'), [['2026-09-24', 'Passed', 'TR-017 says\n"all stopped"\tin time'], ['2026-10-01', 'Failed', 'plain']], 'and reads back with the break, the mark and the tab within the cell');
  const stored = [['2026-09-01', 'Failed', 'TR-015'], ['2026-09-24', 'Passed', 'Line one\nline two']];
  deepEqual(tableRows(three, joinTable(three, stored)), stored, 'a table stored and read again is the same');
  equal(attributesFor('PROJECT').find((definition) => definition.key === 'date').kind, 'date', "the project's date is a date, as a run's is");
  deepEqual(groups('SAF'), ['Behaviour', 'Characteristics', 'Fault handling', 'Diagram', 'Notes'], 'then what it does, what it must achieve, what it does when it fails, its diagram, and its notes, each a tab');
  for (const code of ['ELM', 'PRM', 'SAF']) {
    const drawing = ATTRIBUTES[code].groups.find((group) => group.name === 'Diagram');
    deepEqual(drawing, { name: 'Diagram', tab: true, attributes: [{ key: 'drawing', name: 'Diagram', kind: 'drawing' }] }, `${code} carries the one Diagram tab, named for the artefact, before its notes`);
    equal(ATTRIBUTES[code].groups.indexOf(drawing), ATTRIBUTES[code].groups.length - 2, `${code}'s drawing stands right before its notes`);
  }
  deepEqual(
    ATTRIBUTES.SAF.groups[0].attributes.map((definition) => definition.key),
    ['priority', 'operatingMode', 'trigger', 'reaction', 'safeState', 'feedback', 'muting', 'restart'],
    'behaviour as a state machine: its priority and the context it is armed in, the path from trigger to safe state and what the operator sees of it, how it can be set aside, and the way out again'
  );
  deepEqual(
    ATTRIBUTES.SAF.groups[2].attributes.map((definition) => [definition.key, definition.name]),
    [
      ['faultsDetected', 'Faults to be detected'], ['detectionMeans', 'Means of detection'], ['faultHandling', 'Fault reaction'],
      ['faultDetectionTime', 'Fault detection time'], ['faultReactionTime', 'Fault reaction time'],
      ['faultIndication', 'Fault indication'], ['faultRecovery', 'Fault recovery'], ['powerDisturbances', 'Power disturbances'],
    ],
    'fault handling, self-contained: what to find, how, what happens and the state it ends in fault by fault, how fast found and how fast reacted, how it shows, how it is recovered from, and the reaction to the supply going, returning or fluctuating'
  );
  deepEqual(
    ATTRIBUTES.SAF.groups[1].attributes.map((definition) => definition.key),
    ['standard', 'designTargets', 'responseTime', 'stoppingTime', 'technology', 'interfaces', 'independence', 'defeating', 'environment'],
    'characteristics, agnostic to the standard and read as requirement then realisation: the standard and its level, what else the standard asks of the design, the two machinery timings; then how the function is realised, what it exchanges, keeps apart from, resists and works in'
  );
  const characteristics = ATTRIBUTES.SAF.groups[1];
  deepEqual(
    characteristics.groups.map((group) => `${group.name} | ${group.when.key} = ${group.when.value}`),
    ['Required integrity level | standard = EN ISO 13849-1:2023', 'Required integrity level | standard = EN IEC 62061:2021', 'Required integrity level | standard = '],
    "the level is one slot waiting on the function's own standard: chosen among its levels, or text while none is chosen"
  );
  equal(characteristics.attributes[0].name, 'Functional safety standard', 'the standard the function is designed to stands first');
  deepEqual([characteristics.attributes[0].kind, characteristics.attributes[0].values], ['choice', ['EN ISO 13849-1:2023', 'EN IEC 62061:2021']], "the function's own choice, since a machine holds subsystems designed to another standard than its own; the two harmonised for machinery and nothing else");
  deepEqual(characteristics.groups[0].attributes, [{ key: 'plr', name: 'Required integrity level', kind: 'choice', values: ['PL a', 'PL b', 'PL c', 'PL d', 'PL e'] }], "under ISO 13849-1 the level is chosen among the standard's own, under the agnostic name, its help the shared one");
  deepEqual(characteristics.groups[1].attributes, [{ key: 'sil', name: 'Required integrity level', kind: 'choice', values: ['SIL 1', 'SIL 2', 'SIL 3'] }], 'under IEC 62061 likewise');
  deepEqual(characteristics.groups[2], { name: 'Required integrity level', when: { key: 'standard', value: '' }, attributes: [{ key: 'ownLevel', name: 'Required integrity level', kind: 'text' }] }, 'with no standard chosen the level is entered as text, in whatever terms the design uses, so the slot never needs a holder');
  ok(!characteristics.groups.some((group) => group.attributes.some((definition) => definition.kind === 'computed')) && !attributesFor('SAF').some((definition) => ['failureRate', 'demandRate', 'missionTime', 'category', 'architecture'].includes(definition.key)), "no method reads the level and no field speaks one standard's language: what a standard asks of the design goes in the specific design targets");
  equal(attributesFor('SAF').find((definition) => definition.key === 'designTargets').kind, 'multiline', 'a text of any length, in the standard\'s own terms');
  deepEqual(ratingView(ATTRIBUTES.SCN.groups[0].groups[0].attributes, { initialLevel: 'High' }).outcome, null, "a scenario's computed outcome is never read from what is stored");
  const technology = attributesFor('SAF').find((definition) => definition.key === 'technology');
  deepEqual(
    [technology.kind, technology.values],
    ['set', ['Mechanical', 'Hydraulic', 'Pneumatic', 'Electrical', 'Electronic', 'Optoelectronic', 'Software', 'Configurable', 'Networked', 'Wireless']],
    "the technologies are a set of those ISO 13849-1 names in its scope, software for the programmable electronic, and beside them the headings further work takes: optoelectronic, configurable, networked, wireless"
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
    const judgement = ATTRIBUTES[code].groups.find((group) => group.name === 'Applicability');
    ok(judgement !== undefined && judgement === ATTRIBUTES[code].groups.at(-2), `${code} then judges applicability apart, just before its notes`);
    equal(judgement.tab, true, `${code}'s judgement is a tab of its own`);
    deepEqual(judgement.attributes.map((definition) => definition.key), ['applicable', 'rationale'], `${code} holds the verdict with its reasoning there`);
  }
  for (const code of ['ESR', 'HSR', 'OSR']) {
    deepEqual(groups(code), ['Guidance', 'Applicability', 'Notes'], `${code} reads its guidance between the requirement and the verdict`);
  }
  deepEqual(
    ATTRIBUTES.ESR.groups[0].attributes,
    [
      { key: 'guidanceSource', name: 'Source', kind: 'text', help: 'Where the guidance comes from, such as an official guide, a standard, a commentary or yourself.' },
      { key: 'guidanceSection', name: 'Section', kind: 'text', help: 'The section of the source the guidance is taken from.' },
      { key: 'guidance', name: 'Guidance', kind: 'multiline', help: "How to read and meet the essential requirement, whether a guide's advice, a commentary's or your own interpretation." },
    ],
    'the guidance names its source and the section within it, then carries its text, each saying what it is for'
  );

  deepEqual(
    ATTRIBUTES.SCN.attributes.map((definition) => definition.key),
    ['reference', 'title', 'hazardousEvent', 'consequence'],
    'a scenario reads where, what happens, and what it leads to'
  );
  ok(ATTRIBUTES.SCN.attributes.every((definition) => definition.kind !== 'related'), 'the scenario tab is text: the relationship pane lists what is related');
  const estimation = ATTRIBUTES.SCN.groups[0];
  ok(ATTRIBUTES.SCN.groups.length === 2 && estimation.name === 'Risk' && estimation.tab === true, 'then rates its risk on a tab of its own, before its notes');
  deepEqual(estimation.attributes, [], "the tab holds no fields of its own: the ratings wait on the project's choice, and nothing else is asked of every scenario");
  const ratings = estimation.groups.filter((group) => group.when?.key === 'estimationMethod');
  ok(ratings.length === 8 && ratings.every((group) => group.after === undefined), "the ratings wait on the project's method, a key the scenario has none of, and stand in their order");
  deepEqual(
    estimation.groups.map((group) => (group.when ? `${group.name} | ${group.when.key} = ${group.when.value}` : group.name)),
    [
      ...['Risk matrix (ISO/TR 14121-2:2012, 6.2.2)', 'Risk graph (ISO/TR 14121-2:2012, 6.3.2)', 'Numerical scoring (ISO/TR 14121-2:2012, 6.4.2)', ''].map((method) => `Initial risk estimation | estimationMethod = ${method}`),
      ...['Risk matrix (ISO/TR 14121-2:2012, 6.2.2)', 'Risk graph (ISO/TR 14121-2:2012, 6.3.2)', 'Numerical scoring (ISO/TR 14121-2:2012, 6.4.2)', ''].map((method) => `Residual risk estimation | estimationMethod = ${method}`),
      'Protective measures',
      'Risk evaluation',
    ],
    "the initial rating, then the residual, each read by one of the three methods under the project's choice and typed under none, then the measures the residual was rated against, then the evaluation"
  );
  deepEqual(
    estimation.groups.find((group) => group.name === 'Risk evaluation').attributes,
    [{ key: 'evaluation', name: 'Risk evaluation', kind: 'multiline', help: 'Your judgement whether the accident scenario\'s residual risk is acceptable, and why.' }],
    'the tab closes on the risk evaluation, free text with its help'
  );
  const read = ratings.filter((group) => group.when.value !== '');
  const typed = ratings.filter((group) => group.when.value === '');
  for (const group of read) {
    const last = group.attributes.at(-1);
    ok(last.kind === 'computed' && last.method === group.when.value, `${group.name} under ${group.when.value} closes on what the rating comes to, read by that method`);
    ok(group.attributes.slice(0, -1).every((definition) => definition.kind !== 'computed'), `with the parameters before it, under ${group.when.value}`);
    const parameters = group.attributes.filter((definition) => definition.kind !== 'computed' && definition.kind !== 'rationale');
    deepEqual(
      group.attributes.filter((definition) => definition.kind === 'rationale').map((definition) => definition.parameter),
      parameters.map((definition) => definition.key),
      `and a rationale for every parameter, each right after its own, under ${group.when.value}`
    );
    ok(parameters.every((definition, i) => group.attributes[2 * i] === definition && group.attributes[2 * i + 1].key === `${definition.key}Rationale`), `the rationale keyed by its parameter with Rationale appended, under ${group.when.value}`);
  }
  deepEqual(typed.map((group) => group.attributes), [[{ key: 'initialRating', name: 'Initial risk estimation', kind: 'text' }], [{ key: 'residualRating', name: 'Residual risk estimation', kind: 'text' }]], 'with no method chosen each rating is one text, named as its slot so the shared help speaks for it');
  ok(estimation.groups.filter((group) => group.name === 'Protective measures').length === 1 && estimation.groups.find((group) => group.name === 'Protective measures').attributes.every((definition) => definition.kind === 'entities'), 'the measures are relationships, shown by the relationship pane and the views; the tab records only which of them the residual rating was made against');
  deepEqual(groupsOf('SCN').map((group) => group.name).slice(0, 3), ['Risk', 'Initial risk estimation', 'Initial risk estimation'], 'the groups walk in render order, sub-groups after their group');

  const matrix = read.find((group) => group.name === 'Initial risk estimation').attributes;
  deepEqual(
    ratingView(matrix, { initialSeverity: 'Serious', initialProbability: 'Likely' }),
    {
      name: 'Risk level',
      outcome: 'High',
      tone: 'high',
      parameters: [
        { name: 'Severity', value: 'Serious', code: 'Serious', rationale: '' },
        { name: 'Probability', value: 'Likely', code: 'Likely', rationale: '' },
      ],
    },
    'a rating reads as the attribute it computes, what it comes to, its tone, and its parameters by name, each with the code it shows and the rationale given for it'
  );
  deepEqual(
    ratingView(matrix, { initialSeverity: 'Serious', initialProbability: 'Likely', initialSeverityRationale: ' Amputation is credible at the tool ', initialProbabilityRationale: '' }).parameters.map((parameter) => parameter.rationale),
    ['Amputation is credible at the tool', ''],
    'a rationale reads trimmed beside its own parameter, the unset ones empty'
  );
  deepEqual(
    ['K1 word', '4 words after', 'Se 4', 'Very likely', 'Catastrophic', '95', '', ' Low ', undefined].map(codeShown),
    ['K1', '4', 'Se 4', 'Very likely', 'Catastrophic', '95', '', 'Low', ''],
    "a code is a value's first word, and its second where the first holds no digit"
  );
  deepEqual(
    [codeShown('95', { kind: 'number', name: 'Severity score' }), codeShown('', { kind: 'number', name: 'Probability score' }), codeShown('S2', { kind: 'choice', name: 'Severity' })],
    ['SS 95', '', 'S2'],
    "and for a number the initials of its name before it, as the report abbreviates its scores"
  );
  const half = ratingView(matrix, { initialSeverity: 'Serious', initialProbability: '  ' });
  equal(half.outcome, null, 'a rating half made comes to nothing yet');
  equal(half.tone, 'none', 'and wears no tone');
  deepEqual(half.parameters.map((parameter) => parameter.value), ['Serious', ''], 'its parameters read trimmed, the unset ones empty');
  equal(ratingView(matrix, { initialSeverity: 'Minor', initialProbability: 'Remote' }).tone, 'negligible', 'negligible wears its own tone, the neutral one');
  const graph = read.find((group) => group.name === 'Initial risk estimation' && group.when.value === 'Risk graph (ISO/TR 14121-2:2012, 6.3.2)').attributes;
  deepEqual(
    ratingView(graph, { initialS: 'S2', initialF: 'F2', initialO: 'O2', initialA: 'A2' }),
    {
      name: 'Risk index',
      outcome: 'RI 5 (highest)',
      tone: 'high',
      parameters: [
        { name: 'Severity', value: 'S2', code: 'S2', rationale: '' },
        { name: 'Exposure', value: 'F2', code: 'F2', rationale: '' },
        { name: 'Occurrence', value: 'O2', code: 'O2', rationale: '' },
        { name: 'Avoidance', value: 'A2', code: 'A2', rationale: '' },
      ],
    },
    'under the graph a rating reads as its index and band, its four codes beside it'
  );
  const scoring = read.find((group) => group.name === 'Residual risk estimation' && group.when.value === 'Numerical scoring (ISO/TR 14121-2:2012, 6.4.2)').attributes;
  deepEqual(
    [ratingView(scoring, { residualSeverityScore: '60', residualProbabilityScore: '40' }).outcome, ratingView(scoring, { residualSeverityScore: '10', residualProbabilityScore: '10' }).tone, ratingView(scoring, { residualSeverityScore: '95', residualProbabilityScore: '80' }).parameters.map((parameter) => parameter.code)],
    ['RS 100 (low)', 'negligible', ['SS 95', 'PS 80']],
    "under the scoring a rating reads as its total and category under the report's RS, negligible wearing the neutral tone as under the matrix, the scores its codes under SS and PS"
  );
  for (const code of ['LEG', 'HST', 'OSP', 'ESR', 'HSR', 'OSR']) {
    const applicable = attributesFor(code).find((definition) => definition.key === 'applicable');
    deepEqual(applicable.values, ['Yes', 'No'], `${code} offers the same two verdicts`);
    ok(keys(code).includes('rationale'), `and ${code} carries the reasoning beside it`);
  }
}

// --- what a save removes, as the notice tells it ---
equal(removalText([{ name: 'Integrity level', value: 'EN ISO 13849-1' }]), 'Integrity level under EN ISO 13849-1.', 'one group under one value');
equal(removalText([{ name: 'Initial risk estimation', value: 'Risk matrix' }, { name: 'Residual risk estimation', value: 'Risk matrix' }]), 'Initial risk estimation and Residual risk estimation under Risk matrix.', 'two groups under one value are joined by and');
equal(removalText([{ name: 'A', value: 'X' }, { name: 'B', value: 'X' }, { name: 'C', value: 'X' }]), 'A, B and C under X.', 'three are listed with commas and an and');
equal(
  removalText([{ name: 'Estimation method', value: 'ISO/TR 14121-2' }, { name: 'Initial risk estimation', value: 'Risk matrix' }, { name: 'Residual risk estimation', value: 'Risk matrix' }]),
  'Estimation method under ISO/TR 14121-2, and Initial risk estimation and Residual risk estimation under Risk matrix.',
  'groups under different values are told in order, one clause each'
);

// --- The measures a residual rating was made against ----------------------

{
  deepEqual(
    ATTRIBUTES.SCN.groups[0].groups.find((group) => group.name === 'Protective measures').attributes,
    [{ key: 'measures', name: 'Protective measures', kind: 'entities', relationship: 'prm-reduces-risk-of-scn', recorded: 'Residual risk estimation', help: 'The protective measures related to the scenario when its residual risk was rated, recorded by the software.' }],
    'the record names the relationship it reads and the group whose change writes it'
  );
  equal(recordOf(['PRM-002', 'PRM-001', 'PRM-002']), 'PRM-001; PRM-002', 'a record is the identifiers once each, in order, parted as a set is');

  let model = createModel();
  const scn = addEntity(model, 'SCN').entity.id;
  const first = addEntity(model, 'PRM', { attributes: { title: 'Fixed guard' } }).entity.id;
  const second = addEntity(model, 'PRM', { attributes: { title: 'Interlock' } }).entity.id;
  relate(model, 'prm-reduces-risk-of-scn', first, scn);
  relate(model, 'prm-reduces-risk-of-scn', second, scn);
  const record = recordOf([first, second]);
  deepEqual(
    recordedStates(record, model, scn, 'prm-reduces-risk-of-scn').map(({ id, state }) => [id, state]),
    [[first, 'linked'], [second, 'linked']],
    'while the relationships hold, every recorded measure reads as linked'
  );
  equal(recordedStates(record, model, scn, 'prm-reduces-risk-of-scn')[0].label, 'Fixed guard', 'each with the label the measure carries');
  unrelate(model, 'prm-reduces-risk-of-scn', second, scn);
  deepEqual(recordedStates(record, model, scn, 'prm-reduces-risk-of-scn').map(({ state }) => state), ['linked', 'unlinked'], 'a relationship removed since leaves its measure unlinked');
  removeEntity(model, second);
  const states = recordedStates(record, model, scn, 'prm-reduces-risk-of-scn');
  deepEqual(states.map(({ state }) => state), ['linked', 'deleted'], 'a measure deleted since reads as deleted');
  equal(states[1].label, second, 'and is named by its identifier alone, its label being gone');
  deepEqual(recordedStates('', model, scn, 'prm-reduces-risk-of-scn').map(({ id, state }) => [id, state]), [[first, 'added']], 'an empty record lists what is related now as added, which the editor shows only once the rating that writes the record exists');
  const third = addEntity(model, 'PRM', { attributes: { title: 'Light curtain' } }).entity.id;
  relate(model, 'prm-reduces-risk-of-scn', third, scn);
  deepEqual(recordedStates(record, model, scn, 'prm-reduces-risk-of-scn').map(({ id, state }) => [id, state]), [[first, 'linked'], [second, 'deleted'], [third, 'added']], 'a measure related since the record stands after the recorded ones, added');
  deepEqual(recordedStates('', model, null, 'prm-reduces-risk-of-scn'), [], 'with no subject nothing is related');
  deepEqual(staleText('Residual risk estimation'), { unlinked: 'Removed since the residual risk estimation.', deleted: 'Deleted since the residual risk estimation.', added: 'Added since the residual risk estimation.' }, 'the three states out of step say so, naming the rating the record was written with');
}

summary('test-editor');
