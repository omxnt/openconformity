/**
 * Left-pane tree.
 *
 * Layout:
 *   [-] PROJECT  Hydraulic Press 200T (demo)        [active]
 *     ├─ [-] Systems · 8
 *     │   ├─ [-] sys-1  Hydraulic Press 200T  [machine]
 *     │   │   ├─ [+] sys-2  Hydraulic Power Unit  [subsystem]
 *     │   │   └─ sys-3  Press frame  [subsystem]
 *     │   └─ ...
 *     ├─ [+] Legislations · 1
 *     └─ ...
 *   [+] PROJECT  Other project
 *
 * Multi-project: every loaded project renders as a top-level node.
 * Exactly one project is *active* — its row is visually marked. Clicking
 * any artifact inside a non-active project automatically activates that
 * project (so the editor pane targets the right thing).
 *
 * Connecting lines are drawn purely in CSS via `::before` and `::after`
 * pseudo-elements on each direct child of `.tree-children`.
 */

import * as state from './state.js';
import {
  ArtifactTypes,
  ArtifactTypeKeys,
  HazardEnergySources,
  labelOf,
  getSelfRefField,
  humanizeEnumValue,
} from './types.js';
import { el } from './util.js';
import { openLibraryPicker } from './library.js';
import { typeIcon, groupIcon, projectIcon } from './icons.js';

/**
 * Module-local UI state. Per-project sets so different projects keep
 * independent collapsed/expanded state.
 *
 * @type {Set<string>}                       projectIds whose root is collapsed
 */
const collapsedProjects = new Set();
/** @type {Map<string, Set<string>>} projectId → set of group keys collapsed */
const collapsedGroupsByProject = new Map();
/** @type {Map<string, Set<string>>} projectId → set of artifact ids collapsed for hierarchy display */
const collapsedHierByProject = new Map();
/** @type {Map<string, Set<string>>} projectId → set of legislation ids collapsed */
const collapsedLegislationsByProject = new Map();

function groupSet(projectId) {
  let s = collapsedGroupsByProject.get(projectId);
  if (!s) {
    s = new Set();
    collapsedGroupsByProject.set(projectId, s);
  }
  return s;
}

function hierSet(projectId) {
  let s = collapsedHierByProject.get(projectId);
  if (!s) {
    s = new Set();
    collapsedHierByProject.set(projectId, s);
  }
  return s;
}

function legislationSet(projectId) {
  let s = collapsedLegislationsByProject.get(projectId);
  if (!s) {
    s = new Set();
    collapsedLegislationsByProject.set(projectId, s);
  }
  return s;
}

// --- Search / filter helpers -----------------------------------------

/**
 * Does an artifact match the current search query (id or label
 * substring, case-insensitive)?
 * @param {import('./types.js').ArtifactKey} typeKey
 * @param {Object<string, any>} artifact
 */
function isMatch(typeKey, artifact) {
  if (!searchQuery) return true;
  const id = String(artifact.id ?? '').toLowerCase();
  if (id.includes(searchQuery)) return true;
  const t = ArtifactTypes[typeKey];
  const labelVal = artifact[t.labelField];
  if (typeof labelVal === 'string' && labelVal.toLowerCase().includes(searchQuery)) {
    return true;
  }
  return false;
}

/**
 * For a project, return the set of artifact ids that should be visible
 * given the current search query. Returns null when no search is active
 * (callers treat that as "show everything").
 *
 * Visibility rules:
 *   - direct match → visible
 *   - hierarchical parent of a visible item → visible
 *   - legislation parent of a visible essential requirement → visible
 *
 * @param {string} projectId
 * @returns {Set<string> | null}
 */
