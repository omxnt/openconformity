# Security

This document holds the security model of openconformity as software. It names what the software protects, where data and code cross into it, who could attack it, the threats at each crossing, the controls that answer them, and the risk that remains. It points at the requirements in `specs/requirements.md` by id and never restates them. It is kept true as the software changes, and an audit in `reviews/` checks the software against it at one commit and records what it found. The model names modules and functions, and an audit names files and lines.

## 1. Conventions

### 1.1 Identifiers

Each row carries an identifier of a prefix and two digits. Identifiers are append-only. A row that no longer applies keeps its identifier and says Retired in its status.

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

### 1.2 Rating

A scenario is rated on feasibility and impact, as the attacker would plan it, before the controls act. The verdict then says what the controls do.

| Feasibility | Meaning |
|---|---|
| Low | It needs a compromise of a party the software trusts, access to the device, or conditions the attacker cannot arrange. |
| Medium | It needs the user to act once, such as opening a file or consenting to the editor. |
| High | Any visitor or any file reaches it with no condition. |

| Impact | Meaning |
|---|---|
| Low | An annoyance without loss. |
| Medium | The loss of unsaved work, or the exposure of one drawing. |
| High | Project content read or altered without the user knowing, or code run on the user's device. |

| Risk | When |
|---|---|
| High | One of the two is High and the other at least Medium. |
| Medium | Both are Medium, or one is High and the other Low. |
| Low | Otherwise. |

| Verdict | Meaning |
|---|---|
| Blocked | The software stops it. |
| Mitigated | The software reduces it and a residue stays. |
| Open | The software does nothing about it today. |

A scenario's residual risk takes one of three statuses, and its ground says why.

| Status | Meaning | Ground |
|---|---|---|
| Closed | A control leaves nothing of the risk. | The controls that close it. |
| Accepted | Something of the risk remains and is tolerable. | The argument that makes it tolerable. An acceptance is the maintainer's, made in the commit that records it. |
| Open | Something remains to be done before the risk is closed or accepted. | What closes it. |

### 1.3 Keeping it true

A change of the kind below updates the sections named in the same commit.

| Change | Sections to update |
|---|---|
| A new way data enters, a file, a message, a storage read or an input | 3.4, the threats of its boundary, 5.1 |
| A new fetch, or a new external service | 3.2, 3.4, 4, 5.1, 6.1, 6.3 |
| A new storage key or record | 3.1, 4.5, 5.1 |
| A change to the page's policy, the frame's sandbox or the headers file | 4.4, 4.6, 5.1 |
| A new or changed requirement in the privacy or security groups | 5 |
| A change of host, repository or release process | 2, 3.2, 4.7, 4.8, 5.2 |
| A new export format, or a change to what a view writes | 3.2, 3.4, 4.9, 5.1, 6.1 |
| An audit finding that is fixed or accepted | The rows it touches, and 6.2 |

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
| The project site at `openconformity.org` | Another origin and another deployment. | The maintainer, as `SECURITY.md` says. |
| The beta gate in front of the host | The host's configuration, seen only from its response. | The maintainer. |
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

### 3.4 Attack surface

