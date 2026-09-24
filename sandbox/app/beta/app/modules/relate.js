/**
 * The picker's derivations, picks first: while picking, every entity
 * relatable to the subject in any form is a candidate, and the
 * relationship each pick means is inferred from the pair — silently
 * when the pair admits exactly one, through an inline choice when it
 * admits more. The mode — the pinned subject and the picks — is store
 * state; everything here is re-derived from the model on every render,
 * so the workflow survives commits and renders alike. The relationship
 * pane renders it: the picks land in the table as provisional rows.
 */

import { relationshipOptions } from './queries.js';

/**
 * The identifiers picking can reach: the union, over every form the
 * subject is offered, of the entities the model allows at the far end.
 * @param {import('./model.js').Model} model
 * @param {{ subject: string }|null} picker
 * @returns {Set<string>}
 */
export function pickerCandidates(model, picker) {
  if (picker === null) return new Set();
  const candidates = new Set();
  for (const option of relationshipOptions(model, picker.subject)) {
    for (const candidate of option.candidates) candidates.add(candidate.id);
  }
  return candidates;
}

/**
 * The relationships one pair admits right now, in metamodel order: each
 * form of the subject's offer that reaches this far end.
 * @param {import('./model.js').Model} model
 * @param {string} subjectId
 * @param {string} otherId
 * @returns {Array<{ typeId: string, direction: 'outgoing'|'incoming' }>}
 */
export function pairOptions(model, subjectId, otherId) {
  return relationshipOptions(model, subjectId)
    .filter((option) => option.candidates.some((candidate) => candidate.id === otherId))
    .map((option) => ({ typeId: option.type.id, direction: option.direction }));
}

/**
 * The picks as the table will land them: each with the relationship its
 * pair means right now — the chosen form while the model still admits
 * it, else the pair's first option, else nothing — and the options an
 * ambiguous pair offers inline.
 * @param {import('./model.js').Model} model
 * @param {{ subject: string, picks: Array<{ id: string, form: { typeId: string, direction: string }|null }> }} picker
 * @returns {Array<{ id: string, form: { typeId: string, direction: string }|null, ambiguous: boolean,
 *                   options: Array<{ typeId: string, direction: string }> }>}
 */
export function pickedRows(model, picker) {
  return picker.picks.map((pick) => {
    const options = pairOptions(model, picker.subject, pick.id);
    const chosen =
      pick.form !== null &&
      options.some((option) => option.typeId === pick.form.typeId && option.direction === pick.form.direction)
        ? pick.form
        : options[0] ?? null;
    return { id: pick.id, form: chosen, ambiguous: options.length > 1, options };
  });
}
