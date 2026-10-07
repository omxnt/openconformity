# Security

This document holds the security model of openconformity as software, read forward from threats to requirements. The system is described, each boundary is put to the STRIDE questions [1], and threats are joined into rated scenarios that name the controls they demand. Each control is stated as a requirement would be and names the requirement in `specs/requirements.md` that holds it, where it is implemented, and how it is verified in `docs/verification.md`. A control with no requirement is a gap, and the control is the proposal. The evaluation says what remains of each scenario, whether that is acceptable, on what ground, and what would reopen it. Each link is written once and points forward. A status holds only while the release check passes, which makes the model a loop, and an audit in `reviews/` checks the software against it at one commit.

## 1. Conventions

### 1.1 Identifiers

Each row carries an identifier of a prefix and two digits. Identifiers are append-only. A row that no longer applies keeps its identifier and says Retired.

| Prefix | What it names |
|---|---|
| AU | An assumption the model rests on |
| AS | An asset |
| TB | A trust boundary |
| TA | A threat actor |
| EP | An entry point, where data or code crosses a boundary |
| TH | A threat |
| CT | A control |
| SC | An attack scenario |
| TR | A trust the user places |

### 1.2 Feasibility

The feasibility is how easily an attacker reaches the scenario, rated before the controls act.

| Feasibility | Meaning |
|---|---|
| Low | It needs a compromise of a party the software trusts, access to the device, or conditions the attacker cannot arrange. |
| Medium | It needs the user to act once, such as opening a file or consenting to the editor. |
| High | Any visitor or any file reaches it with no condition. |

### 1.3 Impact

The impact is what the scenario costs the user if it succeeds, rated before the controls act.

| Impact | Meaning |
|---|---|
| Low | An annoyance without loss. |
| Medium | The loss of unsaved work, or the exposure of one drawing. |
| High | Project content read or altered without the user knowing, or code run on the user's device. |

### 1.4 Risk

The risk is the two ratings combined.

| Risk | When |
|---|---|
| High | One of the two is High and the other at least Medium. |
| Medium | Both are Medium, or one is High and the other Low. |
| Low | Otherwise. |

### 1.5 Verdict

The verdict is what the controls do to the scenario.

| Verdict | Meaning |
|---|---|
| Blocked | The software stops it. |
| Mitigated | The software reduces it and a residue stays. |
| Open | The software does nothing about it today. |

### 1.6 Status

The status is whether what remains of the scenario is acceptable, with a ground that says why.

| Status | Meaning | Ground |
|---|---|---|
| Closed | A control leaves nothing of the risk. | The controls that close it. |
| Accepted | Something of the risk remains and is tolerable. | The argument that makes it tolerable. |
| Open | Something remains to be done before the risk is closed or accepted. | What closes it. |

## 2. Scope

### 2.1 In scope

| Part | What it is |
|---|---|
| `app/` at the released commit | The software, as the host serves it. |
| `app/_headers` | The response headers the host applies to the software. |
| The main branch | The source the host deploys. |
| The release process | The checks a commit passes before it reaches main. |

### 2.2 Out of scope

| Part | Why | Where a report goes |
|---|---|---|
| The project site at `openconformity.org`, except its `security.txt`, which CT-32 relies on | Another origin and another deployment. | The maintainer, as `SECURITY.md` says. |
| draw.io's code at its origin | JGraph's software. | JGraph, as `SECURITY.md` says. |
| The browser | The vendor's software. | The vendor. |
| Cloudflare's and GitHub's own systems | Their services. | Cloudflare and GitHub. |
| The applications an exported file is opened in | The vendors' software, such as a spreadsheet or a Markdown viewer. | The vendor. |
| The user's device and the files the user saves | The user's to protect. | None. |

### 2.3 Assumptions

| Id | Assumption | What rests on it |
|---|---|---|
| AU-01 | The browser keeps origins apart, their pages, storage and windows. | TB-04, TB-05, TB-06 |
| AU-02 | A sandboxed frame can do only what its sandbox grants. | CT-09 |
| AU-03 | An SVG shown in an image element runs no script and loads no resource. | CT-08 |
| AU-04 | The browser enforces a content security policy declared on the page. | CT-15 |
| AU-05 | TLS and the certificate system hold for the software's and the editor's names. | SC-08, SC-12 |
| AU-06 | The browser partitions the storage of a page framed by another site. | SC-13 |
| AU-07 | `JSON.parse` creates own properties only and never touches a prototype. | CT-02, SC-05 |

### 2.4 What the user trusts

| Id | The user trusts | Ground | Scenarios |
|---|---|---|---|
| TR-01 | Their own device and browser | The software keeps the project there and nowhere else. | SC-14, SC-18 |
| TR-02 | The certificate system for the software's and the editor's names | Both are HTTPS and the browser checks them. | SC-08, SC-12 |
| TR-03 | The host, to serve the repository's files unchanged | The policy trusts the origin in full. Anyone can compare the served files with the commit. | SC-16 |
| TR-04 | The maintainer, to review what reaches main | The host deploys main on push. | SC-15 |
| TR-05 | JGraph's editor, with the one drawing they consent to hand it | The consent names the origin and the data. | SC-08 |
| TR-06 | The author of any file they open, for its content | The software checks structure, never truth. | SC-07 |
| TR-07 | The application an exported file is opened in, to treat text as text | The software writes every value as text and escapes what the format would read as syntax. | SC-19 |

## 3. System

### 3.1 Assets

