/**
 * The metamodel: the entity types a model may contain and the relationships
 * allowed between them. Transcribed from docs/metamodel.md sections 2.2, 2.3
 * and 2.4.
 *
 * Attributes are not specified there. For now every entity type carries the
 * same minimal set, so that attributes can be added per type later without
 * unpicking a guess made now. `attributesFor` is the seam where they diverge.
 */

/** @typedef {'text'|'multiline'} AttributeKind */

/**
 * @typedef {Object} Attribute
 * @property {string} key
 * @property {string} label
 * @property {AttributeKind} kind
 * @property {boolean} [mono]  render the value in the data typeface
 */

/**
 * @typedef {Object} EntityType
 * @property {string} code    the prefix, and the key of this entry
 * @property {string} name
 * @property {string} plural
 * @property {string} pillar
 * @property {string} icon    id of the symbol in the document's sprite
 */

/**
 * @typedef {Object} RelationshipType
 * @property {string} id
 * @property {string} source  entity type code
 * @property {string} label
 * @property {string} target  entity type code
 * @property {'composition'|'association'} kind
 */

/** Section 2.2. */
export const PILLARS = [
  { id: 'context', name: 'System Context' },
  { id: 'legislative', name: 'Legislative Framework' },
  { id: 'requirements', name: 'Requirements Definition' },
  { id: 'hazard', name: 'Hazard Analysis' },
];

/**
 * The attributes every entity carries, whatever its type. The designation is
 * the user's own reference for the thing: a part number, a legislation
 * reference, a standard designation, a clause. It is shown in the tree ahead
 * of the name.
 * @type {Attribute[]}
 */
export const ATTRIBUTES = [
  { key: 'designation', label: 'Designation', kind: 'text', mono: true },
  { key: 'name', label: 'Name', kind: 'text' },
  { key: 'description', label: 'Description', kind: 'multiline' },
];

/**
 * The attributes of one entity type. Shared by every type today; the place to
 * return a type-specific set once the attributes are specified.
 * @param {string} code
 * @returns {Attribute[]}
 */
export function attributesFor(code) {
  return ENTITY_TYPES[code] ? ATTRIBUTES : [];
}

/**
 * Section 2.3, ordered by pillar and then by the order of the table.
 * @type {Object<string, EntityType>}
 */
export const ENTITY_TYPES = {
  ELM: { code: 'ELM', name: 'System Element', plural: 'System Elements', pillar: 'context', icon: 'i-element' },
  ACT: { code: 'ACT', name: 'System Actor', plural: 'System Actors', pillar: 'context', icon: 'i-actor' },
  TSK: { code: 'TSK', name: 'System Task', plural: 'System Tasks', pillar: 'context', icon: 'i-task' },
  PHS: { code: 'PHS', name: 'System Phase', plural: 'System Phases', pillar: 'context', icon: 'i-phase' },

  LEG: { code: 'LEG', name: 'European Legislation', plural: 'European Legislation', pillar: 'legislative', icon: 'i-legislation' },
  STD: { code: 'STD', name: 'European Standard', plural: 'European Standards', pillar: 'legislative', icon: 'i-standard' },
  CAS: { code: 'CAS', name: 'Conformity Assessment', plural: 'Conformity Assessments', pillar: 'legislative', icon: 'i-assessment' },
  NTB: { code: 'NTB', name: 'Notified Body', plural: 'Notified Bodies', pillar: 'legislative', icon: 'i-body' },

  ESR: { code: 'ESR', name: 'Essential Requirement', plural: 'Essential Requirements', pillar: 'requirements', icon: 'i-er' },
  STR: { code: 'STR', name: 'Standard Requirement', plural: 'Standard Requirements', pillar: 'requirements', icon: 'i-sr' },
  REQ: { code: 'REQ', name: 'System Requirement', plural: 'System Requirements', pillar: 'requirements', icon: 'i-rq' },
  VER: { code: 'VER', name: 'Verification Activity', plural: 'Verification Activities', pillar: 'requirements', icon: 'i-va' },

  HAZ: { code: 'HAZ', name: 'Single Hazard', plural: 'Single Hazards', pillar: 'hazard', icon: 'i-hazard' },
  SCN: { code: 'SCN', name: 'Accident Scenario', plural: 'Accident Scenarios', pillar: 'hazard', icon: 'i-scenario' },
  RRM: { code: 'RRM', name: 'Risk Reduction Measure', plural: 'Risk Reduction Measures', pillar: 'hazard', icon: 'i-rrm' },
  SAF: { code: 'SAF', name: 'Safety Function', plural: 'Safety Functions', pillar: 'hazard', icon: 'i-sf' },
};

/** Stable iteration order for the entity types. */
export const ENTITY_TYPE_CODES = Object.keys(ENTITY_TYPES);

