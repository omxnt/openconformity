# Decisions

## Table of Contents

- [1. Introduction](#1-introduction)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Conventions](#12-conventions)
  - [1.3 Template](#13-template)
- [2. Decision Log](#2-decision-log)
- [3. Open Topics](#3-open-topics)

## 1. Introduction

### 1.1 Purpose

The purpose of this document is to record the decisions behind openconformity: what was chosen, and why. It is the reasoning that accompanies the design and the specification, kept so that a settled question is not reopened without cause.

### 1.2 Conventions

Decisions are numbered `D-NNN` and ordered by number, grouped loosely by theme. Numbering is append-only: a decision is never renumbered, and one that changes is superseded by a new entry rather than edited.

Each entry carries one or more tags: `legal`, `product`, `architecture`, `repository`, `documentation`, `graphical`.

An entry names what was decided and why. It does not restate the specification, since values live in spec.md.

A decision that changes is not edited. A new entry is added that states the updated decision in full, and the entry it replaces is left unchanged except for a `superseded by D-NNN` tag naming the entry that replaces it.

*This log was consolidated on 2026-07-19 to reflect the project's current position, and entries before that date were renumbered. Append-only applies from that point.*

### 1.3 Template

Each decision is written using the template below.

---

### D-NNN Decision title

`YYYY-MM-DD` `tag`

The decision, stated plainly.

> *The rationale.*

## 2. Decision Log

### D-001 Licence: EUPL-1.2

`2026-07-14` `legal`

The project is licensed under the European Union Public Licence 1.2, covering source, documents, and diagrams alike.

> *Copyleft keeps derivatives open, and one licence covers code, prose, and diagrams. The EUPL is drafted in EU legal terms, so its disclaimers hold in the author's jurisdiction, and its compatibility clause permits combining with permissive and copyleft code. Chosen over MIT, which the repository used while private; no MIT-licensed copies were distributed.*

---

### D-002 Non-commercial

`2026-07-14` `legal`

No sales, no donations, no sponsorship, no paid support.

> *Partly principle, partly legal position: the Product Liability Directive (EU) 2024/2853 and the Cyber Resilience Act both exempt open-source software developed outside a commercial activity. Any revenue stream moves the project into scope of both. A future funding proposal requires this entry to be revisited first.*

---

### D-003 No reproduction of standard content

`2026-07-14` `legal` `superseded by D-029`

The tool does not include or reproduce copyrighted content from harmonized standards: no clause text, no clause titles, no Annex ZA mappings.

> *Standards are sold by national standardization bodies. The knowledge the tool is built on is limited to what is public: legislation, guidance, and the published lists of harmonized standards.*

---

### D-004 Artefacts, not assertions

`2026-07-14` `product`

The tool never states a conclusion about the safety or conformity of the product. It does not generate the technical file, the EU Declaration of Conformity, or any report claiming compliance.

> *Responsibility for CE marking rests with the manufacturer and cannot be delegated to a tool. A tool that appears to judge conformity invites exactly that delegation. A permanent design principle, not a missing feature.*

---

### D-005 Scope: machinery

`2026-07-14` `product`

Primary scope is CE marking of machinery under the Machinery Regulation (EU) 2023/1230. Legislation commonly applied alongside it, such as LVD, EMC, RoHS, CPR, and PED, is secondary scope. Other product types and national legislation are out of scope.

> *The metamodel encodes domain knowledge, and domain knowledge is specific. A tool covering all product legislation encodes none of it well.*

---

### D-006 Hardcoded metamodel

`2026-07-14` `product`

The metamodel is built into the tool and versioned with it. Users cannot extend or modify it.

> *The value is a metamodel correct for the domain, not generic modeling capability. A user-extensible metamodel makes every model different and traceability between them meaningless. Generic modeling tools already exist.*

---

### D-007 Terminology: Risk Reduction Measure

`2026-07-15` `product`

The canonical term is Risk Reduction Measure (RRM), not Protective Measure.

> *Chosen with knowledge of ISO 12100, which uses "protective measure" formally. "Risk reduction measure" is more widely used in industry and more self-explanatory to readers without ISO fluency.*

---

### D-008 The user lands directly in the tool

`2026-07-15` `product`

Opening the site places the user in the workspace. No homepage, wizard, or project setup in front of the tool. Information about the project is reachable from within it.

> *The tool is the product; the story about the tool is not. Modeled on draw.io. The current landing page is interim and is demoted or removed when the tool ships.*

---

### D-009 Graph view shows the neighborhood, not the model

`2026-07-15` `product`

The relationship pane's graph shows the selected entity and its directly related entities. Visualization of the whole model is a non-goal.

> *A neighborhood is a hub-and-spokes layout: deterministic, implementable in a few hundred lines of vanilla JavaScript. General graph layout is not, and would require a dependency. The neighborhood is also the more useful view, since it is how the user walks the model.*

---

### D-010 Stack: vanilla HTML, CSS, and JavaScript

`2026-07-15` `architecture`

No framework, no build step, no package manager, no backend, no accounts. Deployed as static files.

> *Longevity, since there are no dependencies to rot. Security, since there is no supply chain. Privacy, since there is no server. Simplicity, since a solo maintainer new to software development can hold the whole thing in their head. The cost is writing what a framework would provide.*

---

### D-011 Privacy by design

`2026-07-15` `architecture`

No server contact, no tracking, no analytics, no data collection. All processing happens in the user's browser. No third-party assets are loaded at runtime, including fonts.

> *A tool for a manufacturer's confidential product data must not transmit it. Running entirely in the browser makes leakage impossible by construction rather than by promise.*

---

### D-012 User-owned data, single local file

`2026-07-15` `architecture`

A project is saved as a single local file, owned and controlled by the user. It can be moved, backed up, or deleted at the user's sole discretion.

> *The user owns their data outright: it lives as one file on their disk, not in an account or a database. A single file is portable and needs no export step.*

---

### D-013 Vendoring takes the artifact, not the package

`2026-07-15` `architecture`

Third-party material is copied into the repository as files, with its licence and an origin record beside it. Package managers are not used.

> *A package manager pulls a dependency and everything it carries, and re-resolves it over time. Copying the artifact itself — the woff2 files, with their licence and origin beside them — takes exactly what is needed, nothing else, and never changes unless the maintainer changes it. This follows from the no-build, no-supply-chain stance of D-010.*

---

### D-014 Standards content is user-provided

`2026-07-16` `architecture`

The tool does not ship the content of harmonized standards. The user builds a library of the standards they have purchased, held as a local file, and imports from it into projects.

> *Follows from D-003. Reuse between projects is essential, since a manufacturer applies the same standards to every machine, but the reusable artifact contains standard content and therefore cannot come from the tool. The tool provides no redistribution mechanism: no sharing, no community index, no import from URL.*

---

### D-015 Copy on import, not reference

`2026-07-16` `architecture`

Content imported from a library is copied into the project. The project does not reference the library.

> *A technical file is a snapshot of the standards assessed against, at the time of assessment. A closed project must not change because a library was updated later. Rejected: referenced libraries with version tracking, which solve duplicate imports and propagate updates, neither of which the domain wants.*

---

### D-016 Reuse without relationships, with one exception

`2026-07-16` `architecture`

Entities copied between projects arrive without their relationships. The user re-establishes them in the context of the new product.

> *Relationships are engineering judgments about a specific product. Carrying them over invites unexamined reuse of a judgment that may not hold. Exception: relationships internal to an imported unit travel with it. The mappings printed in a standard's Annex ZA are facts, identical in every project, not judgments.*

---

### D-017 Development server

`2026-07-15` `architecture`

Development uses `python3 -m http.server`, not the VS Code Live Server extension.

> *Live Server injects a reload script into every file it serves. This is invisible in HTML but breaks SVG: the injected markup follows the closing tag and makes the file invalid XML.*

---

### D-018 Branch model

`2026-07-15` `repository`

`develop` and `main` carry identical content. `main` is a release snapshot of `develop`, produced by merging. The branches never diverge in content.

> *When the branches held different content — a landing page on `main`, absent from `develop` — merging `develop` into `main` propagated the absence and deleted the page. Keeping the branches identical, with `main` a straight snapshot of `develop`, removes that class of error.*

---

### D-019 Atomic commits

`2026-07-15` `repository`

One commit, one logical change, with the project working after each.

> *`git bisect` finds a breaking change by binary search over commits, and its precision equals commit size. Small, single-purpose commits make it possible to locate what broke; large mixed commits do not.*

---

### D-020 Repository layout

`2026-07-19` `repository`

Assets are grouped by kind, with the editable source beside its exports. One Figma file per mark set and one draw.io file per diagram set, each exporting the artefacts the site consumes.

```
assets/
  fonts/        vendored typefaces, with licence and origin
  marks/        marks.fig, and the wordmark, favicon, and square it exports
  diagrams/     diagrams.drawio, and the SVG it exports
```

> *One copy of each artifact, referenced from everywhere, duplicated nowhere. In a repository with no build step, nothing keeps copies in sync except the maintainer's memory. The extension distinguishes source from export, so the two live together rather than split across folders. Supersedes an earlier masters-in-`docs`, exports-in-`assets` split, which fragmented each asset across two locations.*

---

### D-021 The proof of concept and mockup are throwaway

`2026-07-16` `repository`

The proof of concept is archived in `poc/`, frozen and unmaintained. The concept mockup in `app/` demonstrates layout with fixed content, and its logic is discarded when the specification drives the real implementation. Neither is a basis for the implementation.

> *Both proved the concept works and earned the project its design phase. But both were built through exploratory AI-assisted coding, and building on them would mean inheriting decisions nobody made.*

---

### D-022 Document set

`2026-07-19` `documentation`

Three documents, each with one job. `design.md` describes what the product is and why. `spec.md` states what it shall be and do. `decisions.md` records what was chosen and why. `README.md` owns the links between them.

> *Values are specified in spec.md, the design document carries the concept, and this log carries the reasoning. No document restates another. The README owns the links and points down; nothing links up or sideways, so a rename breaks one thing rather than four.*

---

### D-023 "Shall" belongs to spec.md only

`2026-07-16` `documentation`

Requirements language is reserved for the specification. design.md is written in present-tense declarative, describing the tool as designed.

> *The exclusivity is what gives "shall" its force. If design.md contained requirements, no reader could tell which sentences bind and which describe.*

---

### D-024 Build iteratively, spec the slice being built

`2026-07-17` `documentation`

design.md is the stable why and what. spec.md grows in build order, not in one pass. The exception is the data model, which is specified before code.

> *Everything depends on the data model, and changing it later means rewriting the tool, so it is specified first. Beyond that, specifying only the slice being built keeps the specification honest: it describes what exists or is about to, not a guess at the whole tool.*

---

### D-025 Specifications state what must be true, not how to build it

`2026-07-17` `documentation`

A specification states what must be true of the tool, not how to implement it or how it should currently look. It fixes the values that matter and leaves everything derivable to the implementation.

> *A specification that dictates exact implementation forces endless redo: every build detail written as a requirement is a line that breaks the moment the build changes. The interface greys are not specified; they follow from the contrast requirements. The favicon's corner radius is not specified; it is a build choice. What is specified is what a rebuild must still honour.*

---

### D-026 No verdict colours

`2026-07-17` `product` `graphical`

No colour in the interface means pass or fail. Green and red as status are excluded.

> *D-004 expressed chromatically: the tool never states a conclusion about conformity, so its interface must not either. Green reads as conformant and red as failing, to precisely the audience the tool is built for.*

---

### D-027 Type is carried by shape, not colour

`2026-07-19` `graphical`

Entity type is distinguished by icon, not by colour. The interface is monochrome plus a single accent, specified in spec.md.

> *Roughly one in twelve men has a red-green colour vision deficiency, in a male-dominated field, and no palette of several hues separates cleanly under every deficiency. An icon's shape is legible under all of them. A derived multi-colour palette, one hue per pillar, was built and verified against dichromacy simulation, then removed: it solved a problem that shape does not have. Colour carries no meaning; it is at most a speed aid, never the carrier.*

---

### D-028 The identity is a wordmark and a favicon

`2026-07-19` `graphical`

The brand is the wordmark "openconformity" and a favicon, and nothing else: no logo, no symbol, no monogram. The favicon is a square in the accent colour. The full graphical profile — typefaces, accent, and marks — is specified in spec.md.

> *A wordmark renders identically anywhere with no asset to maintain, and a single accent square is legible at 16 pixels where a wordmark is not. A monogram becomes a second mark to recognise; a plain square does not. Composition onto any surface is done per surface, so no banner or social-preview assets are kept in the repository.*

### D-029 Standards content usable only as published in the OJEU

`2026-07-19` `legal`

The tool does not include or reproduce content from harmonized standards beyond what is published in the harmonized-standards lists in the Official Journal of the European Union. Those lists publish standard references and titles, which may be used. Clause text, tables, figures, and Annex ZA mappings are not published there and are not reproduced.

> *Standards are sold by national standardization bodies, so the tool is built only on public information: legislation, guidance, and the OJEU lists. The boundary is what the OJEU publishes. References and titles appear there and carry no separate licence, so they are usable; the body of a standard does not and is not. Specified in spec.md C-PRJ-005.*

## 3. Open Topics

Identified, not yet decided.

| # | Question | Blocks |
|---|---|---|
| 1 | Deleting a composition relationship: forbidden, or equivalent to deleting the owned entity? | design.md |
| 2 | ID collisions on import: renumber, or scope IDs by source? | Library implementation |
| 3 | Import granularity: whole standard, or clause by clause? | Library implementation |
| 4 | Essential requirements that apply regardless of hazards: how do they enter the model? | Workflow |
| 5 | Whether a base library of standard identities can be shipped | D-014 |
