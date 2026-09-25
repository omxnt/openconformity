# Requirements

This document specifies the requirements the software is implemented and verified against. The conventions define how a requirement is written and identified, and the four classes that follow state the constraints, the graphical profile, the functional behaviour, and the non-functional qualities. Each requirement carries an identifier, a rationale, and a status.

## 1. Conventions

### 1.1 Terms

The requirements use the following terms with the meanings given here. Terms the metamodel defines, the entity types, relationship types, and pillars, are used as it defines them and are not repeated.

| Term | Meaning |
|---|---|
| the software | The application these requirements specify, as delivered to a browser. |
| the user | The person operating the software in a browser. |
| the host | The origin that serves the software's files. Fetching the software is a request to the host. |
| model | The entities, relationships, and attribute values a user has recorded about one product, held in memory while the software runs. |
| project file | The single file the software writes and reads to hold a model, valid against the project schema. |
| library file | A single file the user owns holding reusable items, valid against the library schema. |
| template | A project file the maintainer publishes beside the software for the user to open as a starting point. |
| attribute | A named value an entity carries, as defined for its type in the attributes document. |
| drawing | An attribute value holding an SVG document. One the drawing editor made carries the editor's own model inside it. |
| drawing editor | The external application the software opens to create or edit a drawing. |
| drawing size limit | The largest drawing the software accepts, 512 kilobytes. |
| view | A presentation of the model the software generates for reading or export, and not part of the model. |
| browser storage | The storage a browser keeps for the software's origin, in which the software persists working state on the user's device. |
| session storage | Browser storage that lasts for one browser session and is cleared when it ends. |
| working state | The open project, the selection, and whatever else the software restores when it is opened again. |
| external application | Software at another origin that the software hosts in a frame and talks to. |
| external service | The origin an external application is served from. A function that uses one names it. |
| user data | Anything the user enters or the software derives from it. This covers the model, its content, drawings, and the user's choices in the software. |

### 1.2 Characteristics

Each requirement shall be written following the INCOSE characteristics [1].

| No. | Characteristic | Description |
|---|---|---|
| C1 | Necessary | The need or requirement statement defines capability, characteristic, constraint, or quality factor needed or required to satisfy a lifecycle concept, need, source, or higher-level requirement. |
| C2 | Appropriate | The specific intent and amount of detail of the need or requirement statement is appropriate to the level (the level of abstraction, organization, or system architecture) of the entity to which it refers. |
| C3 | Unambiguous | Need and requirement statements must be stated such that their intent is clear and can be interpreted in only one way by all intended audiences. |
| C4 | Complete | The need statement sufficiently describes the necessary capability, characteristic, constraint, conditions, or quality factor to meet the lifecycle concept or source from which it was transformed. The requirement statement sufficiently describes the necessary capability, characteristic, constraint, conditions, or quality factor to meet the need, source, or higher-level requirement from which it was transformed. |
| C5 | Singular | The need or requirement statement should state a single capability, characteristic, constraint, or quality factor. |
| C6 | Feasible | The need or requirement can be realized within entity constraints (for example: cost, schedule, technical, legal, ethical, safety) with acceptable risk. |
| C7 | Verifiable | The need statement is structured and worded such that its realization can be validated to the approving authority’s satisfaction. The requirement statement is structured and worded such that its realization can be verified to the approving authority’s satisfaction. |
| C8 | Correct | The need statement must be an accurate representation of the lifecycle concept or source from which it was transformed. The requirement statement must be an accurate representation of the need, source, or higher-level requirement from which it was transformed. |
| C9 | Conforming | Statements and expressions of individual needs and requirements should conform to an approved standard pattern and style guide or standard for writing and managing needs and requirements. |

### 1.3 Syntax

Each requirement shall be written using the EARS syntax [2], and be tagged with the type of pattern which was used.

