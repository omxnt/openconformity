/**
 * Exercises the editor logic that needs no page: whether a draft differs
 * from the entity it edits. The rendered editor is checked in the
 * browser. Run from this directory.
 */

import { draftChanged, linkable } from '../app/editor.js';
import { ATTRIBUTES, attributesFor } from '../app/attributes.js';
import { ok, equal, deepEqual, summary } from './harness.js';

const definitions = attributesFor('ELM');

equal(draftChanged(definitions, {}, {}), false, 'an empty draft over an empty entity is clean');
equal(draftChanged(definitions, {}, { title: '' }), false, 'an empty field over an unset key is clean: absence stands for the empty value');
equal(draftChanged(definitions, { title: 'Mixer' }, { title: 'Mixer' }), false, 'matching values are clean');
equal(draftChanged(definitions, { title: 'Mixer' }, { title: 'Blender' }), true, 'a changed value is a change');
equal(draftChanged(definitions, {}, { title: 'Mixer' }), true, 'a value typed over an unset key is a change');
equal(draftChanged(definitions, { title: 'Mixer' }, { title: '' }), true, 'an emptied value is a change');
equal(draftChanged(definitions, { title: 'Mixer' }, {}), true, 'a field missing from the draft stands for emptying it');
equal(
  draftChanged(definitions, { title: 'Mixer', legacy: 'kept as written' }, { title: 'Mixer' }),
  false,
  'a key the editor does not present never makes a draft dirty'
);
equal(draftChanged([], { title: 'Mixer' }, {}), false, 'with no definitions there is nothing to change');

// --- A hyperlink is presented as a link only when it is a web address ----

equal(linkable('https://eur-lex.europa.eu/eli/reg/2023/1230/oj'), true, 'an https address is followable');
equal(linkable('http://example.org'), true, 'so is http');
equal(linkable('  https://example.org  '), true, 'surrounding space is not the value');
equal(linkable('javascript:alert(1)'), false, 'a javascript value is never armed by rendering it');
equal(linkable('mailto:info@openconformity.org'), false, 'nor is any other scheme followed');
equal(linkable('eur-lex.europa.eu'), false, 'a bare host is text until it says its scheme');
equal(linkable(''), false, 'and an empty value is nothing');

// --- What a type's form holds ---------------------------------------------

{
  deepEqual(
    attributesFor('ESR'),
    [...ATTRIBUTES.ESR.groups.flatMap((group) => group.attributes)],
    'a type with no ungrouped table flattens to its groups, in order'
  );
  const keys = (code) => attributesFor(code).map((definition) => definition.key);
  const groups = (code) => ATTRIBUTES[code].groups.map((group) => group.name);

  for (const code of ['LEG', 'HST', 'OSP', 'ESR', 'HSR', 'OSR']) {
    ok(ATTRIBUTES[code].attributes.length === 0, `${code} holds nothing ungrouped: every field stands under a heading`);
    deepEqual(groups(code).at(-1), 'Applicability', `${code} closes on the assessment`);
  }
  deepEqual(groups('LEG'), ['Act', 'Applicability'], 'a legislation is the act, then whether it applies');
  deepEqual(groups('HST'), ['Standard', 'Applicability'], 'a harmonised standard the same');
  deepEqual(groups('OSP'), ['Specification', 'Applicability'], 'and an unharmonised specification');
  for (const code of ['ESR', 'HSR', 'OSR']) {
    deepEqual(groups(code), ['Requirement', 'Applicability'], `${code} is the requirement, then the verdict on it`);
  }
  deepEqual(
    ATTRIBUTES.ESR.groups.map((group) => group.attributes.map((definition) => definition.key)),
    [['reference', 'title', 'requirement'], ['applicable', 'rationale']],
    'each group holds its own, in document order'
  );
  for (const code of ['HST', 'OSP']) {
    deepEqual(
      keys(code),
      ['reference', 'title', 'edition', 'date', 'link', 'applicable', 'rationale'],
      `${code} reads as a published document: what it is, which version, where it lives, and whether it is applied`
    );
  }
  for (const code of ['ESR', 'HSR', 'OSR']) {
    deepEqual(
      keys(code),
      ['reference', 'title', 'requirement', 'applicable', 'rationale'],
      `${code} reads as a requirement: its citation, its text, and the verdict with its reasoning`
    );
  }
  for (const code of ['LEG', 'HST', 'OSP', 'ESR', 'HSR', 'OSR']) {
    const applicable = attributesFor(code).find((definition) => definition.key === 'applicable');
    deepEqual(applicable.values, ['Yes', 'No'], `${code} offers the same two verdicts`);
    ok(keys(code).includes('rationale'), `and ${code} carries the reasoning beside it`);
  }
}

summary('test-editor');
