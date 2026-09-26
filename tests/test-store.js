/**
 * Exercises the store: the landing session with no project, commit →
 * snapshot → persist → restore through the retention, the sequence-based
 * saved pointer with dirty derived from identity, rollback leaving no
 * residue, selection repair, session state beside model state, picker
 * mode, the blob set aside on a failed restore, the move of a blob the
 * previous generation kept in web storage, and the storage nearly full.
 * Run from this directory.
 */

import './shim.js';
import { createStore } from '../app/modules/store.js';
import { memoryRetention, createRetention } from '../app/modules/retention.js';
import { openProject, serialise } from '../app/modules/files.js';
import { createModel, addEntity, addFolder, removeEntity, relate, updateEntity } from '../app/modules/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';
import { fakeStorage } from './helpers.js';

const PROJECT_KEY = 'openconformity.project';
const ASIDE_KEY = 'openconformity.project.aside';
const THEME_KEY = 'openconformity.theme';

/** The blob a retention holds, once every write asked of the store has landed. */
async function blobIn(store, retention) {
  await store.whenPersisted();
  return retention.records.get('project') ?? null;
}

/** A store over the retention with a fresh project open, past the landing. */
function openStore(retention, storage = fakeStorage()) {
  const store = createStore({ storage, retention });
  store.replaceProject(createModel());
  return store;
}

/** A store restored from what the retention and the storage hold. */
async function restored(retention, storage = fakeStorage(), session = null) {
  const store = createStore({ storage, session, retention });
  await store.restore();
  return store;
}

// --- A fresh session has no project ------------------------------------

{
  const storage = fakeStorage();
  const retention = memoryRetention();
  const store = createStore({ storage, retention });
  await store.restore();
  equal(store.restoration(), 'fresh', 'no blob means a fresh session');
  equal(store.hasProject(), false, 'and a fresh session has no project');
  equal(store.dirty(), false, 'nothing is dirty');
  equal(store.selection(), null, 'nothing is selected');
  equal(store.canUndo(), false, 'nothing undoes');

  const refused = store.commit((model) => addEntity(model, 'ELM'));
  equal(refused.ok, false, 'nothing commits without a project');
  equal(store.model().nodes.size, 0, 'and the latent model stays empty');
  store.select('ELM-001');
  equal(store.selection(), null, 'nothing selects');
  store.markSaved();
  equal(await blobIn(store, retention), null, 'and nothing is ever persisted from the landing');
  equal(retention.records.has('aside'), false, 'nor set aside');

  store.replaceProject(createModel());
  equal(store.hasProject(), true, 'creating the project is one action');
  equal(store.model().name, '', 'unconfigured, its name empty');
  equal(store.dirty(), false, 'standing saved');
  ok((await blobIn(store, retention)) !== null, 'and persisted, so the next session restores it');
  equal('persist' in retention, false, 'and the browser is never asked to mark the storage persistent, a prompt that buys little');

  const second = await restored(retention, storage);
  equal(second.restoration(), 'restored', 'a restored session with a project');
  equal(second.hasProject(), true, 'skips the landing');
}

// --- Commit: record, persist, notify -----------------------------------

{
  const retention = memoryRetention();
  const store = openStore(retention);
  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });

  const outcome = store.commit((model) => addEntity(model, 'ELM'));
  equal(outcome.ok, true, 'a commit returns the outcome of its change');
  equal(store.model().nodes.size, 1, 'the change landed');
  equal(store.dirty(), true, 'and the project is unsaved');
  equal(store.canUndo(), true, 'and undoable');
  equal(notified, 1, 'and everyone is told once');

  const blob = await blobIn(store, retention);
  equal(blob.project.entities.length, 1, 'the change is persisted on change');
  equal(blob.session.dirty, true, 'with the derived dirty boolean beside it');

  const before = retention.records.get('project');
  const refused = store.commit((model) => addEntity(model, 'XXX'));
  equal(refused.ok, false, 'a refused change reports its refusal');
  equal(store.model().nodes.size, 1, 'and touches nothing');
  await store.whenPersisted();
  equal(retention.records.get('project'), before, 'persists nothing');
  equal(notified, 1, 'and tells no one');
}

// --- A burst of changes costs one write ----------------------------------

