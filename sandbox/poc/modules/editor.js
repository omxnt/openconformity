/**
 * Right-pane editor — *intrinsic attributes only*.
 *
 * The editor renders the artifact's own attribute fields (string, text,
 * enum, date, number, the calculator object). Relationship fields
 * (ref / ref-array / polymorphic-ref-array) are no longer surfaced
 * here — they're managed in the trace pane below, which acts as the
 * single home for traceability.
 *
 * Selection is workspace-wide: it identifies a project AND an artifact
 * within that project.
 *
 * Re-render strategy:
 *   - select / replace / add / remove / project-active → mount a fresh
 *     form (or empty state).
 *   - update → no re-render. The form's own input handlers are the only
 *     source of `update` events for the visible artifact, so a remount
 *     here would clobber the input the user is in.
 *
 * The welcome panel shows when the workspace has no projects at all.
 */

import * as state from './state.js';
import {
  ArtifactTypes,
  labelOf,
  humanizeFieldName,
  humanizeEnumValue,
} from './types.js';
import { el } from './util.js';
import { listCalculators, getCalculator, runCalculator } from './calculators/index.js';
import { openModal, modalButton } from './modals.js';

/**
 * @typedef {Object} WelcomeActions
 * @property {() => void} [loadDemo]
 * @property {() => void} [openLibrary]
 * @property {() => void} [openProject]
 * @property {() => void} [newProject]
 */

/** @type {{ body: HTMLElement, title: HTMLElement, actions: HTMLElement, welcomeActions: WelcomeActions } | null} */
let mounts = null;
let unsubscribe = null;

/**
 * @param {{ bodyEl: HTMLElement, titleEl: HTMLElement, actionsEl: HTMLElement, welcomeActions?: WelcomeActions }} opts
 */
export function mountEditor({ bodyEl, titleEl, actionsEl, welcomeActions = {} }) {
  mounts = { body: bodyEl, title: titleEl, actions: actionsEl, welcomeActions };
  if (unsubscribe) unsubscribe();
  unsubscribe = state.subscribe(handleChange);
  render();
}

/** @param {import('./state.js').Change} change */
function handleChange(change) {
  switch (change.kind) {
    case 'select':
    case 'replace':
    case 'remove':
    case 'add':
    case 'project-active':
    case 'project-add':
    case 'project-remove':
      render();
      return;
    default:
      return;
  }
}

function render() {
  if (!mounts) return;
  const { body, title, actions, welcomeActions } = mounts;
  const selection = state.getSelection();

  body.replaceChildren();
  actions.replaceChildren();

  if (!selection) {
    if (isWorkspaceEmpty()) {
      title.textContent = 'Welcome';
      body.append(renderWelcome(welcomeActions));
    } else {
      title.textContent = 'Editor';
      body.append(el('p', { class: 'empty-state' }, ['No artifact selected.']));
    }
    return;
  }

  const entry = state.getById(selection.projectId, selection.artifactId);
  if (!entry) {
    title.textContent = 'Editor';
    body.append(el('p', { class: 'empty-state' }, ['No artifact selected.']));
    return;
  }

  const type = ArtifactTypes[entry.type];
  title.textContent = type.displayName;

  actions.append(
    el('span', { class: 'editor-id-badge', title: 'Stable artifact id' }, [entry.ref.id]),
    el(
      'button',
      {
        class: 'editor-delete',
        type: 'button',
        title: `Delete this ${type.displayName.toLowerCase()}`,
        onclick: () => handleDelete(selection.projectId, entry.ref.id, type.displayName),
      },
      ['Delete']
    )
  );

  body.append(renderForm(selection.projectId, entry.type, entry.ref));
}

/**
 * @param {string} projectId
 * @param {import('./types.js').ArtifactKey} typeKey
 * @param {Object<string, any>} artifact
 */
