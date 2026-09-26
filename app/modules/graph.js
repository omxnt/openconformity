/**
 * The neighbourhood graph: the selected entity and its direct
 * relationships, never a whole-model graph. A pane presentation of the
 * selection, redrawn from the model on every render: incoming sources on
 * the left, outgoing targets on the right, the subject between them,
 * every edge a dogleg — horizontal out of its box, one slant across the
 * shared bend band, horizontal into the far one — labelled upright on
 * the neighbour-side run, compositions carrying the filled diamond at
 * the owner's end and every other form the plain arrowhead. Each side
 * stands grouped by relationship type, which binds the entity type at
 * the far end: the first of a group always draws, and where the group
 * holds more a line under it says how many and opens them beneath,
 * each with its own edge, the line then closing the block from its end
 * and a rule along the block's outer side saying what it spans. A group
 * opened stays open while its subject is selected and closes on the
 * next; nothing is remembered beyond that. While the store holds a picker for the subject, the picks ride
 * as dashed provisional edges in their type's group, held open —
 * clicking one, or its box, lets go — and the standing neighbourhood
 * recedes until Done.
 */

import { nodeOf, relationshipsOf } from './model.js';
import { ENTITY_TYPES, RELATIONSHIP_TYPES } from './metamodel.js';
import { pickedRows } from './relate.js';
import { entityLabel, entityMatches } from './queries.js';
import { TYPE_ICONS } from './icons.js';
import { el, svg, svgText } from './dom.js';

/**
 * The selected entity's neighbourhood: each direct relationship with the
 * entity at its far end, and nothing beyond them.
 * @param {import('./model.js').Model} model
 * @param {string|null} id
 * @returns {{ subject: import('./model.js').Entity,
 *             outgoing: Array<{ relationship: import('./model.js').Relationship, other: import('./model.js').Entity }>,
 *             incoming: Array<{ relationship: import('./model.js').Relationship, other: import('./model.js').Entity }> }
 *          | null}
 */
export function neighbourhood(model, id) {
  const subject = nodeOf(model, id);
  if (!subject || subject.kind !== 'entity') return null;
  const { outgoing, incoming } = relationshipsOf(model, id);
  return {
    subject,
    outgoing: outgoing.map((relationship) => ({
      relationship,
      other: /** @type {import('./model.js').Entity} */ (nodeOf(model, relationship.target)),
    })),
    incoming: incoming.map((relationship) => ({
      relationship,
      other: /** @type {import('./model.js').Entity} */ (nodeOf(model, relationship.source)),
    })),
  };
}

/**
 * The picks as provisional neighbours, per side: each with the label its
 * pair means and whether that pair still offers a choice. A pick whose
 * pair no longer admits anything stays off the canvas — the list's
 * stale strip carries it.
 * @param {import('./model.js').Model} model
 * @param {{ subject: string, picks: Array<Object> }} picker
 * @returns {{ outgoing: Array<Object>, incoming: Array<Object>, ambiguous: number }}
 */
export function pendingNeighbours(model, picker) {
  const sides = { outgoing: [], incoming: [], ambiguous: 0 };
  for (const row of pickedRows(model, picker)) {
    if (row.form === null) continue;
    const other = nodeOf(model, row.id);
    if (!other || other.kind !== 'entity') continue;
    if (row.ambiguous) sides.ambiguous += 1;
    sides[row.form.direction].push({
      pending: true,
      other,
      typeId: row.form.typeId,
      label: RELATIONSHIP_TYPES[row.form.typeId].label,
      ambiguous: row.ambiguous,
    });
  }
  return sides;
}

/**
 * The neighbourhood as a filter leaves it: the subject always, and on
 * each side the entries whose entity answers the filter or whose
 * relationship is labelled with it — a pending pick's label as it
 * carries it, a standing relationship's as its type names it.
 * @param {{ subject: Object, outgoing: Array<Object>, incoming: Array<Object> }} around
 * @param {string} filter  as typed
 */
export function filteredNeighbourhood(around, filter) {
  const query = (filter ?? '').trim().toLowerCase();
  if (query === '') return around;
  const keeps = (entry) => {
    const label = entry.label ?? RELATIONSHIP_TYPES[entry.relationship.type].label;
    return entityMatches(entry.other, query) || label.toLowerCase().includes(query);
  };
  return { ...around, outgoing: around.outgoing.filter(keeps), incoming: around.incoming.filter(keeps) };
}

