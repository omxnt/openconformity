/**
 * Views mockup: six exportable views built from the example project,
 * each a pure description rendered by one table renderer. Reads the
 * app's modules and changes nothing in them. Ratings and a few texts
 * below are illustrative, set here so the rating columns have content.
 */

import { EXAMPLE_PROJECT } from '../../app/modules/example.js';
import { loadProject } from '../../app/modules/files.js';
import { entityLabel, relatedIds } from '../../app/modules/queries.js';
import { ENTITY_TYPES } from '../../app/modules/metamodel.js';
import { ATTRIBUTES } from '../../app/modules/attributes.js';
import { ratingView } from '../../app/modules/editor.js';
import { icon } from '../../app/modules/dom.js';
import { TYPE_ICONS } from '../../app/modules/icons.js';

/** The app's icon sprite, borrowed from its page so type glyphs render here. */
const page = new DOMParser().parseFromString(await (await fetch('../app/index.html')).text(), 'text/html');
const sprite = page.querySelector('svg[width="0"]');
if (sprite) document.body.prepend(document.adoptNode(sprite));

const { model } = loadProject(EXAMPLE_PROJECT);

const ILLUSTRATIVE = {
  'SCN-001': { standard: 'ISO/TR 14121-2', method: 'Risk graph', initialS: 'S2', initialF: 'F2', initialO: 'O3', initialA: 'A2', residualS: 'S2', residualF: 'F1', residualO: 'O1', residualA: 'A2', evaluation: 'Interlocked guard stops the drive before the hand reaches the parts. Acceptable.' },
  'SCN-002': { standard: 'ISO/TR 14121-2', method: 'Risk graph', initialS: 'S2', initialF: 'F1', initialO: 'O2', initialA: 'A1', residualS: 'S2', residualF: 'F1', residualO: 'O1', residualA: 'A1' },
  'SCN-003': { standard: 'ISO/TR 14121-2', method: 'Risk graph', initialS: 'S2', initialF: 'F2', initialO: 'O2', initialA: 'A2', residualS: 'S1', residualF: 'F1', residualO: 'O1', residualA: 'A1', evaluation: 'Isolation with lock-out. Acceptable once the procedure is in the instructions.' },
  'SCN-004': { standard: 'ISO/TR 14121-2', method: 'Risk graph', initialS: 'S1', initialF: 'F2', initialO: 'O3', initialA: 'A2' },
  'SAF-001': { reference: 'SF1', standard: 'EN ISO 13849-1', plS: 'S2', plF: 'F1', plP: 'P2', trigger: 'Emergency stop device operated.', reaction: 'Power removed from all drives.', safeState: 'Drives at standstill, restart inhibited.', responseTime: '< 500 ms' },
  'SAF-002': { reference: 'SF2', standard: 'EN ISO 13849-1', plS: 'S2', plF: 'F2', plP: 'P1', trigger: 'Guard door opened.', reaction: 'Drive stopped before access is possible.', safeState: 'Drive at standstill.' },
  'SAF-004': { reference: 'SF4', standard: 'EN IEC 62061', silSe: 'Se 3', silFr: 'Fr 4', silPr: 'Pr 3', silAv: 'Av 3' },
  'VER-001': { reference: 'V1', method: 'Test' },
  'VER-002': { reference: 'V2', method: 'Test' },
  'VER-003': { reference: 'V3', method: 'Inspection' },
  'VER-004': { reference: 'V4', method: 'Analysis' },
};
for (const [id, values] of Object.entries(ILLUSTRATIVE)) Object.assign(model.nodes.get(id).attributes, values);

// --- Model access ---------------------------------------------------------

const entity = (id) => model.nodes.get(id);
const ofType = (code) => [...model.nodes.values()].filter((node) => node.kind === 'entity' && node.type === code).sort((a, b) => a.id.localeCompare(b.id));
const related = (id, type) => relatedIds(model, id, type);
const outgoing = (id, type) => [...model.relationships.values()].filter((held) => held.type === type && held.source === id).map((held) => held.target).sort();
const relatedAll = (ids, type) => [...new Set(ids.flatMap((id) => related(id, type)))].sort();
const value = (id, key) => entity(id).attributes[key] ?? '';

