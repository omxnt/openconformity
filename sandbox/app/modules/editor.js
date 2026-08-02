/**
 * The editor pane: the attributes of the selected entity.
 *
 * The pane opens read-only. Nothing is written to the model until the user
 * presses Edit, changes something, and presses Save, so an entity cannot be
 * altered by landing on it and touching the keyboard. Cancel drops the draft.
 *
 * Which attributes exist comes from the metamodel. The folder is not an
 * attribute: it says where the entity is filed, not anything about the thing
 * itself, so it is shown apart from them.
 */

import { ENTITY_TYPES, attributesFor } from './metamodel.js';
import { childFolders, decompositionParent, displayLabel, setEntityFolder, updateEntity } from './model.js';
import { clear, el, icon } from './dom.js';

/**
 * @param {Object} context
 * @param {HTMLElement} context.headEl
 * @param {HTMLElement} context.bodyEl
 * @param {() => import('./model.js').Model} context.getModel
 * @param {() => string|null} context.getEntityId
 * @param {() => void} context.onStateChange  editing started or stopped
 * @param {() => void} context.onSaved
 */
export function createEditor(context) {
  let editing = false;
  /** @type {{ attributes: Object<string, string>, folder: string|null } | null} */
  let draft = null;

  function currentEntity() {
    const id = context.getEntityId();
    return id ? context.getModel().entities.get(id) ?? null : null;
  }

  function render() {
    const entity = currentEntity();

    clear(context.headEl);
    clear(context.bodyEl);

    if (!entity) {
      editing = false;
      draft = null;
      context.headEl.append(el('span', { class: 'head-kind', text: 'No entity selected' }));
      context.bodyEl.append(el('p', { class: 'empty', text: 'Select an entity in the navigator to see its attributes.' }));
      return;
    }

    const type = ENTITY_TYPES[entity.type];
    context.headEl.append(
      icon(type.icon),
      el('span', { class: 'head-kind', text: type.name }),
      el('span', { class: 'head-id', text: entity.id }),
      el('span', { class: 'head-name', text: displayLabel(entity) })
    );
    if (editing) context.headEl.append(el('span', { class: 'head-state', text: 'Editing' }));

    const values = editing && draft ? draft.attributes : entity.attributes;
    const fields = el('div', { class: 'fields' });

    fields.append(field('Identifier', readonlyInput(entity.id, true)));

    for (const attribute of attributesFor(entity.type)) {
      fields.append(field(attribute.label, control(attribute, values[attribute.key] ?? '')));
    }

    if (!decompositionParent(context.getModel(), entity.id)) {
      fields.append(field('Folder', folderControl(entity)));
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
    if (!editing) {
      if (attribute.kind === 'multiline') {
        const area = el('textarea', { class: 'input readonly', rows: '6', readonly: true, tabindex: '-1' });
        area.value = value;
        return area;
      }
      return readonlyInput(value, attribute.mono);
    }

    const commit = (event) => {
      if (draft) draft.attributes[attribute.key] = event.target.value;
    };

    if (attribute.kind === 'multiline') {
      const area = el('textarea', { class: 'input', rows: '6', oninput: commit });
      area.value = value;
      return area;
    }
    const input = el('input', { class: `input${attribute.mono ? ' mono' : ''}`, type: 'text', oninput: commit });
    input.value = value;
    return input;
  }

  /**
   * @param {import('./model.js').Entity} entity
   */
  function folderControl(entity) {
    const model = context.getModel();
    const selected = editing && draft ? draft.folder : entity.folder;

    if (!editing) {
      const folder = selected ? model.folders.get(selected) : null;
      return readonlyInput(folder ? folderPath(model, folder) : `${ENTITY_TYPES[entity.type].plural} (no folder)`);
    }

    const select = el('select', { class: 'input', onchange: (event) => {
      if (draft) draft.folder = event.target.value || null;
    } }, [el('option', { value: '', text: `${ENTITY_TYPES[entity.type].plural} (no folder)` })]);

    const walk = (parent, depth) => {
      for (const folder of childFolders(model, entity.type, parent)) {
        select.append(el('option', { value: folder.id, text: `${'  '.repeat(depth)}${folder.name}` }));
        walk(folder.id, depth + 1);
      }
    };
    walk(null, 1);

    select.value = selected ?? '';
    return select;
  }

  /**
   * @param {import('./model.js').Model} model
   * @param {import('./model.js').Folder} folder
   */
  function folderPath(model, folder) {
    const parts = [folder.name];
    let current = folder.parent ? model.folders.get(folder.parent) : null;
    while (current) {
      parts.unshift(current.name);
      current = current.parent ? model.folders.get(current.parent) : null;
    }
    return `${ENTITY_TYPES[folder.type].plural} / ${parts.join(' / ')}`;
  }

  function buttons() {
    if (!editing) {
      return el('div', { class: 'field-buttons' }, [
        el('button', { type: 'button', class: 'button', text: 'Edit', onclick: begin }),
      ]);
    }
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
    draft = { attributes: { ...entity.attributes }, folder: entity.folder };
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
    updateEntity(context.getModel(), entity.id, draft.attributes);
    setEntityFolder(context.getModel(), entity.id, draft.folder);
    editing = false;
    draft = null;
    context.onSaved();
    context.onStateChange();
  }

  /** Whether the draft differs from what is in the model. */
  function hasChanges() {
    const entity = currentEntity();
    if (!editing || !entity || !draft) return false;
    if (draft.folder !== entity.folder) return true;
    return attributesFor(entity.type).some((attribute) => draft.attributes[attribute.key] !== entity.attributes[attribute.key]);
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
