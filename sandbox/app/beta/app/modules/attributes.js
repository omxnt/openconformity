/**
 * The attribute definitions per entity type, transcribed from
 * `sandbox/app/beta/notes/attributes.md` — the working draft that supersedes
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

/** @typedef {'text'|'multiline'|'choice'|'set'|'hyperlink'|'number'|'date'|'table'|'drawing'|'computed'|'rationale'} AttributeKind */

/**
 * @typedef {Object} AttributeDefinition
 * @property {string} key
 * @property {string} name
 * @property {AttributeKind} kind
 * @property {string[]} [values]  the choices, for a choice standing on its own or a set
 * @property {number} [min]  the least a number may be
 * @property {number} [max]  the greatest a number may be
 * @property {string} [method]  the estimation method a computed value is read by, from `risk.js`
 * @property {Array<{ key: string, name: string, kind: 'text'|'multiline'|'date'|'choice'|'number', values?: string[] }>} [columns]  a table's columns, in order
 * @property {string} [help]  a sentence or two shown on the information glyph beside the name
 * @property {string} [parameter]  the parameter a rationale is given for, by key, within the same rating
 */

/**
 * @typedef {Object} AttributeGroup
 * @property {string} name
 * @property {boolean} [tab]
 * @property {{ key: string, value: string }} [when]
 * @property {string} [after]  the attribute of the group a sub-group stands after, where not the one it waits on
 * @property {AttributeDefinition[]} attributes
 * @property {AttributeGroup[]} [groups]  sub-groups, one level deep
 */

/**
 * @typedef {Object} TypeAttributes
 * @property {AttributeDefinition[]} attributes  the ungrouped definitions, always expanded
 * @property {AttributeGroup[]} groups  the named groups, in render order
 */

/** @type {Object<string, TypeAttributes>} */
/**
 * The help a name shared by several types carries on every cell of that
 * name, recorded once, as §1.9 of the document has it; a definition's
 * own help stands instead where it has one.
 * @type {Object<string, string>}
 */
export const SHARED_HELP = {
  Identifier: "Assigned by the tool from the entity type's code and a running number, never changed and never reused.",
  Designation: 'A short name of your own, shown in the label before the title.',
  Notes: 'Anything worth keeping that no field holds, such as how something was assessed.',
  Link: 'Where it is published online.',
  Applicable: 'Whether it applies to this product.',
  Rationale: 'Why it applies, or why not.',
  Drawing: 'A picture of it, drawn in draw.io and shown as an image.',
  'Initial risk estimation': 'The risk before protective measures, estimated by the method chosen or typed where none is.',
  'Residual risk estimation': 'The risk with the protective measures in place, estimated by the method chosen or typed where none is.',
  'Required integrity level': "The level the safety function must reach, in its standard's own terms.",
};

/** The Drawing tab three types carry: one picture, held as SVG text and shown as an image. */
const drawingTab = () => ({ name: 'Drawing', tab: true, attributes: [{ key: 'drawing', name: 'Drawing', kind: 'drawing' }] });

