# Design Document

## Table of Contents

- [1. Introduction](#1-introduction)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Scope](#12-scope)
  - [1.3 References](#13-references)
- [2. Background](#2-background)
  - [2.1 Existing Software Tools](#21-existing-software-tools)
  - [2.2 Model-based Approach](#22-model-based-approach)
  - [2.3 Problem Statement](#23-problem-statement)
- [3. Vision](#3-vision)
  - [3.1 Open Source](#31-open-source)
  - [3.2 Minimal Barriers](#32-minimal-barriers)
  - [3.3 Privacy by Design](#33-privacy-by-design)
  - [3.4 User-Owned Data](#34-user-owned-data)
  - [3.5 Meaningful Output](#35-meaningful-output)
  - [3.6 Avoid Conclusions](#36-avoid-conclusions)
  - [3.7 Engineering Work](#37-engineering-work)
- [4. Product Scope](#4-product-scope)
  - [4.1 In Scope](#41-in-scope)
  - [4.2 Out of Scope](#42-out-of-scope)
  - [4.3 Non-Goals](#43-non-goals)
- [5. Concept](#5-concept)
  - [5.1 Brief Description](#51-brief-description)
  - [5.2 Metamodel](#52-metamodel)
  - [5.3 The Model](#53-the-model)
  - [5.4 Working With the Model](#54-working-with-the-model)
  - [5.5 Views and Export](#55-views-and-export)
  - [5.6 Reuse](#56-reuse)
- [6. Implementation](#6-implementation)
- [7. Release Plan](#7-release-plan)
- [8. Licensing](#8-licensing)

## 1. Introduction

### 1.1 Purpose

The purpose of this document is to describe the design of openconformity: the background and reasoning behind the project, its vision, the scope of the product, the concept of the tool, and how it is implemented. It is a textual description of the product, and serves as the basis from which the product requirements are derived.

### 1.2 Scope

The scope of this document is the design of the product. Project workflow, development processes, and user documentation are not covered. The document is maintained continuously and reflects the current intent of the project.

### 1.3 References

| Document | Description |
|---|---|
| [Readme](../README.md) | Project overview |
| [License](../LICENSE) | EUPL-1.2 license text |
| [Decision log](decisions.md) | Design decisions and their alternatives |
| [Metamodel](meta.drawio) | Source diagram of the metamodel |
| [Specification](spec.md) | Derived from this document |
| [Graphical profile](brand.md) | Fonts, colors, logo, and favicon |

## 2. Background

### 2.1 Existing Software Tools

Today, multiple commercial tools are available that support activities related to CE marking under European product legislation. Many of these tools target CE marking of machinery under the Machinery Directive 2006/42/EC or the upcoming Machinery Regulation (EU) 2023/1230. These tools are priced and designed for corporate use, usually offered as either Software-as-a-Service (SaaS) or as licensed desktop applications.

The knowledge these tools are built on, such as directives, regulations, and guidance documents, is publicly available on the European Union's websites. Harmonized standards are the exception, since they are typically purchased through national standardization bodies, e.g. the Swedish Institute for Standards (SIS).

To the author's knowledge, no open-source alternative currently exists. One may reason that an open-source tool would be preferable, since the legislative knowledge is public, and the harmonized standards have already been paid for by the manufacturer. As CE marking is an obligation placed on the product manufacturer, a free, open-source tool supporting this work would benefit the industry as a whole.

### 2.2 Model-based Approach

Within the domain of Systems Engineering (SE), Model-based Systems Engineering (MBSE) is the practice of using a shared model, rather than a collection of separately maintained documents, as the primary artefact of the engineering work. The model consists of elements with attributes, connected by typed, semantic relationships. Documents are then generated as views of the model rather than authored and maintained by hand, so that the model serves as the single source of truth for the system's definition.

Compared to a document-centric approach, where the same information is repeated and manually kept in sync across multiple documents, a model-based approach captures each piece of information once and references it wherever it is needed. This enables traceability between elements, consistency across all generated views, and impact analysis when something changes.

### 2.3 Problem Statement

When studying the framework behind CE marking, it becomes apparent that this work has the same character as the problems MBSE tries to solve. Legislation defines essential requirements, which are triggered by the hazards the product exhibits. The essential requirements are usually met by applying harmonized standards, where the hazards are fed into the risk analysis. Multiple hazards can contribute to different accident scenarios, mitigated by a set of risk-reduction measures. A mature organization usually translates this into system requirements, which are later verified by verification activities.

Traditional document-centric CE marking implies that the same information is stated multiple times, from different points of view. The relationships within the CE marking work are inherently many-to-many, where a single risk-reduction measure may reduce the risk of several hazards, a single hazard may appear in several accident scenarios, and a harmonized standard may relate both to essential requirements and to the risk-reduction measures that implement its clauses. In a document-centric approach, each of these connections is repeated wherever it is relevant, for example, the same risk-reduction measure is written into the row of every hazard it mitigates. This means that each repetition must be maintained by hand.

In a model-based approach, every entity is stated once, and the connections are expressed as semantic relationships. Views can then be exported for any purpose, such as a hazard list, a requirement specification, or a verification plan. All of these artefacts are generated from the same model, always consistent with each other, with the traceability between legislation, standards, hazards, measures, requirements, and verifications preserved automatically.

## 3. Vision

The vision for the openconformity project is to provide a modeling environment for the engineering work related to CE marking of machinery in accordance with the Machinery Regulation (EU) 2023/1230. The vision rests on the following principles.

### 3.1 Open Source

The tool is free to use, and its source code is open. Anyone can inspect how the tool works, verify its claims, contribute to it, or adapt it to their own needs. There is no commercial interest behind the project.

### 3.2 Minimal Barriers

The tool runs entirely client-side, with no installation, no account, and no server required. The user opens the page and starts working.

### 3.3 Privacy by Design

There is no server contact, no tracking, no analytics, and no data collection of any kind. All processing happens in the user's browser, and user data never leaves it.

### 3.4 User-Owned Data

Projects are saved as local files, owned and controlled by the user. Data can be moved, backed up, or deleted at the user's sole discretion.

### 3.5 Meaningful Output

The tool generates raw engineering artefacts, such as applicable essential requirements, identified hazards, and requirements. These are exportable, intended as input to the engineering documents that the user assembles under their own quality system.

### 3.6 Avoid Conclusions

The tool never states any conclusion about the safety or conformity of the product, and does not generate reports. The responsibility for the CE marking remains with the manufacturer.

### 3.7 Engineering Work

The tool treats CE marking as engineering work, requiring competence, judgment, and knowledge of the applicable legislation and standards. It provides structure rather than shortcuts, with no checklists or wizards that promise conformity without understanding. The tool cannot replace competence, it only makes competent work traceable, consistent, and reusable.

## 4. Product Scope

### 4.1 In Scope

The scope of the tool is to support CE marking of machinery products under the European product legislation of the New Legislative Framework (NLF).

The primary scope of the tool includes:

* Machinery Regulation (EU) 2023/1230

Since a machinery product is often subject to additional European product legislation, applied alongside the Machinery Regulation and covered by the same CE marking, the tool may also support some of this legislation.

The secondary scope of the tool includes:

* Construction Products Regulation (EU) 2024/3110
* Low Voltage Directive 2014/35/EU
* Electromagnetic Compatibility Directive 2014/30/EU
* Restriction of Hazardous Substances Directive 2011/65/EU
* Pressure Equipment Directive 2014/68/EU

### 4.2 Out of Scope

The tool does not support CE marking of product types other than machinery, such as electrical equipment, medical devices, or standalone construction products, even where the same legislation would apply to them.

The tool does not support national legislation or national deviations, such as workplace or installation requirements under national law in the member states of the European Union.

### 4.3 Non-Goals

Following the vision principles of [Meaningful Output (3.5)](#35-meaningful-output) and [Avoid Conclusions (3.6)](#36-avoid-conclusions), the tool deliberately does **not**:

* generate the technical file or the EU Declaration of Conformity
* indicate conformity, compliance, or approval in any form
* present any output as complete, correct, or legally sufficient
* include or reproduce copyrighted content from harmonized standards

Any content generated or proposed by the tool is treated as a draft, pending the user's review. The non-goals are permanent design principles, not missing features, since they follow from the position that responsibility for the CE marking rests with the manufacturer and cannot be delegated to a tool.

## 5. Concept

### 5.1 Brief Description

The tool is a modeling environment for CE marking of machinery, used directly in the browser. The user builds a model of their CE marking work: the machinery product and its structure, the legislation and standards it falls under, the hazards it exhibits, the measures that reduce the risks, the requirements that follow, and the activities that verify them. Everything in the model is an entity, described by its attributes and connected to other entities through typed semantic relationships.

The modeling language is defined by a metamodel, built into the tool, which encodes the domain knowledge of CE marking and governs which entities and relationships can exist. The user works in a workspace with a navigator, an editor, and a relationship view, where the model is built up entity by entity as the engineering work progresses.

Every fact is stated once in the model. Artefacts such as hazard lists and requirement specifications are generated as views of the model, exportable for use in the user's own documentation. Content can be reused between projects, while the relationships are always re-established in the context of each machinery product.

The key characteristics of the concept:

* One model per machinery product, owned by the user as a single local file
* A built-in metamodel that defines the available entity types and relationships
* Every fact stated once, connected through typed semantic relationships
* Artefacts generated as views of the model, always consistent with each other
* Full traceability from legislation to hazard to measure to requirement to verification

### 5.2 User Environment

The user accesses the tool by visiting [openconformity.org](https://openconformity.org) in their browser. Using the tool requires no installation and no account. Entering the website lands the user directly in the tool, with no homepage, wizard, or project setup prompt. A first visit opens an empty project, ready for the first entity; a returning visit restores the user's previous working state. Information about the project is available from within the tool, rather than in front of it.

The user interface is based on a classic layout: a menu bar on top, a navigator pane to the left, an editor pane to the right, and a relationship pane on the bottom. A visual representation of the user interface is provided below.

```
┌─────────────────────────────────────────────────────────┐
│  Menu bar                                               │
├───────────────────┬─────────────────────────────────────┤
│                   │                                     │
│  Navigator pane   │  Editor pane                        │
│                   │                                     │
│  Tree of          │  Attributes of the                  │
│  the model        │  selected entity                    │
│                   │                                     │
├───────────────────┴─────────────────────────────────────┤
│                                                         │
│  Relationship pane               [ List | Graph ]       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

The navigator pane presents the model as a tree hierarchy, in which the user navigates and selects entities. The editor pane presents the selected entity and its attributes for viewing and editing. The relationship pane presents the relationships of the selected entity, either as a list or as a graph of the closest related entities. The menu bar holds project actions, such as creating, opening, and saving projects, and exporting artefacts.

### 5.3 Interaction Model

The user works in a loop of creating, selecting, editing, and connecting. Selecting an entity in the navigator presents its attributes in the editor and its relationships in the relationship pane. The user edits the attributes directly in the editor, and changes are applied to the model immediately.

New entities are created from the navigator, where the user chooses the entity type. The metamodel determines which entity types are available. Deleting an entity removes it from the model together with its relationships. Where the metamodel defines a composition, deleting an owning entity also deletes the entities it owns; the tool warns the user and lists the affected entities before performing such a deletion.

Relationships are created from the relationship pane of the selected entity. The user chooses among the relationships that the metamodel allows for the selected entity type, and then chooses the target entity. Relationships that the metamodel does not define cannot be created. Deleting a relationship never deletes the related entities, with the exception of compositions as described above.

In the relationship pane, the list view presents each relationship as a row, showing the relationship type, the direction, and the related entity. The graph view presents the selected entity and its closest related entities as boxes connected by labeled arrows. Selecting an entity in the graph makes it the new selection, allowing the user to walk through the model relationship by relationship.

### 5.2 Metamodel

While the model contains the user's content, the metamodel defines what a model may contain: the available entity types, their attributes, and the allowed semantic relationships between them. The metamodel encodes the domain knowledge of CE marking of machinery, and it is the core of the tool.

The metamodel is hardcoded in the tool and versioned with it. A user-extensible metamodel is out of scope, since the value of the tool lies in a metamodel that is correct for the domain, not in generic modeling capability. The source diagram of the metamodel is maintained in [meta.drawio](meta.drawio).

#### 5.2.1 Entity Types

The metamodel defines the following entity types, organized in four pillars:

| Pillar | Entity types |
|---|---|
| Legislative | European Legislation, European Standard, Conformity Assessment, Notified Body |
| Requirements | Essential Requirement, Standard Requirement, System Requirement, Verification Activity |
| Hazard Analysis | Single Hazard, Accident Scenario, Risk Reduction Measure, Safety Function |
| Structure | System Element, System Actor, System Task, System Phase |

#### 5.2.2 Semantic Relationships

Relationships are typed and directed, from a source entity type to a target entity type. Two kinds of relationships exist:

* **Association:** the entities are related. Both entities exist independently, and deleting one only removes the relationship.
* **Composition:** the source entity owns the target entity as a part. The part cannot exist without its owner, and deleting the owner also deletes its parts.

The metamodel defines the following relationships:

| Relationship | Source | Target | Kind |
|---|---|---|---|
| defines | European Legislation | Essential Requirement | Composition |
| defines | European Legislation | Conformity Assessment | Composition |
| defines | European Standard | Standard Requirement | Composition |
| involves | Conformity Assessment | Notified Body | Composition |
| harmonized to | European Standard | European Legislation | Association |
| subject to | System Element | European Legislation | Association |
| subject to | System Element | European Standard | Association |
| satisfies | Standard Requirement | Essential Requirement | Association |
| derives from | System Requirement | Standard Requirement | Association |
| derives from | System Requirement | Risk Reduction Measure | Association |
| derives from | System Requirement | Safety Function | Association |
| decompose | System Requirement | System Requirement | Composition |
| decompose | Safety Function | Safety Function | Composition |
| decompose | System Element | System Element | Composition |
| allocated to | Essential Requirement | System Element | Association |
| allocated to | Standard Requirement | System Element | Association |
| allocated to | System Requirement | System Element | Association |
| allocated to | Verification Activity | System Element | Association |
| allocated to | Risk Reduction Measure | System Element | Association |
| allocated to | Safety Function | System Element | Association |
| verifies | Verification Activity | System Requirement | Association |
| verifies | Verification Activity | Risk Reduction Measure | Association |
| verifies | Verification Activity | Safety Function | Association |
| implements | Risk Reduction Measure | Standard Requirement | Association |
| realizes | Safety Function | Risk Reduction Measure | Association |
| mitigates | Risk Reduction Measure | Single Hazard | Association |
| mitigates | Risk Reduction Measure | Accident Scenario | Association |
| exhibits | System Element | Single Hazard | Composition |
| triggers | Single Hazard | Essential Requirement | Association |
| contributes to | Single Hazard | Accident Scenario | Association |
| leads to | System Task | Accident Scenario | Association |
| exposed in | System Actor | Accident Scenario | Association |
| has | System Element | System Phase | Association |
| has | System Element | System Actor | Association |
| performs | System Actor | System Task | Association |
| during | System Task | System Phase | Association |

The tool enforces the metamodel: the user can only create relationships that the metamodel defines. A relationship not present in the table above cannot exist in a model.

Notable consequences of the composition relationships: a Single Hazard belongs to exactly one System Element and is deleted with it, and the requirements of a legislation or standard are deleted together with the legislation or standard that defines them. The tool warns the user before performing a deletion that cascades to owned entities.

### 5.3 The Model

*Status: not yet started.*

### 5.4 Working With the Model

*Status: not yet started.*

### 5.5 Views and Export

*Status: not yet started.*

### 5.6 Reuse

*Status: not yet started.*

## 6. Implementation

*Status: not yet started.*

## 7. Release Plan

*Status: not yet started.*

## 8. Licensing

The project is licensed under the [EUPL-1.2](../LICENSE), covering the source code, the design documents, and the diagrams. The reasoning behind the choice is documented in [decisions.md](decisions.md).