/**
 * One action list. Every surface that offers an action — the navigator
 * toolbar, the context menu — draws from this list, so no offer disagrees
 * with another or with the model. An action states where it appears, when
 * it is enabled, and what flow it runs; rendering is the surface's
 * business.
 */

import { nodeOf } from './model.js';
import { relationshipOptions, relatedTypeOffer, moveTargets, canMoveUp, canMoveDown } from './queries.js';

/**
 * @typedef {Object} Action
 * @property {string} id
 * @property {string} label
 * @property {string} group     toolbar groups; a divider separates them
 * @property {boolean} toolbar  whether the navigator toolbar offers it
 * @property {boolean} context  whether the context menu offers it
 * @property {boolean} [menubar]  whether the shell's Project menu offers it
 * @property {boolean} [menu]   whether running it opens a menu
 * @property {boolean} [danger]
 * @property {string} icon      the sprite symbol a menu draws it under
 * @property {string} [hint]    the right-aligned key hint a menu shows
 * @property {() => string} [describe]  a tooltip naming what it would act on
 * @property {() => boolean} enabled
 * @property {(invocation: { anchor?: HTMLElement, at?: { x: number, y: number } }) => void} run
 */

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {ReturnType<import('./flows.js').createFlows>} context.flows
 * @returns {Action[]}
 */
export function createActions({ store, flows }) {
  const selected = () => nodeOf(store.model(), store.selection());

  return [
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
      label: 'Save project',
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
      id: 'new-entity',
      icon: 'i-new-entity',
      label: 'New',
      group: 'create',
      toolbar: true,
      context: true,
      menu: true,
      enabled: () => store.hasProject(),
      run: (invocation) => flows.toggleCreateMenu(invocation),
    },
    {
      id: 'new-related',
      icon: 'i-new-related',
      label: 'New related…',
      group: 'create',
      toolbar: true,
      context: true,
      menu: true,
      enabled: () =>
        selected()?.kind === 'entity' && relatedTypeOffer(store.model(), store.selection()).length > 0,
      run: (invocation) => flows.toggleRelatedMenu(invocation),
    },
    {
      id: 'new-folder',
      icon: 'i-new-folder',
      label: 'New folder',
      group: 'create',
      toolbar: true,
      context: true,
      enabled: () => store.hasProject(),
      run: () => flows.createFolder(),
    },
    {
      id: 'relate',
      icon: 'i-add-relationship',
      label: 'Relate…',
      group: 'create',
      toolbar: false,
      context: true,
      enabled: () =>
        selected()?.kind === 'entity' &&
        relationshipOptions(store.model(), store.selection()).length > 0,
      run: () => flows.relateSelection(),
    },
    {
      id: 'rename',
      icon: 'i-edit',
      label: 'Rename…',
      group: 'arrange',
      toolbar: false,
      context: true,
      enabled: () => selected()?.kind === 'folder',
      run: () => flows.renameSelection(),
    },
    {
      id: 'move-up',
      icon: 'i-move-up',
      label: 'Move up',
      group: 'arrange',
      toolbar: true,
      context: true,
      hint: 'Alt ↑',
      enabled: () => store.navigatorFilter().trim() === '' && canMoveUp(store.model(), store.selection()),
      run: () => flows.moveUp(),
    },
    {
      id: 'move-down',
      icon: 'i-move-down',
      label: 'Move down',
      group: 'arrange',
      toolbar: true,
      context: true,
      hint: 'Alt ↓',
      enabled: () => store.navigatorFilter().trim() === '' && canMoveDown(store.model(), store.selection()),
      run: () => flows.moveDown(),
    },
    {
      id: 'move-to',
      icon: 'i-move-to',
      label: 'Move to…',
      group: 'arrange',
      toolbar: true,
      context: true,
      enabled: () => selected() !== null && moveTargets(store.model(), store.selection()).length > 0,
      run: () => flows.moveToSelection(),
    },
    {
      id: 'delete',
      icon: 'i-delete',
      label: 'Delete',
      group: 'delete',
      toolbar: true,
      context: true,
      danger: true,
      hint: 'Del',
      describe: () => (selected()?.kind === 'folder' ? 'Delete folder' : 'Delete entity'),
      enabled: () => selected() !== null,
      run: () => flows.deleteSelection(),
    },
    {
      id: 'undo',
      icon: 'i-undo',
      label: 'Undo',
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
}
