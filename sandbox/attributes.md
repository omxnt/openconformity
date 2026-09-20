# Attributes

This document specifies the attributes each entity type carries. The metamodel defines the types and how they relate, and this document defines what data each one holds. An attribute not recorded here is not part of the model.

**Working draft.** This copy supersedes `docs/attributes.md` while the attribute-definition work runs: the rounds land here, `sandbox/app/attributes.js` is kept in step with it, and the published document is untouched until the work is promoted over it. Types still reading title and description carry the placeholder definitions the build started from.

## 1. Conventions

### 1.1 Identifier

Each entity type has an identifier which is generated and read only, so it is not an attribute: a file carries it beside the attributes rather than among them. The editor shows it as the first cell of the type's own tab, in the field's read-only state in either mode, beside the reference where the type carries one.

### 1.2 Optional

Every attribute is optional, and every value is stored as text. An unset attribute is the absence of its key; clearing a choice removes the key. A computed attribute and a related one are the exceptions: derived wherever they are shown — the one from the attributes beside it, the other from the model's relationships — they are never stored.

### 1.3 Kinds

Each attribute uses one of the kinds below.

| Kind | Meaning |
|---|---|
| text | A single line of text |
| multiline | Text of any length, line breaks preserved |
| choice | One value from the Values column |
| set | Any number of the values in the Values column, stored as those chosen separated by semicolons, in the order the column lists them |
| hyperlink | A web address |
| number | A whole number, kept between the least and the greatest the Values column gives |
| computed | A value derived from the fields beside it by the method the Values column names: shown, never stored |
| related | The entities related to this one by the relationship type the Values column names, listed as they stand, each a way to it: shown, never stored |

### 1.4 Groups

The editor may present a type's attributes in groups. Each group is its own sub-heading and table under the type, in render order: an ungrouped table comes first where a type has one, then each named group under its name. A group may hold sub-groups, one level deep, under `#####` headings, each carrying the tags a group can; a type's keys are unique across all of its tables. Group names are display vocabulary, stored in no file.

A group is a heading over its cells, within the tab it stands in. A group whose heading carries the tag `tab` stands instead on a tab of its own, named for the group, as §1.8 lays out.

A group whose heading carries the tag `when key = value` is shown only while the attribute of that key holds that value, and what it holds is saved only then: a rating made under one method does not ride along under another. Sub-groups sharing a name and waiting on the same attribute are one slot, a cell held whichever of them holds; while none does, the slot shows in the value's place that nothing is chosen for the attribute it waits on — as a disabled field in an edit — so the form keeps its shape. A group's sub-groups stand after its attributes, in their order; where one of them waits on an attribute of the group, they stand right after that attribute, so what a choice governs stands under the choice.

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

#### Group name `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| key | Name | kind | value; value |

#### Group name `when key = value`

| Key | Name | Kind | Values |
|---|---|---|---|
| key | Name | kind | value; value |

##### Sub-group name

