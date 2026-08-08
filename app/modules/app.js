/**
 * Wiring.
 *
 * Holds the model and the selection, builds the panes, and re-renders them
 * when either changes. Every mutation is delegated to model.js, which is where
 * the metamodel is enforced.
 */

import { RELATIONSHIP_TYPES } from './metamodel.js';
import {
  addEntity,
  addFolder,
  addRelationship,
  canMoveNode,
  canPlaceBeside,
  createModel,
  labelOf,
  contentCount,
  fromJSON,
  moveNode,
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
import { createHistory } from './history.js';
import { canStep, contextMenuItems, contextOf, moveTargets, selectionActionItems } from './actions.js';
import { chooseDialog, confirmDialog, notify, openDialog, promptDialog, toast } from './dialog.js';
import { el } from './dom.js';

/** Keeps the project between visits, on this device only. */
const PROJECT_KEY = 'openconformity.project';

/**
 * The project as it was left, or nothing if this is a first visit, the browser
 * refuses storage, or what is there cannot be read as a project. A stored copy
 * that will not parse is dropped rather than argued with: it is a cache, not
 * the user's file, and the example is a better place to land than an error.
 * @returns {{ model: import('./model.js').Model,
 *             selection: import('./navigator.js').Selection,
 *             unsaved: boolean } | null}
 */
function restore() {
  let raw;
  try {
    raw = window.localStorage.getItem(PROJECT_KEY);
  } catch {
    return null;  // Storage can be unavailable; this visit simply keeps nothing.
  }
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw);
    const { model, rejected } = fromJSON(stored.project);
    if (rejected.length > 0) throw new Error('not a project');
    return {
      model,
      selection: stored.selection ?? { kind: 'root', id: '' },
      unsaved: !stored.savedToFile,
    };
  } catch {
    try {
      window.localStorage.removeItem(PROJECT_KEY);
    } catch { /* Nothing to drop. */ }
    return null;
  }
}

const restored = restore();

const state = {
  model: restored?.model ?? buildExampleModel(),
  /** @type {import('./navigator.js').Selection} */
  selection: restored?.selection ?? { kind: 'entity', id: 'HAZ-001' },
  /** Whether the project holds changes that are not in a file yet. */
  unsaved: restored?.unsaved ?? false,
};

/**
 * Whether the project last failed to fit in the browser's store. While this is
 * true nothing is being kept, so leaving the tab does lose the work, and the
 * warnings that would otherwise be wrong become right again.
 */
let autosaveFailed = false;

/**
 * Keeps the project where the next visit will find it. Called from every place
 * the model or the saved-ness of it changes, so the copy in the browser is
 * never older than what is on screen.
 *
 * A project can outgrow the store, which is a few megabytes and shared with
 * every other page on the origin. When the write is refused the older copy is
 * removed rather than left behind: restoring it later would hand back work the
 * user had already moved past, silently. From then on the file is the only
 * place the project lives, and the software says so once.
 */
function persist() {
  try {
    window.localStorage.setItem(PROJECT_KEY, JSON.stringify({
      savedToFile: !state.unsaved,
      selection: state.selection,
      project: toJSON(state.model),
    }));
    if (autosaveFailed) {
      autosaveFailed = false;
      toast('Autosave working again', 'The project is small enough to keep in this browser once more.');
    }
  } catch {
    try {
      window.localStorage.removeItem(PROJECT_KEY);
    } catch { /* Nothing to drop. */ }
    if (!autosaveFailed) {
      autosaveFailed = true;
      notify(
        'Too large to keep in this browser',
        'This project has outgrown the space the browser gives a page, so it is '
        + 'no longer being kept between visits. Save it to a file to keep it. '
        + 'Everything else works as before.'
      );
    }
  }
}

const history = createHistory(state.model, state.selection);

/** Remembers that the demo notice has been read, on this device only. */
const NOTICE_KEY = 'openconformity.demo.notice';
/** Remembers the chosen theme, on this device only. */
const THEME_KEY = 'openconformity.theme';

