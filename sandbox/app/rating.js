/**
 * The rating dialog: a rating made by its method, laid out as the
 * method's document lays it out — the matrix to click, the graph to
 * follow, the scores to enter, the scales beside their matrix. It
 * resolves the parameter values chosen, or null when it is cancelled;
 * nothing is written until the caller does.
 */

import { el, icon, svg, svgText } from './dom.js';
import {
  estimate,
  levelTone,
  codeOf,
  scoreOf,
  MATRIX,
  MATRIX_SEVERITY,
  MATRIX_PROBABILITY,
  GRAPH_TREE,
  PL_TREE,
  PL_METHOD,
  SIL_METHOD,
  SIL_BANDS,
  SIL_MATRIX,
  graphPath,
  graphPick,
  graphLive,
  SCORING_CLASSES,
  HYBRID,
  HYBRID_BANDS,
} from './risk.js';

/**
 * Carbon's status indicator for a tone: error, warning, or the check —
 * the check in the secondary colour where the level is negligible.
 * @param {'high'|'medium'|'low'|'none'} tone
 */
export function statusIcon(tone) {
  const held = icon({ high: 'i-error-filled', medium: 'i-warning-filled' }[tone] ?? 'i-checkmark-filled');
  held.classList.add('status-icon', `tone-${tone}`);
  return held;
}

/** A level as a cell reads it: its dot in its tone where it has one, then its word. */
function levelCell(level, className) {
  const tone = levelTone(level);
  return el('div', { className: `${className} tone-${tone}` }, [
    ...(tone === 'none' ? [] : [el('span', { className: 'risk-dot' })]),
    el('span', { text: level }),
  ]);
}

/**
 * One parameter as a row of options, Carbon's content switcher: the
 * chosen one pressed, a second press clearing it.
 */
function optionGroup(definition, state, changed) {
  const buttons = definition.values.map((value) => {
    const button = el('button', {
      className: 'risk-option',
      text: value,
      attributes: { type: 'button', 'aria-pressed': 'false' },
    });
    button.addEventListener('click', () => {
      state[definition.key] = state[definition.key] === value ? '' : value;
      changed();
    });
    return button;
  });
  const element = el('div', { className: 'risk-choice' }, [
    el('div', { className: 'field-label', text: definition.name }),
    el('div', { className: 'risk-options', attributes: { role: 'group', 'aria-label': definition.name } }, buttons),
  ]);
  const repaint = () => {
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.textContent === state[definition.key]));
  };
  return { element, repaint };
}

/** Table 1 as the tool it is: a cell per pair, pressed where the rating stands. */
function matrixSurface(parameters, state, changed) {
  const [severity, probability] = parameters;
  const cells = [];
  const head = el('tr', {}, [
    el('th', { text: '' }),
    ...MATRIX_SEVERITY.map((held) => el('th', { text: held, attributes: { scope: 'col' } })),
  ]);
  const rows = MATRIX_PROBABILITY.map((held) =>
    el('tr', {}, [
      el('th', { text: held, attributes: { scope: 'row' } }),
      ...MATRIX_SEVERITY.map((column, i) => {
        const level = MATRIX[held][i];
        const button = el(
          'button',
          { className: `risk-cell tone-${levelTone(level)}`, attributes: { type: 'button', 'aria-pressed': 'false' } },
          [el('span', { className: 'risk-dot' }), el('span', { text: level })]
        );
        button.addEventListener('click', () => {
          state[severity.key] = column;
          state[probability.key] = held;
          changed();
        });
        cells.push({ button, column, row: held });
        return el('td', {}, [button]);
      }),
    ])
  );
  const element = el('table', { className: 'risk-matrix' }, [el('thead', {}, [head]), el('tbody', {}, rows)]);
  const repaint = () => {
    for (const { button, column, row } of cells) {
      button.setAttribute('aria-pressed', String(state[severity.key] === column && state[probability.key] === row));
    }
  };
  return { element, repaint };
}

/**
 * A graph drawn and made the picker: each branch a line with its label
 * above it, the codes of a merged branch as separate words, every word
 * a button; the leaves gathered on the outcomes they reach; the path the
 * rating resolves so far in the interactive colour, branches no longer
 * reachable dimmed. The lines sit on pixel centres.
 * @param {{ tree: Object, headings: string[], outcomes: string[], leafOutcome: (leaf: Object) => string }} spec
 */
