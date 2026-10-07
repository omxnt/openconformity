/**
 * Writes docs/verification.md to standard output from three sources: the
 * requirements in specs/requirements.md, the headers of the test blocks
 * in the files named as arguments, and the manual activities in
 * manual.md. Run by run.sh from this directory after the suite, which
 * redirects the output into the document. Nothing in the document is
 * written by hand.
 */

const ID = /[A-Z]-[A-Z]{3}-\d{3}/g;
const CLASSES = [['C', 'Constraints'], ['G', 'Graphical'], ['F', 'Functional'], ['N', 'Non-functional']];
const METHODS = [['TST', 'Tests', 'Test'], ['INS', 'Inspections', 'Inspection'], ['DEM', 'Demonstrations', 'Demonstration'], ['ANA', 'Analyses', 'Analysis']];

/** The requirements, in the order the specification lists them. */
const requirements = [];
for (const line of readFile('../specs/requirements.md').split('\n')) {
  const match = /^#### ([A-Z]-[A-Z]{3}-\d{3}) (.*)$/.exec(line);
  if (match) requirements.push({ id: match[1], title: match[2].trim() });
}

/** @type {Array<{ id: string, technique: string, where: string, what: string, requirements: string[] }>} */
const activities = [];
for (const file of [...arguments].filter((name) => /^test-.*\.js$/.test(name)).sort()) {
  for (const line of readFile(file).split('\n')) {
    const match = /^\/\/ --- (V-(?:TST|INS)-\d{3}) (.*?) \(([^)]*)\) -+$/.exec(line);
    if (!match) continue;
    const ids = match[3].match(ID) ?? [];
    if (ids.length === 0) continue;
    activities.push({ id: match[1], technique: match[1].startsWith('V-INS') ? 'Pin' : 'Headless', where: `[${file}](../tests/${file})`, what: match[2], requirements: ids });
  }
}
for (const line of readFile('manual.md').split('\n')) {
  const match = /^\| (V-(?:DEM|ANA)-\d{3}) \| ([^|]*) \| ([^|]*) \| ([^|]*) \| ([^|]*) \|$/.exec(line);
  if (match) activities.push({ id: match[1], technique: match[2].trim(), where: match[3].trim(), what: match[4].trim(), requirements: match[5].match(ID) ?? [] });
}

const byRequirement = new Map(requirements.map((held) => [held.id, []]));
for (const activity of activities) {
  for (const id of activity.requirements) byRequirement.get(id)?.push(activity.id);
}

/** @param {string[]} ids */
function coverage(ids) {
  const classes = new Set(ids.map((id) => id.slice(2, 5)));
  const automatic = classes.has('TST') || classes.has('INS');
  const manual = classes.has('DEM') || classes.has('ANA');
  if (!automatic && !manual) return 'None';
  if (automatic && !manual) return 'Tested';
  return automatic ? 'Partly' : 'Manual';
}

const WAITS = { 'F-PER-007': 'Waits on the first migration', 'F-PER-009': 'Waits on the first migration', 'F-PER-011': 'Waits on the function' };

