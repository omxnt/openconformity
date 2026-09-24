/**
 * Generic modal infrastructure.
 *
 * `openModal(opts)` mounts a backdrop + dialog into the DOM and returns a
 * handle for callers to populate the body / footer and close the modal.
 *
 * Behaviour for v1:
 *   - ESC closes the topmost modal.
 *   - Clicking the backdrop closes (opt out with `closeOnBackdrop: false`).
 *   - First focusable element in the dialog is auto-focused on open.
 *   - Modals stack: opening a second modal puts it on top of the first;
 *     ESC closes only the topmost.
 *
 * Full focus trapping (Tab cycling clamped to the modal) is intentionally
 * deferred — the basic initial-focus is enough for v1 keyboard ergonomics.
 */

import { el } from './util.js';

/** @typedef {{ close: () => void, dialog: HTMLElement, bodyEl: HTMLElement, footerEl: HTMLElement, headerEl: HTMLElement }} ModalHandle */

/** @type {ModalHandle[]} */
const stack = [];

/** @type {HTMLElement | null} */
let containerEl = null;

function ensureContainer() {
  if (containerEl) return containerEl;
  containerEl = document.createElement('div');
  containerEl.id = 'modal-root';
  document.body.append(containerEl);
  return containerEl;
}

/**
 * Open a modal. Returns a handle the caller fills with body / footer
 * content and uses to close the modal.
 *
 * @param {Object} [opts]
 * @param {string} [opts.title]                 displayed in the header
 * @param {'small' | 'medium' | 'large'} [opts.size]
 * @param {boolean} [opts.closeOnBackdrop]      default true
 * @param {() => void} [opts.onClose]           fired after the modal closes
 * @returns {ModalHandle}
 */
export function openModal(opts = {}) {
  const { title = '', size = 'medium', closeOnBackdrop = true, onClose } = opts;
  const root = ensureContainer();

  const closeBtn = el(
    'button',
    {
      class: 'modal-close',
      type: 'button',
      'aria-label': 'Close',
      onclick: () => close(),
    },
    ['×']
  );

  const headerEl = el('div', { class: 'modal-header' }, [
    el('h2', { class: 'modal-title' }, [title]),
    closeBtn,
  ]);

  const bodyEl = el('div', { class: 'modal-body' });
  const footerEl = el('div', { class: 'modal-footer' });

  const dialog = el(
    'div',
    {
      class: `modal modal-${size}`,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': title || 'Dialog',
      tabindex: '-1',
    },
    [headerEl, bodyEl, footerEl]
  );

  const backdrop = el(
    'div',
    {
      class: 'modal-backdrop',
      onclick: (/** @type {MouseEvent} */ e) => {
        if (!closeOnBackdrop) return;
        // Only close when clicking the backdrop itself, not bubbling from
        // the dialog or its children.
        if (e.target === backdrop) close();
      },
    },
    [dialog]
  );

  function onKeyDown(/** @type {KeyboardEvent} */ e) {
    if (e.key !== 'Escape') return;
    // Only the topmost modal responds to ESC.
    if (stack[stack.length - 1] !== handle) return;
    e.stopPropagation();
    close();
  }

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKeyDown, true);
    backdrop.remove();
    const idx = stack.indexOf(handle);
    if (idx >= 0) stack.splice(idx, 1);
    if (typeof onClose === 'function') onClose();
  }

  /** @type {ModalHandle} */
  const handle = { close, dialog, bodyEl, footerEl, headerEl };

  root.append(backdrop);
  document.addEventListener('keydown', onKeyDown, true);
  stack.push(handle);

  // Focus the first interactive element after the dialog is in the DOM.
  // requestAnimationFrame avoids stealing focus from the click that opened us.
  requestAnimationFrame(() => {
    const focusable = dialog.querySelector(
      'input, select, textarea, button:not(.modal-close), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable instanceof HTMLElement) focusable.focus();
    else dialog.focus();
  });

  return handle;
}

/**
 * Convenience helper for footer action buttons.
 * @param {string} label
 * @param {() => void} onClick
 * @param {{ primary?: boolean, danger?: boolean, disabled?: boolean }} [opts]
 */
export function modalButton(label, onClick, opts = {}) {
  const { primary = false, danger = false, disabled = false } = opts;
  const cls = ['modal-button'];
  if (primary) cls.push('modal-button-primary');
  if (danger) cls.push('modal-button-danger');
  return el(
    'button',
    {
      class: cls.join(' '),
      type: 'button',
      disabled: disabled ? 'disabled' : null,
      onclick: onClick,
    },
    [label]
  );
}