| Type | Description | Syntax | Example |
|---|---|---|---|
| Generic | The clauses of a requirement written in EARS always appear in the same order. The EARS ruleset states that a requirement must have zero or many preconditions, zero or one trigger, one system name, and one or many system responses. The application of the EARS notation produces requirements in a small number of patterns, depending on the clauses that are used. | `While <optional pre-condition>, when <optional trigger>, the <system name> shall <system response>` | N/A |
| Ubiquitous | Ubiquitous requirements are always active (so there is no EARS keyword) | `The <system name> shall <system response>`| The mobile phone shall have a mass of less than XX grams. |
| State driven | State driven requirements are active as long as the specified state remains true and are denoted by the keyword While. | `While <precondition(s)>, the <system name> shall <system response>` | While there is no card in the ATM, the ATM shall display “insert card to begin”. |
| Event driven | Event driven requirements specify how a system must respond when a triggering event occurs and are denoted by the keyword When. | `When <trigger>, the <system name> shall <system response>`| When “mute” is selected, the laptop shall suppress all audio output. |
| Optional feature | Optional feature requirements apply in products or systems that include the specified feature and are denoted by the keyword Where. | `Where <feature is included>, the <system name> shall <system response>` | Where the car has a sunroof, the car shall have a sunroof control panel on the driver door. |
| Unwanted behaviour | Unwanted behaviour requirements are used to specify the required system response to undesired situations and are denoted by the keywords If and Then. | `If <trigger>, then the <system name> shall <system response>` | If an invalid credit card number is entered, then the website shall display “please re-enter credit card details”. |
| Complex | The simple building blocks of the EARS patterns described above can be combined to specify requirements for richer system behaviour. Requirements that include more than one EARS keyword are called Complex requirements. Complex requirements for unwanted behaviour also include the If-Then keywords. | `While <precondition(s)>, When <trigger>, the <system name> shall <system response>` | While the aircraft is on ground, when reverse thrust is commanded, the engine control system shall enable reverse thrust. |

### 1.4 Rationale

Each requirement shall have a rationale, see the SEBoK guidelines [3].

> "The use of the rationale attribute helps communicate why the requirement is needed, any assumptions made, the source of numbers, the results of related design studies, or any other related supporting information. This supports further requirements analysis and decomposition, as well as identifying the source of any requirement value."

### 1.5 Identifier

Each requirement shall have a unique identifier of the form `CLASS-GROUP-NNN`. Once the document is issued, identifiers are append-only, so a requirement that is removed is not reissued under the same identifier. While the document is in draft, identifiers may be reorganised.

| Field | Meaning |
|---|---|
| `CLASS` | The requirement class. |
| `GROUP` | The group within the requirement class. |
| `NNN` | The sequential number within the group. |

### 1.6 Status

Each requirement shall carry a status tag.

| Tag | Meaning |
|---|---|
| `draft` | Newly written, or still being worked on. |
| `stable` | Settled as written, and not expected to change. |

### 1.7 Template

Each requirement shall be written using the template below.

```markdown
#### CLASS-GROUP-NNN Requirement title

`syntax` `status`

Requirement text.

> *Requirement rationale.*
```

## 2. Constraints

### 2.1 Project

---

#### C-PRJ-001 Project name

`ubiquitous` `stable`

The project shall be named "openconformity".

> *Short for "open-source conformity assessment", meaning free and open-source software for the process by which a product is shown to meet European product legislation.*

---

#### C-PRJ-002 Domain name

`ubiquitous` `stable`

The project shall use the domain `openconformity.org`.

> *The domain is the name. The .org top-level domain signals a non-commercial, public-interest project rather than a commercial product.*

---

#### C-PRJ-003 Project licence

`ubiquitous` `stable`

The project shall be licensed under the `EUPL-1.2`.

> *A copyleft licence that keeps derivatives open, covers documents and diagrams as well as code, and holds up under EU law.*

---

#### C-PRJ-004 Funding model

`ubiquitous` `stable`

The project shall not be supplied in the course of a commercial activity.

> *Supplied outside any commercial activity, the project stays outside the scope of the Product Liability Directive and the Cyber Resilience Act, which apply to software placed on the market in the course of a commercial activity. Such activity covers, among other things, advertising, paid features, and sponsorship.*

---

#### C-PRJ-005 Standards content

`ubiquitous` `stable`

The project shall not reproduce copyrighted content from harmonised standards.

> *Standards are sold by national standardisation bodies and their content is protected. The harmonised standards lists published in the Official Journal of the European Union give standard references and titles, which are public and may be used. Anything beyond that, including clause text, tables, figures, and Annex ZA mappings, is treated as protected unless established otherwise.*

### 2.2 Development

---

#### C-DEV-001 Source repository

`ubiquitous` `stable`

The source shall be maintained in a public GitHub repository.

> *GitHub is a common platform. Public development keeps the source open and the history inspectable, consistent with the licence.*

---

#### C-DEV-002 Hosting platform

`ubiquitous` `stable`

The software shall be hosted on Cloudflare Pages.

> *Cloudflare Pages serves the static files directly from the GitHub repository at no cost, with global distribution and nothing to maintain.*

---

#### C-DEV-003 Metamodel source

`ubiquitous` `stable`

The metamodel shall be maintained as Mermaid text in `docs/metamodel.md`.

> *Mermaid is a text format, so the diagram in the document is its own source, renders wherever the document is read, and cannot drift from an exported image. Being text, it constrains no tool. Any editor serves, and the repository diff shows every change to the model.*

---

#### C-DEV-004 Identity source

`ubiquitous` `stable`

The identity shall be maintained in Figma.

