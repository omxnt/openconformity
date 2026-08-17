/**
 * The relationship list: every relationship the selected entity takes
 * part in, split by direction, re-read from the model on every render.
 */

import { nodeOf, relationshipsOf } from './model.js';
import { RELATIONSHIP_TYPES } from './metamodel.js';
import { el } from './dom.js';

/**
 * @param {import('./model.js').Model} model
 * @param {string} id
 * @returns {Node[]}
 */
function endpointParts(model, id) {
  const entity = nodeOf(model, id);
  const parts = [el('span', { className: 'mono designation', text: id })];
  const title = entity && entity.kind === 'entity' ? (entity.attributes.title ?? '').trim() : '';
  if (title) parts.push(el('span', { className: 'row-title', text: title }));
  return parts;
}

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {HTMLElement} context.container
 */
export function createRelationshipsView({ store, container }) {
  function section(heading, rows) {
    return el('div', { className: 'rel-section' }, [
      el('h3', { className: 'rel-heading', text: heading }),
      el('div', {}, rows),
    ]);
  }

  function render() {
    container.textContent = '';
    const model = store.model();
    const id = store.selection();
    const node = nodeOf(model, id);
    if (!node || node.kind !== 'entity') {
      container.appendChild(el('p', { className: 'pane-empty', text: 'Nothing selected.' }));
      return;
    }

    const { outgoing, incoming } = relationshipsOf(model, id);
    if (outgoing.length === 0 && incoming.length === 0) {
      container.appendChild(el('p', { className: 'pane-empty', text: 'No relationships.' }));
      return;
    }

    if (outgoing.length > 0) {
      container.appendChild(
        section(
          'Outgoing',
          outgoing.map((relationship) =>
            el('div', { className: 'rel-row' }, [
              el('span', { className: 'rel-label', text: RELATIONSHIP_TYPES[relationship.type].label }),
              ...endpointParts(model, relationship.target),
            ])
          )
        )
      );
    }
    if (incoming.length > 0) {
      container.appendChild(
        section(
          'Incoming',
          incoming.map((relationship) =>
            el('div', { className: 'rel-row' }, [
              ...endpointParts(model, relationship.source),
              el('span', { className: 'rel-label', text: RELATIONSHIP_TYPES[relationship.type].label }),
            ])
          )
        )
      );
    }
  }

  store.subscribe(render);
  render();

  return { render };
}