| Key | Name | Kind | Values |
|---|---|---|---|
| key | Name | kind | value; value |
```

### 1.7 Labels

A type that carries a reference composes its label from the reference and the title, in that order, separated by a single space: `(EU) 2023/1230 Machinery Regulation`. The reference's own citation format is the delimiter, so nothing is bracketed or punctuated around it. A type carrying no reference is labelled by its title alone. Composition happens where a label is shown — the tree, the tables, the graph — and no composed label is ever stored.

### 1.8 Layout

The editor lays a type's attributes out as Carbon lays out a form, in the order this document records them: each attribute its name over its field, two to a row. The identifier stands first, and the reference — or the designation — beside it; the title, a multiline and a hyperlink each take a row to themselves. View mode is the form's read-only state, as Carbon patterns it: the same structure and spacing as the editable form, each field's ground turned transparent and its rule made subtle, so entering an edit changes what the fields afford and nothing about where they stand. Every name reads at the one size and every value at the one size; nothing in the pane is a heading, the pane's head carrying the type, the identifier and the label already. A choice reads as a tag, a set as the tags chosen — in an edit, a field saying how many and which, opening Carbon's multiselect of every value with its checkbox — and a hyperlink as a link. Fields are the compact 32-pixel size throughout, matching the density of the rest of the interface. A choice or a number is given a narrow field rather than the cell's width: a field's width says what length of value is expected.

A type's own attributes stand on the first tab, named for the type by the last word of its name — Legislation, Requirement, Function — and each group tagged `tab` on a tab of its own, named for the group: a tab is earned by a distinct task, such as a verdict or an estimate, or by a set of fields about a distinct concern, never by a single text and never by the identity alone. Every type closes with a Notes tab, one multiline field for what fits nowhere else, so every pane has its tab bar. The tabs are Carbon's line tabs at the navigator filter bar's height. The tab chosen stands for the rest of the browser session, by type, so the next entity of the type opens on the same tab, and choosing a tab leaves an open edit as it is: what stands on another tab is still part of the draft. A group carrying no tag stands within its tab as a legend over its cells, unless it holds a single attribute, which then stands on its own.

A group that closes on a computed attribute is a rating, a cell like any other: its name, then what the rating comes to and the code of each parameter set, as tags — a code being a value's first word, and its second where the first holds no digit — the parameter's name and full value shown on hovering a tag. In an edit the cell is a field that opens the rating's dialog, which presents the method as chapter 6 lays it out: the matrix to click, the graph to follow, the scores to enter, the scales beside their matrix.

A related attribute lists, live, the entities its relationship type joins to this one, each shown as the tree shows an entity and each a way to it. The list is the model's, not the entity's, so nothing of it is stored; it takes a row to itself and, being a list of entities rather than a value, stands without a rule beneath it.

## 2. System Context

### 2.1 System Element (ELM) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 2.2 System Actor (ACT) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 2.3 System Task (TSK) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 2.4 System Phase (PHS) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

## 3. Legislative Framework

### 3.1 European Legislation (LEG) `draft`

The reference is the act's citation in canonical form — `(EU) 2023/1230` for a regulation, `2006/42/EC` for a directive. It is load-bearing beyond display: an import will join on it, matching on the year and number at its core, so it is written as the act itself writes it and nothing else is put in the field. The title is the short human name the act is known by, and the link is the act's canonical online home. Applicable and the rationale carry the verdict and its reasoning: whether the act applies to this product at all, and the account of why — coverage, transition, exclusions — that a reader follows. Unset means unassessed, not ruled out.

| Key | Name | Kind | Values |
|---|---|---|---|
| reference | Reference | text | |
| title | Title | text | |
| link | Link | hyperlink | |

#### Applicability `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| applicable | Applicable | choice | Yes; No |
| rationale | Rationale | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 3.2 Harmonised Standard (HST) `draft`

The reference is the standard's designation as it is cited — `EN ISO 12100` — and an import joins on it. The title is the standard's own title, and the link is where it is published online. Applicable and the rationale hold the verdict and its reasoning: whether the standard is applied to this product, and why.

| Key | Name | Kind | Values |
|---|---|---|---|
| reference | Reference | text | |
| title | Title | text | |
| link | Link | hyperlink | |

#### Applicability `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| applicable | Applicable | choice | Yes; No |
| rationale | Rationale | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 3.3 Other Specification (OSP) `draft`

The same fields as a harmonised standard, for a specification that is not harmonised to the legislation and so carries no presumption of conformity. What that changes is the metamodel's business, not this document's: the requirements it holds support an essential requirement rather than covering one.

| Key | Name | Kind | Values |
|---|---|---|---|
| reference | Reference | text | |
| title | Title | text | |
| link | Link | hyperlink | |

#### Applicability `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| applicable | Applicable | choice | Yes; No |
| rationale | Rationale | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 3.4 Conformity Assessment (CAS) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 3.5 Notified Body (NTB) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

## 4. Risk Assessment

### 4.1 Single Hazard (HAZ) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 4.2 Accident Scenario (SCN) `draft`

The scenario is rated by the methods of an estimation standard — ISO/TR 14121-2, the report chapter 6 transcribes — the method chosen being one of the report's four and so offered only under it: each method's parameters stand in a pair of groups shown only while it is the method chosen, once for the initial risk and once for the residual risk, side by side, with the protective measures the model links to the scenario listed beneath the two, the measures in place when the residual risk is rated. What a rating comes to — its level, index or score — is computed where it is shown and never stored, and the measures listed are those linked at the time of looking, each a way to the measure.

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| hazardZone | Hazard zone | text | |
| hazardousEvent | Hazardous event | multiline | |
| consequence | Potential consequence | multiline | |

#### Risk `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| standard | Estimation standard | choice | ISO/TR 14121-2 |

##### Estimation method `when standard = ISO/TR 14121-2`

| Key | Name | Kind | Values |
|---|---|---|---|
| method | Estimation method | choice | Risk matrix; Risk graph; Numerical scoring; Hybrid tool |

##### Initial risk `when method = Risk matrix`

| Key | Name | Kind | Values |
|---|---|---|---|
| initialSeverity | Severity of harm | choice | Catastrophic; Serious; Moderate; Minor |
| initialProbability | Probability of occurrence of harm | choice | Very likely; Likely; Unlikely; Remote |
| initialLevel | Risk level | computed | Risk matrix |

