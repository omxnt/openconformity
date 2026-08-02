/**
 * The toolbar above the navigator and the editor: create, edit, delete.
 *
 * The buttons follow the selection. What "new" offers, and whether "edit" and
 * "delete" apply at all, is decided by actions.js from where the user is
 * standing in the tree.
 */

import { contextOf, describe, newMenuItems } from './actions.js';
import { openPopupMenu } from './menu.js';

/**
 * @param {Object} context
 * @param {HTMLElement} context.newButtonEl
 * @param {HTMLElement} context.editButtonEl
 * @param {HTMLElement} context.deleteButtonEl
 * @param {HTMLElement} context.contextEl
 * @param {() => import('./model.js').Model} context.getModel
 * @param {() => import('./navigator.js').Selection} context.getSelection
 * @param {() => boolean} context.isEditing
 * @param {import('./actions.js').Handlers} context.handlers
 */
export function createToolbar(context) {
  context.newButtonEl.addEventListener('click', (event) => {
    event.stopPropagation();
    openPopupMenu({
      anchor: context.newButtonEl,
      items: newMenuItems(context.getModel(), context.getSelection(), context.handlers),
    });
  });

  context.editButtonEl.addEventListener('click', () => context.handlers.edit());
  context.deleteButtonEl.addEventListener('click', () => context.handlers.remove());

  function render() {
    const model = context.getModel();
    const selection = context.getSelection();
    const { entity, folderRecord } = contextOf(model, selection);
    const editable = Boolean(entity || folderRecord);

    context.newButtonEl.disabled = newMenuItems(model, selection, context.handlers).length === 0;
    context.editButtonEl.disabled = !editable || context.isEditing();
    context.deleteButtonEl.disabled = !editable;
    context.editButtonEl.textContent = folderRecord ? 'Rename' : 'Edit';
    context.contextEl.textContent = describe(model, selection);
  }

  return { render };
}
