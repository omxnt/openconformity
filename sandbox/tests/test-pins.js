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
import { createActions } from '../app/actions.js';
import { createStore } from '../app/store.js';
import { TYPE_ICONS, FOLDER_ICON, PROJECT_ICON } from '../app/icons.js';
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
    const source = readFile(`../app/${module}`);
    ok(
      !source.includes('showOpenFilePicker') && !source.includes('showSaveFilePicker'),
      `${module} uses no File System Access API`
    );
  }
}

// --- The ways into a project live in the editor's empty state ------------

{
  const editor = readFile('../app/editor.js');
  for (const id of ['new-project', 'open', 'load-example']) {
    ok(editor.includes(`id: '${id}'`), `the editor's landing offers ${id}`);
  }
  const navigator = readFile('../app/navigator.js');
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
  const shell = readFile('../app/shell.js');
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

  ok(shell.includes("const fileGroups = ['project', 'example']"), 'the File menu parts the example behind a separator');

  const editor = readFile('../app/editor.js');
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

  const navigator = readFile('../app/navigator.js');
  ok(
    navigator.includes("const dragLocked = () => store.picker() !== null || filter().trim() !== ''"),
    'tree drag stands down while picking and while filtering'
  );

  const sheet = readFile('../app/style.css');
  ok(!sheet.includes('dashed var(--accent)'), 'the dashed candidate outlines are gone: dimming alone carries candidacy');

  const { LANDING_OFFER } = await import('../app/editor.js');
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
  const relationships = readFile('../app/relationships.js');
  ok(relationships.includes("el('colgroup', {}, ["), 'the two direction tables share one fixed column skeleton');
  ok(relationships.includes("className: 'rel-fold'"), 'each behind its compact fold');
  ok(!relationships.includes('rel-arrow'), 'the direction arrow column is gone: the split carries direction');
  ok(relationships.includes("const actions = [searchControl()];") && relationships.includes('graph.render(tableFilter)') && readFile('../app/graph.js').includes('const merged = filteredNeighbourhood('), 'the filter serves both views: the list, and the graph narrowed around its subject');
  ok(relationships.includes("className: 'field-input head-search'"), 'the list filter lives behind the head magnifier, on demand');

  const sheet = readFile('../app/style.css');
  ok(sheet.includes('table-layout: fixed;'), 'the tables lay out fixed, so the columns never drift');
  ok(sheet.includes('height: 32px;             /* Carbon data table sm */'), 'rows at Carbon short scale');

  const shell = readFile('../app/shell.js');
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
  const editorSource = readFile('../app/editor.js');
  ok(editorSource.includes("className: 'field-input multiselect', attributes: { type: 'button', id: `field-${definition.key}`, 'aria-haspopup': 'listbox'"), "a set in an edit is a field opening Carbon's multiselect");
  const multiselect = readFile('../app/multiselect.js');
  ok(multiselect.includes("attributes: { role: 'listbox', 'aria-label': label, 'aria-multiselectable': 'true' }") && multiselect.includes("role: 'option', 'aria-selected': String(chosen.has(option))"), 'a listbox of every value, each an option carrying its state');
  ok(multiselect.includes("kind: 'menu',\n    element: list,\n    opener: anchor,"), 'stacked on the overlay as a menu is, so it closes as one and hands focus back');
  ok(editorSource.includes("hidden.value = joinSet(definition, chosen);") && editorSource.includes("hidden.dispatchEvent(new Event('input', { bubbles: true }));"), 'a toggle rewrites the hidden control the draft reads, and tells the form');
  ok(readFile('../app/app.js').includes('  overlay,\n'), 'the editor is given the overlay to open it on');
  ok(readFile('../attributes.md').includes('| set | Any number of the values in the Values column'), 'the document defines the set kind');
  ok(sheet.includes('.cell-group { display: contents; }'), 'a conditional group lays its cells on the grid itself');
  ok(sheet.includes('.tag {') && readFile('../app/editor.js').includes("if (definition.kind === 'choice') return el('div', { className: 'cell-value' }, [el('span', { className: 'tag', text: value })]);"), "a choice reads as Carbon's tag");
  const editorSheet = sheet.slice(sheet.indexOf('/* ---------- Editor ---------- */'), sheet.indexOf('/* ---------- Rating ---------- */'));
  ok(!/font-size: (16|20|24|28|32)px/.test(editorSheet), 'nothing in the pane is a heading: every name and every value reads at the one size');
  const tabs = sheet.slice(sheet.indexOf('.tabs {'), sheet.indexOf('.tab {'));
  const search = sheet.slice(sheet.indexOf('.search {'), sheet.indexOf('.search[hidden]'));
  ok(tabs.includes('height: 32px;') && search.includes('height: 32px;'), "the tab bar stands at the navigator filter bar's height");
  ok(tabs.includes('background: var(--layer);') && search.includes('background: var(--layer);'), 'on the same ground');
  ok(sheet.includes('.tab[aria-selected="true"] { color: var(--text); font-weight: 600; border-bottom-color: var(--accent); }'), "the selected tab on Carbon's interactive rule, its label semibold");
  ok(sheet.includes('.pane-editor .pane-body { display: flex; flex-direction: column; overflow: hidden; }') && sheet.includes('.pane-editor .form { flex: 1 1 auto; min-height: 0; overflow: auto;'), 'the tab bar stands still while the rows scroll');

  const editor = readFile('../app/editor.js');
  const flows = readFile('../app/flows.js');
  ok(editor.includes("if (control.closest('.cell-group[hidden]')) continue;"), 'a control under a group hidden by its condition drops out of the draft as shown');
  ok(editor.includes("for (const control of body.querySelectorAll('.cell-group[hidden] [data-key]')) values[control.dataset.key] = '';") && editor.includes("if (onSave(editingId, savedValues()) !== false) endEdit();"), 'and a save commits it empty, so what is not shown is removed');
  ok(editor.includes("const rated = rating !== null && [...rating.querySelectorAll('[data-key]')].some((control) => control.value.trim() !== '');") && editor.includes("if (!rated) values[record.dataset.key] = '';"), 'a record with no rating made before it goes with the save too');
  ok(editor.includes("if (removed.length > 0 && !(await onRemoval(removed))) return;") && editor.includes(".filter(({ held, group }) => group && held.hidden && [...held.querySelectorAll('[data-key]')].some((control) => control.value.trim() !== ''))"), 'a save that would remove what hidden groups still hold asks first');
  ok(flows.includes("title: 'Remove what is no longer chosen?'") && flows.includes("message: `Saving removes ${removalText(entries)}`") && flows.includes("cancelLabel: 'Keep editing'"), 'the question names the groups by the value they stood under, Save or keep editing');
  ok(!editor.includes('removal-notice') && !sheet.includes('removal-notice'), 'and nothing shows in the form for it');
  ok(flows.includes("title: `Delete the folder ${node.name}?`") && flows.includes("const question = deletionQuestion(store.model(), id);") && flows.includes("question.doomed.length > 1\n        ? el('ul', { className: 'doomed-list' }") && !flows.includes('if (question.doomed.length > 1) {'), 'every deletion asks first, a folder by its name, an entity by what goes with it');
  ok(!editor.includes("closest('[hidden]')"), 'but a control on another tab, hidden only by the tab, is');
  ok(editor.includes('const chosen = store.tabOf(code);') && editor.includes('store.setTab(code, panels[i].name);'), 'the tab chosen is remembered per type');
  ok(editor.includes("const panels = [{ name: firstTabName(code), grid: first }];") && editor.includes("return (ENTITY_TYPES[code]?.name ?? 'Description').split(' ').at(-1);"), 'the first tab is named for the type, by the last word of its name');
  ok(editor.includes("[identifierCell(id), ...cellsOf(type.attributes, values, editing)]"), 'and opens on the identifier, read-only');
  ok(readFile('../app/attributes.js').includes('export const SHARED_HELP = {') && editor.includes("helpTip('identifier', 'identifier', SHARED_HELP.Identifier)"), 'the identifier explains itself with the help the document records once for the names types share');
  ok(editor.includes("helpTip('identifier', 'identifier', SHARED_HELP.Identifier)") && editor.includes("attributes: { type: 'button', 'aria-label': `About the ${about.toLowerCase()}`, 'aria-describedby': id }"), "on Carbon's icon tooltip: a focusable glyph describing itself by its tooltip");
  ok(editor.includes("const help = definition.help ?? SHARED_HELP[definition.name];") && editor.includes("[text, ...(help ? [helpTip(definition.key, definition.name, help)] : [])]") && editor.includes("[nameNode(definition, editing), held]"), 'and any attribute with help in its table, or a name that shares help, carries the glyph beside its name');
  const styles = readFile('../app/style.css');
  ok(styles.includes('.help-trigger:hover .tooltip,\n.help-trigger:focus-visible .tooltip { visibility: visible; opacity: 1; transition-delay: 100ms; }') && styles.includes('max-width: 288px;'), 'shown on hover or focus, at the tooltip width Carbon sets');
  ok(editor.includes("definition.key === 'title' || definition.kind === 'multiline' || definition.kind === 'hyperlink'"), 'the title, a multiline and a hyperlink each take a row');
  ok(readFile('../attributes.md').includes('The editor shows it as the first cell of the type\'s own tab'), 'as the document now allows');
  ok(editor.includes('if (panels.length > 1) body.appendChild(tabBar(code, panels));'), 'and a type with no tabbed group shows no tab bar');
  ok(editor.includes('tabKeys(bar, (i) => select(i, true));') && readFile('../app/dom.js').includes('export function tabKeys(bar, pick) {'), 'arrow keys walk the tabs, from one helper');

  const shell = readFile('../app/shell.js');
  ok(!shell.includes('fieldStyle'), 'the shell offers no choice of treatments');
}

