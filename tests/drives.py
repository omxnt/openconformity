"""The browser drives: the software opened in headless Chrome and acted on
as a user would, each drive a demonstration named by its V-DEM identifier
in manual.md. Run from this directory with `python3 drives.py`. It serves
app/ on a free local port, opens a fresh browser profile per drive,
reports each drive's result with any console error, exception or failed
request the page raised, and exits non-zero when any drive fails.
Python's standard library and a local Chrome, nothing to install."""

import http.server
import json
import os
import select
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time
import traceback

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(HERE, '..', 'app')
CHROME_PATHS = [
    os.environ.get('CHROME', ''),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    shutil.which('google-chrome') or '',
    shutil.which('chromium') or '',
    shutil.which('chromium-browser') or '',
]


def chrome_path():
    for path in CHROME_PATHS:
        if path and os.path.exists(path):
            return path
    raise SystemExit('No Chrome was found. Set CHROME to the browser executable.')


class Handler(http.server.SimpleHTTPRequestHandler):
    """app/ served as files, with no request log."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=APP, **kwargs)

    def log_message(self, *args):
        pass


class Server:
    """app/ served on a free port, quietly, for the length of the run."""

    def start(self):
        self.httpd = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.port = self.httpd.server_address[1]
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
        return f'http://127.0.0.1:{self.port}/'

    def stop(self):
        self.httpd.shutdown()


class Page:
    """One headless Chrome on a fresh profile, driven over the DevTools pipe."""

    def __init__(self, url):
        self.profile = tempfile.mkdtemp(prefix='openconformity-drive-')
        r0, w0 = os.pipe()
        r1, w1 = os.pipe()
        while r0 < 5:
            r0 = os.dup(r0)
        while w1 < 5:
            w1 = os.dup(w1)
        flags = ['--headless=new', '--disable-gpu', '--no-first-run', '--window-size=1400,900', f'--user-data-dir={self.profile}']
        if os.environ.get('CI'):
            flags += ['--no-sandbox', '--disable-dev-shm-usage']
        self.proc = subprocess.Popen(
            [chrome_path(), *flags, '--remote-debugging-pipe', 'about:blank'],
            pass_fds=(3, 4), stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            preexec_fn=lambda: (os.dup2(r0, 3), os.dup2(w1, 4)))
        os.close(r0)
        os.close(w1)
        self.out = os.fdopen(w0, 'wb', 0)
        self.inp = os.fdopen(r1, 'rb', 0)
        self.buffer = b''
        self.seq = 0
        self.events = []
        target = self.call('Target.createTarget', {'url': 'about:blank'})['targetId']
        self.session = self.call('Target.attachToTarget', {'targetId': target, 'flatten': True})['sessionId']
        for method in ('Runtime.enable', 'Log.enable', 'Page.enable', 'Network.enable'):
            self.call(method, session=True)
        self.call('Network.setCacheDisabled', {'cacheDisabled': True}, session=True)
        self.navigate(url)

    def send(self, method, params=None, session=False):
        self.seq += 1
        message = {'id': self.seq, 'method': method, 'params': params or {}}
        if session:
            message['sessionId'] = self.session
        self.out.write(json.dumps(message).encode() + b'\0')
        return self.seq

    def read(self):
        while b'\0' not in self.buffer:
            ready, _, _ = select.select([self.inp], [], [], 60)
            if not ready:
                raise RuntimeError('no answer from Chrome in 60 s')
            chunk = os.read(self.inp.fileno(), 65536)
            if not chunk:
                raise RuntimeError('Chrome closed')
            self.buffer += chunk
        raw, self.buffer = self.buffer.split(b'\0', 1)
        return json.loads(raw)

    def call(self, method, params=None, session=False):
        wanted = self.send(method, params, session)
        while True:
            message = self.read()
            if message.get('id') == wanted:
                if 'error' in message:
                    raise RuntimeError(message['error'].get('message', 'DevTools error'))
                return message.get('result', {})
            self.events.append(message)

    def settle(self, seconds=1.5):
        """Read events until the page has been quiet for the time given, the load event shortening the wait."""
        deadline = time.time() + max(seconds, 4)
        while time.time() < deadline:
            ready, _, _ = select.select([self.inp], [], [], 0.2)
            if not ready:
                continue
            message = self.read()
            self.events.append(message)
            if message.get('method') == 'Page.loadEventFired':
                deadline = min(deadline, time.time() + seconds)

    def navigate(self, url):
        self.call('Page.navigate', {'url': url}, session=True)
        self.settle()

    def reload(self):
        self.call('Page.reload', session=True)
        self.settle()

    def viewport(self, width, height):
        self.call('Emulation.setDeviceMetricsOverride', {'width': width, 'height': height, 'deviceScaleFactor': 1, 'mobile': False}, session=True)
        self.settle(0.5)

    def eval(self, expression):
        """Evaluate an expression, awaiting a promise, and return its value or raise its error."""
        result = self.call('Runtime.evaluate', {'expression': expression, 'returnByValue': True, 'awaitPromise': True}, session=True)
        if 'exceptionDetails' in result:
            held = result['exceptionDetails'].get('exception', {})
            raise AssertionError(f"the page threw {held.get('description', result['exceptionDetails'].get('text'))}")
        return result.get('result', {}).get('value')

    def problems(self):
        """Every console error, exception and failed request so far, then forgotten."""
        found = []
        for message in self.events:
            method = message.get('method')
            params = message.get('params', {})
            if method == 'Runtime.consoleAPICalled' and params['type'] in ('error', 'warning', 'assert'):
                found.append(f"console {params['type']}: " + ' '.join(str(a.get('value', a.get('description', ''))) for a in params['args']))
            elif method == 'Runtime.exceptionThrown':
                found.append('exception: ' + str(params['exceptionDetails'].get('exception', {}).get('description', params['exceptionDetails'].get('text'))))
            elif method == 'Log.entryAdded' and params['entry']['level'] in ('error', 'warning'):
                found.append(f"{params['entry']['level']}: {params['entry']['text']}")
            elif method == 'Network.responseReceived' and params['response']['status'] >= 400:
                found.append(f"request {params['response']['status']}: {params['response']['url']}")
        self.events = []
        return found

    def close(self):
        self.proc.kill()
        self.proc.wait()
        shutil.rmtree(self.profile, ignore_errors=True)


# --- The page helpers every drive shares, as JavaScript ---------------------

HELPERS = """
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const byText = (sel, text) => [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().startsWith(text));
  const row = (id) => document.querySelector('.tree-row[data-id="' + id + '"]');
  const key = (el, init) => el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
  const dialogTitle = () => document.querySelector('.dialog-title')?.textContent ?? null;
  const menu = async (item, entry) => { byText('.menubar-item', item)?.click(); await wait(250); const e = byText('.menu-entry', entry); if (!e) throw new Error('no menu entry ' + entry); e.click(); await wait(400); };
  const loadExample = async () => { await menu('File', 'Load example'); if (dialogTitle()) { byText('.dialog-button', 'Load')?.click(); await wait(400); } };
  const must = (held, what) => { if (!held) throw new Error(what); };
  const entityId = (r) => /^[A-Z]{3}-\\d{3}$/.test(r.dataset.id || '');
  const firstEntity = async () => {
    for (let i = 0; i < 20; i += 1) {
      const e = [...document.querySelectorAll('.tree-row')].find(entityId);
      if (e) return e;
      const f = [...document.querySelectorAll('.tree-row')].find((r) => (r.dataset.id || '').startsWith('F-') && r.getAttribute('aria-expanded') === 'false');
      must(f, 'a folder to open');
      f.click(); await wait(150); key(row(f.dataset.id), { key: 'ArrowRight' }); await wait(250);
    }
    throw new Error('no entity found in the tree');
  };
  const collapseAll = async () => {
    for (let i = 0; i < 20; i += 1) {
      const f = [...document.querySelectorAll('.tree-row')].find((r) => (r.dataset.id || '').startsWith('F-') && r.getAttribute('aria-expanded') === 'true');
      if (!f) return;
      f.querySelector('.twisty').click(); await wait(200);
      if (row(f.dataset.id)?.getAttribute('aria-expanded') === 'true') { row(f.dataset.id).click(); await wait(150); key(row(f.dataset.id), { key: 'ArrowLeft' }); await wait(250); }
    }
  };