function computeVisibleSet(projectId) {
  if (!searchQuery) return null;
  const visible = new Set();

  // 1. Direct matches across every type.
  for (const typeKey of ArtifactTypeKeys) {
    for (const a of state.getByType(projectId, typeKey)) {
      if (isMatch(typeKey, a)) visible.add(a.id);
    }
  }

  // 2. Walk hierarchical parents up so ancestors of matches stay visible.
  for (const typeKey of ArtifactTypeKeys) {
    const parentField = getSelfRefField(typeKey);
    if (!parentField) continue;
    const items = state.getByType(projectId, typeKey);
    const byId = new Map(items.map((a) => [a.id, a]));
    for (const item of items) {
      if (!visible.has(item.id)) continue;
      let cur = item;
      while (
        cur[parentField] &&
        byId.has(cur[parentField]) &&
        !visible.has(cur[parentField])
      ) {
        visible.add(cur[parentField]);
        cur = byId.get(cur[parentField]);
      }
    }
  }

  // 3. Legislations parent ERs: visible-ER's legislation also visible.
  for (const er of state.getByType(projectId, 'essentialRequirement')) {
    if (visible.has(er.id) && er.legislationId) visible.add(er.legislationId);
  }

  return visible;
}

/** @type {HTMLElement | null} */
let mountEl = null;
/** @type {HTMLElement | null} */
let actionsEl = null;
/** @type {HTMLElement | null} */
let searchWrapEl = null;
/** @type {HTMLInputElement | null} */
let searchInputEl = null;
let searchQuery = '';
let unsubscribe = null;
/** @type {{ closeProject?: (projectId: string) => void, saveProject?: (projectId: string) => void } | null} */
let actions = null;

/**
 * @param {HTMLElement} rootEl
 * @param {{ closeProject?: (projectId: string) => void, saveProject?: (projectId: string) => void, actionsEl?: HTMLElement | null }} [opts]
 */
export function mountTree(rootEl, opts = {}) {
  mountEl = rootEl;
  actions = opts;
  actionsEl = opts.actionsEl ?? null;
  ensureSearchInput();
  if (unsubscribe) unsubscribe();
  unsubscribe = state.subscribe(handleChange);
  render();
}

/**
 * Mount the search input into the tree pane's actions slot once. It
 * persists across tree-body re-renders so typing never loses focus.
 */
function ensureSearchInput() {
  if (!actionsEl) return;
  if (searchWrapEl && actionsEl.contains(searchWrapEl)) return;
  if (!searchWrapEl) {
    searchInputEl = /** @type {HTMLInputElement} */ (
      el('input', {
        class: 'tree-search-input',
        type: 'search',
        placeholder: 'Search artifacts…',
        'aria-label': 'Search artifacts',
        oninput: (/** @type {InputEvent} */ e) => {
          searchQuery = /** @type {HTMLInputElement} */ (e.target).value
            .trim()
            .toLowerCase();
          updateSearchClearVisibility();
          render();
        },
        onkeydown: (/** @type {KeyboardEvent} */ e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            clearSearch();
          }
        },
      })
    );
    const clearBtn = el(
      'button',
      {
        class: 'tree-search-clear',
        type: 'button',
        title: 'Clear search',
        'aria-label': 'Clear search',
        tabindex: '-1',
        onmousedown: (/** @type {MouseEvent} */ e) => e.preventDefault(),
        onclick: () => {
          clearSearch();
          searchInputEl?.focus();
        },
      },
      ['×']
    );
    searchWrapEl = el('div', { class: 'tree-search' }, [searchInputEl, clearBtn]);
  }
  actionsEl.replaceChildren(searchWrapEl);
  updateSearchClearVisibility();
}

function clearSearch() {
  if (searchInputEl) searchInputEl.value = '';
  searchQuery = '';
  updateSearchClearVisibility();
  render();
}

function updateSearchClearVisibility() {
  if (!searchWrapEl) return;
  searchWrapEl.classList.toggle('has-value', !!searchInputEl?.value);
}

/** @param {import('./state.js').Change} change */
function handleChange(change) {
  if (change.kind === 'replace') {
    collapsedProjects.clear();
    collapsedGroupsByProject.clear();
    collapsedHierByProject.clear();
    collapsedLegislationsByProject.clear();
  }
  if (change.kind === 'project-remove') {
    collapsedProjects.delete(change.projectId);
    collapsedGroupsByProject.delete(change.projectId);
    collapsedHierByProject.delete(change.projectId);
    collapsedLegislationsByProject.delete(change.projectId);
  }
  render();
}