##### Initial risk `when method = Risk graph`

| Key | Name | Kind | Values |
|---|---|---|---|
| initialS | Severity of harm | choice | S1; S2 |
| initialF | Frequency and duration of exposure | choice | F1; F2 |
| initialO | Probability of occurrence of a hazardous event | choice | O1; O2; O3 |
| initialA | Possibility of avoidance | choice | A1; A2 |
| initialIndex | Risk index | computed | Risk graph |

##### Initial risk `when method = Numerical scoring`

| Key | Name | Kind | Values |
|---|---|---|---|
| initialSeverityScore | Severity score | number | 0; 100 |
| initialProbabilityScore | Probability score | number | 0; 100 |
| initialScore | Risk score | computed | Numerical scoring |

##### Initial risk `when method = Hybrid tool`

| Key | Name | Kind | Values |
|---|---|---|---|
| initialSe | Severity Se | choice | Se 1; Se 2; Se 3; Se 4 |
| initialFr | Frequency Fr | choice | Fr 2; Fr 3; Fr 4; Fr 5 |
| initialPr | Probability Pr | choice | Pr 1; Pr 2; Pr 3; Pr 4; Pr 5 |
| initialAv | Avoidance Av | choice | Av 1; Av 3; Av 5 |
| initialClass | Class and risk | computed | Hybrid tool |

##### Residual risk `when method = Risk matrix`

| Key | Name | Kind | Values |
|---|---|---|---|
| residualSeverity | Severity of harm | choice | Catastrophic; Serious; Moderate; Minor |
| residualProbability | Probability of occurrence of harm | choice | Very likely; Likely; Unlikely; Remote |
| residualLevel | Risk level | computed | Risk matrix |

##### Residual risk `when method = Risk graph`

| Key | Name | Kind | Values |
|---|---|---|---|
| residualS | Severity of harm | choice | S1; S2 |
| residualF | Frequency and duration of exposure | choice | F1; F2 |
| residualO | Probability of occurrence of a hazardous event | choice | O1; O2; O3 |
| residualA | Possibility of avoidance | choice | A1; A2 |
| residualIndex | Risk index | computed | Risk graph |

##### Residual risk `when method = Numerical scoring`

| Key | Name | Kind | Values |
|---|---|---|---|
| residualSeverityScore | Severity score | number | 0; 100 |
| residualProbabilityScore | Probability score | number | 0; 100 |
| residualScore | Risk score | computed | Numerical scoring |

##### Residual risk `when method = Hybrid tool`

| Key | Name | Kind | Values |
|---|---|---|---|
| residualSe | Severity Se | choice | Se 1; Se 2; Se 3; Se 4 |
| residualFr | Frequency Fr | choice | Fr 2; Fr 3; Fr 4; Fr 5 |
| residualPr | Probability Pr | choice | Pr 1; Pr 2; Pr 3; Pr 4; Pr 5 |
| residualAv | Avoidance Av | choice | Av 1; Av 3; Av 5 |
| residualClass | Class and risk | computed | Hybrid tool |

##### Protective measures

| Key | Name | Kind | Values |
|---|---|---|---|
| measures | Measures in place for the residual risk | related | prm-reduces-risk-of-scn |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 4.3 Protective Measure (PRM) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 4.4 Safety Function (SAF) `draft`

The designation is the function's own short name — `SF1` — entered by the modeller, and it is the reference the label composes with the title (§1.7): `SF1 Emergency Stop`. The tabs follow one rule: a sentence about what happens stands on a story tab, Behaviour for the nominal path and Fault handling for the faulty one, and a quantity or an interface stands on Characteristics. So the tabs read: what it is, what it does, what it does when it fails, and what it must achieve, in numbers. The technologies follow those ISO 13849-1 names in its scope, software standing for the programmable electronic among them, and a function spanning several carries them all. The design standard names the functional-safety standard the function is designed to, and the integrity level it requires is not chosen but read by that standard's own method, in the one slot beside it. Under EN ISO 13849-1 the risk graph (§6.5) reads the performance level from the function's S, F, P and occurrence; under EN IEC 62061 the matrix (§6.6) reads the safety integrity level from its Se, Fr, Pr and Av. The function stores those four, and the level is computed.

| Key | Name | Kind | Values |
|---|---|---|---|
| reference | Designation | text | |
| title | Title | text | |
| description | Brief description | multiline | |
| relevantStandards | Relevant standards | multiline | |