/** How many attachments the subject grows for; past it they fan within the same height. */
export const MAX_PER_SIDE = 7;

/** The key a group is remembered by: the side it stands on and its relationship type. */
export const groupKey = (direction, typeId) => `${direction}:${typeId}`;

/**
 * A side's entries grouped by relationship type, which binds the entity
 * type at the far end: the groups in the metamodel's order, the members
 * by identifier, a provisional pick in its type's group like any other.
 * @param {Array<Object>} entries  a side of the neighbourhood, picks among them
 * @param {'incoming'|'outgoing'} direction
 * @returns {Array<{ key: string, typeId: string, label: string, type: string, members: Array<Object> }>}
 */
export function groupedSide(entries, direction) {
  const order = Object.keys(RELATIONSHIP_TYPES);
  const groups = new Map();
  for (const entry of entries) {
    const typeId = entry.pending ? entry.typeId : entry.relationship.type;
    if (!groups.has(typeId)) {
      const form = RELATIONSHIP_TYPES[typeId];
      groups.set(typeId, {
        key: groupKey(direction, typeId),
        typeId,
        label: form.label,
        type: direction === 'incoming' ? form.source : form.target,
        members: [],
      });
    }
    groups.get(typeId).members.push(entry);
  }
  return [...groups.values()]
    .sort((a, b) => order.indexOf(a.typeId) - order.indexOf(b.typeId))
    .map((group) => ({ ...group, members: [...group.members].sort((a, b) => a.other.id.localeCompare(b.other.id)) }));
}

/**
 * Whether each group stands open: closed unless the user opened it for
 * this subject, and open regardless while a filter narrows the side or
 * the group holds a pick, so nothing asked for hides.
 * @param {ReturnType<typeof groupedSide>} groups
 * @param {Set<string>} [opened]  the keys the user opened
 * @param {boolean} [filtered]
 */
export function openGroups(groups, opened = new Set(), filtered = false) {
  return groups.map((group) => ({
    ...group,
    open: filtered || group.members.some((entry) => entry.pending === true) || opened.has(group.key),
  }));
}

/**
 * A side's rows from top to bottom, each with where it starts and how
 * tall it is: a group's first member always, the rest while the group
 * is open, then, where the group holds more, the strip that opens or
 * closes it. Every box stands one ROW_GAP below the last, whatever
 * group it is in, and a strip lives inside the gap beneath its group's
 * last box, so the boxes keep an even step and their edges an even fan
 * however the groups fold. A box row carries where its edge attaches, a
 * strip row where its block began.
 * @param {ReturnType<typeof openGroups>} groups
 * @returns {{ rows: Array<{ kind: 'box'|'strip', group: Object, entry?: Object, y: number, height: number, mid?: number, top?: number }>, height: number }}
 */
export function sideRows(groups) {
  const rows = [];
  let y = 0;
  let height = 0;
  for (const group of groups) {
    const top = y;
    const shown = group.open ? group.members : group.members.slice(0, 1);
    for (const entry of shown) {
      rows.push({ kind: 'box', group, entry, y, height: NODE_HEIGHT, mid: y + NODE_HEIGHT / 2 });
      y += NODE_HEIGHT;
      height = y;
      y += ROW_GAP;
    }
    if (group.members.length > 1) {
      rows.push({ kind: 'strip', group, y: height, height: STRIP_HEIGHT, top });
      height += STRIP_HEIGHT;
    }
  }
  return { rows, height };
}

/** How far from the subject's top and bottom the outermost attachments keep. */
const ATTACH_PAD = 10;

/**
 * Where a row's edge attaches along the subject: the row's middle mapped
 * from its side's span onto the subject's, so a side fans the same way
 * whatever its rows' heights, and no two of its edges cross.
 * @param {number} mid  the row's middle, from the side's top
 * @param {number} span  the side's height
 * @param {number} height  the subject's
 * @returns {number}  y offset within the subject
 */
