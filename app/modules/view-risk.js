/**
 * The risk assessment as a view: one row per accident scenario, read
 * in the order the assessment is made, and holding only what relates to
 * the scenario directly. The scenario first as the row's subject, with
 * its hazardous event and potential consequence, then its hazardous
 * situation, the hazards, actors and tasks it is related to, its
 * initial rating, the protective measures reducing its risk, and its
 * residual rating with the risk evaluation beneath it. Each rating
 * parameter shows the rationale given for it beneath its value. One tab for all
 * scenarios and one per phase its tasks occur during, each counting its
 * rows in its name. A pure function of the model, returning the description
 * views.js renders and exports: a title and sections, each a lead and
 * tables of columns and rows.
 *
 * A column is a name or an object with a text, an optional group whose
 * name stands over consecutive columns sharing it, an optional title
 * behind a short text, and narrow where the cell holds a code. A row is
 * the entity it is about and its cells. A cell is text, `{ lines }` of
 * text, `{ entities }` by id, `{ code, title, note }` for a rating
 * parameter, or `{ outcome, note }` holding the rating view or null,
 * the note being text shown beneath.
 */

import { ATTRIBUTES, isParameter } from './attributes.js';
import { ENTITY_TYPES } from './metamodel.js';
import { entityLabel, relatedIds } from './queries.js';
import { ratingView, initials } from './fields.js';

/** The rating group of a name under an estimation method, or undefined. */
function ratingGroup(name, method) {
  return ATTRIBUTES.SCN.groups
    .flatMap((group) => group.groups ?? [])
    .find((group) => group.name === name && group.when?.key === 'estimationMethod' && group.when.value === method);
}

const parametersOf = (group) => group.attributes.filter(isParameter);

/** A parameter's letters for a column head: a number's the initials of its name, SS; else from its first value where that is a code, S from S1 and Se from Se 1; else the initial of its name. */
const letters = (definition) => {
  if (definition.kind === 'number') return initials(definition.name);
  const first = definition.values?.[0] ?? '';
  return /\d/.test(first) ? first.replace(/[\d\s]+/g, '') : definition.name[0];
};

/** Whether a rating group is typed rather than read: it closes on no computed attribute. */
const isTyped = (group) => group !== undefined && !group.attributes.some((definition) => definition.kind === 'computed');

/**
 * The columns a rating takes under a method: one per parameter, headed
 * by its letters with the name behind them, then the rating it comes
 * to. Under no method, the typed rating as one column; under an unknown
 * one, the rating alone.
 * @param {string} name  the rating group's name
 * @param {string} method
 */
export function ratingColumns(name, method) {
  const group = ratingGroup(name, method);
  if (isTyped(group)) return [{ text: 'Rating', group: name }];
  const parameters = group ? parametersOf(group) : [];
  return [
    ...parameters.map((definition) => ({ text: letters(definition), title: definition.name, group: name, narrow: true })),
    { text: 'Rating', group: name, narrow: true },
  ];
}

/**
 * A scenario's cells under those columns: each parameter's code with
 * the rationale given for it beneath, its name and value behind it, and
 * the outcome, empty where the scenario is not rated.
 * @param {import('./model.js').Entity} scenario
 * @param {string} name
 * @param {string} method
 */
export function ratingCells(scenario, name, method) {
  const group = ratingGroup(name, method);
  if (!group) return [{ outcome: null }];
  if (isTyped(group)) return [(scenario.attributes[group.attributes[0].key] ?? '').trim()];
  const view = ratingView(group.attributes, scenario.attributes);
  return [
    ...parametersOf(group).map((definition, i) => ({
      code: view.parameters[i].code,
      title: view.parameters[i].value ? `${view.parameters[i].name}: ${view.parameters[i].value}` : '',
      note: view.parameters[i].value ? (view.parameters[i].rationale ?? '').trim() : '',
    })),
    { outcome: view },
  ];
}

/**
 * A scenario's own text as lines, one dash where it holds none.
 * @param {import('./model.js').Entity} scenario
 * @param {string} key
 */
const prose = (scenario, key) => {
  const text = (scenario.attributes[key] ?? '').trim();
  return { lines: text === '' ? [''] : text.split('\n') };
};

