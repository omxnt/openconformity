/**
 * Exercises the relationship pane logic that needs no page: the picker's
 * candidate set, the grouped directional list, and the neighbourhood the
 * graph draws — the selection and its direct relationships, never the
 * whole model. Run from this directory.
 */

import { pickerCandidates } from '../app/relate.js';
import { neighbourhood } from '../app/graph-view.js';
import { groupedRelationships } from '../app/relationships-view.js';
import { relationshipOptions } from '../app/flows.js';
import { createModel, addEntity, addFolder, relate } from '../app/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';

// --- The candidate set -------------------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'HAZ');
  addEntity(model, 'HAZ');
  addFolder(model, 'Zone');

  deepEqual([...pickerCandidates(model, null)], [], 'no workflow, no candidates');
  deepEqual(
    [...pickerCandidates(model, { subject: 'ELM-001', form: null })],
    [],
    'no form, no candidates'
  );

  const exhibits = { subject: 'ELM-001', form: { typeId: 'elm-exhibits-haz', direction: 'outgoing' } };
  deepEqual([...pickerCandidates(model, exhibits)], ['HAZ-001', 'HAZ-002'], 'the chosen form marks its far ends');

  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001');
  deepEqual([...pickerCandidates(model, exhibits)], ['HAZ-002'], 'a relationship that exists takes its candidate off the tree');

  const incoming = { subject: 'HAZ-002', form: { typeId: 'elm-exhibits-haz', direction: 'incoming' } };
  deepEqual([...pickerCandidates(model, incoming)], ['ELM-001'], 'an incoming form marks the sources');

  const option = relationshipOptions(model, 'ELM-001').find(
    (offered) => offered.type.id === 'elm-exhibits-haz' && offered.direction === 'outgoing'
  );
  deepEqual(
    [...pickerCandidates(model, exhibits)],
    option.candidates.map((entity) => entity.id),
    'the candidate set and the offer agree'
  );
}

// --- The grouped list --------------------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'ELM');
  addEntity(model, 'HAZ');
  addEntity(model, 'HAZ');
  addEntity(model, 'CAS');
  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001');
  relate(model, 'elm-decomposes-into-elm', 'ELM-001', 'ELM-002');
  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-002');
  relate(model, 'cas-assesses-elm', 'CAS-001', 'ELM-001');

  const groups = groupedRelationships(model, 'ELM-001');
  deepEqual(
    groups.outgoing.map((group) => [group.label, group.rows.map((row) => row.other.id)]),
    [
      ['exhibits', ['HAZ-001', 'HAZ-002']],
      ['decomposes into', ['ELM-002']],
    ],
    'outgoing rows group by type in first-seen order, interleavings gathered'
  );
  deepEqual(
    groups.incoming.map((group) => [group.label, group.rows.map((row) => row.other.id)]),
    [['assesses', ['CAS-001']]],
    'incoming rows group the same way, with the source as the far end'
  );
  deepEqual(
    groups.outgoing[0].rows.map((row) => row.relationship.type),
    ['elm-exhibits-haz', 'elm-exhibits-haz'],
    'each row carries its own relationship, for the remove affordance'
  );

  const none = groupedRelationships(model, 'HAZ-001');
  deepEqual(none.outgoing, [], 'an entity with only incoming relationships has no outgoing groups');
  equal(none.incoming.length, 1, 'and its incoming side lists them');
}

// --- The neighbourhood -------------------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'HAZ');
  addEntity(model, 'SCN');
  addFolder(model, 'Zone');
  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001');
  relate(model, 'haz-contributes-to-scn', 'HAZ-001', 'SCN-001');

  equal(neighbourhood(model, 'ELM-9'), null, 'a missing selection has no neighbourhood');
  equal(neighbourhood(model, 'F-1'), null, 'nor does a folder');
  equal(neighbourhood(model, null), null, 'nor does no selection');

  const middle = neighbourhood(model, 'HAZ-001');
  equal(middle.subject.id, 'HAZ-001', 'the subject is the selection');
  deepEqual(middle.incoming.map((edge) => edge.other.id), ['ELM-001'], 'incoming edges resolve their sources');
  deepEqual(middle.outgoing.map((edge) => edge.other.id), ['SCN-001'], 'outgoing edges resolve their targets');

  const end = neighbourhood(model, 'ELM-001');
  deepEqual(end.outgoing.map((edge) => edge.other.id), ['HAZ-001'], 'the neighbourhood holds the direct relationships');
  ok(
    ![...end.outgoing, ...end.incoming].some((edge) => edge.other.id === 'SCN-001'),
    'and never what lies beyond them: the graph is the selection, not the model'
  );
}

summary('test-relationships');
