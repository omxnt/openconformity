# Security 2026-09

This document is the first security audit of openconformity, made against commit `2338fc0` of 27 September 2026 and followed up at commit `e7c5da8` the same day. It reviews the requirements in `specs/requirements.md` for form, testability, consistency and coverage, and proposes what was missing. It analysed the threats to the software, and that analysis is now held and kept current as the security model in `docs/security.md`. It ranks and sizes the findings of both parts, plans how each control and finding is verified, records the run of that plan, and records the follow-up of every finding. The target is openconformity. Cloudflare, GitHub, draw.io and JGraph are boundaries the software depends on, and crossing them is described for what it means to the software, never planned as an attack on them.

## 1. Method

### 1.1 The requirements review

Every requirement in `specs/requirements.md` was read against four criteria. The first is its EARS pattern [1], whether the tag matches the clauses the sentence holds, whether the system is named, and whether the sentence states one response. The second is testability, whether a check could tell the requirement true or false, and if so which kind, a headless test, a source pin, a browser drive, or a review of a document or a setting. The third is consistency, whether the requirement pulls against another, repeats it, or carves out an exception another does not name. The fourth is its rationale, whether the reason given still describes the software as built and whether the rationale carries a rule the statement should carry. A requirement is sound when it passes all four. It is weak when a test could not settle it, when it says less than it means, or when its rationale is out of date. It is faulty when it is wrong or contradicts the software as built by design.

A missing requirement was found by walking what the software does and holds. Each module under `app/` was read, and every input, storage, output and outward link was listed. Each was then matched to the requirement that governs it. Where a control exists in the code with no requirement behind it, or where a risk the threat analysis names has no requirement that would close it, a requirement is proposed in the file's own form. The test block headers in `tests/` were read for the ids they name, and the set was compared with the set of ids in the specification.

### 1.2 The threat analysis

The analysis follows one order. The assets are named first, ranked by what their loss would cost the user. The trust boundaries come next, each line data or code crosses into the software, with what stands on each side. The threat actors are named with what each has, can do and wants. The attack surface lists every entry point with the file and line where data enters and the check it meets. Each boundary is then put to the six STRIDE questions [3], spoofing, tampering, repudiation, information disclosure, denial of service and elevation of privilege. Attack scenarios are then written as the attacker would plan them, and each step is checked against the code. Every claim about what the software does names a file and a line, and where a claim could be run it was run in the JavaScriptCore shell the test suite uses.

A scenario is rated on feasibility and impact, each on three steps. Feasibility is Low when it needs a compromise of a party the software trusts, such as the host or the editor's origin, or conditions the attacker cannot arrange. It is Medium when it needs the user to act once, such as opening a file or consenting to the editor. It is High when any visitor or any file reaches it with no condition. Impact is Low when the outcome is an annoyance without loss. It is Medium when the outcome is the loss of unsaved work, or the exposure of one drawing. It is High when project content is read or altered without the user knowing, or code runs on the user's device. Risk combines the two. It is High when one is High and the other at least Medium. It is Medium when both are Medium, or when one is High and the other Low. It is Low otherwise. Each scenario ends with a verdict. Blocked means the software stops it. Mitigated means the software reduces it but a residue stays. Open means the software does nothing about it today. The same scale now stands in section 1.2 of `docs/security.md`, so later audits rate alike.

### 1.3 Evidence

This section was added because the reader of a security assessment needs to know what was read and what was run. The commit assessed is `2338fc0`, dated 27 September 2026 at 02:27. The one commit after it, `ae3e079`, changes only this document, so the software is the same at both. Every file under `app/` was read except the two data modules `modules/example.js` and `library/data.js`, which were probed rather than read. The test suite was run with `./run.sh` from `tests` and every one of its 27 files reported all checks passed. Five probes were run in the same shell against the modules as they stand. They built a project file with a filing chain 1,000, 10,000 and 50,000 deep and opened it. They parsed a file holding a `__proto__` key and checked the object prototype after. They put fifteen drawings to the drawing check. They loaded the shipped catalogue and the example, imported the whole catalogue into an empty project, and checked both for hidden and unknown content. One request was made to the live host, a HEAD request for its page, to read the response headers. Nothing else was fetched and nothing was changed.

## 2. Requirements review

### 2.1 Form and testability

The specification holds 84 requirements. The table gives each one's tag as written, the verdict, and the reason. Where the reason names a file and line, the fact was read there.

