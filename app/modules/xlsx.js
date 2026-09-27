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
  const base = (name.replace(/[\\/?*:[\]]/g, '-').replace(/^'+|'+$/g, '').trim() || 'Sheet').slice(0, 31);
  let held = base;
  for (let n = 2; taken.has(held.toLowerCase()); n += 1) held = `${base.slice(0, 31 - ` ${n}`.length)} ${n}`;
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

/**
 * Text as UTF-8 bytes.
 * @param {string} text
 */
export function utf8(text) {
  const bytes = [];
  for (const char of text) {
    const code = /** @type {number} */ (char.codePointAt(0));
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
  }
  return Uint8Array.from(bytes);
}

/** The CRC-32 table a zip entry's checksum is read from. */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

/**
 * The CRC-32 of bytes, as a zip records it.
 * @param {Uint8Array} bytes
 */
export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Files packed as a zip, each stored without compression, with the
 * local headers, the central directory and its end record.
 * @param {Array<{ name: string, text: string }>} files
 * @returns {Uint8Array}
 */
export function zip(files) {
  const parts = [];
  const central = [];
  let offset = 0;
  const DOS_DATE = 0x21;
  for (const file of files) {
    const name = utf8(file.name);
    const data = utf8(file.text);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, 0, true);
    local.setUint16(12, DOS_DATE, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint16(10, 0, true);
    entry.setUint16(12, 0, true);
    entry.setUint16(14, DOS_DATE, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    parts.push(new Uint8Array(local.buffer), name, data);
    central.push(new Uint8Array(entry.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const bytes = new Uint8Array(all.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of all) {
    bytes.set(part, at);
    at += part.length;
  }
  return bytes;
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
    const lines = [header, ...sheet.rows.flatMap((row) => (row[i]?.text ?? '').split('\n'))];
    return Math.min(48, Math.max(12, ...lines.map((line) => line.length + 2)));
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