const ratingGroup = (code, name, key, chosen) =>
  ATTRIBUTES[code].groups.flatMap((group) => group.groups ?? []).find((group) => group.name === name && group.when?.key === key && group.when.value === chosen);

// --- Cells ----------------------------------------------------------------

const ents = (ids) => ({ entities: ids });
/** The parameters a rating has under the method the scenarios use, for the columns. */
const ratingColumns = (code, name, key, chosen) => {
  const group = ratingGroup(code, name, key, chosen);
  const parameters = group ? group.attributes.filter((definition) => definition.kind !== 'computed') : [];
  const letters = (definition) => (definition.values?.[0] ?? definition.name).replace(/[\d\s]+/g, '');
  return [...parameters.map((definition) => ({ text: letters(definition), title: definition.name, group: name, narrow: true })), { text: 'Rating', group: name, narrow: true }];
};
const ratingCells = (id, name, chosen) => {
  const node = entity(id);
  const [key, code] = node.type === 'SCN' ? ['method', 'SCN'] : ['standard', 'SAF'];
  const group = ratingGroup(code, name, key, chosen);
  if (!group) return [];
  const view = node.attributes[key] === chosen ? ratingView(group.attributes, node.attributes) : null;
  const parameters = group.attributes.filter((definition) => definition.kind !== 'computed');
  return [...parameters.map((definition, i) => ({ code: view?.parameters[i].code ?? '', title: view ? `${view.parameters[i].name}: ${view.parameters[i].value}` : '' })), { outcome: view }];
};
const rating = (id, name) => {
  const node = entity(id);
  const [key, code] = node.type === 'SCN' ? ['method', 'SCN'] : ['standard', 'SAF'];
  const group = ratingGroup(code, name, key, node.attributes[key]);
  return { rating: group ? ratingView(group.attributes, node.attributes) : null };
};

// --- Views ----------------------------------------------------------------

function riskLog() {
  const scenarios = ofType('SCN');
  const method = scenarios.map((scn) => value(scn.id, 'method')).find(Boolean) ?? '';
  const columns = [
    'Scenario',
    'Hazards',
    'Exposed',
    'Tasks',
    ...ratingColumns('SCN', 'Initial risk', 'method', method),
    { text: 'Protective measures', group: 'Risk reduction' },
    { text: 'Requirements', group: 'Risk reduction' },
    { text: 'Safety functions', group: 'Risk reduction' },
    ...ratingColumns('SCN', 'Residual risk', 'method', method),
    'Risk evaluation',
  ];
  const row = (scn) => {
    const measures = related(scn.id, 'prm-reduces-risk-of-scn');
    return [
      ents([scn.id]),
      ents(related(scn.id, 'haz-contributes-to-scn')),
      ents(related(scn.id, 'act-exposed-in-scn')),
      ents(related(scn.id, 'tsk-gives-rise-to-scn')),
      ...ratingCells(scn.id, 'Initial risk', method),
      ents(measures),
      ents(relatedAll(measures, 'req-expresses-prm')),
      ents(relatedAll(measures, 'saf-realises-prm')),
      ...ratingCells(scn.id, 'Residual risk', method),
      value(scn.id, 'evaluation'),
    ];
  };
  const phases = ofType('PHS');
  const inPhase = (scn, phs) => relatedAll(related(scn.id, 'tsk-gives-rise-to-scn'), 'tsk-occurs-during-phs').includes(phs.id);
  const sections = [{ name: 'All scenarios', lead: `Every accident scenario. Ratings stand in columns under their group, one per parameter of the ${method || 'method'} and the rating it comes to; they would be made from this table with the same dialog the editor uses.`, tables: [{ columns, rows: scenarios.map(row) }] }];
  for (const phs of phases) sections.push({ name: entityLabel(phs), lead: `Scenarios a task occurring during ${entityLabel(phs)} gives rise to.`, tables: [{ columns, rows: scenarios.filter((scn) => inPhase(scn, phs)).map(row) }] });
  const orphans = scenarios.filter((scn) => !phases.some((phs) => inPhase(scn, phs)));
  if (orphans.length > 0) sections.push({ name: 'No phase', lead: 'Scenarios no task gives rise to, so no phase holds them.', tables: [{ columns, rows: orphans.map(row) }] });
  return {
    title: 'Risk assessment',
    lead: `One row per accident scenario, grouped by the phase its tasks occur during. The ratings stand in columns under their group, one per parameter of the ${method || 'method'} and the rating it comes to. Ratings would be made from this table with the same dialog the editor uses.`,
    sections,
  };
}