function render() {
  if (!mountEl) return;
  const scrollTop = mountEl.scrollTop;
  mountEl.replaceChildren();

  const selection = state.getSelection();
  const activeProjectId = state.getActiveProjectId();
  const projectIds = state.getProjectIds();

  if (projectIds.length === 0) {
    mountEl.append(
      el('div', { class: 'tree-empty-workspace' }, [
        'No projects open. Use File → Load demo project, Open…, or New project.',
      ])
    );
    return;
  }

  let renderedAny = false;
  for (const projectId of projectIds) {
    const visible = computeVisibleSet(projectId);
    // When a search is active, hide projects that have nothing matching.
    if (visible && visible.size === 0) continue;
    mountEl.append(
      renderProjectNode(projectId, projectId === activeProjectId, selection, visible)
    );
    renderedAny = true;
  }

  if (!renderedAny && searchQuery) {
    mountEl.append(
      el('div', { class: 'tree-no-match' }, [
        `No artifacts match "${searchQuery}".`,
      ])
    );
  }

  mountEl.scrollTop = scrollTop;
}

/**
 * @param {string} projectId
 * @param {boolean} isActive
 * @param {import('./state.js').Ref | null} selection
 * @param {Set<string> | null} visible
 * @returns {HTMLElement}
 */
function renderProjectNode(projectId, isActive, selection, visible) {
  const project = state.getProject(projectId);
  if (!project) return el('div');
  // When searching, force every project expanded so matches show.
  const collapsed = !searchQuery && collapsedProjects.has(projectId);
  const dirty = state.isDirty(projectId);

  const wrap = el('div', {
    class: 'tree-project' + (isActive ? ' is-active' : ''),
    dataset: { projectId },
  });

  const disclosure = el(
    'button',
    {
      class: 'tree-disclosure',
      type: 'button',
      'aria-expanded': String(!collapsed),
      'aria-label': collapsed ? 'Expand project' : 'Collapse project',
      onclick: (/** @type {MouseEvent} */ e) => {
        e.stopPropagation();
        toggleProject(projectId);
      },
    },
    [collapsed ? '+' : '−']
  );

  const projectActions = el('div', { class: 'tree-project-actions' }, [
    actions?.saveProject
      ? el(
          'button',
          {
            class: 'tree-project-action',
            type: 'button',
            title: 'Save project',
            'aria-label': 'Save project',
            onclick: (/** @type {MouseEvent} */ e) => {
              e.stopPropagation();
              actions?.saveProject?.(projectId);
            },
          },
          ['Save']
        )
      : '',
    actions?.closeProject
      ? el(
          'button',
          {
            class: 'tree-project-action tree-project-close',
            type: 'button',
            title: 'Close project',
            'aria-label': 'Close project',
            onclick: (/** @type {MouseEvent} */ e) => {
              e.stopPropagation();
              actions?.closeProject?.(projectId);
            },
          },
          ['×']
        )
      : '',
  ]);

  const row = el(
    'div',
    {
      class: 'tree-project-row' + (isActive ? ' is-active' : '') + (dirty ? ' is-dirty' : ''),
      onclick: () => {
        if (!isActive) state.setActiveProject(projectId);
        else toggleProject(projectId);
      },
      title: project.meta.name,
    },
    [
      disclosure,
      el('span', { class: 'tree-project-icon', 'aria-hidden': 'true' }, [
        projectIcon({ title: 'Project' }),
      ]),
      el('span', { class: 'tree-project-name' }, [project.meta.name]),
      dirty ? el('span', { class: 'tree-project-dirty', title: 'Unsaved changes' }, ['•']) : '',
      projectActions,
    ]
  );

  wrap.append(row);

  if (!collapsed) {
    const children = el('div', { class: 'tree-children' });
    for (const key of ArtifactTypeKeys) {
      // Essential requirements nest under their parent legislation; they
      // do not appear as a top-level group.
      if (key === 'essentialRequirement') continue;
      // Per-project enabled-types filter. Disabled types stay invisible so
      // the tree only shows what this project models.
      if (!state.isTypeEnabled(projectId, key)) continue;
      const groupNode = renderGroup(projectId, key, selection, visible);
      if (groupNode) children.append(groupNode);
    }
    wrap.append(children);
  }

  return wrap;
}

