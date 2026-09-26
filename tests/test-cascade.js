/**
 * Exercises composition: the single-owner rule, ownership acyclicity, the
 * deletion preview, and cascade deletion against filing and relationships.
 * Run from this directory.
 */

import {
  createModel,
  nodeOf,
  addEntity,
  addFolder,
  canRelate,
  relate,
  unrelate,
  file,
  deletionOf,
  removeEntity,
  removeFolder,
} from '../app/modules/model.js';
import { ok, equal, deepEqual, refused, allowed, summary } from './harness.js';

// --- Single owner ------------------------------------------------------

{
  const model = createModel();
  addEntity(model, 'LEG');
  addEntity(model, 'LEG');
  addEntity(model, 'ESR');

  allowed(relate(model, 'leg-contains-esr', 'LEG-001', 'ESR-001'), 'a legislation can contain a requirement');
  refused(canRelate(model, 'leg-contains-esr', 'LEG-002', 'ESR-001'), 'an entity is owned by at most one entity');
  equal(relate(model, 'leg-contains-esr', 'LEG-002', 'ESR-001').ok, false, 'relate agrees with canRelate');

  allowed(unrelate(model, 'leg-contains-esr', 'LEG-001', 'ESR-001'), 'the composition can be removed');
  allowed(canRelate(model, 'leg-contains-esr', 'LEG-002', 'ESR-001'), 'after which another owner may take it');

  addEntity(model, 'HAZ');
  allowed(relate(model, 'esr-triggered-by-haz', 'ESR-001', 'HAZ-001'), 'a dependency is not a composition');
  addEntity(model, 'ESR');
  allowed(canRelate(model, 'esr-triggered-by-haz', 'ESR-002', 'HAZ-001'), 'so a second one may reach the same entity');
}

// --- Ownership acyclicity ----------------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'ELM');
  addEntity(model, 'ELM');

  refused(canRelate(model, 'elm-decomposes-into-elm', 'ELM-001', 'ELM-001'), 'no entity owns itself directly');
  allowed(relate(model, 'elm-decomposes-into-elm', 'ELM-001', 'ELM-002'), 'an element decomposes into another');
  refused(canRelate(model, 'elm-decomposes-into-elm', 'ELM-002', 'ELM-001'), 'nor through what owns it');
  allowed(relate(model, 'elm-decomposes-into-elm', 'ELM-002', 'ELM-003'), 'the chain deepens');
  refused(canRelate(model, 'elm-decomposes-into-elm', 'ELM-003', 'ELM-001'), 'nor through any longer chain');
  equal(relate(model, 'elm-decomposes-into-elm', 'ELM-003', 'ELM-001').ok, false, 'relate agrees with canRelate');

  refused(canRelate(model, 'elm-decomposes-into-elm', 'ELM-003', 'ELM-002'), 'the single owner rule holds along the chain');
}

// --- The deletion preview ----------------------------------------------

{
  const model = createModel();
  addEntity(model, 'LEG');
  addEntity(model, 'ESR');
  addEntity(model, 'ESR');
  addEntity(model, 'HAZ');
  relate(model, 'leg-contains-esr', 'LEG-001', 'ESR-001');
  relate(model, 'leg-contains-esr', 'LEG-001', 'ESR-002');
  relate(model, 'esr-triggered-by-haz', 'ESR-001', 'HAZ-001');

  deepEqual(
    deletionOf(model, 'LEG-001').map((entity) => entity.id),
    ['LEG-001', 'ESR-001', 'ESR-002'],
    'the preview states the entity and everything it owns'
  );
  deepEqual(
    deletionOf(model, 'ESR-001').map((entity) => entity.id),
    ['ESR-001'],
    'an entity that owns nothing previews alone'
  );
  deepEqual(
    deletionOf(model, 'HAZ-001').map((entity) => entity.id),
    ['HAZ-001'],
    'a dependency does not cascade'
  );
  deepEqual(deletionOf(model, 'LEG-9'), [], 'a missing entity previews empty');
  addFolder(model, 'Zone');
  deepEqual(deletionOf(model, 'F-1'), [], 'a folder previews empty');
}

