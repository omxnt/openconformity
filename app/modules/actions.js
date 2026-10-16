/**
 * One action list. Every surface that offers an action — the navigator
 * toolbar, the context menu — draws from this list, so no offer disagrees
 * with another or with the model. An action states where it appears, when
 * it is enabled, and what flow it runs; rendering is the surface's
 * business.
 */

import { nodeOf, canFile, childrenOf } from './model.js';
import { relationshipOptions, relatedTypeOffer, canMoveUp, canMoveDown } from './queries.js';
import { VIEWS } from './view-registry.js';
import { APPLE } from './platform.js';

/**
 * @typedef {Object} Action
 * @property {string} id
 * @property {string} label
 * @property {string} group     toolbar groups; a divider separates them
 * @property {boolean} toolbar  whether the navigator toolbar offers it
 * @property {boolean} context  whether the context menu offers it
 * @property {boolean} [menubar]  whether the shell's Project menu offers it
 * @property {boolean} [notice]   whether the restoration notice offers it
 * @property {boolean} [menu]   whether running it opens a menu
 * @property {boolean} [danger]
 * @property {string} icon      the sprite symbol a menu draws it under
 * @property {string} [hint]    the right-aligned key hint a menu shows
 * @property {() => string} [describe]  the words for its tooltip and its menu entry, naming what it would act on
 * @property {() => boolean} enabled
 * @property {() => boolean} [checked]  whether a view action is the one open, a menu marking it
 * @property {(invocation: { anchor?: HTMLElement, at?: { x: number, y: number } }) => void} run
 */

/** The shortcuts as the platform writes them, the command key on Apple's, Ctrl elsewhere. */
const SAVE_HINT = APPLE ? '⌘S' : 'Ctrl S';
/** The other key hints as the platform writes them: undo and redo, delete, and the moves. */
const UNDO_HINT = APPLE ? '⌘Z' : 'Ctrl Z';
const REDO_HINT = APPLE ? '⇧⌘Z' : 'Ctrl Y';
const DELETE_HINT = APPLE ? '⌘⌫' : 'Del';
const CUT_HINT = APPLE ? '⌘X' : 'Ctrl X';
const PASTE_HINT = APPLE ? '⌘V' : 'Ctrl V';
const COPY_HINT = APPLE ? '⌘C' : 'Ctrl C';
const SELECT_BELOW_HINT = APPLE ? '⇧⌘A' : 'Ctrl Shift A';
const UP_HINT = APPLE ? '⌥↑' : 'Alt ↑';
const DOWN_HINT = APPLE ? '⌥↓' : 'Alt ↓';

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {ReturnType<import('./flows.js').createFlows>} context.flows
 * @returns {Action[]}
 */
