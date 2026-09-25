/**
 * Assertions for the headless tests, run with the JavaScriptCore shell:
 *
 *     /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m <test>
 *
 * Failed checks print a FAIL line and `summary` throws at the end, so the
 * shell exits non-zero. `quit()` reports success regardless of its argument
 * in this shell, which is why failure travels as an exception.
 */

let checks = 0;
let failures = 0;

/**
 * @param {unknown} value
 * @returns {string}
 */
function show(value) {
  return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

/**
 * @param {unknown} condition
 * @param {string} message
 */
export function ok(condition, message) {
  checks += 1;
  if (!condition) {
    failures += 1;
    print(`  FAIL ${message}`);
  }
}

/**
 * Strict equality.
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} message
 */
export function equal(actual, expected, message) {
  checks += 1;
  if (actual !== expected) {
    failures += 1;
    print(`  FAIL ${message}: expected ${show(expected)}, got ${show(actual)}`);
  }
}

/**
 * Structural equality over primitives, arrays, and plain objects. Object
 * key order does not matter; array order does.
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
function same(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => Object.hasOwn(b, key) && same(a[key], b[key]));
}

/**
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} message
 */
export function deepEqual(actual, expected, message) {
  checks += 1;
  if (!same(actual, expected)) {
    failures += 1;
    print(`  FAIL ${message}`);
    print(`    expected: ${JSON.stringify(expected)}`);
    print(`    actual:   ${JSON.stringify(actual)}`);
  }
}

/**
 * An outcome that was refused, with its reason stated.
 * @param {{ ok: boolean, reason?: string }} outcome
 * @param {string} message
 */
export function refused(outcome, message) {
  checks += 1;
  if (outcome.ok !== false || typeof outcome.reason !== 'string' || outcome.reason === '') {
    failures += 1;
    print(`  FAIL ${message}: expected a refusal with a reason, got ${JSON.stringify(outcome)}`);
  }
}

/**
 * An outcome that succeeded.
 * @param {{ ok: boolean, reason?: string }} outcome
 * @param {string} message
 */
export function allowed(outcome, message) {
  checks += 1;
  if (outcome.ok !== true) {
    failures += 1;
    print(`  FAIL ${message}: refused with ${show(outcome.reason)}`);
  }
}

/**
 * Print the result and throw if anything failed, so the shell exits
 * non-zero.
 * @param {string} name
 */
export function summary(name) {
  if (failures > 0) {
    print(`${name}: ${failures} of ${checks} checks FAILED`);
    throw new Error(`${name} failed`);
  }
  print(`${name}: all ${checks} checks passed`);
}
