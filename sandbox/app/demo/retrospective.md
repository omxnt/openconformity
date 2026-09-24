# Retrospective

What the demo's code taught, written down before v1 is started from scratch. The features are not the subject: this is about which module boundaries held under change, which fought it, where functions and state outgrew their homes, and what the proof of concept had already shown before the demo repeated or corrected it. File references name the demo's `modules/` unless marked as poc.

## 1. Boundaries that held

### 1.1 One writer, and checks that are the mutation

`model.js` is the only module that writes to a model, and every mutation is a pair: `canMoveNode`/`moveNode`, `canPlaceBeside`/`placeBeside`, `canRelate`/`addRelationship`, each returning `{ ok, reason }`. The interface asks the same question the mutation answers, so drag-over highlighting, greyed menu items and the mutation itself cannot disagree — the navigator's `canDrop` is the model's check, verbatim. The pattern paid for itself three times over: `fromJSON` validates a file by feeding it through the same `addEntity`/`addRelationship` the interface uses, and `example.js` builds the example through them too, so an example that broke the metamodel would fail at load rather than ship. Keep this exactly as it is.

### 1.2 The metamodel as data

`metamodel.js` is a transcription: one entry per type, one row per arrow, and everything the interface offers is generated from it — the New entity menu, the New related menu, the relationship forms, the pickers. Adding an arrow is one line and every menu already knows. The corollary held too: a combination the metamodel does not define is never *offered*, and the model still checks it on the way in, so the two layers back each other up instead of trusting each other.

### 1.3 One list of actions

`actions.js` builds `selectionActionItems` once, and the toolbar, the Edit menu and the right-click menu are all drawn from it. The three cannot drift, and adding an action is one entry. This was a direct correction of the poc, where `menus.js`, the tree's per-group `+` buttons and the editor's delete button each carried their own idea of what could be done.

### 1.4 Snapshots, factories, and dumb chrome

Three smaller boundaries earned their keep. `history.js` snapshots the whole model with `structuredClone` instead of writing inverse operations — possible only because `model.js` keeps the model as plain Maps of plain objects, which is a property worth defending in v1. Every pane is a `create*` factory taking an explicit context object, where the poc used module-level singletons (`mountTree` with file-scope `mountEl`, `unsubscribe`, four collapsed-state Maps); the factories have no hidden globals and their dependencies are legible in the signature. And `menu.js`/`dialog.js` know nothing about the model — they render item lists and specs — so they survived every model change untouched. `dom.js` sets text only through `textContent`, which makes the injection story one file long.

## 2. Boundaries that fought

### 2.1 app.js became the home for everything homeless

`app.js` is 1,183 lines — the largest module — and its header says "Wiring". Wiring is perhaps 300 of those lines. The rest is a store (the `state` object, `commit`, `persist`, autosave failure tracking), an edit-guard system, selection management (`select`, `setSelection`, `surviving`), every create/delete flow with its dialog, file open and save, the splitters, the theme, the filter, the demo notice, and the brand-link guard. None of these is large, but they all share `state` through closure, so none can move out without threading accessors — the cheapness of closure capture is exactly what let the file grow. v1 should split what the demo fused: a store that owns the project, the dirty flag, history and persistence; the flows that ask questions and call the store; and the shell chrome that touches neither.

### 2.2 The guard conventions

Nothing may destroy an open edit or unsaved work without asking, and the demo enforces this by convention: thirteen call sites each remember to open with `guardEdit(() => itself)`, and the whole-project flows additionally re-enter themselves with a `discarded` flag through `guardUnsaved`. Two different continuation styles exist for one idea because `dialog.js` is callback-based — a dialog cannot be awaited, so every caller re-invokes itself as its own continuation. A new action that forgets the incantation silently loses an edit, and nothing but review catches it. v1 should make dialogs return promises, at which point both guards collapse into ordinary straight-line code (`if (!await confirmDiscard()) return`) and the convention becomes unforgettable because it is just control flow.