const refs = {
  menubar: document.getElementById('menubar-menus'),
  dropdowns: document.getElementById('dropdown-layer'),
  toolbarContext: document.getElementById('toolbar-context'),
  tree: document.getElementById('tree'),
  filter: document.getElementById('navigator-filter'),
  filterClear: document.getElementById('navigator-filter-clear'),
  editorBody: document.getElementById('editor-body'),
  relationshipViews: document.getElementById('relationship-views'),
  relationshipToolbar: document.getElementById('relationship-toolbar'),
  relationshipBody: document.getElementById('relationship-body'),
  statusName: document.getElementById('status-name'),
  statusEntities: document.getElementById('status-entities'),
  statusRelationships: document.getElementById('status-relationships'),
  fileInput: document.getElementById('file-input'),
  workspace: document.getElementById('workspace'),
  navigatorColumn: document.getElementById('navigator-column'),
  relationshipPane: document.getElementById('relationship-pane'),
  relationshipPanel: document.getElementById('relationship-panel'),
  themeToggle: document.getElementById('toolbar-theme'),
};

const getModel = () => state.model;
const getSelection = () => state.selection;
const getEntityId = () => (state.selection.kind === 'entity' ? state.selection.id : null);

/**
 * A parent is a folder or an entity, and the tree keys the two differently.
 * @param {string} id
 * @returns {import('./navigator.js').Selection}
 */
function selectionFor(id) {
  return { kind: state.model.folders.has(id) ? 'folder' : 'entity', id };
}

/** @param {string} id */
function expandKeyFor(id) {
  const { kind } = selectionFor(id);
  return `${kind}:${id}`;
}

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
      toast('Move refused', result.reason ?? 'That move is not allowed.');
      return;
    }
    commit(source);
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
  return canMoveNode(state.model, source.id, target);
}

/**
 * @param {import('./navigator.js').Selection} source
 * @param {import('./navigator.js').Selection} target
 * @param {'before'|'after'|'into'} position
 */
function dropApply(source, target, position) {
  if (position !== 'into') return placeBeside(state.model, source, target, position);
  return moveNode(state.model, source.id, target);
}

const editor = createEditor({
  bodyEl: refs.editorBody,
  getModel,
  getEntityId,
  getSelection,
  onStateChange: () => toolbar.render(),
  onSaved: changed,
});

const relationshipPane = createRelationshipPane({
  viewsEl: refs.relationshipViews,
  bodyEl: refs.relationshipBody,
  toolbarEl: refs.relationshipToolbar,
  panelEl: refs.relationshipPanel,
  getModel,
  getEntityId,
  onSelect: (id) => select({ kind: 'entity', id }),
  onChange: changed,
  onMessage: (message) => toast('Relationship refused', message),
  setPicker: (spec) => navigator.setPicker(spec),
});

/** @type {import('./actions.js').Handlers} */
const handlers = {
  createEntity,
  createFolder,
  createRelated,
  addRelationship: () => relationshipPane.beginAdd(),
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
    undo: document.getElementById('toolbar-undo'),
    redo: document.getElementById('toolbar-redo'),
    save: document.getElementById('toolbar-save'),
    unsaved: document.getElementById('toolbar-unsaved'),
  },
  contextEl: refs.toolbarContext,
  getModel,
  getSelection,
  isEditing: () => editor.isEditing(),
  isUnsaved: () => state.unsaved,
  onSave: saveModel,
  onUndo: () => step('undo'),
  onRedo: () => step('redo'),
  historyDepth: () => history.depth(),
  handlers,
});

