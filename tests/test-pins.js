/**
 * Source pins, not behaviour tests: each check greps the published
 * source — or a bundled asset — for the exact expression of a recorded
 * ruling. A failure here does not mean the software broke; it means a
 * pinned ruling's expression moved. Check the ruling first — the plan,
 * the decision log, the workstream report that ordered it. If the move
 * was ordered, update the pin with it; if not, the source regressed.
 * Run from this directory.
 */

import './shim.js';
import { createActions } from '../app/modules/actions.js';
import { createStore } from '../app/modules/store.js';
import { TYPE_ICONS, FOLDER_ICON, PROJECT_ICON } from '../app/modules/icons.js';
import { ok, summary } from './harness.js';
import { fakeStorage } from './helpers.js';

// --- Pane headers are working surfaces or nothing ----------------------

{
  const page = readFile('../app/index.html');
  ok(!page.includes('pane-title'), 'no pane header only names its pane');
  for (const pane of ['Navigator', 'Editor', 'Relationships']) {
    ok(page.includes(`aria-label="${pane}"`), `the ${pane} pane stays an ARIA landmark`);
  }
}

// --- Compliance: the licences ride with the software --------------------

{
  ok(readFile('../app/LICENSE.txt').includes('EUROPEAN UNION PUBLIC LICENCE v. 1.2'), 'the EUPL-1.2 text is reachable at LICENSE.txt');
  ok(readFile('../app/assets/fonts/LICENSE.txt').includes('SIL OPEN FONT LICENSE'), 'the OFL rides with the fonts');
  ok(readFile('../app/assets/icons/LICENSE.txt').includes('Apache License'), 'the Apache licence rides with the icons');
}

// --- The help surface and the chrome ------------------------------------

{
  const page = readFile('../app/index.html');
  for (const menu of ['file', 'edit', 'view', 'help']) {
    ok(page.includes(`id="shell-${menu}"`), `the menu bar carries ${menu}`);
  }
  ok(page.includes('id="shell-metamodel"'), 'and the shell the metamodel action');
  ok(page.includes('id="i-metamodel"'), 'with its glyph in the sprite');
  ok(
    page.includes('href="https://openconformity.org"') &&
      page.includes('class="wordmark"') &&
      /<a class="wordmark"[^>]*target="_blank"[^>]*rel="noopener"/.test(page),
    'the wordmark is a plain link to the project site, opening in a new tab'
  );
}

// --- The bundled metamodel exports --------------------------------------

{
  for (const theme of ['light', 'dark']) {
    let held = '';
    try {
      held = readFile(`../app/assets/images/metamodel-${theme}.png`);
    } catch {
      held = '';
    }
    ok(held.length > 0, `the ${theme} metamodel export is bundled`);
  }
}

// --- The file surface stays on the baseline ----------------------------

{
  const page = readFile('../app/index.html');
  ok(page.includes('id="file-input"') && page.includes('accept=".json'), 'a .json file input is the way in');
  for (const module of ['flows.js', 'files.js', 'shell.js', 'app.js', 'store.js']) {
    const source = readFile(`../app/modules/${module}`);
    ok(
      !source.includes('showOpenFilePicker') && !source.includes('showSaveFilePicker'),
      `${module} uses no File System Access API`
    );
  }
}

// --- The ways into a project live in the editor's empty state ------------

{
  const editor = readFile('../app/modules/editor.js');
  for (const id of ['new-project', 'open', 'load-example']) {
    ok(editor.includes(`id: '${id}'`), `the editor's landing offers ${id}`);
  }
  const navigator = readFile('../app/modules/navigator.js');
  ok(!navigator.includes('landing-'), 'and the navigator landing carries no buttons: they live in one place');
}

// --- Every glyph drawn is in the sprite, with its provenance -------------

{
  const page = readFile('../app/index.html');
  const origin = readFile('../app/assets/icons/ORIGIN.md');
  const glyphs = [...Object.values(TYPE_ICONS), FOLDER_ICON, PROJECT_ICON];
  for (const glyph of glyphs) {
    ok(page.includes(`id="${glyph}"`), `${glyph} is in the sprite`);
    ok(origin.includes(`\`${glyph}\``), `${glyph} has its provenance recorded`);
  }
  const actions = createActions({ store: createStore({ storage: fakeStorage() }), flows: {} });
  for (const action of actions) {
    ok(page.includes(`id="${action.icon}"`), `${action.id} draws under ${action.icon}, which is in the sprite`);
  }
}

// --- The dogfooding batch: what the review ordered -----------------------

{
  const shell = readFile('../app/modules/shell.js');
  const page = readFile('../app/index.html');
  const origin = readFile('../app/assets/icons/ORIGIN.md');

  for (const glyph of ['i-launch', 'i-email']) {
    ok(page.includes(`id="${glyph}"`), `${glyph} is in the sprite`);
    ok(origin.includes(`\`${glyph}\``), `${glyph} has its provenance recorded`);
  }
  ok(shell.includes("window.open(url, '_blank', 'noopener')"), 'every external link leaves in a new tab, noopener');
  for (const label of ['Project site', 'Source on GitHub', 'Follow on LinkedIn', 'Write an email']) {
    ok(shell.includes(`label: '${label}'`), `the Help menu offers ${label}`);
  }
  ok(shell.includes("window.location.href = 'mailto:info@openconformity.org'"), 'the email is a mailto, not a tab');
  ok(
    !shell.includes("{ label: 'Metamodel', icon: 'i-launch'"),
    'the metamodel carries no launch mark: it leaves for no external site'
  );
  ok(page.includes('<button type="button" class="shell-tag" id="shell-beta"></button>') && page.indexOf('id="shell-beta"') > page.indexOf('id="shell-theme"'), 'the phase tag closes the shell bar, after the theme, its text set by the shell');
  ok(shell.includes("betaTag.textContent = PHASE;") && shell.includes("betaTag.addEventListener('click', () => aboutAction.run({ anchor: betaTag }))"), 'the tag reads the release phase, and a click on it opens About');
  const version = readFile('../app/modules/version.js');
  ok(/export const VERSION = '\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?';/.test(version) && /export const PHASE = '[A-Z][a-z]+ beta';/.test(version), 'the version and the phase are two constants in one module');
  const about = readFile('../app/modules/about.js');
  ok(about.includes("el('span', { className: 'about-version', text: VERSION })") && about.includes("text(PHASE),") && about.includes("link('https://github.com/omxnt/openconformity/releases', 'Release notes')"), 'which About names on its release line with the phase, beside the link to the notes');
  const editorSource = readFile('../app/modules/editor.js');
  ok(editorSource.includes("const changed = definitionOfKey.get(key);\n    if (!changed || isRationale(changed) || isOutcome(changed)) return;"), 'a record follows the values of the group that writes it and never a rationale or an outcome, so editing a rationale after a measure was unlinked keeps the flag');
  const recordsSource = readFile('../app/modules/records.js');
  ok(recordsSource.includes(".some((group) => group.attributes.some((held) => !isOutcome(held) && !isRationale(held) && held.kind !== 'entities' && (values[held.key] ?? '').trim() !== ''));") && editorSource.includes("const written = recordWritten(current?.type ?? '', definition, values);") && editorSource.includes("input.value = recordWritten(current?.type ?? '', definition, draft) ? recordOf(") && editorSource.includes("relatedIds(model, subject, definition.relationship)).map((id) => ({ id, label: entityLabel(nodeOf(model, id)), state: 'linked' }))"), 'until the rating that writes a record holds a value, the field shows what is related now, unmarked, and only a written record is compared');
  ok(about.includes("fold('Credits and references', [") && about.includes("held.hidden = true;") && about.includes("attributes: { type: 'button', 'aria-expanded': 'false' }"), 'the credits and references stand folded under one accordion heading, closed when About opens');
  ok(about.includes("['JGraph Ltd', 'Maker and trademark holder, not affiliated', [link('https://www.drawio.com/trust/terms-of-use/', 'Terms of use'), link('https://www.drawio.com/trust/', 'Privacy')]]"), "About credits draw.io's maker, links its terms and privacy, and disclaims affiliation, since the name is their trademark");
  ok(about.includes("['SEBoK', 'System requirement types, after the INCOSE manual', [link('https://sebokwiki.org/wiki/System_Requirements_Definition', 'sebokwiki.org')]]") && about.includes("link('https://www.iso.org/standard/57180.html', 'iso.org')"), 'the methods credit the requirement categories to SEBoK and link each standard to its publisher');

  ok(shell.includes("const fileGroups = ['project', 'example', 'browser']"), 'the File menu parts the example and the clearing of browser data behind separators');
  ok(shell.includes("unsavedButton.hidden = !store.dirty();") && readFile('../app/style.css').includes('.shell-action[hidden] { display: none; }'), 'the save-to-file button in the bar stands only while there are unsaved changes, its hidden attribute honoured over the display rule');

  const editor = readFile('../app/modules/editor.js');
  ok(
    editor.includes("if (event.key !== 'Escape' || mode !== 'edit') return;") && editor.includes('event.stopPropagation();'),
    'Escape in an open edit stops at the editor and never falls through to the overlay'
  );

  const sheet = readFile('../app/style.css');
  ok(sheet.includes('.table th {\n  position: sticky;'), 'the relationship table head stays put while the body scrolls');
}

// --- The second dogfooding batch -----------------------------------------

