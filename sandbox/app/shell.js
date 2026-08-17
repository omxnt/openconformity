/**
 * The shell chrome: the theme, the shell bar's theme menu, the session
 * notices, and the pane splitters. It reads the store and touches no model
 * content.
 */

/**
 * The theme in effect: the stored choice when one is set, else the system
 * preference. White is the fallback.
 * @param {string|null} choice  'white', 'g100', or null for the system
 * @param {boolean} systemPrefersDark
 * @returns {'white'|'g100'}
 */
export function effectiveTheme(choice, systemPrefersDark) {
  if (choice === 'white' || choice === 'g100') return choice;
  return systemPrefersDark ? 'g100' : 'white';
}

/** The theme menu, in menu order. */
export const THEME_MENU = [
  { value: null, label: 'System' },
  { value: 'white', label: 'White' },
  { value: 'g100', label: 'Gray 100' },
];

/** The statement made when the stored session cannot be read back. */
export const RESTORATION_NOTICE = 'The previous session could not be restored.';
export const RESTORATION_DETAIL =
  'What this browser had stored could not be read back. A copy has been set aside in browser storage.';

/** The statement made while storing the session keeps failing. */
export const PERSIST_NOTICE = 'Changes are not being stored in this browser.';
export const PERSIST_DETAIL =
  'The last attempt to store the session failed. Save the project to a file so nothing is lost.';

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {ReturnType<import('./overlay.js').createOverlay>} context.overlay
 * @param {Document} [context.root]
 */
