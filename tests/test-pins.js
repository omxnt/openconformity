/**
 * Source pins: each check reads the published source, the page or a
 * bundled asset for a fact a requirement states and no behaviour test
 * can reach, the content security policy, the one frame and its sandbox,
 * the licences, the contrast of the tokens. A failure here means the
 * source no longer states that fact. Run from this directory.
 */

import './shim.js';
import { createActions } from '../app/modules/actions.js';
import { createStore } from '../app/modules/store.js';
import { hiddenContent, unknownContent } from '../app/modules/project.js';
import { loadProject } from '../app/modules/files.js';
import { LIBRARY } from '../app/library/data.js';
import { EXAMPLE_PROJECT } from '../app/modules/example.js';
import { LANDING_OFFER } from '../app/modules/landing.js';
import { ok, deepEqual, summary } from './harness.js';
import { fakeStorage } from './helpers.js';

/**
 * Every module the software loads, walked from the page's entry along
 * its imports, so a module is scanned the day it is imported and none
 * is listed by hand. Each as its path under app/ and its source.
 */
function modulesFrom(entry) {
  const seen = new Map();
  const walk = (path) => {
    if (seen.has(path)) return;
    const source = readFile(`../app/${path}`);
    seen.set(path, source);
    const folder = path.slice(0, path.lastIndexOf('/') + 1);
    for (const [, target] of source.matchAll(/\b(?:from|import) '(\.[^']+)'/g)) {
      const parts = (folder + target).split('/');
      const resolved = [];
      for (const part of parts) {
        if (part === '..') resolved.pop();
        else if (part !== '.') resolved.push(part);
      }
      walk(resolved.join('/'));
    }
  };
  walk(entry);
  return [...seen].map(([path, source]) => [path.replace(/^modules\//, '').replace(/\.js$/, ''), source]);
}
const sources = modulesFrom('modules/app.js').filter(([name]) => name !== 'example' && name !== 'library/data');
ok(sources.length >= 40, `${sources.length} modules load from the page's entry`);
const page = readFile('../app/index.html');
const sheet = readFile('../app/style.css');

// --- The page states its content security policy first (N-SEC-001, N-SEC-002, N-SEC-006, N-OPS-002) ---

{
  ok(page.includes(`<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; frame-src https://embed.diagrams.net; object-src 'none'; base-uri 'none'; form-action 'none'">`), 'the policy allows the software its own scripts, styles and fonts, images as data, one frame origin, and no connection, object, base or form');
  ok(page.indexOf('Content-Security-Policy') < page.indexOf('<script') && page.indexOf('Content-Security-Policy') < page.indexOf('<link'), 'stated before anything loads');
  ok(!/<script(?![^>]*\ssrc=)/.test(page) && !/\sstyle="/.test(page) && page.includes('<script src="theme.js"></script>'), 'no inline script or style stands on the page, the theme being a file');
}

// --- No module builds or parses markup from text (N-SEC-001, N-SEC-002) ---

{
  ok(sources.every(([, source]) => !/innerHTML|insertAdjacentHTML|outerHTML|srcdoc/.test(source)), 'every element is created and every string set as text');
  ok(sources.every(([name, source]) => name === 'drawing' || !source.includes('DOMParser')) && !readFile('../app/modules/drawing.js').includes('DOMParser'), 'no module parses markup with the browser, the drawing check reading XML itself');
  ok(sources.every(([, source]) => !/\beval\(|new Function\(/.test(source)), 'nothing evaluates text as code');
}

// --- The one frame, sandboxed, on the editor's origin (C-TEC-008, N-SEC-004, N-PRV-007) ---

{
  const editorModule = readFile('../app/modules/drawing-editor.js');
  ok(!page.includes('<iframe') && sources.every(([name, source]) => name === 'drawing' || name === 'drawing-editor' || !source.includes('iframe')), 'no frame stands in the page, and only the editor module creates one');
  ok(editorModule.split("el('iframe'").length === 2 && editorModule.indexOf("el('iframe'") > editorModule.indexOf("if (!store.consented() && !(await consent(dialogs, store))) return null;"), 'the one frame is created in one place, after the consent has been given');
  ok(editorModule.includes("sandbox: FRAME_SANDBOX,") && editorModule.includes("allow: FRAME_ALLOW,") && editorModule.includes("referrerpolicy: 'no-referrer',") && editorModule.includes("export const FRAME_SANDBOX = 'allow-scripts allow-same-origin';"), 'sandboxed to scripts on its own origin, allowed nothing, sending no referrer');
  ok(editorModule.includes("frame.contentWindow?.postMessage(JSON.stringify(message), EDITOR_ORIGIN)") && !editorModule.includes("postMessage(JSON.stringify(message), '*')"), "what is posted goes to the editor's origin alone");
  ok(editorModule.includes("const message = acceptMessage(event, frame.contentWindow);"), 'and what is heard passes the acceptance the session test drives');
  ok(editorModule.includes("post({ action: 'load', xml: embeddedModel(drawing) ?? '', autosave: 1 });") && !editorModule.includes('store.model()') && !editorModule.includes('store.project()'), "the one drawing's model is what is handed over, nothing of the project");
  ok(editorModule.includes("const verdict = checkDrawing(text);"), 'what returns is checked as a drawing is');
  ok(/text: `Diagrams are created and edited in draw\.io[^`]*\$\{EDITOR_ORIGIN\.replace\('https:\/\/', ''\)\}[^`]*diagram[^`]*`/.test(editorModule), 'the consent names the service, its origin and the diagram handed over (N-PRV-005)');
}

// --- Nothing leaves the page but by a link the user follows (N-PRV-002, N-OPS-002) ---

{
  ok(sources.every(([, source]) => !/\bfetch\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon/.test(source)), 'no module fetches, opens a socket or sends a beacon');
  ok(readFile('../app/modules/shell.js').includes("window.open(url, '_blank', 'noopener')") && /<a class="wordmark"[^>]*target="_blank"[^>]*rel="noopener"/.test(page), 'every external link leaves in a new tab with no opener');
  for (const theme of ['light', 'dark']) {
    let held = '';
    try {
      held = readFile(`../app/assets/images/metamodel-${theme}.png`);
    } catch {
      held = '';
    }
    ok(held.length > 0, `the ${theme} metamodel export is bundled, so the diagram opens without a network`);
  }
  ok(!sheet.includes('fonts.googleapis') && !sheet.includes('@import') && !/url\("https?:/.test(sheet), 'the stylesheet loads nothing from outside');
}

// --- A drawing reaches the page as an image from a data address (N-SEC-003) ---

{
  const cell = readFile('../app/modules/drawing-cell.js');
  const pictures = [...cell.matchAll(/el\('img', \{[^}]*attributes: \{ src: ([^,]+),/g)].map((match) => match[1]);
  deepEqual(pictures, ['dataUrl(text)', 'dataUrl(text)'], 'the two picture elements, the card and the enlargement, take the drawing as a data address');
  ok(sources.every(([name, source]) => name === 'drawing-cell' || !/el\('img'/.test(source)) && !page.includes('<img'), 'and no other module or the page draws a picture');
  ok(!cell.includes("el('svg'") && !cell.includes("el('object'") && !cell.includes("el('embed'"), 'never as markup in the page');
}

// --- Nothing is read from the address (N-PRV-002, N-SEC-010) ---

{
  ok(sources.every(([, source]) => !/location\.(search|hash)|window\.name\b|URLSearchParams|document\.referrer/.test(source)), 'no module reads the address, the window name or the referrer');
  ok(sources.every(([name, source]) => name === 'shell' || !source.includes('location.href')) && readFile('../app/modules/shell.js').split('location.href').length === 2 && readFile('../app/modules/shell.js').includes("window.location.href = 'mailto:info@openconformity.org';"), 'the address is written once, to open the mail client, and never read');
}

// --- Only the model changes filing, so its children index stays true (F-WSP-001, F-WSP-004) ---

{
  const writers = sources.filter(([name, source]) => name !== 'model' && /\.nodes\.(set|delete|clear)\(|\.parent\s*=[^=]/.test(source)).map(([name]) => name);
  ok(writers.length === 0, `no module but the model writes to the node list or to a parent${writers.length > 0 ? ` (written in: ${writers.join(', ')})` : ''}`);
}

// --- The host is told to refuse framing (N-SEC-007) -----------------------

{
  const headers = readFile('../app/_headers').split('\n');
  ok(headers[0] === '/*' && headers.includes("  Content-Security-Policy: frame-ancestors 'none'"), 'every path carries the header that forbids framing on another origin');
  ok(headers.includes('  Strict-Transport-Security: max-age=15552000; includeSubDomains') && headers.includes('  X-Content-Type-Options: nosniff'), 'with transport security and no type sniffing');
}

// --- The software is static files of the web platform (C-TEC-001, C-TEC-002, C-TEC-004, C-TEC-007) ---

{
  const files = [...(globalThis.arguments ?? [])];
  ok(files.includes('index.html') && files.includes('modules/app.js'), `run.sh hands over the ${files.length} files under app/`);
  const kinds = new Set(['html', 'css', 'js', 'svg', 'png', 'woff2', 'txt', 'md']);
  const foreign = files.filter((path) => path !== '_headers' && !kinds.has(path.slice(path.lastIndexOf('.') + 1)));
  ok(foreign.length === 0, `every file is markup, style, script, an image, a font or a text${foreign.length > 0 ? ` (not: ${foreign.join(', ')})` : ''}`);
  ok(files.every((path) => !path.startsWith('functions/') && path !== '_worker.js' && path !== '_routes.json'), 'and none is code the host would run');
  const code = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok(sources.every(([, source]) => [...code(source).matchAll(/\b(?:from|import) '([^']+)'/g)].every(([, target]) => target.startsWith('.')) && !/\bimport\(/.test(code(source))), 'every import is a relative path to a file of the software, none loaded on demand');
  const scripts = [...page.matchAll(/<script\b[^>]*>/g)].map((match) => match[0]);
  ok(scripts.length === 2 && scripts.filter((tag) => tag.includes('type="module"')).length === 1 && scripts.includes('<script src="theme.js">'), 'every script on the page is a module but the theme script, which runs before the stylesheet');
}

// --- The file surface stays on the baseline (F-PER-001, N-CMP-002) ---

{
  ok(page.includes('id="file-input"') && page.includes('accept=".json'), 'a .json file input is the way in');
  ok(sources.every(([, source]) => !source.includes('showOpenFilePicker') && !source.includes('showSaveFilePicker')), 'no module uses the File System Access API');
  ok(!readFile('../app/modules/history.js').includes('structuredClone'), 'a snapshot is copied by hand, so an older browser without structuredClone runs the software');
}

// --- The shipped data opens without a question (N-SEC-005) ---

{
  for (const [name, data] of [['library', LIBRARY], ['example', EXAMPLE_PROJECT]]) {
    const loaded = loadProject(data);
    ok(loaded.ok && hiddenContent(loaded.model).count === 0 && unknownContent(loaded.model).length === 0, `the shipped ${name} holds nothing under a choice not in force and nothing no definition presents`);
  }
}

// --- The licences ride with the software (C-PRJ-003, C-TEC-005) ---

{
  ok(readFile('../app/LICENSE.txt').includes('EUROPEAN UNION PUBLIC LICENCE v. 1.2'), 'the EUPL-1.2 text is reachable at LICENSE.txt');
  ok(readFile('../app/assets/fonts/LICENSE.txt').includes('SIL OPEN FONT LICENSE'), 'the OFL rides with the fonts');
  ok(readFile('../app/assets/icons/LICENSE.txt').includes('Apache License'), 'the Apache licence rides with the icons');
}

// --- No standard's content is transcribed (C-PRJ-005) ---

{
  const doc = readFile('../specs/attributes.md');
  ok(!doc.includes('PL risk graph') && !doc.includes('SIL matrix') && !doc.includes('| rated |') && !doc.includes('ISO 13849-1:2023, Safety of machinery'), 'no table of a harmonised standard reads a level, the tool ships no table nobody has verified');
  ok(!readFile('../app/modules/rating.js').includes('PL_') && !readFile('../app/modules/rating.js').includes('SIL_'), "the rating dialog draws the scenario's methods alone");
  ok(doc.includes('| [2] | SEBoK, Guide to the Systems Engineering Body of Knowledge, System Requirements') && doc.includes("SEBoK's requirements article [2]"), 'the requirement categories cite their source, with none of its text');
}

// --- Every glyph drawn is in the sprite, with its provenance (C-TEC-005, G-SYS-004) ---

{
  const origin = readFile('../app/assets/icons/ORIGIN.md');
  const named = new Set();
  for (const [, source] of sources) for (const [, glyph] of source.matchAll(/'(i-[a-z0-9-]+)'/g)) named.add(glyph);
  for (const [, glyph] of page.matchAll(/href="#(i-[a-z0-9-]+)"/g)) named.add(glyph);
  ok(named.size > 30, `the software names ${named.size} glyphs`);
  for (const glyph of [...named].sort()) {
    ok(page.includes(`<symbol id="${glyph}"`), `${glyph} is in the sprite`);
    ok(origin.includes(`\`${glyph}\``), `${glyph} has its provenance recorded`);
  }
  const actions = createActions({ store: createStore({ storage: fakeStorage() }), flows: {} });
  ok(actions.every((action) => named.has(action.icon)), 'every action draws under a named glyph');
}

// --- The ways into a project are the actions themselves (F-APP-002) ---

{
  const actions = createActions({ store: createStore({ storage: fakeStorage() }), flows: {} });
  for (const offer of LANDING_OFFER) {
    const action = actions.find((held) => held.id === offer.id);
    ok(action !== undefined && action.label === offer.label && action.icon === offer.icon, `the landing's ${offer.id} is the action, under its label and glyph`);
  }
  ok(!readFile('../app/modules/navigator.js').includes('landing-'), 'and the navigator landing carries no buttons, they live in one place');
}

// --- Pane headers are landmarks (G-SYS-005, N-ACC-001) ---

{
  ok(!page.includes('pane-title'), 'no pane header only names its pane');
  for (const pane of ['Navigator', 'Editor', 'Relationships']) {
    ok(page.includes(`aria-label="${pane}"`), `the ${pane} pane stays an ARIA landmark`);
  }
  ok(!page.includes(' title="'), 'no control on the page relies on a browser title for its name');
}

// --- The pre-paint theme script speaks the store's literals (N-CMP-002) ---

{
  const script = readFile('../app/theme.js');
  const source = readFile('../app/modules/store.js');
  const key = source.match(/const THEME_KEY = '([^']+)'/)?.[1];
  ok(typeof key === 'string', 'the store names its theme key');
  ok(script.includes(`localStorage.getItem('${key}')`), "the theme script reads the store's own key");
  const themes = source
    .match(/const THEMES = \[([^\]]+)\]/)?.[1]
    .match(/'[^']+'/g)
    .map((quoted) => quoted.slice(1, -1));
  ok(Array.isArray(themes) && themes.length === 2, 'the store holds two themes');
  ok(script.includes(`stored === '${themes[0]}' || stored === '${themes[1]}'`), "the theme script accepts exactly the store's theme values");
  ok(script.includes(`? '${themes[1]}' : '${themes[0]}'`), 'and its system fallback lands on the same pair');
}

