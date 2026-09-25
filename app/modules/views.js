/**
 * The views: the registry of what the model can be read as, and the pane
 * that shows the open one over the whole workspace. A view is a pure
 * description built from the model; this module renders any such
 * description as Carbon data tables under contained tabs for the views
 * and line tabs for the sections, sortable by column, an entity in a
 * cell a way to the editor, and prints it.
 */

import { el, icon, tooltipOn } from './dom.js';
import { ENTITY_TYPES } from './metamodel.js';
import { TYPE_ICONS } from './icons.js';
import { entityLabel } from './queries.js';
import { RISK_VIEW } from './view-risk.js';

/** Every view, in menu and tab order. */
export const VIEWS = [RISK_VIEW];

/** A column as an object, a bare name being its text. */
export const asColumn = (column) => (typeof column === 'string' ? { text: column } : column);

/**
 * A column's name in the text exports: its group, its full name and its
 * sub-line joined by a middle dot.
 */
export function columnText(column) {
  const { text, sub, group, title } = asColumn(column);
  return [group, title ?? text, sub].filter(Boolean).join(' · ');
}

/**
 * A cell as text, for sorting and the text exports.
 * @param {*} held
 * @param {(id: string) => string} labelOf  an entity's label by id
 */
export function cellText(held, labelOf) {
  if (held === null || held === undefined) return '';
  if (typeof held === 'string') return held;
  if ('entities' in held) return held.entities.map((id) => (labelOf(id) ? `${id} ${labelOf(id)}` : id)).join('; ');
  if ('code' in held) return held.code;
  if ('outcome' in held) return held.outcome?.outcome ?? '';
  if ('choice' in held) return held.choice;
  if ('choices' in held) return held.choices.join('; ');
  if ('mark' in held) return held.mark ? 'x' : '';
  if ('lines' in held) return held.lines.join('; ');
  return String(held);
}

/**
 * Rows in a sort's order: by the column's text, a number where the text
 * starts with one, empty cells last, and the given order otherwise.
 * @param {Array<{ id: string|null, cells: Array<*> }>} rows
 * @param {{ column: number, direction: 'asc'|'desc' }|null} sort
 * @param {(id: string) => string} labelOf
 */
export function sortRows(rows, sort, labelOf) {
  if (!sort) return rows;
  const key = (row) => {
    const text = cellText(row.cells[sort.column], labelOf);
    const number = parseFloat(text);
    return Number.isNaN(number) ? text.toLowerCase() : number;
  };
  const compare = (a, b) => {
    const x = key(a);
    const y = key(b);
    if ((x === '') !== (y === '')) return x === '' ? 1 : -1;
    const result = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true });
    return sort.direction === 'asc' ? result : -result;
  };
  return [...rows].sort(compare);
}

/**
 * Where each column stands in its group, for ruling the group's edges:
 * 'first', 'last', 'first last' or ''.
 * @param {Array<*>} columns
 */
export function groupEdges(columns) {
  const cells = columns.map(asColumn);
  return cells.map((column, i) => {
    if (!column.group) return '';
    const first = i === 0 || cells[i - 1].group !== column.group;
    const last = i === cells.length - 1 || cells[i + 1].group !== column.group;
    return [first ? 'first' : '', last ? 'last' : ''].filter(Boolean).join(' ');
  });
}

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {ReturnType<import('./overlay.js').createOverlay>} context.overlay
 * @param {HTMLElement} context.workspace
 * @param {HTMLElement} context.pane
 * @param {HTMLElement} context.head
 * @param {HTMLElement} context.body
 * @param {(id: string) => void} context.onSelect  an entity chosen in a view
 * @param {() => void} context.onClose
 */