> *Figma is a common design tool with a free tier. The source lives in the repository as a .fig file and exports to SVG, PNG, or JPEG for use in the project.*

---

#### C-DEV-005 Software address

`ubiquitous` `stable`

The software shall be served at `app.openconformity.org`.

> *The software is served on its own subdomain, separate from the project site at the root domain. The two are deployed independently, and the software is self-contained so that it can equally be served from anywhere else.*

### 2.3 Technical

---

#### C-TEC-001 Technology stack

`ubiquitous` `stable`

The software shall be built with HTML, CSS, and JavaScript only.

> *Native browser languages, understood directly by every modern browser with no transpilation.*

---

#### C-TEC-002 No dependencies

`ubiquitous` `stable`

The software shall not include third-party code (frameworks or libraries).

> *No third-party libraries or frameworks means no supply chain to secure and no dependency to rot, which a solo maintainer can neither audit nor keep current.*

---

#### C-TEC-003 No build process

`ubiquitous` `stable`

The software shall run directly from its source files, with no build step or package manager.

> *The files in the repository are the files the browser runs. Nothing is compiled, bundled, or installed, so the deployed software is exactly the source, and anyone can serve it by copying the folder.*

---

#### C-TEC-004 JavaScript modules

`ubiquitous` `stable`

The software shall organise its JavaScript as native ES modules.

> *ES modules give modular structure, with explicit imports and exports, without a bundler. This is what makes the no-build stack workable at scale. The alternatives, a single large file or global scripts, do not scale for a maintainer.*

---

#### C-TEC-005 Third-party assets

`optional feature` `stable`

Where the software uses third-party assets, they shall be self-hosted and open-licensed.

> *Assets such as typefaces or icons carry no executable code, so they pose no supply-chain risk and are allowed where third-party code is not. Self-hosting keeps the software self-contained and avoids requests to third-party servers, and open licensing keeps redistribution compatible with the EUPL.*

---

#### C-TEC-006 Browser-based

`ubiquitous` `stable`

The software shall run in a web browser, with no installation required.

> *The browser is the delivery platform. The user reaches the software by opening a URL, with nothing to install, update, or maintain on their machine. This is the root technical constraint from which the stack, build, and dependency constraints follow.*

---

#### C-TEC-007 No server-side code

`ubiquitous` `stable`

The software shall consist of static files only, with no server-side code.

> *The host serves files and executes nothing. With no server-side code there is nowhere for user data to be received, processed, or stored remotely, which makes the privacy and operation qualities structurally guaranteed rather than promised. It also rules out any server functions the hosting platform would otherwise permit.*

---

#### C-TEC-008 External application

`optional feature` `draft`

Where the software uses an external application, the application shall be separately hosted, neither included nor bundled with the software, and used only through a sandboxed frame.

> *C-TEC-002 keeps third-party code out of the software's files, and an external application stays out of them. It is another application the software talks to, not a library it runs. How the frame is sandboxed is a security requirement (N-SEC-004), and stating the boundary here spares the next reader the argument.*

## 3. Graphical

### 3.1 Identity

---

#### G-IDN-001 Wordmark

`ubiquitous` `stable`

The wordmark shall be "openconformity" set as below.

| Property | Value |
|---|---|
| Typeface | Bai Jamjuree |
| Weight | Medium, 500 |
| Case | Lower |
| Letter spacing | 0% |
| Colour | `#161616` |

> *The name is the identity. A square sans reads as engineering without being cold, and a weight above regular gives the mark presence at the size it appears in the shell.*

---

#### G-IDN-002 Favicon

`ubiquitous` `stable`

The favicon shall be an isometric cube cut out of a filled circle, rendered dark on a light background and light on a dark one.

> *A favicon is too small to render the wordmark legibly, and a cube is the simplest form of a system element. Cutting rather than drawing it makes the mark one shape in one colour, so it inverts cleanly and what shows through is whatever it sits on.*

### 3.2 System

---

#### G-SYS-001 Design system

`ubiquitous` `stable`

The software shall follow the IBM Carbon Design System, its colour tokens, spacing scale, type scale, and component patterns.

> *A design system removes a class of decisions and gives the interface a consistency that would otherwise be arrived at slowly and unevenly. Carbon is built for dense professional software, is open-licensed, and can be self-hosted.*

---

#### G-SYS-002 Prose typeface

`ubiquitous` `stable`

The software shall render prose text in IBM Plex Sans.

> *A humanist sans keeps prose legible at interface sizes. It is the typeface of the design system, is open-licensed, and can be self-hosted.*

---

#### G-SYS-003 Data typeface

`ubiquitous` `stable`

The software shall render identifiers and data values in IBM Plex Mono.

> *A monospace face marks machine-referenceable content, such as identifiers, clauses, and values, as distinct from prose at a glance.*

---

#### G-SYS-004 Iconography

