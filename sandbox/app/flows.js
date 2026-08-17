/**
 * The flows: create, select, relate, file, arrange, delete, undo, redo.
 * Each one asks its questions as straight-line awaited code — the draft
 * guard is one awaited if — and then makes one commit through the store.
 * Nothing here writes to the model directly.
 *
 * The draft guard runs before anything that would destroy an open draft:
 * a selection change, a deletion of the edited entity, an undo or redo, a
 * creation. Relating, filing, arranging, and renaming leave the selection
 * and the draft where they stand, so they run unguarded.
 */

import {
  createModel,
  addEntity,
  addFolder,
  removeEntity,
  removeFolder,
  renameFolder,
  updateEntity,
  deletionOf,
  relate,
  unrelate,
  file,
  placeBeside,
  childrenOf,
  nodeOf,
  canRelate,
} from './model.js';
import { ENTITY_TYPES, PILLARS, relationshipsFrom, relationshipsTo } from './metamodel.js';
import { serialise, openProject, filenameFor } from './files.js';
import { openMenu } from './menu.js';
import { el } from './dom.js';

/**
 * The relationship forms an entity can take part in right now: each form
 * the metamodel offers for its type, in either direction, with the
 * entities the model still allows at the far end. A form with no
 * candidate is not offered.
 * @param {import('./model.js').Model} model
 * @param {string} subjectId
 * @returns {Array<{ type: import('./metamodel.js').RelationshipType, direction: 'outgoing'|'incoming', candidates: import('./model.js').Entity[] }>}
 */
export function relationshipOptions(model, subjectId) {
  const subject = nodeOf(model, subjectId);
  if (!subject || subject.kind !== 'entity') return [];

  const entities = [...model.nodes.values()].filter((node) => node.kind === 'entity');
  const options = [];
  for (const type of relationshipsFrom(subject.type)) {
    const candidates = entities.filter((node) => canRelate(model, type.id, subjectId, node.id).ok);
    if (candidates.length > 0) options.push({ type, direction: 'outgoing', candidates });
  }
  for (const type of relationshipsTo(subject.type)) {
    const candidates = entities.filter((node) => canRelate(model, type.id, node.id, subjectId).ok);
    if (candidates.length > 0) options.push({ type, direction: 'incoming', candidates });
  }
  return options;
}

/**
 * @param {import('./model.js').Entity} entity
 * @returns {string}
 */
function designated(entity) {
  const title = (entity.attributes.title ?? '').trim();
  return title ? `${entity.id}  ${title}` : entity.id;
}

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {ReturnType<import('./overlay.js').createOverlay>} context.overlay
 * @param {ReturnType<import('./dialog.js').createDialogs>} context.dialogs
 * @param {ReturnType<import('./editor.js').createEditor>} context.editor
 * @param {() => Array<import('./actions.js').Action>} context.getActions
 * @param {HTMLInputElement} context.fileInput
 */
