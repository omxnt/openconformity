/**
 * The one owner of everything above the page: dialogs, menus, and panels,
 * held in one stack. Menus are exclusive — opening anything closes them.
 * Dialogs draw over panels; a commit closes menus and never dialogs, which
 * is `closeMenus`. Escape goes to the top entry. Every entry records its
 * opener, and focus returns to it when the entry closes.
 *
 * The stack rules live in `createOverlayStack`, which needs no page and
 * tests headless; `createOverlay` binds the stack to the page.
 */

/**
 * @typedef {'menu'|'panel'|'dialog'} OverlayKind
 *
 * @typedef {Object} Entry
 * @property {OverlayKind} kind
 * @property {unknown} [opener]
 * @property {(entry: Entry) => void} [onClose]
 */

export function createOverlayStack() {
  /** @type {Entry[]} */
  const entries = [];

  /**
   * @param {Entry} entry
   * @returns {boolean} whether the entry was in the stack
   */
  function close(entry) {
    const index = entries.indexOf(entry);
    if (index < 0) return false;
    entries.splice(index, 1);
    if (entry.onClose) entry.onClose(entry);
    return true;
  }

  function closeMenus() {
    for (const menu of entries.filter((held) => held.kind === 'menu')) close(menu);
  }

  return {
    /**
     * Push an entry. Opening anything closes the menus first.
     * @param {Entry} entry
     * @returns {Entry}
     */
    open(entry) {
      closeMenus();
      entries.push(entry);
      return entry;
    },

    close,
    closeMenus,

    /**
     * Close the top entry.
     * @returns {Entry|null} the entry closed, or null on an empty stack
     */
    escape() {
      const top = entries[entries.length - 1] ?? null;
      if (top) close(top);
      return top;
    },

    top: () => entries[entries.length - 1] ?? null,
    entries: () => [...entries],
  };
}

/**
 * The stack bound to the page: entries carry an element rendered in the
 * container, Escape closes the top entry, a pointer down outside a menu
 * and its opener closes the menu, and focus returns to the opener of a
 * closed entry that held it.
 * @param {Object} context
 * @param {HTMLElement} context.container
 */
export function createOverlay({ container }) {
  const root = container.ownerDocument;
  const stack = createOverlayStack();

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || stack.top() === null) return;
    event.preventDefault();
    stack.escape();
  });

  root.addEventListener('pointerdown', (event) => {
    for (const entry of stack.entries()) {
      if (entry.kind !== 'menu') continue;
      const inside =
        entry.element.contains(event.target) ||
        (entry.opener instanceof Element && entry.opener.contains(event.target));
      if (!inside) stack.close(entry);
    }
  });

  return {
    /**
     * Open an element above the page.
     * @param {Object} spec
     * @param {OverlayKind} spec.kind
     * @param {HTMLElement} spec.element
     * @param {HTMLElement} [spec.opener]  focus returns here on close
     * @param {() => void} [spec.onClose]
     * @returns {Entry}
     */
    open({ kind, element, opener = null, onClose = null }) {
      element.classList.add(`overlay-${kind}`);
      const entry = stack.open({
        kind,
        opener,
        element,
        onClose() {
          const heldFocus =
            element.contains(root.activeElement) || root.activeElement === root.body;
          element.remove();
          if (onClose) onClose();
          if (opener && heldFocus) opener.focus();
        },
      });
      container.appendChild(element);
      return entry;
    },

    close: (entry) => stack.close(entry),
    closeMenus: () => stack.closeMenus(),
    top: () => stack.top(),
  };
}
