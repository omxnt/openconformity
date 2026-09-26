/**
 * The library function: a catalogue is a project file used as a source
 * of entities, and an import copies what is picked into the open project
 * where the user stands in the tree. The pure part reads a catalogue as
 * rows under a filter and an expansion, keeps the picks as a set with the
 * checked state of every row derived from it, plans what an import copies
 * and copies it; the pane puts that over the editor pane with a preview.
 *
 * An import is one way. Nothing is recognised as already in the project,
 * and picking the same act twice gives two. The picked entities travel
 * with their filing among themselves and the relationships among them.
 * A relationship to anything not picked stays behind, since its other
 * end is not there. Folders are the catalogue's shelves. They never
 * travel, and checking one checks what it holds.
 */

import { nodeOf, childrenOf, filedBeneath, addEntity, relate } from './model.js';
import { entityLabel, entityMatches } from './queries.js';
import { TYPE_ICONS, FOLDER_ICON } from './icons.js';
import { ENTITY_TYPES } from './metamodel.js';
import { typeOf } from './attributes.js';
import { setValues, firstTabName } from './editor.js';
import { loadProject } from './files.js';
import { el, icon, tabKeys, tooltipOn } from './dom.js';

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
 * A catalogue's tree as the rows it shows: depth first in filing order,
 * a node's children only where it is expanded. Under a filter every
 * node that matches with everything beneath it, and every node above a
 * match, all expanded, so the tree keeps its shape around what matches.
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
 * The entities a row stands for when checked: an entity itself and
 * every entity filed beneath it, a folder every entity filed in it.
 * @param {import('./model.js').Model} library
 * @param {string} id
 * @returns {string[]}
 */
function entitiesUnder(library, id) {
  const node = nodeOf(library, id);
  if (!node) return [];
  const beneath = filedBeneath(library, id).filter((held) => held.kind === 'entity').map((held) => held.id);
  return node.kind === 'entity' ? [id, ...beneath] : beneath;
}

/**
 * How a row's checkbox stands for a set of picks: checked when every
 * entity it stands for is picked, mixed when some are, none otherwise.
 * @param {import('./model.js').Model} library
 * @param {Set<string>} picks
 * @param {string} id
 * @returns {'checked'|'mixed'|'none'}
 */
export function checkState(library, picks, id) {
  const under = entitiesUnder(library, id);
  const picked = under.filter((held) => picks.has(held)).length;
  if (under.length === 0 || picked === 0) return 'none';
  return picked === under.length ? 'checked' : 'mixed';
}

/**
 * Toggle a row: a checked row unpicks everything it stands for, any
 * other row picks all of it.
 * @param {import('./model.js').Model} library
 * @param {Set<string>} picks
 * @param {string} id
 */
export function togglePick(library, picks, id) {
  const under = entitiesUnder(library, id);
  if (checkState(library, picks, id) === 'checked') for (const held of under) picks.delete(held);
  else for (const held of under) picks.add(held);
}

/**
 * What an import copies: the picked entities in the catalogue's filing
 * order. Folders never travel.
 * @param {import('./model.js').Model} library
 * @param {Set<string>} picks
 * @returns {import('./model.js').Entity[]}
 */
export function importPlan(library, picks) {
  return filedBeneath(library, null).filter((node) => node.kind === 'entity' && picks.has(node.id));
}

/**
 * Copy the picked entities into the project: each with its attributes,
 * filed under the copy of the nearest picked entity above it, and under
 * the target where none is picked above it. Then every relationship of
 * the catalogue between two picked entities, between their copies.
 * Identifiers are the project's own, issued as it issues them.
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
    const result = addEntity(project, node.type, { parent, attributes: { ...node.attributes } });
    if (!result.ok) return result;
    mapping.set(node.id, result.entity.id);
    added.push(result.entity.id);
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

/**
 * What an entity's attribute shows in the preview, or null for one that
 * holds nothing or shows nowhere: a set as its values, a table as its
 * row count, the rest as stored.
 * @param {import('./attributes.js').AttributeDefinition} definition
 * @param {unknown} value
 * @returns {string|null}
 */