`ubiquitous` `stable`

The software shall use Carbon Icons for its iconography.

> *The icon set belongs to the same design system as the typeface and the tokens, so the interface reads as one thing. Its coverage is wide enough for the entity types, and it is open-licensed and self-hosted.*

---

#### G-SYS-005 Pane layout

`ubiquitous` `stable`

The software shall present the panes arranged as below.

```
┌─────────────────────────────────────────────────────────┐
│  Shell bar                                              │
├───────────────────┬─────────────────────────────────────┤
│  Navigator pane   │  Editor pane                        │
│                   │                                     │
│  Tree of          │  Attributes of the                  │
│  the model        │  selected entity                    │
│                   │                                     │
│                   ├─────────────────────────────────────┤
│                   │  Relationship pane                  │
│                   │                                     │
│                   │  Relationships of the               │
│                   │  selected entity                    │
└───────────────────┴─────────────────────────────────────┘
```

> *The layout gives each concern of the work its own pane, one to navigate the model, one to edit the selected entity, and one to work with its relationships. Each pane acts on what the navigator has selected, so the tree stays visible at full height while the editor and relationships share the column beside it.*

## 4. Functional

### 4.1 Application

---

#### F-APP-001 Small-viewport notice

`unwanted behaviour` `stable`

If the viewport is smaller than the supported viewport, then the software shall display a notice that a desktop-sized screen is required.

> *Below the supported viewport the multi-pane interface cannot function. A notice is honest about the limitation, where a degraded interface would misrepresent what the software can do.*

---

#### F-APP-002 Direct entry

`ubiquitous` `stable`

The software shall present the workspace on entry, without a homepage, wizard, or project setup prompt.

> *The software is the destination, not a page in front of it. A first visit opens an empty project ready for the first entity, and information about the project is available from within the software rather than ahead of it.*

### 4.2 Session

---

#### F-SES-001 Working state

`event driven` `stable`

When the software is opened, it shall restore the working state of the previous session.

> *The user returns to what they left. Losing the open project and the selection on every visit would make the software unusable for work that spans more than one sitting.*

---

#### F-SES-002 Model retention

`event driven` `stable`

When the model changes, the software shall persist the change in browser storage.

> *Work survives closing the software without a save, as a drawing survives closing draw.io. Browser storage is retained at the browser's and the user's discretion, and is cleared with site data, so the saved project file remains the durable record. Persisting on change, rather than on close, means a crash loses nothing either.*

---

#### F-SES-003 Browser removal

`event driven` `draft`

When the user removes the software's data from the browser, the software shall confirm first, stating what is lost, and shall then delete everything it keeps in browser storage, the project, the session state and the user's choices.

> *A borrowed or shared machine must be left with nothing. The browser's own site-data clearing does the same, but from outside the software and only for those who know where to look, and clearing history alone does not reach site data at all. An action in the software makes the wipe explicit and complete. A project saved to a file is the user's and is not touched.*

### 4.3 Workspace

---

#### F-WSP-001 Model tree

`ubiquitous` `stable`

The software shall present the model as a tree in the navigator pane.

> *A tree is how the user navigates and selects. Everything else in the interface acts on what is selected there, so the model needs one visible structure to select from. The tree presents the user's filing of the model (F-WSP-004), not its structure.*

---

#### F-WSP-002 Entity attributes

`event driven` `stable`

When an entity is selected, the software shall present its attributes in the editor pane.

> *The attributes are the content of an entity. Presenting them on selection is what makes the tree a way into the model rather than a list of names.*

---

#### F-WSP-003 Entity relationships

`event driven` `stable`

When an entity is selected, the software shall present its relationships in the relationship pane.

> *The relationships are what distinguish a model from a set of documents. Showing them beside the attributes keeps the connections visible while the entity is worked on.*

---

#### F-WSP-004 Free filing

`ubiquitous` `stable`

The software shall permit an entity to be filed at any position in the navigator tree, regardless of its type and relationships.

> *The tree is the user's filing of the model, not its structure. The metamodel governs which entities exist and how they may relate. Where they are placed is organisation, and two users may file the same model differently, one by machine structure and one by legislation. Any placement rule derived from the metamodel would forbid one of them.*

---

#### F-WSP-005 Neutral filing

`ubiquitous` `stable`

The software shall not create, modify, or require relationships based on an entity's position in the tree.

> *Relationships are engineering judgments, made deliberately in the relationship pane. Inferring them from placement would manufacture judgments nobody made, and requiring them for placement would turn filing into modelling. Placement carries no meaning, and the relationships carry all of it.*

---

#### F-WSP-006 Folder creation

`ubiquitous` `stable`

The software shall permit the creation of folders at any position in the navigator tree.

