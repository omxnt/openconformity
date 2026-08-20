/**
 * The relationship pane: the selected entity's relationships as two
 * tables, Outgoing and Incoming, each behind a compact fold and both
 * sharing one fixed column skeleton so they can never misalign — or as
 * the neighbourhood graph, the pane's default view, behind a toggle in
 * the working header. Every row reads as the fact it records, the
 * subject standing in the source or the target column as the direction
 * has it, and carries the affordance to remove it.
 *
 * The table is also the picker: while the store holds a picker for this
 * pane's subject, each pick lands immediately as a provisional row in
 * its right place — pending-styled, its ambiguity choice inline — and
 * Done and Cancel sit in the pane head. The pane pins the picker's
 * subject: the selection may move while picking, the tables stay. All
 * of it is re-read from the model on every render; the chosen view is
 * store session state, one truth for the switcher here and the View
 * menu.
 */

import { nodeOf, relationshipsOf } from './model.js';
import { ENTITY_TYPES, RELATIONSHIP_TYPES } from './metamodel.js';
import { pickerCandidates, pickedRows } from './relate.js';
import { formLabel, entityLabel } from './queries.js';
import { TYPE_ICONS } from './icons.js';
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
 * The table's rows, in the order the grouping ruled: outgoing before
 * incoming, each direction's relationships grouped by type in model
 * order, every row carrying its far end resolved.
 * @param {import('./model.js').Model} model
 * @param {string|null} id
 * @returns {Array<{ direction: 'outgoing'|'incoming', label: string,
 *                   relationship: import('./model.js').Relationship, other: import('./model.js').Entity }>}
 */
export function relationshipRows(model, id) {
  const groups = groupedRelationships(model, id);
  const rows = [];
  for (const [direction, groupList] of [['outgoing', groups.outgoing], ['incoming', groups.incoming]]) {
    for (const group of groupList) {
      for (const { relationship, other } of group.rows) {
        rows.push({ direction, label: group.label, relationship, other });
      }
    }
  }
  return rows;
}

/**
 * What the two tables hold, real rows and provisional ones together: a
 * pick lands after the last row of its relationship group, or opens a
 * new group at its direction's end; a pick whose pair no longer admits
 * anything falls to the stale strip. Real rows carry their
 * relationship; pending rows carry their pick.
 * @param {import('./model.js').Model} model
 * @param {string|null} subjectId
 * @param {ReturnType<import('./store.js').createStore>['picker'] extends () => infer P ? P : never} picker
 * @returns {{ outgoing: Array<Object>, incoming: Array<Object>, stale: Array<Object> }}
 */
export function relationshipTables(model, subjectId, picker) {
  const tag = (row) => ({ ...row, kind: 'real', typeId: row.relationship.type });
  const real = relationshipRows(model, subjectId).map(tag);
  const tables = {
    outgoing: real.filter((row) => row.direction === 'outgoing'),
    incoming: real.filter((row) => row.direction === 'incoming'),
    stale: [],
  };
  if (picker === null || picker.subject !== subjectId) return tables;

  for (const pick of pickedRows(model, picker)) {
    const other = nodeOf(model, pick.id);
    if (!other || other.kind !== 'entity') continue;
    if (pick.form === null) {
      tables.stale.push({ kind: 'pending', direction: null, label: 'No longer possible', typeId: null, other, pick });
      continue;
    }
    const row = {
      kind: 'pending',
      direction: pick.form.direction,
      label: RELATIONSHIP_TYPES[pick.form.typeId].label,
      typeId: pick.form.typeId,
      other,
      pick,
    };
    const rows = tables[row.direction];
    let at = -1;
    rows.forEach((held, index) => {
      if (held.typeId === row.typeId) at = index;
    });
    if (at === -1) rows.push(row);
    else rows.splice(at + 1, 0, row);
  }
  return tables;
}

/**
 * One section's rows as the table presents them: filtered by the far
 * end's designation, its title, or the relationship label, then sorted
 * by the chosen column — or left in the grouped order while no sort is
 * chosen. Pending rows take part like the rest.
 * @param {Array<Object>} rows
 * @param {{ column: 'entity'|'relationship', direction: 'asc'|'desc' }|null} sort
 * @param {string} filter
 * @returns {Array<Object>}
 */
