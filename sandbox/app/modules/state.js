/**
 * Workspace state.
 *
 * The workspace holds one or more *projects*. Each project keeps the same
 * shape it always did (`schemaVersion: 1`, with systems, hazards, etc.) —
 * the workspace is a thin layer above that lets multiple projects be
 * loaded at once.
 *
 * Contracts:
 *   - The workspace and every project are mutated only through this
 *     module's exports. UI modules subscribe to changes; nobody touches
 *     internal state directly.
 *   - Artifact ids stay scoped to their project (`sys-1` in project A is
 *     a *different* artifact from `sys-1` in project B). To address an
 *     artifact across the workspace, callers always supply both
 *     `(projectId, artifactId)`.
 *   - One project is the *active* project — it's the implicit target of
 *     "create / save / export" actions in the UI. Selecting an artifact
 *     in a non-active project automatically activates that project.
 *   - Mutations dirty the affected project (only). Selection / activation
 *     changes are *not* dirtying. `meta.updatedAt` is bumped on the
 *     dirtied project per mutation.
 *   - The `byId` index is per-project and kept in sync by mutations.
 *     `replaceWorkspace` rebuilds them.
 *
 * On-disk JSON files still contain a single project (the
 * `ProjectState` shape). The workspace exists only in the running app and
 * in the autosave blob in `localStorage`.
 */

import { ArtifactTypes, ArtifactTypeKeys } from './types.js';
import { deepClone } from './util.js';

/** Per-project schema version. Bump and add a migration for project files. */
export const SCHEMA_VERSION = 3;

/** Workspace-level schema (autosave blob shape). */
export const WORKSPACE_SCHEMA_VERSION = 1;

/** Surfaced in `meta.appVersion` for diagnostic purposes. */
export const APP_VERSION = '0.1.0';

/**
 * @typedef {import('./types.js').ArtifactKey} ArtifactKey
 * @typedef {{ id: string, [field: string]: any }} Artifact
 *
 * @typedef {Object} ProjectMeta
 * @property {string} name
 * @property {string} createdAt   ISO 8601
 * @property {string} updatedAt   ISO 8601
 * @property {string} appVersion
 *
 * @typedef {Object} RiskMatrixLevel
 * @property {string} id
 * @property {string} label
 * @property {string} [description]
 *
 * @typedef {Object} RiskLevel
 * @property {string} id
 * @property {string} label
 * @property {string} color
 *
 * @typedef {Object} RiskMatrix
 * @property {RiskMatrixLevel[]} severityLevels
 * @property {RiskMatrixLevel[]} probabilityLevels
 * @property {RiskLevel[]}       riskLevels
 * @property {Object<string, string>} cells
 * @property {string} defaultRiskLevelId
 *
 * @typedef {Object} ProjectState
 * @property {number} schemaVersion
 * @property {ProjectMeta} meta
 * @property {RiskMatrix} riskMatrix
 * @property {Object<string, number>} counters
 * @property {Artifact[]} architectureElements
 * @property {Artifact[]} legislations
 * @property {Artifact[]} essentialRequirements
 * @property {Artifact[]} preliminaryHazards
 * @property {Artifact[]} consolidatedHazards
 * @property {Artifact[]} riskReducingMeasures
 * @property {Artifact[]} safetyFunctions
 * @property {Artifact[]} derivedRequirements
 * @property {Artifact[]} verificationActivities
 *
 * @typedef {Object} ProjectEntry
 * @property {string} id
 * @property {ProjectState} data
 * @property {Map<string, { type: ArtifactKey, ref: Artifact }>} byId
 * @property {boolean} dirty
 *
 * @typedef {{ projectId: string, artifactId: string }} Ref
 *
 * @typedef {Object} Workspace
 * @property {number} workspaceSchemaVersion
 * @property {string} appVersion
 * @property {Array<{ id: string, data: ProjectState }>} projects
 * @property {string[]} projectOrder
 * @property {string | null} activeProjectId
 * @property {Ref | null} selection
 * @property {number} projectCounter
 *
 * @typedef {{ kind: 'add' | 'update' | 'remove', projectId: string, type: ArtifactKey, id: string }
 *         | { kind: 'project-add' | 'project-remove' | 'project-active', projectId: string }
 *         | { kind: 'meta', projectId: string }
 *         | { kind: 'risk-matrix', projectId: string }
 *         | { kind: 'select', selection: Ref | null }
 *         | { kind: 'replace' }} Change
 *
 * @typedef {(change: Change) => void} Listener
 */

