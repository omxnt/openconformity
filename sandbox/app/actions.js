/**
 * One action list. Every surface that offers an action — the navigator
 * toolbar, the context menu — draws from this list, so no offer disagrees
 * with another or with the model. An action states where it appears, when
 * it is enabled, and what flow it runs; rendering is the surface's
 * business.
 */

import { nodeOf, childrenOf } from './model.js';
import { relationshipOptions, relatedTypeOffer, moveTargets } from './flows.js';

/**
 * Whether a node has a sibling above it to change places with.
 * @param {import('./model.js').Model} model
 * @param {string|null} id
 * @returns {boolean}
 */
export function canMoveUp(model, id) {
  const node = nodeOf(model, id);
  if (!node) return false;
  return childrenOf(model, node.parent).findIndex((sibling) => sibling.id === id) > 0;
}

/**
 * Whether a node has a sibling below it to change places with.
 * @param {import('./model.js').Model} model
 * @param {string|null} id
 * @returns {boolean}
 */
export function canMoveDown(model, id) {
  const node = nodeOf(model, id);
  if (!node) return false;
  const siblings = childrenOf(model, node.parent);
  const index = siblings.findIndex((sibling) => sibling.id === id);
  return index >= 0 && index < siblings.length - 1;
}

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
 * @property {string} [hint]    the right-aligned key hint a menu shows
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
      label: 'Open…',
      group: 'project',
      toolbar: false,
      context: false,
      menubar: true,
      enabled: () => true,
      run: () => flows.openProjectFlow(),
    },
    {
      id: 'save',
      label: 'Save',
      group: 'project',
      toolbar: false,
      context: false,
      menubar: true,
      enabled: () => store.hasProject(),
      run: () => flows.saveProject(),
    },
    {
      id: 'about',
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
      label: 'New folder',
      group: 'create',
      toolbar: true,
      context: true,
      enabled: () => store.hasProject(),
      run: () => flows.createFolder(),
    },
    {
      id: 'relate',
      label: 'Relate…',
      group: 'create',
      toolbar: true,
      context: true,
      enabled: () =>
        selected()?.kind === 'entity' &&
        relationshipOptions(store.model(), store.selection()).length > 0,
      run: () => flows.relateSelection(),
    },
    {
      id: 'rename',
      label: 'Rename…',
      group: 'arrange',
      toolbar: false,
      context: true,
      enabled: () => selected()?.kind === 'folder',
      run: () => flows.renameSelection(),
    },
    {
      id: 'move-up',
      label: 'Move up',
      group: 'arrange',
      toolbar: true,
      context: true,
      hint: 'Alt ↑',
      enabled: () => canMoveUp(store.model(), store.selection()),
      run: () => flows.moveUp(),
    },
    {
      id: 'move-down',
      label: 'Move down',
      group: 'arrange',
      toolbar: true,
      context: true,
      hint: 'Alt ↓',
      enabled: () => canMoveDown(store.model(), store.selection()),
      run: () => flows.moveDown(),
    },
    {
      id: 'move-to',
      label: 'Move to…',
      group: 'arrange',
      toolbar: false,
      context: true,
      enabled: () => selected() !== null && moveTargets(store.model(), store.selection()).length > 0,
      run: () => flows.moveToSelection(),
    },
    {
      id: 'delete',
      label: 'Delete',
      group: 'delete',
      toolbar: true,
      context: true,
      danger: true,
      hint: 'Del',
      enabled: () => selected() !== null,
      run: () => flows.deleteSelection(),
    },
    {
      id: 'undo',
      label: 'Undo',
      group: 'history',
      toolbar: true,
      context: false,
      enabled: () => store.canUndo(),
      run: () => flows.undo(),
    },
    {
      id: 'redo',
      label: 'Redo',
      group: 'history',
      toolbar: true,
      context: false,
      enabled: () => store.canRedo(),
      run: () => flows.redo(),
    },
  ];
}
