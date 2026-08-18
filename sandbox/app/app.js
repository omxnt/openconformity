/**
 * Wiring: constructs and connects, nothing else.
 */

import { createStore } from './store.js';
import { createOverlay } from './overlay.js';
import { createShell } from './shell.js';
import { createDialogs } from './dialog.js';
import { createEditor } from './editor.js';
import { createNavigator } from './navigator.js';
import { createRelationshipsView } from './relationships-view.js';
import { createGraphView } from './graph-view.js';
import { createRelateWorkflow } from './relate.js';
import { createFlows } from './flows.js';
import { createActions } from './actions.js';

const store = createStore({ storage: window.localStorage });
const overlay = createOverlay({ container: document.getElementById('overlay-root') });
store.subscribe(() => overlay.closeMenus());

const dialogs = createDialogs({ overlay });
const editor = createEditor({
  store,
  head: document.getElementById('editor-head'),
  body: document.getElementById('editor-body'),
  onSave: (id, values) => flows.saveEdit(id, values),
  onCancel: () => flows.cancelEdit(),
  onRename: () => flows.renameSelection(),
  onRenameProject: () => flows.renameProject(),
});
const flows = createFlows({
  store,
  overlay,
  dialogs,
  editor,
  getActions: () => actions,
  fileInput: document.getElementById('file-input'),
});
const actions = createActions({ store, flows });
createShell({ store, overlay, actions });
createNavigator({
  store,
  container: document.getElementById('navigator-body'),
  toolbar: document.getElementById('navigator-toolbar'),
  search: document.getElementById('navigator-search'),
  filterInput: document.getElementById('navigator-filter'),
  filterClear: document.getElementById('navigator-filter-clear'),
  actions,
  onSelect: (id) => flows.selectNode(id),
  onFile: (id, parentId) => flows.fileNode(id, parentId),
  onPlace: (id, targetId, position) => flows.placeNode(id, targetId, position),
  onContextMenu: (id, at) => flows.openContextMenu(id, at),
});
const graph = createGraphView({ store, onSelect: (id) => flows.selectNode(id) });
createRelationshipsView({
  store,
  head: document.getElementById('relationships-head'),
  body: document.getElementById('relationships-body'),
  graph,
  onAdd: () => flows.relateSelection(),
  onUnrelate: (relationship) => flows.removeRelationship(relationship),
  onSelect: (id) => flows.selectNode(id),
});
createRelateWorkflow({
  store,
  overlay,
  onDone: (subject, picks) => flows.completeRelate(subject, picks),
});

document.addEventListener('keydown', (event) => {
  const target = event.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return;
  }
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;
  event.preventDefault();
  if (event.shiftKey) flows.redo();
  else flows.undo();
});
