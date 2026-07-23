/**
 * Top-bar menus (File, Edit, Export, Help).
 *
 * Each menu is a click-to-open dropdown anchored under its menu button.
 * Clicks outside the dropdown and ESC close it. Items run an action and
 * close on activation.
 *
 * Keyboard shortcuts (Cmd/Ctrl+N / O / S / Shift+S) are bound globally
 * and dispatched into the same action functions, so the menu is purely a
 * presentation surface — actions live in the `actions` object passed to
 * `mountMenus`.
 */

import { ArtifactTypes, ArtifactTypeKeys } from './types.js';
import { el } from './util.js';

/**
 * @typedef {Object} MenuItem
 * @property {'item' | 'separator'} [kind]
 * @property {string} [label]
 * @property {string} [shortcut]      hint shown on the right
 * @property {boolean} [disabled]
 * @property {() => void} [onClick]
 *
 * @typedef {Object} MenuActions
 * @property {() => void} newProject
 * @property {() => void} openProject
 * @property {() => void} loadDemo
 * @property {() => void} closeProject
 * @property {() => void} save
 * @property {() => void} saveAs
 * @property {() => void} renameProject
 * @property {(typeKey: import('./types.js').ArtifactKey) => void} exportType
 * @property {() => void} exportRelationships
 * @property {() => void} exportAll
 * @property {() => void} about
 */

const SHORTCUT = {
  newProject: 'Cmd+N',
  openProject: 'Cmd+O',
  save: 'Cmd+S',
  saveAs: 'Shift+Cmd+S',
};

let openMenuName = /** @type {string | null} */ (null);
let openMenuEl = /** @type {HTMLElement | null} */ (null);
let openAnchor = /** @type {HTMLElement | null} */ (null);
let activeActions = /** @type {MenuActions | null} */ (null);

/**
 * Wire up the menu buttons in the menu bar plus global keyboard shortcuts.
 * @param {MenuActions} actions
 */
export function mountMenus(actions) {
  activeActions = actions;

  const buttons = document.querySelectorAll('.menu-button[data-menu]');
  for (const btn of buttons) {
    if (!(btn instanceof HTMLButtonElement)) continue;
    const name = btn.dataset.menu;
    if (!name) continue;
    btn.disabled = false;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (openMenuName === name) {
        closeMenu();
        return;
      }
      openMenu(name, btn);
    });
  }

  // Close on outside click and on ESC.
  document.addEventListener('click', () => closeMenu());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openMenuName) {
      e.stopPropagation();
      closeMenu();
    }
  });

  // Global shortcuts. Only fire when no input/textarea/select is focused
  // and no modal is open — naive check via document.activeElement.
  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    const key = e.key.toLowerCase();
    if (isTypingInForm()) return;

    if (key === 's') {
      e.preventDefault();
      if (e.shiftKey) actions.saveAs();
      else actions.save();
    } else if (key === 'o') {
      e.preventDefault();
      actions.openProject();
    } else if (key === 'n') {
      e.preventDefault();
      actions.newProject();
    }
  });
}

function isTypingInForm() {
  const a = document.activeElement;
  if (!a) return false;
  const tag = a.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (a instanceof HTMLElement && a.isContentEditable) return true;
  return false;
}

/**
 * @param {string} name
 * @param {HTMLElement} anchor
 */
function openMenu(name, anchor) {
  closeMenu();
  if (!activeActions) return;

  const items = buildMenu(name, activeActions);
  const dropdown = el('div', {
    class: 'menu-dropdown',
    role: 'menu',
  });

  for (const item of items) {
    if (item.kind === 'separator') {
      dropdown.append(el('div', { class: 'menu-separator', role: 'separator' }));
      continue;
    }
    const btn = el(
      'button',
      {
        class: 'menu-item' + (item.disabled ? ' is-disabled' : ''),
        type: 'button',
        role: 'menuitem',
        disabled: item.disabled ? 'disabled' : null,
        onclick: (/** @type {MouseEvent} */ e) => {
          e.stopPropagation();
          if (item.disabled) return;
          closeMenu();
          item.onClick?.();
        },
      },
      [
        el('span', { class: 'menu-item-label' }, [item.label ?? '']),
        item.shortcut
          ? el('span', { class: 'menu-item-shortcut' }, [item.shortcut])
          : '',
      ]
    );
    dropdown.append(btn);
  }

  document.body.append(dropdown);
  positionDropdown(dropdown, anchor);

  openMenuName = name;
  openMenuEl = dropdown;
  openAnchor = anchor;
  anchor.classList.add('is-active');
}

function closeMenu() {
  if (openAnchor) openAnchor.classList.remove('is-active');
  if (openMenuEl) openMenuEl.remove();
  openMenuName = null;
  openMenuEl = null;
  openAnchor = null;
}

/**
 * @param {HTMLElement} dropdown
 * @param {HTMLElement} anchor
 */
function positionDropdown(dropdown, anchor) {
  const r = anchor.getBoundingClientRect();
  dropdown.style.position = 'fixed';
  dropdown.style.top = `${r.bottom + 4}px`;
  dropdown.style.left = `${r.left}px`;
  dropdown.style.minWidth = `${Math.max(r.width, 200)}px`;
}

/**
 * @param {string} name
 * @param {MenuActions} actions
 * @returns {MenuItem[]}
 */
function buildMenu(name, actions) {
  switch (name) {
    case 'file':
      return [
        { kind: 'item', label: 'New project',       shortcut: SHORTCUT.newProject,  onClick: actions.newProject },
        { kind: 'item', label: 'Open…',             shortcut: SHORTCUT.openProject, onClick: actions.openProject },
        { kind: 'item', label: 'Load demo project', onClick: actions.loadDemo },
        { kind: 'separator' },
        { kind: 'item', label: 'Save',              shortcut: SHORTCUT.save,        onClick: actions.save },
        { kind: 'item', label: 'Save as…',          shortcut: SHORTCUT.saveAs,      onClick: actions.saveAs },
        { kind: 'separator' },
        { kind: 'item', label: 'Close project',     onClick: actions.closeProject },
      ];
    case 'edit':
      return [
        { kind: 'item', label: 'Rename project…', onClick: actions.renameProject },
      ];
    case 'help':
      return [
        { kind: 'item', label: 'About OpenConformity', onClick: actions.about },
      ];
    case 'export': {
      const items = /** @type {MenuItem[]} */ ([
        { kind: 'item', label: 'Project as JSON',     onClick: actions.save },
        { kind: 'item', label: 'All CSVs',            onClick: actions.exportAll },
        { kind: 'separator' },
        { kind: 'item', label: 'Relationships (CSV)', onClick: actions.exportRelationships },
        { kind: 'separator' },
      ]);
      for (const key of ArtifactTypeKeys) {
        items.push({
          kind: 'item',
          label: `${ArtifactTypes[key].displayNamePlural} (CSV)`,
          onClick: () => actions.exportType(key),
        });
      }
      return items;
    }
    default:
      return [];
  }
}