/**
 * The residual rating's cells with the scenario's risk evaluation
 * beneath the rating, the judgement standing under what it judges.
 * @param {Array<*>} cells
 * @param {import('./model.js').Entity} scenario
 */
const withEvaluation = (cells, scenario) => {
  const evaluation = (scenario.attributes.evaluation ?? '').trim();
  const last = cells.at(-1);
  const held = typeof last === 'string' ? { lines: [last, ...(evaluation ? [evaluation] : [])] } : { ...last, note: evaluation };
  return [...cells.slice(0, -1), held];
};

/**
 * @param {import('./model.js').Model} model
 */
export function buildRiskView(model) {
  const entities = (code) =>
    [...model.nodes.values()].filter((node) => node.kind === 'entity' && node.type === code).sort((a, b) => a.id.localeCompare(b.id));
  const related = (id, type) => relatedIds(model, id, type);
  const through = (ids, type) => [...new Set(ids.flatMap((id) => related(id, type)))].sort();
  const listed = (code) => `${ENTITY_TYPES[code].name[0]}${ENTITY_TYPES[code].name.slice(1).toLowerCase()}s`;

  const scenarios = entities('SCN');
  const phases = entities('PHS');
  const method = model.attributes.estimationMethod ?? '';
  const phasesOf = (scenario) => through(related(scenario.id, 'tsk-gives-rise-to-scn'), 'tsk-occurs-during-phs');

  const columns = [
    { text: 'Scenario', group: 'Accident scenario' },
    { text: 'Hazardous event', group: 'Accident scenario' },
    { text: 'Potential consequence', group: 'Accident scenario' },
    { text: listed('HAZ'), group: 'Hazardous situation' },
    { text: listed('ACT'), group: 'Hazardous situation' },
    { text: listed('TSK'), group: 'Hazardous situation' },
    ...ratingColumns('Initial risk estimation', method),
    listed('PRM'),
    ...ratingColumns('Residual risk estimation', method),
  ];

  const row = (scenario) => {
    return {
      id: scenario.id,
      cells: [
        { entities: [scenario.id] },
        prose(scenario, 'hazardousEvent'),
        prose(scenario, 'consequence'),
        { entities: related(scenario.id, 'haz-contributes-to-scn') },
        { entities: related(scenario.id, 'act-exposed-in-scn') },
        { entities: related(scenario.id, 'tsk-gives-rise-to-scn') },
        ...ratingCells(scenario, 'Initial risk estimation', method),
        { entities: related(scenario.id, 'prm-reduces-risk-of-scn') },
        ...withEvaluation(ratingCells(scenario, 'Residual risk estimation', method), scenario),
      ],
    };
  };

  const rated = method ? `one per parameter of the ${method} and the rating it comes to` : 'the rating each was given, typed with no method chosen';
  const table = (held) => ({ columns, rows: held.map(row) });
  const named = (name, held) => `${name} (${held.length})`;
  const sections = [
    {
      name: named('All scenarios', scenarios),
      lead: `Every accident scenario with what relates to it directly, in the order it is assessed. What happens and what harm could follow, the hazardous situation it arises in, the initial risk, the protective measures reducing it, and the residual risk with whether it is acceptable beneath it. The ratings stand in columns under their group, ${rated}, each with its rationale.`,
      tables: [table(scenarios)],
    },
  ];
  for (const phase of phases) {
    const held = scenarios.filter((scenario) => phasesOf(scenario).includes(phase.id));
    sections.push({
      name: named(entityLabel(phase) || phase.id, held),
      lead: `Scenarios a task occurring during ${entityLabel(phase) || phase.id} gives rise to.`,
      tables: [table(held)],
    });
  }
  const unplaced = scenarios.filter((scenario) => phasesOf(scenario).length === 0);
  if (unplaced.length > 0) {
    sections.push({
      name: named('No phase', unplaced),
      lead: 'Scenarios no task gives rise to, so no phase holds them.',
      tables: [table(unplaced)],
    });
  }
  return { id: 'risk', title: 'Risk assessment', sections };
}

export const RISK_VIEW = { id: 'risk', name: 'Risk assessment', build: buildRiskView };
