/**
 * What "new", "edit" and "delete" mean depends on where the user is standing
 * in the navigator. This module turns a selection into the menu that belongs
 * to it, and both the toolbar and the right-click menu are built from it.
 *
 * The entity types offered under a selected entity are exactly the
 * compositions the metamodel gives that entity type, so standing on a System
 * Element offers a System Element it decomposes into and a Single Hazard it
 * exhibits, and nothing else.
 */

import { ENTITY_TYPES, PILLARS, compositionsFrom, typesInPillar } from './metamodel.js';
import { decompositionParent, displayLabel } from './model.js';

/**
 * @typedef {import('./navigator.js').Selection} Selection
 *
 * @typedef {Object} Handlers
 * @property {(code: string, options?: {owner?: string, folder?: string|null}) => void} createEntity
 * @property {(typeCode: string, parent: string|null) => void} createFolder
 * @property {() => void} edit
 * @property {() => void} remove
 */

/**
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @returns {{ typeCode: string|null, folder: string|null, entity: import('./model.js').Entity|null, folderRecord: import('./model.js').Folder|null }}
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
 * A short description of what the user is standing on, shown in the toolbar.
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @returns {string}
 */
export function describe(model, selection) {
  const { entity, folderRecord } = contextOf(model, selection);
  if (entity) return `${ENTITY_TYPES[entity.type].name} ${entity.id} — ${displayLabel(entity)}`;
  if (folderRecord) return `Folder — ${folderRecord.name}`;
  if (selection.kind === 'type') return ENTITY_TYPES[selection.id].plural;
  if (selection.kind === 'pillar') return PILLARS.find((pillar) => pillar.id === selection.id)?.name ?? '';
  return model.name;
}

/**
 * What can be created where the user is standing, and nothing else. There is
 * no "any entity type" escape: the offer is derived from the position.
 *
 *   an entity   what its type owns through a composition, and one beside it
 *   a folder    the type that folder files, and a subfolder
 *   a pillar    the entity types that belong to that pillar
 *   the model   nothing, since the pillars are fixed
 *
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @param {Handlers} handlers
 * @returns {import('./menu.js').MenuItem[]}
 */
export function newMenuItems(model, selection, handlers) {
  const items = [];
  const { typeCode, folder, entity, folderRecord } = contextOf(model, selection);

  if (entity) {
    const type = ENTITY_TYPES[entity.type];

    for (const composition of compositionsFrom(entity.type)) {
      const target = ENTITY_TYPES[composition.target];
      if (items.length === 0) items.push({ heading: `Under ${entity.id}` });
      items.push({
        label: `New ${target.name}`,
        iconId: target.icon,
        shortcut: composition.label,
        action: () =>
          handlers.createEntity(composition.target, {
            owner: entity.id,
            folder: composition.target === entity.type ? entity.folder : null,
          }),
      });
    }

    // Beside it: under the same parent when the entity is decomposed from one,
    // otherwise in the same folder.
    const parent = decompositionParent(model, entity.id);
    const container = entity.folder ? model.folders.get(entity.folder) : null;
    if (items.length > 0) items.push({ separator: true });
    items.push({ heading: `Beside ${entity.id}, in ${parent ? parent.id : container?.name ?? type.plural}` });
    items.push({
      label: `New ${type.name}`,
      iconId: type.icon,
      action: () =>
        parent
          ? handlers.createEntity(entity.type, { owner: parent.id, folder: parent.folder })
          : handlers.createEntity(entity.type, { folder: entity.folder }),
    });
    return items;
  }

  if (typeCode) {
    const type = ENTITY_TYPES[typeCode];
    items.push({ heading: folderRecord ? `In ${folderRecord.name}` : type.plural });
    items.push({
      label: `New ${type.name}`,
      iconId: type.icon,
      action: () => handlers.createEntity(typeCode, { folder }),
    });
    items.push({
      label: folderRecord ? 'New subfolder' : 'New folder',
      iconId: 'i-folder',
      action: () => handlers.createFolder(typeCode, folder),
    });
    return items;
  }

  if (selection.kind === 'pillar') {
    const pillar = PILLARS.find((candidate) => candidate.id === selection.id);
    items.push({ heading: pillar?.name ?? '' });
    for (const type of typesInPillar(selection.id)) {
      items.push({
        label: `New ${type.name}`,
        iconId: type.icon,
        shortcut: type.code,
        action: () => handlers.createEntity(type.code),
      });
    }
  }

  return items;
}

/**
 * The right-click menu: what "new" offers here, then editing and deleting what
 * is under the pointer.
 * @param {import('./model.js').Model} model
 * @param {Selection} selection
 * @param {Handlers} handlers
 * @returns {import('./menu.js').MenuItem[]}
 */
export function contextMenuItems(model, selection, handlers) {
  const { entity, folderRecord } = contextOf(model, selection);
  const items = newMenuItems(model, selection, handlers);

  if (entity || folderRecord) {
    items.push({ separator: true });
    items.push({ label: entity ? 'Edit attributes' : 'Rename folder', action: handlers.edit });
    items.push({ label: entity ? 'Delete entity' : 'Delete folder', shortcut: 'Del', action: handlers.remove });
  }
  return items;
}
