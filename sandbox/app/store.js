/**
 * The store: the one owner of what is open — the project, the selection,
 * the session state, the history, and the browser persistence behind
 * `commit`. Panes read from it and flows write through it; nothing else
 * holds state that outlives a render.
 *
 * Model state travels through history and marks the project unsaved.
 * Session state — the selection, the tree expansion, the theme — persists
 * on change, never enters history, and never dirties. Whether the project
 * is saved derives from one pointer: the history sequence the last save
 * stood at. Across sessions the derived boolean rides in the blob: a clean
 * restore seeds the pointer at the initial entry, a dirty one seeds it
 * unreachable.
 *
 * Picker mode is a third kind of state: the subject and the picks — each
 * an identifier with, where a pair admits more than one relationship, the
 * chosen one — of an add-relationship workflow in progress. It survives
 * commits, is never persisted, and never enters history. A change that
 * removes a picked entity clears that pick; one that removes the subject
 * closes the workflow.
 *
 * A session can hold no project at all: nothing commits, nothing
 * persists, and nothing is dirty until one is created or opened.
 *
 * The blob is a cache of the open project, holding the same file shape the
 * serialisation writes, and it passes the same loader on the way back. A
 * blob that fails to load is set aside rather than deleted: at failure
 * time it is copied to the side key, where it survives every later
 * persist until the next failure replaces it. The restoration state says
 * the previous session could not be restored; the store never raises a
 * file refusal for it.
 */

import { createModel, nodeOf } from './model.js';
import { createHistory } from './history.js';
import { toFileObject, loadProject } from './files.js';

/** The browser-storage key of the project and session blob. */
const PROJECT_KEY = 'openconformity.project';

/** The side key a blob that failed to load is copied to at failure time. */
const ASIDE_KEY = 'openconformity.project.aside';

/** The theme's own key, beside the blob, so replacing the project does not reset it. */
const THEME_KEY = 'openconformity.theme';

/** The two Carbon themes; null follows the system preference. */
const THEMES = ['white', 'g100'];

/** A sequence no history entry ever carries. */
const UNREACHABLE = -1;

/**
 * @param {Object} context
 * @param {{ getItem: (key: string) => string|null,
 *           setItem: (key: string, value: string) => void,
 *           removeItem: (key: string) => void }} context.storage
 *        localStorage in the browser, or a stand-in in tests
 */