#### Behaviour `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| priority | Priority | text | |
| operatingMode | Operating mode | text | |
| trigger | Triggering event | multiline | |
| reaction | Safety-related reaction | multiline | |
| safeState | Intended safe state | multiline | |
| restart | Restart conditions | multiline | |

#### Faults `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| faultDetection | Fault detection | multiline | |
| faultHandling | Reaction to faults | multiline | |
| faultIndication | Fault indication | multiline | |
| powerLoss | Power loss behaviour | multiline | |

#### Characteristics `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| standard | Design standard | choice | EN ISO 13849-1; EN IEC 62061 |
| responseTime | Demand response time | text | |
| faultReactionTime | Fault reaction time | text | |
| demandRate | Demand rate | text | |
| technology | Technology | set | Mechanical; Hydraulic; Pneumatic; Electrical; Electronic; Software |
| interfaces | Specific interfaces | multiline | |

##### Integrity level `when standard = EN ISO 13849-1`

| Key | Name | Kind | Values |
|---|---|---|---|
| plS | Severity of injury | choice | S1; S2 |
| plF | Frequency and exposure | choice | F1; F2 |
| plP | Possibility of avoidance | choice | P1; P2 |
| plO | Probability of occurrence | choice | High; Low |
| plr | Required performance level | computed | PL risk graph |

##### Integrity level `when standard = EN IEC 62061`

| Key | Name | Kind | Values |
|---|---|---|---|
| silSe | Severity Se | choice | Se 1; Se 2; Se 3; Se 4 |
| silFr | Frequency Fr | choice | Fr 1; Fr 2; Fr 3; Fr 4; Fr 5 |
| silPr | Probability Pr | choice | Pr 1; Pr 2; Pr 3; Pr 4; Pr 5 |
| silAv | Avoidance Av | choice | Av 1; Av 3; Av 5 |
| sil | Required safety integrity level | computed | SIL matrix |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

## 5. Requirements Definition

### 5.1 Essential Requirement (ESR) `draft`

The reference is the requirement's citation within the legislation that contains it — `1.3.7`, not the act's own citation — so it is scoped by its owner: an import joins on the owning legislation's reference together with this one. The title is the requirement's heading as the act prints it, and the requirement holds its text. Applicable is the assessment verdict, and unset means the requirement has not been assessed yet: an unassessed requirement is not the same as one ruled out. The rationale carries the reasoning behind the verdict, and is what an assessor reads to follow the argument; it belongs with every verdict, and most of all with `No`.

| Key | Name | Kind | Values |
|---|---|---|---|
| reference | Reference | text | |
| title | Title | text | |
| requirement | Requirement | multiline | |

#### Applicability `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| applicable | Applicable | choice | Yes; No |
| rationale | Rationale | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 5.2 Harmonised Requirement (HSR) `draft`

The fields an essential requirement carries, scoped to the standard that holds it: the reference is the clause number within that standard — `5.4` — and an import joins on the standard's designation together with it. A standard's text is a copyright work, unlike the legislation's, so whether to record it under the requirement is the modeller's own call.

| Key | Name | Kind | Values |
|---|---|---|---|
| reference | Reference | text | |
| title | Title | text | |
| requirement | Requirement | multiline | |

#### Applicability `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| applicable | Applicable | choice | Yes; No |
| rationale | Rationale | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 5.3 Other Requirement (OSR) `draft`

The same fields again, scoped to the specification that holds it.

| Key | Name | Kind | Values |
|---|---|---|---|
| reference | Reference | text | |
| title | Title | text | |
| requirement | Requirement | multiline | |

#### Applicability `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| applicable | Applicable | choice | Yes; No |
| rationale | Rationale | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 5.4 System Requirement (REQ) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 5.5 System Verification (VER) `draft`

| Key | Name | Kind | Values |
|---|---|---|---|
| title | Title | text | |
| description | Description | multiline | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

## 6. Risk estimation

An accident scenario is rated by one of the four methods ISO/TR 14121-2:2012 [1] describes, chosen per scenario, and a safety function's required level is read by its target standard's own method (§6.5, §6.6). Each method's parameters are attributes of the entity; the level, index or score they come to is computed by the tables below wherever it is shown, and is never stored. Every parameter carries its source's codes and scores alone; the class definitions behind them are the source document's own, at the clause given, and are not reproduced here.

### 6.1 Risk matrix

ISO/TR 14121-2:2012, 6.2.2, Table 1: the severity of harm across, the probability of occurrence of harm down.

| Probability of occurrence of harm | Catastrophic | Serious | Moderate | Minor |
|---|---|---|---|---|
| Very likely | High | High | High | Medium |
| Likely | High | High | Medium | Low |
| Unlikely | Medium | Medium | Low | Negligible |
| Remote | Low | Low | Negligible | Negligible |

