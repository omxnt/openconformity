# Requirements

This document specifies the requirements the software is implemented and verified against. The conventions define how a requirement is written and identified, and the four classes that follow state the constraints, the graphical profile, the functional behaviour, and the non-functional qualities. Each requirement carries an identifier, a rationale, and a status.

## 1. Conventions

### 1.1 Characteristics

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

### 1.2 Syntax

Each requirement shall be written using the EARS syntax [2], and be tagged with the type of pattern which was used.

| Type | Description | Syntax | Example |
|---|---|---|---|
| Generic | The clauses of a requirement written in EARS always appear in the same order. The EARS ruleset states that a requirement must have: Zero or many preconditions; Zero or one trigger; One system name; One or many system responses. The application of the EARS notation produces requirements in a small number of patterns, depending on the clauses that are used. | `While <optional pre-condition>, when <optional trigger>, the <system name> shall <system response>` | N/A |
| Ubiquitous | Ubiquitous requirements are always active (so there is no EARS keyword) | `The <system name> shall <system response>`| The mobile phone shall have a mass of less than XX grams. |
| State driven | State driven requirements are active as long as the specified state remains true and are denoted by the keyword While. | `While <precondition(s)>, the <system name> shall <system response>` | While there is no card in the ATM, the ATM shall display “insert card to begin”. |
| Event driven | Event driven requirements specify how a system must respond when a triggering event occurs and are denoted by the keyword When. | `When <trigger>, the <system name> shall <system response>`| When “mute” is selected, the laptop shall suppress all audio output. |
| Optional feature | Optional feature requirements apply in products or systems that include the specified feature and are denoted by the keyword Where. | `Where <feature is included>, the <system name> shall <system response>` | Where the car has a sunroof, the car shall have a sunroof control panel on the driver door. |
| Unwanted behaviour | Unwanted behaviour requirements are used to specify the required system response to undesired situations and are denoted by the keywords If and Then. | `If <trigger>, then the <system name> shall <system response>` | If an invalid credit card number is entered, then the website shall display “please re-enter credit card details”. |
| Complex | The simple building blocks of the EARS patterns described above can be combined to specify requirements for richer system behaviour. Requirements that include more than one EARS keyword are called Complex requirements. Complex requirements for unwanted behaviour also include the If-Then keywords. | `While <precondition(s)>, When <trigger>, the <system name> shall <system response>` | While the aircraft is on ground, when reverse thrust is commanded, the engine control system shall enable reverse thrust. |

### 1.3 Rationale

Each requirement shall have a rationale, see the SEBoK guidelines [3].

> "The use of the rationale attribute helps communicate why the requirement is needed, any assumptions made, the source of numbers, the results of related design studies, or any other related supporting information. This supports further requirements analysis and decomposition, as well as identifying the source of any requirement value."

### 1.4 Identifier

Each requirement shall have a unique identifier of the form `CLASS-GROUP-NNN`. Once the document is issued, identifiers are append-only: a requirement that is removed is not reissued under the same identifier. While the document is in draft, identifiers may be reorganised.

| Field | Meaning |
|---|---|
| `CLASS` | The requirement class. |
| `GROUP` | The group within the requirement class. |
| `NNN` | The sequential number within the group. |

### 1.5 Status

Each requirement shall carry a status tag.

| Tag | Meaning |
|---|---|
| `draft` | Newly written, or still being worked on. |
| `stable` | Settled as written, and not expected to change. |

### 1.6 Template

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

> *Mermaid is a text format: the diagram in the document is its own source, renders wherever the document is read, and cannot drift from an exported image. Being text, it constrains no tool; any editor serves, and the repository diff shows every change to the model.*

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

> *ES modules give modular structure, with explicit imports and exports, without a bundler. This is what makes the no-build stack workable at scale: the alternatives, a single large file or global scripts, do not scale for a maintainer.*

---

#### C-TEC-005 Third-party assets

`optional feature` `stable`

Where the software uses third-party assets, they shall be self-hosted and open-licensed.