| Id | Entry point | Direction | Boundary | Enters at | Controls |
|---|---|---|---|---|---|
| EP-01 | A project file the user picks | In | TB-01 | `flows.js` `openProjectFlow`, `files.js` `openProject` | CT-02, CT-03, CT-04, CT-05, CT-06 |
| EP-02 | The stored project, restored | In | TB-05 | `store.js` `restore` and `install` | CT-03, CT-04, CT-05, CT-21 |
| EP-03 | The theme in web storage | In | TB-05 | `theme.js`, `store.js` `createStore` | CT-20 |
| EP-04 | The session storage values | In | TB-05 | `store.js` `sessionRead` and `createStore` | CT-13, CT-20 |
| EP-05 | The shipped example | In | TB-08 | `flows.js` `loadExample` | CT-04, CT-06 |
| EP-06 | The shipped catalogue | In | TB-02 | `library.js` `libraryOf` and `importInto`, `flows.js` `importPicks` | CT-04, CT-06 |
| EP-07 | A drawing held in an attribute | In | TB-03 | `drawing-cell.js` `drawingCell` | CT-07, CT-08 |
| EP-08 | A drawing the editor returns | In | TB-04 | `drawing-editor.js` `createSession` and `decodeExport` | CT-07, CT-12 |
| EP-09 | A message to the window during an edit | In | TB-04 | `drawing-editor.js` `editDrawing` and `acceptMessage` | CT-10 |
| EP-10 | The editor's frame | In | TB-04 | `drawing-editor.js` `editDrawing` | CT-09, CT-13, CT-14, CT-28 |
| EP-11 | A hyperlink attribute value | In | TB-01 | `editor.js` `valueNode`, `fields.js` `linkable` | CT-18 |
| EP-12 | Every other attribute value and name | In | TB-01 | `dom.js` `el` and `svg` | CT-01 |
| EP-13 | A drop on the tree | In | TB-06 | `navigator.js` `renderRow` and `render` | CT-26 |
| EP-14 | Keyboard shortcuts | In | TB-06 | `app.js`, the document's key listener | None needed, no text is taken. |
| EP-15 | The page's address | In | TB-06 | Read nowhere | CT-17 |
| EP-16 | The page and its modules | In | TB-07 | `index.html` | CT-15, CT-24, CT-25, CT-29 |
| EP-17 | A commit on main | In | TB-08 | The host's deployment | CT-30, CT-31, CT-34 |
| EP-18 | The drawing handed to the editor | Out | TB-04 | `drawing-editor.js` `createSession` | CT-11, CT-13 |
| EP-19 | A link leaving the page | Out | TB-06 | `shell.js` `openLink`, `about.js` `showAbout`, `flows.js` `openMetamodel`, `index.html` | CT-19 |
| EP-20 | A saved file | Out | TB-01 | `flows.js` `saveProject`, `dom.js` `download`, `files.js` `filenameFor` | CT-27 |
| EP-21 | A view saved as a workbook | Out | TB-09 | `views.js` `saveExcel` and `viewSheets`, `xlsx.js` `workbook` | CT-35 |
| EP-22 | A view saved as Markdown, alone or in a zip with its diagrams as SVG files | Out | TB-09 | `views.js` `saveMarkdown` and `sectionMarkdown`, `markdown.js` `markdown`, `zip.js` `zip` | CT-07, CT-36 |

## 4. Threats

Each boundary is put to the six STRIDE questions [1]. A threat none applies to says why.

### 4.1 The project file

| Id | Class | Threat | Controls |
|---|---|---|---|
| TH-01 | Spoofing | A file can claim any name and content, and nothing in it identifies its author. | None, by design. See SC-07. |
| TH-02 | Tampering | Anyone with the file can alter its content. Structure can be checked, content cannot. | CT-03, CT-04 |
| TH-03 | Repudiation | The file records no author and no history, so no change can be held to anyone. | None, by design. |
| TH-04 | Information disclosure | A file holds content its author cannot see, under choices not in force or unknown to this revision. | CT-06 |
| TH-05 | Denial of service | A file deep or wide enough to exhaust the browser. | CT-03, CT-05 |
| TH-06 | Elevation of privilege | Markup or code in a value, a scheme that runs code in a link, or a prototype key. | CT-01, CT-02, CT-03, CT-18 |

### 4.2 The library catalogue

| Id | Class | Threat | Controls |
|---|---|---|---|
| TH-07 | Spoofing | None today. The catalogue is a module of the repository. | CT-31 |
| TH-08 | Tampering | Only through the repository. | CT-30, CT-31 |
| TH-09 | Repudiation | None. The repository's history holds every change. | None needed. |
| TH-10 | Information disclosure | Copies carry attribute content under choices not in force in the project. | CT-06 |
| TH-11 | Denial of service | None. The catalogue loads once per session on first use. | None needed. |
| TH-12 | Elevation of privilege | The same as TH-06, through the same loader. | CT-01, CT-04 |

### 4.3 The drawing

