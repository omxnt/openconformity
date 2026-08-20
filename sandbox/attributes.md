# Attributes

This document specifies the attributes each entity type carries. The metamodel defines the types and how they relate, and this document defines what data each one holds. An attribute not recorded here is not part of the model.

**Working draft.** This copy supersedes `docs/attributes.md` while the attribute-definition work runs: the rounds land here, `sandbox/app/attributes.js` is kept in step with it, and the published document is untouched until the work is promoted over it. Types still reading title and description carry the placeholder definitions the build started from.

## 1. Conventions

### 1.1 Identifier

Each entity type has an identifier which is generated and read only, so it is not an attribute. The editor does not show it among the fields — the pane's header and the tree both carry it already — and a file carries it beside the attributes rather than among them.

### 1.2 Optional

Every attribute is optional, and every value is stored as text. An unset attribute is the absence of its key; clearing a choice removes the key.

### 1.3 Kinds

Each attribute uses one of the kinds below.

| Kind | Meaning |
|---|---|
| text | A single line of text |
| multiline | Text of any length, line breaks preserved |
| choice | One value from the Values column |
| hyperlink | A web address |

### 1.4 Groups

The editor may present a type's attributes in groups. Each group is its own sub-heading and table under the type, in render order: an ungrouped table comes first where a type has one, then each named group under its name. Groups are flat: a group holds attributes only, never another group, and a type's keys are unique across all of its tables. Group names are display vocabulary, stored in no file.

A group is a heading over its fields and nothing more — a fieldset and its legend, as Carbon groups a form — not a disclosure the reader has to open. What a type holds is what the reader came for, so none of it is hidden behind a control.

### 1.5 Status

Each entity type shall carry a status tag.

| Tag | Meaning |
|---|---|
| `draft` | Newly written, or still being worked on. |
| `stable` | Settled as written, and not expected to change. |

### 1.6 Template

Each entity type is written using the template below.

```
### CODE Entity Type `status`

| Key | Name | Kind | Values |
|---|---|---|---|
| key | Name | kind | value; value |

#### Group name

| Key | Name | Kind | Values |
|---|---|---|---|
| key | Name | kind | value; value |
```

### 1.7 Labels

A type that carries a reference composes its label from the reference and the title, in that order, separated by a single space: `(EU) 2023/1230 Machinery Regulation`. The reference's own citation format is the delimiter, so nothing is bracketed or punctuated around it. A type carrying no reference is labelled by its title alone. Composition happens where a label is shown — the tree, the tables, the graph — and no composed label is ever stored.

### 1.8 Layout

The editor lays a type's attributes out in the order this document records them, two to a row. An attribute whose value runs long — a multiline or a hyperlink — takes the width of both, and so begins a row of its own.

A choice holds one value from a short list, so it is given a narrow field rather than a full column: a field's width says what length of value is expected.

View mode is the form's read-only state, as Carbon patterns it: the same structure and spacing as the editable form, with each field's ground turned transparent and its rule made subtle, so entering an edit changes what the fields afford and nothing about where they stand. Fields are the compact 32-pixel size throughout, matching the density of the rest of the interface.

## 2. System Context

### 2.1 System Element (ELM) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

### 2.2 System Actor (ACT) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

### 2.3 System Task (TSK) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

### 2.4 System Phase (PHS) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

## 3. Legislative Framework

### 3.1 European Legislation (LEG) `draft`

The reference is the act's citation in canonical form — `(EU) 2023/1230` for a regulation, `2006/42/EC` for a directive. It is load-bearing beyond display: an import will join on it, matching on the year and number at its core, so it is written as the act itself writes it and nothing else is put in the field. The title is the short human name the act is known by, and the link is the act's canonical online home. Applicable and the rationale carry the verdict and its reasoning: whether the act applies to this product at all, and the account of why — coverage, transition, exclusions — that a reader follows. Unset means unassessed, not ruled out.

#### Act

| Key | Name | Kind | Values |
|---|---|---|---|
| reference | Reference | text | |
| title | Title | text | |
| link | Link | hyperlink | |

#### Applicability