{
  const page = readFile('../app/index.html');
  const origin = readFile('../app/assets/icons/ORIGIN.md');
  ok(page.includes('id="i-checkmark"'), 'the pick check is in the sprite');
  ok(origin.includes('`i-checkmark`'), 'with its provenance recorded');
  for (const id of ['shell-undo', 'shell-redo']) {
    ok(page.includes(`id="${id}"`), `the shell's global cluster carries ${id}`);
  }

  const navigator = readFile('../app/modules/navigator.js');
  ok(
    navigator.includes("const dragLocked = () => store.picker() !== null || filter().trim() !== ''"),
    'tree drag stands down while picking and while filtering'
  );

  const sheet = readFile('../app/style.css');
  ok(!sheet.includes('dashed var(--accent)'), 'the dashed candidate outlines are gone: dimming alone carries candidacy');

  const { LANDING_OFFER } = await import('../app/modules/editor.js');
  const actions = createActions({ store: createStore({ storage: fakeStorage() }), flows: {} });
  for (const offer of LANDING_OFFER) {
    const action = actions.find((held) => held.id === offer.id);
    ok(action !== undefined, `${offer.id} is a real action`);
    ok(
      action.label === offer.label && action.icon === offer.icon,
      `the editor's ${offer.id} button matches the action's label and glyph`
    );
  }
}

// --- The fourth dogfooding batch -----------------------------------------

{
  const relationships = readFile('../app/modules/relationships.js');
  ok(relationships.includes("return columnGroup('relationships', LIST_COLUMNS);") && relationships.includes("columnHandles(table, 'relationships', [0, 1]);") && relationships.includes("columnHandles(table, 'messages', [0, 1]);"), 'the two direction tables share one column skeleton, and the list and the messages take resize handles on their heads');
  ok(readFile('../app/modules/columns.js').includes("import { splitter } from './splitter.js';") && readFile('../app/modules/columns.js').includes("const dragged = new Map();") && !readFile('../app/modules/columns.js').includes('Storage'), 'the handles are the one splitter the workspace has, and the widths live for the session in memory');
  ok(!readFile('../app/modules/navigator.js').includes('attributes.title'), 'a tree row carries no browser tooltip, one tooltip anatomy everywhere and none on the tree');
  ok(relationships.includes("className: 'rel-fold'"), 'each behind its compact fold');
  ok(!relationships.includes('rel-arrow'), 'the direction arrow column is gone: the split carries direction');
  ok(relationships.includes("const actions = [searchControl()];") && relationships.includes('graph.render(tableFilter)') && readFile('../app/modules/graph.js').includes('const merged = filteredNeighbourhood('), 'the filter serves both views: the list, and the graph narrowed around its subject');
  ok(relationships.includes("className: 'field-input head-search'"), 'the list filter lives behind the head magnifier, on demand');

  const sheet = readFile('../app/style.css');
  ok(sheet.includes('table-layout: fixed;'), 'the tables lay out fixed, so the columns never drift');
  ok(sheet.includes('height: 32px;             /* Carbon data table sm */'), 'rows at Carbon short scale');

  const shell = readFile('../app/modules/shell.js');
  ok(
    shell.includes("const LAYOUT_KEY = 'openconformity.layout'") && shell.includes('sessionStorage'),
    'the splitter geometry rides the browser session, never the project blob'
  );
}

// --- The editor lays attributes out as cells, its groups as tabs ------------

{
  const sheet = readFile('../app/style.css');
  const cells = sheet.slice(sheet.indexOf('.cells {'), sheet.indexOf('.cells[hidden]'));
  ok(cells.includes('grid-template-columns: repeat(2, minmax(0, 1fr));'), 'two cells to a row');
  ok(sheet.includes('.cell.tall { grid-column: 1 / -1; }') && sheet.includes('.cell-value.prose { line-height: 1.42857; white-space: pre-wrap; }'), 'a multiline value takes the row to itself');
  const slot = sheet.slice(sheet.indexOf('.cell-value {'), sheet.indexOf('.cell-value.prose'));
  ok(slot.includes('padding: 7px 16px;') && slot.includes('min-height: 32px;'), 'a view value holds the slot its input would take, so an edit never reflows');
  ok(slot.includes('background: transparent;') && slot.includes('border-bottom: 1px solid var(--border-subtle);'), "read-only: transparent ground, the rule made subtle");
  const input = sheet.slice(sheet.indexOf('.field-input {'), sheet.indexOf('.field-input:focus'));
  ok(input.includes('background: var(--layer);') && input.includes('border-bottom: 1px solid var(--border-strong);'), 'editable: the field fill and the strong rule');
  ok(sheet.includes('height: 18px;             /* Carbon tag sm */'), 'the tag at its small size, to sit inside the slot');
  const editorSource = readFile('../app/modules/editor.js');
  ok(editorSource.includes("className: 'field-input multiselect', attributes: { type: 'button', id: `field-${definition.key}`, 'aria-haspopup': 'listbox'"), "a set in an edit is a field opening Carbon's multiselect");
  const multiselect = readFile('../app/modules/multiselect.js');
  ok(multiselect.includes("attributes: { role: 'listbox', 'aria-label': label, 'aria-multiselectable': 'true' }") && multiselect.includes("role: 'option', 'aria-selected': String(chosen.has(option))"), 'a listbox of every value, each an option carrying its state');
  ok(multiselect.includes("kind: 'menu',\n    element: list,\n    opener: anchor,"), 'stacked on the overlay as a menu is, so it closes as one and hands focus back');
  ok(editorSource.includes("hidden.value = joinSet(definition, chosen);") && editorSource.includes("hidden.dispatchEvent(new Event('input', { bubbles: true }));"), 'a toggle rewrites the hidden control the draft reads, and tells the form');
  ok(readFile('../app/modules/app.js').includes('  overlay,\n'), 'the editor is given the overlay to open it on');
  ok(readFile('../notes/attributes.md').includes('| set | Any number of the values in the Values column'), 'the document defines the set kind');
  ok(sheet.includes('.cell-group { display: contents; }'), 'a conditional group lays its cells on the grid itself');
  ok(sheet.includes('.tag {') && readFile('../app/modules/editor.js').includes("if (definition.kind === 'choice') return el('div', { className: 'cell-value' }, [el('span', { className: 'tag', text: value })]);"), "a choice reads as Carbon's tag");
  const editorSheet = sheet.slice(sheet.indexOf('/* ---------- Editor ---------- */'), sheet.indexOf('/* ---------- Rating ---------- */'));
  ok(!/font-size: (16|20|24|28|32)px/.test(editorSheet), 'nothing in the pane is a heading: every name and every value reads at the one size');
  const tabs = sheet.slice(sheet.indexOf('.tabs {'), sheet.indexOf('.tab {'));
  const search = sheet.slice(sheet.indexOf('.search {'), sheet.indexOf('.search[hidden]'));
  ok(tabs.includes('height: 32px;') && search.includes('height: 32px;'), "the tab bar stands at the navigator filter bar's height");
  ok(tabs.includes('background: var(--layer);') && search.includes('background: var(--layer);'), 'on the same ground');
  ok(sheet.includes('.tab[aria-selected="true"] { color: var(--text); font-weight: 600; border-bottom-color: var(--accent); }'), "the selected tab on Carbon's interactive rule, its label semibold");
  ok(sheet.includes('.pane-editor .pane-body { display: flex; flex-direction: column; overflow: hidden; }') && sheet.includes('.pane-editor .form { flex: 1 1 auto; min-height: 0; overflow: auto;'), 'the tab bar stands still while the rows scroll');

  const editor = readFile('../app/modules/editor.js');
  const flows = readFile('../app/modules/flows.js');
  ok(editor.includes("if (control.closest('.cell-group[hidden]')) continue;"), 'a control under a group hidden by its condition drops out of the draft as shown');
  ok(editor.includes("for (const control of body.querySelectorAll('.cell-group[hidden] [data-key]')) values[control.dataset.key] = '';") && editor.includes("if (onSave(editingId, savedValues()) !== false) endEdit();"), 'and a save commits it empty, so what is not shown is removed');
  ok(editor.includes("const values = { ...stored, ...projectReads(code) };") && editor.includes(".filter((group) => group.when && !own.has(group.when.key))\n        .map((group) => [group.when.key, attributes[group.when.key] ?? ''])"), "a type reads the project's value of every key its groups wait on without defining, in either mode, so what waits on the project's choice follows");
  ok(editor.includes("return { ...(editingProject ? {} : projectReads(current?.type ?? 'PROJECT')), ...fieldValues() };") && editor.includes("held.hidden = !shown(draftValues());") && !editor.includes('data-project'), "in an edit the conditions read the draft with the project's values beneath it, which no control carries and no save writes");
  ok(editor.includes("if ((await onSaveProject(savedValues())) !== false) endEdit();") && readFile('../app/modules/app.js').includes('onSaveProject: (values) => flows.saveProjectEdit(values),') && flows.includes("message: `Saving clears ${sweep.text}.`,") && flows.includes("for (const key of keys) delete node.attributes[key];"), "saving the project asks before removing what entities held under the old choice, and removes it in the same step");
  ok(editor.includes("value: group.when.value || `no ${leaderName(group.when.key)}`"), 'what stood under nothing chosen is named by the attribute it waited on');
  ok(editor.includes("if (removed.length > 0 && !(await onRemoval(removed))) return;") && editor.includes(".filter(({ held, group }) => group && held.hidden && [...held.querySelectorAll('[data-key]')].some((control) => control.value.trim() !== ''))"), 'a save that would remove what hidden groups still hold asks first');
  ok(flows.includes("title: 'Clear values that no longer apply?'") && flows.includes("message: `Saving clears ${removalText(entries)}`") && flows.includes("cancelLabel: 'Keep editing'"), 'the question names the groups by the value they stood under, Save or keep editing');
  ok(!editor.includes('removal-notice') && !sheet.includes('removal-notice'), 'and nothing shows in the form for it');
  ok(!flows.includes("title: `Delete the folder ${node.name}?`") && flows.includes("const question = deletionQuestion(store.model(), id);") && flows.includes("question.doomed.length > (node.kind === 'folder' ? 0 : 1)\n        ? el('ul', { className: 'doomed-list' }") && flows.includes("node.kind === 'folder' ? removeFolder(model, id) : removeEntity(model, id)"), 'every deletion asks first through the one question, a folder by its name and what is filed in it, an entity by what goes with it');
  ok(!editor.includes("closest('[hidden]')"), 'but a control on another tab, hidden only by the tab, is');
  ok(editor.includes('const chosen = store.tabOf(code);') && editor.includes('store.setTab(code, panels[i].name);'), 'the tab chosen is remembered per type');
  ok(editor.includes("const panels = [{ name: firstTabName(code), grid: first }];") && editor.includes("return (ENTITY_TYPES[code]?.name ?? 'Description').split(' ').at(-1);"), 'the first tab is named for the type, by the last word of its name');
  ok(editor.includes("const lead = id === null ? fieldCell(PROJECT_FIELDS[0], values, editing) : identifierCell(id);") && editor.includes("[...cellsOf(type.attributes.slice(0, ahead), values, editing), lead, ...cellsOf(type.attributes.slice(ahead), values, editing)]") && editor.includes('const NAME_AFTER = 2;') && editor.includes("definition.key === 'name' ||"), 'and opens on the identifier, read-only; the project on its designation and organisation, then its name as a row of its own');
  ok(readFile('../app/modules/attributes.js').includes('export const SHARED_HELP = {') && editor.includes("helpTip('identifier', 'identifier', SHARED_HELP.Identifier)"), 'the identifier explains itself with the help the document records once for the names types share');
  ok(editor.includes("helpTip('identifier', 'identifier', SHARED_HELP.Identifier)") && editor.includes("attributes: { type: 'button', 'aria-label': `About the ${about.toLowerCase()}`, 'aria-describedby': id }"), "on Carbon's icon tooltip: a focusable glyph describing itself by its tooltip");
  ok(editor.includes("cellElement.appendChild(groupNameNode(group.name, closing.key));") && editor.includes("groupNameNode(group.name, closing.key, `field-${closing.key}`)") && editor.includes("groupNameNode(first.name, `slot-${first.when.key}-${first.name.toLowerCase().replaceAll(' ', '-')}`, null, SHARED_HELP[first.name] ?? (first.attributes.length === 1 ? first.attributes[0].help : undefined))") && editor.includes("function groupNameNode(name, key, forId = null, help = SHARED_HELP[name])"), "a rating's cell and its slot carry the help their shared name has");
  ok(editor.includes("const help = definition.help ?? SHARED_HELP[definition.name];") && editor.includes("[text, ...(help ? [helpTip(definition.key, definition.name, help)] : [])]") && editor.includes("[nameNode(definition, editing), held]"), 'and any attribute with help in its table, or a name that shares help, carries the glyph beside its name');
  const styles = readFile('../app/style.css');
  ok(styles.includes('.help-trigger:hover .tooltip,\n.help-trigger:focus-visible .tooltip,\n.tip-trigger:hover .tooltip,\n.tip-trigger:focus-visible .tooltip { visibility: visible; opacity: 1; transition-delay: 100ms; }') && styles.includes('max-width: 288px;'), 'shown on hover or focus, the help glyph and the icon buttons by one rule, at the tooltip width Carbon sets');
  ok(editor.includes("definition.key === 'title' || definition.key === 'name' || definition.kind === 'multiline' || definition.kind === 'hyperlink' || definition.kind === 'set'"), 'the title, the project name, a multiline, a hyperlink and a set each take a row');
  ok(readFile('../notes/attributes.md').includes('The editor shows it as the first cell of the type\'s own tab'), 'as the document now allows');
  ok(editor.includes('if (panels.length > 1) body.appendChild(tabBar(code, panels));'), 'and a type with no tabbed group shows no tab bar');
  ok(editor.includes('tabKeys(bar, (i) => select(i, true));') && readFile('../app/modules/dom.js').includes('export function tabKeys(bar, pick) {'), 'arrow keys walk the tabs, from one helper');

  const shell = readFile('../app/modules/shell.js');
  ok(!shell.includes('fieldStyle'), 'the shell offers no choice of treatments');
}