| Id | Class | Threat | Controls |
|---|---|---|---|
| TH-13 | Spoofing | A drawing can carry any model, or none, and then cannot be edited again. | CT-12 |
| TH-14 | Tampering | A file author alters the drawing freely. | CT-07 |
| TH-15 | Repudiation | None. A drawing has no author but the file's. | None needed. |
| TH-16 | Information disclosure | A reference to a resource outside the drawing reports the viewer's address when it loads. | CT-07, CT-08, CT-15 |
| TH-17 | Denial of service | A drawing large, deep or wide enough to exhaust the parser or the rasteriser. | CT-07 |
| TH-18 | Elevation of privilege | A script, a handler, an embedded document or an animated link in the markup. | CT-07, CT-08 |

### 4.4 The draw.io frame

| Id | Class | Threat | Controls |
|---|---|---|---|
| TH-19 | Spoofing | A message from another window or origin posing as the editor. An answer for the editor's name. | CT-10, AU-05 |
| TH-20 | Tampering | The editor returns any text as the drawing. | CT-12 |
| TH-21 | Repudiation | None. The session is the user's own act. | None needed. |
| TH-22 | Information disclosure | The editor receives the drawing's model, and would receive more if handed more. | CT-09, CT-11, CT-13 |
| TH-23 | Denial of service | The editor never becomes ready or never returns the drawing. | CT-14 |
| TH-24 | Elevation of privilege | The frame navigates the page, opens windows, submits forms or reads the software's storage. | CT-09, CT-10 |

### 4.5 Browser storage

| Id | Class | Threat | Controls |
|---|---|---|---|
| TH-25 | Spoofing | None. Only the software's origin writes its storage. | AU-01 |
| TH-26 | Tampering | A person at the machine alters the stored project. | CT-21. See SC-18. |
| TH-27 | Repudiation | None. | None needed. |
| TH-28 | Information disclosure | The project stands in clear on the device, and the tab title carries its name into history. | CT-23. See SC-14. |
| TH-29 | Denial of service | The browser refuses writes, or the quota fills. | CT-22 |
| TH-30 | Elevation of privilege | A stored value read as code or as a structure the software trusts. | CT-20, CT-21 |

### 4.6 The page's own origin

| Id | Class | Threat | Controls |
|---|---|---|---|
| TH-31 | Spoofing | Any file served on the origin is the software to the policy. | CT-29, CT-31 |
| TH-32 | Tampering | The same, through the host or the repository. | CT-29, CT-30 |
| TH-33 | Repudiation | None. | None needed. |
| TH-34 | Information disclosure | A preview address of the host is another origin where a user could store a project unknowingly. | None in the software. |
| TH-35 | Denial of service | None beyond the host's. | None needed. |
| TH-36 | Elevation of privilege | Another site frames the software, or links to it with a crafted address. | CT-17, CT-24 |

### 4.7 The host

| Id | Class | Threat | Controls |
|---|---|---|---|
| TH-37 | Spoofing | Another party answers for the software's name. | AU-05, CT-24 |
| TH-38 | Tampering | The host rewrites a file or injects code under the origin. | CT-29 |
| TH-39 | Repudiation | The host's logs are the host's, and the software records nothing. | None needed. |
| TH-40 | Information disclosure | The host sees requests, addresses and user agents, and may receive network error reports. It sees no project content. | CT-16 |
| TH-41 | Denial of service | The host is unavailable. Once loaded the software runs from what the browser holds. | None needed. |
| TH-42 | Elevation of privilege | Code from the host is the software, and nothing stops it. | CT-29 |

### 4.8 The repository

| Id | Class | Threat | Controls |
|---|---|---|---|
| TH-43 | Spoofing | A commit under the maintainer's name from a compromised account. | CT-31, CT-34 |
| TH-44 | Tampering | A hostile change accepted in review, a vendored asset among them. | CT-30, CT-31, CT-33 |
| TH-45 | Repudiation | Authorship stands in the history, and the host verifies no signature. | None needed. |
| TH-46 | Information disclosure | None. The repository is public and holds no secret. | None needed. |
| TH-47 | Denial of service | A broken commit on main is deployed within minutes. | CT-30 |
| TH-48 | Elevation of privilege | A commit on main is code the policy trusts in full. | CT-30, CT-31 |

### 4.9 An exported file

