/**
 * Exercises the navigator logic that needs no page: the rows the tree
 * draws per model and expansion, and the label a row composes. The
 * rendered tree is checked in the browser. Run from this directory.
 */

import { treeRows, labelParts, visibleRows, matchingIds, revealSet } from '../app/navigator.js';
import { createModel, addEntity, addFolder, updateEntity, file } from '../app/model.js';
import { ok, equal, deepEqual, summary } from './harness.js';

/** The identifiers of the drawn rows, in order. */
function drawn(model, expanded) {
  return treeRows(model, (id) => expanded.has(id)).map((row) => row.id);
}

// --- The rows ----------------------------------------------------------

{
  const model = createModel();
  deepEqual(treeRows(model, () => true), [], 'an empty model draws nothing');

  addEntity(model, 'ELM');
  addFolder(model, 'Zone');
  addEntity(model, 'HAZ');
  addEntity(model, 'ELM', { parent: 'F-1' });
  addEntity(model, 'SCN', { parent: 'ELM-002' });

  const collapsed = drawn(model, new Set());
  deepEqual(collapsed, ['ELM-001', 'F-1', 'HAZ-001'], 'collapsed, only the top of the tree draws, kinds interleaved in sibling order');

  const rows = treeRows(model, () => false);
  equal(rows[0].hasChildren, false, 'a leaf knows it has no children');
  equal(rows[1].hasChildren, true, 'a holder knows it has some');
  equal(rows[1].expanded, false, 'and draws collapsed until expanded');

  deepEqual(drawn(model, new Set(['F-1'])), ['ELM-001', 'F-1', 'ELM-002', 'HAZ-001'], 'an expanded node is followed by its children');
  deepEqual(
    drawn(model, new Set(['F-1', 'ELM-002'])),
    ['ELM-001', 'F-1', 'ELM-002', 'SCN-001', 'HAZ-001'],
    'to any depth'
  );
  deepEqual(drawn(model, new Set(['ELM-002'])), ['ELM-001', 'F-1', 'HAZ-001'], 'an expanded node hidden by a collapsed one stays hidden');

  const deep = treeRows(model, () => true);
  deepEqual(deep.map((row) => row.depth), [0, 0, 1, 2, 0], 'depth follows the filing');
  equal(deep[3].expanded, false, 'a leaf never reports itself expanded, whatever the expansion set holds');

  file(model, 'HAZ-001', 'F-1');
  deepEqual(drawn(model, new Set(['F-1'])), ['ELM-001', 'F-1', 'ELM-002', 'HAZ-001'], 'a filed node draws last among its new siblings');
}

// --- The project row ----------------------------------------------------

{
  const model = createModel();
  deepEqual(visibleRows(model, () => false, false), [], 'the landing draws nothing, not even the project row');

  const alone = visibleRows(model, () => false, true);
  deepEqual(alone.map((row) => row.kind), ['project'], 'a project draws its own row before anything');
  equal(alone[0].id, null, 'the project row carries no identifier: it is the null selection');

  addEntity(model, 'ELM');
  addFolder(model, 'Zone');
  const rows = visibleRows(model, () => false, true);
  deepEqual(rows.map((row) => row.kind), ['project', 'node', 'node'], 'the project row renders first, always');
  deepEqual(rows.slice(1).map((row) => row.id), ['ELM-001', 'F-1'], 'with the tree in order beneath it');
  deepEqual(treeRows(model, () => false).map((row) => row.id), ['ELM-001', 'F-1'], 'and the tree itself never contains it');
}

// --- The project row collapses over the whole tree -----------------------

{
  const model = createModel();
  equal(visibleRows(model, () => false, true)[0].hasChildren, false, 'an empty project offers no chevron');

  addEntity(model, 'ELM');
  addFolder(model, 'Zone');
  const open = visibleRows(model, () => false, true);
  equal(open[0].hasChildren, true, 'a held project offers one');
  equal(open[0].expanded, true, 'standing open by default');

  const closed = visibleRows(model, () => false, true, '', false);
  deepEqual(closed.map((row) => row.kind), ['project'], 'collapsed, the project row hides the whole tree');
  equal(closed[0].expanded, false, 'and reads as collapsed');

  const filtered = visibleRows(model, () => false, true, 'zone', false);
  deepEqual(
    filtered.map((row) => row.id),
    [null, 'F-1'],
    'a filter reveals through the collapsed root the way it reveals through any collapsed branch'
  );
}

