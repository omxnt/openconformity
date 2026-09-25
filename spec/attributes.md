# Attributes

This document specifies the attributes each entity type carries. The metamodel defines the types and how they relate, and this document defines what data each one holds. An attribute not recorded here is not part of the model.

## 1. Conventions

### 1.1 Identifier

Each entity type has an identifier which is generated and read only, so it is not an attribute: a file carries it beside the attributes rather than among them. The editor shows it as the first cell of the type's own tab, in the field's read-only state in either mode, beside the reference where the type carries one, and explains it on the information glyph beside its name with the help §1.9 records.

### 1.2 Optional

Every attribute is optional, and every value is stored as text. An unset attribute is the absence of its key; clearing a choice removes the key. A computed attribute is the one exception: derived from the attributes beside it wherever it is shown, it is never stored.

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
| drawing | A picture held as SVG text, accepted only after the check §1.8 describes and shown only as an image, never as markup |
| date | A calendar date, stored as its year, month and day, 2026-09-24 |
| table | Rows of columns, the columns the rows beneath it define, each keyed by the table's key, a dot and its own, and each a text, a multiline, a date, a choice or a number; stored as one line per row with the cells parted by tabs, in column order, a cell holding a tab, a break or a quotation mark quoted as a CSV cell is, a row with every cell empty dropped |
| computed | A value derived from the fields beside it by the method the Values column names: shown, never stored |
| rationale | The reasoning behind the parameter of the same rating whose key the Values column names, free text of any length for why its class was chosen, shown with the parameter's value (§1.8) |
| entities | The identifiers of entities related to the entity by the relationship type the Values column names first, as they stood when the attributes of the group the column names second last changed, its rationales, outcomes and records aside; written by the software, never typed, stored separated by semicolons in ascending order, and shown as tags marked where a relationship has since been removed, an entity deleted, or an entity related that the record does not name (§1.8) |

### 1.4 Groups

The editor may present a type's attributes in groups. Each group is its own sub-heading and table under the type, in render order: an ungrouped table comes first where a type has one, then each named group under its name. A group may hold sub-groups, one level deep, under `#####` headings, each carrying the tags a group can; a type's keys are unique across all of its tables. Group names are display vocabulary, stored in no file.

A group is a heading over its cells, within the tab it stands in. A group whose heading carries the tag `tab` stands instead on a tab of its own, named for the group, as §1.8 lays out.

A group whose heading carries the tag `when key = value` is shown only while the attribute of that key holds that value, and what it holds is kept only then: a save made while the group is hidden removes what it held, so a rating made under one method does not ride along under another and an entity carries one at a time. Until the save nothing is lost, and Cancel keeps everything; a save that would remove what a hidden group still holds asks first, naming the groups by the value they stood under. The key may instead name an attribute of the project (§1.10) where the type has none of that key; the group then waits on the project's choice, which changes on the project's own form, and saving the project removes what every entity held under the old choice, asking first with their count. Sub-groups sharing a name and waiting on the same attribute are one slot, a cell held whichever of them holds; while none does, the slot shows in the value's place that nothing is chosen for the attribute it waits on — as a disabled field in an edit — so the form keeps its shape. A variant may instead wait on nothing chosen, `when key =` with no value after it, and then holds while the attribute is unset; such a slot needs no holder, that variant standing in its place. A group's sub-groups stand after its attributes, in their order; where one of them waits on an attribute of the group, they stand right after that attribute, so what a choice governs stands under the choice. Where one choice governs more than one slot, a sub-group's heading may carry a second tag, `after key`, to stand after that attribute instead.

### 1.5 Status

Each entity type shall carry a status tag.

| Tag | Meaning |
|---|---|
| `draft` | Newly written, or still being worked on. |
| `stable` | Settled as written, and not expected to change. |

### 1.6 Template

Each entity type is written using the template below. A table may add a fifth column, Help, holding a sentence or two the editor shows on the information glyph beside the name (§1.8); a row with none shows no glyph.

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

An entity whose Applicable is No, or whose Eliminated is Yes, is excluded: considered and set out of play by a decision. It stays in the model, related and selectable as any other, and the tree greys it out and says so to a screen reader. One grey runs through the interface for everything out of play, by decision or for the moment: Carbon's disabled quarter, the strength a disabled control wears, on an excluded entity, on a tree row not offered while picking, on a list row receding while picking and on a graph edge that is not a pick. The quarter stands below the contrast floor for text, which is accepted on purpose so that out of play reads at a glance, the row staying selectable and the editor showing it at full strength.

### 1.8 Layout