| Id | Class | Threat | Controls |
|---|---|---|---|
| TH-49 | Elevation of privilege | A value written as a formula, which a spreadsheet would run when a view saved from the file is opened. | CT-35 |
| TH-50 | Elevation of privilege | A value written as markup or as Markdown's own syntax, which a viewer would render as a link, an image loaded from an outside address, or a structure, when a view saved from the file is shown. | CT-36 |
| TH-51 | Elevation of privilege | A diagram saved beside a specification and opened on its own, where it is a document rather than an image. | CT-07 |

## 5. Controls

### 5.1 In the software

A control with no requirement says None, which marks a gap in the requirements. Verification is by the requirement's row in `docs/verification.md`, or by the test block named where no requirement stands.

| Id | Control | Where | Requirements | Standing |
|---|---|---|---|---|
| CT-01 | Text reaches the page through `textContent` only, and attributes through `setAttribute` with names the software fixes. | `dom.js` `el` and `svg` | N-SEC-002 | In place |
| CT-02 | Foreign text is parsed with `JSON.parse` only, and nothing is evaluated. | `files.js` `openProject` | N-SEC-001 | In place |
| CT-03 | The validator refuses unknown keys, wrong types, broken references, cycles, and filing deeper than 1,000 levels. Creating, filing and placing refuse the same depth, so the software never writes a file it refuses. | `validator.js` `validate`, `model.js` `checkDepth` | F-PER-006, N-SEC-001 | In place |
| CT-04 | The gates run newer, invalid, older, then a replay through the model. | `files.js` `loadProject` and `buildModel` | F-PER-004, F-PER-005, F-PER-006 | In place |
| CT-05 | Any error inside the gates ends in a refusal. | `files.js` `loadProject` | N-SEC-009 | In place |
| CT-06 | Content under choices not in force is cleared after a question on opening, on loading the example, on import and on save. Unknown content is kept and stated. | `flows.js` `clearHidden`, `stateUnknown`, `importPicks` and `saveProjectEdit`, `project.js` | N-SEC-005, F-PER-010, F-MOD-010 | In place. The restore path does not clear, see SC-18. |
| CT-07 | The drawing check refuses script, handlers, embedding elements, refresh tags and forms, attributes that ping or navigate, links to code, animated links and handlers, entity declarations, and sizes and dimensions over the limits. It refuses any `href`, `src`, `poster`, `background`, `lowsrc`, `dynsrc`, `longdesc`, `icon` or `manifest` that is neither local nor an image as data, on every element but a link's own `href`, a link to data that is not an image, and any `srcset` or `imagesrcset`. In a stylesheet and in every attribute but the editor's own model, it refuses an import, a `url()` whose target is neither local nor data whatever quotes surround it, and CSS `image-set`, `image()`, `cross-fade()`, `element()` or `src()`, so a drawing stays inert even when opened on its own. | `drawing.js` `checkDrawing` and `parseXml` | F-DRW-001 | In place |
| CT-08 | A drawing is shown only as an image from a data address. | `drawing-cell.js` `drawingCell`, `drawing.js` `dataUrl` | N-SEC-003 | In place |
| CT-09 | The frame is created once, after consent, sandboxed to scripts and its own origin, with every device permission denied and no referrer. | `drawing-editor.js` `editDrawing`, `FRAME_SANDBOX` and `FRAME_ALLOW` | C-TEC-008, N-SEC-004 | In place |
| CT-10 | A message is heard only from the frame's window and the editor's origin, as a string under 8 megabytes, holding JSON and a known event. | `drawing-editor.js` `acceptMessage` | N-SEC-004 | In place |
| CT-11 | The editor is handed one drawing's model and its configuration, nothing else. | `drawing-editor.js` `createSession` | N-PRV-007 | In place |
| CT-12 | A returned drawing is decoded by the software's own decoder, checked, and must carry its model and one page. A refusal keeps the editor open. | `drawing-editor.js` `createSession` and `decodeExport` | F-DRW-001, F-DRW-003 | In place |
| CT-13 | The consent names the origin and the data before the editor loads. The choice not to be asked is kept in session storage only and withdrawn in About. | `drawing-editor.js` `consent`, `store.js` `setConsented`, `about.js` `showAbout` | N-PRV-005, N-PRV-006 | In place |
| CT-14 | The editor has a period to become ready and a period to return the drawing. | `drawing-editor.js` `createSession` | N-OPS-003 | In place |
| CT-15 | The page declares its content security policy before anything loads. | `index.html` | N-SEC-006 | In place |
| CT-16 | No module fetches, opens a socket or sends a beacon, and every import is a relative file. | Every module | N-PRV-002, N-OPS-002, C-TEC-002 | In place |
| CT-17 | Nothing is read from the page's address. | Every module | N-SEC-010 | In place |
| CT-18 | A hyperlink is a link only for an http or https address, and opens without an opener. | `fields.js` `linkable`, `editor.js` `valueNode` | N-SEC-008 | In place |
| CT-19 | Every link of the software's own opens without an opener. | `shell.js` `openLink`, `about.js` `showAbout`, `flows.js` `openMetamodel`, `index.html` | None. Pinned in `test-pins.js`, Nothing leaves the page but by a link the user follows. | In place |
| CT-20 | The theme and the session values are accepted only as literals of the expected type. | `theme.js`, `store.js` `createStore` and `sessionRead` | None. Pinned in `test-pins.js`, The pre-paint theme script speaks the store's literals. | In place |
| CT-21 | The stored project passes the same gates as a file, and one that fails is set aside and stated. | `store.js` `restore` and `install` | F-SES-001, F-SES-004 | In place |
| CT-22 | A refused write is stated, the leave prompt fires while unsaved work is not stored, and a nearly full store is stated. | `store.js` `persist` and `checkQuota`, `shell.js` `render` | F-SES-005, F-SES-006 | In place |
| CT-23 | Clear stored data removes everything the software keeps in the browser. | `store.js` `clearBrowserData`, `flows.js` `clearBrowserData` | F-SES-003 | In place |
| CT-24 | The headers file forbids framing, requires HTTPS and forbids content sniffing. | `app/_headers` | N-SEC-007 | In the repository. Not yet read from the host. |
| CT-25 | The software is static files of the web platform, with one classic script and every other a module. | The files under `app/`, `index.html` | C-TEC-001, C-TEC-004, C-TEC-007 | In place |
| CT-26 | The tree acts only on a drag it started. | `navigator.js` `renderRow` and `render` | None. No test. | In place |
| CT-27 | A saved file's name holds letters, digits and dashes only. | `files.js` `filenameFor` | None. Tested in `test-files.js`, The filename. | In place |
| CT-28 | Nothing changes the model while a drawing is open. | `actions.js` `createActions` | F-DRW-003 | In place |
| CT-35 | A saved workbook writes every cell as text, never as a formula or a number, and leaves out the characters XML does not allow. | `xlsx.js` `sheetXml` and `xmlText` | N-SEC-011 | In place |
| CT-36 | A saved Markdown document escapes markup and Markdown's own syntax in everything it carries, and a line that would open a structure at its start, so no field becomes a link, an image, code or a heading. | `markdown.js` `markdownText` and `proseLine` | N-SEC-011 | In place |

