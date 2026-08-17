/**
 * structuredClone for the JavaScriptCore shell, which does not provide it.
 * Covers what a model holds: primitives, plain objects, arrays, and Maps.
 * The browser's native structuredClone is untouched.
 */

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = function structuredClone(value) {
    if (value === null || typeof value !== 'object') return value;
    if (value instanceof Map) {
      return new Map([...value].map(([key, entry]) => [structuredClone(key), structuredClone(entry)]));
    }
    if (Array.isArray(value)) return value.map((entry) => structuredClone(entry));
    /** @type {Object<string, unknown>} */
    const clone = {};
    for (const [key, entry] of Object.entries(value)) clone[key] = structuredClone(entry);
    return clone;
  };
}