export function createViewsPane({ store, overlay, workspace, pane, head, body, onSelect, onClose }) {
  /** @type {Map<string, { column: number, direction: 'asc'|'desc' }>} sort per table, keyed by view, section and table */
  const sorts = new Map();
  /** The row last scrolled to on a return, so a re-render leaves the scroll alone. */
  let revealed = null;

  const labelOf = (id) => {
    const node = store.model().nodes.get(id);
    return node ? entityLabel(node) : '';
  };

  function entityRow(id) {
    const node = store.model().nodes.get(id);
    if (!node) return el('span', { className: 'entity gone' }, [el('span', { className: 'mono', text: id })]);
    const type = ENTITY_TYPES[node.type];
    const link = el('a', { className: 'entity', attributes: { href: `#${id}`, title: type.name } }, [
      icon(TYPE_ICONS[node.type], type.pillar),
      el('span', { className: 'mono', text: id }),
      el('span', { className: 'entity-title', text: entityLabel(node) }),
    ]);
    link.addEventListener('click', (event) => {
      event.preventDefault();
      onSelect(id);
    });
    return link;
  }

  const empty = () => el('span', { className: 'empty', text: '–' });
  const tag = (text) => el('span', { className: 'tag', text });

  /**
   * The rating's outcome as the editor shows it, a tag with the tone's
   * dot, its band word left to the dot and the hover to keep the column
   * narrow: "RI 6 (highest)" reads RI 6 with a red dot, the hover naming
   * the attribute and the whole.
   */
  function outcomeTag(view) {
    return el('span', { className: `tag outcome tone-${view.tone}`, attributes: { title: view.name ? `${view.name}: ${view.outcome}` : view.outcome } }, [
      ...(view.tone === 'none' ? [] : [el('span', { className: 'risk-dot' })]),
      el('span', { text: view.outcome.replace(/\s*\([^)]*\)$/, '') }),
    ]);
  }

  function cell(held, column) {
    const narrow = column.narrow ? 'narrow' : '';
    if (held !== null && typeof held === 'object') {
      if ('entities' in held) return el('td', {}, held.entities.length === 0 ? [empty()] : held.entities.map(entityRow));
      if ('code' in held) return el('td', { className: `code ${narrow}`.trim(), text: held.code || '–', attributes: held.title ? { title: held.title } : {} });
      if ('outcome' in held) return el('td', { className: narrow }, [held.outcome?.outcome ? outcomeTag(held.outcome) : empty()]);
      if ('choice' in held) return el('td', { className: narrow }, [held.choice ? tag(held.choice) : empty()]);
      if ('choices' in held) return el('td', {}, held.choices.length === 0 ? [empty()] : [el('span', { className: 'tags' }, held.choices.map(tag))]);
      if ('mark' in held) return el('td', { className: 'mark', text: held.mark ? '●' : '' });
      if ('lines' in held) return el('td', {}, held.lines.map((line) => el('p', { text: line || '–' })));
    }
    const text = held === null || held === undefined ? '' : String(held);
    if (text === '') return el('td', {}, [empty()]);
    return el('td', { className: text.length > 40 ? 'wide' : '' }, [el('p', { text })]);
  }

  function headRows(columns, key, sortable) {
    const cells = columns.map(asColumn);
    const edges = groupEdges(columns);
    const sort = sorts.get(key) ?? null;
    const th = (column, i, extra = {}) => {
      const classes = [column.narrow ? 'narrow' : '', ...edges[i].split(' ').filter(Boolean).map((edge) => `group-${edge}`), sortable ? 'sortable' : ''].filter(Boolean).join(' ');
      const held = el('th', { className: classes, attributes: { ...(column.title ? { title: column.title } : {}), ...extra } }, [
        el('span', { text: column.text }),
        ...(column.sub ? [el('small', { text: column.sub })] : []),
      ]);
      if (!sortable) return held;
      held.setAttribute('role', 'button');
      held.setAttribute('tabindex', '0');
      if (sort?.column === i) {
        held.setAttribute('aria-sort', sort.direction === 'asc' ? 'ascending' : 'descending');
        const arrow = icon(sort.direction === 'asc' ? 'i-move-up' : 'i-move-down');
        arrow.setAttribute('class', 'icon sort');
        held.insertBefore(arrow, held.querySelector('small'));
      }
      const toggle = () => {
        const next = sort?.column !== i ? 'asc' : sort.direction === 'asc' ? 'desc' : null;
        if (next) sorts.set(key, { column: i, direction: next });
        else sorts.delete(key);
        render();
      };
      held.addEventListener('click', toggle);
      held.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggle();
      });
      return held;
    };
    if (!cells.some((column) => column.group)) return [el('tr', {}, cells.map((column, i) => th(column, i)))];
    const upper = [];
    const lower = [];
    for (let i = 0; i < cells.length; i++) {
      const column = cells[i];
      if (!column.group) {
        upper.push(th(column, i, { rowspan: '2' }));
        continue;
      }
      let span = 1;
      while (i + span < cells.length && cells[i + span].group === column.group) span++;
      upper.push(el('th', { className: 'group group-first group-last', text: column.group, attributes: { colspan: String(span) } }));
      for (let j = 0; j < span; j++) lower.push(th(cells[i + j], i + j));
      i += span - 1;
    }
    return [el('tr', {}, upper), el('tr', {}, lower)];
  }

  function table(spec, key) {
    const cells = spec.columns.map(asColumn);
    const edges = groupEdges(spec.columns);
    const sortable = spec.sortable !== false;
    const back = store.viewReturn();
    const rows = sortRows(spec.rows, sorts.get(key) ?? null, labelOf).map((row) => {
      const tr = el(
        'tr',
        {},
        row.cells.map((held, i) => {
          const td = cell(held, cells[i]);
          for (const edge of edges[i].split(' ').filter(Boolean)) td.classList.add(`group-${edge}`);
          return td;
        })
      );
      const id = row.id ?? null;
      if (id !== null) tr.dataset.id = id;
      if (back !== null && back.rowId === id) tr.classList.add('row-return');
      return tr;
    });
    return el('table', { className: spec.spec ? 'data spec' : 'data' }, [el('thead', {}, headRows(spec.columns, key, sortable)), el('tbody', {}, rows)]);
  }

  function renderHead(open) {
    head.textContent = '';
    const tabs = el('nav', { className: 'contained-tabs', attributes: { 'aria-label': 'Views' } });
    for (const view of VIEWS) {
      const tab = el('button', { className: 'ctab', text: view.name, attributes: { type: 'button', role: 'tab', 'aria-selected': String(view.id === open.id) } });
      tab.addEventListener('click', () => store.openView(view.id));
      tabs.appendChild(tab);
    }
    head.appendChild(tabs);
    const print = el('button', { className: 'ghost-button', attributes: { type: 'button' } }, [el('span', { text: 'Print' })]);
    print.addEventListener('click', () => window.print());
    const close = tooltipOn(el('button', { className: 'ghost-button ghost-icon', attributes: { type: 'button' } }, [icon('i-close')]), 'Close the view', { align: 'end' });
    close.addEventListener('click', onClose);
    head.appendChild(el('div', { className: 'pane-head-actions' }, [print, close]));
  }

  function render() {
    const open = store.view();
    const viewing = open !== null && store.hasProject();
    workspace.classList.toggle('viewing', viewing);
    pane.hidden = !viewing;
    if (!viewing) {
      revealed = null;
      return;
    }
    const view = VIEWS.find((held) => held.id === open.id) ?? VIEWS[0];
    const built = view.build(store.model());
    const section = Math.min(open.section, built.sections.length - 1);
    renderHead(open);
    body.textContent = '';
    body.appendChild(el('h1', { className: 'print-only', text: built.title }));
    if (built.sections.length > 1) {
      const tabs = el('nav', { className: 'tabs', attributes: { 'aria-label': 'Sections' } });
      built.sections.forEach((held, i) => {
        const tab = el('button', { className: 'tab', text: held.name, attributes: { type: 'button', role: 'tab', 'aria-selected': String(i === section) } });
        tab.addEventListener('click', () => store.setViewSection(i));
        tabs.appendChild(tab);
      });
      body.appendChild(tabs);
    }
    const scroll = el('div', { className: 'view-scroll' });
    built.sections.forEach((held, i) => {
      const block = el('div', { className: 'section' });
      block.hidden = i !== section;
      if (built.sections.length > 1) block.appendChild(el('h2', { className: 'print-only', text: held.name }));
      if (held.lead) block.appendChild(el('p', { className: 'lead', text: held.lead }));
      held.tables.forEach((spec, j) => block.appendChild(table(spec, `${built.id}/${i}/${j}`)));
      scroll.appendChild(block);
    });
    body.appendChild(scroll);

    const back = store.viewReturn();
    if (back !== null && back.id === built.id && revealed !== back.rowId) {
      const row = scroll.querySelector(`.section:not([hidden]) tr[data-id="${back.rowId}"]`);
      if (row) {
        row.scrollIntoView({ block: 'center' });
        revealed = back.rowId;
      }
    }
  }

  // Heard before the overlay hears it, so an Escape that closes a menu
  // or a dialog is not also the one that closes the view.
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape' || store.view() === null || overlay.isOpen()) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      onClose();
    },
    true
  );

  store.subscribe(render);
  render();
  return { render };
}
