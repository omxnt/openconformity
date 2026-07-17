# Decision Log

Significant decisions, in the order they were made. Entries are append-only: never renumbered, never rewritten. A decision that changes is superseded by a new entry, and the old one gets a note pointing forward.

Tags: `legal` `product` `architecture` `repository` `documentation` `brand`

---

### D-001 License: EUPL-1.2

`2026-07-14` `legal`

The project is licensed under the European Union Public Licence 1.2, covering source, documents, and diagrams.

Copyleft keeps derivatives open, and one license covers code, prose, and diagrams alike. The EUPL is drafted in EU legal terms, so its disclaimers hold in the author's jurisdiction. It grants patent rights, covers network use, and its Article 5 compatibility clause permits future vendoring of MIT, Apache, GPL, and AGPL code.

Supersedes an earlier MIT decision. The repository was private throughout the MIT period, so no MIT-licensed copies were distributed.

### D-002 No commercial interest

`2026-07-14` `legal`

No sales, no donations, no sponsorship, no paid support.

Partly principle, partly legal position: the Product Liability Directive (EU) 2024/2853 and the Cyber Resilience Act both exempt open-source software developed outside a commercial activity. Any revenue stream moves the project into scope of both.

Any future funding proposal requires this entry to be revisited first.

### D-003 No reproduction of standard content

`2026-07-14` `legal`

The tool does not include or reproduce copyrighted content from harmonized standards: no clause text, no clause titles, no Annex ZA mappings.

Standards are sold by national standardization bodies. The knowledge the tool is built on is limited to what is public: legislation, guidance, and the published lists of harmonized standards.

The tool provides structure; the user provides the content of the standards they have purchased. See D-014.

### D-004 Artefacts, not assertions

`2026-07-14` `product`

The tool never states a conclusion about the safety or conformity of the product. It does not generate the technical file, the EU Declaration of Conformity, or any report claiming compliance, and does not indicate conformity in any form.

Responsibility for CE marking rests with the manufacturer and cannot be delegated to a tool. A tool that appears to judge conformity invites exactly that delegation. The tool generates raw engineering artefacts, intended as input to documents the user assembles under their own quality system.

A permanent design principle, not a missing feature. Recorded in design.md 4.3. Constrains the palette: see D-026.

### D-005 Scope: machinery

`2026-07-14` `product`

Primary scope is CE marking of machinery under the Machinery Regulation (EU) 2023/1230. Legislation commonly applied alongside it — LVD, EMC, RoHS, CPR, PED — is secondary scope. Other product types and national legislation are out of scope.

The metamodel encodes domain knowledge, and domain knowledge is specific. A tool covering all product legislation encodes none of it well.

### D-006 Hardcoded metamodel

`2026-07-14` `product`

The metamodel is built into the tool and versioned with it. Users cannot extend or modify it.

The value is a metamodel that is correct for the domain, not generic modeling capability. A user-extensible metamodel makes every model different and traceability between them meaningless. Generic modeling tools already exist.

### D-007 Terminology: Risk Reduction Measure

`2026-07-15` `product`

The canonical term is Risk Reduction Measure (RRM), not Protective Measure.

Chosen with knowledge of ISO 12100, which uses "protective measure" formally. "Risk reduction measure" is more widely used in industry and more self-explanatory to readers without ISO fluency.

One term everywhere: metamodel, documents, tool. Earlier public posts use the old term.

### D-008 The user lands directly in the tool

`2026-07-15` `product`

Opening the site places the user in the workspace. No homepage, wizard, or project setup in front of the tool. Information about the project is reachable from within it.

Follows from Minimal Barriers. The tool is the product; the story about the tool is not. Modeled on draw.io.

The current landing page is interim and is demoted or removed when the tool ships. Deployment topology is an implementation choice; this binds the experience, not the URL.

### D-009 Graph view shows the neighborhood, not the model

`2026-07-15` `product`

The relationship pane's graph shows the selected entity and its directly related entities. Visualization of the whole model is a non-goal.

A neighborhood is a hub-and-spokes layout: deterministic, implementable in a few hundred lines of vanilla JavaScript. General graph layout is not, and would require a dependency. The neighborhood is also the more useful view — it is how the user walks the model.

### D-010 Stack: vanilla HTML, CSS, and JavaScript ES modules

`2026-07-15` `architecture`

No framework, no build step, no package manager, no backend, no accounts. Deployed as static files.

Longevity, since there are no dependencies to rot. Security, since there is no supply chain. Privacy, since there is no server. Simplicity, since a solo maintainer new to software development can hold the whole thing in their head. The cost is writing what a framework would provide.

### D-011 Privacy by design

`2026-07-15` `architecture`

No server contact, no tracking, no analytics, no data collection. All processing happens in the user's browser.

No third-party assets are loaded at runtime, including fonts. See D-013.

### D-012 User-owned data, single local file

`2026-07-15` `architecture`

A project is saved as a single local JSON file, owned and controlled by the user.

