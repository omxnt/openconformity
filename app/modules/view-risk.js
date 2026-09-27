/**
 * The risk assessment as a view: one row per accident scenario, read
 * in the order the assessment is made, and holding only what relates to
 * the scenario directly. The scenario first as the row's subject, with
 * its hazardous event and potential consequence, then its hazardous
 * situation, the hazards, actors and tasks it is related to, its
 * initial rating, the protective measures reducing its risk, and its
 * residual rating with the risk evaluation beneath it, and its notes
 * last. Each rating
 * parameter shows the rationale given for it beneath its value. One tab for all
 * scenarios and one per phase its tasks occur during, each counting its
 * rows in its name. A pure function of the model, returning the description
 * views.js renders and exports: a title and sections, each a name and
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
import { ratingView } from './fields.js';

/** The rating group of a name under an estimation method, or undefined. */
function ratingGroup(name, method) {
  return ATTRIBUTES.SCN.groups
    .flatMap((group) => group.groups ?? [])
    .find((group) => group.name === name && group.when?.key === 'estimationMethod' && group.when.value === method);
}

const parametersOf = (group) => group.attributes.filter(isParameter);

/** Whether a rating group is typed rather than read: it closes on no computed attribute. */
const isTyped = (group) => group !== undefined && !group.attributes.some((definition) => definition.kind === 'computed');

/**
 * The columns a rating takes under a method: one per parameter, headed
 * by its name, then the rating it comes to. Under no method, the typed rating as one column; under an unknown
 * one, the rating alone.
 * @param {string} name  the rating group's name
 * @param {string} method
 */
export function ratingColumns(name, method) {
  const group = ratingGroup(name, method);
  if (isTyped(group)) return [{ text: 'Rating', group: name }];
  const parameters = group ? parametersOf(group) : [];
  return [
    ...parameters.map((definition) => ({ text: definition.name, group: name, narrow: true })),
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
    { text: listed('SCN').slice(0, -1), group: 'Accident scenario' },
    { text: 'Hazardous event', group: 'Accident scenario' },
    { text: 'Potential consequence', group: 'Accident scenario' },
    { text: listed('HAZ'), group: 'Hazardous situation' },
    { text: listed('ACT'), group: 'Hazardous situation' },
    { text: listed('TSK'), group: 'Hazardous situation' },
    ...ratingColumns('Initial risk estimation', method),
    { text: listed('PRM'), group: 'Risk reduction' },
    ...ratingColumns('Residual risk estimation', method),
    'Notes',
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
        prose(scenario, 'notes'),
      ],
    };
  };

  const table = (held) => ({ columns, rows: held.map(row) });
  const named = (name, held) => `${name} (${held.length})`;
  const sections = [
    {
      name: named('All scenarios', scenarios),
      tables: [table(scenarios)],
    },
  ];
  for (const phase of phases) {
    const held = scenarios.filter((scenario) => phasesOf(scenario).includes(phase.id));
    sections.push({
      name: named(entityLabel(phase) || phase.id, held),
      tables: [table(held)],
    });
  }
  const unplaced = scenarios.filter((scenario) => phasesOf(scenario).length === 0);
  if (unplaced.length > 0) {
    sections.push({
      name: named('No phase', unplaced),
      tables: [table(unplaced)],
    });
  }
  return { id: 'risk', title: 'Risk assessment', exports: ['excel'], sections };
}

export const RISK_VIEW = { id: 'risk', name: 'Risk assessment', build: buildRiskView };
