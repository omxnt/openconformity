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
  - [3.2 Graphical](#32-graphical)
    - [3.2.1 System](#321-system)
    - [3.2.2 Marks](#322-marks)
  - [3.3 Functional](#33-functional)
  - [3.4 Non-functional](#34-non-functional)
- [4. References](#4-references)

## 1. Introduction

### 1.1 Purpose

The purpose of this document is to specify what openconformity shall be and what it shall do. This document is the single source of truth for the tool's requirements, and the basis against which the tool is implemented and verified.

### 1.2 Scope

This specification covers the openconformity tool. The requirements specify what the tool shall look like (graphical), what it shall do (functional), and what qualities it shall hold (non-functional). Each requirement is stated together with its rationale.

This specification does not cover the conceptual idea behind the tool, the reasoning for its existence, or the domain knowledge it builds on. These are described elsewhere in the project's documentation.

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

The software shall be non-commercial and not carry advertising, paid features, or sponsorship.

> *Kept non-commercial, the project stays outside the commercial-activity scope of the Product Liability Directive and the Cyber Resilience Act, which apply to software placed on the market as a commercial activity.*

#### 3.1.2 Development

---

##### C-DEV-001 Repository

The software shall be developed in a public GitHub repository.

> *GitHub is a common platform. Public development keeps the source open and the history inspectable, consistent with the licence.*

---

##### C-DEV-002 Hosting

The software shall be hosted on Cloudflare Pages.

> *Cloudflare Pages serves the static files directly from the GitHub repository at no cost, with global distribution and nothing to maintain.*

---

##### C-DEV-003 Diagrams

The software's technical diagrams shall be drawn in draw.io.

> *draw.io is free, stores diagrams as open XML, and requires no account. The source file lives in the repository and exports to SVG for the site.*

---

##### C-DEV-004 Design

The software's visual assets shall be designed in Figma.

> *Figma is a common design tool with a free tier. The source file lives in the repository as a .fig export. Assets are exported as SVG, PNG, or JPEG.*

### 3.2 Graphical

#### 3.2.1 System

---

##### G-SYS-001 Language typeface

The software shall set language in IBM Plex Sans.

> *A humanist sans keeps prose legible at interface sizes. It is open-licensed and can be self-hosted.*

---

##### G-SYS-002 Data typeface

The software shall set identifiers and data in IBM Plex Mono.

> *A monospace face marks machine-referenceable content — identifiers, clauses, values — as distinct from prose at a glance. It is open-licensed and can be self-hosted.*

---

##### G-SYS-003 Accent colour

The software shall use `#00618E` as its single accent colour.

> *A single accent marks the interactive layer and keeps the interface minimal. This blue is neutral and holds a comfortable contrast margin as text on a light canvas and as a boundary on any surface, so it works throughout the tool and carries to the wider identity.*

#### 3.2.2 Marks

---

##### G-MRK-001 Wordmark

The software's identity shall be the wordmark "openconformity", set in the language typeface.

> *The name is the identity. A wordmark renders identically in a title bar, a document, and plain text, with no separate logo to design or maintain.*

---

##### G-MRK-002 Favicon

The software's favicon shall be a square filled with the accent colour.

> *A favicon is too small to render the wordmark legibly. A filled accent square is unmistakable at 16 pixels and reduces the identity to its simplest form: the name and one colour.*

### 3.3 Functional

*Not started yet.*

### 3.4 Non-functional

*Not started yet.*

## 4. References

| No. | Reference | Link |
|---|---|---|
| [1] | INCOSE Guide to Writing Requirements V4 – Summary Sheet | https://www.incose.org/wp-content/uploads/legacy/working-groups/requirements-wg/guidetowritingrequirements/incose_rwg_gtwr_v4_summary_sheet.pdf |
| [2] | Easy Approach to Requirements Syntax (EARS) | https://alistairmavin.com/ears/ |
| [3] | SEBoK System Requirements Definition | https://sebokwiki.org/wiki/System_Requirements_Definition |