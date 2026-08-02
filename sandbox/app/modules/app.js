/**
 * Wiring.
 *
 * Holds the model and the selection, builds the panes, and re-renders them
 * when either changes. Every mutation is delegated to model.js, which is where
 * the metamodel is enforced.
 */

import { ENTITY_TYPES, PILLARS, RELATIONSHIP_TYPES, RELATIONSHIP_TYPE_IDS, compositionBetween } from './metamodel.js';
import {
  addEntity,
  addFolder,
  addRelationship,
  createModel,
  deletionSet,
  displayLabel,
  folderCount,
  fromJSON,
  removeEntity,
  removeFolder,
  renameFolder,
  toJSON,
} from './model.js';
import { buildExampleModel } from './example.js';
import { createNavigator } from './navigator.js';
import { createEditor } from './editor.js';
import { createRelationshipPane } from './relationships.js';
import { createToolbar } from './toolbar.js';
import { createMenuBar, openPopupMenu } from './menu.js';
import { contextMenuItems, contextOf } from './actions.js';
import { confirmDialog, notify, openDialog, promptDialog } from './dialog.js';
import { el } from './dom.js';

const state = {
  model: buildExampleModel(),
  /** @type {import('./navigator.js').Selection} */
  selection: { kind: 'entity', id: 'HAZ-001' },
};

const refs = {
  menubar: document.getElementById('menubar-menus'),
  dropdowns: document.getElementById('dropdown-layer'),
  toolbarNew: document.getElementById('toolbar-new'),
  toolbarEdit: document.getElementById('toolbar-edit'),
  toolbarDelete: document.getElementById('toolbar-delete'),
  toolbarContext: document.getElementById('toolbar-context'),
  tree: document.getElementById('tree'),
  filter: document.getElementById('navigator-filter'),
  filterClear: document.getElementById('navigator-filter-clear'),
  editorHead: document.getElementById('editor-head'),
  editorBody: document.getElementById('editor-body'),
  relationshipTabs: document.getElementById('relationship-tabs'),
  relationshipToolbar: document.getElementById('relationship-toolbar'),
  relationshipBody: document.getElementById('relationship-body'),
  statusName: document.getElementById('status-name'),
  statusEntities: document.getElementById('status-entities'),
  statusRelationships: document.getElementById('status-relationships'),
  fileInput: document.getElementById('file-input'),
  workspace: document.getElementById('workspace'),
  navigatorColumn: document.getElementById('navigator-column'),
  relationshipPane: document.getElementById('relationship-pane'),
};

const getModel = () => state.model;
const getSelection = () => state.selection;
const getEntityId = () => (state.selection.kind === 'entity' ? state.selection.id : null);

const navigator = createNavigator({
  treeEl: refs.tree,
  filterEl: refs.filter,
  getModel,
  getSelection,
  onSelect: select,
  onActivate: activate,
  onContextMenu: (selection, x, y) => {
    openPopupMenu({ x, y, items: contextMenuItems(state.model, selection, handlers) });
  },
});

const editor = createEditor({
  headEl: refs.editorHead,
  bodyEl: refs.editorBody,
  getModel,
  getEntityId,
  onStateChange: () => toolbar.render(),
  onSaved: () => renderAll(),
});

const relationshipPane = createRelationshipPane({
  tabsEl: refs.relationshipTabs,
  bodyEl: refs.relationshipBody,
  toolbarEl: refs.relationshipToolbar,
  getModel,
  getEntityId,
  onSelect: (id) => select({ kind: 'entity', id }),
  onChange: renderAll,
  onMessage: (message) => notify('Relationship refused', message),
});

/** @type {import('./actions.js').Handlers} */
const handlers = {
  createEntity,
  createFolder,
  edit: activateSelection,
  remove: removeSelection,
};

const toolbar = createToolbar({
  newButtonEl: refs.toolbarNew,
  editButtonEl: refs.toolbarEdit,
  deleteButtonEl: refs.toolbarDelete,
  contextEl: refs.toolbarContext,
  getModel,
  getSelection,
  isEditing: () => editor.isEditing(),
  handlers,
});

createMenuBar({
  barEl: refs.menubar,
  layerEl: refs.dropdowns,
  menus: [
    {
      label: 'File',
      items: [
        { label: 'New model…', action: newModel },
        { label: 'Open model…', action: () => refs.fileInput.click() },
        { label: 'Save model', action: saveModel },
        { separator: true },
        { label: 'Load example model', action: loadExample },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Rename model…', action: renameModel },
        { separator: true },
        { label: 'Edit selection', action: activateSelection },
        { label: 'Delete selection', shortcut: 'Del', action: removeSelection },
      ],
    },
    {
      label: 'Help',
      items: [
        { label: 'About this demo', action: showAbout },
        { label: 'Metamodel', action: showMetamodel },
      ],
    },
  ],
});

