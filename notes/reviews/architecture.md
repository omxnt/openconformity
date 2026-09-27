# Architecture review

A read-only walkthrough of the software in `app/` and the tests in `tests/` as they stand on 27 September 2026, at the beta. It maps the modules and their dependencies, weighs what each module owns, looks for dead and duplicated code, checks consistency, judges the stylesheet, and reads the tests against the modules. It closes with findings ranked by how much they would improve the code, and with what should be left as it is. The stack is fixed by C-TEC-001 to C-TEC-004 and nothing here proposes a framework, a build step, a type system or a dependency. The interface and the domain model are not judged. `app/modules/example.js` and `app/library/data.js` are data copied from `sources/` and are skipped.

## 1. Module map

### 1.1 What each module owns

The software is 38 modules under `app/modules/`, one under `app/library/`, the page, the pre-paint theme script and one stylesheet. The table gives each module's job in one line, what it imports and what imports it. The four modules almost everything imports are named once here and left out of the columns. `dom.js` is imported by every module that draws. `metamodel.js`, `model.js`, `queries.js` and `icons.js` are imported by most modules that read the model.

| Module | Lines | Owns | Imports (beyond the four) | Imported by |
|---|---|---|---|---|
| `metamodel.js` | 156 | The 18 entity types and 44 relationship types, transcribed from the diagram | none | model, queries, files, editor, flows, graph, library, navigator, project, records, relationships, views |
| `model.js` | 619 | The model and every mutation of it, each with a can and a do | none | actions, editor, files, flows, graph, library, navigator, queries, records, relationships, store |
| `attributes.js` | 665 | The attribute definitions per type and the project's own | none | editor, library, project, rating, records, view-risk |
| `risk.js` | 188 | The three estimation methods and their tables | none | editor, rating |
| `queries.js` | 252 | Pure derivations over the model for the flows and the panes | none | actions, editor, flows, graph, library, navigator, records, relate, relationships, view-risk, views |
| `relate.js` | 64 | What a pick means while picking | queries | graph, navigator, relationships |
| `records.js` | 150 | Records of entities read against the model, and the findings | attributes, queries | editor, flows, relationships, shell |
| `project.js` | 124 | What a project save sweeps, what a file holds hidden or unknown | attributes | flows |
| `history.js` | 155 | Undo and redo over snapshots | none | store |
| `validator.js` | 411 | Gate 1, the frozen schema version 1 transcription | none | files |
| `files.js` | 248 | Serialisation, the gates on the way in, the filename | validator | flows, library, store |
| `drawing.js` | 297 | The strict XML parser and the drawing check | none | drawing-editor, editor |
| `retention.js` | 144 | IndexedDB behind a small interface, and its in-memory twin | none | app, store |
| `icons.js` | 35 | The sprite symbol per type, folder and project | none | editor, flows, graph, library, navigator, relationships, views |
| `version.js` | 8 | The version and the phase | none | about, shell |
| `library/index.js` | 44 | The catalogues cut out of the library project | library/data | app |
| `store.js` | 937 | The one owner of what is open, the session state, the persistence | files, history, retention | app |
| `dom.js` | 191 | Element construction, the tooltips, the tab keys, the download | none | 15 modules |
| `overlay.js` | 132 | The one stack above the page | none | app |
| `menu.js` | 135 | Popup menus from item lists | none | flows, navigator, shell |
| `dialog.js` | 259 | Promise dialogs and the toast | none | app |
| `multiselect.js` | 73 | The listbox under a set field | none | editor |
| `splitter.js` | 66 | A splitter between two panes | none | columns, library, shell |
| `columns.js` | 82 | Resizable table columns, widths held for the session | splitter | relationships |
| `about.js` | 103 | The About dialog's content | version | flows |
| `rating.js` | 380 | The rating dialog with the matrix and the graph figures | attributes, risk | editor, relationships |
| `drawing-editor.js` | 424 | The draw.io session, the consent, the surface | drawing | app, editor |
| `editor.js` | 1310 | The editor pane, and a set of pure field helpers | attributes, drawing, drawing-editor, multiselect, rating, records, risk | app, flows, library, view-risk |
| `navigator.js` | 655 | The tree, its toolbar, drag and drop, the keys | menu, relate | app |
| `relationships.js` | 719 | The relationship pane, the list, the picker rows, the messages | columns, rating, records, relate | app |
| `graph.js` | 612 | The neighbourhood graph and its layout | relate | app |
| `view-risk.js` | 156 | The risk assessment as a pure description | attributes, editor | views |
| `views.js` | 309 | The view registry and the pane that renders any description | view-risk | actions, app, flows |
| `library.js` | 632 | The library picker, its pure part and its pane | attributes, editor, files, splitter | app, flows |
| `shell.js` | 503 | The shell bar, the menus, the notices, the status bar, the splitters | menu, records, splitter, version | app |
| `actions.js` | 314 | The one action list | views | app |
| `flows.js` | 996 | Every flow, each a straight line of questions and one commit | about, editor, example, files, library, menu, project, records, views | app |
| `app.js` | 173 | Wiring and the global keys | 15 modules | none |
| `theme.js` | 13 | The theme before the first paint | none | index.html |

The modules split cleanly into layers when read by what they touch. Sixteen modules never touch the page and never import `dom.js`. They are metamodel, model, attributes, risk, queries, relate, records, project, history, validator, files, drawing, retention, icons, version and `library/index.js`. The store touches no page either, its storage being handed in. The rest draw, or listen to the page, or read `navigator.platform`.