function requirementSpecification() {
  const columns = ['Designation', 'Title', 'Type', 'Description', 'Rationale', 'Derives from', 'Expresses', 'Satisfied by', 'Verified by', 'Decomposes into'];
  const rows = ofType('REQ').map((req) => [
    value(req.id, 'reference') || req.id,
    value(req.id, 'title'),
    { choice: value(req.id, 'type') },
    value(req.id, 'description'),
    value(req.id, 'rationale'),
    ents([...related(req.id, 'req-derives-from-esr'), ...related(req.id, 'req-derives-from-hsr'), ...related(req.id, 'req-derives-from-osr')]),
    ents([...related(req.id, 'req-expresses-prm'), ...related(req.id, 'req-expresses-saf')]),
    ents(related(req.id, 'elm-satisfies-req')),
    ents(related(req.id, 'ver-verifies-req')),
    ents(outgoing(req.id, 'req-decomposes-into-req')),
  ]);
  return { title: 'System requirement specification', lead: 'Every system requirement with what it derives from, what it expresses, and what satisfies and verifies it.', sections: [{ name: 'System requirements', tables: [{ columns, rows }] }] };
}

function verificationMatrix() {
  const requirements = ofType('REQ');
  const method = (ver) => value(ver.id, 'method') || 'No method';
  const verifications = ofType('VER').sort((a, b) => method(a).localeCompare(method(b)) || a.id.localeCompare(b.id));
  const matrix = {
    columns: ['Requirement', ...verifications.map((ver) => ({ text: value(ver.id, 'reference') || ver.id, sub: value(ver.id, 'title'), group: method(ver) }))],
    rows: requirements.map((req) => [ents([req.id]), ...verifications.map((ver) => ({ mark: related(req.id, 'ver-verifies-req').includes(ver.id) }))]),
  };
  const list = {
    columns: ['Requirement', 'Verifications', 'Method', 'Acceptance criteria'],
    rows: requirements.map((req) => {
      const vers = related(req.id, 'ver-verifies-req');
      return [ents([req.id]), ents(vers), { lines: vers.map((id) => value(id, 'method')) }, { lines: vers.map((id) => value(id, 'acceptanceCriteria')) }];
    }),
  };
  return {
    title: 'System verification matrix',
    lead: 'Which verification verifies which system requirement. The matrix prints while the verifications are few; the list form scales.',
    sections: [
      { name: 'Matrix', lead: 'A mark where a verification verifies a requirement, the verifications grouped by method. Prints while they are few.', tables: [matrix] },
      { name: 'List', lead: 'Each requirement with its verifications beneath, the form that scales.', tables: [list] },
    ],
  };
}