/**
 * Returns a group element, or null when search is active and no items
 * inside this group are visible (so the group is hidden entirely).
 * @param {string} projectId
 * @param {import('./types.js').ArtifactKey} typeKey
 * @param {import('./state.js').Ref | null} selection
 * @param {Set<string> | null} visible
 */
function renderGroup(projectId, typeKey, selection, visible) {
  const type = ArtifactTypes[typeKey];
  const items = state.getByType(projectId, typeKey);

  // Filter by visibility when searching. The legislation group is special:
  // it shows only legislations whose visibility set covers them or one of
  // their ERs. Other types: visible IDs only.
  if (visible) {
    if (typeKey === 'legislation') {
      const visibleErs = state.getByType(projectId, 'essentialRequirement').filter((e) =>
        visible.has(e.id)
      );
      const anyVisibleLeg = items.some((l) => visible.has(l.id));
      const anyVisibleEr = visibleErs.length > 0;
      if (!anyVisibleLeg && !anyVisibleEr) return null;
    } else {
      const anyVisible = items.some((a) => visible.has(a.id));
      if (!anyVisible) return null;
    }
  }

  const groups = groupSet(projectId);
  // Force expanded while searching so matches are visible.
  const collapsed = !searchQuery && groups.has(typeKey);

  const wrap = el('div', {
    class: 'tree-group',
    dataset: { type: typeKey },
  });

  const disclosure = el(
    'button',
    {
      class: 'tree-disclosure',
      type: 'button',
      'aria-expanded': String(!collapsed),
      'aria-label': collapsed ? 'Expand' : 'Collapse',
      onclick: (/** @type {MouseEvent} */ e) => {
        e.stopPropagation();
        toggleGroup(projectId, typeKey);
      },
    },
    [collapsed ? '+' : '−']
  );

  // Legislations come exclusively from the bundled library — there's no
  // ad-hoc "blank legislation" path. The "+" on this group opens the
  // picker; for every other group "+" creates a fresh artifact.
  const addBtn = el(
    'button',
    {
      class: 'tree-add',
      type: 'button',
      title:
        typeKey === 'legislation'
          ? 'Browse the legislation library'
          : `Add ${type.displayName}`,
      'aria-label':
        typeKey === 'legislation'
          ? 'Open legislation library'
          : `Add ${type.displayName}`,
      onclick: (/** @type {MouseEvent} */ e) => {
        e.stopPropagation();
        if (typeKey === 'legislation') {
          state.setActiveProject(projectId);
          openLibraryPicker();
        } else {
          handleAdd(projectId, typeKey);
        }
      },
    },
    ['+']
  );

  const headerChildren = [
    disclosure,
    el('span', { class: 'tree-group-icon', 'aria-hidden': 'true' }, [
      groupIcon({ open: !collapsed }),
    ]),
    el('span', { class: 'tree-group-name' }, [type.displayNamePlural]),
    el('span', { class: 'tree-group-count' }, [`${items.length}`]),
    addBtn,
  ];

  const header = el(
    'div',
    {
      class: 'tree-group-header',
      onclick: () => toggleGroup(projectId, typeKey),
    },
    headerChildren
  );
  wrap.append(header);

  if (!collapsed) {
    const childrenContainer = el('div', { class: 'tree-children' });

    if (typeKey === 'legislation') {
      // Legislations: nest each legislation's essential requirements
      // beneath it. Orphaned ERs (no legislationId, e.g. after a
      // legislation was deleted) sit at the bottom as flat siblings.
      const ers = state.getByType(projectId, 'essentialRequirement');
      const legIds = new Set(items.map((l) => l.id));
      /** @type {Map<string, Object<string, any>[]>} */
      const ersByLegislation = new Map();
      const orphanERs = [];
      for (const er of ers) {
        if (er.legislationId && legIds.has(er.legislationId)) {
          let arr = ersByLegislation.get(er.legislationId);
          if (!arr) {
            arr = [];
            ersByLegislation.set(er.legislationId, arr);
          }
          arr.push(er);
        } else {
          orphanERs.push(er);
        }
      }

      if (items.length === 0 && orphanERs.length === 0) {
        if (!visible) {
          childrenContainer.append(
            el('div', { class: 'tree-empty' }, ['No legislations yet.'])
          );
        }
      } else {
        for (const leg of items) {
          if (visible && !visible.has(leg.id)) continue;
          const legErs = ersByLegislation.get(leg.id) ?? [];
          const filteredErs = visible
            ? legErs.filter((e) => visible.has(e.id))
            : legErs;
          childrenContainer.append(
            renderLegislationNode(projectId, leg, filteredErs, selection)
          );
        }
        for (const er of orphanERs) {
          if (visible && !visible.has(er.id)) continue;
          childrenContainer.append(
            renderArtifactRow(projectId, 'essentialRequirement', er, selection, false)
          );
        }
      }
    } else if (items.length === 0) {
      if (!visible) {
        childrenContainer.append(
          el('div', { class: 'tree-empty' }, [
            `No ${type.displayNamePlural.toLowerCase()} yet.`,
          ])
        );
      }
    } else if (typeKey === 'preliminaryHazard' || typeKey === 'consolidatedHazard') {
      // EN ISO 12100 sub-grouping by energy source / hazard category. Items
      // without a category fall into "Other".
      const subgroups = renderHazardCategorySubgroups(
        projectId,
        typeKey,
        items,
        selection,
        visible
      );
      for (const n of subgroups) childrenContainer.append(n);
      if (subgroups.length === 0 && !visible) {
        childrenContainer.append(
          el('div', { class: 'tree-empty' }, [
            `No ${type.displayNamePlural.toLowerCase()} yet.`,
          ])
        );
      }
    } else {
      const selfRefField = getSelfRefField(typeKey);
      if (selfRefField) {
        // Render hierarchically. Filter out subtrees whose roots aren't
        // visible (their visible descendants will already be in `visible`
        // along with the ancestors that need to render to give context).
        const childrenByParent = buildForest(items, selfRefField);
        const tops = childrenByParent.get(null) ?? [];
        for (const item of tops) {
          if (visible && !visible.has(item.id)) continue;
          childrenContainer.append(
            renderHierarchicalNode(projectId, typeKey, item, childrenByParent, selfRefField, selection, visible)
          );
        }
      } else {
        for (const item of items) {
          if (visible && !visible.has(item.id)) continue;
          childrenContainer.append(renderArtifactRow(projectId, typeKey, item, selection, false));
        }
      }
    }

    wrap.append(childrenContainer);
  }

  return wrap;
}

