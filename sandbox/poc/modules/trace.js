/**
 * Bottom-pane traceability — viewer AND relationship manager.
 *
 * Two views toggled from the pane header:
 *   - Graph: three columns of HTML cards (incoming · selected · outgoing)
 *     with an SVG arrow layer beneath. Read-only overview.
 *   - List: section-organised relationship browser with full management.
 *     Outgoing and incoming sections each carry per-link `×` (remove) and
 *     a per-section `+ Add link` (open picker). All ref / ref-array /
 *     polymorphic-ref-array editing happens here — the editor pane keeps
 *     only intrinsic attributes.
 *
 * Link discovery is driven by the field declarations in types.js:
 *   - Outgoing: ref / ref-array / polymorphic-ref-array fields on the
 *     selected artifact.
 *   - Incoming: walk every artifact in the same project and check whose
 *     fields point at the selected one.
 *
 * Mutations are applied through `state.updateArtifact` on whichever
 * artifact owns the field being changed (the source side of a ref).
 * Refs only span within a project.
 */

import * as state from './state.js';
import {
  ArtifactTypes,
  ArtifactTypeKeys,
  labelOf,
  humanizeFieldName,
} from './types.js';
import { el } from './util.js';
import { openModal, modalButton } from './modals.js';
import { typeIcon } from './icons.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const CARD_W = 220;
const CARD_H = 60;
const COL_GAP = 80;
const ROW_GAP = 14;
const PAD = 16;

/** @type {HTMLElement | null} */
let mountEl = null;
/** @type {HTMLElement | null} */
let actionsEl = null;
let unsubscribe = null;
/** @type {'graph' | 'list'} */
let viewMode = 'graph';

/** Flat-list sort state. Reset to defaults whenever the selection changes
 *  is left to the user — the sort is sticky across re-renders. */
/** @type {'dir' | 'type' | 'id' | 'label' | 'field'} */
let listSortColumn = 'dir';
/** @type {'asc' | 'desc'} */
let listSortDir = 'asc';

/**
 * Mount the trace view into a container.
 * @param {HTMLElement} rootEl
 * @param {{ actionsEl?: HTMLElement | null }} [opts]
 */
export function mountTrace(rootEl, opts = {}) {
  mountEl = rootEl;
  actionsEl = opts.actionsEl ?? null;
  if (unsubscribe) unsubscribe();
  unsubscribe = state.subscribe(handleChange);
  renderViewToggle();
  render();
}

function renderViewToggle() {
  if (!actionsEl) return;
  actionsEl.replaceChildren();
  for (const mode of /** @type {const} */ (['graph', 'list'])) {
    const btn = el(
      'button',
      {
        class: 'trace-view-toggle' + (viewMode === mode ? ' is-active' : ''),
        type: 'button',
        title: mode === 'graph' ? 'Graph view' : 'List view',
        'aria-pressed': String(viewMode === mode),
        onclick: () => {
          if (viewMode === mode) return;
          viewMode = mode;
          renderViewToggle();
          render();
        },
      },
      [mode === 'graph' ? '◇ Graph' : '☰ List']
    );
    actionsEl.append(btn);
  }
}

/** @param {import('./state.js').Change} change */
function handleChange(change) {
  if (change.kind === 'meta' || change.kind === 'risk-matrix') return;
  render();
}

/** @typedef {{ otherType: import('./types.js').ArtifactKey, otherId: string, fieldName: string }} Link */

