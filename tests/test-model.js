/**
 * Exercises the model's mutations: creation and its counters, attribute
 * updates, the can/do pairs for filing and relating, sibling order across
 * both kinds, and folder deletion. Run from this directory.
 */

import {
  createModel,
  nodeOf,
  childrenOf,
  addEntity,
  addFolder,
  updateEntity,
  renameFolder,
  canFile,
  file,
  canPlaceBeside,
  placeBeside,
  canRelate,
  relate,
  unrelate,
  relationshipsOf,
  removeFolder,
  removeEntity,
  setProjectAttribute,
  removeAttributes,
} from '../app/modules/model.js';
import { FILING_DEPTH } from '../app/modules/validator.js';
import { createStore } from '../app/modules/store.js';
import { fakeStorage } from './helpers.js';
import { ok, equal, deepEqual, refused, allowed, summary } from './harness.js';

/** The identifiers of a parent's children, in sibling order. */
function childIds(model, parentId) {
  return childrenOf(model, parentId).map((node) => node.id);
}

// --- V-TST-079 Creation (F-MOD-001) ------------------------------------------

{
  const model = createModel();
  equal(model.name, '', 'a project exists before it is named');
  refused(addEntity(model, 'XXX'), 'an entity type the metamodel does not define is refused');
  refused(addEntity(model, 'constructor'), 'an inherited object key is not an entity type');

  const first = addEntity(model, 'ELM');
  allowed(first, 'a System Element can be created');
  equal(first.entity.id, 'ELM-001', 'the first identifier is issued from the counter');
  equal(first.entity.kind, 'entity', 'an entity node carries its kind');
  equal(first.entity.type, 'ELM', 'an entity carries its type code');
  equal(first.entity.parent, null, 'an entity is created at the top of the tree by default');
  deepEqual(Object.keys(first.entity.attributes), [], 'creation seeds no attribute keys');
  equal(model.counters.ELM, 2, 'the counter moves to the next number');

  equal(addEntity(model, 'ELM').entity.id, 'ELM-002', 'the second identifier follows');
  equal(addEntity(model, 'HAZ').entity.id, 'HAZ-001', 'each type counts on its own');

  refused(addEntity(model, 'ELM', { parent: 'F-9' }), 'a parent that is not in the model is refused');
  const filed = addEntity(model, 'ELM', { parent: 'ELM-001' });
  equal(filed.entity.parent, 'ELM-001', 'an entity can be created inside another node');
}

// --- V-TST-080 Creation from a file (F-PER-010) ------------------------------

{
  const model = createModel();
  const loaded = addEntity(model, 'ELM', { id: 'ELM-007', attributes: { title: 'Mixer', legacy: 'kept' } });
  allowed(loaded, 'the loader can supply an identifier');
  equal(model.counters.ELM, 1, 'a supplied identifier does not move the counter');
  deepEqual(loaded.entity.attributes, { title: 'Mixer', legacy: 'kept' }, 'attributes are carried verbatim, unpresented keys included');
  refused(addEntity(model, 'ELM', { id: 'ELM-007' }), 'a duplicate identifier is refused');
  refused(addEntity(model, 'ELM', { id: 'HAZ-004' }), 'an identifier of another type code is refused');

  const folder = addFolder(model, 'Loaded', { id: 'F-3' });
  allowed(folder, 'the loader can supply a folder identifier');
  equal(model.counters.F, 1, 'a supplied folder identifier does not move the counter');
  refused(addFolder(model, 'Again', { id: 'F-3' }), 'a duplicate folder identifier is refused');
  refused(addFolder(model, 'Wrong', { id: 'ELM-001' }), 'a folder identifier of another code is refused');
}

// --- V-TST-081 Folders (F-WSP-006) -------------------------------------------

