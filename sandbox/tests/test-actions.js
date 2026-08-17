/**
 * Exercises the one action list headless: the move predicates, and every
 * offer's enablement against a live store, so no surface can disagree
 * with the model. Also the menu grouping. Run from this directory.
 */

import './shim.js';
import { createActions, canMoveUp, canMoveDown } from '../app/actions.js';
import { menuGroups } from '../app/menu.js';
import { createStore } from '../app/store.js';
import { createModel, addEntity, addFolder, relate } from '../app/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

// --- The move predicates -----------------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addFolder(model, 'Zone');
  addEntity(model, 'HAZ');
  addEntity(model, 'SCN', { parent: 'F-1' });

  equal(canMoveUp(model, 'ELM-001'), false, 'the first sibling cannot move up');
  equal(canMoveDown(model, 'ELM-001'), true, 'but can move down');
  equal(canMoveUp(model, 'F-1'), true, 'a middle sibling moves both ways, kinds interleaved');
  equal(canMoveDown(model, 'F-1'), true, 'in one order');
  equal(canMoveUp(model, 'HAZ-001'), true, 'the last sibling can move up');
  equal(canMoveDown(model, 'HAZ-001'), false, 'but not down');
  equal(canMoveUp(model, 'SCN-001'), false, 'an only child moves neither way');
  equal(canMoveDown(model, 'SCN-001'), false, 'in its own parent');
  equal(canMoveUp(model, 'ELM-9'), false, 'a missing node moves nowhere');
  equal(canMoveUp(model, null), false, 'nor does no selection');
}

// --- The action list against a live store ------------------------------

{
  const store = createStore({ storage: fakeStorage() });
  const actions = createActions({ store, flows: {} });
  const enabled = () => Object.fromEntries(actions.map((action) => [action.id, action.enabled()]));

  deepEqual(
    actions.map((action) => action.id),
    ['new-project', 'open', 'save', 'new-entity', 'new-folder', 'relate', 'rename', 'move-up', 'move-down', 'delete', 'undo', 'redo'],
    'the list holds every offer once, in surface order'
  );
  ok(actions.every((action) => action.toolbar || action.context || action.menubar), 'every action appears on some surface');
  deepEqual(
    actions.filter((action) => action.menubar).map((action) => action.id),
    ['new-project', 'open', 'save'],
    'the Project menu offers the file actions and nothing else'
  );
  ok(
    actions.filter((action) => action.menubar).every((action) => !action.toolbar && !action.context),
    'and the file actions appear nowhere else'
  );

  deepEqual(
    enabled(),
    {
      'new-project': true,
      open: true,
      save: true,
      'new-entity': true,
      'new-folder': true,
      relate: false,
      rename: false,
      'move-up': false,
      'move-down': false,
      delete: false,
      undo: false,
      redo: false,
    },
    'an empty project offers creation, the file surface, and nothing else'
  );

  store.commit((model) => addEntity(model, 'ELM'));
  store.select('ELM-001');
  const one = enabled();
  equal(one.delete, true, 'a selected entity can be deleted');
  equal(one.relate, false, 'but not related, with no candidate in the model');
  equal(one['move-up'], false, 'an only child moves neither way');
  equal(one['move-down'], false, 'either way');
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
