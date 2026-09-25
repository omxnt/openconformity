/**
 * The library function: a library is a project file used as a source of
 * items, and an import copies what is picked into the open project. The
 * pure part reads a library against the project, recognising by
 * reference what the project already holds, planning what a pick brings
 * with it and copying it in; the picker puts that in a dialog.
 *
 * Recognition is by reference alone, since imports carry no provenance
 * (D-056): an act by the year and number at the core of its citation, a
 * standard or a specification by its designation, and a requirement of
 * theirs by its owner's key together with its own clause. A pick brings
 * the entities that contain it, so nothing lands orphaned, and lands them
 * under the project's own where the project already holds them. Entities
 * and their containment travel; relationships do not (D-016).
 */

import { nodeOf, childrenOf, addEntity } from './model.js';
import { entityLabel, entityMatches } from './queries.js';
import { TYPE_ICONS, FOLDER_ICON } from './icons.js';
import { ENTITY_TYPES } from './metamodel.js';
import { loadProject } from './files.js';
import { el, icon, tabKeys } from './dom.js';

/** The types recognised by their own reference, and the types recognised by their owner's together with their own. */
const CITED = new Set(['LEG', 'HST', 'OSP']);
const OWNED = { ESR: 'LEG', HSR: 'HST', OSR: 'OSP' };

/**
 * The core of an entity's reference: for an act the year and the number
 * as `2023/1230`, whichever way the citation writes them; for a standard
 * or a specification its designation with its spacing and case
 * flattened. Null where there is nothing to join on.
 * @param {import('./model.js').Entity} entity
 * @returns {string|null}
 */
export function referenceCore(entity) {
  const reference = String(entity.attributes?.reference ?? '').trim();
  if (reference === '') return null;
  if (entity.type === 'LEG') {
    const found = reference.match(/(\d+)\s*\/\s*(\d+)/);
    return found ? `${found[1]}/${found[2]}` : null;
  }
  return reference.replace(/\s+/g, ' ').toLowerCase();
}

/**
 * The key an entity is recognised by across files, or null for a type
 * or an entity that has none.
 * @param {import('./model.js').Model} model
 * @param {import('./model.js').Node|null|undefined} node
 * @returns {string|null}
 */
export function joinKey(model, node) {
  if (!node || node.kind !== 'entity') return null;
  if (CITED.has(node.type)) {
    const core = referenceCore(node);
    return core ? `${node.type}:${core}` : null;
  }
  const ownerType = OWNED[node.type];
  if (!ownerType) return null;
  const owner = nodeOf(model, node.parent);
  if (!owner || owner.kind !== 'entity' || owner.type !== ownerType) return null;
  const ownerKey = joinKey(model, owner);
  const clause = String(node.attributes?.reference ?? '').trim().toLowerCase();
  return ownerKey && clause ? `${ownerKey}/${node.type}:${clause}` : null;
}

/**
 * What the project already holds of a library: for each entity of the
 * library, the identifier of the project's entity with the same key, or
 * null.
 * @param {import('./model.js').Model} project
 * @param {import('./model.js').Model} library
 * @returns {Map<string, string|null>}
 */
export function presence(project, library) {
  /** @type {Map<string, string>} */
  const held = new Map();
  for (const node of project.nodes.values()) {
    const key = joinKey(project, node);
    if (key && !held.has(key)) held.set(key, node.id);
  }
  const found = new Map();
  for (const node of library.nodes.values()) {
    if (node.kind !== 'entity') continue;
    const key = joinKey(library, node);
    found.set(node.id, key ? (held.get(key) ?? null) : null);
  }
  return found;
}

/**
 * A library's tree as rows, depth first in filing order, each node with
 * its depth; under a filter, an entity that matches with everything
 * beneath it, and every node above it, so the tree keeps its shape
 * around what matches and a matching act shows its clauses.
 * @param {import('./model.js').Model} library
 * @param {string} [filter]
 * @returns {Array<{ node: import('./model.js').Node, depth: number }>}
 */
export function libraryRows(library, filter = '') {
  const rows = [];
  const walk = (parentId, depth, keepAll) => {
    let kept = false;
    for (const node of childrenOf(library, parentId)) {
      const start = rows.length;
      rows.push({ node, depth });
      const matches = keepAll || (node.kind === 'entity' && entityMatches(node, filter));
      const below = walk(node.id, depth + 1, matches);
      if (!matches && !below) rows.splice(start, rows.length - start);
      else kept = true;
    }
    return kept;
  };
  walk(null, 0, filter.trim() === '');
  return rows;
}

/**
 * What an import of the picked entities copies: the picks and every
 * entity that contains one, in the library's tree order, each once.
 * @param {import('./model.js').Model} library
 * @param {Iterable<string>} pickedIds
 * @returns {import('./model.js').Entity[]}
 */
export function importPlan(library, pickedIds) {
  const wanted = new Set();
  for (const id of pickedIds) {
    for (let held = nodeOf(library, id); held && held.kind === 'entity'; held = nodeOf(library, held.parent)) wanted.add(held.id);
  }
  return libraryRows(library).map(({ node }) => node).filter((node) => node.kind === 'entity' && wanted.has(node.id));
}

/**
 * Copy the picked entities into the project: each with its attributes,
 * under the project's own entity where the project already holds the one
 * that contains it, under the copy of it where that was copied too, and
 * under the target otherwise. Entities the project already holds are not
 * copied again. Identifiers are the project's own, issued as it issues
 * them.
 * @param {import('./model.js').Model} project
 * @param {import('./model.js').Model} library
 * @param {Iterable<string>} pickedIds
 * @param {string|null} targetId  the folder to file the top of the copies under, or null for the root
 * @returns {{ ok: true, added: string[], kept: string[] } | { ok: false, reason: string }}
 */
