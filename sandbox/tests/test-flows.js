/**
 * Exercises the flow logic that needs no page: the relationship offer a
 * subject entity gets, generated from the metamodel and narrowed by the
 * model. The dialogs themselves are checked in the browser. Run from this
 * directory.
 */

import { relationshipOptions } from '../app/flows.js';
import { createModel, addEntity, addFolder, relate } from '../app/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';

/** The offer as comparable rows. */
function offered(model, subjectId) {
  return relationshipOptions(model, subjectId).map((option) => ({
    id: option.type.id,
    direction: option.direction,
    candidates: option.candidates.map((entity) => entity.id),
  }));
}

// --- The offer follows the metamodel and the model ----------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  deepEqual(offered(model, 'ELM-001'), [], 'a lone entity has no one to relate to: forms with no candidate are not offered');
  deepEqual(offered(model, 'ELM-9'), [], 'a missing subject is offered nothing');
  addFolder(model, 'Zone');
  deepEqual(offered(model, 'F-1'), [], 'a folder is offered nothing');
}

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'HAZ');

  deepEqual(
    offered(model, 'ELM-001'),
    [{ id: 'elm-exhibits-haz', direction: 'outgoing', candidates: ['HAZ-001'] }],
    'an ELM beside a HAZ is offered exhibits, outgoing'
  );
  deepEqual(
    offered(model, 'HAZ-001'),
    [{ id: 'elm-exhibits-haz', direction: 'incoming', candidates: ['ELM-001'] }],
    'the HAZ sees the same relationship from its own side, and only forms with candidates'
  );

  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001');
  deepEqual(offered(model, 'ELM-001'), [], 'a relationship that exists leaves the form with no candidate');

  addEntity(model, 'HAZ');
  deepEqual(
    offered(model, 'ELM-001'),
    [{ id: 'elm-exhibits-haz', direction: 'outgoing', candidates: ['HAZ-002'] }],
    'a second hazard restores the offer, without the taken candidate'
  );
}

// --- Composition narrows the offer --------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'ELM');

  deepEqual(
    offered(model, 'ELM-001'),
    [
      { id: 'elm-decomposes-into-elm', direction: 'outgoing', candidates: ['ELM-002'] },
      { id: 'elm-decomposes-into-elm', direction: 'incoming', candidates: ['ELM-002'] },
    ],
    'a self-type composition is offered in both directions, never to itself'
  );

  relate(model, 'elm-decomposes-into-elm', 'ELM-001', 'ELM-002');
  deepEqual(
    offered(model, 'ELM-001'),
    [],
    'after owning it, neither direction remains: the duplicate, the single owner rule, and the cycle rule each close a door'
  );
  deepEqual(
    offered(model, 'ELM-002'),
    [],
    'the owned entity is closed the same way from its side'
  );

  addEntity(model, 'ELM');
  const third = offered(model, 'ELM-001');
  deepEqual(
    third,
    [
      { id: 'elm-decomposes-into-elm', direction: 'outgoing', candidates: ['ELM-003'] },
      { id: 'elm-decomposes-into-elm', direction: 'incoming', candidates: ['ELM-003'] },
    ],
    'a third element opens both directions again'
  );
  ok(
    !third.some((option) => option.candidates.includes('ELM-002')),
    'the already-owned element is never a candidate target'
  );
}

summary('test-flows');