/**
 * Render hazards grouped into ISO 12100 category sub-folders. Sub-folder
 * collapse state is stored in the same `groupSet` map, keyed
 * `"<typeKey>:<category>"` so per-project state is preserved and
 * cascade-collapse on the project node still resets it.
 *
 * @param {string} projectId
 * @param {'preliminaryHazard' | 'consolidatedHazard'} typeKey
 * @param {Object<string, any>[]} items
 * @param {import('./state.js').Ref | null} selection
 * @param {Set<string> | null} visible
 * @returns {HTMLElement[]}
 */
function renderHazardCategorySubgroups(projectId, typeKey, items, selection, visible) {
  const groups = groupSet(projectId);

  /** @type {Map<string, Object<string, any>[]>} */
  const byCategory = new Map();
  for (const item of items) {
    const cat = item.energySource || 'other';
    let arr = byCategory.get(cat);
    if (!arr) {
      arr = [];
      byCategory.set(cat, arr);
    }
    arr.push(item);
  }

  // Canonical order from HazardEnergySources, then any leftover keys.
  const orderedCats = HazardEnergySources.filter((c) => byCategory.has(c));
  for (const c of byCategory.keys()) {
    if (!orderedCats.includes(c)) orderedCats.push(c);
  }

  /** @type {HTMLElement[]} */
  const out = [];

  for (const cat of orderedCats) {
    const catItems = byCategory.get(cat) ?? [];
    const visibleItems = visible ? catItems.filter((a) => visible.has(a.id)) : catItems;
    if (visibleItems.length === 0) continue;

    const collapseKey = typeKey + ':' + cat;
    const subCollapsed = !searchQuery && groups.has(collapseKey);

    const toggle = () => {
      if (groups.has(collapseKey)) groups.delete(collapseKey);
      else groups.add(collapseKey);
      render();
    };

    const subDisclosure = el(
      'button',
      {
        class: 'tree-disclosure',
        type: 'button',
        'aria-expanded': String(!subCollapsed),
        'aria-label': subCollapsed ? 'Expand' : 'Collapse',
        onclick: (/** @type {MouseEvent} */ e) => {
          e.stopPropagation();
          toggle();
        },
      },
      [subCollapsed ? '+' : '−']
    );

    const header = el(
      'div',
      { class: 'tree-group-header tree-subgroup-header', onclick: toggle },
      [
        subDisclosure,
        el('span', { class: 'tree-group-icon', 'aria-hidden': 'true' }, [
          groupIcon({ open: !subCollapsed }),
        ]),
        el('span', { class: 'tree-group-name tree-subgroup-name' }, [
          humanizeEnumValue(cat),
        ]),
        el('span', { class: 'tree-group-count' }, [`${visibleItems.length}`]),
      ]
    );

    const wrap = el('div', { class: 'tree-subgroup' }, [header]);

    if (!subCollapsed) {
      const itemsContainer = el('div', { class: 'tree-children' });
      for (const item of visibleItems) {
        itemsContainer.append(
          renderArtifactRow(projectId, typeKey, item, selection, false)
        );
      }
      wrap.append(itemsContainer);
    }

    out.push(wrap);
  }

  return out;
}

