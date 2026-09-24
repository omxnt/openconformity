/**
 * The external drawing editor: draw.io's embed, used through a
 * sandboxed frame on its own origin, after the user's consent on every
 * edit unless they chose not to be asked again this session. Nothing of
 * the editor is loaded before Continue; what is posted to it is the one
 * drawing being edited and nothing else; what it returns passes the
 * drawing check before it enters the draft; and every message from it
 * is accepted only from its frame and its origin, as data, or dropped.
 * The session's states, what they post and what they make of what they
 * hear are pure, so a test drives them against a fake frame; the frame
 * itself, the dialogs and the listener are built here and nowhere else.
 */

import { el, icon } from './dom.js';
import { checkDrawing, embeddedModel } from './drawing.js';

/** The editor's origin, fixed here and named to the user before it is loaded. */
export const EDITOR_ORIGIN = 'https://embed.diagrams.net';

/** The editor's page: embed mode with the JSON protocol, no shape libraries, and none of its own Save or Exit buttons, ours standing in the dialog. */
export const EDITOR_URL = `${EDITOR_ORIGIN}/?embed=1&proto=json&spin=1&libraries=0&noSaveBtn=1&saveAndExit=0&noExitBtn=1&modified=0`;

/**
 * What the frame may do: run scripts, since the editor is one, and keep
 * its own origin, since the editor fetches its stencils from there and
 * an opaque origin would refuse them and give its messages no origin to
 * check. Nothing else: no navigation of the page, no popups, no forms,
 * no downloads, no modals. The pairing is safe only because the editor
 * is on another origin.
 */
export const FRAME_SANDBOX = 'allow-scripts allow-same-origin';

/** What the frame may ask the browser for: nothing that reaches the device. */
export const FRAME_ALLOW = "camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'; payment 'none'; display-capture 'none'";

/** How long the editor has to signal readiness, and to return the drawing. */
export const READY_PERIOD = 10000;
export const EXPORT_PERIOD = 10000;

/** The longest message accepted from the frame. */
export const MESSAGE_LIMIT = 8 * 1024 * 1024;

/** The events the editor may send; anything else is dropped unread. */
const EVENTS = new Set(['init', 'load', 'configure', 'autosave', 'save', 'exit', 'export', 'openLink']);

/**
 * Whether a message may be heard, and what it says: only from the
 * frame's own window and the editor's origin, only a string within the
 * limit, only JSON holding an event the editor is known to send.
 * @param {{ source: unknown, origin: string, data: unknown }} event
 * @param {unknown} frameWindow  the frame's content window
 * @returns {Object|null}  the message, or null for anything else
 */
export function acceptMessage(event, frameWindow) {
  if (!frameWindow || event.source !== frameWindow || event.origin !== EDITOR_ORIGIN) return null;
  if (typeof event.data !== 'string' || event.data.length > MESSAGE_LIMIT) return null;
  let message;
  try {
    message = JSON.parse(event.data);
  } catch {
    return null;
  }
  if (message === null || typeof message !== 'object' || Array.isArray(message) || !EVENTS.has(message.event)) return null;
  return message;
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** The bytes of a base64 text; throws on anything that is not base64. */
export function bytesOfBase64(text) {
  const clean = text.replace(/\s/g, '').replace(/=+$/, '');
  if (/[^A-Za-z0-9+/]/.test(clean)) throw new Error('not base64');
  const bytes = [];
  let buffer = 0;
  let bits = 0;
  for (const held of clean) {
    buffer = (buffer << 6) | BASE64.indexOf(held);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
      buffer &= (1 << bits) - 1;
    }
  }
  return bytes;
}

/** The text of UTF-8 bytes; throws on anything that is not UTF-8. */
export function textOfUtf8(bytes) {
  let out = '';
  let at = 0;
  while (at < bytes.length) {
    const lead = bytes[at];
    let code;
    let extra;
    if (lead < 0x80) {
      code = lead;
      extra = 0;
    } else if ((lead & 0xe0) === 0xc0) {
      code = lead & 0x1f;
      extra = 1;
    } else if ((lead & 0xf0) === 0xe0) {
      code = lead & 0x0f;
      extra = 2;
    } else if ((lead & 0xf8) === 0xf0) {
      code = lead & 0x07;
      extra = 3;
    } else throw new Error('not UTF-8');
    for (let k = 1; k <= extra; k += 1) {
      const held = bytes[at + k];
      if (held === undefined || (held & 0xc0) !== 0x80) throw new Error('not UTF-8');
      code = (code << 6) | (held & 0x3f);
    }
    out += String.fromCodePoint(code);
    at += extra + 1;
  }
  return out;
}

