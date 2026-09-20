/**
 * The attribute definitions per entity type, transcribed from
 * `sandbox/attributes.md` — the working draft that supersedes
 * `docs/attributes.md` while the attribute-definition work runs, and the
 * authoritative definition for now — in the order the document records
 * the types.
 *
 * Per type, the ungrouped definitions come first and the named groups
 * follow — a group tagged tab standing on a tab of its own — with keys
 * unique across all of a type's tables. The
 * identifier is generated and read-only, so it is not an attribute. Every
 * attribute is optional and every value is stored as text: an unset
 * attribute is the absence of its key.
 */

/** @typedef {'text'|'multiline'|'choice'|'set'|'hyperlink'|'number'|'computed'|'related'} AttributeKind */

/**
 * @typedef {Object} AttributeDefinition
 * @property {string} key
 * @property {string} name
 * @property {AttributeKind} kind
 * @property {string[]} [values]  the choices, for a choice standing on its own or a set
 * @property {number} [min]  the least a number may be
 * @property {number} [max]  the greatest a number may be
 * @property {string} [method]  the estimation method a computed value is read by, from `risk.js`
 * @property {string} [relationship]  the relationship type a related attribute lists, from the metamodel
 */

/**
 * @typedef {Object} AttributeGroup
 * @property {string} name
 * @property {boolean} [tab]
 * @property {{ key: string, value: string }} [when]
 * @property {AttributeDefinition[]} attributes
 * @property {AttributeGroup[]} [groups]  sub-groups, one level deep
 */

/**
 * @typedef {Object} TypeAttributes
 * @property {AttributeDefinition[]} attributes  the ungrouped definitions, always expanded
 * @property {AttributeGroup[]} groups  the named groups, in render order
 */