export function previewValue(definition, value) {
  if (value === undefined || value === null || value === '') return null;
  if (definition.kind === 'computed' || definition.kind === 'entities' || definition.kind === 'drawing') return null;
  if (definition.kind === 'set') {
    const chosen = setValues(definition, value);
    return chosen.length > 0 ? chosen.join(', ') : null;
  }
  if (definition.kind === 'table') {
    const rows = Array.isArray(value) ? value.length : 0;
    return rows > 0 ? `${rows} ${rows === 1 ? 'row' : 'rows'}` : null;
  }
  return String(value);
}

/**
 * What the preview shows of an entity, by the editor's tabs: a section
 * per tab with the attributes that hold a value, in the editor's order,
 * a tab whose attributes all hold nothing left out.
 * @param {import('./model.js').Entity} entity
 * @returns {Array<{ name: string, fields: Array<{ name: string, value: string }> }>}
 */
export function previewSections(entity) {
  const type = typeOf(entity.type) ?? { attributes: [], groups: [] };
  const flat = (group) => [...group.attributes, ...(group.groups ?? []).flatMap(flat)];
  const tabs = [{ name: firstTabName(entity.type), definitions: [...type.attributes, ...type.groups.filter((group) => !group.tab).flatMap(flat)] }];
  for (const group of type.groups) if (group.tab) tabs.push({ name: group.name, definitions: flat(group) });
  return tabs
    .map(({ name, definitions }) => ({
      name,
      fields: definitions
        .map((definition) => ({ name: definition.name, value: previewValue(definition, entity.attributes?.[definition.key]) }))
        .filter((field) => field.value !== null),
    }))
    .filter((section) => section.fields.length > 0);
}

/**
 * The picker as a mode of the editor pane, with the navigator alive
 * beside it. The head carries the title with what a pick would import,
 * the filter, the Import button and the close. The body carries the
 * catalogues as tabs, the open catalogue's tree with a checkbox per
 * row on the left, and on the right the entity under the highlight as
 * a sheet of what its attributes hold, by the editor's tabs as folds,
 * all closed until opened. The copies land where the navigator's
 * selection stands. While open, the picker takes the whole column, the
 * relationship pane and its splitter hidden. Opened from the toolbar,
 * closed by its X or Escape, never kept across a reload.
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {HTMLElement} context.head  the editor pane's head
 * @param {HTMLElement} context.body  the editor pane's body
 * @param {import('../library/index.js').Library[]} context.libraries
 * @param {(chosen: { library: import('./model.js').Model, picks: Set<string> }) => void} context.onImport
 * @param {() => void} context.onClose
 */
