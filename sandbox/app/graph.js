/**
 * The neighbourhood graph: the selected entity and its direct
 * relationships, never a whole-model graph. A pane presentation of the
 * selection, redrawn from the model on every render: incoming sources on
 * the left, outgoing targets on the right, the subject between them,
 * every edge arrowed and labelled, and each neighbour carrying the
 * control that removes the relationship that put it there. Seven boxes a
 * side; what lies beyond is counted, not drawn. While the store holds a
 * picker for the subject, the picks ride as dashed provisional edges —
 * clicking one, or its box, lets go — and the standing neighbourhood
 * recedes until Done.
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
      label: RELATIONSHIP_TYPES[row.form.typeId].label,
      ambiguous: row.ambiguous,
    });
  }
  return sides;
}

/** How many boxes a side draws before counting the rest. */
export const MAX_PER_SIDE = 7;

/**
 * The neighbourhood the canvas actually draws: at most MAX_PER_SIDE a
 * side, with the overflow counted.
 * @param {ReturnType<typeof neighbourhood>} around
 * @returns {{ left: any[], right: any[], moreIncoming: number, moreOutgoing: number }}
 */
export function cappedNeighbourhood(around) {
  const left = around.incoming.slice(0, MAX_PER_SIDE);
  const right = around.outgoing.slice(0, MAX_PER_SIDE);
  return {
    left,
    right,
    moreIncoming: around.incoming.length - left.length,
    moreOutgoing: around.outgoing.length - right.length,
  };
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
const COLUMN_GAP = 120;
const MARGIN = 16;

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {(id: string) => void} context.onSelect
 * @param {(relationship: import('./model.js').Relationship) => void} context.onUnrelate
 */
export function createGraphView({ store, onSelect, onUnrelate }) {
  const element = el('div', { className: 'graph-host' });

  /**
   * @param {import('./model.js').Entity} entity
   * @param {number} x
   * @param {number} y
   * @param {boolean} centre
   * @param {import('./model.js').Relationship} [relationship]  what put the box here
   */
  function box(entity, x, y, centre, relationship, pending = false) {
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
    group.appendChild(svg('rect', { width: String(NODE_WIDTH), height: String(NODE_HEIGHT) }));
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
  function edge(x1, y1, x2, y2, label, pending = false, unpickId = null) {
    const group = svg('g', { class: `graph-edge${pending ? ' pending' : ''}` }, [
      svg('line', {
        x1: String(x1),
        y1: String(y1),
        x2: String(x2),
        y2: String(y2),
        'marker-end': 'url(#graph-arrow)',
      }),
      svgText(
        'text',
        { x: String((x1 + x2) / 2), y: String((y1 + y2) / 2 - 6), 'text-anchor': 'middle', class: 'graph-label' },
        label
      ),
    ]);
    if (pending && unpickId !== null) {
      group.addEventListener('click', () => store.togglePick(unpickId));
      group.appendChild(svgText('title', {}, 'Unpick'));
    }
    return group;
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

    const { left, right, moreIncoming, moreOutgoing } = cappedNeighbourhood(merged);
    const step = NODE_HEIGHT + ROW_GAP;
    const lanes = Math.max(left.length, right.length, 1);
    const overflow = moreIncoming > 0 || moreOutgoing > 0;
    const height = lanes * step - ROW_GAP + MARGIN * 2 + (overflow ? 24 : 0);
    const width = MARGIN * 2 + NODE_WIDTH * 3 + COLUMN_GAP * 2;
    const centreX = MARGIN + NODE_WIDTH + COLUMN_GAP;
    const rightX = centreX + NODE_WIDTH + COLUMN_GAP;
    const centreY = MARGIN + (lanes * step - ROW_GAP - NODE_HEIGHT) / 2;

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
      ])
    );

    const laneY = (count, index) => MARGIN + ((lanes - count) * step) / 2 + index * step;

    left.forEach((entry, index) => {
      const y = laneY(left.length, index);
      const label = entry.pending ? entry.label : RELATIONSHIP_TYPES[entry.relationship.type].label;
      canvas.appendChild(
        edge(
          MARGIN + NODE_WIDTH,
          y + NODE_HEIGHT / 2,
          centreX,
          centreY + NODE_HEIGHT / 2,
          entry.pending && entry.ambiguous ? `${label}…` : label,
          entry.pending === true,
          entry.pending ? entry.other.id : null
        )
      );
      canvas.appendChild(box(entry.other, MARGIN, y, false, entry.relationship, entry.pending === true));
    });
    right.forEach((entry, index) => {
      const y = laneY(right.length, index);
      const label = entry.pending ? entry.label : RELATIONSHIP_TYPES[entry.relationship.type].label;
      canvas.appendChild(
        edge(
          centreX + NODE_WIDTH,
          centreY + NODE_HEIGHT / 2,
          rightX,
          y + NODE_HEIGHT / 2,
          entry.pending && entry.ambiguous ? `${label}…` : label,
          entry.pending === true,
          entry.pending ? entry.other.id : null
        )
      );
      canvas.appendChild(box(entry.other, rightX, y, false, entry.relationship, entry.pending === true));
    });
    canvas.appendChild(box(around.subject, centreX, centreY, true));

    if (moreIncoming > 0) {
      canvas.appendChild(svgText('text', { x: String(MARGIN), y: String(height - 6), class: 'graph-more' }, `+${moreIncoming} more incoming`));
    }
    if (moreOutgoing > 0) {
      canvas.appendChild(svgText('text', { x: String(rightX), y: String(height - 6), class: 'graph-more' }, `+${moreOutgoing} more outgoing`));
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
