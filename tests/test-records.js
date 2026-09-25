/**
 * The records read against the model: what a record names and in what
 * state, whether one was written at all, the findings the checks list
 * shows, and the words the status bar says. Run from this directory.
 */

import './shim.js';
import { recordOf, recordedStates, recordWritten, findings, messagesText, sizeText, tabNameOf, changedText, staleText, nounOf } from '../app/modules/records.js';
import { createModel, addEntity, relate, unrelate, removeEntity } from '../app/modules/model.js';
import { groupsOf } from '../app/modules/attributes.js';
import { ok, equal, deepEqual, summary } from './harness.js';

const measures = groupsOf('SCN').flatMap((group) => group.attributes).find((held) => held.key === 'measures');
const elimination = groupsOf('HAZ').flatMap((group) => group.attributes).find((held) => held.key === 'measures');

// --- What a record is ------------------------------------------------------

equal(recordOf(['PRM-002', 'PRM-001', 'PRM-002']), 'PRM-001; PRM-002', 'a record is the identifiers once each, in order, parted by semicolons');
equal(recordOf([]), '', 'and nothing with nothing');
deepEqual(staleText('Residual risk estimation'), { unlinked: 'Unlinked after the residual risk estimation.', deleted: 'Deleted after the residual risk estimation.', added: 'Related after the residual risk estimation.' }, 'the three states out of step name the rating the record was written with');
equal(changedText(measures, 'SCN'), "The protective measures have changed since the scenario's residual risk estimation.", 'and the note beneath a record names the field, the entity and the rating');
equal(nounOf('HAZ'), 'hazard', 'an entity goes by the last word of its type');

// --- Whether a record was written ------------------------------------------

ok(!recordWritten('SCN', measures, {}), 'a scenario with no residual rating has written no record');
ok(recordWritten('SCN', measures, { residualRating: 'Low' }), 'a typed residual rating writes it');
ok(recordWritten('SCN', measures, { residualSeverity: 'Minor' }), 'as does one parameter of a rated one');
ok(!recordWritten('SCN', measures, { residualRationaleSeverity: 'Because.', measures: 'PRM-001' }), 'a rationale or the record itself counts for nothing');
ok(!recordWritten('HAZ', elimination, { rationale: 'Considered.' }), 'a hazard with a rationale but no decision has written no record');
ok(recordWritten('HAZ', elimination, { eliminated: 'No' }), 'a No is a decision as much as a Yes');

// --- Where a record stands --------------------------------------------------

equal(tabNameOf('SCN', 'measures'), 'Risk', "a scenario's record stands on its Risk tab");
equal(tabNameOf('HAZ', 'measures'), 'Elimination', "a hazard's on its Elimination tab");
equal(tabNameOf('HAZ', 'title'), null, 'and the title on the first tab, which has no name here');

// --- The findings -----------------------------------------------------------

{
  const model = createModel();
  const haz = addEntity(model, 'HAZ', { attributes: { title: 'Moving parts' } }).entity.id;
  const scn = addEntity(model, 'SCN', { attributes: { title: 'Contact' } }).entity.id;
  const guard = addEntity(model, 'PRM', { attributes: { title: 'Fixed guard' } }).entity.id;
  const interlock = addEntity(model, 'PRM', { attributes: { title: 'Interlock' } }).entity.id;
  relate(model, 'prm-eliminates-haz', guard, haz);
  relate(model, 'prm-reduces-risk-of-scn', interlock, scn);

  deepEqual(findings(model), [], 'nothing recorded, nothing found');
  equal(sizeText(model), '4 entities and 2 relationships', 'the size is the entities and the relationships');
  equal(messagesText([]), '', 'and the messages say nothing with nothing to say');

  model.nodes.get(haz).attributes.eliminated = 'Yes';
  model.nodes.get(haz).attributes.measures = recordOf([guard]);
  model.nodes.get(scn).attributes.residualRating = 'Low';
  model.nodes.get(scn).attributes.measures = recordOf([interlock]);
  deepEqual(findings(model), [], 'records that match what is related are no finding');

  unrelate(model, 'prm-eliminates-haz', guard, haz);
  let found = findings(model);
  deepEqual(found.map(({ id, type }) => [id, type]), [[haz, 'HAZ']], 'a measure unlinked since the decision is a finding on the hazard');
  deepEqual(found[0].states.map(({ id, state }) => [id, state]), [[guard, 'unlinked']], 'carrying the entries and their states');
  equal(found[0].text, "The protective measures have changed since the hazard's elimination.", 'and the message the tab shows');
  equal(found[0].label, 'Moving parts', "with the entity's label");
  equal(messagesText(found), '1 single hazard to revisit', 'which the status bar counts by type');

  relate(model, 'prm-reduces-risk-of-scn', guard, scn);
  found = findings(model);
  deepEqual(found.map(({ id }) => id), [haz, scn], 'a measure related since the rating is a finding on the scenario, in the model\'s order');
  deepEqual(found[1].states.map(({ id, state }) => [id, state]), [[interlock, 'linked'], [guard, 'added']], 'named after the recorded ones, as added');
  equal(messagesText(found), '1 single hazard and 1 accident scenario to revisit', 'the bar lists each type once');

  removeEntity(model, interlock);
  found = findings(model);
  deepEqual(found[1].states.map(({ id, state }) => [id, state]), [[interlock, 'deleted'], [guard, 'added']], 'a measure deleted since reads as deleted, by its identifier');
  equal(found[1].states[0].label, interlock, 'with the identifier for its label, the entity being gone');

  const other = addEntity(model, 'SCN', { attributes: { title: 'Second', residualRating: 'Low', measures: recordOf([guard]) } }).entity.id;
  equal(messagesText(findings(model)), '1 single hazard and 2 accident scenarios to revisit', 'and pluralises past one');
  equal(sizeText(createModel()), '0 entities and 0 relationships', 'an empty model counts as such');
  ok(other, 'the second scenario stands');
}

summary('test-records');
