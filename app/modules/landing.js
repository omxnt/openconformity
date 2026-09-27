/**
 * The landing: the editor pane's no-project state, a welcome, what the
 * beta means for the user's work, where to send a report, and the ways
 * into a project as buttons, the one place those buttons live.
 */

import { el, icon } from './dom.js';

/**
 * The ways into a project, offered from the editor's no-project state,
 * the one place the buttons live.
 */
export const LANDING_OFFER = [
  { id: 'new-project', icon: 'i-new-project', label: 'New project' },
  { id: 'open', icon: 'i-open-project', label: 'Open project…' },
  { id: 'load-example', icon: 'i-project', label: 'Load example' },
];

/**
 * The landing as an element, its buttons running the actions by
 * identifier through the callback.
 * @param {(id: string) => void} onAction
 */
export function landing(onAction) {
  const landing = el('div', { className: 'empty-state landing' }, [
    el('p', { className: 'empty-state-title', text: 'Welcome to openconformity' }),
    el('p', { className: 'empty-state-body', text: 'Start a new project, open one you saved earlier, or load the example to see how a model is built.' }),
    el('p', { className: 'empty-state-body', text: 'The software is in beta. It runs entirely in your browser, and your work is kept there between sessions. A beta can still lose it, so save your project to a file often, and keep the files you save.' }),
    el('p', { className: 'empty-state-body' }, [
      el('span', { text: 'Bug reports and suggestions are welcome at ' }),
      el('a', { text: 'info@openconformity.org', attributes: { href: 'mailto:info@openconformity.org' } }),
      el('span', { text: '.' }),
    ]),
  ]);
  for (const offer of LANDING_OFFER) {
    const button = el(
      'button',
      { className: 'ghost-button', attributes: { type: 'button', 'data-action': `landing-${offer.id}` } },
      [icon(offer.icon), el('span', { text: offer.label })]
    );
    button.addEventListener('click', () => onAction(offer.id));
    landing.appendChild(button);
  }
  return landing;
}
