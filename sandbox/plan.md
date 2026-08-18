# Plan

The build plan for v1, written from scratch in `sandbox/app/`. It fixes the module inventory, the order the modules are built in, the vertical slice that proves the foundation, and the decisions taken on the open points the retrospective left. The requirements, the metamodel, and the schema govern what is built; the retrospective governs how, and this plan records what was decided where the two needed a ruling.

## 1. Scope

The build covers the workspace, the model with its relationships, undo and redo, session persistence, and project files. Deferred out of it: views (F-VIE-001, draft), library persistence (F-PER-002, draft), migration content (the pipeline exists empty until a schema v2 exists), and risk rating on the Accident Scenario — SCN carries no rating attributes at all in this build; how a risk is rated is designed later and added as attribute definitions when it is. Deferring the library defers only its file: the project clauses of F-PER-003…010 are built in full, and their library clauses bind when F-PER-002 lands.

The published demo is the feature baseline: every demo capability is present, improved, or dropped by recorded ruling. The comparison audit and its triage govern the remaining surface work.

## 2. Modules

The constraints C-TEC-001…007 bind every module, and N-OPS-001/002 and N-PRV-001…004 are satisfied by the absence of any network, account, or server code anywhere. Beyond those, each module answers for the requirements beside it.

| Module | Responsibility | Requirements |
|---|---|---|
| `metamodel.js` | The 18 types and 44 relationship types, transcribed from `docs/metamodel.md` and the schema's relationship identifiers, with composition marked on the six contains/decomposes-into types | F-MOD-001, F-MOD-002 (definitions) |
| `attributes.js` | Per-type attribute definitions as data, transcribed from `docs/attributes.md` | F-MOD-003 (definitions) |
| `model.js` | The single writer: can/do pairs, entities, folders, relationships, cascade deletion, filing rules | F-MOD-001/002 (enforcement), F-MOD-005/006, F-WSP-004/005/006 |
| `history.js` | Snapshot stack over `structuredClone`, model only | F-MOD-008, F-MOD-009 |
| `store.js` | The project, selection, interaction mode, dirty tracking, history, and browser persistence behind `commit`; session state beside model state | F-SES-001, F-SES-002, N-PRV-004 |
| `validator.js` | Gate 1: a hand-transcription of the schema per version, judging a file against its recorded version | F-PER-006 (with `files.js`) |
| `files.js` | Serialisation, open and save, the version gate, the migration chain, the notices | F-PER-001, F-PER-003…010, N-SEC-001 |
| `dom.js` | Element construction, text through `textContent` only | N-SEC-002 |
| `overlay.js` | The one owner of everything above the page: dialogs, menus, panels | supports F-MOD-004/007, N-ACC-003 |
| `dialog.js` | Promise-based dialogs | F-MOD-004 (guard), F-MOD-007 |
| `menu.js` | Popup menus drawn from item lists | — |
| `navigator.js` | The tree, its keyboard model, drag filing, and its transient state | F-WSP-001, F-WSP-004/006 (UI), N-ACC-002/003 |
| `editor.js` | Attributes of the selection, view-only until Edit, apply on Save | F-WSP-002, F-MOD-003/004 |
| `relationships-view.js` | The relationship list | F-WSP-003 |
| `graph-view.js` | The neighbourhood graph | F-WSP-003 |
| `relate.js` | The add-relationship workflow over the store's picker mode | F-MOD-002 (offering) |
| `actions.js` | One action list feeding the toolbar, the menu bar, and the context menu | consistency of every offer |
| `flows.js` | Create, delete, open, save — the guards as straight-line awaited code | F-MOD-007, F-PER-005/006 (statements) |
| `shell.js` | Shell bar, panes, splitters, theme, viewport notice | F-APP-001/002, G-SYS-005, G-IDN-001 |
| `app.js` | Wiring: constructs and connects, nothing else | — |
| `index.html`, `style.css`, assets | Carbon tokens, Plex, icons, favicon, layout | G-IDN-002, G-SYS-001…004, N-OPS-002, N-CMP-001/002, N-ACC-001 |

## 3. Order

The stages run bottom-up along the dependency spine, with the slice cutting through early: the retrospective's riskiest corrections — the store split, the promise guards, transient state under full re-render — are proven before the breadth of eighteen types and forty-four relationship types can multiply a mistake. Each stage ends at a review pause.

