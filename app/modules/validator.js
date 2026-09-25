/**
 * Gate 1 of opening a file: a hand-transcription of the project file
 * schema, kept per schema version, judging a parsed file against the
 * version it records. The V1_* tables are the frozen schema-version-1
 * contract: deliberate copies, never deduplicated against metamodel.js,
 * so a later metamodel cannot change how a version-1 file is judged.
 *
 * The checks cover the schema's keywords first, and on a structurally
 * sound file the prose constraints its description states: unique
 * identifiers, resolving references, filing and composition acyclicity,
 * order uniqueness, endpoint types, the single composition owner, and
 * counters exceeding every issued number. The endpoint types are the
 * entity types a relationship's identifier itself names.
 */

/**
 * Judge a parsed file against a schema version.
 * @param {any} data
 * @param {number} version
 * @returns {{ ok: true } | { ok: false, problems: string[] }}
 */
export function validate(data, version) {
  if (!Object.hasOwn(VERSIONS, version)) {
    return { ok: false, problems: [`No schema version ${String(version)} is known.`] };
  }
  const problems = VERSIONS[version](data);
  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}

// --- Schema version 1 --------------------------------------------------

const V1_TYPE_CODES = [
  'LEG', 'HST', 'OSP', 'CAS', 'NTB',
  'ESR', 'HSR', 'OSR', 'REQ', 'VER',
  'HAZ', 'SCN', 'PRM', 'SAF',
  'ELM', 'ACT', 'TSK', 'PHS',
];

const V1_RELATIONSHIP_IDS = [
  'leg-contains-esr',
  'hst-contains-hsr',
  'osp-contains-osr',
  'req-decomposes-into-req',
  'saf-decomposes-into-saf',
  'elm-decomposes-into-elm',
  'hst-harmonised-under-leg',
  'cas-conducted-under-leg',
  'elm-subject-to-leg',
  'elm-applies-hst',
  'elm-applies-osp',
  'hsr-covers-esr',
  'osr-supports-esr',
  'esr-triggered-by-haz',
  'req-derives-from-esr',
  'req-derives-from-hsr',
  'req-derives-from-osr',
  'req-expresses-prm',
  'req-expresses-saf',
  'elm-satisfies-esr',
  'elm-satisfies-hsr',
  'elm-satisfies-osr',
  'elm-satisfies-req',
  'prm-implements-hsr',
  'prm-implements-osr',
  'ver-verifies-esr',
  'ver-verifies-hsr',
  'ver-verifies-osr',
  'ver-verifies-req',
  'prm-allocated-to-elm',
  'saf-allocated-to-elm',
  'saf-realises-prm',
  'ntb-performs-cas',
  'cas-assesses-elm',
  'elm-exhibits-haz',
  'haz-contributes-to-scn',
  'tsk-gives-rise-to-scn',
  'act-exposed-in-scn',
  'prm-eliminates-haz',
  'prm-reduces-risk-of-scn',
  'elm-undergoes-phs',
  'act-interacts-with-elm',
  'act-performs-tsk',
  'tsk-occurs-during-phs',
];

const V1_COMPOSITION_IDS = [
  'leg-contains-esr',
  'hst-contains-hsr',
  'osp-contains-osr',
  'req-decomposes-into-req',
  'saf-decomposes-into-saf',
  'elm-decomposes-into-elm',
];

const V1_ENTITY_ID = /^(LEG|HST|OSP|CAS|NTB|ESR|HSR|OSR|REQ|VER|HAZ|SCN|PRM|SAF|ELM|ACT|TSK|PHS)-[0-9]{3,}$/;
const V1_FOLDER_ID = /^F-[0-9]+$/;
const V1_PARENT = /^((LEG|HST|OSP|CAS|NTB|ESR|HSR|OSR|REQ|VER|HAZ|SCN|PRM|SAF|ELM|ACT|TSK|PHS)-[0-9]{3,}|F-[0-9]+)$/;

const V1_FILE_KEYS = ['format', 'schemaVersion', 'name', 'counters', 'folders', 'entities', 'relationships'];
const V1_FILE_OPTIONAL_KEYS = ['attributes'];
const V1_FOLDER_KEYS = ['id', 'name', 'parent', 'order'];
const V1_ENTITY_KEYS = ['id', 'type', 'parent', 'order', 'attributes'];
const V1_RELATIONSHIP_KEYS = ['type', 'source', 'target'];

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The entity type codes a relationship identifier names, source first,
 * target last.
 * @param {string} typeId
 * @returns {{ source: string, target: string }}
 */
function endpointCodes(typeId) {
  const parts = typeId.split('-');
  return { source: parts[0].toUpperCase(), target: parts[parts.length - 1].toUpperCase() };
}

/**
 * The number an identifier issues, after its code and hyphen.
 * @param {string} id
 * @returns {number}
 */
function numberOf(id) {
  return parseInt(id.slice(id.indexOf('-') + 1), 10);
}

