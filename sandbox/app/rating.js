/**
 * The rating dialog: a rating made by its method, laid out as the
 * method's document lays it out — the matrix to click, the graph to
 * follow, the scores to enter — and beneath it the rationale to type
 * for each parameter, why that class was chosen. It resolves the
 * parameter and rationale values as chosen, or null when it is
 * cancelled; nothing is written until the caller does.
 */

import { el, icon, svg, svgText } from './dom.js';
import { isOutcome, isRationale } from './attributes.js';
import {
  estimate,
  levelTone,
  codeOf,
  scoreOf,
  MATRIX_METHOD,
  GRAPH_METHOD,
  SCORING_METHOD,
  MATRIX,
  MATRIX_SEVERITY,
  MATRIX_PROBABILITY,
  GRAPH_TREE,
  graphPath,
  graphPick,
  graphLive,
  SCORING_CLASSES,
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

/** Table 1 as the tool it is: a cell per pair, pressed where the rating stands, pressed again to clear it. */
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
          const pressed = state[severity.key] === column && state[probability.key] === held;
          state[severity.key] = pressed ? '' : column;
          state[probability.key] = pressed ? '' : held;
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

/** Codes as a phrase: `S1 or S2`, `O1, O2 or O3`. */
const listed = (codes) => (codes.length < 2 ? codes.join('') : `${codes.slice(0, -1).join(', ')} or ${codes.at(-1)}`);

/**
 * A graph drawn and made the picker: each branch a line with its label
 * above it, the codes of a merged branch as separate words, every word
 * a button; a parent running straight into its middle child, so a
 * junction reads as one line branching; each leaf ending in the index it
 * reaches; the path the rating resolves so far in the interactive
 * colour, the codes next to pick in the link colour, branches no longer
 * reachable dimmed. The figure is drawn at its own size, the lines on
 * pixel centres, so nothing is scaled, and top down, so the keyboard
 * opens on the first severity.
 * @param {{ name: string, tree: Object, headings: string[], leafOutcome: (leaf: Object) => string }} spec
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
    const middle = (rows.length - 1) / 2;
    layout.set(node, { depth, row: Number.isInteger(middle) ? rows[middle] : (rows[Math.floor(middle)] + rows[Math.ceil(middle)]) / 2 });
  })(spec.tree, 0);
  const x = (depth) => LEFT + depth * COLUMN;
  const y = (row) => TOP + Math.round(row * ROW) + 0.5;
  const cx = x(levels + 1) + RADIUS + 4;

  const codes = parameters.map((definition) => codeOf(state[definition.key]));
  const path = graphPath(codes, spec.tree);
  const onPath = new Set(path);
  const last = path.at(-1);
  const frontier = last.children && codes[path.length - 1] === '' ? last : null;

  const parts = [];
  spec.headings.forEach((heading, i) => {
    const column = i === levels ? { x: String(cx), 'text-anchor': 'middle' } : { x: String(x(i + 1)) };
    parts.push(svgText('text', { ...column, y: '16', class: 'risk-head' }, heading));
  });
  const edge = (d, active) => svg('path', { d, class: active ? 'risk-edge active' : 'risk-edge' });

  (function draw(node, ancestors, id, parent) {
    const { depth, row } = layout.get(node);
    const from = depth === 0 ? x(0) : x(depth) - GAP + 0.5;
    const to = node.children ? x(depth + 1) - GAP + 0.5 : cx - RADIUS;
    parts.push(edge(`M ${from} ${y(row)} H ${to}`, onPath.has(node)));
    const live = depth === 0 || graphLive(codes, ancestors);
    const next = parent === frontier;
    const label = svgText('text', { x: String(x(depth) + (depth === 0 ? 0 : 2)), y: String(y(row) - 6), class: live ? 'risk-label' : 'risk-label dim' }, '');
    if (depth === 0) {
      label.textContent = node.label;
    } else {
      node.codes.forEach((code, i) => {
        if (i > 0) label.appendChild(document.createTextNode(', '));
        const chosen = live && codes[ancestors.length] === code;
        const word = svgText(
          'tspan',
          { class: chosen ? 'risk-code selected' : next ? 'risk-code next' : 'risk-code', role: 'button', tabindex: '0', 'data-pick': `${id}:${code}` },
          code
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
    if (!node.children) {
      parts.push(
        svg('g', { class: node === last ? 'risk-leaf active' : 'risk-leaf' }, [
          svg('circle', { cx: String(cx), cy: String(y(row)), r: String(RADIUS) }),
          svgText('text', { x: String(cx), y: String(y(row) + 4) }, spec.leafOutcome(node)),
        ])
      );
    }
    for (const [i, child] of (node.children ?? []).entries()) {
      parts.push(edge(`M ${to} ${y(row)} V ${y(layout.get(child).row)}`, onPath.has(node) && onPath.has(child)));
      draw(child, depth === 0 ? [] : [...ancestors, node], `${id}.${i}`, node);
    }
  })(spec.tree, [], '0', null);

  const width = cx + 40;
  const height = y(leaves.length - 1) + RADIUS + 4;
  return svg(
    'svg',
    { class: 'risk-graph', width: String(width), height: String(height), viewBox: `0 0 ${width} ${height}`, role: 'group', 'aria-label': `${spec.name}: pick a branch at each level` },
    parts
  );
}

/** What the graph waits on: the codes to pick at the level the path stops at, or null where it is decided. */
function graphHint(spec, codes) {
  const path = graphPath(codes, spec.tree);
  const last = path.at(-1);
  if (!last.children || codes[path.length - 1] !== '') return null;
  return `Pick ${listed([...new Set(last.children.flatMap((child) => child.codes))])}`;
}

/** The report's risk graph, Figure 3: four levels, each leaf ending in its index. */
const RISK_GRAPH_SPEC = {
  name: 'The risk graph',
  tree: GRAPH_TREE,
  headings: ['Severity', 'Exposure', 'Occurrence', 'Avoidance', 'Risk index'],
  leafOutcome: (leaf) => String(leaf.index),
  note: 'Pick a branch at each level: the path lights as far as it is decided, and the index at its end. A code picked again clears it.',
};

/**
 * A graph as the picker, a word of guidance above it; a pick keeps the
 * keyboard where it was, and a chosen code picked again clears its level
 * and those below it.
 */
const graphSurface = (spec) => (parameters, state, changed) => {
  const codes = () => parameters.map((definition) => codeOf(state[definition.key]));
  const valueOf = (definition, code) => definition.values.find((value) => codeOf(value) === code) ?? code;
  const pick = (ancestors, code) => {
    const held = codes();
    const next = held[ancestors.length] === code ? held.map((chosen, level) => (level >= ancestors.length ? '' : chosen)) : graphPick(held, ancestors, code);
    parameters.forEach((definition, level) => {
      state[definition.key] = next[level] === '' ? '' : valueOf(definition, next[level]);
    });
    changed();
  };
  let figure = graphFigure(spec, parameters, state, pick);
  const holder = el('div', { className: 'rating-graph' }, [figure]);
  const element = el('div', { className: 'rating-surface' }, [el('div', { className: 'field-note', text: spec.note }), holder]);
  const repaint = () => {
    const focused = figure.contains(document.activeElement) ? document.activeElement.getAttribute('data-pick') : null;
    const fresh = graphFigure(spec, parameters, state, pick);
    holder.replaceChild(fresh, figure);
    figure = fresh;
    if (focused) fresh.querySelector(`[data-pick="${focused}"]`)?.focus();
  };
  return { element, repaint, hint: () => graphHint(spec, codes()) };
};

/** A score's classes as a small table beneath it, the range then the class, the score's own class marked. */
function scaleTable(classes) {
  const rows = classes.map(([from, name], i) => {
    const to = i === 0 ? from : classes[i - 1][0] - 1;
    return [el('span', { className: 'risk-scale-range', text: to === from ? String(from) : `${from}–${to}` }), el('span', { className: 'risk-scale-class', text: name })];
  });
  const element = el('div', { className: 'risk-scale' }, rows.flat());
  const repaint = (value) => {
    const held = scoreOf(value);
    const own = Number.isNaN(held) ? -1 : classes.findIndex(([from]) => held >= from);
    rows.forEach((row, i) => {
      for (const span of row) span.classList.toggle('own', i === own);
    });
  };
  return { element, repaint };
}

/** A score to enter: digits alone, kept within the parameter's bounds. */
function scoreInput(definition, state, changed) {
  const input = el('input', {
    className: 'field-input',
    attributes: { type: 'text', inputmode: 'numeric', autocomplete: 'off', id: `rate-${definition.key}` },
  });
  input.value = state[definition.key];
  input.addEventListener('beforeinput', (event) => {
    if (event.data && /\D/.test(event.data)) event.preventDefault();
  });
  input.addEventListener('input', () => {
    const digits = input.value.replace(/\D/g, '');
    const held = digits === '' ? '' : String(Math.min(definition.max, Math.max(definition.min, Number(digits))));
    if (input.value !== held) input.value = held;
    state[definition.key] = held;
    changed();
  });
  return input;
}

/** Two scores to enter, each with the classes it falls in beneath it. */
function scoringSurface(parameters, state, changed) {
  const fields = [
    [parameters[0], SCORING_CLASSES.severity],
    [parameters[1], SCORING_CLASSES.probability],
  ].map(([definition, classes]) => {
    const input = scoreInput(definition, state, changed);
    const scale = scaleTable(classes);
    const element = el('div', { className: 'field' }, [
      el('label', { className: 'field-label', text: definition.name, attributes: { for: `rate-${definition.key}` } }),
      input,
      scale.element,
    ]);
    const repaint = () => {
      if (input.value !== state[definition.key]) input.value = state[definition.key];
      scale.repaint(state[definition.key]);
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
 * The rationale beneath the surface: a text area per parameter, two to
 * a row and the two of a row kept the same height, labelled by the
 * parameter's name and the code it holds, for why that class was
 * chosen.
 */
function rationaleBlock(parameters, rationales, state) {
  const fields = rationales.map((rationale) => {
    const parameter = parameters.find((definition) => definition.key === rationale.parameter);
    const area = el('textarea', { className: 'field-input', attributes: { rows: '2', id: `rate-${rationale.key}` } });
    area.value = state[rationale.key];
    area.addEventListener('input', () => {
      state[rationale.key] = area.value;
      level();
    });
    const label = el('label', { className: 'field-label', attributes: { for: `rate-${rationale.key}` } });
    const element = el('div', { className: 'field' }, [label, area]);
    const repaint = () => {
      const code = codeOf(state[parameter.key]);
      label.textContent = code ? `${parameter.name}: ${code}` : parameter.name;
      if (area.value !== state[rationale.key]) area.value = state[rationale.key];
    };
    return { element, area, repaint };
  });
  function level() {
    for (let i = 0; i < fields.length; i += 2) {
      const pair = fields.slice(i, i + 2).map((held) => held.area);
      for (const area of pair) area.style.height = 'auto';
      const tallest = Math.max(...pair.map((area) => area.scrollHeight));
      for (const area of pair) area.style.height = `${tallest}px`;
    }
  }
  return {
    element: el('div', { className: 'rating-rationale' }, [el('div', { className: 'cell-legend', text: 'Rationale' }), el('div', { className: 'rating-rationale-fields' }, fields.map((held) => held.element))]),
    repaint: () => {
      for (const held of fields) held.repaint();
      level();
    },
    level,
  };
}

const SURFACES = {
  [MATRIX_METHOD]: matrixSurface,
  [GRAPH_METHOD]: graphSurface(RISK_GRAPH_SPEC),
  [SCORING_METHOD]: scoringSurface,
};

/**
 * Rate under a method. Resolves the parameters' and rationales' values
 * as chosen, keyed as the definitions are, or null when cancelled or
 * dismissed.
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
  const parameters = definitions.filter((definition) => !isOutcome(definition) && !isRationale(definition));
  const rationales = definitions.filter(isRationale);
  const state = Object.fromEntries([...parameters, ...rationales].map((definition) => [definition.key, values[definition.key] ?? '']));
  const outcome = el('span', { className: 'risk-outcome' });
  const result = el('div', { className: 'risk-result' }, [outcome]);
  const built = surface(parameters, state, () => repaint());
  const reasons = rationaleBlock(parameters, rationales, state);
  function repaint() {
    built.repaint();
    reasons.repaint();
    const held = estimate(method, parameters.map((definition) => state[definition.key]));
    result.className = `risk-result${held === null ? ' unrated' : ''}`;
    outcome.textContent = '';
    if (held !== null && levelTone(held) !== 'none') outcome.appendChild(statusIcon(levelTone(held)));
    outcome.appendChild(el('span', { text: held ?? built.hint?.() ?? 'Not rated' }));
  }
  repaint();
  const body = el('div', { className: 'rating' }, [built.element, result, ...(rationales.length > 0 ? [reasons.element] : [])]);
  requestAnimationFrame(() => reasons.level());
  const answer = await dialogs.open({
    title,
    body,
    actions: [
      { label: 'Cancel', value: null, kind: 'secondary' },
      { label: 'Apply', value: 'confirmed', kind: 'primary' },
    ],
    initialFocus: body.querySelector('button, input, [tabindex="0"], textarea'),
  });
  return answer === 'confirmed' ? { ...state } : null;
}
