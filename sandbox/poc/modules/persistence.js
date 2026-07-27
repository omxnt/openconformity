/**
 * Persistence: per-project JSON file I/O and workspace-wide autosave.
 *
 * Manual save/open operates on a *single project*. The on-disk JSON file
 * is one project (the existing v1 ProjectState shape), so files stay
 * portable and easy to share between users.
 *
 * Autosave persists the *entire workspace* (all loaded projects + active
 * project + selection) to localStorage, so multi-project state survives
 * a page reload or browser crash.
 *
 * Autosave / restore semantics:
 *   - On every state mutation that dirties at least one project, the
 *     workspace is debounced-written to localStorage.
 *   - On launch, `getRestorableAutosave()` returns the autosave only when
 *     there's something worth restoring (any project present, and the
 *     autosave is newer than the last manual save).
 *   - Manual save and Open both *clear* the autosave, so saved state
 *     doesn't trip the prompt on next launch.
 *
 * Migration: a pre-multi-project autosave (single project) is wrapped as
 * a one-project workspace on read, so users with stale autosaves don't
 * see a blank prompt.
 */

import * as state from './state.js';
import {
  SCHEMA_VERSION,
  WORKSPACE_SCHEMA_VERSION,
  APP_VERSION,
} from './state.js';
import { debounce } from './util.js';

const AUTOSAVE_KEY = 'openconformity:autosave:v1';
const LAST_MANUAL_SAVE_KEY = 'openconformity:lastManualSave:v1';

/**
 * @typedef {{ savedAt: string, workspace: import('./state.js').Workspace }} AutosaveEntry
 * @typedef {{ savedAt: string, filename?: string, projectName?: string }} ManualSaveEntry
 */

// --- Per-project JSON file save / open ---------------------------------

/**
 * Trigger a download of one project as JSON. Defaults to the active project.
 * Updates the workspace-wide last-manual-save timestamp and clears the
 * autosave.
 * @param {{ projectId?: string, filename?: string }} [opts]
 */
export function saveProjectToFile(opts = {}) {
  const projectId = opts.projectId ?? state.getActiveProjectId();
  if (!projectId) {
    window.alert('No active project to save.');
    return;
  }
  const project = state.serializeProject(projectId);
  if (!project) return;

  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });

  const filename = opts.filename || `${slugify(project.meta.name || 'untitled')}.json`;
  triggerDownload(blob, filename);

  state.markClean(projectId);
  writeLastManualSave({
    savedAt: new Date().toISOString(),
    filename,
    projectName: project.meta.name,
  });
  clearAutosave();
}

/**
 * Open a project JSON file via a file picker and add it to the workspace
 * as a new project (does NOT replace existing projects).
 * @returns {Promise<string>} the new project id
 */
export function openProjectFromFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';
    document.body.append(input);

    input.addEventListener(
      'change',
      async () => {
        const file = input.files?.[0];
        input.remove();
        if (!file) {
          reject(new Error('No file selected.'));
          return;
        }
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          const projectData = loadFromJson(data);
          const projectId = state.addProjectFromData(projectData, { makeActive: true });
          writeLastManualSave({
            savedAt: new Date().toISOString(),
            filename: file.name,
            projectName: projectData.meta.name,
          });
          clearAutosave();
          resolve(projectId);
        } catch (err) {
          reject(err);
        }
      },
      { once: true }
    );

    input.click();
  });
}

/**
 * Validate a parsed JSON object as an OpenConformity project, applying
 * schema migrations if needed.
 * @param {unknown} data
 * @returns {import('./state.js').ProjectState}
 */
export function loadFromJson(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Project file is not a valid JSON object.');
  }
  const obj = /** @type {Record<string, unknown>} */ (data);
  const v = obj.schemaVersion;
  if (typeof v !== 'number' || !Number.isInteger(v)) {
    throw new Error('Project file is missing a schemaVersion.');
  }
  if (v > SCHEMA_VERSION) {
    throw new Error(
      `Project file uses schema version ${v}, but this app only knows up to ${SCHEMA_VERSION}. Update OpenConformity to open it.`
    );
  }
  return runMigrations(/** @type {any} */ (obj), v, SCHEMA_VERSION);
}

/**
 * Project-schema migration registry.
 * @param {any} project
 * @param {number} from
 * @param {number} to
 */
function runMigrations(project, from, to) {
  let p = project;
  for (let v = from; v < to; v++) {
    const migrate = MIGRATIONS[v];
    if (!migrate) {
      throw new Error(`Missing migration from schema version ${v} to ${v + 1}.`);
    }
    p = migrate(p);
    p.schemaVersion = v + 1;
  }
  return p;
}

