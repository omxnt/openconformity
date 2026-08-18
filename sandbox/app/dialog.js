/**
 * Promise-based dialogs over the overlay, so a guard reads as one awaited
 * if. A dialog resolves with the value of the chosen action, or with null
 * when it is dismissed — Escape, or a pointer down on the backdrop. Focus
 * stays inside the dialog and returns to the opener when it closes.
 *
 * A toast is the other voice: a passing remark in the corner for what
 * changes nothing and needs no answer — a refusal, a save that went
 * through. It leaves by itself and never joins the overlay stack.
 */

import { el, icon } from './dom.js';

/** How long a toast stands before leaving on its own. */
const TOAST_MS = 6000;

/**
 * @param {Object} context
 * @param {ReturnType<import('./overlay.js').createOverlay>} context.overlay
 * @param {HTMLElement} [context.toastRegion]
 */
export function createDialogs({ overlay, toastRegion = null }) {
  /**
   * @param {Object} spec
   * @param {string} spec.title
   * @param {string} [spec.message]
   * @param {HTMLElement} [spec.body]
   * @param {Array<{ label: string, value: any, kind?: 'primary'|'secondary'|'danger', default?: boolean }>} spec.actions
   * @param {HTMLElement} [spec.initialFocus]
   * @returns {Promise<any>}
   */
  function open({ title, message, body, actions, initialFocus }) {
    return new Promise((resolve) => {
      let result = null;
      let defaultButton = null;

      const buttons = actions.map((action) => {
        const button = el('button', {
          className: `dialog-button button-${action.kind ?? 'secondary'}`,
          text: action.label,
          attributes: { type: 'button' },
        });
        button.addEventListener('click', () => {
          result = action.value;
          overlay.close(entry);
        });
        if (action.default) defaultButton = button;
        return button;
      });

      const dismiss = el('button', {
        className: 'dialog-close',
        attributes: { type: 'button', 'aria-label': 'Close' },
      }, [icon('i-close')]);
      dismiss.addEventListener('click', () => overlay.close(entry));

      // Carbon's modal names itself by pointing at its own heading, and
      // the heading is a heading: a reader moving by them lands on it.
      const card = el(
        'div',
        { className: 'dialog', attributes: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dialog-title' } },
        [
          el('div', { className: 'dialog-head' }, [
            el('h2', { className: 'dialog-title', text: title, attributes: { id: 'dialog-title' } }),
            dismiss,
          ]),
          el('div', { className: 'dialog-body' }, [
            ...(message ? [el('p', { text: message })] : []),
            ...(body ? [body] : []),
          ]),
          el('div', { className: 'dialog-actions' }, buttons),
        ]
      );
      const backdrop = el('div', { className: 'dialog-backdrop' }, [card]);

      backdrop.addEventListener('pointerdown', (event) => {
        if (event.target === backdrop) overlay.close(entry);
      });

      backdrop.addEventListener('keydown', (event) => {
        if (
          event.key === 'Enter' &&
          (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) &&
          defaultButton
        ) {
          event.preventDefault();
          defaultButton.click();
          return;
        }
        if (event.key !== 'Tab') return;
        const focusable = [...card.querySelectorAll('button, input, select, textarea')].filter(
          (control) => !control.disabled
        );
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
      });

      const entry = overlay.open({
        kind: 'dialog',
        element: backdrop,
        opener: document.activeElement,
        onClose: () => resolve(result),
      });

      const primary = buttons[buttons.length - 1];
      const safe = primary && primary.classList.contains('button-danger') ? buttons[0] : primary;
      (initialFocus ?? safe ?? card).focus();
    });
  }

  /**
   * A one-field question: resolves the entered text, or null when it is
   * cancelled or dismissed. Enter answers with the field, the text opens
   * selected, and a blanked field falls back to what it held.
   * @param {Object} spec
   * @param {string} spec.title
   * @param {string} spec.label
   * @param {string} [spec.value]
   * @param {string} [spec.confirmLabel]
   * @returns {Promise<string|null>}
   */
  async function prompt({ title, label, value = '', confirmLabel = 'Save' }) {
    const input = el('input', {
      className: 'field-input',
      attributes: { type: 'text', id: 'prompt-field' },
    });
    input.value = value;
    const body = el('div', { className: 'field' }, [
      el('label', { className: 'field-label', text: label, attributes: { for: 'prompt-field' } }),
      input,
    ]);
    const asked = open({
      title,
      body,
      actions: [
        { label: 'Cancel', value: null, kind: 'secondary' },
        { label: confirmLabel, value: 'confirmed', kind: 'primary', default: true },
      ],
      initialFocus: input,
    });
    input.select();
    const answer = await asked;
    return answer === 'confirmed' ? input.value.trim() || value : null;
  }

  /**
   * A two-way question. Escape and the backdrop answer no.
   * @param {Object} spec
   * @param {string} spec.title
   * @param {string} [spec.message]
   * @param {HTMLElement} [spec.body]
   * @param {string} [spec.confirmLabel]
   * @param {string} [spec.cancelLabel]
   * @param {boolean} [spec.danger]
   * @returns {Promise<boolean>}
   */
  async function confirm({ title, message, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) {
    const value = await open({
      title,
      message,
      body,
      actions: [
        { label: cancelLabel, value: false, kind: 'secondary' },
        { label: confirmLabel, value: true, kind: danger ? 'danger' : 'primary' },
      ],
    });
    return value === true;
  }

  /**
   * A one-list question: resolves the chosen option's value, or null when
   * cancelled or dismissed. Enter answers with the highlighted option.
   * @param {Object} spec
   * @param {string} spec.title
   * @param {string} spec.label
   * @param {Array<{ value: string, label: string }>} spec.options
   * @param {string} [spec.value]
   * @param {string} [spec.confirmLabel]
   * @returns {Promise<string|null>}
   */
  async function choose({ title, label, options, value, confirmLabel = 'Choose' }) {
    const select = el(
      'select',
      {
        className: 'field-input',
        attributes: { id: 'choose-field', size: String(Math.min(Math.max(options.length, 4), 12)) },
      },
      options.map((option) => el('option', { text: option.label, attributes: { value: option.value } }))
    );
    if (value !== undefined) select.value = value;
    const body = el('div', { className: 'field' }, [
      el('label', { className: 'field-label', text: label, attributes: { for: 'choose-field' } }),
      select,
    ]);
    const answer = await open({
      title,
      body,
      actions: [
        { label: 'Cancel', value: null, kind: 'secondary' },
        { label: confirmLabel, value: 'confirmed', kind: 'primary', default: true },
      ],
      initialFocus: select,
    });
    return answer === 'confirmed' ? select.value : null;
  }

  /**
   * A passing remark: told in the corner, closed by itself or by hand.
   * @param {string} title
   * @param {string} message
   */
  function toast(title, message) {
    if (!toastRegion) return;
    const item = el('div', { className: 'toast', attributes: { role: 'status' } }, [
      icon('i-information'),
      el('div', { className: 'toast-content' }, [
        el('p', { className: 'toast-title', text: title }),
        el('p', { className: 'toast-body', text: message }),
      ]),
    ]);
    item.querySelector('.icon').classList.add('toast-icon');
    const timer = setTimeout(() => item.remove(), TOAST_MS);
    const close = el(
      'button',
      { className: 'toast-close', attributes: { type: 'button', 'aria-label': 'Close' } },
      [icon('i-close')]
    );
    close.addEventListener('click', () => {
      clearTimeout(timer);
      item.remove();
    });
    item.appendChild(close);
    toastRegion.appendChild(item);
  }

  return { open, confirm, prompt, choose, toast };
}
