/**
 * Exercises the model-query layer: the relationship offer a subject
 * entity gets, the new-related offer, the move targets and predicates,
 * the designation, and the cascade question — pure derivations, no
 * store, no page. Run from this directory.
 */

import {
  relationshipOptions,
  formLabel,
  relatedTypeOffer,
  moveTargets,
  cascadeQuestion,
  designated,
  canMoveUp,
  canMoveDown,
} from '../app/queries.js';
import { ENTITY_TYPES, relationshipsFrom, relationshipsTo } from '../app/metamodel.js';
import { createModel, addEntity, addFolder, updateEntity, relate, unrelate, nodeOf } from '../app/model.js';
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

// --- The full surface --------------------------------------------------

{
  const model = createModel();
  for (const code of Object.keys(ENTITY_TYPES)) {
    addEntity(model, code);
    addEntity(model, code);
  }
  for (const code of Object.keys(ENTITY_TYPES)) {
    deepEqual(
      relationshipOptions(model, `${code}-001`).map((option) => `${option.type.id}:${option.direction}`),
      [
        ...relationshipsFrom(code).map((type) => `${type.id}:outgoing`),
        ...relationshipsTo(code).map((type) => `${type.id}:incoming`),
      ],
      `with candidates of every type in the model, ${code} is offered its full relationship surface`
    );
  }
}

// --- The form label and the designation ----------------------------------

{
  equal(
    formLabel({ typeId: 'elm-exhibits-haz', direction: 'outgoing' }),
    'exhibits — Single Hazard',
    'an outgoing form reads label first, far type after'
  );
  equal(
    formLabel({ typeId: 'elm-exhibits-haz', direction: 'incoming' }),
    'System Element — exhibits',
    'an incoming form reads the far type first'
  );

  const model = createModel();
  addEntity(model, 'ELM');
  equal(designated(nodeOf(model, 'ELM-001')), 'ELM-001', 'an entity with no title reads as its identifier');
  updateEntity(model, 'ELM-001', { title: 'Mixer' });
  equal(designated(nodeOf(model, 'ELM-001')), 'ELM-001  Mixer', 'a title rides behind the identifier');
  updateEntity(model, 'ELM-001', { title: '   ' });
  equal(designated(nodeOf(model, 'ELM-001')), 'ELM-001', 'a blank title is no title');
}

// --- The new-related offer ---------------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addFolder(model, 'Zone');

  const offer = relatedTypeOffer(model, 'ELM-001');
  deepEqual(
    offer.flatMap((offered) => offered.forms.map((form) => `${form.typeId}:${form.direction}`)).sort(),
    [
      ...relationshipsFrom('ELM').map((type) => `${type.id}:outgoing`),
      ...relationshipsTo('ELM').map((type) => `${type.id}:incoming`),
    ].sort(),
    'the offer is the full metamodel surface for a new entity'
  );
  deepEqual(
    offer.map((offered) => offered.code),
    Object.keys(ENTITY_TYPES).filter((code) => offer.some((offered) => offered.code === code)),
    'the types come in metamodel order, so a menu groups by pillar'
  );
  equal(offer.find((offered) => offered.code === 'ELM').forms.length, 2, 'a type admitting more than one relationship carries them all');
  equal(offer.find((offered) => offered.code === 'HAZ').forms.length, 1, 'one that admits one carries it alone');

  deepEqual(relatedTypeOffer(model, 'F-1'), [], 'a folder is offered nothing');
  deepEqual(relatedTypeOffer(model, 'ELM-9'), [], 'nor is a missing subject');

  addEntity(model, 'ELM');
  relate(model, 'elm-decomposes-into-elm', 'ELM-002', 'ELM-001');
  const owned = relatedTypeOffer(model, 'ELM-001');
  deepEqual(
    owned.find((offered) => offered.code === 'ELM').forms,
    [{ typeId: 'elm-decomposes-into-elm', direction: 'outgoing' }],
    'a new entity that would be a second owner of the subject is not offered'
  );
}

// --- The move predicates -----------------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addFolder(model, 'Zone');
  addEntity(model, 'HAZ');
  addEntity(model, 'SCN', { parent: 'F-1' });

  equal(canMoveUp(model, 'ELM-001'), false, 'the first sibling cannot move up');
  equal(canMoveDown(model, 'ELM-001'), true, 'but can move down');
  equal(canMoveUp(model, 'F-1'), true, 'a middle sibling moves both ways, kinds interleaved');
  equal(canMoveDown(model, 'F-1'), true, 'in one order');
  equal(canMoveUp(model, 'HAZ-001'), true, 'the last sibling can move up');
  equal(canMoveDown(model, 'HAZ-001'), false, 'but not down');
  equal(canMoveUp(model, 'SCN-001'), false, 'an only child moves neither way');
  equal(canMoveDown(model, 'SCN-001'), false, 'in its own parent');
  equal(canMoveUp(model, 'ELM-9'), false, 'a missing node moves nowhere');
  equal(canMoveUp(model, null), false, 'nor does no selection');
}

// --- Every legal destination -------------------------------------------

{
  const model = createModel();
  addFolder(model, 'Zone');
  addEntity(model, 'ELM', { parent: 'F-1' });
  updateEntity(model, 'ELM-001', { title: 'Assembly' });
  addEntity(model, 'ELM', { parent: 'ELM-001' });
  addEntity(model, 'HAZ');

  deepEqual(
    moveTargets(model, 'ELM-002').map((target) => [target.parentId, target.depth]),
    [[null, 0], ['F-1', 1], ['HAZ-001', 1]],
    'the offer is the root and every holder the model allows, in tree order'
  );
  ok(
    !moveTargets(model, 'ELM-002').some((target) => target.parentId === 'ELM-001'),
    'never the place it already stands'
  );
  deepEqual(
    moveTargets(model, 'F-1').map((target) => target.parentId),
    ['HAZ-001'],
    'never itself, nothing inside itself, and not the root it already stands at'
  );
  deepEqual(moveTargets(model, 'ELM-9'), [], 'a missing node goes nowhere');
  equal(moveTargets(model, 'ELM-002')[0].label, 'Untitled', 'the unnamed root offers itself as Untitled');
  deepEqual(
    moveTargets(model, 'HAZ-001').map((target) => target.label),
    ['Zone', 'ELM-001  Assembly', 'ELM-002'],
    'holders read as the tree reads them, and a root dweller is not offered the root'
  );
}

// --- The cascade question counts what it takes -------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'ELM');
  addEntity(model, 'ACT');
  relate(model, 'elm-decomposes-into-elm', 'ELM-001', 'ELM-002');
  relate(model, 'act-interacts-with-elm', 'ACT-001', 'ELM-002');

  const question = cascadeQuestion(model, 'ELM-001');
  equal(question.title, 'Delete 2 entities?', 'the title counts the entities the cascade takes');
  equal(
    question.message,
    'Deleting ELM-001 also deletes everything it contains through composition and severs 2 relationships:',
    'the message counts every relationship touching the cascade — the composition included'
  );
  deepEqual(question.doomed.map((entity) => entity.id), ['ELM-001', 'ELM-002'], 'over the entities it lists');

  unrelate(model, 'act-interacts-with-elm', 'ACT-001', 'ELM-002');
  equal(
    cascadeQuestion(model, 'ELM-001').message,
    'Deleting ELM-001 also deletes everything it contains through composition and severs 1 relationship:',
    'one severed relationship reads in the singular'
  );
}

summary('test-queries');
