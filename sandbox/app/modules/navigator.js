/**
 * The navigator pane: the model as a tree.
 *
 * Below the four pillars sits a folder per entity type, and every entity is
 * filed under the folder for its own type. The user can add folders inside
 * those to group entities further; folders carry no meaning in the metamodel.
 *
 * The one nesting the tree does show is decomposition, where an entity owns
 * others of its own type. A hazard is owned by an element, but a hazard is not
 * a kind of element, so it is filed with the hazards and the ownership is read
 * in the relationship pane instead.
 */

import { ENTITY_TYPES, PILLARS, typesInPillar } from './metamodel.js';
import { childFolders, decompositionChildren, decompositionParent, displayLabel, folderCount } from './model.js';
import { clear, el, icon } from './dom.js';

/**
 * @typedef {{ kind: 'root'|'pillar'|'type'|'folder'|'entity', id: string }} Selection
 */

/**
 * @param {Object} context
 * @param {HTMLElement} context.treeEl
 * @param {HTMLInputElement} context.filterEl
 * @param {() => import('./model.js').Model} context.getModel
 * @param {() => Selection} context.getSelection
 * @param {(selection: Selection) => void} context.onSelect
 * @param {(selection: Selection, x: number, y: number) => void} context.onContextMenu
 * @param {(selection: Selection) => void} context.onActivate  double click, or Enter
 */
