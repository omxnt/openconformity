/**
 * The library function: a library is a project file used as a source of
 * entities, each of its root folders a catalogue, and an import copies
 * what is picked into the open project where the user stands in the
 * tree. The pure part reads the library as one tree of rows under a
 * filter and an expansion, keeps the picks as one set across the
 * catalogues with the checked state of every row derived from it, plans
 * what an import copies and copies it; the pane puts that over the
 * editor pane with a preview.
 *
 * An import is one way. Nothing is recognised as already in the project,
 * and picking the same act twice gives two. The picked entities travel
 * with their filing among themselves and the relationships among them.
 * A relationship to anything not picked stays behind. The picks are a tree's: checking a row checks it
 * and everything beneath it, unchecking one beneath leaves the row
 * partly checked, and only what is checked travels, a partly checked
 * heading saying what is beneath it and nothing more. Alt and click,
 * Option on a Mac, checks one entity without what is beneath it.
 * A folder is picked like an entity, with everything in it, and a picked
 * folder travels as a folder, so a catalogue can hold a project structure.
 * A catalogue itself is a shelf: checking it picks everything in it, and
 * it never travels.
 */

import { nodeOf, childrenOf, filedBeneath, addEntity, addFolder, relate } from './model.js';
import { entityLabel, entityMatches } from './queries.js';
import { TYPE_ICONS, FOLDER_ICON, CATALOGUE_ICON } from './icons.js';
import { ENTITY_TYPES } from './metamodel.js';
import { plural } from './text.js';
import { APPLE } from './platform.js';
import { loadProject } from './files.js';
import { el, icon, tooltipOn } from './dom.js';
import { splitter } from './splitter.js';
import { headSearch } from './pane.js';

/**
 * Whether a node answers a filter: an entity as the navigator matches
 * it, a folder by its name.
 * @param {import('./model.js').Node} node
 * @param {string} filter
 * @returns {boolean}
 */
function nodeMatches(node, filter) {
  if (node.kind === 'entity') return entityMatches(node, filter);
  return node.name.toLowerCase().includes(filter.trim().toLowerCase());
}

/**
 * @typedef {Object} LibraryRow
 * @property {import('./model.js').Node} node
 * @property {number} depth
 * @property {boolean} hasChildren
 * @property {boolean} expanded
 */

/**
 * Whether a node is a catalogue: a folder at the root of the library.
 * @param {import('./model.js').Node|null|undefined} node
 * @returns {boolean}
 */
export function isCatalogue(node) {
  return Boolean(node) && node.kind === 'folder' && node.parent === null;
}

/**
 * The library's tree as the rows it shows: depth first in filing order,
 * the catalogues at the root, a node's children only where it is expanded. Under a filter every
 * node that matches with everything beneath it, and every node above a
 * match, all expanded.
 * @param {import('./model.js').Model} library
 * @param {string} [filter]
 * @param {Set<string>} [expanded]
 * @returns {LibraryRow[]}
 */
export function libraryRows(library, filter = '', expanded = new Set()) {
  const filtering = filter.trim() !== '';
  const rows = [];
  const walk = (parentId, depth, keepAll) => {
    let kept = false;
    for (const node of childrenOf(library, parentId)) {
      const start = rows.length;
      const hasChildren = childrenOf(library, node.id).length > 0;
      const matches = keepAll || nodeMatches(node, filter);
      const open = hasChildren && (filtering || expanded.has(node.id));
      rows.push({ node, depth, hasChildren, expanded: open });
      const below = open ? walk(node.id, depth + 1, matches) : false;
      if (filtering && !matches && !below) rows.splice(start, rows.length - start);
      else kept = true;
    }
    return kept;
  };
  walk(null, 0, !filtering);
  return rows;
}

