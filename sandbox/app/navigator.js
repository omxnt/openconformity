/**
 * The navigator: the model as a tree of what is filed where, under its
 * toolbar. The tree presents the user's filing, folders and entities
 * interleaved in sibling order, and labels an entity by its designation
 * then its title — the designation alone when untitled. The pane owns its
 * transient state: scroll and focus survive the full re-render.
 *
 * The toolbar draws from the one action list, and the tree asks the model
 * the same questions a drop answers: the middle of a row files into it
 * when `canFile` allows, its edges place beside it when `canPlaceBeside`
 * allows. Selection goes through the flows, so a selection change never
 * bypasses the draft guard.
 */

import { childrenOf, nodeOf, canFile, canPlaceBeside } from './model.js';
import { el, icon } from './dom.js';

/**
 * @typedef {Object} TreeRow
 * @property {string} id
 * @property {import('./model.js').Node} node
 * @property {number} depth
 * @property {boolean} hasChildren
 * @property {boolean} expanded
 */

/**
 * The rows the tree draws: every visible node, in drawing order. A node's
 * children follow it only while it is expanded.
 * @param {import('./model.js').Model} model
 * @param {(id: string) => boolean} isExpanded
 * @returns {TreeRow[]}
 */
export function treeRows(model, isExpanded) {
  const rows = [];
  const walk = (parentId, depth) => {
    for (const node of childrenOf(model, parentId)) {
      const hasChildren = childrenOf(model, node.id).length > 0;
      const expanded = hasChildren && isExpanded(node.id);
      rows.push({ id: node.id, node, depth, hasChildren, expanded });
      if (expanded) walk(node.id, depth + 1);
    }
  };
  walk(null, 0);
  return rows;
}

/**
 * What a row says: an entity's designation and its title when it has one,
 * a folder's name alone.
 * @param {import('./model.js').Node} node
 * @returns {{ designation: string|null, title: string|null }}
 */
export function labelParts(node) {
  if (node.kind === 'folder') return { designation: null, title: node.name };
  const title = (node.attributes.title ?? '').trim();
  return { designation: node.id, title: title || null };
}

/**
 * The drop a pointer position over a row asks for: the edges place
 * beside, the middle files into.
 * @param {number} ratio  the pointer's height within the row, 0 at the top
 * @returns {'before'|'into'|'after'}
 */
export function dropZone(ratio) {
  if (ratio < 0.25) return 'before';
  if (ratio > 0.75) return 'after';
  return 'into';
}

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {HTMLElement} context.container
 * @param {HTMLElement} context.toolbar
 * @param {Array<import('./actions.js').Action>} context.actions
 * @param {(id: string) => void} context.onSelect
 * @param {(id: string, parentId: string|null) => void} context.onFile
 * @param {(id: string, targetId: string, position: 'before'|'after') => void} context.onPlace
 * @param {(id: string|null, at: { x: number, y: number }) => void} context.onContextMenu
 */