// --- The minimum viewport (F-APP-001, N-CMP-001) ---------------------------

{
  ok(sheet.includes('@media screen and (max-width: 999.98px), screen and (max-height: 355.98px)'), 'the notice covers both floors, 1000 wide and 356 tall, on a screen and never on paper');
  ok(page.includes('at least 1000 pixels wide and 356 pixels tall'), 'and states both numbers');
}

// --- Pointer targets (N-ACC-001) ---------------------------------------------

{
  ok(sheet.includes('.splitter-vertical::after { inset: 0 -10px;') && sheet.includes('.splitter-horizontal::after { inset: -10px 0;'), 'the splitters take a 24px pointer target around the 4px bar');
}

// --- Text carries AA contrast in both themes (N-ACC-001) --------------------

{
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

  ok(!sheet.includes('var(--text-place)'), 'the placeholder tier styles no text, what reads must meet AA');
  ok(sheet.includes('.dialog a { color: var(--link); text-decoration: underline; }'), 'a link inside prose is underlined, colour alone cannot mark it (N-ACC-002)');
}

// --- The typefaces, vendored and applied (G-SYS-002, G-SYS-003) --------------

{
  const faces = [...sheet.matchAll(/@font-face \{\s*font-family: "([^"]+)";\s*src: url\("assets\/fonts\/([^"]+)"\) format\("woff2"\);/g)].map((match) => [match[1], match[2]]);
  deepEqual(faces.map(([family]) => family), ['IBM Plex Sans', 'IBM Plex Sans', 'IBM Plex Mono'], 'the two typefaces are declared from the stylesheet, Plex Sans in two weights and Plex Mono in one');
  for (const [, file] of faces) ok(readFile(`../app/assets/fonts/${file}`).length > 0, `${file} is vendored with the software`);
  ok(readFile('../app/assets/fonts/LICENSE.txt').includes('SIL Open Font License') || readFile('../app/assets/fonts/LICENSE.txt').includes('OFL'), 'under their open licence');
  ok(sheet.includes('body {\n  font-family: "IBM Plex Sans", Tahoma, sans-serif;'), 'prose renders in IBM Plex Sans, from the body down');
  ok(sheet.includes('.mono {\n  font-family: "IBM Plex Mono", ui-monospace, monospace;'), 'and identifiers and data values in IBM Plex Mono');
}

// --- The release line (no requirement) ------------------------------------

{
  const version = readFile('../app/modules/version.js');
  ok(/export const VERSION = '\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?';/.test(version) && /export const PHASE = '[A-Z][a-z]+( beta)?';/.test(version), 'the version is a semantic version and the phase one word, two constants in one module');
  ok(!readFile('../app/modules/columns.js').includes('Storage'), 'the column widths dragged in a table die with the visit, never stored');
}

summary('test-pins');