| Id | Pattern | Verdict | Reason |
|---|---|---|---|
| C-PRJ-001 | ubiquitous | sound | A fixed name, settled by reading. |
| C-PRJ-002 | ubiquitous | sound | Settled by reading the deployment. |
| C-PRJ-003 | ubiquitous | sound | The licence text rides with the software and is pinned. |
| C-PRJ-004 | ubiquitous | weak | Settled by review only, and whether an act is a commercial activity is a legal reading, not a test. |
| C-PRJ-005 | ubiquitous | sound | Settled by review of the content. The pin catches known patterns only. |
| C-DEV-001 | ubiquitous | sound | Review of the repository. |
| C-DEV-002 | ubiquitous | sound | Review of the host. |
| C-DEV-003 | ubiquitous | sound | Tested, the diagram is parsed and compared. |
| C-DEV-004 | ubiquitous | sound | Review, the source stands in `sources/visual-assets.fig`. |
| C-DEV-005 | ubiquitous | sound | Review of the deployment. |
| C-TEC-001 | ubiquitous | sound | Settled by listing the files under `app/`. |
| C-TEC-002 | ubiquitous | sound | Settled by reading every module. The pins scan for fetches and frames. |
| C-TEC-003 | ubiquitous | sound | Review, the host serves the folder as it is. |
| C-TEC-004 | ubiquitous | weak | `theme.js` is a classic script loaded before the stylesheet by design (`index.html:13`), which the statement does not allow for. See 2.5. |
| C-TEC-005 | optional feature | weak | The statement is sound. The rationale says assets pose no supply-chain risk, which overstates it, since a tampered font or icon file is still a file the browser parses. See 2.5. |
| C-TEC-006 | ubiquitous | sound | Review. |
| C-TEC-007 | ubiquitous | sound | Review, no functions folder stands in the repository. |
| C-TEC-008 | optional feature | sound | Pinned in `test-pins.js`. |
| G-IDN-001 | ubiquitous | weak | A table of properties is not one statement a test settles. The colour is fixed at `#161616` while the mark is drawn in the colour of its ground (`style.css:224` to `232`) and stands light on the dark shell bar. |
| G-IDN-002 | ubiquitous | sound | Review of the file. |
| G-SYS-001 | ubiquitous | weak | To follow a design system cannot be settled by a test, only judged by review. |
| G-SYS-002 | ubiquitous | sound | Pinned. |
| G-SYS-003 | ubiquitous | sound | Pinned. |
| G-SYS-004 | ubiquitous | sound | Pinned, every glyph drawn is in the sprite with its provenance. |
| G-SYS-005 | ubiquitous | sound | Browser drive. The drawing omits the status bar and the modes built since, which are not panes. |
| F-APP-001 | unwanted behaviour | weak | The supported viewport has no number in the specification, only in the page and the stylesheet. See N-CMP-001 and 2.5. |
| F-APP-002 | ubiquitous | weak | Testable and tested. The rationale says a first visit opens an empty project, while the software opens with no project and a landing (`store.js:107`, `landing.js:24`). See 2.5. |
| F-SES-001 | event driven | weak | The system is named as it. Working state is defined as whatever else the software restores, which a test cannot settle. Nothing is said of a restore that fails, which the software handles (`store.js:381` to `388`). See 2.4 and 2.5. |
| F-SES-002 | event driven | sound | Tested. What happens when persisting fails is not stated, see 2.4. |
| F-SES-003 | event driven | weak | The trigger names the outcome, the data being removed, rather than the user's act, and the sentence holds three responses. Tested as built. |
| F-WSP-001 | ubiquitous | sound | Tested. |
| F-WSP-002 | event driven | sound | Not tested, a browser drive settles it. |
| F-WSP-003 | event driven | sound | Tested. |
| F-WSP-004 | ubiquitous | sound | Tested. |
| F-WSP-005 | ubiquitous | sound | Tested. |
| F-WSP-006 | ubiquitous | weak | The statement is sound. Its rationale says deleting a folder never deletes the entities filed in it, and F-WSP-007 says it does. See 2.2. |
| F-WSP-007 | event driven | sound | Tested. |
| F-MOD-001 | ubiquitous | sound | Tested. |
| F-MOD-002 | ubiquitous | sound | Tested. |
| F-MOD-003 | ubiquitous | weak | Points at `notes/attributes.md` as the definition, a document the precedence table calls derived and ranks below the metamodel. See 2.2. |
| F-MOD-004 | ubiquitous | sound | Tested. |
| F-MOD-005 | event driven | sound | Tested. |
| F-MOD-006 | event driven | sound | Tested. |
| F-MOD-007 | event driven | sound | Tested. |
| F-MOD-008 | event driven | sound | Tested. |
| F-MOD-009 | event driven | sound | Tested. |
| F-MOD-010 | event driven | sound | Tested. The copies pass no hidden-content check, see 2.5 and finding 5. |
| F-MOD-011 | event driven | weak | Two requirements in one sentence, a When clause and a While clause, tagged event driven where it is complex. |
| F-VIE-001 | ubiquitous | weak | Exportable is undefined. The pane prints (`views.js:241` to `242`) and exports nothing else, and the rationale defers what a view is. |
| F-VIE-002 | ubiquitous | sound | Tested. |
| F-PER-001 | ubiquitous | sound | Tested. |
| F-PER-002 | ubiquitous | sound | Tested, a catalogue passes the loader (`library.js:264`). |
| F-PER-003 | event driven | sound | Tested. |
| F-PER-004 | event driven | sound | Not testable until a version 2 exists, the chain is empty (`files.js:35`). The refusal of a version with no step is tested. |
| F-PER-005 | unwanted behaviour | sound | Tested. |
| F-PER-006 | unwanted behaviour | sound | Tested. The rationale carries the definition of validity and the order of the gates, which keeps the statement to one sentence. |
| F-PER-007 | event driven | sound | Not testable until a migration exists. |
| F-PER-008 | ubiquitous | weak | A rule for the maintainer, not a behaviour of the software, settled by review of each change. It belongs with the constraints. |
| F-PER-009 | event driven | sound | Not testable until a migration exists. |
| F-PER-010 | ubiquitous | sound | Tested. Its second response is also N-SEC-005's second response, see 2.2. |
| F-PER-011 | event driven | faulty | No template function exists, and the policy the page declares forbids every connection (`index.html:5`, `connect-src 'none'`), so the fetch it requires cannot happen as built. See 2.2 and 2.5. |
| F-DRW-001 | ubiquitous | weak | The statement is tested. The dimension limit and the refusal of entity declarations stand in the rationale only (`drawing.js:12` and `212`), so a test of them has no statement to cite. See 2.4. |
| F-DRW-002 | ubiquitous | sound | Tested, the text returned is the text stored (`drawing-editor.js:241`). |
| F-DRW-003 | complex | weak | Where the user has consented uses the optional-feature keyword for a state. The refusal of more than one page (`drawing-editor.js:236`) has no statement. Three responses stand in one sentence. |
| N-OPS-001 | ubiquitous | sound | Review, the software has no account. |
| N-OPS-002 | ubiquitous | weak | Testable by a network log and pinned for fetches. The metamodel image (`flows.js:893`) and the licence texts (`about.js:66`, `97`, `98`) are fetched from the host on invocation without a statement, which the letter forbids. See 2.5. |
| N-OPS-003 | unwanted behaviour | sound | Tested against a fake frame. |
| N-PRV-001 | ubiquitous | sound | Review. The editor's code runs in the user's browser too. |
| N-PRV-002 | ubiquitous | sound | Pinned, no module fetches. |
| N-PRV-003 | ubiquitous | sound | Review of the source. |
| N-PRV-004 | ubiquitous | sound | Review of the source. |
| N-PRV-005 | event driven | sound | Pinned for the text and drivable in the browser. |
| N-PRV-006 | ubiquitous | sound | Tested, the choice stands in session storage (`store.js:72`, `908`) and About offers Forget (`about.js:47`). |
| N-PRV-007 | state driven | sound | Tested, the load carries the one drawing's model (`drawing-editor.js:212`). |
| N-SEC-001 | ubiquitous | sound | Pinned and reviewed, the one parser is `JSON.parse` (`files.js:235`). |
| N-SEC-002 | ubiquitous | sound | Pinned, every string reaches the page as text (`dom.js:18`). |
| N-SEC-003 | optional feature | sound | Tested for the check, pinned for the image (`drawing-cell.js:59`). |
| N-SEC-004 | optional feature | sound | Two responses, each tested. The referrer the frame sends is not stated, see 2.5. |
| N-SEC-005 | ubiquitous | sound | Tested. Its second response repeats F-PER-010. |
| N-ACC-001 | ubiquitous | weak | WCAG 2.2 AA is a body of criteria. The pins settle contrast and pointer targets, the rest is by review. |
| N-ACC-002 | ubiquitous | sound | Review of the icon set or a browser drive. |
| N-ACC-003 | ubiquitous | sound | Browser drive, `docs/shortcuts.md` lists every path. |
| N-CMP-001 | ubiquitous | weak | No number. The rationale defers it to implementation, and the implementation has it (`index.html:194`). See 2.5. |
| N-CMP-002 | ubiquitous | weak | Evergreen major web browsers names no baseline. The pins name one feature by hand. |

Of the 84, 58 are sound, 25 are weak and one is faulty.

### 2.2 Consistency

**F-WSP-006 and F-WSP-007.** The rationale of F-WSP-006 says deleting a folder removes filing, never the entities filed in it. F-WSP-007 says a folder deletion deletes every folder and entity filed in it. The software does what F-WSP-007 says (`model.js:583` to `591`). The doc comment of `deleteSelection` still says the old thing (`flows.js:424` to `425`). Resolved by rewriting the rationale of F-WSP-006, see 2.5, and by one comment fix.

**F-PER-010 and N-SEC-005.** Both require the software to state on opening the content it keeps without presenting. One statement in two places drifts apart. Resolved by keeping the response in F-PER-010, where the content it describes is defined, and pointing at it from N-SEC-005.

**F-PER-011 and the policy the page declares.** F-PER-011 requires a fetch from the host. The policy under D-074 forbids every connection (`index.html:5`). N-OPS-002 names F-PER-011 as one of two functions that fetch. No template function exists in the code. The two can both stand only if the policy gains `connect-src 'self'` the day templates are built. Resolved by marking F-PER-011 as not yet built and recording the policy change it needs, see 2.5 and 2.6.

