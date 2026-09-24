/**
 * Undo and redo: a list of model snapshots with a cursor. The entry at the
 * cursor is what is on screen; undo steps the cursor back, redo steps it
 * forward, and a change recorded after an undo drops everything ahead of
 * the cursor, so the two walk a line rather than a tree.
 *
 * A snapshot holds the model's content — its name, nodes, and
 * relationships — copied object by object with its strings reused, and never the counters: undo and
 * redo roll back content, not the next number to issue, so an undone
 * creation leaves a hole in the numbering rather than a number that
 * returns on a different entity.
 *
 * Each entry carries a sequence number that is never reused, so a pointer
 * held at an entry stays valid under truncation and depth eviction.
 */

/** How many steps back the arrows reach. */
const DEPTH = 50;

/**
 * @typedef {Object} Content
 * @property {string} name
 * @property {Map<string, import('./model.js').Node>} nodes
 * @property {Map<string, import('./model.js').Relationship>} relationships
 *
 * @typedef {Object} Entry
 * @property {number} sequence
 * @property {Content} content
 */

/**
 * @param {import('./model.js').Model} model
 * @returns {Content}
 */
function contentOf(model) {
  return cloneContent({
    name: model.name,
    attributes: model.attributes,
    nodes: model.nodes,
    relationships: model.relationships,
  });
}

/**
 * A copy of content that shares no object with the original but reuses
 * every string as it is: a string cannot change, so a snapshot need not
 * copy an attribute's text, and fifty snapshots of a project full of
 * drawings hold each drawing once.
 * @param {Content} content
 * @returns {Content}
 */
function cloneContent(content) {
  const cloneNode = (node) => ({ ...node, ...(node.attributes ? { attributes: { ...node.attributes } } : {}) });
  return {
    name: content.name,
    attributes: { ...content.attributes },
    nodes: new Map([...content.nodes].map(([id, node]) => [id, cloneNode(node)])),
    relationships: new Map([...content.relationships].map(([key, held]) => [key, { ...held }])),
  };
}

/**
 * A model holding an entry's content and the live model's counters, shared
 * with neither.
 * @param {Content} content
 * @param {import('./model.js').Model} current
 * @returns {import('./model.js').Model}
 */
function modelWith(content, current) {
  return { ...cloneContent(content), counters: { ...current.counters } };
}

/**
 * @param {import('./model.js').Model} model  the state the history starts from
 */
export function createHistory(model) {
  /** @type {Entry[]} */
  let entries = [{ sequence: 0, content: contentOf(model) }];
  let next = 1;
  let cursor = 0;

  return {
    /**
     * Record the state as it now stands. Called after a change has been
     * made, so the entry recorded is the result of it. Drops everything
     * ahead of the cursor, and the oldest entry past the depth.
     * @param {import('./model.js').Model} current
     * @returns {number}  the new entry's sequence
     */
    record(current) {
      entries = entries.slice(0, cursor + 1);
      entries.push({ sequence: next, content: contentOf(current) });
      next += 1;
      if (entries.length > DEPTH + 1) entries.shift();
      cursor = entries.length - 1;
      return entries[cursor].sequence;
    },

    /**
     * Throw the history away and start again from this state, under a
     * fresh sequence.
     * @param {import('./model.js').Model} current
     * @returns {number}  the initial entry's sequence
     */
    reset(current) {
      entries = [{ sequence: next, content: contentOf(current) }];
      next += 1;
      cursor = 0;
      return entries[cursor].sequence;
    },

    canUndo: () => cursor > 0,
    canRedo: () => cursor < entries.length - 1,

    /**
     * Step back and drop the entry stepped off, and everything ahead of
     * it: the collapse of a change that is to leave no residue. The
     * dropped sequences are never reused.
     * @param {import('./model.js').Model} current
     * @returns {import('./model.js').Model|null}
     */
    rollback(current) {
      if (cursor === 0) return null;
      cursor -= 1;
      entries.length = cursor + 1;
      return modelWith(entries[cursor].content, current);
    },

    /**
     * The model one step back, carrying the live model's counters, or null
     * at the bottom.
     * @param {import('./model.js').Model} current
     * @returns {import('./model.js').Model|null}
     */
    undo(current) {
      if (cursor === 0) return null;
      cursor -= 1;
      return modelWith(entries[cursor].content, current);
    },

    /**
     * The model one step forward, carrying the live model's counters, or
     * null at the top.
     * @param {import('./model.js').Model} current
     * @returns {import('./model.js').Model|null}
     */
    redo(current) {
      if (cursor >= entries.length - 1) return null;
      cursor += 1;
      return modelWith(entries[cursor].content, current);
    },

    /** The sequence of the entry the cursor stands at. */
    sequence: () => entries[cursor].sequence,

    /** How many steps back and forward the arrows reach. */
    depth: () => ({ back: cursor, forward: entries.length - 1 - cursor }),
  };
}
