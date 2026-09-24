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