**N-OPS-002 and the host resources opened on use.** N-OPS-002 allows a fetch during use only for a function that states what it fetches and from where. The Metamodel action opens an image from the host (`flows.js:893`), and About links to the licence texts on the host (`about.js:66`, `97`, `98`). Neither states it. The rationale of F-PER-011 argues that a request to the host carries nothing of the user's and needs no consent, which is the same reasoning. Resolved by saying so in N-OPS-002, see 2.5.

**F-APP-002 and the landing.** The rationale says a first visit opens an empty project ready for the first entity. A fresh session has no project (`store.js:107`) and the editor pane shows the landing with three ways in (`landing.js:24` to `45`). The statement still holds, since the landing is neither a homepage nor a wizard. Resolved by rewriting the rationale, see 2.5.

**F-MOD-003 and the precedence table.** F-MOD-003 names `notes/attributes.md` as the definition of the attributes. The precedence table ranks that document fourth, derived from the metamodel, and says the attributes are wrong on disagreement. A requirement pointing at a derived note as its authority inverts the table. Resolved either by moving the attributes document to `specs/` or by rewording F-MOD-003 to name the metamodel with the attributes document as its transcription.

**C-TEC-004 and the theme script.** C-TEC-004 requires the JavaScript to be organised as native ES modules. `theme.js` is a classic script by design, so the theme is set before the stylesheet loads and the policy can stay without inline code (`index.html:9` to `13`). Resolved by naming the exception in C-TEC-004, see 2.5.

**N-SEC-004 and F-DRW-003.** F-DRW-003 says the frame permits scripts and the editor's own origin and nothing else. N-SEC-004 says each permission granted is recorded with the function that grants it. The two agree, and the code matches (`drawing-editor.js:57`). No change.

### 2.3 Coverage

The test block headers in `tests/` name 58 of the 84 requirement ids. The 26 named by no block are listed with the way each could be verified.

| Id | How it could be verified |
|---|---|
| C-PRJ-001, C-PRJ-002 | Review of the repository name and the domain. |
| C-PRJ-004 | Review only. |
| C-DEV-001, C-DEV-002, C-DEV-004, C-DEV-005 | Review of the repository, the host and the deployment. |
| C-TEC-001 | Headless, a pin listing the extensions of every file under `app/`. |
| C-TEC-002 | Headless, a pin that every import is relative and every script source is local. The fetch scan under N-PRV-002 covers half. |
| C-TEC-003 | Review of the host's build setting, which must be none. |
| C-TEC-004 | Headless, a pin that every script tag but `theme.js` is a module. |
| C-TEC-006 | Review. |
| C-TEC-007 | Headless, a pin that no `functions` folder stands under `app/`, and review of the host. |
| F-PER-007, F-PER-009 | Headless, once a migration exists. |
| F-PER-008 | Review of each change to the file's structure. |
| F-PER-011 | Nothing to verify until the function is built. |
| F-WSP-002 | Browser drive, select an entity and read the editor pane. |
| G-IDN-001, G-IDN-002 | Review of the two SVG files. |
| G-SYS-001 | Review. |
| N-ACC-002 | Review of the type icons, each a distinct shape. |
| N-OPS-001 | Headless, a pin that no module names a password or a sign-in. |
| N-PRV-001, N-PRV-004 | Source review. The fetch scan under N-PRV-002 is the closest pin. |
| N-PRV-003 | Source review. The fetch scan under N-PRV-002 is the closest pin. |

Two things stand out. The pins cover the security requirements well, N-SEC-001 to N-SEC-005 and N-PRV-002 to N-PRV-007 each have a block. The constraints are the least covered, and most of them can only be reviewed. Eleven blocks name no requirement and say so. Some of them verify a control that has no requirement, such as the filename slug (`test-files.js:109`) and the decoding of an export (`test-drawing-editor.js:86`), and 2.4 proposes the requirements that would claim them.

### 2.4 Missing requirements

The software has controls no requirement asks for, and risks no requirement closes. Each block below is ready to paste into its group in `specs/requirements.md`.

The project publishes `SECURITY.md` with a private reporting channel, a scope and a response aim. No requirement asks for it, so nothing keeps it current.

```markdown
#### C-PRJ-006 Vulnerability reporting

`ubiquitous`

The project shall publish a private way to report a vulnerability, stating what is in scope, which versions are supported and when a report is acknowledged.

> *A tool that opens files from anywhere will receive reports, and a report made in public before a fix reaches every user of the tool. A private channel with a stated scope sends a report about the editor to its maker and a report about the software to the maintainer, and a stated response aim tells the reporter what to expect. The channel is GitHub's private vulnerability reporting and the project's address, published in the repository's security file.*
```

The tests run only when the maintainer runs them, and the host deploys on every push to main. No requirement ties a release to a passed run.

```markdown
#### C-DEV-006 Release verification

`ubiquitous`

The project shall merge to main only a commit on which the test suite reports every check passed and the page opens with no console error or warning.

> *The host serves what main holds the moment it is pushed, with no step between. The source pins are what catch a change that widens the attack surface, a new fetch, a frame, markup built from text, and they catch it only when they run. Tying the merge to a passed run makes the pins a gate rather than a habit. The console check reaches what the pins cannot, a policy violation the browser reports at runtime.*
```

The software's guarantees rest on the host serving the files the repository holds. A host can rewrite or inject code under the software's own origin, which the page's policy permits as its own. No requirement forbids it.

```markdown
#### C-DEV-007 Deployment integrity

`ubiquitous`

The host shall serve every file of the software byte for byte as the released commit of the repository holds it.

> *With no build step the deployed software is the source, and that is what lets anyone verify what they run against what they can read. A host offers features that break this, minification, script injection for analytics, loaders and obfuscation, each placing code on the software's origin that a policy allowing the origin's own scripts cannot tell from the software's. The requirement rules them out and is verified by fetching each file and comparing it with the commit.*
```

Every vendored asset carries an origin record and a licence. The requirement that asks for self-hosted, open-licensed assets does not ask for the record.

```markdown
#### C-TEC-009 Asset provenance

`optional feature`

Where the software includes a third-party asset, the repository shall record beside it the asset's source, its version and its licence.

> *An asset is a file the browser parses, and a tampered or mistaken copy is a file the browser parses too. The record is what lets a reviewer fetch the named release and compare, and what lets a licence be honoured on redistribution. The fonts and the icons carry such a record today.*
```

A stored session that cannot be read back is set aside, stated, and offered for saving or discarding. F-SES-001 says nothing of the case.

```markdown
#### F-SES-004 Restoration failure

`unwanted behaviour`

If the working state of the previous session cannot be restored, then the software shall state so, keep the stored state aside unchanged, and offer to save it to a file or to discard it.

> *The stored state can hold the only copy of unsaved work, and a state that fails to load is not the same as no state. Setting it aside rather than deleting it keeps the work recoverable, and stating the failure means an empty workspace is never left unexplained. The copy stays until the user discards it, since only the user can judge what it held.*
```

A refused write to browser storage is told, and the browser's leave prompt fires while unsaved changes are not being kept. F-SES-002 requires the persisting and says nothing of its failure.