{
  const retention = memoryRetention();
  const writes = [];
  const write = retention.write;
  retention.write = async (key, value) => {
    writes.push(value.project.entities.length);
    return write(key, value);
  };
  const store = openStore(retention);
  await store.whenPersisted();
  writes.length = 0;
  store.commit((model) => addEntity(model, 'ELM'));
  store.commit((model) => addEntity(model, 'ELM'));
  store.commit((model) => addEntity(model, 'ELM'));
  await store.whenPersisted();
  deepEqual(writes, [3], 'three changes in one burst cost one write, of the newest, the rest skipped as stale');
  equal(retention.records.get('project').project.entities.length, 3, 'and the retention holds the newest');
}

// --- The saved pointer -------------------------------------------------

{
  const store = openStore(memoryRetention());
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

// --- Rollback leaves no residue ----------------------------------------

{
  const store = openStore(memoryRetention());
  store.commit((model) => addEntity(model, 'ELM'));
  store.markSaved();
  const saved = store.sequence();

  store.commit((model) => addEntity(model, 'HAZ'));
  const rolled = store.sequence();
  equal(store.rollback(), true, 'the newest change can be rolled back');
  equal(store.model().nodes.size, 1, 'its content is gone');
  equal(store.canRedo(), false, 'with no redo left behind');
  equal(store.sequence(), saved, 'the cursor stands where it stood');
  equal(store.dirty(), false, 'so a rollback to the saved entry is clean');

  store.commit((model) => addEntity(model, 'SCN'));
  ok(store.sequence() > rolled, 'a dropped sequence is never reused');

  equal(store.rollback(), true, 'rollback steps entry by entry');
  equal(store.rollback(), true, 'down to the initial entry');
  equal(store.rollback(), false, 'and refuses at the bottom');
  equal(store.model().nodes.size, 0, 'where the project stands empty');
}

// --- Selection and its repair ------------------------------------------

{
  const store = openStore(memoryRetention());
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

  const rootStore = openStore(memoryRetention());
  rootStore.commit((model) => addEntity(model, 'HAZ'));
  rootStore.select('HAZ-001');
  rootStore.commit((model) => removeEntity(model, 'HAZ-001'));
  equal(rootStore.selection(), null, 'with no surviving ancestor the selection falls to the root');
}

// --- Session state beside model state ----------------------------------

{
  const storage = fakeStorage();
  const retention = memoryRetention();
  const store = openStore(retention, storage);
  store.commit((model) => addFolder(model, 'Zone'));
  store.markSaved();

  store.select('F-1');
  equal(store.dirty(), false, 'selecting does not dirty');
  equal((await blobIn(store, retention)).session.selection, 'F-1', 'but persists');

  store.setExpanded('F-1', true);
  equal(store.isExpanded('F-1'), true, 'a branch can be expanded');
  equal(store.dirty(), false, 'expanding does not mark the project unsaved');
  deepEqual((await blobIn(store, retention)).session.expanded, ['F-1'], 'but persists');

  store.commit((model) => addEntity(model, 'ELM', { parent: 'F-1' }));
  store.undo();
  equal(store.isExpanded('F-1'), true, 'undo does not collapse branches');

  store.setTheme('g100');
  equal(store.theme(), 'g100', 'a theme can be chosen');
  equal(storage.read(THEME_KEY), 'g100', 'keyed in web storage, where the bootstrap reads it before the first paint');
  equal(store.dirty(), false, 'without dirtying');
  store.setTheme('unheard-of');
  equal(store.theme(), null, 'an unknown theme falls back to the system preference');
  equal(storage.read(THEME_KEY), null, 'and stores nothing');
}

// --- The persistence loop ----------------------------------------------

{
  const storage = fakeStorage();
  const retention = memoryRetention();
  const first = openStore(retention, storage);
  first.commit((model) => addFolder(model, 'Zone'));
  first.commit((model) => addEntity(model, 'ELM', { parent: 'F-1' }));
  first.commit((model) => updateEntity(model, 'ELM-001', { title: 'Assembly' }));
  first.setExpanded('F-1', true);
  first.select('ELM-001');
  first.setTheme('white');
  first.markSaved();
  await first.whenPersisted();

  const second = await restored(retention, storage);
  equal(second.restoration(), 'restored', 'the next session restores');
  equal(retention.records.has('aside'), false, 'a successful restore sets nothing aside');
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
  const retention = memoryRetention();
  const first = openStore(retention);
  first.commit((model) => addEntity(model, 'ELM'));
  equal(first.dirty(), true, 'unsaved work in the first session');
  await first.whenPersisted();

  const second = await restored(retention);
  equal(second.dirty(), true, 'a dirty session restores dirty');
  second.commit((model) => addEntity(model, 'HAZ'));
  second.undo();
  equal(second.dirty(), true, 'a dirty restore seeds the pointer unreachable: no undoing reaches saved');
}

// --- A blob that fails to load is set aside ----------------------------

{
  const storage = fakeStorage({ [THEME_KEY]: 'g100' });
  const retention = memoryRetention({ initial: { project: 'not a blob' } });
  const store = await restored(retention, storage);
  equal(store.restoration(), 'failed', 'the software states the previous session could not be restored');
  equal(store.hasProject(), false, 'and stands on the landing');
  equal(retention.records.get('aside'), 'not a blob', 'the failed blob is copied to the side record at failure time');
  equal(retention.records.get('project'), 'not a blob', 'and the project record is not deleted either');
  equal(store.theme(), 'g100', 'the theme beside it still applies');

  store.replaceProject(createModel());
  store.commit((model) => addEntity(model, 'ELM'));
  ok(typeof (await blobIn(store, retention)) === 'object', 'the next successful persist overwrites the project record');
  equal(retention.records.get('aside'), 'not a blob', 'while the side copy survives it');

  retention.records.set('project', 'worse');
  const second = await restored(retention, storage);
  equal(second.restoration(), 'failed', 'a later failure fails the restore again');
  equal(retention.records.get('aside'), 'worse', 'and replaces the side copy: it survives until the next failure');
}

// --- A well-formed blob that fails the gates ----------------------------

{
  const blob = { project: { format: 'something-else' }, session: { dirty: true } };
  const retention = memoryRetention({ initial: { project: blob } });
  const store = await restored(retention);
  equal(store.restoration(), 'failed', 'a blob refused by the loader fails the restore');
  deepEqual(retention.records.get('aside'), blob, 'and is copied to the side record too');
  deepEqual(retention.records.get('project'), blob, 'with the project record untouched');
  equal(typeof store.restoration(), 'string', 'the store reports a state, never a file refusal');
}

// --- A stale selection in the blob -------------------------------------

{
  const retention = memoryRetention();
  const first = openStore(retention);
  first.commit((model) => addEntity(model, 'ELM'));
  first.select('ELM-001');
  await first.whenPersisted();
  retention.records.get('project').session.selection = 'ELM-999';

  const second = await restored(retention);
  equal(second.restoration(), 'restored', 'the project still restores');
  equal(second.selection(), null, 'a selection no longer in the model restores as nothing');
}

// --- A blob the previous generation kept in web storage is moved over ------

{
  const donorRetention = memoryRetention();
  const donor = openStore(donorRetention);
  donor.commit((model) => addEntity(model, 'ELM'));
  donor.select('ELM-001');
  donor.markSaved();
  await donor.whenPersisted();
  const raw = JSON.stringify(donorRetention.records.get('project'));

  const storage = fakeStorage({ [PROJECT_KEY]: raw, [ASIDE_KEY]: 'an older failed blob' });
  const retention = memoryRetention();
  const store = await restored(retention, storage);
  equal(store.restoration(), 'restored', 'a session restores from the blob web storage held');
  equal(store.selection(), 'ELM-001', 'as it stood');
  deepEqual(retention.records.get('project'), JSON.parse(raw), 'the blob is moved to the retention');
  equal(retention.records.get('aside'), 'an older failed blob', 'and the side copy with it');
  equal(storage.read(PROJECT_KEY), null, 'web storage is left without the blob');
  equal(storage.read(ASIDE_KEY), null, 'and without the side copy');

  const again = await restored(retention, storage);
  equal(again.restoration(), 'restored', 'the next session restores from the retention alone');
  equal(again.selection(), 'ELM-001', 'as before');
}

{
  const storage = fakeStorage({ [PROJECT_KEY]: 'not json{' });
  const retention = memoryRetention();
  const store = await restored(retention, storage);
  equal(store.restoration(), 'failed', 'a blob web storage held that does not load fails the restore');
  equal(retention.records.get('aside'), 'not json{', 'and is set aside in the retention as the text it is');
  equal(retention.records.has('project'), false, 'never becoming the project record');
  equal(storage.read(PROJECT_KEY), null, 'and web storage is left without it');
}

{
  const retention = memoryRetention({ initial: { project: { project: { format: 'something-else' } } } });
  const storage = fakeStorage({ [PROJECT_KEY]: '{"project":{}}' });
  const store = await restored(retention, storage);
  equal(store.restoration(), 'failed', 'a blob the retention holds is what restores, whatever web storage still holds');
  equal(storage.read(PROJECT_KEY), '{"project":{}}', 'and web storage is not touched while the retention answers');
}

// --- Replacing the project ---------------------------------------------

{
  const retention = memoryRetention();
  const store = openStore(retention);
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
  equal((await blobIn(store, retention)).project.name, 'Fixture project', 'the replacement is persisted');
}

// --- Picker mode -------------------------------------------------------

{
  const store = openStore(memoryRetention());
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
  deepEqual(store.picker(), { subject: 'ELM-001', picks: [] }, 'picking begins pinned to its subject');

  store.togglePick('HAZ-001');
  store.togglePick('HAZ-002');
  deepEqual(
    store.picker().picks,
    [{ id: 'HAZ-001', form: null }, { id: 'HAZ-002', form: null }],
    'picks accumulate, each without a chosen form until one is needed'
  );
  store.togglePick('HAZ-001');
  deepEqual(store.picker().picks, [{ id: 'HAZ-002', form: null }], 'and toggle back off');

  store.setPickChoice('HAZ-002', { typeId: 'elm-exhibits-haz', direction: 'outgoing' });
  deepEqual(
    store.picker().picks[0].form,
    { typeId: 'elm-exhibits-haz', direction: 'outgoing' },
    'a pick can carry the relationship chosen for its pair'
  );
  store.setPickChoice('HAZ-009', { typeId: 'elm-exhibits-haz', direction: 'outgoing' });
  equal(store.picker().picks.length, 1, 'a choice for what is not picked is nothing');

  const copy = store.picker();
  copy.picks.push({ id: 'HAZ-009', form: null });
  copy.picks[0].form = null;
  deepEqual(
    store.picker().picks,
    [{ id: 'HAZ-002', form: { typeId: 'elm-exhibits-haz', direction: 'outgoing' } }],
    'the picks ride out as copies'
  );

  store.commit((model) => addEntity(model, 'SCN'));
  equal(store.picker().picks.length, 1, 'the mode survives commits');

  store.commit((model) => removeEntity(model, 'HAZ-002'));
  ok(store.picker() !== null, 'a commit that removes a picked entity leaves the workflow open');
  deepEqual(store.picker().picks, [], 'and clears that pick');

  store.togglePick('HAZ-001');
  store.commit((model) => removeEntity(model, 'ELM-001'));
  equal(store.picker(), null, 'a commit that removes the subject closes the workflow');
  store.undo();
  equal(store.picker(), null, 'and undoing the deletion does not reopen it');

  store.endPicking();
  equal(store.picker(), null, 'ending a closed workflow is nothing');
}

// --- Picker repair under undo and redo ---------------------------------

{
  const store = openStore(memoryRetention());
  store.commit((model) => addEntity(model, 'ELM'));
  store.commit((model) => addEntity(model, 'HAZ'));
  store.beginPicking('ELM-001');
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
  const retention = memoryRetention();
  const store = openStore(retention);
  store.commit((model) => addEntity(model, 'ELM'));
  store.beginPicking('ELM-001');
  store.commit((model) => addEntity(model, 'HAZ'));
  deepEqual(
    Object.keys((await blobIn(store, retention)).session),
    ['selection', 'expanded', 'projectCollapsed', 'dirty'],
    'the blob carries session state and no picker'
  );

  const second = await restored(retention);
  equal(second.picker(), null, 'a restored session starts with no workflow');

  store.replaceProject(createModel());
  equal(store.picker(), null, 'replacing the project closes the workflow');
}

// --- The relationship view is one truth, never persisted ----------------

{
  const retention = memoryRetention();
  const store = openStore(retention);
  store.commit((model) => addEntity(model, 'ELM'));
  equal(store.relationshipView(), 'graph', 'the pane opens on the graph');

  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });
  store.setRelationshipView('list');
  equal(store.relationshipView(), 'list', 'the view can be chosen');
  equal(notified, 1, 'and every surface is told');
  store.setRelationshipView('list');
  equal(notified, 1, 'choosing it again is nothing');
  store.setRelationshipView('mosaic');
  equal(store.relationshipView(), 'list', 'an unknown view is refused');
  store.setRelationshipView('checks');
  equal(store.relationshipView(), 'list', 'and the messages are no view of the pane');
  equal(store.messagesOpen(), false, 'the messages stand closed');
  store.setRelationshipsCollapsed(true);
  store.setMessagesOpen(true);
  equal(store.messagesOpen(), true, 'opened from the status bar');
  equal(store.relationshipsCollapsed(), false, 'which expands the pane they stand over');
  const told = notified;
  store.setMessagesOpen(true);
  equal(notified, told, 'opening them again is nothing');
  store.setMessagesOpen(false);
  equal(store.messagesOpen(), false, 'and the X hands the pane back');
  equal(store.libraryOpen(), false, 'the library picker stands closed');
  store.setLibraryOpen(true);
  equal(store.libraryOpen(), true, 'opened from the toolbar');
  const heard = notified;
  store.setLibraryOpen(true);
  equal(notified, heard, 'opening it again is nothing');
  store.setLibraryOpen(false);
  equal(store.libraryOpen(), false, 'and the X hands the editor pane back');

  deepEqual(
    Object.keys((await blobIn(store, retention)).session),
    ['selection', 'expanded', 'projectCollapsed', 'dirty'],
    'the blob never carries it'
  );
  const second = await restored(retention);
  equal(second.relationshipView(), 'graph', 'a restored session opens on the default view again');
}