/**
 * The nodes a row stands for when checked: itself and everything filed
 * beneath it, entities and folders alike, a catalogue standing for what
 * is beneath it alone. Under a filter, only what the filter shows, so a
 * check picks what is seen and nothing hidden.
 * @param {import('./model.js').Model} library
 * @param {string} id
 * @param {Set<string>|null} [shown]  the rows a filter shows, or null for all
 * @returns {string[]}
 */
function nodesUnder(library, id, shown = null) {
  const node = nodeOf(library, id);
  if (!node) return [];
  const beneath = filedBeneath(library, id).map((held) => held.id);
  const all = isCatalogue(node) ? beneath : [id, ...beneath];
  return shown === null ? all : all.filter((held) => shown.has(held));
}

/**
 * How a row's checkbox stands for a set of picks. An entity is checked
 * when it is picked, mixed when it is not but something beneath it is,
 * none otherwise. A folder is checked when it and everything in it is
 * picked, mixed when it or some of it is, and a catalogue when
 * everything in it is. Under a filter the box answers for what is
 * shown beneath the row.
 * @param {import('./model.js').Model} library
 * @param {Set<string>} picks
 * @param {string} id
 * @param {Set<string>|null} [shown]  the rows a filter shows, or null for all
 * @returns {'checked'|'mixed'|'none'}
 */
export function checkState(library, picks, id, shown = null) {
  const node = nodeOf(library, id);
  if (!node) return 'none';
  const under = nodesUnder(library, id, shown);
  const picked = under.filter((held) => picks.has(held)).length;
  if (node.kind === 'entity') return picks.has(id) ? 'checked' : picked > 0 ? 'mixed' : 'none';
  if (under.length > 0 && picked === under.length) return 'checked';
  return picked > 0 ? 'mixed' : 'none';
}

/**
 * Toggle a row as a tree does: a checked row unpicks everything it
 * stands for, any other row picks all of it, under a filter only what
 * it shows. Alone, the one entity is picked or unpicked without what is
 * beneath it.
 * @param {import('./model.js').Model} library
 * @param {Set<string>} picks
 * @param {string} id
 * @param {boolean} [alone]
 * @param {Set<string>|null} [shown]  the rows a filter shows, or null for all
 */
export function togglePick(library, picks, id, alone = false, shown = null) {
  if (alone) {
    if (nodeOf(library, id)?.kind !== 'entity') return;
    if (picks.has(id)) picks.delete(id);
    else picks.add(id);
    return;
  }
  const under = nodesUnder(library, id, shown);
  const checked = checkState(library, picks, id, shown) === 'checked';
  for (const held of under) {
    if (checked) picks.delete(held);
    else picks.add(held);
  }
}

/**
 * What an import copies: the picked entities and folders in the
 * library's filing order, catalogue by catalogue, and nothing else. A
 * heading that is only partly checked travels nowhere, and a catalogue
 * never does.
 * @param {import('./model.js').Model} library
 * @param {Set<string>} picks
 * @returns {Array<import('./model.js').Entity|import('./model.js').Folder>}
 */
export function importPlan(library, picks) {
  return filedBeneath(library, null).filter((node) => picks.has(node.id) && !isCatalogue(node));
}

/**
 * Copy the picked entities and folders into the project: an entity with
 * its attributes, a folder with its name, each filed under the copy of
 * the nearest picked node above it, and under the target where none is
 * picked above it. Then every relationship of the library between two
 * copied entities, between their copies. Identifiers are the project's
 * own, issued as it issues them.
 * @param {import('./model.js').Model} project
 * @param {import('./model.js').Model} library
 * @param {Set<string>} picks
 * @param {string|null} targetId  the node the copies are filed under, or null for the root
 * @returns {{ ok: true, added: string[], related: number } | { ok: false, reason: string }}
 */