// --- Every tab bar in the app is the one design ------------------------------

{
  const relationships = readFile('../app/relationships.js');
  ok(relationships.includes("className: 'tabs head-tabs', attributes: { role: 'tablist', 'aria-label': 'Relationship view' }"), 'the relationship pane switches view with the same tabs');
  ok(!relationships.includes('switcher'), 'its content switcher is gone');
  ok(relationships.includes("const views = [['graph', 'Graph'], ['list', 'List']];"), 'the graph, the default view, stands first');
  const sheet = readFile('../app/style.css');
  ok(!sheet.includes('.switcher'), 'and so is its sheet');
  ok(sheet.includes('.pane-head > .tabs { flex: 1; align-self: stretch;'), "in a head the tabs stand in the name's place");
  ok(readFile('../attributes.md').includes('#### Applicability `tab`'), 'the document tags a group as a tab');

  ok(sheet.includes('.pane-relationships .pane-body { display: flex; flex-direction: column; }') && sheet.includes('.graph-host { flex: 1 1 auto; min-height: 0; padding: 16px; overflow: auto; }'), "the graph's host fills its pane, so its scrollbar sits at the pane's edge");
}

// --- A safety function's required level, read from the standard's graph ------

{
  const doc = readFile('../attributes.md');
  ok(doc.includes('##### Integrity level `when standard = EN ISO 13849-1`') && doc.includes('| plr | Required performance level | computed | PL risk graph |'), "under ISO 13849-1 the level is a rating read by the standard's graph");
  ok(doc.includes('##### Integrity level `when standard = EN IEC 62061`'), 'under IEC 62061 by its matrix, the two one slot');
  ok(doc.includes('### 6.5 Performance level risk graph') && doc.includes('| [2] | ISO 13849-1:2023,'), 'the graph is transcribed in chapter 6, from its reference');
  ok(doc.includes('### 6.6 Safety integrity level matrix') && doc.includes('| [3] | IEC 62061:2021,') && doc.includes('| sil | Required safety integrity level | computed | SIL matrix |'), 'so is the matrix, and under IEC 62061 the level is a rating read by it');
  ok(!doc.includes('### 1.9 Dependent choices') && !doc.includes('by standard'), 'the dependent choice, which this replaces, is gone from the document');
  const editor = readFile('../app/editor.js');
  ok(!editor.includes('followChoices') && !editor.includes('choiceValues') && !editor.includes('dependsOn'), 'and from the editor');
  ok(editor.includes("if (subs.some((sub) => sub.when?.key === held.key)) anchor = i;") && editor.includes("if (i === anchor) place();"), "a group's sub-groups stand right after the last attribute one of them waits on");
  ok(editor.includes("if (named && group.attributes.length > 1) target.appendChild(el('div', { className: 'cell-legend', text: group.name }));"), 'a sub-group of one attribute shows no legend');
  ok(editor.includes("...(view.tone === 'none' ? [] : [statusIcon(view.tone)]),"), 'a level in no tone wears no glyph');
  const rating = readFile('../app/rating.js');
  ok(rating.includes('[PL_METHOD]: graphSurface(PL_GRAPH_SPEC),') && rating.includes("headings: ['Severity', 'Exposure', 'Avoidance', 'PLr'],"), "the dialog draws ISO 13849-1's graph with the same picker as the report's");
}