export function createNavigator(context) {
  const expanded = new Set(['root']);
  let filter = '';

  for (const pillar of PILLARS) expanded.add(`pillar:${pillar.id}`);

  context.filterEl.addEventListener('input', () => {
    filter = context.filterEl.value.trim().toLowerCase();
    render();
  });

  // --- Rendering -------------------------------------------------------

  function render() {
    const model = context.getModel();
    const selection = context.getSelection();
    const matches = filter ? matchingKeys(model, filter) : null;

    clear(context.treeEl);
    context.treeEl.append(
      node({
        key: 'root',
        selection: { kind: 'root', id: '' },
        iconId: 'i-project',
        label: model.name,
        current: selection,
        children: PILLARS.map((pillar) => pillarNode(model, pillar, matches, selection)).filter(Boolean),
      })
    );
  }

  /**
   * @param {import('./model.js').Model} model
   * @param {{id: string, name: string}} pillar
   * @param {Set<string>|null} matches
   * @param {Selection} selection
   */
  function pillarNode(model, pillar, matches, selection) {
    const children = typesInPillar(pillar.id)
      .map((type) => typeNode(model, type, matches, selection))
      .filter(Boolean);
    if (matches && children.length === 0) return null;
    return node({
      key: `pillar:${pillar.id}`,
      selection: { kind: 'pillar', id: pillar.id },
      iconId: 'i-folder',
      label: pillar.name,
      className: 'pillar',
      current: selection,
      children,
    });
  }

  /**
   * @param {import('./model.js').Model} model
   * @param {import('./metamodel.js').EntityType} type
   * @param {Set<string>|null} matches
   * @param {Selection} selection
   */
  function typeNode(model, type, matches, selection) {
    const total = [...model.entities.values()].filter((entity) => entity.type === type.code).length;
    const children = contentsOf(model, type.code, null, matches, selection);
    if (matches && children.length === 0) return null;
    return node({
      key: `type:${type.code}`,
      selection: { kind: 'type', id: type.code },
      iconId: 'i-folder',
      label: type.plural,
      count: String(total),
      current: selection,
      children,
    });
  }

  /**
   * The folders and entities that sit directly inside a type folder or a user
   * folder: subfolders first, then the entities filed there.
   * @param {import('./model.js').Model} model
   * @param {string} typeCode
   * @param {string|null} folderId
   * @param {Set<string>|null} matches
   * @param {Selection} selection
   */
  function contentsOf(model, typeCode, folderId, matches, selection) {
    const folders = childFolders(model, typeCode, folderId)
      .map((folder) => folderNode(model, folder, matches, selection))
      .filter(Boolean);

    const entities = [...model.entities.values()]
      .filter((entity) => entity.type === typeCode && entity.folder === folderId)
      .filter((entity) => !decompositionParent(model, entity.id))
      .map((entity) => entityNode(model, entity, matches, selection))
      .filter(Boolean);

    return [...folders, ...entities];
  }

  /**
   * @param {import('./model.js').Model} model
   * @param {import('./model.js').Folder} folder
   * @param {Set<string>|null} matches
   * @param {Selection} selection
   */
  function folderNode(model, folder, matches, selection) {
    const children = contentsOf(model, folder.type, folder.id, matches, selection);
    if (matches && children.length === 0 && !matches.has(`folder:${folder.id}`)) return null;
    return node({
      key: `folder:${folder.id}`,
      selection: { kind: 'folder', id: folder.id },
      iconId: 'i-folder',
      label: folder.name,
      count: String(folderCount(model, folder.id)),
      current: selection,
      children,
    });
  }

  /**
   * @param {import('./model.js').Model} model
   * @param {import('./model.js').Entity} entity
   * @param {Set<string>|null} matches
   * @param {Selection} selection
   */
  function entityNode(model, entity, matches, selection) {
    const children = decompositionChildren(model, entity.id)
      .map((child) => entityNode(model, child, matches, selection))
      .filter(Boolean);

    if (matches && !matches.has(`entity:${entity.id}`) && children.length === 0) return null;

    return node({
      key: `entity:${entity.id}`,
      selection: { kind: 'entity', id: entity.id },
      id: entity.id,
      iconId: ENTITY_TYPES[entity.type].icon,
      label: displayLabel(entity),
      title: `${ENTITY_TYPES[entity.type].name} ${entity.id}`,
      current: selection,
      children,
    });
  }

  /**
   * @param {Object} spec
   * @param {string} spec.key
   * @param {Selection} spec.selection
   * @param {Selection} spec.current
   * @param {string} [spec.id]
   * @param {string} spec.iconId
   * @param {string} spec.label
   * @param {string} [spec.count]
   * @param {string} [spec.className]
   * @param {string} [spec.title]
   * @param {HTMLElement[]} [spec.children]
   */
  function node(spec) {
    const children = spec.children ?? [];
    const hasChildren = children.length > 0;
    const open = hasChildren && (filter !== '' || expanded.has(spec.key));
    const selected = spec.current.kind === spec.selection.kind && spec.current.id === spec.selection.id;

    const row = el('div', { class: 'row', title: spec.title });
    row.append(
      hasChildren
        ? el('span', {
            class: 'twisty',
            text: open ? '−' : '+',
            'aria-hidden': 'true',
            onclick: (event) => {
              event.stopPropagation();
              toggle(spec.key);
            },
          })
        : el('span', { class: 'twisty-gap', 'aria-hidden': 'true' })
    );
    row.append(icon(spec.iconId));
    if (spec.id) row.append(el('span', { class: 'row-id', text: spec.id }));
    row.append(el('span', { class: `row-label${spec.className ? ` ${spec.className}` : ''}`, text: spec.label }));
    if (spec.count !== undefined) row.append(el('span', { class: 'row-count', text: spec.count }));

    const wrapper = el('div', {
      class: `node${selected ? ' selected' : ''}`,
      role: 'treeitem',
      tabindex: selected ? '0' : '-1',
      'data-key': spec.key,
      'data-id': spec.id,
      'aria-expanded': hasChildren ? String(open) : null,
      'aria-selected': String(selected),
      onclick: (event) => {
        event.stopPropagation();
        context.onSelect(spec.selection);
      },
      ondblclick: (event) => {
        event.stopPropagation();
        context.onActivate(spec.selection);
      },
      oncontextmenu: (event) => {
        event.preventDefault();
        event.stopPropagation();
        context.onSelect(spec.selection);
        context.onContextMenu(spec.selection, event.clientX, event.clientY);
      },
      onkeydown: (event) => onKeyDown(event, spec, hasChildren, open),
    }, [row]);

    if (hasChildren && open) {
      wrapper.append(el('div', { class: 'children', role: 'group' }, children));
    }
    return wrapper;
  }

  /**
   * Collapsing a level collapses everything under it, so reopening it shows
   * the level and not the state it was left in three levels down.
   * @param {string} key
   */
  function toggle(key) {
    if (expanded.has(key)) {
      expanded.delete(key);
      const branch = context.treeEl.querySelector(`.node[data-key="${CSS.escape(key)}"]`);
      for (const descendant of branch?.querySelectorAll('.node[data-key]') ?? []) {
        expanded.delete(descendant.dataset.key);
      }
    } else {
      expanded.add(key);
    }
    render();
    focusKey(key);
  }

  /**
   * @param {KeyboardEvent} event
   * @param {{key: string, selection: Selection}} spec
   * @param {boolean} hasChildren
   * @param {boolean} open
   */
  function onKeyDown(event, spec, hasChildren, open) {
    const keys = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End', 'Enter', ' ', 'ContextMenu'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();

    const visible = [...context.treeEl.querySelectorAll('.node')].filter((n) => n.offsetParent !== null);
    const here = visible.findIndex((n) => n.dataset.key === spec.key);

    if (event.key === 'ArrowDown') focusNode(visible[here + 1]);
    else if (event.key === 'ArrowUp') focusNode(visible[here - 1]);
    else if (event.key === 'Home') focusNode(visible[0]);
    else if (event.key === 'End') focusNode(visible[visible.length - 1]);
    else if (event.key === 'ArrowRight') {
      if (hasChildren && !open) toggle(spec.key);
      else focusNode(visible[here + 1]);
    } else if (event.key === 'ArrowLeft') {
      if (hasChildren && open) toggle(spec.key);
      else focusNode(visible[here]?.parentElement?.closest('.node'));
    } else if (event.key === 'ContextMenu') {
      const box = visible[here]?.getBoundingClientRect();
      context.onContextMenu(spec.selection, box?.left ?? 0, box ? box.top + 22 : 0);
    } else {
      context.onActivate(spec.selection);
    }
  }

  /** @param {Element|null|undefined} node */
  function focusNode(node) {
    if (node instanceof HTMLElement) node.focus();
  }

  /** @param {string} key */
  function focusKey(key) {
    focusNode(context.treeEl.querySelector(`.node[data-key="${CSS.escape(key)}"]`));
  }

  /**
   * @param {import('./model.js').Model} model
   * @param {string} query
   * @returns {Set<string>}
   */
  function matchingKeys(model, query) {
    const found = new Set();
    for (const entity of model.entities.values()) {
      const haystack = `${entity.id} ${displayLabel(entity)} ${ENTITY_TYPES[entity.type].name}`.toLowerCase();
      if (haystack.includes(query)) found.add(`entity:${entity.id}`);
    }
    for (const folder of model.folders.values()) {
      if (folder.name.toLowerCase().includes(query)) found.add(`folder:${folder.id}`);
    }
    return found;
  }

  // --- Interface used by the rest of the software ----------------------

  return {
    render,

    /** Open the branch that holds a selection, so it is always visible. */
    reveal(selection) {
      const model = context.getModel();
      if (selection.kind === 'entity') {
        let entity = model.entities.get(selection.id);
        if (!entity) return;
        let parent = decompositionParent(model, entity.id);
        while (parent) {
          expanded.add(`entity:${parent.id}`);
          entity = parent;
          parent = decompositionParent(model, parent.id);
        }
        openFolderChain(model, entity.type, entity.folder);
      } else if (selection.kind === 'folder') {
        const folder = model.folders.get(selection.id);
        if (folder) openFolderChain(model, folder.type, folder.parent);
      } else if (selection.kind === 'type') {
        expanded.add(`pillar:${ENTITY_TYPES[selection.id].pillar}`);
      }
    },

    /** Open a branch without changing the selection. */
    expand(key) {
      expanded.add(key);
    },

    focusSelected() {
      const node = context.treeEl.querySelector('.node.selected');
      focusNode(node);
    },
  };

  /**
   * @param {import('./model.js').Model} model
   * @param {string} typeCode
   * @param {string|null} folderId
   */
  function openFolderChain(model, typeCode, folderId) {
    expanded.add(`pillar:${ENTITY_TYPES[typeCode].pillar}`);
    expanded.add(`type:${typeCode}`);
    let current = folderId ? model.folders.get(folderId) : null;
    while (current) {
      expanded.add(`folder:${current.id}`);
      current = current.parent ? model.folders.get(current.parent) : null;
    }
  }
}
