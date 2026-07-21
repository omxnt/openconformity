# Decisions

## Table of Contents

- [1. Introduction](#1-introduction)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Scope](#12-scope)
- [2. Conventions](#2-conventions)
  - [2.1 Identifier](#21-identifier)
  - [2.2 Tags](#22-tags)
  - [2.3 Content](#23-content)
  - [2.4 Supersession](#24-supersession)
  - [2.5 Template](#25-template)
- [3. Decisions](#3-decisions)
  - [D-001 EUPL-1.2 licence](#d-001-eupl-12-licence)
  - [D-002 Non-commercial](#d-002-non-commercial)
  - [D-003 No standard content reproduced](#d-003-no-standard-content-reproduced)
  - [D-004 Artefacts not assertions](#d-004-artefacts-not-assertions)
  - [D-005 Machinery scope](#d-005-machinery-scope)
  - [D-006 Hardcoded metamodel](#d-006-hardcoded-metamodel)
  - [D-007 Risk Reduction Measure term](#d-007-risk-reduction-measure-term)
  - [D-008 Direct entry to the tool](#d-008-direct-entry-to-the-tool)
  - [D-009 Neighborhood graph view](#d-009-neighborhood-graph-view)
  - [D-010 Vanilla web stack](#d-010-vanilla-web-stack)
  - [D-011 Privacy by design](#d-011-privacy-by-design)
  - [D-012 Single local file](#d-012-single-local-file)
  - [D-013 Vendor the artifact](#d-013-vendor-the-artifact)
  - [D-014 User-provided standards](#d-014-user-provided-standards)
  - [D-015 Copy on import](#d-015-copy-on-import)
  - [D-016 Reuse without relationships](#d-016-reuse-without-relationships)
  - [D-017 Development server](#d-017-development-server)
  - [D-018 Branch model](#d-018-branch-model)
  - [D-019 Atomic commits](#d-019-atomic-commits)
  - [D-020 Repository layout](#d-020-repository-layout)
  - [D-021 Throwaway prototypes](#d-021-throwaway-prototypes)
  - [D-022 Document set](#d-022-document-set)
  - [D-023 "Shall" is spec.md only](#d-023-shall-is-specmd-only)
  - [D-024 Iterative build](#d-024-iterative-build)
  - [D-025 Specs state what not how](#d-025-specs-state-what-not-how)
  - [D-026 No verdict colours](#d-026-no-verdict-colours)
  - [D-027 Type by shape](#d-027-type-by-shape)
  - [D-028 Wordmark and favicon identity](#d-028-wordmark-and-favicon-identity)
  - [D-029 Standard content from OJEU](#d-029-standard-content-from-ojeu)
  - [D-030 Browser-based and server-less](#d-030-browser-based-and-server-less)
  - [D-031 Desktop only](#d-031-desktop-only)
  - [D-032 Referenced data model](#d-032-referenced-data-model)
- [4. Open Topics](#4-open-topics)
- [5. References](#5-references)

## 1. Introduction

### 1.1 Purpose

The purpose of this document is to record the decisions behind openconformity: what was chosen, and why. It is the reasoning that accompanies the design document and the specification, kept so that a settled question is not reopened without cause.

### 1.2 Scope

This decision log covers the decisions made for openconformity and their rationale, across all themes of the project: legal, product, architecture, repository, documentation, and graphical.

This decision log does not restate the specification. The specification states what openconformity shall be and do; this log records why those choices were made.

## 2. Conventions

### 2.1 Identifier

Each decision shall have a unique identifier of the form `D-NNN`, and decisions are ordered by number, grouped loosely by theme. Identifiers are append-only: a decision is never renumbered, and one that changes is superseded by a new entry rather than edited.

*This log was consolidated on 2026-07-19 to reflect the project's current position, and entries before that date were renumbered. Append-only applies from that point.*

### 2.2 Tags

Each entry carries one or more tags from the table below.

| Tag | Description |
|---|---|
| `legal` | Licensing, liability, and the legislative scope the project operates within. |
| `product` | What the tool is and does: its purpose, features, and audience. |
| `architecture` | How the software is built: stack, dependencies, structure, and hosting. |
| `repository` | How the project is developed and maintained: platform, workflow, and tooling. |
| `documentation` | How the project is documented: which documents exist and how they are written. |
| `graphical` | The visual identity and interface profile: typefaces, colour, and marks. |

### 2.3 Content

An entry states what was decided and why. It does not repeat requirement text: where a decision resulted in a requirement, the entry gives the reasoning and refers to the requirement by its identifier.

### 2.4 Supersession

A decision that changes is not edited. A new entry is added that states the updated decision in full, and the entry it replaces is left unchanged except for a `superseded by D-NNN` tag naming the entry that replaces it.

### 2.5 Template

Each decision is written using the template below.

---

### D-NNN Decision title

`YYYY-MM-DD` `tag`

The decision, stated plainly.

> *The rationale.*

## 3. Decisions

### D-001 EUPL-1.2 licence

`2026-07-14` `legal`

The project is licensed under the European Union Public Licence 1.2, covering source, documents, and diagrams alike.

> *Copyleft keeps derivatives open, and one licence covers code, prose, and diagrams. The EUPL is drafted in EU legal terms, so its disclaimers hold in the author's jurisdiction, and its compatibility clause permits combining with permissive and copyleft code. Chosen over MIT, which the repository used while private; no MIT-licensed copies were distributed.*

---

### D-002 Non-commercial

`2026-07-14` `legal`

No sales, no donations, no sponsorship, no paid support.

> *Partly principle, partly legal position: the Product Liability Directive (EU) 2024/2853 and the Cyber Resilience Act both exempt open-source software developed outside a commercial activity. Any revenue stream moves the project into scope of both. A future funding proposal requires this entry to be revisited first.*

---

### D-003 No standard content reproduced

`2026-07-14` `legal` `superseded by D-029`

The tool does not include or reproduce copyrighted content from harmonized standards: no clause text, no clause titles, no Annex ZA mappings.

> *Standards are sold by national standardization bodies. The knowledge the tool is built on is limited to what is public: legislation, guidance, and the published lists of harmonized standards.*

---

### D-004 Artefacts not assertions

`2026-07-14` `product`

The tool never states a conclusion about the safety or conformity of the product. It does not generate the technical file, the EU Declaration of Conformity, or any report claiming compliance.

> *Responsibility for CE marking rests with the manufacturer and cannot be delegated to a tool. A tool that appears to judge conformity invites exactly that delegation. A permanent design principle, not a missing feature.*

---

### D-005 Machinery scope

`2026-07-14` `product`

Primary scope is CE marking of machinery under the Machinery Regulation (EU) 2023/1230. Legislation commonly applied alongside it, such as LVD, EMC, RoHS, CPR, and PED, is secondary scope. Other product types and national legislation are out of scope.

> *The metamodel encodes domain knowledge, and domain knowledge is specific. A tool covering all product legislation encodes none of it well.*

---

### D-006 Hardcoded metamodel

`2026-07-14` `product`

The metamodel is built into the tool and versioned with it. Users cannot extend or modify it.

> *The value is a metamodel correct for the domain, not generic modeling capability. A user-extensible metamodel makes every model different and traceability between them meaningless. Generic modeling tools already exist.*

---

### D-007 Risk Reduction Measure term

`2026-07-15` `product`

The canonical term is Risk Reduction Measure (RRM), not Protective Measure.

> *Chosen with knowledge of ISO 12100, which uses "protective measure" formally. "Risk reduction measure" is more widely used in industry and more self-explanatory to readers without ISO fluency.*

---

### D-008 Direct entry to the tool

`2026-07-15` `product`

Opening the site places the user in the workspace. No homepage, wizard, or project setup in front of the tool. Information about the project is reachable from within it.

> *The tool is the product; the story about the tool is not. Modeled on draw.io. The current landing page is interim and is demoted or removed when the tool ships.*

---

### D-009 Neighborhood graph view

`2026-07-15` `product`

The relationship pane's graph shows the selected entity and its directly related entities. Visualization of the whole model is a non-goal.

> *A neighborhood is a hub-and-spokes layout: deterministic, implementable in a few hundred lines of vanilla JavaScript. General graph layout is not, and would require a dependency. The neighborhood is also the more useful view, since it is how the user walks the model.*

---

### D-010 Vanilla web stack

`2026-07-15` `architecture`

No framework, no build step, no package manager, no backend, no accounts. Deployed as static files.

> *Longevity, since there are no dependencies to rot. Security, since there is no supply chain. Privacy, since there is no server. Simplicity, since a solo maintainer new to software development can hold the whole thing in their head. The cost is writing what a framework would provide.*

---

### D-011 Privacy by design

`2026-07-15` `architecture`

No server contact, no tracking, no analytics, no data collection. All processing happens in the user's browser. No third-party assets are loaded at runtime, including fonts.

> *A tool for a manufacturer's confidential product data must not transmit it. Running entirely in the browser makes leakage impossible by construction rather than by promise.*

---

### D-012 Single local file

`2026-07-15` `architecture`

A project is saved as a single local file, owned and controlled by the user. It can be moved, backed up, or deleted at the user's sole discretion.

> *The user owns their data outright: it lives as one file on their disk, not in an account or a database. A single file is portable and needs no export step.*

---

### D-013 Vendor the artifact

`2026-07-15` `architecture`

Third-party material is copied into the repository as files, with its licence and an origin record beside it. Package managers are not used.

> *A package manager pulls a dependency and everything it carries, and re-resolves it over time. Copying the artifact itself — the woff2 files, with their licence and origin beside them — takes exactly what is needed, nothing else, and never changes unless the maintainer changes it. This follows from the no-build, no-supply-chain stance of D-010.*

---

### D-014 User-provided standards

`2026-07-16` `architecture`

The tool does not ship the content of harmonized standards. The user builds a library of the standards they have purchased, held as a local file, and imports from it into projects.

> *Follows from D-003. Reuse between projects is essential, since a manufacturer applies the same standards to every machine, but the reusable artifact contains standard content and therefore cannot come from the tool. The tool provides no redistribution mechanism: no sharing, no community index, no import from URL.*

---

### D-015 Copy on import

`2026-07-16` `architecture`

Content imported from a library is copied into the project. The project does not reference the library.

> *A technical file is a snapshot of the standards assessed against, at the time of assessment. A closed project must not change because a library was updated later. Rejected: referenced libraries with version tracking, which solve duplicate imports and propagate updates, neither of which the domain wants.*

---

### D-016 Reuse without relationships

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

### D-021 Throwaway prototypes

`2026-07-16` `repository`

The proof of concept is archived in `poc/`, frozen and unmaintained. The concept mockup in `app/` demonstrates layout with fixed content, and its logic is discarded when the specification drives the real implementation. Neither is a basis for the implementation.

> *Both proved the concept works and earned the project its design phase. But both were built through exploratory AI-assisted coding, and building on them would mean inheriting decisions nobody made.*

---

### D-022 Document set

`2026-07-19` `documentation`

Three documents, each with one job. `design.md` describes what the product is and why. `spec.md` states what it shall be and do. `decisions.md` records what was chosen and why. `README.md` owns the links between them.

> *Values are specified in spec.md, the design document carries the concept, and this log carries the reasoning. No document restates another. The README owns the links and points down; nothing links up or sideways, so a rename breaks one thing rather than four.*

---

### D-023 "Shall" is spec.md only

`2026-07-16` `documentation`

Requirements language is reserved for the specification. design.md is written in present-tense declarative, describing the tool as designed.

> *The exclusivity is what gives "shall" its force. If design.md contained requirements, no reader could tell which sentences bind and which describe.*

---

### D-024 Iterative build

`2026-07-17` `documentation`

design.md is the stable why and what. spec.md grows in build order, not in one pass. The exception is the data model, which is specified before code.

> *Everything depends on the data model, and changing it later means rewriting the tool, so it is specified first. Beyond that, specifying only the slice being built keeps the specification honest: it describes what exists or is about to, not a guess at the whole tool.*

---

### D-025 Specs state what not how

`2026-07-17` `documentation`

A specification states what must be true of the tool, not how to implement it or how it should currently look. It fixes the values that matter and leaves everything derivable to the implementation.

> *A specification that dictates exact implementation forces endless redo: every build detail written as a requirement is a line that breaks the moment the build changes. The interface greys are not specified; they follow from the contrast requirements. The favicon's corner radius is not specified; it is a build choice. What is specified is what a rebuild must still honour.*

---

### D-026 No verdict colours

`2026-07-17` `product` `graphical`

No colour in the interface means pass or fail. Green and red as status are excluded.

> *D-004 expressed chromatically: the tool never states a conclusion about conformity, so its interface must not either. Green reads as conformant and red as failing, to precisely the audience the tool is built for.*

---

### D-027 Type by shape

`2026-07-19` `graphical`

Entity type is distinguished by icon, not by colour. The interface is monochrome plus a single accent, specified in spec.md.

> *Roughly one in twelve men has a red-green colour vision deficiency, in a male-dominated field, and no palette of several hues separates cleanly under every deficiency. An icon's shape is legible under all of them. A derived multi-colour palette, one hue per pillar, was built and verified against dichromacy simulation, then removed: it solved a problem that shape does not have. Colour carries no meaning; it is at most a speed aid, never the carrier.*

---

### D-028 Wordmark and favicon identity

`2026-07-19` `graphical`

The brand is the wordmark "openconformity" and a favicon, and nothing else: no logo, no symbol, no monogram. The favicon is a square in the accent colour. The full graphical profile — typefaces, accent, and marks — is specified in spec.md.

> *A wordmark renders identically anywhere with no asset to maintain, and a single accent square is legible at 16 pixels where a wordmark is not. A monogram becomes a second mark to recognise; a plain square does not. Composition onto any surface is done per surface, so no banner or social-preview assets are kept in the repository.*

---

### D-029 Standard content from OJEU

`2026-07-19` `legal`

The tool does not include or reproduce content from harmonized standards beyond what is published in the harmonized-standards lists in the Official Journal of the European Union. Those lists publish standard references and titles, which may be used. Clause text, tables, figures, and Annex ZA mappings are not published there and are not reproduced.

> *Standards are sold by national standardization bodies, so the tool is built only on public information: legislation, guidance, and the OJEU lists. The boundary is what the OJEU publishes. References and titles appear there and carry no separate licence, so they are usable; the body of a standard does not and is not. Specified in spec.md C-PRJ-005.*

---

### D-030 Browser-based and server-less

`2026-07-21` `architecture`

Running in a web browser and consisting of static files with no server-side code are technical constraints, not operational qualities. Browser-based moved from the non-functional Operation group to C-TEC in spec.md, and a no-server-side-code constraint was added alongside it.

> *Browser-based is a property of what the software is built as, verified against the build rather than by using the running tool, which places it with the technical constraints as the root the stack, build, and dependency constraints follow from. No server-side code is the constraint that makes the privacy and operation qualities structurally guaranteed rather than promised: with nothing executing on the host, there is nowhere for user data to be received, processed, or stored remotely. Specified in spec.md C-TEC-006 and C-TEC-007.*

---

### D-031 Desktop only

`2026-07-21` `product`

The tool targets desktop-sized viewports and is not supported on mobile. Below the supported viewport it shows a notice that a desktop-sized screen is required, rather than a degraded interface.

> *The multi-pane interface, the navigator, editor, and relationship views side by side, needs the screen space of a desktop viewport to function. Optimising for touch and small screens is scope the project does not carry. The exact minimum viewport is set during implementation once the layout's real constraints are known. Specified in spec.md N-CMP-001; the notice behaviour is a functional requirement, added when the functional requirements are written.*

---

### D-032 Referenced data model

`2026-07-21` `architecture` `documentation`

The data model is defined by a schema, versioned as its own artifact and referenced by spec.md. The schema is the authoritative definition. design.md explains the model as readable context but binds nothing; where design.md and the schema disagree, the schema is truth and design.md is corrected to match. spec.md states a stable conformance requirement and does not restate the model's structure.

> *The metamodel is expected to iterate heavily through building and testing, so the model cannot live in spec.md without churning the specification. Separating the stable commitment from the volatile definition lets each change at its own rate: spec.md commits that projects conform to the data model and stays put, while the schema and design.md iterate until the model freezes at a first version. The schema is machine-readable and enforceable; design.md is the red thread a reader follows to understand the whole. Follows D-024, which specifies the data model before code, and keeps to D-022 by giving each document one job: spec.md requires, the schema defines, design.md explains.*

## 4. Open Topics

| # | Question | Blocks |
|---|---|---|
| 1 | Deleting a composition relationship: forbidden, or equivalent to deleting the owned entity? | design.md |
| 2 | ID collisions on import: renumber, or scope IDs by source? | Library implementation |
| 3 | Import granularity: whole standard, or clause by clause? | Library implementation |
| 4 | Essential requirements that apply regardless of hazards: how do they enter the model? | Workflow |
| 5 | Whether a base library of standard identities can be shipped | D-014 |

## 5. References

| No. | Reference | Link |
|---|---|---|
| *[1]* | *Reference*| *Link* |