# Changelog

Every release of openconformity is recorded here, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta.5] - 2026-10-18

Several rows at once, one mode at a time, and the library as one tree.

### Added

- Several rows selected in the tree, by Shift and Cmd as the ARIA tree pattern has it. Shift click and Shift arrows extend from the anchor, Cmd click and Cmd Space add or take one row, Cmd A selects every row shown, and Escape returns to the anchor. The status bar says how many are selected.
- The actions acting on the set. Delete, cut and copy take every selected row, and Edit opens one form for several entities of one type, setting what is filled on each and leaving the rest as each one has it.
- Select subtree, the row with everything under it, in the Edit menu and by Shift Cmd A.
- The navigator folds to its toolbar, stood on end, and opens again from any button in it, from the magnifier at its foot, by the filter key, or when a relationship is picked.
- Edit project in the Edit menu and the context menu when the project row is selected.
- The project's designation in its label, before the name.
- A warning before the page is left while a picking, an import or a diagram holds work, as there was for an edit.
- A clear button in the head filters of the relationship pane and the library.
- About names WCAG 2.2 and the ARIA tree view pattern among the design assets.
- A check on GitHub that the committed verification document is the generated one, beside the suite and the drives.

### Changed

- The reference stands in square brackets in every label, before the title, as written.
- One mode at a time. An edit, a picking, an import or a view is left by its own buttons or by Escape, and the changers, the file actions, undo and redo stand down meanwhile. Each mode has the same shape, its head carrying its own Done, Save or Import and its Cancel.
- Picking a relationship pins the selection to the subject, and the arrows move the focus among the candidates.
- The context menu is the Edit menu less the history, the clipboard actions are a group of their own, and the Edit entry names what it acts on, Edit entity, Rename folder or Edit 3 selected.
- The library is one tree, its four catalogues open at the root with their own icon, and picks across them are imported together. The entity under the highlight is previewed as the editor shows it, its tabs and every field, and the filter stands on the catalogues' head.
- A copy carries the relationships between the copied rows, and none to anything left behind.
- A check in the library under a filter picks what the filter shows, and nothing hidden.
- A choice value the options do not offer is kept and shown, not dropped.
- A change refused after it had begun is undone whole, the model, the counters and the history as they were.
- The risk assessment view is named for the report it exports, as the specification is for its kind.
- The type annotations are checked and in step with the code.

### Removed

- Move to. A row moves by drag, or by cut and paste.

### Fixed

- A drag onto the project row files at the root again.
- Undo and redo stand down under a mode by key as they do by menu.
- The leave warning fires for the library only when something is picked.

### Security

- The responses carry Cross-Origin-Resource-Policy same-origin on both hosts.
- A drawing naming an element with two colons is refused.
- The security review of 9 October 2026 is recorded, and what it found is closed.

## [1.0.0-beta.4] - 2026-10-14

Cut, copy and paste in the tree, and the check that now guards every release.

### Added

- Cut and paste in the tree, by key and by menu, filing the row as a drop would.
- Copy and paste in the tree, a copy of the row and everything under it, with new identifiers and no relationships.
- A saved view names the software and its version, in the line under a Markdown title and in a workbook's properties.
- About links to the release of the version shown and to the changelog.
- A warning before the page is left while an edit is unconfirmed.

### Changed

- Save to file offers to save an open draft first, for an entity and for the project.
- A drawing is accepted only if it holds what draw.io writes, and refused by name otherwise.
- A relationship that could not be added is told with the reason.

### Fixed

- A double click on a column handle returns the column to its default width.
- The library preview shows a table attribute's row count.
- Clear stored data opens the relationship pane again.
- Alt Space picks one entity on a Mac.
- Escape in the diagram editor cancels once, however many edits came before.
- A workbook cell longer than Excel allows is cut with a mark.

### Security

- Every push runs the tests and the browser drives on GitHub, and main accepts only a commit that passed and is signed.

## [1.0.0-beta.3] - 2026-10-07

The hazard checklist, and the hardening the October reviews asked for.

### Added

- FMV's checklist of hazards and hazardous conditions in the library, carried with permission.
- Every act in the library named under About.
- A not-found page for an unknown address.

### Changed

- The relationship pane keeps its head when nothing is selected.
- Selecting an entity from the graph, the list, the messages or a view opens the folders above it and scrolls its row into view.

### Fixed

- A large file no longer freezes the tab on opening.
- A counter the software cannot issue from is refused, so no two entities share an identifier.
- A saved specification escapes addresses and line breaks in cell text, and a sheet name can no longer collide with the workbook's own.

### Security

- The host sends the full content security policy, requires trusted types, and sends no referrer, no opener and no device feature.
- Links open without a referrer.
- A file with a prototype key as an attribute key is refused.
- A drawing that links to a data address is refused.

## [1.0.0-beta.2] - 2026-10-04

The library grows, and folders travel with it.

### Added

- The Low Voltage Directive in the library.
- The EMC Directive in the library.
- The RoHS Directive in the library.
- The Cyber Resilience Act in the library.
- A project structure in the library, to start a project from.
- The life phases of machinery in the library.
- Folders import from a catalogue, nested as the catalogue nests them.

### Changed

- Every act in the library names its reference, its title with the Commission's abbreviation, and the consolidated text it was copied from.

### Removed

- The pick-all checkbox in the library's head.

## [1.0.0-beta.1] - 2026-09-27

The first public beta, open to everyone at app.openconformity.org.

### Added

- A model of the CE marking work, from the entity types and relationships the metamodel defines.
- A tree that files the model in folders, an editor for each entity, and its relationships as a graph and a list.
- Risk estimation by the three methods of ISO/TR 14121-2, before and after protective measures.
- Safety functions with a required performance level or safety integrity level.
- A library holding the Machinery Regulation and its essential requirements.
- Diagrams drawn in draw.io, handed over only after the user consents.
- The risk assessment as a view, saved as Excel.
- The safety function specification as a view, saved as Markdown or Excel.
- Projects saved as local files, with the work kept in the browser between sessions.
- Undo and redo throughout.

[1.0.0-beta.3]: https://github.com/omxnt/openconformity/compare/v1.0.0-beta.2...v1.0.0-beta.3
[1.0.0-beta.2]: https://github.com/omxnt/openconformity/compare/v1.0.0-beta.1...v1.0.0-beta.2
[1.0.0-beta.1]: https://github.com/omxnt/openconformity/releases/tag/v1.0.0-beta.1
[1.0.0-beta.4]: https://github.com/omxnt/openconformity/compare/v1.0.0-beta.3...v1.0.0-beta.4
[1.0.0-beta.5]: https://github.com/omxnt/openconformity/compare/v1.0.0-beta.4...v1.0.0-beta.5