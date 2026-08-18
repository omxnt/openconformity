/**
 * The flows: create, select, relate, file, arrange, delete, undo, redo,
 * and the project's own new, open, save, and rename. Each one asks its
 * questions as straight-line awaited code — the draft guard is one
 * awaited if — and then makes one commit through the store. Nothing here
 * writes to the model directly.
 *
 * A creation stays pristine until its first save: the flows remember it,
 * and any end of that edit session other than Save removes the entity
 * again — collapsing the creation out of history when nothing has
 * committed since, deleting it as one step otherwise. Once saved, Cancel
 * means discard-edits-keep-entity.
 */

import {
  createModel,
  addEntity,
  addFolder,
  removeEntity,
  removeFolder,
  renameFolder,
  renameProject as nameProject,
  setProjectAttribute,
  updateEntity,
  relate,
  unrelate,
  file,
  placeBeside,
  childrenOf,
  nodeOf,
} from './model.js';
import { ENTITY_TYPES, PILLARS, RELATIONSHIP_TYPES } from './metamodel.js';
import { relationshipOptions, relatedTypeOffer, moveTargets, cascadeQuestion, designated } from './queries.js';
import { serialise, openProject, loadProject, filenameFor } from './files.js';
import { EXAMPLE_PROJECT } from './example.js';
import { TYPE_ICONS } from './icons.js';
import { openMenu } from './menu.js';
import { el, download } from './dom.js';
import { showAbout as aboutDialog } from './about.js';

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {ReturnType<import('./overlay.js').createOverlay>} context.overlay
 * @param {ReturnType<import('./dialog.js').createDialogs>} context.dialogs
 * @param {ReturnType<import('./editor.js').createEditor>} context.editor
 * @param {HTMLInputElement} context.fileInput
 * @param {typeof download} [context.saveFile]  the download, injectable where no page exists
 */