function safetyFunctionSpecification() {
  const fields = [
    ['Description', (id) => value(id, 'description')],
    ['Allocated to', (id) => ents(related(id, 'saf-allocated-to-elm'))],
    ['Realises', (id) => ents(related(id, 'saf-realises-prm'))],
    ['Expressed by', (id) => ents(related(id, 'req-expresses-saf'))],
    ['Decomposes into', (id) => ents(outgoing(id, 'saf-decomposes-into-saf'))],
    ['Design standard', (id) => ({ choice: value(id, 'standard') })],
    ['Integrity level', (id) => rating(id, 'Integrity level')],
    ['Priority', (id) => value(id, 'priority')],
    ['Operating mode', (id) => value(id, 'operatingMode')],
    ['Triggering event', (id) => value(id, 'trigger')],
    ['Safety-related reaction', (id) => value(id, 'reaction')],
    ['Intended safe state', (id) => value(id, 'safeState')],
    ['Restart conditions', (id) => value(id, 'restart')],
    ['Fault detection', (id) => value(id, 'faultDetection')],
    ['Fault reaction', (id) => value(id, 'faultHandling')],
    ['Fault indication', (id) => value(id, 'faultIndication')],
    ['Power loss behaviour', (id) => value(id, 'powerLoss')],
    ['Demand response time', (id) => value(id, 'responseTime')],
    ['Fault reaction time', (id) => value(id, 'faultReactionTime')],
    ['Demand rate', (id) => value(id, 'demandRate')],
    ['Technology', (id) => ({ choices: value(id, 'technology').split(';').map((held) => held.trim()).filter(Boolean) })],
    ['Specific interfaces', (id) => value(id, 'interfaces')],
  ];
  const sections = ofType('SAF').map((saf) => ({
    name: entityLabel(saf),
    tables: [{ spec: true, sortable: false, columns: ['Field', 'Value'], rows: fields.map(([name, read]) => [name, read(saf.id)]) }],
  }));
  return { title: 'Safety function specification', lead: 'One block per safety function: what it is, where it sits, what it must achieve.', sections };
}

function complianceMatrix() {
  const columns = [
    'Reference',
    'Requirement',
    'Applicable',
    'Rationale',
    'Hazards',
    { text: 'Harmonised', group: 'Covering clauses' },
    { text: 'Other', group: 'Covering clauses' },
    { text: 'Via clauses', group: 'Protective measures' },
    { text: 'Via hazards', group: 'Protective measures' },
    { text: 'System requirements', group: 'Traceability' },
    { text: 'Satisfied by', group: 'Traceability' },
    { text: 'Verified by', group: 'Traceability' },
  ];
  const row = (esr) => {
    const hazards = related(esr.id, 'esr-triggered-by-haz');
    const hsrs = related(esr.id, 'hsr-covers-esr');
    const osrs = related(esr.id, 'osr-supports-esr');
    const scenarios = relatedAll(hazards, 'haz-contributes-to-scn');
    return [
      value(esr.id, 'reference'),
      value(esr.id, 'title'),
        { choice: value(esr.id, 'applicable') },
      value(esr.id, 'rationale'),
      ents(hazards),
      ents(hsrs),
      ents(osrs),
      ents([...new Set([...relatedAll(hsrs, 'prm-implements-hsr'), ...relatedAll(osrs, 'prm-implements-osr')])].sort()),
      ents([...new Set([...relatedAll(hazards, 'prm-eliminates-haz'), ...relatedAll(scenarios, 'prm-reduces-risk-of-scn')])].sort()),
      ents(related(esr.id, 'req-derives-from-esr')),
      ents(related(esr.id, 'elm-satisfies-esr')),
      ents(related(esr.id, 'ver-verifies-esr')),
    ];
  };
  const sections = ofType('LEG').map((leg) => ({
    name: entityLabel(leg),
    lead: `The essential requirements of ${entityLabel(leg)}: the verdict, the clauses covering each, the measures reached through those clauses and through its hazards, and what derives from, satisfies and verifies it.`,
    tables: [{ columns, rows: related(leg.id, 'leg-contains-esr').map((id) => row(entity(id))) }],
  }));
  return {
    title: 'Legislation compliance matrix',
    lead: 'Every essential requirement of each act with the verdict, the clauses covering it, the measures reached through those clauses and through its hazards, and what derives from, satisfies and verifies it. The measures per requirement are the two middle columns; a separate view would repeat them.',
    sections,
  };
}

const VIEWS = [
  ['risk', 'Risk assessment', riskLog],
  ['requirements', 'System requirements', requirementSpecification],
  ['verification', 'Verification matrix', verificationMatrix],
  ['safety', 'Safety functions', safetyFunctionSpecification],
  ['compliance', 'Legislation compliance', complianceMatrix],
];

