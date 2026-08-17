/**
 * Exercises the store: commit → snapshot → persist → restore, the
 * sequence-based saved pointer with dirty derived from identity, selection
 * repair, session state beside model state, and the blob set aside on a
 * failed restore. Run from this directory.
 */

import './shim.js';
import { createStore } from '../app/store.js';
import { openProject, serialise } from '../app/files.js';
import { createModel, addEntity, addFolder, removeEntity, relate, updateEntity } from '../app/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';

const PROJECT_KEY = 'openconformity.project';
const ASIDE_KEY = 'openconformity.project.aside';
const THEME_KEY = 'openconformity.theme';

/**
 * A localStorage stand-in over a Map, with a switch that makes writes
 * fail.
 * @param {Object<string, string>} [initial]
 */
function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    failing: false,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem(key, value) {
      if (this.failing) throw new Error('quota');
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
    read: (key) => (map.has(key) ? map.get(key) : null),
  };
}

/** The parsed blob a storage holds. */
function blobIn(storage) {
  const raw = storage.read(PROJECT_KEY);
  return raw === null ? null : JSON.parse(raw);
}

// --- A fresh start -----------------------------------------------------

{
  const storage = fakeStorage();
  const store = createStore({ storage });
  equal(store.restoration(), 'fresh', 'no blob means a fresh session');
  equal(store.model().nodes.size, 0, 'with an empty project');
  equal(store.dirty(), false, 'that stands saved');
  equal(store.selection(), null, 'and nothing selected');
  equal(store.canUndo(), false, 'and nothing to undo');
  equal(storage.read(PROJECT_KEY), null, 'opening the software writes nothing by itself');
  equal(storage.read(ASIDE_KEY), null, 'and sets nothing aside');
}

// --- Commit: record, persist, notify -----------------------------------

{
  const storage = fakeStorage();
  const store = createStore({ storage });
  let notified = 0;
  store.subscribe(() => { notified += 1; });

  const outcome = store.commit((model) => addEntity(model, 'ELM'));
  equal(outcome.ok, true, 'a commit returns the outcome of its change');
  equal(store.model().nodes.size, 1, 'the change landed');
  equal(store.dirty(), true, 'and the project is unsaved');
  equal(store.canUndo(), true, 'and undoable');
  equal(notified, 1, 'and everyone is told once');

  const blob = blobIn(storage);
  equal(blob.project.entities.length, 1, 'the change is persisted on change');
  equal(blob.session.dirty, true, 'with the derived dirty boolean beside it');

  const before = storage.read(PROJECT_KEY);
  const refused = store.commit((model) => addEntity(model, 'XXX'));
  equal(refused.ok, false, 'a refused change reports its refusal');
  equal(store.model().nodes.size, 1, 'and touches nothing');
  equal(storage.read(PROJECT_KEY), before, 'persists nothing');
  equal(notified, 1, 'and tells no one');
}

// --- The saved pointer -------------------------------------------------

{
  const store = createStore({ storage: fakeStorage() });
  store.commit((model) => addEntity(model, 'ELM'));
  equal(store.dirty(), true, 'a change dirties');
  store.markSaved();
  equal(store.dirty(), false, 'a save cleans');
  store.undo();
  equal(store.dirty(), true, 'stepping off the saved entry dirties');
  store.redo();
  equal(store.dirty(), false, 'stepping back onto it cleans: dirty is pointer identity, not a flag');

  store.commit((model) => addEntity(model, 'HAZ'));
  store.markSaved();
  store.undo();
  store.commit((model) => addEntity(model, 'SCN'));
  equal(store.dirty(), true, 'a change after an undo drops the saved entry');
  store.undo();
  equal(store.dirty(), true, 'and no reachable entry is the saved one any more');
}

// --- Selection and its repair ------------------------------------------