```markdown
#### F-SES-005 Persistence failure

`unwanted behaviour`

If browser storage refuses to persist a change, then the software shall keep the model in memory, state that changes are not being stored, and warn before the page is left while unsaved changes exist.

> *A browser can refuse a write, out of quota, in a private window, or with storage disabled, and the software must go on working. The statement tells the user to save to a file. The leave prompt is kept for this case alone, since while the store holds the work a prompt would be a lie the user learns to dismiss.*
```

The software tells the user when the origin's storage nears its quota. Nothing requires it.

```markdown
#### F-SES-006 Storage nearly full

`state driven`

While the storage the browser keeps for the software's origin stands past eight tenths of its quota, the software shall state that browser storage is nearly full.

> *A write refused for want of space is the failure F-SES-005 handles, and the warning before it is what lets the user save first. Eight tenths is the share past which the next drawing may not fit.*
```

The drawing check refuses a drawing beyond 16,384 units a side, one declaring entities, and one whose model holds more than one page. The first two stand in a rationale and the third nowhere.

```markdown
#### F-DRW-004 Drawing bounds

`ubiquitous`

The software shall refuse a drawing that declares a width, a height or a view box beyond 16,384 units, that declares an entity, or whose model holds more than one page, and shall state why.

> *A browser cannot rasterise a picture wider than that, and an entity declaration is the one way XML text expands beyond its length. The picture shows one page, so a model with more would hide the rest from the reader of the file. Each refusal names its reason so the drawing can be amended in the editor rather than lost.*
```

The page declares a content security policy the browser enforces. It is pinned but not required.

```markdown
#### N-SEC-006 Content security policy

`ubiquitous`

The software shall declare on its page, before anything loads, a content security policy that permits scripts, styles and fonts from its own origin only, images from its own origin and from data, frames from the drawing editor's origin only, and no connection, object, base or form.

> *A policy the browser enforces is a guarantee the code alone cannot give. It means a mistaken change, or a drawing the check missed, cannot reach out, run inline code or submit anything. The single frame origin states where the browser reads it the one exception the software makes. The theme script is a file rather than inline so the policy can hold.*
```

The page's policy cannot forbid other sites from framing the software, since the frame-ancestors directive is ignored in a meta element [4]. The host's login gate answered with such a header at the time of writing, and the software's own response is unverified.

```markdown
#### N-SEC-007 Framing

`ubiquitous`

The software shall not be presentable in a frame on another origin.

> *A page framed by another site can be laid over and clicked through, and can be shown as if it were the other site's. A meta policy cannot forbid it, only a response header can, so the host must send it. On Cloudflare Pages a `_headers` file beside the page does that and is inert on any other host, so the folder still runs anywhere. Modern browsers partition the storage of a framed page, so a framed copy would see no project, and the requirement closes what remains.*
```

A hyperlink attribute is presented as a link only for a web address, and opened without an opener. The rule is tested but not required.

```markdown
#### N-SEC-008 Hyperlink presentation

`optional feature`

Where an attribute holds a hyperlink, the software shall present it as a link only when its value is an http or https address, and shall open it in a new browsing context without an opener.

> *A value in a file can be any text, and a scheme that runs code, `javascript:` above all, must never become something the user can click. Anything that is not a web address is shown as the text it is. Opening without an opener keeps the destination from reaching back to the page.*
```

A project file valid at every gate can still make the loader throw, as a filing chain 50,000 deep does. The exception passes no dialog, so F-PER-006's statement is never made.

```markdown
#### N-SEC-009 Failure on opening

`unwanted behaviour`

If opening a project file fails for a reason the checks do not name, then the software shall state that the file could not be opened and shall leave the open project unchanged.

> *The checks name what they know. A file can still exhaust the browser, by size or by depth, and an error that escapes them must end in the same place a refusal does, a statement and an unchanged project, rather than in a silent stop.*
```

The software reads nothing from the address it is opened at. That is what makes a link unable to carry state or content into it, and it is worth keeping.

```markdown
#### N-SEC-010 No input from the address

`ubiquitous`

The software shall read no input from the address it is opened at.

> *A link is the one input another site can hand the software without the user's act. Reading nothing from the address means no query or fragment can select, open, fill or trigger anything, and there is nothing to reflect into the page.*
```

### 2.5 Changes to existing requirements

**C-TEC-004.** As it stands, the software shall organise its JavaScript as native ES modules. Proposed, the software shall organise its JavaScript as native ES modules, except a script that must run before the stylesheet loads. Why, `theme.js` is a classic script by design so the first paint is in the right theme under a policy that allows no inline code, and the statement should allow what the page does.

**C-TEC-005, rationale.** As it stands, assets such as typefaces or icons carry no executable code, so they pose no supply-chain risk and are allowed where third-party code is not. Proposed, assets such as typefaces or icons carry no code the browser runs, so they are allowed where third-party code is not, and their provenance is recorded so a copy can be checked against its release. Why, a font file is parsed by the browser's font engine and a tampered one is still a risk, and the record proposed as C-TEC-009 is the control.

**F-APP-002, rationale.** As it stands, a first visit opens an empty project ready for the first entity. Proposed, a first visit shows the workspace with no project and the three ways into one, a new project, a saved file or the example, in the editor pane. Why, that is what the software does (`store.js:107`, `landing.js:13` to `17`).

**F-SES-001.** As it stands, when the software is opened, it shall restore the working state of the previous session. Proposed, when the software is opened, the software shall restore the working state of the previous session, the open project, the selection, the tree's expansion and the theme. Why, the system is named as it, and the term working state ends in whatever else the software restores, which a test cannot settle. The list is what `store.js:319` to `336` restores. The failure case is F-SES-004 in 2.4.

**F-SES-003.** As it stands, when the user removes the software's data from the browser, the software shall confirm first, stating what is lost, and shall then delete everything it keeps in browser storage, the project, the session state and the user's choices. Proposed, when the user invokes the clearing of stored data, the software shall confirm first, stating what is lost, and on confirmation shall delete everything it keeps in browser storage, the project, its set-aside copy, the session state and the user's choices. Why, the trigger should be the act, not its outcome, and the set-aside copy is deleted too (`store.js:468`).

**F-WSP-006, rationale.** As it stands, deleting a folder removes filing, never the entities filed in it. Proposed, deleting a folder deletes what is filed in it, as F-WSP-007 states, and the confirmation lists it first. Why, the rationale contradicts F-WSP-007 and the code. The comment at `flows.js:424` to `425` says the same old thing and should follow.

**F-MOD-010.** As it stands, when the user imports picks from a catalogue, the software shall copy the picked entities into the project under the selected node, with their filing among themselves and the relationships among them. Proposed, add, and shall clear from the copies any attribute content the choices in force do not present, after the warning a file receives on opening. Why, the copies carry attribute content verbatim (`library.js:174`) and pass no hidden-content check (`flows.js:828` to `838`), so a catalogue holding ratings under another method would bring into the project what N-SEC-005 forbids the file to hold. The shipped catalogue holds legislation only and cannot today, see finding 5.

**F-MOD-011.** As it stands, one sentence with a When clause and a While clause, tagged event driven. Proposed, tag it complex, or split it in two, the record on save as event driven and the flag while the record no longer matches as state driven. Why, the tag should match the clauses.

**F-VIE-001.** As it stands, the software shall generate exportable views of the model. Proposed, the software shall generate views of the model that can be printed. Why, exportable is undefined and the pane offers Print (`views.js:241`). When an export is built, a requirement can name it.

