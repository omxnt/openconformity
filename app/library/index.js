/**
 * What the software reads off the library it ships: the acts, by
 * reference, title and permanent address, for the About page. The
 * library itself is `data.js`, loaded with the software and fetched from
 * nowhere, and the library pane reads it whole.
 */

import { LIBRARY } from './data.js';

/**
 * The permanent address of an act on EUR-Lex, its European Legislation
 * Identifier, read from the reference as the Official Journal writes it.
 * A reference in neither form gives null.
 * @param {string} reference  'Regulation (EU) 2023/1230' or 'Directive 2011/65/EU'
 * @returns {string|null}
 */
export function addressOf(reference) {
  const regulation = /^Regulation \((?:EU|EC)\) (\d{4})\/(\d+)$/.exec(reference);
  if (regulation) return `https://eur-lex.europa.eu/eli/reg/${regulation[1]}/${regulation[2]}/oj`;
  const directive = /^Directive (\d{4})\/(\d+)\/(?:EU|EC)$/.exec(reference);
  if (directive) return `https://eur-lex.europa.eu/eli/dir/${directive[1]}/${directive[2]}/oj`;
  return null;
}

/**
 * The acts the library ships, in their filed order, each by its reference
 * and title as the library writes them, with its permanent address, or
 * the link the library holds where the reference gives none.
 * @type {Array<{ reference: string, title: string, address: string }>}
 */
export const ACTS = LIBRARY.entities
  .filter((entity) => entity.type === 'LEG')
  .sort((a, b) => a.order - b.order)
  .map((entity) => ({
    reference: entity.attributes.reference ?? '',
    title: entity.attributes.title ?? '',
    address: addressOf(entity.attributes.reference ?? '') ?? entity.attributes.link ?? '',
  }));