/** Section 2.4, in the order of the table. */
const RELATIONSHIP_TABLE = [
  ['LEG', 'defines', 'ESR', 'composition'],
  ['LEG', 'defines', 'CAS', 'composition'],
  ['STD', 'defines', 'STR', 'composition'],
  ['CAS', 'involves', 'NTB', 'composition'],
  ['STD', 'harmonised to', 'LEG', 'association'],
  ['ELM', 'subject to', 'LEG', 'association'],
  ['ELM', 'subject to', 'STD', 'association'],
  ['STR', 'satisfies', 'ESR', 'association'],
  ['REQ', 'derives from', 'STR', 'association'],
  ['REQ', 'derives from', 'RRM', 'association'],
  ['REQ', 'derives from', 'SAF', 'association'],
  ['REQ', 'decomposes into', 'REQ', 'composition'],
  ['SAF', 'decomposes into', 'SAF', 'composition'],
  ['ELM', 'decomposes into', 'ELM', 'composition'],
  ['ESR', 'allocated to', 'ELM', 'association'],
  ['STR', 'allocated to', 'ELM', 'association'],
  ['REQ', 'allocated to', 'ELM', 'association'],
  ['VER', 'allocated to', 'ELM', 'association'],
  ['RRM', 'allocated to', 'ELM', 'association'],
  ['SAF', 'allocated to', 'ELM', 'association'],
  ['VER', 'verifies', 'REQ', 'association'],
  ['VER', 'verifies', 'RRM', 'association'],
  ['VER', 'verifies', 'SAF', 'association'],
  ['RRM', 'implements', 'STR', 'association'],
  ['SAF', 'realises', 'RRM', 'association'],
  ['RRM', 'mitigates', 'HAZ', 'association'],
  ['RRM', 'mitigates', 'SCN', 'association'],
  ['ELM', 'exhibits', 'HAZ', 'composition'],
  ['HAZ', 'triggers', 'ESR', 'association'],
  ['HAZ', 'contributes to', 'SCN', 'association'],
  ['TSK', 'leads to', 'SCN', 'association'],
  ['ACT', 'exposed in', 'SCN', 'association'],
  ['ELM', 'has', 'PHS', 'association'],
  ['ELM', 'has', 'ACT', 'association'],
  ['ACT', 'performs', 'TSK', 'association'],
  ['TSK', 'during', 'PHS', 'association'],
];

/** @type {Object<string, RelationshipType>} */
export const RELATIONSHIP_TYPES = {};

for (const [source, label, target, kind] of RELATIONSHIP_TABLE) {
  const id = `${source}-${label.replace(/ /g, '-')}-${target}`.toLowerCase();
  RELATIONSHIP_TYPES[id] = { id, source, label, target, kind };
}

/** Stable iteration order for the relationship types. */
export const RELATIONSHIP_TYPE_IDS = Object.keys(RELATIONSHIP_TYPES);

/**
 * The relationship types an entity of this type can be the source of.
 * @param {string} code
 * @returns {RelationshipType[]}
 */
export function relationshipsFrom(code) {
  return RELATIONSHIP_TYPE_IDS.map((id) => RELATIONSHIP_TYPES[id]).filter((r) => r.source === code);
}

/**
 * The relationship types an entity of this type can be the target of.
 * @param {string} code
 * @returns {RelationshipType[]}
 */
export function relationshipsTo(code) {
  return RELATIONSHIP_TYPE_IDS.map((id) => RELATIONSHIP_TYPES[id]).filter((r) => r.target === code);
}

/**
 * The compositions an entity of this type owns, which is what "new, under the
 * entity I am standing on" can offer.
 * @param {string} code
 * @returns {RelationshipType[]}
 */
export function compositionsFrom(code) {
  return relationshipsFrom(code).filter((r) => r.kind === 'composition');
}

/**
 * The composition of a type with itself, if it has one. This is the only
 * composition the navigator nests by, since it is the only one that produces a
 * hierarchy of like things.
 * @param {string} code
 * @returns {RelationshipType | null}
 */
export function selfComposition(code) {
  return compositionsFrom(code).find((r) => r.target === code) ?? null;
}

/**
 * @param {string} ownerCode
 * @param {string} ownedCode
 * @returns {RelationshipType | null}
 */
export function compositionBetween(ownerCode, ownedCode) {
  return compositionsFrom(ownerCode).find((r) => r.target === ownedCode) ?? null;
}

/**
 * @param {string} pillarId
 * @returns {EntityType[]}
 */
export function typesInPillar(pillarId) {
  return ENTITY_TYPE_CODES.map((c) => ENTITY_TYPES[c]).filter((t) => t.pillar === pillarId);
}
