/**
 * Wiring.
 *
 * Holds the model and the selection, builds the panes, and re-renders them
 * when either changes. Every mutation is delegated to model.js, which is where
 * the metamodel is enforced.
 */

import { ENTITY_TYPES, RELATIONSHIP_TYPES, compositionBetween } from './metamodel.js';
import {
  addEntity,
  addFolder,
  addRelationship,
  canMoveEntity,
  canMoveFolder,
  canPlaceBeside,
  createModel,
  deletionSet,
  labelOf,
  folderCount,
  fromJSON,
  moveEntity,
  moveFolder,
  moveOrder,
  placeBeside,
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
import { canStep, contextMenuItems, contextOf, moveTargets } from './actions.js';
import { chooseDialog, confirmDialog, notify, openDialog, promptDialog } from './dialog.js';
import { el } from './dom.js';

const state = {
  model: buildExampleModel(),
  /** @type {import('./navigator.js').Selection} */
  selection: { kind: 'entity', id: 'HAZ-001' },
  /** Whether the project holds changes that are not in a file yet. */
  unsaved: false,
};

/** Remembers that the demo notice has been read, on this device only. */
const NOTICE_KEY = 'openconformity.demo.notice';

const refs = {
  menubar: document.getElementById('menubar-menus'),
  dropdowns: document.getElementById('dropdown-layer'),
  toolbarContext: document.getElementById('toolbar-context'),
  tree: document.getElementById('tree'),
  filter: document.getElementById('navigator-filter'),
  filterClear: document.getElementById('navigator-filter-clear'),
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
  canDrop: (source, target, position) => dropCheck(source, target, position).ok,
  onDrop: (source, target, position) => {
    const result = dropApply(source, target, position);
    if (!result.ok) {
      notify('Move refused', result.reason ?? 'That move is not allowed.');
      return;
    }
    state.unsaved = true;
    setSelection(source);
  },
});

/**
 * Dropping across the middle of a row files the dragged thing inside it;
 * dropping near the top or bottom edge puts it alongside, which is how the
 * order is changed.
 * @param {import('./navigator.js').Selection} source
 * @param {import('./navigator.js').Selection} target
 * @param {'before'|'after'|'into'} position
 */
function dropCheck(source, target, position) {
  if (source.kind !== 'entity' && source.kind !== 'folder') {
    return { ok: false, reason: 'Only entities and folders can be moved.' };
  }
  if (position !== 'into') {
    if (target.kind !== 'entity' && target.kind !== 'folder') return { ok: false, reason: 'Nothing sits alongside that.' };
    return canPlaceBeside(state.model, source, target);
  }
  if (target.kind !== 'type' && target.kind !== 'folder' && target.kind !== 'entity') {
    return { ok: false, reason: 'Nothing can be filed there.' };
  }
  return source.kind === 'entity'
    ? canMoveEntity(state.model, source.id, target)
    : canMoveFolder(state.model, source.id, target);
}

/**
 * @param {import('./navigator.js').Selection} source
 * @param {import('./navigator.js').Selection} target
 * @param {'before'|'after'|'into'} position
 */
function dropApply(source, target, position) {
  if (position !== 'into') return placeBeside(state.model, source, target, position);
  return source.kind === 'entity'
    ? moveEntity(state.model, source.id, target)
    : moveFolder(state.model, source.id, target);
}

const editor = createEditor({
  bodyEl: refs.editorBody,
  getModel,
  getEntityId,
  onStateChange: () => toolbar.render(),
  onSaved: changed,
});

const relationshipPane = createRelationshipPane({
  tabsEl: refs.relationshipTabs,
  bodyEl: refs.relationshipBody,
  toolbarEl: refs.relationshipToolbar,
  getModel,
  getEntityId,
  onSelect: (id) => select({ kind: 'entity', id }),
  onChange: changed,
  onMessage: (message) => notify('Relationship refused', message),
});

/** @type {import('./actions.js').Handlers} */
const handlers = {
  createEntity,
  createFolder,
  createRelated,
  edit: activateSelection,
  moveOrder: stepSelection,
  move: moveSelection,
  remove: removeSelection,
};