function renderForm(projectId, typeKey, artifact) {
  const type = ArtifactTypes[typeKey];
  const form = el('form', {
    class: 'editor-form',
    autocomplete: 'off',
    onsubmit: (/** @type {Event} */ e) => e.preventDefault(),
  });

  let attributeCount = 0;
  let relationshipCount = 0;
  for (const [name, field] of Object.entries(type.fields)) {
    if (
      field.kind === 'ref' ||
      field.kind === 'ref-array' ||
      field.kind === 'polymorphic-ref-array'
    ) {
      relationshipCount++;
      continue; // managed in the trace pane
    }
    form.append(renderField(projectId, typeKey, artifact, name, field));
    attributeCount++;
  }

  if (attributeCount === 0) {
    form.append(
      el('p', { class: 'empty-state' }, [
        'This artifact has no intrinsic attributes — manage its relationships in the trace pane below.',
      ])
    );
  }

  // Always-visible note pointing the user at the trace pane for refs.
  form.append(
    el('p', { class: 'editor-trace-note' }, [
      relationshipCount > 0
        ? 'Relationships and traceability are managed in the trace pane below.'
        : 'Use the trace pane below to see how this artifact is referenced from elsewhere.',
    ])
  );

  return form;
}

/**
 * @param {string} projectId
 * @param {import('./types.js').ArtifactKey} typeKey
 * @param {Object<string, any>} artifact
 * @param {string} name
 * @param {import('./types.js').Field} field
 */
function renderField(projectId, typeKey, artifact, name, field) {
  const labelText = humanizeFieldName(name);
  const required = /** @type {any} */ (field).required === true;

  const labelEl = el('label', { class: 'editor-field-label', for: inputId(typeKey, name) }, [
    labelText,
    required ? el('span', { class: 'editor-required', 'aria-hidden': 'true' }, [' *']) : '',
  ]);

  const inputEl = renderInput(projectId, typeKey, artifact, name, field);

  return el('div', { class: 'editor-field', dataset: { field: name } }, [labelEl, inputEl]);
}

/**
 * @param {string} projectId
 * @param {import('./types.js').ArtifactKey} typeKey
 * @param {Object<string, any>} artifact
 * @param {string} name
 * @param {import('./types.js').Field} field
 */
function renderInput(projectId, typeKey, artifact, name, field) {
  const id = inputId(typeKey, name);
  const value = artifact[name];

  switch (field.kind) {
    case 'string':
      return el('input', {
        class: 'editor-input',
        type: 'text',
        id,
        value: value ?? '',
        oninput: (/** @type {InputEvent} */ e) => {
          const target = /** @type {HTMLInputElement} */ (e.target);
          state.updateArtifact(projectId, artifact.id, { [name]: target.value });
        },
      });

    case 'text':
      return el(
        'textarea',
        {
          class: 'editor-input editor-textarea',
          id,
          rows: '3',
          oninput: (/** @type {InputEvent} */ e) => {
            const target = /** @type {HTMLTextAreaElement} */ (e.target);
            state.updateArtifact(projectId, artifact.id, { [name]: target.value });
          },
        },
        [value ?? '']
      );

    case 'date':
      return el('input', {
        class: 'editor-input',
        type: 'date',
        id,
        value: value ?? '',
        oninput: (/** @type {InputEvent} */ e) => {
          const target = /** @type {HTMLInputElement} */ (e.target);
          state.updateArtifact(projectId, artifact.id, { [name]: target.value });
        },
      });

    case 'number':
      return el('input', {
        class: 'editor-input',
        type: 'number',
        id,
        value: value ?? '',
        oninput: (/** @type {InputEvent} */ e) => {
          const target = /** @type {HTMLInputElement} */ (e.target);
          const v = target.value;
          state.updateArtifact(projectId, artifact.id, { [name]: v === '' ? null : Number(v) });
        },
      });

    case 'enum':
      return renderEnumSelect(id, /** @type {any} */ (field), value, (next) => {
        state.updateArtifact(projectId, artifact.id, { [name]: next });
      });

    case 'ref':
    case 'ref-array':
    case 'polymorphic-ref-array':
      // Should never be reached: renderForm filters these out and routes
      // them to the trace pane. Defensive return so unforeseen schemas
      // don't crash the form.
      return placeholderField('Relationship — manage in the trace pane below.');

    case 'object':
      if (typeKey === 'riskReducingMeasure' && name === 'calculator') {
        return renderCalculatorWidget(projectId, artifact);
      }
      return placeholderField('Structured field — no editor for this field yet.');

    default:
      return placeholderField(`Field kind not yet supported: ${field.kind}`);
  }
}