### 1.2 The dependency graph

The graph omits the edges into `dom.js`, `metamodel.js`, `model.js` and `icons.js`, which the table above lists, because drawn they hide everything else. Dashed edges run the wrong way, from a pure or coordinating module into a page module.

```mermaid
flowchart TB
  subgraph data [Data]
    metamodel
    attributes
    risk
    icons
    version
    example
    libdata[library/data]
  end
  subgraph pure [Model and rules]
    model
    queries
    relate
    records
    project
    history
    validator
    files
    drawing
    retention
    libindex[library/index]
  end
  subgraph state [State]
    store
  end
  subgraph page [Page primitives]
    dom
    overlay
    menu
    dialog
    multiselect
    splitter
    columns
  end
  subgraph panes [Panes and chrome]
    editor
    navigator
    relationships
    graph
    views
    viewrisk[view-risk]
    library
    rating
    drawingeditor[drawing-editor]
    about
    shell
  end
  subgraph wiring [Coordination]
    actions
    flows
    app
  end

  relate --> queries
  records --> attributes
  records --> queries
  project --> attributes
  files --> validator
  libindex --> libdata
  store --> files
  store --> history
  store --> retention
  columns --> splitter
  about --> version
  rating --> attributes
  rating --> risk
  drawingeditor --> drawing
  editor --> attributes
  editor --> drawing
  editor --> drawingeditor
  editor --> multiselect
  editor --> queries
  editor --> rating
  editor --> records
  editor --> risk
  navigator --> menu
  navigator --> queries
  navigator --> relate
  relationships --> columns
  relationships --> queries
  relationships --> rating
  relationships --> records
  relationships --> relate
  graph --> queries
  graph --> relate
  viewrisk --> attributes
  viewrisk --> queries
  viewrisk -.-> editor
  views --> queries
  views --> viewrisk
  library --> attributes
  library --> files
  library --> queries
  library --> splitter
  library -.-> editor
  shell --> menu
  shell --> records
  shell --> splitter
  shell --> version
  actions --> queries
  actions -.-> views
  flows --> about
  flows --> example
  flows --> files
  flows --> library
  flows --> menu
  flows --> project
  flows --> queries
  flows --> records
  flows -.-> editor
  flows -.-> views
  app --> actions
  app --> dialog
  app --> drawingeditor
  app --> editor
  app --> flows
  app --> graph
  app --> library
  app --> libindex
  app --> navigator
  app --> overlay
  app --> relationships
  app --> retention
  app --> shell
  app --> store
  app --> views
```

### 1.3 Cycles and wrong-way edges

There is no import cycle. A script walked every import and found none, and the module graph is a strict layering from data through rules and state to the page and the wiring.

Five edges run the wrong way, all for the same reason. A pure helper lives in a page module, so whoever needs the helper imports the page.

- `view-risk.js` line 24 imports `ratingView` and `initials` from `editor.js`. The module calls itself a pure function of the model, and it is, except that it loads the whole editor pane to get two pure helpers.
- `library.js` line 26 imports `setValues` and `firstTabName` from `editor.js` for its preview, which is the pure half of the module.
- `flows.js` line 35 imports `removalText` from `editor.js` to word one dialog.
- `actions.js` line 11 and `flows.js` line 36 import `VIEWS` from `views.js`. The registry is one constant, but it lives in the module that also builds the pane, so the action list and the flows import a renderer to read a list.

None of these breaks anything today, since ES modules resolve them fine and nothing runs at import time except the risk graph's tree and the relationship table. They matter for the tests and for reading. The headless suite imports `editor.js` in four test files to reach pure functions, and any future page-only code added to `editor.js` at module level would break those tests.

## 2. Responsibilities

### 2.1 Where a module has more than one job

`editor.js` at 1310 lines has four jobs. It renders the entity form in view and edit mode, which is its name. It also renders the landing page with the three ways into a project, lines 1209 to 1231. It renders the project's own editor, lines 1151 to 1169, with its name mapped onto the model. And it holds a library of pure field helpers exported for others, lines 35 to 222. Inside the form it owns three controls that are each a small module of their own, the rating cell at line 650, the drawing cell at line 1023 and the table control at line 1087. The record notices at line 557 are a fifth concern.

`flows.js` at 996 lines is one function of 42 flows. That is what the module says it is, and each flow is short. The size comes from three things that are not flows. The creation and new-related menus at lines 216 to 287 build menu items. The set-aside copy's name reading at lines 690 to 705 parses a blob. And the dialog text is written inline in every flow, so the module is also the interface's copy for a dozen dialogs. The project commit loop appears twice, at lines 418 to 427 and 490 to 497.

`store.js` at 937 lines is the one owner by design, and the doc at its head says so. It owns the model and history, the persistence chain, the picker, the selection and expansion, and eleven session facts. Each fact has a getter, a setter, a key and a try and catch. It is long because there are many facts, not because it does something it should not. The one leak is the other way round. Two session facts live outside it. The splitter layout is kept by `shell.js` at line 407 under its own session key, and the column widths are kept in memory by `columns.js` at line 17. The store's comment at line 6 says session state persists on change through the store, and these two do not.

