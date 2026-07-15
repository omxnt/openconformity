/**
 * Pane-resize handles.
 *
 * Two handles in the layout:
 *   - #resizer-tree     vertical, left/right drag, sets --pane-tree-width
 *   - #resizer-trace    horizontal, up/down drag, sets --pane-trace-height
 *
 * Sizes persist to localStorage so they survive page reloads. UI state
 * lives outside the project file (locked decision: the project file stays
 * portable and diff-friendly across users).
 */

const STORAGE_KEY = 'openconformity:paneSizes:v1';

const TREE_MIN = 200;
const TREE_MAX = 600;
const TRACE_MIN = 100;
const TRACE_MAX = 700;

/**
 * Mount drag handlers on the resizer elements and apply any previously
 * persisted pane sizes. Idempotent.
 */
export function enablePaneDragging() {
  applyPersistedSizes();

  const treeHandle = /** @type {HTMLElement | null} */ (document.getElementById('resizer-tree'));
  const traceHandle = /** @type {HTMLElement | null} */ (document.getElementById('resizer-trace'));

  if (treeHandle) {
    setupVerticalResize(treeHandle, '--pane-tree-width', {
      min: TREE_MIN,
      max: TREE_MAX,
      direction: 1,
    });
  }
  if (traceHandle) {
    setupHorizontalResize(traceHandle, '--pane-trace-height', {
      min: TRACE_MIN,
      max: TRACE_MAX,
      // Trace pane grows upward, so dragging UP increases the height.
      direction: -1,
    });
  }
}

function applyPersistedSizes() {
  let saved;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    saved = raw ? JSON.parse(raw) : null;
  } catch {
    saved = null;
  }
  if (!saved || typeof saved !== 'object') return;

  if (typeof saved.treeWidth === 'number') {
    setVar(
      '--pane-tree-width',
      clamp(saved.treeWidth, TREE_MIN, TREE_MAX) + 'px'
    );
  }
  if (typeof saved.traceHeight === 'number') {
    setVar(
      '--pane-trace-height',
      clamp(saved.traceHeight, TRACE_MIN, TRACE_MAX) + 'px'
    );
  }
}

function persistSizes() {
  try {
    const entry = {
      treeWidth: parsePx(getVar('--pane-tree-width')),
      traceHeight: parsePx(getVar('--pane-trace-height')),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage may be unavailable; ignore.
  }
}

/**
 * Wire a vertical-axis (col-resize) handle.
 * @param {HTMLElement} handle
 * @param {string} varName
 * @param {{ min: number, max: number, direction: 1 | -1 }} opts
 */
function setupVerticalResize(handle, varName, { min, max, direction }) {
  let dragging = false;
  let startX = 0;
  let startSize = 0;

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startSize = parsePx(getVar(varName)) || 0;
    document.body.classList.add('is-dragging-pane');
    handle.classList.add('dragging');
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const next = clamp(startSize + direction * (e.clientX - startX), min, max);
    setVar(varName, next + 'px');
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove('is-dragging-pane');
    handle.classList.remove('dragging');
    persistSizes();
  });

  // Keyboard arrows for accessibility.
  handle.addEventListener('keydown', (e) => {
    let delta = 0;
    if (e.key === 'ArrowLeft') delta = -16;
    else if (e.key === 'ArrowRight') delta = 16;
    else return;
    e.preventDefault();
    const cur = parsePx(getVar(varName)) || 0;
    setVar(varName, clamp(cur + direction * delta, min, max) + 'px');
    persistSizes();
  });
}

/**
 * Wire a horizontal-axis (row-resize) handle.
 * @param {HTMLElement} handle
 * @param {string} varName
 * @param {{ min: number, max: number, direction: 1 | -1 }} opts
 */
function setupHorizontalResize(handle, varName, { min, max, direction }) {
  let dragging = false;
  let startY = 0;
  let startSize = 0;

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    dragging = true;
    startY = e.clientY;
    startSize = parsePx(getVar(varName)) || 0;
    document.body.classList.add('is-dragging-pane');
    handle.classList.add('dragging');
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const next = clamp(startSize + direction * (e.clientY - startY), min, max);
    setVar(varName, next + 'px');
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove('is-dragging-pane');
    handle.classList.remove('dragging');
    persistSizes();
  });

  handle.addEventListener('keydown', (e) => {
    let delta = 0;
    if (e.key === 'ArrowUp') delta = -16;
    else if (e.key === 'ArrowDown') delta = 16;
    else return;
    e.preventDefault();
    const cur = parsePx(getVar(varName)) || 0;
    setVar(varName, clamp(cur + direction * delta, min, max) + 'px');
    persistSizes();
  });
}

// --- helpers ---

function getVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function setVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function parsePx(value) {
  if (!value) return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
