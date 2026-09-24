/**
 * The About dialog's content: what the software is, who holds it under
 * what terms, and what of other people's work it carries — every licence
 * named is one the deployment itself carries, so all of them are
 * reachable from here. Chrome, not flow: the flow only asks for it.
 */

import { el } from './dom.js';

/**
 * @param {ReturnType<import('./dialog.js').createDialogs>} dialogs
 * @returns {Promise<void>}
 */
export async function showAbout(dialogs) {
  const link = (href, text) =>
    el('a', { text, attributes: { href, target: '_blank', rel: 'noopener' } });
  await dialogs.open({
    title: 'About',
    body: el('div', { className: 'about' }, [
      el('p', { className: 'about-headline', text: 'openconformity' }),
      el('p', {
        text:
          'This project is an initiative to develop a free, open-source, browser-based tool for CE marking of machinery according to the Machinery Regulation (EU) 2023/1230, with no commercial interests behind it.',
      }),
      el('p', {}, [
        document.createTextNode('© 2026 omxnt, licensed under the '),
        link('LICENSE.txt', 'EUPL-1.2'),
        document.createTextNode('.'),
      ]),
      el('p', {}, [link('https://github.com/omxnt/openconformity', 'Source on GitHub')]),
      el('p', { text: 'Third-party assets, vendored with the software:' }),
      el('ul', { className: 'doomed-list' }, [
        el('li', {}, [
          document.createTextNode('IBM Plex, under the '),
          link('assets/fonts/LICENSE.txt', 'SIL Open Font License 1.1'),
          document.createTextNode('.'),
        ]),
        el('li', {}, [
          document.createTextNode('Carbon Icons, under the '),
          link('assets/icons/LICENSE.txt', 'Apache License 2.0'),
          document.createTextNode('.'),
        ]),
      ]),
    ]),
    actions: [{ label: 'Close', value: null, kind: 'primary' }],
  });
}
