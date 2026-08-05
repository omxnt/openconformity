/**
 * The relationship pane: the relationships of the selected entity, as a graph
 * of its closest neighbours or as a list. The two are one content in two
 * presentations, so a Carbon content switcher stands where tabs stood.
 *
 * Everything here is anchored on the entity the user is standing on. Adding a
 * relationship is two choices: the relationship form the metamodel allows for
 * this entity type, chosen in a side panel, and then the entity at the other
 * end, picked straight from the navigator — the panel overlays only the right
 * edge, so the tree stays visible and becomes the picker. Both offers are
 * generated from the metamodel and the model, so a combination that is not
 * allowed is never offered, and a row the model refuses cannot be picked.
 *
 * A relationship is deleted from its row, behind a confirmation.
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
import { confirmDialog } from './dialog.js';

// The box holds three lines of Carbon type at a 16px gutter, so its size and
// the gaps around it come from the spacing scale rather than being trimmed to
// fit a smaller face.
const NODE_WIDTH = 224;
const NODE_HEIGHT = 64;
const ROW_GAP = 16;
const COLUMN_GAP = 120;
const MARGIN = 16;
const MAX_PER_SIDE = 7;

/**
 * @param {Object} context
 * @param {HTMLElement} context.viewsEl
 * @param {HTMLElement} context.bodyEl
 * @param {HTMLElement} context.toolbarEl
 * @param {HTMLElement} context.panelEl
 * @param {() => import('./model.js').Model} context.getModel
 * @param {() => string|null} context.getEntityId
 * @param {(id: string) => void} context.onSelect
 * @param {() => void} context.onChange
 * @param {(message: string) => void} context.onMessage
 * @param {(spec: { validIds: Set<string>, onPick: (id: string) => void } | null) => void} context.setPicker
 */
