/**
 * What the actions mean depends on where the user is standing in the
 * navigator. This module turns a selection into the actions that belong to it,
 * and the toolbar, the menu bar and the right-click menu are all built from it,
 * so the three offer the same thing.
 *
 * Creating is split three ways, because the two kinds of "new" answer different
 * questions:
 *
 *   New              another entity of the type the level holds, filed here
 *   New folder       a folder to group them in
 *   New related      an entity the metamodel lets this one relate to, and the
 *                    relationship with it
 *
 * A System Element decomposing into another System Element is a composition, so
 * it belongs to the third, not the first.
 */

import { ENTITY_TYPES, PILLARS, selfComposition, typesInPillar } from './metamodel.js';
import {
  availableRelationships,
  canMoveEntity,
  canMoveFolder,
  childFolders,
  decompositionParent,
  labelOf,
  folderSiblingsOf,
  siblingsOf,
} from './model.js';

/**
 * @typedef {import('./navigator.js').Selection} Selection
 *
 * @typedef {Object} Handlers
 * @property {(code: string, options?: {owner?: string|null, folder?: string|null, after?: string|null}) => void} createEntity
 * @property {(typeCode: string, parent: string|null) => void} createFolder
 * @property {(relationshipTypeId: string, direction: 'outgoing'|'incoming') => void} createRelated
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
    return { typeCode: entity?.type ?? null, folder: entity?.folder ?? null, entity, folderRecord: null };
  }
  if (selection.kind === 'folder') {
    const folder = model.folders.get(selection.id) ?? null;
    return { typeCode: folder?.type ?? null, folder: folder?.id ?? null, entity: null, folderRecord: folder };
  }
  if (selection.kind === 'type') {
    return { typeCode: selection.id, folder: null, entity: null, folderRecord: null };
  }
  return { typeCode: null, folder: null, entity: null, folderRecord: null };
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
  if (selection.kind === 'type') return { iconId: 'i-folder', kind: 'Entity type', id: '', label: ENTITY_TYPES[selection.id].plural };
  if (selection.kind === 'pillar') {
    const pillar = PILLARS.find((candidate) => candidate.id === selection.id);
    return { iconId: pillar?.icon ?? 'i-folder', pillar: pillar?.id, kind: 'Pillar', id: '', label: pillar?.name ?? '' };
  }
  return { iconId: 'i-project', kind: 'Project', id: '', label: model.name };
}

/**
 * What a single press of New makes here, or null when the level holds no
 * entities of its own.
 *
 * Standing on an entity, it goes inside: where the metamodel gives the type a
 * decomposition, the new one hangs off the selected entity. Types that do not
 * decompose have no inside, so there it lands alongside instead.
 *
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @returns {{ typeCode: string, folder: string|null, owner: string|null, after: string|null } | null}
 */
export function createHere(model, selection) {
  const { entity, folderRecord } = contextOf(model, selection);
  if (entity) {
    if (selfComposition(entity.type)) {
      return { typeCode: entity.type, folder: entity.folder, owner: entity.id, after: null };
    }
    return {
      typeCode: entity.type,
      folder: entity.folder,
      owner: decompositionParent(model, entity.id)?.id ?? null,
      after: entity.id,
    };
  }
  if (folderRecord) return { typeCode: folderRecord.type, folder: folderRecord.id, owner: null, after: null };
  if (selection.kind === 'type') return { typeCode: selection.id, folder: null, owner: null, after: null };
  return null;
}

/**
 * Where a new folder would go, or null when folders do not belong here.
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @returns {{ typeCode: string, parent: string|null } | null}
 */
export function folderHere(model, selection) {
  const { entity, folderRecord } = contextOf(model, selection);
  if (entity) return { typeCode: entity.type, parent: entity.folder };
  if (folderRecord) return { typeCode: folderRecord.type, parent: folderRecord.id };
  if (selection.kind === 'type') return { typeCode: selection.id, parent: null };
  return null;
}