{
  const model = createModel();
  refused(addFolder(model, ''), 'a folder needs a name');
  const folder = addFolder(model, 'Zone A');
  allowed(folder, 'a folder can be created');
  equal(folder.folder.id, 'F-1', 'the folder identifier is issued from the F counter');
  equal(folder.folder.kind, 'folder', 'a folder node carries its kind');
  equal(model.counters.F, 2, 'the folder counter moves to the next number');
  equal(addFolder(model, 'Zone B').folder.id, 'F-2', 'the second folder follows');

  allowed(renameFolder(model, 'F-1', 'Zone C'), 'a folder can be renamed');
  equal(nodeOf(model, 'F-1').name, 'Zone C', 'the rename lands');
  refused(renameFolder(model, 'F-1', ''), 'a rename to nothing is refused');
  refused(renameFolder(model, 'F-9', 'X'), 'renaming a missing folder is refused');
  const entity = addEntity(model, 'ELM').entity;
  refused(renameFolder(model, entity.id, 'X'), 'renaming an entity as a folder is refused');
}

// --- V-TST-082 Updates (F-MOD-004) -------------------------------------------

{
  const model = createModel();
  addEntity(model, 'ELM');
  refused(updateEntity(model, 'ELM-9', {}), 'updating a missing entity is refused');
  addFolder(model, 'Zone');
  refused(updateEntity(model, 'F-1', {}), 'updating a folder as an entity is refused');

  allowed(updateEntity(model, 'ELM-001', { title: 'Mixer', description: 'Mixes.' }), 'values can be written');
  deepEqual(nodeOf(model, 'ELM-001').attributes, { title: 'Mixer', description: 'Mixes.' }, 'the values land');
  allowed(updateEntity(model, 'ELM-001', { description: '' }), 'an emptied value can be written');
  deepEqual(nodeOf(model, 'ELM-001').attributes, { title: 'Mixer' }, 'an emptied value removes its key');
  allowed(updateEntity(model, 'ELM-001', { title: '' }), 'the last value can be emptied');
  deepEqual(Object.keys(nodeOf(model, 'ELM-001').attributes), [], 'the entity carries only what is set');
}

// --- V-TST-083 Removing keys (N-SEC-005) -------------------------------------

{
  const model = createModel();
  addEntity(model, 'SCN', { attributes: { title: 'Fall', initialS: 'S2', residualRating: 'Low' } });
  deepEqual(removeAttributes(model, 'SCN-001', ['initialS', 'residualRating', 'never']), { ok: true }, 'named keys are removed, an absent one passing');
  deepEqual(nodeOf(model, 'SCN-001').attributes, { title: 'Fall' }, 'and the rest stands');
  deepEqual(removeAttributes(model, 'SCN-009', ['title']), { ok: false, reason: 'The entity is not in the project.' }, 'an entity not in the project is refused');
}

// --- V-TST-084 Filing (F-WSP-004, F-WSP-005) ---------------------------------

{
  const model = createModel();
  const a = addEntity(model, 'ELM').entity;
  const b = addEntity(model, 'ELM').entity;
  const zone = addFolder(model, 'Zone').folder;
  const inner = addFolder(model, 'Inner', { parent: zone.id }).folder;

  refused(canFile(model, 'ELM-9', null), 'filing a missing node is refused');
  refused(canFile(model, a.id, 'ELM-9'), 'filing into a missing destination is refused');
  refused(canFile(model, a.id, a.id), 'nothing can be filed inside itself');
  refused(canFile(model, zone.id, inner.id), 'nothing can be filed inside its own contents');
  refused(canFile(model, a.id, null), 'filing where it already stands is refused');

  allowed(canFile(model, a.id, zone.id), 'an entity can be filed in a folder');
  allowed(canFile(model, zone.id, b.id), 'a folder can be filed in an entity');
  allowed(canFile(model, a.id, b.id), 'an entity can be filed in an entity, regardless of type and relationships');

  const cases = [
    [a.id, zone.id],
    [a.id, a.id],
    [zone.id, inner.id],
    ['ELM-9', null],
    [b.id, inner.id],
  ];
  for (const [nodeId, parentId] of cases) {
    const can = canFile(model, nodeId, parentId);
    const did = file(model, nodeId, parentId);
    equal(did.ok, can.ok, `file agrees with canFile for ${nodeId} into ${parentId}`);
    if (!can.ok) equal(did.reason, can.reason, `and refuses for the same reason`);
  }
  equal(nodeOf(model, a.id).parent, zone.id, 'the allowed moves landed');
  equal(nodeOf(model, b.id).parent, inner.id, 'to any depth');

  const back = file(model, b.id, null);
  allowed(back, 'a nested node can be filed back at the top');
  equal(nodeOf(model, b.id).parent, null, 'and stands at the top');
  deepEqual(childIds(model, null), [zone.id, b.id], 'a filed node lands last among its new siblings');
}

