/**
 * The metamodel: the entity types a model may contain and the relationships
 * allowed between them. Transcribed from docs/metamodel.md sections 2.2, 2.3
 * and 2.4.
 *
 * Attributes are not specified there. For now every entity type carries the
 * same minimal set, so that attributes can be added per type later without
 * unpicking a guess made now. `attributesFor` is the seam where they diverge.
 */

/**
 * `risk` is one row in the editor holding more than one value, named by
 * `parts`: a rating before the risk reduction measures and one after.
 * @typedef {'text'|'multiline'|'choice'|'risk'} AttributeKind
 */

/**
 * @typedef {Object} Attribute
 * @property {string} key
 * @property {string} label
 * @property {AttributeKind} kind
 * @property {string[]} [values]  the choices, for kind 'choice'
 * @property {string[]} [parts]   the keys this row stores, for kind 'risk'
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
 */

/**
 * Section 2.2, in the order the work runs: the machine, then the law it must
 * meet, then the risks it carries, then the requirements those produce. The
 * document names the third pillar "Hazard Analysis" and lists the pillars in a
 * different order; this is the newer naming.
 */
export const PILLARS = [
  { id: 'context', name: 'System Context', icon: 'i-pillar-context' },
  { id: 'legislative', name: 'Legislative Framework', icon: 'i-pillar-legislative' },
  { id: 'risk', name: 'Risk Assessment', icon: 'i-pillar-risk' },
  { id: 'requirements', name: 'Requirements Definition', icon: 'i-pillar-requirements' },
];

/**
 * The title every entity carries. The identifier is generated and read-only,
 * so it is not an attribute.
 * @type {Attribute[]}
 */
const TITLE = [{ key: 'title', label: 'Title', kind: 'text' }];

/** What a type carries until its own attributes are specified. */
const ATTRIBUTES = [...TITLE, { key: 'description', label: 'Description', kind: 'multiline' }];

/**
 * The types whose attributes have been specified. Everything else falls back to
 * a title and a plain description.
 * @type {Object<string, Attribute[]>}
 */
const SPECIFIED = {
  REQ: [
    ...TITLE,
    {
      key: 'type',
      label: 'Type',
      kind: 'choice',
      values: ['Function/Performance', 'Fit/Operational', 'Form', 'Quality', 'Compliance'],
    },
    { key: 'requirement', label: 'Requirement', kind: 'multiline' },
    { key: 'rationale', label: 'Rationale', kind: 'multiline' },
  ],
  VER: [
    ...TITLE,
    { key: 'description', label: 'Description', kind: 'multiline' },
    { key: 'method', label: 'Method', kind: 'choice', values: ['Inspection', 'Analysis', 'Demonstration', 'Test'] },
    { key: 'criteria', label: 'Acceptance criteria', kind: 'multiline' },
  ],
  HAZ: [
    ...TITLE,
    {
      key: 'group',
      label: 'Group',
      kind: 'choice',
      values: ['Mechanical', 'Electrical', 'Thermal', 'Noise', 'Vibration', 'Radiation', 'Substance', 'Ergonomic', 'Environmental', 'Other'],
    },
    { key: 'description', label: 'Description', kind: 'multiline' },
  ],
  SCN: [
    ...TITLE,
    { key: 'hazardZone', label: 'Hazard zone', kind: 'text' },
    { key: 'hazardousSituation', label: 'Hazardous situation', kind: 'multiline' },
    { key: 'hazardousEvent', label: 'Hazardous event', kind: 'multiline' },
    { key: 'consequence', label: 'Potential consequence', kind: 'multiline' },
    { key: 'risk', label: 'Risk rating', kind: 'risk', parts: ['riskBefore', 'riskAfter'] },
  ],
  SAF: [
    ...TITLE,
    { key: 'performanceLevel', label: 'Required performance level', kind: 'choice', values: ['PL a', 'PL b', 'PL c', 'PL d', 'PL e'] },
    { key: 'category', label: 'Required category', kind: 'choice', values: ['B', '1', '2', '3', '4'] },
    { key: 'briefDescription', label: 'Brief description', kind: 'multiline' },
    { key: 'triggeringEvent', label: 'Triggering event', kind: 'multiline' },
    { key: 'reaction', label: 'Safety-related reaction', kind: 'multiline' },
    { key: 'safeState', label: 'Defined safe state', kind: 'multiline' },
  ],
};

/**
 * The attributes of one entity type, for display.
 * @param {string} code
 * @returns {Attribute[]}
 */
export function attributesFor(code) {
  if (!Object.hasOwn(ENTITY_TYPES, code)) return [];
  return Object.hasOwn(SPECIFIED, code) ? SPECIFIED[code] : ATTRIBUTES;
}

/**
 * The attributes of one entity type that hold data, which is what a model
 * stores and a file carries. A row holding more than one value contributes one
 * entry per value.
 * @param {string} code
 * @returns {Attribute[]}
 */
export function storedAttributesFor(code) {
  return attributesFor(code).flatMap((attribute) =>
    attribute.parts
      ? attribute.parts.map((key) => ({ key, label: attribute.label, kind: 'text' }))
      : [attribute]
  );
}

/**
 * Section 2.3, ordered by pillar and then by the order of the table.
 * @type {Object<string, EntityType>}
 */