/** @type {Record<number, (project: any) => any>} */
const MIGRATIONS = {
  // v1 → v2: System → Architecture rename.
  //   * `systems` storage key → `architectureElements`
  //   * each artifact's id rewritten from `sys-N` → `arch-N`
  //   * `kind` field on architecture elements dropped
  //   * `counters.sys` → `counters.arch`
  //   * `preliminaryHazard.systemId` → `architectureId`
  //   * `consolidatedHazard.systemId` → `architectureId`
  //   * `derivedRequirement.allocatedSystemId` → `allocatedArchitectureId`
  //   * `derivedRequirement.originatingRefs[].type === 'system'` → `'architectureElement'`
  1: (project) => {
    const out = { ...project };
    const oldArr = Array.isArray(out.systems) ? out.systems : [];

    /** @type {Map<string, string>} */
    const idMap = new Map();
    const rewrittenArr = oldArr.map((a) => {
      const newId = a.id.replace(/^sys-/, 'arch-');
      idMap.set(a.id, newId);
      const { kind: _kind, ...rest } = a;
      return { ...rest, id: newId };
    });

    out.architectureElements = rewrittenArr;
    delete out.systems;

    // Rewrite parentId on architecture elements (self-ref).
    for (const a of rewrittenArr) {
      if (typeof a.parentId === 'string' && idMap.has(a.parentId)) {
        a.parentId = idMap.get(a.parentId);
      }
    }

    // counters
    if (out.counters && typeof out.counters === 'object') {
      const c = { ...out.counters };
      if ('sys' in c) {
        c.arch = c.sys;
        delete c.sys;
      }
      out.counters = c;
    }

    // Rewrite refs in other types.
    const renameRef = (val) =>
      typeof val === 'string' && idMap.has(val) ? idMap.get(val) : val;

    for (const a of out.preliminaryHazards ?? []) {
      if ('systemId' in a) {
        a.architectureId = renameRef(a.systemId);
        delete a.systemId;
      }
    }
    for (const a of out.consolidatedHazards ?? []) {
      if ('systemId' in a) {
        a.architectureId = renameRef(a.systemId);
        delete a.systemId;
      }
    }
    for (const a of out.derivedRequirements ?? []) {
      if ('allocatedSystemId' in a) {
        a.allocatedArchitectureId = renameRef(a.allocatedSystemId);
        delete a.allocatedSystemId;
      }
      if (Array.isArray(a.originatingRefs)) {
        a.originatingRefs = a.originatingRefs.map((r) => {
          if (!r || typeof r !== 'object') return r;
          const t = r.type === 'system' ? 'architectureElement' : r.type;
          const id = idMap.get(r.id) ?? r.id;
          return { type: t, id };
        });
      }
    }

    return out;
  },

  // v2 → v3: introduce harmonizedStandard artifact type. Older project files
  // never had this storage key — `rebuildIndex` iterates every type's array
  // on load, so a missing key would crash. Initialise an empty array if the
  // file doesn't already provide one.
  2: (project) => {
    const out = { ...project };
    if (!Array.isArray(out.harmonizedStandards)) {
      out.harmonizedStandards = [];
    }
    return out;
  },
};

// --- Workspace autosave ------------------------------------------------

let autosaveEnabled = false;

/**
 * Subscribe to state changes and write the *entire workspace* to
 * localStorage whenever something dirties. Idempotent.
 */
export function enableAutosave() {
  if (autosaveEnabled) return;
  autosaveEnabled = true;

  const writeNow = () => {
    if (!state.isAnyDirty()) return;
    try {
      const entry = {
        savedAt: new Date().toISOString(),
        workspace: state.serializeWorkspace(),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(entry));
    } catch (err) {
      console.warn('OpenConformity autosave failed:', err);
    }
  };
  const debounced = debounce(writeNow, 300);

  state.subscribe((change) => {
    // Pure UI-state changes (selection, active-project, project-add for
    // an empty new project) don't dirty anything; let the debounced check
    // gate writes via isAnyDirty().
    if (change.kind === 'select' || change.kind === 'project-active') return;
    debounced();
  });
}

/**
 * @returns {AutosaveEntry | null}
 */
export function readAutosave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.savedAt !== 'string') return null;

    // Workspace format. Migrate any pre-current-schema projects in place.
    if (parsed.workspace && typeof parsed.workspace === 'object') {
      const workspace = parsed.workspace;
      workspace.projects = (workspace.projects ?? []).map((p) => {
        try {
          return { ...p, data: loadFromJson(p.data) };
        } catch {
          return p;
        }
      });
      return { savedAt: parsed.savedAt, workspace };
    }

    // Pre-multi-project single-project autosave. Wrap as a one-project
    // workspace so the user can still recover.
    if (parsed.project && parsed.project.schemaVersion) {
      let migrated;
      try {
        migrated = loadFromJson(parsed.project);
      } catch {
        return null;
      }
      return {
        savedAt: parsed.savedAt,
        workspace: {
          workspaceSchemaVersion: WORKSPACE_SCHEMA_VERSION,
          appVersion: APP_VERSION,
          projects: [{ id: 'proj-1', data: migrated }],
          projectOrder: ['proj-1'],
          activeProjectId: 'proj-1',
          selection: null,
          projectCounter: 1,
        },
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearAutosave() {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Returns the autosave only when it's strictly newer than the last
 * manual save (or there is no manual save) AND it actually contains
 * projects worth restoring.
 * @returns {AutosaveEntry | null}
 */
export function getRestorableAutosave() {
  const auto = readAutosave();
  if (!auto) return null;
  if (!auto.workspace.projects || auto.workspace.projects.length === 0) return null;
  const last = readLastManualSave();
  if (!last) return auto;
  return auto.savedAt > last.savedAt ? auto : null;
}

// --- Last-manual-save bookkeeping -------------------------------------

/** @returns {ManualSaveEntry | null} */
export function readLastManualSave() {
  try {
    const raw = localStorage.getItem(LAST_MANUAL_SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.savedAt !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** @param {ManualSaveEntry} entry */
function writeLastManualSave(entry) {
  try {
    localStorage.setItem(LAST_MANUAL_SAVE_KEY, JSON.stringify(entry));
  } catch (err) {
    console.warn('OpenConformity: could not record last save:', err);
  }
}

// --- Helpers ----------------------------------------------------------

function slugify(s) {
  return (
    String(s)
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 64) || 'project'
  );
}

/**
 * @param {Blob} blob
 * @param {string} filename
 */
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}
