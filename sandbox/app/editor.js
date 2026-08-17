/**
 * The editor: the attributes of the selection, view-only until Edit, and
 * applied on Save. The pane's header is its working surface — the
 * selection's designation and the mode's actions — and hides when nothing
 * is selected. The pane renders only the attributes the definitions carry
 * for the type; content under any other key is never shown and never
 * touched. A draft lives only here and only until Save or Cancel: the
 * flows ask the confirm/discard question before anything would destroy
 * one, and a render never rebuilds over an open draft.
 */

import { attributesFor } from './attributes.js';
import { nodeOf } from './model.js';
import { el } from './dom.js';

/**
 * Whether a draft differs from the entity it edits: a defined key whose
 * field no longer matches the stored value. An unset key stands for the
 * empty value, and keys the editor does not present never make a draft
 * dirty.
 * @param {Array<{ key: string }>} definitions
 * @param {Object<string, string>} attributes
 * @param {Object<string, string>} values
 * @returns {boolean}
 */
export function draftChanged(definitions, attributes, values) {
  return definitions.some(
    (definition) => (attributes[definition.key] ?? '') !== (values[definition.key] ?? '')
  );
}

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {HTMLElement} context.head
 * @param {HTMLElement} context.body
 * @param {(id: string, values: Object<string, string>) => boolean} context.onSave
 * @param {() => void} context.onRename
 */
export function createEditor({ store, head, body, onSave, onRename }) {
  /** @type {'view'|'edit'} */
  let mode = 'view';
  /** @type {string|null} the entity the open draft belongs to */
  let editingId = null;

  function fieldValues() {
    /** @type {Object<string, string>} */
    const values = {};
    for (const control of body.querySelectorAll('[data-key]')) {
      values[control.dataset.key] = control.value;
    }
    return values;
  }

  function renderHead(node, actions) {
    head.hidden = false;
    const parts = [];
    if (node.kind === 'entity') {
      parts.push(el('span', { className: 'mono designation', text: node.id }));
      const title = (node.attributes.title ?? '').trim();
      if (title) parts.push(el('span', { className: 'subhead-title', text: title }));
    } else {
      parts.push(el('span', { className: 'subhead-title', text: node.name }));
    }
    head.appendChild(el('div', { className: 'pane-head-name' }, parts));
    head.appendChild(el('div', { className: 'pane-head-actions' }, actions));
  }

  function headButton(label, onPick) {
    const button = el('button', { className: 'ghost-button', text: label, attributes: { type: 'button' } });
    button.addEventListener('click', onPick);
    return button;
  }

  function control(definition, value) {
    if (definition.kind === 'multiline') {
      const area = el('textarea', {
        className: 'field-input',
        attributes: { 'data-key': definition.key, rows: '4', id: `field-${definition.key}` },
      });
      area.value = value;
      return area;
    }
    if (definition.kind === 'choice') {
      const select = el('select', {
        className: 'field-input',
        attributes: { 'data-key': definition.key, id: `field-${definition.key}` },
      });
      select.appendChild(el('option', { text: '(not set)', attributes: { value: '' } }));
      for (const choice of definition.values ?? []) {
        select.appendChild(el('option', { text: choice, attributes: { value: choice } }));
      }
      select.value = value;
      return select;
    }
    const input = el('input', {
      className: 'field-input',
      attributes: {
        'data-key': definition.key,
        type: definition.kind === 'hyperlink' ? 'url' : 'text',
        id: `field-${definition.key}`,
      },
    });
    input.value = value;
    return input;
  }

  function renderView(node) {
    renderHead(node, [headButton('Edit', beginEdit)]);
    for (const definition of attributesFor(node.type)) {
      const value = node.attributes[definition.key];
      body.appendChild(
        el('div', { className: 'field' }, [
          el('div', { className: 'field-label', text: definition.name }),
          value === undefined || value === ''
            ? el('div', { className: 'field-value field-empty', text: '–' })
            : el('div', {
                className: `field-value${definition.kind === 'multiline' ? ' multiline' : ''}`,
                text: value,
              }),
        ])
      );
    }
  }

  function renderEdit(node) {
    renderHead(node, [
      headButton('Save', () => {
        if (onSave(editingId, fieldValues()) !== false) endEdit();
      }),
      headButton('Cancel', endEdit),
    ]);
    for (const definition of attributesFor(node.type)) {
      body.appendChild(
        el('div', { className: 'field' }, [
          el('label', {
            className: 'field-label',
            text: definition.name,
            attributes: { for: `field-${definition.key}` },
          }),
          control(definition, node.attributes[definition.key] ?? ''),
        ])
      );
    }
  }

  function render() {
    const id = store.selection();
    const node = nodeOf(store.model(), id);

    if (mode === 'edit') {
      if (id === editingId && node && node.kind === 'entity') return;
      mode = 'view';
      editingId = null;
    }

    head.textContent = '';
    body.textContent = '';
    if (!node) {
      head.hidden = true;
      body.appendChild(el('p', { className: 'pane-empty', text: 'Nothing selected.' }));
      return;
    }
    if (node.kind === 'folder') {
      renderHead(node, [headButton('Rename…', onRename)]);
      body.appendChild(el('p', { className: 'pane-empty', text: 'A folder carries a name and nothing else.' }));
      return;
    }
    renderView(node);
  }

  function beginEdit() {
    const id = store.selection();
    const node = nodeOf(store.model(), id);
    if (!node || node.kind !== 'entity') return;
    mode = 'edit';
    editingId = id;
    head.textContent = '';
    body.textContent = '';
    renderEdit(node);
    body.querySelector('[data-key]')?.focus();
  }

  function endEdit() {
    mode = 'view';
    editingId = null;
    render();
  }

  /**
   * Whether an unconfirmed change is open: the question the flows ask the
   * confirm/discard dialog about.
   */
  function hasUnconfirmedEdit() {
    if (mode !== 'edit') return false;
    const node = nodeOf(store.model(), editingId);
    if (!node || node.kind !== 'entity') return false;
    return draftChanged(attributesFor(node.type), node.attributes, fieldValues());
  }

  store.subscribe(render);
  render();

  return { render, beginEdit, endEdit, hasUnconfirmedEdit, editing: () => mode === 'edit' };
}