**F-DRW-003.** As it stands, where the user has consented, when the user creates or edits a drawing. Proposed, while the user's consent stands, when the user creates or edits a drawing. Why, consent is a state, and the optional-feature keyword is for a feature a product may lack. The bounds in F-DRW-004 of 2.4 take the page count out of the code alone.

**F-PER-008.** As it stands, in the functional class. Proposed, move it to the constraints as C-DEV-008 with the same text. Why, it binds the maintainer's changes, not the software's behaviour, and is verified by review.

**F-PER-011.** As it stands, an event-driven requirement for a function that does not exist. Proposed, keep the text and mark its status as not built, and add to the rationale that the page's policy must gain `connect-src 'self'` when it is built. Why, the conflict with the policy is otherwise invisible to the next reader, and the status field of 2.6 is where a planned function belongs.

**N-OPS-002, rationale.** As it stands, which functions fetch, and what each may fetch, is stated with the function. Proposed, add, a resource of the software's own opened from the host on the user's request, such as the metamodel image or a licence text, is not a fetch from outside and needs no statement. Why, the letter of the requirement forbids `flows.js:893` and the About links, and the rationale of F-PER-011 already reasons that a request to the host carries nothing of the user's.

**N-SEC-004.** As it stands, and shall accept messages only from that frame and origin, as data. Proposed, add, and shall send the frame no referrer. Why, the frame is created with `referrerpolicy="no-referrer"` (`drawing-editor.js:353`) and the fact deserves a statement.

**N-CMP-001.** As it stands, the software shall be operable on desktop-sized viewports, with the minimum deferred to implementation. Proposed, the software shall be operable on viewports at least 1000 pixels wide and 356 pixels tall. Why, the minimum is set (`index.html:194`, `style.css` media query) and F-APP-001 refers to it.

**N-CMP-002.** As it stands, compatible with evergreen major web browsers. Proposed, add a baseline the rationale names, the current release of Chrome, Edge, Firefox and Safari at the time of the software's release. Why, a compatibility requirement without a baseline cannot fail.

### 2.6 The conventions

This section was added because the review found the conventions themselves promise something no requirement carries. The opening paragraph of the specification says each requirement carries an identifier, a rationale and a status. No requirement has a status, and the template in 1.6 has no line for one. The absence matters for F-PER-011, the one requirement for a function not yet built, which stands beside the built ones with nothing to tell them apart. Two ways resolve it. Either the template gains a status line, with values such as built, planned and retired, or the sentence drops the word status. The first is recommended, since the identifiers are append-only and a retired requirement then keeps its place with its status telling why.

## 3. Threat analysis

The threat analysis this audit made is now held and kept current in `docs/security.md`, whose identifiers it gave rise to. The analysis as audited, with every claim's file and line, stands in the history at commit `e7c5da8`. References in chapters 4 to 6 to sections 3.1 to 3.8 are to that text. What stays here is what the audit judged at commit `2338fc0`.

### 3.1 Scenarios as audited

| Audit | Model | Scenario | Feasibility | Impact | Risk | Verdict | Residual |
|---|---|---|---|---|---|---|---|
| S1 | SC-01 | A file runs code through a name | High | High | High | Blocked | None |
| S2 | SC-02 | A drawing in a file acts | High | High | High | Mitigated | Low |
| S3 | SC-03 | A link in a file runs code | High | High | High | Blocked | None |
| S4 | SC-04 | A file stops the tool | High | Low | Medium | Open | Medium |
| S5 | SC-05 | A file pollutes the runtime | High | High | High | Blocked | None |
| S6 | SC-06 | A file hides content | High | Medium | High | Mitigated | Low |
| S7 | SC-07 | A file lies | High | High | High | Open | High, accepted |
| S8 | SC-08 | A compromised editor reads the drawing | Low | Medium | Low | Mitigated | Low |
| S9 | SC-09 | A compromised editor returns a weapon | Low | High | Medium | Blocked | Low |
| S10 | SC-10 | A compromised editor wedges the session | Medium | Medium | Medium | Open | Medium |
| S11 | SC-11 | A compromised editor escapes the frame | Low | High | Medium | Blocked | Low |
| S12 | SC-12 | A network attacker alters the software | Low | High | Medium | Blocked | Low |
| S13 | SC-13 | Another site reaches into the software | High | Low | Medium | Mitigated | Low |
| S14 | SC-14 | A person at the machine reads the project | Medium | High | High | Open | High, accepted |
| S15 | SC-15 | A hostile commit reaches the origin | Low | High | Medium | Mitigated | Medium |
| S16 | SC-16 | The host puts code on the origin | Low | High | Medium | Open | Medium |
| S17 | SC-17 | A file carries consent | High | Medium | High | Blocked | None |

## 4. Findings

The findings of both parts, ranked by severity. Size is the effort of the change. Small is one module or one document and under a day. Medium is several modules or a requirement with tests. Large is a design change.

| No. | Severity | Finding | Where | Why it matters | Change | Size |
|---|---|---|---|---|---|---|
| 1 | Medium | A valid file deep or large enough makes the loader throw, and the error escapes the open flow with no statement. | `files.js:157` to `171`, `model.js:76`, `flows.js:757` | F-PER-006 promises a statement for a file that cannot be opened, and the user gets silence. Measured at 50,000 levels in the shell. | In `files.js`, catch any error in `openProject` and `loadProject` and return the invalid refusal. Consider an iterative walk and a children index so a large file opens in seconds. Requirement N-SEC-009 in 2.4. | small |
| 2 | Medium | A `save` event from the editor before Apply exports the drawing, drops it, and leaves Apply dead until Cancel. | `drawing-editor.js:217`, `369`, `412` to `416` | The user's edits in the editor are lost if the editor sends `save` on its own shortcut, and a compromised editor can do it at will. | In `drawing-editor.js`, let `onDone` resolve the edit whether or not Apply was pressed, or refuse the unsolicited save and stay editing. Confirm in the browser whether the editor sends `save` on its shortcut. | small |
| 3 | Low | The drawing check reads `href` but not `src`, misses a CSS escape in `url()`, and misses an animation or `set` element that rewrites `href` or an event attribute. | `drawing.js:191`, `245` to `250` | F-DRW-001 says no reference outside the document. The image rendering blocks every case today, so the check is defence in depth with three holes. | In `drawing.js`, treat `src` as `href`, refuse `attributeName` values that name `href` or begin with `on`, and unescape CSS before matching. Add the probe's cases to `test-drawing.js`. | small |
| 4 | Low | The page cannot forbid framing, and the software's own response headers are unverified behind the gate. | `index.html:5`, the host | A framed copy is clickable and can be shown as another site's, with an empty partitioned store. | A `_headers` file in `app/` for Cloudflare Pages carrying `Content-Security-Policy: frame-ancestors 'none'`, `Strict-Transport-Security` and `X-Content-Type-Options: nosniff`, inert on any other host. Requirement N-SEC-007 in 2.4. | small |
| 5 | Low | An import copies attribute content verbatim and passes no hidden-content check. | `library.js:174`, `flows.js:828` to `838` | N-SEC-005 forbids a file to hold what the choices in force do not present. The shipped catalogue cannot trigger it today, a user library could. | In `flows.js`, run the hidden-content question over the copies before the commit, as `openProjectFlow` does. Change to F-MOD-010 in 2.5. | small |
| 6 | Low | F-PER-011 requires a fetch the page's policy forbids, for a function that does not exist. | `specs/requirements.md`, `index.html:5` | A reader of the specification believes a template function exists. A builder of it will hit the policy. | Mark the status and record the policy change, see 2.5 and 2.6. | small |
| 7 | Low | Six controls the software relies on have no requirement, the policy, restoration failure, persistence failure, the hyperlink rule, asset provenance and vulnerability reporting. | `index.html:5`, `store.js:381`, `shell.js:332`, `fields.js:190`, `assets/*/ORIGIN.md`, `SECURITY.md` | What no requirement asks for can be removed without a failing document, and the pins that hold them cite no id. | Paste the requirements of 2.4. | medium |
| 8 | Low | The conventions promise a status per requirement and none carries one. | `specs/requirements.md:3` | A planned function cannot be told from a built one. | A status line in the template, see 2.6. | small |
| 9 | Low | Rationales and comments that no longer describe the software. | F-WSP-006, F-APP-002, C-TEC-004, C-TEC-005, `flows.js:424` | A reader trusts the rationale and is misled. | The changes of 2.5 and one comment. | small |
| 10 | Low | No record ties a release to a passed test run, and the host deploys main on push. | The release process | The source pins are the guard against a widened surface, and they guard only when run. | Run `./run.sh` and the console check before every merge to main and say so in the release notes. Requirement C-DEV-006 in 2.4. | small |
| 11 | Low | The host's settings and the software's own response headers are unverified, and the gate still stands. | The host | The host can inject code the policy trusts, reports network errors to itself, and the gate the notes say was to go still answers. | Review the host's settings as chapter 5 lists them and confirm the gate's intended state. Requirement C-DEV-007 in 2.4. | small |
| 12 | Low | N-OPS-002's letter forbids the metamodel image and the licence texts opened from the host. | `flows.js:893`, `about.js:66`, `97`, `98` | A requirement the software breaks by design teaches the reader to discount it. | The rationale change in 2.5. | small |
| 13 | Low | Ten requirements cannot be settled by a test as written. | G-SYS-001, N-ACC-001, N-CMP-001, N-CMP-002, F-VIE-001, F-SES-001, F-SES-003, F-MOD-011, F-DRW-003, F-APP-001 | A requirement no test can fail is a statement of intent, not a requirement. | The changes in 2.5, and a stated baseline for N-CMP-002. | medium |

