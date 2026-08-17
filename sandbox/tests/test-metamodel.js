/**
 * Verifies the metamodel transcription against its documents: the class
 * diagram in `docs/metamodel.md` and the identifier enumeration in
 * `schema/project.schema.json`. Run from this directory.
 */

import {
  PILLARS,
  ENTITY_TYPES,
  RELATIONSHIP_TYPES,
  relationshipsFrom,
  relationshipsTo,
} from '../app/metamodel.js';
import { ok, equal, deepEqual, summary } from './harness.js';

// --- Parse the diagram -------------------------------------------------

const diagram = readFile('../../docs/metamodel.md');
const lines = diagram.split('\n').map((line) => line.trim());

const documentTypes = [];
const documentArrows = [];
const documentPillars = [];
for (const line of lines) {
  const type = line.match(/^class (\w+)\["([^"]+)"\]:::(\w+)$/);
  if (type) documentTypes.push({ code: type[1], name: type[2], pillar: type[3] });
  const arrow = line.match(/^(\w+) (\*--|\.\.>|-->) (\w+) : (.+)$/);
  if (arrow) {
    documentArrows.push({
      source: arrow[1],
      target: arrow[3],
      label: arrow[4],
      composition: arrow[2] === '*--',
    });
  }
  const pillar = line.match(/^classDef (\w+) /);
  if (pillar) documentPillars.push(pillar[1]);
}

// --- Parse the schema --------------------------------------------------

const schema = JSON.parse(readFile('../../schema/project.schema.json'));
const schemaRelationshipIds = schema.$defs.relationship.properties.type.enum;
const schemaTypeCodes = schema.$defs.entity.properties.type.enum;
const schemaCounterKeys = schema.properties.counters.required;
const schemaIdCodes = schema.$defs.entityId.pattern.match(/^\^\(([A-Z|]+)\)-/)[1].split('|');

// --- Entity types ------------------------------------------------------

equal(documentTypes.length, 18, 'the diagram declares 18 types');
deepEqual(
  Object.keys(ENTITY_TYPES),
  documentTypes.map((type) => type.code),
  'ENTITY_TYPES holds the 18 codes in diagram order'
);
for (const type of documentTypes) {
  equal(ENTITY_TYPES[type.code]?.code, type.code, `${type.code} carries its own code`);
  equal(ENTITY_TYPES[type.code]?.name, type.name, `${type.code} is named as the diagram names it`);
  equal(ENTITY_TYPES[type.code]?.pillar, type.pillar, `${type.code} sits under the diagram's pillar`);
}

deepEqual(Object.keys(PILLARS), documentPillars, 'PILLARS holds the diagram pillars in classDef order');
for (const pillar of Object.values(PILLARS)) {
  equal(typeof pillar, 'string', 'each pillar has a display name');
}

deepEqual(Object.keys(ENTITY_TYPES), schemaTypeCodes, 'the codes match the schema entity type enum exactly');
deepEqual([...Object.keys(ENTITY_TYPES), 'F'].sort(), [...schemaCounterKeys].sort(), 'the codes plus F are the schema counter keys');
deepEqual(Object.keys(ENTITY_TYPES).sort(), [...schemaIdCodes].sort(), 'the codes are the schema identifier pattern alternatives');

// --- Relationship types ------------------------------------------------

equal(documentArrows.length, 44, 'the diagram draws 44 arrows');
equal(documentArrows.filter((arrow) => arrow.composition).length, 6, 'six of the arrows are compositions');

const derivedIds = documentArrows.map(
  (arrow) => `${arrow.source}-${arrow.label.replaceAll(' ', '-')}-${arrow.target}`.toLowerCase()
);
equal(schemaRelationshipIds.length, 44, 'the schema enumerates 44 relationship identifiers');
deepEqual(derivedIds, schemaRelationshipIds, 'the diagram arrows derive the schema enumeration in order');
deepEqual(Object.keys(RELATIONSHIP_TYPES), schemaRelationshipIds, 'RELATIONSHIP_TYPES holds the schema identifiers in order');

documentArrows.forEach((arrow, index) => {
  const transcribed = RELATIONSHIP_TYPES[derivedIds[index]];
  equal(transcribed?.id, derivedIds[index], `${derivedIds[index]} carries its own identifier`);
  equal(transcribed?.source, arrow.source, `${derivedIds[index]} goes from ${arrow.source}`);
  equal(transcribed?.target, arrow.target, `${derivedIds[index]} goes to ${arrow.target}`);
  equal(transcribed?.label, arrow.label, `${derivedIds[index]} is labelled as the diagram labels it`);
  equal(transcribed?.composition, arrow.composition, `${derivedIds[index]} composition matches the arrow kind`);
});

// --- Directional lookups -----------------------------------------------

for (const code of Object.keys(ENTITY_TYPES)) {
  deepEqual(
    relationshipsFrom(code).map((type) => type.id),
    documentArrows
      .map((arrow, index) => ({ arrow, id: derivedIds[index] }))
      .filter((entry) => entry.arrow.source === code)
      .map((entry) => entry.id),
    `relationshipsFrom(${code}) lists the arrows from ${code} in order`
  );
  deepEqual(
    relationshipsTo(code).map((type) => type.id),
    documentArrows
      .map((arrow, index) => ({ arrow, id: derivedIds[index] }))
      .filter((entry) => entry.arrow.target === code)
      .map((entry) => entry.id),
    `relationshipsTo(${code}) lists the arrows to ${code} in order`
  );
}

summary('test-metamodel');