// --- Calculator widget ------------------------------------------------

/**
 * @param {string} projectId
 * @param {Object<string, any>} artifact
 */
function renderCalculatorWidget(projectId, artifact) {
  const wrap = el('div', { class: 'calc-widget' });
  const current = artifact.calculator || null;

  const picker = el('select', {
    class: 'editor-input calc-picker',
    onchange: (/** @type {Event} */ e) => {
      const v = /** @type {HTMLSelectElement} */ (e.target).value;
      if (!v) {
        state.updateArtifact(projectId, artifact.id, { calculator: null });
        const cur = state.getById(projectId, artifact.id)?.ref ?? artifact;
        const fresh = renderCalculatorWidget(projectId, cur);
        wrap.replaceWith(fresh);
        return;
      }
      const calc = getCalculator(v);
      if (!calc) return;
      const inputs = {};
      for (const f of calc.fields) inputs[f.name] = f.default ?? '';
      const result = runCalculator(calc.id, inputs);
      state.updateArtifact(projectId, artifact.id, {
        calculator: {
          type: calc.id,
          inputs,
          result,
          snapshotStandardVersion: calc.standardVersion,
        },
      });
      const cur = state.getById(projectId, artifact.id)?.ref ?? artifact;
      const fresh = renderCalculatorWidget(projectId, cur);
      wrap.replaceWith(fresh);
    },
  });
  picker.append(el('option', { value: '' }, ['— No calculator —']));
  for (const c of listCalculators()) {
    const opt = el('option', { value: c.id }, [c.name]);
    if (current && current.type === c.id) opt.setAttribute('selected', '');
    picker.append(opt);
  }
  wrap.append(picker);

  if (!current) return wrap;

  const calc = getCalculator(current.type);
  if (!calc) {
    wrap.append(
      el('div', { class: 'calc-warning' }, [
        `Unknown calculator type "${current.type}". The data is preserved on the artifact but cannot be edited until the calculator module is restored.`,
      ])
    );
    return wrap;
  }

  wrap.append(
    el('div', { class: 'calc-meta' }, [
      el('div', { class: 'calc-version' }, [
        current.snapshotStandardVersion || calc.standardVersion,
      ]),
      el('div', { class: 'calc-description' }, [calc.description]),
    ])
  );

  const inputsEl = el('div', { class: 'calc-inputs' });
  for (const f of calc.fields) {
    inputsEl.append(renderCalcInputField(projectId, artifact, calc, f));
  }
  wrap.append(inputsEl);

  wrap.append(renderCalcResult(calc, current.result));

  if (calc.disclaimer) {
    wrap.append(el('div', { class: 'calc-disclaimer' }, [calc.disclaimer]));
  }

  return wrap;
}

/**
 * @param {string} projectId
 * @param {Object<string, any>} artifact
 * @param {import('./calculators/index.js').Calculator} calc
 * @param {import('./calculators/index.js').CalculatorField} field
 */