const toolbar = createToolbar({
  buttons: {
    new: document.getElementById('toolbar-new'),
    newFolder: document.getElementById('toolbar-new-folder'),
    related: document.getElementById('toolbar-related'),
    edit: document.getElementById('toolbar-edit'),
    delete: document.getElementById('toolbar-delete'),
    up: document.getElementById('toolbar-up'),
    down: document.getElementById('toolbar-down'),
    save: document.getElementById('toolbar-save'),
    unsaved: document.getElementById('toolbar-unsaved'),
  },
  contextEl: refs.toolbarContext,
  getModel,
  getSelection,
  isEditing: () => editor.isEditing(),
  isUnsaved: () => state.unsaved,
  onSave: saveModel,
  handlers,
});

createMenuBar({
  barEl: refs.menubar,
  layerEl: refs.dropdowns,
  menus: [
    {
      label: 'File',
      items: [
        { label: 'New project…', action: newModel },
        { label: 'Open project…', action: openProject },
        { label: 'Save project', action: saveModel },
        { separator: true },
        { label: 'Load example project', action: loadExample },
      ],
    },
    {
      label: 'Edit',
      items: [{ label: 'Rename project…', action: renameModel }],
    },
    {
      label: 'Help',
      items: [
        { label: 'Project site', action: () => openLink('https://openconformity.org') },
        { label: 'Source on GitHub', action: () => openLink('https://github.com/omxnt/openconformity') },
        { label: 'Follow on LinkedIn', action: () => openLink('https://www.linkedin.com/company/openconformity') },
        { separator: true },
        { label: 'Write an email', action: () => { window.location.href = 'mailto:info@openconformity.org'; } },
      ],
    },
  ],
});

// --- Rendering ---------------------------------------------------------

/** Every change to the project goes through here, so nothing dirties silently. */
function changed() {
  state.unsaved = true;
  renderAll();
}

function renderAll() {
  navigator.render();
  editor.render();
  relationshipPane.render();
  toolbar.render();
  renderStatus();
}

