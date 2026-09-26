# Views in the app

**Working plan.** Views of the model shown in the app, printed and exported from there. The mockup in `views-mockup/` shows the six views over the example project; this note says how they go into the app. Both are throwaway: delete when the work has landed or been dropped.

## 1. Decisions so far

- Views are the payoff F-VIE-001 promises: artefacts generated from the model, never authored beside it. A view is derived where it is shown and never stored.
- Ratings stay attributes of the entity, made in the editor as today. Whether the views also rate in place is decided after dogfooding; nothing below depends on it.
- The "no report" stance stands. A view states what the model holds; every verdict in it is the user's own field.
- Six views: risk assessment, system requirement specification, system verification matrix, safety function specification, legislation compliance matrix with the measures per essential requirement as its own columns, and the same with a hazard list as a natural seventh.
- Formats: print to PDF, CSV per tab, Markdown per view. Self-contained HTML if Word users ask; docx and xlsx are feasible without a dependency but wait for a real need.
- Presentation, settled in the mockup: contained tabs for the views over line tabs for their sections on one panel; grouped column headers; ratings as parameter columns plus the rating; entities as clickable rows with their glyph; choices as tags; sortable headers.

## 2. Where a view lives

**Same window, the whole workspace.** The view pane replaces the three panes, navigator included; the top bar with its menus stays. One browser tab holds the project, its history and its autosave, so a second window would mean two copies of the model writing one blob. A read-only second window that follows the storage events is possible later, for a log on a second screen, and costs nothing now.

The navigator goes because a view is a different way of reading the model, not a different entity: the tree's only meaning while a view is open would be "leave and show this", which a row in the view already does for the entities the view is about, and the close does for everything else. Its width is better spent on the tables, which are the wide thing in the tool. On return the workspace comes back exactly as it was left, selection, expansion and scroll included.

## 3. Entering and leaving

- **Enter** from the View menu: one item per view, the open one checked. Later, an action on a scenario's pane head, "Show in risk log", opens the log at that row.
- **The pane** carries the contained tabs for the views in its head, the export actions and a close at the right, and the section tabs and table in its body. Switching views is switching tabs.
- **Leave** with the close, with Escape, or by clicking an entity row in the view, which selects it and opens it in the editor. Selection means "show me this", and the editor is where an entity is shown.
- **Back.** The editor remembers it was reached from a view: its pane head offers "Back to Risk assessment", which returns to the same view, section and sort, scrolled to the row that was clicked, freshly built so any edit made in between already shows. The loop is log, entity, edit, back to the same row.
- **A dirty draft** in the editor gets the discard question before a view opens, as a selection change does.
- **State** is session state beside the relationship view choice: which view is open, its section, its sort. Re-entering returns to where the user was, and a reload restores it with the rest of the session.
- **Re-rendering** follows the store like every pane: a change anywhere rebuilds the open view, which is cheap for the pure builders.

## 4. Pieces

| Piece | What it is |
|---|---|
| `view-risk.js`, `view-requirements.js`, `view-verification.js`, `view-safety.js`, `view-compliance.js` | pure `build(model)` functions returning the description: sections, tables, columns with optional group and sub-line, rows of cells |
| `views.js` | the registry, the pane: contained tabs, section tabs, the table renderer with grouped heads and sorting, entity rows, export actions, print |
| `store.js` | the view session state |
| `shell.js`, `actions.js` | the View menu items, the workspace mode that swaps the column, Escape |
| `style.css` | Carbon data table, contained tabs, the print sheet |
| `tests/test-views.js` | the builders over the example project in the shell: rows, columns, particular cells; pins for the wiring; drives for entering, leaving, sorting and printing |

Cells: text, entity list, choice, choice set, rating parameter code, rating outcome, mark, lines. Each has a rendering and a plain-text form for the exports. About 2,000 lines in all, a fifth of the app.

## 5. Rounds

1. **Done.** The pane, the mode, the View menu, the renderer with grouped heads and sorting, and the risk log read-only. Enter, leave, print.
2. CSV and Markdown, the system requirement specification, the verification matrix in both forms.
3. The safety function specification as table and blocks, the legislation compliance matrix.
4. Requirements F-VIE-002 onward, one per view, and a decision entry: views shown in the app, exported by printing and text.
5. After dogfooding: rating in place from the log, the hazard list, "Show in risk log", a read-only second window.

## 6. Open

- Whether a view wants a filter of its own, as the relationships pane has, for rows by text. Cheap once the tables exist.
- Whether a view should show empty rows for entities with nothing linked, or say so once above the table. The mockup shows them, which is honest and prints.
