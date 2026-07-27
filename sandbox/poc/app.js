/**
 * OpenConformity entry point.
 *
 * Bootstraps the workspace, mounts the UI modules, enables autosave and
 * pane dragging, and surfaces the crash-recovery prompt on launch.
 */

import * as state from './modules/state.js';
import { mountTree } from './modules/tree.js';
import { mountEditor } from './modules/editor.js';
import { mountTrace } from './modules/trace.js';
import { mountMenus } from './modules/menus.js';
import {
  enableAutosave,
  saveProjectToFile,
  openProjectFromFile,
  getRestorableAutosave,
  clearAutosave,
  readLastManualSave,
} from './modules/persistence.js';
import { downloadTypeCsv, downloadRelationshipsCsv, downloadAllCsvs } from './modules/export.js';
import { openModal, modalButton } from './modules/modals.js';
import { openLibraryPicker } from './modules/library.js';
import { loadDemoProject } from './modules/demo.js';
import { enablePaneDragging } from './modules/dragging.js';
import { openMetaModelModal } from './modules/meta-model.js';
import { el } from './modules/util.js';

const APP_VERSION = '0.1.0';

// --- Header rendering with inline rename of active project -----------

let isEditingName = false;

function renderHeader() {
  const project = state.getActiveProject();
  const nameEl = document.getElementById('project-name');
  if (!nameEl) return;
  if (isEditingName) return;

  if (!project) {
    nameEl.replaceChildren(document.createTextNode('No project'));
    nameEl.classList.remove('dirty');
    return;
  }

  nameEl.replaceChildren(document.createTextNode(project.meta.name));
  const activeId = state.getActiveProjectId();
  nameEl.classList.toggle('dirty', activeId ? state.isDirty(activeId) : false);
}

function enterRenameMode() {
  if (isEditingName) return;
  const projectId = state.getActiveProjectId();
  const project = state.getActiveProject();
  if (!projectId || !project) return;

  const nameEl = document.getElementById('project-name');
  if (!nameEl) return;
  isEditingName = true;

  const input = document.createElement('input');
  input.className = 'project-name-input';
  input.type = 'text';
  input.value = project.meta.name;

  let committed = false;
  function commit(save) {
    if (committed) return;
    committed = true;
    if (save) {
      const v = input.value.trim();
      if (v) state.renameProject(projectId, v);
    }
    isEditingName = false;
    renderHeader();
  }

  input.addEventListener('blur', () => commit(true));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      commit(false);
    }
  });

  nameEl.replaceChildren(input);
  input.focus();
  input.select();
}

function init() {
  renderHeader();

  state.subscribe((change) => {
    if (
      change.kind === 'replace' ||
      change.kind === 'meta' ||
      change.kind === 'add' ||
      change.kind === 'update' ||
      change.kind === 'remove' ||
      change.kind === 'project-add' ||
      change.kind === 'project-remove' ||
      change.kind === 'project-active'
    ) {
      renderHeader();
    }
  });

  document.getElementById('project-name')?.addEventListener('click', enterRenameMode);

  const treeBody = /** @type {HTMLElement | null} */ (document.getElementById('tree-body'));
  const treeActions = /** @type {HTMLElement | null} */ (document.getElementById('tree-actions'));
  if (treeBody) {
    mountTree(treeBody, {
      actionsEl: treeActions,
      saveProject: (projectId) => saveProjectToFile({ projectId }),
      closeProject: (projectId) => handleCloseProject(projectId),
    });
  }

  const editorBody = /** @type {HTMLElement | null} */ (document.getElementById('editor-body'));
  const editorTitle = /** @type {HTMLElement | null} */ (document.getElementById('editor-title'));
  const editorActions = /** @type {HTMLElement | null} */ (document.getElementById('editor-actions'));
  if (editorBody && editorTitle && editorActions) {
    mountEditor({
      bodyEl: editorBody,
      titleEl: editorTitle,
      actionsEl: editorActions,
      welcomeActions: {
        loadDemo: handleLoadDemo,
        openLibrary: () => openLibraryPicker(),
        openProject: handleOpenProject,
        newProject: handleNewProject,
      },
    });
  }

  const traceBody = /** @type {HTMLElement | null} */ (document.getElementById('trace-body'));
  const traceActions = /** @type {HTMLElement | null} */ (document.getElementById('trace-actions'));
  if (traceBody) mountTrace(traceBody, { actionsEl: traceActions });

  document.getElementById('btn-meta-model')?.addEventListener('click', () => {
    openMetaModelModal();
  });

  mountMenus({
    newProject: handleNewProject,
    openProject: handleOpenProject,
    loadDemo: handleLoadDemo,
    closeProject: () => {
      const pid = state.getActiveProjectId();
      if (pid) handleCloseProject(pid);
    },
    save: handleSave,
    saveAs: handleSaveAs,
    renameProject: handleRenameProject,
    exportType: (key) => {
      const pid = state.getActiveProjectId();
      if (pid) downloadTypeCsv(pid, key);
    },
    exportRelationships: () => {
      const pid = state.getActiveProjectId();
      if (pid) downloadRelationshipsCsv(pid);
    },
    exportAll: () => {
      const pid = state.getActiveProjectId();
      if (pid) downloadAllCsvs(pid);
    },
    about: handleAbout,
  });

  enableAutosave();
  enablePaneDragging();
  promptRestoreIfNeeded();
}