{
  const store = createStore({ storage: fakeStorage() });
  store.commit((model) => addFolder(model, 'Zone'));
  store.commit((model) => addEntity(model, 'ELM', { parent: 'F-1' }));
  store.commit((model) => addEntity(model, 'ELM', { parent: 'ELM-001' }));
  store.commit((model) => relate(model, 'elm-decomposes-into-elm', 'ELM-001', 'ELM-002'));

  store.select('ELM-999');
  equal(store.selection(), null, 'an identifier not in the model selects nothing');
  store.select('ELM-002');
  equal(store.selection(), 'ELM-002', 'a node can be selected');

  store.commit((model) => removeEntity(model, 'ELM-001'));
  equal(store.selection(), 'F-1', 'a vanished selection lands on the nearest surviving ancestor');
  store.undo();
  equal(store.selection(), 'F-1', 'undoing the deletion does not re-select what it restores');

  store.select('F-1');
  store.commit((model) => removeEntity(model, 'ELM-001'));
  equal(store.selection(), 'F-1', 'a surviving selection stays put');

  const rootStore = createStore({ storage: fakeStorage() });
  rootStore.commit((model) => addEntity(model, 'HAZ'));
  rootStore.select('HAZ-001');
  rootStore.commit((model) => removeEntity(model, 'HAZ-001'));
  equal(rootStore.selection(), null, 'with no surviving ancestor the selection falls to the root');
}

// --- Session state beside model state ----------------------------------

{
  const storage = fakeStorage();
  const store = createStore({ storage });
  store.commit((model) => addFolder(model, 'Zone'));
  store.markSaved();

  store.select('F-1');
  equal(store.dirty(), false, 'selecting does not dirty');
  equal(blobIn(storage).session.selection, 'F-1', 'but persists');

  store.setExpanded('F-1', true);
  equal(store.isExpanded('F-1'), true, 'a branch can be expanded');
  equal(store.dirty(), false, 'expanding does not mark the project unsaved');
  deepEqual(blobIn(storage).session.expanded, ['F-1'], 'but persists');

  store.commit((model) => addEntity(model, 'ELM', { parent: 'F-1' }));
  store.undo();
  equal(store.isExpanded('F-1'), true, 'undo does not collapse branches');

  store.setTheme('g100');
  equal(store.theme(), 'g100', 'a theme can be chosen');
  equal(storage.read(THEME_KEY), 'g100', 'keyed beside the project blob');
  equal(store.dirty(), false, 'without dirtying');
  store.setTheme('unheard-of');
  equal(store.theme(), null, 'an unknown theme falls back to the system preference');
  equal(storage.read(THEME_KEY), null, 'and stores nothing');
}

// --- The persistence loop ----------------------------------------------

{
  const storage = fakeStorage();
  const first = createStore({ storage });
  first.commit((model) => addFolder(model, 'Zone'));
  first.commit((model) => addEntity(model, 'ELM', { parent: 'F-1' }));
  first.commit((model) => updateEntity(model, 'ELM-001', { title: 'Assembly' }));
  first.setExpanded('F-1', true);
  first.select('ELM-001');
  first.setTheme('white');
  first.markSaved();

  const second = createStore({ storage });
  equal(second.restoration(), 'restored', 'the next session restores');
  equal(storage.read(ASIDE_KEY), null, 'a successful restore sets nothing aside');
  equal(serialise(second.model()), serialise(first.model()), 'the same project, through the same serialisation the file format uses');
  equal(second.selection(), 'ELM-001', 'standing where the user stood');
  equal(second.isExpanded('F-1'), true, 'with the tree open where it was open');
  equal(second.theme(), 'white', 'under the chosen theme');
  equal(second.dirty(), false, 'a clean session restores clean');
  equal(second.canUndo(), false, 'history does not cross sessions');

  second.commit((model) => addEntity(model, 'HAZ'));
  equal(second.dirty(), true, 'a change dirties the restored session');
  second.undo();
  equal(second.dirty(), false, 'a clean restore seeds the pointer at the initial entry');
}

// --- A dirty session restores dirty ------------------------------------

{
  const storage = fakeStorage();
  const first = createStore({ storage });
  first.commit((model) => addEntity(model, 'ELM'));
  equal(first.dirty(), true, 'unsaved work in the first session');

  const second = createStore({ storage });
  equal(second.dirty(), true, 'a dirty session restores dirty');
  second.commit((model) => addEntity(model, 'HAZ'));
  second.undo();
  equal(second.dirty(), true, 'a dirty restore seeds the pointer unreachable: no undoing reaches saved');
}

