/**
 * The navigator: the model as a tree of what is filed where, under its
 * toolbar, headed by the project's own row. The project row is
 * presentation only — no entity, no identifier, nothing a model
 * operation can address — selected as the null selection, filing drops
 * at the top of the tree, and its context menu is the background menu.
 * The tree presents the user's filing, folders and entities interleaved
 * in sibling order, every row under its type's icon, an entity labelled
 * by its designation then its label — the reference in brackets then the
 * title for the types that carry a reference, the designation alone when
 * the entity carries neither. The pane owns its transient state: scroll and focus
 * survive the full re-render.
 *
 * With no project open, the tree is the landing: one quiet line; the
 * ways into a project live in the editor's empty state.
 *
 * The toolbar draws from the one action list, and the tree asks the model
 * the same questions a drop answers: the middle of a row files into it
 * when `canFile` allows, its edges place beside it when `canPlaceBeside`
 * allows. Selection goes through the flows.
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
import { entityLabel, projectLabel, excluded } from './queries.js';
import { el, icon, tooltipOn } from './dom.js';
import { openMenu } from './menu.js';
import { emptyState } from './pane.js';

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
 * label, or its type's name; a folder by its name. Matching reads
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
        : `${node.id} ${entityLabel(node)} ${ENTITY_TYPES[node.type].name}`;
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
 * always, then the tree while the project row stands open; nothing at
 * all without a project.
 * @param {import('./model.js').Model} model
 * @param {(id: string) => boolean} isExpanded
 * @param {boolean} hasProject
 * @param {string} [filter]
 * @param {boolean} [projectExpanded]
 * @returns {Array<{ kind: 'project', id: null, hasChildren: boolean, expanded: boolean } | (TreeRow & { kind: 'node' })>}
 */
export function visibleRows(model, isExpanded, hasProject, filter = '', projectExpanded = true) {
  if (!hasProject) return [];
  const hasChildren = childrenOf(model, null).length > 0;
  // A filter reveals through the collapsed root the way it reveals
  // through any collapsed branch.
  const open = projectExpanded || filter.trim() !== '';
  /** @type {{ kind: 'project', id: null, hasChildren: boolean, expanded: boolean }} */
  const project = { kind: 'project', id: null, hasChildren, expanded: hasChildren && open };
  if (!project.expanded) return [project];
  return [project, ...treeRows(model, isExpanded, filter).map((row) => ({ kind: /** @type {const} */ ('node'), ...row }))];
}

/**
 * What a row says: an entity's designation and its label when it has one,
 * a folder's name alone.
 * @param {import('./model.js').Node} node
 * @returns {{ designation: string|null, title: string|null }}
 */