createMenuBar({
  barEl: refs.menubar,
  layerEl: refs.dropdowns,
  menus: [
    {
      label: 'File',
      items: [
        { label: 'New project…', iconId: 'i-new-project', action: newModel },
        { label: 'Open project…', iconId: 'i-open-project', action: openProject },
        { label: 'Save project…', iconId: 'i-save', action: saveModel },
        { separator: true },
        { label: 'Load example project', iconId: 'i-project', action: loadExample },
      ],
    },
    {
      // Everything that changes the model, whether or not it has a button.
      // The middle of it is the same list the right-click menu is built from,
      // so the two cannot drift apart; around it stand the actions that reach
      // the project as a whole rather than the selection.
      label: 'Edit',
      items: () => [
        { label: 'Undo', iconId: 'i-undo', disabled: !history.canUndo(), action: () => step('undo') },
        { label: 'Redo', iconId: 'i-redo', disabled: !history.canRedo(), action: () => step('redo') },
        { separator: true },
        ...selectionActionItems(state.model, state.selection, handlers),
        { separator: true },
        { label: 'Rename project…', iconId: 'i-edit', action: renameModel },
      ],
    },
    {
      label: 'View',
      items: () => [
        {
          label: 'Relationships as graph',
          iconId: 'i-view-graph',
          disabled: relationshipPane.view() === 'graph',
          action: () => relationshipPane.setView('graph'),
        },
        {
          label: 'Relationships as list',
          iconId: 'i-view-list',
          disabled: relationshipPane.view() === 'list',
          action: () => relationshipPane.setView('list'),
        },
        { separator: true },
        {
          label: isDark() ? 'Light theme' : 'Dark theme',
          iconId: isDark() ? 'i-theme-light' : 'i-theme-dark',
          action: toggleTheme,
        },
      ],
    },
    {
      // Everything below the first separator leaves the software, so it all
      // carries the launch icon, the Metamodel among them.
      label: 'Help',
      items: [
        { label: 'About', iconId: 'i-information', action: showAbout },
        { separator: true },
        { label: 'Metamodel', iconId: 'i-launch', action: openMetamodel },
        { label: 'Project site', iconId: 'i-launch', action: () => openLink('https://openconformity.org') },
        { label: 'Source on GitHub', iconId: 'i-launch', action: () => openLink('https://github.com/omxnt/openconformity') },
        { label: 'Follow on LinkedIn', iconId: 'i-launch', action: () => openLink('https://www.linkedin.com/company/openconformity') },
        { separator: true },
        { label: 'Write an email', iconId: 'i-email', action: () => { window.location.href = 'mailto:info@openconformity.org'; } },
      ],
    },
  ],
});

// --- Rendering ---------------------------------------------------------

/**
 * Every change to the project goes through here, so nothing dirties silently
 * and nothing changes without the history seeing it. The selection is taken
 * after the change, since that is where undo should put the user back.
 * @param {import('./navigator.js').Selection} [selection]  where to stand now
 */
function commit(selection) {
  if (selection) {
    state.selection = selection;
    navigator.reveal(selection);
  }
  state.unsaved = true;
  history.record(state.model, state.selection);
  persist();
  renderAll();
}

/** Every change to the project goes through here, so nothing dirties silently. */
function changed() {
  commit();
}

/**
 * A project that has just replaced the one before it. Nothing that came earlier
 * belongs to it, so the history starts again rather than letting undo walk back
 * into a project the user has closed.
 * @param {import('./navigator.js').Selection} selection
 */
function startFresh(selection) {
  state.unsaved = false;
  history.reset(state.model, selection);
  persist();
  setSelection(selection);
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
    danger: true,
    onConfirm: () => {
      editor.cancel();
      continuation();
    },
  });
  return false;
}

/**
 * Step the model back or forward. What is restored is a copy, so the history
 * itself is never handed to the rest of the software to mutate.
 * @param {'undo'|'redo'} direction
 */
function step(direction) {
  if (!guardEdit(() => step(direction))) return;
  const entry = direction === 'undo' ? history.undo() : history.redo();
  if (!entry) return;

  state.model = entry.model;
  // The project no longer matches the file either way round: stepping back to
  // what was saved is not something this tracks.
  state.unsaved = true;
  persist();
  setSelection(surviving(entry.selection));
}

/**
 * Where to stand after a step. The remembered place is usually still there,
 * but undoing past the creation of the thing the user was standing on is not.
 * @param {import('./navigator.js').Selection} selection
 * @returns {import('./navigator.js').Selection}
 */
function surviving(selection) {
  if (selection.kind === 'entity' && state.model.entities.has(selection.id)) return selection;
  if (selection.kind === 'folder' && state.model.folders.has(selection.id)) return selection;
  return { kind: 'root', id: '' };
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
      const result = moveNode(state.model, selection.id, chosen.target);
      if (!result.ok) {
        toast('Move refused', result.reason ?? 'That move is not allowed.');
        return;
      }
      commit(selection);
    },
  });
}

// --- Creation ----------------------------------------------------------

/**
 * The entity is filed inside whatever the cursor is standing on, and nowhere
 * else. No relationship is made for it: what it relates to is a separate
 * decision, taken in the relationship pane.
 * @param {string} code
 * @param {{parent?: string|null}} [options]
 */
