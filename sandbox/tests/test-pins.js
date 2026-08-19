/**
 * Source pins, not behaviour tests: each check greps the published
 * source — or a bundled asset — for the exact expression of a recorded
 * ruling. A failure here does not mean the software broke; it means a
 * pinned ruling's expression moved. Check the ruling first — the plan,
 * the decision log, the workstream report that ordered it. If the move
 * was ordered, update the pin with it; if not, the source regressed.
 * Run from this directory.
 */

import './shim.js';
import { createActions } from '../app/actions.js';
import { createStore } from '../app/store.js';
import { TYPE_ICONS, FOLDER_ICON, PROJECT_ICON } from '../app/icons.js';
import { ok, summary } from './harness.js';
import { fakeStorage } from './helpers.js';

// --- Pane headers are working surfaces or nothing ----------------------

{
  const page = readFile('../app/index.html');
  ok(!page.includes('pane-title'), 'no pane header only names its pane');
  for (const pane of ['Navigator', 'Editor', 'Relationships']) {
    ok(page.includes(`aria-label="${pane}"`), `the ${pane} pane stays an ARIA landmark`);
  }
}

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

// --- The ways into a project live in the editor's empty state ------------

{
  const editor = readFile('../app/editor.js');
  for (const id of ['new-project', 'open', 'load-example']) {
    ok(editor.includes(`id: '${id}'`), `the editor's landing offers ${id}`);
  }
  const navigator = readFile('../app/navigator.js');
  ok(!navigator.includes('landing-'), 'and the navigator landing carries no buttons: they live in one place');
}

// --- Every glyph drawn is in the sprite, with its provenance -------------

{
  const page = readFile('../app/index.html');
  const origin = readFile('../app/assets/icons/ORIGIN.md');
  const glyphs = [...Object.values(TYPE_ICONS), FOLDER_ICON, PROJECT_ICON];
  for (const glyph of glyphs) {
    ok(page.includes(`id="${glyph}"`), `${glyph} is in the sprite`);
    ok(origin.includes(`\`${glyph}\``), `${glyph} has its provenance recorded`);
  }
  const actions = createActions({ store: createStore({ storage: fakeStorage() }), flows: {} });
  for (const action of actions) {
    ok(page.includes(`id="${action.icon}"`), `${action.id} draws under ${action.icon}, which is in the sprite`);
  }
}

// --- The dogfooding batch: what the review ordered -----------------------

{
  const shell = readFile('../app/shell.js');
  const page = readFile('../app/index.html');
  const origin = readFile('../app/assets/icons/ORIGIN.md');

  for (const glyph of ['i-launch', 'i-email']) {
    ok(page.includes(`id="${glyph}"`), `${glyph} is in the sprite`);
    ok(origin.includes(`\`${glyph}\``), `${glyph} has its provenance recorded`);
  }
  ok(shell.includes("window.open(url, '_blank', 'noopener')"), 'every external link leaves in a new tab, noopener');
  for (const label of ['Project site', 'Source on GitHub', 'Follow on LinkedIn', 'Write an email']) {
    ok(shell.includes(`label: '${label}'`), `the Help menu offers ${label}`);
  }
  ok(shell.includes("window.location.href = 'mailto:info@openconformity.org'"), 'the email is a mailto, not a tab');
  ok(
    !shell.includes("{ label: 'Metamodel', icon: 'i-launch'"),
    'the metamodel carries no launch mark: it leaves for no external site'
  );

  ok(shell.includes("const fileGroups = ['project', 'example']"), 'the File menu parts the example behind a separator');

  const editor = readFile('../app/editor.js');
  ok(
    editor.includes("if (event.key !== 'Escape' || mode !== 'edit') return;") && editor.includes('event.stopPropagation();'),
    'Escape in an open edit stops at the editor and never falls through to the overlay'
  );

  const sheet = readFile('../app/style.css');
  ok(sheet.includes('.table th {\n  position: sticky;'), 'the relationship table head stays put while the body scrolls');
}

// --- The second dogfooding batch -----------------------------------------

{
  const page = readFile('../app/index.html');
  const origin = readFile('../app/assets/icons/ORIGIN.md');
  ok(page.includes('id="i-checkmark"'), 'the pick check is in the sprite');
  ok(origin.includes('`i-checkmark`'), 'with its provenance recorded');
  for (const id of ['shell-undo', 'shell-redo']) {
    ok(page.includes(`id="${id}"`), `the shell's global cluster carries ${id}`);
  }

  const navigator = readFile('../app/navigator.js');
  ok(
    navigator.includes("const dragLocked = () => store.picker() !== null || filter().trim() !== ''"),
    'tree drag stands down while picking and while filtering'
  );

  const sheet = readFile('../app/style.css');
  ok(!sheet.includes('dashed var(--accent)'), 'the dashed candidate outlines are gone: dimming alone carries candidacy');

  const { LANDING_OFFER } = await import('../app/editor.js');
  const actions = createActions({ store: createStore({ storage: fakeStorage() }), flows: {} });
  for (const offer of LANDING_OFFER) {
    const action = actions.find((held) => held.id === offer.id);
    ok(action !== undefined, `${offer.id} is a real action`);
    ok(
      action.label === offer.label && action.icon === offer.icon,
      `the editor's ${offer.id} button matches the action's label and glyph`
    );
  }
}

// --- The fourth dogfooding batch -----------------------------------------

{
  const relationships = readFile('../app/relationships.js');
  ok(relationships.includes("el('colgroup', {}, ["), 'the two direction tables share one fixed column skeleton');
  ok(relationships.includes("className: 'rel-fold'"), 'each behind its compact fold');
  ok(!relationships.includes('rel-arrow'), 'the direction arrow column is gone: the split carries direction');
  ok(relationships.includes("className: 'field-input head-search'"), 'the list filter lives behind the head magnifier, on demand');

  const sheet = readFile('../app/style.css');
  ok(sheet.includes('table-layout: fixed;'), 'the tables lay out fixed, so the columns never drift');
  ok(sheet.includes('height: 32px;             /* Carbon data table sm */'), 'rows at Carbon short scale');

  const shell = readFile('../app/shell.js');
  ok(
    shell.includes("const LAYOUT_KEY = 'openconformity.layout'") && shell.includes('sessionStorage'),
    'the splitter geometry rides the browser session, never the project blob'
  );
}

// --- The pre-paint theme script speaks the store's literals --------------

{
  const page = readFile('../app/index.html');
  const source = readFile('../app/store.js');
  const key = source.match(/const THEME_KEY = '([^']+)'/)?.[1];
  ok(typeof key === 'string', 'the store names its theme key');
  ok(page.includes(`localStorage.getItem('${key}')`), 'the inline script reads the store’s own key');
  const themes = source
    .match(/const THEMES = \[([^\]]+)\]/)?.[1]
    .match(/'[^']+'/g)
    .map((quoted) => quoted.slice(1, -1));
  ok(Array.isArray(themes) && themes.length === 2, 'the store holds two themes');
  ok(
    page.includes(`stored === '${themes[0]}' || stored === '${themes[1]}'`),
    'the inline script accepts exactly the store’s theme values'
  );
  ok(page.includes(`? '${themes[1]}' : '${themes[0]}'`), 'and its system fallback lands on the same pair');
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
  ok(sheet.includes('min-width: 244px'), 'the pane floor is the toolbar: seven 32px buttons, six 2px gaps, 4px padding each side');
  ok(shell.includes('minimum: 244'), 'and the splitter stops at the same width');
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

summary('test-pins');
