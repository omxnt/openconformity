/**
 * Shared stand-ins for the headless suite. Nothing here asserts; the
 * test files import what they need.
 */

/**
 * A localStorage stand-in over a Map, with a switch that makes writes
 * fail and a back door for reading what was stored.
 * @param {Object<string, string>} [initial]
 */
export function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    failing: false,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem(key, value) {
      if (this.failing) throw new Error('quota');
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
    read: (key) => (map.has(key) ? map.get(key) : null),
  };
}

/** An editor that is never editing, so no guard ever needs a dialog. */
export function stubEditor() {
  return { endEdit() {}, beginEdit() {}, hasUnconfirmedEdit: () => false, editing: () => false };
}

/**
 * A document for the dialog bodies a flow builds: elements holding a
 * class, a text, attributes and children, found again by tag.
 * @returns {{ createElement: (tag: string) => Object }}
 */
export function fakeDocument() {
  const make = (tag) => {
    const element = {
      tag,
      className: '',
      textContent: '',
      attributes: {},
      children: [],
      setAttribute(name, value) {
        element.attributes[name] = value;
      },
      appendChild(child) {
        element.children.push(child);
        return child;
      },
      querySelectorAll(selector) {
        const found = [];
        const walk = (node) => {
          for (const child of node.children) {
            if (child.tag === selector) found.push(child);
            walk(child);
          }
        };
        walk(element);
        return found;
      },
    };
    return element;
  };
  return { createElement: make };
}