| # | Stage | Builds | Why here |
|---|---|---|---|
| 1 | Headless foundation | `metamodel.js`, `attributes.js`, `model.js`, `history.js` | Everything downstream is generated from these; testable with `jsc` before a pane exists; the storage-layout decision lands where changing it is still cheap. Composition, cascade, and the single-owner and acyclicity rules are new work with no demo prior art. |
| 2 | Store and files | `store.js`, `validator.js`, `files.js` | The store is the correction of the demo's `app.js`; commit → snapshot → persist → restore is pinned headless before chrome exists. The validator is testable with fixture files. |
| 3 | Static shell | `index.html`, `style.css`, assets, `shell.js` | The slice needs a stage; self-containment and a clean console are verified from the first render. |
| 4 | Vertical slice | `dom.js`, `overlay.js`, `dialog.js`, minimal `navigator.js`, minimal `editor.js`, `app.js` | See chapter 4. The hard checkpoint: everything later builds on what it proves. |
| 5 | Actions and breadth | `actions.js`, `menu.js`, `flows.js`, folders, drag filing | Once the registry pattern is proven, the remaining types are data entry. Deletion with cascade confirmation arrives here. |
| 6 | Relationships | `relationships-view.js`, `graph-view.js`, `relate.js` | The pane split and the store-owned picker. |
| 7 | Files in the interface | Open and save flows, refusal statements, migration notices | Wires the stage-2 gates to promise dialogs. |
| 8 | Closure | Keyboard sweep, WCAG 2.2 AA pass, exact minimum viewport | Cross-cutting qualities checked against the whole, not a part. |

Each review pause has an exit check. Stages 1 and 2 are proven headless: test files run with `jsc`, kept in `sandbox/tests/` beside the app so that promoting `sandbox/app/` can never carry them, with the validator's fixture files beside them. Stages 3 to 7 add the running page, served locally and worked through with the console clean of errors and warnings. Stage 8 is the closing check itself: the keyboard sweep and the WCAG 2.2 AA pass against the whole.

## 4. Vertical slice

Two entity types — System Element and Single Hazard — end to end, with no relationships, no folders, no file dialogs, no menus. Create an ELM from a toolbar action, see it in the tree, select it, enter Edit, change the title, Save, undo, redo, close the browser, reopen, stand where you stood.

Two types rather than one so the creation offer is generated from the registry rather than hard-coded. Every current definition is a title and a description, so the slice exercises the text and multiline kinds; choice and hyperlink are built to the kinds table and gain real coverage as the definitions iterate. The slice retires the named risks while the surface is small: `app.js` still only wiring after two panes, the discard guard reading as one awaited `if`, focus and scroll surviving the full re-render because the navigator owns them, the persistence loop through the same serialisation the file format uses, and a hostile entity title rendering as text everywhere it appears.

## 5. Decisions

The rulings on the retrospective's open points, with the refinements settled during review.

1. **Storage.** One in-memory node collection with a `kind` field, split into the schema's two arrays only at serialisation and deserialisation. No pane asks what something is by map membership. Siblings interleave in one order across both kinds, as the schema's `order` defines — the tree does not group folders above entities. Serialisation writes dense order integers per parent; array order carries no meaning.

2. **History.** Snapshots hold the model only. Selection is store state; after undo or redo the store repairs a vanished selection to the nearest surviving ancestor in the filing tree, else the root. Undoing a deletion restores the entity without re-selecting it — a known trade against the demo, accepted. The counters never move on undo or redo: history rolls back content, not the next number to issue, so an undone creation leaves a hole in the numbering rather than a number that returns on a different entity. The schema's floor — every counter exceeds every issued number in the file — would permit the roll-back; the stricter rule is chosen because a saved file or an export may reference an identifier long after the session that issued it, and no later change of behaviour could repair a reissue already written.

3. **Saved state.** A saved pointer into history, sequence-based so truncation and depth eviction cannot corrupt it; dirty derives from pointer identity. Across sessions the derived boolean rides in the session blob: a clean restore seeds the pointer at the initial entry, a dirty one seeds it unreachable.