The editor lays a type's attributes out as Carbon lays out a form, in the order this document records them: each attribute its name over its field, two to a row. The identifier stands first, and the reference — or the designation — beside it; the title, a multiline, a hyperlink and a set each take a row to themselves, and a record takes a row where it stands alone in its group and shares one where another attribute stands beside it. View mode is the form's read-only state, as Carbon patterns it: the same structure and spacing as the editable form, each field's ground turned transparent and its rule made subtle, so entering an edit changes what the fields afford and nothing about where they stand. Every name reads at the one size and every value at the one size; nothing in the pane is a heading, the pane's head carrying the type, the identifier and the label already. A choice reads as a tag, a set as the tags chosen — in an edit, a field saying how many and which, opening Carbon's multiselect of every value with its checkbox — and a hyperlink as a link. A date is a field with the browser's own picker, and reads as the date it holds. A drawing reads as the picture on a white card in either theme, shown as an image so that the browser grants it no script, no document and no network, opened at full size on a click in a passive dialog closed by its X, Escape or a click outside, its size beneath, and where there is none the tab says so in helper text, with no field around either; in an edit, Carbon's ghost buttons Create in draw.io or Edit in draw.io open the external editor and the ghost Delete, in the danger colour, clears the drawing, which enters the draft as a set does. The editor runs in a sandboxed frame on its own origin, after the consent the requirements ask for on every edit unless the user chose, in that dialog, not to be asked again this session; the drawing being edited is handed to it and nothing else. Before what it returns is accepted, and again before any drawing is shown, the drawing is checked: an SVG document within 512 kilobytes, declaring no entities, linking no stylesheet, holding no element that runs code or embeds a document and no event handler, referencing nothing outside itself, and no larger than 16,384 units a side; one that fails is refused with the reason, or, already stored, shown as the reason in the picture's place and kept unchanged. What the editor returns must also carry its own model inside, which is what lets the next edit open it again, and hold one page, the editor's page bar being hidden and a model of more pages refused, since the picture shows one; the stored text is what the editor returned, never re-serialised. The editor is told, when it asks to be configured, to hide by one rule, that nothing enters or leaves as a file and nothing opens a window: its import, export, print and help, what would publish or share the diagram, what loads code or changes what loads, and what names a file that is not there; page setup and Edit Diagram stay, the latter being where the model's own XML is read and pasted, the one way a diagram travels between here and draw.io. The page bar is hidden by style while the model holds one page and shows as soon as it holds more, so a page slipped in by pasted XML can be removed before Apply, which refuses more than one. A picture placed in the diagram becomes data twice over, in the model and in the SVG, each a third larger than the file, so the editor takes none above 128 kilobytes, an eighth of the drawing size limit. Cancel with changes made in the editor asks before discarding them. An editor that does not load says so with the drawing unchanged, and a drawing refused on return, or not returned in time, leaves the editor open with the reason, to be amended and applied again. The About dialog shows the session's choice, with Forget. A table reads as its rows, numbered, under the column names, a choice in a cell as a tag, a multiline keeping its breaks, an empty cell as the dash, a date, a choice or a number column as wide as its values, a text column brief, and a multiline column taking the rest; in an edit each row's cells are fields, a multiline a text area growing as it is typed, a button at the row's end removes it, and Carbon's ghost Add beneath adds a row and focuses its first cell. A table takes a row to itself, as a multiline does, and one with no rows says so in helper text, as a drawing without one does, with no field around either. Fields are the compact 32-pixel size throughout, matching the density of the rest of the interface. A name carries Carbon's information glyph where its table gives help: a small button whose tooltip, on hover or focus, holds the sentence or two the Help column records. A name shared by several types carries the help §1.9 records once. A choice, a number or a date is given a narrow field rather than the cell's width: a field's width says what length of value is expected.

A type's own attributes stand on the first tab, named for the type by the last word of its name — Legislation, Requirement, Function — and each group tagged `tab` on a tab of its own, named for the group: a tab is earned by a distinct task, such as a verdict or an estimate, or by a set of fields about a distinct concern, never by a single text and never by the identity alone. Every type closes with a Notes tab, one multiline field for what fits nowhere else, so every pane has its tab bar. The tabs are Carbon's line tabs at the navigator filter bar's height. The tab chosen stands for the rest of the browser session, by type, so the next entity of the type opens on the same tab, and choosing a tab leaves an open edit as it is: what stands on another tab is still part of the draft. A group carrying no tag stands within its tab as a legend over its cells, unless it holds a single attribute, which then stands on its own.

A group that closes on a computed attribute is a rating, a cell like any other: its name, then what the rating comes to and the code of each parameter set, as tags — a code being a value's first word, and its second where the first holds no digit, or for a number the initials of its name before it, SS 95. Outside an edit every tag is a button whose tooltip, shown on hovering or focusing it as the help glyph's tooltip is, says what the tag stands for, the parameter's name and full value or the attribute the rating computes and what it comes to, Risk level: High; within an edit, where the whole cell is a button, a tag says the same by the browser's own tooltip. What the rating comes to wears Carbon's status, error for high, warning for medium, the check for low and the check in the secondary colour for negligible, whichever method's word says so, a level, an index's band or a score's category. Each parameter may carry a rationale, a `rationale` kind naming the parameter in its Values column, free text of any length for why that class was chosen; a tag whose parameter has one is underlined, and its tooltip carries the reasoning beneath the lead, so the tags stay the rating's whole face. In an edit the cell is a field that opens the rating's dialog, titled by the rating and the method, and laid out alike for every method: each parameter as a row of its classes to press, one pressed at a time and pressed again to clear, or a field for its score with the table of its classes beneath, and under each a text area for its rationale, the parameters two to a row and the two areas of a row kept the same height; then the method's figure as chapter 6 lays it out, read-only, the matrix with the classes chosen marked and the cell they meet at, or the graph with the path they trace lit to the index it reaches; then, under the name of the attribute it computes, what the rating comes to. With no method chosen the slot is a text field instead, and the rating is typed.

### 1.9 Help

