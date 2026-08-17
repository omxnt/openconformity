/**
 * The flows: create, select, relate, file, delete, undo, redo. Each one
 * asks its questions as straight-line awaited code — the draft guard is
 * one awaited if — and then makes one commit through the store. Nothing
 * here writes to the model directly.
 *
 * The draft guard runs before anything that would destroy an open draft:
 * a selection change, a deletion of the edited entity, an undo or redo, a
 * creation. Relating and filing leave the selection and the draft where
 * they stand, so they run unguarded.
 */

import {
  addEntity,
  removeEntity,
  updateEntity,
  deletionOf,
  relate,
  file,
  nodeOf,
  canRelate,
} from './model.js';
import { ENTITY_TYPES, relationshipsFrom, relationshipsTo } from './metamodel.js';
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
 */
export function createFlows({ store, overlay, dialogs, editor }) {
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

  /** @type {import('./overlay.js').Entry|null} */
  let createMenu = null;

  /**
   * The creation offer, generated from the metamodel.
   * @param {HTMLElement} anchor
   */
  function toggleCreateMenu(anchor) {
    if (createMenu) {
      overlay.close(createMenu);
      return;
    }
    const menu = el('div', { className: 'dropdown', attributes: { role: 'menu', 'aria-label': 'New entity' } });
    for (const type of Object.values(ENTITY_TYPES)) {
      const item = el('button', {
        className: 'menu-entry',
        text: type.name,
        attributes: { type: 'button', role: 'menuitem' },
      });
      item.addEventListener('click', () => {
        overlay.close(createMenu);
        createEntity(type.code);
      });
      menu.appendChild(item);
    }
    menu.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      const items = [...menu.querySelectorAll('.menu-entry')];
      const from = items.indexOf(document.activeElement);
      const to = (from + (event.key === 'ArrowDown' ? 1 : items.length - 1) + items.length) % items.length;
      items[to].focus();
    });

    const at = anchor.getBoundingClientRect();
    menu.style.top = `${at.bottom}px`;
    menu.style.left = `${at.left}px`;

    createMenu = overlay.open({
      kind: 'menu',
      element: menu,
      opener: anchor,
      onClose() {
        createMenu = null;
        anchor.setAttribute('aria-expanded', 'false');
      },
    });
    anchor.setAttribute('aria-expanded', 'true');
    menu.querySelector('.menu-entry').focus();
  }

  /**
   * Select a node, the draft guard first.
   * @param {string} id
   */
  async function selectNode(id) {
    if (store.selection() === id) return;
    if (!(await confirmDiscard())) return;
    editor.endEdit();
    store.select(id);
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
   * Apply a confirmed draft.
   * @param {string} id
   * @param {Object<string, string>} values
   * @returns {boolean}
   */
  function saveEdit(id, values) {
    return store.commit((model) => updateEntity(model, id, values)).ok;
  }

  /**
   * Delete the selected entity. A deletion that cascades states the
   * entities that will go, before it goes; one that removes a single
   * entity proceeds, and undo forgives.
   */
  async function deleteSelection() {
    const id = store.selection();
    const node = nodeOf(store.model(), id);
    if (!node || node.kind !== 'entity') return;
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
    toggleCreateMenu,
    selectNode,
    fileNode,
    saveEdit,
    deleteSelection,
    relateSelection,
    undo,
    redo,
  };
}