const out = [];
out.push('# Verification', '');
out.push('This document states how each requirement in `specs/requirements.md` [1] is verified. Chapter 2 lists the verification activities, one row each, and chapter 3 maps each requirement to its activities with its coverage. Both are generated from the headers of the test blocks and from `tests/manual.md`, which holds the drives and the reviews, and neither is edited by hand. The security model in `docs/security.md` [2] cites activities by their id.', '');
out.push('## 1. Conventions', '');
out.push('### 1.1 Method', '', 'Each activity shall verify by one of the four methods of system verification [3], carried out by the technique named for it.', '');
out.push('| Method | Technique | What it is |', '|---|---|---|');
out.push('| Test | Headless | A test in `tests/` that exercises behaviour, run by `./run.sh` in the JavaScriptCore shell. |');
out.push('| Inspection | Pin | A block of `tests/test-pins.js` that reads the source, the page or the file list for a fact no behaviour test can reach. |');
out.push('| Demonstration | Drive | The software opened in a browser and driven, by hand or by the headless Chrome driver. |');
out.push('| Analysis | Review | A document, a file, a host setting or a history read against the requirement. |', '');
out.push('### 1.2 Coverage', '', 'Each requirement shall carry the coverage that follows from the methods of its activities.', '');
out.push('| Coverage | Meaning |', '|---|---|', '| Tested | Test or inspection settles the requirement. |', '| Partly | Test or inspection settles part, and demonstration or analysis settles the rest. |', '| Manual | Only demonstration or analysis settles it. |', '| None | No activity exists yet. |', '');
out.push('### 1.3 Identifier', '', 'Each activity shall have a unique identifier of the form `V-CLASS-NNN`, where the class names the method. Identifiers are append-only, so an activity that is removed is not reissued under the same identifier, and an activity that changes method takes a new one.', '');
out.push('| Class | Method |', '|---|---|', '| `TST` | Test |', '| `INS` | Inspection |', '| `DEM` | Demonstration |', '| `ANA` | Analysis |', '');
out.push('### 1.4 Source', '', 'Each activity shall be written once, outside this document, with its identifier, what it checks and the requirements it verifies.', '');
out.push('| Method | Written in | Form |', '|---|---|---|', '| Test, inspection | The header of its block in `tests/` | `// --- V-TST-001 Title (ID, ID) ---` |', '| Demonstration, analysis | A row of `tests/manual.md` | Identifier, technique, where, what it checks, requirements |', '');
out.push('### 1.5 Generation', '', 'Chapters 2 and 3 shall be generated from the sources of 1.4 by `tests/generate-verification.js`, run by `./run.sh` after the suite, and shall not be edited by hand. Chapter 2 lists each activity, and chapter 3 lists each requirement with its activities and its coverage.', '');
out.push('## 2. Activities', '');
METHODS.forEach(([cls, heading], i) => {
  out.push(`### 2.${i + 1} ${heading}`, '', '| Id | Technique | Where | What it checks |', '|---|---|---|---|');
  for (const activity of activities.filter((held) => held.id.startsWith(`V-${cls}-`))) out.push(`| ${activity.id} | ${activity.technique} | ${activity.where} | ${activity.what} |`);
  out.push('');
});
out.push('## 3. Requirements', '');
const counts = new Map(CLASSES.map(([letter, name]) => [letter, { name, n: 0, Tested: 0, Partly: 0, Manual: 0, None: 0 }]));
CLASSES.forEach(([letter, name], i) => {
  out.push(`### 3.${i + 1} ${name}`, '', '| Requirement | Title | Activities | Coverage |', '|---|---|---|---|');
  for (const held of requirements.filter((req) => req.id.startsWith(letter))) {
    const ids = byRequirement.get(held.id);
    const level = coverage(ids);
    const count = counts.get(letter);
    count.n += 1;
    count[level] += 1;
    out.push(`| ${held.id} | ${held.title} | ${ids.join(', ') || 'None'} | ${level} |`);
  }
  out.push('');
});
out.push('## 4. Summary', '', '### 4.1 Coverage', '', '| Class | Requirements | Tested | Partly | Manual | None |', '|---|---|---|---|---|---|');
const total = { n: 0, Tested: 0, Partly: 0, Manual: 0, None: 0 };
for (const count of counts.values()) {
  out.push(`| ${count.name} | ${count.n} | ${count.Tested} | ${count.Partly} | ${count.Manual} | ${count.None} |`);
  for (const key of Object.keys(total)) total[key] += count[key];
}
out.push(`| All | ${total.n} | ${total.Tested} | ${total.Partly} | ${total.Manual} | ${total.None} |`, '');
out.push('Every other test block says in its header that it names no requirement, and pins a choice made within one.', '');
out.push('### 4.2 Gaps', '', '| Requirement | Why |', '|---|---|');
for (const held of requirements) if (coverage(byRequirement.get(held.id)) === 'None') out.push(`| ${held.id} | ${WAITS[held.id] ?? 'Waits on the function'} |`);
out.push('');
out.push('## 5. References', '', '| No. | Reference | Link |', '|---|---|---|');
out.push('| [1] | openconformity, Requirements | [requirements.md](../specs/requirements.md) |');
out.push('| [2] | openconformity, Security | [security.md](security.md) |');
out.push('| [3] | SEBoK System Verification | https://sebokwiki.org/wiki/System_Verification |');
print(out.join('\n'));