| Id | Asset | Where it lives | What its loss costs | Rank |
|---|---|---|---|---|
| AS-01 | The project's content, the model, its attribute values and its drawings | Memory while the software runs, the stored project, the saved file, and the files a view is saved as | Disclosure hands out the product's design and its judgements. Silent alteration makes the conformity record a false statement the manufacturer signs. | 1 |
| AS-02 | What is stored in the browser, the project, the set-aside copy, the theme, the session state and the consent | IndexedDB, web storage and session storage of the software's origin | The project in it is AS-01. The consent decides whether the editor asks before it loads. | 2 |
| AS-03 | The integrity of the software the user runs, its files, its policy, its fixed editor origin and its checks | The host, and the browser's cache | Every other control stands on it. | 3 |
| AS-04 | The software's reputation | The users' trust | A leak or a file that runs code ends the trust a free tool for confidential data lives on. | 4 |

### 3.2 Trust boundaries

| Id | Boundary | Inside | Outside | Crossed at |
|---|---|---|---|---|
| TB-01 | The project file | The model built by the software's own functions | JSON text from anywhere, picked through the file input | `files.js` `openProject` and `loadProject`, `flows.js` `openProjectFlow` |
| TB-02 | The library catalogue | The copies in the project | A project-shaped object the software ships | `library.js` `libraryOf` and `importInto`, `flows.js` `importPicks` |
| TB-03 | The drawing | An image on a card | SVG text held in an attribute | `drawing-cell.js` `drawingCell`, `drawing.js` `checkDrawing` |
| TB-04 | The draw.io frame | The software's page and window | The editor at `https://embed.diagrams.net` in a sandboxed frame | `drawing-editor.js` `editDrawing`, `acceptMessage` and `createSession` |
| TB-05 | Browser storage | The store's state | What the browser holds for the origin | `store.js` `restore`, `install`, `persist` and `sessionRead`, `theme.js` |
| TB-06 | The page's own origin | Every module the page loads from `app.openconformity.org` | Every other origin, the project site and any preview address included | The page, `index.html` |
| TB-07 | The host | The files at the released commit | Cloudflare Pages and the network in front of it | Every response the host sends |
| TB-08 | The repository | The commit on main | GitHub, the maintainer's accounts, the assistant that proposes changes, and every contributor | The host's deployment of main on push |
| TB-09 | An exported file | The view the software built from the model | A spreadsheet, a Markdown viewer or a browser the software does not control, which opens the file | `views.js` `saveExcel` and `saveMarkdown`, `xlsx.js`, `markdown.js`, `zip.js` |

### 3.3 Actors

| Id | Actor | Has | Can | Wants |
|---|---|---|---|---|
| TA-01 | A hostile author of a project file | A text editor and the public schema | Write any JSON and send it to the user | Code on the user's device, a leak, a tool that fails, or content the user takes as their own |
| TA-02 | A hostile catalogue | Today, a way into the repository, as TA-08 | Ship entities with any attribute content | The same as TA-01 |
| TA-03 | A hostile drawing | SVG text in a file or returned by an editor | Hold any markup | Markup that runs, loads a resource or embeds a document |
| TA-04 | A compromised or impersonated editor origin | JGraph's deployment, or an answer for its name | Run any code in the frame, read what is handed over, post any message, return any text | The project, the device, or every user's drawings |
| TA-05 | Another site in the same browser | A page the user has open | Frame or open the software, post messages to it, link to it | The project, or a click the user did not mean |
| TA-06 | A person at the machine | The browser profile, or the unlocked session | Read and alter storage, downloads and history | The project |
| TA-07 | A network attacker | A place between the browser and the two origins | Read and alter plain traffic, try to answer for a name | Altered software or an altered editor |
| TA-08 | Someone in the supply chain | The maintainer's GitHub or Cloudflare account, an accepted diff, or the host's pipeline | Put code on main or on the origin | Their code on the origin, which the policy trusts |
| TA-09 | The host, as a party | The deployment, its settings and its logs | Observe every request, fail, or change what it serves | Nothing hostile. Named so that what it sees and what its failure costs have a row. |

### 3.4 Attack surface

| Id | Entry point | Direction | Boundary | Enters at |
|---|---|---|---|---|
| EP-01 | A project file the user picks | In | TB-01 | `flows.js` `openProjectFlow`, `files.js` `openProject` |
| EP-02 | The stored project, restored | In | TB-05 | `store.js` `restore` and `install` |
| EP-03 | The theme in web storage | In | TB-05 | `theme.js`, `store.js` `createStore` |
| EP-04 | The session storage values | In | TB-05 | `store.js` `sessionRead` and `createStore` |
| EP-05 | The shipped example | In | TB-08 | `flows.js` `loadExample` |
| EP-06 | The shipped catalogue | In | TB-02 | `library.js` `libraryOf` and `importInto`, `flows.js` `importPicks` |
| EP-07 | A drawing held in an attribute | In | TB-03 | `drawing-cell.js` `drawingCell` |
| EP-08 | A drawing the editor returns | In | TB-04 | `drawing-editor.js` `createSession` and `decodeExport` |
| EP-09 | A message to the window during an edit | In | TB-04 | `drawing-editor.js` `editDrawing` and `acceptMessage` |
| EP-10 | The editor's frame | In | TB-04 | `drawing-editor.js` `editDrawing` |
| EP-11 | A hyperlink attribute value | In | TB-01 | `editor.js` `valueNode`, `fields.js` `linkable` |
| EP-12 | Every other attribute value and name | In | TB-01 | `dom.js` `el` and `svg` |
| EP-13 | A drop on the tree | In | TB-06 | `navigator.js` `renderRow` and `render` |
| EP-14 | Keyboard shortcuts | In | TB-06 | `app.js`, the document's key listener |
| EP-15 | The page's address | In | TB-06 | Read nowhere |
| EP-16 | The page and its modules | In | TB-07 | `index.html` |
| EP-17 | A commit on main | In | TB-08 | The host's deployment |
| EP-18 | The drawing handed to the editor | Out | TB-04 | `drawing-editor.js` `createSession` |
| EP-19 | A link leaving the page | Out | TB-06 | `shell.js` `openLink`, `about.js` `showAbout`, `flows.js` `openMetamodel`, `index.html` |
| EP-20 | A saved file | Out | TB-01 | `flows.js` `saveProject`, `dom.js` `download`, `files.js` `filenameFor` |
| EP-21 | A view saved as a workbook | Out | TB-09 | `views.js` `saveExcel` and `viewSheets`, `xlsx.js` `workbook` |
| EP-22 | A view saved as Markdown, alone or in a zip with its diagrams as SVG files | Out | TB-09 | `views.js` `saveMarkdown` and `sectionMarkdown`, `markdown.js` `markdown`, `zip.js` `zip` |

