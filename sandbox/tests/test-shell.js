/**
 * Exercises the shell logic that needs no page: the effective theme, the
 * theme menu table, and the wording of the session notices. The rendered
 * shell is checked in the browser. Run from this directory.
 */

import {
  effectiveTheme,
  THEME_MENU,
  RESTORATION_NOTICE,
  RESTORATION_DETAIL,
  PERSIST_NOTICE,
  PERSIST_DETAIL,
} from '../app/shell.js';
import { ok, equal, deepEqual, summary } from './harness.js';

// --- The effective theme -----------------------------------------------

equal(effectiveTheme(null, false), 'white', 'no choice on a light system is White');
equal(effectiveTheme(null, true), 'g100', 'no choice on a dark system is Gray 100');
equal(effectiveTheme('white', true), 'white', 'a stored choice overrides the system preference');
equal(effectiveTheme('g100', false), 'g100', 'in both directions');
equal(effectiveTheme(undefined, true), 'g100', 'anything but a theme follows the system');
equal(effectiveTheme('solarized', false), 'white', 'an unknown theme follows the system');

// --- The theme menu ----------------------------------------------------

deepEqual(
  THEME_MENU.map((item) => item.value),
  [null, 'white', 'g100'],
  'the menu offers the system and the two Carbon themes'
);
deepEqual(
  THEME_MENU.map((item) => item.label),
  ['System', 'White', 'Gray 100'],
  'named as Carbon names them'
);

// --- The notices -------------------------------------------------------

ok(RESTORATION_NOTICE.includes('could not be restored'), 'the restoration notice states the session could not be restored');
ok(RESTORATION_DETAIL.includes('set aside'), 'and that a copy of the stored blob was set aside');
ok(PERSIST_NOTICE.includes('not being stored'), 'the persist notice states changes are not being stored');
ok(PERSIST_DETAIL.includes('Save the project'), 'and points at the file as the durable copy');

summary('test-shell');
