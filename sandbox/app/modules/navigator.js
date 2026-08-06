/**
 * The navigator pane: the model as a tree.
 *
 * The tree is filing and nothing else. Folders and entities both hold folders
 * and entities, at any depth, in whatever arrangement the user makes. No level
 * is dictated by the metamodel, so where a thing sits says nothing about what
 * it is. What an entity is, and what it is related to, is read from its icon
 * and from the relationship pane.
 */

import { ENTITY_TYPES } from './metamodel.js';
import { childEntities, childFolders, contentCounts, labelOf, nodeOf } from './model.js';
import { clear, el, icon } from './dom.js';

/**
 * @typedef {{ kind: 'root'|'folder'|'entity', id: string }} Selection
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
 * @param {(source: Selection, target: Selection) => boolean} context.canDrop
 * @param {(source: Selection, target: Selection) => void} context.onDrop
 */
export function createNavigator(context) {
  const expanded = new Set(['root']);
  let filter = '';
  /** The per-node entity counts, taken once per render. @type {Map<string, number>} */
  let counts = new Map();
  /** @type {Selection|null} */
  let dragging = null;
  /**
   * While set, the tree is a picker rather than a navigator: clicking a valid
   * entity hands it over instead of selecting it, everything else is inert,
   * and only expanding, collapsing and filtering still work, so a target can
   * be reached wherever it is filed. `pickedIds` are the rows handed over so
   * far, drawn as taken; handing one over again lets go of it.
   * @type {{ validIds: Set<string>, pickedIds?: Set<string>, onPick: (id: string) => void } | null}
   */
  let picker = null;

  context.filterEl.addEventListener('input', () => {
    filter = context.filterEl.value.trim().toLowerCase();
    render();
  });

  // --- Rendering -------------------------------------------------------

  function render() {
    const model = context.getModel();
    const selection = context.getSelection();
    const matches = filter ? matchingKeys(model, filter) : null;
    counts = contentCounts(model);

    clear(context.treeEl);
    context.treeEl.append(
      node({
        key: 'root',
        selection: { kind: 'root', id: '' },
        iconId: 'i-project',
        label: model.name,
        current: selection,
        depth: 0,
        children: contentsOf(model, null, matches, selection, 1),
      })
    );
  }

  /**
   * What sits directly inside a folder or an entity, or at the top of the tree
   * when the parent is null: folders first, then the entities filed there.
   * @param {import('./model.js').Model} model
   * @param {string|null} parentId
   * @param {Set<string>|null} matches
   * @param {Selection} selection
   * @param {number} depth  how far to indent the rows at this level
   */
  function contentsOf(model, parentId, matches, selection, depth) {
    const folders = childFolders(model, parentId)
      .map((folder) => folderNode(model, folder, matches, selection, depth))
      .filter(Boolean);

    const entities = childEntities(model, parentId)
      .map((entity) => entityNode(model, entity, matches, selection, depth))
      .filter(Boolean);

    return [...folders, ...entities];
  }

  /**
   * @param {import('./model.js').Model} model
   * @param {import('./model.js').Folder} folder
   * @param {Set<string>|null} matches
   * @param {Selection} selection
   * @param {number} depth
   */
  function folderNode(model, folder, matches, selection, depth) {
    const children = contentsOf(model, folder.id, matches, selection, depth + 1);
    if (matches && children.length === 0 && !matches.has(`folder:${folder.id}`)) return null;
    return node({
      key: `folder:${folder.id}`,
      selection: { kind: 'folder', id: folder.id },
      iconId: 'i-folder',
      label: folder.name,
      count: String(counts.get(folder.id) ?? 0),
      current: selection,
      depth,
      children,
    });
  }

  /**
   * An entity holds things the same way a folder does, so it is drawn the same
   * way: what is filed inside it hangs below it.
   * @param {import('./model.js').Model} model
   * @param {import('./model.js').Entity} entity
   * @param {Set<string>|null} matches
   * @param {Selection} selection
   * @param {number} depth
   */
  function entityNode(model, entity, matches, selection, depth) {
    const children = contentsOf(model, entity.id, matches, selection, depth + 1);
    if (matches && children.length === 0 && !matches.has(`entity:${entity.id}`)) return null;
    const type = ENTITY_TYPES[entity.type];
    return node({
      key: `entity:${entity.id}`,
      selection: { kind: 'entity', id: entity.id },
      id: entity.id,
      iconId: type.icon,
      pillar: type.pillar,
      label: labelOf(entity),
      title: `${type.name} ${entity.id}`,
      current: selection,
      depth,
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
   * @param {string} [spec.pillar]  set on an entity row, so the icon is
   *   coloured by the pillar its type belongs to
   * @param {string} spec.label
   * @param {string} [spec.count]
   * @param {string} [spec.className]
   * @param {string} [spec.title]
   * @param {number} spec.depth
   * @param {HTMLElement[]} [spec.children]
   */
  function node(spec) {
    const children = spec.children ?? [];
    const hasChildren = children.length > 0;
    const open = hasChildren && (filter !== '' || expanded.has(spec.key));
    const selected = spec.current.kind === spec.selection.kind && spec.current.id === spec.selection.id;
    const pickable = Boolean(picker && spec.selection.kind === 'entity' && picker.validIds.has(spec.selection.id));
    const picked = pickable && Boolean(picker.pickedIds?.has(spec.selection.id));
    const pickClass = picker ? (pickable ? ` pickable${picked ? ' picked' : ''}` : ' pick-dim') : '';

    // The stylesheet turns the depth into the row's left padding, so a row runs
    // the full width of the pane whatever level it sits at.
    const row = el('div', { class: `row${pickClass}`, title: spec.title, style: `--depth:${spec.depth}` });
    row.append(
      hasChildren
        ? el('span', {
            class: 'twisty',
            'aria-hidden': 'true',
            onclick: (event) => {
              event.stopPropagation();
              toggle(spec.key);
            },
          }, [icon(open ? 'i-chevron-down' : 'i-chevron-right')])
        : el('span', { class: 'twisty-gap', 'aria-hidden': 'true' })
    );
    row.append(icon(spec.iconId, spec.pillar));
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
        if (picker) {
          if (pickable) picker.onPick(spec.selection.id);
          return;
        }
        context.onSelect(spec.selection);
      },
      ondblclick: (event) => {
        event.stopPropagation();
        if (picker) return;
        context.onActivate(spec.selection);
      },
      oncontextmenu: (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (picker) return;
        context.onSelect(spec.selection);
        context.onContextMenu(spec.selection, event.clientX, event.clientY);
      },
      onkeydown: (event) => onKeyDown(event, spec, hasChildren, open, pickable),
    }, [row]);

    if (hasChildren && open) {
      wrapper.append(el('div', { class: 'children', role: 'group' }, children));
    }
    addDragAndDrop(wrapper, spec.selection);
    return wrapper;
  }

  /**
   * Anything can be dragged anywhere. Near the top or the bottom of a row it
   * drops alongside, which is how the order is changed; across the middle of a
   * folder it drops inside. Whether either is allowed is asked of the model, so
   * the tree accepts exactly what the model accepts.
   * @param {HTMLElement} wrapper
   * @param {Selection} selection
   */
  function addDragAndDrop(wrapper, selection) {
    if (picker) return;
    if (selection.kind === 'entity' || selection.kind === 'folder') {
      wrapper.draggable = true;
      wrapper.addEventListener('dragstart', (event) => {
        event.stopPropagation();
        dragging = selection;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', `${selection.kind}:${selection.id}`);
        wrapper.classList.add('dragging');
      });
      wrapper.addEventListener('dragend', () => {
        dragging = null;
        wrapper.classList.remove('dragging');
        clearDropMarks();
      });
    }

    // A row that refuses still stops the event. Every row sits inside its
    // parent's, so letting a refusal through would hand the drop to a row the
    // pointer was never over, and the thing would land somewhere else entirely.
    wrapper.addEventListener('dragover', (event) => {
      if (!dragging) return;
      event.stopPropagation();
      const position = positionWithin(event, wrapper, selection);
      if (!context.canDrop(dragging, selection, position)) {
        clearDropMarks();
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const mark = position === 'into' ? 'drop-target' : `drop-${position}`;
      if (!wrapper.classList.contains(mark)) {
        clearDropMarks();
        wrapper.classList.add(mark);
      }
    });

    wrapper.addEventListener('drop', (event) => {
      if (!dragging) return;
      event.stopPropagation();
      const position = positionWithin(event, wrapper, selection);
      if (!context.canDrop(dragging, selection, position)) return;
      event.preventDefault();
      const source = dragging;
      dragging = null;
      clearDropMarks();
      context.onDrop(source, selection, position);
    });
  }

  /**
   * @param {DragEvent} event
   * @param {HTMLElement} wrapper
   * @param {Selection} selection
   * @returns {'before'|'after'|'into'}
   */
  function positionWithin(event, wrapper, selection) {
    // The top of the tree only takes things inside it. A folder and an entity
    // both take things inside or alongside, so both read the same three bands.
    if (selection.kind === 'root') return 'into';
    const box = wrapper.querySelector(':scope > .row').getBoundingClientRect();
    const offset = event.clientY - box.top;
    if (offset < box.height * 0.3) return 'before';
    if (offset > box.height * 0.7) return 'after';
    return 'into';
  }

  function clearDropMarks() {
    for (const marked of context.treeEl.querySelectorAll('.drop-target, .drop-before, .drop-after')) {
      marked.classList.remove('drop-target', 'drop-before', 'drop-after');
    }
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
   * @param {boolean} pickable
   */
  function onKeyDown(event, spec, hasChildren, open, pickable) {
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
      if (picker) return;
      const box = visible[here]?.getBoundingClientRect();
      context.onContextMenu(spec.selection, box?.left ?? 0, box ? box.top + 22 : 0);
    } else if (picker) {
      if (pickable) picker.onPick(spec.selection.id);
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
      const haystack = `${entity.id} ${labelOf(entity)} ${ENTITY_TYPES[entity.type].name}`.toLowerCase();
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
      const node = nodeOf(model, selection.id);
      if (node) openParentChain(model, node.parent);
    },

    /** Open a branch without changing the selection. */
    expand(key) {
      expanded.add(key);
    },

    /**
     * Turn the tree into a picker, or back into a navigator with null. Every
     * branch holding a pickable entity is opened, so nothing on offer is
     * hidden inside a collapsed level.
     * @param {{ validIds: Set<string>, onPick: (id: string) => void } | null} spec
     */
    setPicker(spec) {
      picker = spec;
      if (spec) {
        const model = context.getModel();
        for (const id of spec.validIds) {
          const target = nodeOf(model, id);
          if (target) openParentChain(model, target.parent);
        }
      }
      render();
    },

    focusSelected() {
      const node = context.treeEl.querySelector('.node.selected');
      focusNode(node);
    },
  };

  /**
   * Open every branch above a node. Either kind can be a parent, so the walk
   * looks in both maps.
   * @param {import('./model.js').Model} model
   * @param {string|null} parentId
   */
  function openParentChain(model, parentId) {
    const seen = new Set();
    let current = nodeOf(model, parentId);
    while (current && !seen.has(current.id)) {
      expanded.add(`${model.folders.has(current.id) ? 'folder' : 'entity'}:${current.id}`);
      seen.add(current.id);
      current = nodeOf(model, current.parent);
    }
  }
}
