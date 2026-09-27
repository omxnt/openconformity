/**
 * A view's section as Markdown: the view's title as the document's
 * heading, then each table in order, under the heading and text of the
 * block it opens and its own caption, written as a pipe table. Cells
 * arrive as text, a line break within one written as a break tag and a
 * pipe escaped, so a cell never leaves its column. An empty cell holds
 * a dash. Every text is written with its ampersands and angle brackets
 * escaped, so markup typed into a field reads as text wherever the file
 * is shown. A pure function of its input.
 */

/**
 * Text with the characters that start markup escaped.
 * @param {string} text
 */
export function markdownText(text) {
  return String(text ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/**
 * @typedef {Object} MarkdownTable
 * @property {string} [heading]  the block the table opens
 * @property {string} [text]  the text under the block's heading
 * @property {string} [caption]  the table's own name
 * @property {string[]} headers
 * @property {string[][]} rows  each cell as text
 */

/**
 * A cell as a pipe table holds it.
 * @param {string} text
 */
export function markdownCell(text) {
  const held = String(text ?? '').trim();
  if (held === '') return '–';
  return markdownText(held).replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

/**
 * Text as a paragraph, its lines kept apart by a blank line each.
 * @param {string} text
 */
function paragraphs(text) {
  return text
    .split(/\r?\n/)
    .map((line) => markdownText(line.trim()))
    .filter(Boolean)
    .join('\n\n');
}

/**
 * A document of tables.
 * @param {string} title
 * @param {MarkdownTable[]} tables
 * @returns {string}
 */
export function markdown(title, tables) {
  const lines = [`# ${markdownText(title)}`, ''];
  for (const table of tables) {
    if (table.heading) lines.push(`## ${markdownText(table.heading)}`, '');
    if (table.text) lines.push(paragraphs(table.text), '');
    if (table.caption) lines.push(`### ${markdownText(table.caption)}`, '');
    lines.push(`| ${table.headers.map(markdownCell).join(' | ')} |`, `|${table.headers.map(() => '---').join('|')}|`);
    for (const row of table.rows) lines.push(`| ${row.map(markdownCell).join(' | ')} |`);
    lines.push('');
  }
  return lines.join('\n');
}
