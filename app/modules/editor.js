/**
 * The editor: the attributes of the selection, view-only until Edit, and
 * applied on Save. The pane's header is its working surface — the
 * selection's designation and the mode's actions — and hides when nothing
 * is selected. The pane renders only the attributes the definitions carry
 * for the type; content under any other key is never shown and never
 * touched. A draft lives only here and only until Save or Cancel: the
 * flows ask the confirm/discard question before anything would destroy
 * one, and a render never rebuilds over an open draft.
 */

import { attributesFor, typeOf, groupsOf, SHARED_HELP, isOutcome, isRationale, leaderOf, groupShown } from './attributes.js';
import { ratingView, firstTabName, setValues, joinSet, tableRows, joinTable, linkable, draftChanged } from './fields.js';
import { rateDialog, statusIcon } from './rating.js';
import { openMultiSelect } from './multiselect.js';
import { nodeOf } from './model.js';
import { ENTITY_TYPES } from './metamodel.js';
import { TYPE_ICONS, FOLDER_ICON, PROJECT_ICON } from './icons.js';
import { el, icon, tabKeys, tooltipTag } from './dom.js';
import { entityLabel, relatedIds } from './queries.js';
import { staleText, recordOf, recordedStates, recordWritten, reviewText } from './records.js';
import { checkDrawing, dataUrl, sizeText } from './drawing.js';
import { editDrawing } from './drawing-editor.js';
import { headIcon, emptyState, notice } from './pane.js';

/**
 * The project's field set: the name, mapped to the model's own name
 * rather than the attribute bag.
 */
const PROJECT_FIELDS = [{ key: 'name', name: 'Name', kind: 'text', help: "The project's name, which the saved file is named after." }];
/** How many of the project's own attributes stand before its name on the first tab: the designation and the organisation. */
const NAME_AFTER = 2;

/**
 * The ways into a project, offered from the editor's no-project state,
 * the one place the buttons live.
 */
export const LANDING_OFFER = [
  { id: 'new-project', icon: 'i-new-project', label: 'New project' },
  { id: 'open', icon: 'i-open-project', label: 'Open project…' },
  { id: 'load-example', icon: 'i-project', label: 'Load example' },
];

/**
 * @param {Object} context
 * @param {ReturnType<import('./store.js').createStore>} context.store
 * @param {HTMLElement} context.head
 * @param {HTMLElement} context.body
 * @param {ReturnType<import('./drawing-editor.js').createDrawingSurface>} [context.drawingSurface]  the pane over the workspace a diagram is edited on
 * @param {(id: string, definition: Object) => void} [context.onReview]  a changed record marked reviewed in view: written afresh from what is related now
 * @param {ReturnType<import('./dialog.js').createDialogs>} [context.dialogs]  the dialogs a rating, a drawing and a table open
 * @param {{ isOpen: () => boolean }} [context.overlay]  the overlay a multiselect stacks on
 * @param {(id: string, values: Object<string, string>) => boolean} context.onSave
 * @param {(values: Object<string, string>) => Promise<boolean>|boolean} [context.onSaveProject]  the project's draft, asked about first where it removes what entities hold
 * @param {(entries: Array<{ name: string, value: string }>) => Promise<boolean>} [context.onRemoval]  asks before a save removes what hidden groups still hold
 * @param {() => void} context.onCancel
 * @param {() => void} context.onRename
 * @param {() => void} [context.onReturn]  back to the view the entity was chosen from
 * @param {(event: KeyboardEvent) => void} [context.onEscape]
 * @param {(id: string) => void} [context.onAction]  runs a landing action by identifier, resolved at click time
 */
