/**
 * Exercises the flow logic that needs no page, over a live store with a
 * stub editor and dialogs that refuse to exist: the landing's one-action
 * project creation, the pristine creation collapsing on cancel,
 * new-related committing as one step, activation, and the refusals told
 * in passing. The dialogs themselves are checked in the browser; the
 * pure derivations live in test-queries. Run from this directory.
 */

import './shim.js';
import { createFlows } from '../app/flows.js';
import { createStore } from '../app/store.js';
import { createModel, addEntity, addFolder, relate, nodeOf } from '../app/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';
import { fakeStorage, stubEditor } from './helpers.js';

/** Dialogs that fail the test if anything asks: these flows must not prompt. */
const noDialogs = {
  confirm() {
    throw new Error('a dialog was asked');
  },
  prompt() {
    throw new Error('a dialog was asked');
  },
  open() {
    throw new Error('a dialog was asked');
  },
  toast() {
    // A toast is a remark, not a question.
  },
};

function flowsOver(store) {
  return createFlows({
    store,
    overlay: {},
    dialogs: noDialogs,
    editor: stubEditor(),
    fileInput: null,
  });
}

// --- The landing: one action to a project ------------------------------

{
  const store = createStore({ storage: fakeStorage() });
  const flows = flowsOver(store);
  equal(store.hasProject(), false, 'the session starts with no project');
  await flows.newProject();
  equal(store.hasProject(), true, 'New lands in a working project in one action, no prompt, no form');
  equal(store.model().name, '', 'unconfigured, its name empty as ever');
  equal(store.dirty(), false, 'standing saved');
}

// --- A pristine creation collapses on cancel ---------------------------

{
  const store = createStore({ storage: fakeStorage() });
  const flows = flowsOver(store);
  store.replaceProject(createModel());
  store.commit((model) => addFolder(model, 'Zone'));
  store.select('F-1');

  await flows.createEntity('ELM');
  ok(nodeOf(store.model(), 'ELM-001') !== null, 'the creation exists');
  equal(nodeOf(store.model(), 'ELM-001').parent, 'F-1', 'filed into the selected container');
  equal(store.selection(), 'ELM-001', 'and selected');

  flows.cancelEdit();
  equal(nodeOf(store.model(), 'ELM-001'), null, 'cancel removes the pristine creation');
  equal(store.canRedo(), false, 'and leaves no history residue');
  equal(store.canUndo(), true, 'while the change before it still undoes');
  store.undo();
  equal(store.model().nodes.size, 0, 'to the empty project');
}

// --- A saved-once entity survives cancel -------------------------------

{
  const store = createStore({ storage: fakeStorage() });
  const flows = flowsOver(store);
  store.replaceProject(createModel());

  await flows.createEntity('ELM');
  flows.saveEdit('ELM-001', { title: 'Kept' });
  flows.cancelEdit();
  ok(nodeOf(store.model(), 'ELM-001') !== null, 'the moment an entity has been saved once, Cancel keeps it');
  equal(nodeOf(store.model(), 'ELM-001').attributes.title, 'Kept', 'with what was saved');
}

// --- The collapse falls back to one step when history moved ------------

{
  const store = createStore({ storage: fakeStorage() });
  const flows = flowsOver(store);
  store.replaceProject(createModel());

  await flows.createEntity('ELM');
  store.commit((model) => addEntity(model, 'HAZ'));
  flows.cancelEdit();
  equal(nodeOf(store.model(), 'ELM-001'), null, 'the pristine creation still leaves');
  ok(nodeOf(store.model(), 'HAZ-001') !== null, 'later work stays');
  store.undo();
  ok(nodeOf(store.model(), 'ELM-001') !== null, 'removed as one step: one undo restores it');
}

// --- New related: one entry, and cancel removes both -------------------

