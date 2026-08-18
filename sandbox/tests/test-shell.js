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

// --- The closing check: the exact minimum viewport ----------------------

{
  const sheet = readFile('../app/style.css');
  const page = readFile('../app/index.html');
  ok(
    sheet.includes('@media (max-width: 999.98px), (max-height: 331.98px)'),
    'the notice covers both floors: 1000 wide, and the 332 the column needs — 48 shell, 160 editor, 4 splitter, 120 relationships'
  );
  ok(page.includes('at least 1000 pixels wide and 332 pixels tall'), 'and states both numbers');
  ok(sheet.includes('.pane-editor { flex: 1 1 auto; min-height: 160px; }'), 'the editor floor matches the 160px the splitter reserves');
  ok(sheet.includes('.pane-relationships { flex: 0 1 var(--relationships-height, 280px); min-height: 120px; }'), 'the relationship pane shrinks to its floor before anything overflows');
}

// --- The closing check: the navigator holds its toolbar -----------------

{
  const sheet = readFile('../app/style.css');
  const shell = readFile('../app/shell.js');
  ok(sheet.includes('min-width: 312px'), 'the pane floor is the toolbar: nine 32px buttons, eight 2px gaps, 4px padding each side');
  ok(shell.includes('minimum: 312'), 'and the splitter stops at the same width');
}

// --- The closing check: pointer targets and the menu bar keys ------------

{
  const sheet = readFile('../app/style.css');
  ok(
    sheet.includes('.splitter-vertical::after { inset: 0 -10px;') && sheet.includes('.splitter-horizontal::after { inset: -10px 0;'),
    'the splitters take a 24px pointer target around the 4px bar'
  );
  const shell = readFile('../app/shell.js');
  const menu = readFile('../app/menu.js');
  ok(shell.includes('onArrow: (step) => neighbourMenu(button, step).openIt()'), 'the arrow keys walk the open menus along the bar');
  ok(menu.includes("event.key === 'ArrowLeft' || event.key === 'ArrowRight'"), 'which the menu forwards');
  ok(shell.includes("addEventListener('dblclick', () => apply(clamp(preset)))"), 'a double click returns a pane to its preset: resizing needs no drag');
}

// --- The closing check: text carries AA contrast in both themes ---------

{
  const sheet = readFile('../app/style.css');
  const g100At = sheet.indexOf(':root[data-theme="g100"]');
  const themes = { white: sheet.slice(0, g100At), g100: sheet.slice(g100At).split('}')[0] };

  /** @param {string} block @param {string} name */
  const token = (block, name) => {
    const match = block.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
    if (!match) throw new Error(`token --${name} not found`);
    return match[1];
  };
  /** @param {string} hex */
  const luminance = (hex) => {
    const channel = (index) => {
      const value = Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  };
  /** @param {string} one @param {string} other */
  const contrast = (one, other) => {
    const [high, low] = [luminance(one), luminance(other)].sort((a, b) => b - a);
    return (high + 0.05) / (low + 0.05);
  };

  for (const [theme, block] of Object.entries(themes)) {
    const background = token(block, 'background');
    const layer = token(block, 'layer');
    for (const name of ['text', 'text-second', 'text-helper', 'link', 'danger-text', 'accent']) {
      ok(contrast(token(block, name), background) >= 4.5, `${theme}: --${name} carries AA on the background`);
    }
    for (const name of ['text', 'text-second', 'text-helper']) {
      ok(contrast(token(block, name), layer) >= 4.5, `${theme}: --${name} carries AA on the layer`);
    }
    for (const name of ['pillar-system', 'pillar-legislative', 'pillar-risk', 'pillar-requirements']) {
      ok(contrast(token(block, name), background) >= 3, `${theme}: --${name} carries 3:1 for the type icons`);
    }
    ok(contrast(token(block, 'focus'), background) >= 3, `${theme}: the focus ring carries 3:1`);
  }

  ok(!sheet.includes('var(--text-place)'), 'the placeholder tier styles no text: what reads must meet AA');
  ok(
    sheet.includes('.dialog a { color: var(--link); text-decoration: underline; }'),
    'a link inside prose is underlined: colour alone cannot mark it'
  );
}

summary('test-shell');
