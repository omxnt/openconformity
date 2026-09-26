/**
 * What saving the project removes from the entities: the sweep over the
 * groups waiting on a project choice, by the old and the new value, and
 * the text of the question. Then what a file holds under choices not in
 * force, and what no definition presents. Run from this directory.
 */

import './shim.js';
import { projectSweep, hiddenContent, unknownContent } from '../app/modules/project.js';
import { createModel, addEntity } from '../app/modules/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';

const MATRIX = 'Risk matrix (ISO/TR 14121-2:2012, 6.2.2)';
const GRAPH = 'Risk graph (ISO/TR 14121-2:2012, 6.3.2)';

// --- What saving the project sweeps (N-SEC-005) ----------------------------

const model = createModel();
model.attributes.estimationMethod = MATRIX;
addEntity(model, 'SCN', { attributes: { initialSeverity: 'Serious', initialSeverityRationale: 'Credible', initialProbability: 'Likely', evaluation: 'Fine.' } });
addEntity(model, 'SCN', { attributes: { residualRating: 'Low', initialS: 'S2' } });
addEntity(model, 'SCN', { attributes: { title: 'Unrated' } });
addEntity(model, 'SAF', { attributes: { standard: 'EN ISO 13849-1:2023', plr: 'PL c' } });
const same = { estimationMethod: MATRIX };

deepEqual(projectSweep(model, same), { entities: [], count: 0, text: '' }, 'the same choice removes nothing');

{
  const sweep = projectSweep(model, { ...same, estimationMethod: GRAPH });
  deepEqual(sweep.entities, [{ id: 'SCN-001', keys: ['initialSeverity', 'initialSeverityRationale', 'initialProbability'] }, { id: 'SCN-002', keys: ['residualRating'] }], 'changing the method sweeps the ratings read under the old one, rationale included, and a rating typed under none, never the evaluation or what fits the new one');
  equal(sweep.count, 2, 'counting the entities losing something');
  equal(sweep.text, 'what 2 accident scenarios hold under ' + MATRIX, 'said for the question');
}
{
  const sweep = projectSweep(model, { ...same, estimationMethod: '' });
  deepEqual(sweep.entities, [{ id: 'SCN-001', keys: ['initialSeverity', 'initialSeverityRationale', 'initialProbability'] }, { id: 'SCN-002', keys: ['initialS'] }], 'clearing the method sweeps every rating read, never one typed under none');
  equal(sweep.text, 'what 2 accident scenarios hold under ' + MATRIX, 'naming the old choice');
}
{
  const bare = createModel();
  addEntity(bare, 'SCN', { attributes: { initialRating: 'High' } });
  addEntity(bare, 'SCN', { attributes: { initialSeverity: 'Serious' } });
  const sweep = projectSweep(bare, { estimationMethod: MATRIX });
  deepEqual(sweep.entities, [{ id: 'SCN-001', keys: ['initialRating'] }], 'a project with no method yet keeps what fits the new one and sweeps what was typed under none');
  equal(sweep.text, 'what 1 accident scenario holds under no risk estimation method', 'naming the absence');
}
ok(projectSweep(model, { ...same, version: '2', description: 'x' }).count === 0, 'the revision fields sweep nothing');
ok(projectSweep(model, { ...same, estimationMethod: '' }).entities.every((held) => held.id.startsWith('SCN')), 'a safety function waits on nothing of the project, so no save of the project touches it');

// --- What a file holds under choices not in force (N-SEC-005) ---------------

{
  deepEqual(hiddenContent(createModel()), { entities: [], count: 0, lines: [] }, 'an empty project holds nothing hidden');
  const held = createModel();
  held.attributes.estimationMethod = MATRIX;
  addEntity(held, 'SCN', { attributes: { initialSeverity: 'Serious', initialS: 'S2', residualRating: 'Low' } });
  addEntity(held, 'SCN', { attributes: { initialS: 'S1' } });
  addEntity(held, 'SCN', { attributes: { initialSeverity: 'Minor' } });
  addEntity(held, 'SAF', { attributes: { standard: 'EN ISO 13849-1:2023', plr: 'PL c', sil: 'SIL 2', ownLevel: 'x' } });
  addEntity(held, 'SAF', { attributes: { sil: 'SIL 1' } });
  const hidden = hiddenContent(held);
  deepEqual(hidden.entities, [{ id: 'SCN-001', keys: ['initialS', 'residualRating'] }, { id: 'SCN-002', keys: ['initialS'] }, { id: 'SAF-001', keys: ['sil', 'ownLevel'] }, { id: 'SAF-002', keys: ['sil'] }], "every entity holding a value under a choice not in force, the project's or its own, with the keys it holds");
  equal(hidden.count, 4, 'counted by entity');
  deepEqual(hidden.lines, ['2 accident scenarios under ' + GRAPH, '1 accident scenario under no risk estimation method', '2 safety functions under EN IEC 62061:2021', '1 safety function under no functional safety standard'], 'one line per type and the value the content stood under, an unset choice named as none, a function without a standard counted under the one its level belongs to');
  ok(hiddenContent(held).entities.every(({ keys }) => !keys.includes('initialSeverity') && !keys.includes('plr')), 'what the choice in force shows is never listed');
  const unrated = createModel();
  addEntity(unrated, 'SCN', { attributes: { initialRating: 'Tolerable' } });
  equal(hiddenContent(unrated).count, 0, 'with no method chosen the typed rating is the one in force');
}

// --- What no definition presents (F-PER-010) ------------------------------

{
  deepEqual(unknownContent(createModel()), [], 'an empty project holds nothing unknown');
  const strange = createModel();
  strange.attributes.estimationMethod = MATRIX;
  strange.attributes.budget = '12';
  strange.attributes.empty = '';
  addEntity(strange, 'ELM', { attributes: { title: 'Drive', colour: 'red', weight: '3 kg' } });
  addEntity(strange, 'HAZ', { attributes: { title: 'Crushing' } });
  deepEqual(unknownContent(strange), [{ id: null, keys: ['budget'] }, { id: 'ELM-001', keys: ['colour', 'weight'] }], 'the project first, as null, then each entity holding a key no definition of its type names, empty values passing');
}

summary('test-project');