/** The formats the editor names an SVG export by: the one asked for, and the one it answers with. */
const SVG_FORMATS = new Set(['xmlsvg', 'svg']);

/**
 * The drawing an export message carries, as text, or null where the
 * message is not an SVG export as a base64 data URL.
 * @param {Object} message  an accepted message
 * @returns {string|null}
 */
export function decodeExport(message) {
  if (!SVG_FORMATS.has(message.format) || typeof message.data !== 'string') return null;
  const match = /^data:image\/svg\+xml(?:;[^,;]+)*;base64,/.exec(message.data);
  if (!match) return null;
  try {
    return textOfUtf8(bytesOfBase64(message.data.slice(match[0].length)));
  } catch {
    return null;
  }
}

/**
 * A session with the editor, from the frame's first word to the drawing
 * it returns: loading until the editor signals ready within its period,
 * then editing, then exporting once Apply is pressed until the drawing
 * arrives within its period. What is posted is the one drawing's model
 * on ready and the export request on Apply; what is heard is init,
 * autosave as a sign of change, save as Apply, and the export; the rest
 * is ignored. An editor that never becomes ready ends the session with
 * its reason. A drawing refused on return, or not returned in time, is
 * refused with its reason and the session back in editing, so the user
 * can amend the drawing and apply again.
 * @param {Object} spec
 * @param {string} spec.drawing  the drawing as stored, '' for none
 * @param {(message: Object) => void} spec.post
 * @param {(fn: () => void, ms: number) => any} spec.setTimer
 * @param {(timer: any) => void} spec.clearTimer
 * @param {() => void} spec.onReady
 * @param {() => void} spec.onChanged
 * @param {(text: string) => void} spec.onDone
 * @param {(why: string) => void} spec.onRefuse  completes "The editor …", the session still editing
 * @param {(why: string) => void} spec.onFail  completes "The editor …", the session over
 */
export function createSession({ drawing, post, setTimer, clearTimer, onReady, onChanged, onDone, onRefuse, onFail }) {
  let state = 'loading';
  let changed = false;
  let timer = setTimer(() => fail('could not be loaded'), READY_PERIOD);
  function fail(why) {
    if (state === 'done') return;
    state = 'done';
    clearTimer(timer);
    onFail(why);
  }
  function refuse(why) {
    state = 'editing';
    onRefuse(why);
  }
  const session = {
    hear(message) {
      if (state === 'done') return;
      if (message.event === 'init') {
        if (state !== 'loading') return;
        clearTimer(timer);
        state = 'editing';
        post({ action: 'load', xml: embeddedModel(drawing) ?? '', autosave: 1 });
        onReady();
      } else if (message.event === 'autosave') {
        changed = true;
        onChanged();
      } else if (message.event === 'save') {
        session.apply();
      } else if (message.event === 'export') {
        if (state !== 'exporting') return;
        clearTimer(timer);
        const text = decodeExport(message);
        if (text === null) {
          refuse('returned something that is not a diagram');
          return;
        }
        const verdict = checkDrawing(text);
        if (!verdict.ok) {
          refuse(`returned a diagram that ${verdict.reason}`);
          return;
        }
        if (embeddedModel(text) === null) {
          refuse('returned a diagram without its model');
          return;
        }
        state = 'done';
        onDone(text);
      }
    },
    /** Ask for the drawing; false while the editor is not ready for it. */
    apply() {
      if (state !== 'editing') return false;
      state = 'exporting';
      timer = setTimer(() => refuse('did not return the diagram'), EXPORT_PERIOD);
      post({ action: 'export', format: 'xmlsvg', embedImages: true, theme: 'light', keepTheme: false, spin: 'Applying' });
      return true;
    },
    cancel() {
      if (state === 'done') return;
      state = 'done';
      clearTimer(timer);
    },
    changed: () => changed,
    state: () => state,
  };
  return session;
}

/**
 * The consent asked before the editor loads: what it is, where it comes
 * from, what is handed to it, and the box not to be asked again this
 * session. Resolves whether to go on.
 */