// --- Rendering --------------------------------------------------------------

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.text !== undefined) node.textContent = props.text;
  for (const [name, held] of Object.entries(props.attributes ?? {})) node.setAttribute(name, held);
  for (const child of children) node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  return node;
}

function entityRow(id) {
  const node = entity(id);
  const type = ENTITY_TYPES[node.type];
  const link = el('a', { className: 'entity', attributes: { href: `#${id}`, title: type.name } }, [
    icon(TYPE_ICONS[node.type], type.pillar),
    el('span', { className: 'mono', text: id }),
    el('span', { className: 'entity-title', text: entityLabel(node) }),
  ]);
  link.addEventListener('click', (event) => {
    event.preventDefault();
    note(`In the app this opens ${id} in the editor.`);
  });
  return link;
}

const tag = (text) => el('span', { className: 'tag', text });

let noteTimer = null;
function note(text) {
  let held = document.getElementById('note');
  if (!held) {
    held = el('div', { className: 'note', attributes: { id: 'note', role: 'status' } });
    document.body.appendChild(held);
  }
  held.textContent = text;
  held.hidden = false;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => { held.hidden = true; }, 2500);
}

function tags(view) {
  if (view === null) return el('span', { className: 'empty', text: '–' });
  const held = [];
  if (view.outcome !== null) held.push(outcomeTag(view));
  for (const parameter of view.parameters) if (parameter.value !== '') held.push(el('span', { className: 'tag', text: parameter.code, attributes: { title: `${parameter.name}: ${parameter.value}` } }));
  return held.length === 0 ? el('span', { className: 'empty', text: '–' }) : el('span', { className: 'tags' }, held);
}

/** The outcome as the app shows it: a neutral tag with a dot in the tone's colour. */
function outcomeTag(view) {
  return el('span', { className: `tag outcome tone-${view.tone}` }, [...(view.tone === 'none' ? [] : [el('span', { className: 'dot' })]), el('span', { text: view.outcome })]);
}

function cell(held, column = {}) {
  const narrow = column.narrow ? ' narrow' : '';
  if (held !== null && typeof held === 'object' && 'code' in held) return el('td', { className: `code${narrow}`, text: held.code || '–', attributes: held.title ? { title: held.title } : {} });
  if (held !== null && typeof held === 'object' && 'outcome' in held) return el('td', { className: narrow.trim() }, [held.outcome?.outcome ? outcomeTag(held.outcome) : el('span', { className: 'empty', text: '–' })]);
  if (held !== null && typeof held === 'object' && 'choice' in held) return el('td', { className: narrow.trim() }, [held.choice ? tag(held.choice) : el('span', { className: 'empty', text: '–' })]);
  if (held !== null && typeof held === 'object' && 'choices' in held) return el('td', {}, held.choices.length === 0 ? [el('span', { className: 'empty', text: '–' })] : [el('span', { className: 'tags' }, held.choices.map(tag))]);
  if (held === null || held === undefined || held === '') return el('td', {}, [el('span', { className: 'empty', text: '–' })]);
  if (typeof held === 'string') return el('td', { className: held.length > 40 ? 'wide' : '' }, [el('p', { text: held })]);
  if ('entities' in held) return el('td', {}, held.entities.length === 0 ? [el('span', { className: 'empty', text: '–' })] : held.entities.map(entityRow));
  if ('rating' in held) return el('td', {}, [tags(held.rating)]);
  if ('mark' in held) return el('td', { className: 'mark', text: held.mark ? '●' : '' });
  if ('lines' in held) return el('td', {}, held.lines.map((line) => el('p', { text: line || '–' })));
  return el('td', { text: String(held) });
}

const asColumn = (column) => (typeof column === 'string' ? { text: column } : column);