export function createShell({ store, overlay, root = document }) {
  const themeButton = root.getElementById('shell-theme');
  const themeIcon = root.getElementById('shell-theme-icon');
  const notices = root.getElementById('notices');
  const workspace = root.getElementById('workspace');
  const navigatorPane = root.getElementById('pane-navigator');
  const column = root.getElementById('workspace-column');
  const relationshipsPane = root.getElementById('pane-relationships');

  // --- Theme -----------------------------------------------------------

  const dark = root.defaultView.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme() {
    const theme = effectiveTheme(store.theme(), dark.matches);
    root.documentElement.dataset.theme = theme;
    themeIcon.setAttribute('href', theme === 'g100' ? '#i-theme-dark' : '#i-theme-light');
  }

  dark.addEventListener('change', applyTheme);

  /** @type {import('./overlay.js').Entry|null} */
  let themeMenu = null;

  function openThemeMenu() {
    const menu = root.createElement('div');
    menu.className = 'dropdown';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Theme');

    for (const { value, label } of THEME_MENU) {
      const item = root.createElement('button');
      item.type = 'button';
      item.className = 'menu-entry';
      item.setAttribute('role', 'menuitemradio');
      item.setAttribute('aria-checked', String(store.theme() === value));
      item.textContent = label;
      item.addEventListener('click', () => {
        store.setTheme(value);
        overlay.close(themeMenu);
      });
      menu.appendChild(item);
    }

    menu.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      const items = [...menu.querySelectorAll('.menu-entry')];
      const from = items.indexOf(root.activeElement);
      const to = (from + (event.key === 'ArrowDown' ? 1 : items.length - 1) + items.length) % items.length;
      items[to].focus();
    });

    const at = themeButton.getBoundingClientRect();
    menu.style.top = `${at.bottom}px`;
    menu.style.right = `${root.documentElement.clientWidth - at.right}px`;

    themeMenu = overlay.open({
      kind: 'menu',
      element: menu,
      opener: themeButton,
      onClose() {
        themeMenu = null;
        themeButton.setAttribute('aria-expanded', 'false');
      },
    });
    themeButton.setAttribute('aria-expanded', 'true');
    (menu.querySelector('[aria-checked="true"]') ?? menu.firstChild).focus();
  }

  themeButton.addEventListener('click', () => {
    if (themeMenu) overlay.close(themeMenu);
    else openThemeMenu();
  });

  // --- Notices ---------------------------------------------------------

  let restorationDismissed = false;

  /**
   * @param {'info'|'warning'} kind
   * @param {string} title
   * @param {string} text
   * @param {(() => void)|null} onDismiss
   */
  function notice(kind, title, text, onDismiss) {
    const element = root.createElement('div');
    element.className = kind === 'warning' ? 'notice notice-warning' : 'notice';

    const icon = root.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'icon');
    icon.setAttribute('aria-hidden', 'true');
    const use = root.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', kind === 'warning' ? '#i-warning' : '#i-information');
    icon.appendChild(use);
    element.appendChild(icon);

    const body = root.createElement('div');
    body.className = 'notice-body';
    const heading = root.createElement('span');
    heading.className = 'notice-title';
    heading.textContent = title;
    const detail = root.createElement('span');
    detail.className = 'notice-text';
    detail.textContent = text;
    body.append(heading, detail);
    element.appendChild(body);

    if (onDismiss) {
      const dismiss = root.createElement('button');
      dismiss.type = 'button';
      dismiss.className = 'notice-dismiss';
      dismiss.setAttribute('aria-label', 'Dismiss');
      const cross = root.createElementNS('http://www.w3.org/2000/svg', 'svg');
      cross.setAttribute('class', 'icon');
      cross.setAttribute('aria-hidden', 'true');
      const glyph = root.createElementNS('http://www.w3.org/2000/svg', 'use');
      glyph.setAttribute('href', '#i-close');
      cross.appendChild(glyph);
      dismiss.appendChild(cross);
      dismiss.addEventListener('click', onDismiss);
      element.appendChild(dismiss);
    }
    return element;
  }

  function renderNotices() {
    notices.textContent = '';
    if (store.restoration() === 'failed' && !restorationDismissed) {
      notices.appendChild(
        notice('info', RESTORATION_NOTICE, RESTORATION_DETAIL, () => {
          restorationDismissed = true;
          renderNotices();
        })
      );
    }
    if (store.persistFailed()) {
      notices.appendChild(notice('warning', PERSIST_NOTICE, PERSIST_DETAIL, null));
    }
  }

  // --- Splitters -------------------------------------------------------

  /**
   * @param {Object} spec
   * @param {HTMLElement} spec.splitter
   * @param {(event: PointerEvent) => number} spec.sizeAt  the pane size a pointer position asks for
   * @param {() => number} spec.size      the pane's current size
   * @param {() => number} spec.limit     the largest size the container allows
   * @param {number} spec.minimum
   * @param {(size: number) => void} spec.apply
   * @param {[string, string]} spec.keys  the arrow keys that shrink and grow
   */
  function splitter({ splitter: element, sizeAt, size, limit, minimum, apply, keys }) {
    const clamp = (value) => Math.min(Math.max(value, minimum), Math.max(limit(), minimum));

    element.addEventListener('pointerdown', (event) => {
      element.setPointerCapture(event.pointerId);
      element.classList.add('dragging');
    });
    element.addEventListener('pointermove', (event) => {
      if (!element.hasPointerCapture(event.pointerId)) return;
      apply(clamp(sizeAt(event)));
    });
    element.addEventListener('pointerup', (event) => {
      element.releasePointerCapture(event.pointerId);
      element.classList.remove('dragging');
    });
    element.addEventListener('keydown', (event) => {
      const step = event.key === keys[0] ? -16 : event.key === keys[1] ? 16 : 0;
      if (step === 0) return;
      event.preventDefault();
      apply(clamp(size() + step));
    });
  }

  splitter({
    splitter: root.getElementById('splitter-main'),
    sizeAt: (event) => event.clientX - workspace.getBoundingClientRect().left,
    size: () => navigatorPane.getBoundingClientRect().width,
    limit: () => workspace.getBoundingClientRect().width * 0.6,
    minimum: 240,
    apply: (width) => workspace.style.setProperty('--navigator-width', `${Math.round(width)}px`),
    keys: ['ArrowLeft', 'ArrowRight'],
  });

  splitter({
    splitter: root.getElementById('splitter-column'),
    sizeAt: (event) => column.getBoundingClientRect().bottom - event.clientY,
    size: () => relationshipsPane.getBoundingClientRect().height,
    limit: () => column.getBoundingClientRect().height - 160,
    minimum: 120,
    apply: (height) => column.style.setProperty('--relationships-height', `${Math.round(height)}px`),
    keys: ['ArrowDown', 'ArrowUp'],
  });

  // --- Wiring ----------------------------------------------------------

  function render() {
    applyTheme();
    renderNotices();
  }

  store.subscribe(render);
  render();

  return { render };
}