## 4. Threats

### 4.1 TB-01 The project file

| Id | Class | Threat |
|---|---|---|
| TH-01 | Spoofing | A file can claim any name and content, and nothing in it identifies its author. By design, see SC-07. |
| TH-02 | Tampering | Anyone with the file can alter its content. Structure can be checked, content cannot. |
| TH-03 | Repudiation | The file records no author and no history, so no change can be held to anyone. By design. |
| TH-04 | Information disclosure | A file holds content its author cannot see, under choices not in force or unknown to this revision. |
| TH-05 | Denial of service | A file deep or wide enough to exhaust the browser. |
| TH-06 | Elevation of privilege | Markup or code in a value, a scheme that runs code in a link, or a prototype key. |

### 4.2 TB-02 The library catalogue

| Id | Class | Threat |
|---|---|---|
| TH-07 | Spoofing | None today. The catalogue is a module of the repository. |
| TH-08 | Tampering | Only through the repository. |
| TH-09 | Repudiation | None. The repository's history holds every change. |
| TH-10 | Information disclosure | Copies carry attribute content under choices not in force in the project. |
| TH-11 | Denial of service | None. The catalogue loads once per session on first use. |
| TH-12 | Elevation of privilege | The same as TH-06, through the same loader. |

### 4.3 TB-03 The drawing

| Id | Class | Threat |
|---|---|---|
| TH-13 | Spoofing | A drawing can carry any model, or none, and then cannot be edited again. |
| TH-14 | Tampering | A file author alters the drawing freely. |
| TH-15 | Repudiation | None. A drawing has no author but the file's. |
| TH-16 | Information disclosure | A reference to a resource outside the drawing reports the viewer's address when it loads. |
| TH-17 | Denial of service | A drawing large, deep or wide enough to exhaust the parser or the rasteriser. |
| TH-18 | Elevation of privilege | A script, a handler, an embedded document or an animated link in the markup. |

### 4.4 TB-04 The draw.io frame

| Id | Class | Threat |
|---|---|---|
| TH-19 | Spoofing | A message from another window or origin posing as the editor. An answer for the editor's name. |
| TH-20 | Tampering | The editor returns any text as the drawing. |
| TH-21 | Repudiation | None. The session is the user's own act. |
| TH-22 | Information disclosure | The editor receives the drawing's model, and would receive more if handed more. |
| TH-23 | Denial of service | The editor never becomes ready or never returns the drawing. |
| TH-24 | Elevation of privilege | The frame navigates the page, opens windows, submits forms or reads the software's storage. |

### 4.5 TB-05 Browser storage

| Id | Class | Threat |
|---|---|---|
| TH-25 | Spoofing | None. Only the software's origin writes its storage. |
| TH-26 | Tampering | A person at the machine alters the stored project. |
| TH-27 | Repudiation | None. |
| TH-28 | Information disclosure | The project stands in clear on the device, and the tab title carries its name into history. |
| TH-29 | Denial of service | The browser refuses writes, or the quota fills. |
| TH-30 | Elevation of privilege | A stored value read as code or as a structure the software trusts. |

### 4.6 TB-06 The page's own origin

| Id | Class | Threat |
|---|---|---|
| TH-31 | Spoofing | Any file served on the origin is the software to the policy. |
| TH-32 | Tampering | The same, through the host or the repository. |
| TH-33 | Repudiation | None. |
| TH-34 | Information disclosure | A preview address of the host is another origin where a user could store a project unknowingly. See chapter 6. |
| TH-35 | Denial of service | None beyond the host's. |
| TH-36 | Elevation of privilege | Another site frames the software, or links to it with a crafted address. |

### 4.7 TB-07 The host

| Id | Class | Threat |
|---|---|---|
| TH-37 | Spoofing | Another party answers for the software's name. |
| TH-38 | Tampering | The host rewrites a file or injects code under the origin. |
| TH-39 | Repudiation | The host's logs are the host's, and the software records nothing. None applies. |
| TH-40 | Information disclosure | The host sees requests, addresses and user agents, and may receive network error reports. It sees no project content. |
| TH-41 | Denial of service | The host is unavailable. Once loaded the software runs from what the browser holds. |
| TH-42 | Elevation of privilege | Code from the host is the software, and nothing stops it. |

### 4.8 TB-08 The repository

