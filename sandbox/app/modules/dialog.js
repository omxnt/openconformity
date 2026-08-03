/**
 * Modal dialogs: the confirmations and notices the software needs, and
 * nothing more.
 */

import { el } from './dom.js';

let overlay = null;
let lastFocused = null;
let blocking = false;

/**
 * @param {Object} spec
 * @param {string} spec.title
 * @param {Array<Node|string>} spec.content
 * @param {Array<{ label: string, primary?: boolean, danger?: boolean, action?: () => void }>} [spec.actions]
 * @param {boolean} [spec.wide]
 * @param {boolean} [spec.blocking]  no close button, no Escape, no click away
 */
export function openDialog(spec) {
  close();
  lastFocused = document.activeElement;

  const body = el('div', { class: 'dialog-body' }, spec.content);
  const footer = el('div', { class: 'dialog-footer' });

  for (const action of spec.actions ?? [{ label: 'Close', primary: true }]) {
    footer.append(
      el('button', {
        type: 'button',
        class: `button${action.primary ? ' primary' : ''}${action.danger ? ' danger' : ''}`,
        text: action.label,
        onclick: () => {
          blocking = false;
          close();
          action.action?.();
        },
      })
    );
  }

  const head = el('div', { class: 'dialog-head' }, [el('span', { class: 'dialog-title', text: spec.title })]);
  if (!spec.blocking) {
    head.append(el('button', { type: 'button', class: 'dialog-close', text: '×', 'aria-label': 'Close', onclick: close }));
  }

  const dialog = el('div', { class: `dialog${spec.wide ? ' wide' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': spec.title }, [
    head,
    body,
    footer,
  ]);

  blocking = Boolean(spec.blocking);
  overlay = el('div', {
    class: 'overlay',
    onclick: (event) => {
      if (!blocking && event.target === overlay) close();
    },
  }, [dialog]);

  document.body.append(overlay);
  document.addEventListener('keydown', onKeyDown);
  footer.querySelector('button')?.focus();
}

export function close() {
  if (!overlay || blocking) return;
  overlay.remove();
  overlay = null;
  blocking = false;
  document.removeEventListener('keydown', onKeyDown);
  if (lastFocused instanceof HTMLElement) lastFocused.focus();
  lastFocused = null;
}

/**
 * @param {KeyboardEvent} event
 */
function onKeyDown(event) {
  if (event.key === 'Escape' && !blocking) {
    event.preventDefault();
    close();
    return;
  }
  if (event.key !== 'Tab' || !overlay) return;

  const focusable = [...overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')];
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * @param {string} title
 * @param {string} message
 */
export function notify(title, message) {
  openDialog({ title, content: [el('p', { text: message })] });
}

/**
 * @param {Object} spec
 * @param {string} spec.title
 * @param {Array<Node|string>} spec.content
 * @param {string} spec.confirmLabel
 * @param {() => void} spec.onConfirm
 */
export function confirmDialog(spec) {
  openDialog({
    title: spec.title,
    content: spec.content,
    actions: [
      { label: 'Cancel' },
      { label: spec.confirmLabel, primary: true, action: spec.onConfirm },
    ],
  });
}

/**
 * A dialog with a single text field, used to name a model.
 * @param {Object} spec
 * @param {string} spec.title
 * @param {string} spec.label
 * @param {string} spec.value
 * @param {string} spec.confirmLabel
 * @param {(value: string) => void} spec.onConfirm
 */
export function promptDialog(spec) {
  const input = el('input', { class: 'input', type: 'text', id: 'prompt-input' });
  input.value = spec.value;

  openDialog({
    title: spec.title,
    content: [
      el('div', { class: 'field' }, [
        el('label', { class: 'field-label', for: 'prompt-input', text: spec.label }),
        input,
      ]),
    ],
    actions: [
      { label: 'Cancel' },
      { label: spec.confirmLabel, primary: true, action: () => spec.onConfirm(input.value.trim() || spec.value) },
    ],
  });

  input.focus();
  input.select();
}

/**
 * A dialog with a single list to pick from, used to move an entity or folder.
 * @param {Object} spec
 * @param {string} spec.title
 * @param {string} spec.label
 * @param {Array<{ value: string, label: string }>} spec.options
 * @param {string} spec.value
 * @param {string} spec.confirmLabel
 * @param {(value: string) => void} spec.onConfirm
 */
export function chooseDialog(spec) {
  const select = el(
    'select',
    { class: 'input', id: 'choose-input', size: String(Math.min(Math.max(spec.options.length, 4), 12)) },
    spec.options.map((option) => el('option', { value: option.value, text: option.label }))
  );
  select.value = spec.value;

  openDialog({
    title: spec.title,
    content: [
      el('div', { class: 'field field-tall' }, [
        el('label', { class: 'field-label', for: 'choose-input', text: spec.label }),
        select,
      ]),
    ],
    actions: [
      { label: 'Cancel' },
      { label: spec.confirmLabel, primary: true, action: () => spec.onConfirm(select.value) },
    ],
  });

  select.focus();
}