// --- A rating shows only under its method, and what it comes to is never stored ---

{
  const editor = readFile('../app/editor.js');
  ok(editor.includes("for (const { held, shown } of conditionals) held.hidden = !shown(fieldValues());"), 'a change to what a group waits on shows or hides it in place, each read against the draft as the ones before it left it');
  ok(editor.includes("if (variants.at(-1) === sub) target.appendChild(slotHolder(code, variants, values, editing));") && editor.includes("const text = `No ${(leader?.name ?? first.when.key).toLowerCase()} chosen`;"), 'a slot holds its cell while nothing is chosen, saying so');
  ok(readFile('../app/style.css').includes('.field-input.placeholder { color: var(--disabled); border-bottom-color: transparent; cursor: not-allowed; }'), "in an edit as Carbon's disabled field");
  ok(editor.includes("target.appendChild(ratingCell(group, values, editing));"), 'a group closing on a computed attribute is a rating, a cell among the cells');
  ok(editor.includes("className: 'tag outcome'") && editor.includes("text: parameter.code, attributes: { title: `${parameter.name}: ${parameter.value}` }"), 'the cell: the outcome as a tag, then the code of each parameter set, the full value on hovering it');
  ok(editor.includes("if (parameter.value === '') continue;"), 'a parameter unset shows no tag');
  ok(editor.includes("{ className: 'field-input rating', attributes: { type: 'button', id: `field-${computed.key}`, 'aria-haspopup': 'dialog' } },\n      [held, icon('i-edit')]"), 'in an edit the cell is a field opening the dialog, the edit pencil trailing');
  const styles = readFile('../app/style.css');
  ok(styles.includes('.field-input.rating {') && styles.includes('.tag .status-icon { width: 12px; height: 12px;'), "the field wraps its tags, and a tag's glyph is at the tag's scale");
  const page = readFile('../app/index.html');
  const origin = readFile('../app/assets/icons/ORIGIN.md');
  for (const glyph of ['i-error-filled', 'i-warning-filled', 'i-checkmark-filled']) {
    ok(page.includes(`id="${glyph}"`), `${glyph} is in the sprite`);
    ok(origin.includes(`\`${glyph}\``), `${glyph} has its provenance recorded`);
  }
  ok(page.includes('data-icon-path="inner-path" fill="#161616"'), "the warning glyph's mark stands on the yellow");
  ok(readFile('../app/rating.js').includes("export function statusIcon(tone) {"), 'the status indicator is one function, shared by the card and the dialog');
  ok(editor.includes("definition.kind === 'related' ? relatedCell(definition, values, editing) : fieldCell(definition, values, editing)"), 'a related attribute is its live list, a cell among the cells');
  ok(editor.includes("'data-related': definition.relationship") && editor.includes("recordAfter(cellElement, hidden.every((input) => input.value.trim() === ''));"), 'its record rides in a hidden control, refreshed when a rating is applied, cleared by an empty one');
  ok(editor.includes("if (cells.slice(at + 1, index).some((cell) => cell.querySelector('.field-input.rating'))) continue;"), 'only by the rating nearest before it: another rating between them leaves it');
  ok(editor.includes("[...recorded.map((id) => [id, removed.includes(id) ? 'unlinked' : null]), ...added.map((id) => [id, 'added'])]") && editor.includes("word ? el('span', { className: 'row-state', text: word }) : icon('i-chevron-right')") && editor.includes("text: 'Changed since the rating'"), "the record keeps its order, a row's state stands in the chevron's place, and a notice says it");
  ok(editor.includes("el('span', { className: 'row-state', text: 'Deleted' }),") && editor.includes("const type = ENTITY_TYPES[id.split('-')[0]];") && readFile('../app/style.css').includes('.entity-row.unlinked { color: var(--text-helper); }'), 'a deleted entity reads so with its glyph, and an unlinked row is dimmed');
  ok(!page.includes('id="i-rate"') && !origin.includes('i-rate'), 'the rating field has no glyph of its own: it trails the edit pencil');
  ok(editor.includes("if (rows.length === 0) {\n      parts.push(el('div', { className: 'cell-value empty', text: 'None linked.' }));"), 'an empty list says so, as an empty value');
  ok(readFile('../app/style.css').includes('.related-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }'), 'the rows span the row they take');
  ok(readFile('../app/index.html').includes('<button type="button" class="shell-action shell-action-wide" id="shell-unsaved" hidden>\n      <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-save"/></svg>\n      <span>Save to file</span>') && readFile('../app/shell.js').includes('unsavedButton.hidden = !store.dirty();'), 'the top bar offers Save to file while the file is behind the project, labelled by what it does');
  ok(editor.includes("held.addEventListener('click', () => onNavigate(id));") && readFile('../app/app.js').includes('onNavigate: (id) => flows.selectNode(id),'), 'each entity a row on to it, through the guarded selection');
  ok(editor.includes("className: state === 'unlinked' ? 'entity-row unlinked' : 'entity-row', attributes: { type: 'button' } }, [") && editor.includes("icon(TYPE_ICONS[entity.type], ENTITY_TYPES[entity.type].pillar),"), 'shown as the tree shows an entity: its glyph in the pillar colour, its identifier, its label');
  ok(readFile('../attributes.md').includes('##### Protective measures'), 'the document nests the measures in the estimation');
  ok(editor.includes("attributes: { type: 'hidden', 'data-key': definition.key }"), 'its parameters ride in hidden controls, read into the draft as any field');
  ok(editor.includes('const chosen = await rateDialog(dialogs, {') && editor.includes("body.dispatchEvent(new Event('input', { bubbles: true }));"), 'Rate opens the dialog, and what it returns is written to the draft and shown');
  ok(readFile('../app/app.js').includes('  dialogs,\n'), 'the editor is given the dialogs to open');
  const rating = readFile('../app/rating.js');
  for (const method of ['Risk matrix', 'Risk graph', 'Numerical scoring', 'Hybrid tool']) {
    ok(rating.includes(`'${method}': `), `the dialog has a surface for ${method}`);
  }
  ok(rating.includes('[PL_METHOD]: graphSurface(PL_GRAPH_SPEC),') && rating.includes('[SIL_METHOD]: classMatrixSurface({ bands: SIL_BANDS, table: SIL_MATRIX }),'), "and for the two standards' levels");
  ok(rating.includes("{ label: 'Apply', value: 'confirmed', kind: 'primary' }"), 'applied by its primary action, cancelled by anything else');
  ok(rating.includes("role: 'button', tabindex: '0', 'data-pick':"), 'every code on the graph is a button, by pointer or keyboard');
  ok(rating.includes('const next = graphPick(') && !rating.includes("function graphSurface(parameters, state, changed) {\n  const groups"), 'the graph is the picker: no option rows above it');
  ok(rating.includes("node.codes.length > 1 ? code : node.label"), 'a merged branch offers its codes as separate words');
  const doc = readFile('../attributes.md');
  ok(doc.includes('#### Initial risk `when method = Risk matrix`'), 'the document tags a rating with the method it waits on');
  ok(doc.includes('| initialLevel | Risk level | computed | Risk matrix |'), 'and names the method a computed value is read by');
  ok(doc.includes('## 6. Risk estimation') && doc.indexOf('## 6. Risk estimation') < doc.indexOf('## 7. References'), 'the methods stand in their own chapter, before the references');
  const sheet = readFile('../app/style.css');
  ok(sheet.includes('.cell-group[hidden] { display: none; }') && sheet.includes('select.field-input.wide { max-width: none; }'), 'the sheet hides a waiting group and widens a long choice');
  ok(sheet.includes('.dialog:has(.rating) { max-width: 800px; }'), 'and widens the dialog for a rating');
  ok(sheet.includes('.tone-high .risk-dot { background: var(--danger); }') && sheet.includes('--support-success:'), "the levels take Carbon's status colours");
}

