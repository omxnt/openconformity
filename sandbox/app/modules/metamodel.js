/**
 * The metamodel: the entity types a model may contain and the relationships
 * allowed between them. Transcribed from the diagram in docs/metamodel.md,
 * which is the authoritative definition: the node identifiers there are the
 * type codes here, and each arrow is one entry in the relationship table.
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
 * A type is its name, its icon, and the pillar the diagram groups it under.
 * The pillar is a grouping and nothing more: the software has no level between
 * the model and the entity, so nothing is ever filed by it and no entity
 * carries it into a file. It heads a list of types where one is being chosen,
 * and it colours the type's icon.
 *
 * Which type an icon is stays a matter of shape. Eighteen types have eighteen
 * distinct silhouettes and four colours cannot tell eighteen things apart, so
 * the colour groups rather than identifies, and a reader who cannot see it
 * loses nothing but the speed of finding a pillar (D-027, N-ACC-002).
 *
 * @typedef {Object} EntityType
 * @property {string} code    the prefix, and the key of this entry
 * @property {string} name
 * @property {string} plural
 * @property {string} pillar  key into PILLARS
 * @property {string} icon    id of the symbol in the document's sprite
 */

/**
 * The four groups the diagram's classDef statements put the types into, named
 * as the diagram names them.
 * @type {Object<string, string>}
 */
const PILLARS = {
  systemStructure: 'System Structure',
  legislativeFramework: 'Legislative Framework',
  riskAssessment: 'Risk Assessment',
  requirementsDefinition: 'Requirements Definition',
};

/**
 * @typedef {Object} RelationshipType
 * @property {string} id
 * @property {string} source  entity type code
 * @property {string} label
 * @property {string} target  entity type code
 */

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
 * The eighteen types the diagram names, in the order the work runs: the
 * machine, then the law it must meet, then the risks it carries, then the
 * requirements those produce. A pillar's types sit together, so this order is
 * the order of the pillars as well as of the types within them.
 * @type {Object<string, EntityType>}
 */
export const ENTITY_TYPES = {
  ELM: { code: 'ELM', name: 'System Element', plural: 'System Elements', pillar: 'systemStructure', icon: 'i-elm' },
  ACT: { code: 'ACT', name: 'System Actor', plural: 'System Actors', pillar: 'systemStructure', icon: 'i-act' },
  TSK: { code: 'TSK', name: 'System Task', plural: 'System Tasks', pillar: 'systemStructure', icon: 'i-tsk' },
  PHS: { code: 'PHS', name: 'System Phase', plural: 'System Phases', pillar: 'systemStructure', icon: 'i-phs' },

  LEG: { code: 'LEG', name: 'European Legislation', plural: 'European Legislation', pillar: 'legislativeFramework', icon: 'i-leg' },
  HST: { code: 'HST', name: 'Harmonised Standard', plural: 'Harmonised Standards', pillar: 'legislativeFramework', icon: 'i-hst' },
  OST: { code: 'OST', name: 'Other Standard', plural: 'Other Standards', pillar: 'legislativeFramework', icon: 'i-ost' },
  CAS: { code: 'CAS', name: 'Conformity Assessment', plural: 'Conformity Assessments', pillar: 'legislativeFramework', icon: 'i-cas' },
  NTB: { code: 'NTB', name: 'Notified Body', plural: 'Notified Bodies', pillar: 'legislativeFramework', icon: 'i-ntb' },

  HAZ: { code: 'HAZ', name: 'Single Hazard', plural: 'Single Hazards', pillar: 'riskAssessment', icon: 'i-haz' },
  SCN: { code: 'SCN', name: 'Accident Scenario', plural: 'Accident Scenarios', pillar: 'riskAssessment', icon: 'i-scn' },
  RRM: { code: 'RRM', name: 'Risk Reduction Measure', plural: 'Risk Reduction Measures', pillar: 'riskAssessment', icon: 'i-rrm' },
  SAF: { code: 'SAF', name: 'Safety Function', plural: 'Safety Functions', pillar: 'riskAssessment', icon: 'i-saf' },

  ESR: { code: 'ESR', name: 'Essential Requirement', plural: 'Essential Requirements', pillar: 'requirementsDefinition', icon: 'i-esr' },
  HSR: { code: 'HSR', name: 'Harmonised Requirement', plural: 'Harmonised Requirements', pillar: 'requirementsDefinition', icon: 'i-hsr' },
  OSR: { code: 'OSR', name: 'Other Requirement', plural: 'Other Requirements', pillar: 'requirementsDefinition', icon: 'i-osr' },
  REQ: { code: 'REQ', name: 'System Requirement', plural: 'System Requirements', pillar: 'requirementsDefinition', icon: 'i-req' },
  VER: { code: 'VER', name: 'Verification Activity', plural: 'Verification Activities', pillar: 'requirementsDefinition', icon: 'i-ver' },
};

/** Stable iteration order for the entity types. */
const ENTITY_TYPE_CODES = Object.keys(ENTITY_TYPES);

/**
 * The forty-two arrows of the diagram, in the order it draws them. A
 * relationship is a directed link from one entity type to another, named by
 * its label. The diagram draws every arrow alike, so nothing here tells one
 * form of link from another and every relationship is treated the same way.
 */
const RELATIONSHIP_TABLE = [
  ['LEG', 'defines', 'ESR'],
  ['LEG', 'defines', 'CAS'],
  ['HST', 'defines', 'HSR'],
  ['OST', 'defines', 'OSR'],
  ['CAS', 'involves', 'NTB'],
  ['HST', 'harmonised to', 'LEG'],
  ['ELM', 'subject to', 'LEG'],
  ['ELM', 'subject to', 'HST'],
  ['ELM', 'subject to', 'OST'],
  ['HSR', 'satisfies', 'ESR'],
  ['OSR', 'supports', 'ESR'],
  ['REQ', 'derives from', 'HSR'],
  ['REQ', 'derives from', 'OSR'],
  ['REQ', 'derives from', 'RRM'],
  ['REQ', 'derives from', 'SAF'],
  ['REQ', 'decomposes into', 'REQ'],
  ['SAF', 'decomposes into', 'SAF'],
  ['ELM', 'decomposes into', 'ELM'],
  ['ESR', 'allocated to', 'ELM'],
  ['HSR', 'allocated to', 'ELM'],
  ['OSR', 'allocated to', 'ELM'],
  ['REQ', 'allocated to', 'ELM'],
  ['VER', 'allocated to', 'ELM'],
  ['RRM', 'allocated to', 'ELM'],
  ['SAF', 'allocated to', 'ELM'],
  ['VER', 'verifies', 'REQ'],
  ['VER', 'verifies', 'RRM'],
  ['VER', 'verifies', 'SAF'],
  ['RRM', 'implements', 'HSR'],
  ['RRM', 'implements', 'OSR'],
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
 * Every entity type a model may hold, in the order above.
 * @returns {EntityType[]}
 */
function entityTypes() {
  return ENTITY_TYPE_CODES.map((code) => ENTITY_TYPES[code]);
}

/**
 * The same types under their pillar headings. The grouping is read off the
 * order above rather than declared twice, so a type moved between pillars
 * moves in one place.
 * @returns {Array<{ pillar: string, types: EntityType[] }>}
 */
export function entityTypesByPillar() {
  const groups = [];
  for (const type of entityTypes()) {
    const pillar = PILLARS[type.pillar];
    const last = groups[groups.length - 1];
    if (last && last.pillar === pillar) last.types.push(type);
    else groups.push({ pillar, types: [type] });
  }
  return groups;
}
