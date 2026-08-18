/**
 * Exercises the relationship pane logic that needs no page: the picker's
 * union candidate set, the relationship a pair means and its ambiguity
 * fallback, the grouped panel rows, the grouped directional list, and
 * the neighbourhood the graph draws — the selection and its direct
 * relationships, never the whole model. Run from this directory.
 */

import { pickerCandidates, pairOptions, pickedRows } from '../app/relate.js';
import {
  neighbourhood,
  cappedNeighbourhood,
  caption,
  MAX_PER_SIDE,
  pendingNeighbours,
  attachmentYs,
  doglegPoints,
  subjectHeight,
} from '../app/graph.js';
import { groupedRelationships, relationshipRows, relationshipTables, presentedRows } from '../app/relationships.js';
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
    relationshipRows(model, 'ELM-001').map((row) => [row.direction, row.label, row.other.id]),
    [
      ['outgoing', 'exhibits', 'HAZ-001'],
      ['outgoing', 'exhibits', 'HAZ-002'],
      ['outgoing', 'decomposes into', 'ELM-002'],
      ['incoming', 'assesses', 'CAS-001'],
    ],
    'the table flattens the same grouping: outgoing before incoming, types adjacent, model order within'
  );
  deepEqual(relationshipRows(model, 'F-1'), [], 'a folder makes no rows');
  deepEqual(relationshipRows(model, null), [], 'nor does no selection');
}

// --- The picks as the table lands them -----------------------------------

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
  const rows = pickedRows(model, picker);
  deepEqual(
    rows.map((row) => [row.id, row.form?.typeId ?? null, row.ambiguous]),
    [
      ['HAZ-001', 'elm-exhibits-haz', false],
      ['ELM-002', 'elm-decomposes-into-elm', true],
      ['HAZ-002', 'elm-exhibits-haz', false],
    ],
    'each pick carries the relationship its pair means: the only option silently, the first when ambiguous'
  );
  equal(rows[1].options.length, 2, 'and an ambiguous pair carries only its own options');

  const chosen = pickedRows(model, {
    subject: 'ELM-001',
    picks: [{ id: 'ELM-002', form: { typeId: 'elm-decomposes-into-elm', direction: 'incoming' } }],
  });
  deepEqual(chosen[0].form, { typeId: 'elm-decomposes-into-elm', direction: 'incoming' }, 'a chosen form holds while the model admits it');

  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001');
  const stale = pickedRows(model, { subject: 'ELM-001', picks: [{ id: 'HAZ-001', form: null }] });
  equal(stale[0].form, null, 'a pick whose pair no longer admits anything carries no form');
}

// --- The tables, real and provisional together ----------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'ELM');
  addEntity(model, 'HAZ');
  addEntity(model, 'HAZ');
  addEntity(model, 'CAS');
  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001');
  relate(model, 'cas-assesses-elm', 'CAS-001', 'ELM-001');

  const still = relationshipTables(model, 'ELM-001', null);
  deepEqual(
    still.outgoing.map((row) => [row.kind, row.other.id]),
    [['real', 'HAZ-001']],
    'without a picker the tables are the real rows'
  );
  deepEqual(still.incoming.map((row) => [row.kind, row.other.id]), [['real', 'CAS-001']], 'split by direction');
  deepEqual(still.stale, [], 'and nothing is stale');

  relate(model, 'elm-decomposes-into-elm', 'ELM-001', 'ELM-002');
  addEntity(model, 'HAZ');
  addEntity(model, 'ELM');
  const picker = {
    subject: 'ELM-001',
    picks: [
      { id: 'HAZ-002', form: null },
      { id: 'HAZ-003', form: null },
      { id: 'ELM-003', form: { typeId: 'elm-decomposes-into-elm', direction: 'incoming' } },
    ],
  };
  const tables = relationshipTables(model, 'ELM-001', picker);
  deepEqual(
    tables.outgoing.map((row) => [row.kind, row.other.id]),
    [['real', 'HAZ-001'], ['pending', 'HAZ-002'], ['pending', 'HAZ-003'], ['real', 'ELM-002']],
    'a pick lands after the last row of its relationship group, inside the standing order, never at the end'
  );
  deepEqual(
    tables.incoming.map((row) => [row.kind, row.other.id]),
    [['real', 'CAS-001'], ['pending', 'ELM-003']],
    'a pick with no group opens one at its direction\'s end'
  );

  const elsewhere = relationshipTables(model, 'HAZ-001', picker);
  ok(elsewhere.outgoing.every((row) => row.kind === 'real'), 'another subject\'s table takes no picks');

  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-002');
  const gone = relationshipTables(model, 'ELM-001', { subject: 'ELM-001', picks: [{ id: 'HAZ-002', form: null }] });
  deepEqual(
    gone.stale.map((row) => [row.kind, row.label, row.other.id]),
    [['pending', 'No longer possible', 'HAZ-002']],
    'a pick whose pair no longer admits anything falls to the stale strip'
  );
}

