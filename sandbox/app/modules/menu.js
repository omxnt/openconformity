/**
 * Menus: the bar across the top, and the popup menus that the toolbar and a
 * right click in the navigator both raise.
 *
 * Neither knows what its items do. Each is given a list of items and the
 * actions to run.
 */

import { clear, el, icon } from './dom.js';

/**
 * @typedef {Object} MenuItem
 * @property {string} [label]
 * @property {string} [heading]    a non-selectable section title
 * @property {string} [iconId]
 * @property {string} [shortcut]
 * @property {boolean} [separator]
 * @property {boolean} [disabled]
 * @property {() => void} [action]
 */

/**
 * @param {Object} context
 * @param {HTMLElement} context.barEl
 * @param {HTMLElement} context.layerEl
 * @param {Array<{ label: string, items: MenuItem[] }>} context.menus
 * @param {() => void} [context.onOpen]
 */
export function createMenuBar(context) {
  /** @type {HTMLElement|null} */
  let open = null;

  clear(context.barEl);
  clear(context.layerEl);

  for (const menu of context.menus) {
    const dropdown = el('div', { class: 'dropdown', role: 'menu', 'aria-label': menu.label }, buildItems(menu.items, closeAll));

    const button = el('button', {
      type: 'button',
      class: 'menubar-item',
      text: menu.label,
      'aria-haspopup': 'true',
      'aria-expanded': 'false',
      onclick: (event) => {
        event.stopPropagation();
        const wasOpen = open === dropdown;
        closeAll();
        if (!wasOpen) show(button, dropdown);
      },
      onkeydown: (event) => {
        if (event.key !== 'ArrowDown') return;
        event.preventDefault();
        if (open !== dropdown) {
          closeAll();
          show(button, dropdown);
        }
        dropdown.querySelector('.menu-entry')?.focus();
      },
    });

    dropdown.addEventListener('keydown', (event) => moveWithin(dropdown, event, () => {
      closeAll();
      button.focus();
    }));

    context.barEl.append(button);
    context.layerEl.append(dropdown);
  }

  document.addEventListener('click', closeAll);

  /**
   * @param {HTMLElement} button
   * @param {HTMLElement} dropdown
   */
  function show(button, dropdown) {
    context.onOpen?.();
    const box = button.getBoundingClientRect();
    dropdown.style.left = `${box.left}px`;
    dropdown.style.top = `${box.bottom}px`;
    dropdown.classList.add('open');
    button.setAttribute('aria-expanded', 'true');
    open = dropdown;
  }

  function closeAll() {
    for (const dropdown of context.layerEl.querySelectorAll('.dropdown')) dropdown.classList.remove('open');
    for (const button of context.barEl.querySelectorAll('.menubar-item')) button.setAttribute('aria-expanded', 'false');
    open = null;
  }

  return { closeAll };
}

/** @type {HTMLElement|null} */
let popup = null;

/**
 * Raise a popup menu, either at a point or under an element.
 * @param {Object} spec
 * @param {MenuItem[]} spec.items
 * @param {HTMLElement} [spec.anchor]  the element to hang it under
 * @param {number} [spec.x]
 * @param {number} [spec.y]
 */
export function openPopupMenu(spec) {
  closePopupMenu();
  if (spec.items.length === 0) return;

  popup = el('div', { class: 'dropdown open popup', role: 'menu' }, buildItems(spec.items, closePopupMenu));
  document.body.append(popup);

  const box = spec.anchor?.getBoundingClientRect();
  const left = box ? box.left : (spec.x ?? 0);
  const top = box ? box.bottom : (spec.y ?? 0);
  const size = popup.getBoundingClientRect();
  popup.style.left = `${Math.max(4, Math.min(left, window.innerWidth - size.width - 4))}px`;
  popup.style.top = `${Math.max(4, Math.min(top, window.innerHeight - size.height - 4))}px`;

  popup.addEventListener('keydown', (event) => moveWithin(popup, event, closePopupMenu));
  spec.anchor?.setAttribute('aria-expanded', 'true');
  popup.querySelector('.menu-entry')?.focus();

  setTimeout(() => {
    document.addEventListener('click', closePopupMenu, { once: true });
    document.addEventListener('contextmenu', closePopupMenu, { once: true });
  }, 0);
}

export function closePopupMenu() {
  if (!popup) return;
  popup.remove();
  popup = null;
  for (const button of document.querySelectorAll('[aria-haspopup="true"][aria-expanded="true"]')) {
    if (!button.classList.contains('menubar-item')) button.setAttribute('aria-expanded', 'false');
  }
}

/**
 * @param {MenuItem[]} items
 * @param {() => void} close
 * @returns {HTMLElement[]}
 */
function buildItems(items, close) {
  return items.map((item) => {
    if (item.separator) return el('div', { class: 'dropdown-separator' });
    if (item.heading) return el('div', { class: 'menu-heading', text: item.heading });
    return el('button', {
      type: 'button',
      class: 'menu-entry',
      role: 'menuitem',
      disabled: item.disabled,
      onclick: () => {
        close();
        item.action?.();
      },
    }, [
      item.iconId ? icon(item.iconId) : el('span', { class: 'menu-entry-gap' }),
      el('span', { class: 'menu-entry-label', text: item.label }),
      item.shortcut ? el('span', { class: 'shortcut', text: item.shortcut }) : null,
    ]);
  });
}

/**
 * @param {HTMLElement} container
 * @param {KeyboardEvent} event
 * @param {() => void} onEscape
 */
function moveWithin(container, event, onEscape) {
  const entries = [...container.querySelectorAll('.menu-entry:not(:disabled)')];
  const here = entries.indexOf(document.activeElement);
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    entries[(here + 1) % entries.length]?.focus();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    entries[(here - 1 + entries.length) % entries.length]?.focus();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    onEscape();
  }
}