"""


def script(body):
    """A drive's JavaScript as one awaited expression over the helpers."""
    return f'(async () => {{ {HELPERS} {body} return true; }})()'


# --- The drives ----------------------------------------------------------------

def drive_001(page):
    page.eval(script("""
      must(document.querySelector('header.shell-bar') && document.querySelector('nav[aria-label="Main"]'), 'the shell bar and its navigation are landmarks');
      must(document.querySelector('main.workspace'), 'the workspace is the main landmark');
      for (const name of ['Navigator', 'Editor', 'Relationships']) must(document.querySelector('section[aria-label="' + name + '"]'), name + ' is a labelled region');
      await loadExample();
      const nav = document.querySelector('#pane-navigator').getBoundingClientRect();
      const editor = document.querySelector('#pane-editor').getBoundingClientRect();
      const rel = document.querySelector('#pane-relationships').getBoundingClientRect();
      must(nav.height > editor.height && editor.bottom <= rel.top + 1, 'the navigator stands at full height with the editor over the relationship pane');
    """))


def drive_002(page):
    page.viewport(800, 600)
    page.eval(script("""
      must(getComputedStyle(document.querySelector('.small-viewport')).display !== 'none', 'the notice shows below 1000 pixels');
      must(document.querySelector('.small-viewport h1').textContent.includes('desktop-sized screen'), 'and says a desktop-sized screen is required');
    """))
    page.viewport(1400, 900)
    page.eval(script("must(getComputedStyle(document.querySelector('.small-viewport')).display === 'none', 'and hides again at the supported size');"))