// --- The open view is session state with a way back ---------------------

{
  const storage = fakeStorage();
  const session = fakeStorage();
  const retention = memoryRetention();
  const store = createStore({ storage, session, retention });
  equal(store.view(), null, 'no project, no view');
  store.openView('risk');
  equal(store.view(), null, 'a view cannot open over no project');
  store.replaceProject(createModel());
  store.commit((model) => addEntity(model, 'SCN'));
  store.commit((model) => addEntity(model, 'SCN'));

  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });
  store.openView('risk');
  deepEqual(store.view(), { id: 'risk', section: 0 }, 'a view opens at its first section');
  equal(notified, 1, 'and every surface is told');
  store.setViewSection(2);
  deepEqual(store.view(), { id: 'risk', section: 2 }, 'a section can be chosen');
  store.setViewSection(2);
  store.setViewSection(-1);
  equal(notified, 2, 'the same or a nonsense section is nothing');
  equal(JSON.parse(session.read('openconformity.open-view')).section, 2, 'the browser session keeps the view and section');
  deepEqual(
    Object.keys((await blobIn(store, retention)).session),
    ['selection', 'expanded', 'projectCollapsed', 'dirty'],
    'the blob never carries it'
  );

  const second = await restored(retention, storage, session);
  deepEqual(second.view(), { id: 'risk', section: 2 }, 'a reload returns to the view');

  store.setViewReturn({ id: 'risk', name: 'Risk assessment', section: 2, rowId: 'SCN-002' });
  store.closeView();
  equal(store.view(), null, 'closed');
  equal(session.read('openconformity.open-view'), null, 'and forgotten by the session');
  store.select('SCN-002');
  equal(store.viewReturn()?.rowId, 'SCN-002', 'selecting the row the user came from keeps the way back');
  store.select('SCN-001');
  equal(store.viewReturn(), null, 'selecting another entity drops it');
  store.openView('risk', 1);
  store.replaceProject(createModel());
  equal(store.view(), null, 'another project opens with no view');
  equal(session.read('openconformity.open-view'), null, 'and none remembered');
}