### 4.1 What is done well

This section was added because a list of findings alone misrepresents the software. The controls that matter most are structural and hold. Text reaches the page through one function and one property. The only parser of foreign data is `JSON.parse` behind a validator that refuses every key the schema does not name. The drawing is rendered where markup cannot act, and checked before that by a parser written to refuse rather than repair. The one external application runs on another origin in a frame that can do nothing but run, is loaded only after consent, receives one drawing, and is heard only through a filter. The policy on the page states all of it where the browser reads it. Consent lives in one session and no file. Nothing is read from the address. Each of these is pinned by a test that reads the source, so a change that undoes one fails a run.

## 5. Verification plan

Each item names what is verified and how. Headless means a test in `tests/` run by `./run.sh`. Pin means a block of `test-pins.js` that reads the source. Drive means the software opened in a browser and driven by hand or by the headless Chrome driver. Review means reading a document or a setting. Manual means steps no script covers.

| No. | Item | Method | How |
|---|---|---|---|
| V1 | The policy is declared first and permits what N-SEC-006 states. | Pin | `test-pins.js`, the block The page states its content security policy first. |
| V2 | No module builds markup from text or evaluates text. | Pin | `test-pins.js`, the block No module builds or parses markup from text. |
| V3 | Every string reaches the page as text. | Review and pin | Read `dom.js:15` to `24`. The pin of V2 catches the four sinks. |
| V4 | The gates run newer, invalid, older. | Headless | `test-files.js`, the block The gates, in order. |
| V5 | The validator refuses unknown keys, wrong types and broken constraints. | Headless | `test-validator.js`, the blocks Keyword mutations and The fixtures. |
| V6 | A `__proto__` key in a file pollutes nothing. | Headless, to add | A check in `test-validator.js` that loads a file with such an attribute key and reads `({}).polluted`. |
| V7 | The drawing check refuses what F-DRW-001 names. | Headless | `test-drawing.js`, the block What is refused, and why. Add the five accepted probes of 3.5 once finding 3 is fixed. |
| V8 | A drawing reaches the browser only as an image from a data URL. | Pin, to add, and drive | Pin `drawing-cell.js:59` for `dataUrl` in an `img`. Drive, load the example, select a system element, inspect the picture's element and source. |
| V9 | The frame is one, sandboxed, on the editor's origin, without referrer. | Pin | `test-pins.js`, the block The one frame, sandboxed, on the editor's origin. |
| V10 | Messages are accepted only from the frame and origin as data. | Headless | `test-drawing-editor.js`, the block What is heard. |
| V11 | The session posts one drawing and checks what returns. | Headless | `test-drawing-editor.js`, the block The session, against a fake frame. |
| V12 | Consent is asked before the frame loads, kept for the session, and withdrawn from About. | Drive | Create a drawing, expect the dialog naming the origin, tick the box, continue, cancel. Edit again, expect no dialog. Open About, expect Forget, press it, edit again, expect the dialog. Open a new tab, expect the dialog. |
| V13 | A hyperlink is a link only for a web address. | Headless | `test-editor.js`, the block A hyperlink is presented as a link only when it is a web address. |
| V14 | Every outward link leaves without an opener. | Pin | `test-pins.js`, the block Nothing leaves the page but by a link the user follows. |
| V15 | Nothing is fetched after load until the editor is opened. | Pin and drive | The pin of V14. Drive with the network panel open, load, work for a minute, expect requests to the host only, then open a drawing and expect the editor's origin only. |
| V16 | Storage values are accepted as literals and typed. | Pin and headless | `test-pins.js`, the block The pre-paint theme script. `test-store.js`, the blocks on session state. |
| V17 | Clear stored data removes everything. | Headless and drive | `test-store.js`, the block Clear browser data forgets everything. `test-flows.js`, the block Clear browser data asks, then forgets. Drive, run it, open the storage inspector, expect the database's records and the session keys gone. |
| V18 | Hidden content is cleared on opening and stated when unknown. | Headless and pin | `test-project.js` and `test-flows.js`, the blocks naming N-SEC-005 and F-PER-010. `test-pins.js`, the block The shipped data opens without a question. |
| V19 | A blob that fails to load is set aside and stated. | Headless | `test-store.js`, the block A blob that fails to load is set aside. |
| V20 | A refused persist is told and the leave prompt fires only then. | Headless | `test-store.js`, the block A failing persist. `test-shell.js`, the block The leave-prompt fires exactly when leaving costs something. |
| V21 | The saved filename is a slug. | Headless | `test-files.js`, the block The filename. |
| V22 | Nothing is read from the address. | Pin, to add | A pin that no module names `location.search`, `location.hash` or `window.name`. |
| V23 | Finding 1, a deep or large file is refused with a statement. | Headless, to add, and drive | A check in `test-files.js` that a file 50,000 levels deep returns a refusal and throws nothing. Drive, open such a file, expect the dialog and the project unchanged. |
| V24 | Finding 2, a save from inside the editor is taken or refused, never dropped. | Manual | Open a drawing, draw a shape, press the editor's save shortcut inside the frame, then press Apply. Expect the drawing in the draft, or a note that the editor's save is not Apply. Repeat with the fix. |
| V25 | Finding 3, the five accepted probes are refused. | Headless, to add | The cases of 3.5 in `test-drawing.js`, a `src` in embedded HTML, an escaped `url()`, a `video` source, an `animate` naming `href`, a `set` naming an event attribute. |
| V26 | Finding 4, the software cannot be framed and its responses carry the headers. | Manual | Fetch the page's headers with the gate's login or after its removal. Expect `content-security-policy` with `frame-ancestors 'none'`, `strict-transport-security` and `x-content-type-options: nosniff`. Serve a local page on another origin that frames the software and expect the browser to refuse. |
| V27 | Finding 5, an import clears hidden content after a question. | Headless, to add | A catalogue fixture holding a rating under a method the project does not use, imported through the flow, expecting the question and the cleared keys. |
| V28 | Finding 10, a release follows a passed run. | Review | The release notes of each tag name the run. |
| V29 | Finding 11, the host serves the commit's bytes and injects nothing. | Manual | For each file under `app/`, fetch it from the host and compare its hash with `git show <tag>:app/<path>`. In the host's settings, expect Rocket Loader, Auto Minify, Email Address Obfuscation, Mirage and Web Analytics injection off, and decide Network Error Logging. Confirm whether the gate and the access policy on the preview address are meant to stand. |
| V30 | The page opens with no console error or warning. | Manual | As `CLAUDE.md` states, serve `app/` locally, open the page, open the console, load the example, open every view and a drawing, expect nothing. A policy violation appears here. |
| V31 | The requirements changes are made. | Review | `specs/requirements.md` holds the blocks of 2.4 and the changes of 2.5, and the template holds a status line. |
| V32 | Asset provenance is recorded. | Pin and review | `test-pins.js`, the block Every glyph drawn is in the sprite, with its provenance. Read `assets/fonts/ORIGIN.md` against the fonts present. |
| V33 | The vulnerability reporting channel stands. | Review | `SECURITY.md` names the channel, the scope, the versions and the aim, and GitHub's private reporting is enabled on the repository. |
| V34 | The stored project is readable on the device, as accepted. | Manual | Open the storage inspector, find the database `openconformity`, the store `retention`, the record `project`, and read it. Record the fact for the residual risk. |
| V35 | The drawing bounds are refused with a reason. | Headless | `test-drawing.js`, the block What is refused, and why, for the dimension and the entity declaration. `test-drawing-editor.js`, the session block, for two pages. |