export function createNavigator({ store, container, toolbar, actions, onSelect, onFile, onPlace, onContextMenu }) {
  /** The id being dragged; dataTransfer is unreadable during dragover. */
  let draggedId = null;

  // --- The toolbar, drawn once from the action list --------------------

  /** @type {Map<import('./actions.js').Action, HTMLButtonElement>} */
  const toolbarButtons = new Map();
  {
    let lastGroup = null;
    for (const action of actions.filter((offered) => offered.toolbar)) {
      if (lastGroup !== null && action.group !== lastGroup) {
        toolbar.appendChild(
          action.group === 'history'
            ? el('span', { className: 'toolbar-spacer' })
            : el('span', { className: 'toolbar-divider' })
        );
      }
      lastGroup = action.group;

      const attributes = { type: 'button', 'data-action': action.id };
      if (action.menu) {
        attributes['aria-haspopup'] = 'menu';
        attributes['aria-expanded'] = 'false';
      }
      const button = el('button', {
        className: `ghost-button${action.danger ? ' ghost-danger' : ''}`,
        text: action.label,
        attributes,
      });
      button.addEventListener('click', () => action.run({ anchor: button }));
      toolbar.appendChild(button);
      toolbarButtons.set(action, button);
    }
  }

  function syncToolbar() {
    for (const [action, button] of toolbarButtons) {
      button.disabled = !action.enabled();
    }
  }

  // --- The tree --------------------------------------------------------

  function clearDropMarks(rowElement) {
    rowElement.classList.remove('drop-target', 'drop-before', 'drop-after');
  }

  function renderRow(row) {
    const selected = row.id === store.selection();
    const attributes = {
      role: 'treeitem',
      'aria-level': String(row.depth + 1),
      'aria-selected': String(selected),
      tabindex: selected ? '0' : '-1',
      'data-id': row.id,
      draggable: 'true',
    };
    if (row.hasChildren) attributes['aria-expanded'] = String(row.expanded);

    const rowElement = el('div', { className: `tree-row${selected ? ' selected' : ''}`, attributes });
    rowElement.style.paddingLeft = `${8 + row.depth * 16}px`;

    const twisty = el('span', { className: 'twisty' });
    if (row.hasChildren) {
      twisty.appendChild(icon(row.expanded ? 'i-chevron-down' : 'i-chevron-right'));
      twisty.addEventListener('click', (event) => {
        event.stopPropagation();
        store.setExpanded(row.id, !row.expanded);
      });
    }
    rowElement.appendChild(twisty);

    const parts = labelParts(row.node);
    if (parts.designation) {
      rowElement.appendChild(el('span', { className: 'mono designation', text: parts.designation }));
    }
    if (parts.title) {
      rowElement.appendChild(el('span', { className: 'row-title', text: parts.title }));
    }

    rowElement.addEventListener('click', () => onSelect(row.id));
    rowElement.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      onContextMenu(row.id, { x: event.clientX, y: event.clientY });
    });

    rowElement.addEventListener('dragstart', (event) => {
      draggedId = row.id;
      event.dataTransfer.setData('text/plain', row.id);
      event.dataTransfer.effectAllowed = 'move';
    });
    rowElement.addEventListener('dragend', () => {
      draggedId = null;
    });
    rowElement.addEventListener('dragover', (event) => {
      if (draggedId === null) return;
      const rect = rowElement.getBoundingClientRect();
      const zone = dropZone((event.clientY - rect.top) / rect.height);
      const allowed =
        zone === 'into'
          ? canFile(store.model(), draggedId, row.id).ok
          : canPlaceBeside(store.model(), draggedId, row.id).ok;
      clearDropMarks(rowElement);
      if (!allowed) return;
      event.preventDefault();
      event.stopPropagation();
      rowElement.classList.add(zone === 'into' ? 'drop-target' : zone === 'before' ? 'drop-before' : 'drop-after');
    });
    rowElement.addEventListener('dragleave', () => clearDropMarks(rowElement));
    rowElement.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();
      clearDropMarks(rowElement);
      if (draggedId === null) return;
      const rect = rowElement.getBoundingClientRect();
      const zone = dropZone((event.clientY - rect.top) / rect.height);
      if (zone === 'into') onFile(draggedId, row.id);
      else onPlace(draggedId, row.id, zone);
    });

    return rowElement;
  }

  function render() {
    const scroll = container.scrollTop;
    const hadFocus = container.contains(document.activeElement);

    container.textContent = '';
    const tree = el('div', { className: 'tree', attributes: { role: 'tree', 'aria-label': 'Model' } });
    for (const row of treeRows(store.model(), store.isExpanded)) {
      tree.appendChild(renderRow(row));
    }
    container.appendChild(tree);

    container.scrollTop = scroll;
    if (hadFocus) container.querySelector('.tree-row.selected')?.focus();

    syncToolbar();
  }

  // The space below the rows files to the top of the tree, and the
  // background context menu acts there too.
  container.addEventListener('dragover', (event) => {
    if (draggedId === null || !canFile(store.model(), draggedId, null).ok) return;
    event.preventDefault();
  });
  container.addEventListener('drop', (event) => {
    event.preventDefault();
    if (draggedId !== null) onFile(draggedId, null);
  });
  container.addEventListener('contextmenu', (event) => {
    if (event.target !== container && event.target.closest('.tree-row')) return;
    event.preventDefault();
    onContextMenu(null, { x: event.clientX, y: event.clientY });
  });

  container.addEventListener('keydown', (event) => {
    const rows = treeRows(store.model(), store.isExpanded);
    if (rows.length === 0) return;
    const index = rows.findIndex((row) => row.id === store.selection());
    const row = index >= 0 ? rows[index] : null;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (index < 0) onSelect(rows[0].id);
      else if (rows[index + 1]) onSelect(rows[index + 1].id);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index > 0) onSelect(rows[index - 1].id);
    } else if (event.key === 'ArrowRight' && row) {
      event.preventDefault();
      if (row.hasChildren && !row.expanded) store.setExpanded(row.id, true);
      else if (row.expanded) onSelect(rows[index + 1].id);
    } else if (event.key === 'ArrowLeft' && row) {
      event.preventDefault();
      if (row.expanded) store.setExpanded(row.id, false);
      else if (row.node.parent !== null) onSelect(row.node.parent);
    }
  });

  store.subscribe(render);
  render();

  return { render };
}
