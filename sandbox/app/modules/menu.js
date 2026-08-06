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
 * @property {boolean} [danger]   destroys something, and is coloured for it
 * @property {string} [title]     why an item is greyed out, on hover
 * @property {MenuItem[]} [submenu]
 * @property {() => void} [action]
 */

/**
 * @param {Object} context
 * @param {HTMLElement} context.barEl
 * @param {HTMLElement} context.layerEl
 * @param {Array<{ label: string, items: MenuItem[] | (() => MenuItem[]) }>} context.menus
 * @param {() => void} [context.onOpen]
 */
export function createMenuBar(context) {
  /** @type {HTMLElement|null} */
  let open = null;

  clear(context.barEl);
  clear(context.layerEl);

  for (const menu of context.menus) {
    const dropdown = el('div', { class: 'dropdown', role: 'menu', 'aria-label': menu.label });
    // Built when the menu opens, not before: what an item does can depend on
    // what is selected, and a closed menu has no layout to anchor a submenu to.
    const fill = () => {
      clear(dropdown);
      dropdown.append(...buildItems(typeof menu.items === 'function' ? menu.items() : menu.items, closeAll));
    };

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
        if (!wasOpen) show(button, dropdown, fill);
      },
      onkeydown: (event) => {
        if (event.key !== 'ArrowDown') return;
        event.preventDefault();
        if (open !== dropdown) {
          closeAll();
          show(button, dropdown, fill);
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

  // Capture, because the navigator stops clicks from bubbling to the document
  // and a bubbling listener would leave the menu open. Popup panels sit on the
  // body rather than in the layer, so they are checked separately: tearing one
  // down on pointer down would remove the entry before its own click ran.
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (context.layerEl.contains(event.target) || context.barEl.contains(event.target)) return;
      if (popups.some((panel) => panel?.contains(event.target))) return;
      closeAll();
    },
    true
  );

  /**
   * @param {HTMLElement} button
   * @param {HTMLElement} dropdown
   */
  function show(button, dropdown, fill) {
    context.onOpen?.();
    fill();
    const box = button.getBoundingClientRect();
    dropdown.style.left = `${box.left}px`;
    dropdown.style.top = `${box.bottom}px`;
    dropdown.classList.add('open');
    button.setAttribute('aria-expanded', 'true');
    open = dropdown;
  }

  function closeAll() {
    closePopupMenu();
    for (const dropdown of context.layerEl.querySelectorAll('.dropdown')) dropdown.classList.remove('open');
    for (const button of context.barEl.querySelectorAll('.menubar-item')) button.setAttribute('aria-expanded', 'false');
    open = null;
  }

  return { closeAll };
}

/** Open popup panels, outermost first. A submenu is the next one along. */
/** @type {HTMLElement[]} */
let popups = [];

/**
 * Raise a popup menu, either at a point or against an element.
 * @param {Object} spec
 * @param {MenuItem[]} spec.items
 * @param {HTMLElement} [spec.anchor]  the element to hang it under
 * @param {number} [spec.x]
 * @param {number} [spec.y]
 */
export function openPopupMenu(spec) {
  closePopupMenu();
  if (spec.items.length === 0) return;
  openPanel(spec, 0);
}

/**
 * @param {Object} spec
 * @param {MenuItem[]} spec.items
 * @param {HTMLElement} [spec.anchor]
 * @param {boolean} [spec.beside]  hang it to the right of the anchor, not below
 * @param {number} [spec.x]
 * @param {number} [spec.y]
 * @param {number} level
 */
