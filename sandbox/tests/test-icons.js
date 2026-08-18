/**
 * Exercises the icon mapping: one glyph per entity type, every glyph a
 * distinct silhouette, the folder and the project unlike any type, and
 * distinct from each other. The sprite and provenance pins live in
 * test-pins. Run from this directory.
 */

import { TYPE_ICONS, FOLDER_ICON, PROJECT_ICON } from '../app/icons.js';
import { ENTITY_TYPES } from '../app/metamodel.js';
import { ok, equal, deepEqual, summary } from './harness.js';

deepEqual(Object.keys(TYPE_ICONS), Object.keys(ENTITY_TYPES), 'one icon per entity type, in metamodel order');

const glyphs = [...Object.values(TYPE_ICONS), FOLDER_ICON, PROJECT_ICON];
equal(new Set(glyphs).size, glyphs.length, 'every glyph is distinct: shape carries the type, never colour alone');
ok(!Object.values(TYPE_ICONS).includes(FOLDER_ICON), 'the folder is unlike any type');
ok(!Object.values(TYPE_ICONS).includes(PROJECT_ICON), 'and so is the project');

summary('test-icons');
