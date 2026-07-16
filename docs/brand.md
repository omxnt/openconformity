# Brand

## Table of Contents

- [1. Typography](#1-typography)
- [2. Color Profile](#2-color-profile)
  - [2.1 Light Mode Colors](#21-light-mode-colors)
  - [2.2 Dark Mode Colors](#22-dark-mode-colors)
  - [2.3 Functional Colors](#23-functional-colors)
- [3. Iconography](#3-iconography)
  - [3.1 Logo](#31-logo)
  - [3.2 Favicon](#32-favicon)
- [4. Usage](#4-usage)
- [5. References](#5-references)

## 1. Typography

| Role | Typeface | Weights |
|---|---|---|
| UI & body | IBM Plex Sans | 400, 500 |
| Data & IDs | IBM Plex Mono | 400, 500 |

## 2. Color Profile

### 2.1 Light Mode Colors

| Name | Value | Use |
|---|---|---|
| Blue | `#0F6480` | Wordmark, inverted fill, favicon. Links, focus ring, selection, one primary action per view |
| Paper | `#FAFAFA` | Page and pane background — the only background |
| Ink | `#23272B` | All text and headings |
| Muted | `#5C6166` | Secondary text, labels, captions |
| Hairline | `#E3E3E1` | 1 px rules and borders — the only divider |

### 2.2 Dark Mode Colors

| Name | Value | Use |
|---|---|---|
| Blue | `#3D93AD` | Links, focus ring, selection, one primary action per view |
| Night | `#121417` | Page and pane background — the only background |
| Snow | `#E8EAEC` | All text and headings |
| Muted | `#9BA1A6` | Secondary text, labels, captions |
| Hairline | `#262B30` | 1 px rules and borders — the only divider |

**Note 1:** Blue reaches 6.4:1 on Paper and 6.7:1 under white. The light value fails on Night at 2.8:1 and never appears there: the wordmark goes white, and the dark value carries interaction at 5.3:1. The favicon keeps the light value in both modes.

### 2.3 Functional Colors

| Pillar | Hex | On Paper | On Night |
|---|---|---|---|
| Legislative | `#7B6BC8` | 4.2:1 | 4.2:1 |
| Requirements | `#BA598D` | 4.1:1 | 4.3:1 |
| Hazard Analysis | `#BE5B50` | 4.2:1 | 4.2:1 |
| Structure | `#3C8054` | 4.6:1 | 3.9:1 |

**Note 1:** Entity identification only. Small marker beside the entity name — never a text fill, never a status, never in the logo or on marketing surfaces.

**Note 2:** The four are separated for normal, deuteranopic, and protanopic vision. Worst pair: ΔE 25. Colors are never the sole carrier of meaning — the pillar is always named beside the marker. No color in the palette means pass or fail.

## 3. Iconography

### 3.1 Logo

| Property | Value |
|---|---|
| Typeface | IBM Plex Sans, Medium (500) |
| Letter spacing | −1% |
| Lettering | "openconformity" |
| Case | Lowercase |
| Color | Single color, single weight — never split or restyled |
| On light | Blue |
| On dark | White |
| Inverted | White on Blue |
| Clear space | Height of the "o", baked into every SVG viewBox |

### 3.2 Favicon

| Property | Value |
|---|---|
| Typeface | IBM Plex Sans, Medium (500) |
| Lettering | "oc" |
| Case | Lowercase |
| Color | White on Blue, 2 px radius at 32 px |

## 4. Usage

| Element | Do | Don't |
|---|---|---|
| Wordmark | Blue on light, white on dark, white on solid blue | Tinting, splits, gradients, outlines, symbols |
| Blue | Brand surfaces; links and accents | The light value on Night; fills larger than a button (inverted excepted) |
| Palette | This file is the complete set | New hues, hover ramps, semantic green/red for status |
| Surfaces | Flat panes on one background, separated by hairlines | Cards, shadows, radius above 2 px, gradients |
| Type | IBM Plex Sans + Plex Mono only | Second display face, italic headings |

## 5. References

| Item | Location |
|---|---|
| Rendering | `docs/brand.html` |
| Logo | `docs/logo/` |
| Favicon | `docs/logo/` |
| Fonts | `assets/fonts/` |

**Note 1:** Logo assets are SVG with the lettering as paths. No font is required to render them.