export function createLibraryPane({ store, head, body, libraries, onImport, onClose }) {
  /** @type {Map<string, { ok: boolean, model?: import('./model.js').Model, statement?: string }>} */
  const loaded = new Map();
  const libraryOf = (entry) => {
    if (!loaded.has(entry.id)) {
      const result = loadProject(entry.project);
      loaded.set(entry.id, result.ok ? { ok: true, model: result.model } : { ok: false, statement: result.statement });
    }
    return loaded.get(entry.id);
  };

  let current = 0;
  let filter = '';
  /** @type {Set<string>} the picked entities of the open catalogue */
  let picks = new Set();
  /** @type {Set<string>} the rows opened in the open catalogue */
  let expanded = new Set();
  /** @type {string|null} the row the preview shows */
  let highlight = null;
  /** @type {Set<string>} the preview's open sections */
  let openSections = new Set();
  let list = null;
  let preview = null;
  let count = null;
  let shown = false;

  for (const region of [head, body]) {
    region.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !store.libraryOpen()) return;
      event.preventDefault();
      onClose();
    });
  }

  function openCatalogue(index) {
    current = index;
    picks = new Set();
    expanded = new Set();
    highlight = null;
    openSections = new Set();
    render();
  }

  function targetText() {
    const selected = nodeOf(store.model(), store.selection());
    if (!selected) return 'the root of the project';
    if (selected.kind === 'folder') return `the folder ${selected.name}`;
    const label = entityLabel(selected);
    return label ? `${selected.id} ${label}` : selected.id;
  }

  function renderCount() {
    const held = libraryOf(libraries[current]);
    const planned = held.ok ? importPlan(held.model, picks).length : 0;
    count.textContent = planned === 0 ? 'Nothing picked' : `${planned} ${planned === 1 ? 'entity' : 'entities'} to import`;
    const button = head.querySelector('.library-import');
    if (button) button.disabled = planned === 0;
  }

  function renderHead() {
    head.textContent = '';
    head.hidden = false;
    count = el('span', { className: 'library-count' });
    const search = el('input', {
      className: 'field-input head-search',
      attributes: { type: 'search', placeholder: 'Filter', autocomplete: 'off', 'aria-label': 'Filter the catalogue' },
    });
    search.value = filter;
    search.addEventListener('input', () => {
      filter = search.value;
      renderList();
    });
    const importButton = el('button', { className: 'form-button button-primary library-import', text: 'Import', attributes: { type: 'button' } });
    importButton.addEventListener('click', () => {
      const held = libraryOf(libraries[current]);
      if (!held.ok || picks.size === 0) return;
      const chosen = { library: held.model, picks };
      picks = new Set();
      onImport(chosen);
    });
    const close = el('button', { className: 'ghost-button ghost-icon', attributes: { type: 'button' } }, [icon('i-close')]);
    close.addEventListener('click', onClose);
    tooltipOn(close, 'Close the library', { align: 'end' });
    head.append(
      el('span', { className: 'head-title', text: 'Import from library' }),
      count,
      el('span', { className: 'toolbar-spacer' }),
      el('div', { className: 'pane-head-actions' }, [search, importButton, close])
    );
  }

  function renderTabs() {
    const tabs = el('div', { className: 'tabs', attributes: { role: 'tablist', 'aria-label': 'Catalogues' } });
    libraries.forEach((entry, i) => {
      const tab = el('button', {
        className: 'tab',
        text: entry.name,
        attributes: { type: 'button', role: 'tab', 'aria-selected': String(i === current), tabindex: i === current ? '0' : '-1' },
      });
      tab.addEventListener('click', () => openCatalogue(i));
      tabs.appendChild(tab);
    });
    tabKeys(tabs, (i) => {
      openCatalogue(i);
      body.querySelector('.tab[aria-selected="true"]')?.focus();
    });
    return tabs;
  }

  /** The row above or below a row among the rows shown, wrapping at neither end. */
  function rowBeside(id, step) {
    const rows = [...list.querySelectorAll('.library-row')];
    const at = rows.findIndex((row) => row.dataset.id === id);
    return rows[Math.min(rows.length - 1, Math.max(0, at + step))] ?? null;
  }

  function focusRow(id) {
    if (id !== highlight) openSections = new Set();
    highlight = id;
    renderList();
    renderPreview();
    list.querySelector(`.library-row[data-id="${id}"]`)?.focus();
  }

  function renderList() {
    list.textContent = '';
    const held = libraryOf(libraries[current]);
    if (!held.ok) {
      list.appendChild(el('p', { className: 'library-note', text: held.statement ?? 'The catalogue could not be read.' }));
      renderCount();
      return;
    }
    const library = held.model;
    const rows = libraryRows(library, filter, expanded);
    if (rows.length === 0) {
      list.appendChild(el('p', { className: 'library-note', text: filter.trim() === '' ? 'The catalogue is empty.' : 'Nothing matches the filter.' }));
    }
    const focusable = rows.some((row) => row.node.id === highlight) ? highlight : rows[0]?.node.id;
    for (const { node, depth, hasChildren, expanded: open } of rows) {
      const state = checkState(library, picks, node.id);
      const attributes = {
        role: 'treeitem',
        'aria-level': String(depth + 1),
        'aria-checked': state === 'checked' ? 'true' : state === 'mixed' ? 'mixed' : 'false',
        'aria-selected': String(node.id === highlight),
        tabindex: node.id === focusable ? '0' : '-1',
        'data-id': node.id,
      };
      if (hasChildren) attributes['aria-expanded'] = String(open);
      const row = el('div', { className: `library-row${node.kind === 'folder' ? ' folder' : ''}${node.id === highlight ? ' highlighted' : ''}`, attributes });
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

      const box = el('input', { attributes: { type: 'checkbox', tabindex: '-1', 'aria-label': `Pick ${node.kind === 'folder' ? node.name : node.id}` } });
      box.checked = state === 'checked';
      box.indeterminate = state === 'mixed';
      box.addEventListener('change', () => {
        togglePick(library, picks, node.id);
        renderList();
        renderCount();
      });
      const check = el('label', {}, [box, el('span', { className: `checkbox${state === 'mixed' ? ' mixed' : ''}` }, [icon('i-checkmark')])]);
      check.addEventListener('click', (event) => event.stopPropagation());

      row.append(twisty, check);
      if (node.kind === 'folder') {
        row.append(icon(FOLDER_ICON), el('span', { className: 'row-title', text: node.name }));
      } else {
        row.append(icon(TYPE_ICONS[node.type], ENTITY_TYPES[node.type].pillar), el('span', { className: 'mono designation', text: node.id }));
        const label = entityLabel(node);
        if (label) row.appendChild(el('span', { className: 'row-title', text: label }));
      }
      row.addEventListener('click', () => focusRow(node.id));
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
        } else if (event.key === ' ') {
          event.preventDefault();
          togglePick(library, picks, node.id);
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
    const held = libraryOf(libraries[current]);
    const node = held.ok ? nodeOf(held.model, highlight) : null;
    if (!node) {
      preview.appendChild(el('p', { className: 'library-note', text: 'Select a row to see what it holds.' }));
      return;
    }
    if (node.kind === 'folder') {
      preview.append(
        el('div', { className: 'library-preview-head' }, [icon(FOLDER_ICON), el('span', { text: node.name })]),
        el('p', { className: 'library-note', text: 'Check the folder to pick everything filed in it.' })
      );
      return;
    }
    const type = ENTITY_TYPES[node.type];
    const parts = [icon(TYPE_ICONS[node.type], type.pillar), el('span', { className: 'subhead-kind', text: type.name }), el('span', { className: 'mono designation', text: node.id })];
    const label = entityLabel(node);
    if (label) parts.push(el('span', { className: 'subhead-title', text: label }));
    preview.appendChild(el('div', { className: 'library-preview-head' }, parts));
    const sections = previewSections(node);
    if (sections.length === 0) {
      preview.appendChild(el('p', { className: 'library-note', text: 'Its attributes hold nothing.' }));
      return;
    }
    for (const section of sections) {
      const open = openSections.has(section.name);
      const fold = el('button', { className: 'library-fold', attributes: { type: 'button', 'aria-expanded': String(open) } }, [
        el('span', { className: 'library-fold-chevron' }, [icon(open ? 'i-chevron-down' : 'i-chevron-right')]),
        el('span', { text: section.name }),
      ]);
      fold.addEventListener('click', () => {
        if (open) openSections.delete(section.name);
        else openSections.add(section.name);
        renderPreview();
      });
      const panel = el('div', { className: 'library-section' }, section.fields.map((field) => el('div', { className: 'field' }, [el('span', { className: 'field-label', text: field.name }), el('div', { className: 'field-static', text: field.value })])));
      panel.hidden = !open;
      preview.append(fold, panel);
    }
  }

  function render() {
    body.closest('.column')?.classList.toggle('library-open', store.libraryOpen() && store.hasProject());
    if (!store.libraryOpen()) {
      shown = false;
      return;
    }
    const scrollTop = list?.scrollTop ?? 0;
    renderHead();
    body.textContent = '';
    list = el('div', { className: 'library-list', attributes: { role: 'tree', 'aria-label': 'The catalogue' } });
    preview = el('div', { className: 'library-preview' });
    body.appendChild(
      el('div', { className: 'library' }, [
        renderTabs(),
        el('p', { className: 'library-source', text: `As of ${libraries[current].date}` }),
        el('div', { className: 'library-split' }, [list, preview]),
        el('p', { className: 'library-into', text: `Into ${targetText()}` }),
      ])
    );
    renderList();
    renderPreview();
    list.scrollTop = scrollTop;
    if (!shown) {
      shown = true;
      head.querySelector('.head-search')?.focus();
    }
  }

  store.subscribe(render);
  render();

  return { render };
}
