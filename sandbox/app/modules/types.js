/**
 * Artifact type registry.
 *
 * Each entry declares the *shape* of one kind of artifact: how its id is
 * prefixed, where instances are stored on the project, what fields it has,
 * and which fields hold references to other artifacts.
 *
 * Other modules consume this registry instead of hard-coding type knowledge:
 *   - state.js uses `fields` to clean up references on deletion and to seed
 *     defaults on creation.
 *   - tree.js / editor.js use display names and field declarations to render.
 *   - export.js uses storage keys and field lists to write CSVs.
 *
 * Changing the registry is a schema change. Bump SCHEMA_VERSION in state.js
 * and add a migration in persistence.js if you alter the on-disk shape.
 */

// --- Enumerations referenced by field declarations ----------------------

export const LifecyclePhases = [
  'transport',
  'installation',
  'commissioning',
  'normal-use',
  'cleaning',
  'maintenance',
  'fault-finding',
  'decommissioning',
];

export const HazardEnergySources = [
  'mechanical',
  'electrical',
  'thermal',
  'noise',
  'vibration',
  'radiation',
  'material',
  'ergonomic',
  'environmental',
  'combination',
  'other',
];

export const MeasureCategories = ['inherent', 'safeguarding', 'information'];

export const VerificationMethods = ['test', 'inspection', 'analysis', 'demonstration'];

export const Priorities = ['must', 'should', 'could'];

export const RequirementStatuses = ['draft', 'approved', 'verified', 'obsolete'];

export const VerificationStatuses = [
  'planned',
  'in-progress',
  'passed',
  'failed',
  'blocked',
];

export const SafetyMethodologies = ['iso-13849', 'iec-62061'];

// --- Field-shape catalogue ----------------------------------------------

/**
 * @typedef {Object} FieldString    @property {'string'} kind             @property {boolean=} required @property {string=} default
 * @typedef {Object} FieldText      @property {'text'} kind               @property {boolean=} required @property {string=} default
 * @typedef {Object} FieldEnum      @property {'enum'} kind               @property {string[]} values  @property {boolean=} nullable @property {string=} default
 * @typedef {Object} FieldRef       @property {'ref'} kind                @property {ArtifactKey} target @property {boolean=} nullable
 * @typedef {Object} FieldRefArray  @property {'ref-array'} kind          @property {ArtifactKey} target
 * @typedef {Object} FieldPolyArray @property {'polymorphic-ref-array'} kind @property {ArtifactKey[]} targets
 * @typedef {Object} FieldDate      @property {'date'} kind
 * @typedef {Object} FieldObject    @property {'object'} kind             @property {boolean=} nullable
 * @typedef {Object} FieldNumber    @property {'number'} kind             @property {boolean=} nullable
 *
 * @typedef {FieldString | FieldText | FieldEnum | FieldRef | FieldRefArray | FieldPolyArray | FieldDate | FieldObject | FieldNumber} Field
 *
 * @typedef {Object} ArtifactType
 * @property {ArtifactKey} key                      stable identifier used in code
 * @property {string} storageKey                    plural key used on the project root
 * @property {string} idPrefix                      e.g. "arch" → ids are "arch-1", "arch-2", ...
 * @property {string} displayName                   singular human label
 * @property {string} displayNamePlural             plural human label
 * @property {string} labelField                    field used as the artifact's display label
 * @property {Object<string, Field>} fields
 *
 * @typedef {'architectureElement' | 'legislation' | 'harmonizedStandard' | 'essentialRequirement' | 'preliminaryHazard' | 'consolidatedHazard' | 'riskReducingMeasure' | 'safetyFunction' | 'derivedRequirement' | 'verificationActivity'} ArtifactKey
 */

// --- The registry --------------------------------------------------------