// --- Rendering ---------------------------------------------------------

function renderAll() {
  navigator.render();
  editor.render();
  relationshipPane.render();
  toolbar.render();
  renderStatus();
}

function renderStatus() {
  refs.statusName.textContent = state.model.name;
  refs.statusEntities.textContent = `${state.model.entities.size} entities`;
  refs.statusRelationships.textContent = `${state.model.relationships.size} relationships`;
}

/**
 * Nothing that would throw away an unsaved edit happens without asking. The
 * continuation is what runs once the user has answered.
 * @param {() => void} continuation
 * @returns {boolean}  whether the caller may carry on now
 */
function guardEdit(continuation) {
  if (!editor.isEditing()) return true;
  if (!editor.hasChanges()) {
    editor.cancel();
    return true;
  }
  confirmDialog({
    title: 'Discard changes?',
    content: [el('p', { text: 'The entity being edited has changes that have not been saved.' })],
    confirmLabel: 'Discard',
    onConfirm: () => {
      editor.cancel();
      continuation();
    },
  });
  return false;
}

/**
 * Move the selection and open the tree onto it. Used after a change to the
 * model, where there is nothing to guard against.
 * @param {import('./navigator.js').Selection} selection
 */
function setSelection(selection) {
  state.selection = selection;
  relationshipPane.reset();
  navigator.reveal(selection);
  renderAll();
}

/**
 * @param {import('./navigator.js').Selection} selection
 */
function select(selection) {
  if (!guardEdit(() => select(selection))) return;
  if (selection.kind === 'entity' && !state.model.entities.has(selection.id)) return;

  const focusWasInTree = refs.tree.contains(document.activeElement);
  setSelection(selection);
  if (focusWasInTree) navigator.focusSelected();
}

/**
 * Opening a node: an entity opens for editing, a folder opens its name.
 * @param {import('./navigator.js').Selection} selection
 */
function activate(selection) {
  select(selection);
  activateSelection();
}

function activateSelection() {
  const { entity, folderRecord } = contextOf(state.model, state.selection);
  if (entity) editor.begin();
  else if (folderRecord) renameFolderDialog(folderRecord);
}

function removeSelection() {
  const { entity, folderRecord } = contextOf(state.model, state.selection);
  if (entity) requestDeleteEntity(entity.id);
  else if (folderRecord) requestDeleteFolder(folderRecord);
}

// --- Creation ----------------------------------------------------------

/**
 * @param {string} code
 * @param {{owner?: string, folder?: string|null}} [options]
 */
function createEntity(code, options = {}) {
  if (!guardEdit(() => createEntity(code, options))) return;

  const entity = addEntity(state.model, code, {}, { folder: options.folder ?? null });

  if (options.owner) {
    const owner = state.model.entities.get(options.owner);
    const composition = owner ? compositionBetween(owner.type, code) : null;
    if (composition) {
      addRelationship(state.model, composition.id, owner.id, entity.id);
      navigator.expand(`entity:${owner.id}`);
    }
  }

  navigator.expand(`pillar:${ENTITY_TYPES[code].pillar}`);
  navigator.expand(`type:${code}`);
  if (options.folder) navigator.expand(`folder:${options.folder}`);

  select({ kind: 'entity', id: entity.id });
  editor.begin();
}

/**
 * @param {string} typeCode
 * @param {string|null} parent
 */
function createFolder(typeCode, parent) {
  if (!guardEdit(() => createFolder(typeCode, parent))) return;

  promptDialog({
    title: 'New folder',
    label: 'Folder name',
    value: 'New folder',
    confirmLabel: 'Create',
    onConfirm: (name) => {
      const folder = addFolder(state.model, typeCode, name, parent);
      navigator.expand(`pillar:${ENTITY_TYPES[typeCode].pillar}`);
      navigator.expand(`type:${typeCode}`);
      if (parent) navigator.expand(`folder:${parent}`);
      select({ kind: 'folder', id: folder.id });
    },
  });
}

/** @param {import('./model.js').Folder} folder */
function renameFolderDialog(folder) {
  promptDialog({
    title: 'Rename folder',
    label: 'Folder name',
    value: folder.name,
    confirmLabel: 'Rename',
    onConfirm: (name) => {
      renameFolder(state.model, folder.id, name);
      renderAll();
    },
  });
}

