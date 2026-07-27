/**
 * Legislation library picker.
 *
 * Loads the bundled library from `data/legislation-library.json` and shows
 * a modal where the user can search and multi-select legislations and (per
 * legislation) individual essential requirements.
 *
 * Targets the *active project*. If no project exists yet, the picker
 * auto-creates a new "Untitled project" and adds to that — so a fresh
 * launch can flow straight from the welcome panel into the library.
 *
 * On confirm:
 *   - Each picked legislation is copied into the active project (skipped
 *     if a legislation with that libraryRef already exists in it).
 *   - Each picked essential requirement is copied with its parent
 *     legislation auto-added if it wasn't picked explicitly. ERs are
 *     skipped if one with the same libraryRef already exists.
 *   - libraryRef is preserved on every copied entry, per the locked
 *     "library entries are copied, not referenced" decision.
 */

import * as state from './state.js';
import { openModal, modalButton } from './modals.js';
import { el } from './util.js';

/** @typedef {{ libraryRef: string, code?: string, title: string, text: string }} LibraryEssentialRequirement */
/** @typedef {{ libraryRef: string, name: string, reference: string, description?: string, essentialRequirements: LibraryEssentialRequirement[] }} LibraryLegislation */
/** @typedef {{ schemaVersion: number, meta?: any, legislations: LibraryLegislation[] }} LibraryData */

/** @type {LibraryData | null} */
let cachedLibrary = null;

/**
 * Lazily load the bundled library JSON. Cached for the session.
 * @returns {Promise<LibraryData>}
 */
async function loadLibrary() {
  if (cachedLibrary) return cachedLibrary;
  const res = await fetch('./data/legislation-library.json');
  if (!res.ok) throw new Error(`Failed to load library: ${res.status}`);
  const data = /** @type {LibraryData} */ (await res.json());
  cachedLibrary = data;
  return data;
}

/**
 * Open the picker modal. Resolves when the modal is dismissed (whether or
 * not anything was added).
 * @returns {Promise<void>}
 */