// --- A failing persist -------------------------------------------------

{
  const retention = memoryRetention();
  const store = openStore(retention);
  await store.whenPersisted();
  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });
  retention.failing = true;
  const outcome = store.commit((model) => addEntity(model, 'ELM'));
  equal(outcome.ok, true, 'the change itself still lands');
  equal(store.model().nodes.size, 1, 'in the model');
  await store.whenPersisted();
  equal(store.persistFailed(), true, 'and the failed persist is on record');
  equal(notified, 2, 'told once for the change and once for the failure');
  store.commit((model) => addEntity(model, 'HAZ'));
  await store.whenPersisted();
  equal(notified, 3, 'a second failure is not told again');

  retention.failing = false;
  store.commit((model) => addEntity(model, 'SCN'));
  await store.whenPersisted();
  equal(store.persistFailed(), false, 'a later successful persist clears it');
  equal(notified, 5, 'and the recovery is told once');
  equal(retention.records.get('project').project.entities.length, 3, 'and writes the whole state');
}

// --- A browser without IndexedDB -------------------------------------------

{
  const retention = createRetention({ indexedDB: undefined });
  const store = await restored(retention);
  equal(store.restoration(), 'fresh', 'with no IndexedDB nothing restores, and the session begins fresh');
  store.replaceProject(createModel());
  await store.whenPersisted();
  equal(store.persistFailed(), true, 'and the first persist is on record as refused, so the user is told to save to a file');
  equal(await retention.estimate(), null, 'with no storage manager there is no estimate');
}

