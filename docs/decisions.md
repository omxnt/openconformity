# Decisions

This document records the decisions made for the project, what was chosen and why. The conventions define how an entry is written and identified, the decisions carry the reasoning behind each choice, and the undecided questions are those still open. A decision that changes is not edited but superseded by a new entry.

## 1. Conventions

### 1.1 Identifier

Each entry shall have a unique identifier, `D-NNN` for a decision and `U-NNN` for an undecided question. Entries are ordered by number, grouped loosely by theme. Identifiers are append-only, an entry is never renumbered, and a decision that changes is superseded by a new entry rather than edited. A question that is settled is removed, and its outcome recorded as a decision.


### 1.2 Tags

Each entry carries one or more tags from the table below.

| Tag | Description |
|---|---|
| `legal` | Licensing, liability, and the legislative scope the project operates within. |
| `product` | What the tool is and does: its purpose, features, and audience. |
| `architecture` | How the software is built: stack, dependencies, structure, and hosting. |
| `repository` | How the project is developed and maintained: platform, workflow, and tooling. |
| `documentation` | How the project is documented: which documents exist and how they are written. |
| `graphical` | The visual identity and interface profile: typefaces, colour, and marks. |

### 1.3 Content

An entry states what was decided and why. It does not repeat requirement text: where a decision resulted in a requirement, the entry gives the reasoning and refers to the requirement by its identifier.

### 1.4 Supersession

A decision that changes is not edited. A new entry is added that states the updated decision in full, and the entry it replaces is left unchanged except for a `superseded by D-NNN` tag naming the entry that replaces it.

### 1.5 Template

Each entry shall be written using the template below.

```markdown
### D-NNN Decision title

`YYYY-MM-DD` `tag`

The decision, stated plainly.

> *The rationale.*
```

## 2. Decisions

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

`2026-07-19` `repository` `superseded by D-033`

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

`2026-07-19` `documentation` `superseded by D-038`

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

`2026-07-19` `graphical` `superseded by D-041`

The brand is the wordmark "openconformity" and a favicon, and nothing else: no logo, no symbol, no monogram. The favicon is a square in the accent colour. The full graphical profile — typefaces, accent, and marks — is specified in spec.md.

> *A wordmark renders identically anywhere with no asset to maintain, and a single accent square is legible at 16 pixels where a wordmark is not. A monogram becomes a second mark to recognise; a plain square does not. Composition onto any surface is done per surface, so no banner or social-preview assets are kept in the repository.*

---

### D-029 Standard content from OJEU

`2026-07-19` `legal` `superseded by D-036`

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


---

### D-033 Repository layout

`2026-07-21` `repository` `superseded by D-035`

The repository is organised by kind, with the site at the root and a directory for each kind of content. Assets are grouped by type, with the editable source beside the artefacts it exports.

    app/            the demo mockup
    poc/            throwaway proofs of concept
    docs/           the specification, decisions, and design
    assets/
      fonts/        vendored typefaces, with licence and origin
      marks/        marks.fig, and the wordmark, favicon, and square it exports
      diagrams/     diagrams.drawio, and the SVG it exports
    schema/         the data model, as one schema file per document type

> *One copy of each artefact, referenced from everywhere and duplicated nowhere. In a repository with no build step, nothing keeps copies in sync except the maintainer's memory. Keeping an editable source beside its exports means the two are found and updated together rather than split across folders. Supersedes D-020, which covered assets only, and adds the schema directory holding the data model (D-032).*

---

### D-034 Separate deployments

`2026-07-23` `architecture`

The project site and the software are deployed separately, the site at openconformity.org and the software at app.openconformity.org. Each deployment is self-contained and carries its own copy of everything it serves.

> *The site is a first impression and will grow to hold documentation; the software is the tool a user bookmarks and returns to. Separating them lets each change without touching the other, and keeps material that is neither, such as the design sources and the throwaway experiments, out of both. Self-containment is what makes the software copyable: nothing reaches outside its own directory, so it runs from any address or from a local folder. The cost is that each deployment carries its own copy of the typefaces and marks. Specified in spec.md C-DEV-005.*

---

### D-035 Repository layout

`2026-07-23` `repository` `superseded by D-037`

The repository is organised by kind. Each deployable directory is self-contained, and the editable design sources sit apart from the artefacts they export.

    app/            the software
    site/           the project site
    docs/           the specification, decisions, and design
    schema/         the data model, as one schema file per document type
    sources/        editable design sources
    poc/            throwaway proofs of concept