function renderStatus() {
  document.title = state.model.name;
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

/** The same moves that dragging offers, reachable without a pointer. */
function moveSelection() {
  const selection = state.selection;
  const targets = moveTargets(state.model, selection);
  if (targets.length === 0) return;
  if (!guardEdit(moveSelection)) return;

  chooseDialog({
    title: 'Move to',
    label: 'Destination',
    options: targets.map((candidate, index) => ({
      value: String(index),
      label: `${'    '.repeat(candidate.depth)}${candidate.label}`,
    })),
    value: '0',
    confirmLabel: 'Move',
    onConfirm: (value) => {
      const chosen = targets[Number(value)];
      if (!chosen) return;
      const result =
        selection.kind === 'entity'
          ? moveEntity(state.model, selection.id, chosen.target)
          : moveFolder(state.model, selection.id, chosen.target);
      if (!result.ok) {
        notify('Move refused', result.reason ?? 'That move is not allowed.');
        return;
      }
      state.unsaved = true;
      setSelection(selection);
    },
  });
}

// --- Creation ----------------------------------------------------------

/**
 * @param {string} code
 * @param {{owner?: string|null, folder?: string|null, after?: string|null}} [options]
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
  // Made from an entity, it lands directly under the one it was made from.
  if (options.after) placeBeside(state.model, { kind: 'entity', id: entity.id }, { kind: 'entity', id: options.after }, 'after');

  navigator.expand(`pillar:${ENTITY_TYPES[code].pillar}`);
  navigator.expand(`type:${code}`);
  if (options.folder) navigator.expand(`folder:${options.folder}`);

  state.unsaved = true;
  select({ kind: 'entity', id: entity.id });
  editor.begin();
}

/**
 * Make an entity the metamodel lets the selected one relate to, and the
 * relationship with it, in one step.
 * @param {string} relationshipTypeId
 * @param {'outgoing'|'incoming'} direction
 */
function createRelated(relationshipTypeId, direction) {
  if (!guardEdit(() => createRelated(relationshipTypeId, direction))) return;

  const type = RELATIONSHIP_TYPES[relationshipTypeId];
  const anchor = state.selection.kind === 'entity' ? state.model.entities.get(state.selection.id) : null;
  if (!type || !anchor) return;

  const code = direction === 'outgoing' ? type.target : type.source;
  const entity = addEntity(state.model, code, {}, { folder: code === anchor.type ? anchor.folder : null });

  const result =
    direction === 'outgoing'
      ? addRelationship(state.model, type.id, anchor.id, entity.id)
      : addRelationship(state.model, type.id, entity.id, anchor.id);

  if (!result.ok) {
    removeEntity(state.model, entity.id);
    notify('Relationship refused', result.reason ?? 'The relationship could not be created.');
    return;
  }

  navigator.expand(`pillar:${ENTITY_TYPES[code].pillar}`);
  navigator.expand(`type:${code}`);
  navigator.expand(`entity:${anchor.id}`);
  state.unsaved = true;
  select({ kind: 'entity', id: entity.id });
  editor.begin();
}

/**
 * Step the selection one place up or down among the things it sits beside.
 * @param {-1|1} delta
 */
function stepSelection(delta) {
  const selection = state.selection;
  if (selection.kind !== 'entity' && selection.kind !== 'folder') return;
  if (!canStep(state.model, selection, delta)) return;
  if (!guardEdit(() => stepSelection(delta))) return;

  const result = moveOrder(state.model, selection, delta);
  if (!result.ok) {
    notify('Move refused', result.reason ?? 'That move is not allowed.');
    return;
  }
  state.unsaved = true;
  setSelection(selection);
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
      state.unsaved = true;
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
      changed();
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

  const content = [el('p', { text: `Delete ${entity.id}, ${labelOf(entity)}?` })];

  if (doomed.length > 1) {
    content.push(
      el('p', { text: 'It owns the entities below through a composition, so they are deleted with it.' }),
      el(
        'ul',
        { class: 'dialog-list' },
        doomed.slice(1).map((owned) =>
          el('li', {}, [el('span', { class: 'mono', text: owned.id }), ` ${labelOf(owned)} (${ENTITY_TYPES[owned.type].name})`])
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
      state.unsaved = true;
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
      state.unsaved = true;
      setSelection(parent ? { kind: 'folder', id: parent } : { kind: 'type', id: folder.type });
    },
  });
}

// --- Model actions -----------------------------------------------------

/**
 * Anything that replaces the whole project asks first when there is work that
 * is not in a file yet. The continuation is re-entered with `discarded` set, so
 * the question is asked once without the answer being written into the model.
 * The work stays marked unsaved until something has actually replaced it.
 * @param {(discarded: boolean) => void} continuation
 * @returns {boolean}
 */
function guardUnsaved(continuation) {
  if (!state.unsaved) return true;
  confirmDialog({
    title: 'Discard unsaved changes?',
    content: [
      el('p', { text: `"${state.model.name}" has changes that have not been saved to a file.` }),
      el('p', { class: 'muted', text: 'The project lives only in this tab until it is saved.' }),
    ],
    confirmLabel: 'Discard',
    onConfirm: () => continuation(true),
  });
  return false;
}

/** @param {boolean} [discarded]  the unsaved-work question has been answered */
function newModel(discarded) {
  if (!guardEdit(newModel)) return;
  if (!discarded && !guardUnsaved(newModel)) return;
  promptDialog({
    title: 'New project',
    label: 'Project name',
    value: 'Untitled project',
    confirmLabel: 'Create',
    onConfirm: (name) => {
      state.model = createModel(name);
      state.unsaved = false;
      setSelection({ kind: 'root', id: '' });
    },
  });
}

function renameModel() {
  promptDialog({
    title: 'Rename project',
    label: 'Project name',
    value: state.model.name,
    confirmLabel: 'Rename',
    onConfirm: (name) => {
      state.model.name = name;
      changed();
    },
  });
}

/** @param {boolean} [discarded]  the unsaved-work question has been answered */
function loadExample(discarded) {
  if (!guardEdit(loadExample)) return;
  if (!discarded && !guardUnsaved(loadExample)) return;
  state.model = buildExampleModel();
  state.unsaved = false;
  setSelection({ kind: 'entity', id: 'HAZ-001' });
}

/** @param {boolean} [discarded]  the unsaved-work question has been answered */
function openProject(discarded) {
  if (!guardEdit(openProject)) return;
  if (!discarded && !guardUnsaved(openProject)) return;
  refs.fileInput.click();
}

function saveModel() {
  const text = JSON.stringify(toJSON(state.model), null, 2);
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const filename = state.model.name.replace(/[^\w -]+/g, '').trim() || 'project';
  const link = el('a', { href: url, download: `${filename}.json` });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  state.unsaved = false;
  toolbar.render();
}

refs.fileInput.addEventListener('change', () => {
  const file = refs.fileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    refs.fileInput.value = '';
    let model;
    let rejected;
    // Reading the file covers both parsing it and building a model from it, so
    // that a file which is valid JSON but not a project is refused out loud
    // rather than throwing past the handler and doing nothing at all.
    try {
      ({ model, rejected } = fromJSON(JSON.parse(String(reader.result))));
    } catch {
      notify('Cannot open the file', 'The file could not be read as a project.');
      return;
    }
    if (rejected.length > 0) {
      openDialog({
        title: 'Cannot open the file',
        content: [
          el('p', { text: 'The file holds content this software does not define. Nothing was loaded.' }),
          el('ul', { class: 'dialog-list' }, rejected.slice(0, 20).map((reason) => el('li', { text: reason }))),
        ],
      });
      return;
    }
    state.model = model;
    state.unsaved = false;
    setSelection({ kind: 'root', id: '' });
  };
  reader.readAsText(file);
});

// --- Help --------------------------------------------------------------

/** @param {string} url */
function openLink(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function showMetamodel() {
  openDialog({
    wide: true,
    title: 'Metamodel',
    content: [
      el('img', {
        class: 'metamodel-image',
        src: 'assets/images/metamodel.svg',
        alt: 'The metamodel: the entity types a model may contain and the relationships allowed between them',
      }),
    ],
  });
}

// --- Chrome ------------------------------------------------------------

document.getElementById('toolbar-metamodel').addEventListener('click', showMetamodel);

refs.filterClear.addEventListener('click', () => {
  refs.filter.value = '';
  refs.filter.dispatchEvent(new Event('input'));
  refs.filter.focus();
});

document.addEventListener('keydown', (event) => {
  if (!refs.tree.contains(document.activeElement)) return;
  if (event.key === 'Delete') {
    event.preventDefault();
    removeSelection();
  } else if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
    event.preventDefault();
    stepSelection(event.key === 'ArrowUp' ? -1 : 1);
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

/**
 * Read once per device. The software is a demonstration, and someone arriving
 * at it has to be told that plainly before they put work into it. Accepting
 * takes a second answer, because a notice nobody reads protects nobody.
 */
function showDemoNotice() {
  openDialog({
    blocking: true,
    title: 'Read this first',
    content: [
      el('div', { class: 'notice-important' }, [
        el('span', { class: 'notice-tag', text: 'Important' }),
        el('p', { class: 'notice-headline', text: 'Do not use this for real CE marking!' }),
      ]),
      el('p', { text: 'This is a demonstration of openconformity. It is not finished software.' }),
      el('ul', { class: 'dialog-list' }, [
        el('li', { text: 'It is guaranteed that the tool contains errors.' }),
        el('li', { text: 'Many functions are still unfinished.' }),
        el('li', { text: 'The file format will change.' }),
        el('li', { text: 'A project saved here will not open in a later version.' }),
        el('li', { text: 'Nothing here has been verified or validated.' }),
        el('li', { text: 'Things will be wrong, and they will get in your way.' }),
      ]),
    ],
    actions: [
      { label: 'Leave', action: () => { window.location.href = 'https://openconformity.org'; } },
      { label: 'I understand', primary: true, action: confirmNoticeRead },
    ],
  });
}

function confirmNoticeRead() {
  openDialog({
    blocking: true,
    title: 'Honestly, though',
    content: [el('p', { text: 'Did you actually read that, or did you just click the button?' })],
    actions: [
      { label: 'Let me read it again', action: showDemoNotice },
      {
        label: 'I read it',
        primary: true,
        action: () => {
          try {
            window.localStorage.setItem(NOTICE_KEY, 'read');
          } catch {
            // Storage can be unavailable; the notice simply shows again.
          }
        },
      },
    ],
  });
}

window.addEventListener('beforeunload', (event) => {
  if (!state.unsaved) return;
  event.preventDefault();
  event.returnValue = '';
});

navigator.reveal(state.selection);
renderAll();

let noticeRead = false;
try {
  noticeRead = window.localStorage.getItem(NOTICE_KEY) === 'read';
} catch {
  // Storage can be unavailable; the notice simply shows.
}
if (!noticeRead) showDemoNotice();
