/**
 * Wiring: constructs and connects, nothing else.
 */

import { createStore } from './store.js';
import { createRetention } from './retention.js';
import { createOverlay } from './overlay.js';
import { createShell } from './shell.js';
import { createDialogs } from './dialog.js';
import { createEditor } from './editor.js';
import { createNavigator } from './navigator.js';
import { createRelationshipsView } from './relationships.js';
import { createGraphView } from './graph.js';
import { createFlows } from './flows.js';
import { createActions } from './actions.js';
import { createViewsPane } from './views.js';
import { createLibraryPane } from './library.js';
import { createDrawingSurface } from './drawing-editor.js';
import { LIBRARIES } from '../library/index.js';

const retention = createRetention({ indexedDB: window.indexedDB, storageManager: window.navigator.storage ?? null });
const store = createStore({ storage: window.localStorage, session: window.sessionStorage, retention });
await store.restore();
const overlay = createOverlay({ container: document.getElementById('overlay-root') });
store.subscribe(() => overlay.closeMenus());

const dialogs = createDialogs({ overlay, toastRegion: document.getElementById('toasts') });
const drawingSurface = createDrawingSurface({
  workspace: document.getElementById('workspace'),
  pane: document.getElementById('pane-drawing'),
  head: document.getElementById('drawing-head'),
  body: document.getElementById('drawing-body'),
  store,
});
const editor = createEditor({
  dialogs,
  drawingSurface,
  overlay,
  store,
  head: document.getElementById('editor-head'),
  body: document.getElementById('editor-body'),
  onSave: (id, values) => flows.saveEdit(id, values),
  onSaveProject: (values) => flows.saveProjectEdit(values),
  onRemoval: (entries) => flows.confirmRemoval(entries),
  onCancel: () => flows.cancelEdit(),
  onRename: () => flows.renameSelection(),
  onReturn: () => flows.returnToView(),
  onEscape: () => flows.escapeEdit(),
  onAction: (id) => actions.find((action) => action.id === id)?.run({}),
  onReview: (id, definition) => flows.markReviewed(id, definition),
});
const flows = createFlows({
  store,
  overlay,
  dialogs,
  editor,
  fileInput: document.getElementById('file-input'),
});
const actions = createActions({ store, flows });
createShell({
  store,
  overlay,
  actions,
  toast: dialogs.toast,
  onMessages: () => {
    if (store.view()) flows.closeView();
    store.setMessagesOpen(true);
  },
});
createNavigator({
  store,
  container: document.getElementById('navigator-body'),
  toolbar: document.getElementById('navigator-toolbar'),
  search: document.getElementById('navigator-search'),
  filterInput: document.getElementById('navigator-filter'),
  filterClear: document.getElementById('navigator-filter-clear'),
  overlay,
  actions,
  onSelect: (id) => flows.selectNode(id),
  onActivate: (id) => flows.activateNode(id),
  onFile: (id, parentId) => flows.fileNode(id, parentId),
  onPlace: (id, targetId, position) => flows.placeNode(id, targetId, position),
});
const graph = createGraphView({
  store,
  onSelect: (id) => flows.selectNode(id),
  onUnrelate: (relationship) => flows.removeRelationship(relationship),
});
const relateAction = actions.find((action) => action.id === 'relate');
createRelationshipsView({
  store,
  head: document.getElementById('relationships-head'),
  body: document.getElementById('relationships-body'),
  graph,
  onAdd: () => flows.relateSelection(),
  onDone: (subject, picks) => flows.completeRelate(subject, picks),
  onUnrelate: (relationship) => flows.removeRelationship(relationship),
  onSelect: (id) => flows.selectNode(id),
  addEnabled: () => relateAction.enabled(),
});
createLibraryPane({
  store,
  head: document.getElementById('editor-head'),
  body: document.getElementById('editor-body'),
  libraries: LIBRARIES,
  onImport: (chosen) => flows.importPicks(chosen),
  onClose: () => flows.closeLibrary(),
});
createViewsPane({
  store,
  overlay,
  workspace: document.getElementById('workspace'),
  pane: document.getElementById('pane-view'),
  head: document.getElementById('view-head'),
  body: document.getElementById('view-body'),
  onSelect: (id) => flows.openFromView(id),
  onClose: () => flows.closeView(),
});

// The keys the platforms agree on, ⌘ on Apple keyboards and Ctrl elsewhere:
// S saves the open edit or the project, Enter finishes what is open, an
// edit, a picking or a diagram, F reaches the tree's filter, Z and ⇧Z
// undo and redo, and Y redoes where Windows has it.
document.addEventListener('keydown', (event) => {
  if (!(event.metaKey || event.ctrlKey)) return;
  const key = event.key.toLowerCase();
  if (store.drawingOpen()) {
    if (key !== 'enter') return;
    event.preventDefault();
    document.querySelector('#drawing-head .button-primary')?.click();
    return;
  }
  if (key === 's') {
    event.preventDefault();
    if (editor.editing()) editor.submit();
    else actions.find((action) => action.id === 'save')?.run({});
    return;
  }
  if (key === 'enter') {
    event.preventDefault();
    if (editor.editing()) {
      editor.submit();
      return;
    }
    const picker = store.picker();
    if (picker !== null && picker.picks.length > 0) flows.completeRelate(picker.subject, picker.picks);
    return;
  }
  if (key === 'f') {
    const filter = document.getElementById('navigator-filter');
    if (!store.hasProject() || !filter) return;
    event.preventDefault();
    filter.focus();
    filter.select();
    return;
  }
  const target = event.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return;
  }
  if (key === 'z') {
    event.preventDefault();
    if (event.shiftKey) flows.redo();
    else flows.undo();
  } else if (key === 'y' && event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    flows.redo();
  }
});
