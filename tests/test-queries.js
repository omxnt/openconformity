/**
 * Exercises the model-query layer: the relationship offer a subject
 * entity gets, the new-related offer, the move targets and predicates,
 * the designation, and the cascade question — pure derivations, no
 * store, no page. Run from this directory.
 */

import {
  entityLabel,
  relationshipOptions,
  formLabel,
  relatedTypeOffer,
  moveTargets,
  deletionQuestion,
  designated,
  canMoveUp,
  canMoveDown,
  relatedIds,
  entityMatches,
} from '../app/modules/queries.js';
import { EXAMPLE_PROJECT } from '../app/modules/example.js';
import { loadProject } from '../app/modules/files.js';
import { ENTITY_TYPES, relationshipsFrom, relationshipsTo } from '../app/modules/metamodel.js';
import { createModel, addEntity, addFolder, updateEntity, relate, unrelate, nodeOf } from '../app/modules/model.js';
import { excluded, EXCLUSIONS } from '../app/modules/queries.js';
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

  const question = deletionQuestion(model, 'ELM-001');
  equal(question.title, 'Delete 2 entities?', 'the title counts the entities the cascade takes');
  equal(
    question.message,
    'Deleting ELM-001 also deletes everything it contains through composition and severs 2 relationships:',
    'the message counts every relationship touching the cascade — the composition included'
  );
  deepEqual(question.doomed.map((entity) => entity.id), ['ELM-001', 'ELM-002'], 'over the entities it lists');

  unrelate(model, 'act-interacts-with-elm', 'ACT-001', 'ELM-002');
  equal(
    deletionQuestion(model, 'ELM-001').message,
    'Deleting ELM-001 also deletes everything it contains through composition and severs 1 relationship:',
    'one severed relationship reads in the singular'
  );
}

{
  const model = createModel();
  addEntity(model, 'ELM');
  addEntity(model, 'HAZ');
  const alone = deletionQuestion(model, 'HAZ-001');
  equal(alone.title, 'Delete HAZ-001?', 'an entity owning nothing is asked about by its identifier');
  equal(alone.message, 'HAZ-001 takes part in no relationship.', 'and says when nothing is severed');
  equal(alone.doomed.length, 1, 'it alone goes');
  relate(model, 'elm-exhibits-haz', 'ELM-001', 'HAZ-001');
  {
    const filed = createModel();
    const zone = addFolder(filed, 'Zone').folder;
    const empty = deletionQuestion(filed, zone.id);
    deepEqual([empty.title, empty.message, empty.doomed], ['Delete the folder Zone?', 'Zone holds no entity.', []], 'an empty folder is asked about by its name');
    addEntity(filed, 'LEG', { parent: zone.id });
    addEntity(filed, 'ESR', { parent: 'LEG-001' });
    addEntity(filed, 'ESR');
    relate(filed, 'leg-contains-esr', 'LEG-001', 'ESR-002');
    const question = deletionQuestion(filed, zone.id);
    equal(question.title, 'Delete the folder Zone?', 'a folder with content too');
    equal(question.message, 'Deleting Zone also deletes the 2 entities filed in it and 1 entity they own elsewhere, and severs 1 relationship:', 'the message counts what is filed in it, what those own elsewhere and what is severed');
    deepEqual(question.doomed.map((entity) => entity.id), ['LEG-001', 'ESR-001', 'ESR-002'], 'over the entities it lists');
  }
  equal(deletionQuestion(model, 'HAZ-001').message, 'Deleting HAZ-001 severs 1 relationship.', 'or counts what is severed, in the singular');
}

// --- The label a reference-bearing type composes --------------------------

{
  const model = createModel();
  addEntity(model, 'LEG');
  equal(entityLabel(nodeOf(model, 'LEG-001')), '', 'an empty entity has no label');

  updateEntity(model, 'LEG-001', { title: 'Machinery Regulation' });
  equal(entityLabel(nodeOf(model, 'LEG-001')), 'Machinery Regulation', 'a title alone stands');

  updateEntity(model, 'LEG-001', { reference: '(EU) 2023/1230' });
  equal(
    entityLabel(nodeOf(model, 'LEG-001')),
    '(EU) 2023/1230 Machinery Regulation',
    'reference then title, one space between: the citation format is the delimiter, nothing is bracketed'
  );
  equal(
    designated(nodeOf(model, 'LEG-001')),
    'LEG-001  (EU) 2023/1230 Machinery Regulation',
    'and the designation carries the composed label'
  );

  updateEntity(model, 'LEG-001', { title: '' });
  equal(entityLabel(nodeOf(model, 'LEG-001')), '(EU) 2023/1230', 'a reference alone stands too');

  addEntity(model, 'ELM');
  updateEntity(model, 'ELM-001', { title: 'Machine' });
  equal(entityLabel(nodeOf(model, 'ELM-001')), 'Machine', 'a type with no reference is its title alone');
}

{
  const model = loadProject(EXAMPLE_PROJECT).model;
  deepEqual(relatedIds(model, 'SCN-001', 'prm-reduces-risk-of-scn'), ['PRM-002'], 'the measures reducing a scenario, from its end of the relationship');
  deepEqual(relatedIds(model, 'PRM-004', 'prm-reduces-risk-of-scn'), ['SCN-002', 'SCN-003'], 'and the scenarios a measure reduces, from its end, in order');
  deepEqual(relatedIds(model, 'SCN-001', 'haz-contributes-to-scn'), ['HAZ-001'], 'any type the entity takes part in');
  deepEqual(relatedIds(model, 'SCN-001', 'saf-realises-prm'), [], 'nothing where it does not');
}

{
  const node = { id: 'SAF-001', type: 'SAF', attributes: { reference: 'SF1', title: 'Emergency Stop' } };
  equal(entityLabel(node), 'SF1 Emergency Stop', "a safety function's designation composes its label, as any reference does");
}

// --- A filter's one rule ---------------------------------------------------

{
  const entity = { id: 'HAZ-001', kind: 'entity', type: 'HAZ', attributes: { title: 'Moving Parts' } };
  ok(entityMatches(entity, 'haz-001') && entityMatches(entity, 'moving') && entityMatches(entity, ' PARTS '), 'an entity answers a filter by its identifier or its label, case and edges aside');
  ok(entityMatches(entity, '') && entityMatches(entity, '   ') && entityMatches(entity, undefined), 'and an empty filter matches everything');
  ok(!entityMatches(entity, 'guard'), 'but not text it holds nowhere');
}

// --- Excluded entities ------------------------------------------------------

{
  const model = createModel();
  const haz = addEntity(model, 'HAZ', { attributes: { title: 'Moving parts' } }).entity;
  const leg = addEntity(model, 'LEG', { attributes: { title: 'An act' } }).entity;
  const folder = addFolder(model, 'Things').folder;
  deepEqual(EXCLUSIONS, { applicable: 'No', eliminated: 'Yes' }, 'two decisions set an entity out of play');
  ok(!excluded(haz) && !excluded(leg), 'an entity with neither decision is in play');
  ok(!excluded(folder) && !excluded(null), 'a folder and nothing are never excluded');
  haz.attributes.eliminated = 'No';
  ok(!excluded(haz), 'a hazard kept knowingly is in play');
  haz.attributes.eliminated = 'Yes';
  ok(excluded(haz), 'a hazard designed out is excluded');
  leg.attributes.applicable = 'Yes';
  ok(!excluded(leg), 'an applicable act is in play');
  leg.attributes.applicable = 'No';
  ok(excluded(leg), 'and one found not applicable is excluded');
}

summary('test-queries');