function graphFigure(spec, parameters, state, pick) {
  const COLUMN = 128;
  const ROW = 26;
  const LEFT = 8;
  const TOP = 44;
  const GAP = 12;
  const RADIUS = 10;
  const levels = spec.headings.length - 1;
  const layout = new Map();
  const leaves = [];
  (function place(node, depth) {
    if (!node.children) {
      layout.set(node, { depth, row: leaves.length });
      leaves.push(node);
      return;
    }
    for (const child of node.children) place(child, depth + 1);
    const rows = node.children.map((child) => layout.get(child).row);
    layout.set(node, { depth, row: rows.reduce((sum, held) => sum + held, 0) / rows.length });
  })(spec.tree, 0);
  const x = (depth) => LEFT + depth * COLUMN;
  const y = (row) => TOP + Math.round(row * ROW) + 0.5;
  const outcomeRow = (i) => (i * (leaves.length - 1)) / Math.max(1, spec.outcomes.length - 1);
  const cx = x(levels + 1) + RADIUS + 4;

  const codes = parameters.map((definition) => codeOf(state[definition.key]));
  const path = new Set(graphPath(codes, spec.tree));
  const last = [...path].at(-1);
  const reached = last.children ? null : spec.leafOutcome(last);

  const parts = [];
  spec.headings.forEach((heading, i) => {
    parts.push(svgText('text', { x: String(x(i + 1)), y: '16', class: 'risk-head' }, heading));
  });
  const edge = (d, active) => svg('path', { d, class: active ? 'risk-edge active' : 'risk-edge' });

  (function draw(node, ancestors, id) {
    const { depth, row } = layout.get(node);
    const from = depth === 0 ? x(0) : x(depth) - GAP;
    const to = x(depth + 1) - GAP;
    parts.push(edge(`M ${from} ${y(row)} H ${to}`, path.has(node)));
    for (const [i, child] of (node.children ?? []).entries()) {
      parts.push(edge(`M ${to} ${y(row)} V ${y(layout.get(child).row)}`, path.has(node) && path.has(child)));
      draw(child, depth === 0 ? [] : [...ancestors, node], `${id}.${i}`);
    }
    if (!node.children) {
      const leafY = y(outcomeRow(spec.outcomes.indexOf(spec.leafOutcome(node))));
      parts.push(edge(`M ${to} ${y(row)} V ${leafY} H ${cx - RADIUS}`, path.has(node)));
    }
    const live = depth === 0 || graphLive(codes, ancestors);
    const label = svgText('text', { x: String(x(depth) + (depth === 0 ? 0 : 2)), y: String(y(row) - 6), class: live ? 'risk-label' : 'risk-label dim' }, '');
    if (depth === 0) {
      label.textContent = node.label;
    } else {
      node.codes.forEach((code, i) => {
        if (i > 0) label.appendChild(document.createTextNode(', '));
        const chosen = live && codes[ancestors.length] === code;
        const word = svgText(
          'tspan',
          { class: chosen ? 'risk-code selected' : 'risk-code', role: 'button', tabindex: '0', 'data-pick': `${id}:${code}` },
          node.codes.length > 1 ? code : node.label
        );
        word.addEventListener('click', () => pick(ancestors, code));
        word.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          pick(ancestors, code);
        });
        label.appendChild(word);
      });
    }
    parts.push(label);
  })(spec.tree, [], '0');

  spec.outcomes.forEach((outcome, i) => {
    parts.push(
      svg('g', { class: reached === outcome ? 'risk-leaf active' : 'risk-leaf' }, [
        svg('circle', { cx: String(cx), cy: String(y(outcomeRow(i))), r: String(RADIUS) }),
        svgText('text', { x: String(cx), y: String(y(outcomeRow(i)) + 4) }, outcome),
      ])
    );
  });
  const width = cx + RADIUS + 8;
  const height = y(leaves.length - 1) + 12;
  return svg(
    'svg',
    { class: 'risk-graph', viewBox: `0 0 ${width} ${height}`, role: 'group', 'aria-label': `${spec.name}: pick a branch at each level` },
    parts
  );
}