/** Where each column stands in its group: first, last, both, or none, so the sheet can rule the group's edges. */
function edges(cells) {
  return cells.map((column, i) => {
    if (!column.group) return '';
    const first = i === 0 || cells[i - 1].group !== column.group;
    const last = i === cells.length - 1 || cells[i + 1].group !== column.group;
    return `${first ? ' group-first' : ''}${last ? ' group-last' : ''}`;
  });
}

/** Sort state per table: the column sorted by and its direction, keyed by view, section and table. */
const sorts = new Map();

function sortKey(held) {
  const text = plain(held);
  const number = parseFloat(text);
  return Number.isNaN(number) ? text.toLowerCase() : number;
}

function sortedRows(spec, key) {
  const sort = sorts.get(key);
  if (!sort) return spec.rows;
  const compare = (a, b) => {
    const x = sortKey(a[sort.column]);
    const y = sortKey(b[sort.column]);
    const empty = (held) => held === '' || held === null;
    if (empty(x) !== empty(y)) return empty(x) ? 1 : -1;
    const result = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true });
    return sort.direction === 'asc' ? result : -result;
  };
  return [...spec.rows].sort(compare);
}

function headRows(columns, key, sortable) {
  const cells = columns.map(asColumn);
  const edge = edges(cells);
  const sort = sorts.get(key);
  const th = (column, i, extra = {}) => {
    const held = el('th', { className: `${column.narrow ? 'narrow' : ''}${edge[i]}${sortable ? ' sortable' : ''}`, attributes: { ...(column.title ? { title: column.title } : {}), ...extra } }, [column.text, ...(column.sub ? [el('small', { text: column.sub })] : [])]);
    if (!sortable) return held;
    held.setAttribute('role', 'button');
    held.setAttribute('tabindex', '0');
    if (sort?.column === i) {
      held.setAttribute('aria-sort', sort.direction === 'asc' ? 'ascending' : 'descending');
      const arrow = icon(sort.direction === 'asc' ? 'i-move-up' : 'i-move-down');
      arrow.setAttribute('class', 'icon sort');
      held.insertBefore(arrow, held.querySelector('small'));
    }
    const toggle = () => {
      const next = sort?.column !== i ? 'asc' : sort.direction === 'asc' ? 'desc' : null;
      if (next) sorts.set(key, { column: i, direction: next }); else sorts.delete(key);
      render();
    };
    held.addEventListener('click', toggle);
    held.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); } });
    return held;
  };
  if (!cells.some((column) => column.group)) return [el('tr', {}, cells.map((column, i) => th(column, i)))];
  const upper = [];
  const lower = [];
  for (let i = 0; i < cells.length; i++) {
    const column = cells[i];
    if (!column.group) {
      upper.push(th(column, i, { rowspan: '2' }));
      continue;
    }
    let span = 1;
    while (i + span < cells.length && cells[i + span].group === column.group) span++;
    upper.push(el('th', { className: 'group group-first group-last', text: column.group, attributes: { colspan: String(span) } }));
    for (let j = 0; j < span; j++) lower.push(th(cells[i + j], i + j));
    i += span - 1;
  }
  return [el('tr', {}, upper), el('tr', {}, lower)];
}

function table(spec, key) {
  const cells = spec.columns.map(asColumn);
  const edge = edges(cells);
  const sortable = spec.sortable !== false;
  const body = sortedRows(spec, key).map((row) => el('tr', {}, row.map((held, i) => { const td = cell(held, cells[i]); if (edge[i]) td.className = `${td.className} ${edge[i].trim()}`.trim(); return td; })));
  return el('table', { className: spec.spec ? 'data spec' : 'data' }, [el('thead', {}, headRows(spec.columns, key, sortable)), el('tbody', {}, body)]);
}

let current = { view: 'risk', section: 0 };

