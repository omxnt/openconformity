/**
 * The relationship pane: the selected entity's relationships as a list or
 * as the neighbourhood graph, behind a toggle in the pane's working
 * header, beside the action that starts the add workflow. The list groups
 * by direction and then by relationship type, in model order, and every
 * row carries the affordance to remove it. All of it is re-read from the
 * model on every render; the chosen view is the pane's own transient
 * state.
 */

import { nodeOf, relationshipsOf } from './model.js';
import { RELATIONSHIP_TYPES } from './metamodel.js';
import { relationshipOptions } from './flows.js';
import { el, icon } from './dom.js';

/**
 * The rows the list draws: per direction, the relationships grouped by
 * type in the order the model holds them, each with its far end resolved.
 * @param {import('./model.js').Model} model
 * @param {string|null} id
 * @returns {{ outgoing: Array<{ label: string, rows: Array<{ relationship: import('./model.js').Relationship, other: import('./model.js').Entity }> }>,
 *             incoming: Array<{ label: string, rows: Array<{ relationship: import('./model.js').Relationship, other: import('./model.js').Entity }> }> }}
 */
export function groupedRelationships(model, id) {
  const { outgoing, incoming } = relationshipsOf(model, id);
  const grouped = (relationships, farEnd) => {
    const groups = [];
    const held = new Map();
    for (const relationship of relationships) {
      if (!held.has(relationship.type)) {
        const group = { label: RELATIONSHIP_TYPES[relationship.type].label, rows: [] };
        held.set(relationship.type, group);
        groups.push(group);
      }
      held.get(relationship.type).rows.push({
        relationship,
        other: /** @type {import('./model.js').Entity} */ (nodeOf(model, farEnd(relationship))),
      });
    }
    return groups;
  };
  return {
    outgoing: grouped(outgoing, (relationship) => relationship.target),
    incoming: grouped(incoming, (relationship) => relationship.source),
  };
}

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {HTMLElement} context.head
 * @param {HTMLElement} context.body
 * @param {{ element: HTMLElement, render: () => void }} context.graph
 * @param {() => void} context.onAdd
 * @param {(relationship: import('./model.js').Relationship) => void} context.onUnrelate
 * @param {(id: string) => void} context.onSelect
 */
export function createRelationshipsView({ store, head, body, graph, onAdd, onUnrelate, onSelect }) {
  /** @type {'list'|'graph'} the pane's own transient state */
  let view = 'list';

  const listHost = el('div', { className: 'rel-list' });
  body.appendChild(listHost);
  body.appendChild(graph.element);

  function renderHead(entity) {
    head.textContent = '';
    head.hidden = false;

    const switcher = el('div', { className: 'switcher', attributes: { role: 'group', 'aria-label': 'Relationship view' } });
    for (const [value, label] of [['list', 'List'], ['graph', 'Graph']]) {
      const button = el('button', {
        className: `switcher-button${view === value ? ' selected' : ''}`,
        text: label,
        attributes: { type: 'button', 'aria-pressed': String(view === value) },
      });
      button.addEventListener('click', () => {
        if (view === value) return;
        view = value;
        render();
      });
      switcher.appendChild(button);
    }
    head.appendChild(el('div', { className: 'pane-head-name' }, [switcher]));

    const add = el('button', { className: 'ghost-button', text: 'Add…', attributes: { type: 'button' } });
    add.disabled = relationshipOptions(store.model(), entity.id).length === 0;
    add.addEventListener('click', onAdd);
    head.appendChild(el('div', { className: 'pane-head-actions' }, [add]));
  }

  function endpoint(entity) {
    const parts = [el('span', { className: 'mono designation', text: entity.id })];
    const title = (entity.attributes.title ?? '').trim();
    if (title) parts.push(el('span', { className: 'row-title', text: title }));
    return parts;
  }

  function renderList(entity) {
    listHost.textContent = '';
    const groups = groupedRelationships(store.model(), entity.id);
    if (groups.outgoing.length === 0 && groups.incoming.length === 0) {
      listHost.appendChild(el('p', { className: 'pane-empty', text: 'No relationships.' }));
      return;
    }

    for (const [heading, groupList] of [['Outgoing', groups.outgoing], ['Incoming', groups.incoming]]) {
      if (groupList.length === 0) continue;
      const section = el('div', { className: 'rel-section' }, [
        el('h3', { className: 'rel-heading', text: heading }),
      ]);
      for (const group of groupList) {
        section.appendChild(el('div', { className: 'rel-type', text: group.label }));
        for (const { relationship, other } of group.rows) {
          const name = el('button', { className: 'rel-endpoint', attributes: { type: 'button' } }, endpoint(other));
          name.addEventListener('click', () => onSelect(other.id));
          const remove = el('button', {
            className: 'icon-button',
            attributes: {
              type: 'button',
              'aria-label': `Remove: ${group.label} ${other.id}`,
              title: 'Remove the relationship',
            },
          }, [icon('i-close')]);
          remove.addEventListener('click', () => onUnrelate(relationship));
          section.appendChild(el('div', { className: 'rel-row' }, [name, remove]));
        }
      }
      listHost.appendChild(section);
    }
  }

  function render() {
    const entity = nodeOf(store.model(), store.selection());
    if (!entity || entity.kind !== 'entity') {
      head.hidden = true;
      head.textContent = '';
      listHost.hidden = false;
      graph.element.hidden = true;
      listHost.textContent = '';
      listHost.appendChild(
        el('p', {
          className: 'pane-empty',
          text: store.hasProject() ? 'Select an entity to see its relationships.' : 'No project is open.',
        })
      );
      return;
    }

    renderHead(entity);
    listHost.hidden = view !== 'list';
    graph.element.hidden = view !== 'graph';
    if (view === 'list') renderList(entity);
    else graph.render();
  }

  store.subscribe(render);
  render();

  return { render };
}