export function attachmentY(mid, span, height) {
  if (span <= 0) return height / 2;
  return ATTACH_PAD + ((height - 2 * ATTACH_PAD) * mid) / span;
}

/**
 * A dogleg route: horizontal out of the box, one slanted run across the
 * shared bend band, horizontal into the far box. Every edge of a side
 * shares the same band, so with lanes and ports both monotone two
 * diagonals can never cross — no channel discipline needed. A port
 * level with its lane is simply a straight line.
 * @param {number} x1 @param {number} y1  where the edge leaves
 * @param {number} bendA  where the slant begins
 * @param {number} bendB  where the slant ends
 * @param {number} x2 @param {number} y2  where it arrives
 * @returns {string}  polyline points
 */
export function doglegPoints(x1, y1, bendA, bendB, x2, y2) {
  if (y1 === y2) return `${x1},${y1} ${x2},${y2}`;
  return `${x1},${y1} ${bendA},${y1} ${bendB},${y2} ${x2},${y2}`;
}

/**
 * The subject box grows modestly with its busiest side, so the
 * attachment points keep room, and stops growing at MAX_PER_SIDE: past
 * that the attachments fan within it, the subject being one thing
 * whatever its neighbours count.
 * @param {number} busiest  the larger side's edge count
 * @returns {number}
 */
export function subjectHeight(busiest) {
  return Math.max(NODE_HEIGHT, Math.min(busiest, MAX_PER_SIDE) * 14 + 22);
}

/**
 * How far a side's boxes reach, from its top to the bottom of its last
 * box: the span the side is centred by and its edges are spread over,
 * the strips beneath the boxes hanging outside it.
 * @param {ReturnType<typeof sideRows>} side
 */
export function boxSpan(side) {
  const boxes = side.rows.filter((row) => row.kind === 'box');
  return boxes.length === 0 ? 0 : boxes.at(-1).y + boxes.at(-1).height;
}

/** What a group's strip says: how many more stand folded, or that fewer can be shown. */
export const stripText = (group) => (group.open ? 'Show fewer' : `Show ${group.members.length - 1} more`);

/**
 * The title line a box carries, cut to what three lines of box hold.
 * @param {import('./model.js').Entity} entity
 * @returns {string}
 */
export function caption(entity) {
  const text = entityLabel(entity) || entity.id;
  return text.length > 27 ? `${text.slice(0, 26)}…` : text;
}

// The box holds three lines of Carbon type at a 16px gutter; the gap
// between boxes holds a group's strip, one compact line.
const NODE_WIDTH = 224;
const NODE_HEIGHT = 64;
const ROW_GAP = 24;
// A group's strip fills the gap under its last shown box; the rule
// along an open block's outer side keeps clear of the boxes.
const STRIP_HEIGHT = ROW_GAP;
const RULE_GAP = 6;
// The gap is the static worst case: the longest relationship label sits
// over the guaranteed horizontal with the channel zone reserved.
const COLUMN_GAP = 176;
const MARGIN = 16;
// The dogleg's stubs: a long horizontal at the neighbour, room for the
// longest label, and a short one at the subject.
const NEIGHBOUR_STUB = 112;
const SUBJECT_STUB = 16;

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {(id: string) => void} context.onSelect
 * @param {(relationship: import('./model.js').Relationship) => void} context.onUnrelate
 */