4. **Validation.** Two gates in order. Gate 1, `validator.js`, judges the file against its recorded version: the schema's keywords and its prose constraints — unique identifiers, resolving references, filing and composition acyclicity, order uniqueness, endpoint types, single composition owner, counters exceeding every issued number. Check order: newer, refuse (F-PER-005); invalid, refuse (F-PER-006); older, migrate (F-PER-004). Gate 2 is replay through the model against the current metamodel, a net that should never fire. The loader carries attribute content verbatim — no seeding, no default titles on load; those are creation-time behaviour. The browser-storage blob passes the same loader but is a cache: on failure it is never given the refusal dialog. A blob that fails to load is set aside rather than deleted, overwritten only by the next successful persist, and the software states that the previous session could not be restored — the blob can hold the only copy of unsaved work, and persisting on change promises that a crash loses nothing (F-SES-002), so an unexplained empty workspace would misstate what happened. The migration chain exists empty until schema v2.

5. **Overlay.** One stack, one owner. Menus are exclusive — opening anything closes them. Dialogs stack over panels; panels survive commits. Escape and focus go to the top entry; a commit closes menus and never dialogs. Every entry records its opener and returns focus to it on close.

6. **Picker.** Picker mode is store state: the subject entity, the chosen relationship form, and the picked identifiers. Everything else — options, candidates, valid rows — is re-derived from the model on every render, so the mode survives commits. A commit that removes a picked entity clears that pick; one that removes the subject closes the workflow. The workflow pins its subject: selection may move while picking, the panel stays anchored until Done, Cancel, or the subject's deletion.

7. **Relationship pane.** Three modules: the add workflow, the list view, and the graph view. The graph is the selected entity's neighbourhood — the entity and its direct relationships, never a whole-model graph. It is a pane presentation, not an F-VIE view; F-VIE-001 stays draft and out of v1.

8. **Working state.** Persisted: the open project, the selection, tree expansion, the theme. Not persisted: scroll and unconfirmed edit drafts — a draft surviving restart would bypass F-MOD-004. Expansion lives in the store as session state: a second class beside model state, persisted on change, never in history, never dirtying. Undo does not collapse branches; expanding does not mark the project unsaved. The themes are two Carbon themes, White and Gray 100, the default following the system preference — a build choice under G-SYS-001, stated here because no artefact names it. The chosen theme is keyed beside the project blob, so replacing the project does not reset it.

9. **Editor kinds.** The closed list is text, multiline, choice, hyperlink. There is no risk kind and no rating attribute of any form in this build; SCN ships without rating, and the rating design — method, fields, and any conditional presentation it needs — is specified later and arrives as attribute definitions.

## 6. Attributes

`docs/attributes.md` specifies all eighteen types and is the sole source: `attributes.js` is its transcription, updated as the document iterates. The demo is no longer a seed — its richer definitions were deliberately reduced to a title and a description per type, to be rebuilt from use. The transcription carries the following rules.

- The data shape mirrors the document's conventions: the four kinds, and per type an ungrouped table first with named collapsible groups after it, keys unique across all of a type's tables. No definition uses a group, a choice, or a hyperlink yet; the shape and the editor support them for when definitions iterate.
- An unset attribute is the absence of its key: creation seeds no keys, and saving an emptied value of any kind removes the key, so an entity and a file carry only what is set, as the document's conventions state.
- Definitions iterate freely within schema v1: attributes are validated loosely, and content under a key no longer presented is preserved unpresented (F-PER-010) until a definition presents it again.
- SCN carries no rating attributes: the demo's `riskBefore`/`riskAfter` placeholders are not transcribed and no replacement is added until the rating design lands.
- The relationship table is not taken from the demo, whose vocabulary predates the metamodel document: `metamodel.js` transcribes the diagram and the schema's forty-four relationship identifiers.
- The identifier is generated and read-only, not an attribute. Every attribute is optional and every value is stored as text.

## 7. References

| No. | Reference | Link |
|---|---|---|
| [1] | Requirements specification | `docs/requirements.md` |
| [2] | Metamodel | `docs/metamodel.md` |
| [3] | Attributes | `docs/attributes.md` |
| [4] | Project file schema | `schema/project.schema.json` |
| [5] | Demonstration retrospective | `sandbox/retrospective.md` |
