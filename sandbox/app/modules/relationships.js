/**
 * The relationship pane: the relationships of the selected entity, as a list
 * or as a graph of its closest neighbours.
 *
 * Everything here is anchored on the entity the user is standing on. Adding a
 * relationship starts from its direction — out of this entity, or into it —
 * and only then offers the relationship types the metamodel defines for that
 * type in that direction, and then only the entities the model will accept.
 *
 * A row is not deleted in one click. It is opened for editing first, and
 * delete sits inside that, beside save and cancel.
 */

import { ENTITY_TYPES, RELATIONSHIP_TYPES } from './metamodel.js';
import {
  addRelationship,
  availableRelationships,
  candidatesFor,
  displayLabel,
  relationshipsOf,
  removeRelationship,
  retargetRelationship,
} from './model.js';
import { clear, el, icon, svg, truncate } from './dom.js';

const NODE_WIDTH = 196;
const NODE_HEIGHT = 48;
const ROW_GAP = 14;
const COLUMN_GAP = 118;
const MARGIN = 20;
const MAX_PER_SIDE = 7;

/**
 * @param {Object} context
 * @param {HTMLElement} context.tabsEl
 * @param {HTMLElement} context.bodyEl
 * @param {HTMLElement} context.toolbarEl
 * @param {() => import('./model.js').Model} context.getModel
 * @param {() => string|null} context.getEntityId
 * @param {(id: string) => void} context.onSelect
 * @param {() => void} context.onChange
 * @param {(message: string) => void} context.onMessage
 */
