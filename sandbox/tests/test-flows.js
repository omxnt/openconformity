/**
 * Exercises the flow logic that needs no page: the relationship offer a
 * subject entity gets, the new-related offer, and — over a live store
 * with a stub editor and dialogs that refuse to exist — the landing's
 * one-action project creation, the pristine creation collapsing on
 * cancel, and new-related committing as one step. The dialogs themselves
 * are checked in the browser. Run from this directory.
 */

import './shim.js';
import { createFlows, relationshipOptions, relatedTypeOffer } from '../app/flows.js';
import { createStore } from '../app/store.js';
import { ENTITY_TYPES, relationshipsFrom, relationshipsTo } from '../app/metamodel.js';
import { createModel, addEntity, addFolder, relate, nodeOf } from '../app/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

/** An editor that is never editing, so no guard ever needs a dialog. */
function stubEditor() {
  return { endEdit() {}, beginEdit() {}, hasUnconfirmedEdit: () => false, editing: () => false };
}

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
};

function flowsOver(store) {
  return createFlows({
    store,
    overlay: {},
    dialogs: noDialogs,
    editor: stubEditor(),
    getActions: () => [],
    fileInput: null,
  });
}

/** The offer as comparable rows. */
function offered(model, subjectId) {
  return relationshipOptions(model, subjectId).map((option) => ({
    id: option.type.id,
    direction: option.direction,
    candidates: option.candidates.map((entity) => entity.id),
  }));
}

// --- The offer follows the metamodel and the model ----------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  deepEqual(offered(model, 'ELM-001'), [], 'a lone entity has no one to relate to: forms with no candidate are not offered');
  deepEqual(offered(model, 'ELM-9'), [], 'a missing subject is offered nothing');
  addFolder(model, 'Zone');
  deepEqual(offered(model, 'F-1'), [], 'a folder is offered nothing');
}

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'HAZ');

  deepEqual(
    offered(model, 'ELM-001'),
    [{ id: 'elm-exhibits-haz', direction: 'outgoing', candidates: ['HAZ-001'] }],
    'an ELM beside a HAZ is offered exhibits, outgoing'
  );
  deepEqual(
    offered(model, 'HAZ-001'),
    [{ id: 'elm-exhibits-haz', direction: 'incoming', candidates: ['ELM-001'] }],
    'the HAZ sees the same relationship from its own side, and only forms with candidates'
  );

  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001');
  deepEqual(offered(model, 'ELM-001'), [], 'a relationship that exists leaves the form with no candidate');

  addEntity(model, 'HAZ');
  deepEqual(
    offered(model, 'ELM-001'),
    [{ id: 'elm-exhibits-haz', direction: 'outgoing', candidates: ['HAZ-002'] }],
    'a second hazard restores the offer, without the taken candidate'
  );
}

// --- Composition narrows the offer --------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'ELM');

  deepEqual(
    offered(model, 'ELM-001'),
    [
      { id: 'elm-decomposes-into-elm', direction: 'outgoing', candidates: ['ELM-002'] },
      { id: 'elm-decomposes-into-elm', direction: 'incoming', candidates: ['ELM-002'] },
    ],
    'a self-type composition is offered in both directions, never to itself'
  );

  relate(model, 'elm-decomposes-into-elm', 'ELM-001', 'ELM-002');
  deepEqual(
    offered(model, 'ELM-001'),
    [],
    'after owning it, neither direction remains: the duplicate, the single owner rule, and the cycle rule each close a door'
  );
  deepEqual(
    offered(model, 'ELM-002'),
    [],
    'the owned entity is closed the same way from its side'
  );

  addEntity(model, 'ELM');
  const third = offered(model, 'ELM-001');
  deepEqual(
    third,
    [
      { id: 'elm-decomposes-into-elm', direction: 'outgoing', candidates: ['ELM-003'] },
      { id: 'elm-decomposes-into-elm', direction: 'incoming', candidates: ['ELM-003'] },
    ],
    'a third element opens both directions again'
  );
  ok(
    !third.some((option) => option.candidates.includes('ELM-002')),
    'the already-owned element is never a candidate target'
  );
}

// --- The full surface --------------------------------------------------

{
  const model = createModel();
  for (const code of Object.keys(ENTITY_TYPES)) {
    addEntity(model, code);
    addEntity(model, code);
  }
  for (const code of Object.keys(ENTITY_TYPES)) {
    deepEqual(
      relationshipOptions(model, `${code}-001`).map((option) => `${option.type.id}:${option.direction}`),
      [
        ...relationshipsFrom(code).map((type) => `${type.id}:outgoing`),
        ...relationshipsTo(code).map((type) => `${type.id}:incoming`),
      ],
      `with candidates of every type in the model, ${code} is offered its full relationship surface`
    );
  }
}

// --- The new-related offer ---------------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addFolder(model, 'Zone');

  const offer = relatedTypeOffer(model, 'ELM-001');
  deepEqual(
    offer.flatMap((offered) => offered.forms.map((form) => `${form.typeId}:${form.direction}`)).sort(),
    [
      ...relationshipsFrom('ELM').map((type) => `${type.id}:outgoing`),
      ...relationshipsTo('ELM').map((type) => `${type.id}:incoming`),
    ].sort(),
    'the offer is the full metamodel surface for a new entity'
  );
  deepEqual(
    offer.map((offered) => offered.code),
    Object.keys(ENTITY_TYPES).filter((code) => offer.some((offered) => offered.code === code)),
    'the types come in metamodel order, so a menu groups by pillar'
  );
  equal(offer.find((offered) => offered.code === 'ELM').forms.length, 2, 'a type admitting more than one relationship carries them all');
  equal(offer.find((offered) => offered.code === 'HAZ').forms.length, 1, 'one that admits one carries it alone');

  deepEqual(relatedTypeOffer(model, 'F-1'), [], 'a folder is offered nothing');
  deepEqual(relatedTypeOffer(model, 'ELM-9'), [], 'nor is a missing subject');

  addEntity(model, 'ELM');
  relate(model, 'elm-decomposes-into-elm', 'ELM-002', 'ELM-001');
  const owned = relatedTypeOffer(model, 'ELM-001');
  deepEqual(
    owned.find((offered) => offered.code === 'ELM').forms,
    [{ typeId: 'elm-decomposes-into-elm', direction: 'outgoing' }],
    'a new entity that would be a second owner of the subject is not offered'
  );
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

summary('test-flows');
