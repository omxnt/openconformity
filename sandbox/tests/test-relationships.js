/**
 * Exercises the relationship pane logic that needs no page: the picker's
 * union candidate set, the relationship a pair means and its ambiguity
 * fallback, the grouped panel rows, the grouped directional list, and
 * the neighbourhood the graph draws — the selection and its direct
 * relationships, never the whole model. Run from this directory.
 */

import { pickerCandidates, pairOptions, groupedPicks } from '../app/relate.js';
import { neighbourhood, cappedNeighbourhood, caption, MAX_PER_SIDE } from '../app/graph-view.js';
import { groupedRelationships } from '../app/relationships-view.js';
import { relationshipOptions } from '../app/queries.js';
import { createModel, addEntity, addFolder, relate } from '../app/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';

// --- The union candidate set -------------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'ELM');
  addEntity(model, 'HAZ');
  addEntity(model, 'LEG');
  addFolder(model, 'Zone');

  deepEqual([...pickerCandidates(model, null)], [], 'no workflow, no candidates');

  const picker = { subject: 'ELM-001' };
  const union = new Set();
  for (const option of relationshipOptions(model, 'ELM-001')) {
    for (const candidate of option.candidates) union.add(candidate.id);
  }
  deepEqual([...pickerCandidates(model, picker)].sort(), [...union].sort(), 'the candidate set is the union over all forms');
  ok(pickerCandidates(model, picker).has('HAZ-001'), 'one form contributes a hazard');
  ok(pickerCandidates(model, picker).has('ELM-002'), 'another the second element');
  ok(pickerCandidates(model, picker).has('LEG-001'), 'another the legislation');
  ok(!pickerCandidates(model, picker).has('F-1'), 'a folder is never a candidate');
}

// --- What a pair means -------------------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'ELM');
  addEntity(model, 'HAZ');

  deepEqual(
    pairOptions(model, 'ELM-001', 'HAZ-001'),
    [{ typeId: 'elm-exhibits-haz', direction: 'outgoing' }],
    'a pair admitting exactly one relationship infers it'
  );
  deepEqual(
    pairOptions(model, 'ELM-001', 'ELM-002'),
    [
      { typeId: 'elm-decomposes-into-elm', direction: 'outgoing' },
      { typeId: 'elm-decomposes-into-elm', direction: 'incoming' },
    ],
    'a pair admitting more than one lists them all, in metamodel order'
  );

  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001');
  deepEqual(pairOptions(model, 'ELM-001', 'HAZ-001'), [], 'a relationship that exists empties its pair');
}

// --- The grouped picks -------------------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'ELM');
  addEntity(model, 'HAZ');
  addEntity(model, 'HAZ');

  const picker = {
    subject: 'ELM-001',
    picks: [
      { id: 'HAZ-001', form: null },
      { id: 'ELM-002', form: null },
      { id: 'HAZ-002', form: null },
    ],
  };
  const groups = groupedPicks(model, picker);
  deepEqual(
    groups.map((group) => [group.label, group.rows.map((row) => row.id)]),
    [
      ['decomposes into — System Element', ['ELM-002']],
      ['exhibits — Single Hazard', ['HAZ-001', 'HAZ-002']],
    ],
    'picks group by the relationship each pair means, groups sorted by label, rows in pick order'
  );
  equal(groups[0].rows[0].ambiguous, true, 'a pair with more than one option says so');
  equal(groups[0].rows[0].options.length, 2, 'and carries only that pair\'s options');
  equal(groups[1].rows[0].ambiguous, false, 'a pair with one option groups silently');

  const chosen = groupedPicks(model, {
    subject: 'ELM-001',
    picks: [{ id: 'ELM-002', form: { typeId: 'elm-decomposes-into-elm', direction: 'incoming' } }],
  });
  deepEqual(
    chosen.map((group) => group.label),
    ['System Element — decomposes into'],
    'a chosen relationship groups the pick under its own label'
  );
  deepEqual(
    chosen[0].form,
    { typeId: 'elm-decomposes-into-elm', direction: 'incoming' },
    'and the group carries the form Done will commit'
  );

  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001');
  const stale = groupedPicks(model, { subject: 'ELM-001', picks: [{ id: 'HAZ-001', form: null }] });
  deepEqual(
    stale.map((group) => [group.form, group.rows.map((row) => row.id)]),
    [[null, ['HAZ-001']]],
    'a pick whose pair no longer admits anything falls into the trailing stale group'
  );
  equal(stale[0].label, 'No longer possible', 'named for what it is');
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

// --- The graph caps a side at seven ------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  for (let count = 0; count < 9; count += 1) {
    addEntity(model, 'HAZ');
    relate(model, 'elm-exhibits-haz', 'ELM-001', `HAZ-${String(count + 1).padStart(3, '0')}`);
  }
  addEntity(model, 'CAS');
  relate(model, 'cas-assesses-elm', 'CAS-001', 'ELM-001');

  equal(MAX_PER_SIDE, 7, 'seven boxes a side');
  const capped = cappedNeighbourhood(neighbourhood(model, 'ELM-001'));
  equal(capped.right.length, 7, 'the ninth outgoing edge does not widen the canvas');
  equal(capped.moreOutgoing, 2, 'what lies beyond is counted');
  equal(capped.left.length, 1, 'the sparse side draws whole');
  equal(capped.moreIncoming, 0, 'and counts nothing');
}

// --- The box caption ----------------------------------------------------

{
  const model = createModel();
  const entity = addEntity(model, 'ELM').entity;
  equal(caption(entity), 'ELM-001', 'an untitled box captions its identifier');
  entity.attributes.title = 'Short name';
  equal(caption(entity), 'Short name', 'a title within the box rides whole');
  entity.attributes.title = 'A title that runs well past what three lines hold';
  equal(caption(entity), 'A title that runs well pas…', 'a long one cuts to what the box holds');
  equal(caption(entity).length, 27, 'at twenty-seven characters');
}

summary('test-relationships');
