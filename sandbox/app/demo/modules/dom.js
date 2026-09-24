/**
 * Element construction.
 *
 * Everything the user types reaches the interface through these helpers, and
 * every one of them sets text through `textContent`. No path in the software
 * assigns user content to `innerHTML`.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * @param {string} tag
 * @param {Object<string, string|number|boolean|Function>} [attributes]
 *   `text` sets textContent, `class` sets the class list, a key starting with
 *   `on` binds the matching event, anything else becomes an attribute.
 * @param {Array<Node|string>} [children]
 * @returns {HTMLElement}
 */
export function el(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);
  applyAttributes(node, attributes);
  append(node, children);
  return node;
}

/**
 * @param {string} tag
 * @param {Object<string, string|number|boolean|Function>} [attributes]
 * @param {Array<Node|string>} [children]
 * @returns {SVGElement}
 */
export function svg(tag, attributes = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  applyAttributes(node, attributes);
  append(node, children);
  return node;
}

/**
 * @param {Element} node
 * @param {Object<string, any>} attributes
 */
function applyAttributes(node, attributes) {
  for (const [key, value] of Object.entries(attributes)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'text') {
      node.textContent = String(value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, value === true ? '' : String(value));
    }
  }
}

/**
 * @param {Element} node
 * @param {Array<Node|string>} children
 */
function append(node, children) {
  for (const child of children) {
    if (child === null || child === undefined) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
}

/**
 * An icon from the sprite defined in the document. An icon takes the colour of
 * whatever it sits in unless it is given a pillar, which the stylesheet turns
 * into that pillar's colour.
 *
 * The shape is still what says which type an icon is: all eighteen have
 * distinct silhouettes, and four colours cannot tell eighteen things apart
 * (D-027, N-ACC-002). The colour groups them, so a pillar is found by
 * scanning rather than by reading every row.
 *
 * @param {string} symbolId
 * @param {string} [pillar]  entity type pillar key, for an entity type icon
 * @returns {SVGElement}
 */
export function icon(symbolId, pillar) {
  return svg('svg', { class: 'icon', 'data-pillar': pillar ?? null, 'aria-hidden': 'true', focusable: 'false' }, [
    svg('use', { href: `#${symbolId}` }),
  ]);
}

/**
 * @param {Element} node
 */
export function clear(node) {
  node.replaceChildren();
}

/**
 * Cut a label to a length the layout can hold, keeping whole characters.
 * @param {string} value
 * @param {number} max
 * @returns {string}
 */
export function truncate(value, max) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
