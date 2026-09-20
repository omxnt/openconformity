/**
 * The risk estimation methods of ISO/TR 14121-2:2012, as an accident
 * scenario is rated by one of them, and the required level of a safety
 * function, read by its target standard's own method. Each reads a
 * rating's parameters in the order the document lists them and returns
 * what the rating comes to as text, or null while a parameter is
 * missing or unreadable. The tables are chapter 6 of
 * `sandbox/attributes.md`, transcribed; nothing here is stored, an
 * estimate being computed wherever it is shown.
 */

/** The methods, in the order the scenario's choice offers them. */
export const METHODS = ['Risk matrix', 'Risk graph', 'Numerical scoring', 'Hybrid tool'];

/** ISO 13849-1's risk graph, which reads a safety function's required performance level. */
export const PL_METHOD = 'PL risk graph';

/** IEC 62061's matrix, which reads a safety function's required safety integrity level. */
export const SIL_METHOD = 'SIL matrix';

/** Every method an estimate can be read by. */
export const ESTIMATED = [...METHODS, PL_METHOD, SIL_METHOD];

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

/** ISO 13849-1 Annex A, Figure A.1: the required performance level by S, F and P. */
export const PL_GRAPH = {
  'S1 F1 P1': 'a',
  'S1 F1 P2': 'b',
  'S1 F2 P1': 'b',
  'S1 F2 P2': 'c',
  'S2 F1 P1': 'c',
  'S2 F1 P2': 'd',
  'S2 F2 P1': 'd',
  'S2 F2 P2': 'e',
};

/** The levels in order, so one can be reduced by one; PL a has none below it. */
export const PL_LEVELS = ['a', 'b', 'c', 'd', 'e'];
export const reducePL = (level) => PL_LEVELS[Math.max(0, PL_LEVELS.indexOf(level) - 1)];

/** ISO 13849-1's graph as the standard draws it: a full tree of the codes, each leaf the level it reaches. */
const plBranch = (S, F) => ({
  label: F,
  codes: [F],
  children: [
    { label: 'P1', codes: ['P1'], outcome: PL_GRAPH[`${S} ${F} P1`] },
    { label: 'P2', codes: ['P2'], outcome: PL_GRAPH[`${S} ${F} P2`] },
  ],
});
export const PL_TREE = {
  label: 'Start',
  children: [
    { label: 'S1', codes: ['S1'], children: [plBranch('S1', 'F1'), plBranch('S1', 'F2')] },
    { label: 'S2', codes: ['S2'], children: [plBranch('S2', 'F1'), plBranch('S2', 'F2')] },
  ],
};

/** IEC 62061 Annex A, Table A.6: the level by severity down and the class across, the class banded as the table has it. */
export const SIL_BANDS = [
  [3, 4],
  [5, 7],
  [8, 10],
  [11, 13],
  [14, 15],
];
export const SIL_MATRIX = {
  4: ['SIL 1', 'SIL 2', 'SIL 2', 'SIL 3', 'SIL 3'],
  3: ['No SIL', 'OM', 'SIL 1', 'SIL 2', 'SIL 3'],
  2: ['No SIL', 'No SIL', 'OM', 'SIL 1', 'SIL 2'],
  1: ['No SIL', 'No SIL', 'No SIL', 'OM', 'SIL 1'],
};

/** The band an index falls in, as 6.3.2 reads them. */
export const graphBand = (index) => (index <= 2 ? 'lowest' : index <= 4 ? 'medium' : 'highest');

/**
 * 6.3.2, Figure 3: the graph as the report draws it — each branch the
 * codes it takes and nothing more, branches the report merges merged,
 * each leaf the index it reaches.
 */