{
  const store = createStore({ storage: fakeStorage() });
  const flows = flowsOver(store);
  store.replaceProject(createModel());
  store.commit((model) => addEntity(model, 'ELM'));
  store.select('ELM-001');

  await flows.createRelated('ELM-001', 'HAZ', { typeId: 'elm-exhibits-haz', direction: 'outgoing' });
  ok(nodeOf(store.model(), 'HAZ-001') !== null, 'the related entity exists, born empty');
  equal(nodeOf(store.model(), 'HAZ-001').parent, 'ELM-001', 'filed inside its source');
  equal(store.model().relationships.size, 1, 'with its relationship');
  equal(store.selection(), 'HAZ-001', 'and the editor opens on it');

  store.undo();
  equal(nodeOf(store.model(), 'HAZ-001'), null, 'one history entry: one undo removes the entity');
  equal(store.model().relationships.size, 0, 'and its relationship');
  store.redo();
  equal(store.model().relationships.size, 1, 'one redo returns both');
  flows.saveEdit('HAZ-001', { title: 'Hazard' });

  await flows.createRelated('ELM-001', 'ELM', { typeId: 'elm-decomposes-into-elm', direction: 'incoming' });
  deepEqual(
    [...store.model().relationships.values()].find((held) => held.type === 'elm-decomposes-into-elm'),
    { type: 'elm-decomposes-into-elm', source: 'ELM-002', target: 'ELM-001' },
    'an incoming form makes the new entity the source'
  );
  flows.cancelEdit();
  equal(nodeOf(store.model(), 'ELM-002'), null, 'cancel removes the entity');
  equal(store.model().relationships.size, 1, 'and its relationship, leaving the earlier one');
  equal(store.canRedo(), false, 'with no residue');
}

// --- Activation and the pointerless filing path ------------------------

{
  const store = createStore({ storage: fakeStorage() });
  const asked = [];
  const dialogs = {
    confirm: async () => true,
    prompt: async (spec) => {
      asked.push(['prompt', spec.title]);
      return null;
    },
    choose: async (spec) => {
      asked.push(['choose', spec.title]);
      return '0';
    },
    open: async () => null,
  };
  let editsBegun = 0;
  const editor = {
    endEdit() {},
    beginEdit() {
      editsBegun += 1;
    },
    hasUnconfirmedEdit: () => false,
    editing: () => false,
  };
  const flows = createFlows({ store, overlay: {}, dialogs, editor, fileInput: null });
  store.replaceProject(createModel());
  store.commit((model) => addFolder(model, 'Zone'));
  store.commit((model) => addEntity(model, 'ELM'));
  store.commit((model) => addEntity(model, 'HAZ'));

  await flows.activateNode('ELM-001');
  equal(store.selection(), 'ELM-001', 'activation selects first');
  equal(editsBegun, 1, 'an entity activates into the editor');

  await flows.activateNode('F-1');
  deepEqual(asked.pop(), ['prompt', 'Rename folder'], 'a folder activates into its name');

  await flows.activateNode(null);
  equal(editsBegun, 2, 'the project row activates into the editor, like an entity');

  store.select('ELM-001');
  await flows.moveToSelection();
  deepEqual(asked.pop(), ['choose', 'Move to'], 'Move to asks with a list');
  equal(nodeOf(store.model(), 'ELM-001').parent, 'F-1', 'and files to the chosen destination');

  dialogs.choose = async () => null;
  await flows.moveToSelection();
  equal(nodeOf(store.model(), 'ELM-001').parent, 'F-1', 'cancelling moves nothing');
}

// --- Refusals are told in passing ---------------------------------------