function renderCalcInputField(projectId, artifact, calc, field) {
  const id = `calc-${calc.id}-${field.name}`;
  const value = artifact.calculator?.inputs?.[field.name] ?? '';

  function applyChange(next) {
    const cur = state.getById(projectId, artifact.id)?.ref?.calculator;
    if (!cur || cur.type !== calc.id) return;
    const newInputs = { ...cur.inputs, [field.name]: next };
    const newResult = runCalculator(calc.id, newInputs);
    state.updateArtifact(projectId, artifact.id, {
      calculator: { ...cur, inputs: newInputs, result: newResult },
    });
    const wrap = document.getElementById(id)?.closest('.calc-widget');
    if (wrap) {
      const oldResult = wrap.querySelector('.calc-result');
      if (oldResult) oldResult.replaceWith(renderCalcResult(calc, newResult));
    }
  }

  /** @type {HTMLElement} */
  let input;
  if (field.type === 'enum' && Array.isArray(field.options)) {
    input = el('select', {
      class: 'editor-input',
      id,
      onchange: (/** @type {Event} */ e) => applyChange(/** @type {HTMLSelectElement} */ (e.target).value),
    });
    for (const o of field.options) {
      const opt = el('option', { value: o.value }, [o.label]);
      if (o.value === value) opt.setAttribute('selected', '');
      input.append(opt);
    }
  } else if (field.type === 'number') {
    input = el('input', {
      class: 'editor-input',
      type: 'number',
      id,
      step: 'any',
      value: String(value),
      oninput: (/** @type {InputEvent} */ e) => {
        const v = /** @type {HTMLInputElement} */ (e.target).value;
        applyChange(v === '' ? '' : Number(v));
      },
    });
  } else {
    input = el('input', {
      class: 'editor-input',
      type: 'text',
      id,
      value: String(value ?? ''),
      oninput: (/** @type {InputEvent} */ e) => applyChange(/** @type {HTMLInputElement} */ (e.target).value),
    });
  }

  const labelText = field.unit ? `${field.label} (${field.unit})` : field.label;
  return el('div', { class: 'calc-field' }, [
    el('label', { class: 'calc-field-label', for: id }, [labelText]),
    input,
    field.hint ? el('div', { class: 'calc-field-hint' }, [field.hint]) : '',
  ]);
}

/**
 * @param {import('./calculators/index.js').Calculator} calc
 * @param {Record<string, unknown> | null | undefined} result
 */
function renderCalcResult(calc, result) {
  const wrap = el('div', { class: 'calc-result' });
  wrap.append(el('div', { class: 'calc-result-title' }, ['Result']));

  if (!result) {
    wrap.append(el('div', { class: 'calc-result-empty' }, ['—']));
    return wrap;
  }

  if ('error' in result && result.error) {
    wrap.append(el('div', { class: 'calc-result-error' }, [String(result.error)]));
    return wrap;
  }

  const summary = calc.summarize ? calc.summarize({}, result) : '';
  if (summary) {
    wrap.append(el('div', { class: 'calc-result-summary' }, [summary]));
  }

  const detail = el('dl', { class: 'calc-result-detail' });
  for (const [k, v] of Object.entries(result)) {
    if (v == null) continue;
    detail.append(el('dt', {}, [humanizeFieldName(k)]), el('dd', {}, [String(v)]));
  }
  wrap.append(detail);
  return wrap;
}

// --- Enum / ref / ref-array inputs ------------------------------------

/**
 * @param {string} id
 * @param {{ kind: 'enum', values: string[], nullable?: boolean }} field
 * @param {string | null} value
 * @param {(next: string | null) => void} onChange
 */
function renderEnumSelect(id, field, value, onChange) {
  const select = el('select', {
    class: 'editor-input',
    id,
    onchange: (/** @type {Event} */ e) => {
      const t = /** @type {HTMLSelectElement} */ (e.target);
      onChange(t.value === '' ? null : t.value);
    },
  });
  if (field.nullable || value == null || value === '') {
    select.append(el('option', { value: '' }, ['— none —']));
  }
  for (const v of field.values) {
    const opt = el('option', { value: v }, [humanizeEnumValue(v)]);
    if (v === value) opt.setAttribute('selected', '');
    select.append(opt);
  }
  return select;
}

/**
 * @param {string} projectId
 * @param {string} id
 * @param {{ kind: 'ref', target: import('./types.js').ArtifactKey, nullable?: boolean }} field
 * @param {string | null} value
 * @param {string} ownId
 * @param {(next: string | null) => void} onChange
 */