// --- V-TST-085 Filing stays within the depth a file may hold (F-WSP-004, F-PER-006) ---

{
  const model = createModel();
  const levels = [null];
  for (let level = 1; level <= FILING_DEPTH; level += 1) levels.push(addFolder(model, `Level ${level}`, { parent: levels[level - 1] }).folder.id);
  const deepest = levels[FILING_DEPTH];
  const tooDeep = `Filing goes no deeper than 1,000 levels.`;
  equal(addFolder(model, 'Below', { parent: deepest }).reason, tooDeep, 'a folder under the deepest level is refused, saying why');
  equal(addEntity(model, 'ELM', { parent: deepest }).reason, tooDeep, 'and so is an entity');
  allowed(addEntity(model, 'ELM', { parent: levels[FILING_DEPTH - 1] }), 'an entity at the deepest level is filed');
  const branch = addFolder(model, 'Branch').folder.id;
  addEntity(model, 'ELM', { parent: branch });
  equal(canFile(model, branch, levels[FILING_DEPTH - 1]).reason, tooDeep, 'a folder whose content would reach past the limit cannot be filed there');
  allowed(file(model, branch, levels[FILING_DEPTH - 2]), 'one level higher it can');
  equal(canPlaceBeside(model, branch, levels[FILING_DEPTH]).reason, tooDeep, 'nor placed beside a node whose parent leaves no room for its content');
  allowed(placeBeside(model, branch, levels[FILING_DEPTH - 1], 'after'), 'and placed where its content fits');
  const lone = addFolder(model, 'Lone').folder.id;
  allowed(placeBeside(model, lone, deepest, 'before'), 'a node alone takes the deepest level beside another');
}

// --- V-TST-086 The children index agrees with the node list after every change (F-WSP-001, F-WSP-004) ---

{
  /** Whether every parent's children, as the index gives them, are what a full scan finds, in order. */
  const agrees = (model) => [null, ...model.nodes.keys()].every((parentId) => {
    const indexed = childrenOf(model, parentId).map((node) => node.id).join(' ');
    const scanned = [...model.nodes.values()].filter((node) => node.parent === parentId).map((node) => node.id).join(' ');
    return indexed === scanned;
  });
  const model = createModel();
  const shelf = addFolder(model, 'Shelf').folder.id;
  const drive = addEntity(model, 'ELM', { parent: shelf }).entity.id;
  const motor = addEntity(model, 'ELM', { parent: drive }).entity.id;
  const hazard = addEntity(model, 'HAZ').entity.id;
  ok(agrees(model), 'after creating');
  file(model, hazard, shelf);
  ok(agrees(model), 'after filing');
  placeBeside(model, hazard, drive, 'before');
  ok(agrees(model), 'after placing');
  const returned = childrenOf(model, shelf);
  returned.pop();
  ok(agrees(model), 'after a caller changes the list it was given');
  removeEntity(model, drive);
  ok(agrees(model) && nodeOf(model, motor).parent === shelf, 'after deleting, what was filed beneath moving up');
  removeFolder(model, shelf);
  ok(agrees(model) && model.nodes.size === 0, 'after deleting a folder');

  const store = createStore({ storage: fakeStorage() });
  store.replaceProject(createModel());
  store.commit((held) => addFolder(held, 'A'));
  store.commit((held) => addEntity(held, 'ELM', { parent: 'F-1' }));
  store.commit((held) => file(held, 'ELM-001', null));
  store.undo();
  ok(agrees(store.model()) && nodeOf(store.model(), 'ELM-001').parent === 'F-1', 'after undo');
  store.redo();
  ok(agrees(store.model()) && nodeOf(store.model(), 'ELM-001').parent === null, 'after redo');

  const wide = createModel();
  for (let i = 0; i < 20000; i += 1) addEntity(wide, 'ELM');
  const started = Date.now();
  for (const id of wide.nodes.keys()) childrenOf(wide, id);
  childrenOf(wide, null);
  const took = Date.now() - started;
  ok(took < 500, `the children of all twenty thousand nodes are found in ${took} ms`);
}

