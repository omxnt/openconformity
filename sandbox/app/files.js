/**
 * The project file: serialisation to the schema's shape, and the gates a
 * file passes on its way in.
 *
 * A file is always written in the current schema version. Serialisation
 * splits the one node collection into the schema's two arrays, walks the
 * filing tree so the arrays are in tree order, and writes dense order
 * integers per parent; array order carries no meaning.
 *
 * On opening, the format and the recorded version are read first, then the
 * checks run in order: a newer version refuses as newer (F-PER-005), an
 * invalid file refuses as invalid (F-PER-006), an older version migrates
 * through the chain (F-PER-004). The rebuilt model then replays through
 * the model module against the current metamodel, a net behind the
 * validator. The loader carries attribute content verbatim: no seeding,
 * and no default titles. A file is parsed as data, never evaluated as
 * code.
 */

import { ENTITY_TYPES } from './metamodel.js';
import { createModel, addEntity, addFolder, relate, restoreCounters, childrenOf } from './model.js';
import { validate } from './validator.js';

/** The schema version this software writes. */
export const SCHEMA_VERSION = 1;

/** The format marker of a project file. */
export const FILE_FORMAT = 'openconformity-project';

/**
 * The migration chain: one step per schema version, from that version to
 * the next. Empty until a schema version 2 exists.
 * @type {Object<number, (data: any) => { data: any, notices: string[] }>}
 */
const MIGRATIONS = {};

/**
 * @typedef {{ ok: true, model: import('./model.js').Model, notices: string[] }
 *         | { ok: false, code: 'newer'|'invalid', statement: string, problems?: string[] }} LoadResult
 */

// --- Writing -----------------------------------------------------------

/**
 * The file object a model serialises to, in the schema's shape: the node
 * collection split into folders and entities, in filing-tree order, with
 * dense order integers per parent, and the counters in the schema's key
 * order.
 * @param {import('./model.js').Model} model
 * @returns {Object}
 */
export function toFileObject(model) {
  /** @type {Object<string, number>} */
  const counters = {};
  for (const code of Object.keys(ENTITY_TYPES)) counters[code] = model.counters[code];
  counters.F = model.counters.F;

  const folders = [];
  const entities = [];
  const walk = (parentId) => {
    childrenOf(model, parentId).forEach((node, index) => {
      if (node.kind === 'folder') {
        folders.push({ id: node.id, name: node.name, parent: node.parent, order: index });
      } else {
        entities.push({
          id: node.id,
          type: node.type,
          parent: node.parent,
          order: index,
          attributes: { ...node.attributes },
        });
      }
      walk(node.id);
    });
  };
  walk(null);

  return {
    format: FILE_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    name: model.name,
    counters,
    folders,
    entities,
    relationships: [...model.relationships.values()].map((relationship) => ({
      type: relationship.type,
      source: relationship.source,
      target: relationship.target,
    })),
  };
}

/**
 * The text a project file holds.
 * @param {import('./model.js').Model} model
 * @returns {string}
 */
export function serialise(model) {
  return `${JSON.stringify(toFileObject(model), null, 2)}\n`;
}

/**
 * The default filename a project saves under: the project name slugified —
 * lowercased, marks stripped, runs of anything else a single dash — and
 * `untitled.json` when no name survives that.
 * @param {string} name
 * @returns {string}
 */
export function filenameFor(name) {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'untitled'}.json`;
}

// --- Reading -----------------------------------------------------------

/**
 * @param {'newer'|'invalid'} code
 * @param {string} statement
 * @param {string[]} [problems]
 * @returns {LoadResult}
 */
function refusal(code, statement, problems) {
  return problems ? { ok: false, code, statement, problems } : { ok: false, code, statement };
}

const INVALID_STATEMENT = 'The file is not a valid project file, and was not opened.';

/**
 * Gate 2: rebuild the model by replaying the file through the model
 * module, against the current metamodel. Behind the validator this is a
 * net that should never fire.
 * @param {any} data
 * @returns {{ ok: true, model: import('./model.js').Model } | { ok: false, problems: string[] }}
 */
function buildModel(data) {
  const problems = [];
  const model = createModel();
  model.name = data.name;

  const childLists = new Map();
  const list = (parent) => {
    if (!childLists.has(parent)) childLists.set(parent, []);
    return childLists.get(parent);
  };
  for (const folder of data.folders) list(folder.parent).push({ kind: 'folder', record: folder });
  for (const entity of data.entities) list(entity.parent).push({ kind: 'entity', record: entity });
  for (const children of childLists.values()) children.sort((one, other) => one.record.order - other.record.order);

  let placed = 0;
  const walk = (parentId) => {
    for (const { kind, record } of childLists.get(parentId) ?? []) {
      const result =
        kind === 'folder'
          ? addFolder(model, record.name, { id: record.id, parent: record.parent })
          : addEntity(model, record.type, { id: record.id, parent: record.parent, attributes: record.attributes });
      if (!result.ok) {
        problems.push(`${record.id}: ${result.reason}`);
        continue;
      }
      placed += 1;
      walk(record.id);
    }
  };
  walk(null);
  if (placed !== data.folders.length + data.entities.length) {
    problems.push('Not every folder and entity could be placed in the tree.');
  }

  for (const relationship of data.relationships) {
    const result = relate(model, relationship.type, relationship.source, relationship.target);
    if (!result.ok) {
      problems.push(`${relationship.type} from ${relationship.source} to ${relationship.target}: ${result.reason}`);
    }
  }

  restoreCounters(model, data.counters);
  return problems.length > 0 ? { ok: false, problems } : { ok: true, model };
}

/**
 * The gates a parsed project passes, in order: the format and the recorded
 * version first, so a newer file refuses as newer, never as invalid; then
 * the validator against the recorded version; then the migration chain up
 * to the current version; then the replay. The browser-storage blob passes
 * through here too.
 * @param {any} data
 * @returns {LoadResult}
 */
export function loadProject(data) {
  if (!isPlainObject(data) || data.format !== FILE_FORMAT) {
    return refusal('invalid', 'The file is not an openconformity project file, and was not opened.');
  }
  if (!Number.isInteger(data.schemaVersion)) {
    return refusal('invalid', 'The file does not record a schema version, and was not opened.');
  }
  if (data.schemaVersion > SCHEMA_VERSION) {
    return refusal('newer', 'The file was written by a newer version of this software, and was not opened.');
  }

  const judged = validate(data, data.schemaVersion);
  if (!judged.ok) return refusal('invalid', INVALID_STATEMENT, judged.problems);

  const notices = [];
  let working = data;
  while (working.schemaVersion < SCHEMA_VERSION) {
    const step = MIGRATIONS[working.schemaVersion];
    if (!step) {
      return refusal('invalid', `No migration from schema version ${working.schemaVersion} exists.`);
    }
    const migrated = step(working);
    working = migrated.data;
    notices.push(...migrated.notices);
  }

  const replayed = buildModel(working);
  if (!replayed.ok) return refusal('invalid', INVALID_STATEMENT, replayed.problems);
  return { ok: true, model: replayed.model, notices };
}

/**
 * Open a project from the text of a file.
 * @param {string} text
 * @returns {LoadResult}
 */
export function openProject(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return refusal('invalid', INVALID_STATEMENT);
  }
  return loadProject(data);
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