// --- Every tab bar in the app is the one design ------------------------------

{
  const relationships = readFile('../app/modules/relationships.js');
  ok(relationships.includes("const toggle = headIcon(collapsed ? 'Expand the pane' : 'Collapse the pane', 'i-chevron-down'") && relationships.includes("toggle.setAttribute('aria-expanded', String(!collapsed))") && relationships.includes("head.hidden = !store.relationshipsCollapsed();"), 'the pane head ends in the chevron that collapses it to the head, saying which way it points, and a collapsed pane keeps the chevron even with nothing selected');
  ok(readFile('../app/modules/shell.js').includes("relationshipsPane.classList.toggle('collapsed', store.relationshipsCollapsed())") && !readFile('../app/modules/shell.js').includes('columnSplitter.hidden'), 'the shell collapses the pane by class, the splitter staying above the head to drag it open again');
  ok(readFile('../app/style.css').includes('.pane-relationships.collapsed .pane-body { display: none; }'), 'and the stylesheet drops the body');
  ok(relationships.includes("className: 'tabs head-tabs', attributes: { role: 'tablist', 'aria-label': 'Relationship view' }"), 'the relationship pane switches view with the same tabs');
  ok(!relationships.includes('switcher'), 'its content switcher is gone');
  ok(readFile('../app/modules/navigator.js').includes("if (excluded(row.node)) classes.push('excluded');") && readFile('../app/style.css').includes('.tree-row.excluded .row-title,\n.tree-row.excluded .designation { color: var(--disabled); }\n.tree-row.excluded > .icon,\n.tree-row.excluded .twisty { opacity: 0.25; }') && readFile('../app/style.css').includes('.tree-row.pick-dim.excluded > .icon,\n.tree-row.pick-dim.excluded .twisty { opacity: 1; }') && readFile('../app/modules/navigator.js').includes("if (excluded(row.node)) rowElement.appendChild(el('span', { className: 'visually-hidden', text: 'excluded' }));"), 'an excluded entity, not applicable or eliminated, is greyed out in the tree at the disabled quarter, glyph included, says so to a screen reader, and stays selectable');
  ok(readFile('../app/style.css').includes('.tree-row.pick-dim { opacity: 0.25; }') && readFile('../app/style.css').includes('.graph.picking .graph-edge:not(.pending) { opacity: 0.25; }') && readFile('../app/style.css').includes('.table tr.receded { opacity: 0.25; }'), 'one grey for standing back: the tree, the list and the graph fade to the disabled quarter while picking');
  ok(readFile('../app/modules/dom.js').includes('export function tooltipOn(button, text, { align = \'start\', label = text } = {}) {') && readFile('../app/modules/dom.js').includes("button.removeAttribute('title');"), "an icon-only button's label is Carbon's tooltip, on hover and focus, and never the browser's title");
  ok(!readFile('../app/index.html').includes(' title="'), 'no button on the page carries a browser title');
  ok(readFile('../app/modules/navigator.js').includes("if (action.describe) tooltipOn(button, action.describe());") && readFile('../app/modules/shell.js').includes("tooltipOn(button, action.describe ? action.describe() : action.label, { align: 'end' });"), 'a label that follows the state, undo and redo and the toolbar, updates its tooltip in place');
  ok(readFile('../app/modules/dom.js').includes("if (align === 'end' ? box.left < clip.left : box.right > clip.right) tip.classList.toggle('tooltip-end', align !== 'end');") && readFile('../app/modules/dom.js').includes("if (overflow !== 'visible') return held.getBoundingClientRect();"), 'a tooltip that would run past the box that clips it flips to hang from the other edge, as Carbon auto-aligns');
  ok(relationships.includes("return tooltipOn(button, label, { align: 'end' });") && readFile('../app/modules/editor.js').includes("return tooltipOn(button, label, { align: 'end' });") && readFile('../app/modules/views.js').includes("'Close the view', { align: 'end' })"), 'the head actions, standing at the right, hang their tooltips from the end');
  ok(relationships.includes("const filterLabel = store.messagesOpen() ? 'Filter the messages' : 'Filter the relationships';"), 'the filter says what it filters, the messages while they stand over the pane');
  ok(readFile('../app/modules/dom.js').includes("export function tooltipTag(className, content, { caption, main = '', note = '' }, key, tipKey) {") && readFile('../app/modules/editor.js').includes("{ caption: parameter.name, main: parameter.value, note: parameter.rationale }") && readFile('../app/modules/editor.js').includes("{ caption: view.name, main: view.outcome }") && readFile('../app/modules/editor.js').includes("{ caption: id, main: label === id ? '' : label, note: state === 'linked' ? '' : words[state] }"), "every tag's tooltip has one anatomy, a caption saying what the tag is, a main line saying what it holds, and a note beneath where there is one");
  ok(readFile('../app/style.css').includes('.tooltip-caption { display: block; font-size: 12px;') && readFile('../app/style.css').includes('.tooltip-main { display: block; margin-top: 2px; font-weight: 600; }') && readFile('../app/style.css').includes('.tooltip-note { display: block; margin-top: 8px; white-space: pre-wrap; }'), 'the caption at label size receding, the main line at the compact heading weight, the note after a gap keeping its breaks');
  ok(readFile('../app/modules/actions.js').includes("id: 'import',\n      icon: 'i-import',\n      label: 'Import from library',\n      group: 'create',\n      toolbar: true,"), 'importing from a library is a create action, on the toolbar and the Edit menu beside New entity and New folder, since it puts entities into the model');
  ok(readFile('../app/modules/flows.js').includes("store.setLibraryOpen(true);") && readFile('../app/modules/flows.js').includes("const outcome = store.commit((model) => importInto(model, chosen.library, chosen.picks, store.selection()));") && readFile('../app/modules/editor.js').includes("if (store.libraryOpen() && store.hasProject()) return;"), 'the picker is a mode of the editor pane, the navigator alive beside it, and an import is one committed change the history can undo, landing where the selection stands');
  ok(readFile('../app/modules/library.js').includes("if (event.key !== 'Escape' || !store.libraryOpen()) return;") && readFile('../app/modules/library.js').includes("tooltipOn(close, 'Close the library', { align: 'end' });") && !readFile('../app/modules/store.js').includes('LIBRARY_KEY'), 'closed by its X or Escape, and never kept across a reload');
  ok(readFile('../app/modules/library.js').includes("body.closest('.column')?.classList.toggle('library-open', store.libraryOpen() && store.hasProject());") && readFile('../app/style.css').includes(".column.library-open > .pane-relationships { display: none; }") && !readFile('../app/modules/library.js').includes('openSections.add(sections[0].name)'), 'while open the picker takes the whole column, the relationship pane hidden, and every section of the preview starts closed');
  ok(readFile('../app/modules/library.js').includes("if (!searchOpen) {") && readFile('../app/modules/library.js').includes("return tooltipOn(open, 'Filter the catalogue', { align: 'end' });") && !readFile('../app/modules/library.js').includes('As of ') && readFile('../app/modules/library.js').includes("return 'Filed at the root of the project';"), "the picker's filter stands behind a magnifier as the relationship pane's does, no date line, and the picks are filed, never put into");
  ok(readFile('../app/modules/library.js').includes("import { splitter } from './splitter.js';") && readFile('../app/modules/shell.js').includes("import { splitter } from './splitter.js';") && readFile('../app/modules/library.js').includes("el('div', { className: 'library-side-head', text: 'Preview' })"), 'the halves split by the one splitter the workspace has, the tabs heading the tree and Preview heading the sheet');
  ok(readFile('../app/style.css').includes('.form-button.button-primary:disabled { background: var(--button-disabled); color: var(--on-color-disabled); cursor: not-allowed; }') && readFile('../app/style.css').includes('.form-button.button-primary:hover:not(:disabled)'), "a disabled primary button is drawn in Carbon's disabled state and never answers a hover");
  ok(!readFile('../app/modules/editor.js').includes('cell-note') && !readFile('../app/modules/editor.js').includes('field-warning') && readFile('../app/modules/editor.js').includes("for (const stale of body.querySelectorAll('.cells > .notice')) stale.remove();") && readFile('../app/modules/editor.js').includes("el('div', { className: 'notice notice-warning', attributes: { role: 'status' } }, [") && readFile('../app/style.css').includes('.cells > .notice { grid-column: 1 / -1; border-bottom: none; }'), "a changed record flags the tab it puts in question with Carbon's inline notification, the session notice's anatomy, and says nothing under the record itself");
  ok(readFile('../app/modules/editor.js').includes("el('span', { text: 'Mark reviewed' })") && readFile('../app/modules/editor.js').includes("record.input.dispatchEvent(new Event('input', { bubbles: true }));") && readFile('../app/modules/flows.js').includes("store.commit((model) => updateEntity(model, id, { [definition.key]: value }))") && readFile('../app/modules/app.js').includes('onReview: (id, definition) => flows.markReviewed(id, definition),'), 'the notification offers Mark reviewed, which writes the record afresh from what is related now, into the draft in an edit and as one undoable change in view');
  ok(readFile('../app/modules/editor.js').includes("return [cancel, save];") && readFile('../app/modules/drawing-editor.js').includes("el('div', { className: 'pane-head-actions' }, [cancel, apply])"), "an edit's head and the diagram's head put the primary action at the right end, Cancel before it, as Carbon and every dialog do");
  ok(readFile('../app/modules/navigator.js').includes("(again ?? container.querySelector('.tree-row.selected'))?.focus({ preventScroll: true });") && readFile('../app/modules/navigator.js').includes("if (anchor.picked) store.pickAll(range);\n        else store.unpickAll(range);") && readFile('../app/modules/navigator.js').includes("rowElement.appendChild(el('span', { className: `checkbox${picked ? ' on' : ''}`, attributes: { 'aria-hidden': 'true' } }, [icon('i-checkmark')]));") && readFile('../app/modules/navigator.js').includes("if (event.key === ' ' && row && pickerCandidates(store.model(), picker).has(row.id)) store.togglePick(row.id);") && readFile('../app/modules/navigator.js').includes("store.pickAll([...container.querySelectorAll('.tree-row.pickable')].map((held) => held.dataset.id));") && readFile('../app/modules/store.js').includes("unpickAll(ids) {"), 'a render keeps the tree where it was scrolled and the focus where it stood, every pickable row wears the one checkbox, Shift and click applies the last click\'s act to the range, Space picks the selected row, and Ctrl or Cmd and A picks all shown');
  ok(!readFile('../app/modules/library.js').includes('pick-mode') && !readFile('../app/style.css').includes('pick-mode') && readFile('../app/modules/library.js').includes("if (sectionsFresh) {\n      openSections = new Set([sections[0].name]);"), "the picker has no mode to choose, a pick is a tree's pick, and the preview opens its first section afresh for each highlight");
  ok(readFile('../app/modules/library.js').includes("togglePick(library, picks, node.id, event.altKey);\n        focusRow(node.id);") && !readFile('../app/modules/library.js').includes("el('label'") && readFile('../app/modules/library.js').includes("text: `${ALT_KEY} and click picks one entity without what is beneath it.`") && !readFile('../app/modules/library.js').includes('carriedBy'), 'the box is handled by its own click with the modifier read off it, never through a label and the browser\'s click on a hidden input, Alt picks one entity without what is beneath it, the picker names the key as the platform does, and nothing travels that is not checked');
  ok(readFile('../app/modules/editor.js').includes("  function beginEdit(") && readFile('../app/modules/editor.js').includes("    if (store.libraryOpen()) store.setLibraryOpen(false);"), 'beginning an edit closes the picker, since the edit needs the pane the picker holds');
  ok(readFile('../app/modules/relationships.js').includes("const add = headIcon(can ? 'Add relationship' : 'Nothing to relate to', 'i-add-relationship', onAdd);") && readFile('../app/modules/relationships.js').includes("emptyState('No relationships', `Nothing in the project can relate to ${subject.id} yet.`)"), 'a disabled Add relationship says why in its tooltip, and the empty state says it in words, rather than standing mute');
  ok(readFile('../app/modules/library.js').includes("      if (shown) reset();\n      shown = false;") && readFile('../app/modules/library.js').includes("  function reset() {\n    picks = new Set();\n    expanded = new Set();\n    highlight = null;\n    filter = '';"), 'the picker opens fresh every time, nothing picked, everything collapsed, no filter and no highlight kept from the last opening');
  ok(!readFile('../app/modules/relationships.js').includes('head-all') && readFile('../app/modules/relationships.js').includes("actions.unshift(el('span', { className: 'head-count', text: picked === 0 ? 'Nothing picked' : `${picked} picked` }));") && readFile('../app/modules/library.js').includes("const all = el('button', { className: 'head-all', attributes: { type: 'button', role: 'checkbox', 'aria-checked': 'false', 'aria-label': 'Pick all shown' } }, [el('span', { className: 'checkbox' }, [icon('i-checkmark')]), count]);") && readFile('../app/style.css').includes('.head-all {'), "the library's head carries the select-all box with the count beside it, checked, mixed or empty for what is shown, picking all shown or clearing them, while relate mode shows only its count, since relating to everything is nothing anyone does");
  ok(!readFile('../app/modules/library.js').includes('presence(') && !readFile('../app/modules/library.js').includes('joinKey(') && readFile('../app/modules/library.js').includes("const result = relate(project, relationship.type, mapping.get(relationship.source), mapping.get(relationship.target));") && readFile('../app/modules/library.js').includes("return filedBeneath(library, null).filter((node) => node.kind === 'entity' && picks.has(node.id));"), 'an import is one way, nothing recognised as already there, the picks travelling with the relationships among them and never a folder');
  ok(readFile('../app/library/index.js').includes("export const LIBRARIES = LIBRARY.folders") && readFile('../app/library/index.js').includes("project: catalogueOf(LIBRARY, folder.id)") && readFile('../app/library/data.js').includes("export const LIBRARY = {") && !readFile('../app/library/index.js').includes('fetch(') && !readFile('../app/modules/library.js').includes('fetch('), 'the built-in libraries load with the software and are fetched from nowhere');
  ok(readFile('../app/index.html').includes('<symbol id="i-import" viewBox="0 0 32 32">') && readFile('../app/assets/icons/ORIGIN.md').includes('| `i-import` | `document--import` | 32 | `document--import.svg` |'), 'the Import entry has its own glyph, vendored with its origin');
  ok(relationships.includes("const views = [['graph', 'Graph'], ['list', 'List']];"), 'the graph, the default view, stands first');
  const graph = readFile('../app/modules/graph.js');
  ok(!graph.includes('foldChip') && !graph.includes('cappedNeighbourhood') && !graph.includes('unfolded'), 'no fold chip and no cap: the graph groups instead');
  ok(graph.includes("'aria-expanded': String(group.open),") && graph.includes("if (opened.has(group.key)) opened.delete(group.key);") && graph.includes("render(lastFilter);"), 'the strip under a first box is a button saying whether the group is open, toggling it and redrawing under the filter the graph had');
  ok(graph.includes("if (openedFor !== around.subject.id) {\n      opened = new Set();") && !readFile('../app/modules/store.js').includes('setGroupOpen'), 'what was opened closes on a new subject, and nothing of it is remembered in the store');
  ok(graph.includes("open: filtered || group.members.some((entry) => entry.pending === true) || opened.has(group.key),") && graph.includes("const shown = group.open ? group.members : group.members.slice(0, 1);"), 'a group shows its first member always, the rest when opened, filtered, or holding a pick');
  ok(graph.includes("canvas.querySelector(`[data-group=\"${focusKey}\"]`)?.focus();"), 'focus returns to the strip that toggled');
  ok(readFile('../app/style.css').includes('.node-more-hit { fill: transparent;') && readFile('../app/style.css').includes('.group-rule { stroke: var(--border-strong); stroke-width: 2; }') && !readFile('../app/style.css').includes('.graph-fold') && !readFile('../app/style.css').includes('.graph-group'), "the strip is a ghost line, an open block carries a rule along its outer side, and the fold's and the card's styles are gone");
  ok(graph.includes("const leftTop = MARGIN + (columnH - leftSpan) / 2;") && graph.includes("const attachAt = (span, row) => centreY + attachmentY(row.mid, span, subjectH);"), 'a side is centred by its boxes alone and its edges spread over that span, the strips hanging outside it');
  ok(graph.includes("if (row.group.open) canvas.appendChild(blockRule(MARGIN - RULE_GAP, leftTop + row.top, y + STRIP_HEIGHT));") && graph.includes("rows.push({ kind: 'strip', group, y: height, height: STRIP_HEIGHT, top });"), 'the strip closes an open block from its end, the rule running from its first box');
  const sheet = readFile('../app/style.css');
  ok(!sheet.includes('.switcher'), 'and so is its sheet');
  ok(sheet.includes('.pane-head > .tabs { flex: 1; align-self: stretch;'), "in a head the tabs stand in the name's place");
  ok(readFile('../notes/attributes.md').includes('#### Applicability `tab`'), 'the document tags a group as a tab');

  ok(sheet.includes('.pane-relationships .pane-body { display: flex; flex-direction: column; }') && sheet.includes('.graph-host { flex: 1 1 auto; min-height: 0; padding: 16px; overflow: auto; }'), "the graph's host fills its pane, so its scrollbar sits at the pane's edge");
}