> *Assets such as typefaces or icons carry no executable code, so they pose no supply-chain risk and are allowed where third-party code is not. Self-hosting keeps the software self-contained and avoids requests to third-party servers; open licensing keeps redistribution compatible with the EUPL.*

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

> *The layout separates the concerns of the work: navigating the model, editing the selected entity, and working with its relationships. Each pane acts on what the navigator has selected, so the tree stays visible at full height while the editor and relationships share the column beside it.*

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

> *Work survives closing the software without a save, as a drawing survives closing draw.io. Browser storage is retained at the browser's and the user's discretion, and is cleared with site data; the saved project file remains the durable record. Persisting on change, rather than on close, means a crash loses nothing either.*

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

> *The tree is the user's filing of the model, not its structure. The metamodel governs which entities exist and how they may relate; where they are placed is organisation, and two users may file the same model differently, one by machine structure and one by legislation. Any placement rule derived from the metamodel would forbid one of them.*

---

#### F-WSP-005 Neutral filing

`ubiquitous` `stable`

The software shall not create, modify, or require relationships based on an entity's position in the tree.

> *Relationships are engineering judgments, made deliberately in the relationship pane. Inferring them from placement would manufacture judgments nobody made, and requiring them for placement would turn filing into modelling. Placement carries no meaning; the relationships carry all of it.*

---

#### F-WSP-006 Folder creation

`ubiquitous` `stable`

The software shall permit the creation of folders at any position in the navigator tree.

> *Folders are filing, not model content: they hold entities and other folders, carry a name and nothing else, and appear in no view or export. They give a user structure the metamodel does not impose, a zone, a workstream, a supplier, without adding anything to the model. Deleting a folder removes filing, never the entities filed in it.*

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

#### F-MOD-003 Edit confirmation

`ubiquitous` `stable`

The software shall not apply changes to an entity's attributes until the user confirms them.

> *An entity is read far more often than it is edited. Requiring confirmation means the model cannot be changed by a stray keystroke while reading.*

---

#### F-MOD-004 Entity deletion

`event driven` `stable`

When an entity is deleted, the software shall remove the relationships it takes part in.

> *A relationship cannot exist without both of its entities. Leaving one behind would produce a connection to nothing.*

---

#### F-MOD-005 Composition deletion

`event driven` `stable`

When an entity that owns entities through composition is deleted, the software shall delete the owned entities.

> *Composition is ownership: an owned entity is part of its owner, as an essential requirement is part of its legislation, and a part does not outlive its whole. Deleting the owner and keeping the parts would leave content whose source is gone. Relationships of other kinds do not cascade; deleting their entities severs only the relationship.*

---

#### F-MOD-006 Cascade confirmation

`event driven` `stable`

When a deletion would cascade to owned entities, the software shall require confirmation stating the entities that will be deleted.

> *A cascading deletion is the most destructive action in the software, and its full extent is not visible from the entity being deleted. Stating what will go, before it goes, makes the consequence a decision rather than a surprise.*

---

#### F-MOD-007 Undo action

`event driven` `stable`

When undo is invoked, the software shall revert the most recent model change.

> *A modelling session is a stream of small changes, and any of them can be a mistake. Undo makes every change recoverable, including a cascading deletion: the confirmation warns before the loss, undo forgives after it. A change is the same unit the software persists, a confirmed edit, a creation, or a deletion.*

---

#### F-MOD-008 Redo action

`event driven` `stable`

When redo is invoked, the software shall reapply the most recently undone model change.

> *Undo is exploratory: stepping back to look is only safe if stepping forward again is possible. Redo makes undo itself mistake-proof.*

### 4.5 Views

---

#### F-VIE-001 Model views

`ubiquitous` `draft`

The software shall generate exportable views of the model.

> *Views are the output of the modelling work: artefacts such as a hazard list or a requirement specification, generated from the model rather than authored beside it. Which views exist and what each contains is specified as the views are built; this requirement states the capability they decompose from.*

### 4.6 Persistence

---

#### F-PER-001 Project persistence