def drive_004(page):
    page.eval(script("""
      await loadExample();
      await menu('Edit', 'New folder');
      must(dialogTitle() !== null, 'a folder is asked for by name');
      const input = document.querySelector('.dialog input');
      input.value = 'Kept after reload'; input.dispatchEvent(new Event('input', { bubbles: true }));
      byText('.dialog-button', 'Create')?.click() ?? byText('.dialog-button', 'Add')?.click(); await wait(400);
      must([...document.querySelectorAll('.tree-row')].some((r) => r.textContent.includes('Kept after reload')), 'the folder is in the tree');
    """))
    page.reload()
    page.eval(script("""
      must(document.title.startsWith('Example project'), 'the project is back after the reload');
      must([...document.querySelectorAll('.tree-row')].some((r) => r.textContent.includes('Kept after reload')), 'and the change with it');
    """))


def drive_005(page):
    page.eval(script("""
      await loadExample();
      await menu('File', 'Clear stored data');
      must(dialogTitle() === 'Clear stored data', 'clearing asks first');
      byText('.dialog-button', 'Cancel')?.click(); await wait(300);
      must(document.title.startsWith('Example project'), 'and cancel keeps the project');
      await menu('File', 'Clear stored data');
      byText('.dialog-button', 'Clear')?.click(); await wait(500);
      must(!document.title.startsWith('Example project') && document.querySelector('.empty-state-title'), 'clearing forgets the project and lands on the landing');
    """))
    page.reload()
    page.eval(script("must(!document.title.startsWith('Example project'), 'and nothing comes back after a reload');"))


def drive_006(page):
    page.eval(script("""
      await loadExample();
      const first = await firstEntity();
      first.click(); await wait(300);
      const head = document.querySelector('#editor-head').textContent;
      must(head.includes(first.dataset.id), 'the editor head names the selected entity');
      must(document.querySelectorAll('#editor-body .cell-value, #editor-body .field-input').length > 0, 'and its attributes stand in the editor pane');
    """))