export function createGraphView({ store, onSelect, onUnrelate }) {
  const element = el('div', { className: 'graph-host' });

  /** The filter the last render drew under, so a group toggling redraws under it. */
  let lastFilter = '';
  /** The groups the user opened, for the subject they were opened on; a new subject starts closed. */
  let opened = new Set();
  let openedFor = null;
  /** The strip to give focus back to after a toggle redraws it. */
  let focusKey = null;

  /**
   * @param {import('./model.js').Entity} entity
   * @param {number} x
   * @param {number} y
   * @param {boolean} centre
   * @param {import('./model.js').Relationship} [relationship]  what put the box here
   */
  function box(entity, x, y, centre, relationship, pending = false, height = NODE_HEIGHT) {
    const type = ENTITY_TYPES[entity.type];
    const group = svg('g', {
      class: centre ? 'graph-node centre' : `graph-node${pending ? ' pending' : ''}`,
      transform: `translate(${x},${y})`,
    });
    if (!centre) {
      group.setAttribute('tabindex', '0');
      group.setAttribute('role', 'button');
      group.setAttribute('aria-label', pending ? `Unpick ${entity.id}` : `Select ${entity.id}`);
    }
    group.appendChild(svg('rect', { width: String(NODE_WIDTH), height: String(height) }));
    group.appendChild(
      svg('use', {
        href: `#${TYPE_ICONS[entity.type]}`,
        x: '16',
        y: '12',
        width: '16',
        height: '16',
        class: 'node-icon',
        'data-pillar': type.pillar,
      })
    );
    group.appendChild(svgText('text', { x: '40', y: '24', class: 'node-type' }, type.name));
    group.appendChild(svgText('text', { x: '16', y: '42', class: 'node-id' }, entity.id));
    group.appendChild(svgText('text', { x: '16', y: '58', class: 'node-label' }, caption(entity)));
    const label = entityLabel(entity);
    group.appendChild(svgText('title', {}, `${type.name} ${entity.id}${label ? ` — ${label}` : ''}`));

    if (!centre) {
      const act = () => (pending ? store.togglePick(entity.id) : onSelect(entity.id));
      group.addEventListener('click', act);
      group.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        act();
      });
      // The unlink rides real neighbours in the default view only:
      // removals recede with the rest while picking.
      if (relationship && store.picker() === null) group.appendChild(removeControl(relationship, entity));
    }
    return group;
  }

  /**
   * The line under a group's last shown box: how many more the group
   * holds, a button in the link's colour that opens them beneath, or
   * folds them again from the block's end, focus staying on it through
   * the redraw.
   * @param {Object} group  as openGroups leaves it
   * @param {number} x
   * @param {number} y
   */
  function strip(group, x, y) {
    const control = svg('g', {
      class: `node-more${group.open ? ' open' : ''}`,
      transform: `translate(${x},${y})`,
      tabindex: '0',
      role: 'button',
      'aria-expanded': String(group.open),
      'aria-label': `${stripText(group)}, ${ENTITY_TYPES[group.type].name}`,
      'data-group': group.key,
    });
    control.appendChild(svg('rect', { class: 'node-more-hit', width: String(NODE_WIDTH), height: String(STRIP_HEIGHT) }));
    control.appendChild(svg('use', { href: `#${group.open ? 'i-chevron-down' : 'i-chevron-right'}`, x: '8', y: '4', width: '16', height: '16', class: 'node-chevron' }));
    control.appendChild(svgText('text', { x: '32', y: '16', class: 'node-more-text' }, stripText(group)));
    const toggle = () => {
      if (opened.has(group.key)) opened.delete(group.key);
      else opened.add(group.key);
      focusKey = group.key;
      render(lastFilter);
    };
    control.addEventListener('click', toggle);
    control.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle();
    });
    return control;
  }

  /** The rule along an open block's outer side, from its first box to its strip. */
  function blockRule(x, top, bottom) {
    return svg('line', { class: 'group-rule', x1: String(x), y1: String(top), x2: String(x), y2: String(bottom) });
  }

  /**
   * The control that takes a box off the canvas by removing the
   * relationship that put it there: an unlink, never a bin, so it cannot
   * read as deleting the entity.
   * @param {import('./model.js').Relationship} relationship
   * @param {import('./model.js').Entity} other
   */
  function removeControl(relationship, other) {
    const label = RELATIONSHIP_TYPES[relationship.type].label;
    const control = svg('g', {
      class: 'node-remove',
      transform: `translate(${NODE_WIDTH - 28},4)`,
      tabindex: '0',
      role: 'button',
      'aria-label': `Remove the ${label} relationship with ${other.id}`,
    });
    control.appendChild(svg('rect', { class: 'node-remove-hit', width: '24', height: '24' }));
    control.appendChild(
      svg('use', { href: '#i-remove-relationship', x: '4', y: '4', width: '16', height: '16', class: 'node-remove-icon' })
    );
    control.appendChild(svgText('title', {}, 'Remove relationship'));
    const remove = (event) => {
      event.stopPropagation();
      onUnrelate(relationship);
    };
    control.addEventListener('click', remove);
    control.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      remove(event);
    });
    return control;
  }

  /**
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @param {string} label
   */
  /**
   * One orthogonal edge, drawn source to target: out of the box, down or
   * up the channel, into the far box. The label rides the neighbour-side
   * horizontal, upright; a composition carries the filled diamond at the
   * owner's end — the drawn start, since the source owns — and every
   * other form the plain arrowhead.
   * @param {{ x1: number, y1: number, channel: number, x2: number, y2: number,
   *           label: string, composition: boolean, labelSide: 'start'|'end',
   *           pending?: boolean, unpickId?: string|null }} spec
   */
  function edge({ x1, y1, bendA, bendB, x2, y2, label, composition, labelX, labelY, pending = false, unpickId = null }) {
    const markers = composition
      ? { 'marker-start': 'url(#graph-diamond)' }
      : { 'marker-end': 'url(#graph-arrow)' };
    const group = svg('g', { class: `graph-edge${pending ? ' pending' : ''}` }, [
      svg('polyline', {
        points: doglegPoints(x1, y1, bendA, bendB, x2, y2),
        ...markers,
      }),
      svgText(
        'text',
        { x: String(labelX), y: String(labelY - 6), 'text-anchor': 'middle', class: 'graph-label' },
        label
      ),
    ]);
    if (pending && unpickId !== null) {
      group.addEventListener('click', () => store.togglePick(unpickId));
      group.appendChild(svgText('title', {}, 'Unpick'));
    }
    return group;
  }

  /**
   * Draw the subject's neighbourhood, narrowed to a filter where one is
   * typed: the subject stays whatever the filter says.
   * @param {string} [filter]
   */
  function render(filter = '') {
    element.textContent = '';
    const picker = store.picker();
    const around = neighbourhood(store.model(), picker !== null ? picker.subject : store.selection());
    if (around === null) return;

    const pend = picker !== null ? pendingNeighbours(store.model(), picker) : { outgoing: [], incoming: [], ambiguous: 0 };
    const merged = filteredNeighbourhood(
      {
        subject: around.subject,
        outgoing: [...around.outgoing, ...pend.outgoing],
        incoming: [...around.incoming, ...pend.incoming],
      },
      filter
    );
    if (picker !== null) {
      element.appendChild(
        el('p', {
          className: 'picking-note',
          text: 'Picked relationships show as dashed edges. Click one to let it go.',
        })
      );
    }

    lastFilter = filter;
    if (openedFor !== around.subject.id) {
      opened = new Set();
      openedFor = around.subject.id;
    }
    const filtered = filter.trim() !== '';
    const leftSide = sideRows(openGroups(groupedSide(merged.incoming, 'incoming'), opened, filtered));
    const rightSide = sideRows(openGroups(groupedSide(merged.outgoing, 'outgoing'), opened, filtered));
    const boxes = (side) => side.rows.filter((row) => row.kind === 'box').length;
    const subjectH = subjectHeight(Math.max(boxes(leftSide), boxes(rightSide)));
    // Each side is centred by its boxes alone, so a lone box faces the
    // subject dead level whether or not a strip hangs beneath it, and
    // its edges spread over that same span, symmetric about the middle.
    const leftSpan = boxSpan(leftSide);
    const rightSpan = boxSpan(rightSide);
    const columnH = Math.max(leftSpan, rightSpan, subjectH);
    const width = MARGIN * 2 + NODE_WIDTH * 3 + COLUMN_GAP * 2;
    const centreX = MARGIN + NODE_WIDTH + COLUMN_GAP;
    const rightX = centreX + NODE_WIDTH + COLUMN_GAP;
    const centreY = MARGIN + (columnH - subjectH) / 2;
    const leftTop = MARGIN + (columnH - leftSpan) / 2;
    const rightTop = MARGIN + (columnH - rightSpan) / 2;
    const height = Math.max(MARGIN + columnH, leftTop + leftSide.height, rightTop + rightSide.height) + MARGIN;

    const canvas = svg('svg', {
      class: `graph${picker !== null ? ' picking' : ''}`,
      width: String(width),
      height: String(height),
      viewBox: `0 0 ${width} ${height}`,
      role: 'group',
      'aria-label': `The relationships of ${around.subject.id}`,
    });
    canvas.appendChild(
      svg('defs', {}, [
        svg(
          'marker',
          {
            id: 'graph-arrow',
            viewBox: '0 0 10 10',
            refX: '9',
            refY: '5',
            markerWidth: '7',
            markerHeight: '7',
            orient: 'auto-start-reverse',
          },
          [svg('path', { d: 'M0 0 10 5 0 10z', class: 'arrow-head' })]
        ),
        svg(
          'marker',
          {
            id: 'graph-diamond',
            viewBox: '0 0 14 8',
            refX: '1',
            refY: '4',
            markerWidth: '14',
            markerHeight: '8',
            orient: 'auto',
          },
          [svg('path', { d: 'M1 4 7 1 13 4 7 7z', class: 'diamond-head' })]
        ),
      ])
    );

    const attachAt = (span, row) => centreY + attachmentY(row.mid, span, subjectH);
    // The shared bend bands, and every label at the same place: centred
    // over its neighbour stub, 6px above its lane.
    const leftBendA = MARGIN + NODE_WIDTH + NEIGHBOUR_STUB;
    const leftBendB = centreX - SUBJECT_STUB;
    const rightBendA = centreX + NODE_WIDTH + SUBJECT_STUB;
    const rightBendB = rightX - NEIGHBOUR_STUB;
    const leftLabelX = MARGIN + NODE_WIDTH + NEIGHBOUR_STUB / 2;
    const rightLabelX = rightX - NEIGHBOUR_STUB / 2;

    /** What a row's edge says and how. */
    const edgeSpec = (entry) => {
      const label = entry.pending ? entry.label : RELATIONSHIP_TYPES[entry.relationship.type].label;
      return {
        label: entry.pending && entry.ambiguous ? `${label}…` : label,
        composition: RELATIONSHIP_TYPES[entry.pending ? entry.typeId : entry.relationship.type].composition === true,
        pending: entry.pending === true,
        unpickId: entry.pending ? entry.other.id : null,
      };
    };

    for (const row of leftSide.rows) {
      const y = leftTop + row.y;
      if (row.kind === 'strip') {
        if (row.group.open) canvas.appendChild(blockRule(MARGIN - RULE_GAP, leftTop + row.top, y + STRIP_HEIGHT));
        canvas.appendChild(strip(row.group, MARGIN, y));
        continue;
      }
      const mid = leftTop + row.mid;
      canvas.appendChild(
        edge({ x1: MARGIN + NODE_WIDTH, y1: mid, bendA: leftBendA, bendB: leftBendB, x2: centreX, y2: attachAt(leftSpan, row), labelX: leftLabelX, labelY: mid, ...edgeSpec(row.entry) })
      );
      canvas.appendChild(box(row.entry.other, MARGIN, y, false, row.entry.relationship, row.entry.pending === true));
    }
    for (const row of rightSide.rows) {
      const y = rightTop + row.y;
      if (row.kind === 'strip') {
        if (row.group.open) canvas.appendChild(blockRule(rightX + NODE_WIDTH + RULE_GAP, rightTop + row.top, y + STRIP_HEIGHT));
        canvas.appendChild(strip(row.group, rightX, y));
        continue;
      }
      const mid = rightTop + row.mid;
      canvas.appendChild(
        edge({ x1: centreX + NODE_WIDTH, y1: attachAt(rightSpan, row), bendA: rightBendA, bendB: rightBendB, x2: rightX, y2: mid, labelX: rightLabelX, labelY: mid, ...edgeSpec(row.entry) })
      );
      canvas.appendChild(box(row.entry.other, rightX, y, false, row.entry.relationship, row.entry.pending === true));
    }
    canvas.appendChild(box(around.subject, centreX, centreY, true, undefined, false, subjectH));

    element.appendChild(canvas);
    if (focusKey !== null) {
      canvas.querySelector(`[data-group="${focusKey}"]`)?.focus();
      focusKey = null;
    }
    if (pend.ambiguous > 0) {
      element.appendChild(
        el('p', {
          className: 'picking-note',
          text: `${pend.ambiguous} ${pend.ambiguous === 1 ? 'pick can be' : 'picks can be'} more than one relationship. Choose which in the List view.`,
        })
      );
    }
  }

  return { element, render };
}
