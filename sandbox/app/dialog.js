/**
 * Promise-based dialogs over the overlay, so a guard reads as one awaited
 * if. A dialog resolves with the value of the chosen action, or with null
 * when it is dismissed — Escape, or a pointer down on the backdrop. Focus
 * stays inside the dialog and returns to the opener when it closes.
 */

import { el } from './dom.js';

/**
 * @param {Object} context
 * @param {ReturnType<import('./overlay.js').createOverlay>} context.overlay
 */
export function createDialogs({ overlay }) {
  /**
   * @param {Object} spec
   * @param {string} spec.title
   * @param {string} [spec.message]
   * @param {HTMLElement} [spec.body]
   * @param {Array<{ label: string, value: any, kind?: 'primary'|'secondary'|'danger' }>} spec.actions
   * @returns {Promise<any>}
   */
  function open({ title, message, body, actions }) {
    return new Promise((resolve) => {
      let result = null;

      const buttons = actions.map(({ label, value, kind = 'secondary' }) => {
        const button = el('button', {
          className: `dialog-button button-${kind}`,
          text: label,
          attributes: { type: 'button' },
        });
        button.addEventListener('click', () => {
          result = value;
          overlay.close(entry);
        });
        return button;
      });

      const card = el(
        'div',
        { className: 'dialog', attributes: { role: 'dialog', 'aria-modal': 'true', 'aria-label': title } },
        [
          el('h3', { className: 'dialog-title', text: title }),
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
      (safe ?? card).focus();
    });
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

  return { open, confirm };
}