A name shared by several types means the same on each, so its help is recorded once, below, and every cell of that name carries it; a row's own Help column, where it has one, stands instead. The identifier's help stands here too, and so does the help of the names a rating's cell and its slot carry, shared by the variants under each method.

| Name | Help |
|---|---|
| Identifier | Assigned by the tool from the entity type's code and a running number, never changed and never reused. |
| Designation | A short name of your own, shown in the label before the title. |
| Notes | Anything worth keeping that no field holds, such as how something was assessed. |
| Link | Where it is published online. |
| Applicable | Whether it applies to this product. |
| Rationale | Why it applies, or why not. |
| Diagram | A diagram of it, made in draw.io and shown as an image. |
| Initial risk estimation | The risk before protective measures, estimated by the method chosen or typed where none is. |
| Residual risk estimation | The risk with the protective measures in place, estimated by the method chosen or typed where none is. |
| Required integrity level | The level the safety function must reach, in its standard's own terms. |

### 1.10 Project

The project is edited under the root of the tree, on the surface an entity has: its own tabs, Edit and Save. Its name is the model's own rather than an attribute, the file saved being named after it, and stands on the first tab, named Project, as a row of its own after the designation and the organisation; the rest are attributes of the project, stored in the project's own map beside the entities. The first tab identifies the project and the revision the file is. The Settings tab holds the choice the scenarios' ratings wait on (§1.4, §4.2): the risk estimation method they are rated by. A method names in its value the document, its year and the clause its example stands in, as a citation, so wherever the choice is shown, on the project, in the rating's dialog and in the views, a rating says by what and from where; the sources are chapter 6's. A safety function's standard is not the project's choice but the function's own (§4.4), a machine designed to one standard commonly holding a subsystem designed to another. A group of any type may wait on one of these keys (§1.4).

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| designation | Designation | text | | A short name or number of your own for the project. |
| organisation | Organisation | text | | Who the project is done by, or for. |
| description | Description | multiline | | What the project covers. |
| version | Version | text | | The revision this file is, as you number it. |
| date | Date | date | | When this revision was made. |
| author | Author | text | | Who prepared this revision. |
| role | Role | text | | The capacity in which the author prepared it. |
| changes | Changes | multiline | | What changed in this revision since the last. |

#### Settings `tab`

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| estimationMethod | Risk estimation method | choice | Risk matrix (ISO/TR 14121-2:2012, 6.2.2); Risk graph (ISO/TR 14121-2:2012, 6.3.2); Numerical scoring (ISO/TR 14121-2:2012, 6.4.2) | The method every scenario's initial and residual risk is rated by, or none to type them freely. Changing it removes the ratings made under the old one. |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

## 2. System Context

### 2.1 System Element (ELM) `draft`

The designation is the element's own short name — `E1` — entered by the modeller, and it is the reference the label composes with the title (§1.7). The facts a bought-in or a designed element carries beyond what it is stand on a tab of their own: who makes it, what model it is, where its datasheet is, and the figures that matter.

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Designation | text | | |
| title | Title | text | | The name of the system element. |
| description | Description | multiline | | What the system element is and what it does in the machinery. |

#### Data `tab`

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| manufacturer | Manufacturer | text | | Who makes the element, whether that is you, an original equipment manufacturer or a supplier. |
| model | Model | text | | The type or model name the manufacturer gives it. |
| datasheet | Datasheet | hyperlink | | Where the element's datasheet is on the web. |
| characteristics | Characteristics | multiline | | The figures that matter, such as speed, force, pressure, mass and temperature, in the element's own terms. |

#### Diagram `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| drawing | Diagram | drawing | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 2.2 System Actor (ACT) `draft`

The designation is the actor's own short name — `A1` — entered by the modeller, and it is the reference the label composes with the title (§1.7). What the role assumes of the person stands on a tab of its own, since it is true per role and not per task: what their body and mind allow, who is kept out, what they were trained in, what they can do, and how well they know the machinery.

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Designation | text | | |
| title | Title | text | | The name or role of the system actor. |
| description | Description | multiline | | Who the system actor is and how they interact with the machinery. |

#### Assumptions `tab`

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| abilities | Abilities | multiline | | What the role assumes the person can and cannot do in body and mind, such as sight, hearing, reach and strength. |
| restrictions | Restrictions | multiline | | Who may not take the role, by age, health or anything else. |
| training | Training | multiline | | What the person in the role is assumed to have been trained in. |
| competence | Competence | multiline | | What the person in the role is assumed to be able to do. |
| familiarity | Familiarity | multiline | | How well the person is assumed to know this or similar machinery and its hazards. |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 2.3 System Task (TSK) `draft`

The designation is the task's own short name — `T1` — entered by the modeller, and it is the reference the label composes with the title (§1.7). The conditions the task is done under stand on a tab of their own: where, how often, with what, and how it is foreseeably done other than intended, the last in the Regulation's own term.

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Designation | text | |
| title | Title | text | | The name of the system task. |
| description | Description | multiline | | What is done in the system task. |

#### Conditions `tab`

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| location | Location | text | | Where on or around the machinery the task is done. |
| frequency | Frequency | text | | How often the task is done, in your own words. |
| tools | Tools and equipment needed | multiline | | What is needed to do the task. |
| misuse | Reasonably foreseeable misuse | multiline | | How the task is foreseeably done other than intended. |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 2.4 System Phase (PHS) `draft`