`relationships.js` at 719 lines renders three things on one pane. The list, the picker's provisional rows inside the list, and the messages table that stands over the pane from line 573. The messages have their own head, their own sort state, their own header builder at line 584 and their own row builder. They share the pane's filter and its column handles. Whether the messages belong in this module or in one of their own is a judgement call. They were put here because they stand over this pane, and that reads as intended.

`shell.js` at 503 lines does five things the doc names. The theme, the menu bar, the notices, the status bar and the splitters. Each is short. The notices at lines 305 to 358 are the one place in the software that builds elements by hand with `document.createElement` rather than through `el` and `icon` from `dom.js`, which every other module uses.

`views.js` at 309 lines holds the registry, five pure helpers and the pane. The pure helpers and the registry could stand apart from the pane, as `view-risk.js` already does for the builder.

### 2.2 Where a responsibility leaks

`model.js` says at line 3 that every mutation goes through it and nothing else writes to a model. Three places write around it.

- `flows.js` line 500 deletes attribute keys directly inside the project save's commit.
- `flows.js` line 819 deletes attribute keys directly on a loaded model before it is installed.
- `files.js` line 145 assigns the project's attribute bag on load.

The first two do the same thing, remove named keys from named entities, and neither goes through an outcome. A model function that removes keys would let both use it and would keep the claim true. The loader's assignment is the loader's business and can stay, since the loader is the one place allowed to supply identifiers too.

`flows.js` at lines 585 to 605 re-derives what a pick means from `relationshipOptions`, which is what `pickedRows` in `relate.js` already does at line 54. The two agree today. They are two places to keep agreeing.

`records.js` calls itself pure functions over the model, and it is, but it also holds interface text at lines 16, 24 and 73, the words a stale record shows. `queries.js` holds the deletion question's sentences at lines 194 to 226. `project.js` holds the sweep question's clauses at line 49. The line between derivation and wording is not drawn, and each module draws it where it happened to be convenient. This reads as intended, since each sentence sits next to the count it states, and it is noted rather than proposed against.

### 2.3 Where two modules do the same thing differently

- The head search field is written twice, in `relationships.js` lines 225 to 258 and `library.js` lines 317 to 353, near verbatim.
- The icon-only head button is written twice, `headIconButton` in `editor.js` line 881 and `headIcon` in `relationships.js` line 261, identical.
- The empty state is written twice, `editor.js` line 360 and `relationships.js` line 338, and a third time inline in `navigator.js` line 511.
- The sortable column head is written twice in `relationships.js`, `sortableHeader` at line 454 over one sort state and `messagesHeader` at line 584 over another, and a third way in `views.js` at line 162.
- An entity's designation as an icon, a mono identifier and a title is composed in `editor.js` line 339, `relationships.js` lines 321 and 355, `library.js` line 549 and `navigator.js` line 426, and again in `views.js` line 110 with a different class name.
- The attribute a conditional group waits on is looked up by `leaderOf` in `editor.js` line 401 and `leaderName` in `project.js` line 121.
- A group's definitions flattened with its sub-groups is `groupAttributes` in `attributes.js` line 590 and `flat` in `library.js` line 217.
- Whether a group's condition holds is `groupShown` in `editor.js` line 613 and an inline test in `project.js` line 75.
- The Apple platform is detected in `actions.js` line 32 and `library.js` line 229.

### 2.4 Sizes

Every module's size is in the table in 1.1. The whole is 12,721 lines of software outside the two data modules, 1,827 lines of stylesheet, 200 lines of page and 6,906 lines of tests.

Every top-level function over 80 lines, and the inner functions over 80 lines within the factories, from a brace-matching pass over the sources.

| Module | Function | Lines | Starts at |
|---|---|---|---|
| `editor.js` | `createEditor` | 1071 | 240 |
| `editor.js` | `control` (inner) | 94 | 916 |
| `flows.js` | `createFlows` | 942 | 55 |
| `store.js` | `createStore` | 839 | 99 |
| `relationships.js` | `createRelationshipsView` | 525 | 195 |
| `navigator.js` | `createNavigator` | 464 | 192 |
| `navigator.js` | `renderRow` (inner) | 120 | 388 |
| `shell.js` | `createShell` | 419 | 85 |
| `library.js` | `createLibraryPane` | 376 | 257 |
| `library.js` | `renderList` (inner) | 91 | 441 |
| `graph.js` | `createGraphView` | 338 | 275 |
| `graph.js` | `render` (inner) | 149 | 461 |
| `actions.js` | `createActions` | 268 | 47 |
| `dialog.js` | `createDialogs` | 239 | 21 |
| `dialog.js` | `open` (inner) | 92 | 31 |
| `views.js` | `createViewsPane` | 211 | 99 |
| `drawing.js` | `parseXml` | 134 | 39 |
| `validator.js` | `keywordProblems` | 118 | 176 |
| `validator.js` | `proseProblems` | 97 | 301 |
| `rating.js` | `graphFigure` | 93 | 215 |
| `retention.js` | `createRetention` | 87 | 31 |
| `history.js` | `createHistory` | 84 | 72 |
| `menu.js` | `openMenu` | 82 | 54 |

The factory functions are long because the module pattern puts every pane function inside one closure over its context. That is the pattern, not a fault, and the inner functions are mostly short. The three that are not are `control` in the editor, `renderRow` in the navigator and `render` in the graph, each a long chain of cases or a long layout pass. `createActions` is one literal list. `parseXml`, the two validator passes and `graphFigure` are long by nature and read top to bottom.

