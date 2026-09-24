/**
 * Drawings: an SVG held as text in an attribute, checked before it is
 * accepted and before it is shown, and shown only as an image. The check
 * is the software's own reading of the text through a small strict XML
 * parser, so that what a drawing holds is known before any browser
 * parses it, and so the same rule runs in the tests as in the page. What
 * keeps a drawing harmless is the image, which the browser grants no
 * script, no document and no network; the check keeps the stored
 * drawing clean, and refuses rather than repairs, so what is stored is
 * exactly what its author made.
 */

/** The most characters a drawing may hold. */
export const DRAWING_LIMIT = 512 * 1024;

/** The widest or tallest a drawing may declare itself, in user units. */
export const DIMENSION_LIMIT = 16384;

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/** Elements a drawing may not hold, in any namespace: what runs code or embeds a document. */
const FORBIDDEN_ELEMENTS = new Set(['script', 'iframe', 'object', 'embed', 'applet', 'frame', 'frameset']);

/** The five entities XML predefines; a drawing may use no other by name. */
const ENTITIES = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };

/**
 * @typedef {Object} XmlElement
 * @property {string} name  as written, prefix and all
 * @property {Array<{ name: string, value: string }>} attributes  values decoded
 * @property {XmlElement[]} children
 * @property {string} text  the element's own text, decoded, its children's excluded
 */

/**
 * Parse XML text into a tree, strictly: names, attributes, text,
 * comments, processing instructions, CDATA sections, a document type
 * declaration without an internal subset, and the five predefined
 * entities with numeric references. Anything else throws, with the
 * reason as its message.
 * @param {string} text
 * @returns {{ root: XmlElement, instructions: string[] }}
 */
export function parseXml(text) {
  let at = 0;
  const instructions = [];
  const fail = (what) => {
    throw new Error(what);
  };
  const peek = (held) => text.startsWith(held, at);
  const skipSpace = () => {
    while (at < text.length && /\s/.test(text[at])) at += 1;
  };
  const NAME = /[A-Za-z_:][\w.\-:]*/y;
  const readName = () => {
    NAME.lastIndex = at;
    const match = NAME.exec(text);
    if (!match) fail(`a name was expected at ${at}`);
    at += match[0].length;
    return match[0];
  };
  const decode = (raw) => {
    let out = '';
    let from = 0;
    for (;;) {
      const amp = raw.indexOf('&', from);
      if (amp < 0) return out + raw.slice(from);
      const end = raw.indexOf(';', amp);
      if (end < 0 || end - amp > 10) fail('an entity reference without its end');
      const name = raw.slice(amp + 1, end);
      let value;
      if (name.startsWith('#x')) value = String.fromCodePoint(Number.parseInt(name.slice(2), 16));
      else if (name.startsWith('#')) value = String.fromCodePoint(Number.parseInt(name.slice(1), 10));
      else if (Object.hasOwn(ENTITIES, name)) value = ENTITIES[name];
      else fail(`an entity the drawing may not use, ${name}`);
      if (value === undefined || Number.isNaN(value.codePointAt(0))) fail('a numeric reference to nothing');
      out += raw.slice(from, amp) + value;
      from = end + 1;
    }
  };
  const readMisc = () => {
    for (;;) {
      skipSpace();
      if (peek('<!--')) {
        const end = text.indexOf('-->', at + 4);
        if (end < 0) fail('an unclosed comment');
        at = end + 3;
      } else if (peek('<?')) {
        const end = text.indexOf('?>', at + 2);
        if (end < 0) fail('an unclosed instruction');
        instructions.push(text.slice(at + 2, end));
        at = end + 2;
      } else return;
    }
  };
  const readElement = () => {
    at += 1;
    const name = readName();
    const attributes = [];
    for (;;) {
      skipSpace();
      if (peek('/>')) {
        at += 2;
        return { name, attributes, children: [], text: '' };
      }
      if (peek('>')) {
        at += 1;
        break;
      }
      const attribute = readName();
      skipSpace();
      if (text[at] !== '=') fail(`an attribute ${attribute} without a value`);
      at += 1;
      skipSpace();
      const quote = text[at];
      if (quote !== '"' && quote !== "'") fail(`an attribute ${attribute} without quotes`);
      const end = text.indexOf(quote, at + 1);
      if (end < 0) fail(`an unclosed value for ${attribute}`);
      const raw = text.slice(at + 1, end);
      if (raw.includes('<')) fail(`a < inside the value of ${attribute}`);
      attributes.push({ name: attribute, value: decode(raw) });
      at = end + 1;
    }
    const children = [];
    let own = '';
    for (;;) {
      if (at >= text.length) fail(`an unclosed element ${name}`);
      if (peek('</')) {
        at += 2;
        const closing = readName();
        skipSpace();
        if (text[at] !== '>') fail(`a malformed end tag for ${closing}`);
        at += 1;
        if (closing !== name) fail(`${closing} closes ${name}`);
        return { name, attributes, children, text: own };
      }
      if (peek('<!--')) {
        const end = text.indexOf('-->', at + 4);
        if (end < 0) fail('an unclosed comment');
        at = end + 3;
      } else if (peek('<![CDATA[')) {
        const end = text.indexOf(']]>', at + 9);
        if (end < 0) fail('an unclosed CDATA section');
        own += text.slice(at + 9, end);
        at = end + 3;
      } else if (peek('<?')) {
        const end = text.indexOf('?>', at + 2);
        if (end < 0) fail('an unclosed instruction');
        instructions.push(text.slice(at + 2, end));
        at = end + 2;
      } else if (peek('<!')) {
        fail('a declaration inside the document');
      } else if (peek('<')) {
        children.push(readElement());
      } else {
        const end = text.indexOf('<', at);
        const stop = end < 0 ? text.length : end;
        own += decode(text.slice(at, stop));
        at = stop;
      }
    }
  };

  readMisc();
  if (peek('<!DOCTYPE')) {
    const end = text.indexOf('>', at);
    if (end < 0) fail('an unclosed document type declaration');
    if (text.slice(at, end).includes('[')) fail('a document type declaration with an internal subset');
    at = end + 1;
    readMisc();
  }
  if (!peek('<') || peek('</') || peek('<!')) fail('no root element');
  const root = readElement();
  readMisc();
  if (at < text.length) fail('content after the root element');
  return { root, instructions };
}