// --- A safety function's required level, chosen in its standard's terms -------

{
  const doc = readFile('../notes/attributes.md');
  ok(doc.includes('##### Required integrity level `when standard = EN ISO 13849-1:2023`') && doc.includes('| plr | Required integrity level | choice | PL a; PL b; PL c; PL d; PL e |'), "under ISO 13849-1 the level is chosen among the standard's own");
  ok(doc.includes('##### Required integrity level `when standard = EN IEC 62061:2021`') && doc.includes('| sil | Required integrity level | choice | SIL 1; SIL 2; SIL 3 |'), 'under IEC 62061 likewise, the two one slot');
  ok(doc.includes('| standard | Functional safety standard | choice | EN ISO 13849-1:2023; EN IEC 62061:2021 |') && !doc.includes('| safetyStandard |') && !doc.includes('Other standard'), "the standard is the function's own choice, not the project's, and the list holds standards alone");
  ok(doc.includes('##### Required integrity level `when standard =`') && doc.includes('| ownLevel | Required integrity level | text | |') && !doc.includes('| ownStandard |') && doc.includes('A variant may instead wait on nothing chosen, `when key =` with no value after it'), 'with no standard chosen the level is text, by a variant waiting on nothing, and the standard itself is not entered freely');
  ok(doc.includes('| designTargets | Specific design targets | multiline | |') && !doc.includes('| failureRate |') && !doc.includes('| demandRate |') && !doc.includes('| missionTime |') && !doc.includes('Target architecture'), "what a standard asks of the design is one text in its own terms, not fields in one standard's");
  ok(!doc.includes('PL risk graph') && !doc.includes('SIL matrix') && !doc.includes('| rated |') && !doc.includes('ISO 13849-1:2023, Safety of machinery'), 'no transcription of a standard reads the level: the tool ships no table nobody has verified');
  ok(doc.includes('| [2] | SEBoK, Guide to the Systems Engineering Body of Knowledge, System Requirements') && doc.includes("SEBoK's requirements article [2]"), "the requirement categories cite their source, with none of its text");
  const editor = readFile('../app/modules/editor.js');
  ok(!editor.includes('ownInto') && !readFile('../app/style.css').includes('.cell-own'), 'no free entry stands beneath a choice');
  ok(!doc.includes('### 1.9 Dependent choices') && !doc.includes('by standard'), 'the dependent choice, which this replaces, is gone from the document');
  ok(!editor.includes('followChoices') && !editor.includes('choiceValues') && !editor.includes('dependsOn'), 'and from the editor');
  ok(editor.includes("const key = sub.after ?? sub.when?.key ?? null;") && editor.includes("placeAfter(definition.key);") && editor.includes("placeAfter(null);"), "a group's sub-groups stand right after the last attribute one of them waits on");
  ok(editor.includes("if (named && group.attributes.length > 1) target.appendChild(el('div', { className: 'cell-legend', text: group.name }));"), 'a sub-group of one attribute shows no legend');
  ok(editor.includes("...(view.tone === 'none' ? [] : [statusIcon(view.tone)]),"), 'a level in no tone wears no glyph');
  const rating = readFile('../app/modules/rating.js');
  ok(!rating.includes('PL_') && !rating.includes('SIL_') && !rating.includes("'rated'"), "the dialog draws the scenario's methods alone");
}