The designation is the phase's own short name — `P1` — entered by the modeller, and it is the reference the label composes with the title (§1.7).

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Designation | text | | |
| title | Title | text | | The name of the system phase. |
| description | Description | multiline | | What happens to the machinery in the system phase. |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

## 3. Legislative Framework

### 3.1 European Legislation (LEG) `draft`

The reference is the act's citation in canonical form — `(EU) 2023/1230` for a regulation, `2006/42/EC` for a directive. It is load-bearing beyond display: an import will join on it, matching on the year and number at its core, so it is written as the act itself writes it and nothing else is put in the field. The title is the short human name the act is known by, and the link is the act's canonical online home. Applicable and the rationale carry the verdict and its reasoning: whether the act applies to this product at all, and the account of why — coverage, transition, exclusions — that a reader follows. Unset means unassessed, not ruled out.

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Reference | text | | The official number of the legislation, as cited. |
| title | Title | text | | The title of the legislation. |
| link | Link | hyperlink | | |

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

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Reference | text | | The designation of the standard, as cited. |
| title | Title | text | | The title of the standard, as published. |
| link | Link | hyperlink | | |

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

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Reference | text | | The number or designation of the specification, as cited. |
| title | Title | text | | The title of the specification. |
| link | Link | hyperlink | | |

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

The reference is the annex, module or part of the legislation the procedure follows, as cited, `Annex VI`, and it is the reference the label composes with the title (§1.7).

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Reference | text | | The annex, module or part of the legislation the procedure follows, as cited. |
| title | Title | text | | The name of the conformity assessment procedure. |
| description | Description | multiline | | What the conformity assessment involves for this product. |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 3.5 Notified Body (NTB) `draft`

The reference is the identification number the Commission lists the body under, as cited, `0123`, and it is the reference the label composes with the title (§1.7).

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Reference | text | | The identification number of the notified body, as cited. |
| title | Title | text | | The name of the notified body. |
| description | Description | multiline | | The role of the notified body for this product. |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

## 4. Risk Assessment

### 4.1 Single Hazard (HAZ) `draft`

The designation is the hazard's own short name — `H1` — entered by the modeller, and it is the reference the label composes with the title (§1.7). The Elimination tab records the decision the Regulation's first principle asks for: whether the hazard was designed out, or considered and kept, with the rationale either way. Eliminated on the hazard is the fact and a measure that eliminates the hazard is the trace to what did it, and neither requires the other, so a hazard is marked without a measure and a measure related without the mark. The measures related as eliminating the hazard when Eliminated was last set are recorded beside it, as a scenario records the measures its residual risk was rated against, and marked where one has since been unlinked, deleted, or related after the decision, the last of which, after a No, is the sign that the decision wants revisiting.

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Designation | text | | |
| title | Title | text | | The name of the hazard. |
| description | Description | multiline | | Where the hazard arises and how it could cause harm. |

#### Elimination `tab`

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| measures | Protective measures | entities | prm-eliminates-haz; Elimination | The protective measures related as eliminating the hazard when Eliminated was last set, recorded by the software. |
| eliminated | Eliminated | choice | Yes; No | Whether the hazard has been designed out, or considered and kept. |

##### Rationale

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| rationale | Rationale | multiline | | Why the hazard counts as eliminated, or why it could not be. |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 4.2 Accident Scenario (SCN) `draft`

The designation is the scenario's own short name — `S1` — entered by the modeller, and it is the reference the label composes with the title (§1.7). The scenario is rated by the risk estimation method the project chooses (§1.10), one of the three chapter 6 transcribes from ISO/TR 14121-2, so every scenario is rated the same way: each method's parameters stand in a pair of groups waiting on the project's choice (§1.4), once for the initial risk and once for the residual risk, side by side, each parameter with a rationale of its own for why its class was chosen, and with no method chosen a pair of text fields stands in their place, the ratings then typed in whatever terms the assessment uses. What a rating comes to — its level, index or score — is computed where it is shown and never stored; a typed rating is stored as typed. The protective measures reducing the scenario's risk are its relationships, shown by the relationship pane and the risk assessment view. The tab records which of them stood related when the residual risk was rated, an `entities` attribute the software writes whenever the residual rating changes in an edit, so the rating and the measures it was made against are read together, and a measure since unlinked or deleted, or one related since, is marked as such where the record is shown. Until the residual risk is rated the field shows the measures related now, unmarked. The two ratings are made in any order. The tab closes on the risk evaluation, the modeller's own judgement whether the residual risk is adequately reduced and why. On the scenario's own tab the hazardous event and the potential consequence are the modeller's own text; what the scenario arises from is not a field but its relationships, the hazards contributing to it, the actors exposed in it and the tasks giving rise to it, which the risk assessment view lays out beside it.

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Designation | text | | |
| title | Title | text | | The name of the accident scenario. |
| hazardousEvent | Hazardous event | multiline | | What goes wrong in the accident scenario and sets the harm in motion. |
| consequence | Potential consequence | multiline | | The harm the accident scenario could result in. |

#### Risk `tab`

##### Initial risk estimation `when estimationMethod = Risk matrix (ISO/TR 14121-2:2012, 6.2.2)`