/** ISO/TR 14121-2's risk graph, Figure 3: four levels gathered on six indices. */
const RISK_GRAPH_SPEC = {
  name: 'The risk graph',
  tree: GRAPH_TREE,
  headings: ['Severity', 'Exposure', 'Probability', 'Avoidance', 'Risk index'],
  outcomes: ['1', '2', '3', '4', '5', '6'],
  leafOutcome: (leaf) => String(leaf.index),
  note: 'Pick a branch at each level: the path lights as far as it is decided, and the index at its end.',
};

/** ISO 13849-1's risk graph, Figure A.1: three levels gathered on five performance levels, the occurrence chosen beneath. */
const PL_GRAPH_SPEC = {
  name: 'The performance level graph',
  tree: PL_TREE,
  headings: ['Severity', 'Exposure', 'Avoidance', 'PLr'],
  outcomes: ['a', 'b', 'c', 'd', 'e'],
  leafOutcome: (leaf) => leaf.outcome,
  note: 'Pick a branch at each level: the level stands at its end, one lower where the occurrence is set low.',
};

/**
 * A graph as the picker, a word of guidance above it, and any parameter
 * beyond the graph's levels as options beneath it; a pick keeps the
 * keyboard where it was.
 */
const graphSurface = (spec) => (parameters, state, changed) => {
  const inTree = parameters.slice(0, spec.headings.length - 1);
  const beyond = parameters.slice(spec.headings.length - 1).map((definition) => optionGroup(definition, state, changed));
  const valueOf = (definition, code) => definition.values.find((value) => codeOf(value) === code) ?? code;
  const pick = (ancestors, code) => {
    const next = graphPick(inTree.map((definition) => codeOf(state[definition.key])), ancestors, code);
    inTree.forEach((definition, level) => {
      state[definition.key] = next[level] === '' ? '' : valueOf(definition, next[level]);
    });
    changed();
  };
  let figure = graphFigure(spec, inTree, state, pick);
  const holder = el('div', { className: 'rating-graph' }, [figure]);
  const element = el('div', { className: 'rating-surface' }, [
    el('div', { className: 'field-note', text: spec.note }),
    holder,
    ...(beyond.length > 0 ? [el('div', { className: 'rating-choices' }, beyond.map((held) => held.element))] : []),
  ]);
  const repaint = () => {
    for (const held of beyond) held.repaint();
    const focused = figure.contains(document.activeElement) ? document.activeElement.getAttribute('data-pick') : null;
    const fresh = graphFigure(spec, inTree, state, pick);
    holder.replaceChild(fresh, figure);
    figure = fresh;
    if (focused) fresh.querySelector(`[data-pick="${focused}"]`)?.focus();
  };
  return { element, repaint };
};

/** The classes a score falls in, as one line, the score's own class named first when it has one. */
function scaleNote(classes, value) {
  const spans = classes.map(([from, name], i) => {
    const to = i === 0 ? from : classes[i - 1][0] - 1;
    return `${to === from ? from : `${from}–${to}`} ${name}`;
  });
  const held = scoreOf(value);
  const own = Number.isNaN(held) ? null : classes.find(([from]) => held >= from)?.[1];
  return own ? `${held} is ${own} — ${spans.join(' · ')}` : spans.join(' · ');
}

/** Two scores to enter, each with the classes it falls in beneath it. */
function scoringSurface(parameters, state, changed) {
  const fields = [
    [parameters[0], SCORING_CLASSES.severity],
    [parameters[1], SCORING_CLASSES.probability],
  ].map(([definition, classes]) => {
    const input = el('input', {
      className: 'field-input',
      attributes: { type: 'number', min: String(definition.min), max: String(definition.max), id: `rate-${definition.key}` },
    });
    input.value = state[definition.key];
    input.addEventListener('input', () => {
      state[definition.key] = input.value;
      changed();
    });
    const note = el('div', { className: 'field-note' });
    const element = el('div', { className: 'field' }, [
      el('label', { className: 'field-label', text: definition.name, attributes: { for: `rate-${definition.key}` } }),
      input,
      note,
    ]);
    const repaint = () => {
      note.textContent = scaleNote(classes, state[definition.key]);
    };
    return { element, repaint };
  });
  return {
    element: el('div', { className: 'risk-scores' }, fields.map((held) => held.element)),
    repaint: () => {
      for (const held of fields) held.repaint();
    },
  };
}