export function presentedRows(rows, sort, filter) {
  const query = (filter ?? '').trim().toLowerCase();
  let held = rows;
  if (query !== '') {
    held = held.filter((row) => {
      const label = entityLabel(row.other).toLowerCase();
      return (
        row.other.id.toLowerCase().includes(query) ||
        label.includes(query) ||
        row.label.toLowerCase().includes(query)
      );
    });
  }
  if (sort !== null) {
    const key =
      sort.column === 'relationship'
        ? (row) => row.label
        : (row) => {
            const label = entityLabel(row.other);
            return label ? `${row.other.id}  ${label}` : row.other.id;
          };
    held = [...held].sort((a, b) => key(a).localeCompare(key(b)) * (sort.direction === 'desc' ? -1 : 1));
  }
  return held;
}

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {HTMLElement} context.head
 * @param {HTMLElement} context.body
 * @param {{ element: HTMLElement, render: () => void }} context.graph
 * @param {() => void} context.onAdd
 * @param {(subject: string, picks: Array<{ id: string, form: { typeId: string, direction: string }|null }>) => void} context.onDone
 * @param {(relationship: import('./model.js').Relationship) => void} context.onUnrelate
 * @param {(id: string) => void} context.onSelect
 * @param {() => boolean} context.addEnabled  the relate action's own enablement: no surface re-derives it
 */
