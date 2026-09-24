/**
 * What the actions mean depends on where the user is standing in the
 * navigator. This module turns a selection into the actions that belong to it,
 * and the toolbar, the menu bar and the right-click menu are all built from it,
 * so the three offer the same thing.
 *
 * Creating is split three ways, because the kinds of "new" answer different
 * questions:
 *
 *   New              an entity of a type the user picks, filed where the
 *                    cursor is
 *   New folder       a folder to group things in, made where the cursor is
 *   New related      an entity the metamodel lets this one relate to, and the
 *                    relationship with it
 *
 * Only the third consults the metamodel. Where a thing is filed is the user's
 * choice, so the first two ask nothing of it.
 */

import { ENTITY_TYPES, entityTypesByPillar } from './metamodel.js';
import {
  availableRelationships,
  canMoveNode,
  childEntities,
  childFolders,
  labelOf,
  siblingsOf,
} from './model.js';

/**
 * @typedef {import('./navigator.js').Selection} Selection
 *
 * @typedef {Object} Handlers
 * @property {(code: string, options?: {parent?: string|null}) => void} createEntity
 * @property {(parent: string|null) => void} createFolder
 * @property {(relationshipTypeId: string, direction: 'outgoing'|'incoming') => void} createRelated
 * @property {() => void} addRelationship
 * @property {() => void} edit
 * @property {(delta: -1|1) => void} moveOrder
 * @property {() => void} move
 * @property {() => void} remove
 */

/**
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 */
export function contextOf(model, selection) {
  if (selection.kind === 'entity') {
    const entity = model.entities.get(selection.id) ?? null;
    return { parent: entity?.parent ?? null, entity, folderRecord: null };
  }
  if (selection.kind === 'folder') {
    const folder = model.folders.get(selection.id) ?? null;
    return { parent: folder?.id ?? null, entity: null, folderRecord: folder };
  }
  return { parent: null, entity: null, folderRecord: null };
}

/**
 * A short description of what the user is standing on.
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 */
export function describe(model, selection) {
  const { entity, folderRecord } = contextOf(model, selection);
  if (entity) {
    const type = ENTITY_TYPES[entity.type];
    return { iconId: type.icon, pillar: type.pillar, kind: type.name, id: entity.id, label: labelOf(entity) };
  }
  if (folderRecord) return { iconId: 'i-folder', kind: 'Folder', id: '', label: folderRecord.name };
  return { iconId: 'i-project', kind: 'Project', id: '', label: model.name };
}

/**
 * Where something new is filed: inside whatever the cursor is standing on. A
 * folder and an entity both hold things, so both take it inside them; on the
 * project it goes at the top of the tree. An entity and a folder go to the same
 * place, so there is one answer for both. There is nowhere it cannot go, so
 * this never refuses.
 *
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @returns {{ parent: string|null }}
 */
export function createHere(model, selection) {
  const { entity, folderRecord } = contextOf(model, selection);
  if (entity) return { parent: entity.id };
  if (folderRecord) return { parent: folderRecord.id };
  return { parent: null };
}

/**
 * The entities the metamodel lets the selected one relate to, in either
 * direction, each creating the entity and the relationship together.
 *
 * The two directions are headed the way the relationship list names them, so
 * the same word means the same thing wherever a relationship is read or made.
 * Neither heading repeats which entity it is relative to: the tree and the bar
 * above the editor both name that already.
 *
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @param {Handlers} handlers
 * @returns {import('./menu.js').MenuItem[]}
 */
export function relatedMenuItems(model, selection, handlers) {
  const { entity } = contextOf(model, selection);
  if (!entity) return [];

  const items = [];
  const options = availableRelationships(entity.type);

  for (const [heading, direction] of [['Outgoing', 'outgoing'], ['Incoming', 'incoming']]) {
    const group = options.filter((option) => option.direction === direction);
    if (group.length === 0) continue;
    items.push({ heading });
    for (const { type } of group) {
      const other = ENTITY_TYPES[direction === 'outgoing' ? type.target : type.source];
      items.push({
        label: other.name,
        iconId: other.icon,
        pillar: other.pillar,
        shortcut: type.label,
        action: () => handlers.createRelated(type.id, direction),
      });
    }
  }
  return items;
}

/**
 * Which entity to make. Nothing about where the cursor is narrows this any
 * more, so it is every type the metamodel defines, under the pillar headings
 * the diagram groups them by. Eighteen names in one alphabetical run are read
 * end to end; four short groups are scanned, and a user who knows they want a
 * hazard finds it under Risk Assessment without reading the rest.
 *
 * The heading names a group in the diagram, not a level in the model: nothing
 * is filed by it, and no entity carries it.
 *
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @param {Handlers} handlers
 * @returns {import('./menu.js').MenuItem[]}
 */
