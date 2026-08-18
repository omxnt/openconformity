/**
 * The neighbourhood graph: the selected entity and its direct
 * relationships, never a whole-model graph. A pane presentation of the
 * selection, redrawn from the model on every render: incoming sources on
 * the left, outgoing targets on the right, the subject between them,
 * every edge a dogleg — horizontal out of its box, one slant across the
 * shared bend band, horizontal into the far one — labelled upright on
 * the neighbour-side run, compositions carrying the filled diamond at
 * the owner's end and every other form the plain arrowhead. Seven boxes a
 * side while a side is folded; the +N chip unfolds it. While the store
 * holds a picker for the subject, the picks ride as dashed provisional
 * edges — clicking one, or its box, lets go — and the standing
 * neighbourhood recedes until Done.
 */

import { nodeOf, relationshipsOf } from './model.js';
import { ENTITY_TYPES, RELATIONSHIP_TYPES } from './metamodel.js';
import { pickedRows } from './relate.js';
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

/** How many boxes a side draws before counting the rest. */
export const MAX_PER_SIDE = 7;

/**
 * The neighbourhood the canvas actually draws: at most MAX_PER_SIDE real
 * boxes a side while the side is folded, the overflow counted; an
 * unfolded side draws everything. Provisional picks always draw, the cap
 * notwithstanding.
 * @param {ReturnType<typeof neighbourhood>} around
 * @param {{ incoming: boolean, outgoing: boolean }} [unfolded]
 * @returns {{ left: any[], right: any[], moreIncoming: number, moreOutgoing: number }}
 */
export function cappedNeighbourhood(around, unfolded = { incoming: false, outgoing: false }) {
  const side = (list, open) => {
    const real = list.filter((entry) => entry.pending !== true);
    const pending = list.filter((entry) => entry.pending === true);
    const shown = open ? real : real.slice(0, MAX_PER_SIDE);
    return { rows: [...shown, ...pending], more: real.length - shown.length };
  };
  const left = side(around.incoming, unfolded.incoming);
  const right = side(around.outgoing, unfolded.outgoing);
  return { left: left.rows, right: right.rows, moreIncoming: left.more, moreOutgoing: right.more };
}

/**
 * Where a side's edges attach along the subject: spread evenly over its
 * height, never all at centre.
 * @param {number} count
 * @param {number} height
 * @returns {number[]}  y offsets within the box
 */