export const ENTITY_TYPES = {
  ELM: { code: 'ELM', name: 'System Element', plural: 'System Elements', pillar: 'context', icon: 'i-elm' },
  ACT: { code: 'ACT', name: 'System Actor', plural: 'System Actors', pillar: 'context', icon: 'i-act' },
  TSK: { code: 'TSK', name: 'System Task', plural: 'System Tasks', pillar: 'context', icon: 'i-tsk' },
  PHS: { code: 'PHS', name: 'System Phase', plural: 'System Phases', pillar: 'context', icon: 'i-phs' },

  LEG: { code: 'LEG', name: 'European Legislation', plural: 'European Legislation', pillar: 'legislative', icon: 'i-leg' },
  STD: { code: 'STD', name: 'European Standard', plural: 'European Standards', pillar: 'legislative', icon: 'i-std' },
  CAS: { code: 'CAS', name: 'Conformity Assessment', plural: 'Conformity Assessments', pillar: 'legislative', icon: 'i-cas' },
  NTB: { code: 'NTB', name: 'Notified Body', plural: 'Notified Bodies', pillar: 'legislative', icon: 'i-ntb' },

  HAZ: { code: 'HAZ', name: 'Single Hazard', plural: 'Single Hazards', pillar: 'risk', icon: 'i-haz' },
  SCN: { code: 'SCN', name: 'Accident Scenario', plural: 'Accident Scenarios', pillar: 'risk', icon: 'i-scn' },
  RRM: { code: 'RRM', name: 'Risk Reduction Measure', plural: 'Risk Reduction Measures', pillar: 'risk', icon: 'i-rrm' },
  SAF: { code: 'SAF', name: 'Safety Function', plural: 'Safety Functions', pillar: 'risk', icon: 'i-saf' },

  ESR: { code: 'ESR', name: 'Essential Requirement', plural: 'Essential Requirements', pillar: 'requirements', icon: 'i-esr' },
  STR: { code: 'STR', name: 'Standard Requirement', plural: 'Standard Requirements', pillar: 'requirements', icon: 'i-str' },
  REQ: { code: 'REQ', name: 'System Requirement', plural: 'System Requirements', pillar: 'requirements', icon: 'i-req' },
  VER: { code: 'VER', name: 'Verification Activity', plural: 'Verification Activities', pillar: 'requirements', icon: 'i-ver' },
};

/** Stable iteration order for the entity types. */
const ENTITY_TYPE_CODES = Object.keys(ENTITY_TYPES);

/**
 * Section 2.4, in the order of the table. A relationship is a directed link
 * from one entity type to another, named by its label. It carries no further
 * classification: what it means is what the label says.
 */
const RELATIONSHIP_TABLE = [
  ['LEG', 'defines', 'ESR'],
  ['LEG', 'defines', 'CAS'],
  ['STD', 'defines', 'STR'],
  ['CAS', 'involves', 'NTB'],
  ['STD', 'harmonised to', 'LEG'],
  ['ELM', 'subject to', 'LEG'],
  ['ELM', 'subject to', 'STD'],
  ['STR', 'satisfies', 'ESR'],
  ['REQ', 'derives from', 'STR'],
  ['REQ', 'derives from', 'RRM'],
  ['REQ', 'derives from', 'SAF'],
  ['REQ', 'decomposes into', 'REQ'],
  ['SAF', 'decomposes into', 'SAF'],
  ['ELM', 'decomposes into', 'ELM'],
  ['ESR', 'allocated to', 'ELM'],
  ['STR', 'allocated to', 'ELM'],
  ['REQ', 'allocated to', 'ELM'],
  ['VER', 'allocated to', 'ELM'],
  ['RRM', 'allocated to', 'ELM'],
  ['SAF', 'allocated to', 'ELM'],
  ['VER', 'verifies', 'REQ'],
  ['VER', 'verifies', 'RRM'],
  ['VER', 'verifies', 'SAF'],
  ['RRM', 'implements', 'STR'],
  ['SAF', 'realises', 'RRM'],
  ['RRM', 'mitigates', 'HAZ'],
  ['RRM', 'mitigates', 'SCN'],
  ['ELM', 'exhibits', 'HAZ'],
  ['HAZ', 'triggers', 'ESR'],
  ['HAZ', 'contributes to', 'SCN'],
  ['TSK', 'leads to', 'SCN'],
  ['ACT', 'exposed in', 'SCN'],
  ['ELM', 'has', 'PHS'],
  ['ELM', 'has', 'ACT'],
  ['ACT', 'performs', 'TSK'],
  ['TSK', 'during', 'PHS'],
];

/** @type {Object<string, RelationshipType>} */
export const RELATIONSHIP_TYPES = {};

for (const [source, label, target] of RELATIONSHIP_TABLE) {
  const id = `${source}-${label.replace(/ /g, '-')}-${target}`.toLowerCase();
  RELATIONSHIP_TYPES[id] = { id, source, label, target };
}

/** Stable iteration order for the relationship types. */
const RELATIONSHIP_TYPE_IDS = Object.keys(RELATIONSHIP_TYPES);

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
 * @param {string} pillarId
 * @returns {EntityType[]}
 */
export function typesInPillar(pillarId) {
  return ENTITY_TYPE_CODES.map((c) => ENTITY_TYPES[c]).filter((t) => t.pillar === pillarId);
}
