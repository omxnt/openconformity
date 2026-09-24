/**
 * Exercises the external editor's pure parts against a fake frame: which
 * messages are heard, how an export is decoded, and the session from
 * loading to the drawing returned, with every failure. Run from this
 * directory.
 */

import './shim.js';
import {
  EDITOR_ORIGIN,
  EDITOR_URL,
  EDITOR_CONFIG,
  FRAME_SANDBOX,
  READY_PERIOD,
  EXPORT_PERIOD,
  MESSAGE_LIMIT,
  acceptMessage,
  bytesOfBase64,
  textOfUtf8,
  decodeExport,
  createSession,
} from '../app/modules/drawing-editor.js';
import { ok, equal, deepEqual, summary } from './harness.js';

const fixture = readFile('fixtures/example.drawio.svg');
const GOOD = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHRleHQ+w6kg4pyTPC90ZXh0Pjwvc3ZnPg==';
const GOOD_TEXT = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><text>é ✓</text></svg>';
const HOSTILE = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHNjcmlwdD4xPC9zY3JpcHQ+PC9zdmc+';

/** Text as base64 of its UTF-8, the way the editor sends an export, for the fixture. */
function base64Of(text) {
  const escaped = encodeURIComponent(text);
  const bytes = [];
  for (let at = 0; at < escaped.length; at += 1) {
    if (escaped[at] === '%') {
      bytes.push(parseInt(escaped.slice(at + 1, at + 3), 16));
      at += 2;
    } else bytes.push(escaped.charCodeAt(at));
  }
  const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let at = 0; at < bytes.length; at += 3) {
    const chunk = (bytes[at] << 16) | ((bytes[at + 1] ?? 0) << 8) | (bytes[at + 2] ?? 0);
    out += table[chunk >> 18] + table[(chunk >> 12) & 63] + (at + 1 < bytes.length ? table[(chunk >> 6) & 63] : '=') + (at + 2 < bytes.length ? table[chunk & 63] : '=');
  }
  return out;
}
const EXPORTED = `data:image/svg+xml;base64,${base64Of(fixture)}`;
const TWO_PAGES = `data:image/svg+xml;base64,${base64Of('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" content="&lt;mxfile&gt;&lt;diagram id=&quot;a&quot;/&gt;&lt;diagram id=&quot;b&quot;/&gt;&lt;/mxfile&gt;"><g/></svg>')}`;

// --- The origin and the frame --------------------------------------------------

{
  equal(EDITOR_ORIGIN, 'https://embed.diagrams.net', "the editor's origin is fixed, and named to the user");
  ok(EDITOR_URL.startsWith(`${EDITOR_ORIGIN}/?embed=1&proto=json`), 'its page is on that origin in embed mode with the JSON protocol');
  ok(EDITOR_URL.includes('noSaveBtn=1') && EDITOR_URL.includes('saveAndExit=0') && EDITOR_URL.includes('noExitBtn=1') && EDITOR_URL.includes('libraries=0'), 'with none of its own Save or Exit buttons and no shape libraries');
  ok(EDITOR_URL.includes('pages=0') && EDITOR_URL.includes('plugins=0') && EDITOR_URL.includes('configure=1'), 'no page bar, no plugins, and asking to be configured');
  ok(EDITOR_CONFIG.suppressNewWindows === true && EDITOR_CONFIG.enableCustomLibraries === false && EDITOR_CONFIG.restrictExport === undefined, 'the configuration opens no window and no library, and does not restrict export, which would take Edit Diagram away');
  equal(EDITOR_CONFIG.maxImageBytes, 256 * 1024, 'a picture placed in the diagram may be a quarter of the drawing size limit at most, refused on insertion rather than the diagram on Apply');
  ok(EDITOR_CONFIG.css.includes('.geTabContainer:has(.gePageTab):not(:has(.gePageTab ~ .gePageTab)) { display: none !important; }') && EDITOR_CONFIG.css.includes('.geControlTab { display: none !important; }'), 'the page bar is hidden by style only while exactly one page tab is found, so it shows past one page and whenever the editor\'s class names change, its own page controls hidden');
  deepEqual(EDITOR_CONFIG.hideMenuItems, ['exportAs', 'importFrom', 'print', 'embed', 'publish', 'share', 'plugins', 'configuration', 'rename'], 'hidden: import and export, print, what would publish or share, what loads code, and what names a file that is not there');
  deepEqual(EDITOR_CONFIG.hideMenus, ['help'], 'and the help menu, whose items open windows');
  ok(!EDITOR_CONFIG.hideMenuItems.includes('editDiagram') && !EDITOR_CONFIG.hideMenuItems.includes('pageSetup'), 'Edit Diagram and page setup stay, the one being how a diagram travels as XML');
  equal(FRAME_SANDBOX, 'allow-scripts allow-same-origin', 'the frame runs scripts on its own origin and may do nothing else');
  ok(!EDITOR_ORIGIN.includes('openconformity'), 'and that origin is never the software\'s own');
}

// --- What is heard ---------------------------------------------------------------

