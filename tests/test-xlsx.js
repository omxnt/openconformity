/**
 * Exercises the Excel workbook: the text as XML takes it, the sheet
 * names Excel accepts, the column letters, UTF-8, the zip's checksum and
 * its layout read back entry by entry, and the parts of a workbook with
 * their merges, styles and frozen heads. Run from this directory.
 */

import { xmlText, sheetName, columnLetters, utf8, crc32, zip, sheetXml, workbook } from '../app/modules/xlsx.js';
import { ok, equal, deepEqual, summary } from './harness.js';

/** Text from UTF-8 bytes, for reading a part back. */
function text(bytes) {
  return decodeURIComponent([...bytes].map((byte) => `%${byte.toString(16).padStart(2, '0')}`).join(''));
}

/** A stored zip read back: each entry's name, its data and whether its checksum holds, with the directory's count. */
function unzip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.length - 22;
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const entries = [];
  for (let i = 0; i < count; i += 1) {
    const nameLength = view.getUint16(at + 28, true);
    const local = view.getUint32(at + 42, true);
    const size = view.getUint32(local + 18, true);
    const localName = view.getUint16(local + 26, true);
    const data = bytes.subarray(local + 30 + localName, local + 30 + localName + size);
    entries.push({ name: text(bytes.subarray(at + 46, at + 46 + nameLength)), data, crcHolds: crc32(data) === view.getUint32(local + 14, true), method: view.getUint16(local + 8, true) });
    at += 46 + nameLength;
  }
  return { signature: view.getUint32(0, true), end: view.getUint32(end, true), entries };
}

// --- The text as XML takes it (F-VIE-001) ----------------------------------

{
  equal(xmlText(`<a href="x">Tom & 'Jerry'</a>`), '&lt;a href=&quot;x&quot;&gt;Tom &amp; &apos;Jerry&apos;&lt;/a&gt;', 'the five markup characters are escaped');
  equal(xmlText('bell\u0007 tab\t line\n null\u0000'), 'bell tab\t line\n null', 'characters XML does not allow are left out, tabs and line breaks kept');
  equal(xmlText('lone \uD800 half'), 'lone  half', 'and so is half a surrogate pair');
  equal(xmlText('å ä ö 😀'), 'å ä ö 😀', 'while every real character stays');
  equal(xmlText('=HYPERLINK("x")'), '=HYPERLINK(&quot;x&quot;)', 'a leading equals sign is text like any other');
}

// --- The names Excel accepts (F-VIE-001) -----------------------------------

{
  const taken = new Set();
  equal(sheetName('All scenarios (4)', taken), 'All scenarios (4)', 'a tab name stands as it is');
  equal(sheetName('Pumps/valves: [A]?*', taken), 'Pumps-valves- -A---', 'the characters Excel refuses become dashes');
  equal(sheetName('A name far longer than thirty-one characters', taken).length, 31, 'a name is cut to 31 characters');
  equal(sheetName('all scenarios (4)', taken), 'all scenarios (4) 2', 'a name already given, in any case, takes a number');
  equal(sheetName('', taken), 'Sheet', 'an empty name takes a plain one');
  deepEqual([0, 25, 26, 51, 701, 702].map(columnLetters), ['A', 'Z', 'AA', 'AZ', 'ZZ', 'AAA'], 'columns are lettered as Excel letters them');
}

// --- The bytes (F-VIE-001) --------------------------------------------------

{
  deepEqual([...utf8('aå€😀')], [0x61, 0xc3, 0xa5, 0xe2, 0x82, 0xac, 0xf0, 0x9f, 0x98, 0x80], 'text is UTF-8 in one to four bytes a character');
  equal(crc32(utf8('123456789')), 0xcbf43926, 'the checksum is CRC-32 as a zip computes it');
  const packed = zip([{ name: 'a.txt', text: 'hello' }, { name: 'dir/b.xml', text: '<b>å</b>' }]);
  const read = unzip(packed);
  deepEqual([read.signature, read.end], [0x04034b50, 0x06054b50], 'the zip opens with a local header and ends with its end record');
  deepEqual(read.entries.map((entry) => [entry.name, text(entry.data), entry.crcHolds, entry.method]), [['a.txt', 'hello', true, 0], ['dir/b.xml', '<b>å</b>', true, 0]], 'each entry is found through the directory, stored, its checksum holding');
}

// --- A sheet (F-VIE-001) ----------------------------------------------------

{
  const xml = sheetXml({
    name: 'All',
    groups: ['Scenario', 'Scenario', '', 'Risk'],
    headers: ['Title', 'Event', 'Notes', 'Rating'],
    rows: [[{ text: 'SCN-001 S-1' }, { text: 'Line one\nLine two' }, { text: '' }, { text: 'High', tone: 'high' }]],
  });
  ok(xml.includes('<mergeCell ref="A1:B1"/>') && xml.includes('<mergeCell ref="C1:C2"/>') && !xml.includes('ref="D1:D1"'), 'a group is merged over its columns, a column without one down both head rows, and a group of one not merged');
  ok(xml.includes('<c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">Scenario</t></is></c><c r="B1" s="1"/>'), 'the group name stands where its group starts, the rest of the group a styled blank');
  ok(xml.includes('<c r="C1" s="2" t="inlineStr"><is><t xml:space="preserve">Notes</t></is></c>') && xml.includes('<c r="C2" s="2"/>'), 'a column without a group names itself in the first row');
  ok(xml.includes('<c r="B3" s="3" t="inlineStr"><is><t xml:space="preserve">Line one\nLine two</t></is></c>'), 'a cell keeps its line breaks, written as text');
  ok(xml.includes('<c r="D3" s="4" t="inlineStr">'), 'a rating carries its tone');
  ok(xml.includes('<pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/>'), 'both head rows stay in view');
  ok(!/<f>|t="str"|t="n"/.test(xml), 'no cell is a formula or a number');
  const plain = sheetXml({ name: 'Plain', groups: ['', ''], headers: ['A', 'B'], rows: [] });
  ok(!plain.includes('mergeCells') && plain.includes('<pane ySplit="1" topLeftCell="A2"'), 'a table without groups has one head row and nothing merged');
}

// --- The workbook (F-VIE-001) -----------------------------------------------

{
  const bytes = workbook([
    { name: 'All scenarios (4)', groups: ['G'], headers: ['H'], rows: [[{ text: 'x' }]] },
    { name: 'L-1 Installation (0)', groups: [''], headers: ['H'], rows: [] },
  ]);
  const parts = unzip(bytes).entries;
  deepEqual(parts.map((entry) => entry.name), ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml'], 'the parts of a workbook, the content types first');
  ok(parts.every((entry) => entry.crcHolds), 'every checksum holds');
  const part = (name) => text(parts.find((entry) => entry.name === name).data);
  ok(part('xl/workbook.xml').includes('<sheet name="All scenarios (4)" sheetId="1" r:id="rId1"/><sheet name="L-1 Installation (0)" sheetId="2" r:id="rId2"/>'), 'the sheets are named as the tabs, in order');
  ok(part('[Content_Types].xml').includes('PartName="/xl/worksheets/sheet2.xml"') && part('xl/_rels/workbook.xml.rels').includes('Target="styles.xml"'), 'each part is declared and related');
  ok(parts.every((entry) => text(entry.data).startsWith('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')), 'and every part is XML in UTF-8');
}

summary('test-xlsx');