export function createRelationshipPane(context) {
  let view = 'graph';
  let panelOpen = false;

  // Escape leaves the pick, unless a dialog is open and owns the key.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !panelOpen) return;
    if (document.querySelector('.overlay')) return;
    event.preventDefault();
    closePanel();
  });

  for (const name of ['graph', 'list']) {
    context.viewsEl.append(
      el('button', {
        type: 'button',
        class: 'switcher-option',
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
    // Whatever redrew this pane has moved the ground under an open pick — an
    // undo, a deletion, a load — so the pick does not survive it.
    closePanel();

    const model = context.getModel();
    const entityId = context.getEntityId();
    const entity = entityId ? model.entities.get(entityId) : null;

    for (const option of context.viewsEl.querySelectorAll('.switcher-option')) {
      option.classList.toggle('selected', option.dataset.view === view);
      option.setAttribute('aria-pressed', String(option.dataset.view === view));
    }

    clear(context.toolbarEl);
    clear(context.bodyEl);

    if (!entity) {
      context.bodyEl.append(
        el('div', { class: 'empty-state' }, [
          el('p', { class: 'empty-state-title', text: 'Nothing selected' }),
          el('p', { class: 'empty-state-body', text: 'Select an entity to see its relationships.' }),
        ])
      );
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
      el('button', {
        type: 'button',
        class: 'ghost-button',
        title: 'Add relationship',
        'aria-label': 'Add relationship',
        onclick: () => openAddRelationshipPanel(entity),
      }, [icon('i-add-relationship')])
    );
  }

  /** The two views say the same thing when there is nothing to show. */
  /** @param {import('./model.js').Entity} entity */
  function renderEmpty(entity) {
    context.bodyEl.append(
      el('div', { class: 'empty-state' }, [
        el('p', { class: 'empty-state-title', text: 'No relationships' }),
        el('p', { class: 'empty-state-body', text: `${entity.id} is not related to anything yet.` }),
        el('button', { type: 'button', class: 'button with-icon', onclick: () => openAddRelationshipPanel(entity) }, [
          icon('i-add-relationship'),
          el('span', { text: 'Add relationship' }),
        ]),
      ])
    );
  }

  /**
   * A relationship is a triple with this entity at one end. The side panel
   * asks for the relationship form — direction, label and far type in one
   * row — and the entities at the far end are then picked from the
   * navigator, which stays visible beside the panel: rows the model would
   * refuse are dimmed, rows it would accept offer themselves. Several can be
   * picked in one go, since one measure often mitigates several hazards, and
   * a picked row is let go again by clicking it once more or from the list
   * in the panel. Done makes every picked relationship at once; Cancel and
   * Escape make none. The offers come from the metamodel and the model, so a
   * combination that is not allowed is never offered, and completion still
   * runs through addRelationship for every pick.
   *
   * @param {import('./model.js').Entity} entity
   */
  function openAddRelationshipPanel(entity) {
    closePanel();
    const model = context.getModel();
    const options = availableRelationships(entity.type);
    const panel = context.panelEl;
    /** The targets picked so far, in the order they were picked. */
    const picked = new Set();
    /** The live picker handed to the tree, for re-rendering after a change. */
    let currentSpec = null;

    // The directions carry the table's own names; the form says the rest.
    const group = (heading, direction) => {
      const members = options.filter((option) => option.direction === direction);
      if (members.length === 0) return null;
      return el('optgroup', { label: heading }, members.map((option) =>
        el('option', {
          value: `${direction}:${option.type.id}`,
          text:
            direction === 'outgoing'
              ? `${option.type.label} → ${ENTITY_TYPES[option.type.target].name}`
              : `${ENTITY_TYPES[option.type.source].name} → ${option.type.label}`,
        })
      ));
    };

    const formSelect = el('select', { class: 'input', id: 'relationship-form' }, [
      group('Outgoing', 'outgoing'),
      group('Incoming', 'incoming'),
    ].filter(Boolean));
    const status = el('p', { class: 'pick-status', role: 'status' });
    const note = el('p', { class: 'side-panel-note' });
    const pickedSection = el('div', { class: 'picked-list' });
    const doneButton = el('button', { type: 'button', class: 'button primary', text: 'Done', disabled: true, onclick: completePicks });

    function chosen() {
      const separator = formSelect.value.indexOf(':');
      const direction = formSelect.value.slice(0, separator);
      const type = RELATIONSHIP_TYPES[formSelect.value.slice(separator + 1)];
      return type ? { direction, type } : null;
    }

    /**
     * The chosen form decides what the tree offers, so changing it starts
     * the picking over. The relationship label is used as the metamodel
     * writes it, between the two ends it joins; "each" keeps the sentence
     * true however many are picked.
     */
    function refresh() {
      picked.clear();
      currentSpec = null;
      const option = chosen();
      if (!option) {
        status.textContent = '';
        note.textContent = '';
        context.setPicker(null);
        renderPicked();
        return;
      }
      const far = ENTITY_TYPES[option.direction === 'outgoing' ? option.type.target : option.type.source];
      const candidates = candidatesFor(model, option.type.id, entity.id, option.direction);

      if (candidates.length === 0) {
        status.textContent = `No ${far.name} can take this relationship.`;
        note.textContent = 'New related entity creates the entity and the relationship together.';
        context.setPicker({ validIds: new Set(), pickedIds: picked, onPick: () => {} });
        renderPicked();
        return;
      }

      status.textContent =
        option.direction === 'outgoing'
          ? `Select ${far.plural} in the navigator — ${entity.id} ${option.type.label} each.`
          : `Select ${far.plural} in the navigator — each ${option.type.label} ${entity.id}.`;
      note.textContent = `${candidates.length} ${candidates.length === 1 ? 'row offers itself' : 'rows offer themselves'}; the rest are dimmed. Picking again lets go.`;
      currentSpec = {
        validIds: new Set(candidates.map((candidate) => candidate.id)),
        pickedIds: picked,
        onPick: (id) => {
          if (picked.has(id)) picked.delete(id);
          else picked.add(id);
          renderPicked();
          context.setPicker(currentSpec);
        },
      };
      context.setPicker(currentSpec);
      renderPicked();
    }

    /** What has been picked so far, each letting go of itself. */
    function renderPicked() {
      clear(pickedSection);
      pickedSection.append(el('p', { class: 'field-label', text: `Selected (${picked.size})` }));
      for (const id of picked) {
        const target = model.entities.get(id);
        if (!target) continue;
        pickedSection.append(
          el('div', { class: 'picked-row' }, [
            el('span', { class: 'mono', text: id }),
            el('span', { class: 'picked-label', text: labelOf(target) }),
            el('button', {
              type: 'button',
              class: 'icon-button neutral',
              title: 'Deselect',
              'aria-label': `Deselect ${id}`,
              onclick: () => {
                picked.delete(id);
                renderPicked();
                if (currentSpec) context.setPicker(currentSpec);
              },
            }, [icon('i-close')]),
          ])
        );
      }
      doneButton.disabled = picked.size === 0;
    }

    /**
     * Done makes every picked relationship, as one step for undo. The model
     * checks each on the way in, so the tree can never hand over something
     * the metamodel refuses.
     */
    function completePicks() {
      const option = chosen();
      if (!option || picked.size === 0) return;
      const failures = [];
      for (const id of picked) {
        const result =
          option.direction === 'outgoing'
            ? addRelationship(model, option.type.id, entity.id, id)
            : addRelationship(model, option.type.id, id, entity.id);
        if (!result.ok) failures.push(result.reason ?? 'The relationship was refused.');
      }
      const succeeded = picked.size - failures.length;
      closePanel();
      if (failures.length > 0) context.onMessage(`${failures.length} of the picked relationships were refused. ${failures[0]}`);
      if (succeeded > 0) context.onChange();
    }

    formSelect.addEventListener('change', refresh);

    clear(panel);
    panel.append(
      el('div', { class: 'side-panel-head' }, [
        el('span', { class: 'side-panel-title', text: 'Add relationship' }),
        el('button', { type: 'button', class: 'side-panel-close', 'aria-label': 'Cancel', onclick: closePanel }, [icon('i-close')]),
      ]),
      el('div', { class: 'side-panel-body' }, [
        dialogRow('Entity', el('span', { class: 'dialog-fixed', text: `${entity.id}  ${labelOf(entity)}` })),
        dialogRow('Relationship', formSelect),
        status,
        note,
        pickedSection,
      ]),
      el('div', { class: 'side-panel-footer' }, [
        el('button', { type: 'button', class: 'button', text: 'Cancel', onclick: closePanel }),
        doneButton,
      ])
    );
    panel.hidden = false;
    panelOpen = true;
    refresh();
    formSelect.focus();
  }

  function closePanel() {
    if (!panelOpen) return;
    panelOpen = false;
    context.setPicker(null);
    context.panelEl.hidden = true;
    clear(context.panelEl);
  }

  /**
   * Removing a relationship leaves both entities in place.
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
        el('p', { class: 'muted', text: 'Both entities stay in the model.' }),
      ],
      confirmLabel: 'Delete',
      danger: true,
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
      renderEmpty(entity);
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
      renderEmpty(entity);
      return;
    }

    const left = incoming.slice(0, MAX_PER_SIDE);
    const right = outgoing.slice(0, MAX_PER_SIDE);
    const step = NODE_HEIGHT + ROW_GAP;
    const lanes = Math.max(left.length, right.length, 1);
    const overflow = incoming.length > left.length || outgoing.length > right.length;
    const height = lanes * step - ROW_GAP + MARGIN * 2 + (overflow ? 24 : 0);
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
   * Composition is drawn solid and association dashed, so the kind is read
   * from the line itself rather than from colour (N-ACC-002).
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
      svg('use', { href: `#${type.icon}`, x: 16, y: 12, width: 16, height: 16, class: 'node-icon' }),
      svg('text', { x: 40, y: 24, class: 'node-type', text: type.name }),
      svg('text', { x: 16, y: 42, class: 'node-id', text: entity.id }),
      svg('text', { x: 16, y: 58, class: 'node-label', text: truncate(labelOf(entity), 27) }),
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