// --- Action handlers -------------------------------------------------

function handleNewProject() {
  openNewProjectModal();
}

/**
 * Picker shown on every "New project" action. Captures the project name and
 * the subset of artifact types it should include. Legislation pairs with its
 * nested essential requirements — toggling one toggles both.
 */
function openNewProjectModal() {
  // Picker rows: each row corresponds to one or more underlying ArtifactKeys.
  /** @type {{ id: string, label: string, keys: import('./modules/types.js').ArtifactKey[] }[]} */
  const groups = [
    { id: 'architectureElement',  label: 'System Architecture',                       keys: ['architectureElement'] },
    { id: 'legislation',          label: 'Applicable Legislation (with essential requirements)', keys: ['legislation', 'essentialRequirement'] },
    { id: 'harmonizedStandard',   label: 'Harmonized Standards',                      keys: ['harmonizedStandard'] },
    { id: 'preliminaryHazard',    label: 'Hazard Identification',                     keys: ['preliminaryHazard'] },
    { id: 'consolidatedHazard',   label: 'Hazard Assessment',                         keys: ['consolidatedHazard'] },
    { id: 'riskReducingMeasure',  label: 'Protective Measures',                       keys: ['riskReducingMeasure'] },
    { id: 'safetyFunction',       label: 'Safety Functions',                          keys: ['safetyFunction'] },
    { id: 'derivedRequirement',   label: 'Derived Requirements',                      keys: ['derivedRequirement'] },
    { id: 'verificationActivity', label: 'Verification Activities',                   keys: ['verificationActivity'] },
  ];

  const modal = openModal({ title: 'New project', size: 'small' });

  const nameInput = el('input', {
    class: 'editor-input',
    type: 'text',
    value: 'Untitled project',
    placeholder: 'Project name',
    onkeydown: (/** @type {KeyboardEvent} */ e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      }
    },
  });

  /** @type {Map<string, HTMLInputElement>} */
  const checkboxes = new Map();
  const checkboxList = el('div', { class: 'editor-checkbox-list' });
  for (const g of groups) {
    const input = /** @type {HTMLInputElement} */ (
      el('input', { type: 'checkbox', checked: 'checked' })
    );
    checkboxes.set(g.id, input);
    checkboxList.append(
      el('label', { class: 'editor-checkbox' }, [input, g.label])
    );
  }

  modal.bodyEl.append(
    el('label', { class: 'editor-field-label' }, ['Name']),
    nameInput,
    el('label', { class: 'editor-field-label', style: 'margin-top:12px' }, ['Include in this project']),
    checkboxList,
    el('p', { class: 'modal-hint' }, [
      'Only the selected artifact types appear in the tree. The rest of the meta model stays available — you can re-enable types later by editing the project file.',
    ])
  );

  modal.footerEl.append(
    el('span', { style: 'flex:1 1 auto' }),
    modalButton('Cancel', () => modal.close()),
    modalButton('Create', confirm, { primary: true })
  );

  setTimeout(() => {
    nameInput.focus();
    /** @type {HTMLInputElement} */ (nameInput).select();
  }, 0);

  function confirm() {
    const name = /** @type {HTMLInputElement} */ (nameInput).value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    /** @type {import('./modules/types.js').ArtifactKey[]} */
    const enabledTypes = [];
    for (const g of groups) {
      if (checkboxes.get(g.id)?.checked) enabledTypes.push(...g.keys);
    }
    if (enabledTypes.length === 0) {
      window.alert('Pick at least one artifact type to include.');
      return;
    }
    modal.close();
    state.createProject({ name, makeActive: true, enabledTypes });
  }
}

async function handleOpenProject() {
  try {
    await openProjectFromFile();
  } catch (err) {
    if (err instanceof Error && err.message === 'No file selected.') return;
    window.alert(`Could not open project.\n\n${/** @type {Error} */ (err).message}`);
  }
}

function handleLoadDemo() {
  loadDemoProject();
}

/**
 * Confirm-and-close a project. Warns if the project has unsaved changes.
 * @param {string} projectId
 */
function handleCloseProject(projectId) {
  const project = state.getProject(projectId);
  if (!project) return;
  if (state.isDirty(projectId)) {
    const ok = window.confirm(
      `"${project.meta.name}" has unsaved changes. Close it anyway? Unsaved work will be discarded.`
    );
    if (!ok) return;
  }
  state.removeProject(projectId);
  // If no projects are left, also clear the autosave so the next launch
  // starts on the welcome panel rather than offering to restore an empty
  // workspace.
  if (state.getProjectIds().length === 0) clearAutosave();
}

