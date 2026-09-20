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

import { ATTRIBUTES, attributesFor } from './attributes.js';
import { estimate, levelTone } from './risk.js';
import { rateDialog, statusIcon } from './rating.js';
import { openMultiSelect } from './multiselect.js';
import { nodeOf } from './model.js';
import { ENTITY_TYPES } from './metamodel.js';
import { TYPE_ICONS, FOLDER_ICON, PROJECT_ICON } from './icons.js';
import { el, icon, tabKeys } from './dom.js';
import { entityLabel, relatedIds } from './queries.js';

/**
 * Whether a draft differs from the entity it edits: a defined key whose
 * field no longer matches the stored value. An unset key stands for the
 * empty value, and keys the editor does not present never make a draft
 * dirty.
 * @param {Array<{ key: string }>} definitions
 * @param {Object<string, string>} attributes
 * @param {Object<string, string>} values
 * @returns {boolean}
 */
export function draftChanged(definitions, attributes, values) {
  return definitions.some(
    (definition) => (attributes[definition.key] ?? '') !== (values[definition.key] ?? '')
  );
}

/**
 * The project's field set: the name, mapped to the model's own name
 * rather than the attribute bag, and nothing else until
 * `docs/attributes.md` gains its Project section.
 */
const PROJECT_FIELDS = [{ key: 'name', name: 'Name', kind: 'text' }];

/**
 * Whether a hyperlink value may be presented as a link. Only the web
 * schemes are followed: anything else — a `javascript:` value above all
 * — renders as the text it is, so rendering can never arm what a user
 * typed or a file carried.
 * @param {string} value
 * @returns {boolean}
 */
/**
 * A rating as the card shows it: what it comes to and its tone — null
 * and none while a parameter is missing — and the parameters by name,
 * in order, an unset one an empty value.
 * @param {Array<Object>} definitions  the rating's, the computed one among them
 * @param {Object<string, string>} values
 * @returns {{ outcome: string|null, tone: string, parameters: Array<{ name: string, value: string }> }}
 */
export function ratingView(definitions, values) {
  const parameters = definitions.filter((definition) => definition.kind !== 'computed');
  const computed = definitions.find((definition) => definition.kind === 'computed');
  const outcome = computed ? estimate(computed.method, parameters.map((definition) => values[definition.key] ?? '')) : null;
  return {
    outcome,
    tone: levelTone(outcome),
    parameters: parameters.map((definition) => {
      const value = (values[definition.key] ?? '').trim();
      return { name: definition.name, value, code: codeShown(value) };
    }),
  };
}

/**
 * The code a rating shows for a value: its first word, and its second
 * where the first holds no digit — `S1`, `Se 4`, `Very likely`, or `4`
 * of `4 words after`.
 * @param {string} value
 */