export function createFlows({ store, overlay, dialogs, editor, getActions, fileInput }) {
  /**
   * The draft guard: true when it is safe to go on.
   * @returns {Promise<boolean>}
   */
  async function confirmDiscard() {
    if (!editor.hasUnconfirmedEdit()) return true;
    return dialogs.confirm({
      title: 'Discard the changes?',
      message: 'The edited attributes have not been saved.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      danger: true,
    });
  }

  /**
   * Create an entity, filed into the selected container — at the top of
   * the tree when nothing is selected — and open the editor on it.
   * @param {string} code
   */
  async function createEntity(code) {
    if (!(await confirmDiscard())) return;
    editor.endEdit();
    const parent = store.selection();
    const outcome = store.commit((model) => addEntity(model, code, { parent }));
    if (!outcome.ok) return;
    if (parent !== null) store.setExpanded(parent, true);
    store.select(outcome.entity.id);
    editor.beginEdit();
  }

  /**
   * Create a folder, named in a dialog, filed like an entity. A blank
   * name creates nothing.
   */
  async function createFolder() {
    if (!(await confirmDiscard())) return;
    editor.endEdit();
    const name = (await dialogs.prompt({ title: 'New folder', label: 'Name', confirmLabel: 'Create' }))?.trim();
    if (!name) return;
    const parent = store.selection();
    const outcome = store.commit((model) => addFolder(model, name, { parent }));
    if (!outcome.ok) return;
    if (parent !== null) store.setExpanded(parent, true);
    store.select(outcome.folder.id);
  }

  /** Rename the selected folder. A blank or unchanged name changes nothing. */
  async function renameSelection() {
    const node = nodeOf(store.model(), store.selection());
    if (!node || node.kind !== 'folder') return;
    const name = (
      await dialogs.prompt({ title: 'Rename folder', label: 'Name', value: node.name, confirmLabel: 'Rename' })
    )?.trim();
    if (!name || name === node.name) return;
    store.commit((model) => renameFolder(model, node.id, name));
  }

  /** @type {import('./overlay.js').Entry|null} */
  let createMenu = null;

  /**
   * The creation offer, generated from the metamodel, grouped by pillar.
   * @param {{ anchor?: HTMLElement, at?: { x: number, y: number } }} [invocation]
   */
  function toggleCreateMenu(invocation = {}) {
    if (createMenu) {
      overlay.close(createMenu);
      return;
    }
    createMenu = openMenu({
      overlay,
      label: 'New entity',
      anchor: invocation.anchor ?? null,
      at: invocation.at ?? null,
      items: Object.values(ENTITY_TYPES).map((type) => ({
        label: type.name,
        group: PILLARS[type.pillar],
        onPick: () => createEntity(type.code),
      })),
      onClose: () => {
        createMenu = null;
      },
    });
  }

  /**
   * Select a node, the draft guard first.
   * @param {string} id
   * @returns {Promise<boolean>} whether the selection landed
   */
  async function selectNode(id) {
    if (store.selection() === id) return true;
    if (!(await confirmDiscard())) return false;
    editor.endEdit();
    store.select(id);
    return true;
  }

  /**
   * The context menu: the same action list the toolbar draws from, at the
   * pointer. Opening it on a node selects the node first, guarded.
   * @param {string|null} id
   * @param {{ x: number, y: number }} at
   */
  async function openContextMenu(id, at) {
    if (store.selection() !== id) {
      if (!(await confirmDiscard())) return;
      editor.endEdit();
      store.select(id);
    }
    openMenu({
      overlay,
      label: 'Actions',
      at,
      items: getActions()
        .filter((action) => action.context)
        .map((action) => ({
          label: action.label,
          danger: action.danger,
          disabled: !action.enabled(),
          onPick: () => action.run({ at }),
        })),
    });
  }

  /**
   * File a node in a parent. A model change like any other: undoable, and
   * it marks the project unsaved.
   * @param {string} id
   * @param {string|null} parentId
   */
  function fileNode(id, parentId) {
    store.commit((model) => file(model, id, parentId));
  }

  /**
   * Place a node directly before or after another, adopting its parent.
   * @param {string} id
   * @param {string} targetId
   * @param {'before'|'after'} position
   */
  function placeNode(id, targetId, position) {
    store.commit((model) => placeBeside(model, id, targetId, position));
  }

  /** Change places with the sibling above. */
  function moveUp() {
    const id = store.selection();
    const node = nodeOf(store.model(), id);
    if (!node) return;
    const siblings = childrenOf(store.model(), node.parent);
    const index = siblings.findIndex((sibling) => sibling.id === id);
    if (index <= 0) return;
    store.commit((model) => placeBeside(model, id, siblings[index - 1].id, 'before'));
  }

  /** Change places with the sibling below. */
  function moveDown() {
    const id = store.selection();
    const node = nodeOf(store.model(), id);
    if (!node) return;
    const siblings = childrenOf(store.model(), node.parent);
    const index = siblings.findIndex((sibling) => sibling.id === id);
    if (index < 0 || index >= siblings.length - 1) return;
    store.commit((model) => placeBeside(model, id, siblings[index + 1].id, 'after'));
  }

  /**
   * Apply a confirmed draft.
   * @param {string} id
   * @param {Object<string, string>} values
   * @returns {boolean}
   */
  function saveEdit(id, values) {
    return store.commit((model) => updateEntity(model, id, values)).ok;
  }

  /**
   * Delete the selection. A folder deletion removes filing, never
   * entities, and proceeds without a question. An entity deletion that
   * cascades states the entities that will go, before it goes; one that
   * removes a single entity proceeds, and undo forgives.
   */
  async function deleteSelection() {
    const id = store.selection();
    const node = nodeOf(store.model(), id);
    if (!node) return;

    if (node.kind === 'folder') {
      store.commit((model) => removeFolder(model, id));
      return;
    }

    if (!(await confirmDiscard())) return;
    const doomed = deletionOf(store.model(), id);
    if (doomed.length > 1) {
      const list = el(
        'ul',
        { className: 'doomed-list' },
        doomed.map((entity) => el('li', { className: 'mono', text: designated(entity) }))
      );
      const confirmed = await dialogs.confirm({
        title: `Delete ${doomed.length} entities?`,
        message: `Deleting ${id} also deletes everything it contains through composition:`,
        body: list,
        confirmLabel: 'Delete',
        danger: true,
      });
      if (!confirmed) return;
    }

    editor.endEdit();
    store.commit((model) => removeEntity(model, id));
  }

  /**
   * Start the add-relationship workflow pinned to the selected entity,
   * with the first offered form chosen. Asking again for the same subject
   * closes it instead.
   */
  function relateSelection() {
    const subjectId = store.selection();
    const picker = store.picker();
    if (picker !== null && picker.subject === subjectId) {
      store.endPicking();
      return;
    }
    const options = relationshipOptions(store.model(), subjectId);
    if (options.length === 0) return;
    store.beginPicking(subjectId);
    store.setPickerForm({ typeId: options[0].type.id, direction: options[0].direction });
  }

  /**
   * Commit the picked relationships as one step: one undo removes them
   * all. A pick the model no longer allows is dropped.
   * @param {string} subjectId
   * @param {{ typeId: string, direction: 'outgoing'|'incoming' }} form
   * @param {string[]} picks
   */
  function completeRelate(subjectId, form, picks) {
    store.commit((model) => {
      let related = 0;
      for (const id of picks) {
        const outcome =
          form.direction === 'outgoing'
            ? relate(model, form.typeId, subjectId, id)
            : relate(model, form.typeId, id, subjectId);
        if (outcome.ok) related += 1;
      }
      return related > 0 ? { ok: true } : { ok: false, reason: 'Nothing could be related.' };
    });
  }

  /**
   * Remove a relationship. Both entities stay; undo restores the
   * relationship.
   * @param {import('./model.js').Relationship} relationship
   */
  function removeRelationship(relationship) {
    store.commit((model) => unrelate(model, relationship.type, relationship.source, relationship.target));
  }

  /**
   * The question asked before unsaved work would be replaced.
   * @param {string} confirmLabel
   * @returns {Promise<boolean>}
   */
  async function confirmDiscardProject(confirmLabel) {
    if (!store.dirty()) return true;
    return dialogs.confirm({
      title: 'Unsaved changes',
      message: 'This project has changes that are not saved to a file. Replacing it loses them.',
      confirmLabel,
      cancelLabel: 'Cancel',
      danger: true,
    });
  }

  /** Start over on an empty project, the questions first. */
  async function newProject() {
    if (!(await confirmDiscard())) return;
    if (!(await confirmDiscardProject('Discard and start over'))) return;
    editor.endEdit();
    store.replaceProject(createModel());
  }

  /**
   * @returns {Promise<File|null>} the file the user picked, or null
   */
  function pickFile() {
    return new Promise((resolve) => {
      fileInput.onchange = () => {
        const file = fileInput.files[0] ?? null;
        fileInput.value = '';
        resolve(file);
      };
      fileInput.oncancel = () => resolve(null);
      fileInput.click();
    });
  }

  /**
   * @param {import('./files.js').LoadResult} result
   */
  async function presentRefusal(result) {
    const body = result.problems?.length
      ? el('ul', { className: 'doomed-list' }, result.problems.map((problem) => el('li', { text: problem })))
      : null;
    await dialogs.open({
      title: result.code === 'newer' ? 'Written by a newer version' : 'Not a valid project file',
      message: result.statement,
      body,
      actions: [{ label: 'Close', value: null, kind: 'secondary' }],
    });
  }

  /**
   * Open a project file: the questions, the picker, the gates, and — when
   * a migration preserved content or left it unplaced — the statement of
   * what needs the user's attention.
   */
  async function openProjectFlow() {
    if (!(await confirmDiscard())) return;
    if (!(await confirmDiscardProject('Discard and open'))) return;

    const file = await pickFile();
    if (file === null) return;
    const result = openProject(await file.text());
    if (!result.ok) {
      await presentRefusal(result);
      return;
    }

    editor.endEdit();
    store.replaceProject(result.model);
    if (result.notices.length > 0) {
      await dialogs.open({
        title: 'The file was migrated',
        message: 'Opening this file changed its form. What follows was preserved as written and needs your attention:',
        body: el('ul', { className: 'doomed-list' }, result.notices.map((notice) => el('li', { text: notice }))),
        actions: [{ label: 'Close', value: null, kind: 'secondary' }],
      });
    }
  }

  /**
   * Save the project as a downloaded file, named after the project, and
   * point the saved state at what was written.
   */
  function saveProject() {
    const text = serialise(store.model());
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = el('a', { attributes: { href: url, download: filenameFor(store.model().name) } });
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    store.markSaved();
  }

  async function undo() {
    if (!store.canUndo()) return;
    if (!(await confirmDiscard())) return;
    editor.endEdit();
    store.undo();
  }

  async function redo() {
    if (!store.canRedo()) return;
    if (!(await confirmDiscard())) return;
    editor.endEdit();
    store.redo();
  }

  return {
    createEntity,
    createFolder,
    renameSelection,
    toggleCreateMenu,
    selectNode,
    openContextMenu,
    fileNode,
    placeNode,
    moveUp,
    moveDown,
    saveEdit,
    deleteSelection,
    relateSelection,
    completeRelate,
    removeRelationship,
    newProject,
    openProjectFlow,
    saveProject,
    undo,
    redo,
  };
}