// --- Internal state ----------------------------------------------------

const internal = {
  /** @type {Map<string, ProjectEntry>} */ projects: new Map(),
  /** @type {string[]} */ projectOrder: [],
  /** @type {string | null} */ activeProjectId: null,
  /** @type {Ref | null} */ selection: null,
  projectCounter: 0,
  /** @type {Set<Listener>} */ listeners: new Set(),
};

function nextProjectId() {
  internal.projectCounter += 1;
  return `proj-${internal.projectCounter}`;
}

/**
 * @param {string} [name]
 * @param {import('./types.js').ArtifactKey[]} [enabledTypes]
 *   When supplied, locks this project to that subset of artifact types.
 *   When omitted, all types are enabled.
 */
function emptyProjectData(name, enabledTypes) {
  const now = new Date().toISOString();
  /** @type {ProjectState} */
  const data = {
    schemaVersion: SCHEMA_VERSION,
    meta: {
      name: name || 'Untitled project',
      createdAt: now,
      updatedAt: now,
      appVersion: APP_VERSION,
      enabledTypes: enabledTypes ? [...enabledTypes] : [...ArtifactTypeKeys],
    },
    riskMatrix: defaultRiskMatrix(),
    counters: {},
  };
  // Initialise an empty array for every artifact type's storage key, so
  // adding new types in types.js doesn't require touching this function.
  for (const key of ArtifactTypeKeys) {
    data[ArtifactTypes[key].storageKey] = [];
  }
  return data;
}

/**
 * Default 4×5 matrix shipped with new projects.
 * @returns {RiskMatrix}
 */
function defaultRiskMatrix() {
  return {
    severityLevels: [
      { id: 's1', label: 'Negligible',   description: 'Minor or no injury' },
      { id: 's2', label: 'Marginal',     description: 'Reversible injury' },
      { id: 's3', label: 'Critical',     description: 'Irreversible injury' },
      { id: 's4', label: 'Catastrophic', description: 'Death or permanent disability' },
    ],
    probabilityLevels: [
      { id: 'p1', label: 'Improbable', description: 'Unlikely to occur in lifecycle' },
      { id: 'p2', label: 'Remote',     description: 'Unlikely but possible' },
      { id: 'p3', label: 'Occasional', description: 'Likely to occur sometime' },
      { id: 'p4', label: 'Probable',   description: 'Will occur several times' },
      { id: 'p5', label: 'Frequent',   description: 'Likely to occur frequently' },
    ],
    riskLevels: [
      { id: 'low',          label: 'Low',          color: '#4f8a4a' },
      { id: 'medium',       label: 'Medium',       color: '#c9a445' },
      { id: 'high',         label: 'High',         color: '#c8643a' },
      { id: 'unacceptable', label: 'Unacceptable', color: '#9a2828' },
    ],
    cells: {
      's1:p1': 'low',          's1:p2': 'low',          's1:p3': 'low',          's1:p4': 'medium',       's1:p5': 'medium',
      's2:p1': 'low',          's2:p2': 'medium',       's2:p3': 'medium',       's2:p4': 'high',         's2:p5': 'high',
      's3:p1': 'medium',       's3:p2': 'high',         's3:p3': 'high',         's3:p4': 'unacceptable', 's3:p5': 'unacceptable',
      's4:p1': 'high',         's4:p2': 'high',         's4:p3': 'unacceptable', 's4:p4': 'unacceptable', 's4:p5': 'unacceptable',
    },
    defaultRiskLevelId: 'medium',
  };
}