## 3. Dead and duplicated code

Every claim below was checked by grep over `app/` and `tests/`.

### 3.1 Exports nothing in the software imports

Most exports that no other software module imports are pure functions exported for the tests. That is the suite's design, and it is stated in the tests' own headers. The list below is the exports that neither the software nor a test imports.

- `files.js` `FILE_FORMAT`, used inside the module only.
- `graph.js` `groupKey`, used inside the module only.
- `navigator.js` `dropZone`, used inside the module only.
- `risk.js` `GRAPH_LEVELS` and `SCORING`, used inside the module only.
- `shell.js` `STORAGE_NOTICE` and `STORAGE_DETAIL`, used inside the module only, while their two siblings are tested.
- `views.js` `columnText`, used nowhere at all. Its doc says it is for the text exports, which do not exist yet. It is the one export that is dead in both directions.
- `store.js` `whenPersisted`, called by the tests only. It is a test seam in the production interface, and a deliberate one.

`risk.js` line 23 exports `ESTIMATED` as a copy of `METHODS`. `rating.js` and the attribute test read `ESTIMATED`, the risk test reads both and asserts they are equal. Two names for one list.

### 3.2 Functions and branches nothing reaches

- `files.js` lines 212 to 220. The migration loop never runs because `MIGRATIONS` at line 35 is empty and the schema is at version 1. The refusal inside it at line 215 is unreachable. This is the intended empty chain and is noted, not proposed against.
- `store.js` line 317. The open view's section is always an integer by construction at line 167, so the check that clears it never fires.
- `views.js` lines 42 to 45 and 148 to 151. The cell kinds `choice`, `choices`, `mark` and `lines` have no producer. `view-risk.js` produces strings, `entities`, `code` and `outcome` only. Likewise `spec.spec` at line 229, `spec.sortable` at line 212 and `column.sub` at lines 28 and 166 are read and never written. The tests reach all of them. I am unsure whether these are meant for the views the views proposal lists. If they are, they are scaffolding that has waited since the first view landed. If not, they are dead.
- `editor.js` line 121. `firstTabName` falls back to `Description` for an unknown code, which nothing calls it with. Tested, never reached in use.
- `dialog.js` line 235 and `toastRegion` at line 21. The toast returns silently when there is no region. Every caller passes one.

### 3.3 CSS nothing uses

Every class selector in the stylesheet matches a class the software sets, once the dynamic ones are read as their prefixes. `tone-high`, `tone-low` and `tone-negligible` come from `tone-${tone}`, `overlay-menu`, `overlay-panel` and `overlay-dialog` from `overlay-${kind}`, and `button-secondary` from `button-${action.kind ?? 'secondary'}`.

Two custom properties are defined and never read.

- `--indent` at line 162.
- `--text-place` at lines 45 and 100. A pin in `test-pins.js` line 554 asserts it styles no text on purpose, so the token stays as a documented choice.

Three selectors are declared twice as separate rules.

- `.rel-list` at lines 1291 and 1375.
- `.help-trigger:focus-visible` at lines 1053 and 1054.
- `.tree-row.pick-dim.excluded .designation` at lines 626 and 627, where the first sets a colour the second overrides.

`.checkbox` at line 736 and `.listbox .option .checkbox` at line 870 carry the same declarations. The consent box, the tree's pick box, the library row's box and the multiselect's box are four drawings of one checkbox with two rules.

Four comments describe rules that are no longer there.

- Line 717, the external editor's frame filling a dialog, which is now a pane, corrected by the next comment.
- Line 836, helper text under a field, with no rule following.
- Line 1009, a rating's row with the way into its dialog trailing, restated by the comment beneath it.
- Line 1284, the content switcher, with no rule following, whose removal `test-pins.js` line 285 pins.

Ten classes are set by the software and matched by no rule. They are hooks or leftovers. `drawing-body`, `head-tabs`, `library-import`, `messages`, `multiselect-field`, `pick-check`, `risk-scale-class`, `risk-score`, `rows` and `status-size`. `library-import` is a query hook at `library.js` line 365. The others carry nothing.

### 3.4 Helpers defined twice under different names

- `isPlainObject` in `files.js` line 246 and `validator.js` line 108, identical.
- Pluralising a count is done six ways. `plural` in `project.js` line 14, `count` in `records.js` line 148 with the `entitys` patch on line 149, `entities` and `verb` in `queries.js` lines 201 and 202, and inline ternaries in `flows.js` line 866, `relationships.js` line 301, `library.js` line 364 and `graph.js` line 605.
- Joining names with commas and a final and is `listed` in `editor.js` line 115 and `records.js` line 136.
- The pairs listed in 2.3.

### 3.5 Duplicated wording of the model

The flows write the same project commit twice, `saveEdit` at lines 418 to 427 and `saveProjectEdit` at lines 490 to 497. The first is the path the editor no longer takes, since `app.js` line 43 wires `onSaveProject`, so the project branch of `saveEdit` at lines 417 to 428 runs only from the tests. The flows test at line 252 exercises it directly.

## 4. Consistency

### 4.1 Naming

Names are consistent and the vocabulary is the requirements'. A creation function is `createX`, a check is `canX` beside its `x`, an outcome is `{ ok, reason }`, a pure derivation is a noun. The one drift is the pair `headIconButton` and `headIcon` for the same button. The flows import `renameProject` as `nameProject` at line 22 for no reason the code gives.