| Key | Name | Kind | Values |
|---|---|---|---|
| initialSeverity | Severity | choice | Catastrophic; Serious; Moderate; Minor |
| initialSeverityRationale | Severity rationale | rationale | initialSeverity |
| initialProbability | Probability | choice | Very likely; Likely; Unlikely; Remote |
| initialProbabilityRationale | Probability rationale | rationale | initialProbability |
| initialLevel | Risk level | computed | Risk matrix (ISO/TR 14121-2:2012, 6.2.2) |

##### Initial risk estimation `when estimationMethod = Risk graph (ISO/TR 14121-2:2012, 6.3.2)`

| Key | Name | Kind | Values |
|---|---|---|---|
| initialS | Severity | choice | S1; S2 |
| initialSRationale | Severity rationale | rationale | initialS |
| initialF | Exposure | choice | F1; F2 |
| initialFRationale | Exposure rationale | rationale | initialF |
| initialO | Occurrence | choice | O1; O2; O3 |
| initialORationale | Occurrence rationale | rationale | initialO |
| initialA | Avoidance | choice | A1; A2 |
| initialARationale | Avoidance rationale | rationale | initialA |
| initialIndex | Risk index | computed | Risk graph (ISO/TR 14121-2:2012, 6.3.2) |

##### Initial risk estimation `when estimationMethod = Numerical scoring (ISO/TR 14121-2:2012, 6.4.2)`

| Key | Name | Kind | Values |
|---|---|---|---|
| initialSeverityScore | Severity score | number | 0; 100 |
| initialSeverityScoreRationale | Severity rationale | rationale | initialSeverityScore |
| initialProbabilityScore | Probability score | number | 0; 100 |
| initialProbabilityScoreRationale | Probability rationale | rationale | initialProbabilityScore |
| initialScore | Risk score | computed | Numerical scoring (ISO/TR 14121-2:2012, 6.4.2) |

##### Initial risk estimation `when estimationMethod =`

| Key | Name | Kind | Values |
|---|---|---|---|
| initialRating | Initial risk estimation | text |  |

##### Residual risk estimation `when estimationMethod = Risk matrix (ISO/TR 14121-2:2012, 6.2.2)`

| Key | Name | Kind | Values |
|---|---|---|---|
| residualSeverity | Severity | choice | Catastrophic; Serious; Moderate; Minor |
| residualSeverityRationale | Severity rationale | rationale | residualSeverity |
| residualProbability | Probability | choice | Very likely; Likely; Unlikely; Remote |
| residualProbabilityRationale | Probability rationale | rationale | residualProbability |
| residualLevel | Risk level | computed | Risk matrix (ISO/TR 14121-2:2012, 6.2.2) |

##### Residual risk estimation `when estimationMethod = Risk graph (ISO/TR 14121-2:2012, 6.3.2)`

| Key | Name | Kind | Values |
|---|---|---|---|
| residualS | Severity | choice | S1; S2 |
| residualSRationale | Severity rationale | rationale | residualS |
| residualF | Exposure | choice | F1; F2 |
| residualFRationale | Exposure rationale | rationale | residualF |
| residualO | Occurrence | choice | O1; O2; O3 |
| residualORationale | Occurrence rationale | rationale | residualO |
| residualA | Avoidance | choice | A1; A2 |
| residualARationale | Avoidance rationale | rationale | residualA |
| residualIndex | Risk index | computed | Risk graph (ISO/TR 14121-2:2012, 6.3.2) |

##### Residual risk estimation `when estimationMethod = Numerical scoring (ISO/TR 14121-2:2012, 6.4.2)`

| Key | Name | Kind | Values |
|---|---|---|---|
| residualSeverityScore | Severity score | number | 0; 100 |
| residualSeverityScoreRationale | Severity rationale | rationale | residualSeverityScore |
| residualProbabilityScore | Probability score | number | 0; 100 |
| residualProbabilityScoreRationale | Probability rationale | rationale | residualProbabilityScore |
| residualScore | Risk score | computed | Numerical scoring (ISO/TR 14121-2:2012, 6.4.2) |

##### Residual risk estimation `when estimationMethod =`

| Key | Name | Kind | Values |
|---|---|---|---|
| residualRating | Residual risk estimation | text |  |

##### Protective measures

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| measures | Protective measures | entities | prm-reduces-risk-of-scn; Residual risk estimation | The protective measures related to the scenario when its residual risk was rated, recorded by the software. |

##### Risk evaluation

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| evaluation | Risk evaluation | multiline | | Your judgement whether the accident scenario's residual risk is acceptable, and why. |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 4.3 Protective Measure (PRM) `draft`

The designation is the measure's own short name — `M1` — entered by the modeller, and it is the reference the label composes with the title (§1.7). The step is the one of the three the Regulation orders in Annex III 1.1.2, under names of our own: a safe design removes the hazard or holds it back by the design itself, protection is something added that stands between a hazard that remains and the person, a guard, a device, an emergency stop, an isolation or a safety function, and information tells the user of what is left, in the instructions, on the machinery or through training and protective equipment. The test is what happens if the measure fails: in the first step nothing, since the hazard is gone, in the second the hazard reaches the person, and in the third only the person's own care stood there. The kind beside the step is the modeller's own word for what the measure is, a fixed guard, a warning label, operator training, so the finer sort a project sorts its measures by is its own and not a list's.

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Designation | text | | |
| title | Title | text | | The name of the protective measure. |
| step | Step | choice | Safe design; Protection; Information | Which of the three risk reduction steps the measure is, a design that removes the hazard, protection against a risk that remains, or information to the user about what is left. |
| kind | Kind | text | | What kind of measure it is, in your own words, such as a guard, a device, a label or training. |
| description | Description | multiline | | What the protective measure is and how it reduces the risk. |