function makeProjectEntry(data, projectId) {
  /** @type {ProjectEntry} */
  const entry = { id: projectId, data, byId: new Map(), dirty: false };
  rebuildIndex(entry);
  return entry;
}

function rebuildIndex(entry) {
  entry.byId.clear();
  for (const key of ArtifactTypeKeys) {
    const t = ArtifactTypes[key];
    for (const ref of entry.data[t.storageKey]) {
      entry.byId.set(ref.id, { type: key, ref });
    }
  }
}

/**
 * @param {Change} change
 * @param {{ dirty?: boolean, projectId?: string }} [opts]
 */
function notify(change, opts = {}) {
  const { dirty = true, projectId } = opts;
  if (dirty && projectId) {
    const entry = internal.projects.get(projectId);
    if (entry) {
      entry.dirty = true;
      entry.data.meta.updatedAt = new Date().toISOString();
    }
  }
  for (const fn of internal.listeners) fn(change);
}

/**
 * Seed an artifact with sensible defaults for every declared field.
 * @param {import('./types.js').ArtifactType} t
 */
function defaultsForType(t) {
  /** @type {Object<string, any>} */
  const out = {};
  for (const [name, field] of Object.entries(t.fields)) {
    if ('default' in field && field.default !== undefined) {
      out[name] = field.default;
    } else if (field.kind === 'ref-array' || field.kind === 'polymorphic-ref-array') {
      out[name] = [];
    } else if (field.kind === 'string' || field.kind === 'text' || field.kind === 'date') {
      out[name] = '';
    } else {
      out[name] = null;
    }
  }
  return out;
}

// --- Public: workspace metadata ----------------------------------------

/** @returns {string[]} */
export function getProjectIds() {
  return [...internal.projectOrder];
}

/** @returns {string | null} */
export function getActiveProjectId() {
  return internal.activeProjectId;
}

/**
 * @param {string} projectId
 * @returns {ProjectState | null}
 */
export function getProject(projectId) {
  return internal.projects.get(projectId)?.data ?? null;
}

/** @returns {ProjectState | null} */
export function getActiveProject() {
  if (!internal.activeProjectId) return null;
  return internal.projects.get(internal.activeProjectId)?.data ?? null;
}

/**
 * Make a project the active one. Does NOT change selection.
 * @param {string} projectId
 */
export function setActiveProject(projectId) {
  if (!internal.projects.has(projectId)) return;
  if (internal.activeProjectId === projectId) return;
  internal.activeProjectId = projectId;
  notify({ kind: 'project-active', projectId }, { dirty: false });
}

// --- Public: project lifecycle -----------------------------------------

/**
 * Create a fresh empty project, append to the workspace, and return its id.
 * If there's no active project yet, the new one becomes active.
 * @param {{ name?: string, makeActive?: boolean }} [opts]
 * @returns {string}
 */
export function createProject(opts = {}) {
  const id = nextProjectId();
  const entry = makeProjectEntry(emptyProjectData(opts.name, opts.enabledTypes), id);
  internal.projects.set(id, entry);
  internal.projectOrder.push(id);
  notify({ kind: 'project-add', projectId: id }, { dirty: false });
  if (!internal.activeProjectId || opts.makeActive) {
    setActiveProject(id);
  }
  return id;
}

/**
 * Whether `typeKey` is enabled for the given project. Older project files
 * without `meta.enabledTypes` are treated as having every type enabled
 * (back-compat).
 * @param {string} projectId
 * @param {import('./types.js').ArtifactKey} typeKey
 * @returns {boolean}
 */
export function isTypeEnabled(projectId, typeKey) {
  const project = getProject(projectId);
  if (!project) return false;
  const enabled = project.meta.enabledTypes;
  if (!Array.isArray(enabled)) return true;
  return enabled.includes(typeKey);
}