### D-013 Vendoring takes the artifact, not the package

`2026-07-15` `architecture`

Third-party material is copied into the repository as files, with its license and an ORIGIN.md recording source, version, and what was taken. Package managers are not used.

Demonstrated by the first case: IBM Plex ships npm telemetry that runs at install time. Vendoring the woff2 files takes the glyph data and structurally excludes the telemetry. Fonts are served from the repository rather than Google Fonts, which would violate D-011 on first page load.

### D-014 Standards content is user-provided

`2026-07-16` `architecture`

The tool does not ship the content of harmonized standards. The user builds a library of the standards they have purchased, held as a local file, and imports from it into projects.

Follows from D-003. Reuse between projects is essential — a manufacturer applies the same standards to every machine — but the reusable artifact contains standard content and therefore cannot come from the tool.

The tool provides no redistribution mechanism: no sharing, no community index, no import from URL. What a user does with a file on their own disk is their business; what the tool offers is the project's responsibility.

Open: whether a base library of standard identities, from the published lists of harmonized standards, can be shipped. Depends on the copyright question.

### D-015 Copy on import, not reference

`2026-07-16` `architecture`

Content imported from a library is copied into the project. The project does not reference the library.

A technical file is a snapshot of the standards assessed against, at the time of assessment. A closed project must not change because a library was updated later. Copy-on-import is correct behavior, not a limitation. It also avoids a model with two kinds of entities — owned and referenced — that every operation would have to distinguish.

Rejected: referenced libraries with version tracking. Solves duplicate imports and propagates updates, neither of which the domain wants.

### D-016 Reuse without relationships, with one exception

`2026-07-16` `architecture`

Entities copied between projects arrive without their relationships. The user re-establishes them in the context of the new product.

Relationships are engineering judgments about a specific product. Carrying them over invites unexamined reuse of a judgment that may not hold.

Exception: relationships internal to an imported unit travel with it. The `satisfies` relationships between a standard's requirements and the essential requirements they cover are facts printed in Annex ZA, identical in every project — not judgments. Relationships that would bind the unit to the existing model, such as `allocated to` or `implements`, do not travel.

### D-017 Development server

`2026-07-15` `architecture`

Development uses `python3 -m http.server`, not the VS Code Live Server extension.

Live Server injects a reload script into every file it serves. This is invisible in HTML and breaks SVG: the injected markup follows the closing tag and makes the file invalid XML. It cost an evening of debugging a file that was never broken. `python3 -m http.server` ships with macOS, injects nothing, and is the same command needed to run ES modules locally.

### D-018 Branch model

`2026-07-15` `repository`

`develop` and `main` carry identical content. `main` is a release snapshot of `develop`, produced by merging. The branches never diverge in content.

Divergence caused a landing page deletion (commit f956761). A partial merge is not possible without recreating that class of error.

Anything on develop reaches main at the next release, including the archived proof of concept.

### D-019 Atomic commits

`2026-07-15` `repository`

One commit, one logical change, with the project working after each.

`git bisect` finds the commit that broke something by binary search, and its precision equals commit size. This matters specifically for AI-assisted development by a beginner: when a change made three weeks ago breaks something, bisect over atomic commits is how a non-expert finds which session did it.

### D-020 Repository layout

`2026-07-16` `repository`

Masters in `docs/`. Deployed exports in `assets/`. Third-party code in `vendor/`. Third-party static assets, such as fonts, in `assets/` with their license and origin.

A subfolder when a family exists, flat until it does. `assets/brand/` earns its folder because logo and favicons are a family; `assets/meta.svg` stays flat because it is one file.

One copy of each artifact, referenced from everywhere, duplicated nowhere. In a repository with no build step, nothing keeps copies in sync except the maintainer's memory.

Supersedes a self-contained-app layout, in which `app/` held its own assets and vendored fonts so the folder could be downloaded and run standalone. That property was dropped: offline use is served by cloning the repository, and the duplication it required was not worth an aesthetic of folder independence.

### D-021 The proof of concept is a quarry, not a foundation

`2026-07-16` `repository`

The proof of concept is archived in `poc/`, frozen and unmaintained. It is not a basis for the implementation.

It proved the concept works and earned the project its design phase. But it was built through exploratory AI-assisted coding, and building on it would mean inheriting decisions nobody made. The tool is built from the design document, stealing freely from the proof of concept without inheriting its structure.

### D-022 The concept mockup is throwaway code

`2026-07-16` `repository`

The mockup in `app/` demonstrates layout and concept with fixed content. Its JavaScript is prototype code, to be discarded when the specification drives the real implementation. Its CSS may be kept.

### D-023 Document set

`2026-07-16` `documentation`

Four documents, each with one job. `design.md` describes what the product is and why. `spec.md` states what it shall do. `decisions.md` records what was chosen and why. `brand.md` records what it looks like.

### D-024 "Shall" belongs to spec.md only