function renderRefSelect(projectId, id, field, value, ownId, onChange) {
  const targets = state.getByType(projectId, field.target);
  const select = el('select', {
    class: 'editor-input',
    id,
    onchange: (/** @type {Event} */ e) => {
      const t = /** @type {HTMLSelectElement} */ (e.target);
      onChange(t.value === '' ? null : t.value);
    },
  });
  select.append(el('option', { value: '' }, ['— none —']));
  for (const t of targets) {
    if (t.id === ownId) continue;
    const opt = el('option', { value: t.id }, [`${labelOf(field.target, t)} (${t.id})`]);
    if (t.id === value) opt.setAttribute('selected', '');
    select.append(opt);
  }
  return select;
}

/**
 * @param {string} projectId
 * @param {{ kind: 'ref-array', target: import('./types.js').ArtifactKey }} field
 * @param {string[]} value
 * @param {string} ownId
 * @param {(next: string[]) => void} onChange
 */
function renderRefArrayCheckboxes(projectId, field, value, ownId, onChange) {
  const targets = state.getByType(projectId, field.target).filter((t) => t.id !== ownId);
  if (targets.length === 0) {
    return el('div', { class: 'editor-field-placeholder' }, [
      `No ${ArtifactTypes[field.target].displayNamePlural.toLowerCase()} to link to yet.`,
    ]);
  }
  const set = new Set(value);
  const list = el('div', { class: 'editor-checkbox-list', role: 'group' });
  for (const t of targets) {
    const checked = set.has(t.id);
    const cb = el('input', {
      type: 'checkbox',
      value: t.id,
      onchange: (/** @type {Event} */ e) => {
        const target = /** @type {HTMLInputElement} */ (e.target);
        const next = new Set(set);
        if (target.checked) next.add(t.id);
        else next.delete(t.id);
        onChange([...next]);
      },
    });
    if (checked) cb.setAttribute('checked', '');
    list.append(
      el('label', { class: 'editor-checkbox' }, [
        cb,
        el('span', {}, [`${labelOf(field.target, t)} (${t.id})`]),
      ])
    );
  }
  return list;
}

function placeholderField(message) {
  return el('div', { class: 'editor-field-placeholder' }, [message]);
}

/**
 * @param {string} typeKey
 * @param {string} fieldName
 */
function inputId(typeKey, fieldName) {
  return `edit-${typeKey}-${fieldName}`;
}

/**
 * @param {string} projectId
 * @param {string} artifactId
 * @param {string} displayName
 */
function handleDelete(projectId, artifactId, displayName) {
  const entry = state.getById(projectId, artifactId);
  const label = entry ? labelOf(entry.type, entry.ref) : artifactId;
  const ok = window.confirm(
    `Delete ${displayName.toLowerCase()} "${label}"?\n\nReferences from other artifacts will be cleared.`
  );
  if (!ok) return;
  state.removeArtifact(projectId, artifactId);
}

// --- Welcome panel ----------------------------------------------------

function isWorkspaceEmpty() {
  return state.getProjectIds().length === 0;
}

/**
 * @param {WelcomeActions} actions
 * @returns {HTMLElement}
 */