> *Folders are filing, not model content. They hold entities and other folders, carry a name and nothing else, and appear in no view or export. They give a user structure the metamodel does not impose, a zone, a workstream, a supplier, without adding anything to the model. Deleting a folder removes filing, never the entities filed in it.*

### 4.4 Model

---

#### F-MOD-001 Entity creation

`ubiquitous` `stable`

The software shall only permit the creation of entity types defined by the metamodel in `docs/metamodel.md`.

> *The metamodel encodes the domain. Allowing an entity type it does not define would let a model express something the domain does not have. The referenced diagram is the authoritative definition, transcribed by the implementation.*

---

#### F-MOD-002 Relationship creation

`ubiquitous` `stable`

The software shall only permit the creation of relationships defined by the metamodel in `docs/metamodel.md`.

> *A relationship not present in the metamodel has no meaning in the domain. Enforcing this on creation is what makes a model structurally sound by construction rather than by review. The referenced diagram is the authoritative definition, transcribed by the implementation.*

---

#### F-MOD-003 Attribute definition

`ubiquitous` `stable`

The software shall only present and edit the attributes defined for the entity's type in `docs/attributes.md`.

> *The attribute definitions encode what each entity type states about the domain. Presenting only defined attributes is what makes the editor render the model rather than a free-form form. Which attributes exist per type is defined in the referenced document, transcribed by the implementation.*

---

#### F-MOD-004 Edit confirmation

`ubiquitous` `stable`

The software shall not apply changes to an entity's attributes until the user confirms them.

> *An entity is read far more often than it is edited. Requiring confirmation means the model cannot be changed by a stray keystroke while reading.*

---

#### F-MOD-005 Entity deletion

`event driven` `stable`

When an entity is deleted, the software shall remove the relationships it takes part in.

> *A relationship cannot exist without both of its entities. Leaving one behind would produce a connection to nothing.*

---

#### F-MOD-006 Composition deletion

`event driven` `stable`

When an entity that owns entities through composition is deleted, the software shall delete the owned entities.

> *Composition is ownership. An owned entity is part of its owner, as an essential requirement is part of its legislation, and a part does not outlive its whole. Deleting the owner and keeping the parts would leave content whose source is gone. Relationships of other kinds do not cascade, and deleting their entities severs only the relationship.*

---

#### F-MOD-007 Cascade confirmation

`event driven` `stable`

When a deletion would cascade to owned entities, the software shall require confirmation stating the entities that will be deleted.

> *A cascading deletion is the most destructive action in the software, and its full extent is not visible from the entity being deleted. Stating what will go, before it goes, makes the consequence a decision rather than a surprise.*

---

#### F-MOD-008 Undo action

`event driven` `stable`

When undo is invoked, the software shall revert the most recent model change.

> *A modelling session is a stream of small changes, and any of them can be a mistake. Undo makes every change recoverable, including a cascading deletion. The confirmation warns before the loss, and undo forgives after it. A change is the same unit the software persists, a confirmed edit, a creation, or a deletion.*

---

#### F-MOD-009 Redo action

`event driven` `stable`

When redo is invoked, the software shall reapply the most recently undone model change.

> *Undo is exploratory, and stepping back to look is only safe if stepping forward again is possible. Redo makes undo itself mistake-proof.*

### 4.5 Views

---

#### F-VIE-001 Model views

`ubiquitous` `draft`

The software shall generate exportable views of the model.

> *Views are the output of the modelling work, artefacts such as a hazard list or a requirement specification, generated from the model rather than authored beside it. Which views exist and what each contains is specified as the views are built. This requirement states the capability they decompose from.*

### 4.6 Persistence

---

#### F-PER-001 Project persistence

`ubiquitous` `stable`

The software shall persist a project as a single local file conforming to `schema/project.schema.json`.

> *A project holds the user's model of one product's conformity, the entities and their relationships, following the metamodel. Saved as a single local file the user owns and controls, a project is portable, inspectable, and reloadable without any server or account. The schema is the authoritative definition of a valid project file.*

---

#### F-PER-002 Library persistence

`ubiquitous` `draft`

The software shall persist a library as a single local file conforming to `schema/library.schema.json`.

> *A library holds reusable items the user saves independently of any project, to apply across projects. Held as a single local file the user owns and controls, it is imported from into projects. The schema is the authoritative definition of a valid library file.*

---

#### F-PER-003 Schema version

`event driven` `stable`

When the software writes a project or library file, the software shall record the current schema version.

> *The version identifies which data model the file conforms to. Without it, the structure of a file can only be guessed at, and the software cannot know whether it is reading something it understands. Files are always written in the current version, so a model is migrated forward once rather than carried indefinitely.*

---

#### F-PER-004 Version migration

`event driven` `stable`

When the software opens a project or library file written by an earlier schema version, the software shall migrate it to the current schema version.