def drive_015(page):
    page.eval(script("""
      await loadExample();
      const disabled = [...document.querySelectorAll('#pane-relationships .pane-head button')].map((b) => (b.getAttribute('aria-label') || b.textContent.trim()) + ':' + b.disabled);
      must(disabled.includes('Graph:true') && disabled.includes('List:true'), 'the tabs are disabled with nothing selected: ' + disabled.join(' '));
      must(disabled.some((d) => d.startsWith('Filter the relationships:true')), 'the filter is disabled');
      must(disabled.includes('Collapse the pane:false'), 'and the collapse button works');
      must(byText('.empty-state-title', 'Nothing selected'), 'over the empty state');
      const entity = await firstEntity();
      entity.click(); await wait(300);
      [...document.querySelectorAll('#pane-relationships .pane-head button')].find((b) => (b.getAttribute('aria-label') || '').startsWith('Filter the relationships')).click(); await wait(300);
      const field = document.querySelector('#pane-relationships .head-search');
      must(field && document.querySelector('#pane-relationships .head-search-clear')?.hidden === true, 'the filter opens with its clear button hidden while empty');
      field.value = 'x'; field.dispatchEvent(new Event('input', { bubbles: true })); await wait(200);
      must(document.querySelector('#pane-relationships .head-search-clear')?.hidden === false, 'and the button shows once it holds text');
      document.querySelector('#pane-relationships .head-search-clear').click(); await wait(300);
      must(!document.querySelector('#pane-relationships .head-search'), 'and clears and closes the filter');
    """))


def drive_016(page):
    page.eval(script("""
      await loadExample();
      const entity = await firstEntity();
      const held = entity.dataset.id;
      entity.click(); await wait(300);
      byText('#pane-relationships .tab', 'List')?.click(); await wait(400);
      const target = document.querySelector('#pane-relationships tr[aria-label^="Select "]');
      must(target, 'the list offers a related entity to select');
      const targetId = target.getAttribute('aria-label').slice(7).split(',')[0];
      await collapseAll();
      must(!row(held) && !row(targetId), 'every folder is collapsed, the selected entity and the target out of view');
      must(document.querySelector('.tree-row.selected') === null, 'with the selection kept but hidden');
      document.querySelector('#pane-relationships tr[aria-label^="Select ' + targetId + '"]').click(); await wait(500);
      const selected = document.querySelector('.tree-row.selected');
      must(selected && selected.dataset.id === targetId, 'selecting from the list selects the entity in the tree and reveals it: ' + selected?.dataset.id);
    """))


def drive_017(page):
    page.eval(script("""
      await loadExample();
      [...document.querySelectorAll('button')].find((b) => b.querySelector('use[href="#i-edit"]')).click(); await wait(300);
      const input = document.querySelector('input.field-input, textarea.field-input');
      input.value = input.value + ' typed'; input.dispatchEvent(new Event('input', { bubbles: true }));
      byText('.menubar-item', 'File').click(); await wait(250);
      must(byText('.menu-entry', 'Save to file')?.disabled === true, 'under an edit Save to file stands down');
      document.body.click(); await wait(200);
      key(document.querySelector('.tree-row.selected') ?? document.body, { key: 'Escape' }); await wait(300);
      must(dialogTitle() === 'Discard the changes?', 'Escape from the tree asks to discard the dirty draft');
      byText('.dialog-button', 'Discard').click(); await wait(300);
      must(!document.querySelector('.form-button.button-primary'), 'and leaves the edit');
      byText('.menubar-item', 'File').click(); await wait(250);
      must(byText('.menu-entry', 'Save to file')?.disabled === false, 'Save to file is offered again');
      document.body.click(); await wait(200);
    """))


def drive_019(page):
    page.eval(script("""
      await loadExample();
      const ids = [...document.querySelectorAll('.tree-row')].map((r) => r.dataset.id).filter((id) => id && id.startsWith('F-'));
      const id = ids[0], target = ids[ids.length - 1];
      row(id).click(); await wait(200);
      key(row(id), { key: 'x', metaKey: true, ctrlKey: true }); await wait(300);
      must(row(id).classList.contains('cut'), 'the cut row is dimmed');
      byText('.menubar-item', 'Edit').click(); await wait(250);
      must(byText('.menu-entry', 'Paste') && byText('.menu-entry', 'Cut'), 'Cut and Paste stand in the Edit menu');
      document.body.click(); await wait(200);
      row(target).click(); await wait(200);
      key(row(target), { key: 'v', metaKey: true, ctrlKey: true }); await wait(400);
      key(row(target), { key: 'ArrowRight' }); await wait(300);
      must(row(id) && row(id).getAttribute('aria-level') === '3' && !row(id).classList.contains('cut'), 'the row is filed inside the target and the dimming is gone');
      row(id).click(); await wait(200);
      key(row(id), { key: 'x', metaKey: true, ctrlKey: true }); await wait(200);
      key(document.body, { key: 'Escape' }); await wait(300);
      must(!row(id).classList.contains('cut'), 'Escape forgets the cut');
    """))


