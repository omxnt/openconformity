/**
 * Wiring: constructs and connects, nothing else.
 */

import { createStore } from './store.js';
import { createOverlay } from './overlay.js';
import { createShell } from './shell.js';

const store = createStore({ storage: window.localStorage });
const overlay = createOverlay({ container: document.getElementById('overlay-root') });

store.subscribe(() => overlay.closeMenus());

createShell({ store, overlay });