export async function openLibraryPicker() {
  /** @type {LibraryData} */
  let data;
  try {
    data = await loadLibrary();
  } catch (err) {
    window.alert(`Could not load legislation library.\n\n${/** @type {Error} */ (err).message}`);
    return;
  }

  // Resolve a target project — auto-create one if the workspace is empty
  // so welcome-panel → library still works.
  let projectId = state.getActiveProjectId();
  if (!projectId) {
    projectId = state.createProject({ name: 'Untitled project', makeActive: true });
  }

  const projectName = state.getProject(projectId)?.meta.name ?? '';

  const modal = openModal({
    title: `Legislation library — ${projectName}`,
    size: 'large',
  });

  // Selection state — module-local to this picker instance.
  /** @type {Set<string>} */
  const pickedLegislations = new Set();
  /** @type {Map<string, Set<string>>} */
  const pickedERsByLegislation = new Map();
  /** @type {Set<string>} */
  const expanded = new Set();

  let filterTerm = '';

  // Pre-compute "already in project" sets so the picker can show what's
  // already been added and skip duplicates on confirm.
  const existingLegislationRefs = new Set(
    state
      .getByType(projectId, 'legislation')
      .map((l) => l.libraryRef)
      .filter((r) => typeof r === 'string' && r)
  );
  const existingERRefs = new Set(
    state
      .getByType(projectId, 'essentialRequirement')
      .map((e) => e.libraryRef)
      .filter((r) => typeof r === 'string' && r)
  );

  // --- Header: search input ---
  const searchInput = el('input', {
    class: 'library-search',
    type: 'search',
    placeholder: 'Filter by name, reference, code, or text…',
    'aria-label': 'Filter library',
    oninput: (/** @type {InputEvent} */ e) => {
      filterTerm = /** @type {HTMLInputElement} */ (e.target).value.trim().toLowerCase();
      renderList();
    },
  });
  modal.headerEl.insertBefore(searchInput, modal.headerEl.lastChild);

  // --- Body: scrolling list ---
  const listEl = el('div', { class: 'library-list', role: 'listbox', 'aria-multiselectable': 'true' });
  modal.bodyEl.append(listEl);

  // --- Footer: counts + actions ---
  const summaryEl = el('span', { class: 'library-summary' }, ['Nothing selected']);
  const cancelBtn = modalButton('Cancel', () => modal.close());
  const addBtn = modalButton('Add to project', confirm, { primary: true, disabled: true });
  modal.footerEl.append(summaryEl, cancelBtn, addBtn);

  function updateSummary() {
    const legCount = pickedLegislations.size;
    let erCount = 0;
    for (const set of pickedERsByLegislation.values()) erCount += set.size;
    if (legCount === 0 && erCount === 0) {
      summaryEl.textContent = 'Nothing selected';
      addBtn.setAttribute('disabled', 'disabled');
    } else {
      const parts = [];
      if (legCount > 0) parts.push(`${legCount} legislation${legCount === 1 ? '' : 's'}`);
      if (erCount > 0) parts.push(`${erCount} essential requirement${erCount === 1 ? '' : 's'}`);
      summaryEl.textContent = parts.join(' · ') + ' selected';
      addBtn.removeAttribute('disabled');
    }
  }

  function legMatches(/** @type {LibraryLegislation} */ leg) {
    if (!filterTerm) return true;
    if (leg.name.toLowerCase().includes(filterTerm)) return true;
    if ((leg.reference || '').toLowerCase().includes(filterTerm)) return true;
    if ((leg.description || '').toLowerCase().includes(filterTerm)) return true;
    for (const er of leg.essentialRequirements ?? []) {
      if ((er.title || '').toLowerCase().includes(filterTerm)) return true;
      if ((er.code || '').toLowerCase().includes(filterTerm)) return true;
      if ((er.text || '').toLowerCase().includes(filterTerm)) return true;
    }
    return false;
  }

  function renderList() {
    listEl.replaceChildren();
    let visible = 0;
    for (const leg of data.legislations) {
      if (!legMatches(leg)) continue;
      visible++;
      listEl.append(renderLegislationRow(leg));
    }
    if (visible === 0) {
      listEl.append(
        el('div', { class: 'library-empty' }, ['No legislations match this filter.'])
      );
    }
  }

  function renderLegislationRow(/** @type {LibraryLegislation} */ leg) {
    const alreadyInProject = existingLegislationRefs.has(leg.libraryRef);
    const isExpanded = expanded.has(leg.libraryRef);
    const isPicked = pickedLegislations.has(leg.libraryRef);

    const checkbox = el('input', {
      type: 'checkbox',
      'aria-label': `Add ${leg.name}`,
      onchange: (/** @type {Event} */ e) => {
        const checked = /** @type {HTMLInputElement} */ (e.target).checked;
        if (checked) pickedLegislations.add(leg.libraryRef);
        else pickedLegislations.delete(leg.libraryRef);
        updateSummary();
      },
    });
    if (isPicked) checkbox.setAttribute('checked', '');
    if (alreadyInProject) {
      checkbox.setAttribute('disabled', 'disabled');
      checkbox.setAttribute('title', 'Already in project');
    }

    const disclosure = el(
      'button',
      {
        class: 'library-disclosure',
        type: 'button',
        'aria-expanded': String(isExpanded),
        'aria-label': isExpanded ? 'Collapse' : 'Expand',
        onclick: (/** @type {MouseEvent} */ e) => {
          e.stopPropagation();
          if (expanded.has(leg.libraryRef)) expanded.delete(leg.libraryRef);
          else expanded.add(leg.libraryRef);
          renderList();
        },
      },
      [isExpanded ? '▾' : '▸']
    );

    const head = el(
      'div',
      {
        class: 'library-row library-leg-row',
        onclick: () => {
          if (alreadyInProject) return;
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event('change'));
        },
      },
      [
        disclosure,
        el('label', { class: 'library-checkbox-wrap' }, [checkbox]),
        el('div', { class: 'library-leg-meta' }, [
          el('div', { class: 'library-leg-name' }, [leg.name]),
          el('div', { class: 'library-leg-reference' }, [
            leg.reference,
            alreadyInProject ? ' · already in project' : '',
          ]),
          leg.description
            ? el('div', { class: 'library-leg-description' }, [leg.description])
            : '',
        ]),
        el('span', { class: 'library-er-count' }, [
          `${(leg.essentialRequirements ?? []).length} ER${
            (leg.essentialRequirements ?? []).length === 1 ? '' : 's'
          }`,
        ]),
      ]
    );

    const wrap = el('div', { class: 'library-leg' }, [head]);

    if (isExpanded) {
      const erList = el('div', { class: 'library-er-list' });
      const ers = leg.essentialRequirements ?? [];

      // Bulk select-all / clear, scoped to ERs of this legislation that
      // aren't already in the project.
      const addableERs = ers.filter((er) => !existingERRefs.has(er.libraryRef));
      if (addableERs.length > 0) {
        const pickedSet = pickedERsByLegislation.get(leg.libraryRef) ?? new Set();
        const allPicked = addableERs.every((er) => pickedSet.has(er.libraryRef));
        erList.append(
          el(
            'div',
            { class: 'library-er-bulk' },
            [
              el(
                'button',
                {
                  class: 'library-bulk-button',
                  type: 'button',
                  onclick: (/** @type {MouseEvent} */ e) => {
                    e.stopPropagation();
                    let s = pickedERsByLegislation.get(leg.libraryRef);
                    if (!s) {
                      s = new Set();
                      pickedERsByLegislation.set(leg.libraryRef, s);
                    }
                    if (allPicked) {
                      for (const er of addableERs) s.delete(er.libraryRef);
                    } else {
                      for (const er of addableERs) s.add(er.libraryRef);
                    }
                    if (s.size === 0) pickedERsByLegislation.delete(leg.libraryRef);
                    renderList();
                    updateSummary();
                  },
                },
                [allPicked ? 'Clear all ERs' : 'Select all ERs']
              ),
              el('span', { class: 'library-er-bulk-hint' }, [
                `${addableERs.length} of ${ers.length} can be added`,
              ]),
            ]
          )
        );
      }

      for (const er of ers) {
        erList.append(renderERRow(leg, er));
      }
      if (ers.length === 0) {
        erList.append(
          el('div', { class: 'library-empty library-empty-inset' }, [
            'No essential requirements bundled for this legislation yet.',
          ])
        );
      }
      wrap.append(erList);
    }

    return wrap;
  }

  function renderERRow(/** @type {LibraryLegislation} */ leg, /** @type {LibraryEssentialRequirement} */ er) {
    const alreadyInProject = existingERRefs.has(er.libraryRef);
    const set = pickedERsByLegislation.get(leg.libraryRef) ?? new Set();
    const isPicked = set.has(er.libraryRef);

    const checkbox = el('input', {
      type: 'checkbox',
      'aria-label': `Add ${er.title}`,
      onchange: (/** @type {Event} */ e) => {
        const checked = /** @type {HTMLInputElement} */ (e.target).checked;
        let s = pickedERsByLegislation.get(leg.libraryRef);
        if (!s) {
          s = new Set();
          pickedERsByLegislation.set(leg.libraryRef, s);
        }
        if (checked) s.add(er.libraryRef);
        else s.delete(er.libraryRef);
        if (s.size === 0) pickedERsByLegislation.delete(leg.libraryRef);
        updateSummary();
      },
    });
    if (isPicked) checkbox.setAttribute('checked', '');
    if (alreadyInProject) {
      checkbox.setAttribute('disabled', 'disabled');
      checkbox.setAttribute('title', 'Already in project');
    }

    return el(
      'div',
      {
        class: 'library-row library-er-row',
        onclick: () => {
          if (alreadyInProject) return;
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event('change'));
        },
      },
      [
        el('label', { class: 'library-checkbox-wrap' }, [checkbox]),
        el('div', { class: 'library-er-meta' }, [
          el('div', { class: 'library-er-title' }, [
            er.code ? el('span', { class: 'library-er-code' }, [er.code]) : '',
            er.code ? ' ' : '',
            er.title,
          ]),
          er.text ? el('div', { class: 'library-er-text' }, [er.text]) : '',
          alreadyInProject
            ? el('div', { class: 'library-er-flag' }, ['Already in project'])
            : '',
        ]),
      ]
    );
  }

  function confirm() {
    addToProject(projectId, data, pickedLegislations, pickedERsByLegislation);
    modal.close();
  }

  renderList();
  updateSummary();
}

