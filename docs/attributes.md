# Attributes

This document specifies the attributes each entity type carries. The metamodel defines the types and how they relate, and this document defines what data each one holds. An attribute not recorded here is not part of the model.

## 1. Conventions

### 1.1 Identifier

Each entity type has an identifier which is generated and read only, so it is not an attribute. The editor shows it above the attributes, and a file carries it beside them rather than among them.

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

The editor may present a type's attributes in groups. Each group is its own sub-heading and table under the type, in render order: the first table is ungrouped, shown first and always expanded; each further group renders as a collapsible sub-heading under its name. Groups are flat: a group holds attributes only, never another group, and a type's keys are unique across all of its tables. Group names are display vocabulary, stored in no file.

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

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

### 3.2 Harmonised Standard (HST) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

### 3.3 Other Specification (OSP) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

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

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

### 5.2 Harmonised Requirement (HSR) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

### 5.3 Other Requirement (OSR) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

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