/**
 * Render a legislation row plus its child essential requirements.
 * @param {string} projectId
 * @param {Object<string, any>} legislation
 * @param {Object<string, any>[]} ers
 * @param {import('./state.js').Ref | null} selection
 */
function renderLegislationNode(projectId, legislation, ers, selection) {
  const hasChildren = ers.length > 0;
  const legColl = legislationSet(projectId);
  // Force expanded while searching so matching ERs aren't hidden.
  const collapsed = !searchQuery && legColl.has(legislation.id);

  const wrap = el('div', { class: 'tree-legislation' });
  wrap.append(
    renderArtifactRow(
      projectId,
      'legislation',
      legislation,
      selection,
      hasChildren,
      collapsed,
      () => toggleLegislation(projectId, legislation.id)
    )
  );

  if (hasChildren && !collapsed) {
    const inner = el('div', { class: 'tree-children' });
    for (const er of ers) {
      inner.append(renderArtifactRow(projectId, 'essentialRequirement', er, selection, false));
    }
    wrap.append(inner);
  }

  return wrap;
}

/**
 * Build a parent → children map for a flat list of artifacts that share
 * a self-ref field (architectureElement.parentId, derivedRequirement.
 * parentRequirementId, etc.). Orphans whose parent doesn't resolve to
 * a sibling are bucketed under `null` so they surface at the root.
 * @param {Array<Object<string, any>>} items
 * @param {string} parentField
 * @returns {Map<string | null, Object<string, any>[]>}
 */
function buildForest(items, parentField) {
  const childrenByParent = new Map();
  const ids = new Set(items.map((s) => s.id));
  for (const s of items) {
    const parentVal = s[parentField];
    const parent = parentVal && ids.has(parentVal) ? parentVal : null;
    if (!childrenByParent.has(parent)) childrenByParent.set(parent, []);
    childrenByParent.get(parent).push(s);
  }
  return childrenByParent;
}

/**
 * Render a hierarchical row + (recursively) its descendants for any
 * type with a self-ref field.
 * @param {string} projectId
 * @param {import('./types.js').ArtifactKey} typeKey
 * @param {Object<string, any>} item
 * @param {Map<string | null, Object<string, any>[]>} childrenByParent
 * @param {string} parentField
 * @param {import('./state.js').Ref | null} selection
 */