// --- The storage nearly full is told ------------------------------------------

{
  const retention = memoryRetention({ estimate: { usage: 900, quota: 1000 } });
  const store = createStore({ storage: fakeStorage(), retention });
  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });
  store.replaceProject(createModel());
  await store.whenPersisted();
  equal(store.storageNearlyFull(), true, 'past eight tenths of the quota the storage stands nearly full');
  equal(notified, 2, 'told once for the project and once for the storage');
  store.clearBrowserData();
  equal(store.storageNearlyFull(), false, 'clearing the browser data clears it');
}

{
  const retention = memoryRetention({ estimate: { usage: 100, quota: 1000 } });
  const store = openStore(retention);
  await store.whenPersisted();
  equal(store.storageNearlyFull(), false, 'well within the quota nothing is said');
  const none = openStore(memoryRetention());
  await none.whenPersisted();
  equal(none.storageNearlyFull(), false, 'nor where the browser gives no estimate');
}

// --- The project row's expansion is session state ------------------------

{
  const retention = memoryRetention();
  const store = createStore({ storage: fakeStorage(), retention });
  equal(store.projectExpanded(), true, 'with no project the row reads open');
  store.setProjectExpanded(false);
  equal(store.projectExpanded(), true, 'and nothing changes it on the landing');

  store.replaceProject(createModel());
  equal(store.projectExpanded(), true, 'a project opens with its row open');
  store.setProjectExpanded(false);
  equal(store.projectExpanded(), false, 'collapsing holds');
  equal(store.dirty(), false, 'without marking the project unsaved');
  equal((await blobIn(store, retention)).session.projectCollapsed, true, 'and persists with the session');

  const held = await restored(retention);
  equal(held.projectExpanded(), false, 'a restore honours the collapse');

  held.setProjectExpanded(true);
  equal((await blobIn(held, retention)).session.projectCollapsed, false, 'reopening persists too');
  held.setProjectExpanded(false);
  held.replaceProject(createModel());
  equal(held.projectExpanded(), true, 'a replaced project starts open again, whatever stood collapsed');
}

