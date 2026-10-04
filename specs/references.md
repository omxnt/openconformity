# References

The form of the `reference` attribute for European Legislation, Essential Requirement, Harmonised Standard and Harmonised Requirement, and the Uniform Resource Identifier derived from container and requirement. The container carries the document and the requirement carries the subdivision. Tree rows show the Shown column. Identifiers are derived, never stored, and the syntax of [2] is applied inside annexes alike. Requirement text is copied from the current consolidated text on EUR-Lex, and the legislation records which. An Annex ZA row is a `covers` relationship from Harmonised Requirement to Essential Requirement, matched on the point number under the legislation the standard is harmonised under.

## 1. European Legislation

### 1.1 Attribute Reference

The attribute reference shall be written according to [1].

| Case | Reference | Shown |
|---|---|---|
| Regulation | `Regulation (EU) 2023/1230` | `Regulation (EU) 2023/1230` |
| Directive | `Directive 2014/35/EU` | `Directive 2014/35/EU` |

### 1.2 Attribute Title

The attribute title shall be the common name with the Commission's abbreviation in brackets.

| Case | Title |
|---|---|
| Regulation | `Machinery Regulation (MR)` |
| Directive | `Low Voltage Directive (LVD)` |

### 1.3 Attribute Link

The attribute link shall be the dated consolidated text on EUR-Lex.

| Element | Segment |
|---|---|
| base | `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:` |
| `Regulation (EU) 2023/1230` | `02023R1230` |
| `Directive 2014/35/EU` | `02014L0035` |
| consolidation date | `-20260727` |

Example `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02023R1230-20260727`

### 1.4 Attribute Notes

The attribute notes shall record the consolidated text copied from, the date checked, and the state of the requirement annexes.

| Case | Notes |
|---|---|
| Unchanged | `Requirements copied from the consolidated text of 30 May 2026, checked 2026-10-03. Annex I unchanged since adoption.` |
| Amended | `Requirements copied from the consolidated text of 1 July 2026, checked 2026-10-03. Article 4 and Annex II as amended by Delegated Directive (EU) 2015/863.` |
| Pending | `Requirements copied from the consolidated text of 27 July 2026, checked 2026-10-03. Annex III unchanged since adoption. Regulation (EU) 2026/1744 empowers delegated acts adding AI requirements to Annex III, applying by 2 August 2028.` |

### 1.5 Uniform Resource Identifier

The Uniform Resource Identifier shall be derived according to [2].

| Element | Segment |
|---|---|
| base | `http://data.europa.eu/eli/` |
| `Regulation (EU) 2023/1230` | `reg/2023/1230` |
| `Directive 2014/35/EU` | `dir/2014/35` |

Example `http://data.europa.eu/eli/reg/2023/1230`

## 2. Essential Requirement

### 2.1 Attribute Reference

The attribute reference shall be written according to [1]. Numbered headings are entities. Lettered items are entities where standards cite them, otherwise they stay in the text. Unnumbered entries are named as the act prints them.

| Case | Reference | Shown |
|---|---|---|
| Annex | `Annex III` | `Annex III` |
| Part | `Annex III, Part B` | `Part B` |
| Point | `Annex III, Part B, point 1.7.4.2` | `1.7.4.2` |
| Lettered point | `Annex III, Part B, point 1.7.4.2(a)` | `1.7.4.2(a)` |
| Annex without parts | `Annex I, point 2(a)` | `2(a)` |
| Part with bracketed numbering | `Annex I, Part I, point (2)(a)` | `(2)(a)` |
| Unnumbered entry | `Annex II, Lead` | `Lead` |
| Indent | `Annex III, Part B, point 1.2.1, first indent` | `1.2.1, first indent` |
| Article | `Article 4` | `Article 4` |
| Paragraph | `Article 4(1)` | `Article 4(1)` |

### 2.2 Attribute Title

The attribute title shall be the heading the act prints. An entity without a heading inherits the heading of its parent.

