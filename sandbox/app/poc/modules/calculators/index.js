/**
 * Calculator registry.
 *
 * Each calculator is a self-contained module that exports a default object
 * matching the {@link Calculator} typedef below. They have no state and no
 * I/O — `compute(inputs)` is a pure function so calculations are
 * reproducible for a given set of inputs and a given standard version.
 *
 * Adding a calculator: write `iso-NNNNN.js`, import it here, and append it
 * to the `CALCULATORS` array.
 */

import iso13855 from './iso-13855.js';
import iso13857 from './iso-13857.js';

/**
 * @typedef {Object} CalculatorField
 * @property {string} name                  programmatic key in inputs/result
 * @property {string} label                 human-readable label
 * @property {'number' | 'string' | 'enum'} type
 * @property {string} [unit]                appended after input value (e.g. "mm/s")
 * @property {string} [hint]                helper text shown below the input
 * @property {string | number} [default]
 * @property {{ value: string, label: string }[]} [options]   for type === 'enum'
 *
 * @typedef {Object} Calculator
 * @property {string} id                                   stable id stored in `calculator.type`
 * @property {string} name                                 displayed in selectors
 * @property {string} standardVersion                      stored as `snapshotStandardVersion`
 * @property {string} description
 * @property {string} [disclaimer]                         shown in the editor widget
 * @property {CalculatorField[]} fields
 * @property {(inputs: Record<string, unknown>) => Record<string, unknown>} compute
 * @property {(inputs: Record<string, unknown>, result: Record<string, unknown>) => string} [summarize]
 */

/** @type {Calculator[]} */
const CALCULATORS = [iso13855, iso13857];

/** @type {Map<string, Calculator>} */
const byId = new Map(CALCULATORS.map((c) => [c.id, c]));

/** @returns {Calculator[]} */
export function listCalculators() {
  return CALCULATORS;
}

/**
 * @param {string} id
 * @returns {Calculator | undefined}
 */
export function getCalculator(id) {
  return byId.get(id);
}

/**
 * Run a calculator's compute function safely. Returns the result or a
 * fallback object containing the error message when compute throws.
 * @param {string} id
 * @param {Record<string, unknown>} inputs
 */
export function runCalculator(id, inputs) {
  const calc = byId.get(id);
  if (!calc) return { error: `Unknown calculator: ${id}` };
  try {
    return calc.compute(inputs);
  } catch (err) {
    return { error: /** @type {Error} */ (err).message ?? 'Computation failed.' };
  }
}