// --- A rating shows only under its method, and what it comes to is never stored ---

{
  const editor = readFile('../app/modules/editor.js');
  const rating = readFile('../app/modules/rating.js');
  ok(editor.includes("for (const { held, shown } of conditionals) held.hidden = !shown(draftValues());"), 'a change to what a group waits on shows or hides it in place, each read against the draft as the ones before it left it');
  ok(editor.includes("if (variants.at(-1) === sub && !variants.some((held) => held.when.value === '')) target.appendChild(slotHolder(code, variants, values, editing));") && editor.includes("const text = `No ${(leader?.name ?? first.when.key).toLowerCase()} chosen`;"), 'a slot holds its cell while nothing is chosen, saying so, unless a variant waits on nothing chosen and stands in for it');
  ok(readFile('../app/style.css').includes('.field-input.placeholder { color: var(--disabled); border-bottom-color: transparent; cursor: not-allowed; }'), "in an edit as Carbon's disabled field");
  ok(editor.includes("target.appendChild(ratingCell(group, values, editing));"), 'a group closing on a computed attribute is a rating, a cell among the cells');
  ok(editor.includes("tags.push(tag('tag outcome', [...(view.tone === 'none' ? [] : [statusIcon(view.tone)]), el('span', { text: view.outcome })], { caption: view.name, main: view.outcome }, 'outcome'));") && editor.includes("tags.push(tag(parameter.rationale ? 'tag reasoned' : 'tag', [el('span', { text: parameter.code })], { caption: parameter.name, main: parameter.value, note: parameter.rationale }, i));"), 'the cell: the outcome as a tag, then the code of each parameter set, each tag saying what it stands for on hovering it and the rationale given for it');
  ok(editor.includes("if (definition.kind === 'drawing') return drawingCell(value, true, definition);") && editor.includes("if (definition.kind === 'drawing') return drawingCell(value, false, definition);") && editor.includes("el('img', { className: 'drawing-image', attributes: { src: dataUrl(text), alt: `Diagram of ${subject()}` } })"), 'a drawing is shown as an image from a data URL in both modes, and nothing else');
  ok(!editor.includes('download(') && !editor.includes("type: 'file'") && editor.includes("ghost(text === '' ? 'Create in draw.io' : 'Edit in draw.io', text === '' ? 'i-new-entity' : 'i-edit', async () => {") && editor.includes("if (text !== '') actions.push(ghost('Delete', 'i-delete', () => hold(''), true));") && editor.includes("body.appendChild(el('p', { className: 'cell-none', text: `No ${definition.name.toLowerCase()}.` }));") && editor.includes("if (rows.length === 0) return el('p', { className: 'cell-none', text: `No ${definition.name.toLowerCase()}.` });") && !editor.includes("className: 'cell-value empty', text: '–' }));\n      }\n      if (editing && dialogs)") && editor.includes("body.appendChild(el('div', { className: 'drawing-refused', text: `The diagram cannot be shown because it ${verdict.reason}.` }));"), 'a drawing is created, edited and deleted with Carbon\'s ghost buttons in an edit, a drawing or a table with nothing in it says so in words rather than showing a field, a drawing enters only from the editor, never from a file, and one that fails the check says why and stays');
  ok(editor.includes("body: el('div', { className: 'drawing-large' }, [el('img', { attributes: { src: dataUrl(text), alt: `Diagram of ${subject()}` } })]),\n        actions: [],") && readFile('../app/modules/dialog.js').includes("...(buttons.length > 0 ? [el('div', { className: 'dialog-actions' }, buttons)] : []),"), 'at full size it is a passive dialog, no footer, closed by its X, Escape or a click outside');
  {
    const modules = readFile('../app/index.html').match(/src="modules\/app\.js"/) ? ['about', 'actions', 'app', 'attributes', 'dialog', 'dom', 'drawing', 'drawing-editor', 'editor', 'example', 'files', 'flows', 'graph', 'history', 'icons', 'menu', 'metamodel', 'model', 'multiselect', 'navigator', 'overlay', 'project', 'queries', 'rating', 'relate', 'relationships', 'retention', 'risk', 'shell', 'store', 'validator', 'version', 'view-risk', 'views'] : [];
    const sources = modules.map((name) => [name, readFile(`../app/modules/${name}.js`)]);
    ok(sources.every(([, source]) => !/innerHTML|insertAdjacentHTML|outerHTML|srcdoc/.test(source)), 'no module builds markup from text: every element is created and every string set as text');
    ok(sources.every(([name, source]) => name === 'drawing' || !source.includes('DOMParser')) && !readFile('../app/modules/drawing.js').includes('DOMParser'), 'no module parses markup with the browser, the drawing check reading XML itself and inserting nothing');
    ok(!readFile('../app/index.html').includes('<iframe') && sources.every(([name, source]) => name === 'drawing' || name === 'drawing-editor' || !source.includes('iframe')), 'no frame stands in the page, and only the editor module creates one; the check module names one only to refuse it');
    const editorModule = readFile('../app/modules/drawing-editor.js');
    ok(editorModule.split("el('iframe'").length === 2 && editorModule.indexOf("el('iframe'") > editorModule.indexOf("if (!store.consented() && !(await consent(dialogs, store))) return null;"), 'the one frame is created in one place, after the consent has been given');
    ok(editorModule.includes("sandbox: FRAME_SANDBOX,") && editorModule.includes("allow: FRAME_ALLOW,") && editorModule.includes("referrerpolicy: 'no-referrer',") && editorModule.includes("export const FRAME_SANDBOX = 'allow-scripts allow-same-origin';"), 'sandboxed to scripts and its own origin, allowed nothing of the device, sending no referrer');
    ok(editorModule.includes("frame.contentWindow?.postMessage(JSON.stringify(message), EDITOR_ORIGIN)") && !editorModule.includes("postMessage(JSON.stringify(message), '*')"), 'what is posted goes to the editor\'s origin alone, never to any');
    ok(editorModule.includes("window.addEventListener('message', handler);") && editorModule.includes("window.removeEventListener('message', handler);") && editorModule.includes("const message = acceptMessage(event, frame.contentWindow);"), 'the listener lives only while the editor is open, and hears only what the filter admits');
    ok(editorModule.includes("post({ action: 'load', xml: embeddedModel(drawing) ?? '', autosave: 1 });") && !editorModule.includes('store.model()') && !editorModule.includes('store.project()'), "the one drawing's model is what is handed over, nothing of the project");
    ok(editorModule.includes("export function createDrawingSurface({ workspace, pane, head, body, store }) {") && editorModule.includes("workspace.classList.add('drawing');") && editorModule.includes("store.setDrawingOpen(true);") && !editorModule.includes("title: `Diagram of ${subject}`,\n    body: host,") && readFile('../app/style.css').includes('.workspace.drawing > :not(.pane-drawing) { display: none; }') && readFile('../app/style.css').includes('.pane-drawing[hidden] { display: none; }') && readFile('../app/modules/actions.js').includes("enabled: () => !store.drawingOpen() && action.enabled()") && readFile('../app/modules/app.js').includes("if (!(event.metaKey || event.ctrlKey) || store.drawingOpen()) return;"), 'the editor stands over the whole workspace on a pane of its own, never in a dialog, the panes hidden beneath it and every action and shortcut held still until Apply or Cancel');
    ok(editorModule.includes("const verdict = checkDrawing(text);") && editorModule.includes("if (message.event === 'autosave') {\n        changed = true;") && !editorModule.includes('message.xml'), "what returns is checked as an import is, and the editor's autosave text is never read");
  }
  {
    const page = readFile('../app/index.html');
    ok(page.includes(`<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; frame-src https://embed.diagrams.net; object-src 'none'; base-uri 'none'; form-action 'none'">`), "the page carries its content security policy: its own scripts and styles, images from itself or data, no connection, one frame origin and that the editor's, no object, no base, no form");
    ok(page.indexOf('Content-Security-Policy') < page.indexOf('<script') && page.indexOf('Content-Security-Policy') < page.indexOf('<link'), 'stated before anything loads');
    ok(!/<script(?![^>]*\ssrc=)/.test(page) && !/\sstyle="/.test(page) && page.includes('<script src="theme.js"></script>') && page.includes('class="sprite"'), 'no inline script or style remains on the page: the theme is a file and the sprite a class');
  }
  ok(!readFile('../app/modules/history.js').includes('structuredClone') && readFile('../app/modules/history.js').includes("const cloneNode = (node) => ({ ...node, ...(node.attributes ? { attributes: { ...node.attributes } } : {}) });"), "a history snapshot copies the model's objects and reuses its strings, so drawings are held once");
  ok(editor.includes("if (definition.kind === 'table') return tableControl(definition, value);") && editor.includes("const hidden = el('input', { attributes: { type: 'hidden', 'data-key': definition.key } });\n    const wrap = el('div', { className: 'cell-table' });") && editor.includes("hidden.value = joinTable(definition, rows);") && editor.includes("type: definition.kind === 'hyperlink' ? 'url' : definition.kind === 'date' ? 'date' : 'text',"), "a table is edited as rows of fields kept in one hidden control carrying the key, as a set is, and a date is the browser's own date field");
  ok(editor.includes("attributes: { type: 'button', 'aria-label': `Remove row ${r + 1}` } }, [icon('i-delete')]") && editor.includes("[icon('i-new-entity'), el('span', { text: 'Add row' })]") && editor.includes("paint(rows.length - 1);") && editor.includes(".filter((row) => row.some((cell) => cell !== ''))"), 'a row is removed at its end and added beneath, the new row focused, and a row left empty is dropped');
  ok(readFile('../app/modules/dom.js').includes("if (tipKey === null) return el('span', { className, attributes: { title: note ? `${said}\\n${note}` : said } }, content);") && readFile('../app/modules/dom.js').includes("const held = el('button', { className: `${className} tag-trigger`, attributes: { type: 'button', 'aria-describedby': id } }, [...content, tip]);") && editor.includes("const tags = ratingTags(ratingView(group.attributes, values), closing.key);") && editor.includes("const tags = ratingTags(ratingView(group.attributes, draft));"), "outside an edit every tag is a button whose tooltip is the help glyph's kind, a tag with a rationale underlined and carrying the reasoning; within an edit a span with the browser's own");
  ok(readFile('../app/style.css').includes('.tag-trigger:focus-visible .tooltip { visibility: visible; opacity: 1; transition-delay: 100ms; }') && readFile('../app/style.css').includes('.tag.reasoned { text-decoration: underline dotted; text-underline-offset: 3px; }'), "shown on hovering or focusing it, as the help glyph's is");
  ok(rating.includes("state[definition.key] = state[definition.key] === value ? '' : value;") && rating.includes("const control = definition.kind === 'number' ? scoreControl(definition, classes[i], state, changed) : optionGroup(definition, state, changed);") && !rating.includes('Clear'), "every parameter is its own control, a row of classes pressed and pressed again to clear or a score field, and nothing clears the whole");
  ok(rating.includes("const figure = FIGURES[method]?.(parameters, state) ?? null;") && rating.includes("[MATRIX_METHOD]: matrixFigure,") && rating.includes("[GRAPH_METHOD]: graphFigureFor(RISK_GRAPH_SPEC),"), 'the matrix and the graph are figures beneath the parameters');
  ok(!rating.includes('data-pick') && !rating.includes('tabindex') && rating.includes("cell.classList.toggle('reached', state[severity.key] === column && state[probability.key] === row)") && rating.includes("head.classList.toggle('chosen', state[probability.key] === row)"), 'nothing on a figure is a control: the matrix marks the classes chosen and the cell they meet at');
  ok(rating.includes("layout.set(node, { depth, row: Number.isInteger(middle) ? held[middle] : (held[Math.floor(middle)] + held[Math.ceil(middle)]) / 2 });") && rating.includes("const to = depth === drawn ? cellX(0) - 4 : x(depth + 1) - GAP + 0.5;") && rating.includes("const width = cellX(first + leaf.codes.length - 1) + CELL.width - left;") && rating.includes("leafTone: (leaf) => levelTone(graphBand(leaf.index)),"), 'a parent runs straight into its middle child, and each branch ends in a cell per class of the last parameter, one across the classes a merged leaf takes');
  ok(rating.includes("const rationales = definitions.filter(isRationale);") && rating.includes("const rationale = rationales.find((held) => held.parameter === definition.key) ?? null;") && rating.includes("el('textarea', { className: 'field-input', attributes: { rows: '2', id: `rate-${rationale.key}` } })") && rating.includes("const body = el('div', { className: 'rating' }, [grid.element, ...(figure ? [figure.element] : []), result]);"), 'each parameter carries a text area for its rationale beneath it, the figure follows the parameters, and the outcome closes the dialog');
  ok(rating.includes("for (const area of pair) area.style.height = `${tallest}px`;"), 'the two of a row kept the same height');
  ok(rating.includes("if (event.data && /\\D/.test(event.data)) event.preventDefault();") && rating.includes("attributes: { type: 'number', min: String(definition.min), max: String(definition.max), step: '1', inputmode: 'numeric', autocomplete: 'off', id: `rate-${definition.key}` }"), 'a score takes digits alone');
  ok(rating.includes("outcome.appendChild(el('span', { text: held ?? 'Not rated' }));") && rating.includes("el('div', { className: 'field-label', text: closing?.name ?? 'Rating' })"), 'what the rating comes to stands last under the name of the attribute it computes, or that it is not rated yet');
  ok(editor.includes("if (parameter.value === '') return;"), 'a parameter unset shows no tag');
  ok(editor.includes("{ className: 'field-input rating', attributes: { type: 'button', id: `field-${closing.key}`, 'aria-haspopup': 'dialog' } },\n      [held, icon('i-edit')]"), 'in an edit the cell is a field opening the dialog, the edit pencil trailing');
  const styles = readFile('../app/style.css');
  ok(styles.includes('.field-input.rating {') && styles.includes('.tag .status-icon { width: 12px; height: 12px;'), "the field wraps its tags, and a tag's glyph is at the tag's scale");
  const page = readFile('../app/index.html');
  const origin = readFile('../app/assets/icons/ORIGIN.md');
  for (const glyph of ['i-error-filled', 'i-warning-filled', 'i-checkmark-filled']) {
    ok(page.includes(`id="${glyph}"`), `${glyph} is in the sprite`);
    ok(origin.includes(`\`${glyph}\``), `${glyph} has its provenance recorded`);
  }
  ok(page.includes('data-icon-path="inner-path" fill="#161616"'), "the warning glyph's mark stands on the yellow");
  ok(readFile('../app/modules/rating.js').includes("export function statusIcon(tone) {"), 'the status indicator is one function, shared by the card and the dialog');
  ok(!page.includes('id="i-rate"') && !origin.includes('i-rate'), 'the rating field has no glyph of its own: it trails the edit pencil');
  ok(readFile('../app/index.html').includes('<button type="button" class="shell-action shell-action-wide" id="shell-unsaved" hidden>\n      <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-save"/></svg>\n      <span>Unsaved changes</span>') && readFile('../app/modules/shell.js').includes('unsavedButton.hidden = !store.dirty();'), 'the top bar signals unsaved changes while the file is behind the project, the button saying the state and its tooltip the act');
  ok(editor.includes("attributes: { type: 'hidden', 'data-key': definition.key }"), 'its parameters ride in hidden controls, read into the draft as any field');
  ok(editor.includes('const chosen = await rateDialog(dialogs, {') && editor.includes("(hidden[0] ?? body).dispatchEvent(new Event('input', { bubbles: true }));"), 'Rate opens the dialog, and what it returns is written to the draft and shown, the event rising from the rating\'s own control so a record waiting on it hears which group changed');
  ok(readFile('../app/modules/app.js').includes('  dialogs,\n'), 'the editor is given the dialogs to open');
  ok(rating.includes("if (!ESTIMATED.includes(method)) return null;") && !rating.includes('Hybrid'), "the dialog opens for the scenario's methods alone");
  ok(rating.includes("{ label: 'Apply', value: 'confirmed', kind: 'primary' }"), 'applied by its primary action, cancelled by anything else');
  const doc = readFile('../notes/attributes.md');
  ok(doc.includes('#### Initial risk estimation `when estimationMethod = Risk matrix (ISO/TR 14121-2:2012, 6.2.2)`'), "the document tags a rating with the project's method it waits on");
  ok(doc.includes('| initialLevel | Risk level | computed | Risk matrix (ISO/TR 14121-2:2012, 6.2.2) |'), 'and names the method a computed value is read by');
  ok(doc.includes('| initialSeverityRationale | Severity rationale | rationale | initialSeverity |'), 'and the parameter a rationale is given for');
  ok(doc.includes('## 6. Risk estimation') && doc.indexOf('## 6. Risk estimation') < doc.indexOf('## 7. References'), 'the methods stand in their own chapter, before the references');
  const sheet = readFile('../app/style.css');
  ok(sheet.includes('.cell-group[hidden] { display: none; }') && sheet.includes('select.field-input.wide { max-width: none; }'), 'the sheet hides a waiting group and widens a long choice');
  ok(sheet.includes('.dialog:has(.rating) { max-width: 800px; }'), 'and widens the dialog for a rating');
  ok(sheet.includes('.tone-high .risk-dot { background: var(--danger); }') && sheet.includes('--support-success:'), "the levels take Carbon's status colours");
}

// --- The pre-paint theme script speaks the store's literals --------------

{
  const page = readFile('../app/theme.js');
  const source = readFile('../app/modules/store.js');
  const key = source.match(/const THEME_KEY = '([^']+)'/)?.[1];
  ok(typeof key === 'string', 'the store names its theme key');
  ok(page.includes(`localStorage.getItem('${key}')`), 'the theme script reads the store’s own key');
  const themes = source
    .match(/const THEMES = \[([^\]]+)\]/)?.[1]
    .match(/'[^']+'/g)
    .map((quoted) => quoted.slice(1, -1));
  ok(Array.isArray(themes) && themes.length === 2, 'the store holds two themes');
  ok(
    page.includes(`stored === '${themes[0]}' || stored === '${themes[1]}'`),
    'the theme script accepts exactly the store’s theme values'
  );
  ok(page.includes(`? '${themes[1]}' : '${themes[0]}'`), 'and its system fallback lands on the same pair');
}

