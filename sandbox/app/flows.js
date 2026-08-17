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
import { ENTITY_TYPES, PILLARS, RELATIONSHIP_TYPES, relationshipsFrom, relationshipsTo } from './metamodel.js';
import { serialise, openProject, filenameFor } from './files.js';
import { TYPE_ICONS } from './icons.js';
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
 * What a form is called wherever one is offered: the relationship's
 * label and the type at the far end, in reading order — label first when
 * the subject is the source, far type first when it is the target.
 * @param {{ typeId: string, direction: 'outgoing'|'incoming' }} form
 * @returns {string}
 */
export function formLabel(form) {
  const type = RELATIONSHIP_TYPES[form.typeId];
  const other = ENTITY_TYPES[form.direction === 'outgoing' ? type.target : type.source].name;
  return form.direction === 'outgoing' ? `${type.label} — ${other}` : `${other} — ${type.label}`;
}

/**
 * The types a new related entity could take, with every relationship the
 * metamodel admits between the subject and a new entity of that type. A
 * composition whose new entity would be a second owner of the subject is
 * left out; nothing else narrows, because a new entity has no
 * relationships to collide with. In metamodel order, so a menu groups by
 * pillar.
 * @param {import('./model.js').Model} model
 * @param {string} subjectId
 * @returns {Array<{ code: string, forms: Array<{ typeId: string, direction: 'outgoing'|'incoming' }> }>}
 */
export function relatedTypeOffer(model, subjectId) {
  const subject = nodeOf(model, subjectId);
  if (!subject || subject.kind !== 'entity') return [];
  const owned = [...model.relationships.values()].some(
    (relationship) => relationship.target === subjectId && RELATIONSHIP_TYPES[relationship.type].composition
  );

  const byCode = new Map();
  const add = (code, form) => {
    if (!byCode.has(code)) byCode.set(code, []);
    byCode.get(code).push(form);
  };
  for (const type of relationshipsFrom(subject.type)) {
    add(type.target, { typeId: type.id, direction: 'outgoing' });
  }
  for (const type of relationshipsTo(subject.type)) {
    if (type.composition && owned) continue;
    add(type.source, { typeId: type.id, direction: 'incoming' });
  }
  return Object.keys(ENTITY_TYPES)
    .filter((code) => byCode.has(code))
    .map((code) => ({ code, forms: byCode.get(code) }));
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
    if (!admissible) return;

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

  /** Name the project, or clear its name: an empty answer clears it. */
  async function renameProject() {
    if (!store.hasProject()) return;
    const name = await dialogs.prompt({
      title: 'Rename project',
      label: 'Name',
      value: store.model().name,
      confirmLabel: 'Rename',
    });
    if (name === null) return;
    const trimmed = name.trim();
    if (trimmed === store.model().name) return;
    store.commit((model) => nameProject(model, trimmed));
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
      const shared = { group: PILLARS[type.pillar], icon: TYPE_ICONS[code], pillar: type.pillar };
      if (forms.length === 1) {
        return [{ ...shared, label: type.name, onPick: () => createRelated(subjectId, code, forms[0]) }];
      }
      return forms.map((form) => ({
        ...shared,
        label: `${type.name} — ${RELATIONSHIP_TYPES[form.typeId].label}${form.direction === 'incoming' ? ' (incoming)' : ''}`,
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
   * The context menu: the same action list the toolbar draws from, at the
   * pointer. Opening it on a node selects the node first, guarded.
   * @param {string|null} id
   * @param {{ x: number, y: number }} at
   */
  async function openContextMenu(id, at) {
    if (store.selection() !== id) {
      if (!(await confirmDiscard())) return;
      endEditSession();
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
   * Apply a confirmed draft. The first save of a pristine creation makes
   * it an ordinary entity: from here on, Cancel keeps it.
   * @param {string} id
   * @param {Object<string, string>} values
   * @returns {boolean}
   */
  function saveEdit(id, values) {
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
    store.commit((model) => {
      let related = 0;
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
   * Save the project as a downloaded file, named after the project, and
   * point the saved state at what was written.
   */
  function saveProject() {
    if (!store.hasProject()) return;
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
    renameProject,
    toggleCreateMenu,
    toggleRelatedMenu,
    selectNode,
    openContextMenu,
    fileNode,
    placeNode,
    moveUp,
    moveDown,
    saveEdit,
    cancelEdit,
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
