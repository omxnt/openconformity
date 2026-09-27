# Architecture

This document describes how the software in `app/` is built. It names the principles the code keeps, the layers and the modules in them, how a change travels from the user to the screen and to storage, where each kind of state lives, and how the page is divided. It is kept true as the code changes. The requirements in `specs/requirements.md` govern what the software does, and this document says how the code does it. A review in `reviews/` checks the code against it at one commit.

## 1. Principles

| Principle | What it means in the code | Held by |
|---|---|---|
| Static files | The software is HTML, CSS, JavaScript as ES modules, and assets, served as they are, with no build and no server code. | C-TEC-001, C-TEC-003, C-TEC-004, C-TEC-007, pinned |
| No dependencies | Every import is a relative path to a file of the software, and every asset is vendored with its record. | C-TEC-002, C-TEC-005, pinned |
| One owner of state | The store holds everything that outlives a render. A pane reads from it and a flow writes through it. | The store's interface |
| One way to change the model | Every mutation is a function of `model.js`, run inside a commit of the store. No other module writes to the node list or a parent. | Pinned |
| Pure below, page above | The lower layers never touch the page, so they run in the test shell as they run in the browser. | Section 2.2 |
| Text as text | Every string reaches the page through `textContent` or `setAttribute`, and no markup is parsed from text. | N-SEC-001, N-SEC-002, pinned |
| One construction pattern | Each module exports a factory that takes what it needs and returns its interface. `app.js` builds and connects them all, and nothing else does. | Section 6 |

## 2. Structure

### 2.1 The files

| Path | What it is |
|---|---|
| `index.html` | The page, its policy, the icon sprite and the empty regions the panes fill |
| `theme.js` | The theme set before the first paint, a classic script by necessity |
| `style.css` | The one stylesheet, Carbon's tokens copied in by value with each token's name beside it |
| `modules/` | The modules, one file each |
| `library/` | The library the software ships, as data and the catalogues cut from it |
| `assets/` | Fonts, icons, marks and images, each folder with its origin and licence |
| `_headers` | The response headers the host sends |

### 2.2 Layers

The modules fall into seven layers. An import points down to a lower layer or stays within its own layer, never up. On 27 September 2026 no import pointed up and no import formed a cycle.

| No. | Layer | Touches the page | Modules | Lines |
|---|---|---|---|---|
| 1 | Definitions | No | metamodel, attributes, risk, icons, version, platform, text, library data, example | 7,096 |
| 2 | Model and rules | No | model, validator, files, history, queries, relate, records, project, fields, drawing, view-risk, view-registry, xlsx, library index | 3,174 |
| 3 | State | No | store, retention | 1,090 |
| 4 | Page parts | Yes | dom, overlay, dialog, menu, splitter, columns, multiselect, pane, rating, rating-cell, table-control, drawing-cell, drawing-editor, landing, about | 2,301 |
| 5 | Panes | Yes | shell, navigator, editor, relationships, graph, library, views | 4,137 |
| 6 | Coordination | Yes | flows, actions | 1,320 |
| 7 | Wiring | Yes | app | 174 |

Most of the first layer is data. The library and the example are about 6,000 lines of it, each a copy of its source in `sources/`.

### 2.3 The modules