// --- A blob that fails to load is set aside ----------------------------

{
  const storage = fakeStorage({ [PROJECT_KEY]: 'not json{', [THEME_KEY]: 'g100' });
  const store = createStore({ storage });
  equal(store.restoration(), 'failed', 'the software states the previous session could not be restored');
  equal(store.model().nodes.size, 0, 'and stands on an empty project');
  equal(storage.read(ASIDE_KEY), 'not json{', 'the failed blob is copied to the side key at failure time');
  equal(storage.read(PROJECT_KEY), 'not json{', 'and the project key is not deleted either');
  equal(store.theme(), 'g100', 'the theme beside it still applies');

  store.commit((model) => addEntity(model, 'ELM'));
  ok(storage.read(PROJECT_KEY).startsWith('{'), 'the next successful persist overwrites the project key');
  equal(storage.read(ASIDE_KEY), 'not json{', 'while the side copy survives it');

  storage.setItem(PROJECT_KEY, 'worse json{');
  const second = createStore({ storage });
  equal(second.restoration(), 'failed', 'a later failure fails the restore again');
  equal(storage.read(ASIDE_KEY), 'worse json{', 'and replaces the side copy: it survives until the next failure');
}

// --- A well-formed blob that fails the gates ----------------------------

{
  const raw = JSON.stringify({ project: { format: 'something-else' }, session: { dirty: true } });
  const storage = fakeStorage({ [PROJECT_KEY]: raw });
  const store = createStore({ storage });
  equal(store.restoration(), 'failed', 'a blob refused by the loader fails the restore');
  equal(storage.read(ASIDE_KEY), raw, 'and is copied to the side key too');
  equal(storage.read(PROJECT_KEY), raw, 'with the project key untouched');
  equal(typeof store.restoration(), 'string', 'the store reports a state, never a file refusal');
}

// --- A stale selection in the blob -------------------------------------

{
  const storage = fakeStorage();
  const first = createStore({ storage });
  first.commit((model) => addEntity(model, 'ELM'));
  first.select('ELM-001');
  const tampered = storage.read(PROJECT_KEY).replace('"selection":"ELM-001"', '"selection":"ELM-999"');
  storage.setItem(PROJECT_KEY, tampered);

  const second = createStore({ storage });
  equal(second.restoration(), 'restored', 'the project still restores');
  equal(second.selection(), null, 'a selection no longer in the model restores as nothing');
}

// --- Replacing the project ---------------------------------------------

{
  const storage = fakeStorage();
  const store = createStore({ storage });
  store.commit((model) => addEntity(model, 'ELM'));
  store.select('ELM-001');
  store.setExpanded('ELM-001', true);
  store.setTheme('g100');

  const loaded = openProject(readFile('fixtures/valid.json'));
  store.replaceProject(loaded.model);
  equal(store.model().name, 'Fixture project', 'the opened project is installed');
  equal(store.dirty(), false, 'standing saved');
  equal(store.canUndo(), false, 'with a fresh history');
  equal(store.selection(), null, 'nothing selected');
  equal(store.isExpanded('ELM-001'), false, 'no branches expanded');
  equal(store.theme(), 'g100', 'and the theme untouched');
  equal(blobIn(storage).project.name, 'Fixture project', 'the replacement is persisted');
}

// --- Picker mode -------------------------------------------------------

