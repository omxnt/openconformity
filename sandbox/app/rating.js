/**
 * The rating dialog: a method's parameters, each a control with its
 * rationale beneath it, then the method's figure — the matrix or the
 * graph as the report draws it — read-only, showing where the classes
 * chosen meet, then, under the name of the attribute it computes, what
 * the rating comes to. It resolves the parameter
 * and rationale values as chosen, or null when it is cancelled; nothing
 * is written until the caller does.
 */

import { el, icon, svg, svgText } from './dom.js';
import { isOutcome, isRationale } from './attributes.js';
import {
  estimate,
  levelTone,
  ESTIMATED,
  codeOf,
  scoreOf,
  MATRIX_METHOD,
  GRAPH_METHOD,
  MATRIX,
  MATRIX_SEVERITY,
  MATRIX_PROBABILITY,
  GRAPH_TREE,
  graphPath,
  graphLive,
  graphBand,
  SCORING_CLASSES,
} from './risk.js';

/**
 * Carbon's status indicator for a tone: error, warning, or the check —
 * the check in the secondary colour where the level is negligible.
 * @param {'high'|'medium'|'low'|'negligible'} tone
 */
export function statusIcon(tone) {
  const held = icon({ high: 'i-error-filled', medium: 'i-warning-filled' }[tone] ?? 'i-checkmark-filled');
  held.classList.add('status-icon', `tone-${tone}`);
  return held;
}

/**
 * One parameter's classes as a row of buttons, Carbon's content
 * switcher: the chosen one pressed, a second press clearing it.
 */
function optionGroup(definition, state, changed) {
  const buttons = definition.values.map((value) => {
    const button = el('button', { className: 'risk-option', text: value, attributes: { type: 'button', 'aria-pressed': 'false' } });
    button.addEventListener('click', () => {
      state[definition.key] = state[definition.key] === value ? '' : value;
      changed();
    });
    return button;
  });
  const element = el('div', { className: 'risk-options', attributes: { role: 'group', 'aria-label': definition.name } }, buttons);
  const repaint = () => {
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.textContent === state[definition.key]));
  };
  return { element, repaint };
}

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

