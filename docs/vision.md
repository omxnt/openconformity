# Vision

This document describes the background and reasoning behind the project, the principles it rests on, and its scope. It shapes the specification, design, and implementation of the software.

## Table of Contents

- [1. Background](#1-background)
  - [1.1 Current Market](#11-current-market)
  - [1.2 Systems Modelling](#12-systems-modelling)
  - [1.3 Problem Statement](#13-problem-statement)
- [2. Project Principles](#2-project-principles)
  - [2.1 Open Source](#21-open-source)
  - [2.2 Minimal Barriers](#22-minimal-barriers)
  - [2.3 Privacy by Design](#23-privacy-by-design)
  - [2.4 User-Owned Data](#24-user-owned-data)
  - [2.5 Meaningful Output](#25-meaningful-output)
  - [2.6 Avoid Conclusions](#26-avoid-conclusions)
  - [2.7 Engineering Work](#27-engineering-work)
- [3. Software Scope](#3-software-scope)
  - [3.1 In Scope](#31-in-scope)
  - [3.2 Out of Scope](#32-out-of-scope)
  - [3.3 Non-Goals](#33-non-goals)
- [4. References](#4-references)

## 1. Background

### 1.1 Current Market

Today, multiple commercial tools are available that support activities related to CE marking under European product legislation. Many of these tools target CE marking of machinery under the Machinery Directive 2006/42/EC or the upcoming Machinery Regulation (EU) 2023/1230. These tools are priced and designed for corporate use, usually offered as either Software-as-a-Service (SaaS) or as licensed desktop applications.

The knowledge these tools are built on, such as directives, regulations, and guidance documents, is publicly available on the European Union's websites. Harmonised standards are the exception, since they are typically purchased through national standardisation bodies, e.g. the Swedish Institute for Standards (SIS).

To the author's knowledge, no open-source alternative currently exists. One may reason that an open-source tool would be preferable, since the legislative knowledge is public, and the harmonised standards have already been paid for by the manufacturer. As CE marking is an obligation placed on the product manufacturer, a free, open-source tool supporting this work would benefit the industry as a whole.

### 1.2 Systems Modelling

Within the domain of Systems Engineering (SE), Model-based Systems Engineering (MBSE) is the practice of using a shared model, rather than a collection of separately maintained documents, as the primary artefact of the engineering work. The model consists of elements with attributes, connected by typed, semantic relationships. Documents are then generated as views of the model rather than authored and maintained by hand, so that the model serves as the single source of truth for the system's definition.

Compared to a document-centric approach, where the same information is repeated and manually kept in sync across multiple documents, a model-based approach captures each piece of information once and references it wherever it is needed. This enables traceability between elements, consistency across all generated views, and impact analysis when something changes.

### 1.3 Problem Statement

When studying the framework behind CE marking, it becomes apparent that this work has the same character as the problems MBSE tries to solve. Legislation defines essential requirements, which are triggered by the hazards the product exhibits. The essential requirements are usually met by applying harmonised standards, where the hazards are fed into the risk analysis. Multiple hazards can contribute to different accident scenarios, mitigated by a set of risk reduction measures. A mature organisation usually translates this into system requirements, which are later verified by verification activities.

Traditional document-centric CE marking implies that the same information is stated multiple times, from different points of view. The relationships within the CE marking work are inherently many-to-many, where a single risk reduction measure may reduce the risk of several hazards, a single hazard may appear in several accident scenarios, and a harmonised standard may relate both to essential requirements and to the risk reduction measures that implement its clauses. In a document-centric approach, each of these connections is repeated wherever it is relevant, for example, the same risk reduction measure is written into the row of every hazard it mitigates. This means that each repetition must be maintained by hand.

In a model-based approach, every entity is stated once, and the connections are expressed as semantic relationships. Views can then be exported for any purpose, such as a hazard list, a requirement specification, or a verification plan. All of these artefacts are generated from the same model, always consistent with each other, with the traceability between legislation, standards, hazards, measures, requirements, and verifications preserved automatically.

## 2. Project Principles

The vision for the project is to provide a modelling environment for the engineering work related to CE marking of machinery in accordance with the Machinery Regulation (EU) 2023/1230. The vision rests on the following principles.

### 2.1 Open Source

The software is free to use, and its source code is open. Anyone can inspect how it works, verify its claims, contribute to it, or adapt it to their own needs. There is no commercial interest behind the project.

### 2.2 Minimal Barriers

The software runs entirely client-side, with no installation, no account, and no server required. The user opens the page and starts working.

### 2.3 Privacy by Design

There is no server contact, no tracking, no analytics, and no data collection of any kind. All processing happens in the user's browser, and user data never leaves it.

### 2.4 User-Owned Data

Projects are saved as local files, owned and controlled by the user. Data can be moved, backed up, or deleted at the user's sole discretion.

### 2.5 Meaningful Output

The software generates raw engineering artefacts, such as applicable essential requirements, identified hazards, and requirements. These are exportable, intended as input to the engineering documents that the user assembles under their own quality system.

### 2.6 Avoid Conclusions

The software never states any conclusion about the safety or conformity of the product, and does not generate reports. The responsibility for the CE marking remains with the manufacturer.

### 2.7 Engineering Work

The software treats CE marking as engineering work, requiring competence, judgement, and knowledge of the applicable legislation and standards. It provides structure rather than shortcuts, with no checklists or wizards that promise conformity without understanding. The software cannot replace competence, it only makes competent work traceable, consistent, and reusable.

## 3. Software Scope

### 3.1 In Scope

The scope of the software is to support CE marking of machinery products under the European product legislation of the New Legislative Framework (NLF).

The primary scope of the software includes:

- Machinery Regulation (EU) 2023/1230

Since a machinery product is often subject to additional European product legislation, applied alongside the Machinery Regulation and covered by the same CE marking, the software may also support some of this legislation.

The secondary scope of the software includes:

- Construction Products Regulation (EU) 2024/3110
- Low Voltage Directive 2014/35/EU
- Electromagnetic Compatibility Directive 2014/30/EU
- Restriction of Hazardous Substances Directive 2011/65/EU
- Pressure Equipment Directive 2014/68/EU

### 3.2 Out of Scope

The software does not support CE marking of product types other than machinery, such as electrical equipment, medical devices, or standalone construction products, even where the same legislation would apply to them.

The software does not support national legislation or national deviations, such as workplace or installation requirements under national law in the member states of the European Union.

### 3.3 Non-Goals

Following the project principles of [Meaningful Output (2.5)](#25-meaningful-output) and [Avoid Conclusions (2.6)](#26-avoid-conclusions), the software deliberately does **not**:

- generate the technical file or the EU Declaration of Conformity
- indicate conformity, compliance, or approval in any form
- present any output as complete, correct, or legally sufficient
- include or reproduce copyrighted content from harmonised standards

Any content generated or proposed by the software is treated as a draft, pending the user's review. The non-goals are permanent design principles, not missing features, since they follow from the position that responsibility for the CE marking rests with the manufacturer and cannot be delegated to a tool.

## 4. References

| No. | Reference | Link |
|---|---|---|
| *[1]* | *Reference*| *Link* |