> *A project holds conformity documentation that may be needed for as long as the product is on the market. A change to the data model cannot leave the user unable to open their own work.*

---

#### F-PER-005 Unsupported version

`unwanted behaviour` `stable`

If a project or library file records a schema version later than the software supports, then the software shall not open it, and shall state that the file was written by a newer version.

> *A later version may hold data the software cannot represent. Opening the file would discard what it does not recognise, and saving would make that loss permanent. Refusing is the only response that does not risk the user's work.*

---

#### F-PER-006 Invalid file

`unwanted behaviour` `stable`

If a project or library file is not valid against the schema of the version it records, then the software shall not open it, and shall state that the file is invalid.

> *A file is valid when it conforms to the schema of its recorded version and satisfies the constraints the schema cannot express, which are unique identifiers, resolving references, and no cycles in ownership or filing. Validity is judged against the file's own version, not the current one, so an older file is not invalid merely for being older. It is validated as its producer wrote it, then migrated (F-PER-004). A file that fails cannot be trusted to mean what it appears to mean, since opening it would load a structure the software cannot reason about, and saving would overwrite the original with a guess. Refusing, and saying why, leaves the user's file intact for inspection or recovery. On opening, the checks run in order. A version newer than supported is refused (F-PER-005), a file invalid against its recorded schema is refused (F-PER-006), and an older version is migrated (F-PER-004).*

---

#### F-PER-007 Migration preservation

`event driven` `stable`

When the software migrates a file, the software shall carry all content of the source file into the migrated file, preserved as written.

> *Migration changes form, never meaning. Content that has no place in the current schema is preserved as legacy rather than dropped, and is never split across or mapped into attributes that would give it a meaning its author did not state. Re-judging preserved content is the user's work, and the migration notice (F-PER-009) makes it visible. Within a known version, unrecognised structure cannot occur, because strict validation (F-PER-006) and the version increment rule (F-PER-008) guarantee that anything the software does not know announces itself as newer. Attribute content within a version is covered by F-PER-010.*

---

#### F-PER-008 Version increment

`ubiquitous` `stable`

The schema version shall be incremented with any change to the structure of the files the software writes.

> *Under strict validation, older software refuses any structure it does not know. Incrementing on every structural change makes it refuse such files as newer (F-PER-005) rather than misreporting them as invalid (F-PER-006). The version is a statement about the file's producer, not only about compatibility. Increments are free, and a wrong error message is not. Attribute content is validated loosely within a version (F-PER-010), so its definitions iterate without an increment, and the version speaks for structure alone.*

---

#### F-PER-009 Migration notice

`event driven` `stable`

When opening a file requires a migration that preserves content as legacy or leaves content unplaced, the software shall state what was preserved and what needs the user's attention.

> *Mechanical migrations change form and pass silently. A migration that retires a method or cannot relocate content mechanically changes what the file means to its reader, and stating it makes the change a known fact rather than a discovery. Content is never converted into new meaning. It is preserved as written, and re-judging it is the user's work.*

---

#### F-PER-010 Attribute preservation

`ubiquitous` `stable`

The software shall preserve attribute content it does not present, unchanged, when a file is opened and saved.

> *Attributes are validated loosely within a schema version, and their definitions iterate without a version change. A key written under one revision of the definitions may not be presented by another, and preserving it keeps the user's content intact until a definition presents it again or a migration places it. Unpresented content is carried, never dropped.*

---

#### F-PER-011 Project templates

`event driven` `draft`

When the user chooses a project template, the software shall fetch it from the host, sending no user data, and shall open it as it opens a project file, subject to the same checks.

> *A template is a project file the maintainer wrote and published beside the software, so fetching it is what fetching the software already is, a request to the host carrying nothing of the user's, and it needs no consent. It can be as stale or as malformed as any other file, so it passes the same gate of version, validity and migration, and can never bypass what a file cannot. The list of templates is fetched the same way, when the user opens the choice.*

### 4.7 Drawings

---

#### F-DRW-001 Drawing check

`ubiquitous` `draft`

The software shall accept as a drawing only an SVG document within the drawing size limit that holds no script element, no event-handler attribute, no element that embeds a document, no link to code, and no reference that would load a resource from outside the document, and shall state why when it refuses one.

> *A drawing comes back from the drawing editor, or is already in a project file, and either way it is the first attribute whose content is not typed text. Refusing rather than repairing keeps a drawing exactly what its author made, and a diagram never legitimately holds any of the five, which are what would let markup act rather than draw. A link to a page is not among them, since an image follows no link. The same check guards a drawing in a file before it is shown (N-SEC-003). The drawing size limit is set so that a project holding dozens of drawings stays within the few megabytes a browser keeps for an origin, where the model is persisted on every change (F-SES-002). The software also refuses a drawing that declares entities or measures more than 16,384 units a side, the first because entities can expand without bound, the second because a browser cannot rasterise it.*

