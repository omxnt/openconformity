/**
 * The risk estimation methods of ISO/TR 14121-2:2012 an accident
 * scenario is rated by when the project chooses one: the report's
 * example risk matrix, risk graph and numerical scoring. Each method
 * names its source and clause in its value, so wherever the choice is
 * shown a rating says by what and from where. Each reads a rating's
 * parameters in the order the document lists them and returns what the
 * rating comes to as text, under the abbreviation the report gives it,
 * RI for the graph's index and RS for the score, or null while a
 * parameter is missing or unreadable. The tables are chapter 6 of `docs/attributes.md`,
 * transcribed and checked against the report; nothing here is stored,
 * an estimate being computed wherever it is shown.
 */

export const MATRIX_METHOD = 'Risk matrix (ISO/TR 14121-2:2012, 6.2.2)';
export const GRAPH_METHOD = 'Risk graph (ISO/TR 14121-2:2012, 6.3.2)';
export const SCORING_METHOD = 'Numerical scoring (ISO/TR 14121-2:2012, 6.4.2)';

/** The methods, in the order the project's choice offers them. */
export const METHODS = [MATRIX_METHOD, GRAPH_METHOD, SCORING_METHOD];

/** Every method an estimate can be read by. */
export const ESTIMATED = [...METHODS];

/** 6.2.2, Table 1: the level by probability down and severity across. */
export const MATRIX_SEVERITY = ['Catastrophic', 'Serious', 'Moderate', 'Minor'];
export const MATRIX_PROBABILITY = ['Very likely', 'Likely', 'Unlikely', 'Remote'];
export const MATRIX = {
  'Very likely': ['High', 'High', 'High', 'Medium'],
  Likely: ['High', 'High', 'Medium', 'Low'],
  Unlikely: ['Medium', 'Medium', 'Low', 'Negligible'],
  Remote: ['Low', 'Low', 'Negligible', 'Negligible'],
};

/** 6.3.2, Figure 4: the index by S and F down, O and A across. */
export const GRAPH_COLUMNS = ['O1 A1', 'O1 A2', 'O2 A1', 'O2 A2', 'O3 A1', 'O3 A2'];
export const GRAPH = {
  'S1 F1': [1, 1, 1, 1, 2, 2],
  'S1 F2': [1, 1, 1, 1, 2, 2],
  'S2 F1': [2, 2, 2, 3, 3, 4],
  'S2 F2': [3, 4, 4, 5, 5, 6],
};

/** The band an index falls in, as 6.3.2 reads them. */
export const graphBand = (index) => (index <= 2 ? 'lowest' : index <= 4 ? 'medium' : 'highest');

/** The classes of each parameter of the graph, in the report's order. */
export const GRAPH_LEVELS = [
  ['S1', 'S2'],
  ['F1', 'F2'],
  ['O1', 'O2', 'O3'],
  ['A1', 'A2'],
];

/**
 * 6.3.2, Figure 3 as a tree, grown from the table above so the two
 * cannot drift apart and merged as the report merges it: a branch joins
 * the one before it where the two reach the same indices whatever is
 * chosen below them, F1 with F2 and O1 with O2 under S1, so the tree
 * draws no distinction the report does not make. Each branch carries
 * the codes it takes and each leaf the index it reaches.
 */
const sketch = (node) => (node.children ? `(${node.children.map(sketch).join(' ')})` : String(node.index));
const grow = (levels, chosen) => {
  if (levels.length === 0) return { index: GRAPH[`${chosen[0]} ${chosen[1]}`][GRAPH_COLUMNS.indexOf(`${chosen[2]} ${chosen[3]}`)] };
  const children = [];
  for (const code of levels[0]) {
    const branch = grow(levels.slice(1), [...chosen, code]);
    const last = children.at(-1);
    if (last && sketch(last) === sketch(branch)) {
      last.codes.push(code);
      last.label = last.codes.join(', ');
    } else {
      children.push({ label: code, codes: [code], ...branch });
    }
  }
  return { children };
};
export const GRAPH_TREE = { label: 'Start', ...grow(GRAPH_LEVELS, []) };