### 4.2 Comments and JSDoc

Every module opens with a doc block that says what it owns, and most functions carry a doc with typed parameters. The JSDoc uses `import()` types for cross-module shapes and `ReturnType<typeof>` for the factories, which is the right way to do it without a type system. Two things have slipped.

Doc blocks have come apart from the functions they describe where a function was inserted between them. Each of these is a doc that now sits above the wrong function, or above nothing.

- `dom.js` lines 71 to 77 document `icon`, which is at line 98 and has no doc. `tabKeys` at line 85 carries its own.
- `queries.js` lines 131 to 136 document a function that no longer exists, above `relatedIds`. `designated` at line 155 has no doc.
- `editor.js` lines 49 to 56 document `linkable`, which is at line 210 without a doc.
- `editor.js` lines 100 to 104 document `firstTabName`, which is at line 119 without a doc.
- `editor.js` line 456 is a one-line doc for a constant that was moved to `attributes.js`.
- `editor.js` lines 506 to 507 document `tableOf`, which is at line 592, above `entitiesNode`.
- `editor.js` lines 844 to 848 are an older doc for `followConditions`, restated by the block beneath.
- `flows.js` line 97 documents `cancelEdit` twice in a row.
- `flows.js` line 176 documents `renameSelection`, which is at line 189, above `editSelection`.
- `flows.js` lines 396 to 404 document `saveEdit`, which is at line 416 without a doc, above `markReviewed`.
- `flows.js` lines 657 to 661 document `clearBrowserData`, which is at line 720 without a doc, above `saveAsideCopy`.
- `flows.js` lines 841 to 845 document `loadExample`, which is at line 874 without a doc, above `importFromLibrary`.
- `graph.js` lines 412 to 415 are an older signature for `edge`, above its doc.
- `relationships.js` lines 160 to 171 document `createRelationshipsView`, which is at line 195, above `messageRows`.
- `store.js` line 324 documents `legacy`, which is at line 335, above `collapseRelationships`.

The comment style mixes two registers. Most comments say what the code does. A good number say why, and use the em dash and the colon as joints, which the project's writing rule keeps out of documents and the interface. The rule does not name code comments, so this is noted as a register the reply carries elsewhere, not as a breach. Three interface strings do carry the em dash, and those the rule does name. `queries.js` line 66 joins a form's label and its far type with one. `shell.js` line 47 joins the project's name and the software's in the tab title with one. `graph.js` line 320 joins a box's identifier and its label with one.

### 4.3 Error and outcome shapes

The model's `{ ok: true } | { ok: false, reason }` runs through `model.js`, `store.commit`, the flows' `toastRefusal` and `importInto`. The file layer widens it to `{ ok, code, statement, problems }` and the drawing check to `{ ok, reason }` with the reason completing a sentence. The three shapes are each documented and each fits its layer. `store.commit` at line 515 tolerates an action returning nothing, which no action does.

The dialogs resolve `null` for dismissed and a value otherwise. `prompt` resolves the trimmed text or the old value on blank, `confirm` a boolean, `choose` a value. `rateDialog` and `editDrawing` follow the same convention. Consistent.

### 4.4 How modules are constructed and wired

Every stateful module is a factory taking a context object and returning a small interface, and every pane subscribes to the store and renders. `app.js` constructs them in dependency order and wires callbacks by name, with the editor and the flows built in each other's presence through closures at lines 42 to 50. The pattern is applied without exception. Two small irregularities.

- `createEditor` takes `dialogs`, `drawingSurface` and `overlay` at lines 253 to 255, and its JSDoc at lines 225 to 239 names only `drawingSurface`.
- The `Action` typedef in `actions.js` lines 13 to 29 lacks `checked`, which the view actions carry at line 61 and the shell reads at line 231.

The store's session facts are each read at construction inside a try and catch, eleven times, and written inside another. The comment is the same eleven times. One `sessionRead` and one `sessionWrite` helper would say it once.

### 4.5 Whether the tests mirror the modules

Twenty-six test files stand against the 38 modules under `app/modules/`. The pure modules each have a test of their own name, with `test-cascade.js` as a second test of `model.js` and `test-example.js` as a test of the shipped data through the gates. `relate.js` and `graph.js` are tested inside `test-relationships.js`, `view-risk.js` inside `test-views.js` and `retention.js` inside `test-store.js`. The page modules have no headless test by design, and their headers say the browser checks them. The mirror is clean where it exists. The exceptions are the three modules tested under another module's name, which a reader looking for `test-graph.js` will not find.

## 5. The stylesheet

### 5.1 Whether it should split

It should not split into files. The software runs from source with no build, so a split is one request per part and one more place for a rule to hide. One file of 1,827 lines with a token block, a base and a section per surface reads fine, and every value carries its Carbon token in a comment, which is the file's best quality. The section headers are the split, and they are what needs the work.

### 5.2 By what rule the sections should be cut

The rule is already written in the headers, one section per surface. The Editor section from line 635 to line 1006 has stopped following it. It holds the editor's cells, then the drawing, the external editor's pane, the consent box, the checkbox, the whole library picker, the About dialog's forget button, the table attribute, the tags and their tooltips, the multiselect, the line tabs, the form button and the field. Half of that belongs elsewhere. The library picker is a surface, the consent is the drawing editor's, the tabs and the field are shared primitives, and `.about-forget` at line 811 belongs with About at line 1497.

