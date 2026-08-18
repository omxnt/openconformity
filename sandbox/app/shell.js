/**
 * The shell chrome: the theme, the shell bar's Project menu and theme
 * menu, the unsaved indicator, the session notices, and the pane
 * splitters. It reads the store, draws its menu from the one action list,
 * and touches no model content.
 */

import { openMenu } from './menu.js';

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

/**
 * The theme offer, in menu order: two states, presented as Light and
 * Dark. The first load follows the system preference; any explicit
 * choice then owns the theme permanently. The stored values stay the
 * Carbon theme names.
 */
export const THEME_MENU = [
  { value: 'white', label: 'Light' },
  { value: 'g100', label: 'Dark' },
];

/**
 * The browser tab's title: the project's name when it has one, the
 * software's alone otherwise.
 * @param {boolean} hasProject
 * @param {string} name
 * @returns {string}
 */
export function titleFor(hasProject, name) {
  const trimmed = name.trim();
  return hasProject && trimmed ? `${trimmed} — openconformity` : 'openconformity';
}

/**
 * Whether leaving costs something: only while there is unsaved work that
 * persistence is failing to keep. While the blob holds it, closing the
 * tab loses nothing, and a prompt saying otherwise would be a lie the
 * user learns to dismiss.
 * @param {boolean} dirty
 * @param {boolean} persistFailed
 * @returns {boolean}
 */
export function shouldWarnBeforeUnload(dirty, persistFailed) {
  return dirty && persistFailed;
}

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
 * @param {Array<import('./actions.js').Action>} [context.actions]
 * @param {(title: string, message: string) => void} [context.toast]
 */