def drive_020(page):
    page.eval(script("""
      await loadExample();
      const before = document.querySelectorAll('.tree-row').length;
      const ids = [...document.querySelectorAll('.tree-row')].map((r) => r.dataset.id).filter((id) => id && id.startsWith('F-'));
      row(ids[0]).click(); await wait(200);
      key(row(ids[0]), { key: 'c', metaKey: true, ctrlKey: true }); await wait(300);
      row(ids[ids.length - 1]).click(); await wait(200);
      key(row(ids[ids.length - 1]), { key: 'v', metaKey: true, ctrlKey: true }); await wait(500);
      const copy = document.querySelector('.tree-row.selected');
      must(copy && copy.dataset.id !== ids[0] && copy.getAttribute('aria-level') === '3', 'the copy is selected inside the folder under a new identifier');
      must(document.querySelectorAll('.tree-row').length > before, 'with its subtree');
      key(copy, { key: 'v', metaKey: true, ctrlKey: true }); await wait(500);
      must(document.querySelector('.tree-row.selected').dataset.id !== copy.dataset.id, 'a second paste makes another copy');
      byText('.menubar-item', 'Edit').click(); await wait(250);
      must(byText('.menu-entry', 'Copy'), 'Copy stands in the Edit menu');
    """))


def drive_021(page):
    page.eval(script("""
      await loadExample();
      const esr = await (async () => { for (let i = 0; i < 30; i += 1) { const all = [...document.querySelectorAll('.tree-row')].filter((r) => /^ESR-\\d{3}$/.test(r.dataset.id || '')); const levels = {}; for (const r of all) (levels[r.getAttribute('aria-level')] ??= []).push(r.dataset.id); const best = Object.values(levels).sort((a, b) => b.length - a.length)[0] ?? []; if (best.length >= 3) return best.slice(0, 3); const f = [...document.querySelectorAll('.tree-row')].find((r) => (r.dataset.id || '') && r.getAttribute('aria-expanded') === 'false'); must(f, 'a folder to open'); f.click(); await wait(100); key(row(f.dataset.id), { key: 'ArrowRight' }); await wait(200); } throw new Error('no three requirements'); })();
      row(esr[0]).click(); await wait(200);
      row(esr[2]).dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true })); await wait(300);
      must(document.querySelectorAll('.tree-row.selected').length === 3 && row(esr[2]).classList.contains('anchor'), 'a Shift click selects the range with the last as anchor');
      key(row(esr[2]), { key: 'ArrowUp', metaKey: true, ctrlKey: true }); await wait(300);
      must(row(esr[1]).classList.contains('focused') && document.querySelectorAll('.tree-row.selected').length === 3, 'Cmd up moves the focus and keeps the selection');
      key(row(esr[1]), { code: 'Space', key: ' ', metaKey: true, ctrlKey: true }); await wait(300);
      must(document.querySelectorAll('.tree-row.selected').length === 2, 'Cmd Space removes the focused row from the selection');
      key(document.querySelector('.tree-row.anchor'), { key: 'Escape' }); await wait(300);
      must(document.querySelectorAll('.tree-row.selected').length === 1, 'Escape returns to the anchor');
      key(document.querySelector('.tree-row.selected'), { key: 'a', metaKey: true, ctrlKey: true }); await wait(300);
      must(document.querySelectorAll('.tree-row.selected').length > 3, 'Cmd A selects every row shown');
      row(esr[0]).click(); await wait(200);
      row(esr[2]).dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true })); await wait(300);
      must(byText('#editor-body .empty-state-title', '3 essential requirements selected'), 'the editor names the set');
      [...document.querySelectorAll('#editor-head button')].find((b) => b.querySelector('use[href="#i-edit"]')).click(); await wait(400);
      must(byText('#editor-head .button-primary', 'Save for 3'), 'Edit opens the form for the three');
      must(document.querySelectorAll('#editor-body table').length === 0, 'with no table offered');
      const select = document.querySelector('#editor-body select[data-key="applicable"]'); select.value = 'No'; select.dispatchEvent(new Event('change', { bubbles: true }));
      byText('#editor-head .button-primary', 'Save').click(); await wait(600);
      must(document.querySelector('.toast-title')?.textContent === 'Applicable set on 3 essential requirements' && document.querySelector('.toast-action'), 'the toast names what was set and offers Undo');
      row(esr[1]).click(); await wait(300);
      must([...document.querySelectorAll('#editor-body .tag')].some((t) => t.textContent === 'No'), 'the second holds the value');
      row(esr[0]).click(); await wait(200);
      const folder = [...document.querySelectorAll('.tree-row')].find((r) => (r.dataset.id || '').startsWith('F-'));
      must(folder, 'a folder in view');
      folder.dispatchEvent(new MouseEvent('click', { bubbles: true, metaKey: true })); await wait(300);
      must(byText('#editor-body .empty-state-title', 'Not one type'), 'a mixed selection names its types');
      must([...document.querySelectorAll('#editor-head button')].every((b) => !b.querySelector('use[href="#i-edit"]')), 'and offers no Edit');
      row(esr[0]).click(); await wait(200);
      row(esr[1]).dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true })); await wait(300);
      key(row(esr[1]), { key: 'Delete' }); await wait(400);
      must(dialogTitle() === 'Delete 2 rows?', 'Delete asks once with the count');
      byText('.dialog-button', 'Delete').click(); await wait(500);
      must(!row(esr[0]) && !row(esr[1]) && row(esr[2]), 'and both are gone, the third kept');
    """))