/**
 * The branch of the graph a rating follows: the nodes from the start,
 * as far as the codes given reach — to a leaf when all four are set.
 * @param {string[]} codes  the codes chosen at each level, '' where unset
 * @param {Object} [tree]  the graph walked, the risk graph unless given
 * @returns {Array<Object>}
 */
export function graphPath(codes, tree = GRAPH_TREE) {
  const path = [tree];
  let node = tree;
  for (const held of codes) {
    const next = (node.children ?? []).find((child) => child.codes.includes(held));
    if (!next) break;
    path.push(next);
    node = next;
  }
  return path;
}

/**
 * Whether a node of the graph is live: at every level above it, the
 * code chosen is one its ancestor there carries, or none is chosen yet.
 * @param {string[]} codes
 * @param {Array<Object>} ancestors
 */
export function graphLive(codes, ancestors) {
  return ancestors.every((ancestor, level) => codes[level] === '' || ancestor.codes.includes(codes[level]));
}

/** 6.4.2, Table 2: the category a score reaches, highest first. */
export const SCORING = [
  [160, 'high'],
  [120, 'medium'],
  [90, 'low'],
  [0, 'negligible'],
];

/** 6.4.2: the class a severity score and a probability score fall in, highest first. */
export const SCORING_CLASSES = {
  severity: [
    [100, 'catastrophic'],
    [90, 'serious'],
    [30, 'moderate'],
    [0, 'minor'],
  ],
  probability: [
    [100, 'very likely'],
    [70, 'likely'],
    [30, 'unlikely'],
    [0, 'remote'],
  ],
};

/** The code a choice value opens with — its first word, `S1`. */
export const codeOf = (value) => String(value ?? '').trim().split(' ')[0];

/** The score a number field holds, NaN where it holds none. */
export function scoreOf(value) {
  const held = String(value ?? '').trim();
  return /^\d+$/.test(held) ? Number.parseInt(held, 10) : NaN;
}

/**
 * The tone an estimate is shown in — high, medium, low, or negligible —
 * read from the report's own word for it, whichever method said it, a
 * level, an index's band or a score's category; none while nothing is
 * rated or the rating is typed.
 * @param {string|null} held  an estimate, or a level on its own
 */
export function levelTone(held) {
  const word = (/\(([^)]+)\)$/.exec(String(held ?? ''))?.[1] ?? String(held ?? '')).toLowerCase();
  if (word === 'high' || word === 'highest') return 'high';
  if (word === 'medium') return 'medium';
  if (word === 'low' || word === 'lowest') return 'low';
  if (word === 'negligible') return 'negligible';
  return 'none';
}

/**
 * What a rating comes to under a method, or null while it cannot be read.
 * @param {string} method  one of METHODS
 * @param {Array<string|undefined>} parameters  the rating's values, in document order
 * @returns {string|null}
 */
export function estimate(method, parameters) {
  const [a, b, c, d] = parameters;
  switch (method) {
    case MATRIX_METHOD: {
      const column = MATRIX_SEVERITY.indexOf(String(a ?? '').trim());
      const row = MATRIX[String(b ?? '').trim()];
      return column >= 0 && row ? row[column] : null;
    }
    case GRAPH_METHOD: {
      const row = GRAPH[`${codeOf(a)} ${codeOf(b)}`];
      const column = GRAPH_COLUMNS.indexOf(`${codeOf(c)} ${codeOf(d)}`);
      if (!row || column < 0) return null;
      const index = row[column];
      return `RI ${index} (${graphBand(index)})`;
    }
    case SCORING_METHOD: {
      const total = scoreOf(a) + scoreOf(b);
      if (Number.isNaN(total)) return null;
      const [, category] = SCORING.find(([from]) => total >= from) ?? [0, 'negligible'];
      return `RS ${total} (${category})`;
    }
    default:
      return null;
  }
}