function render() {
  const [, name, build] = VIEWS.find(([id]) => id === current.view);
  const view = build();
  const viewTabs = document.getElementById('view-tabs');
  viewTabs.textContent = '';
  for (const [id, label] of VIEWS) {
    const tab = el('button', { className: 'ctab', text: label, attributes: { type: 'button', role: 'tab', 'aria-selected': String(id === current.view) } });
    tab.addEventListener('click', () => { current = { view: id, section: 0 }; render(); });
    viewTabs.appendChild(tab);
  }
  const main = document.getElementById('view');
  main.textContent = '';
  main.appendChild(el('h1', { className: 'print-only', text: view.title }));
  if (view.sections.length > 1) {
    const sectionTabs = el('nav', { className: 'tabs section-tabs', attributes: { 'aria-label': 'Sections' } });
    view.sections.forEach((section, i) => {
      const tab = el('button', { className: 'tab', text: section.name, attributes: { type: 'button', role: 'tab', 'aria-selected': String(i === current.section) } });
      tab.addEventListener('click', () => { current.section = i; render(); });
      sectionTabs.appendChild(tab);
    });
    main.appendChild(sectionTabs);
  }
  view.sections.forEach((section, i) => {
    const block = el('div', { className: 'section' });
    block.hidden = i !== current.section;
    if (view.sections.length > 1) block.appendChild(el('h2', { className: 'print-only', text: section.name }));
    const lead = section.lead ?? (i === 0 ? view.lead : '');
    if (lead) block.appendChild(el('p', { className: 'lead', text: lead }));
    section.tables.forEach((spec, j) => block.appendChild(table(spec, `${current.view}/${i}/${j}`)));
    main.appendChild(block);
  });
  document.title = `${name} – views mockup`;
  window.currentView = view;
}

// --- Exports --------------------------------------------------------------

const plain = (held) => {
  if (held === null || held === undefined) return '';
  if (typeof held === 'string') return held;
  if ('entities' in held) return held.entities.map((id) => entityLabel(entity(id)) ? `${id} ${entityLabel(entity(id))}` : id).join('; ');
  if ('rating' in held) return held.rating === null ? '' : [held.rating.outcome, ...held.rating.parameters.filter((p) => p.value !== '').map((p) => p.code)].filter(Boolean).join(' ');
  if ('mark' in held) return held.mark ? 'x' : '';
  if ('lines' in held) return held.lines.join('; ');
  if ('code' in held) return held.code;
  if ('outcome' in held) return held.outcome?.outcome ?? '';
  if ('choice' in held) return held.choice;
  if ('choices' in held) return held.choices.join('; ');
  return String(held);
};
const columnText = (column) => {
  const { text, sub, group, title } = asColumn(column);
  return [group, title ?? text, sub].filter(Boolean).join(' · ');
};
window.mockExports = { csv: () => csv(window.currentView.sections[current.section]), markdown: () => markdown(window.currentView) };

function csv(section) {
  const quote = (text) => `"${String(text).replaceAll('"', '""')}"`;
  return section.tables.map((spec) => [spec.columns.map(columnText), ...spec.rows.map((row) => row.map(plain))].map((row) => row.map(quote).join(',')).join('\n')).join('\n\n');
}

function markdown(view) {
  const escape = (text) => String(text).replaceAll('|', '\\|').replaceAll('\n', ' ');
  const lines = [`# ${view.title}`, ''];
  for (const section of view.sections) {
    if (view.sections.length > 1) lines.push(`## ${section.name}`, '');
    for (const spec of section.tables) {
      lines.push(`| ${spec.columns.map(columnText).map(escape).join(' | ')} |`, `|${spec.columns.map(() => '---').join('|')}|`);
      for (const row of spec.rows) lines.push(`| ${row.map(plain).map(escape).join(' | ')} |`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = el('a', { attributes: { href: url, download: filename } });
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

document.getElementById('print').addEventListener('click', () => window.print());
document.getElementById('export-csv').addEventListener('click', () => {
  const view = window.currentView;
  const section = view.sections[current.section];
  download(`${view.title} - ${section.name}.csv`.replaceAll('/', '-'), `\uFEFF${csv(section)}`, 'text/csv;charset=utf-8');
});
document.getElementById('export-md').addEventListener('click', () => download(`${window.currentView.title}.md`, markdown(window.currentView), 'text/markdown;charset=utf-8'));

render();
