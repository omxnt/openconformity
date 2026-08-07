# Origin

IBM Carbon icons, vendored from the official package. The glyphs are inlined as
an SVG sprite in `index.html`; no file in this folder is loaded at runtime.

| Package | Version | Source |
|---|---|---|
| @carbon/icons | 11.85.0 | https://github.com/carbon-design-system/carbon/tree/main/packages/icons |

Most glyphs here are ones the software already vendors, copied from `app/`
rather than taken from the package again, so the two deployments cannot drift
apart. `error--outline` is the exception: the software has no use for it, so it
was taken from the package directly, at the same version. The size column is
the optical size of the cut, as the software records it: each glyph is taken at
16 px where the package provides that cut, and at 32 px otherwise.

The files in this folder are the repository sources, in which a shape may be a
`rect` or a `polygon`; the sprite carries the built form the package publishes,
in which those are equivalent `path` elements and the transparent bounding
rectangle is gone. The source of `error--outline` carries a `title` reading
"checkmark", which is an error upstream in Carbon and not one to correct here:
the build strips titles, so nothing on the page reads it.

A symbol is named for the Carbon icon it holds rather than for one of its uses,
because `launch` stands in two places and a name taken from the first would
misdescribe the second.

The entity type icons the software draws in its relationship graph are no
longer vendored here. The graph on this page is a screenshot of the software's
own pane rather than a drawing of it, so the glyphs inside it come with the
image.

The principle cards draw their icons at 20 px, the Carbon icon size between the
two cuts. A 32 px cut reduced to 20 px and a 16 px cut enlarged to 20 px land on
much the same stroke weight, so the six read as one set although they are drawn
from both. Everywhere else the icons are 16 px, as they are in the software.

No icon in this set is a company logo or a brand mark. Carbon publishes those
under `logo--*` names, and the Apache 2.0 licence does not extend to the
trademarks they represent, so none of them is used.

License: Apache License 2.0, see LICENSE.txt.

## Symbols

| Symbol | Carbon icon | Size | File |
|---|---|---|---|
| `i-scales` | `scales` | 32 | `scales.svg` |
| `i-security` | `security` | 32 | `security.svg` |
| `i-launch` | `launch` | 16 | `launch.svg` |
| `i-error-outline` | `error--outline` | 16 | `error--outline.svg` |
| `i-chart-relationship` | `chart--relationship` | 32 | `chart--relationship.svg` |
| `i-catalog` | `catalog` | 32 | `catalog.svg` |
| `i-theme-light` | `light` | 16 | `light.svg` |
| `i-theme-dark` | `asleep` | 16 | `asleep.svg` |
| — | `chevron--down` | 16 | `chevron--down.svg` |

`chevron--down` is the accordion's, and is the one glyph not in the sprite. It
belongs to no element of its own, so it is carried in `style.css` as a data URI
masking the row's colour, the way the software carries its select arrow.

## Roles

Each card keeps the subject its drawn icon had, so the replacement changes the
hand and not the meaning.

| Card | Symbol | Why |
|---|---|---|
| Free and open-source | `i-scales` | The licence the work is placed under |
| Your data stays yours | `i-security` | The shield the drawn icon already was |
| Runs in your browser | `i-launch` | The window the drawn icon already was |
| Draws no conclusions | `i-error-outline` | A circle struck through: the sign for what is not done |
| Traceable and reusable | `i-chart-relationship` | The entity related rather than repeated |
| Engineering artefacts | `i-catalog` | The document the drawn icon already was |

### Interface

| Place | Symbol |
|---|---|
| A link that opens a window of its own | `i-launch` |
| The theme toggle | `i-theme-light`, `i-theme-dark` |
| The accordion disclosure | `chevron--down`, as a mask in `style.css` |