{
  const frameWindow = {};
  const message = (data, source = frameWindow, origin = EDITOR_ORIGIN) => acceptMessage({ source, origin, data }, frameWindow);
  deepEqual(message(JSON.stringify({ event: 'init' })), { event: 'init' }, 'a known event from the frame and the origin is heard');
  equal(message(JSON.stringify({ event: 'init' }), {}), null, 'from another window it is not');
  equal(message(JSON.stringify({ event: 'init' }), frameWindow, 'https://evil.example'), null, 'from another origin it is not');
  equal(message({ event: 'init' }), null, 'an object rather than a string is not');
  equal(message(`{"event":"init","pad":"${'x'.repeat(MESSAGE_LIMIT)}"}`), null, 'a message past the limit is not');
  equal(message('{not json'), null, 'what is not JSON is not');
  equal(message(JSON.stringify({ event: 'evaluate' })), null, 'an event the editor is not known to send is not');
  equal(message(JSON.stringify(['init'])), null, 'nor an array');
  equal(message(JSON.stringify(null)), null, 'nor nothing');
  equal(acceptMessage({ source: null, origin: EDITOR_ORIGIN, data: '{"event":"init"}' }, null), null, 'and nothing is heard while there is no frame');
}

// --- Decoding an export ------------------------------------------------------------

{
  deepEqual(bytesOfBase64('aGk='), [104, 105], 'base64 decodes');
  deepEqual(bytesOfBase64('aG k=\n'), [104, 105], 'whitespace within is ignored');
  equal(base64Of('hi'), 'aGk=', 'the test\'s own encoder agrees');
  equal(base64Of(GOOD_TEXT), GOOD, 'on the drawing with two-byte and three-byte characters too');
  equal(textOfUtf8([0xc3, 0xa9, 0x20, 0xe2, 0x9c, 0x93]), 'é ✓', 'UTF-8 decodes, two and three bytes wide');
  let threw = false;
  try {
    textOfUtf8([0xc3]);
  } catch {
    threw = true;
  }
  ok(threw, 'a cut sequence is a fault, not a guess');
  equal(decodeExport({ event: 'export', format: 'xmlsvg', data: `data:image/svg+xml;base64,${GOOD}` }), GOOD_TEXT, 'an SVG export decodes to its text');
  equal(decodeExport({ event: 'export', format: 'xmlsvg', data: `data:image/svg+xml;charset=utf-8;base64,${GOOD}` }), GOOD_TEXT, 'with a charset in the way as well');
  equal(decodeExport({ event: 'export', format: 'svg', data: `data:image/svg+xml;base64,${GOOD}` }), GOOD_TEXT, "and under the name the editor answers an xmlsvg request with, 'svg'");
  equal(decodeExport({ event: 'export', format: 'png', data: `data:image/svg+xml;base64,${GOOD}` }), null, 'an export of another format is nothing');
  equal(decodeExport({ event: 'export', format: 'xmlsvg', data: `data:image/png;base64,${GOOD}` }), null, 'a data URL of another type is nothing');
  equal(decodeExport({ event: 'export', format: 'xmlsvg', data: 'data:image/svg+xml;base64,@@@' }), null, 'what is not base64 is nothing');
  equal(decodeExport({ event: 'export', format: 'xmlsvg' }), null, 'no data is nothing');
}

// --- The session, against a fake frame ------------------------------------------