/**
 * The entities the metamodel lets the selected one relate to, in either
 * direction, each creating the entity and the relationship together.
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

  for (const [heading, direction] of [[`From ${entity.id}`, 'outgoing'], [`Into ${entity.id}`, 'incoming']]) {
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
 * The pillar level holds four entity types rather than one, so New there asks
 * which before it makes anything.
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @param {Handlers} handlers
 * @returns {import('./menu.js').MenuItem[]}
 */
export function pillarMenuItems(model, selection, handlers) {
  if (selection.kind !== 'pillar') return [];
  return typesInPillar(selection.id).map((type) => ({
    label: type.name,
    iconId: type.icon,
    pillar: type.pillar,
    shortcut: type.code,
    action: () => handlers.createEntity(type.code),
  }));
}

/**
 * Whether the selection can be stepped one place up or down.
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @param {-1|1} delta
 */
export function canStep(model, selection, delta) {
  if (selection.kind !== 'entity' && selection.kind !== 'folder') return false;
  const siblings = selection.kind === 'entity' ? siblingsOf(model, selection.id) : folderSiblingsOf(model, selection.id);
  const index = siblings.findIndex((item) => item.id === selection.id);
  return index >= 0 && Boolean(siblings[index + delta]);
}

/**
 * The right-click menu. It carries the same actions as the toolbar and the
 * menu bar, so nothing is reachable from only one of the three.
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @param {Handlers} handlers
 * @returns {import('./menu.js').MenuItem[]}
 */
export function contextMenuItems(model, selection, handlers) {
  const items = [];
  const { entity, folderRecord } = contextOf(model, selection);
  const here = createHere(model, selection);
  const folder = folderHere(model, selection);
  const related = relatedMenuItems(model, selection, handlers);
  const pillar = pillarMenuItems(model, selection, handlers);

  if (here) {
    const type = ENTITY_TYPES[here.typeCode];
    items.push({
      label: 'New entity',
      iconId: 'i-new-entity',
      title: `New ${type.name}`,
      action: () => handlers.createEntity(here.typeCode, here),
    });
  }
  if (pillar.length > 0) {
    items.push({ heading: 'New entity' }, ...pillar);
  }
  if (folder) {
    items.push({ label: 'New folder', iconId: 'i-new-folder', action: () => handlers.createFolder(folder.typeCode, folder.parent) });
  }
  if (related.length > 0) {
    items.push({ label: 'New related', iconId: 'i-new-related', submenu: related });
  }

  if (entity || folderRecord) {
    items.push({ separator: true });
    items.push({ label: entity ? 'Edit attributes' : 'Rename folder', iconId: 'i-edit', action: handlers.edit });
    items.push({ label: 'Move up', iconId: 'i-move-up', shortcut: 'Alt ↑', disabled: !canStep(model, selection, -1), action: () => handlers.moveOrder(-1) });
    items.push({ label: 'Move down', iconId: 'i-move-down', shortcut: 'Alt ↓', disabled: !canStep(model, selection, 1), action: () => handlers.moveOrder(1) });
    const destinations = moveTargets(model, selection);
    items.push({
      label: 'Move to…',
      disabled: destinations.length === 0,
      title: destinations.length === 0 ? `There is no other folder for ${ENTITY_TYPES[entity?.type ?? folderRecord.type].plural}.` : undefined,
      action: handlers.move,
    });
    items.push({ separator: true });
    items.push({ label: entity ? 'Delete entity' : 'Delete folder', iconId: 'i-delete', shortcut: 'Del', action: handlers.remove });
  }
  return items;
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
  const typeCode = entity?.type ?? folderRecord?.type;
  if (!typeCode) return [];

  const targets = [];
  const offer = (target, label, depth) => {
    const check = entity ? canMoveEntity(model, entity.id, target) : canMoveFolder(model, folderRecord.id, target);
    if (check.ok) targets.push({ target, label, depth });
  };

  offer({ kind: 'type', id: typeCode }, ENTITY_TYPES[typeCode].plural, 0);

  const walk = (parent, depth) => {
    for (const folder of childFolders(model, typeCode, parent)) {
      offer({ kind: 'folder', id: folder.id }, folder.name, depth);
      walk(folder.id, depth + 1);
    }
  };
  walk(null, 1);

  return targets;
}
