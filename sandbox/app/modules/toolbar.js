/**
 * The toolbar above the navigator, and the selection head above the editor.
 *
 * The navigator's toolbar holds what the tree owns: what exists, and where it
 * sits. Making an entity, making a folder, ordering them and deleting them are
 * all changes to the tree, so they stand together above it. The editor's head
 * holds the one action on the content it shows, which is Edit.
 *
 * New folder acts on one press, since where the cursor is says everything
 * about where the folder goes. New opens the entity types, because filing no
 * longer says which type is wanted and there is nothing to default to. Related
 * opens the entities the metamodel lets the selection relate to.
 * Every action here is also in the right-click menu.
 *
 * Undo and redo stand apart from the rest: they act on the project as a whole
 * rather than on what the cursor is standing on, so they live in the shell.
 */

import { canStep, contextOf, createHere, describe, entityTypeMenuItems, relatedMenuItems } from './actions.js';
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
 * @param {() => void} context.onUndo
 * @param {() => void} context.onRedo
 * @param {() => {back: number, forward: number}} context.historyDepth
 * @param {import('./actions.js').Handlers} context.handlers
 */
export function createToolbar(context) {
  const { buttons, handlers } = context;

  buttons.new.addEventListener('click', (event) => {
    event.stopPropagation();
    openPopupMenu({
      anchor: buttons.new,
      items: entityTypeMenuItems(context.getModel(), context.getSelection(), handlers),
    });
  });

  buttons.newFolder.addEventListener('click', () => {
    handlers.createFolder(createHere(context.getModel(), context.getSelection()).parent);
  });

  buttons.related.addEventListener('click', (event) => {
    event.stopPropagation();
    openPopupMenu({ anchor: buttons.related, items: relatedMenuItems(context.getModel(), context.getSelection(), handlers) });
  });

  buttons.save.addEventListener('click', () => context.onSave());
  buttons.undo.addEventListener('click', () => context.onUndo());
  buttons.redo.addEventListener('click', () => context.onRedo());
  buttons.edit.addEventListener('click', () => handlers.edit());
  buttons.delete.addEventListener('click', () => handlers.remove());
  buttons.up.addEventListener('click', () => handlers.moveOrder(-1));
  buttons.down.addEventListener('click', () => handlers.moveOrder(1));

  function render() {
    const model = context.getModel();
    const selection = context.getSelection();
    const { entity, folderRecord } = contextOf(model, selection);
    const editable = Boolean(entity || folderRecord);

    // Both can always be made: there is nowhere in the tree they do not belong.
    buttons.new.disabled = false;
    buttons.newFolder.disabled = false;
    buttons.related.disabled = !entity;
    // Both actions name what they act on, since they stand over one thing at a
    // time and the label is all a tooltip gives.
    buttons.edit.disabled = !editable || context.isEditing();
    const editLabel = folderRecord ? 'Rename folder' : 'Edit attributes';
    buttons.edit.title = editLabel;
    buttons.edit.setAttribute('aria-label', editLabel);
    buttons.delete.disabled = !editable;
    const deleteLabel = folderRecord ? 'Delete folder' : 'Delete entity';
    buttons.delete.title = deleteLabel;
    buttons.delete.setAttribute('aria-label', deleteLabel);
    buttons.up.disabled = !canStep(model, selection, -1);
    buttons.down.disabled = !canStep(model, selection, 1);

    // The count says how far the arrow reaches, which is the one thing a user
    // cannot see from a greyed-out button alone.
    const { back, forward } = context.historyDepth();
    buttons.undo.disabled = back === 0;
    buttons.redo.disabled = forward === 0;
    buttons.undo.title = back === 0 ? 'Nothing to undo' : `Undo (${back} ${back === 1 ? 'step' : 'steps'})`;
    buttons.redo.title = forward === 0 ? 'Nothing to redo' : `Redo (${forward} ${forward === 1 ? 'step' : 'steps'})`;

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
