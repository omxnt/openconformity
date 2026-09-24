/**
 * Carbon's multiselect, opened under a field: a listbox of every value
 * offered, each with its checkbox, any number chosen. A choice toggles
 * without closing; Escape, or a pointer outside, closes. It stacks on
 * the overlay as a menu does, so it draws over the panes, closes with
 * them, and hands focus back to its field.
 */

import { el, icon } from './dom.js';

/**
 * @param {Object} spec
 * @param {ReturnType<import('./overlay.js').createOverlay>} spec.overlay
 * @param {HTMLElement} spec.anchor  the field, which toggles aria-expanded
 * @param {string} spec.label  the listbox's accessible name
 * @param {string[]} spec.options  every value, in order
 * @param {Set<string>} spec.chosen  the values chosen, changed in place
 * @param {() => void} spec.onChange  told after each toggle
 */
export function openMultiSelect({ overlay, anchor, label, options, chosen, onChange }) {
  const list = el('div', {
    className: 'dropdown listbox',
    attributes: { role: 'listbox', 'aria-label': label, 'aria-multiselectable': 'true' },
  });
  const rows = options.map((option) => {
    const row = el(
      'button',
      { className: 'menu-entry option', attributes: { type: 'button', role: 'option', 'aria-selected': String(chosen.has(option)) } },
      [el('span', { className: 'checkbox' }, [icon('i-checkmark')]), el('span', { className: 'menu-entry-label', text: option })]
    );
    row.addEventListener('click', () => {
      if (chosen.has(option)) chosen.delete(option);
      else chosen.add(option);
      row.setAttribute('aria-selected', String(chosen.has(option)));
      onChange();
    });
    return row;
  });
  for (const row of rows) list.appendChild(row);

  list.addEventListener('keydown', (event) => {
    const from = rows.indexOf(document.activeElement);
    const to =
      event.key === 'ArrowDown' ? (from + 1) % rows.length
      : event.key === 'ArrowUp' ? (from - 1 + rows.length) % rows.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? rows.length - 1
      : -1;
    if (to < 0) return;
    event.preventDefault();
    rows[to].focus();
  });

  const entry = overlay.open({
    kind: 'menu',
    element: list,
    opener: anchor,
    onClose() {
      anchor.setAttribute('aria-expanded', 'false');
    },
  });
  anchor.setAttribute('aria-expanded', 'true');

  const rect = anchor.getBoundingClientRect();
  list.style.minWidth = `${Math.round(rect.width)}px`;
  const x = Math.max(8, Math.min(rect.left, document.documentElement.clientWidth - list.offsetWidth - 8));
  const y = Math.max(8, Math.min(rect.bottom, document.documentElement.clientHeight - list.offsetHeight - 8));
  list.style.left = `${x}px`;
  list.style.top = `${y}px`;

  (rows.find((row) => row.getAttribute('aria-selected') === 'true') ?? rows[0])?.focus();
  return entry;
}
