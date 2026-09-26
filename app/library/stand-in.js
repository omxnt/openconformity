/**
 * A stand-in library while the first real one is written: the example
 * project's legislation and essential requirements, in the shape every
 * library has, a project file used as a source. It carries no content of
 * its own, so nothing here is asserted about any act; the example's
 * caveats apply. Replaced, not extended, when the maintained library
 * lands.
 */

import { EXAMPLE_PROJECT } from '../modules/example.js';

const KEPT = new Set(['LEG', 'ESR']);
const entities = EXAMPLE_PROJECT.entities.filter((entity) => KEPT.has(entity.type)).map((entity) => ({ ...entity, parent: entity.type === 'LEG' ? null : entity.parent }));
const ids = new Set(entities.map((entity) => entity.id));

/** @type {Object} a project file holding the example's legislation at its root, each act's requirements beneath it and owned by it */
export const STAND_IN_LIBRARY = {
  ...EXAMPLE_PROJECT,
  name: 'Stand-in legislation',
  folders: [],
  entities,
  relationships: EXAMPLE_PROJECT.relationships.filter((relationship) => ids.has(relationship.source) && ids.has(relationship.target)),
};
