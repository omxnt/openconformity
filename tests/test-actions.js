/**
 * Exercises the one action list headless: every offer's enablement
 * against a live store, so no surface can disagree with the model. Also
 * the menu grouping. Run from this directory.
 */

import './shim.js';
import { createActions } from '../app/modules/actions.js';
import { menuGroups } from '../app/modules/menu.js';
import { createStore } from '../app/modules/store.js';
import { createModel, addEntity, addFolder, relate } from '../app/modules/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';
import { fakeStorage } from './helpers.js';

/** The identifiers of the enabled offers. */
function enabledIds(actions) {
  return actions.filter((action) => action.enabled()).map((action) => action.id);
}

// --- V-TST-001 The landing offers the three ways in and the help surface (F-APP-002) ---

{
  const store = createStore({ storage: fakeStorage() });
  const actions = createActions({ store, flows: {} });
  deepEqual(
    enabledIds(actions),
    ['new-project', 'open', 'load-example', 'clear-browser-data', 'about', 'metamodel'],
    'the no-project state offers the three ways in, the clearing of browser data, and the help surface — nothing that needs a project'
  );
}

// --- V-TST-002 The action list against a live store (F-MOD-001, F-MOD-005, F-MOD-008, F-MOD-009, N-ACC-003) ---

{
  const store = createStore({ storage: fakeStorage() });
  store.replaceProject(createModel());
  const actions = createActions({ store, flows: {} });
  const enabled = () => Object.fromEntries(actions.map((action) => [action.id, action.enabled()]));

  deepEqual(
    actions.map((action) => action.id),
    ['view-risk', 'view-safety', 'new-project', 'open', 'save', 'load-example', 'clear-browser-data', 'save-aside-copy', 'discard-aside', 'about', 'metamodel', 'edit', 'select-below', 'new-entity', 'new-related', 'new-folder', 'relate', 'import', 'move-up', 'move-down', 'cut', 'copy', 'paste', 'delete', 'undo', 'redo'],
    'the list holds every offer once, in surface order'
  );
  deepEqual(
    Object.fromEntries(actions.filter((action) => action.hint).map((action) => [action.id, action.hint])),
    { save: 'Ctrl S', 'select-below': 'Ctrl Shift A', 'move-up': 'Alt ↑', 'move-down': 'Alt ↓', cut: 'Ctrl X', copy: 'Ctrl C', paste: 'Ctrl V', delete: 'Del', undo: 'Ctrl Z', redo: 'Ctrl Y' },
    'the key hints ride on the actions the keys reach, the save one as the platform writes it'
  );
  ok(actions.every((action) => typeof action.icon === 'string' && action.icon.startsWith('i-')), 'every action carries its glyph');
  ok(actions.every((action) => action.toolbar || action.context || action.menubar || action.notice), 'every action appears on some surface');
  deepEqual(actions.filter((action) => action.notice).map((action) => action.id), ['save-aside-copy', 'discard-aside'], 'the restoration notice offers the two actions on the set-aside copy and nothing else');
  deepEqual(
    actions.filter((action) => action.menubar && action.group === 'project').map((action) => action.id),
    ['new-project', 'open', 'save'],
    'the File menu leads with the file actions'
  );
  deepEqual(
    actions.filter((action) => action.menubar && action.group === 'example').map((action) => action.id),
    ['load-example'],
    'and holds the example alone in its own group, behind the separator'
  );
  deepEqual(
    actions.filter((action) => action.menubar && action.group === 'browser').map((action) => [action.id, action.danger]),
    [['clear-browser-data', true]],
    'and ends with the clearing of browser data, in the danger colour, in its own group behind a separator'
  );
  deepEqual(
    actions.filter((action) => ['project', 'example', 'browser'].includes(action.group)).map((action) => action.label),
    ['New project', 'Open project…', 'Save to file…', 'Load example', 'Clear stored data'],
    'named as the File menu reads, top to bottom'
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
      'view-risk': true,
      'view-safety': true,
      'new-project': true,
      open: true,
      save: true,
      'load-example': true,
      'clear-browser-data': true,
      'save-aside-copy': false,
      'discard-aside': false,
      about: true,
      metamodel: true,
      edit: true,
      'select-below': false,
      'new-entity': true,
      'new-related': false,
      'new-folder': true,
      import: true,
      relate: false,
      'move-up': false,
      'move-down': false,
      cut: false,
      copy: false,
      paste: false,
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
  equal(one.cut, true, 'a selected row can be cut');
  equal(one.paste, false, 'and nothing is pasted while nothing is cut');
  store.setCut(['ELM-001']);
  equal(enabled().paste, false, 'a cut row is not pasted into itself');
  store.select(null);
  equal(enabled().paste, false, 'nor to the root where it already stands');
  store.setCopied(['ELM-001']);
  equal(enabled().paste, true, 'a copied row pastes anywhere, the root included');
  deepEqual(store.cut(), [], 'and the copy forgot the cut');
  store.setCopied([]);
  equal(one.undo, true, 'a change can be undone');
  equal(one.edit, true, 'an entity is edited, its title among its attributes');

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
  equal(folder.edit, true, 'a selected folder is edited too, its name being its one attribute');
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

// --- Menu grouping (no requirement) -----------------------------------------------

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

// --- V-TST-003 Nothing acts while a diagram is open (F-DRW-003) --------------

{
  const store = createStore({ storage: fakeStorage() });
  const actions = createActions({ store, flows: {} });
  store.replaceProject(createModel());
  ok(actions.find((action) => action.id === 'new-entity').enabled(), 'with a project open a new entity can be made');
  store.setDrawingOpen(true);
  ok(actions.every((action) => !action.enabled()), 'while a diagram is open over the workspace every action stands disabled');
  store.setDrawingOpen(false);
  ok(actions.find((action) => action.id === 'new-entity').enabled(), 'and acts again once it closes');
}

// --- The toolbar's shape (no requirement) ---------------------------------------------

{
  const store = createStore({ storage: fakeStorage() });
  const actions = createActions({ store, flows: {} });
  deepEqual(
    actions.filter((action) => action.toolbar).map((action) => action.id),
    ['new-entity', 'new-related', 'new-folder', 'import', 'move-up', 'move-down', 'delete'],
    'the tree toolbar holds the tree actions and the import from a library: relating lives in the relationship pane, undo and redo in the shell'
  );
  const runs = [];
  for (const action of actions.filter((offered) => offered.toolbar)) if (runs.at(-1)?.[0] !== action.group) runs.push([action.group, action.id]);
  deepEqual(runs.map(([group]) => group), ['create', 'library', 'arrange', 'delete'], 'each group a run of its own, so the import from a library stands between dividers');
}

// --- V-TST-004 Reorder stands down while the tree is filtered (F-WSP-001) ----

{
  const store = createStore({ storage: fakeStorage() });
  store.replaceProject(createModel());
  store.commit((model) => {
    addEntity(model, 'ELM');
    addEntity(model, 'HAZ');
  });
  store.select('HAZ-001');
  const actions = createActions({ store, flows: {} });
  const enabled = (id) => actions.find((action) => action.id === id).enabled();
  equal(enabled('move-up'), true, 'unfiltered, the second sibling moves up');
  store.setNavigatorFilter('h');
  equal(enabled('move-up'), false, 'filtered, it does not: visual neighbours are not real siblings');
  equal(enabled('move-down'), false, 'nor down');
  store.setNavigatorFilter('');
  equal(enabled('move-up'), true, 'clearing the filter restores the moves');
}

// --- V-TST-198 The actions over a selection of several (F-WSP-012, F-MOD-012) ---

{
  const store = createStore({ storage: fakeStorage() });
  store.replaceProject(createModel());
  const actions = createActions({ store, flows: {} });
  const enabled = () => Object.fromEntries(actions.map((action) => [action.id, action.enabled()]));
  store.commit((model) => addEntity(model, 'ELM'));
  store.commit((model) => addEntity(model, 'ELM'));
  store.commit((model) => addFolder(model, 'Zone'));
  store.selectMany(['ELM-001', 'ELM-002'], 'ELM-002');
  const many = enabled();
  ok(['new-entity', 'new-related', 'new-folder', 'relate', 'import', 'move-up', 'move-down', 'paste', 'select-below'].every((id) => many[id] === false), 'with several rows selected the actions that need one row stand down');
  ok(many.edit && many.delete && many.cut && many.copy, 'while edit, delete, cut and copy act on the set');
  equal(actions.find((action) => action.id === 'edit').describe(), 'Edit 2 selected', 'edit says how many');
  equal(actions.find((action) => action.id === 'delete').describe(), 'Delete 2 rows', 'as does delete');
  store.selectMany(['ELM-001', 'F-1'], 'F-1');
  equal(enabled().edit, false, 'edit stands down over a mixed selection');
  equal(enabled().delete, true, 'where delete still acts');
  store.select('F-1');
  equal(enabled()['select-below'], false, 'a folder with nothing under it offers no select all below');
  store.commit((model) => addEntity(model, 'HAZ', { parent: 'F-1' }));
  store.select('F-1');
  equal(enabled()['select-below'], true, 'one with something under it does');
  ok(many.undo && many.about, 'and the actions that need no selection stay');
}

// --- V-TST-199 The clipboard is a group of its own, and picking stands the model actions down (F-MOD-002, F-WSP-012) ---

{
  const store = createStore({ storage: fakeStorage() });
  store.replaceProject(createModel());
  const actions = createActions({ store, flows: {} });
  deepEqual(actions.filter((action) => action.group === 'clipboard').map((action) => action.id), ['cut', 'copy', 'paste'], 'cut, copy and paste form the clipboard group, so a divider parts them from the ordering');
  const groups = [];
  for (const action of actions.filter((offered) => offered.context)) if (groups.at(-1) !== action.group) groups.push(action.group);
  deepEqual(groups, ['edit', 'create', 'library', 'arrange', 'clipboard', 'delete'], 'the context menu runs the groups in order, the import between dividers and the clipboard after the ordering');
  store.commit((model) => addEntity(model, 'ELM'));
  store.commit((model) => addEntity(model, 'HAZ'));
  store.select('ELM-001');
  const enabled = () => Object.fromEntries(actions.map((action) => [action.id, action.enabled()]));
  const guarded = ['edit', 'select-below', 'new-entity', 'new-related', 'new-folder', 'import', 'move-up', 'move-down', 'cut', 'copy', 'paste', 'delete'];
  const before = enabled();
  ok(before.edit && before['new-entity'] && before.delete && before.cut, 'with a row selected the model actions are offered');
  store.beginPicking('ELM-001');
  const picking = enabled();
  ok(guarded.every((id) => picking[id] === false), 'while a relationship picker is open every one of them stands down, since picking is a mode');
  ok(!picking.undo && !picking.save && picking.about && picking.metamodel, 'while the file surface and the history stand down with them and the help surface stays');
  store.endPicking();
  deepEqual(enabled(), before, 'and they return as they were when the picking ends');
}

// --- V-TST-201 One mode at a time (F-MOD-002, F-MOD-004, F-MOD-010, F-VIE-001) ---

{
  const store = createStore({ storage: fakeStorage() });
  store.replaceProject(createModel());
  const actions = createActions({ store, flows: {} });
  const enabled = () => Object.fromEntries(actions.map((action) => [action.id, action.enabled()]));
  store.commit((model) => addEntity(model, 'ELM'));
  store.commit((model) => addEntity(model, 'HAZ'));
  store.select('ELM-001');
  const changers = ['edit', 'select-below', 'new-entity', 'new-related', 'new-folder', 'relate', 'import', 'move-up', 'move-down', 'cut', 'copy', 'paste', 'delete'];
  const stay = ['about', 'metamodel'];
  const waits = ['undo', 'redo', 'save', 'open', 'new-project', 'load-example'];
  equal(store.mode(), null, 'with nothing open there is no mode');
  const open = enabled();
  ok(open.edit && open.relate && open['new-entity'] && open['view-risk'], 'and the actions are offered');
  store.beginPicking('ELM-001');
  equal(store.mode(), 'picking', 'a picker opens the picking mode');
  const picking = enabled();
  ok(changers.every((id) => picking[id] === false) && picking['view-risk'] === false, 'which stands every changer and the views down, Add relationship among them');
  ok(stay.every((id) => picking[id] === open[id]) && waits.every((id) => picking[id] === false), 'the help surface stays, and the file surface and the history wait with the rest');
  store.endPicking();
  store.setLibraryOpen(true);
  equal(store.mode(), 'library', 'the library over the editor is a mode');
  ok(changers.every((id) => enabled()[id] === false), 'that stands the changers down');
  store.setLibraryOpen(false);
  store.openView('risk');
  equal(store.mode(), 'view', 'an open view is a mode');
  const viewing = enabled();
  ok(changers.every((id) => viewing[id] === false), 'that stands the changers down');
  ok(viewing['view-risk'] && viewing['view-safety'], 'while switching views stays, since that is the view mode\'s own action');
  store.closeView();
  store.setEditing(true);
  equal(store.mode(), 'editing', 'an edit is a mode the editor tells the store about');
  const editing = enabled();
  ok(changers.every((id) => editing[id] === false) && editing['view-risk'] === false, 'that stands the changers and the views down like any other mode, the edit left by Save, Cancel or Escape');
  ok(stay.every((id) => editing[id] === open[id]) && waits.every((id) => editing[id] === false), 'the help surface staying and the file surface waiting, so no file is saved with a draft open');
  store.setEditing(false);
  store.setDrawingOpen(true);
  equal(store.mode(), 'drawing', 'and the diagram editor stands over all of them');
  store.setDrawingOpen(false);
  store.beginPicking('ELM-001');
  store.setEditing(true);
  equal(store.mode(), 'picking', 'where two flags stand, the one over the other names the mode');
}

// --- V-TST-204 The context menu is the Edit menu less the history (G-SYS-004) ---

{
  const store = createStore({ storage: fakeStorage() });
  const actions = createActions({ store, flows: {} });
  const modelGroups = ['edit', 'create', 'library', 'arrange', 'clipboard', 'delete', 'history'];
  const editMenu = actions.filter((action) => modelGroups.includes(action.group) && action.menubar !== false).map((action) => action.id);
  const contextMenu = actions.filter((action) => action.context).map((action) => action.id);
  deepEqual(contextMenu, editMenu.filter((id) => !['undo', 'redo'].includes(id)), 'the context menu holds the Edit menu\'s entries less undo and redo, in the same order, so the dividers fall alike');
  ok(contextMenu.includes('import') && editMenu.includes('select-below'), 'the import files under the row clicked and select all below reaches the menu bar');
}

summary('test-actions');