function renderHierarchicalNode(projectId, typeKey, item, childrenByParent, parentField, selection, visible) {
  const children = childrenByParent.get(item.id) ?? [];
  const visibleChildren = visible
    ? children.filter((c) => visible.has(c.id))
    : children;
  const hasChildren = visibleChildren.length > 0;
  const set = hierSet(projectId);
  // Force expanded while searching so matches aren't buried.
  const collapsed = !searchQuery && set.has(item.id);

  const wrap = el('div', { class: 'tree-hier-node' });
  wrap.append(
    renderArtifactRow(projectId, typeKey, item, selection, hasChildren, collapsed, () =>
      toggleHier(projectId, item.id)
    )
  );

  if (hasChildren && !collapsed) {
    const inner = el('div', { class: 'tree-children' });
    for (const child of visibleChildren) {
      inner.append(
        renderHierarchicalNode(projectId, typeKey, child, childrenByParent, parentField, selection, visible)
      );
    }
    wrap.append(inner);
  }

  return wrap;
}

/**
 * @param {string} projectId
 * @param {import('./types.js').ArtifactKey} typeKey
 * @param {Object<string, any>} artifact
 * @param {import('./state.js').Ref | null} selection
 * @param {boolean} hasChildren
 * @param {boolean} [collapsed]
 * @param {(() => void) | null} [onToggle]
 */
function renderArtifactRow(
  projectId,
  typeKey,
  artifact,
  selection,
  hasChildren,
  collapsed = false,
  onToggle = null
) {
  const type = ArtifactTypes[typeKey];
  const label = labelOf(typeKey, artifact);
  const isSelected =
    selection && selection.projectId === projectId && selection.artifactId === artifact.id;

  /** @type {HTMLElement} */
  let leading;
  if (hasChildren && onToggle) {
    leading = el(
      'button',
      {
        class: 'tree-disclosure',
        type: 'button',
        'aria-expanded': String(!collapsed),
        'aria-label': collapsed ? 'Expand' : 'Collapse',
        onclick: (/** @type {MouseEvent} */ e) => {
          e.stopPropagation();
          onToggle();
        },
      },
      [collapsed ? '+' : '−']
    );
  } else {
    leading = el('span', { class: 'tree-disclosure-spacer', 'aria-hidden': 'true' });
  }

  return el(
    'div',
    {
      class: 'tree-item' + (isSelected ? ' is-selected' : ''),
      dataset: { id: artifact.id, type: typeKey, projectId },
      role: 'treeitem',
      'aria-selected': String(!!isSelected),
      tabindex: '0',
      onclick: () => state.select({ projectId, artifactId: artifact.id }),
      onkeydown: (/** @type {KeyboardEvent} */ e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          state.select({ projectId, artifactId: artifact.id });
        } else if (
          (e.key === 'Delete' || e.key === 'Backspace') &&
          (e.metaKey || e.ctrlKey)
        ) {
          e.preventDefault();
          handleDelete(projectId, artifact.id, label, type.displayName);
        }
      },
    },
    [
      leading,
      el('span', { class: 'tree-item-icon', 'aria-hidden': 'true' }, [
        typeIcon(typeKey, { title: type.displayName }),
      ]),
      el('span', { class: 'tree-item-id' }, [artifact.id]),
      el('span', { class: 'tree-item-label' }, [truncate(label, 80)]),
      // For types with a self-ref (architectureElement, derivedRequirement)
      // every row gets a hover-revealed "+ Child" affordance so users can
      // build hierarchies without trips through the trace pane.
      getSelfRefField(typeKey)
        ? el(
            'button',
            {
              class: 'tree-row-add',
              type: 'button',
              title: `Add child ${type.displayName.toLowerCase()}`,
              'aria-label': `Add child ${type.displayName.toLowerCase()}`,
              onclick: (/** @type {MouseEvent} */ e) => {
                e.stopPropagation();
                handleAddChild(projectId, typeKey, artifact.id);
              },
            },
            ['+']
          )
        : '',
      el(
        'button',
        {
          class: 'tree-delete',
          type: 'button',
          title: `Delete ${type.displayName}`,
          'aria-label': `Delete ${type.displayName}`,
          onclick: (/** @type {MouseEvent} */ e) => {
            e.stopPropagation();
            handleDelete(projectId, artifact.id, label, type.displayName);
          },
        },
        ['×']
      ),
    ]
  );
}