A cut that would hold is the one the file already implies. Tokens. Base and shared primitives, which are the field, the button, the tag, the tabs, the checkbox, the tooltip, the splitter and the empty state. Then one section per pane and one per overlay, in the page's order. The relationship section should take the messages, and the graph should keep its own header, which now stands under a stale content switcher comment at line 1284.

### 5.3 What is dead

Listed in 3.3. Two unread tokens, three doubled selectors, one doubled checkbox rule, four stale comments and ten classes with no rule. Nothing else. The stylesheet has almost no dead rules, which is rare for a file this size and is worth saying.

## 6. The tests

### 6.1 Whether their shape follows the modules

It does, for the pure half. Each test file names its module, opens with a header saying what it exercises and what the browser checks instead, and groups its checks under headers that cite the requirement they serve. The harness is 117 lines and gives five assertions and a summary, which is enough. The shim gives `structuredClone` to the shell. The helpers give a storage stand-in, a stub editor and a fake document for dialog bodies.

The suite runs 3,441 checks. The largest files are `test-attributes.js` at 848 checks, most of them one loop over every definition, `test-pins.js` at 383 and `test-metamodel.js` at 325. The smallest are `test-icons.js` at 4 and `test-project.js` at 18.

### 6.2 What they cover twice

- The attribute definitions are checked against `notes/attributes.md` definition by definition in `test-attributes.js`. `test-editor.js` then restates about 200 lines of the same definitions by hand at lines 41 to 305, key lists, help strings, group orders and values. Where the document check passes, these can only fail together with it. They are a second transcription of the document, kept in a test.
- `firstTabName` is tested in `test-attributes.js` line 166 against the document and again in `test-editor.js` line 60 against a literal list.
- `recordOf`, `recordedStates` and `staleText` are tested in `test-records.js` lines 18 to 20 and again in `test-editor.js` lines 325 to 351 with the same cases.
- `loadExample` is driven in `test-example.js` lines 112 to 156 and the open gates in `test-files.js` and `test-example.js` both.
- The risk matrix and the graph are read from the document in `test-risk.js` and the same outcomes checked again through `ratingView` in `test-editor.js` lines 244 to 299.

### 6.3 What they pin that no requirement governs

`test-pins.js` is 607 lines and 383 checks that grep the source text for exact expressions. Its header says what it is and what a failure means, and that is honest. The pins split into three kinds.

The first kind guards a requirement by reading the source, where no behaviour test can. The content security policy at line 393, the one iframe at line 383, no `innerHTML` anywhere at line 379, the licences at line 35, the contrast of every text token at lines 539 to 552. These earn their place.

The second kind pins a ruling that has a requirement behind it but could be a behaviour test instead. Whether Escape stops at the editor at line 150, whether the toolbar drag stands down while picking at line 171. These grep for a line of code where a pure function exists that could be called.

The third kind pins wording and layout no requirement governs. The About dialog's credit rows at lines 142 to 144, the exact text of a JSDoc-sized comment in `records.js` at line 141, the graph's constants at lines 326 to 332, the order of the checkbox markup in `library.js` at line 308, the exact indentation of `app.js` at line 233. There are on the order of eighty of these. Each one breaks when the line it quotes is reformatted, and each failure is then an edit to the test to say the new line. That is a cost with no requirement paying for it, and it is the single thing that will make the code above harder to tidy.

Elsewhere the suite marks sections `(pin)` where they test behaviour no requirement names, fifty sections across seventeen files. Those are behaviour tests and are fine. The word `pin` is used for two different things.

### 6.4 What the tests do not reach

The flows test never calls sixteen of the 42 flows. `createFolder`, `editSelection`, `renameSelection`, `selectNode`, `placeNode`, `moveUp`, `moveDown`, `relateSelection`, `redo`, `importFromLibrary`, `importPicks`, `closeLibrary`, `openMetamodel`, `showAbout` and the two menu toggles. Most of these are one commit over a tested model function, but `importPicks`, `moveUp`, `moveDown` and `redo` carry logic of their own, and `test-pins.js` line 297 greps for the import commit instead of running it.

`createRetention` runs in the tests only on the path without IndexedDB. The real path cannot run headless and is checked in the browser.

## 7. Findings

Ranked by how much each would improve the code. Size is small for under an hour of change in one or two files, medium for a session across several files, large for a change that moves code between modules and needs the tests moved with it.

### 7.1 Move the pure field helpers out of `editor.js`

What. `editor.js` lines 35 to 222 export twelve pure functions, `draftChanged`, `ratingView`, `initials`, `codeShown`, `removalText`, `firstTabName`, `setValues`, `joinSet`, `tableRows`, `joinTable`, `linkable` and `LANDING_OFFER`. Three modules and four tests import the editor pane to reach them.

Why. It is the cause of every wrong-way edge but one. `view-risk.js` cannot be the pure module it says it is while it imports the pane. The tests of a pure helper load a module that expects a page.

Change. One new pure module for the helpers that read and write field values, with `attributes.js` a candidate for `firstTabName` and `records.js` for nothing. The editor imports from it as everyone else does. `LANDING_OFFER` stays with the editor, since only the editor and a pin read it.

Size. Medium.

### 7.2 Take the view registry out of the pane

What. `VIEWS` at `views.js` line 17 is imported by `actions.js` and `flows.js`, which otherwise touch no pane.