#### Diagram `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| drawing | Diagram | drawing | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 4.4 Safety Function (SAF) `draft`

The designation is the function's own short name — `SF1` — entered by the modeller, and it is the reference the label composes with the title (§1.7): `SF1 Emergency Stop`. The tabs follow one rule: a sentence about what happens stands on a story tab, Behaviour for the nominal path and Fault handling for the faulty one, and a quantity or an interface stands on Characteristics. So the tabs read: what it is, what it does, what it must achieve in numbers, and what it does when it fails. On Behaviour, operator feedback says how the function makes itself known to the operator, and muting or override, before the way back, whether and how it can be suspended, muted or overridden, in whichever form the design has, and under what conditions. On Fault handling, the faults to be detected say which faults in the function's parts must not go unnoticed, and the means of detection how they are found, a proof test at an interval among them where one is needed; fault reaction says what the function does once a fault is found and the state it brings the machinery to, the same for any fault or fault by fault, the state kept within the reaction rather than in a field of its own because reactions differ by fault, one fault only flagged, another degrading operation, another going to the intended safe state and another to a different one, a function that brakes to a standstill on demand perhaps only cutting power and coasting on a fault, so that a list of reactions carries its states line by line instead of a reader matching two lists; the two times run from the fault occurring to its detection and from detection to the state the reaction brings the machinery to, stopping included, their sum being what the person at the machine feels; fault indication says how a found fault is made known, fault recovery whether it latches or clears itself, when and how it may be reset, and how the function returns to service, the fault path's counterpart of the restart conditions on Behaviour; and power disturbances what the function does when its supply goes, returns or fluctuates, on its own because the function cannot react to a lost supply by its own logic, whereas a lost communication is a fault like any other, detected and reacted to. The technologies follow those ISO 13849-1 names in its scope, software standing for the programmable electronic among them, with, beside them, optoelectronic for sensing by light, configurable for a controller parameterised rather than programmed, networked for signals over a wired safety network and wireless for those over radio; the set does not classify the parts so much as mark what the design and the requirements must take further, so a function spanning several carries them all. The functional safety standard is the function's own choice, since a machine designed to one standard commonly holds a subsystem designed to another; the level the function requires is chosen in the one slot beside it, among the standard's own levels, under the one name Required integrity level whichever standard's term it is. The two standards offered are the harmonised ones for machinery; with none chosen the slot takes the level as text, in whatever terms the design uses, another standard being named in the specific design targets or the notes until it earns a place in the list. How the level was arrived at, by the standard's own method read on paper, by a type-C standard or by a specification, is noted on the Notes tab, as its help invites. What the standard requires of the design beyond the level — a structure, a fault tolerance, a failure rate, a software level, a proof test — differs from standard to standard and is complete for none of them as fields, so it stands in one text, the specific design targets, in the standard's own terms rather than in fields that would fit one standard and not the next. Response time runs from a demand to the function's output and stopping time from there until hazardous motion has stopped, the two adding up to what a safety distance needs; the external interfaces and the independence and separation say what the function exchanges and what it must stay apart from, and the measures against defeating how it resists being bypassed or disabled, by a person working around it or by a mistake; the environmental conditions are those the parts carrying the function must work in, noted on the function because the specification is read as one, though a function is what the system does rather than what can be touched. Fault handling is self-contained: everything about faults, the two times and the supply included, stands there.

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Designation | text | | |
| title | Title | text | | The name of the safety function. |
| description | Description | multiline | | What the safety function is for. |

#### Behaviour `tab`

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| priority | Priority | text | | The priority of the safety function when functions conflict. |
| operatingMode | Operating mode | text | | The operating modes in which the safety function is active. |
| trigger | Triggering event | multiline | | What starts the safety function. |
| reaction | Safety-related reaction | multiline | | What the safety function does when triggered to reach the safe state. |
| safeState | Intended safe state | multiline | | The state the safety function brings the machinery to. |
| feedback | Operator feedback | multiline | | How the safety function makes itself known to the operator, such as lights, messages or sounds. |
| muting | Muting or override | multiline | | Whether and how the safety function can be suspended, muted or overridden, and under what conditions. |
| restart | Restart conditions | multiline | | What must hold before the safety function resets and operation resumes. |

#### Characteristics `tab`

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| standard | Functional safety standard | choice | EN ISO 13849-1:2023; EN IEC 62061:2021 | The standard the safety function is designed to, which sets the levels offered, or none to type the level freely. |
| designTargets | Specific design targets | multiline | | What the standard requires of the safety function's design beyond the level, such as a structure, a fault tolerance, a failure rate or a software level, in its own terms. |
| responseTime | Response time | text | | How long from a demand to the safety function's output. |
| stoppingTime | Stopping time | text | | How long from the safety function's output until hazardous motion has stopped. |
| technology | Implementing technology | set | Mechanical; Hydraulic; Pneumatic; Electrical; Electronic; Optoelectronic; Software; Configurable; Networked; Wireless | The technologies the safety function is built with, each a heading for the design and the requirements that follow. |
| interfaces | External interfaces | multiline | | The signals and services the safety function exchanges with other functions or systems. |
| independence | Independence and separation | multiline | | What the safety function must keep independent of, or separated from, the nominal control or other functions, and how. |
| defeating | Measures against defeating | multiline | | How the safety function resists being bypassed, disabled or fooled, whether on purpose or by mistake. |
| environment | Environmental conditions | multiline | | The conditions the parts carrying the safety function must work in. |