function render() {
  if (!mountEl) return;
  const selection = state.getSelection();
  mountEl.replaceChildren();

  if (!selection) {
    mountEl.append(el('p', { class: 'empty-state' }, ['Select an artifact to see its links.']));
    return;
  }
  const entry = state.getById(selection.projectId, selection.artifactId);
  if (!entry) {
    mountEl.append(el('p', { class: 'empty-state' }, ['Select an artifact to see its links.']));
    return;
  }

  const { incoming, outgoing } = computeLinks(selection.projectId, selection.artifactId, entry.type);

  if (viewMode === 'list') {
    mountEl.append(renderListView(selection.projectId, entry, incoming, outgoing));
    return;
  }

  const rows = Math.max(incoming.length, outgoing.length, 1);
  const totalW = PAD * 2 + CARD_W * 3 + COL_GAP * 2;
  const totalH = PAD * 2 + rows * CARD_H + Math.max(rows - 1, 0) * ROW_GAP;

  const graph = el('div', {
    class: 'trace-graph',
    style: `width:${totalW}px;height:${totalH}px;`,
  });

  // Selected card sits centered vertically; side columns spread evenly.
  const centerX = PAD + CARD_W + COL_GAP;
  const centerY = (totalH - CARD_H) / 2;

  // Compute side-column card positions first; we need them for arrow geometry.
  /** @type {{ link: Link, x: number, y: number }[]} */
  const inPositions = incoming.map((link, i) => ({
    link,
    x: PAD,
    y: rowPositions(incoming.length, totalH)[i],
  }));
  /** @type {{ link: Link, x: number, y: number }[]} */
  const outPositions = outgoing.map((link, i) => ({
    link,
    x: PAD + (CARD_W + COL_GAP) * 2,
    y: rowPositions(outgoing.length, totalH)[i],
  }));

  // SVG layer with arrows.
  const svg = svgEl('svg', {
    class: 'trace-arrows',
    width: String(totalW),
    height: String(totalH),
    viewBox: `0 0 ${totalW} ${totalH}`,
  });
  svg.append(buildArrowMarker());

  for (const p of inPositions) {
    svg.append(
      buildArrow(
        p.x + CARD_W,
        p.y + CARD_H / 2,
        centerX,
        centerY + CARD_H / 2,
        humanizeFieldName(p.link.fieldName)
      )
    );
  }
  for (const p of outPositions) {
    svg.append(
      buildArrow(
        centerX + CARD_W,
        centerY + CARD_H / 2,
        p.x,
        p.y + CARD_H / 2,
        humanizeFieldName(p.link.fieldName)
      )
    );
  }

  graph.append(svg);

  // Selected card.
  graph.append(buildCard(selection.projectId, entry.type, entry.ref, centerX, centerY, true));

  // Side cards (rendered after SVG so they sit on top of arrows).
  for (const p of inPositions) {
    const e = state.getById(selection.projectId, p.link.otherId);
    if (!e) continue;
    graph.append(buildCard(selection.projectId, p.link.otherType, e.ref, p.x, p.y, false));
  }
  for (const p of outPositions) {
    const e = state.getById(selection.projectId, p.link.otherId);
    if (!e) continue;
    graph.append(buildCard(selection.projectId, p.link.otherType, e.ref, p.x, p.y, false));
  }

  mountEl.append(graph);

  if (incoming.length === 0 && outgoing.length === 0) {
    mountEl.append(
      el('p', { class: 'trace-no-links' }, ['No relationships yet for this artifact.'])
    );
  }
}

/**
 * Vertical row positions for `n` cards spread across `totalH` pixels.
 * Returns an array of top-y values per card (centered as a group).
 */
function rowPositions(n, totalH) {
  if (n === 0) return [];
  const stripe = (totalH - PAD * 2) / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(PAD + i * stripe + (stripe - CARD_H) / 2);
  }
  return out;
}

/**
 * Discover incoming and outgoing links for the selected artifact within
 * its project. References only target the same project.
 * @param {string} projectId
 * @param {string} selectedId
 * @param {import('./types.js').ArtifactKey} selectedType
 */
function computeLinks(projectId, selectedId, selectedType) {
  /** @type {Link[]} */
  const outgoing = [];
  /** @type {Link[]} */
  const incoming = [];

  const sel = state.getById(projectId, selectedId);
  if (!sel) return { outgoing, incoming };
  const selFields = ArtifactTypes[selectedType].fields;

  for (const [name, field] of Object.entries(selFields)) {
    const v = sel.ref[name];
    if (field.kind === 'ref' && typeof v === 'string' && v) {
      outgoing.push({ otherType: field.target, otherId: v, fieldName: name });
    } else if (field.kind === 'ref-array' && Array.isArray(v)) {
      for (const id of v) {
        if (typeof id === 'string' && id) {
          outgoing.push({ otherType: field.target, otherId: id, fieldName: name });
        }
      }
    } else if (field.kind === 'polymorphic-ref-array' && Array.isArray(v)) {
      for (const r of v) {
        if (r && typeof r === 'object' && typeof r.type === 'string' && typeof r.id === 'string') {
          outgoing.push({ otherType: r.type, otherId: r.id, fieldName: name });
        }
      }
    }
  }

  for (const otherType of ArtifactTypeKeys) {
    const def = ArtifactTypes[otherType];
    for (const other of state.getByType(projectId, otherType)) {
      if (other.id === selectedId) continue;
      for (const [name, field] of Object.entries(def.fields)) {
        if (field.kind === 'ref' && field.target === selectedType && other[name] === selectedId) {
          incoming.push({ otherType, otherId: other.id, fieldName: name });
        } else if (
          field.kind === 'ref-array' &&
          field.target === selectedType &&
          Array.isArray(other[name]) &&
          other[name].includes(selectedId)
        ) {
          incoming.push({ otherType, otherId: other.id, fieldName: name });
        } else if (
          field.kind === 'polymorphic-ref-array' &&
          Array.isArray(field.targets) &&
          field.targets.includes(selectedType) &&
          Array.isArray(other[name]) &&
          other[name].some((/** @type {any} */ r) => r && r.id === selectedId)
        ) {
          incoming.push({ otherType, otherId: other.id, fieldName: name });
        }
      }
    }
  }

  return { incoming, outgoing };
}