// --- The closing check: the exact minimum viewport ----------------------

{
  const sheet = readFile('../app/style.css');
  const page = readFile('../app/index.html');
  ok(
    sheet.includes('@media (max-width: 999.98px), (max-height: 355.98px)'),
    'the notice covers both floors: 1000 wide, and the 356 the column needs — 48 shell, 160 editor, 4 splitter, 120 relationships, 24 status bar'
  );
  ok(page.includes('at least 1000 pixels wide and 356 pixels tall'), 'and states both numbers');
  ok(page.includes('<footer class="status-bar" id="status-bar" hidden>') && sheet.includes('.status-bar {') && sheet.includes('height: 24px;\n  padding: 0 16px;'), 'the status bar stands under the workspace, one 24px line, hidden without a project');
  const shellSource = readFile('../app/modules/shell.js');
  ok(shellSource.includes("statusBar.hidden = !store.hasProject();") && shellSource.includes("statusSize.textContent = sizeText(model);") && shellSource.includes("statusMessages.hidden = found.length === 0;"), 'the bar says the model\'s size, and the messages only while there are any');
  ok(shellSource.includes("statusMessages.addEventListener('click', () => onMessages());") && readFile('../app/modules/app.js').includes("onMessages: () => {\n    if (store.view()) flows.closeView();\n    store.setMessagesOpen(true);\n  },"), 'the messages button opens them over the relationship pane, closing a full view first, never a drawer, a tab or a fourth pane');
  const relationshipsSource = readFile('../app/modules/relationships.js');
  ok(relationshipsSource.includes("if (store.hasProject() && store.messagesOpen()) {\n      const found = findings(store.model());\n      renderMessagesHead(found.length);") && relationshipsSource.includes("messagesHost.appendChild(emptyState('Nothing to revisit', 'Every record still matches its relationships.'));"), 'the messages stand over the pane whatever is selected, with a head of their own, and say so when there are none');
  ok(relationshipsSource.includes("headIcon('Close the messages', 'i-close', () => store.setMessagesOpen(false))") && relationshipsSource.includes("if (event.key !== 'Escape' || !store.messagesOpen()) return;"), 'the X or Escape hands the pane back to its view');
  ok(relationshipsSource.includes("if (tab) store.setTab(finding.type, tab);\n      onSelect(finding.id);") && !relationshipsSource.includes("setMessagesOpen(false);\n      onSelect"), 'a row opens its entity on the tab the record stands on and the messages stay');
  ok(readFile('../app/modules/store.js').includes("relationshipView = 'graph';\n      messagesOpen = false;") && !readFile('../app/modules/store.js').includes("MESSAGES_KEY"), 'the messages close with the project and are never kept across a reload');
  ok(relationshipsSource.includes("return tooltipTag(`tag ${state}`, [glyph, el('span', { text: id })], { caption: id, main: label === id ? '' : label, note: words[state] }, i, `message-${finding.id}`);") && readFile('../app/modules/dom.js').includes('export function tooltipTag(') && sheet.includes('.table td.tags { overflow: visible; }'), "the messages' tags carry the tooltip the entity's own carry, Carbon's and not the browser's");
  ok(readFile('../app/modules/editor.js').includes("(definition.kind === 'entities' && alone)") && readFile('../app/modules/editor.js').includes("fieldCell(definition, values, editing, group.attributes.length === 1)"), 'a record takes a row where it stands alone in its group and shares one beside another attribute');
  ok(sheet.includes('.pane-editor { flex: 1 1 0; min-height: 160px; }'), 'the editor floor matches the 160px the splitter reserves, and its zero basis lets it yield down to that floor');
  ok(sheet.includes('.pane-relationships { flex: 0 1 var(--relationships-height, 280px); min-height: 120px; }'), 'the relationship pane shrinks to its floor before anything overflows');
}