### 2.3 The folder/entity split leaks into every module

`model.js` keeps folders and entities in two Maps, for a defensible reason (folders mean nothing to the metamodel). The cost is a discriminator threaded through everything: the `Selection` kind, `selectionFor` and `expandKeyFor` reconstructing kinds from ids in `app.js`, the tree keying rows `folder:`/`entity:`, and inside `model.js` itself the map is picked three different ways — by `what.kind` in `moveOrder`, by `source.kind` in `placeBeside`, by `model.folders.has(id)` in `moveNode` and `siblingsOf`. The type describing "where the user stands" is defined in `navigator.js` and imported upward by `app.js` and `actions.js`, while `model.js` declares its own structurally identical `MoveTarget` — one shape, two names, owned by a pane. v1 should decide once: either one node collection with a `kind` field, or two collections with every kind-dispatch confined inside the model so no pane ever asks `folders.has(id)`. Either way the selection type belongs to the store, not to the tree that displays it.

### 2.4 Full re-render lost what nobody owned

`renderAll()` redraws four panes on every commit. As a state discipline it worked — nothing ever went stale — but everything transient that no module owned was destroyed with the DOM: the navigator's scroll position (the poc's tree preserved `scrollTop` across renders; the demo dropped that), keyboard focus (patched with `focusWasInTree`/`focusSelected`), and the add-relationship panel, which `render()` closes on principle because any redraw might have moved the ground under it. The lesson is not that full re-render is wrong — it is the right default at this scale — but that transient view state must be explicitly owned and restored by the pane it belongs to, the way `expanded` already is, rather than being an accident of DOM lifetime.

## 3. Functions that outgrew themselves

`openAddRelationshipPanel` in `relationships.js` is ~170 lines and is really a component: it holds the picking state (`picked`, `currentSpec`) in closure, defines `refresh`, `renderPicked` and `completePicks` as nested functions, drives the navigator into picker mode, and assembles the panel DOM. None of its state is visible from outside and none of it is testable without a DOM. The same file holds the list view and the SVG graph layout — three loosely related things sharing one `render()` dispatch; 665 lines that should be a workflow module and two view modules.

`node()` in `navigator.js` takes a spec object with twelve optional fields and builds the row, the twisty, selection, picker behaviour, drag-and-drop and (via `onKeyDown`) tree navigation. It is a component interface expressed as one function with a bag of options, and each new concern widened the bag.

`fromJSON` in `model.js` is four passes — folders, entities, parent settling, relationships — plus counter recovery by parsing ids. Its length is defensible; what is not is that the id-parsing counter recovery is written a second time in `example.js`. One function should own "restore the counters from ids".

The poc showed where this road ends: `renderGroup` in poc `tree.js` reached ~210 lines with `typeKey === 'legislation'` special cases inlined at each level, and the list view in poc `trace.js` ran past 300. The demo's uniform tree (anything files inside anything) is what deleted those special cases, and that uniformity is worth protecting in v1.

## 4. State in more than one place

**Saved-ness lives in four spots.** `state.unsaved` in memory, `savedToFile` in the autosave blob, `autosaveFailed` beside them, and implicitly in the history — `step()` sets `unsaved = true` unconditionally because "which history entry matches the file" is not recorded, an approximation admitted in its own comment. The poc had the same disease worse (`dirty` per project, an autosave entry, a last-manual-save record, and a restore flow that calls `updateMeta(pid, {})` purely to re-dirty a project). v1 should let the store own one saved-state answer and derive everything shown from it.

**Selection lives in three.** `state.selection`, the DOM's `.selected`/`tabindex`, and a copy inside every history entry. Full re-render keeps the DOM copy honest, but focus and reveal repair is hand-written glue in `app.js`.

**Derived data rides on the model.** `relationshipKeys` is an index that `addRelationship`/`removeRelationship` must maintain in lockstep, and the three counters are derived from ids and rebuilt on load. Both are small, but they are the pattern that grows: denormalised state on the serialised object, correct only while every writer remembers. v1 should keep derived indexes off the model shape or rebuild them in exactly one place.