> *Separate deployments (D-034) mean each served directory must hold everything it serves, so app/ and site/ each carry their own assets. This reverses the principle in D-020 and D-033, where one copy of each artefact was referenced from everywhere: a deployment root cannot reach above itself, so the typefaces and marks are duplicated rather than shared. What remains in sources/ is the material nothing serves, the editable originals from which the exports are produced. Supersedes D-033.*

---

### D-036 Standards content

`2026-07-23` `legal`

The project does not reproduce copyrighted content from harmonized standards. The harmonized-standards lists published in the Official Journal of the European Union give standard references and titles, which are public and may be used. Anything beyond that is treated as protected unless established otherwise.

> *D-029 drew the boundary at what the OJEU publishes, which is a workable rule but not the actual constraint: the question is whether content is protected, and OJEU publication is only evidence of that. Stating the real constraint means a clear answer on a particular item, such as whether the Annex ZA correspondence tables attract protection, can relax what the project may use without rewriting the requirement. Until such an answer exists, everything beyond the OJEU lists is treated as protected. Supersedes D-029. Specified in spec.md C-PRJ-005.*


---

### D-037 Repository layout

`2026-07-23` `repository`

The repository is organised by kind. Each deployable directory is self-contained, the editable design sources sit apart from the artefacts they export, and throwaway work is kept in a sandbox outside the deployables.

    app/            the software
    site/           the project site
    docs/           the specification, decisions, and design
    schema/         the data model, as one schema file per document type
    sources/        editable design sources
    sandbox/        throwaway work
      app/          iterations of the software
      site/         iterations of the project site
      poc/          the original proof of concept, frozen

> *Separate deployments (D-034) mean each served directory must hold everything it serves, so app/ and site/ each carry their own assets. What remains in sources/ is the material nothing serves, the editable originals from which the exports are produced. The sandbox mirrors the deployables for work in progress, so sandbox/app holds iterations of the software and sandbox/site holds explorations of the site. It also keeps the proof of concept the project started from, which is frozen as a record rather than iterated on, and so sits beside the two working areas rather than in one of them. Keeping the sandbox outside the deployable directories is what stops throwaway work being published: anything inside site/ is served the moment it is pushed. Supersedes D-035.*

---

### D-038 Document per concern

`2026-08-01` `documentation` `repository` `superseded by D-042`

One document per concern, created when the need arises. `design.md` is dissolved, `about.md` carries the background, concept, principles, and scope, `metamodel.md` the entity types and relationships, and `user-interface.md` the interface concept. `spec.md` is renamed `requirements.md`. Every document opens with its title and an overview in prose, followed by numbered chapters, with references last. There is no table of contents, the outline in GitHub and the editor serves that purpose. The form is kept as `template.md`. Files are named for their content, closed compounds written as the literature writes them (`metamodel.md`), multiword names hyphenated (`use-cases.md`), uppercase reserved for root meta-files. The design sources follow the same rule (`metamodel.drawio`, `visual-identity.fig`), and `sources/` holds editable originals that require a tool to edit and whose exports are consumed elsewhere. `README.md` owns the index. A document may point to another but never depends on or restates it.

> *A single design document mixed content that changes weekly with content that changes yearly, so no diff was clean and the document never felt finished. Small documents of one concern iterate independently, give the metamodel its own history, and let a reader pull only what a task needs. Content-named files are understood without being opened, which the genre names spec and design were not. Supersedes D-022.*

---

### D-039 British spelling

`2026-08-01` `documentation`

All project text uses British spelling. The earlier informal convention of writing "harmonized" with a z is reversed: the word is written "harmonised" everywhere. Quoted material keeps its source spelling.

> *One spelling convention with no exceptions is never relitigated. The European legal texts the project builds on use British spelling, so the project matches its source material.*

---

### D-040 Use cases as a document

`2026-08-01` `documentation` `superseded by D-042`

Use cases complement the requirements in a document of their own, `use-cases.md`. A requirement states a capability, verifiable in isolation. A use case states a sequence, how a user reaches a goal. Neither names interface elements, which belong to the design.

> *Requirements written at the level of user interaction would multiply into hundreds and constrain the implementation. The sequences live in use cases instead, keeping the requirements few and capability-shaped. Every system response in a use case should trace to a requirement, so writing the flows also surfaces the requirements that are missing.*