// --- The pre-paint theme script speaks the store's literals --------------

{
  const page = readFile('../app/index.html');
  const source = readFile('../app/store.js');
  const key = source.match(/const THEME_KEY = '([^']+)'/)?.[1];
  ok(typeof key === 'string', 'the store names its theme key');
  ok(page.includes(`localStorage.getItem('${key}')`), 'the inline script reads the store’s own key');
  const themes = source
    .match(/const THEMES = \[([^\]]+)\]/)?.[1]
    .match(/'[^']+'/g)
    .map((quoted) => quoted.slice(1, -1));
  ok(Array.isArray(themes) && themes.length === 2, 'the store holds two themes');
  ok(
    page.includes(`stored === '${themes[0]}' || stored === '${themes[1]}'`),
    'the inline script accepts exactly the store’s theme values'
  );
  ok(page.includes(`? '${themes[1]}' : '${themes[0]}'`), 'and its system fallback lands on the same pair');
}

// --- The closing check: the exact minimum viewport ----------------------

{
  const sheet = readFile('../app/style.css');
  const page = readFile('../app/index.html');
  ok(
    sheet.includes('@media (max-width: 999.98px), (max-height: 331.98px)'),
    'the notice covers both floors: 1000 wide, and the 332 the column needs — 48 shell, 160 editor, 4 splitter, 120 relationships'
  );
  ok(page.includes('at least 1000 pixels wide and 332 pixels tall'), 'and states both numbers');
  ok(sheet.includes('.pane-editor { flex: 1 1 auto; min-height: 160px; }'), 'the editor floor matches the 160px the splitter reserves');
  ok(sheet.includes('.pane-relationships { flex: 0 1 var(--relationships-height, 280px); min-height: 120px; }'), 'the relationship pane shrinks to its floor before anything overflows');
}