// --- Deletion ----------------------------------------------------------

/**
 * Composition carries ownership, so a deletion can reach further than the
 * entity selected. The affected entities are named before anything is removed.
 * @param {string} id
 */
function requestDeleteEntity(id) {
  if (!guardEdit(() => requestDeleteEntity(id))) return;

  const entity = state.model.entities.get(id);
  if (!entity) return;
  const doomed = deletionSet(state.model, id);
  const ids = new Set(doomed.map((d) => d.id));
  const relationshipCount = [...state.model.relationships.values()].filter(
    (relationship) => ids.has(relationship.source) || ids.has(relationship.target)
  ).length;

  const content = [el('p', { text: `Delete ${entity.id}, ${displayLabel(entity)}?` })];

  if (doomed.length > 1) {
    content.push(
      el('p', { text: 'It owns the entities below through a composition, so they are deleted with it.' }),
      el(
        'ul',
        { class: 'dialog-list' },
        doomed.slice(1).map((owned) =>
          el('li', {}, [el('span', { class: 'mono', text: owned.id }), ` ${displayLabel(owned)} (${ENTITY_TYPES[owned.type].name})`])
        )
      )
    );
  }

  content.push(
    el('p', {
      class: 'muted',
      text: `${doomed.length} ${doomed.length === 1 ? 'entity' : 'entities'} and ${relationshipCount} ${relationshipCount === 1 ? 'relationship' : 'relationships'} will be removed. The entities at the other end of an association are not affected.`,
    })
  );

  confirmDialog({
    title: 'Delete entity',
    content,
    confirmLabel: 'Delete',
    onConfirm: () => {
      removeEntity(state.model, id);
      setSelection({ kind: 'type', id: entity.type });
    },
  });
}

/** @param {import('./model.js').Folder} folder */
function requestDeleteFolder(folder) {
  if (!guardEdit(() => requestDeleteFolder(folder))) return;

  const held = folderCount(state.model, folder.id);
  confirmDialog({
    title: 'Delete folder',
    content: [
      el('p', { text: `Delete the folder "${folder.name}"?` }),
      el('p', {
        class: 'muted',
        text:
          held === 0
            ? 'The folder is empty. Folders hold no meaning in the metamodel, so nothing else changes.'
            : `${held} ${held === 1 ? 'entity moves' : 'entities move'} up to where the folder sits. No entity is deleted.`,
      }),
    ],
    confirmLabel: 'Delete folder',
    onConfirm: () => {
      const parent = folder.parent;
      removeFolder(state.model, folder.id);
      setSelection(parent ? { kind: 'folder', id: parent } : { kind: 'type', id: folder.type });
    },
  });
}

// --- Model actions -----------------------------------------------------

function newModel() {
  if (!guardEdit(newModel)) return;
  promptDialog({
    title: 'New model',
    label: 'Model name',
    value: 'Untitled model',
    confirmLabel: 'Create',
    onConfirm: (name) => {
      state.model = createModel(name);
      setSelection({ kind: 'root', id: '' });
    },
  });
}

function renameModel() {
  promptDialog({
    title: 'Rename model',
    label: 'Model name',
    value: state.model.name,
    confirmLabel: 'Rename',
    onConfirm: (name) => {
      state.model.name = name;
      renderAll();
    },
  });
}

function loadExample() {
  if (!guardEdit(loadExample)) return;
  state.model = buildExampleModel();
  setSelection({ kind: 'entity', id: 'HAZ-001' });
}

function saveModel() {
  const text = JSON.stringify(toJSON(state.model), null, 2);
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const filename = state.model.name.replace(/[^\w -]+/g, '').trim() || 'model';
  const link = el('a', { href: url, download: `${filename}.json` });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

refs.fileInput.addEventListener('change', () => {
  const file = refs.fileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    refs.fileInput.value = '';
    let data;
    try {
      data = JSON.parse(String(reader.result));
    } catch {
      notify('Cannot open the file', 'The file is not valid JSON.');
      return;
    }
    const { model, rejected } = fromJSON(data);
    state.model = model;
    setSelection({ kind: 'root', id: '' });
    if (rejected.length > 0) {
      openDialog({
        title: 'Opened with omissions',
        content: [
          el('p', { text: 'The file held content the metamodel does not define. It was left out.' }),
          el('ul', { class: 'dialog-list' }, rejected.slice(0, 20).map((reason) => el('li', { text: reason }))),
        ],
      });
    }
  };
  reader.readAsText(file);
});