function toggleProject(projectId) {
  if (collapsedProjects.has(projectId)) {
    collapsedProjects.delete(projectId);
  } else {
    collapsedProjects.add(projectId);
    // Cascade-collapse: when the project re-opens, every group, every
    // legislation, and every hier-node inside is also collapsed. Closing
    // the project becomes a clean reset of the whole subtree.
    const groups = groupSet(projectId);
    for (const key of ArtifactTypeKeys) groups.add(key);
    // Hazard sub-categories use composite keys in the same set.
    for (const hazType of /** @type {const} */ (['preliminaryHazard', 'consolidatedHazard'])) {
      for (const cat of HazardEnergySources) groups.add(hazType + ':' + cat);
      groups.add(hazType + ':other');
    }

    const legColl = legislationSet(projectId);
    for (const l of state.getByType(projectId, 'legislation')) legColl.add(l.id);

    const hierColl = hierSet(projectId);
    for (const key of ArtifactTypeKeys) {
      if (!getSelfRefField(key)) continue;
      for (const a of state.getByType(projectId, key)) hierColl.add(a.id);
    }
  }
  render();
}

function toggleGroup(projectId, typeKey) {
  const groups = groupSet(projectId);
  if (groups.has(typeKey)) groups.delete(typeKey);
  else groups.add(typeKey);
  render();
}

function toggleHier(projectId, id) {
  const set = hierSet(projectId);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  render();
}

function toggleLegislation(projectId, id) {
  const legColl = legislationSet(projectId);
  if (legColl.has(id)) legColl.delete(id);
  else legColl.add(id);
  render();
}

/**
 * Build a seed object with a sensible default value for the type's
 * label field. Used by both the group-level "+" and the row-level
 * "+ Child" so new artifacts have something readable in the tree.
 * @param {import('./types.js').ArtifactType} type
 * @returns {Object<string, any>}
 */
function seedFor(type) {
  /** @type {Object<string, any>} */
  const seed = {};
  seed[type.labelField] = `New ${type.displayName.toLowerCase()}`;
  return seed;
}

/**
 * @param {string} projectId
 * @param {import('./types.js').ArtifactKey} typeKey
 */
function handleAdd(projectId, typeKey) {
  state.setActiveProject(projectId);
  const type = ArtifactTypes[typeKey];
  collapsedProjects.delete(projectId);
  groupSet(projectId).delete(typeKey);
  const id = state.addArtifact(projectId, typeKey, seedFor(type));
  state.select({ projectId, artifactId: id });
}

/**
 * Add an artifact of the same type as `parentId`, with the appropriate
 * self-ref field pre-set so the new item nests as a child of `parentId`.
 * @param {string} projectId
 * @param {import('./types.js').ArtifactKey} typeKey
 * @param {string} parentId
 */
function handleAddChild(projectId, typeKey, parentId) {
  const parentField = getSelfRefField(typeKey);
  if (!parentField) return;
  state.setActiveProject(projectId);
  const type = ArtifactTypes[typeKey];
  // Make sure ancestors are visible so the new child isn't hidden.
  collapsedProjects.delete(projectId);
  groupSet(projectId).delete(typeKey);
  hierSet(projectId).delete(parentId);
  const seed = { ...seedFor(type), [parentField]: parentId };
  const id = state.addArtifact(projectId, typeKey, seed);
  state.select({ projectId, artifactId: id });
}

function handleDelete(projectId, id, label, displayName) {
  const ok = window.confirm(
    `Delete ${displayName.toLowerCase()} "${label}"?\n\nReferences from other artifacts will be cleared.`
  );
  if (!ok) return;
  state.removeArtifact(projectId, id);
}

function truncate(s, max) {
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}
