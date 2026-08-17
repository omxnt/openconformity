/**
 * The editor: the attributes of the selection, view-only until Edit, and
 * applied on Save. The pane renders only the attributes the definitions
 * carry for the type; content under any other key is never shown and never
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
 * @param {HTMLElement} context.container
 * @param {(id: string, values: Object<string, string>) => boolean} context.onSave
 */
export function createEditor({ store, container, onSave }) {
  /** @type {'view'|'edit'} */
  let mode = 'view';
  /** @type {string|null} the entity the open draft belongs to */
  let editingId = null;

  function fieldValues() {
    /** @type {Object<string, string>} */
    const values = {};
    for (const control of container.querySelectorAll('[data-key]')) {
      values[control.dataset.key] = control.value;
    }
    return values;
  }

  function subhead(node, actions) {
    const parts = [el('span', { className: 'mono designation', text: node.id })];
    const title = (node.attributes.title ?? '').trim();
    if (title) parts.push(el('span', { className: 'subhead-title', text: title }));
    return el('div', { className: 'editor-subhead' }, [
      el('div', { className: 'editor-subhead-name' }, parts),
      el('div', { className: 'editor-subhead-actions' }, actions),
    ]);
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
    const edit = el('button', { className: 'ghost-button', text: 'Edit', attributes: { type: 'button' } });
    edit.addEventListener('click', beginEdit);
    container.appendChild(subhead(node, [edit]));

    for (const definition of attributesFor(node.type)) {
      const value = node.attributes[definition.key];
      container.appendChild(
        el('div', { className: 'field' }, [
          el('div', { className: 'field-label', text: definition.name }),
          value === undefined || value === ''
            ? el('div', { className: 'field-value field-empty', text: '–' })
            : el('div', { className: `field-value${definition.kind === 'multiline' ? ' multiline' : ''}`, text: value }),
        ])
      );
    }
  }

  function renderEdit(node) {
    const save = el('button', { className: 'ghost-button', text: 'Save', attributes: { type: 'button' } });
    save.addEventListener('click', () => {
      if (onSave(editingId, fieldValues()) !== false) endEdit();
    });
    const cancel = el('button', { className: 'ghost-button', text: 'Cancel', attributes: { type: 'button' } });
    cancel.addEventListener('click', endEdit);
    container.appendChild(subhead(node, [save, cancel]));

    for (const definition of attributesFor(node.type)) {
      container.appendChild(
        el('div', { className: 'field' }, [
          el('label', { className: 'field-label', text: definition.name, attributes: { for: `field-${definition.key}` } }),
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

    container.textContent = '';
    if (!node) {
      container.appendChild(el('p', { className: 'pane-empty', text: 'Nothing selected.' }));
      return;
    }
    if (node.kind === 'folder') {
      container.appendChild(el('div', { className: 'editor-subhead' }, [
        el('div', { className: 'editor-subhead-name' }, [el('span', { className: 'subhead-title', text: node.name })]),
      ]));
      container.appendChild(el('p', { className: 'pane-empty', text: 'A folder carries a name and nothing else.' }));
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
    container.textContent = '';
    renderEdit(node);
    container.querySelector('[data-key]')?.focus();
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