{
  const store = createStore({ storage: fakeStorage() });
  const toasts = [];
  const dialogs = {
    confirm: async () => true,
    prompt: async () => null,
    choose: async () => null,
    open: async () => null,
    toast: (title, message) => toasts.push([title, message]),
  };
  const flows = createFlows({
    store,
    overlay: {},
    dialogs,
    editor: stubEditor(),
    fileInput: null,
  });
  store.replaceProject(createModel());
  store.commit((model) => addEntity(model, 'ELM'));
  store.commit((model) => addEntity(model, 'HAZ'));
  store.commit((model) => addEntity(model, 'HAZ'));

  flows.fileNode('ELM-001', null);
  equal(toasts.length, 1, 'a refused move is told in passing');
  equal(toasts[0][0], 'Move refused', 'named for what it is');
  ok(toasts[0][1].length > 0, 'with the model’s own reason');

  toasts.length = 0;
  flows.fileNode('HAZ-001', 'ELM-001');
  equal(toasts.length, 0, 'a move that goes through says nothing');

  store.commit((model) => relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-002'));
  flows.completeRelate('ELM-001', [
    { id: 'HAZ-001', form: null },
    { id: 'HAZ-002', form: null },
  ]);
  equal(store.model().relationships.size, 2, 'the picks the model still allows are made');
  deepEqual(
    toasts.pop(),
    ['Relationships refused', '1 of the picked relationships could no longer be made.'],
    'and the shortfall is told in passing'
  );

  await flows.createRelated('ELM-001', 'ELM', { typeId: 'elm-exhibits-haz', direction: 'outgoing' });
  deepEqual(toasts.pop()?.[0], 'Relationship refused', 'an inadmissible new-related form is told too');
}

// --- The project saves like an entity -----------------------------------

{
  const store = createStore({ storage: fakeStorage() });
  const flows = flowsOver(store);
  store.replaceProject(createModel());
  equal(flows.saveEdit(null, { name: '  Mixer line  ', description: 'A machine' }), true, 'the project draft applies');
  equal(store.model().name, 'Mixer line', 'the name goes to the model itself, trimmed');
  deepEqual(store.model().attributes, { description: 'A machine' }, 'everything else goes to the attribute bag');
  store.undo();
  equal(store.model().name, '', 'one commit: one undo returns both');
  deepEqual(store.model().attributes, {}, 'the bag with it');
}

// --- Escape leaves the edit, asking only when it costs -------------------

{
  const store = createStore({ storage: fakeStorage() });
  let ended = 0;
  const editor = { endEdit() { ended += 1; }, beginEdit() {}, hasUnconfirmedEdit: () => false, editing: () => true };
  const flows = createFlows({ store, overlay: {}, dialogs: noDialogs, editor, fileInput: null });
  store.replaceProject(createModel());
  await flows.escapeEdit();
  equal(ended, 1, 'a clean draft cancels silently: no dialog is asked');
}

{
  const store = createStore({ storage: fakeStorage() });
  let ended = 0;
  const asked = [];
  const editor = { endEdit() { ended += 1; }, beginEdit() {}, hasUnconfirmedEdit: () => true, editing: () => true };
  const dialogs = {
    confirm(question) {
      asked.push(question.title);
      return Promise.resolve(false);
    },
    toast() {},
  };
  const flows = createFlows({ store, overlay: {}, dialogs, editor, fileInput: null });
  store.replaceProject(createModel());
  await flows.escapeEdit();
  deepEqual(asked, ['Discard the changes?'], 'a dirty draft gets the standard discard question');
  equal(ended, 0, 'declining keeps editing');
  dialogs.confirm = () => Promise.resolve(true);
  await flows.escapeEdit();
  equal(ended, 1, 'accepting discards the draft');
}

{
  const store = createStore({ storage: fakeStorage() });
  let ended = 0;
  const editor = { endEdit() { ended += 1; }, beginEdit() {}, hasUnconfirmedEdit: () => false, editing: () => false };
  const flows = createFlows({ store, overlay: {}, dialogs: noDialogs, editor, fileInput: null });
  await flows.escapeEdit();
  equal(ended, 0, 'with no edit open, Escape passes by');
}

// --- Save asks every time, and cancel costs nothing ----------------------

{
  const store = createStore({ storage: fakeStorage() });
  const saved = [];
  const toasts = [];
  const prompts = [];
  const dialogs = {
    prompt: async (spec) => {
      prompts.push(spec);
      return 'Mixer line';
    },
    toast: (title, message) => toasts.push([title, message]),
  };
  const flows = createFlows({
    store,
    overlay: {},
    dialogs,
    editor: stubEditor(),
    fileInput: null,
    saveFile: (filename, text, type) => saved.push({ filename, text, type }),
  });
  store.replaceProject(createModel());
  store.commit((model) => addEntity(model, 'ELM'));
  equal(store.dirty(), true, 'a change stands unsaved');

  await flows.saveProject();
  equal(prompts[0].value, '', 'the question prefills the name as it stands');
  ok(prompts[0].preview('Mixer line').includes('mixer-line.json'), 'and previews the filename live');
  equal(store.model().name, 'Mixer line', 'confirming applies the typed name as an ordinary rename');
  deepEqual(saved.map((held) => held.filename), ['mixer-line.json'], 'the download fires, named for the project');
  equal(saved[0].type, 'application/json', 'as JSON');
  equal(store.dirty(), false, 'the saved pointer moves');
  deepEqual(toasts.pop(), ['Project saved', 'Saved to your downloads as mixer-line.json.'], 'and the toast confirms');

  dialogs.prompt = async () => null;
  store.commit((model) => addEntity(model, 'HAZ'));
  await flows.saveProject();
  equal(saved.length, 1, 'cancel downloads nothing');
  equal(store.dirty(), true, 'moves no pointer');
  equal(store.model().name, 'Mixer line', 'and renames nothing');
}

summary('test-flows');
