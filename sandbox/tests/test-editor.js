/**
 * Exercises the editor logic that needs no page: whether a draft differs
 * from the entity it edits. The rendered editor is checked in the
 * browser. Run from this directory.
 */

import { draftChanged } from '../app/editor.js';
import { attributesFor } from '../app/attributes.js';
import { equal, summary } from './harness.js';

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

summary('test-editor');
