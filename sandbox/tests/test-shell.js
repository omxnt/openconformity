/**
 * Exercises the shell logic that needs no page: the effective theme, the
 * theme menu table, the tab title, the leave-prompt, and the wording of
 * the session notices. The rendered shell is checked in the browser; the
 * source pins live in test-pins. Run from this directory.
 */

import {
  effectiveTheme,
  themeSwitch,
  titleFor,
  shouldWarnBeforeUnload,
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
  ['white', 'g100'],
  'the theme offer is two-state: the stored values stay the Carbon names'
);
deepEqual(
  THEME_MENU.map((item) => item.label),
  ['Light theme', 'Dark theme'],
  'presented as named themes, with no System entry: the first load follows the system, a choice then owns it'
);
deepEqual(
  THEME_MENU.map((item) => item.icon),
  ['i-theme-light', 'i-theme-dark'],
  'each wearing its glyph: the sun, the moon'
);

// --- The one-click flip ------------------------------------------------

deepEqual(
  themeSwitch('white'),
  { next: 'g100', icon: 'i-theme-dark', label: 'Switch to the dark theme' },
  'in the light, the button wears the moon and offers the dark'
);
deepEqual(
  themeSwitch('g100'),
  { next: 'white', icon: 'i-theme-light', label: 'Switch to the light theme' },
  'in the dark, the sun and the light'
);

// --- The notices -------------------------------------------------------

ok(RESTORATION_NOTICE.includes('could not be restored'), 'the restoration notice states the session could not be restored');
ok(RESTORATION_DETAIL.includes('set aside'), 'and that a copy of the stored blob was set aside');
ok(PERSIST_NOTICE.includes('not being stored'), 'the persist notice states changes are not being stored');
ok(PERSIST_DETAIL.includes('Save the project'), 'and points at the file as the durable copy');

// --- The tab title -----------------------------------------------------

equal(titleFor(false, ''), 'openconformity', 'the landing titles the software');
equal(titleFor(true, ''), 'openconformity', 'an unnamed project titles the software');
equal(titleFor(true, 'Mixer line'), 'Mixer line — openconformity', 'a named project titles the tab');
equal(titleFor(true, '   '), 'openconformity', 'a blank name is no name');
equal(titleFor(false, 'Stale'), 'openconformity', 'no project, no name, whatever lingers');

// --- The leave-prompt fires exactly when leaving costs something --------

equal(shouldWarnBeforeUnload(true, true), true, 'unsaved work that persistence is failing to keep warns');
equal(shouldWarnBeforeUnload(true, false), false, 'unsaved work the blob holds does not: closing loses nothing');
equal(shouldWarnBeforeUnload(false, true), false, 'a clean project warns of nothing, kept or not');
equal(shouldWarnBeforeUnload(false, false), false, 'and neither does the quiet case');

summary('test-shell');