/** A score to enter: digits alone, kept within the parameter's bounds, with a dial to step it. */
function scoreInput(definition, state, changed) {
  const input = el('input', {
    className: 'field-input',
    attributes: { type: 'number', min: String(definition.min), max: String(definition.max), step: '1', inputmode: 'numeric', autocomplete: 'off', id: `rate-${definition.key}` },
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
  const repaint = () => {
    if (input.value !== state[definition.key]) input.value = state[definition.key];
  };
  return { element: input, repaint };
}

/** A score field over the table of its classes. */
function scoreControl(definition, classes, state, changed) {
  const input = scoreInput(definition, state, changed);
  const scale = scaleTable(classes);
  return {
    element: el('div', { className: 'risk-score' }, [input.element, scale.element]),
    repaint: () => {
      input.repaint();
      scale.repaint(state[definition.key]);
    },
    labelFor: `rate-${definition.key}`,
  };
}

/**
 * A parameter as a block: its name, its control, and its rationale
 * beneath, a text area labelled as such.
 */
function parameterBlock(definition, rationale, control, state, typed) {
  const name = control.labelFor
    ? el('label', { className: 'field-label', text: definition.name, attributes: { for: control.labelFor } })
    : el('div', { className: 'field-label', text: definition.name });
  const area = rationale ? el('textarea', { className: 'field-input', attributes: { rows: '2', id: `rate-${rationale.key}` } }) : null;
  if (area) {
    area.value = state[rationale.key];
    area.addEventListener('input', () => {
      state[rationale.key] = area.value;
      typed();
    });
  }
  const element = el('div', { className: 'rating-parameter' }, [
    name,
    control.element,
    ...(area ? [el('label', { className: 'field-label', text: 'Rationale', attributes: { for: `rate-${rationale.key}` } }), area] : []),
  ]);
  const repaint = () => {
    control.repaint();
    if (area && area.value !== state[rationale.key]) area.value = state[rationale.key];
  };
  return { element, area, repaint };
}

/**
 * The parameters two to a row, a row of classes to press for a choice
 * and a score field for a number, the rationale areas of a row kept
 * the same height.
 */
function parametersGrid(parameters, rationales, state, changed) {
  const classes = [SCORING_CLASSES.severity, SCORING_CLASSES.probability];
  const blocks = parameters.map((definition, i) => {
    const control = definition.kind === 'number' ? scoreControl(definition, classes[i], state, changed) : optionGroup(definition, state, changed);
    const rationale = rationales.find((held) => held.parameter === definition.key) ?? null;
    return parameterBlock(definition, rationale, control, state, () => level());
  });
  function level() {
    for (let i = 0; i < blocks.length; i += 2) {
      const pair = blocks.slice(i, i + 2).map((block) => block.area).filter(Boolean);
      if (pair.length === 0) continue;
      for (const area of pair) area.style.height = 'auto';
      const tallest = Math.max(...pair.map((area) => area.scrollHeight));
      for (const area of pair) area.style.height = `${tallest}px`;
    }
  }
  return {
    element: el('div', { className: 'rating-parameters' }, blocks.map((block) => block.element)),
    repaint: () => {
      for (const block of blocks) block.repaint();
      level();
    },
    level,
  };
}

/** Table 1 as the figure: the classes as headers, the chosen ones marked, and the cell the two meet at. */
function matrixFigure(parameters, state) {
  const [severity, probability] = parameters;
  const columns = MATRIX_SEVERITY.map((held) => el('th', { text: held, attributes: { scope: 'col' } }));
  const rows = [];
  const cells = [];
  const body = MATRIX_PROBABILITY.map((held) => {
    const head = el('th', { text: held, attributes: { scope: 'row' } });
    rows.push({ head, row: held });
    return el('tr', {}, [
      head,
      ...MATRIX_SEVERITY.map((column, i) => {
        const level = MATRIX[held][i];
        const cell = el('div', { className: `risk-cell tone-${levelTone(level)}` }, [el('span', { className: 'risk-dot' }), el('span', { text: level })]);
        cells.push({ cell, column, row: held });
        return el('td', {}, [cell]);
      }),
    ]);
  });
  const element = el('table', { className: 'risk-matrix', attributes: { 'aria-label': 'The risk matrix' } }, [el('thead', {}, [el('tr', {}, [el('th', { text: '' }), ...columns])]), el('tbody', {}, body)]);
  const repaint = () => {
    columns.forEach((head, i) => head.classList.toggle('chosen', state[severity.key] === MATRIX_SEVERITY[i]));
    for (const { head, row } of rows) head.classList.toggle('chosen', state[probability.key] === row);
    for (const { cell, column, row } of cells) cell.classList.toggle('reached', state[severity.key] === column && state[probability.key] === row);
  };
  return { element, repaint };
}

/**
 * A graph drawn for all but its last parameter, and that one as columns:
 * each branch a line with its codes above it as tags, side by side on a
 * merged branch, the one chosen filled, a parent running straight into its middle
 * child, so a junction reads as one line branching; each branch's row
 * ending in a cell per class of the last parameter, holding the index
 * that branch and that class reach, with the dot of its band, one cell
 * across the classes a merged leaf takes, so no line ever crosses
 * another and no cell draws a distinction the graph does not make; the
 * path the classes chosen trace in the interactive colour, to the cell
 * it reaches. The figure is drawn at its own size, the lines on pixel
 * centres, so nothing is scaled.
 * @param {{ name: string, tree: Object, headings: string[], leafOutcome: (leaf: Object) => string, leafTone: (leaf: Object) => string }} spec
 */
function graphFigure(spec, parameters, state) {
  const COLUMN = 128;
  const ROW = 28;
  const LEFT = 8;
  const TOP = 60;
  const GAP = 12;
  const CELL = { width: 72, height: 22, gap: 8 };
  const CHIP = { width: 28, height: 18, gap: 4 };
  const drawn = parameters.length - 1;
  const columns = parameters[drawn].values;
  const layout = new Map();
  const rows = [];
  (function place(node, depth) {
    if (depth === drawn) {
      layout.set(node, { depth, row: rows.length });
      rows.push(node);
      return;
    }
    for (const child of node.children) place(child, depth + 1);
    const held = node.children.map((child) => layout.get(child).row);
    const middle = (held.length - 1) / 2;
    layout.set(node, { depth, row: Number.isInteger(middle) ? held[middle] : (held[Math.floor(middle)] + held[Math.ceil(middle)]) / 2 });
  })(spec.tree, 0);
  const x = (depth) => LEFT + depth * COLUMN;
  const y = (row) => TOP + Math.round(row * ROW) + 0.5;
  const cellX = (i) => x(drawn + 1) - GAP + i * (CELL.width + CELL.gap);
  /** A code as the form shows a choice: a tag, filled where it is chosen, the code centred on it, dimmed where its branch is not live. */
  const chip = (cx, cy, code, chosen, live) => [
    ...(chosen ? [svg('rect', { class: 'risk-chip', x: String(cx - CHIP.width / 2), y: String(cy - CHIP.height / 2), width: String(CHIP.width), height: String(CHIP.height), rx: String(CHIP.height / 2) })] : []),
    svgText('text', { x: String(cx), y: String(cy + 4), 'text-anchor': 'middle', class: `risk-code${chosen ? ' chosen' : ''}${live ? '' : ' dim'}` }, code),
  ];

  const codes = parameters.map((definition) => codeOf(state[definition.key]));
  const path = graphPath(codes, spec.tree);
  const onPath = new Set(path);
  const reachedRow = path.length > drawn ? path[drawn] : null;
  const reachedColumn = path.length > drawn + 1 ? codes[drawn] : null;

  const parts = [];
  spec.headings.forEach((heading, i) => {
    if (i < drawn) {
      parts.push(svgText('text', { x: String(x(i + 1)), y: '16', class: 'risk-head' }, heading));
      return;
    }
    const centre = (cellX(0) + cellX(columns.length - 1) + CELL.width) / 2;
    parts.push(svgText('text', { x: String(centre), y: '16', 'text-anchor': 'middle', class: 'risk-head' }, heading));
    columns.forEach((code, column) => parts.push(...chip(cellX(column) + CELL.width / 2, 34, code, codes[drawn] === code, true)));
  });
  const edge = (d, active) => svg('path', { d, class: active ? 'risk-edge active' : 'risk-edge' });

  (function draw(node, ancestors) {
    const { depth, row } = layout.get(node);
    const from = depth === 0 ? x(0) : x(depth) - GAP + 0.5;
    const to = depth === drawn ? cellX(0) - 4 : x(depth + 1) - GAP + 0.5;
    parts.push(edge(`M ${from} ${y(row)} H ${to}`, onPath.has(node)));
    const live = depth === 0 || graphLive(codes, ancestors);
    if (depth === 0) {
      parts.push(svgText('text', { x: String(x(0)), y: String(y(row) - 8), class: 'risk-label' }, node.label));
    } else {
      node.codes.forEach((code, i) => parts.push(...chip(x(depth) + 2 + CHIP.width / 2 + i * (CHIP.width + CHIP.gap), y(row) - 12, code, live && codes[ancestors.length] === code, live)));
    }
    if (depth === drawn) {
      for (const leaf of node.children) {
        const first = columns.indexOf(leaf.codes[0]);
        const left = cellX(first);
        const width = cellX(first + leaf.codes.length - 1) + CELL.width - left;
        const mid = left + width / 2;
        const top = y(row) - CELL.height / 2;
        parts.push(
          svg('g', { class: `risk-leaf tone-${spec.leafTone(leaf)}${node === reachedRow && leaf.codes.includes(reachedColumn) ? ' active' : ''}` }, [
            svg('rect', { class: 'risk-leaf-cell', x: String(left), y: String(top), width: String(width), height: String(CELL.height) }),
            svg('rect', { class: 'risk-leaf-bar', x: String(left), y: String(top), width: '3', height: String(CELL.height) }),
            svg('circle', { class: 'risk-leaf-dot', cx: String(mid - 9), cy: String(y(row)), r: '4' }),
            svgText('text', { x: String(mid + 5), y: String(y(row) + 4) }, spec.leafOutcome(leaf)),
          ])
        );
      }
      return;
    }
    for (const child of node.children) {
      parts.push(edge(`M ${to} ${y(row)} V ${y(layout.get(child).row)}`, onPath.has(node) && onPath.has(child)));
      draw(child, depth === 0 ? [] : [...ancestors, node]);
    }
  })(spec.tree, []);

  const width = cellX(columns.length - 1) + CELL.width + LEFT;
  const height = y(rows.length - 1) + CELL.height / 2 + 4;
  return svg(
    'svg',
    { class: 'risk-graph', width: String(width), height: String(height), viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `${spec.name}, the path of the classes chosen lit` },
    parts
  );
}

/** The report's risk graph, Figure 3, merged as the report merges it: three levels as the tree, the avoidance as columns, each cell the index reached, toned by its band. */
const RISK_GRAPH_SPEC = {
  name: 'The risk graph',
  tree: GRAPH_TREE,
  headings: ['Severity', 'Exposure', 'Occurrence', 'Avoidance'],
  leafOutcome: (leaf) => String(leaf.index),
  leafTone: (leaf) => levelTone(graphBand(leaf.index)),
};

/** A graph as the figure, redrawn as the classes change. */
const graphFigureFor = (spec) => (parameters, state) => {
  let figure = graphFigure(spec, parameters, state);
  const element = el('div', { className: 'rating-graph' }, [figure]);
  const repaint = () => {
    const fresh = graphFigure(spec, parameters, state);
    element.replaceChild(fresh, figure);
    figure = fresh;
  };
  return { element, repaint };
};

/** The figure each method is shown by; the scores have none, their classes standing beneath each score. */
const FIGURES = {
  [MATRIX_METHOD]: matrixFigure,
  [GRAPH_METHOD]: graphFigureFor(RISK_GRAPH_SPEC),
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
  if (!ESTIMATED.includes(method)) return null;
  const parameters = definitions.filter((definition) => !isOutcome(definition) && !isRationale(definition));
  const rationales = definitions.filter(isRationale);
  const state = Object.fromEntries([...parameters, ...rationales].map((definition) => [definition.key, values[definition.key] ?? '']));
  const grid = parametersGrid(parameters, rationales, state, () => repaint());
  const figure = FIGURES[method]?.(parameters, state) ?? null;
  const closing = definitions.find(isOutcome);
  const outcome = el('span', { className: 'risk-outcome' });
  const result = el('div', { className: 'risk-result' }, [el('div', { className: 'field-label', text: closing?.name ?? 'Rating' }), outcome]);
  function repaint() {
    grid.repaint();
    figure?.repaint();
    const held = estimate(method, parameters.map((definition) => state[definition.key]));
    result.className = `risk-result${held === null ? ' unrated' : ''}`;
    outcome.textContent = '';
    if (held !== null && levelTone(held) !== 'none') outcome.appendChild(statusIcon(levelTone(held)));
    outcome.appendChild(el('span', { text: held ?? 'Not rated' }));
  }
  repaint();
  const body = el('div', { className: 'rating' }, [grid.element, ...(figure ? [figure.element] : []), result]);
  requestAnimationFrame(() => grid.level());
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
