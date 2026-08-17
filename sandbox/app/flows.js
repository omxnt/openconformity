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
  addEntity,
  addFolder,
  removeEntity,
  removeFolder,
  renameFolder,
  updateEntity,
  deletionOf,
  relate,
  file,
  placeBeside,
  childrenOf,
  nodeOf,
  canRelate,
} from './model.js';
import { ENTITY_TYPES, PILLARS, relationshipsFrom, relationshipsTo } from './metamodel.js';
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
 */
export function createFlows({ store, overlay, dialogs, editor, getActions }) {
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
   * Add a relationship from the selected entity, the form and the far end
   * chosen in a dialog. The offer is generated from the metamodel and the
   * model.
   */
  async function relateSelection() {
    const subjectId = store.selection();
    const options = relationshipOptions(store.model(), subjectId);
    if (options.length === 0) return;

    const relationSelect = el('select', {
      className: 'field-input',
      attributes: { 'aria-label': 'Relationship', id: 'relate-form' },
    });
    options.forEach((option, index) => {
      const other = ENTITY_TYPES[option.direction === 'outgoing' ? option.type.target : option.type.source].name;
      const text =
        option.direction === 'outgoing'
          ? `${option.type.label} — ${other}`
          : `${other} — ${option.type.label} (incoming)`;
      relationSelect.appendChild(el('option', { text, attributes: { value: String(index) } }));
    });

    const targetSelect = el('select', {
      className: 'field-input',
      attributes: { 'aria-label': 'Entity', id: 'relate-target' },
    });
    function fillTargets() {
      targetSelect.textContent = '';
      for (const candidate of options[Number(relationSelect.value)].candidates) {
        targetSelect.appendChild(el('option', { text: designated(candidate), attributes: { value: candidate.id } }));
      }
    }
    relationSelect.addEventListener('change', fillTargets);
    fillTargets();

    const body = el('div', { className: 'relate-form' }, [
      el('div', { className: 'field' }, [
        el('label', { className: 'field-label', text: 'Relationship', attributes: { for: 'relate-form' } }),
        relationSelect,
      ]),
      el('div', { className: 'field' }, [
        el('label', { className: 'field-label', text: 'Entity', attributes: { for: 'relate-target' } }),
        targetSelect,
      ]),
    ]);

    const confirmed = await dialogs.confirm({ title: 'Add a relationship', body, confirmLabel: 'Add' });
    if (!confirmed) return;

    const option = options[Number(relationSelect.value)];
    const otherId = targetSelect.value;
    store.commit((model) =>
      option.direction === 'outgoing'
        ? relate(model, option.type.id, subjectId, otherId)
        : relate(model, option.type.id, otherId, subjectId)
    );
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
    undo,
    redo,
  };
}