{
  const store = createStore({ storage: fakeStorage() });
  store.commit((model) => addEntity(model, 'ELM'));
  store.commit((model) => addEntity(model, 'HAZ'));
  store.commit((model) => addEntity(model, 'HAZ'));
  store.commit((model) => addFolder(model, 'Zone'));

  equal(store.picker(), null, 'no workflow is in progress at first');
  store.beginPicking('ELM-9');
  equal(store.picker(), null, 'picking cannot begin on what is not in the model');
  store.beginPicking('F-1');
  equal(store.picker(), null, 'nor on a folder');

  store.beginPicking('ELM-001');
  deepEqual(store.picker(), { subject: 'ELM-001', form: null, picks: [] }, 'picking begins pinned to its subject');
  store.togglePick('HAZ-001');
  deepEqual(store.picker().picks, [], 'no pick lands before a form is chosen');

  store.setPickerForm({ typeId: 'elm-exhibits-haz', direction: 'outgoing' });
  store.togglePick('HAZ-001');
  store.togglePick('HAZ-002');
  deepEqual(store.picker().picks, ['HAZ-001', 'HAZ-002'], 'picks accumulate');
  store.togglePick('HAZ-001');
  deepEqual(store.picker().picks, ['HAZ-002'], 'and toggle back off');

  const copy = store.picker();
  copy.picks.push('HAZ-009');
  deepEqual(store.picker().picks, ['HAZ-002'], 'the picks ride out as a copy');

  store.commit((model) => addEntity(model, 'SCN'));
  deepEqual(store.picker().picks, ['HAZ-002'], 'the mode survives commits');

  store.commit((model) => removeEntity(model, 'HAZ-002'));
  ok(store.picker() !== null, 'a commit that removes a picked entity leaves the workflow open');
  deepEqual(store.picker().picks, [], 'and clears that pick');

  store.togglePick('HAZ-001');
  store.setPickerForm({ typeId: 'elm-decomposes-into-elm', direction: 'outgoing' });
  deepEqual(store.picker().picks, [], 'changing the form drops the picks: they belong to a form');

  store.commit((model) => removeEntity(model, 'ELM-001'));
  equal(store.picker(), null, 'a commit that removes the subject closes the workflow');
  store.undo();
  equal(store.picker(), null, 'and undoing the deletion does not reopen it');

  store.endPicking();
  equal(store.picker(), null, 'ending a closed workflow is nothing');
}

// --- Picker repair under undo and redo ---------------------------------

{
  const store = createStore({ storage: fakeStorage() });
  store.commit((model) => addEntity(model, 'ELM'));
  store.commit((model) => addEntity(model, 'HAZ'));
  store.beginPicking('ELM-001');
  store.setPickerForm({ typeId: 'elm-exhibits-haz', direction: 'outgoing' });
  store.togglePick('HAZ-001');

  store.undo();
  ok(store.picker() !== null, 'an undo that removes a picked entity leaves the workflow open');
  deepEqual(store.picker().picks, [], 'and clears that pick');
  store.redo();
  deepEqual(store.picker().picks, [], 'a cleared pick stays cleared: redo does not re-pick');

  store.undo();
  store.undo();
  equal(store.picker(), null, 'an undo that removes the subject closes the workflow');
}

// --- Picker mode is never persisted ------------------------------------

{
  const storage = fakeStorage();
  const store = createStore({ storage });
  store.commit((model) => addEntity(model, 'ELM'));
  store.beginPicking('ELM-001');
  store.commit((model) => addEntity(model, 'HAZ'));
  deepEqual(
    Object.keys(blobIn(storage).session),
    ['selection', 'expanded', 'dirty'],
    'the blob carries session state and no picker'
  );

  const second = createStore({ storage });
  equal(second.picker(), null, 'a restored session starts with no workflow');

  store.replaceProject(createModel());
  equal(store.picker(), null, 'replacing the project closes the workflow');
}

// --- A failing persist -------------------------------------------------

{
  const storage = fakeStorage();
  const store = createStore({ storage });
  storage.failing = true;
  const outcome = store.commit((model) => addEntity(model, 'ELM'));
  equal(outcome.ok, true, 'the change itself still lands');
  equal(store.model().nodes.size, 1, 'in the model');
  equal(store.persistFailed(), true, 'and the failed persist is on record');

  storage.failing = false;
  store.commit((model) => addEntity(model, 'HAZ'));
  equal(store.persistFailed(), false, 'a later successful persist clears it');
  equal(blobIn(storage).project.entities.length, 2, 'and writes the whole state');
}

summary('test-store');