/**
 * Build a card div for an artifact at a fixed position.
 * @param {string} projectId
 * @param {import('./types.js').ArtifactKey} typeKey
 * @param {Object<string, any>} artifact
 * @param {number} x
 * @param {number} y
 * @param {boolean} isSelected
 * @returns {HTMLElement}
 */
function buildCard(projectId, typeKey, artifact, x, y, isSelected) {
  const type = ArtifactTypes[typeKey];
  const cls = ['trace-card'];
  if (isSelected) cls.push('is-selected');
  return el(
    'div',
    {
      class: cls.join(' '),
      style: `left:${x}px;top:${y}px;width:${CARD_W}px;height:${CARD_H}px;`,
      role: isSelected ? 'group' : 'button',
      tabindex: isSelected ? '-1' : '0',
      onclick: isSelected ? null : () => state.select({ projectId, artifactId: artifact.id }),
      onkeydown: isSelected
        ? null
        : (/** @type {KeyboardEvent} */ e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              state.select({ projectId, artifactId: artifact.id });
            }
          },
    },
    [
      el('div', { class: 'trace-card-type' }, [type.displayName]),
      el('div', { class: 'trace-card-label', title: labelOf(typeKey, artifact) }, [
        labelOf(typeKey, artifact),
      ]),
      el('div', { class: 'trace-card-id' }, [artifact.id]),
    ]
  );
}

/**
 * Build the SVG arrow + label between two anchor points.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {string} labelText
 */
function buildArrow(x1, y1, x2, y2, labelText) {
  const g = svgEl('g', { class: 'trace-arrow' });
  g.append(
    svgEl('line', {
      x1: String(x1),
      y1: String(y1),
      x2: String(x2),
      y2: String(y2),
      'marker-end': 'url(#trace-arrowhead)',
    })
  );
  // Label at the midpoint, slightly above the line.
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - 6;
  const text = svgEl(
    'text',
    {
      x: String(mx),
      y: String(my),
      'text-anchor': 'middle',
      class: 'trace-arrow-label',
    },
    [labelText]
  );
  g.append(text);
  return g;
}

function buildArrowMarker() {
  const defs = svgEl('defs');
  const marker = svgEl('marker', {
    id: 'trace-arrowhead',
    viewBox: '0 0 10 10',
    refX: '8',
    refY: '5',
    markerWidth: '7',
    markerHeight: '7',
    orient: 'auto-start-reverse',
  });
  marker.append(svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'trace-arrowhead-path' }));
  defs.append(marker);
  return defs;
}

/**
 * Tiny SVG element builder mirroring `el()` for the HTML namespace.
 * @param {string} tag
 * @param {Record<string, string | null | undefined>} [attrs]
 * @param {Array<Node | string>} [children]
 */