| Case | Title |
|---|---|
| Heading | `Control systems` |
| Lettered point | the heading of the point |
| Unnumbered entry | the heading of the annex |
| Paragraph | the heading of the article |

### 2.3 Attribute Requirement

The attribute requirement shall be the text the act prints under the heading, starting with whatever marker the act prints first, and ending before the first child.

| Case | Requirement starts |
|---|---|
| Lead sentence | `Control systems shall be designed and constructed so that` |
| Lettered list without lead | `(a) Machinery or related products shall be designed` |
| Numbered paragraphs | `1. The manufacturer of machinery or a related product shall` |
| Lettered point | `(a) the business name and full address of the manufacturer` |
| Container with no text | empty |

### 2.4 Uniform Resource Identifier

The Uniform Resource Identifier shall be derived according to [2].

| Element | Segment |
|---|---|
| base | the legislation Uniform Resource Identifier |
| `Annex III` | `anx_III` |
| `Part B` | `prt_B` |
| `point 1.7.4.2` | `pnt_1.7.4.2` |
| `(a)` | `pnt_a` |
| `point (2)` | `pnt_2` |
| `first indent` | `idt_1` |
| `Article 4(1)` | `art_4/par_1` |
| `Lead` | none |

Example `http://data.europa.eu/eli/reg/2023/1230/anx_III/prt_B/pnt_1.7.4.2/pnt_a`

## 3. Harmonised Standard

### 3.1 Attribute Reference

The attribute reference shall be written according to [4].

| Case | Reference | Shown |
|---|---|---|
| ISO adopted as EN | `EN ISO 13849-1:2023` | `EN ISO 13849-1:2023` |
| IEC adopted as EN | `EN IEC 60204-1:2018` | `EN IEC 60204-1:2018` |
| CEN only | `EN 1005-2:2003+A1:2008` | `EN 1005-2:2003+A1:2008` |

### 3.2 Uniform Resource Identifier

The Uniform Resource Identifier shall be derived according to [3].

| Element | Segment |
|---|---|
| base | `urn:iso:std:` |
| `EN ISO 13849-1:2023` | `iso:13849:-1:ed-4:en` |
| `EN IEC 60204-1:2018` | `iec:60204:-1:ed-6:en` |
| `EN 1005-2:2003+A1:2008` | none |

Example `urn:iso:std:iso:13849:-1:ed-4:en`

## 4. Harmonised Requirement

### 4.1 Attribute Reference

The attribute reference shall be written according to [5].

| Case | Reference | Shown |
|---|---|---|
| Clause | `Clause 4.5.2` | `4.5.2` |
| Annex clause | `Annex A, A.2` | `A.2` |
| Table | `Table 3` | `3` |

### 4.2 Uniform Resource Identifier

The Uniform Resource Identifier shall be derived according to [3].

| Element | Segment |
|---|---|
| base | the standard Uniform Resource Identifier |
| `Clause 4.5.2` | `clause:4.5.2` |
| `Annex A, A.2` | `clause:A.2` |
| `Table 3` | `table:3` |

Example `urn:iso:std:iso:13849:-1:ed-4:en:clause:4.5.2`

## 5. References

| No. | Reference | Link |
|---|---|---|
| [1] | Joint Handbook for the presentation and drafting of acts, Council of the EU, 2025 | https://www.consilium.europa.eu/media/ch2b24su/joint_handbook_en_28-november-2025_def_final.pdf |
| [2] | ELI subdivisions specification v2, Publications Office of the EU | https://eur-lex.europa.eu/content/eli-register/ELI-subdivisions-specifications-v2.pdf |
| [3] | RFC 5141, A URN Namespace for ISO | https://www.rfc-editor.org/rfc/rfc5141 |
| [4] | Summary list of harmonised standards, European Commission | https://single-market-economy.ec.europa.eu/single-market/european-standards/harmonised-standards_en |
| [5] | ISO/IEC Directives, Part 2, Principles and rules for the structure and drafting of ISO and IEC documents | https://www.iso.org/sites/directives/current/part2/index.xhtml |