export function createEditor({
  store,
  head,
  body,
  onSave,
  onSaveProject = () => true,
  onCancel,
  onRename,
  onReturn = () => {},
  onRemoval = async () => true,
  onEscape = () => {},
  onAction = () => {},
  onReview = () => {},
  dialogs = null,
  drawingSurface = null,
  overlay = null,
}) {
  /** @type {Object|null} the entity on the surface, this render */
  let current = null;
  /** @type {'view'|'edit'} */
  let mode = 'view';
  /** @type {string|null} the entity the open draft belongs to */
  let editingId = null;
  /** Whether the open draft edits the project itself. */
  let editingProject = false;

  /** @type {Array<() => void>} what recomputes each computed field of the open edit */
  let refreshers = [];
  /** @type {Array<{ held: HTMLElement, shown: (draft: Object<string, string>) => boolean }>} what is shown on a condition, this render, in document order */
  let conditionals = [];
  /** @type {Array<{ definition: Object, input: HTMLInputElement }>} the records of entities the open edit keeps, refreshed when the group each waits on changes */
  let records = [];
  /** @type {Map<string, HTMLElement>} the tab's grid each group stands on, by the group's name, so a record can flag the tab of the group it was written for */
  let panelOfGroup = new Map();
  /** @type {Map<string, string>} the group each key of the mounted type stands in, by name */
  let groupOfKey = new Map();
  /** @type {Map<string, AttributeDefinition>} the definition of each key of the mounted type */
  let definitionOfKey = new Map();
  for (const kind of ['input', 'change']) {
    body.addEventListener(kind, (event) => {
      recordFrom(event.target);
      followConditions();
      for (const refresh of refreshers) refresh();
    });
  }

  /**
   * Refresh every record waiting on the group the changed control
   * stands in, from the relationships as they stand.
   * @param {EventTarget|null} target
   */
  function recordFrom(target) {
    const control = target instanceof Element ? target.closest('[data-key]') : null;
    const key = control?.dataset.key;
    if (!key || editingId === null) return;
    const changed = definitionOfKey.get(key);
    if (!changed || isRationale(changed) || isOutcome(changed)) return;
    const group = groupOfKey.get(key);
    const draft = fieldValues();
    for (const { definition, input } of records) {
      if (definition.recorded !== group) continue;
      input.value = recordWritten(current?.type ?? '', definition, draft) ? recordOf(relatedIds(store.model(), editingId, definition.relationship)) : '';
    }
  }

  /**
   * The draft as the controls show it. A control under a group hidden by
   * its condition is left out, so what waits on it follows. A control on
   * another tab is shown, only elsewhere, and is read like any other.
   */
  function fieldValues() {
    /** @type {Object<string, string>} */
    const values = {};
    for (const control of body.querySelectorAll('[data-key]')) {
      if (control.closest('.cell-group[hidden]')) continue;
      values[control.dataset.key] = control.value;
    }
    return values;
  }

  /**
   * The draft as a save commits it: the draft as shown, and the empty
   * value for every control under a hidden group, so what is not shown
   * is removed.
   */
  function savedValues() {
    const values = fieldValues();
    for (const control of body.querySelectorAll('.cell-group[hidden] [data-key]')) values[control.dataset.key] = '';
    return values;
  }

  /** The draft with what the type reads from the project (§1.4), for the conditions waiting on the project's choice. */
  function draftValues() {
    return { ...(editingProject ? {} : projectReads(current?.type ?? 'PROJECT')), ...fieldValues() };
  }

  function renderHead(node, actions) {
    head.hidden = false;
    const parts = [];
    if (node.kind === 'entity') {
      const type = ENTITY_TYPES[node.type];
      parts.push(icon(TYPE_ICONS[node.type], type.pillar));
      parts.push(el('span', { className: 'subhead-kind', text: type.name }));
      parts.push(el('span', { className: 'mono designation', text: node.id }));
      const label = entityLabel(node);
      if (label) parts.push(el('span', { className: 'subhead-title', text: label }));
    } else {
      parts.push(icon(FOLDER_ICON));
      parts.push(el('span', { className: 'subhead-kind', text: 'Folder' }));
      parts.push(el('span', { className: 'subhead-title', text: node.name }));
    }
    head.appendChild(el('div', { className: 'pane-head-name' }, parts));
    head.appendChild(el('div', { className: 'pane-head-actions' }, actions));
  }

  /**
   * Carbon's empty state for the pane.
   * @param {string} title
   * @param {string} text
   */
  /**
   * One attribute as a cell: its name over its value — or, in an edit,
   * over its field — two cells to a row, a multiline one taking the row
   * to itself. Every cell has the one shape in either mode, so nothing
   * moves between them.
   * @param {Object} definition
   * @param {Object<string, string>} values
   * @param {boolean} editing
   */
  function fieldCell(definition, values, editing, alone = false) {
    const value = values[definition.key];
    const held = editing ? control(definition, value ?? '', values) : valueNode(definition, value, values);
    return el('div', { className: takesRow(definition, alone) ? 'cell tall' : 'cell' }, [nameNode(definition, editing), held]);
  }

  /**
   * What a type reads from the project: the project's value of every
   * key a group of the type waits on without the type defining it
   * (§1.4), so the groups waiting on the project's choice stand or fall
   * by it in either mode.
   * @param {string} code
   * @returns {Object<string, string>}
   */
  function projectReads(code) {
    const own = new Set(attributesFor(code).map((definition) => definition.key));
    const attributes = store.model().attributes;
    return Object.fromEntries(
      groupsOf(code)
        .filter((group) => group.when && !own.has(group.when.key))
        .map((group) => [group.when.key, attributes[group.when.key] ?? ''])
    );
  }

  /**
   * A group's name over its cell — a rating's, or its slot's — with the
   * glyph where the name carries help on every type.
   * @param {string} name
   * @param {string} key  what the tooltip's id is made of
   * @param {string|null} [forId]  the control the name labels in an edit
   * @param {string} [help]  the help shown, the shared name's unless given
   */
  function groupNameNode(name, key, forId = null, help = SHARED_HELP[name]) {
    const text = forId ? el('label', { text: name, attributes: { for: forId } }) : el('span', { text: name });
    return el('div', { className: 'cell-name' }, [text, ...(help ? [helpTip(key, name, help)] : [])]);
  }

  /**
   * A cell's name: a label for the field in an edit, plain text in view,
   * and the information glyph with the definition's help where it has
   * any, or the help its name carries on every type.
   */
  function nameNode(definition, editing) {
    const text = editing
      ? el('label', { text: definition.name, attributes: { for: `field-${definition.key}` } })
      : el('span', { text: definition.name });
    const help = definition.help ?? SHARED_HELP[definition.name];
    return el('div', { className: 'cell-name' }, [text, ...(help ? [helpTip(definition.key, definition.name, help)] : [])]);
  }

  /** Whether an attribute takes a row to itself: the title, a multiline, a hyperlink, a set, a table, a drawing, and a record standing alone in its group. */
  const takesRow = (definition, alone = false) =>
    definition.key === 'title' || definition.key === 'name' || definition.kind === 'multiline' || definition.kind === 'hyperlink' || definition.kind === 'set' || definition.kind === 'table' || definition.kind === 'drawing' || (definition.kind === 'entities' && alone);

  /**
   * Carbon's icon tooltip on a name: the information glyph as a small
   * focusable button, its text shown on hover or focus and dismissed
   * with Escape.
   * @param {string} key  what the help is about, for the tooltip's id
   * @param {string} about  its name, for the button's label
   * @param {string} text
   */
  function helpTip(key, about, text) {
    const id = `help-${key}`;
    const tip = el('span', { className: 'tooltip', text, attributes: { role: 'tooltip', id } });
    const trigger = el(
      'button',
      { className: 'help-trigger', attributes: { type: 'button', 'aria-label': `About the ${about.toLowerCase()}`, 'aria-describedby': id } },
      [icon('i-information'), tip]
    );
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') trigger.blur();
    });
    return trigger;
  }

  /**
   * The identifier as the first cell: generated and read only, so it is
   * in the field's read-only state in either mode, beside the reference,
   * its help on the glyph beside its name.
   * @param {string} id
   */
  function identifierCell(id) {
    return el('div', { className: 'cell' }, [
      el('div', { className: 'cell-name' }, [el('span', { text: 'Identifier' }), helpTip('identifier', 'identifier', SHARED_HELP.Identifier)]),
      el('div', { className: 'cell-value mono', text: id }),
    ]);
  }

  /**
   * A value as the view mode shows it: a choice as a tag, a followable
   * hyperlink as a link in a new tab, a multiline value as prose keeping
   * its breaks, anything else as its text, an unset value as the dash,
   * except a table or a drawing, which say there is none in words.
   * @param {{ kind: string }} definition
   * @param {string|undefined} value
   */
  function valueNode(definition, value, values = {}) {
    if (definition.kind === 'drawing') return drawingCell(value, false, definition);
    if (definition.kind === 'entities') return entitiesNode(definition, value ?? '', values, definition.key);
    if (definition.kind === 'table') {
      const rows = tableRows(definition, value ?? '');
      if (rows.length === 0) return el('p', { className: 'cell-none', text: `No ${definition.name.toLowerCase()}.` });
      return el('div', { className: 'cell-table' }, [
        tableOf(definition, rows.map((row, i) => row.map((cell, c) => tableCell(definition.columns[c], cell)))),
      ]);
    }
    if (value === undefined || value === '') return el('div', { className: 'cell-value empty', text: '–' });
    if (definition.kind === 'choice') return el('div', { className: 'cell-value' }, [el('span', { className: 'tag', text: value })]);
    if (definition.kind === 'set') {
      const chosen = setValues(definition, value);
      if (chosen.length === 0) return el('div', { className: 'cell-value empty', text: '–' });
      return el('div', { className: 'cell-value tags' }, chosen.map((item) => el('span', { className: 'tag', text: item })));
    }
    if (definition.kind === 'hyperlink' && linkable(value)) {
      const address = value.trim();
      return el('div', { className: 'cell-value' }, [el('a', { text: address, attributes: { href: address, target: '_blank', rel: 'noopener' } })]);
    }
    return el('div', { className: definition.kind === 'multiline' ? 'cell-value prose' : 'cell-value', text: value });
  }

  /** How wide a column is: as its values and no wider for a date, a choice or a number, brief for a text, and a multiline taking the rest. */
  const columnWidth = (column) => (column.kind === 'date' || column.kind === 'choice' || column.kind === 'number' ? 'fit' : column.kind === 'text' ? 'brief' : '');

  /**
   * A record of entities as tags, each its identifier with its label
   * in the tooltip, one since unlinked wearing the warning glyph and
   * one since deleted the error glyph, the tooltip saying which, and a
   * line beneath saying the record no longer matches where either
   * stands; the dash where the record is empty.
   * Until the group that writes the record holds a value, nothing was
   * recorded, and the field shows what is related now, unmarked.
   * @param {{ relationship: string, name: string, recorded: string }} definition
   * @param {string} value
   * @param {Object<string, string>} values  the entity's, or the draft's
   * @param {string|null} [tipKey]
   */
  function entitiesNode(definition, value, values, tipKey = null) {
    const written = recordWritten(current?.type ?? '', definition, values);
    const model = store.model();
    const subject = current?.id ?? null;
    const states = written
      ? recordedStates(value, model, subject, definition.relationship)
      : (subject === null ? [] : relatedIds(model, subject, definition.relationship)).map((id) => ({ id, label: entityLabel(nodeOf(model, id)), state: 'linked' }));
    if (states.length === 0) return el('div', { className: 'cell-value empty', text: '–' });
    const glyph = (state) => {
      if (state === 'added') {
        const held = icon('i-information');
        held.classList.add('status-icon', 'tone-info');
        return held;
      }
      return statusIcon(state === 'deleted' ? 'high' : 'medium');
    };
    const words = staleText(definition.recorded);
    const tags = states.map(({ id, label, state }, i) =>
      tooltipTag(
        state === 'linked' ? 'tag' : `tag ${state}`,
        [...(state === 'linked' ? [] : [glyph(state)]), el('span', { text: id })],
        { caption: id, main: label === id ? '' : label, note: state === 'linked' ? '' : words[state] },
        i,
        tipKey
      )
    );
    return el('div', { className: 'cell-value tags' }, tags);
  }

  /**
   * Carbon's inline notification at the top of the tab a changed record
   * puts in question: for every record that no longer matches, the
   * warning kind with what changed and what to review, above the cells
   * of the tab the group the record was written for stands on, and
   * nothing for a record that still matches.
   * @param {Object<string, string>} values  the entity's, or the draft's
   */
  function placeNotices(values) {
    for (const stale of body.querySelectorAll('.cells > .notice')) stale.remove();
    const subject = current?.id ?? null;
    for (const definition of definitionOfKey.values()) {
      if (definition.kind !== 'entities' || !definition.recorded) continue;
      if (!recordWritten(current?.type ?? '', definition, values)) continue;
      const states = recordedStates(values[definition.key] ?? '', store.model(), subject, definition.relationship);
      if (!states.some(({ state }) => state !== 'linked')) continue;
      const grid = panelOfGroup.get(definition.recorded);
      if (!grid) continue;
      const words = reviewText(definition);
      const review = el('button', { className: 'ghost-button', attributes: { type: 'button' } }, [el('span', { text: 'Mark reviewed' })]);
      review.addEventListener('click', () => {
        if (mode === 'edit') {
          const record = records.find((held) => held.definition.key === definition.key);
          if (!record) return;
          record.input.value = recordOf(relatedIds(store.model(), editingId, definition.relationship));
          record.input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (current) {
          onReview(current.id, definition);
        }
      });
      grid.prepend(notice('warning', words.title, words.text, { actions: [review], role: 'status' }));
    }
  }

  /** Every group name under a group, itself first. */
  const namesIn = (group) => [group.name, ...(group.groups ?? []).flatMap(namesIn)];

  /** A table attribute's table: the row number, then a head per column, the cells given per row, each column as wide as its kind wants. */
  function tableOf(definition, rows, trailing = null) {
    for (const cells of rows) cells.forEach((cell, c) => cell.classList.add(...[columnWidth(definition.columns[c])].filter(Boolean)));
    return el('table', { className: 'data rows' }, [
      el('thead', {}, [el('tr', {}, [el('th', { className: 'no', text: 'No.' }), ...definition.columns.map((column) => el('th', { className: columnWidth(column), text: column.name })), ...(trailing ? [el('th', { text: '' })] : [])])]),
      el('tbody', {}, rows.map((cells, i) => el('tr', {}, [el('td', { className: 'no', text: String(i + 1) }), ...cells, ...(trailing ? [trailing(i)] : [])]))),
    ]);
  }

  /** A cell of a table as read: a choice as a tag, a multiline as prose keeping its breaks, anything else its text, an empty one the dash. */
  function tableCell(column, cell) {
    if (cell === '') return el('td', { className: 'empty', text: '–' });
    if (column.kind === 'choice') return el('td', {}, [el('span', { className: 'tag', text: cell })]);
    return el('td', { className: column.kind === 'multiline' ? 'prose' : '', text: cell });
  }

  /** The cells of a run of definitions. */
  function cellsOf(definitions, values, editing) {
    return definitions.map((definition) => fieldCell(definition, values, editing));
  }

  /** Whether a group is a rating: it closes on a computed attribute, and is rated in a dialog. */
  const isRating = (group) => group.attributes.some(isOutcome);

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
  function ratingTags(view, tipKey = null) {
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
   */
  function ratingCell(group, values, editing) {
    const closing = group.attributes.find(isOutcome);
    const carried = group.attributes.filter((definition) => !isOutcome(definition));
    const cellElement = el('div', { className: 'cell' });
    if (!editing) {
      const tags = ratingTags(ratingView(group.attributes, values), closing.key);
      cellElement.appendChild(groupNameNode(group.name, closing.key));
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
    cellElement.appendChild(groupNameNode(group.name, closing.key, `field-${closing.key}`));
    cellElement.appendChild(field);
    for (const input of hidden) cellElement.appendChild(input);
    refreshers.push(() => show(fieldValues()));
    return cellElement;
  }

  /**
   * A slot's holder: the cell shown while no variant of the slot holds,
   * saying that nothing is chosen for the attribute they wait on, as a
   * disabled field in an edit.
   */
  function slotHolder(code, variants, values, editing) {
    const [first] = variants;
    const leader = leaderOf(code, first.when.key);
    const text = `No ${(leader?.name ?? first.when.key).toLowerCase()} chosen`;
    const tall = variants.some((variant) => !isRating(variant) && variant.attributes.length === 1 && takesRow(variant.attributes[0], true));
    const cell = el('div', { className: tall ? 'cell tall' : 'cell' }, [
      groupNameNode(first.name, `slot-${first.when.key}-${first.name.toLowerCase().replaceAll(' ', '-')}`, null, SHARED_HELP[first.name] ?? (first.attributes.length === 1 ? first.attributes[0].help : undefined)),
      editing
        ? el('div', { className: 'field-input placeholder', text, attributes: { 'aria-disabled': 'true' } })
        : el('div', { className: 'cell-value empty', text }),
    ]);
    const shown = (draft) => !variants.some((variant) => groupShown(variant, draft));
    cell.hidden = !shown(values);
    conditionals.push({ held: cell, shown });
    return cell;
  }

  /**
   * A group's cells into a grid: a rating as its cell; otherwise a legend
   * where the group is named within its tab and holds more than one
   * attribute, its own cells, and its sub-groups in their order — after
   * the last of its attributes any of them waits on, or after all its
   * attributes when none does. A group waiting on a condition is wrapped
   * and shown or hidden as one; sub-groups sharing a name and a condition's
   * attribute are one slot, given its holder after the last of them
   * unless one of them waits on nothing chosen and so stands in for it.
   */
  function groupInto(grid, code, group, values, editing, named) {
    const target = group.when ? el('div', { className: 'cell-group' }) : grid;
    if (isRating(group)) {
      target.appendChild(ratingCell(group, values, editing));
    } else {
      if (named && group.attributes.length > 1) target.appendChild(el('div', { className: 'cell-legend', text: group.name }));
      const subs = group.groups ?? [];
      const keys = new Set(group.attributes.map((held) => held.key));
      const anchorOf = (sub) => {
        const key = sub.after ?? sub.when?.key ?? null;
        return keys.has(key) ? key : null;
      };
      const placed = new Set();
      const placeAfter = (key) => {
        for (const sub of subs) {
          if (placed.has(sub) || anchorOf(sub) !== key) continue;
          placed.add(sub);
          groupInto(target, code, sub, values, editing, true);
          if (!sub.when) continue;
          const variants = subs.filter((held) => held.when && held.name === sub.name && held.when.key === sub.when.key);
          if (variants.at(-1) === sub && !variants.some((held) => held.when.value === '')) target.appendChild(slotHolder(code, variants, values, editing));
        }
      };
      for (const definition of group.attributes) {
        target.appendChild(fieldCell(definition, values, editing, group.attributes.length === 1));
        placeAfter(definition.key);
      }
      placeAfter(null);
    }
    if (target !== grid) {
      target.hidden = !groupShown(group, values);
      conditionals.push({ held: target, shown: (draft) => groupShown(group, draft), group });
      grid.appendChild(target);
    }
  }

  /**
   * A type's attributes on the surface: the identifier, then its own
   * cells on the first tab, named for the type, and each group tagged
   * tab on a tab of its own. The tab bar stands still under the head
   * while the cells scroll.
   * @param {string} id
   * @param {string} code
   * @param {Object<string, string>} values
   * @param {boolean} editing
   */
  function mount(id, code, stored, editing) {
    const type = typeOf(code) ?? { attributes: [], groups: [] };
    panelOfGroup = new Map();
    groupOfKey = new Map(groupsOf(code).flatMap((group) => group.attributes.map((definition) => [definition.key, group.name])));
    definitionOfKey = new Map(groupsOf(code).flatMap((group) => group.attributes.map((definition) => [definition.key, definition])));
    const values = { ...stored, ...projectReads(code) };
    const lead = id === null ? fieldCell(PROJECT_FIELDS[0], values, editing) : identifierCell(id);
    const ahead = id === null ? NAME_AFTER : 0;
    const first = el('div', { className: 'cells' }, [...cellsOf(type.attributes.slice(0, ahead), values, editing), lead, ...cellsOf(type.attributes.slice(ahead), values, editing)]);
    const panels = [{ name: firstTabName(code), grid: first }];
    for (const group of type.groups) {
      if (!group.tab) {
        groupInto(first, code, group, values, editing, true);
        for (const name of namesIn(group)) panelOfGroup.set(name, first);
        continue;
      }
      const grid = el('div', { className: 'cells' });
      groupInto(grid, code, group, values, editing, false);
      for (const name of namesIn(group)) panelOfGroup.set(name, grid);
      panels.push({ name: group.name, grid });
    }
    if (panels.length > 1) body.appendChild(tabBar(code, panels));
    body.appendChild(el('div', { className: 'form' }, panels.map((panel) => panel.grid)));
    placeNotices(values);
    if (editing) refreshers.push(() => placeNotices(fieldValues()));
  }

  /**
   * Carbon's tabs over the panels: the one chosen for the type this
   * session selected, the others reached by click or arrow key. Choosing
   * shows the panel in place — no re-render, so an open edit is left
   * alone — and records the choice for the type.
   */
  function tabBar(code, panels) {
    const chosen = store.tabOf(code);
    let selected = Math.max(0, panels.findIndex((panel) => panel.name === chosen));
    const bar = el('div', { className: 'tabs', attributes: { role: 'tablist', 'aria-label': 'Attribute groups' } });
    const tabs = panels.map((panel, i) => {
      const id = `tab-${code.toLowerCase()}-${i}`;
      const tab = el('button', {
        className: 'tab',
        text: panel.name,
        attributes: { type: 'button', role: 'tab', id, 'aria-controls': `${id}-panel` },
      });
      panel.grid.setAttribute('role', 'tabpanel');
      panel.grid.setAttribute('id', `${id}-panel`);
      panel.grid.setAttribute('aria-labelledby', id);
      tab.addEventListener('click', () => select(i, false));
      return tab;
    });
    const show = () => {
      tabs.forEach((tab, j) => {
        tab.setAttribute('aria-selected', String(selected === j));
        tab.tabIndex = selected === j ? 0 : -1;
        panels[j].grid.hidden = selected !== j;
      });
    };
    function select(i, focus) {
      selected = i;
      show();
      if (focus) tabs[i].focus();
      store.setTab(code, panels[i].name);
    }
    tabKeys(bar, (i) => select(i, true));
    for (const tab of tabs) bar.appendChild(tab);
    show();
    return bar;
  }

  /**
   * Show or hide each conditional in document order, reading the draft
   * afresh for each: a group hidden by one condition drops out of the
   * draft the next reads, so what waits on it follows.
   */
  function followConditions() {
    for (const { held, shown } of conditionals) held.hidden = !shown(draftValues());
  }

  /**
   * What a save would remove: the groups hidden while still holding
   * values, by name and the value they stood under, in document order;
   * a group that stood under nothing chosen names the attribute instead.
   */
  function removals() {
    const leaderName = (key) => (leaderOf(current?.type ?? 'PROJECT', key)?.name ?? key).toLowerCase();
    return conditionals
      .filter(({ held, group }) => group && held.hidden && [...held.querySelectorAll('[data-key]')].some((control) => control.value.trim() !== ''))
      .map(({ group }) => ({ name: group.name, value: group.when.value || `no ${leaderName(group.when.key)}` }));
  }

  function headButton(label, onPick, iconId = null) {
    const button = el(
      'button',
      { className: 'ghost-button', attributes: { type: 'button' } },
      [...(iconId ? [icon(iconId)] : []), el('span', { text: label })]
    );
    button.addEventListener('click', onPick);
    return button;
  }

  /**
   * Save and Cancel in the head, exactly as the relationship pane's Done
   * and Cancel sit in its head: primary and ghost at the head's 32px.
   */
  function saveCancel(onSavePick) {
    const save = el('button', { className: 'form-button button-primary', text: 'Save', attributes: { type: 'button' } });
    save.addEventListener('click', onSavePick);
    const cancel = el('button', { className: 'ghost-button', text: 'Cancel', attributes: { type: 'button' } });
    cancel.addEventListener('click', onCancel);
    return [cancel, save];
  }

  /** The project head: its icon, its kind, and its name as it stands. */
  function projectHeadName() {
    const name = store.model().name.trim();
    return el('div', { className: 'pane-head-name' }, [
      icon(PROJECT_ICON),
      el('span', { className: 'subhead-kind', text: 'Project' }),
      name
        ? el('span', { className: 'subhead-title', text: name })
        : el('span', { className: 'subhead-title untitled', text: 'Untitled' }),
    ]);
  }

  /** The values the project's fields edit: the name, from the model itself, and the project's attributes. */
  function projectValues() {
    return { name: store.model().name, ...store.model().attributes };
  }

  function control(definition, value, values = {}) {
    if (definition.kind === 'multiline') {
      const area = el('textarea', {
        className: 'field-input',
        attributes: { 'data-key': definition.key, rows: '4', id: `field-${definition.key}` },
      });
      area.value = value;
      return area;
    }
    if (definition.kind === 'choice') {
      const choices = definition.values ?? [];
      const select = el('select', {
        className: choices.some((choice) => choice.length > 16) ? 'field-input wide' : 'field-input',
        attributes: { 'data-key': definition.key, id: `field-${definition.key}` },
      });
      select.appendChild(el('option', { text: '–', attributes: { value: '' } }));
      for (const choice of choices) select.appendChild(el('option', { text: choice, attributes: { value: choice } }));
      select.value = choices.includes(value) ? value : '';
      return select;
    }
    if (definition.kind === 'set') {
      const chosen = new Set(setValues(definition, value));
      const hidden = el('input', { attributes: { type: 'hidden', 'data-key': definition.key } });
      const count = el('span', { className: 'tag count' });
      const text = el('span', { className: 'multiselect-text' });
      const field = el(
        'button',
        { className: 'field-input multiselect', attributes: { type: 'button', id: `field-${definition.key}`, 'aria-haspopup': 'listbox', 'aria-expanded': 'false' } },
        [count, text]
      );
      const show = () => {
        hidden.value = joinSet(definition, chosen);
        count.textContent = String(chosen.size);
        count.hidden = chosen.size === 0;
        text.textContent = hidden.value === '' ? '–' : setValues(definition, hidden.value).join(', ');
        text.classList.toggle('empty', hidden.value === '');
      };
      show();
      field.addEventListener('click', () => {
        if (!overlay) return;
        openMultiSelect({
          overlay,
          anchor: field,
          label: definition.name,
          options: definition.values ?? [],
          chosen,
          onChange: () => {
            show();
            hidden.dispatchEvent(new Event('input', { bubbles: true }));
          },
        });
      });
      return el('div', { className: 'multiselect-field' }, [field, hidden]);
    }
    if (definition.kind === 'number') {
      const input = el('input', {
        className: 'field-input',
        attributes: {
          'data-key': definition.key,
          type: 'number',
          id: `field-${definition.key}`,
          ...(definition.min === undefined ? {} : { min: String(definition.min) }),
          ...(definition.max === undefined ? {} : { max: String(definition.max) }),
        },
      });
      input.value = value;
      return input;
    }
    if (definition.kind === 'table') return tableControl(definition, value);
    if (definition.kind === 'drawing') return drawingCell(value, true, definition);
    if (definition.kind === 'entities') {
      const hidden = el('input', { attributes: { type: 'hidden', 'data-key': definition.key, id: `field-${definition.key}` } });
      hidden.value = value;
      const shown = el('div', { className: 'field-static' });
      const show = (held, draft) => {
        shown.textContent = '';
        shown.appendChild(entitiesNode(definition, held, draft));
      };
      show(value, values);
      refreshers.push(() => show(hidden.value, fieldValues()));
      records.push({ definition, input: hidden });
      return el('div', {}, [shown, hidden]);
    }
    const input = el('input', {
      className: 'field-input',
      attributes: {
        'data-key': definition.key,
        type: definition.kind === 'hyperlink' ? 'url' : definition.kind === 'date' ? 'date' : 'text',
        id: `field-${definition.key}`,
      },
    });
    input.value = value;
    return input;
  }

  /**
   * A drawing in either mode: the picture on a white card, opening at
   * full size, with its size beneath, and a line saying there is none
   * where there is none, no field around either. In an edit the drawing
   * is kept in a hidden control carrying the key, Carbon's ghost
   * buttons opening the external editor to create or edit it and, in
   * the danger colour, deleting it. A drawing that fails the check shows why instead of a
   * picture, and stays as it is.
   * @param {string|undefined} value
   * @param {boolean} editing
   * @param {Object} [definition]  in an edit, the attribute the control carries
   */
  function drawingCell(value, editing, definition = null) {
    let text = value ?? '';
    const subject = () => (current ? entityLabel(current) || current.id : 'the entity');
    const hidden = editing ? el('input', { attributes: { type: 'hidden', 'data-key': definition.key } }) : null;
    const body = el('div', { className: 'drawing-body' });
    const ghost = (label, glyph, onPick, danger = false) => {
      const node = el('button', { className: `ghost-button${danger ? ' ghost-danger' : ''}`, attributes: { type: 'button' } }, [icon(glyph), el('span', { text: label })]);
      node.addEventListener('click', onPick);
      return node;
    };
    const enlarge = () =>
      dialogs.open({
        title: `Diagram of ${subject()}`,
        body: el('div', { className: 'drawing-large' }, [el('img', { attributes: { src: dataUrl(text), alt: `Diagram of ${subject()}` } })]),
        actions: [],
      });
    const hold = (held) => {
      text = held;
      if (hidden) {
        hidden.value = text;
        hidden.dispatchEvent(new Event('input', { bubbles: true }));
      }
      paint();
    };
    const paint = () => {
      body.textContent = '';
      const actions = [];
      if (text !== '') {
        const verdict = checkDrawing(text);
        if (verdict.ok) {
          const open = el('button', { className: 'drawing-open', attributes: { type: 'button', 'aria-label': `Open the diagram of ${subject()} at full size` } }, [
            el('img', { className: 'drawing-image', attributes: { src: dataUrl(text), alt: `Diagram of ${subject()}` } }),
          ]);
          open.addEventListener('click', enlarge);
          body.appendChild(el('div', { className: 'drawing-card' }, [open]));
        } else {
          body.appendChild(el('div', { className: 'drawing-refused', text: `The diagram cannot be shown because it ${verdict.reason}.` }));
        }
        actions.push(el('span', { className: 'drawing-size', text: sizeText(text) }));
      } else if (!editing) {
        body.appendChild(el('p', { className: 'cell-none', text: `No ${definition.name.toLowerCase()}.` }));
      }
      if (editing && dialogs && drawingSurface) {
        actions.push(
          ghost(text === '' ? 'Create in draw.io' : 'Edit in draw.io', text === '' ? 'i-new-entity' : 'i-edit', async () => {
            const held = await editDrawing({ dialogs, store, surface: drawingSurface, drawing: text, subject: subject() });
            if (held !== null) hold(held);
          })
        );
        if (text !== '') actions.push(ghost('Delete', 'i-delete', () => hold(''), true));
      }
      if (actions.length > 0) body.appendChild(el('div', { className: 'drawing-meta' }, actions));
    };
    paint();
    return el('div', { className: 'drawing' }, [body, ...(hidden ? [hidden] : [])]);
  }

  /**
   * A table attribute in an edit: its rows as fields under the column
   * names, a button at each row's end removing it and one beneath adding
   * a row, focused on its first cell. The rows are kept as the table is
   * stored in one hidden control carrying the key, updated as any cell
   * changes.
   */
  function tableControl(definition, value) {
    const rows = tableRows(definition, value);
    const hidden = el('input', { attributes: { type: 'hidden', 'data-key': definition.key } });
    const wrap = el('div', { className: 'cell-table' });
    const keep = () => {
      hidden.value = joinTable(definition, rows);
    };
    const cellField = (column, r, c) => {
      const label = `${column.name}, row ${r + 1}`;
      let field;
      if (column.kind === 'choice') {
        field = el('select', { className: 'field-input', attributes: { 'aria-label': label } });
        field.appendChild(el('option', { text: '–', attributes: { value: '' } }));
        for (const choice of column.values ?? []) field.appendChild(el('option', { text: choice, attributes: { value: choice } }));
        field.value = (column.values ?? []).includes(rows[r][c]) ? rows[r][c] : '';
      } else if (column.kind === 'multiline') {
        field = el('textarea', { className: 'field-input', attributes: { rows: '1', 'aria-label': label } });
        field.value = rows[r][c];
        const grow = () => {
          field.style.height = 'auto';
          field.style.height = `${field.scrollHeight}px`;
        };
        field.addEventListener('input', grow);
        requestAnimationFrame(grow);
      } else {
        field = el('input', { className: 'field-input', attributes: { type: column.kind === 'date' ? 'date' : column.kind === 'number' ? 'number' : 'text', 'aria-label': label } });
        field.value = rows[r][c];
      }
      for (const kind of ['input', 'change']) {
        field.addEventListener(kind, () => {
          rows[r][c] = field.value;
          keep();
        });
      }
      return el('td', { className: 'field' }, [field]);
    };
    const paint = (focusRow = -1) => {
      keep();
      wrap.textContent = '';
      const table = tableOf(
        definition,
        rows.map((row, r) => row.map((cell, c) => cellField(definition.columns[c], r, c))),
        (r) => {
          const remove = el('button', { className: 'icon-button', attributes: { type: 'button', 'aria-label': `Remove row ${r + 1}` } }, [icon('i-delete')]);
          remove.addEventListener('click', () => {
            rows.splice(r, 1);
            paint();
            hidden.dispatchEvent(new Event('input', { bubbles: true }));
          });
          return el('td', { className: 'remove' }, [remove]);
        }
      );
      const add = el('button', { className: 'ghost-button', attributes: { type: 'button' } }, [icon('i-new-entity'), el('span', { text: 'Add row' })]);
      add.addEventListener('click', () => {
        rows.push(definition.columns.map(() => ''));
        paint(rows.length - 1);
      });
      wrap.append(...(rows.length > 0 ? [table] : []), add, hidden);
      if (focusRow >= 0) wrap.querySelector(`tbody tr:nth-child(${focusRow + 1}) .field-input`)?.focus();
    };
    paint();
    return wrap;
  }

  /** The project, on the standard surface: its tabs, view fields and Edit. */
  function renderProjectView() {
    head.hidden = false;
    head.appendChild(projectHeadName());
    head.appendChild(el('div', { className: 'pane-head-actions' }, [headIcon('Edit attributes', 'i-edit', beginEdit)]));
    mount(null, 'PROJECT', projectValues(), false);
  }

  function renderProjectEdit() {
    head.hidden = false;
    head.appendChild(projectHeadName());
    head.appendChild(
      el('div', { className: 'pane-head-actions' }, saveCancel(async () => {
        if ((await onSaveProject(savedValues())) !== false) endEdit();
      }))
    );
    mount(null, 'PROJECT', projectValues(), true);
    followConditions();
  }

  function renderView(node) {
    current = node;
    const back = store.viewReturn();
    const actions = [headIcon('Edit attributes', 'i-edit', beginEdit)];
    if (back !== null && back.rowId === node.id) actions.unshift(headButton(`Back to ${back.name}`, onReturn));
    renderHead(node, actions);
    mount(node.id, node.type, node.attributes, false);
  }

  function renderEdit(node) {
    current = node;
    renderHead(node, saveCancel(async () => {
      const removed = removals();
      if (removed.length > 0 && !(await onRemoval(removed))) return;
      if (onSave(editingId, savedValues()) !== false) endEdit();
    }));
    mount(node.id, node.type, node.attributes, true);
    followConditions();
  }

  function render() {
    const id = store.selection();
    const node = nodeOf(store.model(), id);

    if (mode === 'edit') {
      if (editingProject && id === null && store.hasProject()) return;
      if (!editingProject && id === editingId && node && node.kind === 'entity') return;
      mode = 'view';
      editingId = null;
      editingProject = false;
    }

    if (store.libraryOpen() && store.hasProject()) return;
    head.textContent = '';
    body.textContent = '';
    refreshers = [];
    conditionals = [];
    records = [];
    if (!store.hasProject()) {
      head.hidden = true;
      const landing = el('div', { className: 'empty-state landing' }, [
        el('p', { className: 'empty-state-title', text: 'Welcome to openconformity' }),
        el('p', { className: 'empty-state-body', text: 'Start a new project, open one you saved earlier, or load the example to see how a model is built.' }),
        el('p', { className: 'empty-state-body', text: 'The software is in beta. It runs entirely in your browser, and your work is kept there between sessions. A beta can still lose it, so save your project to a file often, and keep the files you save.' }),
        el('p', { className: 'empty-state-body' }, [
          el('span', { text: 'Bug reports and suggestions are welcome at ' }),
          el('a', { text: 'info@openconformity.org', attributes: { href: 'mailto:info@openconformity.org' } }),
          el('span', { text: '.' }),
        ]),
      ]);
      for (const offer of LANDING_OFFER) {
        const button = el(
          'button',
          { className: 'ghost-button', attributes: { type: 'button', 'data-action': `landing-${offer.id}` } },
          [icon(offer.icon), el('span', { text: offer.label })]
        );
        button.addEventListener('click', () => onAction(offer.id));
        landing.appendChild(button);
      }
      body.appendChild(landing);
      return;
    }
    if (!node) {
      renderProjectView();
      return;
    }
    if (node.kind === 'folder') {
      renderHead(node, [headIcon('Rename folder', 'i-edit', onRename)]);
      body.appendChild(
        emptyState('Folder', 'A folder groups entities in the navigator and has no attributes.')
      );
      return;
    }
    renderView(node);
  }

  function beginEdit() {
    if (store.libraryOpen()) store.setLibraryOpen(false);
    const id = store.selection();
    const node = nodeOf(store.model(), id);
    if (id === null && store.hasProject()) {
      mode = 'edit';
      editingProject = true;
      head.textContent = '';
      body.textContent = '';
      renderProjectEdit();
    } else if (node && node.kind === 'entity') {
      mode = 'edit';
      editingId = id;
      head.textContent = '';
      body.textContent = '';
      renderEdit(node);
    } else {
      return;
    }
    body.querySelector('.cells:not([hidden]) [data-key]:not([type="hidden"])')?.focus();
  }

  function endEdit() {
    mode = 'view';
    editingId = null;
    editingProject = false;
    render();
  }

  /**
   * Whether an unconfirmed change is open: the question the flows ask the
   * confirm/discard dialog about.
   */
  function hasUnconfirmedEdit() {
    if (mode !== 'edit') return false;
    if (editingProject) {
      if (!store.hasProject()) return false;
      return draftChanged([...PROJECT_FIELDS, ...attributesFor('PROJECT')], projectValues(), fieldValues());
    }
    const node = nodeOf(store.model(), editingId);
    if (!node || node.kind !== 'entity') return false;
    return draftChanged(attributesFor(node.type), node.attributes, fieldValues());
  }

  // Escape while a draft is open belongs to the editor, not the overlay:
  // it asks to leave the edit, and it must not fall through to whatever
  // stands above the page.
  for (const surface of [head, body]) {
    surface.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || mode !== 'edit') return;
      event.preventDefault();
      event.stopPropagation();
      onEscape(event);
    });
  }

  store.subscribe(render);
  render();

  /** Save the open edit as its Save button would, for the keys that mean save. */
  const submit = () => head.querySelector('.form-button.button-primary')?.click();

  return { render, beginEdit, endEdit, hasUnconfirmedEdit, submit, editing: () => mode === 'edit' };
}