Why. The action list and the flows should not depend on a renderer to know what views exist.

Change. Export the registry from a pure module, either `view-risk.js` or a small `view-registry.js` that `views.js` also imports.

Size. Small.

### 7.3 Give the model one function that removes attribute keys

What. `flows.js` lines 500 and 819 delete keys on nodes directly, once inside a commit and once on a loaded model.

Why. `model.js` promises at line 3 that nothing else writes to a model, and the promise is what makes the can and do pairs trustworthy.

Change. One model function that removes named keys from an entity and returns an outcome, used by both places and tested in `test-model.js`.

Size. Small.

### 7.4 Bring the doc blocks back to their functions

What. Fifteen doc blocks listed in 4.2 sit above the wrong function or above nothing, and nine functions stand without theirs.

Why. A reader trusts the block above a function. Today six of those blocks describe something else.

Change. Move each block to its function, delete the three that restate a block beneath them, and write the missing doc for `icon`, `designated`, `linkable`, `firstTabName`, `tableOf`, `editSelection`, `saveEdit`, `clearBrowserData` and `loadExample`.

Size. Small.

### 7.5 Trim the source pins to what a requirement needs

What. About eighty checks in `test-pins.js` quote source lines that no requirement governs, listed in 6.3.

Why. Every finding above this one is a change to a line some pin quotes. The pins will fail, and the fix each time is to paste the new line into the test. That is friction that teaches nobody anything.

Change. Keep the pins of the first kind. Turn the second kind into calls on the pure functions they quote. Drop the third kind, and where a wording is worth keeping, keep it as a behaviour check on the function that produces it.

Size. Medium.

### 7.6 Split `editor.js` by control

What. The rating cell at line 650, the drawing cell at line 1023 and the table control at line 1087 are each a self-contained control of 45 to 60 lines with their own hidden input, their own repaint and their own dialog. The landing at lines 1209 to 1231 and the project editing at lines 1151 to 1169 are two more concerns.

Why. At 1310 lines with a 1071-line factory, the editor is the hardest module to change. The controls are the parts that will change most, since every new attribute kind lands there.

Change. One module per control taking the same small context the editor passes them now, `dialogs`, `store`, the refreshers list and the draft reader. The landing can go to its own module, since `test-pins.js` line 88 already treats it as a thing of its own. The project editor can stay.

Size. Large.

### 7.7 Share the four copied pane pieces

What. The head search, the icon-only head button, the empty state and the entity designation are each written two to five times, listed in 2.3.

Why. Four copies means four places for a change to the head to land, and `library.js` and `relationships.js` have already drifted by one line each.

Change. Put the head search, the head button and the empty state in `dom.js` beside `tooltipOn`, or in a small `pane.js`. Put the designation there too as a function that returns the three nodes.

Size. Medium.

### 7.8 Reorder the stylesheet's sections

What. The Editor section holds seven other surfaces' rules, listed in 5.2, and four comments describe rules that are gone.

Why. A rule a reader cannot find is a rule that gets written again, which is how `.checkbox` came to exist twice.

Change. Cut by the rule in 5.2, move the misplaced rules under their own headers, fold the doubled selectors and drop the stale comments. No rule changes value.

Size. Small.

### 7.9 Keep all session state in the store

What. The splitter layout lives in `shell.js` line 407 and the column widths in `columns.js` line 17.

Why. The store says at line 6 that it is the one owner of what outlives a render, and `clearBrowserData` at line 456 clears every session key but these two.

Change. Two store facts with getters and setters like the others, or at least the layout, since the column widths are meant to die with the visit. I am unsure whether the columns' in-memory scope is a choice, and `test-pins.js` line 196 pins that they never touch storage, which reads as one.

Size. Small.

### 7.10 One session helper in the store

What. Eleven identical try and catch blocks around `session` reads and writes.

Why. Eleven copies of one comment.

Change. `sessionRead(key)` and `sessionWrite(key, value)` inside the factory.

Size. Small.

### 7.11 Fold the duplicated helpers

What. `isPlainObject` twice, pluralising six ways, `listed` twice, `leaderOf` and `leaderName`, `groupAttributes` and `flat`, `groupShown` twice, the platform test twice.

Why. Small each, and together the sign of modules that do not know what their neighbours offer.

Change. `isPlainObject` to one place, `files.js` importing it from `validator.js` or the reverse. A `plural(count, noun)` and a `listed(names)` in one pure module. `leaderOf`, `groupShown` and `groupAttributes` exported from `attributes.js`, where the shapes they read are defined. The platform test in `actions.js` exported for `library.js`.

Size. Small.

### 7.12 Build the shell's notices through `dom.js`

What. `shell.js` lines 305 to 358 build eleven elements by hand.

Why. It is the one place that does, and it is a third longer than the same markup through `el` and `icon`.

Change. Rewrite `notice` with `el` and `icon`, as the editor's `placeNotices` at line 579 already builds the same anatomy.

Size. Small.

### 7.13 Take the second transcription out of `test-editor.js`

What. Lines 41 to 305 restate the attribute definitions that `test-attributes.js` reads from the document.

Why. When the document changes, two tests fail and one of them is corrected by copying. The ratings section at lines 244 to 299 is the part that tests `ratingView` and belongs.

Change. Keep the `ratingView`, `codeShown`, set and table checks. Delete the definition restatements, or move the few that state something the document does not, such as the shared verification method list at line 101, into `test-attributes.js`.

