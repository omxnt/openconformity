/**
 * The navigator: the model as a tree of what is filed where, under its
 * toolbar, headed by the project's own row. The project row is
 * presentation only — no entity, no identifier, nothing a model
 * operation can address — selected as the null selection, filing drops
 * at the top of the tree, and its context menu is the background menu.
 * The tree presents the user's filing, folders and entities interleaved
 * in sibling order, every row under its type's icon, an entity labelled
 * by its designation then its title — the designation alone when
 * untitled. The pane owns its transient state: scroll and focus survive
 * the full re-render.
 *
 * With no project open, the tree is the landing: nothing to draw, and
 * the two ways to a project offered in its place.
 *
 * The toolbar draws from the one action list, and the tree asks the model
 * the same questions a drop answers: the middle of a row files into it
 * when `canFile` allows, its edges place beside it when `canPlaceBeside`
 * allows. Selection goes through the flows, so a selection change never
 * bypasses the draft guard.
 *
 * While the store holds a picker, the candidate rows of any admissible
 * form are picked from here: clicking one toggles the pick and moves the
 * selection nowhere; every other row still selects. The candidate set is
 * re-derived from the model on every render.
 */

import { childrenOf, nodeOf, canFile, canPlaceBeside } from './model.js';
import { pickerCandidates } from './relate.js';
import { TYPE_ICONS, FOLDER_ICON, PROJECT_ICON } from './icons.js';
import { ENTITY_TYPES } from './metamodel.js';
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
 * The identifiers a filter query finds: an entity by its identifier, its
 * title, or its type's name; a folder by its name. Matching reads
 * case-insensitively.
 * @param {import('./model.js').Model} model
 * @param {string} query  trimmed and lowercased
 * @returns {Set<string>}
 */
export function matchingIds(model, query) {
  const found = new Set();
  for (const node of model.nodes.values()) {
    const haystack =
      node.kind === 'folder'
        ? node.name
        : `${node.id} ${node.attributes.title ?? ''} ${ENTITY_TYPES[node.type].name}`;
    if (haystack.toLowerCase().includes(query)) found.add(node.id);
  }
  return found;
}

/**
 * The rows the tree draws: every visible node, in drawing order. A node's
 * children follow it only while it is expanded. While a filter is set,
 * the rows are the matches and their ancestors, every branch on the way
 * drawn open whatever the expansion holds, and nothing beneath a match
 * unless it matches too.
 * @param {import('./model.js').Model} model
 * @param {(id: string) => boolean} isExpanded
 * @param {string} [filter]
 * @returns {TreeRow[]}
 */