export function attachmentYs(count, height) {
  return Array.from({ length: count }, (unused, index) => ((index + 1) * height) / (count + 1));
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
 * attachment points keep room.
 * @param {number} busiest  the larger side's edge count
 * @returns {number}
 */
export function subjectHeight(busiest) {
  return Math.max(NODE_HEIGHT, busiest * 14 + 22);
}

/**
 * The title line a box carries, cut to what three lines of box hold.
 * @param {import('./model.js').Entity} entity
 * @returns {string}
 */
export function caption(entity) {
  const title = (entity.attributes.title ?? '').trim();
  const text = title || entity.id;
  return text.length > 27 ? `${text.slice(0, 26)}…` : text;
}

// The box holds three lines of Carbon type at a 16px gutter.
const NODE_WIDTH = 224;
const NODE_HEIGHT = 64;
const ROW_GAP = 16;
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

  /** Which sides stand unfolded past the cap; the fold closes on a new subject. */
  let unfolded = { incoming: false, outgoing: false };
  let unfoldedFor = null;

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
    const title = (entity.attributes.title ?? '').trim();
    group.appendChild(svgText('title', {}, `${type.name} ${entity.id}${title ? ` — ${title}` : ''}`));

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

  /** The fold: a +N chip that opens its side, and the way back. */
  function foldChip(x, y, text, onPick) {
    const chip = svgText('text', { x: String(x), y: String(y), class: 'graph-more graph-fold', tabindex: '0', role: 'button' }, text);
    chip.setAttribute('aria-label', text);
    chip.addEventListener('click', onPick);
    chip.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onPick();
    });
    return chip;
  }

  function render() {
    element.textContent = '';
    const picker = store.picker();
    const around = neighbourhood(store.model(), picker !== null ? picker.subject : store.selection());
    if (around === null) return;

    const pend = picker !== null ? pendingNeighbours(store.model(), picker) : { outgoing: [], incoming: [], ambiguous: 0 };
    const merged = {
      subject: around.subject,
      outgoing: [...around.outgoing, ...pend.outgoing],
      incoming: [...around.incoming, ...pend.incoming],
    };
    if (picker !== null) {
      element.appendChild(
        el('p', {
          className: 'picking-note',
          text: 'Picked relationships land as dashed edges; click one to let go. The rest recede until Done.',
        })
      );
    }

    if (unfoldedFor !== around.subject.id) {
      unfolded = { incoming: false, outgoing: false };
      unfoldedFor = around.subject.id;
    }

    const { left, right, moreIncoming, moreOutgoing } = cappedNeighbourhood(merged, unfolded);
    const step = NODE_HEIGHT + ROW_GAP;
    const lanes = Math.max(left.length, right.length, 1);
    const subjectH = subjectHeight(Math.max(left.length, right.length));
    const foldRow = moreIncoming > 0 || moreOutgoing > 0 || unfolded.incoming || unfolded.outgoing;
    const columnH = Math.max(lanes * step - ROW_GAP, subjectH);
    const height = columnH + MARGIN * 2 + (foldRow ? 24 : 0);
    const width = MARGIN * 2 + NODE_WIDTH * 3 + COLUMN_GAP * 2;
    const centreX = MARGIN + NODE_WIDTH + COLUMN_GAP;
    const rightX = centreX + NODE_WIDTH + COLUMN_GAP;
    const centreY = MARGIN + (columnH - subjectH) / 2;

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

    const laneY = (count, index) => MARGIN + ((Math.max(lanes, 1) - count) * step) / 2 + index * step;
    const leftAttach = attachmentYs(left.length, subjectH).map((y) => centreY + y);
    const rightAttach = attachmentYs(right.length, subjectH).map((y) => centreY + y);
    // The shared bend bands, and every label at the same place: centred
    // over its neighbour stub, 6px above its lane.
    const leftBendA = MARGIN + NODE_WIDTH + NEIGHBOUR_STUB;
    const leftBendB = centreX - SUBJECT_STUB;
    const rightBendA = centreX + NODE_WIDTH + SUBJECT_STUB;
    const rightBendB = rightX - NEIGHBOUR_STUB;
    const leftLabelX = MARGIN + NODE_WIDTH + NEIGHBOUR_STUB / 2;
    const rightLabelX = rightX - NEIGHBOUR_STUB / 2;

    left.forEach((entry, index) => {
      const y = laneY(left.length, index);
      const label = entry.pending ? entry.label : RELATIONSHIP_TYPES[entry.relationship.type].label;
      const composition =
        RELATIONSHIP_TYPES[entry.pending ? entry.typeId : entry.relationship.type].composition === true;
      canvas.appendChild(
        edge({
          x1: MARGIN + NODE_WIDTH,
          y1: y + NODE_HEIGHT / 2,
          bendA: leftBendA,
          bendB: leftBendB,
          x2: centreX,
          y2: leftAttach[index],
          label: entry.pending && entry.ambiguous ? `${label}…` : label,
          composition,
          labelX: leftLabelX,
          labelY: y + NODE_HEIGHT / 2,
          pending: entry.pending === true,
          unpickId: entry.pending ? entry.other.id : null,
        })
      );
      canvas.appendChild(box(entry.other, MARGIN, y, false, entry.relationship, entry.pending === true));
    });
    right.forEach((entry, index) => {
      const y = laneY(right.length, index);
      const label = entry.pending ? entry.label : RELATIONSHIP_TYPES[entry.relationship.type].label;
      const composition =
        RELATIONSHIP_TYPES[entry.pending ? entry.typeId : entry.relationship.type].composition === true;
      canvas.appendChild(
        edge({
          x1: centreX + NODE_WIDTH,
          y1: rightAttach[index],
          bendA: rightBendA,
          bendB: rightBendB,
          x2: rightX,
          y2: y + NODE_HEIGHT / 2,
          label: entry.pending && entry.ambiguous ? `${label}…` : label,
          composition,
          labelX: rightLabelX,
          labelY: y + NODE_HEIGHT / 2,
          pending: entry.pending === true,
          unpickId: entry.pending ? entry.other.id : null,
        })
      );
      canvas.appendChild(box(entry.other, rightX, y, false, entry.relationship, entry.pending === true));
    });
    canvas.appendChild(box(around.subject, centreX, centreY, true, undefined, false, subjectH));

    if (moreIncoming > 0) {
      canvas.appendChild(
        foldChip(MARGIN, height - 6, `+${moreIncoming} more incoming`, () => {
          unfolded.incoming = true;
          render();
        })
      );
    } else if (unfolded.incoming && merged.incoming.filter((entry) => entry.pending !== true).length > MAX_PER_SIDE) {
      canvas.appendChild(
        foldChip(MARGIN, height - 6, 'Fold incoming', () => {
          unfolded.incoming = false;
          render();
        })
      );
    }
    if (moreOutgoing > 0) {
      canvas.appendChild(
        foldChip(rightX, height - 6, `+${moreOutgoing} more outgoing`, () => {
          unfolded.outgoing = true;
          render();
        })
      );
    } else if (unfolded.outgoing && merged.outgoing.filter((entry) => entry.pending !== true).length > MAX_PER_SIDE) {
      canvas.appendChild(
        foldChip(rightX, height - 6, 'Fold outgoing', () => {
          unfolded.outgoing = false;
          render();
        })
      );
    }

    element.appendChild(canvas);
    if (pend.ambiguous > 0) {
      element.appendChild(
        el('p', {
          className: 'picking-note',
          text: `${pend.ambiguous} ${pend.ambiguous === 1 ? 'pick offers' : 'picks offer'} more than one relationship — choose it in the List view.`,
        })
      );
    }
  }

  return { element, render };
}