/**
 * The keys an object must carry, no more and no fewer — beyond the keys
 * the schema defines without requiring.
 * @param {Object} value
 * @param {string[]} keys
 * @param {string} label
 * @param {string[]} problems
 * @param {string[]} [optional]
 */
function checkKeys(value, keys, label, problems, optional = []) {
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) problems.push(`${label} has no ${key}.`);
  }
  for (const key of Object.keys(value)) {
    if (!keys.includes(key) && !optional.includes(key)) {
      problems.push(`${label} holds ${key}, which the schema does not define.`);
    }
  }
}

/**
 * Null, or a string matching the parent pattern. The pattern applies to
 * strings only.
 * @param {unknown} parent
 * @returns {boolean}
 */
function isValidParent(parent) {
  return parent === null || (typeof parent === 'string' && V1_PARENT.test(parent));
}

/**
 * @param {unknown} order
 * @returns {boolean}
 */
function isValidOrder(order) {
  return Number.isInteger(order) && order >= 0;
}

/**
 * The schema keyword checks: types, patterns, enumerations, required and
 * unknown keys.
 * @param {any} data
 * @returns {string[]}
 */
function keywordProblems(data) {
  const problems = [];

  checkKeys(data, V1_FILE_KEYS, 'The file', problems, V1_FILE_OPTIONAL_KEYS);
  if (Object.hasOwn(data, 'format') && data.format !== 'openconformity-project') {
    problems.push('The format does not mark an openconformity project.');
  }
  if (Object.hasOwn(data, 'schemaVersion') && data.schemaVersion !== 1) {
    problems.push('The schemaVersion is not 1.');
  }
  if (Object.hasOwn(data, 'name') && typeof data.name !== 'string') {
    problems.push('The name is not text.');
  }
  if (Object.hasOwn(data, 'attributes')) {
    if (!isPlainObject(data.attributes)) {
      problems.push('The project attributes are not an object.');
    } else {
      for (const [key, value] of Object.entries(data.attributes)) {
        if (key.length < 1) problems.push('A project attribute key is empty.');
        if (typeof value !== 'string') problems.push(`The project ${key} attribute is not text.`);
      }
    }
  }

  if (Object.hasOwn(data, 'counters')) {
    if (!isPlainObject(data.counters)) {
      problems.push('The counters are not an object.');
    } else {
      checkKeys(data.counters, [...V1_TYPE_CODES, 'F'], 'The counters object', problems);
      for (const [key, value] of Object.entries(data.counters)) {
        if (!Number.isInteger(value) || value < 1) {
          problems.push(`The ${key} counter is not a whole number of at least 1.`);
        }
      }
    }
  }

  for (const key of ['folders', 'entities', 'relationships']) {
    if (Object.hasOwn(data, key) && !Array.isArray(data[key])) {
      problems.push(`The ${key} are not an array.`);
    }
  }
  if (problems.length > 0) return problems;

  data.folders.forEach((folder, index) => {
    const label = `folders[${index}]`;
    if (!isPlainObject(folder)) {
      problems.push(`${label} is not an object.`);
      return;
    }
    checkKeys(folder, V1_FOLDER_KEYS, label, problems);
    if (Object.hasOwn(folder, 'id') && !(typeof folder.id === 'string' && V1_FOLDER_ID.test(folder.id))) {
      problems.push(`${label}: the identifier is not F, a hyphen, and a number.`);
    }
    if (Object.hasOwn(folder, 'name') && !(typeof folder.name === 'string' && folder.name.length >= 1)) {
      problems.push(`${label}: the name is not text of at least one character.`);
    }
    if (Object.hasOwn(folder, 'parent') && !isValidParent(folder.parent)) {
      problems.push(`${label}: the parent is not null or an identifier.`);
    }
    if (Object.hasOwn(folder, 'order') && !isValidOrder(folder.order)) {
      problems.push(`${label}: the order is not a whole number of at least 0.`);
    }
  });

  data.entities.forEach((entity, index) => {
    const label = `entities[${index}]`;
    if (!isPlainObject(entity)) {
      problems.push(`${label} is not an object.`);
      return;
    }
    checkKeys(entity, V1_ENTITY_KEYS, label, problems);
    if (Object.hasOwn(entity, 'id') && !(typeof entity.id === 'string' && V1_ENTITY_ID.test(entity.id))) {
      problems.push(`${label}: the identifier is not a type code, a hyphen, and at least three digits.`);
    }
    if (Object.hasOwn(entity, 'type') && !V1_TYPE_CODES.includes(entity.type)) {
      problems.push(`${label}: the type is not an entity type code.`);
    }
    if (Object.hasOwn(entity, 'parent') && !isValidParent(entity.parent)) {
      problems.push(`${label}: the parent is not null or an identifier.`);
    }
    if (Object.hasOwn(entity, 'order') && !isValidOrder(entity.order)) {
      problems.push(`${label}: the order is not a whole number of at least 0.`);
    }
    if (Object.hasOwn(entity, 'attributes')) {
      if (!isPlainObject(entity.attributes)) {
        problems.push(`${label}: the attributes are not an object.`);
      } else {
        for (const [key, value] of Object.entries(entity.attributes)) {
          if (key.length < 1) problems.push(`${label}: an attribute key is empty.`);
          if (typeof value !== 'string') problems.push(`${label}: the ${key} attribute is not text.`);
        }
      }
    }
  });

  data.relationships.forEach((relationship, index) => {
    const label = `relationships[${index}]`;
    if (!isPlainObject(relationship)) {
      problems.push(`${label} is not an object.`);
      return;
    }
    checkKeys(relationship, V1_RELATIONSHIP_KEYS, label, problems);
    if (Object.hasOwn(relationship, 'type') && !V1_RELATIONSHIP_IDS.includes(relationship.type)) {
      problems.push(`${label}: the type is not a relationship type.`);
    }
    for (const end of ['source', 'target']) {
      if (
        Object.hasOwn(relationship, end) &&
        !(typeof relationship[end] === 'string' && V1_ENTITY_ID.test(relationship[end]))
      ) {
        problems.push(`${label}: the ${end} is not an entity identifier.`);
      }
    }
  });

  return problems;
}

