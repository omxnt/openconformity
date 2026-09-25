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
 * store session state, one truth for the tabs here and the View
 * menu.
 */

import { nodeOf, relationshipsOf } from './model.js';
import { ENTITY_TYPES, RELATIONSHIP_TYPES } from './metamodel.js';
import { pickerCandidates, pickedRows } from './relate.js';
import { formLabel, entityLabel, entityMatches } from './queries.js';
import { TYPE_ICONS } from './icons.js';
import { el, icon, tabKeys, tooltipTag, tooltipOn } from './dom.js';
import { statusIcon } from './rating.js';
import { findings, staleText, tabNameOf } from './records.js';

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
    held = held.filter((row) => entityMatches(row.other, query) || row.label.toLowerCase().includes(query));
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
/**
 * The messages as the pane's table shows them: the findings under the
 * head's filter, matched on the entity's identifier and label, the
 * record's name and the identifiers out of step, and under the chosen
 * sort, by the entity's identifier or the message; the model's order
 * otherwise.
 * @param {import('./records.js').Finding[]} found
 * @param {{ column: 'entity'|'message', direction: 'asc'|'desc' }|null} sort
 * @param {string} filter
 */
export function messageRows(found, sort, filter) {
  const needle = filter.trim().toLowerCase();
  const rows = found.filter((finding) => {
    if (needle === '') return true;
    const text = [finding.id, finding.label, finding.definition.name, finding.definition.recorded, ...finding.states.map(({ id }) => id)].join(' ').toLowerCase();
    return text.includes(needle);
  });
  if (sort === null) return rows;
  const keyOf = { entity: (finding) => finding.id, message: (finding) => finding.text }[sort.column];
  const sign = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => sign * keyOf(a).localeCompare(keyOf(b)));
}

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
  const messagesHost = el('div', { className: 'rel-list' });
  /** @type {{ column: 'entity'|'message', direction: 'asc'|'desc' }|null} */
  let messagesSort = null;
  body.appendChild(listHost);
  body.appendChild(messagesHost);
  for (const region of [head, body]) {
    region.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !store.messagesOpen()) return;
      event.preventDefault();
      store.setMessagesOpen(false);
    });
  }
  body.appendChild(graph.element);

  /**
   * The head's filter, on demand: a magnifier opens a compact field,
   * focused; Escape closes and clears, so does leaving it empty.
   */
  function searchControl() {
    const filterLabel = store.messagesOpen() ? 'Filter the messages' : 'Filter the relationships';
    if (!searchOpen) {
      return headIcon(filterLabel, 'i-search', () => {
        searchOpen = true;
        render();
        head.querySelector('.head-search')?.focus();
      });
    }
    const input = el('input', {
      className: 'field-input head-search',
      attributes: { type: 'search', placeholder: 'Filter', autocomplete: 'off', 'aria-label': filterLabel },
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

  /** A neutral icon-only head action with its label as its tooltip, hanging from its end since the actions stand at the right. */
  function headIcon(label, iconId, onPick) {
    const button = el('button', { className: 'ghost-button ghost-icon', attributes: { type: 'button' } }, [icon(iconId)]);
    button.addEventListener('click', onPick);
    return tooltipOn(button, label, { align: 'end' });
  }

  /** The chevron that collapses the pane to its head, or expands it again. */
  function collapseToggle() {
    const collapsed = store.relationshipsCollapsed();
    const toggle = headIcon(collapsed ? 'Expand the pane' : 'Collapse the pane', 'i-chevron-down', () => store.setRelationshipsCollapsed(!collapsed));
    toggle.classList.add('pane-collapse');
    toggle.setAttribute('aria-expanded', String(!collapsed));
    return toggle;
  }

  function renderHead(picking) {
    head.textContent = '';
    head.hidden = false;

    const view = store.relationshipView();
    const views = [['graph', 'Graph'], ['list', 'List']];
    const tabs = el('div', { className: 'tabs head-tabs', attributes: { role: 'tablist', 'aria-label': 'Relationship view' } });
    for (const [value, label] of views) {
      const tab = el('button', {
        className: 'tab',
        text: label,
        attributes: { type: 'button', role: 'tab', 'aria-selected': String(view === value), tabindex: view === value ? '0' : '-1' },
      });
      tab.addEventListener('click', () => store.setRelationshipView(value));
      tabs.appendChild(tab);
    }
    tabKeys(tabs, (i) => {
      store.setRelationshipView(views[i][0]);
      head.querySelector('.tab[aria-selected="true"]')?.focus();
    });
    head.appendChild(tabs);

    const actions = [searchControl()];
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
    actions.push(collapseToggle());
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
    const remove = tooltipOn(el('button', { className: 'icon-button', attributes: { type: 'button' } }, [icon('i-remove-relationship')]), 'Remove relationship', {
      align: 'end',
      label: `Remove the ${label} relationship with ${other.id}`,
    });
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

    const unpick = tooltipOn(el('button', { className: 'icon-button neutral', attributes: { type: 'button' } }, [icon('i-close')]), 'Unpick', { align: 'end', label: `Unpick ${other.id}` });
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

  /**
   * The head while the messages stand over the pane: what it is and how
   * many, the filter, the close that hands the pane back, and the
   * chevron.
   * @param {number} count
   */
  function renderMessagesHead(count) {
    head.textContent = '';
    head.hidden = false;
    head.appendChild(el('span', { className: 'head-title', text: count === 0 ? 'Messages' : `Messages (${count})` }));
    head.appendChild(el('span', { className: 'toolbar-spacer' }));
    head.appendChild(el('div', { className: 'pane-head-actions' }, [searchControl(), headIcon('Close the messages', 'i-close', () => store.setMessagesOpen(false)), collapseToggle()]));
  }

  function messagesHeader(label, column) {
    const active = messagesSort !== null && messagesSort.column === column;
    const header = el('th', {
      attributes: { 'aria-sort': active ? (messagesSort.direction === 'asc' ? 'ascending' : 'descending') : 'none' },
    });
    const button = el('button', { className: 'th-sort', attributes: { type: 'button' } }, [
      el('span', { text: label }),
      ...(active ? [icon(messagesSort.direction === 'asc' ? 'i-move-up' : 'i-move-down')] : []),
    ]);
    button.addEventListener('click', () => {
      if (!active) messagesSort = { column, direction: 'asc' };
      else if (messagesSort.direction === 'asc') messagesSort = { column, direction: 'desc' };
      else messagesSort = null;
      renderBody();
    });
    header.appendChild(button);
    return header;
  }

  /**
   * One finding as a row: the entity, the entries out of step as tags
   * with the tooltips the entity's own carry, and the message the
   * entity shows beneath its record. Selecting it opens the entity on
   * the tab the record stands on, and the messages stay over the pane,
   * so the list is worked through in place.
   * @param {import('./records.js').Finding} finding
   */
  function messageRow(finding) {
    const entity = nodeOf(store.model(), finding.id);
    const words = staleText(finding.definition.recorded);
    const tags = finding.states
      .filter(({ state }) => state !== 'linked')
      .map(({ id, label, state }, i) => {
        const glyph = state === 'added' ? icon('i-information') : statusIcon(state === 'deleted' ? 'high' : 'medium');
        if (state === 'added') glyph.classList.add('status-icon', 'tone-info');
        return tooltipTag(`tag ${state}`, [glyph, el('span', { text: id })], { caption: id, main: label === id ? '' : label, note: words[state] }, i, `message-${finding.id}`);
      });
    const choose = () => {
      const tab = tabNameOf(finding.type, finding.definition.key);
      if (tab) store.setTab(finding.type, tab);
      onSelect(finding.id);
    };
    const rowElement = el('tr', { attributes: { tabindex: '0', 'aria-label': `Select ${finding.id}${finding.label ? `, ${finding.label}` : ''}` } });
    rowElement.addEventListener('click', choose);
    rowElement.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      choose();
    });
    rowElement.append(
      el('td', { className: 'wrap' }, [el('span', { className: 'cell-entity' }, entity ? endpoint(entity) : [el('span', { className: 'mono designation', text: finding.id })])]),
      el('td', { className: 'wrap tags' }, [el('span', { className: 'cell-tags' }, tags)]),
      el('td', { className: 'wrap', text: finding.text })
    );
    return rowElement;
  }

  /** The messages: every record in the model that no longer matches, one row each, whatever is selected. */
  function renderMessages(found) {
    messagesHost.textContent = '';
    if (found.length === 0) {
      messagesHost.appendChild(emptyState('Nothing to revisit', 'Every record matches what is related.'));
      return;
    }
    const rows = messageRows(found, messagesSort, tableFilter);
    if (rows.length === 0) {
      messagesHost.appendChild(el('p', { className: 'picking-note', text: 'Nothing matches the filter.' }));
      return;
    }
    messagesHost.appendChild(
      el('table', { className: 'table' }, [
        el('colgroup', {}, [el('col', { className: 'col-entity' }), el('col', {}), el('col', { className: 'col-message' })]),
        el('thead', {}, [el('tr', {}, [messagesHeader('Entity', 'entity'), el('th', { text: found[0].definition.name }), messagesHeader('Message', 'message')])]),
        el('tbody', {}, rows.map(messageRow)),
      ])
    );
  }

  /** Refresh the body alone, so typing in the head's filter keeps its focus: the list, the messages, or the graph around its subject. */
  function renderBody() {
    if (store.messagesOpen()) {
      renderMessages(findings(store.model()));
      return;
    }
    const picker = store.picker();
    const subjectId = picker !== null ? picker.subject : store.selection();
    const subject = nodeOf(store.model(), subjectId);
    if (!subject || subject.kind !== 'entity') return;
    if (store.relationshipView() === 'list') renderList(subject, picker);
    else graph.render(tableFilter);
  }

  function render() {
    const picker = store.picker();
    const subjectId = picker !== null ? picker.subject : store.selection();
    const subject = nodeOf(store.model(), subjectId);
    if (store.hasProject() && store.messagesOpen()) {
      const found = findings(store.model());
      renderMessagesHead(found.length);
      listHost.hidden = true;
      graph.element.hidden = true;
      messagesHost.hidden = false;
      renderMessages(found);
      return;
    }
    messagesHost.hidden = true;
    if (!subject || subject.kind !== 'entity') {
      head.textContent = '';
      head.hidden = !store.relationshipsCollapsed();
      if (store.relationshipsCollapsed()) {
        head.appendChild(el('span', { className: 'toolbar-spacer' }));
        head.appendChild(el('div', { className: 'pane-head-actions' }, [collapseToggle()]));
      }
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
    else graph.render(tableFilter);
  }

  store.subscribe(render);
  render();

  return { render };
}