// --- The closing check: the navigator holds its toolbar -----------------

{
  const sheet = readFile('../app/style.css');
  const shell = readFile('../app/modules/shell.js');
  ok(sheet.includes('min-width: 300px') && sheet.includes('.pane-toolbar > .ghost-icon { flex: none; }'), 'the pane floor is the toolbar at its natural width, and its buttons never shrink below their 32px');
  ok(shell.includes('minimum: 300'), 'and the splitter stops at the same width');
  ok(shell.includes('const COLUMN_FLOOR = 508;') && sheet.includes('min-width: 508px;') && shell.includes('limit: () => workspace.getBoundingClientRect().width - SPLITTER - COLUMN_FLOOR'), 'the navigator grows until the column reaches its own floor, the relationship head at its widest');
  ok(shell.includes('const EDITOR_FLOOR = 160;') && shell.includes('limit: () => column.getBoundingClientRect().height - SPLITTER - EDITOR_FLOOR'), 'and the relationship pane grows until the editor reaches its floor');
  ok(readFile('../app/modules/splitter.js').includes('const past = asked < minimum / 2;') && readFile('../app/modules/splitter.js').includes('if (past !== snapped) {\n        snapped = past;\n        if (past) apply(clamp(before));\n        collapse(past);\n      }') && shell.includes('collapse: (state) => store.setRelationshipsCollapsed(state),') && shell.split('collapse: (state) =>').length === 2, 'a drag past half the minimum snaps the relationship pane closed, keeping the size it had for the reopening, and back past it snaps it open; the navigator has no such point');
}