def drive_022(page):
    page.eval(script("""
      await loadExample();
      const entity = await firstEntity();
      const subject = entity.dataset.id;
      entity.click(); await wait(300);
      const add = [...document.querySelectorAll('#pane-relationships button')].find((b) => (b.getAttribute('aria-label') || '').startsWith('Add relationship'));
      must(add && !add.disabled, 'the subject offers Add relationship');
      add.click(); await wait(400);
      must(document.querySelectorAll('.tree-row.pickable').length > 0, 'picking opens with candidates in the tree');
      const other = [...document.querySelectorAll('.tree-row')].find((r) => r.dataset.id && r.dataset.id !== subject && !r.classList.contains('pickable'));
      must(other, 'a row that is not a candidate');
      other.click(); await wait(300);
      must(document.querySelector('.tree-row.selected')?.dataset.id === subject, 'a click on it leaves the selection on the subject');
      key(row(subject), { key: 'ArrowDown' }); await wait(300);
      must(document.querySelector('.tree-row.selected')?.dataset.id === subject && document.querySelector('.tree-row.focused'), 'an arrow moves the focus and not the selection');
      key(document.querySelector('.tree-row.focused'), { key: 'End' }); await wait(300);
      must(document.querySelector('.tree-row.focused') === [...document.querySelectorAll('.tree-row')].at(-1), 'End moves the focus to the last row');
      const candidate = document.querySelector('.tree-row.pickable');
      key(candidate, { key: 'Home' }); await wait(200);
      for (let i = 0; i < 40 && !document.querySelector('.tree-row.focused')?.classList.contains('pickable'); i += 1) { key(document.querySelector('.tree-row.focused') ?? row(subject), { key: 'ArrowDown' }); await wait(80); }
      must(document.querySelector('.tree-row.focused')?.classList.contains('pickable'), 'the focus reaches a candidate');
      key(document.querySelector('.tree-row.focused'), { code: 'Space', key: ' ' }); await wait(300);
      must(document.querySelectorAll('.tree-row.picked').length === 1, 'Space picks the focused candidate');
      key(document.body, { key: 'Escape' }); await wait(300);
      must(document.querySelectorAll('.tree-row.pickable').length === 0, 'Escape leaves the picking');
    """))


