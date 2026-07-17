# Brand

## Table of Contents

- [1. Wordmark](#1-wordmark)
  - [1.1 Specification](#11-specification)
  - [1.2 Favicon](#12-favicon)
- [2. Typography](#2-typography)
- [3. Color](#3-color)
  - [3.1 General](#31-general)
  - [3.2 Light Mode](#32-light-mode)
  - [3.3 Dark Mode](#33-dark-mode)
  - [3.4 Verification](#34-verification)
- [4. Application](#4-application)
- [5. Attribution](#5-attribution)

## 1. Wordmark

### 1.1 Specification

| Property | Value |
|---|---|
| Lettering | "openconformity" |
| Case | Lowercase |
| Typeface | IBM Plex Sans, Medium (500) |
| Letter spacing | −1% |
| Color | Single color, single weight. Never split, never with a symbol |
| Default | Ink on canvas. 15.9:1 light, 16.1:1 dark |
| On Cerulean | White on `#00749D`. 5.3:1 |

**Note 1:** The asset is the lettering as paths, tight to the ink. No font is required to render it, and no space is built into it.

### 1.2 Favicon

| Property | Value |
|---|---|
| Lettering | "o" |
| Case | Lowercase |
| Typeface | IBM Plex Sans, Medium (500) |
| Color | White on Cerulean `#00749D`, 5.3:1 |
| Radius | 2 px at 32 px |
| Modes | One asset, both modes |

**Note 1:** The letter is taken from the wordmark. It is not a monogram and carries no meaning on its own.

## 2. Typography

| Role | Typeface | Weights |
|---|---|---|
| UI and body | IBM Plex Sans | 400, 500 |
| IDs, clauses, data | IBM Plex Mono | 400 |

## 3. Color

### 3.1 General

Every chromatic color is Reasonable Colors under one rule: **shade 4 in light mode, shade 3 in dark mode**, on the canvas of its mode. Any hue under this rule yields at least 4.5:1 on its canvas. Sections 3.2 and 3.3 are the complete set.

**Note 1:** Grays do not follow the rule. They mirror across modes. The rule guarantees AA, which is the floor for a marker and wrong for body text: gray-4 gives 5:1 where Ink gives 15.9:1.

**Note 2:** Canvas values are not from the palette. Light is pure white, against which the palette's guarantees are anchored. Dark is `#1A1A1A` because gray-6 as a canvas leaves cerulean-3 at 4.48:1, under AA.

**Note 3:** The four markers identify entity kinds. The entity name always accompanies the marker, so nothing is read from color alone.

**Note 4:** No color means pass or fail.

### 3.2 Light Mode

| Role | Use | Source | Value | Ratio |
|---|---|---|---|---|
| Canvas | The only background | n/a | `#FFFFFF` | n/a |
| Ink | All text, and the wordmark | gray-6 | `#222222` | 15.9:1 |
| Muted | Secondary text, labels | gray-4 | `#6F6F6F` | 5.0:1 |
| Hairline | The only divider, 1 px | gray-2 | `#E2E2E2` | n/a |
| Cerulean | Links, focus ring, selection, primary action, favicon | cerulean-4 | `#00749D` | 5.3:1 |
| Legislative | Marker | violet-4 | `#794AFF` | 5.0:1 |
| Requirements | Marker | magenta-4 | `#CA00B6` | 5.0:1 |
| Hazard Analysis | Marker | orange-4 | `#CD3C00` | 5.0:1 |
| Structure | Marker | green-4 | `#008217` | 5.0:1 |

### 3.3 Dark Mode

| Role | Use | Source | Value | Ratio |
|---|---|---|---|---|
| Canvas | The only background | n/a | `#1A1A1A` | n/a |
| Ink | All text, and the wordmark | gray-1 | `#F6F6F6` | 16.1:1 |
| Muted | Secondary text, labels | gray-3 | `#8B8B8B` | 5.1:1 |
| Hairline | The only divider, 1 px | gray-5 | `#3E3E3E` | n/a |
| Cerulean | Links, focus ring, selection, primary action | cerulean-3 | `#0092C5` | 4.9:1 |
| Legislative | Marker | violet-3 | `#9B70FF` | 5.1:1 |
| Requirements | Marker | magenta-3 | `#F911E0` | 5.1:1 |
| Hazard Analysis | Marker | orange-3 | `#FD4D00` | 5.2:1 |
| Structure | Marker | green-3 | `#00A21F` | 5.1:1 |

**Note 1:** The favicon keeps the light value of Cerulean in both modes.

### 3.4 Verification

Minimum pairwise ΔE between the four markers, and the pair that sets it:

| Vision | Light | Pair | Dark | Pair |
|---|---|---|---|---|
| Typical | 34.4 | Legislative / Requirements | 31.4 | Legislative / Requirements |
| Deuteranopia | 8.0 | Hazard Analysis / Structure | 8.7 | Hazard Analysis / Structure |
| Protanopia | 11.7 | Legislative / Requirements | 9.2 | Legislative / Requirements |
| Tritanopia | 1.6 | Legislative / Structure | 5.3 | Requirements / Hazard Analysis |

**Note 1:** ΔE is CAM02-UCS, where 1 is approximately a just-noticeable difference. Not comparable to CIE76.

**Note 2:** Each deficiency collapses a different pair. No marker is distinct under every vision, and no palette of four hues can be. The name beside the marker is what carries this.

**Note 3:** Tritanopia is the extreme case. Legislative and Structure render as the same teal in light mode, ΔE 1.6. Tritanopia affects roughly 1 in 10,000, against roughly 8% of men for red-green deficiency. Not corrected, and not a defect.

**Note 4:** Cerulean sits 4.4 from its nearest marker in light mode and 4.7 in dark, in both cases Structure under tritanopia. Recorded, not constrained: Cerulean and the markers never share a visual role.

**Note 5:** Method: Brettel 1997 dichromacy at full severity, computed with daltonlens; distances in CAM02-UCS; WCAG 2.1 relative luminance for contrast.

Simulated appearance under dichromacy, light mode:

| Vision | Legislative | Requirements | Hazard Analysis | Structure | Cerulean |
|---|---|---|---|---|---|
| Typical | `#794AFF` | `#CA00B6` | `#CD3C00` | `#008217` | `#00749D` |
| Deuteranopia | `#0078FD` | `#5B7AB3` | `#8C7700` | `#7A6920` | `#4C6A9D` |
| Protanopia | `#005FFE` | `#004FB6` | `#695A07` | `#8C7814` | `#58709C` |
| Tritanopia | `#447688` | `#BF4357` | `#CF3251` | `#3A778A` | `#007690` |

Dark mode:

| Vision | Legislative | Requirements | Hazard Analysis | Structure | Cerulean |
|---|---|---|---|---|---|
| Typical | `#9B70FF` | `#F911E0` | `#FD4D00` | `#00A21F` | `#0092C5` |
| Deuteranopia | `#3091FD` | `#7499DC` | `#AF9400` | `#98842A` | `#6185C5` |
| Protanopia | `#007EFE` | `#0065E0` | `#84710C` | `#AF961B` | `#708DC4` |
| Tritanopia | `#7C8D95` | `#EC566F` | `#FE4167` | `#4B94AC` | `#0095B4` |

## 4. Application

| Element | Specification |
|---|---|
| Canvas | The only background. No second surface color |
| Pane | Flat on the canvas, separated by a hairline. No fill, border, or shadow |
| Hairline | 1 px, Hairline color. The only divider |
| Radius | 2 px maximum |
| Label | Muted. Plex Mono naming a field, Plex Sans as language |
| Link | Cerulean, always underlined |
| Button, primary | Cerulean fill, canvas-color text. One per view |
| Button, secondary | Hairline border, Ink text, no fill |
| Focus | 2 px Cerulean ring, 2 px offset |
| Selection | 2 px Cerulean inset bar, Medium weight |
| Marker | 8 px square, 2 px radius, functional color, beside the entity name |
| Identifier | Plex Mono |
| Status | Text and weight. Never color |

**Note 1:** Links are underlined at rest, not on hover. Cerulean against Ink is 3.02:1 and against Muted is 1.05:1, so color alone does not mark a link.

## 5. Attribution

| Material | Version | License |
|---|---|---|
| IBM Plex Sans | 1.1.0 | OFL-1.1 |
| IBM Plex Mono | 2.5.0 | OFL-1.1 |
| Reasonable Colors | 0.4.0 | MIT |

**Note 1:** The palette is not vendored as a file. Its values are transcribed into section 3, and this table is their attribution.
