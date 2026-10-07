/**
 * A view's section as Markdown: the view's title as the document's
 * heading, a line under it, a list of contents linking to each block
 * where there are two or more, then each part in order, under the
 * numbered heading of the block it opens, its part's caption and its
 * own, written as a pipe table, as prose, or as an image linked to a
 * file beside the document. The links follow the anchors GitHub gives
 * its headings. Cells
 * arrive as text, a line break within one written as a break tag and a
 * pipe escaped, so a cell never leaves its column. An empty cell holds
 * a dash. Every text is written with the characters that start markup
 * or Markdown's own syntax escaped, and a line of prose that would open
 * a heading, a list, a quote or a table escaped at its start, so what a
 * field holds reads as the text it is wherever the file is shown and
 * never becomes a link, an image or a structure. A pure function of its
 * input.
 */

/**
 * Text with the characters that start markup or Markdown's inline syntax
 * escaped: ampersands and angle brackets as entities, and backslashes,
 * backticks, asterisks, underscores and square brackets behind a
 * backslash, so no link, image, code or emphasis can form.
 * @param {string} text
 */
export function markdownText(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replace(/[\\`*_[\]]/g, (held) => `\\${held}`)
    .replace(/\b(https?)(:)/gi, '$1\\$2')
    .replace(/\b(www)(\.)/gi, '$1\\$2')
    .replace(/(\w)@(?=\w)/g, '$1\\@');
}

/** Text with every line break, whatever form, as one line feed. */
const breaks = (text) => String(text ?? '').replace(/\r\n?/g, '\n');

/** Text on one line, for a title, a heading or a caption. */
const oneLine = (text) => markdownText(breaks(text).replace(/\n+/g, ' '));

/**
 * A line of prose escaped, and escaped again at its start where it would
 * open a heading, a list, a thematic break, a table or a fence.
 * @param {string} line
 */
function proseLine(line) {
  const held = markdownText(line);
  if (/^\d+[.)](\s|$)/.test(held)) return held.replace(/^(\d+)([.)])/, '$1\\$2');
  return /^[#+\-=|~]/.test(held) ? `\\${held}` : held;
}

/**
 * @typedef {Object} MarkdownTable
 * @property {string} [heading]  the block the part opens
 * @property {string} [chapter]  the block's number
 * @property {string} [prose]  text in place of the table, a dash where empty
 * @property {string} [caption]  the part's name
 * @property {string} [subcaption]  the table's own name within the part
 * @property {string[]} [headers]
 * @property {string[][]} [rows]  each cell as text
 * @property {{ alt: string, path: string }|null} [image]  a figure in place of the table, linked by its path, or null for none
 */

/**
 * A cell as a pipe table holds it.
 * @param {string} text
 */
export function markdownCell(text) {
  const held = String(text ?? '').trim();
  if (held === '') return '–';
  return markdownText(breaks(held)).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

/**
 * Text as a paragraph, its lines kept apart by a blank line each.
 * @param {string} text
 */
function paragraphs(text) {
  return breaks(text)
    .split('\n')
    .map((line) => proseLine(line.trim()))
    .filter(Boolean)
    .join('\n\n');
}

/**
 * The anchor GitHub gives a heading: its text in lower case, without
 * punctuation, its spaces as hyphens.
 * @param {string} text
 */
export function anchor(text) {
  return String(text).toLowerCase().replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '').replace(/ /g, '-');
}

/**
 * A document of tables.
 * @param {string} title
 * @param {MarkdownTable[]} tables
 * @param {{ subtitle?: string }} [options]  a line under the title
 * @returns {string}
 */
export function markdown(title, tables, options = {}) {
  const lines = [`# ${oneLine(title)}`, ''];
  if (options.subtitle) lines.push(oneLine(options.subtitle), '');
  const chapters = tables.filter((table) => table.heading);
  const numberedHeading = (table) => [table.chapter, table.heading].filter(Boolean).join(' ');
  if (chapters.length > 1) {
    lines.push('## Contents', '');
    for (const [i, table] of chapters.entries()) lines.push(`${i + 1}. [${oneLine(table.heading.replace(/[[\]]/g, ''))}](#${anchor(numberedHeading(table))})`);
    lines.push('');
  }
  for (const table of tables) {
    if (table.heading) lines.push(`## ${oneLine(numberedHeading(table))}`, '');
    if (table.caption) lines.push(`### ${oneLine(table.caption)}`, '');
    if (table.subcaption) lines.push(`#### ${oneLine(table.subcaption)}`, '');
    if ('prose' in table) {
      lines.push(paragraphs(table.prose ?? '') || '–', '');
      continue;
    }
    if ('image' in table) {
      lines.push(table.image ? `![${markdownText(table.image.alt.replace(/[[\]]/g, ''))}](${encodeURI(table.image.path)})` : '–', '');
      continue;
    }
    lines.push(`| ${table.headers.map(markdownCell).join(' | ')} |`, `|${table.headers.map(() => '---').join('|')}|`);
    for (const row of table.rows) lines.push(`| ${row.map(markdownCell).join(' | ')} |`);
    lines.push('');
  }
  return lines.join('\n');
}
