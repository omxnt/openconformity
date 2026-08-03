/**
 * The toolbar above the navigator and the editor.
 *
 * New and New folder act on one press: what they make is decided by where the
 * user is standing, not by a menu. Related opens the entities the metamodel
 * lets the selection relate to, since that is a choice rather than a default.
 * Every action here is also in the right-click menu and in the Edit menu.
 */

import { ENTITY_TYPES } from './metamodel.js';
import { canStep, contextOf, createHere, describe, folderHere, pillarMenuItems, relatedMenuItems } from './actions.js';
import { openPopupMenu } from './menu.js';
import { clear, el, icon } from './dom.js';

/**
 * @param {Object} context
 * @param {Object<string, HTMLElement>} context.buttons
 * @param {HTMLElement} context.contextEl
 * @param {() => import('./model.js').Model} context.getModel
 * @param {() => import('./navigator.js').Selection} context.getSelection
 * @param {() => boolean} context.isEditing
 * @param {() => boolean} context.isUnsaved
 * @param {() => void} context.onSave
 * @param {import('./actions.js').Handlers} context.handlers
 */
export function createToolbar(context) {
  const { buttons, handlers } = context;

  buttons.new.addEventListener('click', (event) => {
    const model = context.getModel();
    const selection = context.getSelection();
    const here = createHere(model, selection);
    if (here) {
      handlers.createEntity(here.typeCode, here);
      return;
    }
    // A pillar holds four types, so there is nothing to default to.
    const choices = pillarMenuItems(model, selection, handlers);
    if (choices.length > 0) {
      event.stopPropagation();
      openPopupMenu({ anchor: buttons.new, items: choices });
    }
  });

  buttons.newFolder.addEventListener('click', () => {
    const folder = folderHere(context.getModel(), context.getSelection());
    if (folder) handlers.createFolder(folder.typeCode, folder.parent);
  });

  buttons.related.addEventListener('click', (event) => {
    event.stopPropagation();
    openPopupMenu({ anchor: buttons.related, items: relatedMenuItems(context.getModel(), context.getSelection(), handlers) });
  });

  buttons.save.addEventListener('click', () => context.onSave());
  buttons.edit.addEventListener('click', () => handlers.edit());
  buttons.delete.addEventListener('click', () => handlers.remove());
  buttons.up.addEventListener('click', () => handlers.moveOrder(-1));
  buttons.down.addEventListener('click', () => handlers.moveOrder(1));

  function render() {
    const model = context.getModel();
    const selection = context.getSelection();
    const { entity, folderRecord } = contextOf(model, selection);
    const here = createHere(model, selection);
    const folder = folderHere(model, selection);
    const editable = Boolean(entity || folderRecord);

    buttons.new.disabled = !here && pillarMenuItems(model, selection, handlers).length === 0;
    const newLabel = here ? `New ${ENTITY_TYPES[here.typeCode].name}` : 'New entity';
    buttons.new.title = newLabel;
    buttons.new.setAttribute('aria-label', newLabel);
    buttons.newFolder.disabled = !folder;
    buttons.related.disabled = !entity;
    buttons.edit.disabled = !editable || context.isEditing();
    const editLabel = folderRecord ? 'Rename folder' : 'Edit attributes';
    buttons.edit.title = editLabel;
    buttons.edit.setAttribute('aria-label', editLabel);
    buttons.delete.disabled = !editable;
    buttons.up.disabled = !canStep(model, selection, -1);
    buttons.down.disabled = !canStep(model, selection, 1);

    buttons.unsaved.hidden = !context.isUnsaved();

    const where = describe(model, selection);
    clear(context.contextEl);
    context.contextEl.append(
      icon(where.iconId, where.pillar),
      el('span', { class: 'tb-kind', text: where.kind }),
      where.id ? el('span', { class: 'tb-id', text: where.id }) : el('span'),
      el('span', { class: 'tb-name', text: where.label })
    );
  }

  return { render };
}