/**
 * The four scales as options, and a matrix of severity against the
 * class the other three add to beneath them, the cell the class reaches
 * marked: the report's hybrid form, and IEC 62061's assignment.
 * @param {{ bands: number[][], table: Object<number, string[]> }} spec
 */
const classMatrixSurface = ({ bands, table }) => (parameters, state, changed) => {
  const [se, fr, pr, av] = parameters;
  const groups = parameters.map((definition) => optionGroup(definition, state, changed));
  const cells = [];
  const head = el('tr', {}, [
    el('th', { text: 'Severity Se' }),
    ...bands.map(([low, high]) => el('th', { text: `Cl ${low}–${high}`, attributes: { scope: 'col' } })),
  ]);
  const rows = [4, 3, 2, 1].map((severity) =>
    el('tr', {}, [
      el('th', { text: String(severity), attributes: { scope: 'row' } }),
      ...table[severity].map((level, column) => {
        const cell = levelCell(level, 'risk-cell still');
        cells.push({ cell, severity, column });
        return el('td', {}, [cell]);
      }),
    ])
  );
  const matrix = el('table', { className: 'risk-matrix' }, [el('thead', {}, [head]), el('tbody', {}, rows)]);
  const element = el('div', { className: 'rating-surface' }, [el('div', { className: 'rating-choices' }, groups.map((held) => held.element)), matrix]);
  const repaint = () => {
    for (const held of groups) held.repaint();
    const severity = scoreOf(state[se.key]);
    const cl = scoreOf(state[fr.key]) + scoreOf(state[pr.key]) + scoreOf(state[av.key]);
    const column = Number.isNaN(cl) ? -1 : bands.findIndex(([low, high]) => cl >= low && cl <= high);
    for (const held of cells) held.cell.classList.toggle('reached', held.severity === severity && held.column === column);
  };
  return { element, repaint };
};

const SURFACES = {
  'Risk matrix': matrixSurface,
  'Risk graph': graphSurface(RISK_GRAPH_SPEC),
  'Numerical scoring': scoringSurface,
  'Hybrid tool': classMatrixSurface({ bands: HYBRID_BANDS, table: HYBRID }),
  [PL_METHOD]: graphSurface(PL_GRAPH_SPEC),
  [SIL_METHOD]: classMatrixSurface({ bands: SIL_BANDS, table: SIL_MATRIX }),
};

/**
 * Rate under a method. Resolves the parameters' values as chosen, keyed
 * as the definitions are, or null when cancelled or dismissed.
 * @param {{ open: Function }} dialogs
 * @param {Object} spec
 * @param {string} spec.title
 * @param {string} spec.method
 * @param {Array<Object>} spec.definitions  the rating's definitions, the computed one among them
 * @param {Object<string, string>} spec.values
 * @returns {Promise<Object<string, string>|null>}
 */
export async function rateDialog(dialogs, { title, method, definitions, values }) {
  const surface = SURFACES[method];
  if (!surface) return null;
  const parameters = definitions.filter((definition) => definition.kind !== 'computed');
  const state = Object.fromEntries(parameters.map((definition) => [definition.key, values[definition.key] ?? '']));
  const result = el('div', { className: 'risk-result' });
  const built = surface(parameters, state, () => repaint());
  function repaint() {
    built.repaint();
    const held = estimate(method, parameters.map((definition) => state[definition.key]));
    result.className = `risk-result${held === null ? ' unrated' : ''}`;
    result.textContent = '';
    if (held !== null && levelTone(held) !== 'none') result.appendChild(statusIcon(levelTone(held)));
    result.appendChild(el('span', { text: held ?? 'Not rated' }));
  }
  repaint();
  const body = el('div', { className: 'rating' }, [built.element, result]);
  const answer = await dialogs.open({
    title,
    body,
    actions: [
      { label: 'Cancel', value: null, kind: 'secondary' },
      { label: 'Apply', value: 'confirmed', kind: 'primary' },
    ],
    initialFocus: body.querySelector('button, input'),
  });
  return answer === 'confirmed' ? { ...state } : null;
}
