/**
 * Exercises the history: undo and redo over snapshots, the counters riding
 * outside them, sequence numbers under truncation and eviction, and the
 * independence of the entries from the live model. Run from this
 * directory.
 */

import './shim.js';
import { createHistory } from '../app/history.js';
import { createModel, addEntity, updateEntity, relate, nodeOf } from '../app/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';

// --- The line ----------------------------------------------------------

{
  let model = createModel();
  const history = createHistory(model);
  equal(history.canUndo(), false, 'a fresh history has nothing to undo');
  equal(history.canRedo(), false, 'nor to redo');
  equal(history.sequence(), 0, 'the initial entry has the first sequence');
  equal(history.undo(model), null, 'undo at the bottom returns null');
  equal(history.redo(model), null, 'redo at the top returns null');

  addEntity(model, 'ELM');
  equal(history.record(model), 1, 'a recorded change takes the next sequence');
  equal(history.canUndo(), true, 'and can be undone');

  updateEntity(model, 'ELM-001', { title: 'Mixer' });
  history.record(model);

  model = history.undo(model);
  equal(nodeOf(model, 'ELM-001').attributes.title, undefined, 'undo reverts the most recent change');
  equal(history.canRedo(), true, 'which can be redone');
  model = history.redo(model);
  equal(nodeOf(model, 'ELM-001').attributes.title, 'Mixer', 'redo reapplies it');
  equal(history.canRedo(), false, 'and the top is reached again');
}

// --- Counters outside snapshots ----------------------------------------

{
  let model = createModel();
  const history = createHistory(model);
  addEntity(model, 'ELM');
  history.record(model);

  model = history.undo(model);
  equal(nodeOf(model, 'ELM-001'), null, 'the undone creation is gone');
  equal(model.counters.ELM, 2, 'but the counter did not roll back');
  equal(addEntity(model, 'ELM').entity.id, 'ELM-002', 'so the undone number is a hole, never reissued');

  history.record(model);
  model = history.undo(model);
  model = history.redo(model);
  equal(model.counters.ELM, 3, 'redo does not move the counters either');
  deepEqual(Object.keys(model.counters).length, 19, 'every counter rides across undo and redo');
}

// --- Name and relationships travel with the snapshot -------------------

{
  let model = createModel();
  const history = createHistory(model);
  addEntity(model, 'ELM');
  addEntity(model, 'HAZ');
  history.record(model);

  model.name = 'Mixer line';
  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001');
  history.record(model);

  model = history.undo(model);
  equal(model.name, '', 'the name is content and rolls back');
  equal(model.relationships.size, 0, 'the relationships are content and roll back');
  model = history.redo(model);
  equal(model.name, 'Mixer line', 'and both return on redo');
  equal(model.relationships.size, 1, 'intact');
}

// --- Truncation --------------------------------------------------------

{
  let model = createModel();
  const history = createHistory(model);
  addEntity(model, 'ELM');
  history.record(model);
  addEntity(model, 'HAZ');
  const dropped = history.record(model);

  model = history.undo(model);
  addEntity(model, 'SCN');
  const recorded = history.record(model);
  equal(history.canRedo(), false, 'a change after an undo drops everything ahead of the cursor');
  ok(recorded > dropped, 'a dropped sequence is never reused');
  equal(history.sequence(), recorded, 'the cursor stands at the new entry');
}

// --- Depth eviction ----------------------------------------------------

{
  let model = createModel();
  const history = createHistory(model);
  for (let step = 0; step < 60; step += 1) {
    addEntity(model, 'ELM');
    history.record(model);
  }
  let undos = 0;
  while (history.canUndo()) {
    model = history.undo(model);
    undos += 1;
  }
  equal(undos, 50, 'the history reaches fifty steps back and no further');
  equal(history.undo(model), null, 'the evicted past is unreachable');
  equal(model.counters.ELM, 61, 'the counters never rolled back on the way');
  equal(history.sequence(), 10, 'the oldest surviving entry keeps its own sequence');
}

// --- Reset -------------------------------------------------------------

{
  let model = createModel();
  const history = createHistory(model);
  addEntity(model, 'ELM');
  const before = history.record(model);

  const seeded = history.reset(model);
  equal(history.canUndo(), false, 'a reset history has nothing to undo');
  equal(history.canRedo(), false, 'nor to redo');
  ok(seeded > before, 'the reset entry takes a fresh sequence, never one already issued');
  equal(history.sequence(), seeded, 'and the cursor stands on it');
}

// --- The entries are nobody else's -------------------------------------

{
  const model = createModel();
  const history = createHistory(model);
  addEntity(model, 'ELM');
  updateEntity(model, 'ELM-001', { title: 'Mixer' });
  history.record(model);
  updateEntity(model, 'ELM-001', { title: 'Blender' });
  history.record(model);

  updateEntity(model, 'ELM-001', { title: 'Corrupted' });
  let undone = history.undo(model);
  equal(nodeOf(undone, 'ELM-001').attributes.title, 'Mixer', 'undo returns what was recorded');
  const redone = history.redo(undone);
  equal(nodeOf(redone, 'ELM-001').attributes.title, 'Blender', 'a change never recorded reaches no entry');

  undone = history.undo(redone);
  updateEntity(undone, 'ELM-001', { title: 'Kneader' });
  const again = history.redo(undone);
  equal(nodeOf(history.undo(again), 'ELM-001').attributes.title, 'Mixer', 'a change made to a restored model does not reach the entry');
}

summary('test-history');
