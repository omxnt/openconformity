/**
 * Modal dialogs and toasts.
 *
 * A dialog is for a question that must be answered before anything else
 * happens, a toast for a remark that requires nothing: it sits in the corner
 * and leaves by itself. Deletions confirm with a Carbon danger dialog, whose
 * red is the destructive-action colour and never a verdict (D-026).
 */

import { el, icon } from './dom.js';

let overlay = null;
let lastFocused = null;
let blocking = false;

/**
 * @param {Object} spec
 * @param {string} spec.title
 * @param {Array<Node|string>} spec.content
 * @param {Array<{ label: string, primary?: boolean, danger?: boolean, action?: () => void }>} [spec.actions]
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

  // Carbon's modal names itself by pointing at its own heading, and the
  // heading is a heading: it is the title of the thing on screen, so a reader
  // moving by headings should land on it.
  const head = el('div', { class: 'dialog-head' }, [
    el('h2', { class: 'dialog-title', id: 'dialog-title', text: spec.title }),
  ]);
  if (!spec.blocking) {
    head.append(el('button', { type: 'button', class: 'dialog-close', 'aria-label': 'Close', onclick: close }, [icon('i-close')]));
  }

  const dialog = el('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dialog-title' }, [
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

/** How long a toast stands before leaving on its own. */
const TOAST_MS = 6000;

/**
 * A passing remark: a Carbon toast in the corner, closed by itself or by
 * hand. Used for refusals, which change nothing and need no answer.
 * @param {string} title
 * @param {string} message
 */
export function toast(title, message) {
  const region = document.getElementById('toasts');
  if (!region) return;

  const glyph = icon('i-information');
  glyph.classList.add('toast-icon');
  const item = el('div', { class: 'toast', role: 'status' }, [
    glyph,
    el('div', { class: 'toast-content' }, [
      el('p', { class: 'toast-title', text: title }),
      el('p', { class: 'toast-body', text: message }),
    ]),
  ]);

  const timer = setTimeout(() => item.remove(), TOAST_MS);
  item.append(
    el('button', {
      type: 'button',
      class: 'toast-close',
      'aria-label': 'Close',
      onclick: () => {
        clearTimeout(timer);
        item.remove();
      },
    }, [icon('i-close')])
  );

  region.append(item);
}

/**
 * @param {Object} spec
 * @param {string} spec.title
 * @param {Array<Node|string>} spec.content
 * @param {string} spec.confirmLabel
 * @param {boolean} [spec.danger]  the confirmation destroys something
 * @param {() => void} spec.onConfirm
 */
export function confirmDialog(spec) {
  openDialog({
    title: spec.title,
    content: spec.content,
    actions: [
      { label: 'Cancel' },
      { label: spec.confirmLabel, primary: !spec.danger, danger: spec.danger, action: spec.onConfirm },
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
 * @param {(value: string) => string} [spec.describe]  helper text, kept in
 *   step with what is typed, so the consequence of the name is visible before
 *   the button is pressed
 * @param {(value: string) => void} spec.onConfirm
 */
export function promptDialog(spec) {
  const settled = () => input.value.trim() || spec.value;
  const confirm = () => spec.onConfirm(settled());
  const note = spec.describe ? el('p', { class: 'dialog-note', text: spec.describe(spec.value) }) : null;

  const input = el('input', {
    class: 'input',
    type: 'text',
    id: 'prompt-input',
    oninput: () => {
      if (note) note.textContent = spec.describe(settled());
    },
    onkeydown: (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      close();
      confirm();
    },
  });
  input.value = spec.value;

  openDialog({
    title: spec.title,
    content: [
      el('div', { class: 'field' }, [
        el('label', { class: 'field-label', for: 'prompt-input', text: spec.label }),
        input,
        note,
      ].filter(Boolean)),
    ],
    actions: [
      { label: 'Cancel' },
      { label: spec.confirmLabel, primary: true, action: confirm },
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
