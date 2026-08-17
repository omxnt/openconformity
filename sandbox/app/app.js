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
import { createFlows, relationshipOptions } from './flows.js';
import { nodeOf } from './model.js';

const store = createStore({ storage: window.localStorage });
const overlay = createOverlay({ container: document.getElementById('overlay-root') });
store.subscribe(() => overlay.closeMenus());

createShell({ store, overlay });
const dialogs = createDialogs({ overlay });
const editor = createEditor({
  store,
  container: document.getElementById('editor-body'),
  onSave: (id, values) => flows.saveEdit(id, values),
});
const flows = createFlows({ store, overlay, dialogs, editor });
createNavigator({
  store,
  container: document.getElementById('navigator-body'),
  onSelect: (id) => flows.selectNode(id),
  onFile: (id, parentId) => flows.fileNode(id, parentId),
});
createRelationshipsView({ store, container: document.getElementById('relationships-body') });

const newButton = document.getElementById('toolbar-new');
const relateButton = document.getElementById('toolbar-relate');
const deleteButton = document.getElementById('toolbar-delete');
const undoButton = document.getElementById('toolbar-undo');
const redoButton = document.getElementById('toolbar-redo');

newButton.addEventListener('click', () => flows.toggleCreateMenu(newButton));
relateButton.addEventListener('click', () => flows.relateSelection());
deleteButton.addEventListener('click', () => flows.deleteSelection());
undoButton.addEventListener('click', () => flows.undo());
redoButton.addEventListener('click', () => flows.redo());

function syncToolbar() {
  const node = nodeOf(store.model(), store.selection());
  const entitySelected = node !== null && node.kind === 'entity';
  relateButton.disabled =
    !entitySelected || relationshipOptions(store.model(), store.selection()).length === 0;
  deleteButton.disabled = !entitySelected;
  undoButton.disabled = !store.canUndo();
  redoButton.disabled = !store.canRedo();
}
store.subscribe(syncToolbar);
syncToolbar();

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