// --- The closing check: pointer targets and the menu bar keys ------------

{
  const sheet = readFile('../app/style.css');
  ok(
    sheet.includes('.splitter-vertical::after { inset: 0 -10px;') && sheet.includes('.splitter-horizontal::after { inset: -10px 0;'),
    'the splitters take a 24px pointer target around the 4px bar'
  );
  const shell = readFile('../app/modules/shell.js');
  const menu = readFile('../app/modules/menu.js');
  ok(shell.includes('onArrow: (step) => neighbourMenu(button, step).openIt()'), 'the arrow keys walk the open menus along the bar');
  ok(menu.includes("event.key === 'ArrowLeft' || event.key === 'ArrowRight'"), 'which the menu forwards');
  ok(readFile('../app/modules/splitter.js').includes("addEventListener('dblclick', () => {\n    if (collapsed()) collapse(false);\n    apply(clamp(preset));\n  })"), 'a double click returns a pane to its preset, opening it first where it stands collapsed: resizing needs no drag');
}

// --- The closing check: text carries AA contrast in both themes ---------

{
  const sheet = readFile('../app/style.css');
  const g100At = sheet.indexOf(':root[data-theme="g100"]');
  const themes = { white: sheet.slice(0, g100At), g100: sheet.slice(g100At).split('}')[0] };

  /** @param {string} block @param {string} name */
  const token = (block, name) => {
    const match = block.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
    if (!match) throw new Error(`token --${name} not found`);
    return match[1];
  };
  /** @param {string} hex */
  const luminance = (hex) => {
    const channel = (index) => {
      const value = Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  };
  /** @param {string} one @param {string} other */
  const contrast = (one, other) => {
    const [high, low] = [luminance(one), luminance(other)].sort((a, b) => b - a);
    return (high + 0.05) / (low + 0.05);
  };

  for (const [theme, block] of Object.entries(themes)) {
    const background = token(block, 'background');
    const layer = token(block, 'layer');
    for (const name of ['text', 'text-second', 'text-helper', 'link', 'danger-text', 'accent']) {
      ok(contrast(token(block, name), background) >= 4.5, `${theme}: --${name} carries AA on the background`);
    }
    for (const name of ['text', 'text-second', 'text-helper']) {
      ok(contrast(token(block, name), layer) >= 4.5, `${theme}: --${name} carries AA on the layer`);
    }
    for (const name of ['pillar-system', 'pillar-legislative', 'pillar-risk', 'pillar-requirements']) {
      ok(contrast(token(block, name), background) >= 3, `${theme}: --${name} carries 3:1 for the type icons`);
    }
    ok(contrast(token(block, 'focus'), background) >= 3, `${theme}: the focus ring carries 3:1`);
  }

  ok(!sheet.includes('var(--text-place)'), 'the placeholder tier styles no text: what reads must meet AA');
  ok(
    sheet.includes('.dialog a { color: var(--link); text-decoration: underline; }'),
    'a link inside prose is underlined: colour alone cannot mark it'
  );
}

// --- A view over the workspace ---------------------------------------------

{
  const views = readFile('../app/modules/views.js');
  const app = readFile('../app/modules/app.js');
  const page = readFile('../app/index.html');
  const sheet = readFile('../app/style.css');
  const shell = readFile('../app/modules/shell.js');
  const editor = readFile('../app/modules/editor.js');
  ok(page.includes('<section class="pane pane-view" id="pane-view" aria-label="View" hidden>') && app.includes("pane: document.getElementById('pane-view'),"), 'the view pane stands in the workspace beside the panes');
  ok(views.includes("workspace.classList.toggle('viewing', viewing);") && sheet.includes('.workspace.viewing > :not(.pane-view) { display: none; }'), 'and takes the whole workspace while a view is open');
  ok(shell.includes("menubarMenu(viewButton, 'View', () =>\n    actions.filter((offered) => offered.group === 'views').map((action) => ({ ...actionItem(action, viewButton), checked: action.checked() }))\n  );") && !shell.includes('Relationships as list') && !shell.includes('THEME_MENU'), 'the View menu lists the views and nothing else, the open one checked; the theme and the relationship presentation switch where they show');
  ok(views.includes("tab.addEventListener('click', () => store.openView(view.id));") && views.includes("className: 'ctab'"), "the pane's head switches views on Carbon's contained tabs");
  ok(views.includes("if (event.key !== 'Escape' || store.view() === null || overlay.isOpen()) return;") && readFile('../app/modules/overlay.js').includes('isOpen: () => stack.top() !== null,') && views.includes("close.addEventListener('click', onClose);"), 'Escape, when nothing is open over the page, and the close leave the view');
  ok(views.includes("event.preventDefault();\n      onSelect(id);") && app.includes('onSelect: (id) => flows.openFromView(id),'), 'an entity in a cell is a way to the editor');
  ok(editor.includes("if (back !== null && back.rowId === node.id) actions.unshift(headButton(`Back to ${back.name}`, onReturn));") && app.includes('onReturn: () => flows.returnToView(),'), 'which offers the way back to the row it came from');
  ok(views.includes("const id = row.id ?? null;") && views.includes("if (back !== null && back.rowId === id) tr.classList.add('row-return');") && views.includes("row.scrollIntoView({ block: 'center' });"), 'a row names the entity it is about, marked and scrolled to on return');
  ok(views.includes("print.addEventListener('click', () => window.print());") && sheet.includes('.shell-bar, .notices, .toasts, #overlay-root, .pane-navigator, .splitter, .column, .view-head, .pane-view .tabs { display: none !important; }') && sheet.includes('@page { size: A4 landscape; margin: 12mm; }'), 'printing prints the view alone, landscape');
  ok(views.includes("held.setAttribute('aria-sort', sort.direction === 'asc' ? 'ascending' : 'descending');") && views.includes("const next = sort?.column !== i ? 'asc' : sort.direction === 'asc' ? 'desc' : null;"), 'a column head sorts up, down, then not at all');
}

// --- A method carries its source --------------------------------------------

{
  const risk = readFile('../app/modules/risk.js');
  const editor = readFile('../app/modules/editor.js');
  ok(!risk.includes('SOURCES') && !editor.includes('sourceHelper') && !readFile('../app/style.css').includes('.field-helper'), 'no source is looked up or shown as helper text: the method names it');
  ok(editor.includes("title: `${group.name} by ${closing.method}`,"), "the rating dialog's title carries the method, its source within it");
  ok(risk.includes("if (last && sketch(last) === sketch(branch)) {") && !risk.includes("'F1, F2'"), 'the graph is grown from its table and merged where branches agree, never drawn by hand');
  ok(risk.includes("if (word === 'negligible') return 'negligible';") && editor.includes("{ caption: view.name, main: view.outcome }, 'outcome'));"), 'negligible is a tone of its own, and the outcome tag names the attribute it computes');
  ok(readFile('../app/modules/view-risk.js').includes("one per parameter of the ${method} and the rating it comes to"), "and so does the risk assessment's lead");
}

summary('test-pins');