// --- V-TST-087 Sibling order (F-WSP-004, F-WSP-009) --------------------------

{
  const model = createModel();
  const a = addEntity(model, 'ELM').entity;
  const b = addEntity(model, 'HAZ').entity;
  const zone = addFolder(model, 'Zone').folder;
  const c = addEntity(model, 'SCN').entity;
  deepEqual(childIds(model, null), [a.id, b.id, zone.id, c.id], 'siblings interleave folders and entities in one order');

  refused(canPlaceBeside(model, a.id, a.id), 'nothing places beside itself');
  refused(canPlaceBeside(model, 'ELM-9', a.id), 'a missing node places nowhere');
  refused(canPlaceBeside(model, a.id, 'ELM-9'), 'nothing places beside a missing node');

  allowed(placeBeside(model, c.id, a.id, 'before'), 'a node can be placed before another');
  deepEqual(childIds(model, null), [c.id, a.id, b.id, zone.id], 'and stands directly before it');
  allowed(placeBeside(model, c.id, b.id, 'after'), 'a node can be placed after another');
  deepEqual(childIds(model, null), [a.id, b.id, c.id, zone.id], 'and stands directly after it');
  allowed(placeBeside(model, zone.id, a.id, 'before'), 'a folder places among entities');
  deepEqual(childIds(model, null), [zone.id, a.id, b.id, c.id], 'the tree does not group folders above entities');

  const inner = addEntity(model, 'ELM', { parent: zone.id }).entity;
  allowed(placeBeside(model, inner.id, b.id, 'after'), 'placing beside a node in another parent adopts that parent');
  equal(nodeOf(model, inner.id).parent, null, 'the node takes the target parent');
  deepEqual(childIds(model, null), [zone.id, a.id, b.id, inner.id, c.id], 'and stands beside the target');

  const outer = addFolder(model, 'Outer').folder;
  allowed(file(model, zone.id, outer.id), 'nesting for the cycle check');
  refused(canPlaceBeside(model, outer.id, zone.id), 'a node cannot place beside its own direct contents');
  const insideZone = addEntity(model, 'ELM', { parent: zone.id }).entity;
  refused(canPlaceBeside(model, outer.id, insideZone.id), 'nor beside anything deeper inside itself');
  const did = placeBeside(model, outer.id, insideZone.id, 'before');
  equal(did.ok, false, 'placeBeside agrees with canPlaceBeside');
}

// --- V-TST-088 Relationships (F-MOD-002, F-MOD-005) --------------------------