---

#### F-DRW-002 Drawing storage

`ubiquitous` `draft`

The software shall store a drawing as the drawing editor returned it, unchanged.

> *The drawing editor returns the SVG with its own model inside. Stored unchanged, the drawing opens in the editor again with nothing lost, which is what makes it a drawing rather than a picture. The browser's own save of the image gives the same file to anyone who wants it outside the software.*

---

#### F-DRW-003 External drawing editor

`complex` `draft`

Where the user has consented, when the user creates or edits a drawing, the software shall open the drawing editor at the origin the software designates, handing it the drawing being edited and nothing else, and shall take back what the editor returns as the drawing provided it passes the drawing check and carries the editor's own model.

> *This is the function that fetches and hands data over, so it is the one that states what and where. It hands the drawing being edited, nothing else, to one designated origin, draw.io's embed at the time of writing, in a frame that permits scripts and the editor's own origin and nothing else. Viewing a drawing never loads the editor. Only a creation or an edit the user asks for does, and only after consent (N-PRV-005). The editor is the only way a drawing enters. Nothing is imported from a file, so every drawing in a project is one the editor made and can open again, and what comes back is a drawing from outside, checked as one (F-DRW-001) and kept as returned (F-DRW-002). One returned without its model is refused, since it could not be edited again. A drawing refused on return is refused with the editor still open and the reason stated, so the user can amend it rather than lose it. What is taken back enters the entity's unsaved edit like any changed attribute. The entity's save commits it, cancel discards it, and the edit guard (F-MOD-004) protects it. The editor's own apply is not a save.*

---

## 5. Non-functional

### 5.1 Operation

---

#### N-OPS-001 No user account

`ubiquitous` `stable`

The software shall not require an account or a sign-in.

> *The software stores nothing remotely and identifies no one, so there is nothing to sign in to. The user opens it and works.*

---

#### N-OPS-002 Self-contained

`ubiquitous` `stable`

The software shall load all of its resources on initial load, and shall fetch nothing further during use, except for a function the user invokes that states what it fetches and from where.

> *Once loaded, the software runs from what the browser already holds, so work continues uninterrupted if the connection drops. A function that fetches is the exception, never the rule. It fetches only when the user invokes it, it says what it fetches and from where, and it fails plainly when the fetch fails (N-OPS-003). Which functions fetch, and what each may fetch, is stated with the function (F-DRW-003, F-PER-011).*

---

#### N-OPS-003 Fetch failure

`unwanted behaviour` `draft`

If a fetch a function makes does not succeed within its period, then the software shall state that the function is unavailable and shall leave the model unchanged.

> *Offline, blocked, or the resource gone, the software says so and the user loses nothing. An editor that never signals readiness is handed no drawing, and a template that never arrives replaces no project.*

### 5.2 Privacy

---

#### N-PRV-001 Local processing

`ubiquitous` `stable`

The software shall perform all processing on the user's device.

> *All computation happens in the browser, on the user's own device. Nothing is sent away to be processed, so the software needs no server and the data being worked on stays where it already is.*

---

#### N-PRV-002 No data transmission

`ubiquitous` `stable`

The software shall not transmit user data to any external service, except what the user consents to hand to a named service for a function they invoke.

> *The confidential data a user enters, their model and its content, stays on their device and is never sent anywhere. Fetching the software itself is an ordinary web request to the host, and the user's data is not part of it. The exception is the user's own act, with the service and the data named before it and bounded to what the function states (N-PRV-005 to N-PRV-007).*

---

#### N-PRV-003 No user tracking

`ubiquitous` `stable`

The software shall not track, profile, or collect analytics on the user.

> *The software records nothing about who uses it or how. This is a property of the software itself, separate from the ordinary request logs any web host keeps when serving a page.*

---

#### N-PRV-004 On-device storage

`ubiquitous` `stable`

The software shall store all user data on the user's own device.

> *The user's data lives only on their own device, whether held in the browser between sessions or saved as a file. It is never stored remotely, in an account, or on a server.*

---

#### N-PRV-005 Consent to hand over data

`event driven` `draft`

When the user invokes a function that hands data to an external service, the software shall obtain the user's consent first, stating the service's origin and the data handed over, unless the user has chosen during the browser session not to be asked again.

> *The choice is the user's to make, with the facts in front of them, which origin and what it receives. Asking on every invocation keeps the choice deliberate, and the session box lets a user who invokes the function all afternoon make it once, with the text in front of them. The statement is kept to the two facts so it is read rather than dismissed, and the control that invokes the function names the service, so the consent confirms what the user already saw.*

---

#### N-PRV-006 Consent scope