### 5.2 Held by the project

| Id | Control | Where | Requirements | Standing |
|---|---|---|---|---|
| CT-29 | The host serves each file as the released commit holds it, with no feature that rewrites or injects on. | The host's settings | C-DEV-007 | Not verified |
| CT-30 | A merge to main follows a passed test run and a clean console. | The release process | C-DEV-006 | Required. No release made under it yet. |
| CT-31 | The maintainer reviews every change before it enters the repository. | The repository's working rules | None | In place |
| CT-32 | Vulnerabilities are reported privately, with a stated scope, the risks already accepted, how to test and a response aim, and the contact is published where tools look for it. | `SECURITY.md`, `.well-known/security.txt` on both origins, the repository's settings | C-PRJ-006 | In place |
| CT-33 | Third-party assets are recorded with their source, version and licence. | `app/assets/*/ORIGIN.md` | C-TEC-005 | In place |
| CT-34 | The maintainer's GitHub and Cloudflare accounts are protected by a second factor. | The accounts | None | Not verified |

## 6. Risk

### 6.1 Scenarios

| Id | Scenario | Actor | Threats | Controls | Feasibility | Impact | Risk | Verdict |
|---|---|---|---|---|---|---|---|---|
| SC-01 | A file runs code through a name or value. | TA-01 | TH-06 | CT-01, CT-02, CT-15 | High | High | High | Blocked |
| SC-02 | A drawing in a file acts, runs script, loads a resource or embeds a document. | TA-03 | TH-16, TH-18 | CT-07, CT-08, CT-15 | High | High | High | Mitigated |
| SC-03 | A hyperlink in a file runs code when clicked. | TA-01 | TH-06 | CT-18 | High | High | High | Blocked |
| SC-04 | A file deep or wide enough stops the tool. | TA-01 | TH-05 | CT-03, CT-05 | High | Low | Medium | Mitigated |
| SC-05 | A file pollutes the runtime through a prototype key. | TA-01 | TH-06 | CT-02, CT-03 | High | High | High | Blocked |
| SC-06 | A file hides content the recipient signs off without seeing. | TA-01, TA-02 | TH-04, TH-10 | CT-06 | High | Medium | High | Mitigated |
| SC-07 | A file is altered and passed on as unchanged. | TA-01 | TH-01, TH-02, TH-03 | None | High | High | High | Open |
| SC-08 | A compromised editor reads the drawing handed to it. | TA-04 | TH-22 | CT-09, CT-11, CT-13 | Low | Medium | Low | Mitigated |
| SC-09 | A compromised editor returns a hostile drawing or a huge message. | TA-04 | TH-20 | CT-10, CT-12 | Low | High | Medium | Blocked |
| SC-10 | An editor save before Apply drops the drawing and wedges the session. | TA-04 | TH-20, TH-23 | CT-12, CT-14 | Medium | Medium | Medium | Blocked |
| SC-11 | A compromised editor escapes the frame. | TA-04 | TH-24 | CT-09, CT-10 | Low | High | Medium | Blocked |
| SC-12 | A network attacker alters the software in transit. | TA-07 | TH-37 | CT-24, AU-05 | Low | High | Medium | Blocked |
| SC-13 | Another site frames, messages or links into the software. | TA-05 | TH-36 | CT-10, CT-17, CT-24 | High | Low | Medium | Mitigated |
| SC-14 | A person at the machine reads the stored project. | TA-06 | TH-28 | CT-23 | Medium | High | High | Open |
| SC-15 | A hostile commit reaches the origin. | TA-08 | TH-43, TH-44, TH-48 | CT-30, CT-31, CT-34 | Low | High | Medium | Mitigated |
| SC-16 | The host puts code on the origin. | TA-08 | TH-38, TH-42 | CT-29 | Low | High | Medium | Open |
| SC-17 | A file carries consent, or another editor origin. | TA-01 | TH-06, TH-22 | CT-09, CT-13 | High | Medium | High | Blocked |
| SC-18 | A tampered stored project restores holding content under choices not in force. | TA-06 | TH-26 | CT-21 | Low | Low | Low | Open |
| SC-19 | A file someone else wrote is opened, a view is saved from it, and the saved file runs a formula, loads from an outside address, becomes a link, or navigates away when opened. | TA-01 | TH-49, TH-50, TH-51 | CT-07, CT-35, CT-36 | Medium | High | High | Mitigated |

