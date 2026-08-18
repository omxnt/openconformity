/**
 * The neighbourhood graph: the selected entity and its direct
 * relationships, never a whole-model graph. A pane presentation of the
 * selection, redrawn from the model on every render: incoming sources on
 * the left, outgoing targets on the right, the subject between them,
 * every edge arrowed and labelled, and each neighbour carrying the
 * control that removes the relationship that put it there. Seven boxes a
 * side; what lies beyond is counted, not drawn.
 */

import { nodeOf, relationshipsOf } from './model.js';
import { ENTITY_TYPES, RELATIONSHIP_TYPES } from './metamodel.js';
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
  function box(entity, x, y, centre, relationship) {
    const type = ENTITY_TYPES[entity.type];
    const group = svg('g', {
      class: centre ? 'graph-node centre' : 'graph-node',
      transform: `translate(${x},${y})`,
    });
    if (!centre) {
      group.setAttribute('tabindex', '0');
      group.setAttribute('role', 'button');
      group.setAttribute('aria-label', `Select ${entity.id}`);
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
      group.addEventListener('click', () => onSelect(entity.id));
      group.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onSelect(entity.id);
      });
      if (relationship) group.appendChild(removeControl(relationship, entity));
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
  function edge(x1, y1, x2, y2, label) {
    return svg('g', { class: 'graph-edge' }, [
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
  }

  function render() {
    element.textContent = '';
    const around = neighbourhood(store.model(), store.selection());
    if (around === null) return;

    const { left, right, moreIncoming, moreOutgoing } = cappedNeighbourhood(around);
    const step = NODE_HEIGHT + ROW_GAP;
    const lanes = Math.max(left.length, right.length, 1);
    const overflow = moreIncoming > 0 || moreOutgoing > 0;
    const height = lanes * step - ROW_GAP + MARGIN * 2 + (overflow ? 24 : 0);
    const width = MARGIN * 2 + NODE_WIDTH * 3 + COLUMN_GAP * 2;
    const centreX = MARGIN + NODE_WIDTH + COLUMN_GAP;
    const rightX = centreX + NODE_WIDTH + COLUMN_GAP;
    const centreY = MARGIN + (lanes * step - ROW_GAP - NODE_HEIGHT) / 2;

    const canvas = svg('svg', {
      class: 'graph',
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

    left.forEach(({ relationship, other }, index) => {
      const y = laneY(left.length, index);
      canvas.appendChild(
        edge(MARGIN + NODE_WIDTH, y + NODE_HEIGHT / 2, centreX, centreY + NODE_HEIGHT / 2, RELATIONSHIP_TYPES[relationship.type].label)
      );
      canvas.appendChild(box(other, MARGIN, y, false, relationship));
    });
    right.forEach(({ relationship, other }, index) => {
      const y = laneY(right.length, index);
      canvas.appendChild(
        edge(centreX + NODE_WIDTH, centreY + NODE_HEIGHT / 2, rightX, y + NODE_HEIGHT / 2, RELATIONSHIP_TYPES[relationship.type].label)
      );
      canvas.appendChild(box(other, rightX, y, false, relationship));
    });
    canvas.appendChild(box(around.subject, centreX, centreY, true));

    if (moreIncoming > 0) {
      canvas.appendChild(svgText('text', { x: String(MARGIN), y: String(height - 6), class: 'graph-more' }, `+${moreIncoming} more incoming`));
    }
    if (moreOutgoing > 0) {
      canvas.appendChild(svgText('text', { x: String(rightX), y: String(height - 6), class: 'graph-more' }, `+${moreOutgoing} more outgoing`));
    }

    element.appendChild(canvas);
  }

  return { element, render };
}