`2026-07-16` `documentation`

Requirements language is reserved for the specification. design.md is written in present-tense declarative, describing the tool as designed.

The exclusivity is what gives "shall" its force. If design.md contained requirements, no reader could tell which sentences bind and which describe.

### D-025 Build iteratively, spec the slice being built

`2026-07-17` `documentation`

design.md is the stable why and what. spec.md grows in build order, not in one pass. The exception is the data model — the JSON shape, entity identity, relationship storage — which is specified before code, because everything depends on it and changing it later means rewriting the tool.

The project's own history argues for this. The proof of concept came before any specification and proved the idea. The mockup came before design.md was finished and improved the design: it surfaced the metamodel button, forced the tree structure question, and exposed a terminology error. Motivation is the scarce resource, not clarity.

### D-026 No verdict colors

`2026-07-17` `brand` `product`

No color in the palette means pass or fail. Green and red as status are excluded.

D-004 expressed chromatically: the tool never states a conclusion about conformity, so its palette must not either. Green reads as conformant, red as failing, to precisely the audience the tool is built for.

Red appears on Hazard Analysis, which is not a verdict. A hazard is a fact about the machine, not a judgment about compliance, and red for hazards is the industry's own convention.

### D-027 Color is redundant, never load-bearing

`2026-07-17` `brand`

The pillar is always named beside its marker. Color is a speed aid, not the carrier of meaning.

Roughly one in twelve men has a red-green color vision deficiency, in a male-dominated field. Any palette will eventually be ambiguous to someone; naming the pillar means nobody is blocked.

Functional colors are markers only — never a text fill, never a status, never in the logo or on marketing surfaces.

### D-028 Brand profile

`2026-07-17` `brand`

Recorded in brand.md. IBM Plex Sans and Plex Mono. Blue, Paper, Ink, Muted, Hairline, with a dark mode. Wordmark in a single color at a single weight, never split.

Supersedes the previous profile: Slate, Ink, Paper, with a two-tone wordmark. The split wordmark was decoration — it existed because it could, not because it did anything.

The palette in brand.md is the complete set. New hues, hover ramps, and status colors are excluded by D-026 and by the profile itself.

### D-029 Requirements is not amber

`2026-07-17` `brand`

The Requirements pillar is `#BA598D`. It was `#9A6A00`.

Amber and red collapse to the same color under deuteranopia — worst-pair ΔE 10, worse than the draw.io defaults the palette replaced. Hazard Analysis holds red on domain grounds (D-026), so Requirements moved. With blue, violet, and red taken, the free hue arc is magenta. Worst pair is now ΔE 25 across normal, deuteranopic, and protanopic vision.

`#BA598D` was chosen by search, not by eye: chroma and lightness matched to the rest of the family, contrast cleared on both Paper and Night. Anyone tempted to restore amber should read this entry first.

Open: whether the palette should instead be drawn from the Okabe–Ito color-universal palette, which scores ΔE 32. Not adopted — the current palette is the project's own and its semantic assignment is better — but the trade was never formally decided.

### D-030 Graphical profile: Reasonable Colors

`2026-07-17` `brand`

Recorded in brand.md. Every chromatic color comes from Reasonable Colors under one rule: shade 4 in light mode, shade 3 in dark mode, on the canvas of its mode. Grays are a separate ramp that mirrors across modes. The rule guarantees WCAG AA on either canvas for any hue, so the palette is derived rather than chosen.

Cerulean is the accent and means interactive. The four pillars are violet, magenta, orange, and green. The wordmark is Ink, never Cerulean.

Supersedes D-028 and D-029 entirely. The profile they describe, its palette, and the reasoning behind its hexes are void. Amends D-026: Hazard Analysis is orange, not red; the principle stands, and orange is not a verdict either.

The palette is external, versioned, and MIT-licensed, which removes taste from the argument. Any future hue follows the same rule, so there is nothing to relitigate.

Verification is by Brettel 1997 dichromacy with distances in CAM02-UCS, and it is honest about the cost: no palette of four hues separates under every deficiency. Deuteranopia merges Hazard Analysis with Structure, protanopia merges Legislative with Requirements, and tritanopia renders Legislative and Structure as the same teal at ΔE 1.6. Not corrected, and not a defect. R6 carries all three: the entity name always accompanies the marker.

ΔE figures in brand.md are CAM02-UCS. D-029's ΔE 25 was CIE76. The two scales are not comparable, and comparing them produced a wrong conclusion during this session.

---

## Open

Identified, not yet decided.

| Question | Blocks |
|---|---|
| Deleting a composition relationship: forbidden, or equivalent to deleting the owned entity? | design.md 5.3 |
| ID collisions on import: renumber, or scope IDs by source? | Library implementation |
| Import granularity: whole standard, or clause by clause? | Library implementation |
| Essential requirements that apply regardless of hazards: how do they enter the model? | Workflow, design.md |
| Whether a base library of standard identities can be shipped | D-014 |