| Key | Name | Kind | Values |
|---|---|---|---|
| applicable | Applicable | choice | Yes; No |
| rationale | Rationale | multiline | |

### 3.2 Harmonised Standard (HST) `draft`

The reference is the standard's designation without the year it was published — `EN ISO 12100` — because the edition carries that, and an import joins on the designation. The title is the standard's own title. The edition names which version is applied, and the date is the date that edition carries. Applicable and the rationale hold the verdict and its reasoning: whether the standard is applied to this product, and why.

#### Standard

| Key | Name | Kind | Values |
|---|---|---|---|
| reference | Reference | text | |
| title | Title | text | |
| edition | Edition | text | |
| date | Date | text | |
| link | Link | hyperlink | |

#### Applicability

| Key | Name | Kind | Values |
|---|---|---|---|
| applicable | Applicable | choice | Yes; No |
| rationale | Rationale | multiline | |

### 3.3 Other Specification (OSP) `draft`

The same fields as a harmonised standard, for a specification that is not harmonised to the legislation and so carries no presumption of conformity. What that changes is the metamodel's business, not this document's: the requirements it holds support an essential requirement rather than covering one.

#### Specification

| Key | Name | Kind | Values |
|---|---|---|---|
| reference | Reference | text | |
| title | Title | text | |
| edition | Edition | text | |
| date | Date | text | |
| link | Link | hyperlink | |

#### Applicability

| Key | Name | Kind | Values |
|---|---|---|---|
| applicable | Applicable | choice | Yes; No |
| rationale | Rationale | multiline | |

### 3.4 Conformity Assessment (CAS) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

### 3.5 Notified Body (NTB) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

## 4. Risk Assessment

### 4.1 Single Hazard (HAZ) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

### 4.2 Accident Scenario (SCN) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

### 4.3 Protective Measure (PRM) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

### 4.4 Safety Function (SAF) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

## 5. Requirements Definition

### 5.1 Essential Requirement (ESR) `draft`

The reference is the requirement's citation within the legislation that contains it — `1.3.7`, not the act's own citation — so it is scoped by its owner: an import joins on the owning legislation's reference together with this one. The title is the requirement's heading as the act prints it, and the requirement holds its text. Applicable is the assessment verdict, and unset means the requirement has not been assessed yet: an unassessed requirement is not the same as one ruled out. The rationale carries the reasoning behind the verdict, and is what an assessor reads to follow the argument; it belongs with every verdict, and most of all with `No`.

#### Requirement

| Key | Name | Kind | Values |
|---|---|---|---|
| reference | Reference | text | |
| title | Title | text | |
| requirement | Requirement | multiline | |

#### Applicability

| Key | Name | Kind | Values |
|---|---|---|---|
| applicable | Applicable | choice | Yes; No |
| rationale | Rationale | multiline | |

### 5.2 Harmonised Requirement (HSR) `draft`

The fields an essential requirement carries, scoped to the standard that holds it: the reference is the clause number within that standard — `5.4` — and an import joins on the standard's designation together with it. A standard's text is a copyright work, unlike the legislation's, so whether to record it under the requirement is the modeller's own call.

#### Requirement

| Key | Name | Kind | Values |
|---|---|---|---|
| reference | Reference | text | |
| title | Title | text | |
| requirement | Requirement | multiline | |

#### Applicability

| Key | Name | Kind | Values |
|---|---|---|---|
| applicable | Applicable | choice | Yes; No |
| rationale | Rationale | multiline | |

### 5.3 Other Requirement (OSR) `draft`

The same fields again, scoped to the specification that holds it.

#### Requirement

| Key | Name | Kind | Values |
|---|---|---|---|
| reference | Reference | text | |
| title | Title | text | |
| requirement | Requirement | multiline | |

#### Applicability

| Key | Name | Kind | Values |
|---|---|---|---|
| applicable | Applicable | choice | Yes; No |
| rationale | Rationale | multiline | |

### 5.4 System Requirement (REQ) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

### 5.5 System Verification (VER) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

## 6. References

| No. | Reference | Link |
|---|---|---|
| *[1]* | *Reference*| *Link* |