##### Required integrity level `when standard = EN ISO 13849-1:2023`

| Key | Name | Kind | Values |
|---|---|---|---|
| plr | Required integrity level | choice | PL a; PL b; PL c; PL d; PL e |

##### Required integrity level `when standard = EN IEC 62061:2021`

| Key | Name | Kind | Values |
|---|---|---|---|
| sil | Required integrity level | choice | SIL 1; SIL 2; SIL 3 |

##### Required integrity level `when standard =`

| Key | Name | Kind | Values |
|---|---|---|---|
| ownLevel | Required integrity level | text | |

#### Fault handling `tab`

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| faultsDetected | Faults to be detected | multiline | | Which faults in the safety function's parts must not go unnoticed. |
| detectionMeans | Means of detection | multiline | | How those faults are found and how often, such as by monitoring, checks or tests. |
| faultHandling | Fault reaction | multiline | | What the safety function does once a fault is found and the state it brings the machinery to, for any fault or fault by fault. |
| faultDetectionTime | Fault detection time | text | | How long from a fault occurring to its detection. |
| faultReactionTime | Fault reaction time | text | | How long from detection until the machinery reaches the state the reaction brings it to, stopping included. |
| faultIndication | Fault indication | multiline | | How a found fault is made known. |
| faultRecovery | Fault recovery | multiline | | Whether a fault latches or clears itself, when and how it may be reset, and how the safety function returns to service. |
| powerDisturbances | Power disturbances | multiline | | What the safety function does when its supply goes, returns or fluctuates. |

#### Diagram `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| drawing | Diagram | drawing | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

## 5. Requirements Definition

### 5.1 Essential Requirement (ESR) `draft`

The reference is the requirement's citation within the legislation that contains it — `1.3.7`, not the act's own citation — so it is scoped by its owner: an import joins on the owning legislation's reference together with this one. The title is the requirement's heading as the act prints it, and the requirement holds its text. The guidance holds what helps read the requirement, apart from the requirement's own text: the source names the document it is taken from, the section where in that document, and the guidance carries the text or the modeller's account of it. Applicable is the assessment verdict, and unset means the requirement has not been assessed yet: an unassessed requirement is not the same as one ruled out. The rationale carries the reasoning behind the verdict, and is what an assessor reads to follow the argument; it belongs with every verdict, and most of all with `No`.

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Reference | text | | The clause number of the essential requirement within the legislation. |
| title | Title | text | | The heading of the essential requirement. |
| requirement | Requirement | multiline | | The essential requirement as the legislation states it. |

#### Guidance `tab`

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| guidanceSource | Source | text | | Where the guidance comes from, such as an official guide, a standard, a commentary or yourself. |
| guidanceSection | Section | text | | The section of the source the guidance is taken from. |
| guidance | Guidance | multiline | | How to read and meet the essential requirement, whether a guide's advice, a commentary's or your own interpretation. |

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

The fields an essential requirement carries, scoped to the standard that holds it: the reference is the clause number within that standard — `5.4` — and an import joins on the standard's designation together with it. A standard's text is a copyright work, unlike the legislation's, so whether to record it under the requirement is the modeller's own call. A Guidance tab stands between the requirement and the verdict as on the essential requirement, for a guide's advice where one exists and for one's own interpretation of the clause where none does.

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Reference | text | | The clause number of the harmonised requirement within the standard. |
| title | Title | text | | The heading of the harmonised requirement. |
| requirement | Requirement | multiline | | The harmonised requirement in your own words, since a standard's text is copyrighted. |

#### Guidance `tab`

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| guidanceSource | Source | text | | Where the guidance comes from, such as an official guide, a standard, a commentary or yourself. |
| guidanceSection | Section | text | | The section of the source the guidance is taken from. |
| guidance | Guidance | multiline | | How to read and meet the harmonised requirement, whether a guide's advice, a commentary's or your own interpretation. |

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

The same fields again, scoped to the specification that holds it, with a Guidance tab like the essential requirement's.

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Reference | text | | The clause number of the requirement within the specification. |
| title | Title | text | | The heading of the requirement. |
| requirement | Requirement | multiline | | The requirement as the specification states it. |

#### Guidance `tab`

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| guidanceSource | Source | text | | Where the guidance comes from, such as an official guide, a standard, a commentary or yourself. |
| guidanceSection | Section | text | | The section of the source the guidance is taken from. |
| guidance | Guidance | multiline | | How to read and meet the requirement, whether a guide's advice, a commentary's or your own interpretation. |

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

