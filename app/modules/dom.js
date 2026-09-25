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
/**
 * Arrow keys along a tab list, as Carbon's tabs take them: Left and
 * Right move by one and wrap, Home and End go to the ends, and each
 * activates what it lands on.
 * @param {HTMLElement} bar  the element carrying the tabs
 * @param {(index: number) => void} pick  activates the tab at the index
 */
export function tabKeys(bar, pick) {
  bar.addEventListener('keydown', (event) => {
    const tabs = [...bar.querySelectorAll('[role="tab"]')];
    const at = tabs.indexOf(document.activeElement);
    if (at < 0) return;
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    const to = step !== undefined ? (at + step + tabs.length) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
    if (to < 0) return;
    event.preventDefault();
    pick(to);
  });
}

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

/**
 * A tag with Carbon's tooltip, one anatomy wherever a tag stands: a
 * caption, small, saying what the tag is, a parameter's name or an
 * entity's identifier; the main line, at body size, saying what it
 * holds, the value or the title; and a note beneath where there is
 * one, a rationale or a state. Shown on hover or focus and dismissed
 * with Escape. Where a tag cannot be a button, within a field that is
 * itself a button, a span with the browser's own.
 * @param {string} className
 * @param {Array<Node>} content
 * @param {{ caption: string, main?: string, note?: string }} lines
 * @param {string|number} key  with the tipKey, the tooltip's id
 * @param {string|null} tipKey  null within a field, where a tag cannot be a button
 */
export function tooltipTag(className, content, { caption, main = '', note = '' }, key, tipKey) {
  const said = [caption, main].filter(Boolean).join(' ');
  if (tipKey === null) return el('span', { className, attributes: { title: note ? `${said}\n${note}` : said } }, content);
  const id = `tag-${tipKey}-${key}`;
  const tip = el('span', { className: 'tooltip', attributes: { role: 'tooltip', id } }, [
    el('span', { className: 'tooltip-caption', text: caption }),
    ...(main ? [el('span', { className: 'tooltip-main', text: main })] : []),
    ...(note ? [el('span', { className: 'tooltip-note', text: note })] : []),
  ]);
  const held = el('button', { className: `${className} tag-trigger`, attributes: { type: 'button', 'aria-describedby': id } }, [...content, tip]);
  held.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') held.blur();
  });
  return held;
}

/**
 * Carbon's tooltip on an icon-only button: its label, shown under it on
 * hover or focus and dismissed with Escape, which is the primary use
 * Carbon gives a tooltip. The label is also the button's accessible
 * name, the tooltip itself hidden from assistive technology so nothing
 * is read twice, and the browser's own title is never set. Calling it
 * again changes the text, for a label that follows the state. The
 * tooltip hangs from the edge asked for, and flips to the other edge
 * when it would run past the box that clips it, as Carbon auto-aligns
 * a tooltip, so a button at the end of its row is never cut off.
 * @param {HTMLElement} button
 * @param {string} text  the tooltip
 * @param {Object} [options]
 * @param {'start'|'end'} [options.align]  which edge of the button the tooltip hangs from; end for a button at the right of its row
 * @param {string} [options.label]  the accessible name where it says more than the tooltip
 */
export function tooltipOn(button, text, { align = 'start', label = text } = {}) {
  let tip = [...button.children].find((held) => held.classList.contains('tooltip'));
  if (!tip) {
    tip = el('span', { className: align === 'end' ? 'tooltip tooltip-end' : 'tooltip', attributes: { 'aria-hidden': 'true' } });
    button.classList.add('tip-trigger');
    button.appendChild(tip);
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') button.blur();
    });
    const place = () => {
      tip.classList.toggle('tooltip-end', align === 'end');
      const clip = clippingBox(button);
      const box = tip.getBoundingClientRect();
      if (align === 'end' ? box.left < clip.left : box.right > clip.right) tip.classList.toggle('tooltip-end', align !== 'end');
    };
    button.addEventListener('mouseenter', place);
    button.addEventListener('focus', place);
  }
  tip.textContent = text;
  button.setAttribute('aria-label', label);
  button.removeAttribute('title');
  return button;
}

/**
 * The box that would clip something hanging off an element: the nearest
 * ancestor that hides or scrolls its overflow, or the viewport.
 * @param {Element} element
 * @returns {{ left: number, right: number }}
 */
function clippingBox(element) {
  const view = element.ownerDocument.defaultView;
  for (let held = element.parentElement; held; held = held.parentElement) {
    const overflow = view.getComputedStyle(held).overflowX;
    if (overflow !== 'visible') return held.getBoundingClientRect();
  }
  return { left: 0, right: view.innerWidth };
}
