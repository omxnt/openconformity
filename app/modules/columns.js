/**
 * Resizable columns for a fixed-layout table: a column group of the
 * widths dragged this session or the defaults, and a handle on the
 * column heads named, the last column taking what is left. Tables that
 * share a key share the widths, so two tables under one head never
 * misalign. The widths live for the session, in memory, and no project
 * file carries them.
 */

import { el } from './dom.js';
import { splitter } from './splitter.js';

/** The least a column can be dragged to. */
const MINIMUM = 64;

/** @type {Map<string, Map<number, number>>} the widths dragged this session, by table key and column */
const dragged = new Map();

/**
 * The column group: each column at the width dragged this session, or
 * its default.
 * @param {string} key
 * @param {string[]} defaults  a CSS width per column, `auto` for the one that takes what is left
 * @returns {HTMLElement}
 */
export function columnGroup(key, defaults) {
  const widths = dragged.get(key) ?? new Map();
  return el(
    'colgroup',
    {},
    defaults.map((width, i) => {
      const col = el('col');
      col.style.width = widths.has(i) ? `${widths.get(i)}px` : width;
      return col;
    })
  );
}

/**
 * Put a handle on the named column heads of a table, at the right edge
 * of each, dragged by pointer, stepped by arrow keys, returned to its
 * default by a double click.
 * @param {HTMLTableElement} table
 * @param {string} key
 * @param {number[]} resizable  the columns that get a handle
 */
export function columnHandles(table, key, resizable) {
  table.dataset.columns = key;
  const heads = [...table.querySelectorAll('thead tr:first-child th')];
  for (const i of resizable) {
    const head = heads[i];
    if (!head) continue;
    const name = head.textContent.trim() || 'the column';
    const handle = el('div', {
      className: 'splitter splitter-vertical col-splitter',
      attributes: { role: 'separator', 'aria-orientation': 'vertical', 'aria-label': `Resize the ${name} column`, tabindex: '0' },
    });
    head.appendChild(handle);
    const preset = head.getBoundingClientRect().width;
    splitter({
      splitter: handle,
      sizeAt: (event) => event.clientX - head.getBoundingClientRect().left,
      size: () => head.getBoundingClientRect().width,
      limit: () => {
        const others = heads.reduce((sum, other, j) => sum + (j < i ? other.getBoundingClientRect().width : j > i ? MINIMUM : 0), 0);
        return table.getBoundingClientRect().width - others;
      },
      minimum: MINIMUM,
      preset,
      apply: (width) => {
        const widths = dragged.get(key) ?? new Map();
        widths.set(i, Math.round(width));
        dragged.set(key, widths);
        for (const shared of document.querySelectorAll(`table[data-columns="${key}"]`)) {
          const col = shared.querySelectorAll('col')[i];
          if (col) col.style.width = `${Math.round(width)}px`;
        }
      },
      keys: ['ArrowLeft', 'ArrowRight'],
    });
  }
}
