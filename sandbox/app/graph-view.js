/**
 * The neighbourhood graph: the selected entity and its direct
 * relationships, never a whole-model graph. A pane presentation of the
 * selection, redrawn from the model on every render: incoming sources on
 * the left, outgoing targets on the right, the subject between them.
 */

import { nodeOf, relationshipsOf } from './model.js';
import { RELATIONSHIP_TYPES } from './metamodel.js';
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

const BOX_WIDTH = 200;
const BOX_HEIGHT = 32;
const ROW_GAP = 16;
const COLUMN_GAP = 60;
const MARGIN = 16;

/**
 * @param {import('./model.js').Entity} entity
 * @returns {string}
 */
function caption(entity) {
  const title = (entity.attributes.title ?? '').trim();
  const text = title ? `${entity.id}  ${title}` : entity.id;
  return text.length > 26 ? `${text.slice(0, 25)}…` : text;
}

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {(id: string) => void} context.onSelect
 */
export function createGraphView({ store, onSelect }) {
  const element = el('div', { className: 'graph-host' });

  /**
   * @param {import('./model.js').Entity} entity
   * @param {number} x
   * @param {number} y
   * @param {boolean} subject
   */
  function box(entity, x, y, subject) {
    const group = svg('g', { class: subject ? 'graph-node graph-subject' : 'graph-node', tabindex: subject ? '-1' : '0' }, [
      svg('rect', { x: String(x), y: String(y), width: String(BOX_WIDTH), height: String(BOX_HEIGHT), rx: '0' }),
      svgText(
        'text',
        { x: String(x + 12), y: String(y + BOX_HEIGHT / 2 + 4), class: 'graph-caption' },
        caption(entity)
      ),
    ]);
    if (!subject) {
      group.addEventListener('click', () => onSelect(entity.id));
      group.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onSelect(entity.id);
      });
    }
    return group;
  }

  /**
   * @param {number} fromX @param {number} fromY
   * @param {number} toX @param {number} toY
   * @param {string} label
   */
  function edge(fromX, fromY, toX, toY, label) {
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    return svg('g', { class: 'graph-edge' }, [
      svg('line', { x1: String(fromX), y1: String(fromY), x2: String(toX), y2: String(toY) }),
      svgText('text', { x: String(midX), y: String(midY - 4), 'text-anchor': 'middle', class: 'graph-label' }, label),
    ]);
  }

  function render() {
    element.textContent = '';
    const around = neighbourhood(store.model(), store.selection());
    if (around === null) return;

    const rows = Math.max(around.incoming.length, around.outgoing.length, 1);
    const width = MARGIN * 2 + BOX_WIDTH * 3 + COLUMN_GAP * 2;
    const height = MARGIN * 2 + rows * BOX_HEIGHT + (rows - 1) * ROW_GAP;
    const canvas = svg('svg', {
      class: 'graph',
      width: String(width),
      height: String(height),
      viewBox: `0 0 ${width} ${height}`,
      role: 'img',
      'aria-label': `The relationships of ${around.subject.id}`,
    });

    const columnY = (count, index) => {
      const columnHeight = count * BOX_HEIGHT + (count - 1) * ROW_GAP;
      return MARGIN + (height - MARGIN * 2 - columnHeight) / 2 + index * (BOX_HEIGHT + ROW_GAP);
    };
    const leftX = MARGIN;
    const centreX = MARGIN + BOX_WIDTH + COLUMN_GAP;
    const rightX = centreX + BOX_WIDTH + COLUMN_GAP;
    const subjectY = columnY(1, 0);

    around.incoming.forEach(({ relationship, other }, index) => {
      const y = columnY(around.incoming.length, index);
      canvas.appendChild(
        edge(leftX + BOX_WIDTH, y + BOX_HEIGHT / 2, centreX, subjectY + BOX_HEIGHT / 2, RELATIONSHIP_TYPES[relationship.type].label)
      );
      canvas.appendChild(box(other, leftX, y, false));
    });
    around.outgoing.forEach(({ relationship, other }, index) => {
      const y = columnY(around.outgoing.length, index);
      canvas.appendChild(
        edge(centreX + BOX_WIDTH, subjectY + BOX_HEIGHT / 2, rightX, y + BOX_HEIGHT / 2, RELATIONSHIP_TYPES[relationship.type].label)
      );
      canvas.appendChild(box(other, rightX, y, false));
    });
    canvas.appendChild(box(around.subject, centreX, subjectY, true));

    element.appendChild(canvas);
  }

  return { element, render };
}