/** @type {Object<ArtifactKey, ArtifactType>} */
export const ArtifactTypes = {
  architectureElement: {
    key: 'architectureElement',
    storageKey: 'architectureElements',
    idPrefix: 'arch',
    displayName: 'System element',
    displayNamePlural: 'System Architecture',
    labelField: 'name',
    fields: {
      name: { kind: 'string', required: true },
      parentId: { kind: 'ref', target: 'architectureElement', nullable: true },
      description: { kind: 'text' },
      notes: { kind: 'text' },
    },
  },

  legislation: {
    key: 'legislation',
    storageKey: 'legislations',
    idPrefix: 'leg',
    displayName: 'Legislation',
    displayNamePlural: 'Applicable Legislation',
    labelField: 'name',
    fields: {
      libraryRef: { kind: 'string' },
      name: { kind: 'string', required: true },
      reference: { kind: 'string' },
      notes: { kind: 'text' },
    },
  },

  harmonizedStandard: {
    key: 'harmonizedStandard',
    storageKey: 'harmonizedStandards',
    idPrefix: 'std',
    displayName: 'Harmonized standard',
    displayNamePlural: 'Harmonized Standards',
    labelField: 'name',
    fields: {
      name: { kind: 'string', required: true },
      reference: { kind: 'string' },
      year: { kind: 'string' },
      description: { kind: 'text' },
      appliesTo: { kind: 'ref-array', target: 'legislation' },
      coversERs: { kind: 'ref-array', target: 'essentialRequirement' },
      notes: { kind: 'text' },
    },
  },

  essentialRequirement: {
    key: 'essentialRequirement',
    storageKey: 'essentialRequirements',
    idPrefix: 'ereq',
    displayName: 'Essential requirement',
    displayNamePlural: 'Essential requirements',
    labelField: 'title',
    fields: {
      legislationId: { kind: 'ref', target: 'legislation', nullable: true },
      libraryRef: { kind: 'string' },
      code: { kind: 'string' },
      title: { kind: 'string', required: true },
      text: { kind: 'text' },
      applicabilityNote: { kind: 'text' },
      notes: { kind: 'text' },
    },
  },

  preliminaryHazard: {
    key: 'preliminaryHazard',
    storageKey: 'preliminaryHazards',
    idPrefix: 'phaz',
    displayName: 'Identified hazard',
    displayNamePlural: 'Hazard Identification',
    labelField: 'name',
    fields: {
      name: { kind: 'string', required: true },
      description: { kind: 'text' },
      architectureId: { kind: 'ref', target: 'architectureElement', nullable: true },
      lifecyclePhase: { kind: 'enum', values: LifecyclePhases, nullable: true },
      energySource: { kind: 'enum', values: HazardEnergySources, nullable: true },
      notes: { kind: 'text' },
    },
  },

  consolidatedHazard: {
    key: 'consolidatedHazard',
    storageKey: 'consolidatedHazards',
    idPrefix: 'chaz',
    displayName: 'Assessed hazard',
    displayNamePlural: 'Hazard Assessment',
    labelField: 'name',
    fields: {
      name: { kind: 'string', required: true },
      description: { kind: 'text' },
      architectureId: { kind: 'ref', target: 'architectureElement', nullable: true },
      energySource: { kind: 'enum', values: HazardEnergySources, nullable: true },
      derivedFromPreliminaryIds: { kind: 'ref-array', target: 'preliminaryHazard' },
      severityId: { kind: 'string' },
      probabilityId: { kind: 'string' },
      riskLevelId: { kind: 'string' },
      rationale: { kind: 'text' },
      notes: { kind: 'text' },
    },
  },

  riskReducingMeasure: {
    key: 'riskReducingMeasure',
    storageKey: 'riskReducingMeasures',
    idPrefix: 'rrm',
    displayName: 'Protective measure',
    displayNamePlural: 'Protective Measures',
    labelField: 'name',
    fields: {
      name: { kind: 'string', required: true },
      description: { kind: 'text' },
      category: { kind: 'enum', values: MeasureCategories, nullable: true },
      addressedHazardIds: { kind: 'ref-array', target: 'consolidatedHazard' },
      calculator: { kind: 'object', nullable: true },
      residualSeverityId: { kind: 'string' },
      residualProbabilityId: { kind: 'string' },
      residualRiskLevelId: { kind: 'string' },
      notes: { kind: 'text' },
    },
  },

  safetyFunction: {
    key: 'safetyFunction',
    storageKey: 'safetyFunctions',
    idPrefix: 'sf',
    displayName: 'Safety function',
    displayNamePlural: 'Safety Functions',
    labelField: 'name',
    fields: {
      name: { kind: 'string', required: true },
      description: { kind: 'text' },
      methodology: { kind: 'enum', values: SafetyMethodologies, default: 'iso-13849' },

      S: { kind: 'enum', values: ['S1', 'S2'], nullable: true },
      F: { kind: 'enum', values: ['F1', 'F2'], nullable: true },
      P: { kind: 'enum', values: ['P1', 'P2'], nullable: true },
      requiredPL: { kind: 'string' },

      Se: { kind: 'enum', values: ['1', '2', '3', '4'], nullable: true },
      Fr: { kind: 'enum', values: ['2', '3', '4', '5'], nullable: true },
      Pr: { kind: 'enum', values: ['1', '2', '3', '4', '5'], nullable: true },
      Av: { kind: 'enum', values: ['1', '3', '5'], nullable: true },
      CL: { kind: 'string' },
      requiredSIL: { kind: 'string' },

      addressedHazardIds: { kind: 'ref-array', target: 'consolidatedHazard' },
      implementedByMeasureIds: { kind: 'ref-array', target: 'riskReducingMeasure' },
      notes: { kind: 'text' },
    },
  },

  derivedRequirement: {
    key: 'derivedRequirement',
    storageKey: 'derivedRequirements',
    idPrefix: 'dreq',
    displayName: 'Derived requirement',
    displayNamePlural: 'Derived Requirements',
    labelField: 'text',
    fields: {
      text: { kind: 'text', required: true },
      rationale: { kind: 'text' },
      acceptanceCriteria: { kind: 'text' },
      verificationMethod: { kind: 'enum', values: VerificationMethods, nullable: true },
      priority: { kind: 'enum', values: Priorities, nullable: true },
      status: { kind: 'enum', values: RequirementStatuses, default: 'draft' },
      parentRequirementId: { kind: 'ref', target: 'derivedRequirement', nullable: true },
      originatingRefs: {
        kind: 'polymorphic-ref-array',
        targets: [
          'essentialRequirement',
          'consolidatedHazard',
          'riskReducingMeasure',
          'safetyFunction',
          'architectureElement',
        ],
      },
      allocatedArchitectureId: { kind: 'ref', target: 'architectureElement', nullable: true },
      notes: { kind: 'text' },
    },
  },

  verificationActivity: {
    key: 'verificationActivity',
    storageKey: 'verificationActivities',
    idPrefix: 'vact',
    displayName: 'Verification activity',
    displayNamePlural: 'Verification Activities',
    labelField: 'procedure',
    fields: {
      requirementId: { kind: 'ref', target: 'derivedRequirement', nullable: true },
      method: { kind: 'enum', values: VerificationMethods, nullable: true },
      procedure: { kind: 'text' },
      expectedResult: { kind: 'text' },
      actualResult: { kind: 'text' },
      status: { kind: 'enum', values: VerificationStatuses, default: 'planned' },
      date: { kind: 'date' },
      executor: { kind: 'string' },
      notes: { kind: 'text' },
    },
  },
};

