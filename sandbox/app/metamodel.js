/**
 * The metamodel: the entity types a model may contain and the relationship
 * types allowed between them, with composition marked on the owning kinds.
 *
 * A transcription of the class diagram in `docs/metamodel.md`, which is the
 * authoritative definition: each class is one entity type under its pillar,
 * and each arrow is one relationship type, in the order the diagram draws
 * them. The relationship identifiers are derived source-label-target and
 * match the enumeration in `schema/project.schema.json`.
 */

/**
 * @typedef {Object} EntityType
 * @property {string} code
 * @property {string} name
 * @property {string} pillar  a key of PILLARS
 */

/**
 * @typedef {Object} RelationshipType
 * @property {string} id      the identifier the schema enumerates
 * @property {string} source  the entity type code the relationship goes from
 * @property {string} label   the arrow's label in the diagram
 * @property {string} target  the entity type code the relationship goes to
 * @property {boolean} composition  whether the source owns the target
 */

/**
 * The four pillars the diagram groups the types under.
 * @type {Object<string, string>}
 */
export const PILLARS = {
  legislativeFramework: 'Legislative Framework',
  requirementsDefinition: 'Requirements Definition',
  riskAssessment: 'Risk Assessment',
  systemContext: 'System Context',
};

/**
 * The eighteen entity types, in the order the diagram declares them.
 * @type {Object<string, EntityType>}
 */
export const ENTITY_TYPES = {
  LEG: { code: 'LEG', name: 'European Legislation', pillar: 'legislativeFramework' },
  HST: { code: 'HST', name: 'Harmonised Standard', pillar: 'legislativeFramework' },
  OSP: { code: 'OSP', name: 'Other Specification', pillar: 'legislativeFramework' },
  CAS: { code: 'CAS', name: 'Conformity Assessment', pillar: 'legislativeFramework' },
  NTB: { code: 'NTB', name: 'Notified Body', pillar: 'legislativeFramework' },
  ESR: { code: 'ESR', name: 'Essential Requirement', pillar: 'requirementsDefinition' },
  HSR: { code: 'HSR', name: 'Harmonised Requirement', pillar: 'requirementsDefinition' },
  OSR: { code: 'OSR', name: 'Other Requirement', pillar: 'requirementsDefinition' },
  REQ: { code: 'REQ', name: 'System Requirement', pillar: 'requirementsDefinition' },
  VER: { code: 'VER', name: 'System Verification', pillar: 'requirementsDefinition' },
  HAZ: { code: 'HAZ', name: 'Single Hazard', pillar: 'riskAssessment' },
  SCN: { code: 'SCN', name: 'Accident Scenario', pillar: 'riskAssessment' },
  PRM: { code: 'PRM', name: 'Protective Measure', pillar: 'riskAssessment' },
  SAF: { code: 'SAF', name: 'Safety Function', pillar: 'riskAssessment' },
  ELM: { code: 'ELM', name: 'System Element', pillar: 'systemContext' },
  ACT: { code: 'ACT', name: 'System Actor', pillar: 'systemContext' },
  TSK: { code: 'TSK', name: 'System Task', pillar: 'systemContext' },
  PHS: { code: 'PHS', name: 'System Phase', pillar: 'systemContext' },
};

/** The six composition arrows: the source owns the target. */
const COMPOSITIONS = [
  ['LEG', 'contains', 'ESR'],
  ['HST', 'contains', 'HSR'],
  ['OSP', 'contains', 'OSR'],
  ['REQ', 'decomposes into', 'REQ'],
  ['SAF', 'decomposes into', 'SAF'],
  ['ELM', 'decomposes into', 'ELM'],
];

/** The twenty-six dependency arrows. */
const DEPENDENCIES = [
  ['HST', 'harmonised under', 'LEG'],
  ['CAS', 'conducted under', 'LEG'],
  ['ELM', 'subject to', 'LEG'],
  ['ELM', 'applies', 'HST'],
  ['ELM', 'applies', 'OSP'],
  ['HSR', 'covers', 'ESR'],
  ['OSR', 'supports', 'ESR'],
  ['ESR', 'triggered by', 'HAZ'],
  ['REQ', 'derives from', 'ESR'],
  ['REQ', 'derives from', 'HSR'],
  ['REQ', 'derives from', 'OSR'],
  ['REQ', 'expresses', 'PRM'],
  ['REQ', 'expresses', 'SAF'],
  ['ELM', 'satisfies', 'ESR'],
  ['ELM', 'satisfies', 'HSR'],
  ['ELM', 'satisfies', 'OSR'],
  ['ELM', 'satisfies', 'REQ'],
  ['PRM', 'implements', 'HSR'],
  ['PRM', 'implements', 'OSR'],
  ['VER', 'verifies', 'ESR'],
  ['VER', 'verifies', 'HSR'],
  ['VER', 'verifies', 'OSR'],
  ['VER', 'verifies', 'REQ'],
  ['PRM', 'allocated to', 'ELM'],
  ['SAF', 'allocated to', 'ELM'],
  ['SAF', 'realises', 'PRM'],
];

/** The twelve association arrows. */
const ASSOCIATIONS = [
  ['NTB', 'performs', 'CAS'],
  ['CAS', 'assesses', 'ELM'],
  ['ELM', 'exhibits', 'HAZ'],
  ['HAZ', 'contributes to', 'SCN'],
  ['TSK', 'gives rise to', 'SCN'],
  ['ACT', 'exposed in', 'SCN'],
  ['PRM', 'eliminates', 'HAZ'],
  ['PRM', 'reduces risk of', 'SCN'],
  ['ELM', 'undergoes', 'PHS'],
  ['ACT', 'interacts with', 'ELM'],
  ['ACT', 'performs', 'TSK'],
  ['TSK', 'occurs during', 'PHS'],
];

/**
 * The forty-four relationship types keyed by identifier, in the order the
 * diagram draws the arrows.
 * @type {Object<string, RelationshipType>}
 */
export const RELATIONSHIP_TYPES = {};

for (const [arrows, composition] of [
  [COMPOSITIONS, true],
  [DEPENDENCIES, false],
  [ASSOCIATIONS, false],
]) {
  for (const [source, label, target] of arrows) {
    const id = `${source}-${label.replaceAll(' ', '-')}-${target}`.toLowerCase();
    RELATIONSHIP_TYPES[id] = { id, source, label, target, composition };
  }
}

/**
 * The relationship types an entity of this type can be the source of, in
 * declaration order.
 * @param {string} code
 * @returns {RelationshipType[]}
 */
export function relationshipsFrom(code) {
  return Object.values(RELATIONSHIP_TYPES).filter((type) => type.source === code);
}

/**
 * The relationship types an entity of this type can be the target of, in
 * declaration order.
 * @param {string} code
 * @returns {RelationshipType[]}
 */
export function relationshipsTo(code) {
  return Object.values(RELATIONSHIP_TYPES).filter((type) => type.target === code);
}
