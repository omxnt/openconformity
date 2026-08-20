/**
 * The attribute definitions per entity type, transcribed from
 * `sandbox/attributes.md` — the working draft that supersedes
 * `docs/attributes.md` while the attribute-definition work runs, and the
 * authoritative definition for now — in the order the document records
 * the types.
 *
 * Per type, the ungrouped definitions come first and the named collapsible
 * groups follow, with keys unique across all of a type's tables. The
 * identifier is generated and read-only, so it is not an attribute. Every
 * attribute is optional and every value is stored as text: an unset
 * attribute is the absence of its key.
 */

/** @typedef {'text'|'multiline'|'choice'|'hyperlink'} AttributeKind */

/**
 * @typedef {Object} AttributeDefinition
 * @property {string} key
 * @property {string} name
 * @property {AttributeKind} kind
 * @property {string[]} [values]  the choices, for kind 'choice'
 */

/**
 * @typedef {Object} TypeAttributes
 * @property {AttributeDefinition[]} attributes  the ungrouped definitions, always expanded
 * @property {Array<{ name: string, attributes: AttributeDefinition[] }>} groups  the collapsible groups, in render order
 */

/** @type {Object<string, TypeAttributes>} */
export const ATTRIBUTES = {
  ELM: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
  ACT: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
  TSK: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
  PHS: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
  LEG: {
    attributes: [],
    groups: [
      {
        name: 'Act',
        attributes: [
          { key: 'reference', name: 'Reference', kind: 'text' },
          { key: 'title', name: 'Title', kind: 'text' },
          { key: 'link', name: 'Link', kind: 'hyperlink' },
        ],
      },
      {
        name: 'Applicability',
        attributes: [
          { key: 'applicable', name: 'Applicable', kind: 'choice', values: ['Yes', 'No'] },
          { key: 'rationale', name: 'Rationale', kind: 'multiline' },
        ],
      },
    ],
  },
  HST: {
    attributes: [],
    groups: [
      {
        name: 'Standard',
        attributes: [
          { key: 'reference', name: 'Reference', kind: 'text' },
          { key: 'title', name: 'Title', kind: 'text' },
          { key: 'edition', name: 'Edition', kind: 'text' },
          { key: 'date', name: 'Date', kind: 'text' },
          { key: 'link', name: 'Link', kind: 'hyperlink' },
        ],
      },
      {
        name: 'Applicability',
        attributes: [
          { key: 'applicable', name: 'Applicable', kind: 'choice', values: ['Yes', 'No'] },
          { key: 'rationale', name: 'Rationale', kind: 'multiline' },
        ],
      },
    ],
  },
  OSP: {
    attributes: [],
    groups: [
      {
        name: 'Specification',
        attributes: [
          { key: 'reference', name: 'Reference', kind: 'text' },
          { key: 'title', name: 'Title', kind: 'text' },
          { key: 'edition', name: 'Edition', kind: 'text' },
          { key: 'date', name: 'Date', kind: 'text' },
          { key: 'link', name: 'Link', kind: 'hyperlink' },
        ],
      },
      {
        name: 'Applicability',
        attributes: [
          { key: 'applicable', name: 'Applicable', kind: 'choice', values: ['Yes', 'No'] },
          { key: 'rationale', name: 'Rationale', kind: 'multiline' },
        ],
      },
    ],
  },
  CAS: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
  NTB: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
  HAZ: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
  SCN: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
  PRM: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
  SAF: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
  ESR: {
    attributes: [],
    groups: [
      {
        name: 'Requirement',
        attributes: [
          { key: 'reference', name: 'Reference', kind: 'text' },
          { key: 'title', name: 'Title', kind: 'text' },
          { key: 'requirement', name: 'Requirement', kind: 'multiline' },
        ],
      },
      {
        name: 'Applicability',
        attributes: [
          { key: 'applicable', name: 'Applicable', kind: 'choice', values: ['Yes', 'No'] },
          { key: 'rationale', name: 'Rationale', kind: 'multiline' },
        ],
      },
    ],
  },
  HSR: {
    attributes: [],
    groups: [
      {
        name: 'Requirement',
        attributes: [
          { key: 'reference', name: 'Reference', kind: 'text' },
          { key: 'title', name: 'Title', kind: 'text' },
          { key: 'requirement', name: 'Requirement', kind: 'multiline' },
        ],
      },
      {
        name: 'Applicability',
        attributes: [
          { key: 'applicable', name: 'Applicable', kind: 'choice', values: ['Yes', 'No'] },
          { key: 'rationale', name: 'Rationale', kind: 'multiline' },
        ],
      },
    ],
  },
  OSR: {
    attributes: [],
    groups: [
      {
        name: 'Requirement',
        attributes: [
          { key: 'reference', name: 'Reference', kind: 'text' },
          { key: 'title', name: 'Title', kind: 'text' },
          { key: 'requirement', name: 'Requirement', kind: 'multiline' },
        ],
      },
      {
        name: 'Applicability',
        attributes: [
          { key: 'applicable', name: 'Applicable', kind: 'choice', values: ['Yes', 'No'] },
          { key: 'rationale', name: 'Rationale', kind: 'multiline' },
        ],
      },
    ],
  },
  REQ: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
  VER: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
};

/**
 * Every definition of a type in render order: the ungrouped table first,
 * then each group's. Empty for a type the document does not define.
 * @param {string} code
 * @returns {AttributeDefinition[]}
 */
export function attributesFor(code) {
  if (!Object.hasOwn(ATTRIBUTES, code)) return [];
  const type = ATTRIBUTES[code];
  return [...type.attributes, ...type.groups.flatMap((group) => group.attributes)];
}