def drive_023(page):
    page.eval(script("""
      await loadExample();
      const entity = await firstEntity();
      entity.click(); await wait(300);
      const menuState = async () => { byText('.menubar-item', 'Edit').click(); await wait(250); const state = Object.fromEntries([...document.querySelectorAll('.menu-entry')].map((e) => [e.textContent.trim().split(/\\s|\u2318/)[0], e.disabled])); document.body.click(); await wait(200); return state; };
      const free = await menuState();
      must(free.Edit === false && free.Add === false && free.New === false && free.Delete === false, 'with nothing open the changers are offered: ' + JSON.stringify(free));
      [...document.querySelectorAll('#pane-relationships button')].find((b) => (b.getAttribute('aria-label') || '').startsWith('Add relationship')).click(); await wait(400);
      const picking = await menuState();
      must(picking.Edit === true && picking.Add === true && picking.New === true && picking.Delete === true && picking.Cut === true, 'while picking the changers stand down, Add relationship among them: ' + JSON.stringify(picking));
      const headEdit = [...document.querySelectorAll('#editor-head button')].find((b) => b.querySelector('use[href="#i-edit"]'));
      must(headEdit && headEdit.disabled, 'and the Edit button in the editor head is disabled');
      key(document.querySelector('.tree-row.selected'), { key: 'Enter' }); await wait(300);
      must(!document.querySelector('#editor-head .button-primary'), 'and Enter on the row opens no edit');
      key(document.body, { key: 'Escape' }); await wait(300);
      must(document.querySelectorAll('.tree-row.pickable').length === 0, 'Escape leaves the picking');
      await menu('Edit', 'Import from library'); await wait(300);
      const library = await menuState();
      must(library.Edit === true && library.New === true && library.Delete === true, 'while the library is open the changers stand down: ' + JSON.stringify(library));
      must(byText('#pane-editor .button-primary', 'Import') && byText('#pane-editor .ghost-button', 'Cancel'), 'the library head reads Import and Cancel');
      byText('#pane-editor .ghost-button', 'Cancel').click(); await wait(300);
      must(!byText('#pane-editor .button-primary', 'Import'), 'and Cancel closes it');
      await menu('View', 'Risk assessment'); await wait(400);
      const viewing = await menuState();
      must(viewing.Edit === true && viewing.New === true && viewing.Delete === true, 'while a view is open the changers stand down: ' + JSON.stringify(viewing));
      const viewEntry = async () => { for (let i = 0; i < 2; i += 1) { byText('.menubar-item', 'View').click(); await wait(250); const e = byText('.menu-entry', 'Risk assessment'); if (e) { const state = e.disabled; document.body.click(); await wait(200); return state; } } return 'absent'; };
      must((await viewEntry()) === false, 'while switching views stays offered');
      const closeView = [...document.querySelectorAll('#pane-view button')].find((b) => (b.getAttribute('aria-label') || '').startsWith('Close'));
      must(closeView, 'the view offers Close');
      closeView.click(); await wait(400);
      must(document.querySelector('#pane-view').hidden, 'and closes');
      [...document.querySelectorAll('#editor-head button')].find((b) => b.querySelector('use[href="#i-edit"]')).click(); await wait(300);
      const editing = await menuState();
      must(editing.Add === true && editing.Import === true && editing.New === true && editing.Delete === true, 'while editing the changers stand down, Add relationship and Import among them: ' + JSON.stringify(editing));
      byText('.menubar-item', 'View').click(); await wait(250);
      must(byText('.menu-entry', 'Risk assessment')?.disabled === true, 'and the views stand down too');
      document.body.click(); await wait(200);
      const editedId = document.querySelector('.tree-row.selected').dataset.id;
      const otherRow = [...document.querySelectorAll('.tree-row')].find((r) => r.dataset.id && r.dataset.id !== editedId);
      otherRow.click(); await wait(300);
      must(document.querySelector('.tree-row.selected')?.dataset.id === editedId && document.querySelector('#editor-head .button-primary'), 'a click on another row under an edit does nothing');
      const menusBefore = document.querySelectorAll('.dropdown').length;
      otherRow.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true })); await wait(300);
      must(document.querySelectorAll('.dropdown').length === menusBefore, 'and a right click opens no menu');
      byText('#editor-head .ghost-button', 'Cancel').click(); await wait(300);
      must(!document.querySelector('#editor-head .button-primary'), 'Cancel leaves the edit');
    """))