`ubiquitous` `draft`

The software shall keep a user's choice not to be asked again in session storage only, never in a project or library file, and shall offer a way to withdraw it.

> *Consent belongs to a person at a browser for a sitting, not to a project. A file that carried it would enable the function on every device it reached, and a choice that outlived the tab would be one the user could not remember making.*

---

#### N-PRV-007 Data minimisation

`state driven` `draft`

While an external service is in use, the software shall hand it the data the function states and nothing else.

> *The project, the other attributes and the device's storage stay out of reach even if the service is not what it claims to be.*

### 5.3 Security

---

#### N-SEC-001 Safe parsing

`ubiquitous` `stable`

The software shall not execute code contained in imported data.

> *A project file comes from wherever the user obtained it and cannot be assumed safe. It is parsed as data, never evaluated as code, so a crafted file cannot cause the software to run instructions on the user's device.*

---

#### N-SEC-002 Safe rendering

`ubiquitous` `stable`

The software shall render user-provided content as text, not as markup, drawings excepted.

> *Names, values, and descriptions a user enters are shown throughout the interface. They are rendered as text, never interpreted as markup, so content such as a tag or script in an entity name cannot alter or execute within the interface. A drawing is markup by nature and is shown as an image (N-SEC-003), which grants it the same, no script, no document, and no network.*

---

#### N-SEC-003 Drawing rendering

`optional feature` `draft`

Where an attribute holds a drawing, the software shall render it as an image that can neither execute code nor load a resource.

> *A drawing is markup by nature, so the text rule cannot apply to it. Shown as an image, the browser grants it no script, no document and no network, the same guarantee text has. A drawing that fails the drawing check (F-DRW-001) is not shown and is preserved unchanged. The reason stands where the drawing would, so a user opening someone else's file learns why the drawing is absent rather than meeting a blank.*

---

#### N-SEC-004 External application isolation

`optional feature` `draft`

Where the software hosts an external application in its page, it shall host it in a sandboxed frame on an origin other than its own, permitting only what the application's protocol requires, and shall accept messages only from that frame and origin, as data.

> *The frame cannot reach the software's storage, and cannot navigate the page, open windows or submit forms unless its protocol needs one of these. Each permission granted is recorded with the function that grants it. The origin rule is what makes the sandbox hold, since on the software's own origin the same permissions would let the application read the project. Scripts and the application's own origin are the expected minimum, and what draw.io's embed needs at the time of writing.*

### 5.4 Accessibility

---

#### N-ACC-001 Standard conformance

`ubiquitous` `stable`

The software shall meet WCAG 2.2 Level AA [4].

> *AA is the accessibility baseline for professional software. It is also what keeps the interface sound while minimal. A single accent on a monochrome ground works because it clears the contrast requirements, not because it is decorated.*

---

#### N-ACC-002 Colour independence

`ubiquitous` `stable`

The software shall distinguish entity types by shape, not by colour alone.

> *Roughly one in twelve men has a red-green colour vision deficiency. A shape is legible under every colour vision, and a hue is not. Colour is at most a speed aid, never the sole carrier of meaning.*

---

#### N-ACC-003 Keyboard operability

`ubiquitous` `stable`

The software shall be fully operable by keyboard.

> *A modelling software is navigated constantly, through the tree, the entities, and their attributes. Full keyboard operability serves both accessibility and speed. It is required for users who cannot use a pointer, and it is faster for those building a large model.*

### 5.5 Compatibility

---

#### N-CMP-001 Desktop viewport

`ubiquitous` `stable`

The software shall be operable on desktop-sized viewports.

> *The software presents a multi-pane interface that requires the screen space of a desktop-sized viewport. The exact minimum is set during implementation, once the layout's real constraints are known. Behaviour on smaller viewports is specified in the functional requirements.*

---

#### N-CMP-002 Browser support

`ubiquitous` `stable`

The software shall be compatible with evergreen major web browsers.

> *Major web browsers, such as Chrome, Edge, Firefox, and Safari, update themselves to the current version. The software targets these current versions and does not support legacy or end-of-life browsers.*

## 6. References

| No. | Reference | Link |
|---|---|---|
| [1] | INCOSE Guide to Writing Requirements V4 – Summary Sheet | https://www.incose.org/wp-content/uploads/legacy/working-groups/requirements-wg/guidetowritingrequirements/incose_rwg_gtwr_v4_summary_sheet.pdf |
| [2] | Easy Approach to Requirements Syntax (EARS) | https://alistairmavin.com/ears/ |
| [3] | SEBoK System Requirements Definition | https://sebokwiki.org/wiki/System_Requirements_Definition |
| [4] | Web Content Accessibility Guidelines (WCAG) 2.2 | https://www.w3.org/TR/WCAG22/ |