// --- Nested cascade ----------------------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'ELM');
  addEntity(model, 'ELM');
  addEntity(model, 'HAZ');
  relate(model, 'elm-decomposes-into-elm', 'ELM-001', 'ELM-002');
  relate(model, 'elm-decomposes-into-elm', 'ELM-002', 'ELM-003');
  relate(model, 'elm-exhibits-haz', 'ELM-003', 'HAZ-001');

  const preview = deletionOf(model, 'ELM-001').map((entity) => entity.id);
  deepEqual(preview, ['ELM-001', 'ELM-002', 'ELM-003'], 'ownership cascades transitively');

  const removal = removeEntity(model, 'ELM-001');
  allowed(removal, 'the deletion runs');
  deepEqual(removal.removed.map((entity) => entity.id), preview, 'and removes exactly what the preview stated');
  equal(nodeOf(model, 'ELM-003'), null, 'the owned entities are gone');
  ok(nodeOf(model, 'HAZ-001') !== null, 'entities related without composition stay');
  equal(model.relationships.size, 0, 'every relationship touching a removed entity went with it');
}

// --- Deletion against filing -------------------------------------------

{
  const model = createModel();
  const zone = addFolder(model, 'Zone').folder;
  addEntity(model, 'LEG', { parent: zone.id });
  addEntity(model, 'ESR', { parent: 'LEG-001' });
  addEntity(model, 'HAZ', { parent: 'LEG-001' });
  addEntity(model, 'ESR');
  relate(model, 'leg-contains-esr', 'LEG-001', 'ESR-001');
  file(model, 'ESR-002', 'ESR-001');
  const inner = addFolder(model, 'Inner', { parent: 'ESR-001' }).folder;

  allowed(removeEntity(model, 'LEG-001'), 'the legislation is deleted');
  equal(nodeOf(model, 'ESR-001'), null, 'the owned requirement went with it, wherever it was filed');
  ok(nodeOf(model, 'HAZ-001') !== null, 'an entity merely filed inside is not owned');
  equal(nodeOf(model, 'HAZ-001').parent, zone.id, 'it moves up to where the deleted entity sat');
  equal(nodeOf(model, 'ESR-002').parent, zone.id, 'contents of an owned entity move to the nearest surviving ancestor');
  equal(nodeOf(model, inner.id).parent, zone.id, 'folders among them');
  ok(nodeOf(model, zone.id) !== null, 'the folder it was filed in survives');

  refused(removeEntity(model, 'LEG-001'), 'deleting a missing entity is refused');
  refused(removeEntity(model, zone.id), 'deleting a folder as an entity is refused');
}

// --- A folder takes what is filed in it ----------------------------------

{
  const model = createModel();
  const zone = addFolder(model, 'Zone').folder;
  addEntity(model, 'LEG', { parent: zone.id });
  addEntity(model, 'HAZ', { parent: zone.id });
  addEntity(model, 'ESR', { parent: 'LEG-001' });
  addEntity(model, 'ESR');
  addEntity(model, 'HAZ', { parent: 'ESR-002' });
  addEntity(model, 'ELM');
  relate(model, 'leg-contains-esr', 'LEG-001', 'ESR-001');
  relate(model, 'leg-contains-esr', 'LEG-001', 'ESR-002');
  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001');

  const outcome = removeFolder(model, zone.id);
  allowed(outcome, 'the folder is deleted');
  deepEqual(outcome.removed.map((entity) => entity.id), ['LEG-001', 'ESR-001', 'HAZ-001', 'ESR-002'], 'with every entity filed in it in filing order, however deep, and then what those own elsewhere');
  equal(nodeOf(model, zone.id), null, 'the folder is gone');
  ok(['LEG-001', 'HAZ-001', 'ESR-001', 'ESR-002'].every((id) => nodeOf(model, id) === null), 'and so are they');
  ok(nodeOf(model, 'ELM-001') !== null, 'an entity related without composition stays');
  equal(nodeOf(model, 'HAZ-002').parent, null, 'what was filed beneath an owned entity elsewhere moves up to the nearest survivor');
  equal(model.relationships.size, 0, 'and every relationship touching what went is severed');
}

summary('test-cascade');