export function createFlows({ store, overlay, dialogs, editor, fileInput, saveFile = download }) {
  /**
   * The creation whose first save has not happened: cancelling the edit
   * session removes it again.
   * @type {{ id: string, sequence: number }|null}
   */
  let freshCreation = null;

  /**
   * The draft guard: true when it is safe to go on. Discarding a pristine
   * creation says it removes the entity.
   * @returns {Promise<boolean>}
   */
  async function confirmDiscard() {
    if (!editor.hasUnconfirmedEdit()) return true;
    const fresh = freshCreation !== null && store.selection() === freshCreation.id;
    return dialogs.confirm({
      title: 'Discard the changes?',
      message: fresh
        ? 'The new entity has never been saved. Discarding removes it.'
        : 'The edited attributes have not been saved.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      danger: true,
    });
  }

  /**
   * End the open edit session without saving. A pristine creation goes
   * with it: collapsed out of history when its commit is still the
   * newest, removed as one step otherwise.
   */
  function endEditSession() {
    const fresh = freshCreation;
    freshCreation = null;
    editor.endEdit();
    if (fresh !== null && nodeOf(store.model(), fresh.id) !== null) {
      if (store.sequence() === fresh.sequence) store.rollback();
      else store.commit((model) => removeEntity(model, fresh.id));
    }
  }

  /** The editor's Cancel: the fresh entity leaves with the session. */
  function cancelEdit() {
    endEditSession();
  }

  /**
   * Create an entity, filed into the selected container — at the top of
   * the tree when nothing is selected — and open the editor on it.
   * @param {string} code
   */
  async function createEntity(code) {
    if (!(await confirmDiscard())) return;
    endEditSession();
    const parent = store.selection();
    const outcome = store.commit((model) => addEntity(model, code, { parent }));
    if (!outcome.ok) return;
    if (parent !== null) store.setExpanded(parent, true);
    store.select(outcome.entity.id);
    freshCreation = { id: outcome.entity.id, sequence: store.sequence() };
    editor.beginEdit();
  }

  /**
   * Create an entity related to the subject: the new empty entity and its
   * relationship in one step, filed inside the subject, the editor opened
   * on it. Cancelling removes both.
   * @param {string} subjectId
   * @param {string} code
   * @param {{ typeId: string, direction: 'outgoing'|'incoming' }} form
   */
  async function createRelated(subjectId, code, form) {
    if (!(await confirmDiscard())) return;
    endEditSession();
    const offer = relatedTypeOffer(store.model(), subjectId).find((offered) => offered.code === code);
    const admissible = offer?.forms.some(
      (offered) => offered.typeId === form.typeId && offered.direction === form.direction
    );
    if (!admissible) {
      dialogs.toast('Relationship refused', 'The model no longer allows that relationship.');
      return;
    }

    const outcome = store.commit((model) => {
      const created = addEntity(model, code, { parent: subjectId });
      if (!created.ok) return created;
      const related =
        form.direction === 'outgoing'
          ? relate(model, form.typeId, subjectId, created.entity.id)
          : relate(model, form.typeId, created.entity.id, subjectId);
      return related.ok ? { ok: true, entity: created.entity } : related;
    });
    if (!outcome.ok) return;
    store.setExpanded(subjectId, true);
    store.select(outcome.entity.id);
    freshCreation = { id: outcome.entity.id, sequence: store.sequence() };
    editor.beginEdit();
  }

  /**
   * Create a folder, named in a dialog, filed like an entity. A blank
   * name creates nothing.
   */
  async function createFolder() {
    if (!(await confirmDiscard())) return;
    endEditSession();
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

  /**
   * Leave the open edit by the key that means leave: a clean draft
   * cancels silently, a dirty one gets the standard discard question.
   */
  async function escapeEdit() {
    if (!editor.editing()) return;
    if (!(await confirmDiscard())) return;
    endEditSession();
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
        icon: TYPE_ICONS[type.code],
        pillar: type.pillar,
        hint: type.code,
        onPick: () => createEntity(type.code),
      })),
      onClose: () => {
        createMenu = null;
      },
    });
  }

  /** @type {import('./overlay.js').Entry|null} */
  let relatedMenu = null;

  /**
   * The new-related offer: the types relatable to the selection, grouped
   * by pillar. A type whose pair with the subject admits more than one
   * relationship offers one entry per relationship.
   * @param {{ anchor?: HTMLElement, at?: { x: number, y: number } }} [invocation]
   */
  function toggleRelatedMenu(invocation = {}) {
    if (relatedMenu) {
      overlay.close(relatedMenu);
      return;
    }
    const subjectId = store.selection();
    const offer = relatedTypeOffer(store.model(), subjectId);
    if (offer.length === 0) return;

    const items = offer.flatMap(({ code, forms }) => {
      const type = ENTITY_TYPES[code];
      const shared = { label: type.name, group: PILLARS[type.pillar], icon: TYPE_ICONS[code], pillar: type.pillar };
      return forms.map((form) => ({
        ...shared,
        hint: `${RELATIONSHIP_TYPES[form.typeId].label}${form.direction === 'incoming' ? ' (incoming)' : ''}`,
        onPick: () => createRelated(subjectId, code, form),
      }));
    });

    relatedMenu = openMenu({
      overlay,
      label: 'New related entity',
      anchor: invocation.anchor ?? null,
      at: invocation.at ?? null,
      items,
      onClose: () => {
        relatedMenu = null;
      },
    });
  }

  /**
   * Select a node, the draft guard first.
   * @param {string|null} id
   * @returns {Promise<boolean>} whether the selection landed
   */
  async function selectNode(id) {
    if (store.selection() === id) return true;
    if (!(await confirmDiscard())) return false;
    endEditSession();
    store.select(id);
    return true;
  }

  /**
   * A refused change is told in passing: it altered nothing and needs no
   * answer.
   * @param {string} title
   * @param {{ ok: boolean, reason?: string }} outcome
   * @returns {boolean} whether it went through
   */
  function toastRefusal(title, outcome) {
    if (!outcome.ok) dialogs.toast(title, outcome.reason ?? 'That is not allowed.');
    return outcome.ok;
  }

  /**
   * File a node in a parent. A model change like any other: undoable, and
   * it marks the project unsaved.
   * @param {string} id
   * @param {string|null} parentId
   */
  function fileNode(id, parentId) {
    toastRefusal('Move refused', store.commit((model) => file(model, id, parentId)));
  }

  /**
   * Place a node directly before or after another, adopting its parent.
   * @param {string} id
   * @param {string} targetId
   * @param {'before'|'after'} position
   */
  function placeNode(id, targetId, position) {
    toastRefusal('Move refused', store.commit((model) => placeBeside(model, id, targetId, position)));
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
   * File the selection somewhere chosen from a list of every legal
   * destination: the pointerless filing path.
   */
  async function moveToSelection() {
    const id = store.selection();
    const targets = moveTargets(store.model(), id);
    if (targets.length === 0) return;
    const value = await dialogs.choose({
      title: 'Move to',
      label: 'Destination',
      options: targets.map((target, index) => ({
        value: String(index),
        label: `${' '.repeat(target.depth * 4)}${target.label}`,
      })),
      value: '0',
      confirmLabel: 'Move',
    });
    if (value === null) return;
    const target = targets[Number(value)];
    if (target) toastRefusal('Move refused', store.commit((model) => file(model, id, target.parentId)));
  }

  /**
   * Open what the row holds: an entity opens for editing, a folder opens
   * its name, the project row its own. Reached by Enter, Space, or a
   * double click; the selection moves there first, guarded.
   * @param {string|null} id
   */
  async function activateNode(id) {
    if (!(await selectNode(id))) return;
    const node = nodeOf(store.model(), store.selection());
    if (node === null) {
      if (store.hasProject() && store.selection() === null) editor.beginEdit();
      return;
    }
    if (node.kind === 'entity') editor.beginEdit();
    else await renameSelection();
  }

  /**
   * Apply a confirmed draft. A null identifier is the project itself:
   * the name goes to the model's own name, everything else to the
   * project's attribute bag. The first save of a pristine creation makes
   * it an ordinary entity: from here on, Cancel keeps it.
   * @param {string|null} id
   * @param {Object<string, string>} values
   * @returns {boolean}
   */
  function saveEdit(id, values) {
    if (id === null) {
      return store.commit((model) => {
        const named = nameProject(model, (values.name ?? model.name).trim());
        if (!named.ok) return named;
        for (const [key, value] of Object.entries(values)) {
          if (key === 'name') continue;
          const set = setProjectAttribute(model, key, value);
          if (!set.ok) return set;
        }
        return { ok: true };
      }).ok;
    }
    const outcome = store.commit((model) => updateEntity(model, id, values));
    if (outcome.ok && freshCreation !== null && freshCreation.id === id) freshCreation = null;
    return outcome.ok;
  }

  /**
   * Delete the selection. A folder deletion removes filing, never
   * entities, and proceeds without a question. A pristine creation
   * collapses. An entity deletion that cascades states the entities that
   * will go, before it goes; one that removes a single entity proceeds,
   * and undo forgives.
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
    if (freshCreation !== null && freshCreation.id === id) {
      endEditSession();
      return;
    }

    const question = cascadeQuestion(store.model(), id);
    if (question.doomed.length > 1) {
      const list = el(
        'ul',
        { className: 'doomed-list' },
        question.doomed.map((entity) => el('li', { className: 'mono', text: designated(entity) }))
      );
      const confirmed = await dialogs.confirm({
        title: question.title,
        message: question.message,
        body: list,
        confirmLabel: 'Delete',
        danger: true,
      });
      if (!confirmed) return;
    }

    endEditSession();
    store.commit((model) => removeEntity(model, id));
  }

  /**
   * Start the add-relationship workflow pinned to the selected entity.
   * Asking again for the same subject closes it instead.
   */
  function relateSelection() {
    const subjectId = store.selection();
    const picker = store.picker();
    if (picker !== null && picker.subject === subjectId) {
      store.endPicking();
      return;
    }
    if (relationshipOptions(store.model(), subjectId).length === 0) return;
    store.beginPicking(subjectId);
  }

  /**
   * Commit the picked relationships as one step: each pick as the
   * relationship its pair means — its only option, the chosen one, or the
   * first on offer. One undo removes them all; a pick the model no longer
   * allows is dropped.
   * @param {string} subjectId
   * @param {Array<{ id: string, form: { typeId: string, direction: string }|null }>} picks
   */
  function completeRelate(subjectId, picks) {
    let related = 0;
    store.commit((model) => {
      for (const pick of picks) {
        const options = relationshipOptions(model, subjectId)
          .filter((option) => option.candidates.some((candidate) => candidate.id === pick.id))
          .map((option) => ({ typeId: option.type.id, direction: option.direction }));
        const form =
          pick.form !== null &&
          options.some((option) => option.typeId === pick.form.typeId && option.direction === pick.form.direction)
            ? pick.form
            : options[0];
        if (!form) continue;
        const outcome =
          form.direction === 'outgoing'
            ? relate(model, form.typeId, subjectId, pick.id)
            : relate(model, form.typeId, pick.id, subjectId);
        if (outcome.ok) related += 1;
      }
      return related > 0 ? { ok: true } : { ok: false, reason: 'Nothing could be related.' };
    });
    if (related < picks.length) {
      const dropped = picks.length - related;
      dialogs.toast('Relationships refused', `${dropped} of the picked relationships could no longer be made.`);
    }
    store.endPicking();
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

  /**
   * Create a project: from the landing, one action and it exists,
   * unconfigured, its name empty. Over an open project, the questions
   * come first.
   */
  async function newProject() {
    if (!(await confirmDiscard())) return;
    if (!(await confirmDiscardProject('Discard and start over'))) return;
    endEditSession();
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

    endEditSession();
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
   * Load the bundled example project. It rides with the software as a
   * file-shaped object and goes through the same gates as a file the
   * user picked, so the example cannot drift from the format: a schema
   * it no longer passes fails here, and fails the test that pins it,
   * before it misleads anyone.
   */
  async function loadExample() {
    if (!(await confirmDiscard())) return;
    if (!(await confirmDiscardProject('Discard and load the example'))) return;

    const result = loadProject(EXAMPLE_PROJECT);
    if (!result.ok) {
      await presentRefusal(result);
      return;
    }
    endEditSession();
    store.replaceProject(result.model);
  }

  /**
   * Save the project as a downloaded file, asking every time: the name,
   * prefilled and renamed on confirm like any rename, and the filename
   * it makes, previewed live. Cancel costs nothing — no download, no
   * rename, no pointer move.
   */
  async function saveProject() {
    if (!store.hasProject()) return;
    const name = await dialogs.prompt({
      title: 'Save project',
      label: 'Project name',
      value: store.model().name,
      confirmLabel: 'Save',
      preview: (typed) => `Saved to your downloads as ${filenameFor(typed.trim() || store.model().name)}.`,
    });
    if (name === null) return;
    if (name !== store.model().name) {
      const named = store.commit((model) => nameProject(model, name));
      if (!named.ok) return;
    }
    const filename = filenameFor(store.model().name);
    saveFile(filename, serialise(store.model()), 'application/json');
    store.markSaved();
    dialogs.toast('Project saved', `Saved to your downloads as ${filename}.`);
  }

  /**
   * The metamodel diagram, exported for each theme and carried with the
   * software, so it opens without a network and in the colours the user
   * is already in.
   */
  function openMetamodel() {
    const dark = document.documentElement.dataset.theme === 'g100';
    window.open(`assets/images/metamodel-${dark ? 'dark' : 'light'}.png`, '_blank', 'noopener');
  }

  /** The About dialog; its content is chrome and lives in about.js. */
  function showAbout() {
    return aboutDialog(dialogs);
  }

  /**
   * Undo. A pristine creation collapses instead: removing it is the undo
   * of the one change standing.
   */
  async function undo() {
    if (!(await confirmDiscard())) return;
    if (freshCreation !== null) {
      endEditSession();
      return;
    }
    if (!store.canUndo()) return;
    endEditSession();
    store.undo();
  }

  async function redo() {
    if (!(await confirmDiscard())) return;
    if (freshCreation !== null) {
      endEditSession();
      return;
    }
    if (!store.canRedo()) return;
    endEditSession();
    store.redo();
  }

  return {
    createEntity,
    createRelated,
    createFolder,
    renameSelection,
    escapeEdit,
    toggleCreateMenu,
    toggleRelatedMenu,
    selectNode,
    fileNode,
    placeNode,
    moveUp,
    moveDown,
    moveToSelection,
    activateNode,
    saveEdit,
    cancelEdit,
    deleteSelection,
    relateSelection,
    completeRelate,
    removeRelationship,
    newProject,
    openProjectFlow,
    loadExample,
    saveProject,
    openMetamodel,
    showAbout,
    undo,
    redo,
  };
}