export function entityTypeMenuItems(model, selection, handlers) {
  const here = createHere(model, selection);
  const items = [];
  for (const group of entityTypesByPillar()) {
    items.push({ heading: group.pillar });
    for (const type of group.types) {
      items.push({
        label: type.name,
        iconId: type.icon,
        pillar: type.pillar,
        shortcut: type.code,
        action: () => handlers.createEntity(type.code, here),
      });
    }
  }
  return items;
}

/**
 * Whether the selection can be stepped one place up or down.
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @param {-1|1} delta
 */
export function canStep(model, selection, delta) {
  if (selection.kind !== 'entity' && selection.kind !== 'folder') return false;
  const siblings = siblingsOf(model, selection.id);
  const index = siblings.findIndex((item) => item.id === selection.id);
  return index >= 0 && Boolean(siblings[index + delta]);
}

/**
 * Every action that acts on what the cursor is standing on, in one list. The
 * Edit menu and the right-click menu are both built from it, so an action
 * cannot appear in one and be forgotten in the other, and the toolbars carry
 * the subset used often enough to deserve a button.
 *
 * What does not belong here is anything that acts on the project as a whole:
 * undo, redo and renaming the project are added by the Edit menu around this
 * list, and are not offered on a right click, which asks about one thing.
 *
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @param {Handlers} handlers
 * @returns {import('./menu.js').MenuItem[]}
 */
export function selectionActionItems(model, selection, handlers) {
  const items = [];
  const { entity, folderRecord } = contextOf(model, selection);
  const here = createHere(model, selection);
  const related = relatedMenuItems(model, selection, handlers);

  items.push({
    label: 'New entity',
    iconId: 'i-new-entity',
    submenu: entityTypeMenuItems(model, selection, handlers),
  });
  if (related.length > 0) {
    items.push({ label: 'New related entity', iconId: 'i-new-related', submenu: related });
  }
  items.push({ label: 'New folder', iconId: 'i-new-folder', action: () => handlers.createFolder(here.parent) });

  // Relating an entity to one that already exists is a different act from
  // making a new one, so it stands apart from the three above it.
  if (entity) {
    items.push({ separator: true });
    items.push({ label: 'Add relationship', iconId: 'i-add-relationship', action: handlers.addRelationship });
  }

  if (entity || folderRecord) {
    items.push({ separator: true });
    items.push({ label: entity ? 'Edit attributes' : 'Rename folder', iconId: 'i-edit', action: handlers.edit });
    items.push({ label: 'Move up', iconId: 'i-move-up', shortcut: 'Alt ↑', disabled: !canStep(model, selection, -1), action: () => handlers.moveOrder(-1) });
    items.push({ label: 'Move down', iconId: 'i-move-down', shortcut: 'Alt ↓', disabled: !canStep(model, selection, 1), action: () => handlers.moveOrder(1) });
    const destinations = moveTargets(model, selection);
    items.push({
      label: 'Move to…',
      iconId: 'i-move-to',
      disabled: destinations.length === 0,
      title: destinations.length === 0 ? 'There is nowhere else to file it.' : undefined,
      action: handlers.move,
    });
    items.push({ separator: true });
    items.push({ label: entity ? 'Delete entity' : 'Delete folder', iconId: 'i-delete', danger: true, shortcut: 'Del', action: handlers.remove });
  }
  return items;
}

/**
 * The right-click menu: everything that applies to the thing under the
 * pointer, and nothing that does not.
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @param {Handlers} handlers
 * @returns {import('./menu.js').MenuItem[]}
 */
export function contextMenuItems(model, selection, handlers) {
  return selectionActionItems(model, selection, handlers);
}

/**
 * Every folder the selection could be filed in, for the move dialog. Dragging
 * covers the same ground with a pointer; this is how it is reached without one.
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @returns {Array<{ target: import('./model.js').MoveTarget, label: string, depth: number }>}
 */
export function moveTargets(model, selection) {
  const { entity, folderRecord } = contextOf(model, selection);
  if (!entity && !folderRecord) return [];

  const targets = [];
  const offer = (target, label, depth) => {
    const check = canMoveNode(model, entity ? entity.id : folderRecord.id, target);
    if (check.ok) targets.push({ target, label, depth });
  };

  offer({ kind: 'root', id: '' }, model.name, 0);

  // An entity holds things as a folder does, so both are offered as places to
  // file into, in the order the tree draws them.
  const walk = (parent, depth) => {
    for (const folder of childFolders(model, parent)) {
      offer({ kind: 'folder', id: folder.id }, folder.name, depth);
      walk(folder.id, depth + 1);
    }
    for (const each of childEntities(model, parent)) {
      offer({ kind: 'entity', id: each.id }, `${each.id}  ${labelOf(each)}`, depth);
      walk(each.id, depth + 1);
    }
  };
  walk(null, 1);

  return targets;
}