// --- Help --------------------------------------------------------------

function showAbout() {
  openDialog({
    title: 'About this demo',
    content: [
      el('p', { text: 'A working demo of openconformity, a browser-based tool for CE marking of machinery under the Machinery Regulation (EU) 2023/1230.' }),
      el('p', { text: 'The metamodel is built in and enforced: only the entity types and relationships it defines can exist in a model. Attributes are not specified yet, so every entity carries the same minimal set for now.' }),
      el('p', { text: 'Everything runs in the browser. Nothing is sent anywhere, and a model leaves the machine only when saved to a file.' }),
    ],
  });
}

function showMetamodel() {
  const pillarName = (id) => PILLARS.find((pillar) => pillar.id === id)?.name ?? id;

  openDialog({
    wide: true,
    title: 'Metamodel',
    content: [
      el('p', { text: 'The entity types a model may contain, and the relationships allowed between them.' }),
      el('table', { class: 'table' }, [
        el('thead', {}, [el('tr', {}, [el('th', { text: 'Prefix' }), el('th', { text: 'Entity' }), el('th', { text: 'Pillar' })])]),
        el(
          'tbody',
          {},
          Object.values(ENTITY_TYPES).map((type) =>
            el('tr', {}, [
              el('td', { class: 'mono', text: type.code }),
              el('td', { text: type.name }),
              el('td', { class: 'muted', text: pillarName(type.pillar) }),
            ])
          )
        ),
      ]),
      el('table', { class: 'table' }, [
        el('thead', {}, [
          el('tr', {}, [el('th', { text: 'Source' }), el('th', { text: 'Relationship' }), el('th', { text: 'Target' }), el('th', { text: 'Kind' })]),
        ]),
        el(
          'tbody',
          {},
          RELATIONSHIP_TYPE_IDS.map((id) => {
            const type = RELATIONSHIP_TYPES[id];
            return el('tr', {}, [
              el('td', { class: 'mono', text: type.source }),
              el('td', { text: type.label }),
              el('td', { class: 'mono', text: type.target }),
              el('td', { class: 'muted', text: type.kind === 'composition' ? 'Composition' : 'Association' }),
            ]);
          })
        ),
      ]),
    ],
  });
}

// --- Chrome ------------------------------------------------------------

refs.filterClear.addEventListener('click', () => {
  refs.filter.value = '';
  refs.filter.dispatchEvent(new Event('input'));
  refs.filter.focus();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Delete' && refs.tree.contains(document.activeElement)) {
    event.preventDefault();
    removeSelection();
  }
});

setUpSplitter(document.getElementById('splitter-vertical'), 'vertical');
setUpSplitter(document.getElementById('splitter-horizontal'), 'horizontal');

/**
 * @param {HTMLElement|null} splitter
 * @param {'vertical'|'horizontal'} orientation
 */
function setUpSplitter(splitter, orientation) {
  if (!splitter) return;
  const vertical = orientation === 'vertical';

  const apply = (value) => {
    if (vertical) refs.navigatorColumn.style.width = `${clamp(value, 220, 620)}px`;
    else refs.relationshipPane.style.height = `${clamp(value, 120, refs.workspace.getBoundingClientRect().height - 180)}px`;
  };

  splitter.addEventListener('pointerdown', (event) => {
    splitter.setPointerCapture(event.pointerId);
    splitter.classList.add('dragging');
    event.preventDefault();
  });

  splitter.addEventListener('pointermove', (event) => {
    if (!splitter.classList.contains('dragging')) return;
    const box = refs.workspace.getBoundingClientRect();
    apply(vertical ? event.clientX - box.left : box.bottom - event.clientY);
  });

  const stop = (event) => {
    splitter.classList.remove('dragging');
    if (splitter.hasPointerCapture(event.pointerId)) splitter.releasePointerCapture(event.pointerId);
  };
  splitter.addEventListener('pointerup', stop);
  splitter.addEventListener('pointercancel', stop);

  splitter.addEventListener('keydown', (event) => {
    const keys = vertical ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const current = vertical
      ? refs.navigatorColumn.getBoundingClientRect().width
      : refs.relationshipPane.getBoundingClientRect().height;
    const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -16 : 16;
    apply(current + (vertical ? step : -step));
  });
}

/**
 * @param {number} value
 * @param {number} low
 * @param {number} high
 */
function clamp(value, low, high) {
  return Math.min(Math.max(value, low), high);
}

navigator.reveal(state.selection);
renderAll();