/**
 * The constraints the schema cannot express, checked once the keywords
 * hold.
 * @param {any} data
 * @returns {string[]}
 */
function proseProblems(data) {
  const problems = [];

  const nodes = new Map();
  for (const node of [...data.folders, ...data.entities]) {
    if (nodes.has(node.id)) problems.push(`More than one entry carries the identifier ${node.id}.`);
    else nodes.set(node.id, node);
  }

  for (const entity of data.entities) {
    if (!entity.id.startsWith(`${entity.type}-`)) {
      problems.push(`${entity.id} does not begin with its own type code ${entity.type}.`);
    }
  }

  for (const folder of data.folders) {
    if (numberOf(folder.id) >= data.counters.F) {
      problems.push(`The F counter does not exceed the issued number of ${folder.id}.`);
    }
  }
  for (const entity of data.entities) {
    if (numberOf(entity.id) >= data.counters[entity.type]) {
      problems.push(`The ${entity.type} counter does not exceed the issued number of ${entity.id}.`);
    }
  }

  for (const node of nodes.values()) {
    if (node.parent !== null && !nodes.has(node.parent)) {
      problems.push(`${node.id} is filed in ${node.parent}, which is not in the file.`);
    }
  }

  for (const node of nodes.values()) {
    const trail = new Set();
    let current = node.parent;
    while (current !== null && current !== node.id && nodes.has(current) && !trail.has(current)) {
      trail.add(current);
      current = nodes.get(current).parent;
    }
    if (current === node.id) {
      problems.push(`${node.id} sits inside itself, directly or through what holds it.`);
    }
  }

  const orders = new Map();
  for (const node of nodes.values()) {
    if (!orders.has(node.parent)) orders.set(node.parent, new Set());
    const taken = orders.get(node.parent);
    if (taken.has(node.order)) {
      problems.push(`Two entries filed in ${node.parent ?? 'the top of the tree'} share the order ${node.order}.`);
    }
    taken.add(node.order);
  }

  const entities = new Map(data.entities.map((entity) => [entity.id, entity]));
  const triples = new Set();
  const ownerBy = new Map();
  for (const relationship of data.relationships) {
    const codes = endpointCodes(relationship.type);
    for (const [end, code] of [['source', codes.source], ['target', codes.target]]) {
      const entity = entities.get(relationship[end]);
      if (!entity) {
        problems.push(`${relationship.type} from ${relationship.source} to ${relationship.target}: ${relationship[end]} is not an entity in the file.`);
      } else if (entity.type !== code) {
        problems.push(`${relationship.type} from ${relationship.source} to ${relationship.target}: the ${end} is not a ${code}.`);
      }
    }

    const triple = `${relationship.type} ${relationship.source} ${relationship.target}`;
    if (triples.has(triple)) {
      problems.push(`The relationship ${relationship.type} from ${relationship.source} to ${relationship.target} appears more than once.`);
    }
    triples.add(triple);

    if (V1_COMPOSITION_IDS.includes(relationship.type)) {
      if (ownerBy.has(relationship.target)) {
        problems.push(`${relationship.target} is owned through composition more than once.`);
      } else {
        ownerBy.set(relationship.target, relationship.source);
      }
    }
  }

  for (const id of ownerBy.keys()) {
    const trail = new Set();
    let current = ownerBy.get(id);
    while (current !== undefined && current !== id && !trail.has(current)) {
      trail.add(current);
      current = ownerBy.get(current);
    }
    if (current === id) {
      problems.push(`${id} owns itself, directly or through what it owns.`);
    }
  }

  return problems;
}

/**
 * @param {any} data
 * @returns {string[]}
 */
function validateVersion1(data) {
  if (!isPlainObject(data)) return ['The file does not hold an object.'];
  const problems = keywordProblems(data);
  if (problems.length > 0) return problems;
  return proseProblems(data);
}

/** The schema versions this validator holds a transcription of. */
const VERSIONS = { 1: validateVersion1 };