export const ATTRIBUTES = {
  ELM: {
    attributes: [
      { key: 'reference', name: 'Designation', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text', help: "The name of the system element." },
      { key: 'description', name: 'Description', kind: 'multiline', help: 'What the system element is and what it does in the machinery.' },
    ],
    groups: [drawingTab(), { name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  ACT: {
    attributes: [
      { key: 'reference', name: 'Designation', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text', help: "The name or role of the system actor." },
      { key: 'description', name: 'Description', kind: 'multiline', help: 'Who the system actor is and how they interact with the machinery.' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  TSK: {
    attributes: [
      { key: 'reference', name: 'Designation', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text', help: "The name of the system task." },
      { key: 'description', name: 'Description', kind: 'multiline', help: 'What is done in the system task, and on which part of the machinery.' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  PHS: {
    attributes: [
      { key: 'reference', name: 'Designation', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text', help: "The name of the system phase." },
      { key: 'description', name: 'Description', kind: 'multiline', help: 'What happens to the machinery in the system phase.' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  LEG: {
    attributes: [
      { key: 'reference', name: 'Reference', kind: 'text', help: "The official number of the legislation, as cited." },
      { key: 'title', name: 'Title', kind: 'text', help: "The title of the legislation." },
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
      { key: 'reference', name: 'Reference', kind: 'text', help: "The designation of the standard, as cited." },
      { key: 'title', name: 'Title', kind: 'text', help: "The title of the standard, as published." },
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
      { key: 'reference', name: 'Reference', kind: 'text', help: "The number or designation of the specification, as cited." },
      { key: 'title', name: 'Title', kind: 'text', help: "The title of the specification." },
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
      { key: 'reference', name: 'Designation', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text', help: "The name of the conformity assessment procedure." },
      { key: 'description', name: 'Description', kind: 'multiline', help: 'What the conformity assessment involves for this product.' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  NTB: {
    attributes: [
      { key: 'reference', name: 'Designation', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text', help: "The name of the notified body." },
      { key: 'description', name: 'Description', kind: 'multiline', help: "The role of the notified body for this product." },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  HAZ: {
    attributes: [
      { key: 'reference', name: 'Designation', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text', help: "The name of the hazard." },
      { key: 'description', name: 'Description', kind: 'multiline', help: 'Where the hazard arises and how it could cause harm.' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  SCN: {
    attributes: [
      { key: 'reference', name: 'Designation', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text', help: "The name of the accident scenario." },
      { key: 'hazardousEvent', name: 'Hazardous event', kind: 'multiline', help: 'What goes wrong in the accident scenario and sets the harm in motion.' },
      { key: 'consequence', name: 'Potential consequence', kind: 'multiline', help: 'The harm the accident scenario could result in.' },
    ],
    groups: [
      {
        name: 'Risk',
        tab: true,
        attributes: [],
        groups: [
          {
            name: 'Initial risk estimation',
            when: { key: 'estimationMethod', value: 'Risk matrix (ISO/TR 14121-2:2012, 6.2.2)' },
            attributes: [
              { key: 'initialSeverity', name: 'Severity', kind: 'choice', values: ['Catastrophic', 'Serious', 'Moderate', 'Minor'] },
              { key: 'initialSeverityRationale', name: 'Severity rationale', kind: 'rationale', parameter: 'initialSeverity' },
              { key: 'initialProbability', name: 'Probability', kind: 'choice', values: ['Very likely', 'Likely', 'Unlikely', 'Remote'] },
              { key: 'initialProbabilityRationale', name: 'Probability rationale', kind: 'rationale', parameter: 'initialProbability' },
              { key: 'initialLevel', name: 'Risk level', kind: 'computed', method: 'Risk matrix (ISO/TR 14121-2:2012, 6.2.2)' },
            ],
          },
          {
            name: 'Initial risk estimation',
            when: { key: 'estimationMethod', value: 'Risk graph (ISO/TR 14121-2:2012, 6.3.2)' },
            attributes: [
              { key: 'initialS', name: 'Severity', kind: 'choice', values: ['S1', 'S2'] },
              { key: 'initialSRationale', name: 'Severity rationale', kind: 'rationale', parameter: 'initialS' },
              { key: 'initialF', name: 'Exposure', kind: 'choice', values: ['F1', 'F2'] },
              { key: 'initialFRationale', name: 'Exposure rationale', kind: 'rationale', parameter: 'initialF' },
              { key: 'initialO', name: 'Occurrence', kind: 'choice', values: ['O1', 'O2', 'O3'] },
              { key: 'initialORationale', name: 'Occurrence rationale', kind: 'rationale', parameter: 'initialO' },
              { key: 'initialA', name: 'Avoidance', kind: 'choice', values: ['A1', 'A2'] },
              { key: 'initialARationale', name: 'Avoidance rationale', kind: 'rationale', parameter: 'initialA' },
              { key: 'initialIndex', name: 'Risk index', kind: 'computed', method: 'Risk graph (ISO/TR 14121-2:2012, 6.3.2)' },
            ],
          },
          {
            name: 'Initial risk estimation',
            when: { key: 'estimationMethod', value: 'Numerical scoring (ISO/TR 14121-2:2012, 6.4.2)' },
            attributes: [
              { key: 'initialSeverityScore', name: 'Severity score', kind: 'number', min: 0, max: 100 },
              { key: 'initialSeverityScoreRationale', name: 'Severity rationale', kind: 'rationale', parameter: 'initialSeverityScore' },
              { key: 'initialProbabilityScore', name: 'Probability score', kind: 'number', min: 0, max: 100 },
              { key: 'initialProbabilityScoreRationale', name: 'Probability rationale', kind: 'rationale', parameter: 'initialProbabilityScore' },
              { key: 'initialScore', name: 'Risk score', kind: 'computed', method: 'Numerical scoring (ISO/TR 14121-2:2012, 6.4.2)' },
            ],
          },
          {
            name: 'Initial risk estimation',
            when: { key: 'estimationMethod', value: '' },
            attributes: [{ key: 'initialRating', name: 'Initial risk estimation', kind: 'text' }],
          },
          {
            name: 'Residual risk estimation',
            when: { key: 'estimationMethod', value: 'Risk matrix (ISO/TR 14121-2:2012, 6.2.2)' },
            attributes: [
              { key: 'residualSeverity', name: 'Severity', kind: 'choice', values: ['Catastrophic', 'Serious', 'Moderate', 'Minor'] },
              { key: 'residualSeverityRationale', name: 'Severity rationale', kind: 'rationale', parameter: 'residualSeverity' },
              { key: 'residualProbability', name: 'Probability', kind: 'choice', values: ['Very likely', 'Likely', 'Unlikely', 'Remote'] },
              { key: 'residualProbabilityRationale', name: 'Probability rationale', kind: 'rationale', parameter: 'residualProbability' },
              { key: 'residualLevel', name: 'Risk level', kind: 'computed', method: 'Risk matrix (ISO/TR 14121-2:2012, 6.2.2)' },
            ],
          },
          {
            name: 'Residual risk estimation',
            when: { key: 'estimationMethod', value: 'Risk graph (ISO/TR 14121-2:2012, 6.3.2)' },
            attributes: [
              { key: 'residualS', name: 'Severity', kind: 'choice', values: ['S1', 'S2'] },
              { key: 'residualSRationale', name: 'Severity rationale', kind: 'rationale', parameter: 'residualS' },
              { key: 'residualF', name: 'Exposure', kind: 'choice', values: ['F1', 'F2'] },
              { key: 'residualFRationale', name: 'Exposure rationale', kind: 'rationale', parameter: 'residualF' },
              { key: 'residualO', name: 'Occurrence', kind: 'choice', values: ['O1', 'O2', 'O3'] },
              { key: 'residualORationale', name: 'Occurrence rationale', kind: 'rationale', parameter: 'residualO' },
              { key: 'residualA', name: 'Avoidance', kind: 'choice', values: ['A1', 'A2'] },
              { key: 'residualARationale', name: 'Avoidance rationale', kind: 'rationale', parameter: 'residualA' },
              { key: 'residualIndex', name: 'Risk index', kind: 'computed', method: 'Risk graph (ISO/TR 14121-2:2012, 6.3.2)' },
            ],
          },
          {
            name: 'Residual risk estimation',
            when: { key: 'estimationMethod', value: 'Numerical scoring (ISO/TR 14121-2:2012, 6.4.2)' },
            attributes: [
              { key: 'residualSeverityScore', name: 'Severity score', kind: 'number', min: 0, max: 100 },
              { key: 'residualSeverityScoreRationale', name: 'Severity rationale', kind: 'rationale', parameter: 'residualSeverityScore' },
              { key: 'residualProbabilityScore', name: 'Probability score', kind: 'number', min: 0, max: 100 },
              { key: 'residualProbabilityScoreRationale', name: 'Probability rationale', kind: 'rationale', parameter: 'residualProbabilityScore' },
              { key: 'residualScore', name: 'Risk score', kind: 'computed', method: 'Numerical scoring (ISO/TR 14121-2:2012, 6.4.2)' },
            ],
          },
          {
            name: 'Residual risk estimation',
            when: { key: 'estimationMethod', value: '' },
            attributes: [{ key: 'residualRating', name: 'Residual risk estimation', kind: 'text' }],
          },
          {
            name: 'Risk evaluation',
            attributes: [{ key: 'evaluation', name: 'Risk evaluation', kind: 'multiline', help: "Your judgement whether the accident scenario's residual risk is acceptable, and why." }],
          },
        ],
      },
      { name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] },
    ],
  },
  PRM: {
    attributes: [
      { key: 'reference', name: 'Designation', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text', help: "The name of the protective measure." },
      { key: 'description', name: 'Description', kind: 'multiline', help: 'What the protective measure is and how it reduces the risk.' },
    ],
    groups: [drawingTab(), { name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  SAF: {
    attributes: [
      { key: 'reference', name: 'Designation', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text', help: "The name of the safety function." },
      { key: 'description', name: 'Description', kind: 'multiline', help: 'What the safety function is for.' },
    ],
    groups: [
      {
        name: 'Behaviour',
        tab: true,
        attributes: [
          { key: 'priority', name: 'Priority', kind: 'text', help: "The priority of the safety function when functions conflict." },
          { key: 'operatingMode', name: 'Operating mode', kind: 'text', help: 'The operating modes in which the safety function is active.' },
          { key: 'trigger', name: 'Triggering event', kind: 'multiline', help: 'What starts the safety function.' },
          { key: 'reaction', name: 'Safety-related reaction', kind: 'multiline', help: 'What the safety function does when triggered to reach the safe state.' },
          { key: 'safeState', name: 'Intended safe state', kind: 'multiline', help: 'The state the safety function brings the machinery to.' },
          { key: 'feedback', name: 'Operator feedback', kind: 'multiline', help: 'How the safety function makes itself known to the operator, such as lights, messages or sounds.' },
          { key: 'muting', name: 'Muting or override', kind: 'multiline', help: 'Whether and how the safety function can be suspended, muted or overridden, and under what conditions.' },
          { key: 'restart', name: 'Restart conditions', kind: 'multiline', help: 'What must hold before the safety function resets and operation resumes.' },
        ],
      },
      {
        name: 'Characteristics',
        tab: true,
        attributes: [
          {
            key: 'standard',
            name: 'Functional safety standard',
            kind: 'choice',
            values: ['EN ISO 13849-1:2023', 'EN IEC 62061:2021'],
            help: 'The standard the safety function is designed to, which sets the levels offered, or none to type the level freely.',
          },
          { key: 'designTargets', name: 'Specific design targets', kind: 'multiline', help: "What the standard requires of the safety function's design beyond the level, such as a structure, a fault tolerance, a failure rate or a software level, in its own terms." },
          { key: 'responseTime', name: 'Response time', kind: 'text', help: "How long from a demand to the safety function's output." },
          { key: 'stoppingTime', name: 'Stopping time', kind: 'text', help: "How long from the safety function's output until hazardous motion has stopped." },
          {
            key: 'technology',
            name: 'Implementing technology',
            kind: 'set',
            values: ['Mechanical', 'Hydraulic', 'Pneumatic', 'Electrical', 'Electronic', 'Optoelectronic', 'Software', 'Configurable', 'Networked', 'Wireless'],
            help: 'The technologies the safety function is built with, each a heading for the design and the requirements that follow.',
          },
          { key: 'interfaces', name: 'External interfaces', kind: 'multiline', help: 'The signals and services the safety function exchanges with other functions or systems.' },
          { key: 'independence', name: 'Independence and separation', kind: 'multiline', help: 'What the safety function must keep independent of, or separated from, the nominal control or other functions, and how.' },
          { key: 'defeating', name: 'Measures against defeating', kind: 'multiline', help: 'How the safety function resists being bypassed, disabled or fooled, whether on purpose or by mistake.' },
          { key: 'environment', name: 'Environmental conditions', kind: 'multiline', help: 'The conditions the parts carrying the safety function must work in.' },
        ],
        groups: [
          {
            name: 'Required integrity level',
            when: { key: 'standard', value: 'EN ISO 13849-1:2023' },
            attributes: [{ key: 'plr', name: 'Required integrity level', kind: 'choice', values: ['PL a', 'PL b', 'PL c', 'PL d', 'PL e'] }],
          },
          {
            name: 'Required integrity level',
            when: { key: 'standard', value: 'EN IEC 62061:2021' },
            attributes: [{ key: 'sil', name: 'Required integrity level', kind: 'choice', values: ['SIL 1', 'SIL 2', 'SIL 3'] }],
          },
          {
            name: 'Required integrity level',
            when: { key: 'standard', value: '' },
            attributes: [{ key: 'ownLevel', name: 'Required integrity level', kind: 'text' }],
          },
        ],
      },
      {
        name: 'Fault handling',
        tab: true,
        attributes: [
          { key: 'faultsDetected', name: 'Faults to be detected', kind: 'multiline', help: "Which faults in the safety function's parts must not go unnoticed." },
          { key: 'detectionMeans', name: 'Means of detection', kind: 'multiline', help: 'How those faults are found and how often, such as by monitoring, checks or tests.' },
          { key: 'faultHandling', name: 'Fault reaction', kind: 'multiline', help: 'What the safety function does once a fault is found and the state it brings the machinery to, for any fault or fault by fault.' },
          { key: 'faultDetectionTime', name: 'Fault detection time', kind: 'text', help: 'How long from a fault occurring to its detection.' },
          { key: 'faultReactionTime', name: 'Fault reaction time', kind: 'text', help: 'How long from detection until the machinery reaches the state the reaction brings it to, stopping included.' },
          { key: 'faultIndication', name: 'Fault indication', kind: 'multiline', help: 'How a found fault is made known.' },
          { key: 'faultRecovery', name: 'Fault recovery', kind: 'multiline', help: 'Whether a fault latches or clears itself, when and how it may be reset, and how the safety function returns to service.' },
          { key: 'powerDisturbances', name: 'Power disturbances', kind: 'multiline', help: 'What the safety function does when its supply goes, returns or fluctuates.' },
        ],
      },
      drawingTab(),
      { name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] },
    ],
  },
  ESR: {
    attributes: [
      { key: 'reference', name: 'Reference', kind: 'text', help: 'The clause number of the essential requirement within the legislation.' },
      { key: 'title', name: 'Title', kind: 'text', help: "The heading of the essential requirement." },
      { key: 'requirement', name: 'Requirement', kind: 'multiline', help: 'The essential requirement as the legislation states it.' },
    ],
    groups: [
      {
        name: 'Guidance',
        tab: true,
        attributes: [
          { key: 'guidanceSource', name: 'Source', kind: 'text', help: 'Where the guidance comes from, such as an official guide, a standard, a commentary or yourself.' },
          { key: 'guidanceSection', name: 'Section', kind: 'text', help: 'The section of the source the guidance is taken from.' },
          { key: 'guidance', name: 'Guidance', kind: 'multiline', help: "How to read and meet the essential requirement, whether a guide's advice, a commentary's or your own interpretation." },
        ],
      },
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
      { key: 'reference', name: 'Reference', kind: 'text', help: 'The clause number of the harmonised requirement within the standard.' },
      { key: 'title', name: 'Title', kind: 'text', help: "The heading of the harmonised requirement." },
      { key: 'requirement', name: 'Requirement', kind: 'multiline', help: "The harmonised requirement in your own words, since a standard's text is copyrighted." },
    ],
    groups: [
      {
        name: 'Guidance',
        tab: true,
        attributes: [
          { key: 'guidanceSource', name: 'Source', kind: 'text', help: 'Where the guidance comes from, such as an official guide, a standard, a commentary or yourself.' },
          { key: 'guidanceSection', name: 'Section', kind: 'text', help: 'The section of the source the guidance is taken from.' },
          { key: 'guidance', name: 'Guidance', kind: 'multiline', help: "How to read and meet the harmonised requirement, whether a guide's advice, a commentary's or your own interpretation." },
        ],
      },
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
      { key: 'reference', name: 'Reference', kind: 'text', help: 'The clause number of the requirement within the specification.' },
      { key: 'title', name: 'Title', kind: 'text', help: "The heading of the requirement." },
      { key: 'requirement', name: 'Requirement', kind: 'multiline', help: 'The requirement as the specification states it.' },
    ],
    groups: [
      {
        name: 'Guidance',
        tab: true,
        attributes: [
          { key: 'guidanceSource', name: 'Source', kind: 'text', help: 'Where the guidance comes from, such as an official guide, a standard, a commentary or yourself.' },
          { key: 'guidanceSection', name: 'Section', kind: 'text', help: 'The section of the source the guidance is taken from.' },
          { key: 'guidance', name: 'Guidance', kind: 'multiline', help: "How to read and meet the requirement, whether a guide's advice, a commentary's or your own interpretation." },
        ],
      },
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
      { key: 'reference', name: 'Designation', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text', help: "The name of the system requirement." },
      { key: 'type', name: 'Type', kind: 'choice', values: ['Function/Performance', 'Fit/Operational', 'Form', 'Quality', 'Compliance'], help: 'The kind of requirement, whether what the system does and how well, how it fits and operates with its surroundings, its physical form, its qualities, or what it must comply with.' },
      { key: 'verificationMethod', name: 'Verification method', kind: 'choice', values: ['Inspection', 'Analysis', 'Demonstration', 'Test'], help: 'How the system requirement is to be verified.' },
      { key: 'description', name: 'Requirement', kind: 'multiline', help: 'What the system must do or be.' },
      { key: 'rationale', name: 'Rationale', kind: 'multiline', help: 'Why the system requirement exists.' },
    ],
    groups: [{ name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] }],
  },
  VER: {
    attributes: [
      { key: 'reference', name: 'Designation', kind: 'text' },
      { key: 'title', name: 'Title', kind: 'text', help: "The name of the system verification." },
      { key: 'method', name: 'Verification method', kind: 'choice', values: ['Inspection', 'Analysis', 'Demonstration', 'Test'], help: 'How the system verification is carried out.' },
      { key: 'responsible', name: 'Responsible party', kind: 'text', help: 'Who carries out the system verification, whether a person, a department or an organisation.' },
      { key: 'setup', name: 'Verification setup', kind: 'multiline', help: 'The configuration, environment and tools the system verification is carried out with.' },
      { key: 'description', name: 'Verification procedure', kind: 'multiline', help: 'What is done in the system verification, step by step.' },
      { key: 'acceptanceCriteria', name: 'Acceptance criteria', kind: 'multiline', help: 'What counts as passing the system verification.' },
    ],
    groups: [
      {
        name: 'Result',
        tab: true,
        attributes: [
          {
            key: 'runs',
            name: 'Runs',
            kind: 'table',
            columns: [
              { key: 'date', name: 'Date', kind: 'date' },
              { key: 'by', name: 'By', kind: 'text' },
              { key: 'result', name: 'Result', kind: 'choice', values: ['Passed', 'Failed'] },
              { key: 'remarks', name: 'Remarks', kind: 'multiline' },
            ],
            help: 'Each time the system verification was carried out, as a row: when and by whom, whether it met its acceptance criteria, and remarks, among them the record the result rests on.',
          },
        ],
      },
      { name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] },
    ],
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
  return (typeOf(code)?.groups ?? []).flatMap(walk);
}

/** Whether a definition closes a rating: computed, never stored. */
export const isOutcome = (definition) => definition.kind === 'computed';

/** Whether a definition is the rationale for a rating's parameter. */
export const isRationale = (definition) => definition.kind === 'rationale';

/** Whether a definition of a rating is one of its parameters: neither what it comes to nor a rationale. */
export const isParameter = (definition) => !isOutcome(definition) && !isRationale(definition);

/** A type's definition by code, the project's under PROJECT, null for a code the document does not define. */
export function typeOf(code) {
  if (code === 'PROJECT') return PROJECT;
  return Object.hasOwn(ATTRIBUTES, code) ? ATTRIBUTES[code] : null;
}

/**
 * The project's own attributes, as §1.10 of the document has them: the
 * project and its revision on the first tab, the methods every scenario
 * and safety function reads through its project attributes, and the
 * notes. The name is the model's own and stands among the first, as a
 * row of its own after the designation and the organisation.
 * @type {{ attributes: AttributeDefinition[], groups: AttributeGroup[] }}
 */
export const PROJECT = {
  attributes: [
    { key: 'designation', name: 'Designation', kind: 'text', help: 'A short name or number of your own for the project.' },
    { key: 'organisation', name: 'Organisation', kind: 'text', help: 'Who the project is done by, or for.' },
    { key: 'description', name: 'Description', kind: 'multiline', help: 'What the project covers.' },
    { key: 'version', name: 'Version', kind: 'text', help: 'The revision this file is, as you number it.' },
    { key: 'date', name: 'Date', kind: 'date', help: 'When this revision was made.' },
    { key: 'author', name: 'Author', kind: 'text', help: 'Who prepared this revision.' },
    { key: 'role', name: 'Role', kind: 'text', help: 'The capacity in which the author prepared it.' },
    { key: 'changes', name: 'Changes', kind: 'multiline', help: 'What changed in this revision since the last.' },
  ],
  groups: [
    {
      name: 'Settings',
      tab: true,
      attributes: [
        {
          key: 'estimationMethod',
          name: 'Risk estimation method',
          kind: 'choice',
          values: ['Risk matrix (ISO/TR 14121-2:2012, 6.2.2)', 'Risk graph (ISO/TR 14121-2:2012, 6.3.2)', 'Numerical scoring (ISO/TR 14121-2:2012, 6.4.2)'],
          help: "The method every scenario's initial and residual risk is rated by, or none to type them freely. Changing it removes the ratings made under the old one.",
        },
      ],
    },
    { name: 'Notes', tab: true, attributes: [{ key: 'notes', name: 'Notes', kind: 'multiline' }] },
  ],
};

/**
 * Every definition of a type in render order: the ungrouped table first,
 * then each group's, its sub-groups' after its own. Empty for a type the
 * document does not define.
 * @param {string} code
 * @returns {AttributeDefinition[]}
 */
export function attributesFor(code) {
  const type = typeOf(code);
  if (type === null) return [];
  return [...type.attributes, ...type.groups.flatMap(groupAttributes)];
}
