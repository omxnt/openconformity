/**
 * Exercises the Markdown writer: a cell as a pipe table holds it, the
 * markup escaped, and a document of headed tables. Run from this
 * directory.
 */

import { markdownText, markdownCell, markdown, anchor } from '../app/modules/markdown.js';
import { ok, equal, deepEqual, summary } from './harness.js';

// --- V-TST-073 A cell and its text (F-VIE-001, N-SEC-011) --------------------

{
  equal(markdownCell('plain'), 'plain', 'text is itself');
  equal(markdownCell(''), '–', 'an empty cell holds a dash');
  equal(markdownCell('one\ntwo'), 'one<br>two', 'a line break is a break tag, so the cell keeps to its row');
  equal(markdownCell('a | b'), 'a \\| b', 'a pipe is escaped, so the cell keeps to its column');
  equal(markdownCell('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;', 'markup typed into a field is escaped and reads as text');
  equal(markdownText('Tom & Jerry'), 'Tom &amp; Jerry', 'as is an ampersand');
  equal(markdownCell('![x](https://tracker.example/p.png)'), '!\\[x\\](https\\://tracker.example/p.png)', 'an image from an outside address cannot form, so nothing loads when the file is read');
  equal(markdownText('[click](javascript:alert(1))'), '\\[click\\](javascript:alert(1))', 'nor a link');
  equal(markdownText('a*b*c `code` snake_case back\\slash'), 'a\\*b\\*c \\`code\\` snake\\_case back\\\\slash', 'nor emphasis or code, a backslash kept as itself');
  equal(markdownText('ISO 13849-1, 5 mm (min.)'), 'ISO 13849-1, 5 mm (min.)', 'while plain text stays as it is');
  const prose = markdown('T', [{ caption: 'P', prose: '# Not a heading\n- not a list\n1. not a list\n| not a table\nplain' }]);
  ok(prose.includes('\\# Not a heading\n\n\\- not a list\n\n1\\. not a list\n\n\\| not a table\n\nplain'), 'a line of prose that would open a heading, a list or a table is escaped at its start');
  equal(markdown('T', [{ caption: 'Diagram', image: { alt: 'Diagram of [x]', path: 'diagrams/A B.svg' } }, { caption: 'Other', image: null }]), '# T\n\n### Diagram\n\n![Diagram of x](diagrams/A%20B.svg)\n\n### Other\n\n–\n', 'a figure is an image linked by its path, and a dash where there is none');
  ok(markdown('T', [{ caption: 'Relationships', subcaption: 'Realises', headers: ['A'], rows: [] }]).includes('### Relationships\n\n#### Realises\n\n| A |'), 'a subcaption stands under its part');
  ok(markdown('T', [{ caption: 'Description', prose: '' }]).includes('### Description\n\n–\n'), 'and empty prose is a dash');
  deepEqual([anchor('3 SAF-003 SF-2.1 Position Detection'), anchor('Åsa & Örjan: (test)')], ['3-saf-003-sf-21-position-detection', 'åsa--örjan-test'], 'an anchor is the heading in lower case, without punctuation, its spaces hyphens, as GitHub makes it');
  const doc = markdown('T', [{ heading: 'A', chapter: '1', caption: '1.1 X', prose: 'x' }, { heading: 'B', chapter: '2', caption: '2.1 X', prose: 'y' }], { subtitle: 'P, saved today' });
  ok(doc.startsWith('# T\n\nP, saved today\n\n## Contents\n\n1. [A](#1-a)\n2. [B](#2-b)\n\n## 1 A\n\n### 1.1 X'), 'the line under the title, then the contents, then each numbered chapter');
}

// --- V-TST-074 A document of tables (F-VIE-001) ------------------------------

{
  const text = markdown('Safety function specification', [
    { heading: 'SAF-001 SF-1 Stop', caption: '1 Description', prose: 'Stops the drives.\nAlways.' },
    { caption: '2 Relationships', headers: ['Relationship', 'Entities'], rows: [['Realises', 'PRM-003 PM-3\nPRM-004 PM-4']] },
    { caption: 'Behaviour', headers: ['Field', 'Value'], rows: [['Priority', '']] },
  ]);
  equal(
    text,
    [
      '# Safety function specification',
      '',
      '## SAF-001 SF-1 Stop',
      '',
      '### 1 Description',
      '',
      'Stops the drives.\n\nAlways.',
      '',
      '### 2 Relationships',
      '',
      '| Relationship | Entities |',
      '|---|---|',
      '| Realises | PRM-003 PM-3<br>PRM-004 PM-4 |',
      '',
      '### Behaviour',
      '',
      '| Field | Value |',
      '|---|---|',
      '| Priority | – |',
      '',
    ].join('\n'),
    'the title, then each block under its heading, each part under its numbered caption, prose as paragraphs'
  );
}

// --- V-TST-169 What a renderer would autolink or restructure is escaped (N-SEC-011) ---

{
  equal(markdownCell('see https://tracker.example/p?u=1'), 'see https\\://tracker.example/p?u=1', 'a bare web address is escaped at its colon, so GitHub makes no link of it');
  equal(markdownCell('at www.example.com'), 'at www\\.example.com', 'a www name at its dot');
  equal(markdownCell('mail a@b.example'), 'mail a\\@b.example', 'and an email address at its at sign');
  equal(markdownCell('ok\r# Injected\r- item'), 'ok<br># Injected<br>- item', 'a lone carriage return is a line break like any other, and inside a cell no line can open a heading');
  const doc = markdown('T', [{ heading: 'ELM-001 Title\n# Injected', chapter: '1', prose: 'x\ry' }]);
  ok(doc.includes('## 1 ELM-001 Title # Injected') && !doc.includes('\n# Injected'), 'a line break in a heading becomes a space, so no heading is opened');
  ok(doc.includes('x\n\ny'), 'and a carriage return in prose breaks the line as a line feed does');
  equal(markdown('A\r\nB', []).split('\n')[0], '# A B', 'the title is one line too');
}

summary('test-markdown');