function createEntity(code, options = {}) {
  if (!guardEdit(() => createEntity(code, options))) return;

  const entity = addEntity(state.model, code, {}, { parent: options.parent ?? null });
  if (options.parent) navigator.expand(expandKeyFor(options.parent));

  commit({ kind: 'entity', id: entity.id });
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
  // The relationship is the point of this; the filing just follows the anchor,
  // which is the one place the user is already looking.
  const entity = addEntity(state.model, code, {}, { parent: anchor.parent });

  const result =
    direction === 'outgoing'
      ? addRelationship(state.model, type.id, anchor.id, entity.id)
      : addRelationship(state.model, type.id, entity.id, anchor.id);

  if (!result.ok) {
    removeEntity(state.model, entity.id);
    toast('Relationship refused', result.reason ?? 'The relationship could not be created.');
    return;
  }

  if (anchor.parent) navigator.expand(expandKeyFor(anchor.parent));
  commit({ kind: 'entity', id: entity.id });
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
    toast('Move refused', result.reason ?? 'That move is not allowed.');
    return;
  }
  commit(selection);
}

/**
 * @param {string|null} parent
 */
function createFolder(parent) {
  if (!guardEdit(() => createFolder(parent))) return;

  promptDialog({
    title: 'New folder',
    label: 'Folder name',
    value: 'New folder',
    confirmLabel: 'Create',
    onConfirm: (name) => {
      const folder = addFolder(state.model, name, parent);
      if (parent) navigator.expand(expandKeyFor(parent));
      commit({ kind: 'folder', id: folder.id });
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
 * A deletion reaches one entity and no further. No relationship in the
 * metamodel makes one entity the owner of another, so there is no ownership to
 * follow and nothing else is removed: whatever is filed inside it moves up to
 * where it sat, and the entities it is related to are untouched.
 * @param {string} id
 */
function requestDeleteEntity(id) {
  if (!guardEdit(() => requestDeleteEntity(id))) return;

  const entity = state.model.entities.get(id);
  if (!entity) return;
  const held = contentCount(state.model, id);
  const related = [...state.model.relationships.values()].filter(
    (relationship) => relationship.source === id || relationship.target === id
  ).length;

  confirmDialog({
    title: 'Delete entity',
    content: [
      el('p', { text: `Delete ${entity.id}, ${labelOf(entity)}?` }),
      el('p', {
        class: 'muted',
        text: `${related} ${related === 1 ? 'relationship is' : 'relationships are'} removed with it. The entities at the other end stay in the model.`,
      }),
      held > 0
        ? el('p', {
            class: 'muted',
            text: `${held} ${held === 1 ? 'entity is' : 'entities are'} filed inside it. ${held === 1 ? 'It moves' : 'They move'} up to where this one sits. No other entity is deleted.`,
          })
        : null,
    ].filter(Boolean),
    confirmLabel: 'Delete',
    danger: true,
    onConfirm: () => {
      removeEntity(state.model, id);
      commit(entity.parent ? selectionFor(entity.parent) : { kind: 'root', id: '' });
    },
  });
}

/** @param {import('./model.js').Folder} folder */
function requestDeleteFolder(folder) {
  if (!guardEdit(() => requestDeleteFolder(folder))) return;

  const held = contentCount(state.model, folder.id);
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
    danger: true,
    onConfirm: () => {
      const parent = folder.parent;
      removeFolder(state.model, folder.id);
      commit(parent ? selectionFor(parent) : { kind: 'root', id: '' });
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
    danger: true,
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
      startFresh({ kind: 'root', id: '' });
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
  startFresh({ kind: 'entity', id: 'HAZ-001' });
}

/** @param {boolean} [discarded]  the unsaved-work question has been answered */
function openProject(discarded) {
  if (!guardEdit(openProject)) return;
  if (!discarded && !guardUnsaved(openProject)) return;
  refs.fileInput.click();
}

/**
 * The name a project is written under, which is its own name with the
 * characters a file name cannot carry taken out.
 * @param {string} name
 */
function filenameFor(name) {
  return `${name.replace(/[^\w -]+/g, '').trim() || 'project'}.json`;
}

/**
 * Saving asks for the name first. Every save is a download rather than a
 * write back to the file the project came from — the browser gives no handle
 * on that file — so there is no silent "save to where it came from" to offer,
 * and a save that named itself would land work in the downloads folder under
 * a name the user never chose. One dialog, pre-filled and confirmed with
 * Enter, is also where the project is renamed, so the name of the work and
 * the name of the file cannot drift apart.
 */
function saveModel() {
  if (!guardEdit(saveModel)) return;
  promptDialog({
    title: 'Save project',
    label: 'Project name',
    value: state.model.name,
    describe: (name) => `Saved to your downloads as ${filenameFor(name)}`,
    confirmLabel: 'Save',
    onConfirm: (name) => {
      if (name !== state.model.name) {
        state.model.name = name;
        commit();
      }
      writeFile();
    },
  });
}

function writeFile() {
  const text = JSON.stringify(toJSON(state.model), null, 2);
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const filename = filenameFor(state.model.name);
  const link = el('a', { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  state.unsaved = false;
  persist();
  toolbar.render();
  toast('Project saved', `Written to your downloads as ${filename}.`);
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
    startFresh({ kind: 'root', id: '' });
  };
  reader.onerror = () => {
    refs.fileInput.value = '';
    notify('Cannot open the file', 'The file could not be read.');
  };
  reader.readAsText(file);
});

// --- Help --------------------------------------------------------------

/** @param {string} url */
function openLink(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * The metamodel diagram, exported for each theme and carried with the software
 * so it opens without a network and in the colours the user is already in.
 *
 * The copy is the cost: the authoritative definition is the diagram in the
 * project documentation, and an export carried here can fall behind what the
 * software implements. It has to be re-exported whenever the metamodel changes.
 */
function metamodelDiagram() {
  return isDark() ? 'assets/images/metamodel-dark.png' : 'assets/images/metamodel-light.png';
}

function openMetamodel() {
  openLink(metamodelDiagram());
}

// --- Chrome ------------------------------------------------------------

document.getElementById('toolbar-metamodel').addEventListener('click', openMetamodel);
document.getElementById('shell-demo').addEventListener('click', showNotice);

/**
 * The theme was set on the root element before the stylesheet loaded; from
 * here on the toggle owns it. The button offers the theme it would switch to.
 */
function isDark() {
  return document.documentElement.dataset.theme === 'dark';
}

function reflectTheme() {
  const offer = isDark() ? 'Switch to the light theme' : 'Switch to the dark theme';
  refs.themeToggle.title = offer;
  refs.themeToggle.setAttribute('aria-label', offer);
}

function toggleTheme() {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    window.localStorage.setItem(THEME_KEY, next);
  } catch {
    // Storage can be unavailable; the choice then lasts for this tab only.
  }
  reflectTheme();
}

refs.themeToggle.addEventListener('click', toggleTheme);

reflectTheme();

/**
 * The clear action exists only while there is something to clear. An X on an
 * empty field is a target that does nothing, and beside a pane it reads as
 * "close this pane" rather than "empty this box".
 */
function clearFilter() {
  refs.filter.value = '';
  refs.filter.dispatchEvent(new Event('input'));
  refs.filter.focus();
}

refs.filter.addEventListener('input', () => {
  refs.filterClear.hidden = refs.filter.value === '';
});

refs.filter.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || refs.filter.value === '') return;
  event.preventDefault();
  clearFilter();
});

refs.filterClear.addEventListener('click', clearFilter);

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

  // The narrowest the navigator goes is what its toolbar needs: eight buttons
  // and three dividers, which is 283px.
  const apply = (value) => {
    if (vertical) refs.navigatorColumn.style.width = `${clamp(value, 288, 620)}px`;
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
 * What the notice says. The same words are shown on the first visit, where
 * they have to be answered, and from Help afterwards, where they do not: a
 * warning that can only ever be seen once is a warning the user cannot go
 * back and check.
 */
function noticeContent() {
  return [
    el('p', { class: 'notice-headline', text: 'Do not use this for real CE marking!' }),
    el('p', { text: 'This is a demonstration of software under construction. Nothing in it has been verified or validated, and responsibility for a CE marking always rests with the manufacturer.' }),
    el('ul', { class: 'dialog-list' }, [
      el('li', { text: 'It is guaranteed to contain errors, and many functions are unfinished.' }),
      el('li', { text: 'It is rebuilt continuously, and changes without warning.' }),
      el('li', { text: 'The file format will change: a project saved here will not open in a later version.' }),
    ]),
  ];
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
    content: noticeContent(),
    actions: [
      { label: 'Leave', action: () => { window.location.href = 'https://openconformity.org'; } },
      { label: 'I understand', primary: true, action: confirmNoticeRead },
    ],
  });
}

/**
 * The same notice, asked for rather than imposed. Nothing is being consented to
 * this time, so it does not block and it takes no answer beyond closing.
 */
function showNotice() {
  openDialog({
    title: 'This is a demonstration',
    content: noticeContent(),
    actions: [{ label: 'Close', primary: true }],
  });
}

/**
 * What the software is, who holds it and under what terms, and what of other
 * people's work it carries.
 *
 * The EUPL asks that a Work communicated electronically name its Licensor and
 * its licence and make that licence reachable. Every licence named here is one
 * the deployment carries, so all four are reachable from the software itself
 * rather than from wherever it was fetched.
 */
function showAbout() {
  const licence = (href, text) => el('a', { href, target: '_blank', rel: 'noopener', text });
  openDialog({
    title: 'About',
    content: [
      el('p', { class: 'notice-headline', text: 'openconformity' }),
      el('p', { text: 'This project is an initiative to develop a free, open-source, browser-based tool for CE marking of machinery according to the Machinery Regulation (EU) 2023/1230, with no commercial interests behind it.' }),
      el('p', {}, [
        '\u00A9 2026 omxnt, licensed under the ',
        licence('LICENSE.txt', 'EUPL-1.2'),
        '.',
      ]),
      el('p', {}, [licence('https://github.com/omxnt/openconformity', 'Source on GitHub')]),
      el('p', { text: 'Third-party assets, vendored with the software:' }),
      el('ul', { class: 'dialog-list' }, [
        el('li', {}, ['IBM Plex, under the ', licence('assets/fonts/LICENSE.txt', 'SIL Open Font License 1.1'), '.']),
        el('li', {}, ['Carbon Icons, under the ', licence('assets/icons/LICENSE.txt', 'Apache License 2.0'), '.']),
      ]),
    ],
    actions: [{ label: 'Close', primary: true }],
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

/**
 * The browser's own prompt is kept for the one case where leaving still costs
 * something: a project too large to be kept, which lives in this tab and
 * nowhere else. While the project is being kept, closing the tab loses nothing
 * and a prompt saying otherwise would be a lie the user learns to dismiss.
 */
window.addEventListener('beforeunload', (event) => {
  if (!state.unsaved || !autosaveFailed) return;
  event.preventDefault();
  event.returnValue = '';
});

/**
 * The mark is a link to the project site, and a mark is something people click
 * without meaning to go anywhere. It asks first whenever there is work that is
 * not in a file, and what it says depends on whether that work is being kept:
 * coming back to it is not the same promise as losing it.
 *
 * Only a plain click is caught. A modified click opens a tab of its own and
 * leaves the work where it is, so there is nothing to ask about.
 */
document.getElementById('shell-brand').addEventListener('click', (event) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!state.unsaved) return;
  event.preventDefault();
  const url = event.currentTarget.href;
  confirmDialog({
    title: 'Leave for the project site?',
    content: autosaveFailed
      ? [
        el('p', { text: `"${state.model.name}" has changes that are not in a file.` }),
        el('p', { class: 'muted', text: 'This project is too large to be kept in the browser, so leaving now loses them.' }),
      ]
      : [
        el('p', { text: `"${state.model.name}" has changes that are not in a file.` }),
        el('p', { class: 'muted', text: 'They are kept in this browser and will be here when you come back.' }),
      ],
    confirmLabel: 'Leave',
    danger: autosaveFailed,
    onConfirm: () => { window.location.href = url; },
  });
});

navigator.reveal(state.selection);
renderAll();

/** Whether the notice has been read on this device. */
function noticeRead() {
  try {
    return window.localStorage.getItem(NOTICE_KEY) === 'read';
  } catch {
    // Storage can be unavailable; the notice then simply shows.
    return false;
  }
}

if (!noticeRead()) showDemoNotice();

// Leaving from the notice and coming back can restore the page from the
// browser's cache without running the load path again, so the notice is
// asked for once more on restore.
window.addEventListener('pageshow', (event) => {
  if (event.persisted && !noticeRead()) showDemoNotice();
});
