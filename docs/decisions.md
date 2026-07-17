# Decisions

## Table of Contents

- [1. General](#1-general)
- [2. Decision Log](#2-decision-log)
- [3. Open Topics](#3-open-topics)

## 1. General

| Property | Value |
|---|---|
| Order | Chronological, by decision number |
| Numbering | Append-only. Never renumbered |
| Revision | Never rewritten. A decision that changes is superseded by a new entry |
| Supersession | The superseded entry gets a note pointing forward. It is not deleted |
| Tags | `legal` `product` `architecture` `repository` `documentation` `brand` |

**Note 1:** An entry names what was decided, why, and what it supersedes. It does not restate the specifications.

**Note 2:** An entry does not cite a section number or rule identifier in another document. Those move.

**Note 3:** Open topics are not append-only. They are renumbered as they close.

## 2. Decision Log

### D-001 License: EUPL-1.2

`2026-07-14` `legal`

The project is licensed under the European Union Public Licence 1.2, covering source, documents, and diagrams.

Copyleft keeps derivatives open, and one license covers code, prose, and diagrams alike. The EUPL is drafted in EU legal terms, so its disclaimers hold in the author's jurisdiction, and its compatibility clause permits future vendoring of MIT, Apache, GPL, and AGPL code.

Supersedes an earlier MIT decision. The repository was private throughout the MIT period, so no MIT-licensed copies were distributed.

---

### D-002 No commercial interest

`2026-07-14` `legal`

No sales, no donations, no sponsorship, no paid support.

Partly principle, partly legal position: the Product Liability Directive (EU) 2024/2853 and the Cyber Resilience Act both exempt open-source software developed outside a commercial activity. Any revenue stream moves the project into scope of both.

Any future funding proposal requires this entry to be revisited first.

---

### D-003 No reproduction of standard content

`2026-07-14` `legal`

The tool does not include or reproduce copyrighted content from harmonized standards: no clause text, no clause titles, no Annex ZA mappings.

Standards are sold by national standardization bodies. The knowledge the tool is built on is limited to what is public: legislation, guidance, and the published lists of harmonized standards.

---

### D-004 Artefacts, not assertions

`2026-07-14` `product`

The tool never states a conclusion about the safety or conformity of the product. It does not generate the technical file, the EU Declaration of Conformity, or any report claiming compliance.

Responsibility for CE marking rests with the manufacturer and cannot be delegated to a tool. A tool that appears to judge conformity invites exactly that delegation.

A permanent design principle, not a missing feature.

---

### D-005 Scope: machinery

`2026-07-14` `product`

Primary scope is CE marking of machinery under the Machinery Regulation (EU) 2023/1230. Legislation commonly applied alongside it, such as LVD, EMC, RoHS, CPR, and PED, is secondary scope. Other product types and national legislation are out of scope.

The metamodel encodes domain knowledge, and domain knowledge is specific. A tool covering all product legislation encodes none of it well.

---

### D-006 Hardcoded metamodel

`2026-07-14` `product`

The metamodel is built into the tool and versioned with it. Users cannot extend or modify it.

The value is a metamodel that is correct for the domain, not generic modeling capability. A user-extensible metamodel makes every model different and traceability between them meaningless. Generic modeling tools already exist.

---

### D-007 Terminology: Risk Reduction Measure

`2026-07-15` `product`

The canonical term is Risk Reduction Measure (RRM), not Protective Measure.

Chosen with knowledge of ISO 12100, which uses "protective measure" formally. "Risk reduction measure" is more widely used in industry and more self-explanatory to readers without ISO fluency.

Earlier public posts use the old term.

---

### D-008 The user lands directly in the tool

`2026-07-15` `product`

Opening the site places the user in the workspace. No homepage, wizard, or project setup in front of the tool. Information about the project is reachable from within it.

The tool is the product; the story about the tool is not. Modeled on draw.io.

The current landing page is interim and is demoted or removed when the tool ships.

---

### D-009 Graph view shows the neighborhood, not the model

`2026-07-15` `product`

The relationship pane's graph shows the selected entity and its directly related entities. Visualization of the whole model is a non-goal.

A neighborhood is a hub-and-spokes layout: deterministic, implementable in a few hundred lines of vanilla JavaScript. General graph layout is not, and would require a dependency. The neighborhood is also the more useful view, since it is how the user walks the model.

---

### D-010 Stack: vanilla HTML, CSS, and JavaScript ES modules

`2026-07-15` `architecture`

No framework, no build step, no package manager, no backend, no accounts. Deployed as static files.

Longevity, since there are no dependencies to rot. Security, since there is no supply chain. Privacy, since there is no server. Simplicity, since a solo maintainer new to software development can hold the whole thing in their head. The cost is writing what a framework would provide.

---

### D-011 Privacy by design

`2026-07-15` `architecture`

No server contact, no tracking, no analytics, no data collection. All processing happens in the user's browser. No third-party assets are loaded at runtime, including fonts.

---

### D-012 User-owned data, single local file

`2026-07-15` `architecture`

A project is saved as a single local JSON file, owned and controlled by the user.

---

### D-013 Vendoring takes the artifact, not the package

`2026-07-15` `architecture`

Third-party material is copied into the repository as files, with its license and an origin record beside it. Package managers are not used.

Demonstrated by the first case: IBM Plex ships npm telemetry that runs at install time. Vendoring the woff2 files takes the glyph data and structurally excludes the telemetry.

---

### D-014 Standards content is user-provided

`2026-07-16` `architecture`

The tool does not ship the content of harmonized standards. The user builds a library of the standards they have purchased, held as a local file, and imports from it into projects.

Follows from D-003. Reuse between projects is essential, since a manufacturer applies the same standards to every machine, but the reusable artifact contains standard content and therefore cannot come from the tool.

The tool provides no redistribution mechanism: no sharing, no community index, no import from URL. What a user does with a file on their own disk is their business; what the tool offers is the project's responsibility.

---

### D-015 Copy on import, not reference

`2026-07-16` `architecture`

Content imported from a library is copied into the project. The project does not reference the library.

A technical file is a snapshot of the standards assessed against, at the time of assessment. A closed project must not change because a library was updated later.

Rejected: referenced libraries with version tracking. Solves duplicate imports and propagates updates, neither of which the domain wants.

---

### D-016 Reuse without relationships, with one exception

`2026-07-16` `architecture`

Entities copied between projects arrive without their relationships. The user re-establishes them in the context of the new product.

Relationships are engineering judgments about a specific product. Carrying them over invites unexamined reuse of a judgment that may not hold.

Exception: relationships internal to an imported unit travel with it. The mappings printed in a standard's Annex ZA are facts, identical in every project, not judgments.

---

### D-017 Development server

`2026-07-15` `architecture`

Development uses `python3 -m http.server`, not the VS Code Live Server extension.

Live Server injects a reload script into every file it serves. This is invisible in HTML and breaks SVG: the injected markup follows the closing tag and makes the file invalid XML. It cost an evening of debugging a file that was never broken.

---

### D-018 Branch model

`2026-07-15` `repository`

`develop` and `main` carry identical content. `main` is a release snapshot of `develop`, produced by merging. The branches never diverge in content.

Divergence caused a landing page deletion. A partial merge is not possible without recreating that class of error.

---

### D-019 Atomic commits

`2026-07-15` `repository`

One commit, one logical change, with the project working after each.

`git bisect` finds the commit that broke something by binary search, and its precision equals commit size. This matters specifically for AI-assisted development by a beginner: when a change made three weeks ago breaks something, bisect over atomic commits is how a non-expert finds which session did it.

---

### D-020 Repository layout

`2026-07-16` `repository`

Masters in `docs/`. Deployed exports in `assets/`. Third-party code in `vendor/`. Third-party static assets in `assets/` with their license and origin.

A subfolder when a family exists, flat until it does.

One copy of each artifact, referenced from everywhere, duplicated nowhere. In a repository with no build step, nothing keeps copies in sync except the maintainer's memory.

Supersedes a self-contained-app layout, in which `app/` held its own assets and fonts so the folder could be downloaded and run standalone. Offline use is served by cloning the repository, and the duplication was not worth an aesthetic of folder independence.

---

### D-021 The proof of concept is a quarry, not a foundation

`2026-07-16` `repository`

The proof of concept is archived in `poc/`, frozen and unmaintained. It is not a basis for the implementation.

It proved the concept works and earned the project its design phase. But it was built through exploratory AI-assisted coding, and building on it would mean inheriting decisions nobody made.

---

### D-022 The concept mockup is throwaway code

`2026-07-16` `repository`

The mockup in `app/` demonstrates layout and concept with fixed content. Its JavaScript is prototype code, to be discarded when the specification drives the real implementation. Its CSS may be kept.

---

### D-023 Document set

`2026-07-16` `documentation`

Four documents, each with one job. `design.md` describes what the product is and why. `spec.md` states what it shall do. `decisions.md` records what was chosen and why. `brand.md` records what it looks like.

---

### D-024 "Shall" belongs to spec.md only

`2026-07-16` `documentation`

Requirements language is reserved for the specification. design.md is written in present-tense declarative, describing the tool as designed.

The exclusivity is what gives "shall" its force. If design.md contained requirements, no reader could tell which sentences bind and which describe.

---

### D-025 Build iteratively, spec the slice being built

`2026-07-17` `documentation`

design.md is the stable why and what. spec.md grows in build order, not in one pass. The exception is the data model, which is specified before code, because everything depends on it and changing it later means rewriting the tool.

The project's own history argues for this. The proof of concept came before any specification and proved the idea. The mockup came before design.md was finished and improved the design. Motivation is the scarce resource, not clarity.

---

### D-026 No verdict colors

`2026-07-17` `brand` `product`

No color in the palette means pass or fail. Green and red as status are excluded.

D-004 expressed chromatically: the tool never states a conclusion about conformity, so its palette must not either. Green reads as conformant, red as failing, to precisely the audience the tool is built for.

Amended by D-030: Hazard Analysis is orange, not red. Either way it is not a verdict. A hazard is a fact about the machine, not a judgment about compliance.

---

### D-027 Color is redundant, never load-bearing

`2026-07-17` `brand`

The pillar is always named beside its marker. Color is a speed aid, not the carrier of meaning.

Roughly one in twelve men has a red-green color vision deficiency, in a male-dominated field. Any palette will eventually be ambiguous to someone; naming the pillar means nobody is blocked.

---

### D-028 Brand profile

`2026-07-17` `brand`

Recorded in brand.md. IBM Plex Sans and Plex Mono, a blue accent, and a dark mode. Wordmark in a single color at a single weight, never split.

Supersedes the previous profile: Slate, Ink, Paper, with a two-tone wordmark. The split wordmark was decoration. It existed because it could, not because it did anything.

Superseded by D-030.

---

### D-029 Requirements is not amber

`2026-07-17` `brand`

The Requirements pillar moved from amber to magenta.

Amber and red collapse to the same color under deuteranopia. Hazard Analysis held red on domain grounds, so Requirements moved. Anyone tempted to restore amber should read this entry first.

Superseded by D-030, which derives every hue by rule. The magenta conclusion survives; the reasoning that produced it does not apply.

---

### D-030 Graphical profile: Reasonable Colors

`2026-07-17` `brand`

Every chromatic color is derived from Reasonable Colors by a rule that guarantees WCAG AA on the canvas of its mode. The values are in brand.md.

The palette is external, versioned, and MIT-licensed. No hue is a matter of taste, so there is nothing to relitigate and any future hue follows the same rule.

Verification is by Brettel dichromacy with distances in CAM02-UCS, and it is honest about the cost: no palette of four hues separates under every deficiency. Not corrected, and not a defect. D-027 is what carries it.

Supersedes D-028 and D-029 entirely. Amends D-026: Hazard Analysis is orange, not red.

D-029's figures were CIE76. brand.md's are CAM02-UCS. The two scales are not comparable, and comparing them produced a wrong conclusion during this session.

---

### D-031 The identity is a wordmark and a letter

`2026-07-17` `brand`

The brand assets are the wordmark and the favicon. Nothing else.

The favicon is "o", a letter taken from the wordmark. It was "oc". A monogram becomes a mark people recognise, and then the project has two marks; a single letter is a tab detail. The wordmark stays the identity.

Clear space is not built into the asset. Baked padding dictated the topbar layout and made the wordmark render at half its intended size. The asset is now tight to the ink and the consumer applies its own space.

Deleted: the banner and the social preview assets. They existed for consumers that did not exist. Composed per-surface when a surface asks.

---

### D-032 Specifications carry values, not policy

`2026-07-17` `documentation`

A line belongs in a specification if it is a value, or if deleting it would let someone silently break a value. It does not belong if it is a claim about a world that can move.

Statements of fact are stable. Statements of policy drift. Everything that broke in brand.md was policy: a selection table routing between variants that no longer existed, a path to a folder that never existed, a clear space rule the favicon itself violated. Every verified value held.

Documents live independent of each other. README owns the links and points down; nothing links up or sideways. One file maintains the edges, so a rename breaks one thing rather than four. Origin records live beside their artifact, which is a filesystem fact rather than a reference.

This log is the exception. It is append-only history, and superseded entries stay: the reasoning is what stops a settled question being reopened.

## 3. Open Topics

Identified, not yet decided.

| # | Question | Blocks |
|---|---|---|
| 1 | Deleting a composition relationship: forbidden, or equivalent to deleting the owned entity? | design.md |
| 2 | ID collisions on import: renumber, or scope IDs by source? | Library implementation |
| 3 | Import granularity: whole standard, or clause by clause? | Library implementation |
| 4 | Essential requirements that apply regardless of hazards: how do they enter the model? | Workflow |
| 5 | Whether a base library of standard identities can be shipped | D-014 |