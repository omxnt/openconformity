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
  labelOf,
  relationshipsOf,
  removeRelationship,
} from './model.js';
import { clear, el, icon, svg, truncate } from './dom.js';
import { confirmDialog, openDialog } from './dialog.js';

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
  let view = 'graph';

  for (const name of ['graph', 'list']) {
    context.tabsEl.append(
      el('button', {
        type: 'button',
        class: 'tab',
        'data-view': name,
        text: name === 'list' ? 'List' : 'Graph',
        onclick: () => {
          view = name;
          render();
        },
      })
    );
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

  // --- Creation and editing ------------------------------------------

  /** @param {import('./model.js').Entity} entity */
  function renderToolbar(entity) {
    context.toolbarEl.append(
      el('button', { type: 'button', class: 'button with-icon', onclick: () => openAddRelationshipDialog(entity) }, [
        icon('i-new-related'),
        el('span', { text: 'Add relationship' }),
      ])
    );
  }

  /**
   * A relationship is a triple, so the dialog asks for it one part at a time,
   * each choice narrowing the next: the direction, then the relationship the
   * metamodel allows in that direction, then the entity type it can reach,
   * then the entity itself. Every list is generated from the metamodel, so a
   * combination it does not define is never offered.
   *
   * @param {import('./model.js').Entity} entity
   */
  function openAddRelationshipDialog(entity) {
    const model = context.getModel();
    const options = availableRelationships(entity.type);
    const far = (option) => (option.direction === 'outgoing' ? option.type.target : option.type.source);

    const directionSelect = el('select', { class: 'input', id: 'relationship-direction' }, [
      el('option', { value: 'outgoing', text: 'Outgoing' }),
      el('option', { value: 'incoming', text: 'Incoming' }),
    ]);
    const labelSelect = el('select', { class: 'input', id: 'relationship-label' });
    const typeSelect = el('select', { class: 'input', id: 'relationship-type' });
    const entitySelect = el('select', { class: 'input', id: 'relationship-entity' });
    const addButton = () => document.querySelector('.dialog-footer .button.primary');

    const inDirection = () => options.filter((option) => option.direction === directionSelect.value);
    const matching = () => inDirection().filter((option) => option.type.label === labelSelect.value);
    const chosen = () => matching().find((option) => far(option) === typeSelect.value);

    function refreshLabels() {
      clear(labelSelect);
      for (const label of [...new Set(inDirection().map((option) => option.type.label))]) {
        labelSelect.append(el('option', { value: label, text: label }));
      }
      refreshTypes();
    }

    function refreshTypes() {
      clear(typeSelect);
      for (const option of matching()) {
        typeSelect.append(el('option', { value: far(option), text: ENTITY_TYPES[far(option)].name }));
      }
      refreshEntities();
    }

    function refreshEntities() {
      const option = chosen();
      const candidates = option ? candidatesFor(model, option.type.id, entity.id, directionSelect.value) : [];
      clear(entitySelect);
      for (const candidate of candidates) {
        entitySelect.append(el('option', { value: candidate.id, text: `${candidate.id}  ${labelOf(candidate)}` }));
      }
      const none = candidates.length === 0;
      if (none) entitySelect.append(el('option', { value: '', text: 'No entity available' }));
      entitySelect.disabled = none;
      const button = addButton();
      if (button) button.disabled = none;
    }

    directionSelect.addEventListener('change', refreshLabels);
    labelSelect.addEventListener('change', refreshTypes);
    typeSelect.addEventListener('change', refreshEntities);
    refreshLabels();

    openDialog({
      title: 'Add relationship',
      content: [
        dialogRow('Entity', el('span', { class: 'dialog-fixed', text: `${entity.id}  ${labelOf(entity)}` })),
        dialogRow('Direction', directionSelect),
        dialogRow('Relationship', labelSelect),
        dialogRow('Entity type', typeSelect),
        dialogRow('Entity', entitySelect),
      ],
      actions: [
        { label: 'Cancel' },
        {
          label: 'Add',
          primary: true,
          action: () => {
            const option = chosen();
            const other = entitySelect.value;
            if (!option || !other) return;
            const result =
              directionSelect.value === 'outgoing'
                ? addRelationship(model, option.type.id, entity.id, other)
                : addRelationship(model, option.type.id, other, entity.id);
            if (!result.ok) {
              context.onMessage(result.reason ?? 'The relationship was refused.');
              return;
            }
            context.onChange();
          },
        },
      ],
    });
    refreshEntities();
    directionSelect.focus();
  }

  /**
   * Removing a relationship leaves both entities in place. A composition also
   * carries ownership, so removing one is worth spelling out.
   * @param {import('./model.js').Entity} entity
   * @param {import('./model.js').Relationship} relationship
   * @param {import('./model.js').Entity} other
   */
  function requestDeleteRelationship(entity, relationship, other) {
    const model = context.getModel();
    const type = RELATIONSHIP_TYPES[relationship.type];
    const source = model.entities.get(relationship.source);
    const target = model.entities.get(relationship.target);

    confirmDialog({
      title: 'Delete relationship',
      content: [
        el('p', {}, [
          'Delete ',
          el('span', { class: 'mono', text: source?.id ?? relationship.source }),
          ` ${type.label} `,
          el('span', { class: 'mono', text: target?.id ?? relationship.target }),
          '?',
        ]),
        el('p', {
          class: 'muted',
          text:
            type.kind === 'composition'
              ? `This removes the ownership of ${target?.id} by ${source?.id}. Both entities stay in the model.`
              : 'Both entities stay in the model.',
        }),
      ],
      confirmLabel: 'Delete',
      onConfirm: () => {
        removeRelationship(model, relationship.id);
        context.onChange();
      },
    });
  }

  /**
   * @param {string} label
   * @param {HTMLElement} control
   */
  function dialogRow(label, control) {
    return el('div', { class: 'field' }, [
      el(control.id ? 'label' : 'span', { class: 'field-label', for: control.id || null, text: label }),
      control,
    ]);
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
    return el('tr', { onclick: () => context.onSelect(other.id) }, [
      el('td', { class: 'muted' }, [
        el('span', { class: 'arrow', text: direction === 'outgoing' ? '→' : '←', 'aria-hidden': 'true' }),
        el('span', { text: direction }),
      ]),
      el('td', { text: type.label }),
      el('td', { class: 'muted', text: type.kind === 'composition' ? 'Composition' : 'Association' }),
      el('td', { class: 'mono', text: other.id }),
      el('td', { class: 'wrap', text: labelOf(other) }),
      typeCell(other),
      el('td', { class: 'shrink' }, [
        el('button', {
          type: 'button',
          class: 'icon-button',
          title: 'Delete relationship',
          'aria-label': `Delete the ${type.label} relationship with ${other.id}`,
          onclick: (event) => {
            event.stopPropagation();
            requestDeleteRelationship(entity, relationship, other);
          },
        }, [icon('i-delete')]),
      ]),
    ]);
  }

  /** @param {import('./model.js').Entity} entity */
  function typeCell(entity) {
    const type = ENTITY_TYPES[entity.type];
    return el('td', {}, [el('span', { class: 'cell-type' }, [icon(type.icon, type.pillar), el('span', { text: type.name })])]);
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
      'data-pillar': type.pillar,
      transform: `translate(${x},${y})`,
      tabindex: isCentre ? null : '0',
      role: isCentre ? null : 'button',
      'aria-label': isCentre ? null : `Select ${entity.id}, ${labelOf(entity)}`,
    }, [
      svg('rect', { width: NODE_WIDTH, height: NODE_HEIGHT }),
      svg('use', { href: `#${type.icon}`, x: 10, y: 6, width: 16, height: 16, class: 'node-icon' }),
      svg('text', { x: 32, y: 18, class: 'node-type', text: type.name }),
      svg('text', { x: 10, y: 33, class: 'node-id', text: entity.id }),
      svg('text', { x: 10, y: 45, class: 'node-label', text: truncate(labelOf(entity), 27) }),
      svg('title', { text: `${type.name} ${entity.id} — ${labelOf(entity)}` }),
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

  return { render };
}