export function labelParts(node) {
  if (node.kind === 'folder') return { designation: null, title: node.name };
  const label = entityLabel(node);
  return { designation: node.id, title: label || null };
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
 * The identifiers from one row to another in the order the tree shows
 * them, both ends included, the project row never among them. The
 * range a Shift click selects.
 * @param {Array<{ id: string|null }>} rows  the visible rows in order
 * @param {string} fromId
 * @param {string} toId
 * @returns {string[]}
 */
export function rowsBetween(rows, fromId, toId) {
  const ids = rows.map((row) => row.id);
  const from = ids.indexOf(fromId);
  const to = ids.indexOf(toId);
  if (from < 0 || to < 0) return to >= 0 ? [toId] : [];
  const [a, b] = from <= to ? [from, to] : [to, from];
  return ids.slice(a, b + 1).filter((id) => id !== null);
}

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {HTMLElement} context.container
 * @param {HTMLElement} context.toolbar
 * @param {HTMLElement} context.search       the filter bar
 * @param {HTMLInputElement} context.filterInput
 * @param {HTMLElement} context.filterClear
 * @param {ReturnType<import('./overlay.js').createOverlay>} context.overlay
 * @param {Array<import('./actions.js').Action>} context.actions
 * @param {(id: string|null) => Promise<boolean>} context.onSelect
 * @param {(ids: string[], anchorId: string) => Promise<boolean>} [context.onSelectMany]  a range or a set selected, with its anchor
 * @param {(id: string) => Promise<boolean>} [context.onToggle]  one row added to or taken from the selection
 * @param {(id: string) => void} [context.onSelectBelow]  a row and everything beneath it selected
 * @param {(id: string|null) => void} context.onActivate
 * @param {(id: string, parentId: string|null) => void} context.onFile
 * @param {(id: string, targetId: string, position: 'before'|'after') => void} context.onPlace
 */
export function createNavigator({
  store,
  container,
  toolbar,
  search,
  filterInput,
  filterClear,
  overlay,
  actions,
  onSelect,
  onSelectMany = async () => true,
  onToggle = async () => true,
  onSelectBelow = () => {},
  onActivate,
  onFile,
  onPlace,
}) {
  /** The ids being dragged, the whole selection when a selected row is taken; dataTransfer is unreadable during dragover. */
  let dragged = [];
  /** The rows selected, read once per render. */
  let chosen = new Set();
  /** The row the keyboard focus stands on when it has parted from the selection, as Cmd ↑ ↓ part it, or null while they agree. */
  let keyboardFocus = null;
  /** The drag can go where every dragged row can. */
  const canDrop = (check) => dragged.length > 0 && dragged.every((id) => check(id).ok);
  /** The visible rows in order, for a range. */
  const visible = () => visibleRows(store.model(), openWithReveal(store.picker()), store.hasProject(), filter(), store.projectExpanded());

  /**
   * The open-branch predicate the tree draws and walks with: the durable
   * expansion, widened transiently while picking so nothing on offer
   * hides inside a collapsed level.
   * @param {ReturnType<typeof store.picker>} picker
   * @param {Set<string>} [candidates]  passed when the caller already derived them
   * @returns {(id: string) => boolean}
   */
  function openWithReveal(picker, candidates) {
    if (picker === null) return store.isExpanded;
    const revealed = revealSet(store.model(), candidates ?? pickerCandidates(store.model(), picker));
    return (id) => store.isExpanded(id) || revealed.has(id);
  }

  /**
   * The context menu: the same action list the toolbar draws from, at
   * the pointer. Opening it on a node selects the node first, guarded —
   * the menu opens only when the selection lands.
   * @param {string|null} id
   * @param {{ x: number, y: number }} at
   */
  async function onContextMenu(id, at) {
    if (store.mode() !== null) return;
    if (!(id !== null && chosen.has(id)) && !(await onSelect(id))) return;
    // The same groups and dividers as the Edit menu, since both draw from
    // the one list in its order.
    const items = [];
    let lastGroup = null;
    for (const action of actions.filter((offered) => offered.context)) {
      if (lastGroup !== null && action.group !== lastGroup) items.push({ separator: true });
      lastGroup = action.group;
      items.push({
        label: action.describe ? action.describe() : action.label,
        icon: action.icon,
        hint: action.hint,
        danger: action.danger,
        disabled: !action.enabled(),
        onPick: () => action.run({ at }),
      });
    }
    openMenu({ overlay, label: 'Actions', at, items });
  }

  /** The filter as typed lives in the store, one truth for the tree, the drag guards, and the move enablements. */
  const filter = () => store.navigatorFilter();

  /** Whether dragging is off: picks own the tree's clicks, and a filtered view's neighbours are not real siblings. */
  const dragLocked = () => store.mode() !== null || filter().trim() !== '';
  /** @type {{ subject: string, id: string, picked: boolean }|null} the row last toggled by a plain click and what it became, the anchor whose act a Shift+click applies to a range */
  let lastPick = null;
  /** @type {string|null} the selection at the last render, so a render after the selection moved puts the focus on it */
  let lastSelection = null;

  /** The pickable rows shown between two rows, both included, in the tree's order. */
  function pickableBetween(fromId, toId) {
    const ids = [.../** @type {NodeListOf<HTMLElement>} */ (container.querySelectorAll('.tree-row.pickable'))].map((row) => row.dataset.id);
    const a = ids.indexOf(fromId);
    const b = ids.indexOf(toId);
    if (a < 0 || b < 0) return [];
    return ids.slice(Math.min(a, b), Math.max(a, b) + 1);
  }

  filterInput.addEventListener('input', () => {
    filterClear.hidden = filterInput.value === '';
    store.setNavigatorFilter(filterInput.value);
  });

  // The clear action exists only while there is something to clear, and
  // Escape is the keyboard's way to it.
  function clearFilter() {
    filterInput.value = '';
    filterClear.hidden = true;
    store.setNavigatorFilter('');
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
        toolbar.appendChild(el('span', { className: 'toolbar-divider' }));
      }
      lastGroup = action.group;

      const attributes = {
        type: 'button',
        'data-action': action.id,
      };
      if (action.menu) {
        attributes['aria-haspopup'] = 'menu';
        attributes['aria-expanded'] = 'false';
      }
      const button = el(
        'button',
        { className: `ghost-button ghost-icon${action.danger ? ' ghost-danger' : ''}`, attributes },
        [icon(action.icon)]
      );
      button.addEventListener('click', () => action.run({ anchor: button }));
      tooltipOn(button, action.label);
      toolbar.appendChild(button);
      toolbarButtons.set(action, button);
    }
  }

  function syncToolbar() {
    for (const [action, button] of toolbarButtons) {
      button.disabled = !action.enabled();
      if (action.describe) tooltipOn(button, action.describe());
    }
  }

  // --- The rows --------------------------------------------------------

  function clearDropMarks(rowElement) {
    rowElement.classList.remove('drop-target', 'drop-before', 'drop-after');
  }

  function renderProjectRow(row) {
    const selected = store.selection() === null;
    const attributes = {
      role: 'treeitem',
      'aria-level': '1',
      'aria-selected': String(selected),
      tabindex: selected ? '0' : '-1',
    };
    if (row.hasChildren) attributes['aria-expanded'] = String(row.expanded);
    const rowElement = el('div', {
      className: `tree-row project-row${selected ? ' selected' : ''}`,
      attributes,
    });
    const twisty = el('span', { className: 'twisty' });
    if (row.hasChildren) {
      twisty.appendChild(icon(row.expanded ? 'i-chevron-down' : 'i-chevron-right'));
      twisty.addEventListener('click', (event) => {
        event.stopPropagation();
        store.setProjectExpanded(!row.expanded);
      });
    }
    rowElement.appendChild(twisty);
    rowElement.appendChild(icon(PROJECT_ICON));

    const label = projectLabel(store.model());
    rowElement.appendChild(
      label
        ? el('span', { className: 'row-title', text: label })
        : el('span', { className: 'row-title untitled', text: 'Untitled' })
    );

    rowElement.addEventListener('click', () => {
      if (store.picker() === null) onSelect(null);
    });
    rowElement.addEventListener('dblclick', () => onActivate(null));
    rowElement.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      onContextMenu(null, { x: event.clientX, y: event.clientY });
    });
    rowElement.addEventListener('dragover', (event) => {
      if (!canDrop((id) => canFile(store.model(), id, null))) return;
      event.preventDefault();
      event.stopPropagation();
      rowElement.classList.add('drop-target');
    });
    rowElement.addEventListener('dragleave', () => clearDropMarks(rowElement));
    rowElement.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();
      clearDropMarks(rowElement);
      if (dragged.length > 0) onFile(dragged.length === 1 ? dragged[0] : dragged, null);
    });
    return rowElement;
  }

  function renderRow(row, picking) {
    const selected = chosen.has(row.id);
    const anchor = selected && chosen.size > 1 && row.id === store.selection();
    const focused = keyboardFocus !== null && row.id === keyboardFocus;
    const pickable = picking.candidates.has(row.id);
    const picked = picking.picks.has(row.id);
    const attributes = {
      role: 'treeitem',
      'aria-level': String(row.depth + 2),
      'aria-selected': String(selected),
      tabindex: (keyboardFocus === null ? row.id === store.selection() : focused) ? '0' : '-1',
      'data-id': row.id,
    };
    if (!dragLocked()) attributes.draggable = 'true';
    if (row.hasChildren) attributes['aria-expanded'] = String(row.expanded);
    if (pickable) attributes['aria-checked'] = String(picked);

    const classes = ['tree-row'];
    if (selected) classes.push('selected');
    if (anchor) classes.push('anchor');
    if (focused) classes.push('focused');
    if (pickable) classes.push('pickable');
    if (picked) classes.push('picked');
    if (picking.subject === row.id) classes.push('picker-subject');
    if (picking.subject !== null && !pickable && picking.subject !== row.id) classes.push('pick-dim');
    if (excluded(row.node)) classes.push('excluded');
    if (store.cut().includes(row.id)) classes.push('cut');
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

    if (pickable) {
      rowElement.appendChild(el('span', { className: `checkbox${picked ? ' on' : ''}`, attributes: { 'aria-hidden': 'true' } }, [icon('i-checkmark')]));
    }
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
    if (excluded(row.node)) rowElement.appendChild(el('span', { className: 'visually-hidden', text: 'excluded' }));

    rowElement.addEventListener('mousedown', (event) => {
      if (event.shiftKey) event.preventDefault();
    });
    rowElement.addEventListener('click', (event) => {
      if (!pickable) {
        if (picking.subject !== null) return;
        if (event.shiftKey && store.selection() !== null) onSelectMany(rowsBetween(visible(), store.selection(), row.id), row.id);
        else if (event.metaKey || event.ctrlKey) onToggle(row.id);
        else onSelect(row.id);
        return;
      }
      const anchor = lastPick !== null && lastPick.subject === picking.subject && lastPick.id !== row.id ? lastPick : null;
      if (event.shiftKey && anchor !== null) {
        const range = pickableBetween(anchor.id, row.id);
        if (anchor.picked) store.pickAll(range);
        else store.unpickAll(range);
        return;
      }
      store.togglePick(row.id);
      lastPick = { subject: picking.subject, id: row.id, picked: !picked };
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
      if (dragLocked()) {
        event.preventDefault();
        return;
      }
      dragged = chosen.has(row.id) && chosen.size > 1 ? [...chosen] : [row.id];
      event.dataTransfer.setData('text/plain', dragged.join(' '));
      event.dataTransfer.effectAllowed = 'move';
    });
    rowElement.addEventListener('dragend', () => {
      dragged = [];
    });
    rowElement.addEventListener('dragover', (event) => {
      if (dragged.length === 0) return;
      const rect = rowElement.getBoundingClientRect();
      const zone = dropZone((event.clientY - rect.top) / rect.height);
      const allowed =
        zone === 'into'
          ? canDrop((id) => canFile(store.model(), id, row.id))
          : canDrop((id) => canPlaceBeside(store.model(), id, row.id));
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
      if (dragged.length === 0) return;
      const rect = rowElement.getBoundingClientRect();
      const zone = dropZone((event.clientY - rect.top) / rect.height);
      const taken = dragged.length === 1 ? dragged[0] : dragged;
      if (zone === 'into') onFile(taken, row.id);
      else onPlace(taken, row.id, zone);
    });

    return rowElement;
  }

  // The landing keeps one quiet line; the ways in live in the editor's
  // empty state.
  function renderLanding() {
    container.appendChild(emptyState('No project'));
  }

  function render() {
    const scroll = container.scrollTop;
    const hadFocus = container.contains(document.activeElement);
    const focusedId = hadFocus ? /** @type {HTMLElement|null} */ (document.activeElement.closest('.tree-row'))?.dataset.id ?? null : null;

    container.textContent = '';
    search.hidden = !store.hasProject();
    if (!store.hasProject()) {
      renderLanding();
      syncToolbar();
      return;
    }

    const picker = store.picker();
    chosen = new Set(store.selected());
    if (keyboardFocus !== null && (!store.hasProject() || store.selection() !== lastSelection)) keyboardFocus = null;
    const picking = {
      candidates: pickerCandidates(store.model(), picker),
      picks: new Set(picker?.picks.map((pick) => pick.id) ?? []),
      subject: picker?.subject ?? null,
    };
    const isOpen = openWithReveal(picker, picking.candidates);
    const tree = el('div', { className: 'tree', attributes: { role: 'tree', 'aria-label': 'Model' } });
    for (const row of visibleRows(store.model(), isOpen, true, filter(), store.projectExpanded())) {
      tree.appendChild(row.kind === 'project' ? renderProjectRow(row) : renderRow(row, picking));
    }
    container.appendChild(tree);

    container.scrollTop = scroll;
    const selected = store.selection();
    const moved = selected !== lastSelection;
    lastSelection = selected;
    if (hadFocus) {
      const again = focusedId === null || moved ? null : container.querySelector(`.tree-row[data-id="${focusedId}"]`);
      /** @type {HTMLElement|null} */ (again ?? container.querySelector('.tree-row.selected'))?.focus({ preventScroll: moved ? false : true });
    } else if (moved) {
      container.querySelector('.tree-row.selected')?.scrollIntoView({ block: 'nearest' });
    }

    syncToolbar();
  }

  // The space below the rows files to the top of the tree, and the
  // background context menu acts there too.
  container.addEventListener('dragover', (event) => {
    if (!canDrop((id) => canFile(store.model(), id, null))) return;
    event.preventDefault();
  });
  container.addEventListener('drop', (event) => {
    event.preventDefault();
    if (dragged.length > 0) onFile(dragged.length === 1 ? dragged[0] : dragged, null);
  });
  container.addEventListener('contextmenu', (event) => {
    if (!store.hasProject()) return;
    if (event.target !== container && /** @type {Element} */ (event.target).closest('.tree-row')) return;
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
    const rows = visibleRows(store.model(), openWithReveal(picker), store.hasProject(), filter(), store.projectExpanded());
    if (rows.length === 0) return;
    const selection = store.selection();
    // The keyboard's row: the focus where it has parted from the selection, else the anchor.
    const focus = keyboardFocus !== null && rows.some((held) => held.id === keyboardFocus) ? keyboardFocus : selection;
    const index = rows.findIndex((row) => row.id === focus);
    const row = index >= 0 ? rows[index] : null;
    const modifier = event.metaKey || event.ctrlKey;
    const follow = (id) => {
      keyboardFocus = null;
      onSelect(id);
    };

    if (picker !== null) {
      // Picking owns the tree: the selection stays on the subject, the
      // arrows move the focus alone, and Space picks what the focus is on.
      if (event.code === 'Space' || event.key === 'Enter') {
        event.preventDefault();
        if (event.code === 'Space' && row && pickerCandidates(store.model(), picker).has(row.id)) store.togglePick(row.id);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        store.pickAll([.../** @type {NodeListOf<HTMLElement>} */ (container.querySelectorAll('.tree-row.pickable'))].map((held) => held.dataset.id));
        return;
      }
      const step = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: rows.length - 1 }[event.key];
      if (step !== undefined) {
        event.preventDefault();
        const next = rows[Math.min(rows.length - 1, Math.max(0, step))];
        if (!next) return;
        keyboardFocus = next.id;
        render();
        /** @type {HTMLElement|null} */ (container.querySelector(`.tree-row[tabindex="0"]`))?.focus({ preventScroll: false });
      }
      return;
    }

    if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && ['x', 'c', 'v'].includes(event.key.toLowerCase())) {
      event.preventDefault();
      runAction({ x: 'cut', c: 'copy', v: 'paste' }[event.key.toLowerCase()]);
    } else if (modifier && event.shiftKey && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      if (row === null) return;
      onSelectBelow(row.kind === 'project' ? null : row.id);
    } else if (modifier && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      const shown = rows.filter((held) => held.kind === 'node').map((held) => held.id);
      if (shown.length > 0) onSelectMany(shown, row && row.id !== null ? row.id : shown[0]);
    } else if (modifier && event.shiftKey && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault();
      if (row === null || row.id === null) return;
      const edge = event.key === 'Home' ? rows.find((held) => held.id !== null) : rows[rows.length - 1];
      onSelectMany(rowsBetween(rows, row.id, edge.id), row.id);
    } else if (modifier && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      const next = rows[index + (event.key === 'ArrowDown' ? 1 : -1)];
      if (!next) return;
      keyboardFocus = next.id;
      render();
      /** @type {HTMLElement|null} */ (container.querySelector(`.tree-row[tabindex="0"]`))?.focus({ preventScroll: false });
    } else if (modifier && event.code === 'Space') {
      event.preventDefault();
      if (row && row.id !== null) onToggle(row.id);
    } else if (event.shiftKey && event.code === 'Space') {
      event.preventDefault();
      if (row && row.id !== null && selection !== null) onSelectMany(rowsBetween(rows, selection, row.id), row.id);
    } else if (event.shiftKey && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      const next = rows[index + (event.key === 'ArrowDown' ? 1 : -1)];
      if (!next || next.id === null) return;
      keyboardFocus = null;
      onSelectMany([...store.selected(), next.id], next.id);
    } else if (event.key === 'Escape' && (store.selected().length > 1 || keyboardFocus !== null)) {
      event.preventDefault();
      follow(selection);
    } else if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      runAction(event.key === 'ArrowUp' ? 'move-up' : 'move-down');
    } else if (event.key === 'F2') {
      event.preventDefault();
      runAction('edit');
    } else if (event.key === 'Backspace' && event.metaKey) {
      event.preventDefault();
      runAction('delete');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (index < 0) follow(rows[0].id);
      else if (rows[index + 1]) follow(rows[index + 1].id);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index > 0) follow(rows[index - 1].id);
    } else if (event.key === 'ArrowRight' && row) {
      event.preventDefault();
      if (row.hasChildren && !row.expanded) {
        if (row.kind === 'project') store.setProjectExpanded(true);
        else store.setExpanded(row.id, true);
      } else if (row.expanded) {
        follow(rows[index + 1].id);
      }
    } else if (event.key === 'ArrowLeft' && row) {
      event.preventDefault();
      if (row.expanded) {
        if (row.kind === 'project') store.setProjectExpanded(false);
        else store.setExpanded(row.id, false);
      } else if (row.kind === 'node') {
        follow(row.node.parent);
      }
    } else if (event.key === 'Home') {
      event.preventDefault();
      follow(rows[0].id);
    } else if (event.key === 'End') {
      event.preventDefault();
      follow(rows[rows.length - 1].id);
    } else if (event.key === 'Enter' || event.code === 'Space') {
      if (row === null) return;
      event.preventDefault();
      if (store.selected().length > 1) runAction('edit');
      else onActivate(row.id);
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
