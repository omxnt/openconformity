/**
 * The example project is a living fixture of the file format: it passes
 * the validator, the gates, and the replay exactly as a user's file
 * would, it is held in canonical form, and it round-trips byte-stable.
 * A schema or metamodel change that breaks the example fails here
 * before it misleads anyone. Run from this directory.
 */

import './shim.js';
import { EXAMPLE_PROJECT } from '../app/example.js';
import { validate } from '../app/validator.js';
import { loadProject, openProject, serialise, toFileObject } from '../app/files.js';
import { ENTITY_TYPES, RELATIONSHIP_TYPES } from '../app/metamodel.js';
import { addEntity } from '../app/model.js';
import { attributesFor } from '../app/attributes.js';
import { createFlows } from '../app/flows.js';
import { createStore } from '../app/store.js';
import { ok, equal, deepEqual, summary } from './harness.js';
import { fakeStorage, stubEditor } from './helpers.js';

// --- The example passes the gates a user's file passes ------------------

const loaded = loadProject(EXAMPLE_PROJECT);
{
  const judged = validate(EXAMPLE_PROJECT, 1);
  ok(judged.ok, 'the example passes the schema-1 validator');
  ok(loaded.ok, 'the example passes the open gates and the replay');
  deepEqual(loaded.notices, [], 'with nothing migrated and nothing to flag');
}

// --- It is held in canonical form and round-trips byte-stable -----------

if (loaded.ok) {
  deepEqual(toFileObject(loaded.model), EXAMPLE_PROJECT, 'the shipped object is the canonical file form: what saving the example would write');
  const text = serialise(loaded.model);
  const reopened = openProject(text);
  ok(reopened.ok, 'the serialised example reopens');
  equal(serialise(reopened.model), text, 'byte-stable through a round trip');
}

// --- What the example holds ---------------------------------------------

{
  equal(EXAMPLE_PROJECT.name, 'Example machine', 'the example is the demo machine');
  equal(EXAMPLE_PROJECT.folders.length, 16, 'sixteen folders');
  equal(EXAMPLE_PROJECT.entities.length, 75, 'seventy-five entities');
  equal(EXAMPLE_PROJECT.relationships.length, 136, 'a hundred and thirty-six relationships');

  const typesUsed = new Set(EXAMPLE_PROJECT.entities.map((entity) => entity.type));
  for (const code of Object.keys(ENTITY_TYPES)) {
    ok(typesUsed.has(code), `at least one ${code} is in the example`);
  }

  const formsUsed = new Set(EXAMPLE_PROJECT.relationships.map((relationship) => relationship.type));
  deepEqual(
    Object.keys(RELATIONSHIP_TYPES).filter((id) => !formsUsed.has(id)),
    ['req-derives-from-esr', 'ver-verifies-esr', 'ver-verifies-hsr', 'ver-verifies-osr', 'cas-assesses-elm'],
    'five relationship forms have no instance: the demo content never expressed them, and the example adds no judgement of its own'
  );

  ok(
    EXAMPLE_PROJECT.entities.every((entity) => {
      const defined = new Set(attributesFor(entity.type).map((definition) => definition.key));
      return Object.keys(entity.attributes).every((key) => defined.has(key));
    }),
    'every value the example carries stands under a key its type defines: the example follows the definitions, round by round'
  );
  ok(
    EXAMPLE_PROJECT.entities.every((entity) => !/S\d\/P\d/.test(entity.attributes.description ?? '')),
    'no risk rating rode along: rating is out of this build'
  );
}

// --- The assessment shows all three verdict states ------------------------

{
  const verdicts = EXAMPLE_PROJECT.entities
    .filter((entity) => entity.type === 'ESR')
    .map((entity) => [entity.id, entity.attributes.applicable ?? null]);
  ok(verdicts.some(([, verdict]) => verdict === 'Yes'), 'an applicable requirement carries Yes');
  ok(verdicts.some(([, verdict]) => verdict === 'No'), 'one ruled out carries No');
  ok(verdicts.some(([, verdict]) => verdict === null), 'and one stands unassessed: the key is absent, not empty');

  const choices = new Set(
    attributesFor('ESR').find((definition) => definition.key === 'applicable').values
  );
  ok(
    verdicts.every(([, verdict]) => verdict === null || choices.has(verdict)),
    'every verdict recorded is one the definition offers'
  );

  for (const [id, verdict] of verdicts) {
    const entity = EXAMPLE_PROJECT.entities.find((held) => held.id === id);
    if (verdict === null) continue;
    ok(
      (entity.attributes.rationale ?? '').trim() !== '',
      `${id} argues its verdict: a rationale rides with every assessment`
    );
  }
}

// --- The counters stand ready to issue ----------------------------------

if (loaded.ok) {
  for (const code of Object.keys(ENTITY_TYPES)) {
    const issued = addEntity(loaded.model, code);
    ok(
      !EXAMPLE_PROJECT.entities.some((entity) => entity.id === issued.id),
      `a new ${code} takes a fresh identifier, colliding with nothing in the file`
    );
  }
}

// --- The load flow: the third way in ------------------------------------

{
  const store = createStore({ storage: fakeStorage() });
  const flows = createFlows({
    store,
    overlay: {},
    dialogs: {
      confirm() {
        throw new Error('a dialog was asked');
      },
      toast() {},
    },
    editor: stubEditor(),
    fileInput: null,
  });
  equal(store.hasProject(), false, 'the landing has no project');
  await flows.loadExample();
  equal(store.hasProject(), true, 'loading the example is one action from the landing, no question asked');
  equal(store.model().name, 'Example machine', 'and what is open is the example');
  equal(store.dirty(), false, 'freshly loaded, nothing is unsaved');
}

{
  const store = createStore({ storage: fakeStorage() });
  const answers = [];
  const flows = createFlows({
    store,
    overlay: {},
    dialogs: {
      confirm(question) {
        answers.push(question.title);
        return Promise.resolve(false);
      },
      toast() {},
    },
    editor: stubEditor(),
    fileInput: null,
  });
  await flows.loadExample();
  store.commit((model) => addEntity(model, 'ELM'));
  await flows.loadExample();
  deepEqual(answers, ['Unsaved changes'], 'over unsaved work the question comes first');
  equal(store.model().nodes.size, 92, 'and declining it leaves the project untouched');
}

summary('test-example');