export function createStore({ storage }) {
  let model = createModel();
  let history = createHistory(model);
  let savedSequence = history.sequence();
  /** Whether a project is open at all. A fresh session has none. */
  let projectOpen = false;
  /** @type {string|null} */
  let selection = null;
  /** @type {Set<string>} */
  let expanded = new Set();
  /** @type {string|null} */
  let theme = null;
  /** @type {'fresh'|'restored'|'failed'} */
  let restoration = 'fresh';
  let persistFailed = false;
  /** @type {{ subject: string, picks: Array<{ id: string, form: { typeId: string, direction: 'outgoing'|'incoming' }|null }> }|null} */
  let picker = null;
  const listeners = new Set();

  function notify() {
    for (const listener of listeners) listener();
  }

  function dirty() {
    return projectOpen && history.sequence() !== savedSequence;
  }

  /**
   * Write the blob: the project in file shape, the session state beside
   * it. With no project open there is nothing to cache.
   */
  function persist() {
    if (!projectOpen) return;
    const blob = {
      project: toFileObject(model),
      session: { selection, expanded: [...expanded], dirty: dirty() },
    };
    try {
      storage.setItem(PROJECT_KEY, JSON.stringify(blob));
      persistFailed = false;
    } catch {
      persistFailed = true;
    }
  }

  /**
   * The filing ancestors of a node, nearest first, read before a change so
   * a vanished selection can land on the nearest survivor.
   * @param {string|null} id
   * @returns {string[]}
   */
  function ancestorsOf(id) {
    const trail = [];
    const seen = new Set();
    let current = id === null ? null : nodeOf(model, id);
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      current = nodeOf(model, current.parent);
      if (current) trail.push(current.id);
    }
    return trail;
  }

  /**
   * Keep the selection if it survived, else the nearest surviving ancestor
   * from the trail, else the root.
   * @param {string[]} trail
   */
  function repairSelection(trail) {
    if (selection === null || model.nodes.has(selection)) return;
    selection = trail.find((id) => model.nodes.has(id)) ?? null;
  }

  /**
   * A change that removes a picked entity clears that pick; one that
   * removes the subject closes the workflow.
   */
  function repairPicker() {
    if (picker === null) return;
    if (!model.nodes.has(picker.subject)) {
      picker = null;
      return;
    }
    picker.picks = picker.picks.filter((pick) => model.nodes.has(pick.id));
  }

  // --- Restoring the previous session ---------------------------------

  try {
    const storedTheme = storage.getItem(THEME_KEY);
    theme = THEMES.includes(storedTheme) ? storedTheme : null;
  } catch {
    theme = null;
  }

  let raw = null;
  try {
    raw = storage.getItem(PROJECT_KEY);
  } catch {
    raw = null;
  }
  if (raw !== null && raw !== undefined) {
    restoration = 'failed';
    try {
      const blob = JSON.parse(raw);
      const loaded = loadProject(blob.project);
      if (loaded.ok) {
        model = loaded.model;
        history = createHistory(model);
        savedSequence = blob.session?.dirty ? UNREACHABLE : history.sequence();
        const wanted = blob.session?.selection;
        selection = typeof wanted === 'string' && model.nodes.has(wanted) ? wanted : null;
        const openIds = Array.isArray(blob.session?.expanded) ? blob.session.expanded : [];
        expanded = new Set(openIds.filter((id) => model.nodes.has(id)));
        projectOpen = true;
        restoration = 'restored';
      }
    } catch {
      // Falls through to the set-aside below.
    }
    if (restoration === 'failed') {
      try {
        storage.setItem(ASIDE_KEY, raw);
      } catch {
        // Storage refused the copy; the project key still holds the blob.
      }
    }
  }

  return {
    /** @returns {import('./model.js').Model} */
    model: () => model,

    /** Whether a project is open at all. A fresh session has none. */
    hasProject: () => projectOpen,

    /** The history sequence the current entry carries. */
    sequence: () => history.sequence(),

    /** How the session began: fresh, restored, or failed to restore. */
    restoration: () => restoration,

    /** Whether the last write to browser storage failed. */
    persistFailed: () => persistFailed,

    /** @param {() => void} listener  @returns {() => void} */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    // --- The model ----------------------------------------------------

    /**
     * Run one model change and make it a step: on success the change is
     * recorded in history, the selection repaired if the change removed
     * it, and the session persisted. A refused change touches nothing.
     * @param {(model: import('./model.js').Model) => { ok: boolean, reason?: string }} action
     * @returns {{ ok: boolean, reason?: string }}
     */
    commit(action) {
      if (!projectOpen) return { ok: false, reason: 'No project is open.' };
      const trail = ancestorsOf(selection);
      const outcome = action(model);
      if (!outcome || outcome.ok !== true) {
        return outcome ?? { ok: false, reason: 'The change returned no outcome.' };
      }
      history.record(model);
      repairSelection(trail);
      repairPicker();
      persist();
      notify();
      return outcome;
    },

    dirty,

    /** Point the saved state at the entry now standing. */
    markSaved() {
      if (!projectOpen) return;
      savedSequence = history.sequence();
      persist();
      notify();
    },

    /**
     * Step back and drop what was stepped off, so a collapsed change
     * leaves no residue: no entry, no redo. False at the bottom.
     * @returns {boolean}
     */
    rollback() {
      const trail = ancestorsOf(selection);
      const rolled = history.rollback(model);
      if (rolled === null) return false;
      model = rolled;
      repairSelection(trail);
      repairPicker();
      persist();
      notify();
      return true;
    },

    canUndo: () => history.canUndo(),
    canRedo: () => history.canRedo(),

    /** How many steps back and forward the arrows reach. */
    historyDepth: () => history.depth(),

    /** @returns {boolean} whether a step was taken */
    undo() {
      if (!history.canUndo()) return false;
      const trail = ancestorsOf(selection);
      model = history.undo(model);
      repairSelection(trail);
      repairPicker();
      persist();
      notify();
      return true;
    },

    /** @returns {boolean} whether a step was taken */
    redo() {
      if (!history.canRedo()) return false;
      const trail = ancestorsOf(selection);
      model = history.redo(model);
      repairSelection(trail);
      repairPicker();
      persist();
      notify();
      return true;
    },

    /**
     * Install another project: an opened file, or a new empty model. The
     * history starts over, the project stands saved, and the selection and
     * expansion clear. The theme stays.
     * @param {import('./model.js').Model} next
     */
    replaceProject(next) {
      model = next;
      history = createHistory(model);
      savedSequence = history.sequence();
      selection = null;
      expanded = new Set();
      picker = null;
      projectOpen = true;
      persist();
      notify();
    },

    // --- Picker mode ----------------------------------------------------

    /** The workflow in progress, or null. The picks ride as copies. */
    picker: () =>
      picker === null
        ? null
        : { subject: picker.subject, picks: picker.picks.map((pick) => ({ ...pick })) },

    /**
     * Start an add-relationship workflow pinned to this entity.
     * @param {string} subjectId
     */
    beginPicking(subjectId) {
      const subject = nodeOf(model, subjectId);
      if (!subject || subject.kind !== 'entity') return;
      picker = { subject: subjectId, picks: [] };
      notify();
    },

    /**
     * Pick an entity, or unpick it. A fresh pick carries no chosen form:
     * the relationship is inferred from the pair until one is chosen.
     * @param {string} id
     */
    togglePick(id) {
      if (picker === null) return;
      const at = picker.picks.findIndex((pick) => pick.id === id);
      if (at >= 0) picker.picks.splice(at, 1);
      else picker.picks.push({ id, form: null });
      notify();
    },

    /**
     * Choose the relationship a pick means, where its pair admits more
     * than one.
     * @param {string} id
     * @param {{ typeId: string, direction: 'outgoing'|'incoming' }} form
     */
    setPickChoice(id, form) {
      const pick = picker?.picks.find((held) => held.id === id);
      if (!pick) return;
      pick.form = form;
      notify();
    },

    /** Close the workflow. */
    endPicking() {
      if (picker === null) return;
      picker = null;
      notify();
    },

    // --- The selection ------------------------------------------------

    selection: () => selection,

    /**
     * Select a node, or nothing. An identifier not in the model selects
     * nothing.
     * @param {string|null} id
     */
    select(id) {
      if (!projectOpen) return;
      const next = id !== null && model.nodes.has(id) ? id : null;
      if (next === selection) return;
      selection = next;
      persist();
      notify();
    },

    // --- Session state ------------------------------------------------

    /** @param {string} id */
    isExpanded: (id) => expanded.has(id),

    /** The expanded identifiers, for the tree. */
    expandedIds: () => [...expanded],

    /**
     * Expand or collapse a node in the tree. Session state: persisted on
     * change, never in history, never dirtying.
     * @param {string} id
     * @param {boolean} open
     */
    setExpanded(id, open) {
      if (!model.nodes.has(id)) return;
      if (open === expanded.has(id)) return;
      if (open) expanded.add(id);
      else expanded.delete(id);
      persist();
      notify();
    },

    theme: () => theme,

    /**
     * Choose a theme, or null to follow the system preference.
     * @param {string|null} value
     */
    setTheme(value) {
      const next = THEMES.includes(value) ? value : null;
      if (next === theme) return;
      theme = next;
      try {
        if (theme === null) storage.removeItem(THEME_KEY);
        else storage.setItem(THEME_KEY, theme);
      } catch {
        persistFailed = true;
      }
      notify();
    },
  };
}