/** A session with everything it posts and every timer it sets in hand. */
function drive(drawing) {
  const posted = [];
  const timers = [];
  const events = [];
  const session = createSession({
    drawing,
    post: (message) => posted.push(message),
    setTimer: (fn, ms) => {
      const timer = { fn, ms, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer: (timer) => {
      timer.cleared = true;
    },
    onReady: () => events.push('ready'),
    onChanged: () => events.push('changed'),
    onDone: (text) => events.push(['done', text]),
    onRefuse: (why) => events.push(['refuse', why]),
    onFail: (why) => events.push(['fail', why]),
  });
  return { session, posted, timers, events };
}

{
  const { session, posted, timers, events } = drive(fixture);
  equal(session.state(), 'loading', 'a session starts loading');
  deepEqual([timers.length, timers[0].ms], [1, READY_PERIOD], 'with the readiness period running');
  deepEqual(posted, [], 'and nothing posted before the editor speaks');
  session.hear({ event: 'export', format: 'xmlsvg', data: `data:image/svg+xml;base64,${GOOD}` });
  deepEqual(events, [], 'an export before Apply is ignored');
  session.hear({ event: 'configure' });
  deepEqual(posted, [{ action: 'configure', config: EDITOR_CONFIG }], 'the editor asking to be configured is told what to hide');
  session.hear({ event: 'init' });
  equal(session.state(), 'editing', 'the first word from the editor opens the editing');
  ok(timers[0].cleared, 'the readiness period is over');
  equal(posted.length, 2, 'and one more message goes out');
  deepEqual(Object.keys(posted[1]), ['action', 'xml', 'autosave'], 'the load of the drawing, with autosave for the sign of change');
  ok(posted[1].action === 'load' && posted[1].xml.startsWith('<mxfile ') && posted[1].autosave === 1, "the drawing's own model, nothing of the project, not even the theme, nothing else");
  deepEqual(events, ['ready'], 'ready is told');
  session.hear({ event: 'init' });
  session.hear({ event: 'configure' });
  equal(posted.length, 2, 'a second init or a late configure changes nothing');
  equal(session.changed(), false, 'nothing has changed yet');
  session.hear({ event: 'autosave', xml: '<mxfile>changed</mxfile>' });
  equal(session.changed(), true, 'an autosave is the sign of a change');
  deepEqual(events.at(-1), 'changed', 'and is told');
  session.hear({ event: 'openLink', href: 'https://evil.example' });
  session.hear({ event: 'exit', modified: true });
  equal(posted.length, 2, 'links and exits are ignored');
  ok(session.apply(), 'Apply asks for the drawing');
  equal(session.state(), 'exporting', 'and the session exports');
  deepEqual(posted[2], { action: 'export', format: 'xmlsvg', embedImages: true, theme: 'light', keepTheme: false, spin: 'Applying' }, 'as SVG with the model inside, images embedded, in the light appearance whatever the editor shows');
  deepEqual([timers.length, timers[1].ms], [2, EXPORT_PERIOD], 'with the export period running');
  ok(!session.apply(), 'Apply twice asks once');
  session.hear({ event: 'export', format: 'svg', data: EXPORTED, xml: '<mxfile/>' });
  deepEqual(events.at(-1), ['done', fixture], 'the export comes back as the drawing, checked, under the format name the editor answers with');
  equal(session.state(), 'done', 'and the session is done');
  ok(timers[1].cleared, 'the export period is over');
}

{
  const { session, posted, events } = drive('');
  session.hear({ event: 'init' });
  equal(posted[0].xml, '', 'no drawing loads the editor empty');
  session.hear({ event: 'save' });
  equal(session.state(), 'exporting', "the editor's own save is Apply");
  session.hear({ event: 'export', format: 'xmlsvg', data: `data:image/svg+xml;base64,${HOSTILE}` });
  deepEqual(events.at(-1), ['refuse', 'returned a diagram that holds a script element'], 'a hostile export is refused with the check\'s reason');
  equal(session.state(), 'editing', 'and the session is back in editing, the editor still open');
  ok(session.apply(), 'so the drawing can be amended and applied again');
  session.hear({ event: 'export', format: 'svg', data: EXPORTED });
  deepEqual(events.at(-1), ['done', fixture], 'and taken back once it passes');
}

{
  const { session, events } = drive('<svg xmlns="http://www.w3.org/2000/svg"/>');
  session.hear({ event: 'init' });
  session.apply();
  session.hear({ event: 'export', format: 'xmlsvg', data: 'data:image/png;base64,AAAA' });
  deepEqual(events.at(-1), ['refuse', 'returned something that is not a diagram'], 'an export that is no SVG is refused');
  equal(session.state(), 'editing', 'with the editor still open');
}

{
  const { session, events } = drive(fixture);
  session.hear({ event: 'init' });
  session.apply();
  session.hear({ event: 'export', format: 'xmlsvg', data: `data:image/svg+xml;base64,${GOOD}` });
  deepEqual(events.at(-1), ['refuse', 'returned a diagram without its model'], 'a drawing that passes the check but carries no model is refused, since it could not be edited again');
  equal(session.state(), 'editing', 'with the editor still open');
}

{
  const { session, events } = drive(fixture);
  session.hear({ event: 'init' });
  session.apply();
  session.hear({ event: 'export', format: 'svg', data: TWO_PAGES });
  deepEqual(events.at(-1), ['refuse', 'returned a diagram with more than one page'], 'a model of two pages is refused, since the picture would show one');
  equal(session.state(), 'editing', 'with the editor still open to drop a page');
}

{
  const { session, timers, events } = drive(fixture);
  timers[0].fn();
  deepEqual(events, [['fail', 'could not be loaded']], 'an editor silent past the readiness period could not be loaded');
  equal(session.state(), 'done', 'and the session is done');
  session.hear({ event: 'init' });
  deepEqual(events.length, 1, 'a late init changes nothing');
}

{
  const { session, timers, events } = drive(fixture);
  session.hear({ event: 'init' });
  session.apply();
  timers[1].fn();
  deepEqual(events.at(-1), ['refuse', 'did not return the diagram'], 'an editor silent past the export period did not return the drawing');
  equal(session.state(), 'editing', 'and the session is back in editing');
  ok(session.apply() && timers.length === 3, 'so Apply can be tried again, with a fresh period');
}

{
  const { session, timers, posted } = drive(fixture);
  session.cancel();
  ok(timers[0].cleared && session.state() === 'done', 'Cancel ends a loading session and its period');
  session.hear({ event: 'init' });
  deepEqual(posted, [], 'and nothing is posted after it');
}

summary('test-drawing-editor');
