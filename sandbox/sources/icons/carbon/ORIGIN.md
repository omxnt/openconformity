# Origin

IBM Carbon icons, vendored from the official Carbon repository. These files are
the sources. The glyphs are inlined as an SVG sprite in
`sandbox/app/index.html`, so nothing in this folder is loaded at runtime.

This folder sits in the sandbox because the Carbon redesign is still an
experiment. If it graduates, this folder moves to `sources/icons/carbon/`.

| Package | Version | Source |
|---|---|---|
| @carbon/icons | 11.85.0 | https://github.com/carbon-design-system/carbon/tree/main/packages/icons |

Each glyph is taken at its 16 px optical size where the package provides one,
and at 32 px otherwise; no glyph drawn here at 32 px ships a 16 px cut. The
files here are the repository sources, in which a shape may be a `rect` or a
`polygon` that the package build converts to an equivalent `path`; the sprite
carries the built form.

The entity icons are chosen for their silhouettes: sixteen types have sixteen
distinct outer shapes, so a row in a dense tree is told apart at 16 px without
reading the marks inside a shared frame.

No icon in this set is a company logo or a brand mark. Carbon publishes those
under `logo--*` names, and the Apache 2.0 licence does not extend to the
trademarks they represent, so none of them is used.

License: Apache License 2.0, see LICENSE.txt.

## Mapping


### System Context

| Symbol | Carbon icon | Size | File |
|---|---|---|---|
| `i-elm` | `cube` | 32 | `cube.svg` |
| `i-act` | `user` | 16 | `user.svg` |
| `i-tsk` | `task` | 32 | `task.svg` |
| `i-phs` | `time` | 32 | `time.svg` |


### Legislative Framework

| Symbol | Carbon icon | Size | File |
|---|---|---|---|
| `i-leg` | `scales` | 32 | `scales.svg` |
| `i-std` | `book` | 32 | `book.svg` |
| `i-cas` | `certificate--check` | 32 | `certificate--check.svg` |
| `i-ntb` | `building` | 32 | `building.svg` |


### Risk Assessment

| Symbol | Carbon icon | Size | File |
|---|---|---|---|
| `i-haz` | `warning--alt` | 16 | `warning--alt.svg` |
| `i-scn` | `flash` | 32 | `flash.svg` |
| `i-rrm` | `security` | 32 | `security.svg` |
| `i-saf` | `chip` | 32 | `chip.svg` |


### Requirements Definition

| Symbol | Carbon icon | Size | File |
|---|---|---|---|
| `i-esr` | `paragraph` | 32 | `paragraph.svg` |
| `i-str` | `bookmark` | 32 | `bookmark.svg` |
| `i-req` | `list--checked` | 32 | `list--checked.svg` |
| `i-ver` | `checkmark--outline` | 32 | `checkmark--outline.svg` |


### Filing

| Symbol | Carbon icon | Size | File |
|---|---|---|---|
| `i-folder` | `folder` | 32 | `folder.svg` |
| `i-project` | `portfolio` | 32 | `portfolio.svg` |


### Actions

| Symbol | Carbon icon | Size | File |
|---|---|---|---|
| `i-new-entity` | `add` | 32 | `add.svg` |
| `i-new-folder` | `folder--add` | 32 | `folder--add.svg` |
| `i-new-related` | `add--child-node` | 32 | `add--child-node.svg` |
| `i-add-relationship` | `create-link` | 32 | `create-link.svg` |
| `i-remove-relationship` | `unlink` | 32 | `unlink.svg` |
| `i-edit` | `edit` | 32 | `edit.svg` |
| `i-new-project` | `document--add` | 32 | `document--add.svg` |
| `i-open-project` | `folder--open` | 32 | `folder--open.svg` |
| `i-delete` | `trash-can` | 32 | `trash-can.svg` |
| `i-move-up` | `arrow--up` | 16 | `arrow--up.svg` |
| `i-move-down` | `arrow--down` | 16 | `arrow--down.svg` |
| `i-move-to` | `move` | 32 | `move.svg` |
| `i-undo` | `undo` | 32 | `undo.svg` |
| `i-redo` | `redo` | 32 | `redo.svg` |
| `i-metamodel` | `model--alt` | 32 | `model--alt.svg` |
| `i-save` | `save` | 16 | `save.svg` |


### Interface

| Symbol | Carbon icon | Size | File |
|---|---|---|---|
| `i-chevron-right` | `chevron--right` | 16 | `chevron--right.svg` |
| `i-chevron-down` | `chevron--down` | 16 | `chevron--down.svg` |
| `i-search` | `search` | 16 | `search.svg` |
| `i-close` | `close` | 32 | `close.svg` |
| `i-information` | `information` | 16 | `information.svg` |
| `i-theme-light` | `light` | 16 | `light.svg` |
| `i-theme-dark` | `asleep` | 16 | `asleep.svg` |
| `i-launch` | `launch` | 16 | `launch.svg` |
| `i-email` | `email` | 32 | `email.svg` |
| `i-view-graph` | `chart--relationship` | 32 | `chart--relationship.svg` |
| `i-view-list` | `list` | 32 | `list.svg` |
