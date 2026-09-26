/**
 * The words for counts and lists: a count with its noun in the right
 * number, and names joined as prose lists them. Run from this directory.
 */

import { plural, listed } from '../app/modules/text.js';
import { equal, summary } from './harness.js';

// --- Counts and lists (no requirement) --------------------------------------

equal(plural(1, 'entity'), '1 entity', 'one takes the singular');
equal(plural(2, 'entity'), '2 entities', 'a noun ending in y takes ies');
equal(plural(0, 'relationship'), '0 relationships', 'none takes the plural');
equal(plural(3, 'row'), '3 rows', 'and so does more than one');
equal(listed([]), '', 'nothing lists as nothing');
equal(listed(['A']), 'A', 'one name stands alone');
equal(listed(['A', 'B']), 'A and B', 'two are joined by and');
equal(listed(['A', 'B', 'C']), 'A, B and C', 'more are parted by commas before the and');

summary('test-text');