def drive_024(page):
    page.eval(script("""
      await loadExample();
      const entity = await firstEntity();
      entity.click(); await wait(300);
      await menu('Edit', 'Import from library'); await wait(500);
      const act = document.querySelector('.library-row[data-id="LEG-004"]');
      must(act, 'the Machinery Regulation stands in the open legislation catalogue');
      act.click(); await wait(300);
      const tabs = [...document.querySelectorAll('.library-preview .tabs .tab')].map((t) => t.textContent);
      must(tabs.join() === 'Legislation,Applicability,Notes', 'the preview carries the tabs the editor gives the type: ' + tabs.join());
      const names = [...document.querySelectorAll('.library-preview .cells:not([hidden]) .cell-name > span:first-child')].map((n) => n.textContent);
      must(names.join() === 'Identifier,Reference,Title,Link', 'and every field of the first tab, filled or not: ' + names.join());
      must(document.querySelector('.library-preview .cell-value.mono').textContent === 'LEG-004', "with the library's identifier");
      document.querySelectorAll('.library-preview .tabs .tab')[1].click(); await wait(200);
      const empty = [...document.querySelectorAll('.library-preview .cells:not([hidden]) .cell-value')].map((n) => n.textContent);
      must(empty.join() === '–,–', 'an empty tab shows its fields with the dash: ' + empty.join());
      must(!document.querySelector('.library-preview .notice'), 'and no notice is placed');
      document.querySelector('.library-row[data-id="F-19"]').click(); await wait(200);
      must(document.querySelector('.library-preview .library-note').textContent === 'Check the catalogue to pick everything in it.', 'a catalogue row says what checking it does');
    """))


DRIVES = [
    ('V-DEM-001', 'Pane headers are landmarks', drive_001),
    ('V-DEM-002', 'The minimum viewport notice', drive_002),
    ('V-DEM-004', 'A change survives a reload', drive_004),
    ('V-DEM-005', 'Clear stored data asks, then forgets', drive_005),
    ('V-DEM-006', 'A selected entity shows its attributes', drive_006),
    ('V-DEM-015', 'The relationship pane keeps its head when nothing is selected', drive_015),
    ('V-DEM-016', 'Selecting from the list reveals the entity in the tree', drive_016),
    ('V-DEM-017', 'Save to file waits for an open edit', drive_017),
    ('V-DEM-019', 'Cut and paste in the tree', drive_019),
    ('V-DEM-020', 'Copy and paste in the tree', drive_020),
    ('V-DEM-021', 'Select several rows and act on the set', drive_021),
    ('V-DEM-022', 'Picking owns the tree', drive_022),
    ('V-DEM-023', 'One mode at a time', drive_023),
    ('V-DEM-024', 'The library preview is the editor\'s view', drive_024),
]


def main():
    wanted = set(sys.argv[1:])
    server = Server()
    url = server.start()
    failed = 0
    try:
        for ident, title, drive in DRIVES:
            if wanted and ident not in wanted:
                continue
            # A drive runs once more when Chrome itself gave no answer, since a
            # cold start on a shared machine is not a finding about the software.
            for attempt in (1, 2):
                page = None
                try:
                    page = Page(url)
                    page.problems()
                    drive(page)
                    page.settle(0.5)
                    problems = page.problems()
                    if problems:
                        failed += 1
                        print(f'{ident} FAIL {title}: the console raised ' + ' | '.join(problems))
                    else:
                        print(f'{ident} PASS {title}')
                    break
                except RuntimeError as error:
                    if attempt == 1:
                        print(f'{ident} RETRY {title}: {error}')
                        continue
                    failed += 1
                    print(f'{ident} FAIL {title}: {error}')
                except Exception as error:
                    failed += 1
                    print(f'{ident} FAIL {title}: {error}')
                    if not isinstance(error, AssertionError):
                        traceback.print_exc()
                    break
                finally:
                    if page:
                        page.close()
    finally:
        server.stop()
    print(f'drives: {len(DRIVES) - failed} of {len(DRIVES)} passed' if not wanted else '')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