## 6. Verification results

The plan was run on 27 September 2026 against commit `eedb546`, with the test suite reporting every check passed in all 27 files. An item marked Open waits on the host or on the maintainer, and says which.

| Item | Date | Run by | Result | Remarks |
|---|---|---|---|---|
| V1 | 2026-09-27 | Claude Code | Passed | The pin of the policy passes. The requirement now stands as N-SEC-006. |
| V2 | 2026-09-27 | Claude Code | Passed | The pin passes. |
| V3 | 2026-09-27 | Claude Code | Passed | `dom.js:15` to `24` sets text through `textContent` and attributes through `setAttribute` only. |
| V4 | 2026-09-27 | Claude Code | Passed | `test-files.js` passes. |
| V5 | 2026-09-27 | Claude Code | Passed | `test-validator.js` passes. |
| V6 | 2026-09-27 | Claude Code | Passed | Added to `test-validator.js` and `test-files.js`. A prototype key at the root or in an attribute set reaches no prototype. |
| V7 | 2026-09-27 | Claude Code | Passed | `test-drawing.js` passes with the five probes of 3.5 added under V25. |
| V8 | 2026-09-27 | Claude Code | Passed | Pinned in `test-pins.js`. Driven, the card holds a button and an image whose source is a data address, and the page holds no drawing as markup, object or frame. |
| V9 | 2026-09-27 | Claude Code | Passed | The pin passes. |
| V10 | 2026-09-27 | Claude Code | Passed | `test-drawing-editor.js` passes. |
| V11 | 2026-09-27 | Claude Code | Passed | `test-drawing-editor.js` passes. |
| V12 | 2026-09-27 | Claude Code | Passed | Driven. The first edit asks, the ticked box keeps the choice for the session, the second edit opens without asking, About offers Forget, and the edit after Forget asks again. A new tab was not driven, since the browser gives each tab its own session storage. |
| V13 | 2026-09-27 | Claude Code | Passed | `test-editor.js` passes. |
| V14 | 2026-09-27 | Claude Code | Passed | The pin passes. |
| V15 | 2026-09-27 | Claude Code | Passed | Driven with the network recorded. Before the editor, requests went to the host and to data addresses only. Opening the consent dialog sent nothing. After Continue, the one new origin was the editor's. |
| V16 | 2026-09-27 | Claude Code | Passed | `test-pins.js` and `test-store.js` pass. |
| V17 | 2026-09-27 | Claude Code | Passed | Headless blocks pass. Driven, after Clear stored data the database holds no record and neither storage holds a key, and the landing shows. |
| V18 | 2026-09-27 | Claude Code | Passed | The blocks pass. |
| V19 | 2026-09-27 | Claude Code | Passed | `test-store.js` passes. |
| V20 | 2026-09-27 | Claude Code | Passed | `test-store.js` and `test-shell.js` pass. |
| V21 | 2026-09-27 | Claude Code | Passed | `test-files.js` passes. |
| V22 | 2026-09-27 | Claude Code | Passed | Added to `test-pins.js`. The one write to the address opens the mail client and is pinned as the only one. |
| V23 | 2026-09-27 | Claude Code | Passed | Fixed in `9f4b4f3` and `144a814`. A file 50,000 levels deep is refused by the filing depth of 1,000 in well under two seconds. Driven, a file of 1,001 levels is refused with the dialog naming the node and the project unchanged, and one of 1,000 opens, autosaves, reloads and saves. |
| V24 | 2026-09-27 | Claude Code | Passed | Fixed in `9f4b4f3`. Driven, the editor's save shortcut inside the frame closes the editor and puts the drawing in the draft, with the edit still open. |
| V25 | 2026-09-27 | Claude Code | Passed | Fixed in `9f4b4f3`. The five probes and three more are refused in `test-drawing.js`, and an embedded image and a harmless animation still pass. |
| V26 | 2026-09-27 | Claude Code | Open | Fixed in `9f4b4f3` with `app/_headers`, pinned in `test-pins.js`. The host still answers with the gate, so the software's own headers can be read only once the gate is down. The maintainer runs the check then. |
| V27 | 2026-09-27 | Claude Code | Passed | Fixed in `9f4b4f3`. `test-flows.js` imports picks holding hidden values, expecting the question, the cleared keys and one undo. |
| V28 | 2026-09-27 | Claude Code | Open | No release has been made since the review. Checked at the release of v1.0.0-beta.1. |
| V29 | 2026-09-27 | Claude Code | Open | The host answers with the gate, so the files cannot be compared. The host settings are the maintainer's to read. Checked at the release. |
| V30 | 2026-09-27 | Claude Code | Passed | Driven over the example, every view, a drawing and the editor. The console held no error or warning. |
| V31 | 2026-09-27 | Claude Code | Passed | Made in `9ef6efb`, with these departures. C-TEC-009 was folded into C-TEC-005. F-DRW-004 was left out, since F-DRW-001 states the bounds and F-DRW-003 the page. The import clearing went to the rationale of N-SEC-005 rather than F-MOD-010. F-SES-001, F-VIE-001, N-CMP-001 and N-CMP-002 were kept as goals, and F-PER-008 kept its place and id. The conventions dropped the word status rather than add a status line. F-MOD-003 was resolved by moving the attributes document to `specs/`. |
| V32 | 2026-09-27 | Claude Code | Passed | The pin passes. `assets/fonts/ORIGIN.md` names the three font files present, with their versions and source. |
| V33 | 2026-09-27 | Claude Code | Open | `SECURITY.md` names the channel, the scope, the versions and the aim. Whether private vulnerability reporting is enabled is the maintainer's to confirm in the repository settings. |
| V34 | 2026-09-27 | Claude Code | Passed | Driven. The database `openconformity` holds the record `project` in the store `retention`, readable as the project file in plain text. Recorded as accepted in 3.7. |
| V35 | 2026-09-27 | Claude Code | Passed | `test-drawing.js` and `test-drawing-editor.js` pass. |

