/**
 * Exercises the shell logic that needs no page: the effective theme, the
 * theme menu table, and the wording of the session notices. The rendered
 * shell is checked in the browser. Run from this directory.
 */

import {
  effectiveTheme,
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
  ['Light', 'Dark'],
  'presented as Light and Dark, with no System entry: the first load follows the system, a choice then owns it'
);

// --- The notices -------------------------------------------------------

ok(RESTORATION_NOTICE.includes('could not be restored'), 'the restoration notice states the session could not be restored');
ok(RESTORATION_DETAIL.includes('set aside'), 'and that a copy of the stored blob was set aside');
ok(PERSIST_NOTICE.includes('not being stored'), 'the persist notice states changes are not being stored');
ok(PERSIST_DETAIL.includes('Save the project'), 'and points at the file as the durable copy');

// --- Pane headers are working surfaces or nothing ----------------------

{
  const page = readFile('../app/index.html');
  ok(!page.includes('pane-title'), 'no pane header only names its pane');
  for (const pane of ['Navigator', 'Editor', 'Relationships']) {
    ok(page.includes(`aria-label="${pane}"`), `the ${pane} pane stays an ARIA landmark`);
  }
}

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

// --- Compliance: the licences ride with the software --------------------

{
  ok(readFile('../app/LICENSE.txt').includes('EUROPEAN UNION PUBLIC LICENCE v. 1.2'), 'the EUPL-1.2 text is reachable at LICENSE.txt');
  ok(readFile('../app/assets/fonts/LICENSE.txt').includes('SIL OPEN FONT LICENSE'), 'the OFL rides with the fonts');
  ok(readFile('../app/assets/icons/LICENSE.txt').includes('Apache License'), 'the Apache licence rides with the icons');
}

// --- The help surface and the chrome ------------------------------------

{
  const page = readFile('../app/index.html');
  for (const menu of ['file', 'edit', 'view', 'help']) {
    ok(page.includes(`id="shell-${menu}"`), `the menu bar carries ${menu}`);
  }
  ok(page.includes('id="shell-metamodel"'), 'and the shell the metamodel action');
  ok(page.includes('id="i-metamodel"'), 'with its glyph in the sprite');
  ok(
    page.includes('href="https://openconformity.org"') &&
      page.includes('class="wordmark"') &&
      /<a class="wordmark"[^>]*target="_blank"[^>]*rel="noopener"/.test(page),
    'the wordmark is a plain link to the project site, opening in a new tab'
  );
}

// --- The bundled metamodel exports --------------------------------------

{
  for (const theme of ['light', 'dark']) {
    let held = '';
    try {
      held = readFile(`../app/assets/images/metamodel-${theme}.png`);
    } catch {
      held = '';
    }
    ok(held.length > 0, `the ${theme} metamodel export is bundled`);
  }
}

// --- The file surface stays on the baseline ----------------------------

{
  const page = readFile('../app/index.html');
  ok(page.includes('id="file-input"') && page.includes('accept=".json'), 'a .json file input is the way in');
  for (const module of ['flows.js', 'files.js', 'shell.js', 'app.js', 'store.js']) {
    const source = readFile(`../app/${module}`);
    ok(
      !source.includes('showOpenFilePicker') && !source.includes('showSaveFilePicker'),
      `${module} uses no File System Access API`
    );
  }
}

summary('test-shell');