export function codeShown(value) {
  const words = String(value ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  return /\d/.test(words[0]) ? words[0] : words.slice(0, 2).join(' ');
}

/**
 * The first tab's name: the type's own noun, the last word of its name —
 * Legislation, Requirement, Function.
 * @param {string} code
 */
export function firstTabName(code) {
  return (ENTITY_TYPES[code]?.name ?? 'Description').split(' ').at(-1);
}


/**
 * The values a set holds, as the definition lists them: what is stored
 * is read, trimmed, and kept only where the definition offers it, so a
 * set always joins back in the one canonical order.
 * @param {{ values?: string[] }} definition
 * @param {string|undefined} value
 * @returns {string[]}
 */
export function setValues(definition, value) {
  const held = new Set(String(value ?? '').split(';').map((item) => item.trim()));
  return (definition.values ?? []).filter((item) => held.has(item));
}

/**
 * A set as it is stored: the values chosen, separated by semicolons, in
 * the order the definition lists them; nothing chosen stores nothing.
 * @param {{ values?: string[] }} definition
 * @param {Iterable<string>} chosen
 * @returns {string}
 */
export function joinSet(definition, chosen) {
  const held = new Set(chosen);
  return (definition.values ?? []).filter((item) => held.has(item)).join('; ');
}

export function linkable(value) {
  return /^https?:\/\/\S/i.test((value ?? '').trim());
}

/**
 * The ways into a project, offered from the editor's no-project state —
 * the one place the buttons live. A test pins this table to the action
 * list, so the two cannot drift.
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
 * @param {(id: string|null, values: Object<string, string>) => boolean} context.onSave
 * @param {() => void} context.onCancel
 * @param {() => void} context.onRename
 * @param {(event: KeyboardEvent) => void} [context.onEscape]
 * @param {(id: string) => void} [context.onAction]  runs a landing action by identifier, resolved at click time
 */
export function createEditor({
  store,
  head,
  body,
  onSave,
  onCancel,
  onRename,
  onEscape = () => {},
  onAction = () => {},
  onNavigate = () => {},
  dialogs = null,
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
  for (const kind of ['input', 'change']) {
    body.addEventListener(kind, () => {
      followConditions();
      for (const refresh of refreshers) refresh();
    });
  }

  /**
   * The draft as the controls hold it. A control under a group hidden by
   * its condition is left out: what is not shown is not saved. A control
   * on another tab is shown, only elsewhere, and is read like any other.
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
  function emptyState(title, text) {
    return el('div', { className: 'empty-state' }, [
      el('p', { className: 'empty-state-title', text: title }),
      el('p', { className: 'empty-state-body', text }),
    ]);
  }

  /**
   * One attribute as a cell: its name over its value — or, in an edit,
   * over its field — two cells to a row, a multiline one taking the row
   * to itself. Every cell has the one shape in either mode, so nothing
   * moves between them.
   * @param {Object} definition
   * @param {Object<string, string>} values
   * @param {boolean} editing
   */
  function fieldCell(definition, values, editing) {
    const value = values[definition.key];
    const name = editing
      ? el('label', { className: 'cell-name', text: definition.name, attributes: { for: `field-${definition.key}` } })
      : el('div', { className: 'cell-name', text: definition.name });
    const held = editing ? control(definition, value ?? '', values) : valueNode(definition, value);
    return el('div', { className: takesRow(definition) ? 'cell tall' : 'cell' }, [name, held]);
  }

  /** Whether an attribute takes a row to itself: the title, a multiline, a hyperlink. */
  const takesRow = (definition) => definition.key === 'title' || definition.kind === 'multiline' || definition.kind === 'hyperlink';

  /**
   * The identifier as the first cell: generated and read only, so it is
   * in the field's read-only state in either mode, beside the reference.
   * @param {string} id
   */
  function identifierCell(id) {
    return el('div', { className: 'cell' }, [
      el('div', { className: 'cell-name', text: 'Identifier' }),
      el('div', { className: 'cell-value mono', text: id }),
    ]);
  }

  /**
   * A value as the view mode shows it: a choice as a tag, a followable
   * hyperlink as a link in a new tab, a multiline value as prose keeping
   * its breaks, anything else as its text, an unset value as the dash.
   * @param {{ kind: string }} definition
   * @param {string|undefined} value
   */
  function valueNode(definition, value) {
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

  /** The cells of a run of definitions, a related attribute's list among them. */
  function cellsOf(definitions, values, editing) {
    return definitions.map((definition) =>
      definition.kind === 'related' ? relatedCell(definition, values, editing) : fieldCell(definition, values, editing)
    );
  }

  /**
   * One related entity as the tree shows one — its type's glyph in the
   * pillar colour, its identifier, its label — and the way to it.
   */
  function relatedItem(id) {
    const entity = nodeOf(store.model(), id);
    let held;
    if (entity) {
      const label = entityLabel(entity);
      held = el('button', { className: 'entity-row', attributes: { type: 'button' } }, [
        icon(TYPE_ICONS[entity.type], ENTITY_TYPES[entity.type].pillar),
        el('span', { className: 'mono designation', text: entity.id }),
        ...(label ? [el('span', { className: 'entity-title', text: label })] : []),
        icon('i-chevron-right'),
      ]);
      held.addEventListener('click', () => onNavigate(id));
    } else {
      held = el('span', { className: 'mono', text: id });
    }
    return el('li', { className: 'related-item' }, [held]);
  }

  /**
   * A related attribute as a cell: the entities its relationship type
   * joins to this one, live from the model and the same in either mode,
   * on a row of their own.
   */
  function relatedCell(definition) {
    const live = current ? relatedIds(store.model(), current.id, definition.relationship) : [];
    const list =
      live.length === 0
        ? el('div', { className: 'cell-value empty', text: 'None linked.' })
        : el('ul', { className: 'related-list' }, live.map((id) => relatedItem(id)));
    return el('div', { className: 'cell tall' }, [el('div', { className: 'cell-name', text: definition.name }), el('div', { className: 'related' }, [list])]);
  }

  /** Whether a group's condition holds, or that it has none. */
  function groupShown(group, values) {
    return !group.when || (values[group.when.key] ?? '').trim() === group.when.value;
  }

  /** Whether a group is a rating: it closes on a computed attribute, and is rated in a dialog. */
  const isRating = (group) => group.attributes.some((definition) => definition.kind === 'computed');

  /**
   * A rating's tags: what it comes to, carrying its status where it has
   * a tone, then the code of each parameter set, the full value on
   * hovering it.
   */
  function ratingTags(view) {
    const tags = [];
    if (view.outcome !== null) {
      tags.push(
        el('span', { className: 'tag outcome' }, [
          ...(view.tone === 'none' ? [] : [statusIcon(view.tone)]),
          el('span', { text: view.outcome }),
        ])
      );
    }
    for (const parameter of view.parameters) {
      if (parameter.value === '') continue;
      tags.push(el('span', { className: 'tag', text: parameter.code, attributes: { title: `${parameter.name}: ${parameter.value}` } }));
    }
    return tags;
  }

  /**
   * A rating as a cell like any other: its name over its tags. In an
   * edit the cell is a field that opens the rating's dialog; the
   * parameters ride in hidden controls, so the draft reads them as it
   * reads any field, and the cell follows the draft as it changes.
   */
  function ratingCell(group, values, editing) {
    const parameters = group.attributes.filter((definition) => definition.kind !== 'computed');
    const computed = group.attributes.find((definition) => definition.kind === 'computed');
    const cellElement = el('div', { className: 'cell' });
    if (!editing) {
      const tags = ratingTags(ratingView(group.attributes, values));
      cellElement.appendChild(el('div', { className: 'cell-name', text: group.name }));
      cellElement.appendChild(tags.length === 0 ? el('div', { className: 'cell-value empty', text: '–' }) : el('div', { className: 'cell-value tags' }, tags));
      return cellElement;
    }
    const hidden = parameters.map((definition) => {
      const input = el('input', { attributes: { type: 'hidden', 'data-key': definition.key } });
      input.value = values[definition.key] ?? '';
      return input;
    });
    const held = el('span', { className: 'tags' });
    const field = el(
      'button',
      { className: 'field-input rating', attributes: { type: 'button', id: `field-${computed.key}`, 'aria-haspopup': 'dialog' } },
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
        title: `${group.name} – ${computed.method}`,
        method: computed.method,
        definitions: group.attributes,
        values: fieldValues(),
      });
      if (chosen === null) return;
      for (const input of hidden) input.value = chosen[input.dataset.key] ?? '';
      body.dispatchEvent(new Event('input', { bubbles: true }));
    });
    cellElement.appendChild(el('label', { className: 'cell-name', text: group.name, attributes: { for: `field-${computed.key}` } }));
    cellElement.appendChild(field);
    for (const input of hidden) cellElement.appendChild(input);
    refreshers.push(() => show(fieldValues()));
    return cellElement;
  }

  /**
   * A slot's holder: the cell shown while no variant of the slot holds,
   * saying that nothing is chosen for the attribute they wait on — as a
   * disabled field in an edit — so the form keeps its shape.
   */
  function slotHolder(code, variants, values, editing) {
    const [first] = variants;
    const leader = attributesFor(code).find((definition) => definition.key === first.when.key);
    const text = `No ${(leader?.name ?? first.when.key).toLowerCase()} chosen`;
    const tall = variants.some((variant) => !isRating(variant) && variant.attributes.length === 1 && takesRow(variant.attributes[0]));
    const cell = el('div', { className: tall ? 'cell tall' : 'cell' }, [
      el('div', { className: 'cell-name', text: first.name }),
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
   * the last of its attributes any of them waits on, so what a choice
   * governs stands under the choice, or after all its attributes when
   * none does. A group waiting on a condition is wrapped, so it can be
   * shown or hidden as one; sub-groups sharing a name and a condition's
   * attribute are one slot, given its holder after the last of them.
   */
  function groupInto(grid, code, group, values, editing, named) {
    const target = group.when ? el('div', { className: 'cell-group' }) : grid;
    if (isRating(group)) {
      target.appendChild(ratingCell(group, values, editing));
    } else {
      if (named && group.attributes.length > 1) target.appendChild(el('div', { className: 'cell-legend', text: group.name }));
      const subs = group.groups ?? [];
      let anchor = group.attributes.length - 1;
      group.attributes.forEach((held, i) => {
        if (subs.some((sub) => sub.when?.key === held.key)) anchor = i;
      });
      const place = () => {
        for (const sub of subs) {
          groupInto(target, code, sub, values, editing, true);
          if (!sub.when) continue;
          const variants = subs.filter((held) => held.when && held.name === sub.name && held.when.key === sub.when.key);
          if (variants.at(-1) === sub) target.appendChild(slotHolder(code, variants, values, editing));
        }
      };
      group.attributes.forEach((definition, i) => {
        target.appendChild(definition.kind === 'related' ? relatedCell(definition, values, editing) : fieldCell(definition, values, editing));
        if (i === anchor) place();
      });
      if (anchor === -1) place();
    }
    if (target !== grid) {
      target.hidden = !groupShown(group, values);
      conditionals.push({ held: target, shown: (draft) => groupShown(group, draft) });
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
  function mount(id, code, values, editing) {
    const type = ATTRIBUTES[code] ?? { attributes: [], groups: [] };
    const first = el('div', { className: 'cells' }, [identifierCell(id), ...cellsOf(type.attributes, values, editing)]);
    const panels = [{ name: firstTabName(code), grid: first }];
    for (const group of type.groups) {
      if (!group.tab) {
        groupInto(first, code, group, values, editing, true);
        continue;
      }
      const grid = el('div', { className: 'cells' });
      groupInto(grid, code, group, values, editing, false);
      panels.push({ name: group.name, grid });
    }
    if (panels.length > 1) body.appendChild(tabBar(code, panels));
    body.appendChild(el('div', { className: 'form' }, panels.map((panel) => panel.grid)));
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
   * Keep each conditional group following the attribute it waits on: a
   * change shows or hides it in place. Wired once per edit, after the
   * form is in the pane.
   */
  /**
   * Show or hide each conditional in document order, reading the draft
   * afresh for each: a group hidden by one condition drops out of the
   * draft the next reads, so what waits on it follows.
   */
  function followConditions() {
    for (const { held, shown } of conditionals) held.hidden = !shown(fieldValues());
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

  /** An icon-only head action, neutral with a tooltip, like the toolbar's. */
  function headIconButton(label, iconId, onPick) {
    const button = el(
      'button',
      { className: 'ghost-button ghost-icon', attributes: { type: 'button', title: label, 'aria-label': label } },
      [icon(iconId)]
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
    return [save, cancel];
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

  /** The values the project's fields edit: the name, from the model itself. */
  function projectValues() {
    return { name: store.model().name };
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
        className: choices.some((choice) => choice.length > 24) ? 'field-input wide' : 'field-input',
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
    const input = el('input', {
      className: 'field-input',
      attributes: {
        'data-key': definition.key,
        type: definition.kind === 'hyperlink' ? 'url' : 'text',
        id: `field-${definition.key}`,
      },
    });
    input.value = value;
    return input;
  }

  /** The project, on the standard surface: view fields and Edit. */
  function renderProjectView() {
    head.hidden = false;
    head.appendChild(projectHeadName());
    head.appendChild(el('div', { className: 'pane-head-actions' }, [headIconButton('Edit attributes', 'i-edit', beginEdit)]));
    body.appendChild(el('div', { className: 'form' }, [el('div', { className: 'cells' }, cellsOf(PROJECT_FIELDS, projectValues(), false))]));
  }

  function renderProjectEdit() {
    head.hidden = false;
    head.appendChild(projectHeadName());
    head.appendChild(
      el('div', { className: 'pane-head-actions' }, saveCancel(() => {
        if (onSave(null, fieldValues()) !== false) endEdit();
      }))
    );
    body.appendChild(el('div', { className: 'form' }, [el('div', { className: 'cells' }, cellsOf(PROJECT_FIELDS, projectValues(), true))]));
  }

  function renderView(node) {
    current = node;
    renderHead(node, [headIconButton('Edit attributes', 'i-edit', beginEdit)]);
    mount(node.id, node.type, node.attributes, false);
  }

  function renderEdit(node) {
    current = node;
    renderHead(node, saveCancel(() => {
      if (onSave(editingId, fieldValues()) !== false) endEdit();
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

    head.textContent = '';
    body.textContent = '';
    refreshers = [];
    conditionals = [];
    if (!store.hasProject()) {
      head.hidden = true;
      const landing = emptyState(
        'No project',
        'Create a project, open one saved as a file, or look around the example. Everything stays in this browser until you save it to a file.'
      );
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
      renderHead(node, [headButton('Rename…', onRename)]);
      body.appendChild(
        emptyState('Folder', 'A folder groups things in the navigator and carries no attributes of its own.')
      );
      return;
    }
    renderView(node);
  }

  function beginEdit() {
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
      return draftChanged(PROJECT_FIELDS, projectValues(), fieldValues());
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

  return { render, beginEdit, endEdit, hasUnconfirmedEdit, editing: () => mode === 'edit' };
}
