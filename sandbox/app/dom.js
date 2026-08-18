/**
 * Element construction. Text reaches the page through textContent only,
 * so user content renders as text wherever it appears.
 */

/**
 * @param {string} tag
 * @param {Object} [options]
 * @param {string} [options.className]
 * @param {string} [options.text]
 * @param {Object<string, string>} [options.attributes]
 * @param {Node[]} [children]
 * @returns {HTMLElement}
 */
export function el(tag, options = {}, children = []) {
  const element = document.createElement(tag);
  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = options.text;
  for (const [name, value] of Object.entries(options.attributes ?? {})) {
    element.setAttribute(name, value);
  }
  for (const child of children) element.appendChild(child);
  return element;
}

/**
 * An SVG element. Text reaches it through textContent, like everywhere
 * else.
 * @param {string} tag
 * @param {Object<string, string>} [attributes]
 * @param {Node[]} [children]
 * @returns {SVGElement}
 */
export function svg(tag, attributes = {}, children = []) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  for (const child of children) element.appendChild(child);
  return element;
}

/**
 * An SVG text node.
 * @param {string} tag  'text' or 'tspan'
 * @param {Object<string, string>} attributes
 * @param {string} content
 * @returns {SVGElement}
 */
export function svgText(tag, attributes, content) {
  const element = svg(tag, attributes);
  element.textContent = content;
  return element;
}

/**
 * Hand the browser a file to save: the text behind an object URL on an
 * anchor, clicked and removed in one breath.
 * @param {string} filename
 * @param {string} text
 * @param {string} type  the MIME type the blob carries
 */
export function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = el('a', { attributes: { href: url, download: filename } });
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * An icon referencing a symbol of the sprite in `index.html`. A pillar
 * tints it with the pillar's colour where the icon stands for a type.
 * @param {string} symbolId
 * @param {string} [pillar]
 * @returns {SVGElement}
 */
export function icon(symbolId, pillar) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (pillar) svg.setAttribute('data-pillar', pillar);
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#${symbolId}`);
  svg.appendChild(use);
  return svg;
}