export function importInto(project, library, picks, targetId = null) {
  const mapping = new Map();
  const added = [];
  for (const node of importPlan(library, picks)) {
    let above = nodeOf(library, node.parent);
    while (above && !mapping.has(above.id)) above = nodeOf(library, above.parent);
    const parent = above ? mapping.get(above.id) : targetId;
    const result = node.kind === 'folder' ? addFolder(project, node.name, { parent }) : addEntity(project, node.type, { parent, attributes: { ...node.attributes } });
    if (!result.ok) return result;
    const copy = node.kind === 'folder' ? result.folder.id : result.entity.id;
    mapping.set(node.id, copy);
    added.push(copy);
  }
  let related = 0;
  for (const relationship of library.relationships.values()) {
    if (!mapping.has(relationship.source) || !mapping.has(relationship.target)) continue;
    const result = relate(project, relationship.type, mapping.get(relationship.source), mapping.get(relationship.target));
    if (!result.ok) return result;
    related += 1;
  }
  return { ok: true, added, related };
}

/** The modifier that picks one entity as the platform names it, Option on Apple's keyboards and Alt elsewhere. */
const ALT_KEY = APPLE ? 'Option' : 'Alt';

/** The tree's floor, the navigator's own, and the preview's, the widest tab row of the shipped library, which the supported viewport still gives with the tree and the navigator at their floors; the splitter's width; the tree's preset. A tab row wider than the preview scrolls. */
const TREE_FLOOR = 300;
const PREVIEW_FLOOR = 392;
const SPLITTER = 4;
const TREE_PRESET = 400;

/**
 * The picker as a mode of the editor pane, with the navigator alive
 * beside it. The head carries the title with what a pick would import,
 * the filter behind its magnifier, the Import button and the close. The
 * body carries, on the left under a Catalogues head, the library as one
 * tree with the catalogues open at its root and a checkbox per row, the
 * picks one set across them, and on the right under a
 * Preview head the entity under the highlight as the editor shows it,
 * its tabs and every field, the two halves split by a splitter kept
 * for the session. The
 * copies are filed where the navigator's selection stands. While open, the picker takes the whole column, the
 * relationship pane and its splitter hidden. Opened from the toolbar,
 * closed by its Cancel or Escape, never kept across a reload.
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {HTMLElement} context.head  the editor pane's head
 * @param {HTMLElement} context.body  the editor pane's body
 * @param {Object} context.library  the shipped library in the project file's shape
 * @param {(node: import('./model.js').Entity, into: HTMLElement) => void} context.showEntity  the editor's view of an entity, into a container
 * @param {(chosen: { library: import('./model.js').Model, picks: Set<string> }) => void} context.onImport
 * @param {() => void} context.onClose
 */