function svgEl(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    node.setAttribute(k, String(v));
  }
  for (const c of children) {
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

// --- List view (section-organised, with full link management) -------

/**
 * A section is one (direction, fieldName) tuple. For incoming sections
 * the field belongs to a *different* type (`sourceType`); for outgoing
 * sections it belongs to the selected artifact's own type.
 *
 * @typedef {Object} Section
 * @property {'out' | 'in'} direction
 * @property {'ref' | 'ref-array' | 'polymorphic-ref-array'} kind
 * @property {string} fieldName                     name on the source side
 * @property {import('./types.js').ArtifactKey[]} [targets]    out: target types
 * @property {import('./types.js').ArtifactKey} [sourceType]   in: type that owns the field
 * @property {{ otherType: import('./types.js').ArtifactKey, otherId: string }[]} currentLinks
 */

/**
 * @param {string} projectId
 * @param {{ type: import('./types.js').ArtifactKey, ref: Object<string, any> }} entry
 * @param {Link[]} _incoming   unused — list view recomputes per-section
 * @param {Link[]} _outgoing
 */
function renderListView(projectId, entry, _incoming, _outgoing) {
  const wrap = el('div', { class: 'trace-list' });
  const selectedId = entry.ref.id;
  const selectedType = entry.type;
  const selectedTypeDef = ArtifactTypes[selectedType];

  const sections = buildLinkSections(projectId, selectedId, selectedType);
  const inCount = sections
    .filter((s) => s.direction === 'in')
    .reduce((sum, s) => sum + s.currentLinks.length, 0);
  const outCount = sections
    .filter((s) => s.direction === 'out')
    .reduce((sum, s) => sum + s.currentLinks.length, 0);

  wrap.append(
    el('div', { class: 'trace-list-heading' }, [
      el('span', { class: 'trace-list-icon' }, [
        typeIcon(selectedType, { title: selectedTypeDef.displayName }),
      ]),
      el('span', { class: 'trace-list-heading-type' }, [selectedTypeDef.displayName]),
      el('span', { class: 'trace-list-heading-id' }, [selectedId]),
      el('span', { class: 'trace-list-heading-label' }, [labelOf(selectedType, entry.ref)]),
      el('span', { class: 'trace-list-heading-count' }, [
        `${inCount} in · ${outCount} out`,
      ]),
    ])
  );

  if (sections.length === 0) {
    wrap.append(
      el('p', { class: 'trace-no-links' }, [
        'This artifact type has no defined relationships in the meta model.',
      ])
    );
    return wrap;
  }

  // Toolbar — single Add link entry point. The picker that opens lists every
  // available relationship slot; clicking one runs the existing per-section
  // candidate picker.
  wrap.append(
    el('div', { class: 'trace-list-toolbar' }, [
      el(
        'button',
        {
          class: 'trace-link-add',
          type: 'button',
          onclick: () => openSectionPicker(projectId, selectedId, selectedType, sections),
        },
        ['+ Add link']
      ),
    ])
  );

  // Flatten every link across every section into one row list.
  /** @type {{ section: Section, link: { otherType: import('./types.js').ArtifactKey, otherId: string } }[]} */
  const rows = [];
  for (const s of sections) {
    for (const link of s.currentLinks) rows.push({ section: s, link });
  }

  if (rows.length === 0) {
    wrap.append(el('p', { class: 'trace-no-links' }, ['No links yet.']));
    return wrap;
  }

  rows.sort((a, b) => compareRows(projectId, a, b));

  const table = el('table', { class: 'trace-list-table' }, [
    el('thead', {}, [
      el('tr', {}, [
        sortHeader('dir', '', { className: 'col-dir' }),
        sortHeader('type', 'Type', { className: 'col-type' }),
        sortHeader('id', 'ID', { className: 'col-id' }),
        sortHeader('label', 'Label', { className: 'col-label' }),
        sortHeader('field', 'Relationship', { className: 'col-rel' }),
        el('th', { class: 'col-action' }, []),
      ]),
    ]),
    el(
      'tbody',
      {},
      rows.map((r) => renderLinkRow(projectId, selectedId, selectedType, r.section, r.link))
    ),
  ]);

  wrap.append(table);
  return wrap;
}

/**
 * Build a sortable column header. Click toggles asc → desc → asc; clicking a
 * different column resets to asc.
 * @param {'dir' | 'type' | 'id' | 'label' | 'field'} column
 * @param {string} label
 * @param {{ className?: string }} [opts]
 */
function sortHeader(column, label, opts = {}) {
  const isActive = listSortColumn === column;
  const arrow = isActive ? (listSortDir === 'asc' ? ' ▲' : ' ▼') : '';
  return el(
    'th',
    {
      class:
        (opts.className ?? '') +
        ' trace-list-th' +
        (isActive ? ' is-sorted' : ''),
      onclick: () => {
        if (listSortColumn === column) {
          listSortDir = listSortDir === 'asc' ? 'desc' : 'asc';
        } else {
          listSortColumn = column;
          listSortDir = 'asc';
        }
        render();
      },
    },
    [label + arrow]
  );
}

/**
 * @param {string} projectId
 * @param {{ section: Section, link: { otherType: import('./types.js').ArtifactKey, otherId: string } }} a
 * @param {{ section: Section, link: { otherType: import('./types.js').ArtifactKey, otherId: string } }} b
 */
function compareRows(projectId, a, b) {
  let cmp = 0;
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  switch (listSortColumn) {
    case 'dir':
      cmp =
        (a.section.direction === 'out' ? 0 : 1) -
        (b.section.direction === 'out' ? 0 : 1);
      break;
    case 'type':
      cmp = collator.compare(
        ArtifactTypes[a.link.otherType]?.displayName ?? '',
        ArtifactTypes[b.link.otherType]?.displayName ?? ''
      );
      break;
    case 'id':
      cmp = collator.compare(a.link.otherId, b.link.otherId);
      break;
    case 'label':
      cmp = collator.compare(labelForLink(projectId, a.link), labelForLink(projectId, b.link));
      break;
    case 'field':
      cmp = collator.compare(
        humanizeFieldName(a.section.fieldName),
        humanizeFieldName(b.section.fieldName)
      );
      break;
  }
  if (cmp === 0) cmp = collator.compare(a.link.otherId, b.link.otherId);
  return listSortDir === 'asc' ? cmp : -cmp;
}

/** @param {string} projectId @param {{ otherType: import('./types.js').ArtifactKey, otherId: string }} link */
function labelForLink(projectId, link) {
  const e = state.getById(projectId, link.otherId);
  return e ? labelOf(link.otherType, e.ref) : '';
}

/**
 * Modal: pick which relationship slot to add a link into. The selected
 * section is then handed to the existing candidate picker.
 * @param {string} projectId
 * @param {string} selectedId
 * @param {import('./types.js').ArtifactKey} selectedType
 * @param {Section[]} sections
 */
function openSectionPicker(projectId, selectedId, selectedType, sections) {
  const modal = openModal({ title: 'Add link · choose relationship', size: 'medium' });

  const list = el('div', { class: 'trace-section-picker' });
  const ordered = [
    ...sections.filter((s) => s.direction === 'out'),
    ...sections.filter((s) => s.direction === 'in'),
  ];

  for (const section of ordered) {
    const fieldText = humanizeFieldName(section.fieldName);
    let hint;
    if (section.direction === 'out') {
      const targets = (section.targets ?? [])
        .map((t) => ArtifactTypes[t]?.displayName ?? t)
        .join(' / ');
      hint = `to ${targets}`;
    } else {
      hint = `from ${ArtifactTypes[section.sourceType]?.displayName ?? section.sourceType}`;
    }
    list.append(
      el(
        'button',
        {
          class: 'trace-section-picker-row',
          type: 'button',
          onclick: () => {
            modal.close();
            openAddPicker(projectId, selectedId, selectedType, section);
          },
        },
        [
          el('span', { class: 'trace-section-picker-arrow' }, [
            section.direction === 'out' ? '→' : '←',
          ]),
          el('span', { class: 'trace-section-picker-name' }, [fieldText]),
          el('span', { class: 'trace-section-picker-hint' }, [hint]),
          el('span', { class: 'trace-section-picker-count' }, [
            `${section.currentLinks.length} linked`,
          ]),
        ]
      )
    );
  }

  modal.bodyEl.append(list);
  modal.footerEl.append(
    el('span', { style: 'flex:1 1 auto' }),
    modalButton('Cancel', () => modal.close())
  );
}

/**
 * Walk the meta model + state to enumerate every relationship slot the
 * selected artifact participates in, with current links populated.
 * @param {string} projectId
 * @param {string} selectedId
 * @param {import('./types.js').ArtifactKey} selectedType
 * @returns {Section[]}
 */
function buildLinkSections(projectId, selectedId, selectedType) {
  /** @type {Section[]} */
  const sections = [];

  const ownTypeDef = ArtifactTypes[selectedType];
  const ownEntry = state.getById(projectId, selectedId);
  if (!ownEntry) return sections;

  // Outgoing: ref-style fields on the selected artifact's own type.
  for (const [fieldName, field] of Object.entries(ownTypeDef.fields)) {
    if (field.kind === 'ref') {
      const v = ownEntry.ref[fieldName];
      const links =
        typeof v === 'string' && v ? [{ otherType: field.target, otherId: v }] : [];
      sections.push({
        direction: 'out',
        kind: 'ref',
        fieldName,
        targets: [field.target],
        currentLinks: links,
      });
    } else if (field.kind === 'ref-array') {
      const v = Array.isArray(ownEntry.ref[fieldName]) ? ownEntry.ref[fieldName] : [];
      sections.push({
        direction: 'out',
        kind: 'ref-array',
        fieldName,
        targets: [field.target],
        currentLinks: v
          .filter((id) => typeof id === 'string')
          .map((id) => ({ otherType: field.target, otherId: id })),
      });
    } else if (field.kind === 'polymorphic-ref-array') {
      const v = Array.isArray(ownEntry.ref[fieldName]) ? ownEntry.ref[fieldName] : [];
      sections.push({
        direction: 'out',
        kind: 'polymorphic-ref-array',
        fieldName,
        targets: field.targets,
        currentLinks: v
          .filter((r) => r && r.id && r.type)
          .map((r) => ({ otherType: r.type, otherId: r.id })),
      });
    }
  }

  // Incoming: every type's ref-style fields that target the selected type.
  // (Self-type included so e.g. parentId on architectureElement surfaces
  // "children" for the selected element.)
  for (const otherKey of ArtifactTypeKeys) {
    const otherTypeDef = ArtifactTypes[otherKey];
    for (const [fieldName, field] of Object.entries(otherTypeDef.fields)) {
      const matches =
        (field.kind === 'ref' && field.target === selectedType) ||
        (field.kind === 'ref-array' && field.target === selectedType) ||
        (field.kind === 'polymorphic-ref-array' &&
          Array.isArray(field.targets) &&
          field.targets.includes(selectedType));
      if (!matches) continue;

      const all = state.getByType(projectId, otherKey).filter((a) => a.id !== selectedId);
      let sources;
      if (field.kind === 'ref') {
        sources = all.filter((a) => a[fieldName] === selectedId);
      } else if (field.kind === 'ref-array') {
        sources = all.filter(
          (a) => Array.isArray(a[fieldName]) && a[fieldName].includes(selectedId)
        );
      } else {
        sources = all.filter(
          (a) =>
            Array.isArray(a[fieldName]) &&
            a[fieldName].some(
              (r) => r && r.id === selectedId && r.type === selectedType
            )
        );
      }

      sections.push({
        direction: 'in',
        kind: field.kind,
        fieldName,
        sourceType: otherKey,
        currentLinks: sources.map((s) => ({ otherType: otherKey, otherId: s.id })),
      });
    }
  }

  return sections;
}

/**
 * Render one row of the flat sortable link table.
 *
 * @param {string} projectId
 * @param {string} selectedId
 * @param {import('./types.js').ArtifactKey} selectedType
 * @param {Section} section
 * @param {{ otherType: import('./types.js').ArtifactKey, otherId: string }} link
 */
function renderLinkRow(projectId, selectedId, selectedType, section, link) {
  const targetType = ArtifactTypes[link.otherType];
  const targetEntry = state.getById(projectId, link.otherId);
  const targetLabel = targetEntry ? labelOf(link.otherType, targetEntry.ref) : '(missing)';
  const arrow = section.direction === 'out' ? '→' : '←';
  const fieldText = humanizeFieldName(section.fieldName);

  return el(
    'tr',
    { class: 'trace-link-row' + (targetEntry ? '' : ' is-missing') },
    [
      el('td', { class: 'col-dir' }, [arrow]),
      el('td', { class: 'col-type' }, [
        el('span', { class: 'trace-link-type-cell' }, [
          typeIcon(link.otherType, { title: targetType?.displayName }),
          el('span', {}, [' ' + (targetType?.displayName ?? link.otherType)]),
        ]),
      ]),
      el('td', { class: 'col-id trace-mono' }, [link.otherId]),
      el('td', { class: 'col-label' }, [
        el(
          'button',
          {
            class: 'trace-link-label',
            type: 'button',
            title: targetLabel,
            disabled: targetEntry ? null : 'disabled',
            onclick: (/** @type {MouseEvent} */ e) => {
              e.stopPropagation();
              if (targetEntry) state.select({ projectId, artifactId: link.otherId });
            },
          },
          [targetLabel]
        ),
      ]),
      el('td', { class: 'col-rel' }, [fieldText]),
      el('td', { class: 'col-action' }, [
        el(
          'button',
          {
            class: 'trace-link-remove',
            type: 'button',
            title: 'Remove link',
            'aria-label': 'Remove link',
            onclick: (/** @type {MouseEvent} */ e) => {
              e.stopPropagation();
              applyRemove(projectId, selectedId, selectedType, section, link);
            },
          },
          ['×']
        ),
      ]),
    ]
  );
}

// --- Mutations ----------------------------------------------------------

/**
 * @param {string} projectId
 * @param {string} selectedId
 * @param {import('./types.js').ArtifactKey} selectedType
 * @param {Section} section
 * @param {{ otherType: import('./types.js').ArtifactKey, otherId: string }} link
 */
function applyRemove(projectId, selectedId, selectedType, section, link) {
  if (section.direction === 'out') {
    if (section.kind === 'ref') {
      state.updateArtifact(projectId, selectedId, { [section.fieldName]: null });
    } else if (section.kind === 'ref-array') {
      const cur = state.getById(projectId, selectedId)?.ref[section.fieldName] ?? [];
      state.updateArtifact(projectId, selectedId, {
        [section.fieldName]: cur.filter((id) => id !== link.otherId),
      });
    } else {
      const cur = state.getById(projectId, selectedId)?.ref[section.fieldName] ?? [];
      state.updateArtifact(projectId, selectedId, {
        [section.fieldName]: cur.filter(
          (r) => !(r && r.id === link.otherId && r.type === link.otherType)
        ),
      });
    }
  } else {
    // Incoming: link.otherId is the source artifact whose field we modify.
    const sourceArt = state.getById(projectId, link.otherId);
    if (!sourceArt) return;
    if (section.kind === 'ref') {
      state.updateArtifact(projectId, link.otherId, { [section.fieldName]: null });
    } else if (section.kind === 'ref-array') {
      const cur = sourceArt.ref[section.fieldName] ?? [];
      state.updateArtifact(projectId, link.otherId, {
        [section.fieldName]: cur.filter((id) => id !== selectedId),
      });
    } else {
      const cur = sourceArt.ref[section.fieldName] ?? [];
      state.updateArtifact(projectId, link.otherId, {
        [section.fieldName]: cur.filter(
          (r) => !(r && r.id === selectedId && r.type === selectedType)
        ),
      });
    }
  }
}

/**
 * Apply a list of picked candidates to the relationship.
 * @param {string} projectId
 * @param {string} selectedId
 * @param {import('./types.js').ArtifactKey} selectedType
 * @param {Section} section
 * @param {{ type: import('./types.js').ArtifactKey, id: string }[]} picked
 */
function applyAdd(projectId, selectedId, selectedType, section, picked) {
  if (picked.length === 0) return;

  if (section.direction === 'out') {
    if (section.kind === 'ref') {
      // single-mode picker yields one item; replaces existing value.
      state.updateArtifact(projectId, selectedId, { [section.fieldName]: picked[0].id });
    } else if (section.kind === 'ref-array') {
      const cur = state.getById(projectId, selectedId)?.ref[section.fieldName] ?? [];
      state.updateArtifact(projectId, selectedId, {
        [section.fieldName]: [...cur, ...picked.map((p) => p.id)],
      });
    } else {
      const cur = state.getById(projectId, selectedId)?.ref[section.fieldName] ?? [];
      state.updateArtifact(projectId, selectedId, {
        [section.fieldName]: [
          ...cur,
          ...picked.map((p) => ({ type: p.type, id: p.id })),
        ],
      });
    }
  } else {
    // Incoming: each picked candidate is a source artifact whose field we
    // mutate to point at the selected one.
    for (const p of picked) {
      const sourceArt = state.getById(projectId, p.id);
      if (!sourceArt) continue;
      if (section.kind === 'ref') {
        state.updateArtifact(projectId, p.id, { [section.fieldName]: selectedId });
      } else if (section.kind === 'ref-array') {
        const cur = sourceArt.ref[section.fieldName] ?? [];
        if (!cur.includes(selectedId)) {
          state.updateArtifact(projectId, p.id, {
            [section.fieldName]: [...cur, selectedId],
          });
        }
      } else {
        const cur = sourceArt.ref[section.fieldName] ?? [];
        const exists = cur.some((r) => r && r.id === selectedId && r.type === selectedType);
        if (!exists) {
          state.updateArtifact(projectId, p.id, {
            [section.fieldName]: [...cur, { type: selectedType, id: selectedId }],
          });
        }
      }
    }
  }
}

// --- Picker -------------------------------------------------------------

/**
 * @param {string} projectId
 * @param {string} selectedId
 * @param {import('./types.js').ArtifactKey} selectedType
 * @param {Section} section
 */
function openAddPicker(projectId, selectedId, selectedType, section) {
  const candidates = collectCandidates(projectId, selectedId, section);

  let title;
  if (section.direction === 'out') {
    title = `Add link · ${humanizeFieldName(section.fieldName).toLowerCase()}`;
  } else {
    title = `Add ${ArtifactTypes[section.sourceType]?.displayName.toLowerCase() ?? 'link'} via ${humanizeFieldName(section.fieldName).toLowerCase()}`;
  }

  const mode = section.direction === 'out' && section.kind === 'ref' ? 'single' : 'multi';

  openLinkPicker({
    title,
    candidates,
    mode,
    onConfirm: (picked) =>
      applyAdd(projectId, selectedId, selectedType, section, picked),
  });
}

/**
 * Build the candidate set for an Add picker.
 * @param {string} projectId
 * @param {string} selectedId
 * @param {Section} section
 * @returns {{ type: import('./types.js').ArtifactKey, id: string, label: string }[]}
 */
function collectCandidates(projectId, selectedId, section) {
  /** @type {{ type: import('./types.js').ArtifactKey, id: string, label: string }[]} */
  const out = [];

  if (section.direction === 'out') {
    const existing = new Set(
      section.currentLinks.map((l) => `${l.otherType}:${l.otherId}`)
    );
    for (const targetType of section.targets ?? []) {
      const items = state.getByType(projectId, targetType).filter((a) => a.id !== selectedId);
      for (const item of items) {
        const key = `${targetType}:${item.id}`;
        if (existing.has(key)) continue;
        out.push({ type: targetType, id: item.id, label: labelOf(targetType, item) });
      }
    }
  } else {
    const sourceType = /** @type {import('./types.js').ArtifactKey} */ (section.sourceType);
    const linked = new Set(section.currentLinks.map((l) => l.otherId));
    const items = state.getByType(projectId, sourceType).filter((a) => a.id !== selectedId);
    for (const item of items) {
      if (linked.has(item.id)) continue;
      out.push({ type: sourceType, id: item.id, label: labelOf(sourceType, item) });
    }
  }
  return out;
}

/**
 * Generic relationship picker. Single or multi-select; candidates may be
 * grouped by type.
 *
 * @param {{
 *   title: string,
 *   candidates: { type: import('./types.js').ArtifactKey, id: string, label: string }[],
 *   mode: 'single' | 'multi',
 *   onConfirm: (picked: { type: import('./types.js').ArtifactKey, id: string }[]) => void,
 * }} opts
 */
function openLinkPicker({ title, candidates, mode, onConfirm }) {
  const modal = openModal({ title, size: 'medium' });

  /** @type {Set<string>} */
  const picked = new Set();

  if (candidates.length === 0) {
    modal.bodyEl.append(
      el('p', { class: 'modal-hint' }, [
        'No candidates available. Either there is nothing of the required type yet, or every candidate is already linked.',
      ])
    );
  } else {
    // Group by type.
    const byType = new Map();
    for (const c of candidates) {
      if (!byType.has(c.type)) byType.set(c.type, []);
      byType.get(c.type).push(c);
    }

    for (const [type, items] of byType) {
      modal.bodyEl.append(
        el('div', { class: 'poly-pick-group' }, [
          ArtifactTypes[type]?.displayNamePlural ?? type,
        ])
      );
      for (const c of items) {
        const key = `${c.type}:${c.id}`;
        const cb = el('input', {
          type: mode === 'single' ? 'radio' : 'checkbox',
          name: 'link-picker',
          value: key,
          onchange: (/** @type {Event} */ e) => {
            const t = /** @type {HTMLInputElement} */ (e.target);
            if (mode === 'single') {
              picked.clear();
              if (t.checked) picked.add(key);
            } else {
              if (t.checked) picked.add(key);
              else picked.delete(key);
            }
            updateConfirm();
          },
        });
        modal.bodyEl.append(
          el('label', { class: 'poly-pick-row' }, [
            cb,
            el('span', { class: 'poly-pick-label' }, [`${c.label} (${c.id})`]),
          ])
        );
      }
    }
  }

  const confirmBtn = modalButton(
    mode === 'single' ? 'Set link' : 'Add links',
    () => {
      const result = [...picked].map((k) => {
        const i = k.indexOf(':');
        return /** @type {{ type: any, id: string }} */ ({
          type: k.slice(0, i),
          id: k.slice(i + 1),
        });
      });
      modal.close();
      onConfirm(result);
    },
    { primary: true, disabled: true }
  );

  function updateConfirm() {
    if (picked.size === 0) confirmBtn.setAttribute('disabled', 'disabled');
    else confirmBtn.removeAttribute('disabled');
  }

  modal.footerEl.append(
    el('span', { style: 'flex:1 1 auto' }),
    modalButton('Cancel', () => modal.close()),
    confirmBtn
  );
}
