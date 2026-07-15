/**
 * Icon module: classic colorful pictogram-style SVG icons for each artifact
 * type, plus a folder icon for tree group headers.
 *
 * Style intent (locked, see project_visual_design.md): Famfamfam Silk /
 * Fugue / Windows-XP-era — multi-color, slight shading, dark outlines.
 * NOT flat monochrome line icons.
 *
 * Implementation: a single SVG sprite is injected into the document body on
 * first call; each `typeIcon`/`groupIcon` returns a small <svg><use/></svg>
 * referencing a sprite symbol by id. Avoids duplicating SVG bytes per
 * tree row.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

/** @type {Record<import('./types.js').ArtifactKey, string>} */
const TYPE_ICON_ID = {
  architectureElement: 'oc-icon-gear',
  legislation:         'oc-icon-book',
  harmonizedStandard:  'oc-icon-book-green',
  essentialRequirement:'oc-icon-doc',
  preliminaryHazard:   'oc-icon-tri-yellow',
  consolidatedHazard:  'oc-icon-tri-red',
  riskReducingMeasure: 'oc-icon-shield',
  safetyFunction:      'oc-icon-network',
  derivedRequirement:  'oc-icon-doc-check',
  verificationActivity:'oc-icon-clipboard',
};

const SPRITE_HTML = `
<svg xmlns="${SVG_NS}" width="0" height="0" aria-hidden="true"
     style="position:absolute;width:0;height:0;overflow:hidden">
  <defs>

    <!-- Folder (closed): yellow manila with brown tab -->
    <symbol id="oc-icon-folder" viewBox="0 0 16 16">
      <path d="M1 5 L5 5 L6.5 6.2 L15 6.2 L15 13 L1 13 Z"
            fill="#dfa940" stroke="#5e3f0e" stroke-width="0.6" stroke-linejoin="round"/>
      <path d="M1 7.6 L15 7.6 L13.8 13 L2.2 13 Z"
            fill="#f5d273" stroke="#5e3f0e" stroke-width="0.6" stroke-linejoin="round"/>
      <line x1="2" y1="9.4" x2="13.7" y2="9.4" stroke="#f0c050" stroke-width="0.4" opacity="0.7"/>
    </symbol>

    <!-- Folder (open): same palette, splayed -->
    <symbol id="oc-icon-folder-open" viewBox="0 0 16 16">
      <path d="M1 5 L5 5 L6.5 6.2 L15 6.2 L15 8 L3 8 L1 13 Z"
            fill="#dfa940" stroke="#5e3f0e" stroke-width="0.6" stroke-linejoin="round"/>
      <path d="M3 8 L15.5 8 L13.5 13 L1 13 Z"
            fill="#f5d273" stroke="#5e3f0e" stroke-width="0.6" stroke-linejoin="round"/>
    </symbol>

    <!-- Project: blue binder with rings on spine and a label patch -->
    <symbol id="oc-icon-project" viewBox="0 0 16 16">
      <rect x="2" y="2" width="11" height="13" fill="#3b6dad" stroke="#1c3d6a" stroke-width="0.6"/>
      <rect x="2" y="2" width="2" height="13" fill="#2c5586"/>
      <circle cx="3" cy="5" r="0.6" fill="#ffffff" stroke="#1c3d6a" stroke-width="0.3"/>
      <circle cx="3" cy="8.5" r="0.6" fill="#ffffff" stroke="#1c3d6a" stroke-width="0.3"/>
      <circle cx="3" cy="12" r="0.6" fill="#ffffff" stroke="#1c3d6a" stroke-width="0.3"/>
      <rect x="5" y="5" width="6.5" height="3" fill="#dde7f3" stroke="#1c3d6a" stroke-width="0.3"/>
    </symbol>

    <!-- Architecture element: grey metal cog -->
    <symbol id="oc-icon-gear" viewBox="0 0 16 16">
      <g stroke="#3a3a3a" stroke-width="0.5" stroke-linejoin="round">
        <rect x="7" y="0.5" width="2" height="3" fill="#9aa3ad"/>
        <rect x="7" y="0.5" width="2" height="3" fill="#9aa3ad" transform="rotate(45 8 8)"/>
        <rect x="7" y="0.5" width="2" height="3" fill="#9aa3ad" transform="rotate(90 8 8)"/>
        <rect x="7" y="0.5" width="2" height="3" fill="#9aa3ad" transform="rotate(135 8 8)"/>
        <rect x="7" y="0.5" width="2" height="3" fill="#9aa3ad" transform="rotate(180 8 8)"/>
        <rect x="7" y="0.5" width="2" height="3" fill="#9aa3ad" transform="rotate(225 8 8)"/>
        <rect x="7" y="0.5" width="2" height="3" fill="#9aa3ad" transform="rotate(270 8 8)"/>
        <rect x="7" y="0.5" width="2" height="3" fill="#9aa3ad" transform="rotate(315 8 8)"/>
        <circle cx="8" cy="8" r="5" fill="#c5cdd6"/>
        <circle cx="8" cy="8" r="3.4" fill="#9aa3ad"/>
        <circle cx="8" cy="8" r="1.6" fill="#3a3a3a"/>
      </g>
      <path d="M5.5 5.5 Q8 4 10.5 5.5" fill="none" stroke="#e8ecef"
            stroke-width="0.6" opacity="0.7"/>
    </symbol>

    <!-- Legislation: red book with gold lettering and yellow ribbon -->
    <symbol id="oc-icon-book" viewBox="0 0 16 16">
      <rect x="2.5" y="2" width="11" height="12" fill="#b91c1c" stroke="#5a0a0a" stroke-width="0.6"/>
      <rect x="2.5" y="2" width="1.6" height="12" fill="#7a1212"/>
      <rect x="13" y="3" width="0.8" height="10" fill="#f5e8c8"/>
      <rect x="5.2" y="5" width="6.5" height="0.7" fill="#d4af37"/>
      <rect x="5.2" y="6.6" width="6.5" height="0.5" fill="#d4af37"/>
      <path d="M9 13.4 L9 16 L9.7 15.3 L10.4 16 L10.4 13.4 Z"
            fill="#f4c024" stroke="#5e3f0e" stroke-width="0.4"/>
    </symbol>

    <!-- Harmonized standard: green book with gold lettering and white ribbon -->
    <symbol id="oc-icon-book-green" viewBox="0 0 16 16">
      <rect x="2.5" y="2" width="11" height="12" fill="#2f7a3f" stroke="#0e3a18" stroke-width="0.6"/>
      <rect x="2.5" y="2" width="1.6" height="12" fill="#1c5026"/>
      <rect x="13" y="3" width="0.8" height="10" fill="#f5e8c8"/>
      <rect x="5.2" y="5" width="6.5" height="0.7" fill="#d4af37"/>
      <rect x="5.2" y="6.6" width="6.5" height="0.5" fill="#d4af37"/>
      <path d="M9 13.4 L9 16 L9.7 15.3 L10.4 16 L10.4 13.4 Z"
            fill="#ffffff" stroke="#0e3a18" stroke-width="0.4"/>
    </symbol>

    <!-- Essential requirement: blue document with text rules -->
    <symbol id="oc-icon-doc" viewBox="0 0 16 16">
      <path d="M3 1.5 L10 1.5 L13 4.5 L13 14.5 L3 14.5 Z"
            fill="#dde7f3" stroke="#2c5586" stroke-width="0.6" stroke-linejoin="round"/>
      <path d="M10 1.5 L10 4.5 L13 4.5 L10 1.5 Z"
            fill="#9bb4d4" stroke="#2c5586" stroke-width="0.6" stroke-linejoin="round"/>
      <line x1="5" y1="7.2" x2="11" y2="7.2" stroke="#3b6dad" stroke-width="0.7"/>
      <line x1="5" y1="9.2" x2="11" y2="9.2" stroke="#3b6dad" stroke-width="0.7"/>
      <line x1="5" y1="11.2" x2="9.5" y2="11.2" stroke="#3b6dad" stroke-width="0.7"/>
    </symbol>

    <!-- Derived requirement: blue document with green check -->
    <symbol id="oc-icon-doc-check" viewBox="0 0 16 16">
      <path d="M3 1.5 L10 1.5 L13 4.5 L13 14.5 L3 14.5 Z"
            fill="#dde7f3" stroke="#2c5586" stroke-width="0.6" stroke-linejoin="round"/>
      <path d="M10 1.5 L10 4.5 L13 4.5 L10 1.5 Z"
            fill="#9bb4d4" stroke="#2c5586" stroke-width="0.6" stroke-linejoin="round"/>
      <line x1="5" y1="7" x2="9" y2="7" stroke="#3b6dad" stroke-width="0.6"/>
      <line x1="5" y1="8.6" x2="9" y2="8.6" stroke="#3b6dad" stroke-width="0.6"/>
      <path d="M5 11.5 L7 13.3 L11.5 8.5"
            stroke="#2f7a3f" stroke-width="2" fill="none"
            stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M5 11.5 L7 13.3 L11.5 8.5"
            stroke="#5cb060" stroke-width="0.8" fill="none"
            stroke-linecap="round" stroke-linejoin="round"/>
    </symbol>

    <!-- Preliminary hazard: yellow warning triangle -->
    <symbol id="oc-icon-tri-yellow" viewBox="0 0 16 16">
      <path d="M8 1.5 L15 14 L1 14 Z"
            fill="#f4c024" stroke="#3a2b00" stroke-width="0.8" stroke-linejoin="round"/>
      <path d="M8 2.5 L13.5 12.5" stroke="#fde58a" stroke-width="0.7" opacity="0.7"/>
      <path d="M7.4 5.8 L8.6 5.8 L8.4 10.5 L7.6 10.5 Z" fill="#1a1a1a"/>
      <circle cx="8" cy="12" r="0.8" fill="#1a1a1a"/>
    </symbol>

    <!-- Consolidated hazard: red warning triangle -->
    <symbol id="oc-icon-tri-red" viewBox="0 0 16 16">
      <path d="M8 1.5 L15 14 L1 14 Z"
            fill="#dc3a3a" stroke="#3a0a0a" stroke-width="0.8" stroke-linejoin="round"/>
      <path d="M8 2.5 L13.5 12.5" stroke="#f48a8a" stroke-width="0.7" opacity="0.6"/>
      <path d="M7.4 5.8 L8.6 5.8 L8.4 10.5 L7.6 10.5 Z" fill="#ffffff"/>
      <circle cx="8" cy="12" r="0.8" fill="#ffffff"/>
    </symbol>

    <!-- Risk-reducing measure: blue shield with white check -->
    <symbol id="oc-icon-shield" viewBox="0 0 16 16">
      <path d="M8 1 L14 3 V8 Q14 12 8 15 Q2 12 2 8 V3 Z"
            fill="#3b6dad" stroke="#1c3d6a" stroke-width="0.7" stroke-linejoin="round"/>
      <path d="M8 1 L2 3 V8 Q2 12 8 15 Z" fill="#1c3d6a" opacity="0.35"/>
      <path d="M8 1 L14 3 V8 Q14 11 11 13.5"
            fill="none" stroke="#7aa2d3" stroke-width="0.6" opacity="0.7"/>
      <path d="M5 8 L7.2 10.2 L11 6.4"
            stroke="#ffffff" stroke-width="2" fill="none"
            stroke-linecap="round" stroke-linejoin="round"/>
    </symbol>

    <!-- Safety function: multi-color network of nodes around a hub -->
    <symbol id="oc-icon-network" viewBox="0 0 16 16">
      <line x1="3.5" y1="3.5" x2="8" y2="8" stroke="#3a3a3a" stroke-width="1"/>
      <line x1="12.5" y1="3.5" x2="8" y2="8" stroke="#3a3a3a" stroke-width="1"/>
      <line x1="3.5" y1="12.5" x2="8" y2="8" stroke="#3a3a3a" stroke-width="1"/>
      <line x1="12.5" y1="12.5" x2="8" y2="8" stroke="#3a3a3a" stroke-width="1"/>
      <circle cx="8" cy="8" r="2.4" fill="#9aa3ad" stroke="#3a3a3a" stroke-width="0.6"/>
      <circle cx="8" cy="7.5" r="0.8" fill="#dde0e3"/>
      <circle cx="3.5" cy="3.5" r="2.2" fill="#3b6dad" stroke="#1c3d6a" stroke-width="0.6"/>
      <circle cx="3.2" cy="3.1" r="0.7" fill="#7aa2d3"/>
      <circle cx="12.5" cy="3.5" r="2.2" fill="#dc3a3a" stroke="#5a0a0a" stroke-width="0.6"/>
      <circle cx="12.2" cy="3.1" r="0.7" fill="#f48a8a"/>
      <circle cx="3.5" cy="12.5" r="2.2" fill="#2f7a3f" stroke="#143a18" stroke-width="0.6"/>
      <circle cx="3.2" cy="12.1" r="0.7" fill="#7ec282"/>
      <circle cx="12.5" cy="12.5" r="2.2" fill="#f4c024" stroke="#5e3f0e" stroke-width="0.6"/>
      <circle cx="12.2" cy="12.1" r="0.7" fill="#fde58a"/>
    </symbol>

    <!-- Verification activity: green clipboard with white page and check -->
    <symbol id="oc-icon-clipboard" viewBox="0 0 16 16">
      <rect x="2.5" y="3" width="11" height="12" fill="#2f7a3f" stroke="#0e3a18" stroke-width="0.6"/>
      <rect x="3.6" y="4.6" width="8.8" height="9.4" fill="#f5f8f5" stroke="#0e3a18" stroke-width="0.4"/>
      <rect x="5.5" y="1.5" width="5" height="2.8" fill="#9aa3ad" stroke="#3a3a3a" stroke-width="0.5"/>
      <rect x="6.4" y="2.2" width="3.2" height="1.4" fill="#5a6573"/>
      <path d="M5.2 9.2 L7 11 L11 6.8"
            stroke="#2f7a3f" stroke-width="1.8" fill="none"
            stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M5.2 9.2 L7 11 L11 6.8"
            stroke="#5cb060" stroke-width="0.7" fill="none"
            stroke-linecap="round" stroke-linejoin="round"/>
    </symbol>

  </defs>
</svg>`;