The designation is the requirement's own short name — `R1` — entered by the modeller, and it is the reference the label composes with the title (§1.7). The type sorts the requirement into one of the five categories SEBoK's requirements article [2] gives, derived from the INCOSE Needs and Requirements Manual: function and performance, fit and operation, form, quality and compliance, named as the article names them so a reader recognises the source, their meaning the article's and not reproduced here; a set that touches every category is what the article calls complete, which is the prompt the choice gives a writer. Beside it the verification method says how the requirement is to be shown met, chosen when the requirement is written, before any verification exists; a verification records the method it was in fact carried out by, so the two can be compared. The rationale carries why the requirement exists, and is what a reader follows from the requirement back to what called for it.

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Designation | text | | |
| title | Title | text | | The name of the system requirement. |
| type | Type | choice | Function/Performance; Fit/Operational; Form; Quality; Compliance | The kind of requirement, whether what the system does and how well, how it fits and operates with its surroundings, its physical form, its qualities, or what it must comply with. |
| verificationMethod | Verification method | choice | Inspection; Analysis; Demonstration; Test | How the system requirement is to be verified. |
| description | Requirement | multiline | | What the system must do or be. |
| rationale | Rationale | multiline | | Why the system requirement exists. |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

### 5.5 System Verification (VER) `draft`

The designation is the verification's own short name — `V1` — entered by the modeller, and it is the reference the label composes with the title (§1.7). The verification method is the way the verification is carried out, one of the four the discipline names, and beside it the responsible party says who carries it out, a person, a department or an organisation. The verification setup holds what the verification is carried out with, the configuration of the system, the environment it stands in and the tools and instruments used, whichever the method, an analysis having its models and tools as a test has its rig. The verification procedure says what is done, and the acceptance criteria what counts as passing. The result tab records what happened each time the verification was carried out, a fact rather than a judgement: one row per run, when and by whom, whether it passed or failed, and remarks, among them the record the result rests on, where it is kept rather than the record itself, which belongs in the technical file; where a run was made is the verification setup's to say, and a run made elsewhere says so in its remarks. Every run is kept, a failed one beside the run that passed after it, and the last row is the verification's result. A verification not yet carried out has no rows.

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| reference | Designation | text | | |
| title | Title | text | | The name of the system verification. |
| method | Verification method | choice | Inspection; Analysis; Demonstration; Test | How the system verification is carried out. |
| responsible | Responsible party | text | | Who carries out the system verification, whether a person, a department or an organisation. |
| setup | Verification setup | multiline | | The configuration, environment and tools the system verification is carried out with. |
| description | Verification procedure | multiline | | What is done in the system verification, step by step. |
| acceptanceCriteria | Acceptance criteria | multiline | | What counts as passing the system verification. |

#### Result `tab`

| Key | Name | Kind | Values | Help |
|---|---|---|---|---|
| runs | Runs | table | | Each time the system verification was carried out, as a row: when and by whom, whether it met its acceptance criteria, and remarks, among them the record the result rests on. |
| runs.date | Date | date | | |
| runs.by | By | text | | |
| runs.result | Result | choice | Passed; Failed | |
| runs.remarks | Remarks | multiline | | |

#### Notes `tab`

| Key | Name | Kind | Values |
|---|---|---|---|
| notes | Notes | multiline | |

## 6. Risk estimation

An accident scenario is rated by one of the three methods ISO/TR 14121-2:2012 [1] gives as its examples, chosen on the project (§1.10), or by no method, the ratings then typed. Each method's parameters are attributes of the scenario, each with a rationale of the modeller's own beside it (§1.8); the level, index or score they come to is computed by the tables below wherever it is shown, and is never stored. Every parameter carries its source's classes alone, as codes or class names; the class definitions behind them are the source document's own, at the clause given, and are not reproduced here. The report's hybrid tool is not transcribed.

### 6.1 Risk matrix

ISO/TR 14121-2:2012, 6.2.2, Table 1: the severity across, the probability down. The dialog shows the table with the classes chosen marked and the cell they meet at.

| Probability | Catastrophic | Serious | Moderate | Minor |
|---|---|---|---|---|
| Very likely | High | High | High | Medium |
| Likely | High | High | Medium | Low |
| Unlikely | Medium | Medium | Low | Negligible |
| Remote | Low | Low | Negligible | Negligible |

### 6.2 Risk graph

ISO/TR 14121-2:2012, 6.3.2, Figures 3 and 4: severity S and exposure F down, occurrence O and avoidance A across, giving a risk index RI from 1 to 6, shown with the band the second table gives it. The dialog draws the graph from the table above, merged as the report merges it, a branch joined to its neighbour where the two reach the same indices whatever is chosen below them, F1 with F2 and O1 with O2 under S1: severity, exposure and occurrence as the tree, eight branches, and the avoidance as two columns of cells beside it, each cell the index that branch and that class reach with the dot of its band, one cell across both where the class makes no difference, so no line crosses another and nothing draws a distinction the report does not make; each code stands on its branch as a tag, the one chosen filled, as the form shows a choice, and the path the classes chosen trace lights to the cell it reaches.

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

ISO/TR 14121-2:2012, 6.4.2: the software adds the severity score SS and the probability score PS, each a whole number from 0 to 100, into the risk score RS, shown with the category the third table gives it; the first two say which class a score falls in, as the dialog lists beneath each score, the score's own class marked. The dialog takes digits alone for a score, kept within its bounds, with a dial to step it.

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

## 7. References

| No. | Reference | Link |
|---|---|---|
| [1] | ISO/TR 14121-2:2012, Safety of machinery — Risk assessment — Part 2: Practical guidance and examples of methods | |
| [2] | SEBoK, Guide to the Systems Engineering Body of Knowledge, System Requirements, categorising requirements, derived from the INCOSE Needs and Requirements Manual | https://sebokwiki.org/wiki/System_Requirements |
