/**
 * Popup menus drawn from item lists, over the overlay: one open path for
 * the theme menu, the creation offer, and the context menu. A menu knows
 * nothing about the model — it renders labels, states, and picks.
 */

import { el, icon } from './dom.js';

/**
 * @typedef {Object} MenuItem
 * @property {string} label
 * @property {string} [group]    a heading over consecutive items sharing it
 * @property {string} [icon]     a sprite symbol drawn before the label
 * @property {string} [pillar]   tints the icon with the pillar's colour
 * @property {string} [hint]     a right-aligned hint: a key, a code, a form
 * @property {boolean} [danger]
 * @property {boolean} [disabled]
 * @property {boolean} [checked]  renders the item as a radio entry
 * @property {() => void} onPick
 */

/**
 * The heading groups a flat item list renders as: a heading precedes the
 * items whose group differs from the group before them.
 * @param {MenuItem[]} items
 * @returns {Array<{ heading: string|null, items: MenuItem[] }>}
 */
export function menuGroups(items) {
  const groups = [];
  for (const item of items) {
    const heading = item.group ?? null;
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) last.items.push(item);
    else groups.push({ heading, items: [item] });
  }
  return groups;
}

/**
 * Open a menu above the page. It closes itself on a pick; Escape and the
 * pointer are the overlay's business.
 * @param {Object} spec
 * @param {ReturnType<import('./overlay.js').createOverlay>} spec.overlay
 * @param {string} spec.label   the menu's accessible name
 * @param {MenuItem[]} spec.items
 * @param {HTMLElement} [spec.anchor]  opens against this element, which toggles aria-expanded
 * @param {'start'|'end'} [spec.align]  which edge of the anchor the menu shares
 * @param {{ x: number, y: number }} [spec.at]  opens at this point instead
 * @param {() => void} [spec.onClose]
 * @returns {import('./overlay.js').Entry}
 */
export function openMenu({ overlay, label, items, anchor = null, align = 'start', at = null, onClose = null }) {
  const menu = el('div', { className: 'dropdown', attributes: { role: 'menu', 'aria-label': label } });

  for (const group of menuGroups(items)) {
    if (group.heading !== null) {
      menu.appendChild(el('div', { className: 'menu-heading', text: group.heading }));
    }
    for (const item of group.items) {
      const attributes = {
        type: 'button',
        role: item.checked === undefined ? 'menuitem' : 'menuitemradio',
      };
      if (item.checked !== undefined) attributes['aria-checked'] = String(item.checked);
      const button = el('button', { className: `menu-entry${item.danger ? ' danger' : ''}`, attributes }, [
        ...(item.icon ? [icon(item.icon, item.pillar)] : []),
        el('span', { className: 'menu-entry-label', text: item.label }),
        ...(item.hint ? [el('span', { className: 'menu-hint', text: item.hint })] : []),
      ]);
      if (item.disabled) button.disabled = true;
      button.addEventListener('click', () => {
        overlay.close(entry);
        item.onPick();
      });
      menu.appendChild(button);
    }
  }

  menu.addEventListener('keydown', (event) => {
    const entries = [...menu.querySelectorAll('.menu-entry')].filter((button) => !button.disabled);
    if (entries.length === 0) return;
    const from = entries.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : entries.length - 1;
      entries[(from + step + entries.length) % entries.length].focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      entries[0].focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      entries[entries.length - 1].focus();
    }
  });

  const entry = overlay.open({
    kind: 'menu',
    element: menu,
    opener: anchor ?? undefined,
    onClose() {
      if (anchor) anchor.setAttribute('aria-expanded', 'false');
      if (onClose) onClose();
    },
  });
  if (anchor) anchor.setAttribute('aria-expanded', 'true');

  const wanted = at ?? {
    x: align === 'end' ? anchor.getBoundingClientRect().right - menu.offsetWidth : anchor.getBoundingClientRect().left,
    y: anchor.getBoundingClientRect().bottom,
  };
  const clampedX = Math.max(8, Math.min(wanted.x, document.documentElement.clientWidth - menu.offsetWidth - 8));
  const clampedY = Math.max(8, Math.min(wanted.y, document.documentElement.clientHeight - menu.offsetHeight - 8));
  menu.style.left = `${clampedX}px`;
  menu.style.top = `${clampedY}px`;

  const first = menu.querySelector('[aria-checked="true"]') ?? menu.querySelector('.menu-entry:not(:disabled)');
  first?.focus();

  return entry;
}
