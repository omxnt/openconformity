/**
 * The About dialog's content: the mark and the wordmark over one line on
 * what the software is and one on where it lives and under what terms,
 * then four groups of rows by what each thing does for the tool, in
 * alphabetical order. The design, saying of each part whether it is
 * followed or carried, with its licence. The diagram editor, with where
 * it loads from and the session's standing consent. The legislation the
 * model is built around. The methods its ratings follow, each by
 * designation with its clauses. The header is the mark beside the
 * wordmark, set apart by space alone, and under it the release line,
 * the version with a link to its notes. The groups stand folded under
 * one accordion heading, opened on a click and closed again each time
 * About opens.
 * Every reference is named by designation only, and every licence named
 * is one the deployment itself carries. Chrome, not flow: the flow only
 * asks for it.
 */

import { el, icon } from './dom.js';
import { VERSION, PHASE } from './version.js';

/**
 * @param {ReturnType<import('./dialog.js').createDialogs>} dialogs
 * @param {{ consented: () => boolean, setConsented: (held: boolean) => void }} [store]  where the session's consent stands
 * @returns {Promise<void>}
 */
export async function showAbout(dialogs, store = null) {
  /** A link leaving the page, wearing the launch glyph as the Help menu's do. */
  const link = (href, text) => el('a', { attributes: { href, target: '_blank', rel: 'noopener' } }, [el('span', { text }), icon('i-launch')]);
  const text = (held) => document.createTextNode(held);
  const cell = (parts) => el('td', {}, typeof parts === 'string' ? [text(parts)] : parts);
  /** A group: its label over rows of three cells, a name, what it is, and a link or a control at the end. */
  const group = (label, rows) =>
    el('section', { className: 'about-section' }, [
      el('h3', { className: 'about-label', text: label }),
      el('table', { className: 'about-table' }, [el('tbody', {}, rows.map((row) => el('tr', {}, row.map(cell))))]),
    ]);

  /** An accordion item, closed at first: a heading with the chevron over the groups it folds. */
  const fold = (label, groups) => {
    const chevron = el('span', { className: 'about-fold-chevron' }, [icon('i-chevron-right')]);
    const heading = el('button', { className: 'about-fold', attributes: { type: 'button', 'aria-expanded': 'false' } }, [chevron, el('span', { text: label })]);
    const held = el('div', { className: 'about-credits' }, groups);
    held.hidden = true;
    heading.addEventListener('click', () => {
      held.hidden = !held.hidden;
      heading.setAttribute('aria-expanded', String(!held.hidden));
      chevron.replaceChildren(icon(held.hidden ? 'i-chevron-right' : 'i-chevron-down'));
    });
    return el('div', { className: 'about-accordion' }, [heading, held]);
  };

  const consentText = () => (store?.consented() ? 'From embed.diagrams.net, not asking this session' : 'From embed.diagrams.net, asked before each edit');
  const consentLine = el('span', { text: consentText() });
  const forget = el('button', { className: 'ghost-button about-forget', text: 'Forget', attributes: { type: 'button' } });
  forget.hidden = !store?.consented();
  forget.addEventListener('click', () => {
    store.setConsented(false);
    consentLine.textContent = consentText();
    forget.hidden = true;
  });

  await dialogs.open({
    title: 'About',
    body: el('div', { className: 'about' }, [
      el('header', { className: 'about-brand' }, [
        el('span', { className: 'about-mark', attributes: { 'aria-hidden': 'true' } }),
        el('div', { className: 'about-brand-text' }, [
          el('span', { className: 'wordmark about-wordmark', attributes: { role: 'img', 'aria-label': 'openconformity' } }),
          el('p', { text: 'A free, open-source, browser-based tool for CE marking of machinery.' }),
          el('p', { className: 'about-meta' }, [
            text('© 2026 omxnt'),
            text(' · '),
            link('LICENSE.txt', 'EUPL-1.2'),
            text(' · '),
            link('https://openconformity.org', 'openconformity.org'),
            text(' · '),
            link('https://github.com/omxnt/openconformity', 'Source on GitHub'),
          ]),
          el('p', { className: 'about-meta' }, [
            el('span', { className: 'about-version', text: VERSION }),
            text(' · '),
            text(PHASE),
            text(' · '),
            link('https://github.com/omxnt/openconformity/releases', 'Release notes'),
          ]),
        ]),
      ]),
      fold('Credits and references', [
      group('Design', [
        ['IBM Carbon', 'Design system, followed', [link('https://carbondesignsystem.com', 'carbondesignsystem.com')]],
        ['IBM Plex', 'Typeface, vendored', [link('assets/fonts/LICENSE.txt', 'SIL Open Font License 1.1')]],
        ['Carbon Icons', 'Icon set, vendored', [link('assets/icons/LICENSE.txt', 'Apache License 2.0')]],
      ]),
      group('Diagrams', [
        ['draw.io', [consentLine], [forget, link('https://www.drawio.com', 'drawio.com'), link('https://www.drawio.com/trust/terms-of-use/', 'Terms of use')]],
        ['JGraph Ltd', 'Maker and trademark holder of draw.io, not affiliated', [link('https://www.drawio.com/trust/', 'Privacy')]],
      ]),
      group('Legislation', [
        ['(EU) 2023/1230', 'Machinery Regulation', [link('https://eur-lex.europa.eu/eli/reg/2023/1230/oj', 'eur-lex.europa.eu')]],
        ['2014/30/EU', 'Electromagnetic Compatibility Directive', [link('https://eur-lex.europa.eu/eli/dir/2014/30/oj', 'eur-lex.europa.eu')]],
      ]),
      group('Methods', [
        ['ISO/TR 14121-2:2012', 'Risk matrix 6.2.2, risk graph 6.3.2, numerical scoring 6.4.2', [link('https://www.iso.org/standard/57180.html', 'iso.org')]],
        ['EN ISO 13849-1:2023', 'Required performance level of a safety function', [link('https://www.iso.org/standard/73481.html', 'iso.org')]],
        ['EN IEC 62061:2021', 'Required safety integrity level of a safety function', [link('https://webstore.iec.ch/en/publication/59927', 'iec.ch')]],
        ['SEBoK', 'System requirement types, after the INCOSE manual', [link('https://sebokwiki.org/wiki/System_Requirements_Definition', 'sebokwiki.org')]],
      ]),
      ]),
    ]),
  });
}