/** Stable iteration order for the registry. */
export const ArtifactTypeKeys = /** @type {ArtifactKey[]} */ (Object.keys(ArtifactTypes));

/**
 * @param {string} storageKey
 * @returns {ArtifactType | undefined}
 */
export function typeByStorageKey(storageKey) {
  for (const t of Object.values(ArtifactTypes)) {
    if (t.storageKey === storageKey) return t;
  }
  return undefined;
}

/**
 * @param {string} prefix
 * @returns {ArtifactType | undefined}
 */
export function typeByIdPrefix(prefix) {
  for (const t of Object.values(ArtifactTypes)) {
    if (t.idPrefix === prefix) return t;
  }
  return undefined;
}

/**
 * @param {string} id
 * @returns {ArtifactType | undefined}
 */
export function typeFromId(id) {
  const dash = id.indexOf('-');
  if (dash < 0) return undefined;
  return typeByIdPrefix(id.slice(0, dash));
}

/**
 * Return the name of a type's self-referencing ref field if one exists
 * (e.g. `parentId` on architectureElement, `parentRequirementId` on
 * derivedRequirement), or null. Used by the tree to render hierarchies
 * for any type that declares one.
 * @param {ArtifactKey} typeKey
 * @returns {string | null}
 */
export function getSelfRefField(typeKey) {
  const t = ArtifactTypes[typeKey];
  if (!t) return null;
  for (const [name, field] of Object.entries(t.fields)) {
    if (field.kind === 'ref' && field.target === typeKey) return name;
  }
  return null;
}

