/**
 * The risk assessment as a view: an index of the assessment, one row
 * per accident scenario tying together what the model links to it and
 * what was judged of it — the scenario first as the row's subject, what
 * it arises from, a person at a task near a hazard, walked from its
 * relationships, its initial rating, the reduction and what carries
 * it, its residual rating — on one tab for all
 * scenarios and one per phase its tasks occur during, each counting its
 * rows in its name. What an entity says for itself, the event and the
 * consequence among it, stays in the editor. A pure function of the model, returning the description
 * views.js renders and exports: a title and sections, each a lead and
 * tables of columns and rows.
 *
 * A column is a name or an object with a text, an optional group whose
 * name stands over consecutive columns sharing it, an optional title
 * behind a short text, and narrow where the cell holds a code. A row is
 * the entity it is about and its cells. A cell is text, `{ entities }`
 * by id, `{ code, title }` for a rating parameter, or `{ outcome }`
 * holding the rating view or null.
 */

import { ATTRIBUTES, isParameter } from './attributes.js';
import { entityLabel, relatedIds } from './queries.js';
import { ratingView, initials } from './editor.js';

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
 * A scenario's cells under those columns: each parameter's code, its
 * name and value behind it with the rationale given for it, and the outcome,
 * empty where the scenario is not rated.
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
      title: view.parameters[i].value ? `${view.parameters[i].name}: ${view.parameters[i].value}${view.parameters[i].rationale ? `\n${view.parameters[i].rationale}` : ''}` : '',
    })),
    { outcome: view },
  ];
}

/**
 * @param {import('./model.js').Model} model
 */
export function buildRiskView(model) {
  const entities = (code) =>
    [...model.nodes.values()].filter((node) => node.kind === 'entity' && node.type === code).sort((a, b) => a.id.localeCompare(b.id));
  const related = (id, type) => relatedIds(model, id, type);
  const through = (ids, type) => [...new Set(ids.flatMap((id) => related(id, type)))].sort();

  const scenarios = entities('SCN');
  const phases = entities('PHS');
  const method = model.attributes.estimationMethod ?? '';
  const phasesOf = (scenario) => through(related(scenario.id, 'tsk-gives-rise-to-scn'), 'tsk-occurs-during-phs');

  const columns = [
    'Accident scenario',
    { text: 'Hazards', group: 'Arises from' },
    { text: 'Exposed persons', group: 'Arises from' },
    { text: 'Tasks', group: 'Arises from' },
    ...ratingColumns('Initial risk estimation', method),
    { text: 'Protective measures', group: 'Risk reduction' },
    { text: 'Safety functions', group: 'Risk reduction' },
    ...ratingColumns('Residual risk estimation', method),
  ];

  const row = (scenario) => {
    const measures = related(scenario.id, 'prm-reduces-risk-of-scn');
    return {
      id: scenario.id,
      cells: [
        { entities: [scenario.id] },
        { entities: related(scenario.id, 'haz-contributes-to-scn') },
        { entities: related(scenario.id, 'act-exposed-in-scn') },
        { entities: related(scenario.id, 'tsk-gives-rise-to-scn') },
        ...ratingCells(scenario, 'Initial risk estimation', method),
        { entities: measures },
        { entities: through(measures, 'saf-realises-prm') },
        ...ratingCells(scenario, 'Residual risk estimation', method),
      ],
    };
  };

  const rated = method ? `one per parameter of the ${method} and the rating it comes to` : 'the rating each was given, typed with no method chosen';
  const table = (held) => ({ columns, rows: held.map(row) });
  const named = (name, held) => `${name} (${held.length})`;
  const sections = [
    {
      name: named('All scenarios', scenarios),
      lead: `Every accident scenario with what the model ties to it and what was judged of it: what it arises from, its hazards, exposed persons and tasks; the initial risk; what reduces it; the residual risk. The ratings stand in columns under their group, ${rated}.`,
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
