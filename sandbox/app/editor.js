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

import { ATTRIBUTES, attributesFor } from './attributes.js';
import { nodeOf } from './model.js';
import { ENTITY_TYPES } from './metamodel.js';
import { TYPE_ICONS, FOLDER_ICON, PROJECT_ICON } from './icons.js';
import { el, icon } from './dom.js';
import { entityLabel } from './queries.js';

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
 * Whether a hyperlink value may be presented as a link. Only the web
 * schemes are followed: anything else — a `javascript:` value above all
 * — renders as the text it is, so rendering can never arm what a user
 * typed or a file carried.
 * @param {string} value
 * @returns {boolean}
 */
export function linkable(value) {
  return /^https?:\/\/\S/i.test((value ?? '').trim());
}

/**
 * The ways into a project, offered from the editor's no-project state —
 * the one place the buttons live. A test pins this table to the action
 * list, so the two cannot drift.
 */
export const LANDING_OFFER = [
  { id: 'new-project', icon: 'i-new-project', label: 'New project' },
  { id: 'open', icon: 'i-open-project', label: 'Open project…' },
  { id: 'load-example', icon: 'i-project', label: 'Load example' },
];

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {HTMLElement} context.head
 * @param {HTMLElement} context.body
 * @param {(id: string|null, values: Object<string, string>) => boolean} context.onSave
 * @param {() => void} context.onCancel
 * @param {() => void} context.onRename
 * @param {(event: KeyboardEvent) => void} [context.onEscape]
 * @param {(id: string) => void} [context.onAction]  runs a landing action by identifier, resolved at click time
 */
export function createEditor({ store, head, body, onSave, onCancel, onRename, onEscape = () => {}, onAction = () => {} }) {
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
      const label = entityLabel(node);
      if (label) parts.push(el('span', { className: 'subhead-title', text: label }));
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
   * A field's own class: a value that runs long — a multiline or a
   * hyperlink — takes the width of both columns, and so begins a row.
   * Inside a pair the row is already the pair's, so nothing spans.
   * @param {{ kind: string }} definition
   * @param {boolean} [paired]
   */
  function fieldClass(definition) {
    const wide = definition.kind === 'multiline' || definition.kind === 'hyperlink';
    return `field${wide ? ' field-tall' : ''}`;
  }

  /**
   * One run of definitions as a grid of fields.
   * @param {Array<Object>} definitions
   * @param {Object<string, string>} values
   * @param {(definition: Object, value: string|undefined) => HTMLElement} cell
   */
  function fieldGrid(definitions, values, cell) {
    return el('div', { className: 'fields' }, definitions.map((definition) => cell(definition, values[definition.key])));
  }

  /**
   * A type's whole form: the ungrouped fields where a type has them,
   * then each group under its own heading. A group is a heading over its
   * fields and nothing more — Carbon's fieldset and legend — so nothing
   * a reader came for sits behind a control.
   * @param {string} code
   * @param {Object<string, string>} values
   * @param {(definition: Object, value: string|undefined) => HTMLElement} cell
   */
  function layOut(code, values, cell) {
    const type = ATTRIBUTES[code] ?? { attributes: [], groups: [] };
    const held = el('div', { className: 'form' });
    if (type.attributes.length > 0) held.appendChild(fieldGrid(type.attributes, values, cell));
    for (const group of type.groups) {
      held.appendChild(
        el('fieldset', { className: 'field-group' }, [
          el('legend', { className: 'group-legend', text: group.name }),
          fieldGrid(group.attributes, values, cell),
        ])
      );
    }
    return held;
  }

  /** One field as the view mode shows it. */
  function viewCell(definition, value) {
    return el('div', { className: fieldClass(definition) }, [
      el('div', { className: 'field-label', text: definition.name }),
      viewValue(definition, value),
    ]);
  }

  /** One field as the edit mode offers it. */
  function editCell(definition, value) {
    return el('div', { className: fieldClass(definition) }, [
      el('label', {
        className: 'field-label',
        text: definition.name,
        attributes: { for: `field-${definition.key}` },
      }),
      control(definition, value ?? ''),
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

  /**
   * A value as the view mode shows it: a followable hyperlink as a link
   * in a new tab, a multiline value keeping its breaks, anything else as
   * its text; an unset value as the em dash.
   * @param {{ kind: string }} definition
   * @param {string|undefined} value
   */
  function viewValue(definition, value) {
    if (value === undefined || value === '') {
      return el('div', { className: 'field-value field-empty', text: '–' });
    }
    if (definition.kind === 'hyperlink' && linkable(value)) {
      const address = value.trim();
      return el('div', { className: 'field-value' }, [
        el('a', {
          text: address,
          attributes: { href: address, target: '_blank', rel: 'noopener' },
        }),
      ]);
    }
    return el('div', {
      className: `field-value${definition.kind === 'multiline' ? ' multiline' : ''}`,
      text: value,
    });
  }

  /** An icon-only head action, neutral with a tooltip, like the toolbar's. */
  function headIconButton(label, iconId, onPick) {
    const button = el(
      'button',
      { className: 'ghost-button ghost-icon', attributes: { type: 'button', title: label, 'aria-label': label } },
      [icon(iconId)]
    );
    button.addEventListener('click', onPick);
    return button;
  }

  /**
   * Save and Cancel in the head, exactly as the relationship pane's Done
   * and Cancel sit in its head: primary and ghost at the head's 32px.
   */
  function saveCancel(onSavePick) {
    const save = el('button', { className: 'form-button button-primary', text: 'Save', attributes: { type: 'button' } });
    save.addEventListener('click', onSavePick);
    const cancel = el('button', { className: 'ghost-button', text: 'Cancel', attributes: { type: 'button' } });
    cancel.addEventListener('click', onCancel);
    return [save, cancel];
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
      select.appendChild(el('option', { text: '–', attributes: { value: '' } }));
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
    head.appendChild(el('div', { className: 'pane-head-actions' }, [headIconButton('Edit attributes', 'i-edit', beginEdit)]));
    body.appendChild(fieldGrid(PROJECT_FIELDS, projectValues(), viewCell));
  }

  function renderProjectEdit() {
    head.hidden = false;
    head.appendChild(projectHeadName());
    head.appendChild(
      el('div', { className: 'pane-head-actions' }, saveCancel(() => {
        if (onSave(null, fieldValues()) !== false) endEdit();
      }))
    );
    body.appendChild(fieldGrid(PROJECT_FIELDS, projectValues(), editCell));
  }

  function renderView(node) {
    renderHead(node, [headIconButton('Edit attributes', 'i-edit', beginEdit)]);
    body.appendChild(layOut(node.type, node.attributes, viewCell));
  }

  function renderEdit(node) {
    renderHead(node, saveCancel(() => {
      if (onSave(editingId, fieldValues()) !== false) endEdit();
    }));
    body.appendChild(layOut(node.type, node.attributes, editCell));
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
      const landing = emptyState(
        'No project',
        'Create a project, open one saved as a file, or look around the example. Everything stays in this browser until you save it to a file.'
      );
      for (const offer of LANDING_OFFER) {
        const button = el(
          'button',
          { className: 'ghost-button', attributes: { type: 'button', 'data-action': `landing-${offer.id}` } },
          [icon(offer.icon), el('span', { text: offer.label })]
        );
        button.addEventListener('click', () => onAction(offer.id));
        landing.appendChild(button);
      }
      body.appendChild(landing);
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