| Module | Layer | What it owns |
|---|---|---|
| `metamodel.js` | 1 | The entity types and the relationship types allowed between them, with composition |
| `attributes.js` | 1 | The attributes of each entity type and of the project, transcribed from `specs/attributes.md` |
| `risk.js` | 1 | The three estimation methods of ISO/TR 14121-2 and their tables |
| `icons.js` | 1 | The glyph of each entity type, the folder and the project |
| `version.js` | 1 | The version and the phase |
| `platform.js` | 1 | Whether the platform is Apple's, read once |
| `text.js` | 1 | Counts and lists in words, said one way everywhere |
| `library/data.js` | 1 | The shipped library, a copy of `sources/library.json` |
| `example.js` | 1 | The example project, a copy of `sources/example.json` |
| `model.js` | 2 | The model and every change to it, each with a check and an act, and the index of each node's children |
| `validator.js` | 2 | The frozen transcription of schema version 1, and the constraints the schema cannot express |
| `files.js` | 2 | Serialisation, and the gates a file passes on the way in |
| `history.js` | 2 | Undo and redo over snapshots of the model |
| `queries.js` | 2 | Derivations over the model for the flows, the actions and the panes |
| `relate.js` | 2 | What a pick means while picking |
| `records.js` | 2 | Records of related measures read against the model, and the findings |
| `project.js` | 2 | What the project's choices hide, and what a change of choice clears |
| `fields.js` | 2 | Reading and writing field values apart from the page |
| `drawing.js` | 2 | The XML parser and the drawing check |
| `view-risk.js` | 2 | The risk assessment as a description of sections, columns and rows |
| `view-registry.js` | 2 | The list of views in menu and tab order |
| `xlsx.js` | 2 | An Excel workbook written from tables of text, its zip included |
| `library/index.js` | 2 | The catalogues cut out of the shipped library |
| `store.js` | 3 | What is open, the selection, the session state, the history and the persistence |
| `retention.js` | 3 | IndexedDB behind a small interface, and an in-memory twin for the tests |
| `dom.js` | 4 | Element construction, tooltips, tab keys and the download |
| `overlay.js` | 4 | The one stack above the page for dialogs, menus and panels |
| `dialog.js` | 4 | Dialogs that resolve a promise, and the toast |
| `menu.js` | 4 | Popup menus drawn from lists of items |
| `splitter.js` | 4 | A splitter between two panes |
| `columns.js` | 4 | Resizable table columns, widths held for the session |
| `multiselect.js` | 4 | The listbox under a set field |
| `pane.js` | 4 | The pieces every pane shares, the head's icon and search, the empty state and the notice |
| `rating.js` | 4 | The rating dialog with the method's figures |
| `rating-cell.js` | 4 | A rating group as one cell of the form |
| `table-control.js` | 4 | A table attribute, read and edited |
| `drawing-cell.js` | 4 | A diagram as a picture, opening at full size |
| `drawing-editor.js` | 4 | The draw.io session, the consent and the surface over the workspace |
| `landing.js` | 4 | The editor pane while no project is open |
| `about.js` | 4 | The About dialog's content |
| `shell.js` | 5 | The shell bar, its menus, the notices, the status bar and the splitters |
| `navigator.js` | 5 | The tree, its toolbar, drag and drop, and its keys |
| `editor.js` | 5 | The attributes of the selection, view-only until Edit and applied on Save |
| `relationships.js` | 5 | The relationship pane, its list, the picker rows and the messages |
| `graph.js` | 5 | The neighbourhood graph and its layout |
| `library.js` | 5 | The library picker over the editor pane |
| `views.js` | 5 | The views pane over the workspace |
| `flows.js` | 6 | Every flow, a line of questions ending in one commit |
| `actions.js` | 6 | The one list of actions every menu and toolbar draws from |
| `app.js` | 7 | Building and connecting everything, and the global keys |

## 3. Behaviour

### 3.1 A change

1. The user acts through a menu, a toolbar, a key or a pane. Each surface calls an action from the one list, or a flow directly.
2. The flow asks what it must, through dialogs that resolve a promise, and stops if the user cancels.
3. The flow calls the store's commit with one function. The function runs the model's changes and returns an outcome.
4. On a refusal the store records nothing, writes nothing and redraws nothing, and the flow tells the user why in a toast. Each change of the model checks before it acts, so a refused change leaves the model as it was. A flow whose commit makes several changes that could be refused, such as an import, tries them on a copy first.
5. On success the store takes a snapshot for the history, marks the project unsaved and writes the project to browser storage. Where changes come faster than writes, only the newest is written.
6. The store notifies its subscribers, and every pane redraws from what the store now holds.

### 3.2 Opening a file

1. The text is parsed with `JSON.parse`, the only parser of foreign data.
2. A file written by a newer version is refused.
3. A file invalid against its own schema version is refused, with what the validator found.
4. An older file is migrated one version at a time.
5. The file is replayed through the model's own functions, so it holds to the same rules an edit does.
6. Content under choices not in force is cleared after a question, and content this version does not know is stated.
7. The store replaces the project, and the history starts again from it.

Any error inside these steps ends in the same refusal, a statement and an unchanged project. The shipped library and the stored project pass steps 1 to 5.

### 3.3 Undo and redo

