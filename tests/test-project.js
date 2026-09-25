/**
 * What saving the project removes from the entities: the sweep over the
 * groups waiting on a project choice, by the old and the new value, and
 * the text of the question. Run from this directory.
 */

import './shim.js';
import { projectSweep } from '../app/modules/project.js';
import { createModel, addEntity } from '../app/modules/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';

const MATRIX = 'Risk matrix (ISO/TR 14121-2:2012, 6.2.2)';
const GRAPH = 'Risk graph (ISO/TR 14121-2:2012, 6.3.2)';

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

summary('test-project');