export function createRelationshipPane(context) {
  let view = 'list';
  let adding = false;
  /** @type {string|null} */
  let editingRow = null;

  for (const name of ['list', 'graph']) {
    context.tabsEl.append(
      el('button', {
        type: 'button',
        class: 'tab',
        'data-view': name,
        text: name === 'list' ? 'List' : 'Graph',
        onclick: () => {
          view = name;
          reset();
          render();
        },
      })
    );
  }

  function reset() {
    adding = false;
    editingRow = null;
  }

  function render() {
    const model = context.getModel();
    const entityId = context.getEntityId();
    const entity = entityId ? model.entities.get(entityId) : null;

    for (const tab of context.tabsEl.querySelectorAll('.tab')) {
      tab.classList.toggle('active', tab.dataset.view === view);
      tab.setAttribute('aria-pressed', String(tab.dataset.view === view));
    }

    clear(context.toolbarEl);
    clear(context.bodyEl);

    if (!entity) {
      context.bodyEl.append(el('p', { class: 'empty', text: 'No entity selected.' }));
      return;
    }

    renderToolbar(entity);
    if (view === 'list') renderList(model, entity);
    else renderGraph(model, entity);
  }

  // --- Creation --------------------------------------------------------

  /** @param {import('./model.js').Entity} entity */
  function renderToolbar(entity) {
    if (!adding) {
      context.toolbarEl.append(
        el('span', { class: 'toolbar-label', text: `Relationships of ${entity.id}` }),
        el('button', {
          type: 'button',
          class: 'button',
          text: 'Add relationship',
          onclick: () => {
            adding = true;
            editingRow = null;
            render();
          },
        })
      );
      return;
    }

    const model = context.getModel();
    const options = availableRelationships(entity.type);

    const directionSelect = el('select', { class: 'input', 'aria-label': 'Direction' }, [
      el('option', { value: 'outgoing', text: `outgoing — from ${entity.id}` }),
      el('option', { value: 'incoming', text: `incoming — into ${entity.id}` }),
    ]);
    const typeSelect = el('select', { class: 'input', 'aria-label': 'Relationship' });
    const targetSelect = el('select', { class: 'input wide', 'aria-label': 'Related entity' });
    const addButton = el('button', { type: 'button', class: 'button primary', text: 'Add' });

    function refreshTypes() {
      const direction = directionSelect.value;
      clear(typeSelect);
      for (const option of options.filter((candidate) => candidate.direction === direction)) {
        typeSelect.append(
          el('option', {
            value: option.type.id,
            text:
              direction === 'outgoing'
                ? `${option.type.label} → ${ENTITY_TYPES[option.type.target].name}`
                : `${ENTITY_TYPES[option.type.source].name} → ${option.type.label}`,
          })
        );
      }
      refreshTargets();
    }

    function refreshTargets() {
      const candidates = candidatesFor(model, typeSelect.value, entity.id, directionSelect.value);
      clear(targetSelect);
      for (const candidate of candidates) {
        targetSelect.append(el('option', { value: candidate.id, text: `${candidate.id}  ${displayLabel(candidate)}` }));
      }
      const none = candidates.length === 0;
      if (none) targetSelect.append(el('option', { value: '', text: 'No entity available' }));
      targetSelect.disabled = none;
      addButton.disabled = none;
    }

    directionSelect.addEventListener('change', refreshTypes);
    typeSelect.addEventListener('change', refreshTargets);
    addButton.addEventListener('click', () => {
      const other = targetSelect.value;
      if (!other) return;
      const result =
        directionSelect.value === 'outgoing'
          ? addRelationship(model, typeSelect.value, entity.id, other)
          : addRelationship(model, typeSelect.value, other, entity.id);
      if (!result.ok) {
        context.onMessage(result.reason ?? 'The relationship was refused.');
        return;
      }
      adding = false;
      context.onChange();
    });

    context.toolbarEl.append(
      el('span', { class: 'toolbar-label', text: entity.id }),
      directionSelect,
      typeSelect,
      targetSelect,
      addButton,
      el('button', {
        type: 'button',
        class: 'button',
        text: 'Cancel',
        onclick: () => {
          adding = false;
          render();
        },
      })
    );
    refreshTypes();
  }

  // --- List view -------------------------------------------------------

  /**
   * @param {import('./model.js').Model} model
   * @param {import('./model.js').Entity} entity
   */
  function renderList(model, entity) {
    const { outgoing, incoming } = relationshipsOf(model, entity.id);
    if (outgoing.length === 0 && incoming.length === 0) {
      context.bodyEl.append(el('p', { class: 'empty', text: 'This entity has no relationships yet.' }));
      return;
    }

    const rows = [
      ...outgoing.map((relationship) => row(model, entity, relationship, 'outgoing', relationship.target)),
      ...incoming.map((relationship) => row(model, entity, relationship, 'incoming', relationship.source)),
    ];

    context.bodyEl.append(
      el('table', { class: 'table' }, [
        el('thead', {}, [
          el('tr', {}, [
            el('th', { text: 'Direction' }),
            el('th', { text: 'Relationship' }),
            el('th', { text: 'Kind' }),
            el('th', { text: 'Identifier' }),
            el('th', { text: 'Related entity' }),
            el('th', { text: 'Entity type' }),
            el('th', { class: 'shrink' }),
          ]),
        ]),
        el('tbody', {}, rows),
      ])
    );
  }

  /**
   * @param {import('./model.js').Model} model
   * @param {import('./model.js').Entity} entity
   * @param {import('./model.js').Relationship} relationship
   * @param {'outgoing'|'incoming'} direction
   * @param {string} otherId
   */
  function row(model, entity, relationship, direction, otherId) {
    const type = RELATIONSHIP_TYPES[relationship.type];
    const other = model.entities.get(otherId);
    if (!other) return el('tr');
    const editingThis = editingRow === relationship.id;

    const directionCell = el('td', { class: 'muted' }, [
      el('span', { class: 'arrow', text: direction === 'outgoing' ? '→' : '←', 'aria-hidden': 'true' }),
      el('span', { text: direction }),
    ]);
    const kindCell = el('td', { class: 'muted', text: type.kind === 'composition' ? 'Composition' : 'Association' });

    if (!editingThis) {
      return el('tr', { onclick: () => context.onSelect(other.id) }, [
        directionCell,
        el('td', { text: type.label }),
        kindCell,
        el('td', { class: 'mono', text: other.id }),
        el('td', { class: 'wrap', text: displayLabel(other) }),
        typeCell(other),
        el('td', { class: 'shrink' }, [
          el('button', {
            type: 'button',
            class: 'button small',
            text: 'Edit',
            onclick: (event) => {
              event.stopPropagation();
              adding = false;
              editingRow = relationship.id;
              render();
            },
          }),
        ]),
      ]);
    }

    const select = el('select', { class: 'input wide', 'aria-label': 'Related entity' });
    for (const candidate of candidatesFor(model, relationship.type, entity.id, direction, otherId)) {
      select.append(el('option', { value: candidate.id, text: `${candidate.id}  ${displayLabel(candidate)}` }));
    }
    select.value = otherId;

    return el('tr', { class: 'row-editing' }, [
      directionCell,
      el('td', { text: type.label }),
      kindCell,
      el('td', { colspan: '3' }, [select]),
      el('td', { class: 'shrink' }, [
        el('span', { class: 'row-buttons' }, [
          el('button', {
            type: 'button',
            class: 'button small primary',
            text: 'Save',
            onclick: () => {
              const result = retargetRelationship(model, relationship.id, direction, select.value);
              if (!result.ok) {
                context.onMessage(result.reason ?? 'The change was refused.');
                return;
              }
              editingRow = null;
              context.onChange();
            },
          }),
          el('button', {
            type: 'button',
            class: 'button small',
            text: 'Cancel',
            onclick: () => {
              editingRow = null;
              render();
            },
          }),
          el('button', {
            type: 'button',
            class: 'button small',
            text: 'Delete',
            title:
              type.kind === 'composition'
                ? `Removes the ownership of ${otherId} by ${entity.id}. Both entities stay in the model.`
                : 'Removes the relationship. Both entities stay in the model.',
            onclick: () => {
              removeRelationship(model, relationship.id);
              editingRow = null;
              context.onChange();
            },
          }),
        ]),
      ]),
    ]);
  }

  /** @param {import('./model.js').Entity} entity */
  function typeCell(entity) {
    const type = ENTITY_TYPES[entity.type];
    return el('td', {}, [el('span', { class: 'cell-type' }, [icon(type.icon), el('span', { text: type.name })])]);
  }

  // --- Graph view ------------------------------------------------------

  /**
   * The neighbourhood of the selected entity: incoming on the left, outgoing
   * on the right, the selection between them.
   * @param {import('./model.js').Model} model
   * @param {import('./model.js').Entity} entity
   */
  function renderGraph(model, entity) {
    const { outgoing, incoming } = relationshipsOf(model, entity.id);
    if (outgoing.length === 0 && incoming.length === 0) {
      context.bodyEl.append(el('p', { class: 'empty', text: 'This entity has no relationships yet.' }));
      return;
    }

    const left = incoming.slice(0, MAX_PER_SIDE);
    const right = outgoing.slice(0, MAX_PER_SIDE);
    const step = NODE_HEIGHT + ROW_GAP;
    const lanes = Math.max(left.length, right.length, 1);
    const overflow = incoming.length > left.length || outgoing.length > right.length;
    const height = lanes * step - ROW_GAP + MARGIN * 2 + (overflow ? 18 : 0);
    const width = MARGIN * 2 + NODE_WIDTH * 3 + COLUMN_GAP * 2;

    const centreX = MARGIN + NODE_WIDTH + COLUMN_GAP;
    const rightX = centreX + NODE_WIDTH + COLUMN_GAP;
    const centreY = MARGIN + (lanes * step - ROW_GAP - NODE_HEIGHT) / 2;

    const canvas = svg('svg', {
      class: 'graph',
      viewBox: `0 0 ${width} ${height}`,
      width,
      height,
      role: 'group',
      'aria-label': `Relationships of ${entity.id}`,
    });

    canvas.append(
      svg('defs', {}, [
        svg('marker', { id: 'graph-arrow', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, [
          svg('path', { d: 'M0 0 10 5 0 10z', class: 'arrow-head' }),
        ]),
      ])
    );

    const laneY = (count, index) => MARGIN + ((lanes - count) * step) / 2 + index * step;

    left.forEach((relationship, index) => {
      const other = model.entities.get(relationship.source);
      if (!other) return;
      const y = laneY(left.length, index);
      canvas.append(edge(MARGIN + NODE_WIDTH, y + NODE_HEIGHT / 2, centreX, centreY + NODE_HEIGHT / 2, RELATIONSHIP_TYPES[relationship.type]));
      canvas.append(graphNode(other, MARGIN, y, false));
    });

    right.forEach((relationship, index) => {
      const other = model.entities.get(relationship.target);
      if (!other) return;
      const y = laneY(right.length, index);
      canvas.append(edge(centreX + NODE_WIDTH, centreY + NODE_HEIGHT / 2, rightX, y + NODE_HEIGHT / 2, RELATIONSHIP_TYPES[relationship.type]));
      canvas.append(graphNode(other, rightX, y, false));
    });

    canvas.append(graphNode(entity, centreX, centreY, true));

    if (incoming.length > left.length) {
      canvas.append(svg('text', { x: MARGIN, y: height - 6, class: 'graph-more', text: `+${incoming.length - left.length} more incoming` }));
    }
    if (outgoing.length > right.length) {
      canvas.append(svg('text', { x: rightX, y: height - 6, class: 'graph-more', text: `+${outgoing.length - right.length} more outgoing` }));
    }

    context.bodyEl.append(el('div', { class: 'graph-wrap' }, [canvas]));
  }

  /**
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {import('./metamodel.js').RelationshipType} type
   */
  function edge(x1, y1, x2, y2, type) {
    return svg('g', { class: `edge${type.kind === 'composition' ? ' composition' : ''}` }, [
      svg('line', { x1, y1, x2, y2, 'marker-end': 'url(#graph-arrow)' }),
      svg('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 6, class: 'edge-label', text: type.label }),
    ]);
  }

  /**
   * @param {import('./model.js').Entity} entity
   * @param {number} x
   * @param {number} y
   * @param {boolean} isCentre
   */
  function graphNode(entity, x, y, isCentre) {
    const type = ENTITY_TYPES[entity.type];
    const group = svg('g', {
      class: `graph-node${isCentre ? ' centre' : ''}`,
      transform: `translate(${x},${y})`,
      tabindex: isCentre ? null : '0',
      role: isCentre ? null : 'button',
      'aria-label': isCentre ? null : `Select ${entity.id}, ${displayLabel(entity)}`,
    }, [
      svg('rect', { width: NODE_WIDTH, height: NODE_HEIGHT }),
      svg('text', { x: 10, y: 15, class: 'node-type', text: type.name }),
      svg('text', { x: 10, y: 29, class: 'node-id', text: entity.id }),
      svg('text', { x: 10, y: 42, class: 'node-label', text: truncate(displayLabel(entity), 27) }),
      svg('title', { text: `${type.name} ${entity.id} — ${displayLabel(entity)}` }),
    ]);

    if (!isCentre) {
      group.addEventListener('click', () => context.onSelect(entity.id));
      group.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          context.onSelect(entity.id);
        }
      });
    }
    return group;
  }

  return { render, reset };
}