export function createActions({ store, flows }) {
  const selected = () => nodeOf(store.model(), store.selection());
  /** Whether one row at most is selected, which the actions that create, relate or reorder need. */
  const single = () => store.selected().length <= 1;
  /** The one entity type a selection of several holds, or null where the rows differ in type or a folder is among them. */
  const bulkType = () => {
    const types = new Set(store.selected().map((id) => nodeOf(store.model(), id)).map((node) => (node?.kind === 'entity' ? node.type : null)));
    return types.size === 1 && !types.has(null) ? [...types][0] : null;
  };

  /** @type {Action[]} */
  const actions = [
    ...VIEWS.map((view) => ({
      id: `view-${view.id}`,
      icon: 'i-view-list',
      label: view.name,
      group: 'views',
      toolbar: false,
      context: false,
      menubar: true,
      enabled: () => store.hasProject(),
      checked: () => store.view()?.id === view.id,
      run: () => flows.openView(view.id),
    })),
    {
      id: 'new-project',
      icon: 'i-new-project',
      label: 'New project',
      group: 'project',
      toolbar: false,
      context: false,
      menubar: true,
      enabled: () => true,
      run: () => flows.newProject(),
    },
    {
      id: 'open',
      icon: 'i-open-project',
      label: 'Open project…',
      group: 'project',
      toolbar: false,
      context: false,
      menubar: true,
      enabled: () => true,
      run: () => flows.openProjectFlow(),
    },
    {
      id: 'save',
      icon: 'i-save',
      label: 'Save to file…',
      hint: SAVE_HINT,
      group: 'project',
      toolbar: false,
      context: false,
      menubar: true,
      enabled: () => store.hasProject(),
      run: () => flows.saveProject(),
    },
    {
      id: 'load-example',
      icon: 'i-project',
      label: 'Load example',
      group: 'example',
      toolbar: false,
      context: false,
      menubar: true,
      enabled: () => true,
      run: () => flows.loadExample(),
    },
    {
      id: 'clear-browser-data',
      icon: 'i-delete',
      label: 'Clear stored data',
      group: 'browser',
      toolbar: false,
      context: false,
      menubar: true,
      enabled: () => true,
      danger: true,
      run: () => flows.clearBrowserData(),
    },
    {
      id: 'save-aside-copy',
      icon: 'i-save',
      label: 'Save copy',
      group: 'aside',
      toolbar: false,
      context: false,
      menubar: false,
      notice: true,
      enabled: () => store.hasAside(),
      run: () => flows.saveAsideCopy(),
    },
    {
      id: 'discard-aside',
      icon: 'i-delete',
      label: 'Discard',
      group: 'aside',
      toolbar: false,
      context: false,
      menubar: false,
      notice: true,
      enabled: () => store.hasAside(),
      danger: true,
      run: () => flows.discardAside(),
    },
    {
      id: 'about',
      icon: 'i-information',
      label: 'About',
      group: 'help',
      toolbar: false,
      context: false,
      menubar: true,
      enabled: () => true,
      run: () => flows.showAbout(),
    },
    {
      id: 'metamodel',
      icon: 'i-metamodel',
      label: 'Metamodel',
      group: 'help',
      toolbar: false,
      context: false,
      menubar: true,
      enabled: () => true,
      run: () => flows.openMetamodel(),
    },
    {
      id: 'edit',
      icon: 'i-edit',
      label: 'Edit attributes',
      group: 'edit',
      toolbar: false,
      context: true,
      enabled: () => store.hasProject() && (single() || bulkType() !== null),
      describe: () => (store.selected().length > 1 ? `Edit ${store.selected().length} selected` : 'Edit attributes'),
      run: () => flows.editSelection(),
    },
    {
      id: 'select-below',
      icon: 'i-checkmark',
      label: 'Select all below',
      group: 'edit',
      toolbar: false,
      context: true,
      menubar: false,
      hint: SELECT_BELOW_HINT,
      enabled: () => store.hasProject() && single() && childrenOf(store.model(), store.selection()).length > 0,
      run: () => flows.selectBelow(store.selection()),
    },
    {
      id: 'new-entity',
      icon: 'i-new-entity',
      label: 'New entity',
      group: 'create',
      toolbar: true,
      context: true,
      menu: true,
      enabled: () => single() && store.hasProject(),
      run: (invocation) => flows.toggleCreateMenu(invocation),
    },
    {
      id: 'new-related',
      icon: 'i-new-related',
      label: 'New related',
      group: 'create',
      toolbar: true,
      context: true,
      menu: true,
      enabled: () =>
        single() && selected()?.kind === 'entity' && relatedTypeOffer(store.model(), store.selection()).length > 0,
      run: (invocation) => flows.toggleRelatedMenu(invocation),
    },
    {
      id: 'new-folder',
      icon: 'i-new-folder',
      label: 'New folder…',
      group: 'create',
      toolbar: true,
      context: true,
      enabled: () => single() && store.hasProject(),
      run: () => flows.createFolder(),
    },
    {
      id: 'relate',
      icon: 'i-add-relationship',
      label: 'Add relationship',
      group: 'create',
      toolbar: false,
      context: true,
      enabled: () =>
        single() && selected()?.kind === 'entity' &&
        relationshipOptions(store.model(), store.selection()).length > 0,
      run: () => flows.relateSelection(),
    },
    {
      id: 'import',
      icon: 'i-import',
      label: 'Import from library',
      group: 'library',
      toolbar: true,
      context: false,
      enabled: () => single() && store.hasProject(),
      run: () => flows.importFromLibrary(),
    },
    {
      id: 'move-up',
      icon: 'i-move-up',
      label: 'Move up',
      group: 'arrange',
      toolbar: true,
      context: true,
      hint: UP_HINT,
      enabled: () => single() && store.navigatorFilter().trim() === '' && canMoveUp(store.model(), store.selection()),
      run: () => flows.moveUp(),
    },
    {
      id: 'move-down',
      icon: 'i-move-down',
      label: 'Move down',
      group: 'arrange',
      toolbar: true,
      context: true,
      hint: DOWN_HINT,
      enabled: () => single() && store.navigatorFilter().trim() === '' && canMoveDown(store.model(), store.selection()),
      run: () => flows.moveDown(),
    },
    {
      id: 'cut',
      icon: 'i-cut',
      label: 'Cut',
      group: 'arrange',
      toolbar: false,
      context: true,
      hint: CUT_HINT,
      enabled: () => selected() !== null,
      run: () => flows.cutSelection(),
    },
    {
      id: 'copy',
      icon: 'i-copy',
      label: 'Copy',
      group: 'arrange',
      toolbar: false,
      context: true,
      hint: COPY_HINT,
      enabled: () => selected() !== null,
      run: () => flows.copySelection(),
    },
    {
      id: 'paste',
      icon: 'i-paste',
      label: 'Paste',
      group: 'arrange',
      toolbar: false,
      context: true,
      hint: PASTE_HINT,
      enabled: () =>
        single() && store.copied().length > 0
          ? store.hasProject() && (store.selection() === null || selected() !== null)
          : single() && store.cut().length > 0 && store.cut().every((id) => canFile(store.model(), id, store.selection()).ok),
      run: () => flows.pasteHeld(),
    },
    {
      id: 'delete',
      icon: 'i-delete',
      label: 'Delete entity',
      group: 'delete',
      toolbar: true,
      context: true,
      danger: true,
      hint: DELETE_HINT,
      describe: () => (store.selected().length > 1 ? `Delete ${store.selected().length} rows` : selected()?.kind === 'folder' ? 'Delete folder' : 'Delete entity'),
      enabled: () => selected() !== null,
      run: () => flows.deleteSelection(),
    },
    {
      id: 'undo',
      icon: 'i-undo',
      label: 'Undo',
      hint: UNDO_HINT,
      group: 'history',
      toolbar: false,
      context: false,
      menubar: true,
      describe: () => {
        const { back } = store.historyDepth();
        return back === 0 ? 'Nothing to undo' : `Undo (${back} ${back === 1 ? 'step' : 'steps'})`;
      },
      enabled: () => store.canUndo(),
      run: () => flows.undo(),
    },
    {
      id: 'redo',
      icon: 'i-redo',
      label: 'Redo',
      hint: REDO_HINT,
      group: 'history',
      toolbar: false,
      context: false,
      menubar: true,
      describe: () => {
        const { forward } = store.historyDepth();
        return forward === 0 ? 'Nothing to redo' : `Redo (${forward} ${forward === 1 ? 'step' : 'steps'})`;
      },
      enabled: () => store.canRedo(),
      run: () => flows.redo(),
    },
  ];
  // While a diagram is open over the workspace nothing may change the
  // model beneath it, so every action stands disabled until Apply or Cancel.
  return actions.map((action) => ({ ...action, enabled: () => !store.drawingOpen() && action.enabled() }));
}