/** A name without its prefix. */
const local = (name) => name.slice(name.indexOf(':') + 1);

/** An element's attribute value by local name, or undefined. */
const attributeOf = (element, name) => element.attributes.find((held) => local(held.name) === name)?.value;

/** The leading number of a length such as `522px`, or NaN. */
const lengthOf = (value) => Number.parseFloat(String(value ?? '').trim());

/**
 * Whether a stylesheet or a style attribute reaches outside the drawing:
 * an import, or a url() that is not a local reference or data.
 * @param {string} css
 * @returns {string|null}  what is wrong, or null
 */
function cssFault(css) {
  if (/@import/i.test(css)) return 'imports a stylesheet';
  const urls = css.matchAll(/url\(\s*(['"]?)([^'")]*)\1\s*\)/gi);
  for (const [, , target] of urls) {
    const held = target.trim().toLowerCase();
    if (!held.startsWith('#') && !held.startsWith('data:')) return 'references a resource outside the drawing';
  }
  return null;
}

/**
 * Whether a drawing may be accepted: an SVG document, within the size
 * limit, declaring no entities, linking no stylesheet, holding no
 * element that runs code or embeds a document and no event handler,
 * referencing nothing outside itself, and no larger than the dimension
 * limit. The reason completes the sentence "The drawing …".
 * @param {string} text
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function checkDrawing(text) {
  const refuse = (reason) => ({ ok: false, reason });
  if (typeof text !== 'string' || text.trim() === '') return refuse('holds nothing');
  if (text.length > DRAWING_LIMIT) return refuse(`is larger than ${Math.round(DRAWING_LIMIT / 1024)} KB`);
  if (/<!ENTITY/i.test(text)) return refuse('declares entities');
  let parsed;
  try {
    parsed = parseXml(text);
  } catch (error) {
    return refuse(`is not well-formed XML, holding ${error.message}`);
  }
  if (parsed.instructions.some((held) => /^xml-stylesheet\b/.test(held.trim()))) return refuse('links a stylesheet');
  const { root } = parsed;
  if (local(root.name) !== 'svg' || !root.attributes.some((held) => held.value === SVG_NAMESPACE)) return refuse('is not an SVG document');
  for (const side of ['width', 'height']) {
    const held = lengthOf(attributeOf(root, side));
    if (!Number.isNaN(held) && Math.abs(held) > DIMENSION_LIMIT) return refuse(`declares a ${side} beyond ${DIMENSION_LIMIT}`);
  }
  const box = attributeOf(root, 'viewBox');
  if (box !== undefined && box.trim().split(/[\s,]+/).some((held) => Math.abs(Number.parseFloat(held)) > DIMENSION_LIMIT)) {
    return refuse(`declares a view beyond ${DIMENSION_LIMIT}`);
  }
  const fault = walk(root);
  return fault === null ? { ok: true } : refuse(fault);
}

/**
 * The first fault in an element or beneath it, or null.
 * @param {XmlElement} element
 * @returns {string|null}
 */
function walk(element) {
  const name = local(element.name).toLowerCase();
  if (FORBIDDEN_ELEMENTS.has(name)) return `holds a ${name} element`;
  for (const attribute of element.attributes) {
    const key = attribute.name.toLowerCase();
    if (key.startsWith('on')) return 'holds an event handler';
    if (local(key) === 'href') {
      const target = attribute.value.trim().toLowerCase().replace(/\s+/g, '');
      if (/^(javascript|vbscript|data:text\/html)/.test(target)) return 'links to code';
      if (name === 'image' && !target.startsWith('#') && !target.startsWith('data:image/')) return 'references an image outside the drawing';
      if (name === 'use' && !target.startsWith('#')) return 'references a shape outside the drawing';
    }
    if (local(key) === 'style') {
      const held = cssFault(attribute.value);
      if (held !== null) return held;
    }
  }
  if (name === 'style') {
    const held = cssFault(element.text);
    if (held !== null) return held;
  }
  for (const child of element.children) {
    const held = walk(child);
    if (held !== null) return held;
  }
  return null;
}

/**
 * The editor's own model a drawing carries, as draw.io writes it into
 * the root's content attribute, or null where the drawing carries none.
 * @param {string} text  a drawing that passed the check
 * @returns {string|null}
 */
export function embeddedModel(text) {
  try {
    const held = attributeOf(parseXml(text).root, 'content');
    return typeof held === 'string' && /^\s*<(mxfile|mxGraphModel)\b/.test(held) ? held : null;
  } catch {
    return null;
  }
}

/** A drawing as an image source: a data URL the browser renders in image mode, granting it nothing. */
export const dataUrl = (text) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;

/** A drawing's size as a line beneath it. */
export const sizeText = (text) => `${Math.max(1, Math.round(text.length / 1024))} KB`;
