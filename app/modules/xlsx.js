/**
 * An Excel workbook, written as the Office Open XML format (ECMA-376)
 * describes it: a zip of XML parts holding one sheet per table, each
 * with a row of group names merged over their columns where the table
 * has groups, a row of column names, and the rows beneath. Every cell is
 * a string written in place, so nothing in it is ever read as a formula.
 * The formatting is kept to layout: text wraps with cells at the top,
 * the group heads centred over their columns, the head rows stay in view
 * while the rows scroll, and each column is wide enough for its text
 * within bounds. The zip is stored without compression. A pure function of its
 * input, returning the file's bytes.
 */

import { zip } from './zip.js';

/**
 * @typedef {Object} Sheet
 * @property {string} name  the tab it came from
 * @property {string[]} groups  each column's group, empty where it has none
 * @property {string[]} headers  each column's name
 * @property {Array<Array<{ text: string }>>} rows
 */

const MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const RELATIONSHIPS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const DOCUMENT = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PROLOGUE = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

/**
 * Text as XML character data: the five markup characters escaped, and
 * the characters XML 1.0 does not allow left out.
 * @param {string} text
 */
export function xmlText(text) {
  return String(text)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/**
 * A sheet's name as Excel takes one: without the characters it refuses,
 * at most 31 characters, and not the same as a name before it.
 * @param {string} name
 * @param {Set<string>} taken  names already given, compared without case
 */
export function sheetName(name, taken) {
  const base = (name.replace(/[\\/?*:[\]]/g, '-').replace(/\s+/g, ' ').replace(/^'+|'+$/g, '').trim() || 'Sheet').slice(0, 31);
  let held = base;
  for (let n = 2; taken.has(held.toLowerCase()) || held.toLowerCase() === 'history'; n += 1) held = `${base.slice(0, 31 - ` ${n}`.length)} ${n}`;
  taken.add(held.toLowerCase());
  return held;
}

/**
 * A column's letters from its index, A for 0 and AA for 26.
 * @param {number} index
 */
export function columnLetters(index) {
  let letters = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  return letters;
}

/** The styles by index: 0 the default, 1 a group head, 2 a column head, 3 a cell. */
const STYLE = { group: 1, header: 2, cell: 3 };

/** The stylesheet the styles above stand in, alignment and wrapping only. */
function stylesheet() {
  const xf = (horizontal) =>
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="${horizontal}" vertical="top" wrapText="1"/></xf>`;
  const xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>', xf('center'), xf('left'), xf('left')];
  return (
    PROLOGUE +
    `<styleSheet xmlns="${MAIN}">` +
    '<fonts count="1"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>' +
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    `<cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs>` +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>'
  );
}

/**
 * One sheet's XML: the head rows frozen above the body, columns wide
 * enough for their longest line within bounds, the groups merged.
 * @param {Sheet} sheet
 */
export function sheetXml(sheet) {
  const grouped = sheet.groups.some(Boolean);
  const heads = grouped ? 2 : 1;
  const cell = (row, column, text, style) =>
    text === ''
      ? `<c r="${columnLetters(column)}${row}" s="${style}"/>`
      : `<c r="${columnLetters(column)}${row}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlText(text)}</t></is></c>`;
  const rows = [];
  const merges = [];
  if (grouped) {
    const cells = [];
    sheet.groups.forEach((group, i) => {
      const starts = group !== '' && (i === 0 || sheet.groups[i - 1] !== group);
      if (group === '') {
        cells.push(cell(1, i, sheet.headers[i], STYLE.header));
        merges.push(`${columnLetters(i)}1:${columnLetters(i)}2`);
        return;
      }
      cells.push(cell(1, i, starts ? group : '', STYLE.group));
      if (starts) {
        let last = i;
        while (last + 1 < sheet.groups.length && sheet.groups[last + 1] === group) last += 1;
        if (last > i) merges.push(`${columnLetters(i)}1:${columnLetters(last)}1`);
      }
    });
    rows.push(`<row r="1">${cells.join('')}</row>`);
  }
  rows.push(`<row r="${heads}">${sheet.headers.map((header, i) => cell(heads, i, grouped && sheet.groups[i] === '' ? '' : header, STYLE.header)).join('')}</row>`);
  sheet.rows.forEach((row, r) => {
    rows.push(`<row r="${heads + 1 + r}">${row.map((held, i) => cell(heads + 1 + r, i, held.text, STYLE.cell)).join('')}</row>`);
  });
  const widths = sheet.headers.map((header, i) => {
    let widest = 12;
    for (const text of [header, ...sheet.rows.map((row) => row[i]?.text ?? '')]) {
      for (const line of text.split('\n')) widest = Math.max(widest, line.length + 2);
    }
    return Math.min(48, widest);
  });
  const cols = widths.map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`).join('');
  return (
    PROLOGUE +
    `<worksheet xmlns="${MAIN}" xmlns:r="${DOCUMENT}">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${heads}" topLeftCell="A${heads + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    `<cols>${cols}</cols>` +
    `<sheetData>${rows.join('')}</sheetData>` +
    (merges.length > 0 ? `<mergeCells count="${merges.length}">${merges.map((ref) => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells>` : '') +
    '</worksheet>'
  );
}

/**
 * The workbook's bytes: one sheet per table, in order.
 * @param {Sheet[]} sheets
 * @returns {Uint8Array}
 */
export function workbook(sheets) {
  const taken = new Set();
  const names = sheets.map((sheet) => sheetName(sheet.name, taken));
  const parts = sheets.map((sheet, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, text: sheetXml(sheet) }));
  const overrides = sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
  return zip([
    {
      name: '[Content_Types].xml',
      text:
        PROLOGUE +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        overrides +
        '</Types>',
    },
    {
      name: '_rels/.rels',
      text: `${PROLOGUE}<Relationships xmlns="${RELATIONSHIPS}"><Relationship Id="rId1" Type="${DOCUMENT}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      text: `${PROLOGUE}<workbook xmlns="${MAIN}" xmlns:r="${DOCUMENT}"><sheets>${names.map((name, i) => `<sheet name="${xmlText(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      text:
        `${PROLOGUE}<Relationships xmlns="${RELATIONSHIPS}">` +
        sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${DOCUMENT}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
        `<Relationship Id="rId${sheets.length + 1}" Type="${DOCUMENT}/styles" Target="styles.xml"/>` +
        '</Relationships>',
    },
    { name: 'xl/styles.xml', text: stylesheet() },
    ...parts,
  ]);
}