---

### D-041 Design system

`2026-08-06` `graphical`

The interface follows the IBM Carbon Design System, its colour tokens, spacing scale, type scale, component patterns, and icon set. Token values are copied into the CSS and the Carbon packages are not used. The identity is a symbol, a wordmark, and a favicon, rendered in black or white according to their background, with no accent colour.

> *The interface had been built decision by decision, and the result was flat and inconsistent in ways that were slow to fix one control at a time. A design system removes a class of decisions and gives a coherence that would otherwise be arrived at unevenly. Carbon is built for dense professional software, is open-licensed, can be self-hosted, and its typeface was already in use. Copying the tokens rather than the packages keeps the no-dependency stack intact. Supersedes D-028.*

---

### D-042 Fewer documents

`2026-08-06` `documentation`

The document set is `about.md`, `requirements.md`, `metamodel.md`, and `decisions.md`, with `template.md` giving the form the prose documents follow. `user-interface.md` is removed and what it described is stated as requirements. `use-cases.md` is not written. `metamodel.md` becomes a Mermaid diagram in place of a prose document and its exported image, and does not follow the template.

> *Writing everything as prose before building forced repeated iteration of documents that the code states more accurately. What survives is what nothing else can carry: requirements are verifiable, the metamodel is the model, and the log holds the reasoning. Interface behaviour became requirements rather than description, since a requirement is checkable where prose is not. A Mermaid diagram is text in the document, so it cannot drift from a source it is exported from. Supersedes D-038 and D-040.*

## 3. Undecided

The questions below are raised but not yet decided. Each stays here until it is settled and entered as a decision.

### U-001 Composition deletion

`2026-08-01` `product`

Whether deleting a composition relationship is forbidden, or equivalent to deleting the owned entity.

> *Affects the metamodel. Composition implies ownership, so removing the relationship leaves the owned entity without a parent unless the deletion cascades.*

---

### U-002 Hazard-independent essential requirements

`2026-08-01` `product`

How essential requirements that apply regardless of hazards enter the model.

> *Affects the metamodel. Essential requirements normally enter through the hazards that trigger them, so those applying unconditionally have no path into the model as it stands.*

---

### U-003 Identifier collisions on import

`2026-08-01` `product`

Whether identifiers that collide on import are renumbered, or scoped by their source.

> *Affects the library. Content imported from more than one source can carry the same identifier.*

---

### U-004 Import granularity

`2026-08-01` `product`

Whether a standard is imported whole, or clause by clause.

> *Affects the library.*

---

### U-005 Library scope

`2026-08-01` `product`

Which item types are reusable across projects, beyond standards.

> *Affects the library.*

---

### U-006 Base library

`2026-08-01` `product` `legal`

Whether a base library of standard identities can be shipped.

> *Affects the library. Would supersede D-014.*

---

### U-007 Default content

`2026-08-01` `product`

Whether the software ships any default content, or the user populates everything.

> *Affects the library.*

### U-008 Pseudo entities

`2026-08-03` `product`

Whether the model may hold pseudo entities, of a single untyped kind, connected to typed entities through one informal relationship.

> *Affects the metamodel. The software is a modelling environment rather than a method, so a scratch space for what the metamodel does not cover would let the user represent a process, a tool, or a note without leaving the model. The cost is a second layer that carries no semantics, drawn and named so that it cannot be mistaken for typed content. Nothing typed can depend on it, and it is not engineering content on export.*

---

### U-009 Freeform navigator

`2026-08-03` `product`

Whether the navigator is independent of the metamodel, so entities and folders can be placed anywhere in the tree, while the metamodel continues to govern which entities exist and how they may relate.

> *Affects the metamodel and the interface. The tree would be filing rather than structure. A user could work with folders alone, or build full traceability, or organise a machine so that a subsystem folder holds its own elements, hazards, measures and requirements. Composition would inform the default in the deletion prompt rather than constrain creation or placement, so a hazard can exist before its element and a library import needs no owner. Templates would ship as project files to give a new project a starting structure. Exports that depend on relationships are unavailable to a user who does not create them, and an entity such as an essential requirement may be modelled once or once per subsystem, which the software reports rather than normalises.*

## 4. References

| No. | Reference | Link |
|---|---|---|
| *[1]* | *Reference*| *Link* |