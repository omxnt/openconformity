/**
 * The About dialog's content: the mark and the wordmark over one line on
 * what the software is and one on where it lives and under what terms,
 * then the release line, the version and the phase with a link to the
 * notes. Beneath, five accordion items, each closed when About opens,
 * grouping the credits and references by what each thing is to the
 * software. References, the legislation the model is built around and
 * the methods its ratings follow, each by designation. Technology, what
 * the software is made of. Design assets,
 * the system followed and the assets self-hosted, each with its
 * licence. External services, the diagram editor with where it loads
 * from and the session's standing consent, and its maker. Hosting and
 * tools, where the software is served from and what it was made with. Every reference is named by designation only, and
 * every licence named is one the deployment itself carries. Chrome, not
 * flow: the flow only asks for it.
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
  /** An accordion item, closed at first: a heading with the chevron over its rows of three cells, a name, what it is, and a link or a control at the end. */
  const fold = (label, rows) => {
    const chevron = el('span', { className: 'about-fold-chevron' }, [icon('i-chevron-right')]);
    const heading = el('button', { className: 'about-fold', attributes: { type: 'button', 'aria-expanded': 'false' } }, [chevron, el('span', { text: label })]);
    const held = el('div', { className: 'about-credits' }, [el('table', { className: 'about-table' }, [el('tbody', {}, rows.map((row) => el('tr', {}, row.map(cell))))])]);
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
      fold('References', [
        ['(EU) 2023/1230', 'Machinery Regulation', [link('https://eur-lex.europa.eu/eli/reg/2023/1230/oj', 'eur-lex.europa.eu')]],
        ['ISO/TR 14121-2:2012', 'Risk matrix 6.2.2, risk graph 6.3.2, numerical scoring 6.4.2', [link('https://www.iso.org/standard/57180.html', 'iso.org')]],
        ['EN ISO 13849-1:2023', 'Required performance level of a safety function', [link('https://www.iso.org/standard/73481.html', 'iso.org')]],
        ['EN IEC 62061:2021', 'Required safety integrity level of a safety function', [link('https://webstore.iec.ch/en/publication/59927', 'iec.ch')]],
        ['SEBoK', 'System requirement types, after the INCOSE manual', [link('https://sebokwiki.org/wiki/System_Requirements_Definition', 'sebokwiki.org')]],
      ]),
      fold('Technology', [
        ['Web platform', 'HTML, CSS and JavaScript as ES modules, no framework and no build', [link('https://developer.mozilla.org/docs/Web', 'developer.mozilla.org')]],
        ['JSON', 'The project file, checked against its schema', [link('https://github.com/omxnt/openconformity/blob/main/specs/project.schema.json', 'project.schema.json')]],
        ['SVG', 'The diagrams, and the files saved beside a specification', [link('https://www.w3.org/TR/SVG2/', 'w3.org')]],
        ['Office Open XML', 'The Excel workbooks views are saved as', [link('https://ecma-international.org/publications-and-standards/standards/ecma-376/', 'ecma-international.org')]],
        ['GitHub Flavored Markdown', 'The documents a specification is saved as', [link('https://github.github.com/gfm/', 'github.github.com')]],
        ['ZIP', 'The package a workbook is, and a specification with its diagrams', [link('https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT', 'pkware.com')]],
        ['IndexedDB', 'The browser storage the open project is kept in between sessions', [link('https://developer.mozilla.org/docs/Web/API/IndexedDB_API', 'developer.mozilla.org')]],
      ]),
      fold('Design assets', [
        ['IBM Carbon', 'Design system, followed without its packages', [link('https://carbondesignsystem.com', 'carbondesignsystem.com')]],
        ['IBM Plex', 'Typeface, self-hosted', [link('assets/fonts/LICENSE.txt', 'SIL Open Font License 1.1')]],
        ['Carbon Icons', 'Icon set, self-hosted', [link('assets/icons/LICENSE.txt', 'Apache License 2.0')]],
      ]),
      fold('External services', [
        ['draw.io', [consentLine], [forget, link('https://www.drawio.com', 'drawio.com')]],
        ['JGraph Ltd', 'Maker and trademark holder, not affiliated', [link('https://www.drawio.com/trust/terms-of-use/', 'Terms of use'), link('https://www.drawio.com/trust/', 'Privacy')]],
      ]),
      fold('Hosting and tools', [
        ['Cloudflare Pages', 'Where the software is served from, static files only', [link('https://pages.cloudflare.com', 'pages.cloudflare.com')]],
        ['Claude Code', 'Coding assistant, used in development only', [link('https://claude.com/claude-code', 'claude.com')]],
        ['Visual Studio Code', 'Code editor, used in development only', [link('https://code.visualstudio.com', 'code.visualstudio.com')]],
        ['GitHub', 'Source repository, issues and vulnerability reports', [link('https://github.com/omxnt/openconformity', 'github.com')]],
        ['Mermaid', 'Metamodel notation, the diagram exported with Mermaid Live', [link('https://mermaid.js.org', 'mermaid.js.org')]],
        ['Figma', 'Identity, the wordmark and the marks drawn in it', [link('https://www.figma.com', 'figma.com')]],
      ]),
    ]),
  });
}