export function treeRows(model, isExpanded, filter = '') {
  const query = filter.trim().toLowerCase();

  if (query === '') {
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

  const matches = matchingIds(model, query);
  const walk = (parentId, depth) => {
    const rows = [];
    for (const node of childrenOf(model, parentId)) {
      const beneath = walk(node.id, depth + 1);
      if (beneath.length === 0 && !matches.has(node.id)) continue;
      rows.push(
        { id: node.id, node, depth, hasChildren: beneath.length > 0, expanded: beneath.length > 0 },
        ...beneath
      );
    }
    return rows;
  };
  return walk(null, 0);
}

/**
 * Everything the pane draws, in drawing order: the project row first,
 * always, then the tree; nothing at all without a project.
 * @param {import('./model.js').Model} model
 * @param {(id: string) => boolean} isExpanded
 * @param {boolean} hasProject
 * @param {string} [filter]
 * @returns {Array<{ kind: 'project', id: null } | (TreeRow & { kind: 'node' })>}
 */
export function visibleRows(model, isExpanded, hasProject, filter = '') {
  if (!hasProject) return [];
  return [
    { kind: 'project', id: null },
    ...treeRows(model, isExpanded, filter).map((row) => ({ kind: 'node', ...row })),
  ];
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
 * The branches that must stand open for these identifiers to be visible:
 * every ancestor of every one of them. While picking, the tree opens
 * these transiently, leaving the durable expansion untouched.
 * @param {import('./model.js').Model} model
 * @param {Iterable<string>} ids
 * @returns {Set<string>}
 */
export function revealSet(model, ids) {
  const open = new Set();
  for (const id of ids) {
    const seen = new Set();
    let current = nodeOf(model, id);
    while (current && current.parent !== null && !seen.has(current.parent)) {
      seen.add(current.parent);
      open.add(current.parent);
      current = nodeOf(model, current.parent);
    }
  }
  return open;
}

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {HTMLElement} context.container
 * @param {HTMLElement} context.toolbar
 * @param {HTMLElement} context.search       the filter bar
 * @param {HTMLInputElement} context.filterInput
 * @param {HTMLElement} context.filterClear
 * @param {Array<import('./actions.js').Action>} context.actions
 * @param {(id: string|null) => void} context.onSelect
 * @param {(id: string|null) => void} context.onActivate
 * @param {(id: string, parentId: string|null) => void} context.onFile
 * @param {(id: string, targetId: string, position: 'before'|'after') => void} context.onPlace
 * @param {(id: string|null, at: { x: number, y: number }) => void} context.onContextMenu
 */
export function createNavigator({
  store,
  container,
  toolbar,
  search,
  filterInput,
  filterClear,
  actions,
  onSelect,
  onActivate,
  onFile,
  onPlace,
  onContextMenu,
}) {
  /** The id being dragged; dataTransfer is unreadable during dragover. */
  let draggedId = null;

  /** The filter as typed: the pane's own transient state, gone with the visit. */
  let filter = '';

  filterInput.addEventListener('input', () => {
    filter = filterInput.value;
    filterClear.hidden = filterInput.value === '';
    render();
  });

  // The clear action exists only while there is something to clear, and
  // Escape is the keyboard's way to it.
  function clearFilter() {
    filterInput.value = '';
    filter = '';
    filterClear.hidden = true;
    render();
    filterInput.focus();
  }

  filterInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || filterInput.value === '') return;
    event.preventDefault();
    event.stopPropagation();
    clearFilter();
  });
  filterClear.addEventListener('click', clearFilter);

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
      if (action.describe) {
        const said = action.describe();
        button.title = said;
        button.setAttribute('aria-label', said);
      }
    }
  }

  // --- The rows --------------------------------------------------------

  function clearDropMarks(rowElement) {
    rowElement.classList.remove('drop-target', 'drop-before', 'drop-after');
  }

  function renderProjectRow() {
    const selected = store.selection() === null;
    const rowElement = el('div', {
      className: `tree-row project-row${selected ? ' selected' : ''}`,
      attributes: {
        role: 'treeitem',
        'aria-level': '1',
        'aria-selected': String(selected),
        tabindex: selected ? '0' : '-1',
      },
    });
    rowElement.appendChild(el('span', { className: 'twisty' }));
    rowElement.appendChild(icon(PROJECT_ICON));

    const name = store.model().name.trim();
    rowElement.appendChild(
      name
        ? el('span', { className: 'row-title', text: name })
        : el('span', { className: 'row-title untitled', text: 'Untitled' })
    );

    rowElement.addEventListener('click', () => onSelect(null));
    rowElement.addEventListener('dblclick', () => onActivate(null));
    rowElement.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      onContextMenu(null, { x: event.clientX, y: event.clientY });
    });
    rowElement.addEventListener('dragover', (event) => {
      if (draggedId === null || !canFile(store.model(), draggedId, null).ok) return;
      event.preventDefault();
      event.stopPropagation();
      rowElement.classList.add('drop-target');
    });
    rowElement.addEventListener('dragleave', () => clearDropMarks(rowElement));
    rowElement.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();
      clearDropMarks(rowElement);
      if (draggedId !== null) onFile(draggedId, null);
    });
    return rowElement;
  }

  function renderRow(row, picking) {
    const selected = row.id === store.selection();
    const pickable = picking.candidates.has(row.id);
    const picked = picking.picks.has(row.id);
    const attributes = {
      role: 'treeitem',
      'aria-level': String(row.depth + 2),
      'aria-selected': String(selected),
      tabindex: selected ? '0' : '-1',
      'data-id': row.id,
      draggable: 'true',
    };
    if (row.hasChildren) attributes['aria-expanded'] = String(row.expanded);
    if (pickable) attributes['aria-checked'] = String(picked);
    if (row.node.kind === 'entity') {
      attributes.title = `${ENTITY_TYPES[row.node.type].name} ${row.id}`;
    }

    const classes = ['tree-row'];
    if (selected) classes.push('selected');
    if (pickable) classes.push('pickable');
    if (picked) classes.push('picked');
    if (picking.subject === row.id) classes.push('picker-subject');
    if (picking.subject !== null && !pickable && picking.subject !== row.id) classes.push('pick-dim');
    const rowElement = el('div', { className: classes.join(' '), attributes });
    rowElement.style.paddingLeft = `${16 + (row.depth + 1) * 16}px`;

    const twisty = el('span', { className: 'twisty' });
    if (row.hasChildren) {
      twisty.appendChild(icon(row.expanded ? 'i-chevron-down' : 'i-chevron-right'));
      twisty.addEventListener('click', (event) => {
        event.stopPropagation();
        store.setExpanded(row.id, !row.expanded);
      });
    }
    rowElement.appendChild(twisty);

    rowElement.appendChild(
      row.node.kind === 'folder'
        ? icon(FOLDER_ICON)
        : icon(TYPE_ICONS[row.node.type], ENTITY_TYPES[row.node.type].pillar)
    );

    const parts = labelParts(row.node);
    if (parts.designation) {
      rowElement.appendChild(el('span', { className: 'mono designation', text: parts.designation }));
    }
    if (parts.title) {
      rowElement.appendChild(el('span', { className: 'row-title', text: parts.title }));
    }

    rowElement.addEventListener('click', () => {
      if (pickable) store.togglePick(row.id);
      else onSelect(row.id);
    });
    rowElement.addEventListener('dblclick', () => {
      if (picking.subject !== null) return;
      onActivate(row.id);
    });
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

  function renderLanding() {
    const landing = el('div', { className: 'empty-state' }, [
      el('p', { className: 'empty-state-title', text: 'No project' }),
      el('p', { className: 'empty-state-body', text: 'Create a project, or open one saved as a file.' }),
    ]);
    for (const id of ['new-project', 'open']) {
      const action = actions.find((offered) => offered.id === id);
      if (!action) continue;
      const button = el('button', {
        className: 'ghost-button',
        attributes: { type: 'button', 'data-action': `landing-${action.id}` },
      }, [icon(action.icon), el('span', { text: action.label })]);
      button.addEventListener('click', () => action.run({ anchor: button }));
      landing.appendChild(button);
    }
    container.appendChild(landing);
  }

  function render() {
    const scroll = container.scrollTop;
    const hadFocus = container.contains(document.activeElement);

    container.textContent = '';
    search.hidden = !store.hasProject();
    if (!store.hasProject()) {
      renderLanding();
      syncToolbar();
      return;
    }

    const picker = store.picker();
    const picking = {
      candidates: pickerCandidates(store.model(), picker),
      picks: new Set(picker?.picks.map((pick) => pick.id) ?? []),
      subject: picker?.subject ?? null,
    };
    // While picking, every branch holding a candidate opens transiently,
    // so nothing on offer hides inside a collapsed level; the durable
    // expansion is untouched.
    const revealed = picker === null ? null : revealSet(store.model(), picking.candidates);
    const isOpen = revealed === null ? store.isExpanded : (id) => store.isExpanded(id) || revealed.has(id);
    const tree = el('div', { className: 'tree', attributes: { role: 'tree', 'aria-label': 'Model' } });
    for (const row of visibleRows(store.model(), isOpen, true, filter)) {
      tree.appendChild(row.kind === 'project' ? renderProjectRow() : renderRow(row, picking));
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
    if (!store.hasProject()) return;
    if (event.target !== container && event.target.closest('.tree-row')) return;
    event.preventDefault();
    onContextMenu(null, { x: event.clientX, y: event.clientY });
  });

  /** Run an action from the one list, exactly as its button would. */
  function runAction(id) {
    const action = actions.find((offered) => offered.id === id);
    if (action && action.enabled()) action.run({});
  }

  container.addEventListener('keydown', (event) => {
    const picker = store.picker();
    const revealed = picker === null ? null : revealSet(store.model(), pickerCandidates(store.model(), picker));
    const isOpen = revealed === null ? store.isExpanded : (id) => store.isExpanded(id) || revealed.has(id);
    const rows = visibleRows(store.model(), isOpen, store.hasProject(), filter);
    if (rows.length === 0) return;
    const selection = store.selection();
    const index = rows.findIndex((row) => row.id === selection);
    const row = index >= 0 ? rows[index] : null;

    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      runAction(event.key === 'ArrowUp' ? 'move-up' : 'move-down');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (index < 0) onSelect(rows[0].id);
      else if (rows[index + 1]) onSelect(rows[index + 1].id);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index > 0) onSelect(rows[index - 1].id);
    } else if (event.key === 'ArrowRight' && row && row.kind === 'node') {
      event.preventDefault();
      if (row.hasChildren && !row.expanded) store.setExpanded(row.id, true);
      else if (row.expanded) onSelect(rows[index + 1].id);
    } else if (event.key === 'ArrowLeft' && row && row.kind === 'node') {
      event.preventDefault();
      if (row.expanded) store.setExpanded(row.id, false);
      else onSelect(row.node.parent);
    } else if (event.key === 'Home') {
      event.preventDefault();
      onSelect(rows[0].id);
    } else if (event.key === 'End') {
      event.preventDefault();
      onSelect(rows[rows.length - 1].id);
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (row === null) return;
      event.preventDefault();
      onActivate(row.id);
    } else if (event.key === 'Delete') {
      event.preventDefault();
      runAction('delete');
    } else if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      event.preventDefault();
      const at = container.querySelector('.tree-row.selected')?.getBoundingClientRect();
      onContextMenu(selection, { x: (at?.left ?? 0) + 24, y: at?.bottom ?? 0 });
    }
  });

  store.subscribe(render);
  render();

  return { render };
}