let injected = false;

function ensureSprite() {
  if (injected) return;
  injected = true;
  const tmpl = document.createElement('div');
  tmpl.innerHTML = SPRITE_HTML.trim();
  const sprite = tmpl.firstElementChild;
  if (sprite) document.body.prepend(sprite);
}

/**
 * Build a small <svg> referencing a sprite symbol by id.
 * @param {string} symbolId
 * @param {{ size?: number, title?: string, className?: string }} [opts]
 * @returns {SVGSVGElement}
 */
function svgRef(symbolId, opts = {}) {
  ensureSprite();
  const size = opts.size ?? 16;
  const svg = /** @type {SVGSVGElement} */ (document.createElementNS(SVG_NS, 'svg'));
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  if (opts.className) svg.setAttribute('class', opts.className);
  if (opts.title) {
    const t = document.createElementNS(SVG_NS, 'title');
    t.textContent = opts.title;
    svg.append(t);
    svg.removeAttribute('aria-hidden');
    svg.setAttribute('role', 'img');
  }
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', '#' + symbolId);
  use.setAttributeNS(XLINK_NS, 'xlink:href', '#' + symbolId);
  svg.append(use);
  return svg;
}

/**
 * Icon for an artifact type. Falls back to the generic doc icon for unknown
 * keys so callers never get null.
 * @param {string} typeKey
 * @param {{ size?: number, title?: string, className?: string }} [opts]
 * @returns {SVGSVGElement}
 */
export function typeIcon(typeKey, opts) {
  const id = TYPE_ICON_ID[/** @type {import('./types.js').ArtifactKey} */ (typeKey)]
    ?? 'oc-icon-doc';
  return svgRef(id, opts);
}

/**
 * Folder icon for a tree group header. Open or closed variant.
 * @param {{ open?: boolean, size?: number, title?: string, className?: string }} [opts]
 * @returns {SVGSVGElement}
 */
export function groupIcon(opts = {}) {
  const id = opts.open ? 'oc-icon-folder-open' : 'oc-icon-folder';
  return svgRef(id, opts);
}

/**
 * Icon for the top-level project row. Distinct shape from the
 * artifact icons so you can tell project rows apart at a glance.
 * @param {{ size?: number, title?: string, className?: string }} [opts]
 * @returns {SVGSVGElement}
 */
export function projectIcon(opts) {
  return svgRef('oc-icon-project', opts);
}