/**
 * Apply the picker selection to a specific project.
 * @param {string} projectId
 * @param {LibraryData} data
 * @param {Set<string>} pickedLegislations
 * @param {Map<string, Set<string>>} pickedERsByLegislation
 */
function addToProject(projectId, data, pickedLegislations, pickedERsByLegislation) {
  // First pass: ensure every legislation that's needed (either picked
  // directly or because its ERs were picked) is present.
  /** @type {Map<string, string>} libraryRef -> artifact id within the project */
  const legProjectIdByRef = new Map();

  for (const leg of state.getByType(projectId, 'legislation')) {
    if (typeof leg.libraryRef === 'string' && leg.libraryRef) {
      legProjectIdByRef.set(leg.libraryRef, leg.id);
    }
  }

  const refsToEnsure = new Set(pickedLegislations);
  for (const ref of pickedERsByLegislation.keys()) refsToEnsure.add(ref);

  for (const ref of refsToEnsure) {
    if (legProjectIdByRef.has(ref)) continue;
    const libLeg = data.legislations.find((l) => l.libraryRef === ref);
    if (!libLeg) continue;
    const id = state.addArtifact(projectId, 'legislation', {
      libraryRef: libLeg.libraryRef,
      name: libLeg.name,
      reference: libLeg.reference || '',
      notes: '',
    });
    legProjectIdByRef.set(ref, id);
  }

  // Second pass: add picked ERs, linked to their legislation.
  const existingERRefs = new Set(
    state.getByType(projectId, 'essentialRequirement').map((e) => e.libraryRef).filter(Boolean)
  );

  for (const [legRef, erRefs] of pickedERsByLegislation) {
    const libLeg = data.legislations.find((l) => l.libraryRef === legRef);
    const legId = legProjectIdByRef.get(legRef);
    if (!libLeg || !legId) continue;
    for (const erRef of erRefs) {
      if (existingERRefs.has(erRef)) continue;
      const libER = (libLeg.essentialRequirements ?? []).find((e) => e.libraryRef === erRef);
      if (!libER) continue;
      state.addArtifact(projectId, 'essentialRequirement', {
        legislationId: legId,
        libraryRef: libER.libraryRef,
        code: libER.code || '',
        title: libER.title || '',
        text: libER.text || '',
        applicabilityNote: '',
        notes: '',
      });
    }
  }
}
