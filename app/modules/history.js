/**
 * Undo and redo.
 *
 * The history is a list of whole-model snapshots with a cursor. The entry the
 * cursor points at is what is on screen: undo steps the cursor back, redo steps
 * it forward, and a change made after an undo drops everything ahead of the
 * cursor, so the two arrows walk a line rather than a tree.
 *
 * Snapshots rather than inverse operations. A model is a few Maps of small
 * objects, so copying one whole is cheap, and a copy cannot drift from the
 * operations the way a hand-written inverse for every mutation would. The cost
 * is memory, which is what `DEPTH` bounds: past that the oldest step is
 * dropped, so the history never grows without limit.
 *
 * The selection travels with the snapshot. Undoing a deletion that puts an
 * entity back should leave the user standing where they were, not somewhere
 * else in the tree.
 */

/**
 * How many steps back the arrows reach. Fifty covers the mistakes a working
 * session actually makes, and a model of the size this software is for costs
 * well under a megabyte a step.
 */
const DEPTH = 50;

/**
 * @typedef {Object} Entry
 * @property {import('./model.js').Model} model
 * @property {import('./navigator.js').Selection} selection
 */

/**
 * A copy deep enough that nothing in it is shared with the live model. Maps of
 * plain objects are exactly what structuredClone is for, so the model needs no
 * copying code of its own and cannot grow a field this forgets about.
 * @param {import('./model.js').Model} model
 * @param {import('./navigator.js').Selection} selection
 * @returns {Entry}
 */
function snapshot(model, selection) {
  return { model: structuredClone(model), selection: { ...selection } };
}

/**
 * @param {import('./model.js').Model} model
 * @param {import('./navigator.js').Selection} selection
 */
export function createHistory(model, selection) {
  /** @type {Entry[]} */
  let entries = [snapshot(model, selection)];
  let cursor = 0;

  return {
    /**
     * Take the state as it now stands. Called after a change has been made, so
     * the entry recorded is the result of it.
     * @param {import('./model.js').Model} current
     * @param {import('./navigator.js').Selection} at
     */
    record(current, at) {
      entries.length = cursor + 1;
      entries.push(snapshot(current, at));
      if (entries.length > DEPTH + 1) entries.shift();
      cursor = entries.length - 1;
    },

    /** Throw the history away and start again from this state. */
    reset(current, at) {
      entries = [snapshot(current, at)];
      cursor = 0;
    },

    canUndo: () => cursor > 0,
    canRedo: () => cursor < entries.length - 1,

    /** @returns {Entry|null} */
    undo() {
      if (cursor === 0) return null;
      cursor -= 1;
      return snapshot(entries[cursor].model, entries[cursor].selection);
    },

    /** @returns {Entry|null} */
    redo() {
      if (cursor >= entries.length - 1) return null;
      cursor += 1;
      return snapshot(entries[cursor].model, entries[cursor].selection);
    },

    /** How many steps back and forward are available, for the button titles. */
    depth: () => ({ back: cursor, forward: entries.length - 1 - cursor }),
  };
}
