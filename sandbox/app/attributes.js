/**
 * The attribute definitions per entity type, transcribed from
 * `docs/attributes.md`, which is the authoritative definition, in the order
 * the document records the types.
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
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
  HST: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
  OSP: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
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
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
  HSR: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
  },
  OSR: {
    attributes: [
      { key: 'title', name: 'Title', kind: 'text' },
      { key: 'description', name: 'Description', kind: 'multiline' },
    ],
    groups: [],
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