export function createShell({ store, overlay, actions = [], toast = () => {} }) {
  const themeButton = document.getElementById('shell-theme');
  const themeIcon = document.getElementById('shell-theme-icon');
  const fileButton = document.getElementById('shell-file');
  const editButton = document.getElementById('shell-edit');
  const viewButton = document.getElementById('shell-view');
  const helpButton = document.getElementById('shell-help');
  const metamodelButton = document.getElementById('shell-metamodel');
  const unsavedButton = document.getElementById('shell-unsaved');
  const notices = document.getElementById('notices');
  const workspace = document.getElementById('workspace');
  const navigatorPane = document.getElementById('pane-navigator');
  const column = document.getElementById('workspace-column');
  const relationshipsPane = document.getElementById('pane-relationships');

  // --- Theme -----------------------------------------------------------

  const dark = document.defaultView.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme() {
    const theme = effectiveTheme(store.theme(), dark.matches);
    document.documentElement.dataset.theme = theme;
    themeIcon.setAttribute('href', theme === 'g100' ? '#i-theme-dark' : '#i-theme-light');
  }

  dark.addEventListener('change', applyTheme);

  /**
   * The two theme radios, checked by what is in effect, so the offer
   * reads the same whether the theme is chosen or still following the
   * system.
   */
  function themeItems() {
    const effective = effectiveTheme(store.theme(), dark.matches);
    return THEME_MENU.map(({ value, label }) => ({
      label,
      checked: effective === value,
      onPick: () => store.setTheme(value),
    }));
  }

  /** @type {import('./overlay.js').Entry|null} */
  let themeMenu = null;

  themeButton.addEventListener('click', () => {
    if (themeMenu) {
      overlay.close(themeMenu);
      return;
    }
    themeMenu = openMenu({
      overlay,
      label: 'Theme',
      anchor: themeButton,
      align: 'end',
      items: themeItems(),
      onClose: () => {
        themeMenu = null;
      },
    });
  });

  // --- The menu bar and the shell actions ------------------------------

  /**
   * @param {import('./actions.js').Action} action
   * @param {HTMLElement} anchor
   */
  function actionItem(action, anchor) {
    return {
      label: action.label,
      icon: action.icon,
      hint: action.hint,
      danger: action.danger,
      disabled: !action.enabled(),
      onPick: () => action.run({ anchor }),
    };
  }

  /**
   * The menu bar's menus in bar order, so the arrow keys can walk them.
   * @type {Array<{ button: HTMLElement, openIt: () => void }>}
   */
  const menubar = [];

  /**
   * @param {HTMLElement} button
   * @param {-1|1} step
   */
  function neighbourMenu(button, step) {
    const index = menubar.findIndex((held) => held.button === button);
    return menubar[(index + step + menubar.length) % menubar.length];
  }

  /**
   * A menubar button opening its menu, built fresh each time so
   * enablement and checks are live. The menu toggles on click and opens
   * on ArrowDown; ArrowLeft and ArrowRight walk the bar, moving between
   * the buttons when the menus are closed and between the open menus
   * when one is open.
   * @param {HTMLElement} button
   * @param {string} label
   * @param {() => Array<import('./menu.js').MenuItem>} build
   */
  function menubarMenu(button, label, build) {
    /** @type {import('./overlay.js').Entry|null} */
    let open = null;
    const openIt = () => {
      open = openMenu({
        overlay,
        label,
        anchor: button,
        items: build(),
        onArrow: (step) => neighbourMenu(button, step).openIt(),
        onClose: () => {
          open = null;
        },
      });
    };
    button.addEventListener('click', () => {
      if (open) overlay.close(open);
      else openIt();
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!open) openIt();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        neighbourMenu(button, event.key === 'ArrowLeft' ? -1 : 1).button.focus();
      }
    });
    menubar.push({ button, openIt });
  }

  menubarMenu(fileButton, 'File', () =>
    actions.filter((action) => action.menubar && action.group === 'project').map((action) => actionItem(action, fileButton))
  );

  // Everything that changes the model, separated as the action groups
  // separate, so the menu and the toolbar cannot drift.
  const modelGroups = ['create', 'arrange', 'delete', 'history'];
  menubarMenu(editButton, 'Edit', () => {
    const items = [];
    let lastGroup = null;
    for (const action of actions.filter((offered) => modelGroups.includes(offered.group))) {
      if (lastGroup !== null && action.group !== lastGroup) items.push({ separator: true });
      lastGroup = action.group;
      items.push(actionItem(action, editButton));
    }
    return items;
  });

  menubarMenu(viewButton, 'View', () => [
    ...themeItems(),
    { separator: true },
    {
      label: 'Relationships as list',
      icon: 'i-view-list',
      checked: store.relationshipView() === 'list',
      onPick: () => store.setRelationshipView('list'),
    },
    {
      label: 'Relationships as graph',
      icon: 'i-view-graph',
      checked: store.relationshipView() === 'graph',
      onPick: () => store.setRelationshipView('graph'),
    },
  ]);

  menubarMenu(helpButton, 'Help', () =>
    actions.filter((action) => action.menubar && action.group === 'help').map((action) => actionItem(action, helpButton))
  );

  const saveAction = actions.find((action) => action.id === 'save');
  if (saveAction) {
    unsavedButton.addEventListener('click', () => saveAction.run({ anchor: unsavedButton }));
  }
  const metamodelAction = actions.find((action) => action.id === 'metamodel');
  if (metamodelAction) {
    metamodelButton.addEventListener('click', () => metamodelAction.run({ anchor: metamodelButton }));
  }

  // --- Notices ---------------------------------------------------------

  let restorationDismissed = false;

  /**
   * @param {'info'|'warning'} kind
   * @param {string} title
   * @param {string} text
   * @param {(() => void)|null} onDismiss
   */
  function notice(kind, title, text, onDismiss) {
    const element = document.createElement('div');
    element.className = kind === 'warning' ? 'notice notice-warning' : 'notice';

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'icon');
    icon.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', kind === 'warning' ? '#i-warning' : '#i-information');
    icon.appendChild(use);
    element.appendChild(icon);

    const body = document.createElement('div');
    body.className = 'notice-body';
    const heading = document.createElement('span');
    heading.className = 'notice-title';
    heading.textContent = title;
    const detail = document.createElement('span');
    detail.className = 'notice-text';
    detail.textContent = text;
    body.append(heading, detail);
    element.appendChild(body);

    if (onDismiss) {
      const dismiss = document.createElement('button');
      dismiss.type = 'button';
      dismiss.className = 'notice-dismiss';
      dismiss.setAttribute('aria-label', 'Dismiss');
      const cross = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      cross.setAttribute('class', 'icon');
      cross.setAttribute('aria-hidden', 'true');
      const glyph = document.createElementNS('http://www.w3.org/2000/svg', 'use');
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
   * @param {number} spec.preset  the default size a double click returns to, so resizing needs no drag
   * @param {(size: number) => void} spec.apply
   * @param {[string, string]} spec.keys  the arrow keys that shrink and grow
   */
  function splitter({ splitter: element, sizeAt, size, limit, minimum, preset, apply, keys }) {
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
    element.addEventListener('dblclick', () => apply(clamp(preset)));
    element.addEventListener('keydown', (event) => {
      const step = event.key === keys[0] ? -16 : event.key === keys[1] ? 16 : 0;
      if (step === 0) return;
      event.preventDefault();
      apply(clamp(size() + step));
    });
  }

  splitter({
    splitter: document.getElementById('splitter-main'),
    sizeAt: (event) => event.clientX - workspace.getBoundingClientRect().left,
    size: () => navigatorPane.getBoundingClientRect().width,
    limit: () => workspace.getBoundingClientRect().width * 0.6,
    minimum: 312,
    preset: 320,
    apply: (width) => workspace.style.setProperty('--navigator-width', `${Math.round(width)}px`),
    keys: ['ArrowLeft', 'ArrowRight'],
  });

  splitter({
    splitter: document.getElementById('splitter-column'),
    sizeAt: (event) => column.getBoundingClientRect().bottom - event.clientY,
    size: () => relationshipsPane.getBoundingClientRect().height,
    limit: () => column.getBoundingClientRect().height - 160,
    minimum: 120,
    preset: 280,
    apply: (height) => column.style.setProperty('--relationships-height', `${Math.round(height)}px`),
    keys: ['ArrowDown', 'ArrowUp'],
  });

  // --- Wiring ----------------------------------------------------------

  let wasFailingToPersist = false;

  function render() {
    applyTheme();
    renderNotices();
    unsavedButton.hidden = !store.dirty();
    document.title = titleFor(store.hasProject(), store.model().name);

    if (wasFailingToPersist && !store.persistFailed()) {
      toast('Autosave working again', 'The project is being kept in this browser once more.');
    }
    wasFailingToPersist = store.persistFailed();
  }

  // The browser's own leave-prompt, kept for the one case where leaving
  // still costs something.
  document.defaultView.addEventListener('beforeunload', (event) => {
    if (!shouldWarnBeforeUnload(store.dirty(), store.persistFailed())) return;
    event.preventDefault();
  });

  store.subscribe(render);
  render();

  return { render };
}
