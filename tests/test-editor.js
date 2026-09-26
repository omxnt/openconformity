/**
 * Exercises the editor logic that needs no page: whether a draft differs
 * from the entity it edits. The rendered editor is checked in the
 * browser. Run from this directory.
 */

import { draftChanged, linkable, ratingView, codeShown, firstTabName, setValues, joinSet, tableRows, joinTable, removalText } from '../app/modules/fields.js';
import { recordedStates, recordOf, staleText } from '../app/modules/records.js';
import { createModel, addEntity, relate, removeEntity, unrelate } from '../app/modules/model.js';
import { ATTRIBUTES, attributesFor, groupsOf } from '../app/modules/attributes.js';
import { ok, equal, deepEqual, summary } from './harness.js';

// --- The draft against the entity (F-MOD-004) ------------------------------

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

// --- A hyperlink is presented as a link only when it is a web address (N-SEC-002) ---

equal(linkable('https://eur-lex.europa.eu/eli/reg/2023/1230/oj'), true, 'an https address is followable');
equal(linkable('http://example.org'), true, 'so is http');
equal(linkable('  https://example.org  '), true, 'surrounding space is not the value');
equal(linkable('javascript:alert(1)'), false, 'a javascript value is never armed by rendering it');
equal(linkable('mailto:info@openconformity.org'), false, 'nor is any other scheme followed');
equal(linkable('eur-lex.europa.eu'), false, 'a bare host is text until it says its scheme');
equal(linkable(''), false, 'and an empty value is nothing');

// --- The field helpers over the definitions (F-MOD-003) --------------------

{
  const read = groupsOf('SCN').filter((group) => group.when?.key === 'estimationMethod' && group.when.value !== '');
  equal(firstTabName('XYZ'), 'Description', 'a type the metamodel does not know falls back');
  const three = { columns: [{ key: 'a' }, { key: 'b' }, { key: 'c' }] };
  deepEqual(tableRows(three, '2026-09-01\tFailed\tTR-015\n\n 2026-09-24 \tPassed\tTR-017 \n2026-10-01'), [['2026-09-01', 'Failed', 'TR-015'], ['2026-09-24', 'Passed', 'TR-017'], ['2026-10-01', '', '']], 'a stored table reads as rows, one per line, cells parted by tabs, trimmed, missing cells empty, blank lines no rows');
  deepEqual(tableRows(three, undefined), [], 'nothing stored is no rows');
  equal(joinTable(three, [['2026-09-01', 'Failed', 'TR-015'], ['', '', ''], ['2026-09-24', 'Passed', ' TR-017 says\n"all stopped"\tin time ']]), '2026-09-01\tFailed\tTR-015\n2026-09-24\tPassed\t"TR-017 says\n""all stopped""\tin time"', 'rows store one per line, a row left empty dropped, a cell holding a break, a quotation mark or a tab quoted as a CSV cell is');
  deepEqual(tableRows(three, '2026-09-24\tPassed\t"TR-017 says\n""all stopped""\tin time"\n2026-10-01\t"Failed"\tplain'), [['2026-09-24', 'Passed', 'TR-017 says\n"all stopped"\tin time'], ['2026-10-01', 'Failed', 'plain']], 'and reads back with the break, the mark and the tab within the cell');
  const stored = [['2026-09-01', 'Failed', 'TR-015'], ['2026-09-24', 'Passed', 'Line one\nline two']];
  deepEqual(tableRows(three, joinTable(three, stored)), stored, 'a table stored and read again is the same');
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
}

// --- what a save removes, as the notice tells it (N-SEC-005) ---
equal(removalText([{ name: 'Integrity level', value: 'EN ISO 13849-1' }]), 'Integrity level under EN ISO 13849-1.', 'one group under one value');
equal(removalText([{ name: 'Initial risk estimation', value: 'Risk matrix' }, { name: 'Residual risk estimation', value: 'Risk matrix' }]), 'Initial risk estimation and Residual risk estimation under Risk matrix.', 'two groups under one value are joined by and');
equal(removalText([{ name: 'A', value: 'X' }, { name: 'B', value: 'X' }, { name: 'C', value: 'X' }]), 'A, B and C under X.', 'three are listed with commas and an and');
equal(
  removalText([{ name: 'Estimation method', value: 'ISO/TR 14121-2' }, { name: 'Initial risk estimation', value: 'Risk matrix' }, { name: 'Residual risk estimation', value: 'Risk matrix' }]),
  'Estimation method under ISO/TR 14121-2, and Initial risk estimation and Residual risk estimation under Risk matrix.',
  'groups under different values are told in order, one clause each'
);

// --- The measures a residual rating was made against (F-MOD-011) ----------

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