export function createRelationshipsView({ store, head, body, graph, onAdd, onDone, onUnrelate, onSelect, addEnabled }) {
  /**
   * The pane's own transients, gone with the visit: a sort per table, the
   * filter behind the head's magnifier, and each table's fold.
   * @type {{ outgoing: { column: string, direction: string }|null, incoming: { column: string, direction: string }|null }}
   */
  const tableSort = { outgoing: null, incoming: null };
  let tableFilter = '';
  let searchOpen = false;
  const collapsed = { outgoing: false, incoming: false };

  const listHost = el('div', { className: 'rel-list' });
  body.appendChild(listHost);
  body.appendChild(graph.element);

  /**
   * The head's filter, on demand: a magnifier opens a compact field,
   * focused; Escape closes and clears, so does leaving it empty.
   */
  function searchControl() {
    if (!searchOpen) {
      return headIcon('Filter the list', 'i-search', () => {
        searchOpen = true;
        render();
        head.querySelector('.head-search')?.focus();
      });
    }
    const input = el('input', {
      className: 'field-input head-search',
      attributes: { type: 'search', placeholder: 'Filter', autocomplete: 'off', 'aria-label': 'Filter the relationships' },
    });
    input.value = tableFilter;
    input.addEventListener('input', () => {
      tableFilter = input.value;
      renderBody();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      searchOpen = false;
      tableFilter = '';
      render();
    });
    input.addEventListener('blur', () => {
      if (input.value.trim() !== '') return;
      searchOpen = false;
      tableFilter = '';
      render();
    });
    return input;
  }

  /** A neutral icon-only head action with a tooltip, like the toolbar's. */
  function headIcon(label, iconId, onPick) {
    const button = el(
      'button',
      { className: 'ghost-button ghost-icon', attributes: { type: 'button', title: label, 'aria-label': label } },
      [icon(iconId)]
    );
    button.addEventListener('click', onPick);
    return button;
  }

  function renderHead(picking) {
    head.textContent = '';
    head.hidden = false;

    const view = store.relationshipView();
    const switcher = el('div', { className: 'switcher', attributes: { role: 'group', 'aria-label': 'Relationship view' } });
    for (const [value, label] of [['list', 'List'], ['graph', 'Graph']]) {
      const button = el('button', {
        className: `switcher-button${view === value ? ' selected' : ''}`,
        text: label,
        attributes: { type: 'button', 'aria-pressed': String(view === value) },
      });
      button.addEventListener('click', () => store.setRelationshipView(value));
      switcher.appendChild(button);
    }
    head.appendChild(el('div', { className: 'pane-head-name' }, [switcher]));

    const actions = [];
    if (store.relationshipView() === 'list') actions.push(searchControl());
    if (picking) {
      const done = el('button', { className: 'form-button button-primary', text: 'Done', attributes: { type: 'button' } });
      done.disabled = store.picker().picks.length === 0;
      done.addEventListener('click', () => {
        const current = store.picker();
        if (current !== null && current.picks.length > 0) onDone(current.subject, current.picks);
      });
      const cancel = el('button', { className: 'ghost-button', text: 'Cancel', attributes: { type: 'button' } });
      cancel.addEventListener('click', () => store.endPicking());
      actions.push(done, cancel);
    } else {
      const add = headIcon('Add relationship', 'i-add-relationship', onAdd);
      add.disabled = !addEnabled();
      actions.push(add);
    }
    head.appendChild(el('div', { className: 'pane-head-actions' }, actions));
  }

  function endpoint(entity) {
    const parts = [
      icon(TYPE_ICONS[entity.type], ENTITY_TYPES[entity.type].pillar),
      el('span', { className: 'mono designation', text: entity.id }),
    ];
    const label = entityLabel(entity);
    if (label) parts.push(el('span', { className: 'row-title', text: label }));
    return parts;
  }

  /**
   * Carbon's empty state: what this place holds, and the way to put the
   * first thing in it.
   * @param {string} title
   * @param {string} body
   * @param {{ label: string, icon: string, onPick: () => void }} [action]
   */
  function emptyState(title, body, action) {
    const held = el('div', { className: 'empty-state' }, [
      el('p', { className: 'empty-state-title', text: title }),
      el('p', { className: 'empty-state-body', text: body }),
    ]);
    if (action) {
      const button = el('button', { className: 'ghost-button', attributes: { type: 'button' } }, [
        icon(action.icon),
        el('span', { text: action.label }),
      ]);
      button.addEventListener('click', action.onPick);
      held.appendChild(button);
    }
    return held;
  }

  /** The subject's own cell: its tinted icon, its text receding — you are here. */
  function subjectCell(subject) {
    const label = entityLabel(subject);
    const parts = [
      icon(TYPE_ICONS[subject.type], ENTITY_TYPES[subject.type].pillar),
      el('span', { className: 'mono designation', text: subject.id }),
    ];
    if (label) parts.push(el('span', { className: 'row-title', text: label }));
    return el('td', { className: 'wrap' }, [el('span', { className: 'cell-entity cell-subject' }, parts)]);
  }

  /**
   * A real row: the recorded fact, selecting its far end. In the default
   * view it carries its unlink; while picking it recedes and the unlink
   * is withheld — removals happen in the default view only.
   */
  function realRow(row, subject, picking) {
    const { label, relationship, other } = row;
    const said = entityLabel(other);
    const rowElement = el('tr', {
      className: picking ? 'receded' : '',
      attributes: { tabindex: '0', 'aria-label': `Select ${other.id}${said ? `, ${said}` : ''}` },
    });
    rowElement.addEventListener('click', () => onSelect(other.id));
    rowElement.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onSelect(other.id);
    });

    const otherCell = el('td', { className: 'wrap' }, [el('span', { className: 'cell-entity' }, endpoint(other))]);
    const relationshipCell = el('td', { className: 'rel-label', text: label });
    if (row.direction === 'outgoing') {
      rowElement.append(subjectCell(subject), relationshipCell, otherCell);
    } else {
      rowElement.append(otherCell, relationshipCell, subjectCell(subject));
    }

    if (picking) {
      rowElement.appendChild(el('td', { className: 'shrink' }));
      return rowElement;
    }
    const remove = el('button', {
      className: 'icon-button',
      attributes: {
        type: 'button',
        'aria-label': `Remove the ${label} relationship with ${other.id}`,
        title: 'Remove relationship',
      },
    }, [icon('i-remove-relationship')]);
    remove.addEventListener('click', (event) => {
      event.stopPropagation();
      onUnrelate(relationship);
    });
    rowElement.appendChild(el('td', { className: 'shrink' }, [remove]));
    return rowElement;
  }

  /**
   * A provisional row: a pick where it will land, pending-styled, its
   * ambiguity choice inline, and the unpick where the unlink would be.
   */
  function pendingRow(row, subject) {
    const { other, pick } = row;
    const rowElement = el('tr', { className: 'pending' });

    const check = icon('i-checkmark');
    check.classList.add('pick-check');
    const otherCell = el('td', { className: 'wrap' }, [
      el('span', { className: 'cell-entity' }, [check, ...endpoint(other)]),
    ]);

    let relationshipCell;
    if (pick.ambiguous) {
      const choice = el('select', {
        className: 'field-input pending-choice',
        attributes: { 'aria-label': `Relationship for ${other.id}` },
      });
      pick.options.forEach((option, index) => {
        choice.appendChild(el('option', { text: formLabel(option), attributes: { value: String(index) } }));
      });
      const at = pick.options.findIndex(
        (option) => option.typeId === pick.form?.typeId && option.direction === pick.form?.direction
      );
      if (at >= 0) choice.value = String(at);
      choice.addEventListener('change', () => store.setPickChoice(other.id, pick.options[Number(choice.value)]));
      relationshipCell = el('td', { className: 'rel-label' }, [choice]);
    } else {
      relationshipCell = el('td', { className: 'rel-label', text: row.label });
    }

    if (row.direction === 'incoming') {
      rowElement.append(otherCell, relationshipCell, subjectCell(subject));
    } else {
      rowElement.append(subjectCell(subject), relationshipCell, otherCell);
    }

    const unpick = el('button', {
      className: 'icon-button neutral',
      attributes: { type: 'button', 'aria-label': `Unpick ${other.id}`, title: 'Unpick' },
    }, [icon('i-close')]);
    unpick.addEventListener('click', () => store.togglePick(other.id));
    rowElement.appendChild(el('td', { className: 'shrink' }, [unpick]));
    return rowElement;
  }

  /** A column head that sorts its own table: none, ascending, descending, none. */
  function sortableHeader(label, column, direction) {
    const sort = tableSort[direction];
    const active = sort !== null && sort.column === column;
    const header = el('th', {
      attributes: { 'aria-sort': active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none' },
    });
    const button = el('button', { className: 'th-sort', attributes: { type: 'button' } }, [
      el('span', { text: label }),
      ...(active ? [icon(sort.direction === 'asc' ? 'i-move-up' : 'i-move-down')] : []),
    ]);
    button.addEventListener('click', () => {
      if (!active) tableSort[direction] = { column, direction: 'asc' };
      else if (sort.direction === 'asc') tableSort[direction] = { column, direction: 'desc' };
      else tableSort[direction] = null;
      renderBody();
    });
    header.appendChild(button);
    return header;
  }

  /** The shared column skeleton, so the two tables can never misalign. */
  function columns() {
    return el('colgroup', {}, [
      el('col', { className: 'col-entity' }),
      el('col', { className: 'col-relationship' }),
      el('col', { className: 'col-entity' }),
      el('col', { className: 'col-action' }),
    ]);
  }

  /**
   * One direction's table under its fold: a compact accordion heading,
   * then the fixed-layout table both directions share the widths of.
   * The split carries direction; the subject stands in the source or
   * the target column as the direction has it.
   */
  function section(direction, labelText, rows, subject, picking) {
    const open = !collapsed[direction];
    const heading = el('button', {
      className: 'rel-fold',
      attributes: { type: 'button', 'aria-expanded': String(open) },
    }, [
      icon(open ? 'i-chevron-down' : 'i-chevron-right'),
      el('span', { text: `${labelText} (${rows.length})` }),
    ]);
    heading.addEventListener('click', () => {
      collapsed[direction] = open;
      renderBody();
    });
    const held = el('div', { className: 'rel-section' }, [heading]);
    if (!open) return held;

    const headers =
      direction === 'incoming'
        ? [sortableHeader('Source', 'entity', direction), sortableHeader('Relationship', 'relationship', direction), el('th', { text: 'Target' })]
        : [el('th', { text: 'Source' }), sortableHeader('Relationship', 'relationship', direction), sortableHeader('Target', 'entity', direction)];
    held.appendChild(
      el('table', { className: 'table' }, [
        columns(),
        el('thead', {}, [el('tr', {}, [...headers, el('th', { className: 'shrink' })])]),
        el('tbody', {}, rows.map((row) => (row.kind === 'pending' ? pendingRow(row, subject) : realRow(row, subject, picking)))),
      ])
    );
    return held;
  }

  /** The stale strip: picks the model no longer admits, closing the list. */
  function staleSection(rows, subject) {
    const held = el('div', { className: 'rel-section' }, [
      el('div', { className: 'rel-fold rel-fold-still', text: `No longer possible (${rows.length})` }),
    ]);
    held.appendChild(
      el('table', { className: 'table' }, [
        columns(),
        el('tbody', {}, rows.map((row) => pendingRow(row, subject))),
      ])
    );
    return held;
  }

  function renderList(subject, picker) {
    listHost.textContent = '';
    const picking = picker !== null;
    const tables = relationshipTables(store.model(), subject.id, picker);
    const empty = tables.outgoing.length === 0 && tables.incoming.length === 0 && tables.stale.length === 0;

    if (picking) {
      const offered = pickerCandidates(store.model(), picker).size;
      listHost.appendChild(
        el('p', {
          className: 'picking-note',
          text:
            offered === 0
              ? `Nothing in the model can take a relationship with ${subject.id} yet.`
              : `${offered} ${offered === 1 ? 'row offers itself' : 'rows offer themselves'} in the navigator; the rest are dimmed. Picking again lets go.`,
        })
      );
    } else if (empty) {
      listHost.appendChild(
        emptyState('No relationships', `${subject.id} is not related to anything yet.`, {
          label: 'Add relationship',
          icon: 'i-add-relationship',
          onPick: onAdd,
        })
      );
      return;
    }

    const outgoing = presentedRows(tables.outgoing, tableSort.outgoing, tableFilter);
    const incoming = presentedRows(tables.incoming, tableSort.incoming, tableFilter);
    const stale = presentedRows(tables.stale, null, tableFilter);
    if (outgoing.length > 0) listHost.appendChild(section('outgoing', 'Outgoing', outgoing, subject, picking));
    if (incoming.length > 0) listHost.appendChild(section('incoming', 'Incoming', incoming, subject, picking));
    if (stale.length > 0) listHost.appendChild(staleSection(stale, subject));
    if (!empty && outgoing.length + incoming.length + stale.length === 0) {
      listHost.appendChild(el('p', { className: 'picking-note', text: 'Nothing matches the filter.' }));
    }
  }

  /** Refresh the body alone, so typing in the head's filter keeps its focus. */
  function renderBody() {
    const picker = store.picker();
    const subjectId = picker !== null ? picker.subject : store.selection();
    const subject = nodeOf(store.model(), subjectId);
    if (!subject || subject.kind !== 'entity') return;
    if (store.relationshipView() === 'list') renderList(subject, picker);
  }

  function render() {
    const picker = store.picker();
    const subjectId = picker !== null ? picker.subject : store.selection();
    const subject = nodeOf(store.model(), subjectId);
    if (!subject || subject.kind !== 'entity') {
      head.hidden = true;
      head.textContent = '';
      listHost.hidden = false;
      graph.element.hidden = true;
      listHost.textContent = '';
      listHost.appendChild(
        store.hasProject()
          ? emptyState('Nothing selected', 'Select an entity to see its relationships.')
          : emptyState('No project', 'Create or open a project to work with relationships.')
      );
      return;
    }

    renderHead(picker !== null);
    const view = store.relationshipView();
    listHost.hidden = view !== 'list';
    graph.element.hidden = view !== 'graph';
    if (view === 'list') renderList(subject, picker);
    else graph.render();
  }

  store.subscribe(render);
  render();

  return { render };
}