### 6.2 Residual risk

| Id | What remains | Status | Ground |
|---|---|---|---|
| SC-01 | None found. | Closed | CT-01, CT-02 |
| SC-02 | None found. Inside the software a drawing is shown only as an image, which runs nothing and loads nothing whatever the check missed. | Closed | CT-07, CT-08 |
| SC-03 | None found. | Closed | CT-18 |
| SC-04 | A file of hundreds of megabytes can freeze or crash the tab of the person who opens it, since nothing limits a file's size before it is read. | Accepted | Nothing runs and nothing leaves the device. The stored project is replaced only once a file opens cleanly, so a reload restores it. Only the person who chooses to open the file is affected. |
| SC-05 | None found. | Closed | CT-02, CT-03 |
| SC-06 | Unknown content is kept and stated, as F-PER-010 requires. | Accepted | Deleting content the software does not know would destroy what a newer revision wrote. F-PER-010 keeps it and states it on opening. |
| SC-07 | A file carries no author, signature or history. | Accepted | A project file is a document like any other. Proving who wrote it needs keys and identities a local tool does not hold, so the reader decides whom to trust (TR-06). |
| SC-08 | One drawing per edit is exposed to the editor's origin. | Accepted | Only the drawing being edited is handed over, and only after a consent that names the service (N-PRV-005). |
| SC-09 | A browser bug in the sandbox or the decoder. | Accepted | Only a flaw in the browser reaches it, which the browser's maker fixes (AU-02). |
| SC-10 | None found. | Closed | CT-12 |
| SC-11 | A browser bug in the sandbox. | Accepted | Only a flaw in the browser reaches it, which the browser's maker fixes (AU-02). |
| SC-12 | The strict transport header on the software's own response is not yet read. | Open | Reading the headers once the gate is down |
| SC-13 | The framing header on the software's own response is not yet read. | Open | Reading the headers once the gate is down |
| SC-14 | The project stands in clear on the device. | Accepted | The project lives on the user's device like any document they save, and Clear stored data removes it (F-SES-003). Encryption would need a key the user keeps, and gives nothing against someone at an unlocked machine. |
| SC-15 | Review is the gate, and the release check has not yet run at a release. | Open | CT-30 run at the next release |
| SC-16 | The host's settings are not read. | Open | CT-29 verified |
| SC-17 | None found. | Closed | CT-13 |
| SC-18 | Content under choices not in force can reach a saved file through a stored project someone altered. | Accepted | Only someone who alters the browser's storage reaches it, and they could alter the project directly. |
| SC-19 | A diagram saved beside a specification is a document when opened on its own, held by the drawing check alone. | Accepted | The check refuses any address in any attribute or stylesheet that is not local or data, and every attribute that names something to load. Opened on its own in Chrome, no diagram of a set of 54 hostile ones that the check accepts made a request to an outside address, and each case the set found is tested. The example's diagrams and the editor's own export pass the check. No script can run in a diagram the check accepts, so what a missed case could do is a request that tells a server the file was opened. Inside the software the image rendering still guards every drawing. |

