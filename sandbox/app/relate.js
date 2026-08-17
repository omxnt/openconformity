/**
 * The add-relationship workflow over the store's picker mode. The mode —
 * the pinned subject, the chosen form, the picked identifiers — is store
 * state; everything else here is re-derived from the model on every
 * render, so the workflow survives commits and renders alike.
 *
 * The panel opens when picking begins and closes when it ends, whoever
 * ended it: Done, Cancel, Escape, or the subject's deletion. The far ends
 * are picked in the navigator; the panel holds the form, the picks, and
 * the two ways out.
 */

import { nodeOf, canRelate } from './model.js';
import { ENTITY_TYPES, RELATIONSHIP_TYPES } from './metamodel.js';
import { relationshipOptions } from './flows.js';
import { el, icon } from './dom.js';

/**
 * The identifiers the chosen form can still be picked from: every entity
 * the model allows at the far end. Empty without a form.
 * @param {import('./model.js').Model} model
 * @param {{ subject: string, form: { typeId: string, direction: 'outgoing'|'incoming' }|null }|null} picker
 * @returns {Set<string>}
 */
export function pickerCandidates(model, picker) {
  if (picker === null || picker.form === null) return new Set();
  const candidates = new Set();
  for (const node of model.nodes.values()) {
    if (node.kind !== 'entity') continue;
    const allowed =
      picker.form.direction === 'outgoing'
        ? canRelate(model, picker.form.typeId, picker.subject, node.id)
        : canRelate(model, picker.form.typeId, node.id, picker.subject);
    if (allowed.ok) candidates.add(node.id);
  }
  return candidates;
}

/**
 * @param {import('./model.js').Model} model
 * @param {string} id
 * @returns {string}
 */
function designated(model, id) {
  const entity = nodeOf(model, id);
  if (!entity || entity.kind !== 'entity') return id;
  const title = (entity.attributes.title ?? '').trim();
  return title ? `${id}  ${title}` : id;
}

/**
 * @param {{ typeId: string, direction: string }} form
 * @returns {string}
 */
function formLabel(form) {
  const type = RELATIONSHIP_TYPES[form.typeId];
  const other = ENTITY_TYPES[form.direction === 'outgoing' ? type.target : type.source].name;
  return form.direction === 'outgoing' ? `${type.label} — ${other}` : `${other} — ${type.label} (incoming)`;
}

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {ReturnType<import('./overlay.js').createOverlay>} context.overlay
 * @param {(subject: string, form: { typeId: string, direction: 'outgoing'|'incoming' }, picks: string[]) => void} context.onDone
 */
export function createRelateWorkflow({ store, overlay, onDone }) {
  /** @type {import('./overlay.js').Entry|null} */
  let panel = null;
  /** @type {HTMLElement|null} */
  let body = null;

  function renderPanel() {
    const picker = store.picker();
    if (picker === null) return;
    const model = store.model();
    body.textContent = '';

    body.appendChild(
      el('div', { className: 'panel-subject' }, [
        el('span', { className: 'field-label', text: 'From' }),
        el('span', { className: 'mono', text: designated(model, picker.subject) }),
      ])
    );

    const options = relationshipOptions(model, picker.subject);
    const known = picker.form !== null && options.some(
      (option) => option.type.id === picker.form.typeId && option.direction === picker.form.direction
    );
    const forms = known || picker.form === null ? options : [
      { type: RELATIONSHIP_TYPES[picker.form.typeId], direction: picker.form.direction, candidates: [] },
      ...options,
    ];

    const select = el('select', {
      className: 'field-input',
      attributes: { id: 'picker-form', 'aria-label': 'Relationship' },
    });
    forms.forEach((option, index) => {
      select.appendChild(
        el('option', {
          text: formLabel({ typeId: option.type.id, direction: option.direction }),
          attributes: { value: String(index) },
        })
      );
    });
    if (picker.form !== null) {
      const at = forms.findIndex(
        (option) => option.type.id === picker.form.typeId && option.direction === picker.form.direction
      );
      select.value = String(at);
    }
    select.addEventListener('change', () => {
      const option = forms[Number(select.value)];
      store.setPickerForm({ typeId: option.type.id, direction: option.direction });
    });
    body.appendChild(
      el('div', { className: 'field' }, [
        el('label', { className: 'field-label', text: 'Relationship', attributes: { for: 'picker-form' } }),
        select,
      ])
    );

    const picks = el('div', { className: 'panel-picks' });
    picks.appendChild(
      el('div', {
        className: 'field-label',
        text: picker.picks.length === 0 ? 'Pick entities in the navigator' : `Picked (${picker.picks.length})`,
      })
    );
    for (const id of picker.picks) {
      const unpick = el('button', {
        className: 'icon-button',
        attributes: { type: 'button', 'aria-label': `Unpick ${id}` },
      }, [icon('i-close')]);
      unpick.addEventListener('click', () => store.togglePick(id));
      picks.appendChild(
        el('div', { className: 'panel-pick' }, [
          el('span', { className: 'mono panel-pick-name', text: designated(model, id) }),
          unpick,
        ])
      );
    }
    body.appendChild(picks);

    const done = el('button', {
      className: 'dialog-button button-primary',
      text: 'Done',
      attributes: { type: 'button' },
    });
    done.disabled = picker.picks.length === 0;
    done.addEventListener('click', () => {
      const current = store.picker();
      if (current !== null && current.form !== null && current.picks.length > 0) {
        onDone(current.subject, current.form, current.picks);
      }
      store.endPicking();
    });
    const cancel = el('button', {
      className: 'dialog-button button-secondary',
      text: 'Cancel',
      attributes: { type: 'button' },
    });
    cancel.addEventListener('click', () => store.endPicking());
    body.appendChild(el('div', { className: 'dialog-actions panel-actions' }, [cancel, done]));
  }

  function openPanel() {
    body = el('div', { className: 'panel-body' });
    const element = el(
      'aside',
      { className: 'side-panel', attributes: { 'aria-label': 'Add a relationship' } },
      [el('h3', { className: 'panel-title', text: 'Add a relationship' }), body]
    );
    panel = overlay.open({
      kind: 'panel',
      element,
      opener: document.activeElement,
      onClose() {
        panel = null;
        body = null;
        store.endPicking();
      },
    });
    renderPanel();
    element.querySelector('select')?.focus();
  }

  function render() {
    const picking = store.picker() !== null;
    if (picking && panel === null) openPanel();
    else if (!picking && panel !== null) overlay.close(panel);
    else if (picking) renderPanel();
  }

  store.subscribe(render);
  render();

  return { render };
}