export function importInto(project, library, pickedIds, targetId = null) {
  const present = presence(project, library);
  const mapping = new Map();
  const added = [];
  const kept = [];
  for (const node of importPlan(library, pickedIds)) {
    const existing = present.get(node.id);
    if (existing) {
      mapping.set(node.id, existing);
      kept.push(existing);
      continue;
    }
    const above = nodeOf(library, node.parent);
    const parent = above && above.kind === 'entity' ? (mapping.get(above.id) ?? targetId) : targetId;
    const result = addEntity(project, node.type, { parent, attributes: { ...node.attributes } });
    if (!result.ok) return result;
    mapping.set(node.id, result.entity.id);
    added.push(result.entity.id);
  }
  return { ok: true, added, kept };
}

/**
 * The picker: a dialog over the workspace listing a library's tree with a
 * checkbox per entity, the ones the project already holds greyed and
 * unpickable, a filter, and Import. Resolves to what was chosen, or null.
 * @param {Object} context
 * @param {ReturnType<import('./dialog.js').createDialogs>} context.dialogs
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {import('../library/index.js').Library[]} context.libraries
 * @returns {Promise<{ library: import('./model.js').Model, picks: string[], target: string|null }|null>}
 */
export async function openLibraryPicker({ dialogs, store, libraries }) {
  const project = store.model();
  const selected = nodeOf(project, store.selection());
  const target = selected && selected.kind === 'folder' ? selected : null;

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
  const picks = new Set();

  const body = el('div', { className: 'library' });
  const list = el('div', { className: 'library-list', attributes: { role: 'group', 'aria-label': 'The library' } });
  const count = el('span', { className: 'library-count' });
  const search = el('input', {
    className: 'field-input',
    attributes: { type: 'search', placeholder: 'Filter', autocomplete: 'off', 'aria-label': 'Filter the library' },
  });
  search.addEventListener('input', () => {
    filter = search.value;
    renderList();
  });

  function renderTabs() {
    if (libraries.length < 2) return el('p', { className: 'library-source', text: `${libraries[0].name}, as of ${libraries[0].date}` });
    const tabs = el('div', { className: 'tabs', attributes: { role: 'tablist', 'aria-label': 'Library' } });
    libraries.forEach((entry, i) => {
      const tab = el('button', {
        className: 'tab',
        text: entry.name,
        attributes: { type: 'button', role: 'tab', 'aria-selected': String(i === current), tabindex: i === current ? '0' : '-1' },
      });
      tab.addEventListener('click', () => {
        current = i;
        picks.clear();
        render();
      });
      tabs.appendChild(tab);
    });
    tabKeys(tabs, (i) => {
      current = i;
      picks.clear();
      render();
      body.querySelector('.tab[aria-selected="true"]')?.focus();
    });
    return tabs;
  }

  function renderList() {
    list.textContent = '';
    const entry = libraries[current];
    const held = libraryOf(entry);
    if (!held.ok) {
      list.appendChild(el('p', { className: 'library-note', text: held.statement ?? 'The library could not be read.' }));
      count.textContent = '';
      return;
    }
    const library = held.model;
    const present = presence(project, library);
    const rows = libraryRows(library, filter);
    if (rows.length === 0) {
      list.appendChild(el('p', { className: 'library-note', text: filter.trim() === '' ? 'The library is empty.' : 'Nothing matches the filter.' }));
    }
    for (const { node, depth } of rows) {
      const row = el('div', { className: 'library-row' });
      row.style.paddingLeft = `${16 + depth * 16}px`;
      if (node.kind === 'folder') {
        row.classList.add('folder');
        row.append(icon(FOLDER_ICON), el('span', { text: node.name }));
        list.appendChild(row);
        continue;
      }
      const already = present.get(node.id);
      const box = el('input', { attributes: { type: 'checkbox', 'aria-label': `Pick ${node.id}` } });
      box.checked = picks.has(node.id);
      if (already) {
        box.disabled = true;
        row.classList.add('present');
      }
      box.addEventListener('change', () => {
        if (box.checked) picks.add(node.id);
        else picks.delete(node.id);
        renderCount(library);
      });
      const label = el('label', {}, [
        box,
        el('span', { className: 'checkbox' }, [icon('i-checkmark')]),
        icon(TYPE_ICONS[node.type], ENTITY_TYPES[node.type].pillar),
        el('span', { className: 'mono designation', text: node.id }),
        el('span', { className: 'row-title', text: entityLabel(node) }),
      ]);
      row.appendChild(label);
      if (already) row.appendChild(el('span', { className: 'tag', text: 'In the project' }));
      list.appendChild(row);
    }
    renderCount(library);
  }

  function renderCount(library) {
    const planned = importPlan(library, picks).filter((node) => !presence(project, library).get(node.id)).length;
    count.textContent = planned === 0 ? 'Nothing picked' : `${planned} ${planned === 1 ? 'entity' : 'entities'} to import`;
  }

  function render() {
    body.textContent = '';
    body.append(renderTabs(), search, list, el('p', { className: 'library-into' }, [count, el('span', { text: ` · Into ${target ? `the folder ${target.name}` : 'the root of the project'}` })]));
    renderList();
  }
  render();

  const answer = await dialogs.open({
    title: 'Import',
    body,
    actions: [
      { label: 'Cancel', value: null, kind: 'secondary' },
      {
        label: 'Import',
        kind: 'primary',
        run: () => {
          const held = libraryOf(libraries[current]);
          if (!held.ok || picks.size === 0) return undefined;
          return { library: held.model, picks: [...picks], target: target?.id ?? null };
        },
      },
    ],
    initialFocus: search,
  });
  return answer ?? null;
}