### 6.3 What the user trusts

| Id | The user trusts | Ground | Scenarios |
|---|---|---|---|
| TR-01 | Their own device and browser | The software keeps the project there and nowhere else. | SC-14, SC-18 |
| TR-02 | The certificate system for the software's and the editor's names | Both are HTTPS and the browser checks them. | SC-08, SC-12 |
| TR-03 | The host, to serve the repository's files unchanged | The policy trusts the origin in full. Anyone can compare the served files with the commit. | SC-16 |
| TR-04 | The maintainer, to review what reaches main | The host deploys main on push. | SC-15 |
| TR-05 | JGraph's editor, with the one drawing they consent to hand it | The consent names the origin and the data. | SC-08 |
| TR-06 | The author of any file they open, for its content | The software checks structure, never truth. | SC-07 |
| TR-07 | The application an exported file is opened in, to treat text as text | The software writes every value as text and escapes what the format would read as syntax. | SC-19 |

## 7. References

| No. | Reference | Link |
|---|---|---|
| [1] | Microsoft, The STRIDE Threat Model | https://learn.microsoft.com/en-us/previous-versions/commerce-server/ee823878(v=cs.20) |
| [2] | openconformity, Requirements | ../specs/requirements.md |
| [3] | openconformity, Verification | verification.md |
| [4] | openconformity, Security audit of September 2026 | ../reviews/2026-09-27-security.md |
| [5] | openconformity, SECURITY.md | ../SECURITY.md |
| [6] | W3C, Content Security Policy Level 3 | https://www.w3.org/TR/CSP3/ |
| [7] | WHATWG, HTML Living Standard, the iframe sandbox attribute | https://html.spec.whatwg.org/multipage/iframe-embed-object.html#attr-iframe-sandbox |
| [8] | draw.io, Embed mode | https://www.drawio.com/doc/faq/embed-mode |
| [9] | Cloudflare Pages, Headers | https://developers.cloudflare.com/pages/configuration/headers/ |
| [10] | MDN, State Partitioning | https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/State_Partitioning |