// --- The filter --------------------------------------------------------

{
  const model = createModel();
  addFolder(model, 'Machine zone');
  addEntity(model, 'ELM', { parent: 'F-1' });
  updateEntity(model, 'ELM-001', { title: 'Mixer drum' });
  addEntity(model, 'HAZ', { parent: 'ELM-001' });
  updateEntity(model, 'HAZ-001', { title: 'Crush point' });
  addEntity(model, 'SCN');
  updateEntity(model, 'SCN-001', { title: 'Operator reaches in' });

  deepEqual([...matchingIds(model, 'elm-0')], ['ELM-001'], 'an entity matches by its identifier');
  deepEqual([...matchingIds(model, 'drum')], ['ELM-001'], 'and by its title');
  deepEqual([...matchingIds(model, 'single hazard')], ['HAZ-001'], 'and by its type name');
  deepEqual([...matchingIds(model, 'machine')], ['F-1'], 'a folder matches by its name');
  deepEqual([...matchingIds(model, 'CRUSH')], [], 'matchingIds takes the query already lowercased');
  deepEqual([...matchingIds(model, 'nowhere')], [], 'no match, nothing');

  const collapsed = () => false;
  deepEqual(
    treeRows(model, collapsed, 'crush').map((row) => row.id),
    ['F-1', 'ELM-001', 'HAZ-001'],
    'a filter shows the matches with their ancestors'
  );
  ok(
    treeRows(model, collapsed, 'crush').every((row) => !row.hasChildren || row.expanded),
    'every branch on the way is drawn open, whatever the expansion holds'
  );
  deepEqual(
    treeRows(model, collapsed, 'crush').map((row) => row.id).includes('SCN-001'),
    false,
    'what does not match and holds no match is not drawn'
  );
  deepEqual(
    treeRows(model, collapsed, 'machine').map((row) => row.id),
    ['F-1'],
    'a matching holder with no matching contents shows alone'
  );
  equal(treeRows(model, collapsed, 'machine')[0].hasChildren, false, 'and carries no twisty');
  deepEqual(
    treeRows(model, collapsed, '  CRUSH  ').map((row) => row.id),
    ['F-1', 'ELM-001', 'HAZ-001'],
    'the query trims and lowercases on the way in'
  );
  deepEqual(treeRows(model, collapsed, '   '), treeRows(model, collapsed), 'a blank filter is no filter');

  const filtered = visibleRows(model, collapsed, true, 'crush');
  equal(filtered[0].kind, 'project', 'the project row stays first while filtering');
  deepEqual(filtered.slice(1).map((row) => row.id), ['F-1', 'ELM-001', 'HAZ-001'], 'with the filtered tree beneath it');
}

// --- The transient reveal ----------------------------------------------

{
  const model = createModel();
  addFolder(model, 'Zone');
  addEntity(model, 'ELM', { parent: 'F-1' });
  addEntity(model, 'HAZ', { parent: 'ELM-001' });
  addEntity(model, 'SCN');

  deepEqual([...revealSet(model, ['HAZ-001'])].sort(), ['ELM-001', 'F-1'], 'a deep candidate opens every branch above it');
  deepEqual([...revealSet(model, ['SCN-001'])], [], 'a root candidate opens nothing');
  deepEqual(
    [...revealSet(model, ['HAZ-001', 'SCN-001'])].sort(),
    ['ELM-001', 'F-1'],
    'the set is the union over all of them'
  );
  ok(!revealSet(model, ['HAZ-001']).has('HAZ-001'), 'the candidate itself is not a branch to open');
}

// --- The labels --------------------------------------------------------

{
  const model = createModel();
  const entity = addEntity(model, 'ELM').entity;
  deepEqual(labelParts(entity), { designation: 'ELM-001', title: null }, 'an untitled entity is its designation alone');

  updateEntity(model, 'ELM-001', { title: 'Mixer' });
  deepEqual(labelParts(entity), { designation: 'ELM-001', title: 'Mixer' }, 'a titled entity composes designation then title');

  updateEntity(model, 'ELM-001', { title: '   ' });
  deepEqual(labelParts(entity), { designation: 'ELM-001', title: null }, 'a blank title is no title');

  const folder = addFolder(model, 'Zone').folder;
  deepEqual(labelParts(folder), { designation: null, title: 'Zone' }, 'a folder is its name alone');
}

summary('test-navigator');
