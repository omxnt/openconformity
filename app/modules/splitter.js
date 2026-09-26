/**
 * A splitter between two panes: dragged by pointer, stepped by arrow
 * keys, returned to its preset by a double click, and where a pane can
 * collapse, snapped closed past half its minimum and open again past
 * the same point. It knows nothing of what it splits: the sizes come
 * and go through the functions it is given.
 */

/**
 * @param {Object} spec
 * @param {HTMLElement} spec.splitter
 * @param {(event: PointerEvent) => number} spec.sizeAt  the pane size a pointer position asks for
 * @param {() => number} spec.size      the pane's current size
 * @param {() => number} spec.limit     the largest size the container allows
 * @param {number} spec.minimum
 * @param {number} spec.preset  the default size a double click returns to, so resizing needs no drag
 * @param {(size: number) => void} spec.apply
 * @param {[string, string]} spec.keys  the arrow keys that shrink and grow
 * @param {() => boolean} [spec.collapsed]  whether the pane stands collapsed, where it can
 * @param {(collapsed: boolean) => void} [spec.collapse]  collapse the pane or expand it: a drag past half the minimum snaps it closed, and back past the same point snaps it open
 */
export function splitter({ splitter: element, sizeAt, size, limit, minimum, preset, apply, keys, collapsed = () => false, collapse }) {
  const clamp = (value) => Math.min(Math.max(value, minimum), Math.max(limit(), minimum));
  let snapped = false;
  /** The size the pane had when the drag began, kept as its size while it stands collapsed so that reopening returns to it. */
  let before = minimum;

  element.addEventListener('pointerdown', (event) => {
    element.setPointerCapture(event.pointerId);
    element.classList.add('dragging');
    snapped = collapsed();
    if (!snapped) before = size();
  });
  element.addEventListener('pointermove', (event) => {
    if (!element.hasPointerCapture(event.pointerId)) return;
    const asked = sizeAt(event);
    if (collapse !== undefined) {
      const past = asked < minimum / 2;
      if (past !== snapped) {
        snapped = past;
        if (past) apply(clamp(before));
        collapse(past);
      }
      if (past) return;
    }
    apply(clamp(asked));
  });
  element.addEventListener('pointerup', (event) => {
    element.releasePointerCapture(event.pointerId);
    element.classList.remove('dragging');
  });
  element.addEventListener('dblclick', () => {
    if (collapsed()) collapse(false);
    apply(clamp(preset));
  });
  element.addEventListener('keydown', (event) => {
    const step = event.key === keys[0] ? -16 : event.key === keys[1] ? 16 : 0;
    if (step === 0) return;
    event.preventDefault();
    if (collapsed()) {
      if (step > 0) collapse(false);
      return;
    }
    apply(clamp(size() + step));
  });
}