The history is a list of snapshots with a cursor. Undo and redo move the cursor and hand the store a fresh copy of the snapshot, so nothing that held the old model can change the restored one. The saved state is one pointer into the history, so returning to it by undo marks the project saved again.

### 3.4 Drawing

A pane subscribes to the store and rebuilds its content from it on every notification. A pane keeps no state of its own that outlives a render, except the column widths it holds for the session. Derived things, a rating's level, the records that no longer match, the rows of a view, are computed where they are shown and never stored.

## 4. State

| Kind | What it holds | Where it lives | Survives | In the history |
|---|---|---|---|---|
| Model | The project, its folders, entities, relationships and attributes | The store, and the retention record `project` in IndexedDB | A reload, and a file once saved | Yes |
| Session, with the project | The selection, the tree's expansion, the project row, whether the project is unsaved | The same record | A reload | No |
| Session, per tab | The relationship view, the collapsed relationship pane, the tab per type, the open view, the pane layout, the consent to draw.io | Session storage | A reload in the same tab | No |
| Preference | The theme | Local storage | Until cleared | No |
| Set aside | A stored project that failed to load | The retention record `aside` | Until discarded | No |
| Transient | The relate picker, the library, the diagram editor, the messages, the column widths | Memory | Nothing | No |

Clear stored data removes every row above but the transient one, which a reload clears anyway.

## 5. The page

### 5.1 Regions

| Region | What fills it |
|---|---|
| Shell bar | The menus, undo and redo, the unsaved indicator, the metamodel, the theme and the phase |
| Notices | Statements about storage and restoration |
| Workspace | The navigator, the splitter, and the column of the editor over the relationship pane |
| Status bar | The model's size and the messages |
| Toasts | Remarks in passing, bottom right |
| Overlay | Dialogs, menus and panels, one stack above everything |

### 5.2 Modes

A mode covers panes and never opens a window. One browser tab holds one project, its history and its autosave.

| Mode | What it covers | The store's flag |
|---|---|---|
| Relate picker | The tree and the relationship pane mark what can be picked | `picker` |
| Library | The editor pane | `libraryOpen` |
| Messages | The relationship pane | `messagesOpen` |
| View | The workspace, navigator included | `view` |
| Diagram editor | The workspace | `drawingOpen` |

While the diagram editor is open, every action stands disabled.

## 6. Conventions in the code

| Convention | What it looks like |
|---|---|
| Factories | `createStore`, `createFlows` and the rest take an object of what they need and return an object of functions. |
| Outcomes | A check or a change returns `{ ok: true }` or `{ ok: false, reason }`, the reason one sentence the user can read. |
| Pure parts exported | A module exports its pure functions so the tests can call them without a page. |
| Comments | A comment says what the code does. Why is written in `docs/decisions.md`. |
| Types | JSDoc types, with no TypeScript and no build. |
| Tokens | Colours, spacing and type sizes are Carbon's, copied into `style.css` by value, with the token's name in a comment. |

## 7. Tests

| Kind | Where | What it reaches |
|---|---|---|
| Headless | `tests/test-*.js`, run by `./run.sh` in the JavaScriptCore shell | The layers below the page, and the flows over a stub page |
| Pins | `tests/test-pins.js` | Facts read from the source, the page and the file list, such as the policy, the imports and who writes filing |
| Drives | Outside the repository today | The panes in a real browser, driven by the headless Chrome driver |

Which test verifies which requirement is in `docs/verification.md`. Bringing the drives into the repository is the one open item the architecture review left.

## 8. Keeping it true

A change of the kind below updates the sections named in the same commit.

| Change | Sections to update |
|---|---|
| A new module, or one removed or renamed | 2.2, 2.3 |
| An import that would point up a layer | Do not make it. Move the shared part down instead. |
| A new kind of state, or state moved between stores | 4 |
| A new mode or a new region | 5 |
| A change to how a change, an open or an undo proceeds | 3 |
| A new convention adopted across the modules | 6 |

## 9. References

| No. | Reference | Link |
|---|---|---|
| [1] | openconformity, Requirements | ../specs/requirements.md |
| [2] | openconformity, Security | security.md |
| [3] | openconformity, Verification | verification.md |
| [4] | openconformity, Architecture review of September 2026 | ../reviews/architecture-2026-09.md |
