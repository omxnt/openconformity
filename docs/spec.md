# Specification

## Table of Contents

- [1. Introduction](#1-introduction)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Scope](#12-scope)
- [2. Conventions](#2-conventions)
  - [2.1 Characteristics](#21-characteristics)
  - [2.2 Syntax](#22-syntax)
  - [2.3 Rationale](#23-rationale)
  - [2.4 Identifier](#24-identifier)
  - [2.5 Template](#25-template)
- [3. Requirements](#3-requirements)
  - [3.1 Constraints](#31-constraints)
    - [3.1.1 Project](#311-project)
    - [3.1.2 Development](#312-development)
    - [3.1.3 Technical](#313-technical)
  - [3.2 Graphical](#32-graphical)
    - [3.2.1 System](#321-system)
    - [3.2.2 Marks](#322-marks)
  - [3.3 Functional](#33-functional)
  - [3.4 Non-functional](#34-non-functional)
    - [3.4.1 Operation](#341-operation)
    - [3.4.2 Accessibility](#342-accessibility)
    - [3.4.3 Privacy](#343-privacy)
- [4. References](#4-references)

## 1. Introduction

### 1.1 Purpose

The purpose of this document is to specify what openconformity shall be and what it shall do. This document is the single source of truth for the software requirements, and the basis against which openconformity is implemented and verified.

### 1.2 Scope

This specification covers the software requirements for openconformity. The requirements are organised in four classes: the constraints openconformity operates within (constraints), its graphical profile (graphical), its functional behaviour (functional), and its non-functional qualities (non-functional). Each software requirement has a sequential number and is stated together with its rationale.

This specification does not cover the conceptual idea behind openconformity, the reasoning for its existence, or the domain knowledge it builds on. These are described elsewhere in the project documentation.

## 2. Conventions

### 2.1 Characteristics

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

### 2.2 Syntax

Each requirement shall be written using the EARS syntax [2].

| Type | Description | Syntax | Example |
|---|---|---|---|
| Generic | The clauses of a requirement written in EARS always appear in the same order. The EARS ruleset states that a requirement must have: Zero or many preconditions; Zero or one trigger; One system name; One or many system responses. The application of the EARS notation produces requirements in a small number of patterns, depending on the clauses that are used. | `While <optional pre-condition>, when <optional trigger>, the <system name> shall <system response>` | N/A |
| Ubiquitous | Ubiquitous requirements are always active (so there is no EARS keyword) | `The <system name> shall <system response>`| The mobile phone shall have a mass of less than XX grams. |
| State driven | State driven requirements are active as long as the specified state remains true and are denoted by the keyword While. | `While <precondition(s)>, the <system name> shall <system response>` | While there is no card in the ATM, the ATM shall display “insert card to begin”. |
| Event driven | Event driven requirements specify how a system must respond when a triggering event occurs and are denoted by the keyword When. | `When <trigger>, the <system name> shall <system response>`| When “mute” is selected, the laptop shall suppress all audio output. |
| Optional feature | Optional feature requirements apply in products or systems that include the specified feature and are denoted by the keyword Where. | `Where <feature is included>, the <system name> shall <system response>` | Where the car has a sunroof, the car shall have a sunroof control panel on the driver door. |
| Unwanted behaviour | Unwanted behaviour requirements are used to specify the required system response to undesired situations and are denoted by the keywords If and Then. | `If <trigger>, then the <system name> shall <system response>` | If an invalid credit card number is entered, then the website shall display “please re-enter credit card details”. |
| Complex | The simple building blocks of the EARS patterns described above can be combined to specify requirements for richer system behaviour. Requirements that include more than one EARS keyword are called Complex requirements. Complex requirements for unwanted behaviour also include the If-Then keywords. | `While <precondition(s)>, When <trigger>, the <system name> shall <system response>` | While the aircraft is on ground, when reverse thrust is commanded, the engine control system shall enable reverse thrust. |

### 2.3 Rationale

Each requirement shall have a rationale, see the SEBoK guidelines [3].

> "The use of the rationale attribute helps communicate why the requirement is needed, any assumptions made, the source of numbers, the results of related design studies, or any other related supporting information. This supports further requirements analysis and decomposition, as well as identifying the source of any requirement value."

### 2.4 Identifier

Each requirement shall have a unique identifier of the form `CLASS-GROUP-NNN`. Identifiers are append-only. A requirement that is removed is not reissued under the same identifier.

| Field | Meaning |
|---|---|
| `CLASS` | The requirement class. |
| `GROUP` | The group within the requirement class. |
| `NNN` | The sequential number within the group. |

### 2.5 Template

Each requirement shall be written using the template below.

---

#### CLASS-GROUP-NNN Requirement title

Requirement text.

> *Requirement rationale.*

## 3. Requirements

### 3.1 Constraints

#### 3.1.1 Project

---

##### C-PRJ-001 Name

The software shall be named "openconformity".

> *Short for "open-source conformity assessment", meaning free and open-source software for the process by which a product is shown to meet European product legislation.*

---

##### C-PRJ-002 Domain

The software shall be served at [openconformity.org](https://openconformity.org).

> *The domain is the name. The .org top-level domain signals a non-commercial, public-interest project rather than a commercial product.*

---

##### C-PRJ-003 Licence

The software shall be licensed under the EUPL-1.2.

> *A copyleft licence that keeps derivatives open, covers documents and diagrams as well as code, and holds up under EU law.*

---

##### C-PRJ-004 Funding

The project shall not be supplied in the course of a commercial activity.

> *Supplied outside any commercial activity, the project stays outside the scope of the Product Liability Directive and the Cyber Resilience Act, which apply to software placed on the market in the course of a commercial activity. Such activity covers, among other things, advertising, paid features, and sponsorship.*

---

##### C-PRJ-005 Content

The software shall not reproduce content from harmonized standards beyond what is published in the Official Journal of the European Union.

> *Standards are sold by national standardization bodies. The tool is built only on public information: legislation, guidance, and the harmonized standards lists published in the OJEU. Those lists include standard references and titles, which the tool may therefore use; clause text, tables, figures, and Annex ZA mappings are not published there and are not reproduced.*

#### 3.1.2 Development

---

##### C-DEV-001 Repository

The source shall be maintained in a public GitHub repository.

> *GitHub is a common platform. Public development keeps the source open and the history inspectable, consistent with the licence.*

---

##### C-DEV-002 Hosting

The software shall be hosted on Cloudflare Pages.

> *Cloudflare Pages serves the static files directly from the GitHub repository at no cost, with global distribution and nothing to maintain.*

---

##### C-DEV-003 Diagrams

The diagrams shall be maintained in draw.io.

> *draw.io is free, stores its source as open XML, and requires no account. The source lives in the repository as a .drawio file and exports to SVG for the site.*

---

##### C-DEV-004 Marks

The marks shall be maintained in Figma.

> *Figma is a common design tool with a free tier. The source lives in the repository as a .fig file and exports to SVG, PNG, or JPEG for the site.*

#### 3.1.3 Technical

---

##### C-TEC-001 Stack

The software shall be built with HTML, CSS, and JavaScript only.

> *Native browser languages, understood directly by every modern browser with no transpilation.*

---

##### C-TEC-002 Dependencies

The software shall not include third-party code (frameworks or libraries).

> *No third-party libraries or frameworks means no supply chain to secure and no dependency to rot, which a solo maintainer can neither audit nor keep current. Third-party assets, such as the IBM Plex typefaces, are permitted when self-hosted and open-licensed.*

---

##### C-TEC-003 Build

The software shall run directly from its source files, with no build step or package manager.

> *The files in the repository are the files the browser runs. Nothing is compiled, bundled, or installed, so the deployed tool is exactly the source, and anyone can serve it by copying the folder.*

---

##### C-TEC-004 Modules

The software shall organise its JavaScript as native ES modules.

> *ES modules give modular structure, with explicit imports and exports, without a bundler. This is what makes the no-build stack workable at scale: the alternatives, a single large file or global scripts, do not scale for a maintainer.*

### 3.2 Graphical

#### 3.2.1 System

---

##### G-SYS-001 Language typeface

The software shall render prose text in IBM Plex Sans.

> *A humanist sans keeps prose legible at interface sizes. It is open-licensed and can be self-hosted.*

---

##### G-SYS-002 Data typeface

The software shall render identifiers and data values in IBM Plex Mono.

> *A monospace face marks machine-referenceable content, such as identifiers, clauses, and values, as distinct from prose at a glance.*

---

##### G-SYS-003 Accent colour

The software shall use `#00618E` as its single accent colour.

> *A single accent marks the interactive layer and keeps the interface minimal. This blue is neutral and holds a comfortable contrast margin as text on a light canvas and as a boundary on any surface, so it works throughout the tool and carries to the wider identity.*

#### 3.2.2 Marks

---

##### G-MRK-001 Wordmark

The wordmark shall be "openconformity" in the language typeface.

> *The name is the identity. A wordmark renders identically in a title bar, a document, and plain text, with no separate logo to design or maintain.*

---

##### G-MRK-002 Favicon

The favicon shall be a square filled with the accent colour.

> *A favicon is too small to render the wordmark legibly. A filled accent square is unmistakable at 16 pixels and reduces the identity to its simplest form: the name and one colour.*

### 3.3 Functional

*Not started yet.*

### 3.4 Non-functional

#### 3.4.1 Operation

---

##### N-OPS-001 Browser-based

The software shall run in a standard web browser, with no installation required.

> *The user reaches the tool by opening a URL. There is nothing to install, update, or maintain on their machine, and any current browser can run it.*

---

##### N-OPS-002 No account

The software shall not require an account or a sign-in.

> *The tool stores nothing remotely and identifies no one, so there is nothing to sign in to. The user opens it and works.*

---

##### N-OPS-003 Self-contained

The software shall load all of its resources on initial load, and shall fetch nothing further during use.

> *Once loaded, the tool runs from what the browser already holds, so work continues uninterrupted if the connection drops.*

#### 3.4.2 Accessibility

---

##### N-ACC-001 Standard conformance

The software shall meet WCAG 2.2 Level AA [4].

> *AA is the accessibility baseline for professional software. It is also what keeps the interface sound while minimal: a single accent on a monochrome ground works because it clears the contrast requirements, not because it is decorated.*

---

##### N-ACC-002 Colour independence

The software shall distinguish entity types by shape, not by colour alone.

> *Roughly one in twelve men has a red-green colour vision deficiency. A shape is legible under every colour vision; a hue is not. Colour is at most a speed aid, never the sole carrier of meaning.*

---

##### N-ACC-003 Keyboard operability

The software shall be fully operable by keyboard.

> *A modeling tool is navigated constantly, through the tree, the entities, and their attributes. Full keyboard operability serves both accessibility and speed: it is required for users who cannot use a pointer, and it is faster for those building a large model.*

#### 3.4.3 Privacy

---

##### N-PRV-001 Local processing

The software shall perform all processing on the user's device.

> *All computation happens in the browser, on the user's own device. Nothing is sent away to be processed, so the tool needs no server and the data being worked on stays where it already is.*

---

##### N-PRV-002 No data transmission

The software shall not transmit user data to any external service.

> *The confidential data a user enters, their model and its content, stays on their device and is never sent anywhere. Fetching the tool itself is an ordinary web request to the host; the user's data is not part of it.*

---

##### N-PRV-003 No tracking

The software shall not track, profile, or collect analytics on the user.

> *The software records nothing about who uses it or how. This is a property of the tool itself, separate from the ordinary request logs any web host keeps when serving a page.*

---

##### N-PRV-004 Local storage

The software shall store all project data on the user's own device.

> *The user's data lives only on their own device, whether held in the browser between sessions or saved as a file. It is never stored remotely, in an account, or on a server.*

## 4. References

| No. | Reference | Link |
|---|---|---|
| [1] | INCOSE Guide to Writing Requirements V4 – Summary Sheet | https://www.incose.org/wp-content/uploads/legacy/working-groups/requirements-wg/guidetowritingrequirements/incose_rwg_gtwr_v4_summary_sheet.pdf |
| [2] | Easy Approach to Requirements Syntax (EARS) | https://alistairmavin.com/ears/ |
| [3] | SEBoK System Requirements Definition | https://sebokwiki.org/wiki/System_Requirements_Definition |
| [4] | Web Content Accessibility Guidelines (WCAG) 2.2 | https://www.w3.org/TR/WCAG22/ |