function handleSave() {
  const pid = state.getActiveProjectId();
  if (!pid) {
    window.alert('No active project to save.');
    return;
  }
  saveProjectToFile({ projectId: pid });
}

function handleSaveAs() {
  const pid = state.getActiveProjectId();
  const project = pid ? state.getProject(pid) : null;
  if (!pid || !project) {
    window.alert('No active project to save.');
    return;
  }
  openNamePromptModal({
    title: 'Save project as…',
    label: 'Project name',
    initial: project.meta.name,
    submitLabel: 'Save',
    hint: 'A JSON file will be downloaded; the name above is also stored in the project metadata.',
    onConfirm: (newName) => {
      state.renameProject(pid, newName);
      saveProjectToFile({ projectId: pid });
    },
  });
}

function handleRenameProject() {
  const pid = state.getActiveProjectId();
  const project = pid ? state.getProject(pid) : null;
  if (!pid || !project) return;
  openNamePromptModal({
    title: 'Rename project',
    label: 'Project name',
    initial: project.meta.name,
    submitLabel: 'Rename',
    onConfirm: (newName) => state.renameProject(pid, newName),
  });
}

function handleAbout() {
  const modal = openModal({ title: 'About OpenConformity', size: 'medium' });
  modal.bodyEl.append(
    el('p', {}, [
      el('strong', {}, ['OpenConformity']),
      ` ${APP_VERSION} — open-source conformity assessment for CE marking under European product legislation.`,
    ]),
    el('p', { class: 'modal-hint' }, [
      'A free, browser-based tool inspired by Model-Based Systems Engineering, MIL-STD-882E, and requirements engineering. The tool supports the engineering work of CE marking — structured thinking, modeling, and traceability — without producing the technical file. Users assemble engineering artefacts from CSV exports under their own quality system.',
    ]),
    el('p', { class: 'modal-hint' }, [
      'Released under the MIT License. Solo hobby project — pull requests are not accepted; forks are welcome.',
    ]),
    el('p', { class: 'modal-hint' }, [
      'Provided as-is, without warranty. Outputs must be verified by the user. The manufacturer of the product is responsible for the conformity assessment of their product.',
    ])
  );
  modal.footerEl.append(
    el('span', { style: 'flex:1 1 auto' }),
    modalButton('Close', () => modal.close(), { primary: true })
  );
}

/**
 * @param {{ title: string, label: string, initial: string, submitLabel: string, hint?: string, onConfirm: (value: string) => void }} opts
 */
function openNamePromptModal({ title, label, initial, submitLabel, hint, onConfirm }) {
  const modal = openModal({ title, size: 'small' });

  const input = el('input', {
    class: 'editor-input',
    type: 'text',
    value: initial,
    placeholder: label,
    onkeydown: (/** @type {KeyboardEvent} */ e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      }
    },
  });

  modal.bodyEl.append(el('label', { class: 'editor-field-label' }, [label]), input);
  if (hint) modal.bodyEl.append(el('p', { class: 'modal-hint' }, [hint]));

  modal.footerEl.append(
    el('span', { style: 'flex:1 1 auto' }),
    modalButton('Cancel', () => modal.close()),
    modalButton(submitLabel, confirm, { primary: true })
  );

  function confirm() {
    const v = /** @type {HTMLInputElement} */ (input).value.trim();
    if (!v) {
      input.focus();
      return;
    }
    modal.close();
    onConfirm(v);
  }
}

function promptRestoreIfNeeded() {
  const auto = getRestorableAutosave();
  if (!auto) return;

  const last = readLastManualSave();
  const projectsCount = auto.workspace.projects.length;
  const modal = openModal({
    title: 'Restore unsaved work?',
    size: 'small',
    closeOnBackdrop: false,
  });

  modal.bodyEl.append(
    el('p', {}, [
      `OpenConformity has autosaved ${projectsCount} project${
        projectsCount === 1 ? '' : 's'
      } from ${formatDateTime(auto.savedAt)}.`,
    ]),
    el('p', { class: 'modal-hint' }, [
      last
        ? `The last manual save was ${formatDateTime(last.savedAt)}${
            last.filename ? ` (${last.filename})` : ''
          }.`
        : 'There is no record of a previous manual save in this browser.',
    ])
  );

  modal.footerEl.append(
    el('span', { style: 'flex:1 1 auto' }),
    modalButton(
      'Discard',
      () => {
        clearAutosave();
        modal.close();
      },
      { danger: true }
    ),
    modalButton(
      'Restore',
      () => {
        try {
          state.replaceWorkspace(auto.workspace);
          // Mark the active project dirty again so the user knows there's
          // unsaved work — replaceWorkspace clears dirty flags.
          const pid = state.getActiveProjectId();
          if (pid) state.updateMeta(pid, {});
        } catch (err) {
          window.alert(
            `Could not restore autosaved workspace.\n\n${/** @type {Error} */ (err).message}`
          );
        }
        modal.close();
      },
      { primary: true }
    )
  );
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

init();
