/**
 * Exercises the overlay stack rules headless: one stack, menus exclusive,
 * Escape to the top entry, a commit closing menus and never dialogs, and
 * the opener riding with its entry. The page binding is checked in the
 * browser. Run from this directory.
 */

import { createOverlayStack } from '../app/overlay.js';
import { ok, equal, deepEqual, summary } from './harness.js';

/**
 * A fake entry that counts its closes.
 * @param {'menu'|'panel'|'dialog'} kind
 * @param {unknown} [opener]
 */
function entryOf(kind, opener) {
  const entry = { kind, opener, closed: 0, onClose: () => { entry.closed += 1; } };
  return entry;
}

/** The kinds in the stack, bottom first. */
function kinds(stack) {
  return stack.entries().map((entry) => entry.kind);
}

// --- One stack ---------------------------------------------------------

{
  const stack = createOverlayStack();
  equal(stack.top(), null, 'an empty stack has no top');
  equal(stack.escape(), null, 'and Escape has nothing to close');

  const menu = stack.open(entryOf('menu'));
  equal(stack.top(), menu, 'an opened entry is the top');
  deepEqual(kinds(stack), ['menu'], 'and stands in the stack');
}

// --- Menus are exclusive -----------------------------------------------

{
  const stack = createOverlayStack();
  const first = stack.open(entryOf('menu'));
  const second = stack.open(entryOf('menu'));
  equal(first.closed, 1, 'opening a menu closes the menu before it');
  deepEqual(kinds(stack), ['menu'], 'one menu at a time');
  equal(stack.top(), second, 'the newer one stands');

  const panel = stack.open(entryOf('panel'));
  equal(second.closed, 1, 'opening a panel closes the menu too');
  deepEqual(kinds(stack), ['panel'], 'opening anything closes them');

  const dialog = stack.open(entryOf('dialog'));
  equal(panel.closed, 0, 'a panel survives a dialog opening over it');
  deepEqual(kinds(stack), ['panel', 'dialog'], 'dialogs stack over panels');
  equal(stack.top(), dialog, 'with the dialog on top');
}

// --- A commit closes menus and never dialogs ---------------------------

{
  const stack = createOverlayStack();
  const panel = stack.open(entryOf('panel'));
  const dialog = stack.open(entryOf('dialog'));
  const menu = stack.open(entryOf('menu'));

  stack.closeMenus();
  equal(menu.closed, 1, 'a commit closes the menus');
  equal(dialog.closed, 0, 'never the dialogs');
  equal(panel.closed, 0, 'and panels survive commits');
  deepEqual(kinds(stack), ['panel', 'dialog'], 'the rest of the stack stands');

  stack.closeMenus();
  equal(menu.closed, 1, 'closing the menus twice closes nothing twice');
}

// --- Escape goes to the top entry --------------------------------------

{
  const stack = createOverlayStack();
  const panel = stack.open(entryOf('panel'));
  const dialog = stack.open(entryOf('dialog'));
  const menu = stack.open(entryOf('menu'));

  equal(stack.escape(), menu, 'Escape closes the top entry and returns it');
  equal(stack.escape(), dialog, 'then the entry beneath');
  equal(stack.escape(), panel, 'entry by entry');
  equal(stack.escape(), null, 'until nothing is above the page');
  equal(menu.closed + dialog.closed + panel.closed, 3, 'each closed exactly once');
}

// --- Closing ------------------------------------------------------------

{
  const stack = createOverlayStack();
  const panel = stack.open(entryOf('panel'));
  const dialog = stack.open(entryOf('dialog'));

  equal(stack.close(panel), true, 'an entry can close from the middle of the stack');
  deepEqual(kinds(stack), ['dialog'], 'the entries above it stand');
  equal(stack.top(), dialog, 'and the top is unchanged');
  equal(stack.close(panel), false, 'closing it again reports it gone');
  equal(panel.closed, 1, 'and does not close it twice');
}

// --- The opener rides with its entry ------------------------------------

{
  const stack = createOverlayStack();
  const opener = { name: 'the button' };
  const menu = stack.open(entryOf('menu', opener));
  equal(menu.opener, opener, 'the entry records its opener');
  let reported = null;
  const dialog = stack.open({ kind: 'dialog', opener, onClose: (entry) => { reported = entry; } });
  stack.close(dialog);
  equal(reported, dialog, 'closing reports the entry to its own close hook');
  equal(reported.opener, opener, 'with the opener on it, for the focus return');
}

summary('test-overlay');