// --- The presented rows: sort and filter over the grouped order -----------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'HAZ');
  addEntity(model, 'HAZ');
  addEntity(model, 'ELM');
  const { updateEntity } = await import('../app/model.js');
  updateEntity(model, 'HAZ-001', { title: 'Zulu' });
  updateEntity(model, 'HAZ-002', { title: 'Alpha' });
  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001');
  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-002');
  relate(model, 'elm-decomposes-into-elm', 'ELM-001', 'ELM-002');

  const rows = relationshipTables(model, 'ELM-001', {
    subject: 'ELM-001',
    picks: [],
  }).outgoing;

  deepEqual(
    presentedRows(rows, null, '').map((row) => row.other.id),
    ['HAZ-001', 'HAZ-002', 'ELM-002'],
    'no sort, no filter: the grouped order stands'
  );
  deepEqual(
    presentedRows(rows, { column: 'entity', direction: 'asc' }, '').map((row) => row.other.id),
    ['ELM-002', 'HAZ-001', 'HAZ-002'],
    'sorting by the far end suspends the grouped order'
  );
  deepEqual(
    presentedRows(rows, { column: 'entity', direction: 'desc' }, '').map((row) => row.other.id),
    ['HAZ-002', 'HAZ-001', 'ELM-002'],
    'and descends when asked'
  );
  deepEqual(
    presentedRows(rows, { column: 'relationship', direction: 'asc' }, '').map((row) => row.label),
    ['decomposes into', 'exhibits', 'exhibits'],
    'the relationship column sorts by its label'
  );
  deepEqual(
    presentedRows(rows, null, 'alpha').map((row) => row.other.id),
    ['HAZ-002'],
    'the filter matches a title'
  );
  deepEqual(
    presentedRows(rows, null, 'haz-001').map((row) => row.other.id),
    ['HAZ-001'],
    'a designation'
  );
  deepEqual(
    presentedRows(rows, null, 'decomposes').map((row) => row.other.id),
    ['ELM-002'],
    'and a relationship label'
  );
}

// --- The picks as provisional neighbours -----------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'ELM');
  addEntity(model, 'HAZ');
  addEntity(model, 'CAS');

  const sides = pendingNeighbours(model, {
    subject: 'ELM-001',
    picks: [
      { id: 'HAZ-001', form: null },
      { id: 'ELM-002', form: { typeId: 'elm-decomposes-into-elm', direction: 'incoming' } },
    ],
  });
  deepEqual(
    sides.outgoing.map((entry) => [entry.other.id, entry.label, entry.ambiguous]),
    [['HAZ-001', 'exhibits', false]],
    'an outgoing pick rides the right side with the label its pair means'
  );
  deepEqual(
    sides.incoming.map((entry) => [entry.other.id, entry.label, entry.ambiguous]),
    [['ELM-002', 'decomposes into', true]],
    'an incoming pick the left, its ambiguity marked'
  );
  equal(sides.ambiguous, 1, 'and counted for the hint');

  relate(model, 'cas-assesses-elm', 'CAS-001', 'ELM-001');
  const gone = pendingNeighbours(model, { subject: 'ELM-001', picks: [{ id: 'CAS-001', form: null }] });
  deepEqual([gone.outgoing, gone.incoming], [[], []], 'a stale pick stays off the canvas: the list carries it');
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

// --- The orthogonal layout ------------------------------------------------

{
  deepEqual(attachmentYs(3, 120), [30, 60, 90], 'attachments spread evenly along the subject');
  deepEqual(attachmentYs(1, 64), [32], 'a single edge attaches at the middle');
  deepEqual(attachmentYs(0, 64), [], 'no edges, no attachments');
  equal(
    doglegPoints(240, 100, 352, 384, 400, 150),
    '240,100 352,100 384,150 400,150',
    'a dogleg is horizontal out, one slant across the shared band, horizontal in'
  );
  equal(
    doglegPoints(240, 100, 352, 384, 400, 100),
    '240,100 400,100',
    'a port level with its lane routes dead straight'
  );
  equal(subjectHeight(3), 64, 'a quiet subject keeps the box height');
  equal(subjectHeight(7), 120, 'a busy one grows modestly to give the attachments room');

}

// --- The fold: a cap that opens, and picks that ignore it -----------------

{
  const real = Array.from({ length: 9 }, (unused, index) => ({ relationship: { type: 'elm-exhibits-haz' }, other: { id: `HAZ-00${index}` } }));
  const pending = [
    { pending: true, other: { id: 'HAZ-100' }, label: 'exhibits', ambiguous: false },
    { pending: true, other: { id: 'HAZ-101' }, label: 'exhibits', ambiguous: false },
  ];
  const around = { subject: { id: 'ELM-001' }, incoming: [...real, ...pending], outgoing: [] };

  const folded = cappedNeighbourhood(around);
  equal(folded.left.length, MAX_PER_SIDE + 2, 'a folded side caps the real boxes; the picks always draw');
  equal(folded.moreIncoming, 2, 'and counts what the fold holds');
  ok(folded.left.slice(MAX_PER_SIDE).every((entry) => entry.pending === true), 'the picks ride beyond the cap');

  const open = cappedNeighbourhood(around, { incoming: true, outgoing: false });
  equal(open.left.length, 11, 'unfolding a side draws everything');
  equal(open.moreIncoming, 0, 'with nothing left to count');
}

summary('test-relationships');