function renderWelcome(actions) {
  const panel = el('div', { class: 'welcome-panel' });

  panel.append(
    el('div', { class: 'welcome-mark', 'aria-hidden': 'true' }, ['◇']),
    el('h1', { class: 'welcome-title' }, ['Welcome to OpenConformity']),
    el('p', { class: 'welcome-subhead' }, [
      'Open-source conformity assessment for CE marking under European product legislation.',
    ])
  );

  const buttons = el('div', { class: 'welcome-actions' });
  if (actions.loadDemo) {
    buttons.append(
      el(
        'button',
        {
          class: 'welcome-button welcome-button-primary',
          type: 'button',
          onclick: actions.loadDemo,
        },
        ['Load the demo project']
      )
    );
  }
  if (actions.newProject) {
    buttons.append(
      el(
        'button',
        {
          class: 'welcome-button',
          type: 'button',
          onclick: actions.newProject,
        },
        ['Start a new empty project']
      )
    );
  }
  if (actions.openProject) {
    buttons.append(
      el(
        'button',
        {
          class: 'welcome-button',
          type: 'button',
          onclick: actions.openProject,
        },
        ['Open a project file…']
      )
    );
  }
  if (actions.openLibrary) {
    buttons.append(
      el(
        'button',
        {
          class: 'welcome-button',
          type: 'button',
          onclick: actions.openLibrary,
        },
        ['Browse the legislation library']
      )
    );
  }
  if (buttons.children.length > 0) panel.append(buttons);

  panel.append(
    el('p', { class: 'welcome-hint' }, [
      'OpenConformity is a workspace that can hold multiple projects at once.',
    ])
  );

  return panel;
}

// --- Polymorphic-ref-array picker -------------------------------------

/**
 * @param {string} projectId
 * @param {Object<string, any>} artifact
 * @param {string} fieldName
 * @param {{ kind: 'polymorphic-ref-array', targets: import('./types.js').ArtifactKey[] }} field
 */
function renderPolymorphicLinks(projectId, artifact, fieldName, field) {
  const wrap = el('div', { class: 'poly-links' });

  const refs = Array.isArray(artifact[fieldName]) ? artifact[fieldName] : [];

  const list = el('div', { class: 'poly-links-list' });
  if (refs.length === 0) {
    list.append(el('div', { class: 'poly-links-empty' }, ['No links yet.']));
  } else {
    for (const r of refs) {
      list.append(buildPolyChip(projectId, artifact.id, fieldName, r));
    }
  }
  wrap.append(list);

  wrap.append(
    el(
      'button',
      {
        class: 'poly-add-btn',
        type: 'button',
        onclick: () => openPolyPickerModal(projectId, artifact, fieldName, field),
      },
      ['+ Add link']
    )
  );

  return wrap;
}

/**
 * @param {string} projectId
 * @param {string} ownerId
 * @param {string} fieldName
 * @param {{ type: string, id: string }} ref
 */
function buildPolyChip(projectId, ownerId, fieldName, ref) {
  const target = state.getById(projectId, ref.id);
  const displayLabel = target
    ? labelOf(/** @type {any} */ (ref.type), target.ref)
    : '(missing)';
  const typeLabel = ArtifactTypes[/** @type {any} */ (ref.type)]?.displayName ?? ref.type;

  return el(
    'div',
    {
      class: 'poly-chip' + (target ? '' : ' is-missing'),
      onclick: () => {
        if (target) state.select({ projectId, artifactId: ref.id });
      },
    },
    [
      el('span', { class: 'poly-chip-type' }, [typeLabel]),
      el('span', { class: 'poly-chip-label', title: displayLabel }, [displayLabel]),
      el(
        'button',
        {
          class: 'poly-chip-remove',
          type: 'button',
          title: 'Remove link',
          'aria-label': 'Remove link',
          onclick: (/** @type {MouseEvent} */ e) => {
            e.stopPropagation();
            removePolyLink(projectId, ownerId, fieldName, ref);
          },
        },
        ['×']
      ),
    ]
  );
}

/**
 * @param {string} projectId
 * @param {string} ownerId
 * @param {string} fieldName
 * @param {{ type: string, id: string }} ref
 */
function removePolyLink(projectId, ownerId, fieldName, ref) {
  const entry = state.getById(projectId, ownerId);
  if (!entry) return;
  const cur = Array.isArray(entry.ref[fieldName]) ? entry.ref[fieldName] : [];
  const next = cur.filter(
    (r) => !(r && typeof r === 'object' && r.type === ref.type && r.id === ref.id)
  );
  state.updateArtifact(projectId, ownerId, { [fieldName]: next });
  rerenderPolyLinks(projectId, ownerId, fieldName);
}

/**
 * @param {string} projectId
 * @param {string} ownerId
 * @param {string} fieldName
 */