function openPanel(spec, level) {
  closeFrom(level);
  const panel = el('div', { class: 'dropdown open popup', role: 'menu' }, buildItems(spec.items, closePopupMenu, level));
  document.body.append(panel);
  popups[level] = panel;
  document.removeEventListener('pointerdown', onPointerDownOutside, true);
  document.addEventListener('pointerdown', onPointerDownOutside, true);

  const box = spec.anchor?.getBoundingClientRect();
  let left = box ? (spec.beside ? box.right - 2 : box.left) : (spec.x ?? 0);
  let top = box ? (spec.beside ? box.top - 4 : box.bottom) : (spec.y ?? 0);
  const size = panel.getBoundingClientRect();
  if (spec.beside && left + size.width > window.innerWidth - 4 && box) left = box.left - size.width + 2;
  panel.style.left = `${Math.max(4, Math.min(left, window.innerWidth - size.width - 4))}px`;
  panel.style.top = `${Math.max(4, Math.min(top, window.innerHeight - size.height - 4))}px`;

  panel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' && level > 0) {
      event.preventDefault();
      closeFrom(level);
      popups[level - 1]?.querySelector('.menu-entry[aria-expanded="true"]')?.focus();
      return;
    }
    moveWithin(panel, event, closePopupMenu);
  });

  spec.anchor?.setAttribute('aria-expanded', 'true');
  return panel;
}

/** @param {PointerEvent} event */
function onPointerDownOutside(event) {
  if (popups.length === 0) return;
  if (popups.some((panel) => panel?.contains(event.target))) return;
  closePopupMenu();
}

/** @param {number} level */
function closeFrom(level) {
  for (let index = popups.length - 1; index >= level; index -= 1) {
    popups[index]?.remove();
    popups.length = index;
  }
}

function closePopupMenu() {
  if (popups.length === 0) return;
  document.removeEventListener('pointerdown', onPointerDownOutside, true);
  closeFrom(0);
  popups = [];
  for (const button of document.querySelectorAll('[aria-haspopup="true"][aria-expanded="true"]')) {
    if (!button.classList.contains('menubar-item')) button.setAttribute('aria-expanded', 'false');
  }
}

/**
 * @param {MenuItem[]} items
 * @param {() => void} close
 * @param {number} [level]  which popup panel this is, for opening submenus
 * @returns {HTMLElement[]}
 */
function buildItems(items, close, level = 0) {
  return items.map((item) => {
    if (item.separator) return el('div', { class: 'dropdown-separator' });
    if (item.heading) return el('div', { class: 'menu-heading', text: item.heading });

    const hasSubmenu = Array.isArray(item.submenu) && item.submenu.length > 0;
    const entry = el('button', {
      type: 'button',
      class: `menu-entry${hasSubmenu ? ' has-submenu' : ''}${item.danger ? ' danger' : ''}`,
      role: 'menuitem',
      disabled: item.disabled,
      title: item.title,
      'aria-haspopup': hasSubmenu ? 'true' : null,
      'aria-expanded': hasSubmenu ? 'false' : null,
      onclick: () => {
        if (hasSubmenu) {
          openPanel({ items: item.submenu, anchor: entry, beside: true }, level + 1).querySelector('.menu-entry')?.focus();
          return;
        }
        close();
        item.action?.();
      },
    }, [
      item.iconId ? icon(item.iconId) : el('span', { class: 'menu-entry-gap' }),
      el('span', { class: 'menu-entry-label', text: item.label }),
      item.shortcut ? el('span', { class: 'shortcut', text: item.shortcut }) : null,
      hasSubmenu ? el('span', { class: 'submenu-arrow', text: '▸', 'aria-hidden': 'true' }) : null,
    ]);

    entry.addEventListener('mouseenter', () => {
      if (item.disabled) return;
      if (hasSubmenu) openPanel({ items: item.submenu, anchor: entry, beside: true }, level + 1);
      else closeFrom(level + 1);
    });
    entry.addEventListener('keydown', (event) => {
      if (hasSubmenu && event.key === 'ArrowRight') {
        event.preventDefault();
        event.stopPropagation();
        openPanel({ items: item.submenu, anchor: entry, beside: true }, level + 1).querySelector('.menu-entry')?.focus();
      }
    });
    return entry;
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
