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
 * serialisation writes, and it passes the same loader on the way back. It
 * is kept by the browser's retention, IndexedDB behind a small
 * asynchronous interface, written after every change with only the
 * newest blob written where changes come faster than writes. A blob that
 * fails to load is set aside rather than deleted: at failure time it is
 * copied to the side record, where it survives every later persist until
 * the next failure replaces it. The restoration state says the previous
 * session could not be restored; the store never raises a file refusal
 * for it. A blob the previous generation kept in web storage is moved to
 * the retention once, on the first restore that finds it. The retention
 * also says when the origin's storage is nearly full, so the user can be
 * told before a write is refused.
 */

import { createModel, nodeOf } from './model.js';
import { createHistory } from './history.js';
import { toFileObject, loadProject } from './files.js';
import { memoryRetention } from './retention.js';

/** The retention's record of the project and session blob. */
const PROJECT_RECORD = 'project';

/** The retention's record a blob that failed to load is copied to at failure time. */
const ASIDE_RECORD = 'aside';

/** The web-storage key the previous generation kept the blob under, read once to move it over. */
const PROJECT_KEY = 'openconformity.project';

/** The web-storage side key of the previous generation, moved over with it. */
const ASIDE_KEY = 'openconformity.project.aside';

/** The share of the origin's storage quota past which the user is told it is nearly full. */
const NEARLY_FULL = 0.8;

/** How often at most the retention is asked how full the storage is, in milliseconds. */
const ESTIMATE_PERIOD = 5000;

/** The theme's own key, beside the blob, so replacing the project does not reset it. */
const THEME_KEY = 'openconformity.theme';

/** The relationship view's key in the browser session: a reload keeps it, a new session opens on the default. */
const VIEW_KEY = 'openconformity.view';
/** Session storage: whether the relationship pane is collapsed to its head. */
const COLLAPSE_KEY = 'openconformity.relationships-collapsed';

/** The consent key in the browser session: the user's choice not to be asked before the external drawing editor loads, until the session ends. */
const CONSENT_KEY = 'openconformity.drawio-consent';
/** The chosen tabs' key in the browser session: the tab chosen for a type stays chosen until the session ends. */
const TABS_KEY = 'openconformity.tabs';
/** Session storage: the view open over the workspace, and its section, so a reload returns to it. */
const OPEN_VIEW_KEY = 'openconformity.open-view';

/** The two Carbon themes; null follows the system preference. */
const THEMES = ['white', 'g100'];

/** A sequence no history entry ever carries. */
const UNREACHABLE = -1;

/**
 * @param {Object} context
 * @param {{ getItem: (key: string) => string|null,
 *           setItem: (key: string, value: string) => void,
 *           removeItem: (key: string) => void }} context.storage
 *        localStorage in the browser, or a stand-in in tests: the theme,
 *        read before the first paint, and the previous generation's blob
 * @param {{ getItem: (key: string) => string|null,
 *           setItem: (key: string, value: string) => void }} [context.session]
 *        sessionStorage: presentation choices that survive a reload but
 *        never a new session, and never enter the project blob
 * @param {import('./retention.js').Retention} [context.retention]
 *        the browser's retention of the project between sessions; an
 *        in-memory one where none is given
 */