**The picker is two closures shaking hands.** `relationships.js` holds `picked` and `currentSpec`; `navigator.js` holds `picker`; every change re-sends the spec through `setPicker`. The interaction's fragility shows in the rule that any render closes it. A mode like this is one piece of state and should have one owner — plausibly the store, as an explicit interaction mode the panes read.

**The DOM is briefly the source of truth.** `toggle()` in `navigator.js` finds the descendants to collapse by querying rendered `.node[data-key]` elements, and the relationship pane decides whether Escape is its own by `document.querySelector('.overlay')` — three overlay systems (dialog, menu popups, side panel) with no shared layering, coordinated by sniffing each other's class names. v1 needs one owner for "what is open above the page".

## 5. What the poc taught on its own

**Relationships as first-class rows beat ref-fields.** The poc stored links as `ref`/`ref-array` fields on artifacts, so deleting anything meant `cleanupIncomingRefs` walking every artifact × every field, and finding incoming links meant scanning the project. The demo's single relationship Map with a duplicate-check Set made deletion a filter and the duplicate check a lookup. This is the deepest structural lesson either prototype produced.

**An unused axis of generality taxes every line.** The poc's multi-project workspace doubled every signature to `(projectId, artifactId)`, quadrupled the tree's collapsed-state bookkeeping, and invented activation semantics — for a capability with no requirement behind it. The demo cut it and the entire layer vanished. Generality that nothing demands is not free even when it works.

**Pub/sub was ceremony at this scale.** The poc's typed `Change` events let each pane filter what it cared about, but nearly every `handleChange` just called `render()` — the granularity was declared, then ignored. The demo's synchronous `renderAll` is simpler and cannot miss. The one filtering rule that mattered — the poc editor's "don't re-render on `update`, it would clobber the input the user is typing in" — the demo solved properly with the explicit edit mode and draft, which is the better fix and is now a locked decision.

**Registry-driven storage bent the state module.** Poc `types.js` declaring fields as data was sound (the demo kept the idea as `metamodel.js`), but it also declared per-type `storageKey` arrays, forcing the state module to be generic over storage and the tree to special-case what the registry could not express. The demo stores every entity in one Map with a `type` field: uniform storage, and the registry describes meaning only. Also worth keeping from the poc, since the demo dropped it: preserving `scrollTop` across a tree render.

## 6. What v1 does differently

1. **Three modules where app.js was one.** A store owning the model reference, selection, dirty flag, history and persistence behind `commit`; flow modules that ask questions and call the store; shell chrome that knows neither. The wiring file only constructs and connects.
2. **Promise-based dialogs**, so the edit and unsaved guards become linear control flow instead of a self-re-entering convention at thirteen call sites.
3. **The selection type and the node question owned by the model/store layer.** One shape for "where the user stands", and kind-dispatch confined inside the model whichever storage layout is chosen.
4. **Transient view state owned per pane** — scroll, focus, expansion, open panels — explicitly preserved across renders, so full re-render stays viable as models grow.
5. **One overlay owner** for dialogs, popup menus and side panels, with a layering rule, instead of three systems sniffing the DOM for each other.
6. **Derived data rebuilt in one place** (counters, keys, indexes), never maintained by convention across writers, never part of the serialised shape.
7. **Panes split by what they are, not where they sit**: the add-relationship workflow, the list view and the graph view are three modules, and a picker mode is store state with one owner.
8. **Kept from the demo unchanged:** the single-writer model with can/do pairs returning `{ ok, reason }`, the metamodel as transcribed data generating every offer, one action list feeding all three menus, snapshot history over a `structuredClone`-able model, `textContent`-only element construction, and factories over module singletons. The model layer stays free of DOM imports so it can be tested headless.

## 7. References

| No. | Reference | Link |
|---|---|---|
| *[1]* | *Reference*| *Link* |
