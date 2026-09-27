/**
 * The drawing cell: a diagram as the picture on a white card, opening
 * at full size, with its size beneath, and in an edit the ghost buttons
 * that open the external editor to create or edit it and delete it, the
 * drawing riding in a hidden control the draft reads.
 */

import { el, icon } from './dom.js';
import { checkDrawing, dataUrl, sizeText } from './drawing.js';
import { editDrawing } from './drawing-editor.js';

/**
 * A drawing in either mode: the picture on a white card, opening at
 * full size, with its size beneath, and a line saying there is none
 * where there is none, no field around either. In an edit the drawing
 * is kept in a hidden control carrying the key, Carbon's ghost
 * buttons opening the external editor to create or edit it and, in
 * the danger colour, deleting it. A drawing that fails the check shows why instead of a
 * picture, and stays as it is.
 * @param {Object} context
 * @param {string|undefined} context.value
 * @param {boolean} context.editing
 * @param {Object} [context.definition]  the attribute the control carries
 * @param {ReturnType<import('./dialog.js').createDialogs>|null} [context.dialogs]
 * @param {Object|null} [context.store]  the store the external editor reads its consent from
 * @param {ReturnType<import('./drawing-editor.js').createDrawingSurface>|null} [context.surface]  the pane the external editor stands on
 * @param {() => string} [context.subject]  what the diagram is of, for its names
 */
export function drawingCell({ value, editing, definition = null, dialogs = null, store = null, surface = null, subject = () => 'the entity' }) {
  let text = value ?? '';
  const hidden = editing ? el('input', { attributes: { type: 'hidden', 'data-key': definition.key } }) : null;
  const body = el('div', { className: 'drawing-body' });
  const ghost = (label, glyph, onPick, danger = false) => {
    const node = el('button', { className: `ghost-button${danger ? ' ghost-danger' : ''}`, attributes: { type: 'button' } }, [icon(glyph), el('span', { text: label })]);
    node.addEventListener('click', onPick);
    return node;
  };
  const enlarge = () =>
    dialogs.open({
      title: `Diagram of ${subject()}`,
      body: el('div', { className: 'drawing-large' }, [el('img', { attributes: { src: dataUrl(text), alt: `Diagram of ${subject()}` } })]),
      actions: [],
    });
  const hold = (held) => {
    text = held;
    if (hidden) {
      hidden.value = text;
      hidden.dispatchEvent(new Event('input', { bubbles: true }));
    }
    paint();
  };
  const paint = () => {
    body.textContent = '';
    const actions = [];
    if (text !== '') {
      const verdict = checkDrawing(text);
      if (verdict.ok) {
        const open = el('button', { className: 'drawing-open', attributes: { type: 'button', 'aria-label': `Open the diagram of ${subject()} at full size` } }, [
          el('img', { className: 'drawing-image', attributes: { src: dataUrl(text), alt: `Diagram of ${subject()}` } }),
        ]);
        open.addEventListener('click', enlarge);
        body.appendChild(el('div', { className: 'drawing-card' }, [open]));
      } else {
        body.appendChild(el('div', { className: 'drawing-refused', text: `The diagram cannot be shown because it ${verdict.reason}.` }));
      }
      actions.push(el('span', { className: 'drawing-size', text: sizeText(text) }));
    } else if (!editing) {
      body.appendChild(el('p', { className: 'cell-none', text: `No ${definition.name.toLowerCase()}.` }));
    }
    if (editing && dialogs && surface) {
      actions.push(
        ghost(text === '' ? 'Create in draw.io' : 'Edit in draw.io', text === '' ? 'i-new-entity' : 'i-edit', async () => {
          const held = await editDrawing({ dialogs, store, surface, drawing: text, subject: subject() });
          if (held !== null) hold(held);
        })
      );
      if (text !== '') actions.push(ghost('Delete', 'i-delete', () => hold(''), true));
    }
    if (actions.length > 0) body.appendChild(el('div', { className: 'drawing-meta' }, actions));
  };
  paint();
  return el('div', { className: 'drawing' }, [body, ...(hidden ? [hidden] : [])]);
}