/** @type {Object<string, TypeAttributes>} */
export const ATTRIBUTES = {
  ELM: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  ACT: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  TSK: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  PHS: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  LEG: {
    attributes: [
      { key: 'reference', name: 'Reference', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'link', name: 'Link', kind: 'hyperlink' },
    ],
    groups: [
      {
        name: 'Applicability',
        tab: true,
        attributes: [
          { key: 'applicable', name: 'Applicable', kind: 'choice', values: ['Yes', 'No'] },
          { key: 'rationale', name: 'Rationale', kind: 'multiline' },
        ],
      },
      {
        name: 'Notes',
        tab: true,
        attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }],
      },
    ],
  },
  HST: {
    attributes: [
      { key: 'reference', name: 'Reference', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'link', name: 'Link', kind: 'hyperlink' },
    ],
    groups: [
      {
        name: 'Applicability',
        tab: true,
        attributes: [
          { key: 'applicable', name: 'Applicable', kind: 'choice', values: ['Yes', 'No'] },
          { key: 'rationale', name: 'Rationale', kind: 'multiline' },
        ],
      },
      { name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] },
    ],
  },
  OSP: {
    attributes: [
      { key: 'reference', name: 'Reference', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'link', name: 'Link', kind: 'hyperlink' },
    ],
    groups: [
      {
        name: 'Applicability',
        tab: true,
        attributes: [
          { key: 'applicable', name: 'Applicable', kind: 'choice', values: ['Yes', 'No'] },
          { key: 'rationale', name: 'Rationale', kind: 'multiline' },
        ],
      },
      { name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] },
    ],
  },
  CAS: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  NTB: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  HAZ: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  SCN: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'hazardZone', name: 'Hazard zone', kind: 'text' },
      { key: 'hazardousEvent', name: 'Hazardous event', kind: 'multiline' },
      { key: 'consequence', name: 'Potential consequence', kind: 'multiline' },
    ],
    groups: [
      {
        name: 'Risk',
        tab: true,
        attributes: [{ key: 'standard', name: 'Estimation standard', kind: 'choice', values: ['ISO/TR 14121-2'] }],
        groups: [
          {
            name: 'Estimation method',
            when: { key: 'standard', value: 'ISO/TR 14121-2' },
            attributes: [{ key: 'method', name: 'Estimation method', kind: 'choice', values: ['Risk matrix', 'Risk graph', 'Numerical scoring', 'Hybrid tool'] }],
          },
          {
            name: 'Initial risk',
            when: { key: 'method', value: 'Risk matrix' },
            attributes: [
              { key: 'initialSeverity', name: 'Severity of harm', kind: 'choice', values: ['Catastrophic', 'Serious', 'Moderate', 'Minor'] },
              { key: 'initialProbability', name: 'Probability of occurrence of harm', kind: 'choice', values: ['Very likely', 'Likely', 'Unlikely', 'Remote'] },
              { key: 'initialLevel', name: 'Risk level', kind: 'computed', method: 'Risk matrix' },
            ],
          },
          {
            name: 'Initial risk',
            when: { key: 'method', value: 'Risk graph' },
            attributes: [
              { key: 'initialS', name: 'Severity of harm', kind: 'choice', values: ['S1', 'S2'] },
              { key: 'initialF', name: 'Frequency and duration of exposure', kind: 'choice', values: ['F1', 'F2'] },
              { key: 'initialO', name: 'Probability of occurrence of a hazardous event', kind: 'choice', values: ['O1', 'O2', 'O3'] },
              { key: 'initialA', name: 'Possibility of avoidance', kind: 'choice', values: ['A1', 'A2'] },
              { key: 'initialIndex', name: 'Risk index', kind: 'computed', method: 'Risk graph' },
            ],
          },
          {
            name: 'Initial risk',
            when: { key: 'method', value: 'Numerical scoring' },
            attributes: [
              { key: 'initialSeverityScore', name: 'Severity score', kind: 'number', min: 0, max: 100 },
              { key: 'initialProbabilityScore', name: 'Probability score', kind: 'number', min: 0, max: 100 },
              { key: 'initialScore', name: 'Risk score', kind: 'computed', method: 'Numerical scoring' },
            ],
          },
          {
            name: 'Initial risk',
            when: { key: 'method', value: 'Hybrid tool' },
            attributes: [
              { key: 'initialSe', name: 'Severity Se', kind: 'choice', values: ['Se 1', 'Se 2', 'Se 3', 'Se 4'] },
              { key: 'initialFr', name: 'Frequency Fr', kind: 'choice', values: ['Fr 2', 'Fr 3', 'Fr 4', 'Fr 5'] },
              { key: 'initialPr', name: 'Probability Pr', kind: 'choice', values: ['Pr 1', 'Pr 2', 'Pr 3', 'Pr 4', 'Pr 5'] },
              { key: 'initialAv', name: 'Avoidance Av', kind: 'choice', values: ['Av 1', 'Av 3', 'Av 5'] },
              { key: 'initialClass', name: 'Class and risk', kind: 'computed', method: 'Hybrid tool' },
            ],
          },
          {
            name: 'Residual risk',
            when: { key: 'method', value: 'Risk matrix' },
            attributes: [
              { key: 'residualSeverity', name: 'Severity of harm', kind: 'choice', values: ['Catastrophic', 'Serious', 'Moderate', 'Minor'] },
              { key: 'residualProbability', name: 'Probability of occurrence of harm', kind: 'choice', values: ['Very likely', 'Likely', 'Unlikely', 'Remote'] },
              { key: 'residualLevel', name: 'Risk level', kind: 'computed', method: 'Risk matrix' },
            ],
          },
          {
            name: 'Residual risk',
            when: { key: 'method', value: 'Risk graph' },
            attributes: [
              { key: 'residualS', name: 'Severity of harm', kind: 'choice', values: ['S1', 'S2'] },
              { key: 'residualF', name: 'Frequency and duration of exposure', kind: 'choice', values: ['F1', 'F2'] },
              { key: 'residualO', name: 'Probability of occurrence of a hazardous event', kind: 'choice', values: ['O1', 'O2', 'O3'] },
              { key: 'residualA', name: 'Possibility of avoidance', kind: 'choice', values: ['A1', 'A2'] },
              { key: 'residualIndex', name: 'Risk index', kind: 'computed', method: 'Risk graph' },
            ],
          },
          {
            name: 'Residual risk',
            when: { key: 'method', value: 'Numerical scoring' },
            attributes: [
              { key: 'residualSeverityScore', name: 'Severity score', kind: 'number', min: 0, max: 100 },
              { key: 'residualProbabilityScore', name: 'Probability score', kind: 'number', min: 0, max: 100 },
              { key: 'residualScore', name: 'Risk score', kind: 'computed', method: 'Numerical scoring' },
            ],
          },
          {
            name: 'Residual risk',
            when: { key: 'method', value: 'Hybrid tool' },
            attributes: [
              { key: 'residualSe', name: 'Severity Se', kind: 'choice', values: ['Se 1', 'Se 2', 'Se 3', 'Se 4'] },
              { key: 'residualFr', name: 'Frequency Fr', kind: 'choice', values: ['Fr 2', 'Fr 3', 'Fr 4', 'Fr 5'] },
              { key: 'residualPr', name: 'Probability Pr', kind: 'choice', values: ['Pr 1', 'Pr 2', 'Pr 3', 'Pr 4', 'Pr 5'] },
              { key: 'residualAv', name: 'Avoidance Av', kind: 'choice', values: ['Av 1', 'Av 3', 'Av 5'] },
              { key: 'residualClass', name: 'Class and risk', kind: 'computed', method: 'Hybrid tool' },
            ],
          },
          {
            name: 'Protective measures',
            attributes: [{ key: 'measures', name: 'Measures in place for the residual risk', kind: 'related', relationship: 'prm-reduces-risk-of-scn' }],
          },
        ],
      },
      { name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] },
    ],
  },
  PRM: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  SAF: {
    attributes: [
      { key: 'reference', name: 'Designation', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Brief description', kind: 'multiline' },
      { key: 'relevantStandards', name: 'Relevant standards', kind: 'multiline' },
    ],
    groups: [
      {
        name: 'Behaviour',
        tab: true,
        attributes: [
          { key: 'priority', name: 'Priority', kind: 'text' },
          { key: 'operatingMode', name: 'Operating mode', kind: 'text' },
          { key: 'trigger', name: 'Triggering event', kind: 'multiline' },
          { key: 'reaction', name: 'Safety-related reaction', kind: 'multiline' },
          { key: 'safeState', name: 'Intended safe state', kind: 'multiline' },
          { key: 'restart', name: 'Restart conditions', kind: 'multiline' },
        ],
      },
      {
        name: 'Faults',
        tab: true,
        attributes: [
          { key: 'faultDetection', name: 'Fault detection', kind: 'multiline' },
          { key: 'faultHandling', name: 'Reaction to faults', kind: 'multiline' },
          { key: 'faultIndication', name: 'Fault indication', kind: 'multiline' },
          { key: 'powerLoss', name: 'Power loss behaviour', kind: 'multiline' },
        ],
      },
      {
        name: 'Characteristics',
        tab: true,
        attributes: [
          { key: 'standard', name: 'Design standard', kind: 'choice', values: ['EN ISO 13849-1', 'EN IEC 62061'] },
          { key: 'responseTime', name: 'Demand response time', kind: 'text' },
          { key: 'faultReactionTime', name: 'Fault reaction time', kind: 'text' },
          { key: 'demandRate', name: 'Demand rate', kind: 'text' },
          {
            key: 'technology',
            name: 'Technology',
            kind: 'set',
            values: ['Mechanical', 'Hydraulic', 'Pneumatic', 'Electrical', 'Electronic', 'Software'],
          },
          { key: 'interfaces', name: 'Specific interfaces', kind: 'multiline' },
        ],
        groups: [
          {
            name: 'Integrity level',
            when: { key: 'standard', value: 'EN ISO 13849-1' },
            attributes: [
              { key: 'plS', name: 'Severity of injury', kind: 'choice', values: ['S1', 'S2'] },
              { key: 'plF', name: 'Frequency and exposure', kind: 'choice', values: ['F1', 'F2'] },
              { key: 'plP', name: 'Possibility of avoidance', kind: 'choice', values: ['P1', 'P2'] },
              { key: 'plO', name: 'Probability of occurrence', kind: 'choice', values: ['High', 'Low'] },
              { key: 'plr', name: 'Required performance level', kind: 'computed', method: 'PL risk graph' },
            ],
          },
          {
            name: 'Integrity level',
            when: { key: 'standard', value: 'EN IEC 62061' },
            attributes: [
              { key: 'silSe', name: 'Severity Se', kind: 'choice', values: ['Se 1', 'Se 2', 'Se 3', 'Se 4'] },
              { key: 'silFr', name: 'Frequency Fr', kind: 'choice', values: ['Fr 1', 'Fr 2', 'Fr 3', 'Fr 4', 'Fr 5'] },
              { key: 'silPr', name: 'Probability Pr', kind: 'choice', values: ['Pr 1', 'Pr 2', 'Pr 3', 'Pr 4', 'Pr 5'] },
              { key: 'silAv', name: 'Avoidance Av', kind: 'choice', values: ['Av 1', 'Av 3', 'Av 5'] },
              { key: 'sil', name: 'Required safety integrity level', kind: 'computed', method: 'SIL matrix' },
            ],
          },
        ],
      },
      { name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] },
    ],
  },
  ESR: {
    attributes: [
      { key: 'reference', name: 'Reference', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'requirement', name: 'Requirement', kind: 'multiline' },
    ],
    groups: [
      {
        name: 'Applicability',
        tab: true,
        attributes: [
          { key: 'applicable', name: 'Applicable', kind: 'choice', values: ['Yes', 'No'] },
          { key: 'rationale', name: 'Rationale', kind: 'multiline' },
        ],
      },
      {
        name: 'Notes',
        tab: true,
        attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }],
      },
    ],
  },
  HSR: {
    attributes: [
      { key: 'reference', name: 'Reference', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'requirement', name: 'Requirement', kind: 'multiline' },
    ],
    groups: [
      {
        name: 'Applicability',
        tab: true,
        attributes: [
          { key: 'applicable', name: 'Applicable', kind: 'choice', values: ['Yes', 'No'] },
          { key: 'rationale', name: 'Rationale', kind: 'multiline' },
        ],
      },
      { name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] },
    ],
  },
  OSR: {
    attributes: [
      { key: 'reference', name: 'Reference', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'requirement', name: 'Requirement', kind: 'multiline' },
    ],
    groups: [
      {
        name: 'Applicability',
        tab: true,
        attributes: [
          { key: 'applicable', name: 'Applicable', kind: 'choice', values: ['Yes', 'No'] },
          { key: 'rationale', name: 'Rationale', kind: 'multiline' },
        ],
      },
      { name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] },
    ],
  },
  REQ: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  VER: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
};

/** A group's definitions in render order: its own table, then each sub-group's. */
const groupAttributes = (group) => [...group.attributes, ...(group.groups ?? []).flatMap(groupAttributes)];

/**
 * Every group of a type in render order, sub-groups following their group.
 * @param {string} code
 * @returns {AttributeGroup[]}
 */
export function groupsOf(code) {
  const walk = (group) => [group, ...(group.groups ?? []).flatMap(walk)];
  return (ATTRIBUTES[code]?.groups ?? []).flatMap(walk);
}

/**
 * Every definition of a type in render order: the ungrouped table first,
 * then each group's, its sub-groups' after its own. Empty for a type the
 * document does not define.
 * @param {string} code
 * @returns {AttributeDefinition[]}
 */
export function attributesFor(code) {
  if (!Object.hasOwn(ATTRIBUTES, code)) return [];
  const type = ATTRIBUTES[code];
  return [...type.attributes, ...type.groups.flatMap(groupAttributes)];
}