export const GRAPH_TREE = {
  label: 'Start',
  children: [
    {
      label: 'S1',
      codes: ['S1'],
      children: [
        {
          label: 'F1, F2',
          codes: ['F1', 'F2'],
          children: [
            { label: 'O1, O2', codes: ['O1', 'O2'], children: [{ label: 'A1, A2', codes: ['A1', 'A2'], index: 1 }] },
            { label: 'O3', codes: ['O3'], children: [{ label: 'A1, A2', codes: ['A1', 'A2'], index: 2 }] },
          ],
        },
      ],
    },
    {
      label: 'S2',
      codes: ['S2'],
      children: [
        {
          label: 'F1',
          codes: ['F1'],
          children: [
            { label: 'O1', codes: ['O1'], children: [{ label: 'A1, A2', codes: ['A1', 'A2'], index: 2 }] },
            {
              label: 'O2',
              codes: ['O2'],
              children: [
                { label: 'A1', codes: ['A1'], index: 2 },
                { label: 'A2', codes: ['A2'], index: 3 },
              ],
            },
            {
              label: 'O3',
              codes: ['O3'],
              children: [
                { label: 'A1', codes: ['A1'], index: 3 },
                { label: 'A2', codes: ['A2'], index: 4 },
              ],
            },
          ],
        },
        {
          label: 'F2',
          codes: ['F2'],
          children: [
            {
              label: 'O1',
              codes: ['O1'],
              children: [
                { label: 'A1', codes: ['A1'], index: 3 },
                { label: 'A2', codes: ['A2'], index: 4 },
              ],
            },
            {
              label: 'O2',
              codes: ['O2'],
              children: [
                { label: 'A1', codes: ['A1'], index: 4 },
                { label: 'A2', codes: ['A2'], index: 5 },
              ],
            },
            {
              label: 'O3',
              codes: ['O3'],
              children: [
                { label: 'A1', codes: ['A1'], index: 5 },
                { label: 'A2', codes: ['A2'], index: 6 },
              ],
            },
          ],
        },
      ],
    },
  ],
};

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
 * The codes after a branch of the graph is picked: the code itself at
 * its level, each single-code ancestor at its own, and the rest as they
 * were. A merged ancestor decides nothing, so it is left to be picked.
 * @param {string[]} codes  S, F, O, A as they stand, '' where unset
 * @param {Array<Object>} ancestors  the nodes above the branch, from the severity down
 * @param {string} code  the code picked
 * @returns {string[]}
 */
export function graphPick(codes, ancestors, code) {
  const next = [...codes];
  ancestors.forEach((ancestor, level) => {
    if (ancestor.codes.length === 1) next[level] = ancestor.codes[0];
  });
  next[ancestors.length] = code;
  return next;
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

/** 6.5.2: the level by severity down and the class across, the class banded as the form has it. */
export const HYBRID_BANDS = [
  [4, 7],
  [8, 10],
  [11, 13],
  [14, 15],
];
export const HYBRID = {
  4: ['medium', 'high', 'high', 'high'],
  3: ['low', 'medium', 'high', 'high'],
  2: ['low', 'low', 'medium', 'high'],
  1: ['low', 'low', 'low', 'medium'],
};
/** The band a class falls in, or -1 outside them all. */
const bandOf = (bands, cl) => bands.findIndex(([low, high]) => cl >= low && cl <= high);

/** The code a choice value opens with — its first word, `S1`. */
export const codeOf = (value) => String(value ?? '').trim().split(' ')[0];

/** The score a value holds — `4` of `Se 4`, or a number field's own — NaN where it holds none. */
export function scoreOf(value) {
  const held = /\d+/.exec(String(value ?? '').trim());
  return held ? Number.parseInt(held[0], 10) : NaN;
}

/**
 * The tone an estimate is shown in — high, medium, low, or none — read
 * from the report's own word for it, whichever method said it.
 * @param {string|null} held  an estimate, or a level on its own
 */
export function levelTone(held) {
  const word = (/\(([^)]+)\)$/.exec(String(held ?? ''))?.[1] ?? String(held ?? '')).toLowerCase();
  if (word === 'high' || word === 'highest') return 'high';
  if (word === 'medium') return 'medium';
  if (word === 'low' || word === 'lowest') return 'low';
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
    case 'Risk matrix': {
      const column = MATRIX_SEVERITY.indexOf(String(a ?? '').trim());
      const row = MATRIX[String(b ?? '').trim()];
      return column >= 0 && row ? row[column] : null;
    }
    case 'Risk graph': {
      const row = GRAPH[`${codeOf(a)} ${codeOf(b)}`];
      const column = GRAPH_COLUMNS.indexOf(`${codeOf(c)} ${codeOf(d)}`);
      if (!row || column < 0) return null;
      const index = row[column];
      return `${index} (${graphBand(index)})`;
    }
    case 'Numerical scoring': {
      const total = scoreOf(a) + scoreOf(b);
      if (Number.isNaN(total)) return null;
      const [, category] = SCORING.find(([from]) => total >= from) ?? [0, 'negligible'];
      return `${total} (${category})`;
    }
    case PL_METHOD: {
      const level = PL_GRAPH[`${codeOf(a)} ${codeOf(b)} ${codeOf(c)}`];
      if (level === undefined) return null;
      return `PL ${codeOf(d).toLowerCase() === 'low' ? reducePL(level) : level}`;
    }
    case SIL_METHOD: {
      const row = SIL_MATRIX[scoreOf(a)];
      const column = bandOf(SIL_BANDS, scoreOf(b) + scoreOf(c) + scoreOf(d));
      return row && column >= 0 ? row[column] : null;
    }
    case 'Hybrid tool': {
      const row = HYBRID[scoreOf(a)];
      const cl = scoreOf(b) + scoreOf(c) + scoreOf(d);
      const column = bandOf(HYBRID_BANDS, cl);
      if (!row || column < 0) return null;
      return `Cl ${cl} (${row[column]})`;
    }
    default:
      return null;
  }
}
