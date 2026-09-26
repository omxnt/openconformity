/**
 * The pieces every pane shares, built one way: an icon-only head action
 * with its label as its tooltip, the head's filter field behind a
 * magnifier, Carbon's empty state, an entity as its icon, identifier and
 * label, and Carbon's inline notification.
 */

import { el, icon, tooltipOn } from './dom.js';
import { ENTITY_TYPES } from './metamodel.js';
import { TYPE_ICONS } from './icons.js';
import { entityLabel } from './queries.js';

/**
 * A neutral icon-only head action with its label as its tooltip, hanging
 * from its end since the actions stand at the right of the head.
 * @param {string} label
 * @param {string} iconId
 * @param {() => void} onPick
 */
export function headIcon(label, iconId, onPick) {
  const button = el('button', { className: 'ghost-button ghost-icon', attributes: { type: 'button' } }, [icon(iconId)]);
  button.addEventListener('click', onPick);
  return tooltipOn(button, label, { align: 'end' });
}

/**
 * The head's filter, on demand: closed, a magnifier that opens it; open,
 * a compact search field holding the filter. Escape closes it, and so
 * does leaving it empty. The pane renders the field again on each state
 * and focuses it once open.
 * @param {Object} spec
 * @param {boolean} spec.open
 * @param {string} spec.label  what the field filters, its accessible name
 * @param {string} spec.value
 * @param {() => void} spec.onOpen
 * @param {(value: string) => void} spec.onChange
 * @param {() => void} spec.onClose  closes the field and clears the filter
 */
export function headSearch({ open, label, value, onOpen, onChange, onClose }) {
  if (!open) return headIcon(label, 'i-search', onOpen);
  const input = el('input', {
    className: 'field-input head-search',
    attributes: { type: 'search', placeholder: 'Filter', autocomplete: 'off', 'aria-label': label },
  });
  input.value = value;
  input.addEventListener('input', () => onChange(input.value));
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    onClose();
  });
  input.addEventListener('blur', () => {
    if (input.value.trim() === '') onClose();
  });
  return input;
}

/**
 * Carbon's empty state: what this place holds, and the way to put the
 * first thing in it.
 * @param {string} title
 * @param {string} [body]
 * @param {{ label: string, icon: string, onPick: () => void }} [action]
 */
export function emptyState(title, body = '', action = null) {
  const held = el('div', { className: 'empty-state' }, [
    el('p', { className: 'empty-state-title', text: title }),
    ...(body ? [el('p', { className: 'empty-state-body', text: body })] : []),
  ]);
  if (action) {
    const button = el('button', { className: 'ghost-button', attributes: { type: 'button' } }, [icon(action.icon), el('span', { text: action.label })]);
    button.addEventListener('click', action.onPick);
    held.appendChild(button);
  }
  return held;
}

/**
 * An entity as a row reads it: its type's icon in the pillar's colour,
 * its identifier in mono, and its label where it carries one.
 * @param {import('./model.js').Entity} entity
 * @returns {HTMLElement[]}
 */
export function entityParts(entity) {
  const parts = [icon(TYPE_ICONS[entity.type], ENTITY_TYPES[entity.type].pillar), el('span', { className: 'mono designation', text: entity.id })];
  const label = entityLabel(entity);
  if (label) parts.push(el('span', { className: 'row-title', text: label }));
  return parts;
}

/**
 * Carbon's inline notification: the kind's glyph, a title and a text,
 * ghost buttons after them where there are any, and a dismiss at the end
 * where it can be dismissed.
 * @param {'info'|'warning'} kind
 * @param {string} title
 * @param {string} text
 * @param {{ actions?: HTMLElement[], onDismiss?: (() => void)|null, role?: string|null }} [options]
 */
export function notice(kind, title, text, { actions = [], onDismiss = null, role = null } = {}) {
  const held = el('div', { className: kind === 'warning' ? 'notice notice-warning' : 'notice', attributes: role ? { role } : {} }, [
    icon(kind === 'warning' ? 'i-warning' : 'i-information'),
    el('div', { className: 'notice-body' }, [el('span', { className: 'notice-title', text: title }), el('span', { className: 'notice-text', text })]),
    ...(actions.length > 0 ? [el('div', { className: 'notice-actions' }, actions)] : []),
  ]);
  if (onDismiss) {
    const dismiss = el('button', { className: 'notice-dismiss', attributes: { type: 'button', 'aria-label': 'Dismiss' } }, [icon('i-close')]);
    dismiss.addEventListener('click', onDismiss);
    held.appendChild(dismiss);
  }
  return held;
}