{
  const retention = memoryRetention();
  const seeded = createStore({ storage: fakeStorage(), retention });
  seeded.replaceProject(createModel());
  await seeded.whenPersisted();
  delete retention.records.get('project').session.projectCollapsed;
  const held = await restored(retention);
  equal(held.projectExpanded(), true, 'a blob from before the collapse existed restores open');
}

// --- The navigator's filter is session state ------------------------------

{
  const retention = memoryRetention();
  const store = createStore({ storage: fakeStorage(), retention });
  store.replaceProject(createModel());
  equal(store.navigatorFilter(), '', 'the filter starts empty');
  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });
  store.setNavigatorFilter('haz');
  equal(store.navigatorFilter(), 'haz', 'and holds what was typed');
  equal(notified, 1, 'notifying its panes');
  store.setNavigatorFilter('haz');
  equal(notified, 1, 'but not for no change');
  ok(!(await blobIn(store, retention)).session.navigatorFilter, 'never persisted');
  store.replaceProject(createModel());
  equal(store.navigatorFilter(), '', 'a replaced project starts unfiltered');
}

// --- The view survives a reload, never a new session, never the blob ------

{
  const storage = fakeStorage();
  const session = fakeStorage();
  const retention = memoryRetention();
  const store = createStore({ storage, session, retention });
  store.replaceProject(createModel());
  store.setRelationshipView('list');
  equal(session.read('openconformity.view'), 'list', 'the choice rides the browser session');
  ok(!(await blobIn(store, retention)).session.relationshipView, 'and never the project blob');

  const reloaded = createStore({ storage, session, retention });
  equal(reloaded.relationshipView(), 'list', 'a reload within the session keeps it');

  const fresh = createStore({ storage, session: fakeStorage(), retention });
  equal(fresh.relationshipView(), 'graph', 'a new session opens on the default');

  const none = createStore({ storage, retention });
  equal(none.relationshipView(), 'graph', 'and no session store at all is just the default');
}

