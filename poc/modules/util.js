/**
 * Small pure helpers used across modules. Keep this file dependency-free.
 */

/**
 * Escape a value for safe insertion into HTML text or attribute context.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Deep-clone a JSON-shaped value. Uses structuredClone where available
 * and falls back to JSON round-trip for older engines.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

/**
 * Format an ISO 8601 date string for display.
 * @param {string} iso
 * @returns {string}
 */
export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

/**
 * Trailing-edge debounce: collapse rapid calls into a single invocation
 * after the caller has been quiet for `ms`.
 * @template {(...args: any[]) => void} F
 * @param {F} fn
 * @param {number} ms
 * @returns {F}
 */
export function debounce(fn, ms) {
  let timer;
  // @ts-ignore — the cast back to F is the contract
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Build a DOM element with attributes and children in one call.
 *
 * Attribute keys are mostly plain HTML attribute names. Two conventions:
 *  - `class` sets className.
 *  - `dataset` accepts an object whose entries become data-* attributes.
 *  - keys starting with `on` whose value is a function are bound as listeners
 *    (e.g. `onclick: handler`).
 * Children may be strings (auto-escaped via createTextNode) or DOM Nodes.
 *
 * @param {string} tag
 * @param {Record<string, unknown>} [attrs]
 * @param {Array<Node | string>} [children]
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = String(v);
    else if (k === 'dataset') {
      for (const [dk, dv] of Object.entries(/** @type {Record<string,string>} */ (v))) {
        node.dataset[dk] = String(dv);
      }
    } else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), /** @type {EventListener} */ (v));
    } else {
      node.setAttribute(k, String(v));
    }
  }
  for (const c of children) {
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}
