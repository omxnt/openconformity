/**
 * The add-relationship workflow over the store's picker mode, picks
 * first: while picking, every entity relatable to the subject in any form
 * is a candidate, and the relationship each pick means is inferred from
 * the pair. A pair that admits exactly one relationship groups silently;
 * one that admits more carries its own small choice, listing only that
 * pair's options. The mode — the pinned subject and the picks — is store
 * state; everything else is re-derived from the model on every render, so
 * the workflow survives commits and renders alike.
 *
 * The panel opens when picking begins and closes when it ends, whoever
 * ended it: Done, Cancel, Escape, or the subject's deletion.
 */

import { nodeOf } from './model.js';
import { relationshipOptions, formLabel, designated } from './queries.js';
import { el, icon } from './dom.js';

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
 * The panel's rows: the picks grouped by the relationship each one means
 * — the pair's only option, or the chosen one, or the first on offer —
 * with the groups sorted by label. A pick whose pair no longer admits
 * anything falls into the trailing stale group; Done drops it.
 * @param {import('./model.js').Model} model
 * @param {{ subject: string, picks: Array<{ id: string, form: { typeId: string, direction: string }|null }> }} picker
 * @returns {Array<{ form: { typeId: string, direction: string }|null, label: string,
 *                   rows: Array<{ id: string, ambiguous: boolean, options: Array<{ typeId: string, direction: string }> }> }>}
 */
export function groupedPicks(model, picker) {
  const groups = new Map();
  for (const pick of picker.picks) {
    const options = pairOptions(model, picker.subject, pick.id);
    const chosen =
      pick.form !== null &&
      options.some((option) => option.typeId === pick.form.typeId && option.direction === pick.form.direction)
        ? pick.form
        : options[0] ?? null;
    const key = chosen === null ? '·stale' : `${chosen.typeId} ${chosen.direction}`;
    if (!groups.has(key)) {
      groups.set(key, {
        form: chosen,
        label: chosen === null ? 'No longer possible' : formLabel(chosen),
        rows: [],
      });
    }
    groups.get(key).rows.push({ id: pick.id, ambiguous: options.length > 1, options });
  }
  return [...groups.values()].sort((one, other) => {
    if (one.form === null) return 1;
    if (other.form === null) return -1;
    return one.label.localeCompare(other.label);
  });
}

/**
 * The queries' designation, reached by identifier: anything that is not
 * an entity in the model reads as the identifier alone.
 * @param {import('./model.js').Model} model
 * @param {string} id
 * @returns {string}
 */
function designatedById(model, id) {
  const entity = nodeOf(model, id);
  return entity && entity.kind === 'entity' ? designated(entity) : id;
}

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {ReturnType<import('./overlay.js').createOverlay>} context.overlay
 * @param {(subject: string, picks: Array<{ id: string, form: { typeId: string, direction: string }|null }>) => void} context.onDone
 */
export function createRelateWorkflow({ store, overlay, onDone }) {
  /** @type {import('./overlay.js').Entry|null} */
  let panel = null;
  /** @type {HTMLElement|null} */
  let body = null;

  function renderPanel() {
    const picker = store.picker();
    if (picker === null) return;
    const model = store.model();
    body.textContent = '';

    body.appendChild(
      el('div', { className: 'panel-subject' }, [
        el('span', { className: 'field-label', text: 'From' }),
        el('span', { className: 'mono', text: designatedById(model, picker.subject) }),
      ])
    );

    const offered = pickerCandidates(model, picker).size;
    body.appendChild(
      el('p', {
        className: 'panel-note',
        text:
          offered === 0
            ? 'Nothing in the model can take a relationship with it yet.'
            : `${offered} ${offered === 1 ? 'row offers itself' : 'rows offer themselves'} in the navigator; the rest are dimmed. Picking again lets go.`,
      })
    );

    const picks = el('div', { className: 'panel-picks' });
    picks.appendChild(
      el('div', {
        className: 'field-label',
        text:
          picker.picks.length === 0
            ? 'Pick entities in the navigator'
            : `Picked (${picker.picks.length})`,
      })
    );

    for (const group of groupedPicks(model, picker)) {
      picks.appendChild(el('div', { className: 'panel-group', text: group.label }));
      for (const row of group.rows) {
        const unpick = el(
          'button',
          { className: 'icon-button neutral', attributes: { type: 'button', 'aria-label': `Unpick ${row.id}` } },
          [icon('i-close')]
        );
        unpick.addEventListener('click', () => store.togglePick(row.id));

        const line = el('div', { className: 'panel-pick' }, [
          el('span', { className: 'mono panel-pick-name', text: designatedById(model, row.id) }),
          unpick,
        ]);
        picks.appendChild(line);

        if (row.ambiguous) {
          const choice = el('select', {
            className: 'field-input panel-pick-choice',
            attributes: { 'aria-label': `Relationship for ${row.id}` },
          });
          row.options.forEach((option, index) => {
            choice.appendChild(el('option', { text: formLabel(option), attributes: { value: String(index) } }));
          });
          const current = group.form;
          const at = row.options.findIndex(
            (option) => option.typeId === current?.typeId && option.direction === current?.direction
          );
          if (at >= 0) choice.value = String(at);
          choice.addEventListener('change', () => store.setPickChoice(row.id, row.options[Number(choice.value)]));
          picks.appendChild(el('div', { className: 'panel-pick-ambiguity' }, [choice]));
        }
      }
    }
    body.appendChild(picks);

    const done = el('button', {
      className: 'dialog-button button-primary',
      text: 'Done',
      attributes: { type: 'button' },
    });
    done.disabled = picker.picks.length === 0;
    done.addEventListener('click', () => {
      const current = store.picker();
      if (current !== null && current.picks.length > 0) onDone(current.subject, current.picks);
      store.endPicking();
    });
    const cancel = el('button', {
      className: 'dialog-button button-secondary',
      text: 'Cancel',
      attributes: { type: 'button' },
    });
    cancel.addEventListener('click', () => store.endPicking());
    body.appendChild(el('div', { className: 'dialog-actions panel-actions' }, [cancel, done]));
  }

  function openPanel() {
    body = el('div', { className: 'panel-body' });
    const element = el(
      'aside',
      { className: 'side-panel', attributes: { 'aria-label': 'Add relationships' } },
      [el('h3', { className: 'panel-title', text: 'Add relationships' }), body]
    );
    panel = overlay.open({
      kind: 'panel',
      element,
      opener: document.activeElement,
      onClose() {
        panel = null;
        body = null;
        store.endPicking();
      },
    });
    renderPanel();
  }

  function render() {
    const picking = store.picker() !== null;
    if (picking && panel === null) openPanel();
    else if (!picking && panel !== null) overlay.close(panel);
    else if (picking) renderPanel();
  }

  store.subscribe(render);
  render();

  return { render };
}