/**
 * Add a project from already-built ProjectState data (e.g. loaded from JSON).
 * Returns the assigned workspace id.
 * @param {ProjectState} projectData
 * @param {{ makeActive?: boolean }} [opts]
 * @returns {string}
 */
export function addProjectFromData(projectData, opts = {}) {
  const id = nextProjectId();
  const entry = makeProjectEntry(deepClone(projectData), id);
  internal.projects.set(id, entry);
  internal.projectOrder.push(id);
  notify({ kind: 'project-add', projectId: id }, { dirty: false });
  if (!internal.activeProjectId || opts.makeActive) {
    setActiveProject(id);
  }
  return id;
}

/**
 * Remove a project from the workspace, including any selection within it.
 * If it was active, the next project (or the previous one) becomes active.
 * @param {string} projectId
 */
export function removeProject(projectId) {
  if (!internal.projects.has(projectId)) return;
  internal.projects.delete(projectId);
  const idx = internal.projectOrder.indexOf(projectId);
  if (idx >= 0) internal.projectOrder.splice(idx, 1);

  if (internal.selection && internal.selection.projectId === projectId) {
    internal.selection = null;
    notify({ kind: 'select', selection: null }, { dirty: false });
  }

  if (internal.activeProjectId === projectId) {
    const fallback = internal.projectOrder[idx] ?? internal.projectOrder[idx - 1] ?? null;
    internal.activeProjectId = fallback;
    notify(
      { kind: 'project-active', projectId: fallback ?? '' },
      { dirty: false }
    );
  }

  notify({ kind: 'project-remove', projectId }, { dirty: false });
}

/**
 * @param {string} projectId
 * @param {string} name
 */
export function renameProject(projectId, name) {
  const entry = internal.projects.get(projectId);
  if (!entry) return;
  entry.data.meta.name = name;
  notify({ kind: 'meta', projectId }, { dirty: true, projectId });
}

/**
 * Update arbitrary meta fields on a project.
 * @param {string} projectId
 * @param {Partial<ProjectMeta>} patch
 */
export function updateMeta(projectId, patch) {
  const entry = internal.projects.get(projectId);
  if (!entry) return;
  Object.assign(entry.data.meta, patch);
  notify({ kind: 'meta', projectId }, { dirty: true, projectId });
}

// --- Public: risk matrix -----------------------------------------------

/** @param {string} projectId */
export function getRiskMatrix(projectId) {
  return internal.projects.get(projectId)?.data.riskMatrix ?? null;
}

/**
 * @param {string} projectId
 * @param {RiskMatrix} matrix
 */
export function setRiskMatrix(projectId, matrix) {
  const entry = internal.projects.get(projectId);
  if (!entry) return;
  entry.data.riskMatrix = matrix;
  notify({ kind: 'risk-matrix', projectId }, { dirty: true, projectId });
}

// --- Public: artifact CRUD ---------------------------------------------

/**
 * @param {string} projectId
 * @param {ArtifactKey} typeKey
 * @returns {string}
 */
export function nextId(projectId, typeKey) {
  const entry = internal.projects.get(projectId);
  if (!entry) throw new Error(`Unknown project: ${projectId}`);
  const t = ArtifactTypes[typeKey];
  if (!t) throw new Error(`Unknown artifact type: ${typeKey}`);
  const next = (entry.data.counters[t.idPrefix] ?? 0) + 1;
  entry.data.counters[t.idPrefix] = next;
  return `${t.idPrefix}-${next}`;
}

/**
 * @param {string} projectId
 * @param {string} artifactId
 * @returns {{ type: ArtifactKey, ref: Artifact } | null}
 */
export function getById(projectId, artifactId) {
  return internal.projects.get(projectId)?.byId.get(artifactId) ?? null;
}

/**
 * @param {string} projectId
 * @param {ArtifactKey} typeKey
 * @returns {Artifact[]}
 */
export function getByType(projectId, typeKey) {
  const entry = internal.projects.get(projectId);
  if (!entry) return [];
  const t = ArtifactTypes[typeKey];
  if (!t) return [];
  return entry.data[t.storageKey];
}

