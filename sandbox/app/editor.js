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
import { ENTITY_TYPES } from './metamodel.js';
import { TYPE_ICONS, FOLDER_ICON, PROJECT_ICON } from './icons.js';
import { el, icon } from './dom.js';

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
 * The project's field set: the name, mapped to the model's own name
 * rather than the attribute bag, and nothing else until
 * `docs/attributes.md` gains its Project section.
 */
const PROJECT_FIELDS = [{ key: 'name', name: 'Name', kind: 'text' }];

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {HTMLElement} context.head
 * @param {HTMLElement} context.body
 * @param {(id: string|null, values: Object<string, string>) => boolean} context.onSave
 * @param {() => void} context.onCancel
 * @param {() => void} context.onRename
 * @param {(event: KeyboardEvent) => void} [context.onEscape]
 */
export function createEditor({ store, head, body, onSave, onCancel, onRename, onEscape = () => {} }) {
  /** @type {'view'|'edit'} */
  let mode = 'view';
  /** @type {string|null} the entity the open draft belongs to */
  let editingId = null;
  /** Whether the open draft edits the project itself. */
  let editingProject = false;

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
      const type = ENTITY_TYPES[node.type];
      parts.push(icon(TYPE_ICONS[node.type], type.pillar));
      parts.push(el('span', { className: 'subhead-kind', text: type.name }));
      parts.push(el('span', { className: 'mono designation', text: node.id }));
      const title = (node.attributes.title ?? '').trim();
      if (title) parts.push(el('span', { className: 'subhead-title', text: title }));
    } else {
      parts.push(icon(FOLDER_ICON));
      parts.push(el('span', { className: 'subhead-kind', text: 'Folder' }));
      parts.push(el('span', { className: 'subhead-title', text: node.name }));
    }
    head.appendChild(el('div', { className: 'pane-head-name' }, parts));
    head.appendChild(el('div', { className: 'pane-head-actions' }, actions));
  }

  /**
   * Carbon's empty state for the pane.
   * @param {string} title
   * @param {string} text
   */
  function emptyState(title, text) {
    return el('div', { className: 'empty-state' }, [
      el('p', { className: 'empty-state-title', text: title }),
      el('p', { className: 'empty-state-body', text }),
    ]);
  }

  /**
   * The identifier, read-only above the attributes: generated, never an
   * attribute, shown as the document's conventions place it.
   * @param {import('./model.js').Entity} node
   */
  function identifierField(node) {
    return el('div', { className: 'field' }, [
      el('div', { className: 'field-label', text: 'Identifier' }),
      el('div', { className: 'field-value mono', text: node.id }),
    ]);
  }

  function headButton(label, onPick, iconId = null) {
    const button = el(
      'button',
      { className: 'ghost-button', attributes: { type: 'button' } },
      [...(iconId ? [icon(iconId)] : []), el('span', { text: label })]
    );
    button.addEventListener('click', onPick);
    return button;
  }

  /** The project head: its icon, its kind, and its name as it stands. */
  function projectHeadName() {
    const name = store.model().name.trim();
    return el('div', { className: 'pane-head-name' }, [
      icon(PROJECT_ICON),
      el('span', { className: 'subhead-kind', text: 'Project' }),
      name
        ? el('span', { className: 'subhead-title', text: name })
        : el('span', { className: 'subhead-title untitled', text: 'Untitled' }),
    ]);
  }

  /** The values the project's fields edit: the name, from the model itself. */
  function projectValues() {
    return { name: store.model().name };
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

  /** The project, on the standard surface: view fields and Edit. */
  function renderProjectView() {
    head.hidden = false;
    head.appendChild(projectHeadName());
    head.appendChild(el('div', { className: 'pane-head-actions' }, [headButton('Edit', beginEdit, 'i-edit')]));
    const values = projectValues();
    const fields = el('div', { className: 'fields' });
    for (const definition of PROJECT_FIELDS) {
      const value = values[definition.key];
      fields.appendChild(
        el('div', { className: 'field' }, [
          el('div', { className: 'field-label', text: definition.name }),
          value === undefined || value === ''
            ? el('div', { className: 'field-value field-empty', text: '–' })
            : el('div', { className: 'field-value', text: value }),
        ])
      );
    }
    body.appendChild(fields);
  }

  function renderProjectEdit() {
    head.hidden = false;
    head.appendChild(projectHeadName());
    head.appendChild(
      el('div', { className: 'pane-head-actions' }, [
        headButton('Save', () => {
          if (onSave(null, fieldValues()) !== false) endEdit();
        }),
        headButton('Cancel', onCancel),
      ])
    );
    const values = projectValues();
    const fields = el('div', { className: 'fields' });
    for (const definition of PROJECT_FIELDS) {
      fields.appendChild(
        el('div', { className: 'field' }, [
          el('label', {
            className: 'field-label',
            text: definition.name,
            attributes: { for: `field-${definition.key}` },
          }),
          control(definition, values[definition.key] ?? ''),
        ])
      );
    }
    body.appendChild(fields);
  }

  function renderView(node) {
    renderHead(node, [headButton('Edit', beginEdit, 'i-edit')]);
    const fields = el('div', { className: 'fields' }, [identifierField(node)]);
    for (const definition of attributesFor(node.type)) {
      const value = node.attributes[definition.key];
      fields.appendChild(
        el('div', { className: `field${definition.kind === 'multiline' ? ' field-tall' : ''}` }, [
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
    body.appendChild(fields);
  }

  function renderEdit(node) {
    renderHead(node, [
      headButton('Save', () => {
        if (onSave(editingId, fieldValues()) !== false) endEdit();
      }),
      headButton('Cancel', onCancel),
    ]);
    const fields = el('div', { className: 'fields' }, [identifierField(node)]);
    for (const definition of attributesFor(node.type)) {
      fields.appendChild(
        el('div', { className: `field${definition.kind === 'multiline' ? ' field-tall' : ''}` }, [
          el('label', {
            className: 'field-label',
            text: definition.name,
            attributes: { for: `field-${definition.key}` },
          }),
          control(definition, node.attributes[definition.key] ?? ''),
        ])
      );
    }
    body.appendChild(fields);
  }

  function render() {
    const id = store.selection();
    const node = nodeOf(store.model(), id);

    if (mode === 'edit') {
      if (editingProject && id === null && store.hasProject()) return;
      if (!editingProject && id === editingId && node && node.kind === 'entity') return;
      mode = 'view';
      editingId = null;
      editingProject = false;
    }

    head.textContent = '';
    body.textContent = '';
    if (!store.hasProject()) {
      head.hidden = true;
      body.appendChild(emptyState('No project', 'Create or open a project to work with its entities.'));
      return;
    }
    if (!node) {
      renderProjectView();
      return;
    }
    if (node.kind === 'folder') {
      renderHead(node, [headButton('Rename…', onRename)]);
      body.appendChild(
        emptyState('Folder', 'A folder groups things in the navigator and carries no attributes of its own.')
      );
      return;
    }
    renderView(node);
  }

  function beginEdit() {
    const id = store.selection();
    const node = nodeOf(store.model(), id);
    if (id === null && store.hasProject()) {
      mode = 'edit';
      editingProject = true;
      head.textContent = '';
      body.textContent = '';
      renderProjectEdit();
    } else if (node && node.kind === 'entity') {
      mode = 'edit';
      editingId = id;
      head.textContent = '';
      body.textContent = '';
      renderEdit(node);
    } else {
      return;
    }
    body.querySelector('[data-key]')?.focus();
  }

  function endEdit() {
    mode = 'view';
    editingId = null;
    editingProject = false;
    render();
  }

  /**
   * Whether an unconfirmed change is open: the question the flows ask the
   * confirm/discard dialog about.
   */
  function hasUnconfirmedEdit() {
    if (mode !== 'edit') return false;
    if (editingProject) {
      if (!store.hasProject()) return false;
      return draftChanged(PROJECT_FIELDS, projectValues(), fieldValues());
    }
    const node = nodeOf(store.model(), editingId);
    if (!node || node.kind !== 'entity') return false;
    return draftChanged(attributesFor(node.type), node.attributes, fieldValues());
  }

  // Escape while a draft is open belongs to the editor, not the overlay:
  // it asks to leave the edit, and it must not fall through to whatever
  // stands above the page.
  for (const surface of [head, body]) {
    surface.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || mode !== 'edit') return;
      event.preventDefault();
      event.stopPropagation();
      onEscape(event);
    });
  }

  store.subscribe(render);
  render();

  return { render, beginEdit, endEdit, hasUnconfirmedEdit, editing: () => mode === 'edit' };
}