// --- The tab chosen per type: the session's --------------------------------

{
  const storage = fakeStorage();
  const session = fakeStorage();
  const retention = memoryRetention();
  const store = createStore({ storage, session, retention });
  store.replaceProject(createModel());
  equal(store.tabOf('ESR'), null, 'a type opens on its first tab');

  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });
  store.setTab('ESR', 'Applicability');
  equal(store.tabOf('ESR'), 'Applicability', 'chosen, the tab stands');
  equal(store.tabOf('HSR'), null, 'for that type alone');
  equal(notified, 0, 'and nothing is told: the editor showed the panel itself');
  equal(store.dirty(), false, 'nor is the project marked unsaved');
  deepEqual(JSON.parse(session.read('openconformity.tabs')), { ESR: 'Applicability' }, 'the choice rides the browser session');
  ok(!('tabs' in (await blobIn(store, retention)).session), 'and never the project blob');

  equal(createStore({ storage, session, retention }).tabOf('ESR'), 'Applicability', 'a reload within the session keeps it');
  equal(createStore({ storage, session: fakeStorage(), retention }).tabOf('ESR'), null, 'a new session opens on the first tab again');

  {
    const held = fakeStorage();
    const first = createStore({ storage, session: held, retention });
    first.replaceProject(createModel());
    equal(first.consented(), false, 'a session starts asking before the editor loads');
    let told = 0;
    first.subscribe(() => {
      told += 1;
    });
    first.setConsented(true);
    equal(first.consented(), true, 'the choice not to be asked again is held');
    equal(told, 0, 'told to no one');
    equal(first.dirty(), false, 'and marks nothing unsaved');
    equal(held.read('openconformity.drawio-consent'), '1', 'it rides the browser session');
    ok(!JSON.stringify(await blobIn(first, retention)).includes('consent'), 'and never the project blob');
    equal(createStore({ storage, session: held, retention }).consented(), true, 'a reload within the session keeps it');
    equal(createStore({ storage, session: fakeStorage(), retention }).consented(), false, 'a new session asks again');
    first.setConsented(false);
    equal(held.read('openconformity.drawio-consent'), null, 'withdrawn, it is gone from the session');
  }
  session.setItem('openconformity.tabs', '{nonsense');
  equal(createStore({ storage, session, retention }).tabOf('ESR'), null, 'a session holding nonsense opens on the first tab, not broken');
  session.setItem('openconformity.tabs', '["Applicability"]');
  equal(createStore({ storage, session, retention }).tabOf('ESR'), null, 'as does one holding the wrong shape');
}

// --- Clear browser data forgets everything ------------------------

{
  const storage = fakeStorage({ [ASIDE_KEY]: 'an old failed blob', [PROJECT_KEY]: 'an old blob' });
  const session = fakeStorage();
  const retention = memoryRetention({ initial: { aside: 'a failed blob' } });
  const store = createStore({ storage, session, retention });
  store.replaceProject(createModel());
  store.setTheme('g100');
  store.setConsented(true);
  await store.whenPersisted();
  ok(retention.records.has('project') && retention.records.has('aside') && storage.read(THEME_KEY) === 'g100' && session.read('openconformity.drawio-consent') === '1', 'a browser holding a project, a set-aside copy, a theme, the consent, and blobs from the previous generation');
  let told = 0;
  store.subscribe(() => {
    told += 1;
  });
  store.clearBrowserData();
  equal(told, 1, 'the clearing is told once');
  equal(store.hasProject(), false, 'no project is open, as on the landing');
  equal(store.theme(), null, 'the theme follows the system again');
  equal(store.consented(), false, 'the consent is withdrawn');
  equal(store.dirty(), false, 'and nothing is dirty');
  await store.whenPersisted();
  equal(retention.records.size, 0, 'nothing of the software is left in the retention, the set-aside copy included');
  deepEqual([storage.read(PROJECT_KEY), storage.read(ASIDE_KEY), storage.read(THEME_KEY)], [null, null, null], 'nor in web storage, the previous generation\'s blobs included');
  deepEqual(['openconformity.view', 'openconformity.tabs', 'openconformity.open-view', 'openconformity.drawio-consent'].map((key) => session.read(key)), [null, null, null, null], 'nor in the session');
  equal((await restored(retention, storage, session)).restoration(), 'fresh', 'the next session begins fresh');
  store.replaceProject(createModel());
  ok((await blobIn(store, retention)) !== null, 'and a new project persists again as ever');
}

