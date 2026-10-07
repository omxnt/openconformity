/**
 * The built-in catalogues: the root folders of the library project the
 * software ships, each cut out as a project file of its own, loaded with
 * the software and fetched from nowhere. One entry per catalogue, in the
 * folders' order, each with the date the library project carries.
 */

import { LIBRARY } from './data.js';

/**
 * @typedef {Object} Library
 * @property {string} id
 * @property {string} name
 * @property {string} date  when the content was last brought up to date, as a calendar date
 * @property {Object} project  the catalogue in the project file's shape
 */

/**
 * One root folder of a library project as a project file of its own:
 * what is filed in the folder, however deep, with what stood directly in
 * it at the root, and the relationships between what is filed there.
 * @param {Object} project  a project file
 * @param {string} folderId
 * @returns {Object}
 */
export function catalogueOf(project, folderId) {
  const parentOf = new Map([...project.folders, ...project.entities].map((node) => [node.id, node.parent]));
  const inside = (id) => {
    for (let held = parentOf.get(id); held !== null && held !== undefined; held = parentOf.get(held)) if (held === folderId) return true;
    return false;
  };
  const lift = (node) => ({ ...node, parent: node.parent === folderId ? null : node.parent });
  const folders = project.folders.filter((folder) => inside(folder.id)).map(lift);
  const entities = project.entities.filter((entity) => inside(entity.id)).map(lift);
  const held = new Set(entities.map((entity) => entity.id));
  const relationships = project.relationships.filter((relationship) => held.has(relationship.source) && held.has(relationship.target));
  const folder = project.folders.find((candidate) => candidate.id === folderId);
  return { ...project, name: folder?.name ?? project.name, folders, entities, relationships };
}

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

/** @type {Library[]} */
export const LIBRARIES = LIBRARY.folders
  .filter((folder) => folder.parent === null)
  .map((folder) => ({ id: folder.id, name: folder.name, date: LIBRARY.attributes?.date ?? '', project: catalogueOf(LIBRARY, folder.id) }));