| Id | Class | Threat |
|---|---|---|
| TH-43 | Spoofing | A commit under the maintainer's name from a compromised account. |
| TH-44 | Tampering | A hostile change accepted in review, a vendored asset among them. |
| TH-45 | Repudiation | Authorship stands in the history, and the host verifies no signature. None applies, by design. |
| TH-46 | Information disclosure | None. The repository is public and holds no secret. |
| TH-47 | Denial of service | A broken commit on main is deployed within minutes. |
| TH-48 | Elevation of privilege | A commit on main is code the policy trusts in full. |

### 4.9 TB-09 An exported file

| Id | Class | Threat |
|---|---|---|
| TH-52 | Spoofing | None. A saved view carries no author, as a project file carries none. |
| TH-53 | Tampering | None. A saved view is the user's file from the moment it is written. |
| TH-54 | Repudiation | None. |
| TH-55 | Information disclosure | A saved view is the project's content in clear, on the device and wherever the user sends it. By design, see TR-01. |
| TH-56 | Denial of service | None. |
| TH-49 | Elevation of privilege | A value written as a formula, which a spreadsheet would run when a view saved from the file is opened. |
| TH-50 | Elevation of privilege | A value written as markup or as Markdown's own syntax, which a viewer would render as a link, an image loaded from an outside address, or a structure, when a view saved from the file is shown. |
| TH-51 | Elevation of privilege | A diagram saved beside a specification and opened on its own, where it is a document rather than an image. |

## 5. Scenarios

| Id | Scenario | Actor | Threats | Feasibility | Impact | Risk | Controls |
|---|---|---|---|---|---|---|---|
| SC-01 | A file runs code through a name or value. | TA-01 | TH-06, TH-12 | High | High | High | CT-01, CT-02, CT-03, CT-04, CT-15, CT-18 |
| SC-02 | A drawing in a file acts, runs script, loads a resource or embeds a document. | TA-03 | TH-14, TH-16, TH-18 | High | High | High | CT-07, CT-08, CT-15 |
| SC-03 | A hyperlink in a file runs code when clicked. | TA-01 | TH-06 | High | High | High | CT-01, CT-02, CT-03, CT-15, CT-18 |
| SC-04 | A file deep or wide enough stops the tool. | TA-01 | TH-05, TH-17 | High | Low | Medium | CT-03, CT-05, CT-07 |
| SC-05 | A file pollutes the runtime through a prototype key. | TA-01 | TH-06 | High | High | High | CT-01, CT-02, CT-03, CT-15, CT-18 |
| SC-06 | A file hides content the recipient signs off without seeing. | TA-01, TA-02 | TH-04, TH-10 | High | Medium | High | CT-06 |
| SC-07 | A file is altered and passed on as unchanged. | TA-01 | TH-01, TH-02, TH-03 | High | High | High | CT-03, CT-04 |
| SC-08 | A compromised editor reads the drawing handed to it. | TA-04 | TH-22 | Low | Medium | Low | CT-09, CT-11, CT-13 |
| SC-09 | A compromised editor returns a hostile drawing or a huge message. | TA-04 | TH-13, TH-20 | Low | High | Medium | CT-10, CT-12 |
| SC-10 | An editor save before Apply drops the drawing and wedges the session. | TA-04 | TH-20, TH-23 | Medium | Medium | Medium | CT-10, CT-12, CT-14, CT-28 |
| SC-11 | A compromised editor escapes the frame. | TA-04 | TH-24 | Low | High | Medium | CT-09, CT-10 |
| SC-12 | A network attacker alters the software in transit. | TA-07 | TH-37 | Low | High | Medium | CT-24 |
| SC-13 | Another site frames, messages or links into the software. | TA-05 | TH-19, TH-36 | High | Low | Medium | CT-10, CT-17, CT-19, CT-24 |
| SC-14 | A person at the machine reads the stored project. | TA-06 | TH-28 | Low | High | Medium | CT-23 |
| SC-15 | A hostile commit reaches the origin. | TA-08 | TH-07, TH-08, TH-43, TH-44, TH-48 | Low | High | Medium | CT-30, CT-31, CT-33, CT-34 |
| SC-16 | The host puts code on the origin. | TA-08 | TH-31, TH-32, TH-38, TH-42 | Low | High | Medium | CT-25, CT-29, CT-30, CT-31 |
| SC-17 | A file carries consent, or another editor origin. | TA-01 | TH-06, TH-22 | High | Medium | High | CT-01, CT-02, CT-03, CT-09, CT-11, CT-13, CT-15, CT-18 |
| SC-18 | A tampered stored project restores holding content under choices not in force. | TA-06 | TH-26, TH-30 | Low | Low | Low | CT-20, CT-21 |
| SC-19 | A file someone else wrote is opened, a view is saved from it, and the saved file runs a formula, loads from an outside address, becomes a link, or navigates away when opened. | TA-01 | TH-49, TH-50, TH-51 | Medium | High | High | CT-07, CT-35, CT-36 |
| SC-20 | The browser refuses to store the project, and unsaved work is lost with the tab. | None | TH-29 | Medium | Medium | Medium | CT-22 |
| SC-21 | A user works on a preview address of the host and stores a project there unknowingly. | TA-08 | TH-34 | Low | Medium | Low | CT-37 |
| SC-22 | The host observes who uses the software, from requests, addresses and user agents. | TA-09 | TH-40 | High | Low | Medium | CT-16 |
| SC-23 | A broken release or an outage stops the software for every new session. | TA-09 | TH-41, TH-47 | Low | Low | Low | CT-30 |

## 6. Controls