function rerenderPolyLinks(projectId, ownerId, fieldName) {
  if (!mounts) return;
  const fieldEl = mounts.body.querySelector(`.editor-field[data-field="${fieldName}"]`);
  if (!fieldEl) return;
  const oldWidget = fieldEl.querySelector(':scope > .poly-links');
  const cur = state.getById(projectId, ownerId);
  if (!cur || !oldWidget) return;
  const fieldDef = ArtifactTypes[cur.type].fields[fieldName];
  const fresh = renderPolymorphicLinks(projectId, cur.ref, fieldName, /** @type {any} */ (fieldDef));
  oldWidget.replaceWith(fresh);
}

/**
 * @param {string} projectId
 * @param {Object<string, any>} artifact
 * @param {string} fieldName
 * @param {{ kind: 'polymorphic-ref-array', targets: import('./types.js').ArtifactKey[] }} field
 */
function openPolyPickerModal(projectId, artifact, fieldName, field) {
  const modal = openModal({
    title: `Link ${humanizeFieldName(fieldName).toLowerCase()}`,
    size: 'medium',
  });

  const existing = new Set(
    (Array.isArray(artifact[fieldName]) ? artifact[fieldName] : [])
      .filter((r) => r && r.type && r.id)
      .map((r) => `${r.type}:${r.id}`)
  );

  /** @type {Set<string>} */
  const picked = new Set();

  const list = el('div', { class: 'poly-pick-list' });
  let totalRows = 0;

  for (const targetType of field.targets) {
    const items = state.getByType(projectId, targetType).filter((a) => a.id !== artifact.id);
    if (items.length === 0) continue;

    list.append(
      el('div', { class: 'poly-pick-group' }, [ArtifactTypes[targetType].displayNamePlural])
    );

    for (const item of items) {
      const key = `${targetType}:${item.id}`;
      const isExisting = existing.has(key);
      const cb = el('input', {
        type: 'checkbox',
        disabled: isExisting ? 'disabled' : null,
        onchange: (/** @type {Event} */ e) => {
          const t = /** @type {HTMLInputElement} */ (e.target);
          if (t.checked) picked.add(key);
          else picked.delete(key);
          updateConfirm();
        },
      });
      const row = el(
        'label',
        { class: 'poly-pick-row' + (isExisting ? ' is-existing' : '') },
        [
          cb,
          el('span', { class: 'poly-pick-label' }, [
            `${labelOf(targetType, item)} (${item.id})`,
          ]),
          isExisting ? el('span', { class: 'poly-pick-flag' }, ['linked']) : '',
        ]
      );
      list.append(row);
      totalRows++;
    }
  }

  if (totalRows === 0) {
    list.append(
      el('div', { class: 'library-empty' }, ['No artifacts of the allowed types exist yet.'])
    );
  }

  modal.bodyEl.append(list);

  const confirmBtn = modalButton(
    'Add links',
    () => {
      if (picked.size === 0) return;
      const cur = state.getById(projectId, artifact.id);
      if (!cur) {
        modal.close();
        return;
      }
      const existingArr = Array.isArray(cur.ref[fieldName]) ? cur.ref[fieldName] : [];
      const adds = [];
      for (const key of picked) {
        const sep = key.indexOf(':');
        adds.push({ type: key.slice(0, sep), id: key.slice(sep + 1) });
      }
      state.updateArtifact(projectId, artifact.id, { [fieldName]: [...existingArr, ...adds] });
      rerenderPolyLinks(projectId, artifact.id, fieldName);
      modal.close();
    },
    { primary: true, disabled: true }
  );

  function updateConfirm() {
    if (picked.size === 0) confirmBtn.setAttribute('disabled', 'disabled');
    else confirmBtn.removeAttribute('disabled');
  }

  modal.footerEl.append(
    el('span', { style: 'flex:1 1 auto' }),
    modalButton('Cancel', () => modal.close()),
    confirmBtn
  );
}
