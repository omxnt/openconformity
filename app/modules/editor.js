/**
 * The editor pane: the attributes of the selected entity.
 *
 * The pane opens read-only. Nothing is written to the model until the user
 * starts editing from the toolbar, the Edit menu or the right-click menu,
 * changes something, and presses Save, so an entity cannot be altered by
 * landing on it and touching the keyboard. Cancel drops the draft.
 *
 * The pane does not repeat the name of what is being edited. The toolbar names
 * the selection once, directly above, and the Name field holds it below.
 *
 * Which attributes exist comes from the metamodel, and only those are shown.
 * Where an entity is filed is not one of them: that is a property of the tree,
 * changed by dragging or by Move to….
 */

import { attributesFor, storedAttributesFor } from './metamodel.js';
import { updateEntity } from './model.js';
import { clear, el } from './dom.js';

/**
 * @param {Object} context
 * @param {HTMLElement} context.bodyEl
 * @param {() => import('./model.js').Model} context.getModel
 * @param {() => string|null} context.getEntityId
 * @param {() => void} context.onStateChange  editing started or stopped
 * @param {() => void} context.onSaved
 */
export function createEditor(context) {
  let editing = false;
  /** @type {Object<string, string> | null} */
  let draft = null;

  function currentEntity() {
    const id = context.getEntityId();
    return id ? context.getModel().entities.get(id) ?? null : null;
  }

  function render() {
    const entity = currentEntity();
    clear(context.bodyEl);

    if (!entity) {
      editing = false;
      draft = null;
      context.bodyEl.append(el('p', { class: 'empty', text: 'Select an entity in the navigator to see its attributes.' }));
      return;
    }

    const values = editing && draft ? draft : entity.attributes;
    const fields = el('div', { class: 'fields' });

    fields.append(field('Identifier', readonlyInput(entity.id, true)));
    for (const attribute of attributesFor(entity.type)) {
      if (attribute.kind === 'risk') fields.append(riskField(attribute, values));
      else fields.append(field(attribute.label, control(attribute, values[attribute.key] ?? '')));
    }

    context.bodyEl.append(fields, buttons());
  }

  /**
   * @param {string} label
   * @param {HTMLElement} input
   */
  function field(label, input) {
    const id = `field-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
    input.id = id;
    return el('div', { class: `field${input.tagName === 'TEXTAREA' ? ' field-tall' : ''}` }, [
      el('label', { class: 'field-label', for: id, text: label }),
      input,
    ]);
  }

  /**
   * @param {string} value
   * @param {boolean} [mono]
   */
  function readonlyInput(value, mono) {
    const input = el('input', { class: `input readonly${mono ? ' mono' : ''}`, readonly: true, tabindex: '-1' });
    input.value = value;
    return input;
  }

  /**
   * @param {import('./metamodel.js').Attribute} attribute
   * @param {string} value
   */
  function control(attribute, value) {
    const rows = attribute.key === 'description' || attribute.key === 'requirement' ? '5' : '3';

    if (!editing) {
      if (attribute.kind === 'multiline') {
        const area = el('textarea', { class: 'input readonly', rows, readonly: true, tabindex: '-1' });
        area.value = value;
        return area;
      }
      return readonlyInput(value, attribute.mono);
    }

    const commit = (event) => {
      if (draft) draft[attribute.key] = event.target.value;
    };

    if (attribute.kind === 'multiline') {
      const area = el('textarea', { class: 'input', rows, oninput: commit });
      area.value = value;
      return area;
    }
    if (attribute.kind === 'choice') {
      const select = el('select', { class: 'input', onchange: commit }, [
        el('option', { value: '', text: '—' }),
        ...(attribute.values ?? []).map((choice) => el('option', { value: choice, text: choice })),
      ]);
      select.value = (attribute.values ?? []).includes(value) ? value : '';
      return select;
    }
    const input = el('input', { class: `input${attribute.mono ? ' mono' : ''}`, type: 'text', oninput: commit });
    input.value = value;
    return input;
  }

  /**
   * The risk rating before and after the risk reduction measures. What a rating
   * is has not been specified, so this is a marked placeholder: it shows the
   * movement either way, and takes whatever the user types.
   * @param {import('./metamodel.js').Attribute} attribute
   * @param {Object<string, string>} values
   */
  function riskField(attribute, values) {
    const step = (key, caption) => {
      const holder = el('span', { class: 'risk-step' }, [el('span', { class: 'risk-step-label', text: caption })]);
      if (editing) {
        const input = el('input', {
          class: 'input mono risk-input',
          type: 'text',
          'aria-label': `${caption} the risk reduction measures`,
          oninput: (event) => {
            if (draft) draft[key] = event.target.value;
          },
        });
        input.value = values[key] ?? '';
        holder.append(input);
      } else {
        holder.append(el('span', { class: 'risk-value', text: values[key] || '—' }));
      }
      return holder;
    };

    return el('div', { class: 'field field-tall' }, [
      el('span', { class: 'field-label', text: attribute.label }),
      el('div', { class: 'placeholder' }, [
        el('span', { class: 'placeholder-tag', text: 'Placeholder' }),
        el('div', { class: 'risk-row' }, [
          step(attribute.parts[0], 'Before'),
          el('span', { class: 'risk-arrow', text: '→', 'aria-hidden': 'true' }),
          step(attribute.parts[1], 'After'),
        ]),
        el('p', { class: 'placeholder-note', text: 'How a risk is rated is not specified yet.' }),
      ]),
    ]);
  }

  /** Only shown while editing: entering edit mode is a toolbar action. */
  function buttons() {
    if (!editing) return el('span');
    return el('div', { class: 'field-buttons' }, [
      el('button', { type: 'button', class: 'button primary', text: 'Save', onclick: save }),
      el('button', { type: 'button', class: 'button', text: 'Cancel', onclick: cancel }),
    ]);
  }

  // --- Edit lifecycle --------------------------------------------------

  function begin() {
    const entity = currentEntity();
    if (!entity || editing) return;
    editing = true;
    draft = { ...entity.attributes };
    render();
    context.onStateChange();
    context.bodyEl.querySelector('.input:not(.readonly)')?.focus();
  }

  function cancel() {
    if (!editing) return;
    editing = false;
    draft = null;
    render();
    context.onStateChange();
  }

  function save() {
    const entity = currentEntity();
    if (!editing || !entity || !draft) return;
    updateEntity(context.getModel(), entity.id, draft);
    editing = false;
    draft = null;
    context.onSaved();
    context.onStateChange();
  }

  /** Whether the draft differs from what is in the model. */
  function hasChanges() {
    const entity = currentEntity();
    if (!editing || !entity || !draft) return false;
    return storedAttributesFor(entity.type).some((attribute) => draft[attribute.key] !== entity.attributes[attribute.key]);
  }

  return {
    render,
    begin,
    cancel,
    save,
    hasChanges,
    isEditing: () => editing,
  };
}