/**
 * @param {string} projectId
 * @param {ArtifactKey} typeKey
 * @param {Object<string, any>} [data]
 * @returns {string} new artifact id
 */
export function addArtifact(projectId, typeKey, data = {}) {
  const entry = internal.projects.get(projectId);
  if (!entry) throw new Error(`Unknown project: ${projectId}`);
  const t = ArtifactTypes[typeKey];
  if (!t) throw new Error(`Unknown artifact type: ${typeKey}`);
  const id = nextId(projectId, typeKey);
  const now = new Date().toISOString();
  const artifact = { id, ...defaultsForType(t), ...data, createdAt: now, updatedAt: now };
  entry.data[t.storageKey].push(artifact);
  entry.byId.set(id, { type: typeKey, ref: artifact });
  notify({ kind: 'add', projectId, type: typeKey, id }, { dirty: true, projectId });
  return id;
}

/**
 * @param {string} projectId
 * @param {string} artifactId
 * @param {Object<string, any>} patch
 */
export function updateArtifact(projectId, artifactId, patch) {
  const entry = internal.projects.get(projectId);
  if (!entry) throw new Error(`Unknown project: ${projectId}`);
  const ent = entry.byId.get(artifactId);
  if (!ent) throw new Error(`No artifact ${artifactId} in project ${projectId}`);
  Object.assign(ent.ref, patch, { updatedAt: new Date().toISOString() });
  notify({ kind: 'update', projectId, type: ent.type, id: artifactId }, { dirty: true, projectId });
}

/**
 * @param {string} projectId
 * @param {string} artifactId
 */
export function removeArtifact(projectId, artifactId) {
  const entry = internal.projects.get(projectId);
  if (!entry) return;
  const ent = entry.byId.get(artifactId);
  if (!ent) return;
  const t = ArtifactTypes[ent.type];
  const arr = entry.data[t.storageKey];
  const idx = arr.findIndex((a) => a.id === artifactId);
  if (idx >= 0) arr.splice(idx, 1);
  entry.byId.delete(artifactId);
  cleanupIncomingRefs(entry, artifactId);
  if (
    internal.selection &&
    internal.selection.projectId === projectId &&
    internal.selection.artifactId === artifactId
  ) {
    internal.selection = null;
  }
  notify({ kind: 'remove', projectId, type: ent.type, id: artifactId }, { dirty: true, projectId });
}

/**
 * Walk every artifact in the project and strip references to a deleted id.
 * Refs only target same-project artifacts, so cleanup is per-project.
 * @param {ProjectEntry} entry
 * @param {string} deletedId
 */
function cleanupIncomingRefs(entry, deletedId) {
  for (const key of ArtifactTypeKeys) {
    const t = ArtifactTypes[key];
    for (const a of entry.data[t.storageKey]) {
      for (const [name, field] of Object.entries(t.fields)) {
        if (field.kind === 'ref' && a[name] === deletedId) {
          a[name] = null;
        } else if (field.kind === 'ref-array' && Array.isArray(a[name])) {
          const i = a[name].indexOf(deletedId);
          if (i >= 0) a[name].splice(i, 1);
        } else if (field.kind === 'polymorphic-ref-array' && Array.isArray(a[name])) {
          a[name] = a[name].filter(
            (r) => !(r && typeof r === 'object' && r.id === deletedId)
          );
        }
      }
    }
  }
}

// --- Public: selection -------------------------------------------------

/**
 * Set the workspace-wide selection. Pass null to clear.
 * Selecting an artifact in a non-active project automatically activates it.
 * @param {Ref | null} sel
 */