## 7. Follow-up

This chapter was added to close the loop on the findings. The software was checked again at commit `e7c5da8`, after the fixes in `9f4b4f3`, the requirement changes in `9ef6efb`, the filing depth limit in `144a814` and the pins in `eedb546`. Three probes were run in the test shell, and one request read the live page's headers.

### 7.1 The findings

| No. | Status | Where | Remarks |
|---|---|---|---|
| 1 | Partly closed | `files.js:196` to `201`, `validator.js:16`, `336` to `359` | Deep files are refused and an escaping error ends in a refusal. A wide file still freezes the tab, see B. |
| 2 | Closed | `drawing-editor.js:361`, `371`, `388` | An editor save before Apply ends the edit with the checked drawing in the unsaved draft. |
| 3 | Closed for the named cases | `drawing.js:20`, `192` to `193`, `250` to `259` | Six other references still pass, see C. |
| 4 | Partly closed | `app/_headers` | The file is present and pinned. The gate still answers, so the software's own headers are unread. |
| 5 | Closed | `flows.js:834` to `858` | A trial import, the question, the clearing and one undo. |
| 6 | Closed | F-PER-011 | The rationale says the function is not built and names the policy change it needs. |
| 7 | Closed | C-PRJ-006, C-TEC-005, F-SES-004 to F-SES-006, N-SEC-006, N-SEC-008 | |
| 8 | Closed | The conventions | The word status was dropped. |
| 9 | Closed | F-WSP-006, F-APP-002, C-TEC-004, C-TEC-005, `flows.js` | |
| 10 | Partly closed | C-DEV-006 | The requirement stands. No release has been made under it. |
| 11 | Open | C-DEV-007, the host | The host's settings are unread, the gate stands, and the page still sends network error logging headers. |
| 12 | Closed | N-OPS-002 | |
| 13 | Partly closed | F-SES-003, F-MOD-011, F-DRW-003 | These three were changed. F-SES-001, F-VIE-001, F-APP-001, N-CMP-001, N-CMP-002, G-SYS-001 and N-ACC-001 stay as goals, by the maintainer's choice. |

### 7.2 The scenarios

| Audit | Model | Status at `e7c5da8` |
|---|---|---|
| S1, S3, S5, S9, S11, S17 | SC-01, SC-03, SC-05, SC-09, SC-11, SC-17 | Blocked, unchanged. |
| S2 | SC-02 | Mitigated, with fewer gaps in the check. |
| S4 | SC-04 | Blocked for deep files, open for wide ones. |
| S6 | SC-06 | Mitigated, and an import is now covered. |
| S7, S14 | SC-07, SC-14 | Accepted, unchanged. |
| S8 | SC-08 | Mitigated, unchanged. |
| S10 | SC-10 | Blocked. |
| S12, S13 | SC-12, SC-13 | Mitigated, the headers waiting on the gate. |
| S15 | SC-15 | Mitigated. The pins now cover the static file set, the imports and the page's scripts. |
| S16 | SC-16 | Open, unchanged. |

### 7.3 New findings

| No. | Severity | Finding | Where | Change | Size |
|---|---|---|---|---|---|
| A | Low | The software can write a file it then refuses. Filing checks no depth, so a probe filed 1,001 folders and the file it wrote was refused on opening. The stored project would fail to restore the same way, and an import into such a project does nothing without a word. | `model.js:267`, `flows.js:836` | In `model.js`, check the depth when filing, placing and creating, and when an import copies. | small |
| B | Low | A wide file freezes the tab. Serialising calls `childrenOf` for every node and runs on every persist. It took 0.2 seconds at 5,000 entities and 3.2 seconds at 20,000, so a file of 100,000 would block the tab for minutes after opening, with no statement. | `files.js:52`, `model.js:75`, `store.js:237` | In `files.js`, group the children once per serialise, or refuse a file past a node limit beside the depth limit. | small to medium |
| C | Low | The drawing check still accepts six outside references, an `href` on `feImage` or `pattern`, a `link` in embedded HTML, `srcset`, `poster`, and a CSS `image-set` without `url()`. The image rendering blocks all six. | `drawing.js:254` to `259`, `192` | In `drawing.js`, refuse any `href`, `src`, `srcset` or `poster` that is not local or an image as data on any element but `a`, and `image-set` in the style check. | small |
| D | Low | The schema's description omits the filing depth limit that the validator and the rationale of F-PER-006 state. | `specs/project.schema.json` | Add to its list of constraints the line below. | small |
| E | Very low | The restore path loads the stored project without clearing content under choices not in force. Only someone who altered the browser's storage reaches it. | `store.js:321` | Accepted as SC-18 of the model. | none |

The line for finding D reads as follows, for the maintainer to paste.

    - Filing is no deeper than 1,000 levels, counting a node at the root as the first level.

## 8. References

| No. | Reference | Link |
|---|---|---|
| [1] | Easy Approach to Requirements Syntax (EARS) | https://alistairmavin.com/ears/ |
| [2] | INCOSE Guide to Writing Requirements V4, Summary Sheet | https://www.incose.org/wp-content/uploads/legacy/working-groups/requirements-wg/guidetowritingrequirements/incose_rwg_gtwr_v4_summary_sheet.pdf |
| [3] | Microsoft, The STRIDE Threat Model | https://learn.microsoft.com/en-us/previous-versions/commerce-server/ee823878(v=cs.20) |
| [4] | W3C, Content Security Policy Level 3, the meta element and frame-ancestors | https://www.w3.org/TR/CSP3/#meta-element |
| [5] | WHATWG, HTML Living Standard, the iframe sandbox attribute | https://html.spec.whatwg.org/multipage/iframe-embed-object.html#attr-iframe-sandbox |
| [6] | draw.io, Embed mode | https://www.drawio.com/doc/faq/embed-mode |
| [7] | draw.io, Configure the diagram editor | https://www.drawio.com/doc/faq/configure-diagram-editor |
| [8] | Cloudflare Pages, Headers | https://developers.cloudflare.com/pages/configuration/headers/ |
| [9] | Cloudflare, Network Error Logging | https://developers.cloudflare.com/network-error-logging/ |
| [10] | openconformity, SECURITY.md | ../SECURITY.md |
| [11] | Web Content Accessibility Guidelines (WCAG) 2.2 | https://www.w3.org/TR/WCAG22/ |
| [12] | MDN, State Partitioning | https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/State_Partitioning |
| [13] | openconformity, Security model | ../docs/security.md |
