/**
 * Exercises the Markdown writer: a cell as a pipe table holds it, the
 * markup escaped, and a document of headed tables. Run from this
 * directory.
 */

import { markdownText, markdownCell, markdown } from '../app/modules/markdown.js';
import { equal, summary } from './harness.js';

// --- A cell and its text (F-VIE-001) -----------------------------------------

{
  equal(markdownCell('plain'), 'plain', 'text is itself');
  equal(markdownCell(''), '–', 'an empty cell holds a dash');
  equal(markdownCell('one\ntwo'), 'one<br>two', 'a line break is a break tag, so the cell keeps to its row');
  equal(markdownCell('a | b'), 'a \\| b', 'a pipe is escaped, so the cell keeps to its column');
  equal(markdownCell('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;', 'markup typed into a field is escaped and reads as text');
  equal(markdownText('Tom & Jerry'), 'Tom &amp; Jerry', 'as is an ampersand');
}

// --- A document of tables (F-VIE-001) -----------------------------------------

{
  const text = markdown('Safety function specification', [
    { heading: 'SAF-001 SF-1 Stop', text: 'Stops the drives.\nAlways.', caption: 'Relationships', headers: ['Relationship', 'Entities'], rows: [['Realises', 'PRM-003 PM-3\nPRM-004 PM-4']] },
    { caption: 'Behaviour', headers: ['Field', 'Value'], rows: [['Priority', '']] },
  ]);
  equal(
    text,
    [
      '# Safety function specification',
      '',
      '## SAF-001 SF-1 Stop',
      '',
      'Stops the drives.\n\nAlways.',
      '',
      '### Relationships',
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
    'the title, then each block under its heading and text, each table under its caption'
  );
}

summary('test-markdown');