// --- The closing check: the navigator holds its toolbar -----------------

{
  const sheet = readFile('../app/style.css');
  const shell = readFile('../app/shell.js');
  ok(sheet.includes('min-width: 244px'), 'the pane floor is the toolbar: seven 32px buttons, six 2px gaps, 4px padding each side');
  ok(shell.includes('minimum: 244'), 'and the splitter stops at the same width');
}

// --- The closing check: pointer targets and the menu bar keys ------------

{
  const sheet = readFile('../app/style.css');
  ok(
    sheet.includes('.splitter-vertical::after { inset: 0 -10px;') && sheet.includes('.splitter-horizontal::after { inset: -10px 0;'),
    'the splitters take a 24px pointer target around the 4px bar'
  );
  const shell = readFile('../app/shell.js');
  const menu = readFile('../app/menu.js');
  ok(shell.includes('onArrow: (step) => neighbourMenu(button, step).openIt()'), 'the arrow keys walk the open menus along the bar');
  ok(menu.includes("event.key === 'ArrowLeft' || event.key === 'ArrowRight'"), 'which the menu forwards');
  ok(shell.includes("addEventListener('dblclick', () => apply(clamp(preset)))"), 'a double click returns a pane to its preset: resizing needs no drag');
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

summary('test-pins');