export function createLibraryPane({ store, head, body, library, showEntity, onImport, onClose }) {
  /** @type {{ ok: boolean, model?: import('./model.js').Model, statement?: string }|null} the library once read, on first use */
  let loaded = null;
  const libraryOf = () => {
    if (loaded === null) {
      const result = loadProject(library);
      loaded = result.ok ? { ok: true, model: result.model } : { ok: false, statement: result.statement };
    }
    return loaded;
  };

  let filter = '';
  let searchOpen = false;
  /** @type {number|null} the tree's width once the splitter has been dragged */
  let treeWidth = null;
  /** @type {Set<string>} the picked rows, across the catalogues */
  let picks = new Set();
  /** @type {Set<string>} the rows opened, the catalogues among them at first */
  let expanded = new Set();
  /** @type {string|null} the row the preview shows */
  let highlight = null;
  let list = null;
  let preview = null;
  let treeHead = null;
  let sheetHead = null;
  let count = null;
  let shown = false;

  for (const region of [head, body]) {
    region.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !store.libraryOpen()) return;
      event.preventDefault();
      onClose();
    });
  }

  function filedText() {
    const selected = nodeOf(store.model(), store.selection());
    if (!selected) return 'Filed at the root of the project';
    if (selected.kind === 'folder') return `Filed in the folder ${selected.name}`;
    const label = entityLabel(selected);
    return `Filed under ${label ? `${selected.id} ${label}` : selected.id}`;
  }

  /**
   * The tree's filter in the Catalogues head, on demand: a magnifier
   * opens a compact field, focused; Escape closes and clears, so does
   * leaving it empty.
   */
  function searchControl() {
    return headSearch({
      open: searchOpen,
      label: 'Filter the library',
      value: filter,
      onOpen: () => {
        searchOpen = true;
        renderTreeHead();
        treeHead.querySelector('.head-search')?.focus();
      },
      onChange: (value) => {
        filter = value;
        renderList();
      },
      onClose: () => {
        searchOpen = false;
        filter = '';
        renderTreeHead();
        renderList();
      },
    });
  }

  function renderTreeHead() {
    treeHead.textContent = '';
    treeHead.append(el('span', { className: 'library-side-title', text: 'Catalogues' }), el('span', { className: 'toolbar-spacer' }), el('div', { className: 'pane-head-actions' }, [searchControl()]));
  }

  /**
   * The preview's head as the editor's: the highlighted entity's type,
   * identifier and label, a folder's or a catalogue's icon and name, and
   * the word Preview while nothing is highlighted.
   * @param {import('./model.js').Node|null} node
   */
  function renderSheetHead(node) {
    sheetHead.textContent = '';
    if (!node) {
      sheetHead.appendChild(el('span', { className: 'library-side-title', text: 'Preview' }));
      return;
    }
    const parts = [];
    if (node.kind === 'folder') {
      parts.push(icon(isCatalogue(node) ? CATALOGUE_ICON : FOLDER_ICON), el('span', { className: 'subhead-kind', text: isCatalogue(node) ? 'Catalogue' : 'Folder' }), el('span', { className: 'subhead-title', text: node.name }));
    } else {
      const type = ENTITY_TYPES[node.type];
      parts.push(icon(TYPE_ICONS[node.type], type.pillar), el('span', { className: 'subhead-kind', text: type.name }), el('span', { className: 'mono designation', text: node.id }));
      const label = entityLabel(node);
      if (label) parts.push(el('span', { className: 'subhead-title', text: label }));
    }
    sheetHead.appendChild(el('div', { className: 'pane-head-name' }, parts));
  }

  function renderCount() {
    const held = libraryOf();
    const plan = held.ok ? importPlan(held.model, picks) : [];
    const entities = plan.filter((node) => node.kind === 'entity').length;
    const folders = plan.length - entities;
    const parts = [entities > 0 ? plural(entities, 'entity') : '', folders > 0 ? plural(folders, 'folder') : ''].filter(Boolean);
    count.textContent = plan.length === 0 ? 'Nothing picked' : `${parts.join(' and ')} to import`;
    const button = head.querySelector('.library-import');
    if (button) button.disabled = plan.length === 0;
  }

  function renderHead() {
    head.textContent = '';
    head.hidden = false;
    count = el('span', { className: 'head-count' });
    const importButton = el('button', { className: 'form-button button-primary library-import', text: 'Import', attributes: { type: 'button' } });
    importButton.addEventListener('click', () => {
      const held = libraryOf();
      if (!held.ok || picks.size === 0) return;
      const chosen = { library: held.model, picks };
      picks = new Set();
      onImport(chosen);
    });
    const cancel = el('button', { className: 'ghost-button', text: 'Cancel', attributes: { type: 'button' } });
    cancel.addEventListener('click', onClose);
    head.append(
      el('span', { className: 'head-title', text: 'Import from library' }),
      count,
      el('span', { className: 'toolbar-spacer' }),
      el('div', { className: 'pane-head-actions' }, [cancel, importButton])
    );
    renderCount();
  }

  /** The row above or below a row among the rows shown, wrapping at neither end. */
  function rowBeside(id, step) {
    const rows = [...list.querySelectorAll('.library-row')];
    const at = rows.findIndex((row) => row.dataset.id === id);
    return rows[Math.min(rows.length - 1, Math.max(0, at + step))] ?? null;
  }

  function focusRow(id) {
    highlight = id;
    renderList();
    renderPreview();
    list.querySelector(`.library-row[data-id="${id}"]`)?.focus();
  }

  function renderList() {
    list.textContent = '';
    const held = libraryOf();
    if (!held.ok) {
      list.appendChild(el('p', { className: 'library-note', text: held.statement ?? 'The library could not be read.' }));
      renderCount();
      return;
    }
    const library = held.model;
    const rows = libraryRows(library, filter, expanded);
    const shown = filter.trim() === '' ? null : new Set(rows.map((row) => row.node.id));
    if (rows.length === 0) {
      list.appendChild(el('p', { className: 'library-note', text: filter.trim() === '' ? 'The library is empty.' : 'Nothing matches the filter.' }));
    }
    const focusable = rows.some((row) => row.node.id === highlight) ? highlight : rows[0]?.node.id;
    for (const { node, depth, hasChildren, expanded: open } of rows) {
      const state = checkState(library, picks, node.id, shown);
      const attributes = {
        role: 'treeitem',
        'aria-level': String(depth + 1),
        'aria-checked': state === 'checked' ? 'true' : state === 'mixed' ? 'mixed' : 'false',
        'aria-selected': String(node.id === highlight),
        tabindex: node.id === focusable ? '0' : '-1',
        'data-id': node.id,
      };
      if (hasChildren) attributes['aria-expanded'] = String(open);
      const row = el('div', { className: `library-row${node.kind === 'folder' ? ' folder' : ''}${isCatalogue(node) ? ' catalogue' : ''}${node.id === highlight ? ' highlighted' : ''}`, attributes });
      row.style.paddingLeft = `${16 + depth * 16}px`;

      const twisty = el('span', { className: 'twisty' });
      if (hasChildren) {
        twisty.appendChild(icon(open ? 'i-chevron-down' : 'i-chevron-right'));
        twisty.addEventListener('click', (event) => {
          event.stopPropagation();
          if (open) expanded.delete(node.id);
          else expanded.add(node.id);
          renderList();
        });
      }

      const box = el('input', { attributes: { type: 'checkbox', tabindex: '-1', 'aria-label': isCatalogue(node) ? `Pick everything in ${node.name}` : `Pick ${node.kind === 'folder' ? node.name : node.id}` } });
      box.checked = state === 'checked';
      box.indeterminate = state === 'mixed';
      const check = el('span', { className: 'pick' }, [box, el('span', { className: `checkbox${state === 'mixed' ? ' mixed' : ''}` }, [icon('i-checkmark')])]);
      check.addEventListener('click', (event) => {
        event.stopPropagation();
        event.preventDefault();
        togglePick(library, picks, node.id, event.altKey, shown);
        focusRow(node.id);
        renderCount();
      });

      row.append(twisty, check);
      box.addEventListener('click', (event) => event.preventDefault());
      if (node.kind === 'folder') {
        row.append(icon(isCatalogue(node) ? CATALOGUE_ICON : FOLDER_ICON), el('span', { className: 'row-title', text: node.name }));
      } else {
        row.append(icon(TYPE_ICONS[node.type], ENTITY_TYPES[node.type].pillar), el('span', { className: 'mono designation', text: node.id }));
        const label = entityLabel(node);
        if (label) row.appendChild(el('span', { className: 'row-title', text: label }));
      }
      row.addEventListener('click', (event) => {
        if (event.altKey && node.kind === 'entity') {
          togglePick(library, picks, node.id, true);
          renderCount();
        }
        focusRow(node.id);
      });
      row.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          const beside = rowBeside(node.id, event.key === 'ArrowDown' ? 1 : -1);
          if (beside) focusRow(beside.dataset.id);
        } else if (event.key === 'ArrowRight' && hasChildren && !open) {
          event.preventDefault();
          expanded.add(node.id);
          focusRow(node.id);
        } else if (event.key === 'ArrowLeft' && hasChildren && open) {
          event.preventDefault();
          expanded.delete(node.id);
          focusRow(node.id);
        } else if (event.code === 'Space') {
          event.preventDefault();
          togglePick(library, picks, node.id, event.altKey, shown);
          focusRow(node.id);
          renderCount();
        }
      });
      list.appendChild(row);
    }
    renderCount();
  }

  function renderPreview() {
    preview.textContent = '';
    const held = libraryOf();
    const node = held.ok ? nodeOf(held.model, highlight) : null;
    renderSheetHead(node);
    if (!node) {
      preview.appendChild(el('p', { className: 'library-note', text: 'Select a row to see its attributes.' }));
      return;
    }
    if (node.kind === 'folder') {
      preview.appendChild(el('p', { className: 'library-note', text: isCatalogue(node) ? 'Check the catalogue to pick everything in it.' : 'Check the folder to pick it and everything in it.' }));
      return;
    }
    showEntity(node, preview);
  }

  /** Everything the picker holds for one opening, dropped when it closes so it opens fresh. */
  function reset() {
    const held = libraryOf();
    picks = new Set();
    expanded = new Set(held.ok ? childrenOf(held.model, null).filter(isCatalogue).map((node) => node.id) : []);
    highlight = null;
    filter = '';
    searchOpen = false;
  }

  function render() {
    body.closest('.column')?.classList.toggle('library-open', store.libraryOpen() && store.hasProject());
    if (!store.libraryOpen()) {
      shown = false;
      return;
    }
    if (!shown) reset();
    const scrollTop = list?.scrollTop ?? 0;
    renderHead();
    body.textContent = '';
    list = el('div', { className: 'library-list', attributes: { role: 'tree', 'aria-label': 'The library' } });
    preview = el('div', { className: 'library-preview' });
    treeHead = el('div', { className: 'library-side-head' });
    renderTreeHead();
    const tree = el('div', { className: 'library-side library-tree' }, [treeHead, list]);
    if (treeWidth !== null) tree.style.flexBasis = `${treeWidth}px`;
    sheetHead = el('div', { className: 'library-side-head' });
    const sheet = el('div', { className: 'library-side' }, [sheetHead, preview]);
    const divider = el('div', {
      className: 'splitter splitter-vertical',
      attributes: { role: 'separator', 'aria-orientation': 'vertical', 'aria-label': 'Resize the library', tabindex: '0' },
    });
    const split = el('div', { className: 'library-split' }, [tree, divider, sheet]);
    splitter({
      splitter: divider,
      sizeAt: (event) => event.clientX - split.getBoundingClientRect().left,
      size: () => tree.getBoundingClientRect().width,
      limit: () => split.getBoundingClientRect().width - SPLITTER - PREVIEW_FLOOR,
      minimum: TREE_FLOOR,
      preset: TREE_PRESET,
      apply: (width) => {
        treeWidth = Math.round(width);
        tree.style.flexBasis = `${treeWidth}px`;
      },
      keys: ['ArrowLeft', 'ArrowRight'],
    });
    body.appendChild(el('div', { className: 'library' }, [split, el('p', { className: 'library-into' }, [el('span', { text: filedText() }), el('span', { className: 'library-hint', text: `${ALT_KEY} and click picks one entity without what is beneath it.` })])]));
    renderList();
    renderPreview();
    list.scrollTop = scrollTop;
    if (!shown) {
      shown = true;
      list.querySelector('.library-row[tabindex="0"]')?.focus();
    }
  }

  store.subscribe(render);
  render();

  /** Whether the open library holds picks, the work the leave warning guards. */
  const hasPicks = () => store.libraryOpen() && picks.size > 0;

  return { render, hasPicks };
}