{
  const model = createModel();
  const elm = addEntity(model, 'ELM').entity;
  const haz = addEntity(model, 'HAZ').entity;
  const scn = addEntity(model, 'SCN').entity;
  const zone = addFolder(model, 'Zone').folder;

  refused(canRelate(model, 'elm-owns-haz', elm.id, haz.id), 'a relationship the metamodel does not define is refused');
  refused(canRelate(model, 'elm-exhibits-haz', elm.id, 'HAZ-9'), 'a missing entity is refused');
  refused(canRelate(model, 'elm-exhibits-haz', zone.id, haz.id), 'a folder is not an entity');
  refused(canRelate(model, 'elm-exhibits-haz', haz.id, elm.id), 'the endpoint types are held to the metamodel');
  refused(canRelate(model, 'elm-exhibits-haz', elm.id, scn.id), 'in both positions');

  const first = relate(model, 'elm-exhibits-haz', elm.id, haz.id);
  allowed(first, 'a defined relationship between the right types is created');
  deepEqual(first.relationship, { type: 'elm-exhibits-haz', source: elm.id, target: haz.id }, 'as its triple');
  refused(canRelate(model, 'elm-exhibits-haz', elm.id, haz.id), 'the relationship already exists');
  equal(relate(model, 'elm-exhibits-haz', elm.id, haz.id).ok, false, 'relate agrees with canRelate');

  allowed(relate(model, 'haz-contributes-to-scn', haz.id, scn.id), 'a second relationship joins');
  deepEqual(
    relationshipsOf(model, haz.id),
    {
      outgoing: [{ type: 'haz-contributes-to-scn', source: haz.id, target: scn.id }],
      incoming: [{ type: 'elm-exhibits-haz', source: elm.id, target: haz.id }],
    },
    'relationshipsOf splits by direction'
  );

  refused(unrelate(model, 'elm-exhibits-haz', elm.id, scn.id), 'removing a relationship that is not there is refused');
  allowed(unrelate(model, 'elm-exhibits-haz', elm.id, haz.id), 'a relationship can be removed');
  equal(model.relationships.size, 1, 'and is gone');
  equal(nodeOf(model, elm.id) !== null && nodeOf(model, haz.id) !== null, true, 'both entities stay in place');
  allowed(canRelate(model, 'elm-exhibits-haz', elm.id, haz.id), 'and could be created again');
}

// --- V-TST-089 Folder deletion (F-WSP-007) -----------------------------------

{
  const model = createModel();
  const outer = addFolder(model, 'Outer').folder;
  const zone = addFolder(model, 'Zone', { parent: outer.id }).folder;
  const a = addEntity(model, 'ELM', { parent: zone.id }).entity;
  const inner = addFolder(model, 'Inner', { parent: zone.id }).folder;
  const b = addEntity(model, 'HAZ', { parent: inner.id }).entity;

  refused(removeFolder(model, 'F-9'), 'deleting a missing folder is refused');
  refused(removeFolder(model, a.id), 'deleting an entity as a folder is refused');

  const outcome = removeFolder(model, zone.id);
  allowed(outcome, 'a folder can be deleted');
  equal(nodeOf(model, zone.id), null, 'the folder is gone');
  equal(nodeOf(model, a.id), null, 'the entity filed in it with it');
  equal(nodeOf(model, inner.id), null, 'the folder filed in it too');
  equal(nodeOf(model, b.id), null, 'and what that folder held');
  deepEqual(outcome.removed.map((entity) => entity.id), [a.id, b.id], 'the outcome lists the entities that went');
  ok(nodeOf(model, outer.id) !== null, 'the folder it sat in stays');
  allowed(removeFolder(model, outer.id), 'an empty folder is deleted too');
}

// --- The project's own attributes (no requirement) ---------------------------------

{
  const model = createModel();
  deepEqual(model.attributes, {}, 'a new project carries an empty bag');
  allowed(setProjectAttribute(model, 'description', 'A machine'), 'a value sets');
  equal(model.attributes.description, 'A machine', 'verbatim');
  allowed(setProjectAttribute(model, 'description', ''), 'an empty value removes the key');
  ok(!Object.hasOwn(model.attributes, 'description'), 'so the project carries only what is set');
  refused(setProjectAttribute(model, '', 'x'), 'an empty key is refused');
  refused(setProjectAttribute(model, 'description', 7), 'a non-text value is refused');
}

summary('test-model');
