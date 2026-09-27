/**
 * The rating cell: a rating group as one cell of the form, its name
 * over the tags of what it comes to and each parameter chosen, and in
 * an edit a field opening the rating's dialog, the parameters riding in
 * hidden controls the draft reads.
 */

import { el, icon, tooltipTag } from './dom.js';
import { statusIcon, rateDialog } from './rating.js';
import { ratingView } from './fields.js';
import { isOutcome } from './attributes.js';

/**
 * A rating's tags: what it comes to, carrying its status, then the
 * code of each parameter set. Outside an edit every tag is a button
 * whose tooltip holds what it stands for, the attribute and the
 * outcome or the parameter and its value, as the help glyph's holds
 * the help; a parameter with a rationale is underlined and its tooltip
 * carries the reasoning beneath. Within an edit, where the field is a
 * button already, a tag is a span with the browser's own tooltip.
 * @param {Object} view
 * @param {string|null} [tipKey]  what the tooltips' ids are made of; null within a field, where a tag cannot be a button
 */
export function ratingTags(view, tipKey = null) {
  const tag = (className, content, lines, key) => tooltipTag(className, content, lines, key, tipKey);
  const tags = [];
  if (view.outcome !== null) {
    tags.push(tag('tag outcome', [...(view.tone === 'none' ? [] : [statusIcon(view.tone)]), el('span', { text: view.outcome })], { caption: view.name, main: view.outcome }, 'outcome'));
  }
  view.parameters.forEach((parameter, i) => {
    if (parameter.value === '') return;
    tags.push(tag(parameter.rationale ? 'tag reasoned' : 'tag', [el('span', { text: parameter.code })], { caption: parameter.name, main: parameter.value, note: parameter.rationale }, i));
  });
  return tags;
}

/**
 * A rating as a cell like any other: its name over its tags. In an
 * edit the cell is a field that opens the rating's dialog; the
 * parameters ride in hidden controls, so the draft reads them as it
 * reads any field, and the cell follows the draft as it changes.
 * @param {Object} context
 * @param {Object} context.group  the rating's group, closing on a computed attribute
 * @param {Object<string, string>} context.values  the entity's, or the draft's
 * @param {boolean} context.editing
 * @param {ReturnType<import('./dialog.js').createDialogs>|null} context.dialogs
 * @param {(name: string, key: string, forId?: string|null) => HTMLElement} context.nameNode  the cell's name with its help
 * @param {() => Object<string, string>} context.fieldValues  the draft as it stands
 * @param {Array<() => void>} context.refreshers  what the editor calls when the draft changes
 * @param {HTMLElement} context.body  where an input event lands when no control carries one
 */
export function ratingCell({ group, values, editing, dialogs, nameNode, fieldValues, refreshers, body }) {
  const closing = group.attributes.find(isOutcome);
  const carried = group.attributes.filter((definition) => !isOutcome(definition));
  const cellElement = el('div', { className: 'cell' });
  if (!editing) {
    const tags = ratingTags(ratingView(group.attributes, values), closing.key);
    cellElement.appendChild(nameNode(group.name, closing.key));
    cellElement.appendChild(tags.length === 0 ? el('div', { className: 'cell-value empty', text: '–' }) : el('div', { className: 'cell-value tags' }, tags));
    return cellElement;
  }
  const hidden = carried.map((definition) => {
    const input = el('input', { attributes: { type: 'hidden', 'data-key': definition.key } });
    input.value = values[definition.key] ?? '';
    return input;
  });
  const held = el('span', { className: 'tags' });
  const field = el(
    'button',
    { className: 'field-input rating', attributes: { type: 'button', id: `field-${closing.key}`, 'aria-haspopup': 'dialog' } },
    [held, icon('i-edit')]
  );
  const show = (draft) => {
    const tags = ratingTags(ratingView(group.attributes, draft));
    held.textContent = tags.length === 0 ? '–' : '';
    held.classList.toggle('empty', tags.length === 0);
    for (const tag of tags) held.appendChild(tag);
  };
  show(values);
  field.addEventListener('click', async () => {
    if (!dialogs) return;
    const chosen = await rateDialog(dialogs, {
      title: `${group.name} by ${closing.method}`,
      method: closing.method,
      definitions: group.attributes,
      values: fieldValues(),
    });
    if (chosen === null) return;
    for (const input of hidden) input.value = chosen[input.dataset.key] ?? '';
    (hidden[0] ?? body).dispatchEvent(new Event('input', { bubbles: true }));
  });
  cellElement.appendChild(nameNode(group.name, closing.key, `field-${closing.key}`));
  cellElement.appendChild(field);
  for (const input of hidden) cellElement.appendChild(input);
  refreshers.push(() => show(fieldValues()));
  return cellElement;
}