### 6.2 Risk graph

ISO/TR 14121-2:2012, 6.3.2, Figures 3 and 4: severity S and exposure F down, probability of occurrence O and possibility of avoidance A across, giving a risk index from 1 to 6, read as the second table bands it.

| S F | O1 A1 | O1 A2 | O2 A1 | O2 A2 | O3 A1 | O3 A2 |
|---|---|---|---|---|---|---|
| S1 F1 | 1 | 1 | 1 | 1 | 2 | 2 |
| S1 F2 | 1 | 1 | 1 | 1 | 2 | 2 |
| S2 F1 | 2 | 2 | 2 | 3 | 3 | 4 |
| S2 F2 | 3 | 4 | 4 | 5 | 5 | 6 |

| Risk index | Risk |
|---|---|
| 1; 2 | lowest |
| 3; 4 | medium |
| 5; 6 | highest |

### 6.3 Numerical scoring

ISO/TR 14121-2:2012, 6.4.2: the software adds the severity score and the probability score, each 0 to 100, and reads the category from the third table; the first two say which class a score falls in, as the dialog notes beside each score.

| Severity score | Class |
|---|---|
| 100 | catastrophic |
| 90 – 99 | serious |
| 30 – 89 | moderate |
| 0 – 29 | minor |

| Probability score | Class |
|---|---|
| 100 | very likely |
| 70 – 99 | likely |
| 30 – 69 | unlikely |
| 0 – 29 | remote |

| From | To | Category |
|---|---|---|
| 160 | 200 | high |
| 120 | 159 | medium |
| 90 | 119 | low |
| 0 | 89 | negligible |

### 6.4 Hybrid tool

ISO/TR 14121-2:2012, 6.5.2: the software adds Fr, Pr and Av into the class Cl and crosses Se with it. The lowest column is taken to start at 4, the lowest class the scores can add to. Which score a situation takes is the report's own guidance, and is the modeller's reading of it.

| Severity | Cl 4 – 7 | Cl 8 – 10 | Cl 11 – 13 | Cl 14 – 15 |
|---|---|---|---|---|
| 4 | medium | high | high | high |
| 3 | low | medium | high | high |
| 2 | low | low | medium | high |
| 1 | low | low | low | medium |

### 6.5 Performance level risk graph

ISO 13849-1 [2], Annex A, Figure A.1: the required performance level of a safety function, read from its S, F and P. Where the function's probability of occurrence is set low, the level read is lowered by one, as the second table has it; PL a has none below it. A function designed to EN ISO 13849-1 stores the four, and the level is computed.

| S | F | P | PLr |
|---|---|---|---|
| S1 | F1 | P1 | a |
| S1 | F1 | P2 | b |
| S1 | F2 | P1 | b |
| S1 | F2 | P2 | c |
| S2 | F1 | P1 | c |
| S2 | F1 | P2 | d |
| S2 | F2 | P1 | d |
| S2 | F2 | P2 | e |

| Read | Low occurrence |
|---|---|
| a | a |
| b | a |
| c | b |
| d | c |
| e | d |

### 6.6 Safety integrity level matrix

IEC 62061 [3], Annex A, Table A.6: the required safety integrity level of a safety function, read from Se crossed with the class Cl, the sum of Fr, Pr and Av. Se scores 1 to 4, Fr and Pr 1 to 5 and Av 1, 3 or 5; which score a situation takes is the standard's own guidance, and is the modeller's reading of it. OM is the standard's abbreviation for other measures, and No SIL says the matrix requires no level there. A function designed to EN IEC 62061 stores the four, and the level is computed.

| Severity | Cl 3 – 4 | Cl 5 – 7 | Cl 8 – 10 | Cl 11 – 13 | Cl 14 – 15 |
|---|---|---|---|---|---|
| 4 | SIL 1 | SIL 2 | SIL 2 | SIL 3 | SIL 3 |
| 3 | No SIL | OM | SIL 1 | SIL 2 | SIL 3 |
| 2 | No SIL | No SIL | OM | SIL 1 | SIL 2 |
| 1 | No SIL | No SIL | No SIL | OM | SIL 1 |

## 7. References

| No. | Reference | Link |
|---|---|---|
| [1] | ISO/TR 14121-2:2012, Safety of machinery — Risk assessment — Part 2: Practical guidance and examples of methods | |
| [2] | ISO 13849-1:2023, Safety of machinery — Safety-related parts of control systems — Part 1: General principles for design | |
| [3] | IEC 62061:2021, Safety of machinery — Functional safety of safety-related control systems | |