/**
 * @param {ArtifactKey} typeKey
 * @param {Object<string, any>} artifact
 * @returns {string}
 */
export function labelOf(typeKey, artifact) {
  const t = ArtifactTypes[typeKey];
  if (!t || !artifact) return artifact?.id ?? '';
  const v = artifact[t.labelField];
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed) return trimmed;
  }
  return artifact.id;
}

/**
 * Per-field label overrides. Field names that auto-humanize cleanly are
 * left implicit; acronyms and shortened forms get explicit labels here.
 */
const FIELD_LABEL_OVERRIDES = {
  S: 'S — severity',
  F: 'F — frequency / duration',
  P: 'P — possibility of avoidance',
  Se: 'Se — severity',
  Fr: 'Fr — frequency / duration',
  Pr: 'Pr — probability of occurrence',
  Av: 'Av — probability of avoidance',
  CL: 'Class (Fr + Pr + Av)',
  requiredPL: 'Required PL',
  requiredSIL: 'Required SIL',
  libraryRef: 'Library reference',
  legislationId: 'Legislation',
  architectureId: 'Architecture',
  parentId: 'Parent',
  parentRequirementId: 'Parent requirement',
  allocatedArchitectureId: 'Allocated to',
  derivedFromPreliminaryIds: 'Derived from preliminary hazards',
  addressedHazardIds: 'Addressed hazards',
  implementedByMeasureIds: 'Implemented by measures',
  originatingRefs: 'Originating artifacts',
  requirementId: 'Requirement',
  severityId: 'Severity',
  probabilityId: 'Probability',
  riskLevelId: 'Risk level',
  residualSeverityId: 'Residual severity',
  residualProbabilityId: 'Residual probability',
  residualRiskLevelId: 'Residual risk level',
  applicabilityNote: 'Applicability note',
  acceptanceCriteria: 'Acceptance criteria',
  verificationMethod: 'Verification method',
  expectedResult: 'Expected result',
  actualResult: 'Actual result',
  lifecyclePhase: 'Lifecycle phase',
  energySource: 'Energy source',
};

/**
 * @param {string} name
 * @returns {string}
 */
export function humanizeFieldName(name) {
  if (FIELD_LABEL_OVERRIDES[name]) return FIELD_LABEL_OVERRIDES[name];
  const stripped = name.replace(/Ids?$/, '');
  const spaced = stripped
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
  if (!spaced) return name;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/**
 * @param {string} value
 * @returns {string}
 */
export function humanizeEnumValue(value) {
  if (!value) return '';
  const spaced = String(value).replace(/[_-]+/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
