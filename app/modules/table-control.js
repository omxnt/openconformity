/**
 * A table attribute: its rows under the column names as read, each cell
 * as its kind shows it, and in an edit the rows as fields with a button
 * removing each and one adding a row, the table riding in a hidden
 * control the draft reads.
 */

import { el, icon } from './dom.js';
import { tableRows, joinTable } from './fields.js';

/** How wide a column is: as its values and no wider for a date, a choice or a number, brief for a text, and a multiline taking the rest. */
export const columnWidth = (column) => (column.kind === 'date' || column.kind === 'choice' || column.kind === 'number' ? 'fit' : column.kind === 'text' ? 'brief' : '');

/** A table attribute's table: the row number, then a head per column, the cells given per row, each column as wide as its kind wants. */
export function tableOf(definition, rows, trailing = null) {
  for (const cells of rows) cells.forEach((cell, c) => cell.classList.add(...[columnWidth(definition.columns[c])].filter(Boolean)));
  return el('table', { className: 'data rows' }, [
    el('thead', {}, [el('tr', {}, [el('th', { className: 'no', text: 'No.' }), ...definition.columns.map((column) => el('th', { className: columnWidth(column), text: column.name })), ...(trailing ? [el('th', { text: '' })] : [])])]),
    el('tbody', {}, rows.map((cells, i) => el('tr', {}, [el('td', { className: 'no', text: String(i + 1) }), ...cells, ...(trailing ? [trailing(i)] : [])]))),
  ]);
}

/** A cell of a table as read: a choice as a tag, a multiline as prose keeping its breaks, anything else its text, an empty one the dash. */
export function tableCell(column, cell) {
  if (cell === '') return el('td', { className: 'empty', text: '–' });
  if (column.kind === 'choice') return el('td', {}, [el('span', { className: 'tag', text: cell })]);
  return el('td', { className: column.kind === 'multiline' ? 'prose' : '', text: cell });
}

/**
 * A table attribute in an edit: its rows as fields under the column
 * names, a button at each row's end removing it and one beneath adding
 * a row, focused on its first cell. The rows are kept as the table is
 * stored in one hidden control carrying the key, updated as any cell
 * changes.
 */
export function tableControl(definition, value) {
  const rows = tableRows(definition, value);
  const hidden = el('input', { attributes: { type: 'hidden', 'data-key': definition.key } });
  const wrap = el('div', { className: 'cell-table' });
  const keep = () => {
    hidden.value = joinTable(definition, rows);
  };
  const cellField = (column, r, c) => {
    const label = `${column.name}, row ${r + 1}`;
    let field;
    if (column.kind === 'choice') {
      field = el('select', { className: 'field-input', attributes: { 'aria-label': label } });
      field.appendChild(el('option', { text: '–', attributes: { value: '' } }));
      for (const choice of column.values ?? []) field.appendChild(el('option', { text: choice, attributes: { value: choice } }));
      field.value = (column.values ?? []).includes(rows[r][c]) ? rows[r][c] : '';
    } else if (column.kind === 'multiline') {
      field = el('textarea', { className: 'field-input', attributes: { rows: '1', 'aria-label': label } });
      field.value = rows[r][c];
      const grow = () => {
        field.style.height = 'auto';
        field.style.height = `${field.scrollHeight}px`;
      };
      field.addEventListener('input', grow);
      requestAnimationFrame(grow);
    } else {
      field = el('input', { className: 'field-input', attributes: { type: column.kind === 'date' ? 'date' : column.kind === 'number' ? 'number' : 'text', 'aria-label': label } });
      field.value = rows[r][c];
    }
    for (const kind of ['input', 'change']) {
      field.addEventListener(kind, () => {
        rows[r][c] = field.value;
        keep();
      });
    }
    return el('td', { className: 'field' }, [field]);
  };
  const paint = (focusRow = -1) => {
    keep();
    wrap.textContent = '';
    const table = tableOf(
      definition,
      rows.map((row, r) => row.map((cell, c) => cellField(definition.columns[c], r, c))),
      (r) => {
        const remove = el('button', { className: 'icon-button', attributes: { type: 'button', 'aria-label': `Remove row ${r + 1}` } }, [icon('i-delete')]);
        remove.addEventListener('click', () => {
          rows.splice(r, 1);
          paint();
          hidden.dispatchEvent(new Event('input', { bubbles: true }));
        });
        return el('td', { className: 'remove' }, [remove]);
      }
    );
    const add = el('button', { className: 'ghost-button', attributes: { type: 'button' } }, [icon('i-new-entity'), el('span', { text: 'Add row' })]);
    add.addEventListener('click', () => {
      rows.push(definition.columns.map(() => ''));
      paint(rows.length - 1);
    });
    wrap.append(...(rows.length > 0 ? [table] : []), add, hidden);
    if (focusRow >= 0) wrap.querySelector(`tbody tr:nth-child(${focusRow + 1}) .field-input`)?.focus();
  };
  paint();
  return wrap;
}