Size. Medium.

### 7.14 Decide the view renderer's unused kinds

What. `views.js` reads seven cell and column shapes that no view produces, listed in 3.2.

Why. If they are scaffolding for the next views they should say so at the head of the module. If not, they are eighty lines of dead branches that the tests keep alive.

Change. A sentence in the module doc naming them as scaffolding, or their removal with the tests that reach them. I am unsure which is intended and the views proposal suggests the former.

Size. Small.

### 7.15 Let the flows use `pickedRows`

What. `flows.js` lines 585 to 605 re-derive what each pick means.

Why. `relate.js` line 54 is the one place that rule is written, and the two must agree.

Change. `completeRelate` maps `pickedRows(model, picker)` and relates each row that carries a form.

Size. Small.

### 7.16 Drop the dead branch of `saveEdit`

What. `flows.js` lines 417 to 428, the project branch of `saveEdit`, which the editor no longer calls since `onSaveProject` was wired.

Why. It is a second copy of the project commit that only the flows test reaches.

Change. Remove the branch and the `null` case from the doc, and point the test at `saveProjectEdit`.

Size. Small.

### 7.17 Small things

- `risk.js` line 23, `ESTIMATED` is `METHODS` under a second name.
- `store.js` line 317, an unreachable check.
- `store.js` line 811, the doc says never persisted and the setter writes the session.
- `actions.js` line 13, the typedef lacks `checked`.
- `editor.js` line 225, the JSDoc lacks `dialogs` and `overlay`.
- `dom.js` line 98, `icon` builds its svg by hand while `svg` is three functions above.
- `menu.js` lines 70 to 87 are indented one level short.
- `queries.js` line 66, `shell.js` line 47 and `graph.js` line 320 put an em dash in the interface.
- `flows.js` line 22 renames `renameProject` to `nameProject` on import.
- `views.js` line 26, `columnText` is dead.
- `relate.js`, `graph.js` and `view-risk.js` have no test file of their own name.

Size. Small, each.

## 8. Outcome

Every finding was taken up between 27 and 28 September 2026, in the order the review ranked them, one commit each.

| Findings | Commit |
|---|---|
| 7.5 the source pins | `2103f31` |
| 7.3, 7.4, 7.15, 7.16, 7.17 the model's writes, the doc blocks, the dead paths and the small things | `cd4a4c5` |
| 7.1, 7.2, 7.11 the field helpers, the view registry and the folded helpers | `4a60c2a` |
| 7.7, 7.12 the shared pane pieces and the shell's notices | `c2aae33` |
| 7.8, 7.9, 7.10, 7.13, 7.14 the stylesheet, the store's session facts, the editor test and the views note | `a76fea1` |
| 7.6 the editor split | `44568b4` |

Three findings were decided otherwise. The column widths stay in memory by choice, so only the splitter layout moved into the store. The unused cell kinds of the views, and the column text of 7.17 with them, are named as scaffolding rather than removed. The editor test keeps its checks on the field helpers and lost only the restated definitions.

One regression came with the rounds and was fixed in `930aa53`, a menu that lost its entries to a re-indentation. The suite could not see it because the page modules have no headless test, and the browser drives that caught it live outside the repository. Bringing them in is the open item this review leaves.

## 9. What to leave alone

The store as one owner. It is long because there are many session facts, its interface is flat, and every method has a test. Splitting it by fact would make the persistence chain and `clearBrowserData` harder to see whole.

The factory and closure pattern. Every module is built the same way and wired in one file, and that uniformity is worth more than the shorter functions a class or a dispatch table would give.

The validator's frozen tables. `validator.js` copies the type codes and relationship identifiers rather than importing `metamodel.js`, and says why at line 4. A schema version is a contract, and the copy is what makes version 1 stay version 1 when the metamodel moves.

The hand-written XML parser. `drawing.js` reads a drawing itself so that no markup touches the browser's parser before it is checked, which N-SEC-001 and N-SEC-003 ask for. It is 134 lines and tested fault by fault.

The pre-paint theme script. `theme.js` repeats `effectiveTheme` because it runs before any module loads, under the content security policy, and a pin holds the two to the same literals.

The web-storage migration in `store.restore`. Lines 365 to 402 move a blob the previous generation kept in `localStorage`. I am unsure how many users that generation has, and the code is tested and harmless. It can retire when the beta closes, not before.

One stylesheet with tokens in comments. The tokens are the design system, copied in by value as G-SYS-001 asks, and the comment beside each value is the only place the token's name survives.

The pure exports for the tests. A module exporting its pure parts so the shell can call them is how a no-dependency suite reaches inside, and the headers say so. `whenPersisted` is the same in the store.

The graph's layout as pure functions. `graph.js` lines 29 to 249 are geometry with no page, and `test-relationships.js` covers them cell by cell. The render at line 461 is long because it draws, and drawing is long.

The interface text inside `queries.js`, `records.js` and `project.js`. Each sentence stands beside the count it states, and a module of sentences apart from their counts would be harder to keep true.

## 10. References

| No. | Reference | Link |
|---|---|---|
| [1] | Requirements specification, chapter 2.3 Technical, C-TEC-001 to C-TEC-004 | `specs/requirements.md` |
| [2] | Document form and structure | `notes/template.md` |
| [3] | Views in the app, working plan | `notes/proposals/views-proposal.md` |