// --- The set-aside copy can be read back and discarded -------------------

{
  const retention = memoryRetention({ initial: { project: { project: { name: 'Old line' }, session: {} } } });
  const store = await restored(retention, fakeStorage());
  equal(store.restoration(), 'failed', 'a blob the software cannot load fails the restore');
  equal(store.hasAside(), true, 'and the session says a copy stands aside');
  deepEqual(await store.aside(), { project: { name: 'Old line' }, session: {} }, 'the copy reads back as the retention holds it');

  await store.discardAside();
  equal(store.hasAside(), false, 'discarding it ends the offer');
  equal(retention.records.has('aside'), false, 'and removes the record');
  equal(await store.aside(), null, 'so nothing reads back');
  equal(store.restoration(), 'fresh', 'and the session counts as fresh from there');
  equal(retention.records.get('project').project.name, 'Old line', 'the project record it came from is left as it was');
}

{
  const retention = memoryRetention();
  const store = await restored(retention, fakeStorage());
  equal(store.hasAside(), false, 'a fresh session holds no copy');
  equal(await store.aside(), null, 'and reads none back');
}

{
  const retention = memoryRetention({ initial: { project: 'not a blob' } });
  const store = await restored(retention, fakeStorage());
  equal(store.hasAside(), true, 'a failed restore holds the copy');
  store.clearBrowserData();
  await store.whenPersisted();
  equal(store.hasAside(), false, 'and clearing browser data lets go of it');
  equal(retention.records.has('aside'), false, 'with the record removed as before');
}

// --- The relationship pane collapses to its head, for the session ---------

{
  const storage = fakeStorage();
  const session = fakeStorage();
  const retention = memoryRetention();
  const store = createStore({ storage, session, retention });
  store.replaceProject(createModel());
  equal(store.relationshipsCollapsed(), false, 'the pane opens expanded');

  let notified = 0;
  store.subscribe(() => { notified += 1; });
  store.setRelationshipsCollapsed(true);
  equal(store.relationshipsCollapsed(), true, 'it can be collapsed');
  equal(session.read('openconformity.relationships-collapsed'), 'true', 'and the choice rides the browser session');
  equal(notified, 1, 'the panes are told once');
  store.setRelationshipsCollapsed(true);
  equal(notified, 1, 'and not again for the same state');
  ok(!(await blobIn(store, retention)).session.relationshipsCollapsed, 'the blob never carries it');

  const reloaded = createStore({ storage, session, retention });
  equal(reloaded.relationshipsCollapsed(), true, 'a reload within the session keeps it');
  const fresh = createStore({ storage, session: fakeStorage(), retention });
  equal(fresh.relationshipsCollapsed(), false, 'a new session opens expanded');

  store.setRelationshipView('list');
  equal(store.relationshipsCollapsed(), false, 'choosing a view expands the pane');
  store.setRelationshipsCollapsed(true);
  store.setRelationshipView('list');
  equal(store.relationshipsCollapsed(), false, 'even the view already shown');

  store.setRelationshipsCollapsed(true);
  const id = store.commit((model) => addEntity(model, 'ELM')).id ?? [...store.model().nodes.keys()].find((key) => key.startsWith('ELM'));
  store.beginPicking(id);
  equal(store.relationshipsCollapsed(), false, 'starting a pick expands the pane');
  store.endPicking();

  store.setRelationshipsCollapsed(true);
  store.clearBrowserData();
  await store.whenPersisted();
  equal(session.read('openconformity.relationships-collapsed'), null, 'clearing browser data forgets the choice');
}

summary('test-store');