export function select(sel) {
  if (sel === null) {
    if (internal.selection === null) return;
    internal.selection = null;
    notify({ kind: 'select', selection: null }, { dirty: false });
    return;
  }
  if (!internal.projects.has(sel.projectId)) return;
  if (sel.projectId !== internal.activeProjectId) {
    internal.activeProjectId = sel.projectId;
    notify({ kind: 'project-active', projectId: sel.projectId }, { dirty: false });
  }
  if (
    internal.selection &&
    internal.selection.projectId === sel.projectId &&
    internal.selection.artifactId === sel.artifactId
  ) {
    return;
  }
  internal.selection = { projectId: sel.projectId, artifactId: sel.artifactId };
  notify({ kind: 'select', selection: { ...internal.selection } }, { dirty: false });
}

/** @returns {Ref | null} */
export function getSelection() {
  return internal.selection ? { ...internal.selection } : null;
}

// --- Public: subscriptions ---------------------------------------------

/**
 * @param {Listener} fn
 * @returns {() => void} unsubscribe
 */
export function subscribe(fn) {
  internal.listeners.add(fn);
  return () => internal.listeners.delete(fn);
}

// --- Public: dirty bookkeeping -----------------------------------------

/** @param {string} projectId */
export function isDirty(projectId) {
  return internal.projects.get(projectId)?.dirty ?? false;
}

/** @returns {boolean} */
export function isAnyDirty() {
  for (const p of internal.projects.values()) {
    if (p.dirty) return true;
  }
  return false;
}

/** @param {string} projectId */
export function markClean(projectId) {
  const entry = internal.projects.get(projectId);
  if (entry) entry.dirty = false;
}

// --- Public: serialisation --------------------------------------------

/** @param {string} projectId */
export function serializeProject(projectId) {
  const data = internal.projects.get(projectId)?.data;
  return data ? deepClone(data) : null;
}

/** @returns {Workspace} */
export function serializeWorkspace() {
  return {
    workspaceSchemaVersion: WORKSPACE_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    projects: internal.projectOrder.map((id) => ({
      id,
      data: deepClone(/** @type {ProjectEntry} */ (internal.projects.get(id)).data),
    })),
    projectOrder: [...internal.projectOrder],
    activeProjectId: internal.activeProjectId,
    selection: internal.selection ? { ...internal.selection } : null,
    projectCounter: internal.projectCounter,
  };
}

/**
 * Replace the entire workspace (used by autosave-restore).
 * Does not mark any project dirty.
 * @param {Workspace} workspace
 */
export function replaceWorkspace(workspace) {
  internal.projects.clear();
  internal.projectOrder = [];
  internal.activeProjectId = null;
  internal.selection = null;
  internal.projectCounter = 0;

  for (const p of workspace.projects ?? []) {
    const id = p.id ?? nextProjectId();
    const num = parseInt(id.split('-')[1] ?? '', 10);
    if (Number.isFinite(num)) {
      internal.projectCounter = Math.max(internal.projectCounter, num);
    }
    const entry = makeProjectEntry(deepClone(p.data), id);
    internal.projects.set(id, entry);
  }
  internal.projectOrder = (workspace.projectOrder ?? [...internal.projects.keys()]).filter((id) =>
    internal.projects.has(id)
  );
  // If the saved counter is higher (because project ids were freed by closes),
  // honour it so future ids don't collide with saved-and-reopened files.
  if (typeof workspace.projectCounter === 'number' && workspace.projectCounter > internal.projectCounter) {
    internal.projectCounter = workspace.projectCounter;
  }

  internal.activeProjectId =
    workspace.activeProjectId && internal.projects.has(workspace.activeProjectId)
      ? workspace.activeProjectId
      : internal.projectOrder[0] ?? null;

  if (
    workspace.selection &&
    internal.projects.get(workspace.selection.projectId)?.byId.has(workspace.selection.artifactId)
  ) {
    internal.selection = { ...workspace.selection };
  }

  notify({ kind: 'replace' }, { dirty: false });
}

/** Remove every project from the workspace. */
export function clearWorkspace() {
  if (internal.projects.size === 0) return;
  internal.projects.clear();
  internal.projectOrder = [];
  internal.activeProjectId = null;
  internal.selection = null;
  notify({ kind: 'replace' }, { dirty: false });
}