async function consent(dialogs, store) {
  const box = el('input', { attributes: { type: 'checkbox', id: 'drawio-consent-box' } });
  const body = el('div', { className: 'consent' }, [
    el('p', { text: `The diagram editor is draw.io, loaded from ${EDITOR_ORIGIN} when you continue. Loading it is a request to that origin, and the request shows in your network.` }),
    el('p', { text: 'The diagram being edited is handed to the editor. Nothing else of the project is.' }),
    el('label', { className: 'consent-box', attributes: { for: 'drawio-consent-box' } }, [box, el('span', { className: 'checkbox' }, [icon('i-checkmark')]), el('span', { text: "Don't ask again this session" })]),
  ]);
  const picked = await dialogs.open({
    title: 'Open draw.io',
    body,
    actions: [
      { label: 'Cancel', value: false, kind: 'secondary' },
      { label: 'Continue', value: true, kind: 'primary' },
    ],
  });
  if (picked === true && box.checked) store.setConsented(true);
  return picked === true;
}

/**
 * Edit a drawing in the external editor. Resolves the drawing the
 * editor returned, checked, or null when the user cancelled, declined,
 * or the editor failed; the model is never touched here, the caller
 * placing the result in the draft.
 * @param {Object} spec
 * @param {ReturnType<import('./dialog.js').createDialogs>} spec.dialogs
 * @param {{ consented: () => boolean, setConsented: (held: boolean) => void }} spec.store
 * @param {string} spec.drawing  as stored, '' for none
 * @param {string} spec.subject  what the drawing is of, for the titles
 * @returns {Promise<string|null>}
 */
export async function editDrawing({ dialogs, store, drawing, subject }) {
  if (!store.consented() && !(await consent(dialogs, store))) return null;
  const note = el('p', { className: 'drawing-editor-note', attributes: { role: 'status' } });
  const frame = el('iframe', {
    attributes: {
      src: EDITOR_URL,
      sandbox: FRAME_SANDBOX,
      allow: FRAME_ALLOW,
      referrerpolicy: 'no-referrer',
      title: `draw.io, editing the diagram of ${subject}`,
    },
  });
  const host = el('div', { className: 'drawing-editor' }, [note, frame]);
  const foreign = drawing !== '' && embeddedModel(drawing) === null;
  let settleApply = null;
  const session = createSession({
    drawing,
    post: (message) => frame.contentWindow?.postMessage(JSON.stringify(message), EDITOR_ORIGIN),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (timer) => clearTimeout(timer),
    onReady: () => {
      note.textContent = foreign ? 'This diagram was not made in draw.io, so the editor opens empty. Apply replaces it with what is drawn here.' : '';
    },
    onChanged: () => {},
    onDone: (text) => settleApply?.(text),
    onRefuse: (why) => {
      note.textContent = `The editor ${why}. The diagram is unchanged. You can apply again or cancel.`;
      settleApply?.(undefined);
    },
    onFail: (why) => {
      note.textContent = `The editor ${why}. Nothing has been sent, and the diagram is unchanged.`;
      settleApply?.(undefined);
    },
  });
  const handler = (event) => {
    const message = acceptMessage(event, frame.contentWindow);
    if (message !== null) session.hear(message);
  };
  window.addEventListener('message', handler);
  const picked = await dialogs.open({
    title: `Diagram of ${subject}`,
    body: host,
    actions: [
      {
        label: 'Cancel',
        value: null,
        kind: 'secondary',
        run: async () => {
          if (session.state() === 'editing' && session.changed()) {
            const sure = await dialogs.open({
              title: 'Discard the changes?',
              message: 'What was drawn in the editor has not been applied.',
              actions: [
                { label: 'Keep editing', value: false, kind: 'secondary' },
                { label: 'Discard', value: true, kind: 'danger' },
              ],
            });
            if (sure !== true) return undefined;
          }
          session.cancel();
          return null;
        },
      },
      {
        label: 'Apply',
        value: 'apply',
        kind: 'primary',
        run: () =>
          new Promise((settle) => {
            if (session.state() === 'loading') {
              note.textContent = 'The editor is still loading.';
              settle(undefined);
              return;
            }
            settleApply = settle;
            if (!session.apply()) settle(undefined);
          }),
      },
    ],
  });
  window.removeEventListener('message', handler);
  session.cancel();
  return typeof picked === 'string' ? picked : null;
}