export function createStore({ storage, session = null, retention = memoryRetention() }) {
  let model = createModel();
  const history = createHistory(model);
  let savedSequence = history.sequence();
  /** Whether a project is open at all. A fresh session has none. */
  let projectOpen = false;
  /** @type {string|null} */
  let selection = null;
  /** @type {Set<string>} */
  let expanded = new Set();
  /** Whether the project row is collapsed over the whole tree. */
  let projectCollapsed = false;
  /** @type {string|null} */
  let theme = null;
  /** @type {'fresh'|'restored'|'failed'} how the session began, decided by `restore` */
  let restoration = 'fresh';
  /** Whether the copy this session's failed restore set aside still stands in the retention. */
  let asideHeld = false;
  let persistFailed = false;
  /** Whether the origin's storage stands past the share the user is told about. */
  let storageNearlyFull = false;
  /** The newest persist asked for; an older one still queued is skipped when its turn comes. */
  let persistSequence = 0;
  /** The chain every write and removal joins, so they land in order and can be awaited. */
  let tail = Promise.resolve();
  let lastEstimate = 0;
  /** @type {'list'|'graph'} the relationship pane's presentation: graph by default, a reload keeping the choice for the browser session */
  let relationshipView = 'graph';
  try {
    const storedView = session?.getItem(VIEW_KEY);
    if (storedView === 'list' || storedView === 'graph') relationshipView = storedView;
  } catch {
    // A session store that refuses changes nothing.
  }
  /** Whether the relationship pane stands collapsed to its head: session state, a reload keeping it */
  let relationshipsCollapsed = false;
  /** Whether the messages stand over the relationship pane: opened from the status bar, closed by its X or Escape, never kept across a reload. */
  let messagesOpen = false;
  try {
    relationshipsCollapsed = session?.getItem(COLLAPSE_KEY) === 'true';
  } catch {
    // A session store that refuses changes nothing.
  }
  /** @type {Object<string, string>} the tab chosen per entity type, by name: session state, a reload keeping it */
  const chosenTabs = {};
  try {
    const storedTabs = JSON.parse(session?.getItem(TABS_KEY) ?? '{}');
    if (storedTabs && typeof storedTabs === 'object' && !Array.isArray(storedTabs)) {
      for (const [code, name] of Object.entries(storedTabs)) if (typeof name === 'string') chosenTabs[code] = name;
    }
  } catch {
    // A session store that refuses, or holds nonsense, changes nothing.
  }
  /** @type {boolean} whether the user chose not to be asked again this session before the external drawing editor loads: session state, never the file's */
  let consented = false;
  try {
    consented = session?.getItem(CONSENT_KEY) === '1';
  } catch {
    // A session store that refuses changes nothing.
  }
  /** @type {{ id: string, section: number }|null} the view open over the workspace, session state */
  let openView = null;
  try {
    const stored = JSON.parse(session?.getItem(OPEN_VIEW_KEY) ?? 'null');
    if (stored && typeof stored.id === 'string') openView = { id: stored.id, section: Number.isInteger(stored.section) ? stored.section : 0 };
  } catch {
    // A session store that refuses, or holds nonsense, changes nothing.
  }
  /** @type {{ id: string, name: string, section: number, rowId: string }|null} the view an entity was chosen from, for the way back; never stored */
  let viewReturn = null;
  function keepOpenView() {
    try {
      if (openView === null) session?.removeItem(OPEN_VIEW_KEY);
      else session?.setItem(OPEN_VIEW_KEY, JSON.stringify(openView));
    } catch {
      // A session store that refuses changes nothing.
    }
  }
  /** The navigator's filter as typed: session state, never persisted, one truth for the tree and every enablement. */
  let navigatorFilter = '';
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
   * Ask the retention how full the origin's storage is, at most once a
   * period, and tell everyone when the answer crosses the line.
   */
  async function checkQuota() {
    const now = Date.now();
    if (now - lastEstimate < ESTIMATE_PERIOD) return;
    lastEstimate = now;
    const held = await retention.estimate().catch(() => null);
    const near = held !== null && held.quota > 0 && held.usage / held.quota >= NEARLY_FULL;
    if (near !== storageNearlyFull) {
      storageNearlyFull = near;
      notify();
    }
  }

  /**
   * Write the blob: the project in file shape, the session state beside
   * it. With no project open there is nothing to cache. The write joins
   * the chain; where a newer blob is queued by the time its turn comes,
   * it is skipped, so a burst of changes costs one write. A refused
   * write is on record until one succeeds, and each change of that
   * record is told.
   */
  function persist() {
    if (!projectOpen) return;
    const blob = {
      project: toFileObject(model),
      session: { selection, expanded: [...expanded], projectCollapsed, dirty: dirty() },
    };
    persistSequence += 1;
    const sequence = persistSequence;
    tail = tail
      .then(() => (sequence === persistSequence ? retention.write(PROJECT_RECORD, blob) : undefined))
      .then(
        () => {
          if (sequence !== persistSequence) return undefined;
          if (persistFailed) {
            persistFailed = false;
            notify();
          }
          return checkQuota();
        },
        () => {
          if (!persistFailed) {
            persistFailed = true;
            notify();
          }
        }
      );
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

  // --- The theme, read before anything else ---------------------------

  try {
    const storedTheme = storage.getItem(THEME_KEY);
    theme = THEMES.includes(storedTheme) ? storedTheme : null;
  } catch {
    theme = null;
  }

  /**
   * Install a blob the retention or the previous generation held: the
   * project through the loader the file passes, the session state
   * beside it. False where the blob does not load.
   * @param {unknown} blob
   * @returns {boolean}
   */
  function install(blob) {
    try {
      const loaded = loadProject(blob.project);
      if (!loaded.ok) return false;
      model = loaded.model;
      const seeded = history.reset(model);
      savedSequence = blob.session?.dirty ? UNREACHABLE : seeded;
      const wanted = blob.session?.selection;
      selection = typeof wanted === 'string' && model.nodes.has(wanted) ? wanted : null;
      const openIds = Array.isArray(blob.session?.expanded) ? blob.session.expanded : [];
      expanded = new Set(openIds.filter((id) => model.nodes.has(id)));
      projectCollapsed = blob.session?.projectCollapsed === true;
      projectOpen = true;
      if (openView !== null && Number.isInteger(openView.section) === false) openView = null;
      return true;
    } catch {
      return false;
    }
  }

  /** What web storage holds under a key, parsed where it parses, else as the text it is, else null. */
  /** Set the pane's collapsed state and keep it for the session, without notifying. */
  function collapseRelationships(collapsed) {
    relationshipsCollapsed = collapsed;
    try {
      session?.setItem(COLLAPSE_KEY, String(collapsed));
    } catch {
      // A session store that refuses changes nothing.
    }
  }

  function legacy(key) {
    let raw = null;
    try {
      raw = storage.getItem(key);
    } catch {
      raw = null;
    }
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  return {
    /**
     * Restore the previous session: the blob the retention holds, or
     * failing that the one the previous generation kept in web storage,
     * which is moved over and its keys removed. A blob that does not load
     * is set aside and the session begins on the landing, the state
     * saying so. Awaited once, before anything renders.
     */
    async restore() {
      let blob = null;
      try {
        blob = await retention.read(PROJECT_RECORD);
      } catch {
        blob = null;
      }
      let moving = false;
      if (blob === null) {
        blob = legacy(PROJECT_KEY);
        moving = blob !== null;
      }
      if (blob !== null) {
        restoration = install(blob) ? 'restored' : 'failed';
        if (restoration === 'failed') {
          try {
            await retention.write(ASIDE_RECORD, blob);
            asideHeld = true;
          } catch {
            // The retention refused the copy; the record it came from still holds the blob.
          }
        } else if (moving) {
          try {
            await retention.write(PROJECT_RECORD, blob);
          } catch {
            persistFailed = true;
          }
        }
      }
      if (moving || legacy(ASIDE_KEY) !== null) {
        const aside = legacy(ASIDE_KEY);
        if (aside !== null && restoration !== 'failed') {
          try {
            await retention.write(ASIDE_RECORD, aside);
          } catch {
            // The copy stays where it was.
          }
        }
        try {
          storage.removeItem(PROJECT_KEY);
          storage.removeItem(ASIDE_KEY);
        } catch {
          // Storage that refuses keeps its keys; the next restore tries again.
        }
      }
      notify();
    },

    /** Resolves once every persist and removal asked for so far has landed or been refused. */
    whenPersisted: () => tail,

    /** Whether the origin's storage stands past the share the user is told about. */
    storageNearlyFull: () => storageNearlyFull,

    /** @returns {import('./model.js').Model} */
    model: () => model,

    /** Whether a project is open at all. A fresh session has none. */
    hasProject: () => projectOpen,

    /** The history sequence the current entry carries. */
    sequence: () => history.sequence(),

    /** How the session began: fresh, restored, or failed to restore. */
    restoration: () => restoration,

    /** Whether the copy set aside by this session's failed restore still stands. */
    hasAside: () => asideHeld,

    /**
     * The set-aside copy as the retention holds it, read once every
     * queued write has landed; null where there is none or it cannot
     * be read.
     */
    aside: () => tail.then(() => retention.read(ASIDE_RECORD)).catch(() => null),

    /**
     * Remove the set-aside copy. The failed restore then has nothing
     * left to report, and the session counts as fresh.
     */
    discardAside() {
      asideHeld = false;
      restoration = 'fresh';
      tail = tail.then(() => retention.remove([ASIDE_RECORD])).catch(() => undefined);
      notify();
      return tail;
    },

    /** Whether the last write to browser storage failed. */
    persistFailed: () => persistFailed,

    /**
     * Clear everything this browser holds of the software: the project
     * and its set-aside copy, the theme, and the session state, so a
     * borrowed machine keeps nothing. The session returns to the landing
     * with no project, as a fresh one begins. A file saved by the user
     * is not the browser's to clear.
     */
    clearBrowserData() {
      persistSequence += 1;
      tail = tail.then(() => retention.remove([PROJECT_RECORD, ASIDE_RECORD])).catch(() => undefined);
      for (const key of [PROJECT_KEY, ASIDE_KEY, THEME_KEY]) {
        try {
          storage.removeItem(key);
        } catch {
          // Storage that refuses has nothing left to keep either way.
        }
      }
      for (const key of [VIEW_KEY, COLLAPSE_KEY, TABS_KEY, OPEN_VIEW_KEY, CONSENT_KEY]) {
        try {
          session?.removeItem(key);
        } catch {
          // A session store that refuses changes nothing.
        }
      }
      model = createModel();
      savedSequence = history.reset(model);
      projectOpen = false;
      asideHeld = false;
      selection = null;
      expanded = new Set();
      projectCollapsed = false;
      navigatorFilter = '';
      picker = null;
      openView = null;
      viewReturn = null;
      theme = null;
      consented = false;
      relationshipView = 'graph';
      messagesOpen = false;
      for (const code of Object.keys(chosenTabs)) delete chosenTabs[code];
      persistFailed = false;
      storageNearlyFull = false;
      notify();
    },

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
      savedSequence = history.reset(model);
      selection = null;
      expanded = new Set();
      projectCollapsed = false;
      navigatorFilter = '';
      picker = null;
      openView = null;
      viewReturn = null;
      keepOpenView();
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
      collapseRelationships(false);
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
      if (viewReturn !== null && next !== viewReturn.rowId) viewReturn = null;
      if (next === selection) return;
      selection = next;
      persist();
      notify();
    },

    // --- Session state ------------------------------------------------

    /** @param {string} id */
    isExpanded: (id) => expanded.has(id),

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

    /** Whether the project row stands open over the tree. Open by default. */
    projectExpanded: () => !projectCollapsed,

    /**
     * Collapse or reopen the project row. Session state like a node's
     * expansion, held as its collapse so an absent record means open.
     * @param {boolean} open
     */
    setProjectExpanded(open) {
      if (!projectOpen) return;
      if (open === !projectCollapsed) return;
      projectCollapsed = !open;
      persist();
      notify();
    },

    /** The tab chosen for an entity type, or null for its first. */
    tabOf: (code) => chosenTabs[code] ?? null,

    /**
     * Choose a type's tab for the browser session. The editor has shown
     * the panel in place already, and no other surface shows the choice,
     * so nothing is notified.
     * @param {string} code
     * @param {string} name
     */
    setTab(code, name) {
      chosenTabs[code] = name;
      try {
        session?.setItem(TABS_KEY, JSON.stringify(chosenTabs));
      } catch {
        // A session store that refuses changes nothing.
      }
    },


    /** The view open over the workspace, with its section, or null. */
    view: () => (projectOpen ? openView : null),

    /**
     * Open a view over the workspace, at a section. One truth for the
     * pane, the View menu and the editor's way back; kept for the
     * browser session, never in the project blob.
     * @param {string} id
     * @param {number} [section]
     */
    openView(id, section = 0) {
      if (!projectOpen || typeof id !== 'string') return;
      openView = { id, section: Number.isInteger(section) && section >= 0 ? section : 0 };
      keepOpenView();
      notify();
    },

    closeView() {
      if (openView === null) return;
      openView = null;
      keepOpenView();
      notify();
    },

    /** @param {number} section */
    setViewSection(section) {
      if (openView === null || !Number.isInteger(section) || section < 0 || section === openView.section) return;
      openView = { ...openView, section };
      keepOpenView();
      notify();
    },

    /** The view an entity was chosen from, with the row, or null. */
    viewReturn: () => viewReturn,

    /**
     * Record, or clear, the way back to a view. Selecting another entity
     * clears it too.
     * @param {{ id: string, name: string, section: number, rowId: string }|null} value
     */
    setViewReturn(value) {
      viewReturn = value;
      notify();
    },

    /** Which presentation the relationship pane shows. */
    relationshipView: () => relationshipView,

    /**
     * Choose the relationship pane's presentation. One truth for the
     * pane's tabs and the View menu; never persisted.
     * @param {'list'|'graph'} view
     */
    setRelationshipView(view) {
      if (view !== 'list' && view !== 'graph') return;
      if (view === relationshipView && !relationshipsCollapsed) return;
      relationshipView = view;
      try {
        session?.setItem(VIEW_KEY, view);
      } catch {
        // A session store that refuses changes nothing.
      }
      collapseRelationships(false);
      notify();
    },

    /** Whether the messages stand over the relationship pane. */
    messagesOpen: () => messagesOpen,

    /**
     * Show the messages over the relationship pane, expanding it, or hand
     * the pane back to its view.
     * @param {boolean} open
     */
    setMessagesOpen(open) {
      if (open === messagesOpen && !(open && relationshipsCollapsed)) return;
      messagesOpen = open;
      if (open) collapseRelationships(false);
      notify();
    },

    /** Whether the relationship pane stands collapsed to its head. */
    relationshipsCollapsed: () => relationshipsCollapsed,

    /**
     * Collapse the relationship pane to its head, or expand it again.
     * Session state like the view: kept for a reload within the session,
     * gone with it, never in a file.
     * @param {boolean} collapsed
     */
    setRelationshipsCollapsed(collapsed) {
      if (collapsed === relationshipsCollapsed) return;
      collapseRelationships(collapsed);
      notify();
    },

    /** Whether the user chose not to be asked again this session before the external drawing editor loads. */
    consented: () => consented,

    /**
     * Record, or withdraw, the choice not to be asked again this
     * session. Session state like the tabs: kept for a reload within the
     * session, gone with it, never in a file, told to no one.
     * @param {boolean} held
     */
    setConsented(held) {
      consented = held === true;
      try {
        if (consented) session?.setItem(CONSENT_KEY, '1');
        else session?.removeItem(CONSENT_KEY);
      } catch {
        // A session store that refuses changes nothing.
      }
    },

    /** The navigator's filter as typed. */
    navigatorFilter: () => navigatorFilter,

    /**
     * Set the navigator's filter. One truth for the tree, the drag
     * guards, and the move enablements; never persisted.
     * @param {string} text
     */
    setNavigatorFilter(text) {
      if (typeof text !== 'string' || text === navigatorFilter) return;
      navigatorFilter = text;
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
