/**
 * Exercises the one action list headless: every offer's enablement
 * against a live store, so no surface can disagree with the model. Also
 * the menu grouping. Run from this directory.
 */

import './shim.js';
import { createActions } from '../app/actions.js';
import { menuGroups } from '../app/menu.js';
import { createStore } from '../app/store.js';
import { createModel, addEntity, addFolder, relate } from '../app/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';
import { fakeStorage } from './helpers.js';

/** The identifiers of the enabled offers. */
function enabledIds(actions) {
  return actions.filter((action) => action.enabled()).map((action) => action.id);
}

// --- The landing offers the three ways in and the help surface ----------

{
  const store = createStore({ storage: fakeStorage() });
  const actions = createActions({ store, flows: {} });
  deepEqual(
    enabledIds(actions),
    ['new-project', 'open', 'load-example', 'about', 'metamodel'],
    'the no-project state offers the three ways in and the help surface — nothing that needs a project'
  );
}

// --- The action list against a live store ------------------------------

{
  const store = createStore({ storage: fakeStorage() });
  store.replaceProject(createModel());
  const actions = createActions({ store, flows: {} });
  const enabled = () => Object.fromEntries(actions.map((action) => [action.id, action.enabled()]));

  deepEqual(
    actions.map((action) => action.id),
    ['new-project', 'open', 'save', 'load-example', 'about', 'metamodel', 'new-entity', 'new-related', 'new-folder', 'relate', 'rename', 'move-up', 'move-down', 'move-to', 'delete', 'undo', 'redo'],
    'the list holds every offer once, in surface order'
  );
  deepEqual(
    Object.fromEntries(actions.filter((action) => action.hint).map((action) => [action.id, action.hint])),
    { 'move-up': 'Alt ↑', 'move-down': 'Alt ↓', delete: 'Del' },
    'the key hints ride on the actions the keys reach'
  );
  ok(actions.every((action) => typeof action.icon === 'string' && action.icon.startsWith('i-')), 'every action carries its glyph');
  ok(actions.every((action) => action.toolbar || action.context || action.menubar), 'every action appears on some surface');
  deepEqual(
    actions.filter((action) => action.menubar && action.group === 'project').map((action) => action.id),
    ['new-project', 'open', 'save', 'load-example'],
    'the File menu offers the file actions, the example among them, and nothing else'
  );
  deepEqual(
    actions.filter((action) => action.menubar && action.group === 'help').map((action) => action.id),
    ['about', 'metamodel'],
    'the Help menu offers About and the metamodel, and nothing else'
  );
  ok(
    actions.filter((action) => action.menubar).every((action) => !action.toolbar && !action.context),
    'and the menubar actions appear nowhere else'
  );

  deepEqual(
    enabled(),
    {
      'new-project': true,
      open: true,
      save: true,
      'load-example': true,
      about: true,
      metamodel: true,
      'new-entity': true,
      'new-related': false,
      'new-folder': true,
      relate: false,
      rename: false,
      'move-up': false,
      'move-down': false,
      'move-to': false,
      delete: false,
      undo: false,
      redo: false,
    },
    'an empty project offers creation, the file surface, the help surface, and nothing else'
  );

  store.commit((model) => addEntity(model, 'ELM'));
  store.select('ELM-001');
  const one = enabled();
  equal(one.delete, true, 'a selected entity can be deleted');
  equal(one.relate, false, 'but not related, with no candidate in the model');
  equal(one['new-related'], true, 'though a related entity can always be newly made');
  equal(one['move-up'], false, 'an only child moves neither way');
  equal(one['move-down'], false, 'either way');
  equal(one['move-to'], false, 'and alone at the root it has nowhere else to file');
  equal(one.undo, true, 'a change can be undone');
  equal(one.rename, false, 'an entity is not renamed; its title is edited');

  store.commit((model) => addEntity(model, 'HAZ', { parent: null }));
  store.select('ELM-001');
  equal(enabled().relate, true, 'a candidate at the far end enables relating');
  equal(enabled()['move-down'], true, 'a sibling below enables moving down');

  store.select('HAZ-001');
  const second = enabled();
  equal(second['move-up'], true, 'the second sibling moves up');
  equal(second['move-down'], false, 'not down');

  store.commit((model) => relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001'));
  store.select('ELM-001');
  equal(enabled().relate, false, 'a consumed offer disables relating again');

  store.commit((model) => addFolder(model, 'Zone'));
  store.select('F-1');
  const folder = enabled();
  equal(folder.rename, true, 'a selected folder can be renamed');
  equal(folder.delete, true, 'and deleted');
  equal(folder.relate, false, 'never related');
  equal(folder['new-related'], false, 'nor newly related to');

  const said = (id) => actions.find((action) => action.id === id).describe();
  equal(said('delete'), 'Delete folder', 'the delete tooltip names the folder it would act on');
  store.select('ELM-001');
  equal(said('delete'), 'Delete entity', 'and the entity when one is selected');
  ok(/^Undo \(\d+ steps\)$/.test(said('undo')), 'undo says how far it reaches');
  equal(said('redo'), 'Nothing to redo', 'redo says when it reaches nowhere');
  store.undo();
  equal(said('redo'), 'Redo (1 step)', 'and counts a single step in the singular');

  store.undo();
  equal(enabled().redo, true, 'an undone change can be redone');
}

// --- Menu grouping -----------------------------------------------------

{
  deepEqual(menuGroups([]), [], 'no items, no groups');
  deepEqual(
    menuGroups([{ label: 'a' }, { label: 'b' }]).map((group) => [group.heading, group.items.length]),
    [[null, 2]],
    'ungrouped items share one unheaded group'
  );
  deepEqual(
    menuGroups([
      { label: 'a', group: 'One' },
      { label: 'b', group: 'One' },
      { label: 'c', group: 'Two' },
      { label: 'd' },
    ]).map((group) => [group.heading, group.items.length]),
    [['One', 2], ['Two', 1], [null, 1]],
    'a heading precedes the items whose group differs from the one before'
  );
  deepEqual(
    menuGroups([
      { label: 'a', group: 'One' },
      { label: 'b', group: 'Two' },
      { label: 'c', group: 'One' },
    ]).map((group) => group.heading),
    ['One', 'Two', 'One'],
    'a group returning later heads again: order is the list, never a re-sort'
  );
}

summary('test-actions');
