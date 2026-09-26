/**
 * Words for counts and lists, said the one way everywhere: a count with
 * its noun in the number the count takes, and names joined with commas
 * and a final and.
 */

/**
 * A count with its noun: `1 entity`, `2 entities`, `3 relationships`.
 * @param {number} count
 * @param {string} noun  the singular
 * @returns {string}
 */
export function plural(count, noun) {
  if (count === 1) return `${count} ${noun}`;
  return `${count} ${noun.endsWith('y') ? `${noun.slice(0, -1)}ies` : `${noun}s`}`;
}

/**
 * Names joined as prose lists them: `A`, `A and B`, `A, B and C`.
 * @param {string[]} names
 * @returns {string}
 */
export function listed(names) {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}