`ubiquitous` `stable`

The software shall persist a project as a single local file conforming to `schema/project.schema.json`.

> *A project is the user's model of one product's conformity: its entities and their relationships, following the metamodel. Saved as a single local file the user owns and controls, a project is portable, inspectable, and reloadable without any server or account. The schema is the authoritative definition of a valid project file.*

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

If a project or library file is not valid, then the software shall not open it, and shall state that the file is invalid.

> *A file is valid when it conforms to its schema and satisfies the constraints the schema cannot express: identifiers unique, references resolving, and no cycles in ownership or filing. A file that fails either cannot be trusted to mean what it appears to mean. Opening it would load a structure the software cannot reason about, and saving would overwrite the original with a guess. Refusing, and saying why, leaves the user's file intact for inspection or recovery.*

---

#### F-PER-007 Version increment

`ubiquitous` `stable`

The schema version shall be incremented whenever a change to the data model would make a file written by the previous version invalid.

> *Migration keys on the version. If the model changes without the version changing, two incompatible files claim the same version and the software cannot tell which it is reading. The condition is breaking change rather than any change, so an addition that older files satisfy needs no increment.*

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

The software shall load all of its resources on initial load, and shall fetch nothing further during use.

> *Once loaded, the software runs from what the browser already holds, so work continues uninterrupted if the connection drops.*

### 5.2 Privacy

---

#### N-PRV-001 Local processing

`ubiquitous` `stable`

The software shall perform all processing on the user's device.

> *All computation happens in the browser, on the user's own device. Nothing is sent away to be processed, so the software needs no server and the data being worked on stays where it already is.*

---

#### N-PRV-002 No data transmission

`ubiquitous` `stable`

The software shall not transmit user data to any external service.

> *The confidential data a user enters, their model and its content, stays on their device and is never sent anywhere. Fetching the software itself is an ordinary web request to the host; the user's data is not part of it.*

---

#### N-PRV-003 No user tracking

`ubiquitous` `stable`

The software shall not track, profile, or collect analytics on the user.

> *The software records nothing about who uses it or how. This is a property of the software itself, separate from the ordinary request logs any web host keeps when serving a page.*

---

#### N-PRV-004 On-device storage

`ubiquitous` `stable`

The software shall store all project data on the user's own device.

> *The user's data lives only on their own device, whether held in the browser between sessions or saved as a file. It is never stored remotely, in an account, or on a server.*

### 5.3 Security

---

#### N-SEC-001 Safe parsing

`ubiquitous` `stable`

The software shall not execute code contained in imported data.

> *A project file comes from wherever the user obtained it and cannot be assumed safe. It is parsed as data, never evaluated as code, so a crafted file cannot cause the software to run instructions on the user's device.*

---

#### N-SEC-002 Safe rendering

`ubiquitous` `stable`

The software shall render user-provided content as text, not as markup.

> *Names, values, and descriptions a user enters are shown throughout the interface. They are rendered as text, never interpreted as markup, so content such as a tag or script in an entity name cannot alter or execute within the interface.*

### 5.4 Accessibility

---

#### N-ACC-001 Standard conformance

`ubiquitous` `stable`

The software shall meet WCAG 2.2 Level AA [4].

> *AA is the accessibility baseline for professional software. It is also what keeps the interface sound while minimal: a single accent on a monochrome ground works because it clears the contrast requirements, not because it is decorated.*

---

#### N-ACC-002 Colour independence

`ubiquitous` `stable`

The software shall distinguish entity types by shape, not by colour alone.

> *Roughly one in twelve men has a red-green colour vision deficiency. A shape is legible under every colour vision; a hue is not. Colour is at most a speed aid, never the sole carrier of meaning.*

---

#### N-ACC-003 Keyboard operability

`ubiquitous` `stable`

The software shall be fully operable by keyboard.

> *A modelling software is navigated constantly, through the tree, the entities, and their attributes. Full keyboard operability serves both accessibility and speed: it is required for users who cannot use a pointer, and it is faster for those building a large model.*

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