| Id | Control | Requirement | Implemented in | Verification | Coverage |
|---|---|---|---|---|---|
| CT-01 | Text shall reach the page only as text, and an attribute only by name the software fixes, so no value is read as markup. | [N-SEC-002](../specs/requirements.md#n-sec-002-safe-rendering) | `dom.js` `el` and `svg` | [test-editor.js](../tests/test-editor.js), [test-pins.js](../tests/test-pins.js) | Tested |
| CT-02 | Foreign text shall be parsed as data only, and nothing from a file or a message shall be evaluated. | [N-SEC-001](../specs/requirements.md#n-sec-001-safe-parsing) | `files.js` `openProject` | [test-drawing.js](../tests/test-drawing.js), [test-pins.js](../tests/test-pins.js), [test-validator.js](../tests/test-validator.js) | Tested |
| CT-03 | A file shall be refused on any unknown key, wrong type, broken reference, cycle, or filing deeper than the software itself can create. | [F-PER-006](../specs/requirements.md#f-per-006-invalid-file), [N-SEC-001](../specs/requirements.md#n-sec-001-safe-parsing) | `validator.js` `validate`, `model.js` `checkDepth` | [test-example.js](../tests/test-example.js), [test-files.js](../tests/test-files.js), [test-flows.js](../tests/test-flows.js), [test-model.js](../tests/test-model.js), [test-store.js](../tests/test-store.js), [test-validator.js](../tests/test-validator.js), [test-drawing.js](../tests/test-drawing.js), [test-pins.js](../tests/test-pins.js) | Tested |
| CT-04 | A file shall pass the gates in order, newer, invalid, older, then a replay through the model, before any of it reaches the project. | [F-PER-004](../specs/requirements.md#f-per-004-version-migration), [F-PER-005](../specs/requirements.md#f-per-005-unsupported-version), [F-PER-006](../specs/requirements.md#f-per-006-invalid-file) | `files.js` `loadProject` and `buildModel` | [test-files.js](../tests/test-files.js), [test-example.js](../tests/test-example.js), [test-flows.js](../tests/test-flows.js), [test-model.js](../tests/test-model.js), [test-store.js](../tests/test-store.js), [test-validator.js](../tests/test-validator.js) | Partly |
| CT-05 | Any error inside the gates shall end in a refusal, never in a partly opened file. | [N-SEC-009](../specs/requirements.md#n-sec-009-failure-on-opening) | `files.js` `loadProject` | [test-files.js](../tests/test-files.js), [test-flows.js](../tests/test-flows.js) | Tested |
| CT-06 | Content under choices not in force shall be cleared after a question when a file opens, the example loads, an import lands or the project saves, and unknown content shall be kept and stated. | [N-SEC-005](../specs/requirements.md#n-sec-005-no-hidden-content), [F-PER-010](../specs/requirements.md#f-per-010-attribute-preservation), [F-MOD-010](../specs/requirements.md#f-mod-010-library-import) | `flows.js` `clearHidden`, `stateUnknown`, `importPicks` and `saveProjectEdit`, `project.js` | [test-editor.js](../tests/test-editor.js), [test-example.js](../tests/test-example.js), [test-flows.js](../tests/test-flows.js), [test-model.js](../tests/test-model.js), [test-pins.js](../tests/test-pins.js), [test-project.js](../tests/test-project.js), [test-files.js](../tests/test-files.js), [test-library.js](../tests/test-library.js) | Tested |
| CT-07 | A drawing shall be refused unless it is inert when opened on its own, holding no script, handler, embedded document, refresh, form, outside reference or oversize dimension. | [F-DRW-001](../specs/requirements.md#f-drw-001-drawing-check) | `drawing.js` `checkDrawing` and `parseXml` | [test-drawing.js](../tests/test-drawing.js) | Tested |
| CT-08 | Inside the software a drawing shall be shown only as an image, never as a document. | [N-SEC-003](../specs/requirements.md#n-sec-003-drawing-rendering) | `drawing-cell.js` `drawingCell`, `drawing.js` `dataUrl` | [test-drawing.js](../tests/test-drawing.js), [test-pins.js](../tests/test-pins.js) | Tested |
| CT-09 | The editor shall run in one frame, created after consent, sandboxed to scripts on its own origin, with every device permission denied and no referrer sent. | [C-TEC-008](../specs/requirements.md#c-tec-008-external-application), [N-SEC-004](../specs/requirements.md#n-sec-004-external-application-isolation) | `drawing-editor.js` `editDrawing`, `FRAME_SANDBOX` and `FRAME_ALLOW` | [test-drawing-editor.js](../tests/test-drawing-editor.js), [test-pins.js](../tests/test-pins.js) | Tested |
| CT-10 | A message shall be heard only from the editor's frame and origin, within a size limit, holding JSON and a known event. | [N-SEC-004](../specs/requirements.md#n-sec-004-external-application-isolation) | `drawing-editor.js` `acceptMessage` | [test-drawing-editor.js](../tests/test-drawing-editor.js), [test-pins.js](../tests/test-pins.js) | Tested |
| CT-11 | The editor shall be handed one drawing's model and its configuration, and nothing of the project. | [N-PRV-007](../specs/requirements.md#n-prv-007-data-minimisation) | `drawing-editor.js` `createSession` | [test-drawing-editor.js](../tests/test-drawing-editor.js), [test-pins.js](../tests/test-pins.js) | Tested |
| CT-12 | A drawing the editor returns shall be decoded by the software's own decoder and checked as a file's drawing is, and a refusal shall keep the editor open. | [F-DRW-001](../specs/requirements.md#f-drw-001-drawing-check), [F-DRW-003](../specs/requirements.md#f-drw-003-external-drawing-editor) | `drawing-editor.js` `createSession` and `decodeExport` | [test-drawing.js](../tests/test-drawing.js), [test-actions.js](../tests/test-actions.js), [test-drawing-editor.js](../tests/test-drawing-editor.js), A drive | Partly |
| CT-13 | The consent shall name the service, its origin and the data handed over before the editor loads, and a choice not to be asked shall last the session alone and be withdrawable. | [N-PRV-005](../specs/requirements.md#n-prv-005-consent-to-hand-over-data), [N-PRV-006](../specs/requirements.md#n-prv-006-consent-scope) | `drawing-editor.js` `consent`, `store.js` `setConsented`, `about.js` `showAbout` | [test-store.js](../tests/test-store.js), A drive | Partly |
| CT-14 | The editor shall have a bounded time to become ready and to return the drawing, after which the session ends with the project unchanged. | [N-OPS-003](../specs/requirements.md#n-ops-003-fetch-failure) | `drawing-editor.js` `createSession` | [test-drawing-editor.js](../tests/test-drawing-editor.js) | Tested |
| CT-15 | The page shall declare its content security policy before anything loads, allowing scripts, styles and fonts from its origin alone and connections to none. | [N-SEC-006](../specs/requirements.md#n-sec-006-content-security-policy) | `index.html` | [test-pins.js](../tests/test-pins.js) | Tested |
| CT-16 | The software shall make no request but for its own files, and shall open no socket and send no beacon. | [N-PRV-002](../specs/requirements.md#n-prv-002-no-data-transmission), [N-OPS-002](../specs/requirements.md#n-ops-002-self-contained), [C-TEC-002](../specs/requirements.md#c-tec-002-no-dependencies), [N-PRV-001](../specs/requirements.md#n-prv-001-local-processing), [N-PRV-003](../specs/requirements.md#n-prv-003-no-user-tracking) | Every module, held by the pin in `test-pins.js` | [test-pins.js](../tests/test-pins.js), A drive | Partly |
| CT-17 | The software shall read nothing from the page's address. | [N-SEC-010](../specs/requirements.md#n-sec-010-no-input-from-the-address) | Every module, held by the pin in `test-pins.js` | [test-pins.js](../tests/test-pins.js) | Tested |
| CT-18 | A value shall become a link only for an http or https address, and shall open without an opener. | [N-SEC-008](../specs/requirements.md#n-sec-008-hyperlink-presentation) | `fields.js` `linkable`, `editor.js` `valueNode` | [test-editor.js](../tests/test-editor.js) | Tested |
| CT-19 | Every link the software draws shall open without an opener. | [N-PRV-002](../specs/requirements.md#n-prv-002-no-data-transmission), [N-OPS-002](../specs/requirements.md#n-ops-002-self-contained) | `shell.js` `openLink`, `about.js` `showAbout`, `flows.js` `openMetamodel`, `index.html` | [test-pins.js](../tests/test-pins.js), A drive | Partly |
| CT-20 | A value read from browser storage shall be accepted only as a literal of the type expected. | [N-CMP-002](../specs/requirements.md#n-cmp-002-browser-support) | `theme.js`, `store.js` `createStore` and `sessionRead` | [test-pins.js](../tests/test-pins.js), [test-store.js](../tests/test-store.js), A drive | Partly |
| CT-21 | The stored project shall pass the same gates as a file, and one that fails shall be set aside and stated. | [F-SES-001](../specs/requirements.md#f-ses-001-working-state), [F-SES-004](../specs/requirements.md#f-ses-004-restoration-failure), [N-PRV-004](../specs/requirements.md#n-prv-004-on-device-storage) | `store.js` `restore` and `install` | [test-files.js](../tests/test-files.js), [test-store.js](../tests/test-store.js), [test-flows.js](../tests/test-flows.js), A drive | Partly |
| CT-22 | A refused write shall be stated, the leave prompt shall fire while unsaved work is not stored, and a nearly full store shall be stated. | [F-SES-005](../specs/requirements.md#f-ses-005-persistence-failure), [F-SES-006](../specs/requirements.md#f-ses-006-storage-nearly-full) | `store.js` `persist` and `checkQuota`, `shell.js` `render` | [test-shell.js](../tests/test-shell.js), [test-store.js](../tests/test-store.js) | Tested |
| CT-23 | Clearing stored data shall remove everything the software keeps in the browser. | [F-SES-003](../specs/requirements.md#f-ses-003-browser-removal), [N-PRV-004](../specs/requirements.md#n-prv-004-on-device-storage) | `store.js` `clearBrowserData`, `flows.js` `clearBrowserData` | [test-flows.js](../tests/test-flows.js), [test-store.js](../tests/test-store.js), A drive | Partly |
| CT-24 | The host shall send headers that forbid framing, require HTTPS and forbid content sniffing. | [N-SEC-007](../specs/requirements.md#n-sec-007-framing) | `app/_headers` | [test-pins.js](../tests/test-pins.js), a review of both hosts at v1.0.0-beta.2 | Partly |
| CT-25 | The software shall be static files of the web platform, run by the browser from source, with no server-side code. | [C-TEC-001](../specs/requirements.md#c-tec-001-technology-stack), [C-TEC-004](../specs/requirements.md#c-tec-004-javascript-modules), [C-TEC-007](../specs/requirements.md#c-tec-007-no-server-side-code) | The files under `app/`, `index.html` | [test-pins.js](../tests/test-pins.js), A review | Partly |
| CT-26 | Retired. The tree shall act only on a drag it started itself. |  | `navigator.js` `renderRow` and `render` |  |  |
| CT-27 | Retired. A saved file's name shall hold letters, digits and dashes only. |  | `files.js` `filenameFor` |  |  |
| CT-28 | Nothing shall change the model while a drawing is open in the editor. | [F-DRW-003](../specs/requirements.md#f-drw-003-external-drawing-editor) | `actions.js` `createActions` | [test-actions.js](../tests/test-actions.js), [test-drawing-editor.js](../tests/test-drawing-editor.js), A drive | Partly |
| CT-29 | The host shall serve each file as the released commit holds it, with no feature that rewrites or injects, verified at each release. | [C-DEV-007](../specs/requirements.md#c-dev-007-deployment-integrity) | The host's settings | A review of every served file against the commit at v1.0.0-beta.2, 152 files identical | Manual |
| CT-30 | A commit shall reach main only after the test suite passes and the page opens with a clean console. | [C-DEV-006](../specs/requirements.md#c-dev-006-release-verification) | The release process | The release check at v1.0.0-beta.2 | Manual |
| CT-31 | Every change shall be reviewed by the maintainer before it enters the repository. | [C-DEV-008](../specs/requirements.md#c-dev-008-change-review) | The repository's working rules | A review of the repository's working rules and its history at each release | Manual |
| CT-32 | Vulnerabilities shall be reportable privately, with the scope, the accepted risks, how to test and a response aim published where tools look. | [C-PRJ-006](../specs/requirements.md#c-prj-006-vulnerability-reporting) | `SECURITY.md`, `.well-known/security.txt` on both origins, the repository's settings | [test-pins.js](../tests/test-pins.js), A review | Partly |
| CT-33 | Every third-party asset shall be recorded with its source, version and licence. | [C-TEC-005](../specs/requirements.md#c-tec-005-third-party-assets) | `app/assets/*/ORIGIN.md` | [test-pins.js](../tests/test-pins.js), A review | Partly |
| CT-34 | Every account that can change the repository or the host shall carry a second factor. | [C-DEV-009](../specs/requirements.md#c-dev-009-account-protection) | The accounts | A review of both accounts on 27 September 2026 | Manual |
| CT-35 | A saved workbook shall write every cell as text, never as a formula, and leave out what XML forbids. | [N-SEC-011](../specs/requirements.md#n-sec-011-safe-export) | `xlsx.js` `sheetXml` and `xmlText` | [test-markdown.js](../tests/test-markdown.js), [test-xlsx.js](../tests/test-xlsx.js) | Tested |
| CT-36 | A saved Markdown document shall escape markup and Markdown's own syntax in everything it carries, so no field becomes a link, an image, code or a structure. | [N-SEC-011](../specs/requirements.md#n-sec-011-safe-export) | `markdown.js` `markdownText` and `proseLine` | [test-markdown.js](../tests/test-markdown.js), [test-xlsx.js](../tests/test-xlsx.js) | Tested |
| CT-37 | The host shall deploy the software from main alone, with no preview deployment reachable at another address. | [C-DEV-010](../specs/requirements.md#c-dev-010-production-deployment-only) | The host's settings | A review of the host's settings on 27 September 2026 | Manual |


## 7. Evaluation

| Id | Verdict | What remains | Status | Ground | Reopened when |
|---|---|---|---|---|---|
| SC-01 | Blocked | None found. | Closed | CT-01, CT-02 | A text reaches the page by any way but `textContent`, or a value is evaluated. |
| SC-02 | Blocked | None found. Inside the software a drawing is shown only as an image, which runs nothing and loads nothing whatever the check missed. | Closed | CT-07, CT-08 | A drawing is shown by any way but an image element. |
| SC-03 | Blocked | None found. | Closed | CT-18 | A link the software draws follows a scheme other than http, https or mailto. |
| SC-04 | Mitigated | A valid file of a few thousand chained entities, under a megabyte, freezes the tab for seconds to minutes on opening and on every restore, since the replay of its relationships costs the cube of the chain. Found by the review of 5 October 2026 [11]. | Open | An owner index on the model, or a replay that skips the check the validator made, so a chain of ten thousand opens in under a second. Nothing runs and nothing leaves the device meanwhile, and only the person who opens the file is affected. | A file of ordinary size freezes the tab. |
| SC-05 | Blocked | None found. | Closed | CT-02, CT-03 | A prototype key reaches a prototype. |
| SC-06 | Mitigated | Unknown content is kept and stated, as F-PER-010 requires. | Accepted | Deleting content the software does not know would destroy what a newer revision wrote. F-PER-010 keeps it and states it on opening. | A newer revision writes content an older one would delete. |
| SC-07 | Open | A file carries no author, signature or history. | Accepted | A project file is a document like any other. Proving who wrote it needs keys and identities a local tool does not hold, so the reader decides whom to trust (TR-06). | The software gains an identity to sign with, or a user is harmed by a file passed off as another's. |
| SC-08 | Mitigated | One drawing per edit is exposed to the editor's origin. | Accepted | Only the drawing being edited is handed over, and only after a consent that names the service (N-PRV-005). | The editor receives more than the one drawing, or the consent stops naming the service. |
| SC-09 | Blocked | A browser bug in the sandbox or the decoder. | Accepted | Only a flaw in the browser reaches it, which the browser's maker fixes (AU-02). | A browser the software supports is reported with a sandbox or decoder flaw that reaches the page. |
| SC-10 | Blocked | None found. | Closed | CT-12 | A drawing the editor returns passes the check without going through it. |
| SC-11 | Blocked | A browser bug in the sandbox. | Accepted | Only a flaw in the browser reaches it, which the browser's maker fixes (AU-02). | A browser the software supports is reported with a sandbox flaw that lets a frame reach its parent. |
| SC-12 | Blocked | None found. | Closed | CT-24, AU-05 | The live headers lack the strict transport header, or the certificate is not the software's. |
| SC-13 | Blocked | None found. | Closed | CT-24 | The live headers lack the framing header, or a message is heard from any frame but the editor's. |
| SC-14 | Mitigated | The project stands in clear on the device. | Accepted | The project lives on the user's device like any document they save, and Clear stored data removes it (F-SES-003). Encryption would need a key the user keeps, and gives nothing against someone at an unlocked machine. | A user shares a device without a lock, which the software can neither see nor prevent. |
| SC-15 | Mitigated | A hostile change that passes review and the tests. | Accepted | Every change is reviewed before it enters the repository (CT-31), the release check ran at v1.0.0-beta.1 (CT-30), and both accounts carry a second factor (CT-34). | A change reaches main without a review, the release check fails to run, or an account loses its second factor. |
| SC-16 | Open | A setting changed later, or the host itself, adds code to the origin. | Accepted | The settings were read at the release and the served files matched the commit (CT-29). The release check reads them again at every release. | A served file differs from the commit at a release check, or the host gains a setting that injects. |
| SC-17 | Blocked | None found. | Closed | CT-13 | The software reads a consent or an editor origin from a file. |
| SC-18 | Open | Content under choices not in force can reach a saved file through a stored project someone altered. | Accepted | Only someone who alters the browser's storage reaches it, and they could alter the project directly. | A stored project is restored without the gates, or clearing on opening a file stops. |
| SC-19 | Mitigated | A diagram saved beside a specification is a document when opened on its own, held by the drawing check alone, and a link in it navigates the viewer on a click. A saved Markdown document lets a bare address become a link in GitHub's renderer, and a lone carriage return or a line break in a title open a structure. Found by the reviews of 5 and 6 October 2026 [11][12]. | Open | The Markdown writer escaping what GitHub autolinks and treating every line break alike, and the drawing check refusing every data scheme on a link. The drawing check otherwise holds against a set of 54 hostile diagrams opened in Chrome, and no script can run in a diagram it accepts. | A diagram the check accepts makes a request to an outside address when opened on its own, or a value becomes a link, an image or a structure in a renderer the escapes do not reach. |
| SC-20 | Mitigated | Unsaved work since the last successful write, when the browser refuses writes. | Open | A rating to confirm, and whether the unsaved work the leave prompt guards is enough. | A refused write goes unstated, or the leave prompt stays silent while work is unstored. |
| SC-21 | Blocked | A project stored on a preview origin the user did not choose. | Open | A rating to confirm. Preview deployments are off in the host's settings (CT-37), read at each release with CT-29. | A preview deployment appears. |
| SC-22 | Mitigated | The host sees requests, addresses and user agents, and may receive network error reports. | Open | A rating to confirm. The software makes no request but its own, and what the host logs is the host's (TR-03). | The software makes a request that carries project content, or a beacon appears in the page. |
| SC-23 | Mitigated | New sessions cannot load while the host is down or main is broken. | Open | A rating to confirm. A session already loaded runs from what the browser holds, and a merge follows the release check. | A broken commit reaches main past the check. |

## 8. Maintenance

The model stays true in two ways. The first is with each commit, where a change of a kind in the table updates the sections named, so the model never describes software that no longer exists. The second is with each release, where the release check runs the tests and reads each reopened-when condition in chapter 7 against what changed. A condition that has come true reopens its scenario.

| Change | Sections to update |
|---|---|
| A new way data enters, a file, a message, a storage read or an input | 3.4, the threats of its boundary, 5, 6 |
| A new fetch, or a new external service | 2.4, 3.2, 3.4, 4, 5, 6 |
| A new storage key or record | 3.1, 4.5, 6 |
| A change to the page's policy, the frame's sandbox or the headers file | 4.4, 4.6, 6 |
| A new or changed requirement in the privacy or security groups | 6 |
| A change of host, repository or release process | 2, 3, 4.7, 4.8, 6 |
| A new export format, or a change to what a view writes | 3.2, 3.4, 4.9, 5, 6 |
| An audit finding that is fixed or accepted | The rows it touches, and 7 |
| A new threat | 4, and a scenario in 5 that holds it, or the words none applies |
| A scenario that demands no control, or a control no requirement holds | 6, and an issue proposing the requirement |

## 9. References

| No. | Reference | Link |
|---|---|---|
| [1] | Microsoft, Threat Modeling | https://www.microsoft.com/en-us/securityengineering/sdl/threatmodeling |
| [2] | openconformity, Requirements | ../specs/requirements.md |
| [3] | openconformity, Verification | verification.md |
| [4] | openconformity, Security audit of September 2026 | ../reviews/2026-09-27-security.md |
| [5] | openconformity, SECURITY.md | ../SECURITY.md |
| [6] | W3C, Content Security Policy Level 3 | https://www.w3.org/TR/CSP3/ |
| [7] | WHATWG, HTML Living Standard, the iframe sandbox attribute | https://html.spec.whatwg.org/multipage/iframe-embed-object.html#attr-iframe-sandbox |
| [8] | draw.io, Embed mode | https://www.drawio.com/doc/faq/embed-mode |
| [9] | Cloudflare Pages, Headers | https://developers.cloudflare.com/pages/configuration/headers/ |
| [10] | MDN, State Partitioning | https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/State_Partitioning |
| [11] | openconformity, Security review of 5 October 2026 | ../reviews/2026-10-05-security.md |
| [12] | openconformity, Security review of 6 October 2026 | ../reviews/2026-10-06-security.md |
