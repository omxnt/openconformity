# Verification

This document states how each requirement in `specs/requirements.md` [1] is verified. Chapter 2 lists the verification activities, one row each, and chapter 3 maps each requirement to its activities with its coverage. Both are generated from the headers of the test blocks and from `tests/manual.md`, which holds the drives and the reviews, and neither is edited by hand. The security model in `docs/security.md` [2] cites activities by their id.

## 1. Conventions

### 1.1 Method

Each activity shall verify by one of the four methods of system verification [3], carried out by the technique named for it.

| Method | Technique | What it is |
|---|---|---|
| Test | Headless | A test in `tests/` that exercises behaviour, run by `./run.sh` in the JavaScriptCore shell. |
| Inspection | Pin | A block of `tests/test-pins.js` that reads the source, the page or the file list for a fact no behaviour test can reach. |
| Demonstration | Drive | The software opened in a browser and driven, by hand or by the headless Chrome driver. |
| Analysis | Review | A document, a file, a host setting or a history read against the requirement. |

### 1.2 Coverage

Each requirement shall carry the coverage that follows from the methods of its activities.

| Coverage | Meaning |
|---|---|
| Tested | Test or inspection settles the requirement. |
| Partly | Test or inspection settles part, and demonstration or analysis settles the rest. |
| Manual | Only demonstration or analysis settles it. |
| None | No activity exists yet. |

### 1.3 Identifier

Each activity shall have a unique identifier of the form `V-CLASS-NNN`, where the class names the method. Identifiers are append-only, so an activity that is removed is not reissued under the same identifier, and an activity that changes method takes a new one.

| Class | Method |
|---|---|
| `TST` | Test |
| `INS` | Inspection |
| `DEM` | Demonstration |
| `ANA` | Analysis |

### 1.4 Source

Each activity shall be written once, outside this document, with its identifier, what it checks and the requirements it verifies.

| Method | Written in | Form |
|---|---|---|
| Test, inspection | The header of its block in `tests/` | `// --- V-TST-001 Title (ID, ID) ---` |
| Demonstration, analysis | A row of `tests/manual.md` | Identifier, technique, where, what it checks, requirements |

### 1.5 Generation

Chapters 2 and 3 shall be generated from the sources of 1.4 by `tests/generate-verification.js`, run by `./run.sh` after the suite, and shall not be edited by hand. Chapter 2 lists each activity, and chapter 3 lists each requirement with its activities and its coverage.

## 2. Activities

### 2.1 Tests

| Id | Technique | Where | What it checks |
|---|---|---|---|
| V-TST-001 | Headless | [test-actions.js](../tests/test-actions.js) | The landing offers the three ways in and the help surface |
| V-TST-002 | Headless | [test-actions.js](../tests/test-actions.js) | The action list against a live store |
| V-TST-003 | Headless | [test-actions.js](../tests/test-actions.js) | Nothing acts while a diagram is open |
| V-TST-004 | Headless | [test-actions.js](../tests/test-actions.js) | Reorder stands down while the tree is filtered |
| V-TST-005 | Headless | [test-attributes.js](../tests/test-attributes.js) | Parse the document |
| V-TST-006 | Headless | [test-attributes.js](../tests/test-attributes.js) | The project |
| V-TST-007 | Headless | [test-attributes.js](../tests/test-attributes.js) | The shared help |
| V-TST-008 | Headless | [test-attributes.js](../tests/test-attributes.js) | The transcription |
| V-TST-009 | Headless | [test-attributes.js](../tests/test-attributes.js) | Lookups |
| V-TST-010 | Headless | [test-cascade.js](../tests/test-cascade.js) | Single owner |
| V-TST-011 | Headless | [test-cascade.js](../tests/test-cascade.js) | Ownership acyclicity |
| V-TST-012 | Headless | [test-cascade.js](../tests/test-cascade.js) | The deletion preview |
| V-TST-013 | Headless | [test-cascade.js](../tests/test-cascade.js) | Nested cascade |
| V-TST-014 | Headless | [test-cascade.js](../tests/test-cascade.js) | Deletion against filing |
| V-TST-015 | Headless | [test-cascade.js](../tests/test-cascade.js) | A folder takes what is filed in it |
| V-TST-016 | Headless | [test-drawing-editor.js](../tests/test-drawing-editor.js) | The origin and the frame |
| V-TST-017 | Headless | [test-drawing-editor.js](../tests/test-drawing-editor.js) | What is heard |
| V-TST-018 | Headless | [test-drawing-editor.js](../tests/test-drawing-editor.js) | Decoding an export |
| V-TST-019 | Headless | [test-drawing-editor.js](../tests/test-drawing-editor.js) | The session, against a fake frame |
| V-TST-020 | Headless | [test-drawing.js](../tests/test-drawing.js) | The parser |
| V-TST-021 | Headless | [test-drawing.js](../tests/test-drawing.js) | A real export is accepted, and carries its model |
| V-TST-022 | Headless | [test-drawing.js](../tests/test-drawing.js) | What is accepted |
| V-TST-023 | Headless | [test-drawing.js](../tests/test-drawing.js) | What is refused, and why |
| V-TST-171 | Headless | [test-drawing.js](../tests/test-drawing.js) | The gaps the October reviews found |
| V-TST-024 | Headless | [test-editor.js](../tests/test-editor.js) | The draft against the entity |
| V-TST-025 | Headless | [test-editor.js](../tests/test-editor.js) | A hyperlink is presented as a link only when it is a web address |
| V-TST-026 | Headless | [test-editor.js](../tests/test-editor.js) | The field helpers over the definitions |
| V-TST-027 | Headless | [test-editor.js](../tests/test-editor.js) | what a save removes, as the notice tells it |
| V-TST-028 | Headless | [test-editor.js](../tests/test-editor.js) | The measures a residual rating was made against |
| V-TST-029 | Headless | [test-example.js](../tests/test-example.js) | The example passes the gates a user's file passes |
| V-TST-030 | Headless | [test-example.js](../tests/test-example.js) | It is held in canonical form and round-trips byte-stable |
| V-TST-031 | Headless | [test-example.js](../tests/test-example.js) | The example is complete against the metamodel |
| V-TST-032 | Headless | [test-files.js](../tests/test-files.js) | Loading the valid fixture |
| V-TST-033 | Headless | [test-files.js](../tests/test-files.js) | Round-trip stability |
| V-TST-034 | Headless | [test-files.js](../tests/test-files.js) | Round-trip from a built model |
| V-TST-035 | Headless | [test-files.js](../tests/test-files.js) | The gates, in order |
| V-TST-036 | Headless | [test-files.js](../tests/test-files.js) | A file too deep is refused, and an error on opening is a refusal |
| V-TST-037 | Headless | [test-files.js](../tests/test-files.js) | A wide project saves in one pass |
| V-TST-038 | Headless | [test-files.js](../tests/test-files.js) | The blob path |
| V-TST-039 | Headless | [test-files.js](../tests/test-files.js) | The project's attribute bag rides the file |
| V-TST-040 | Headless | [test-flows.js](../tests/test-flows.js) | The landing, one action to a project |
| V-TST-041 | Headless | [test-flows.js](../tests/test-flows.js) | A pristine creation collapses on cancel |
| V-TST-042 | Headless | [test-flows.js](../tests/test-flows.js) | A saved-once entity survives cancel |
| V-TST-043 | Headless | [test-flows.js](../tests/test-flows.js) | The collapse falls back to one step when history moved |
| V-TST-044 | Headless | [test-flows.js](../tests/test-flows.js) | New related, one entry, and cancel removes both |
| V-TST-045 | Headless | [test-flows.js](../tests/test-flows.js) | Activation and the pointerless filing path |
| V-TST-046 | Headless | [test-flows.js](../tests/test-flows.js) | The project saves like an entity |
| V-TST-047 | Headless | [test-flows.js](../tests/test-flows.js) | Escape leaves the edit, asking only when it costs |
| V-TST-048 | Headless | [test-flows.js](../tests/test-flows.js) | A file holding hidden or unknown content is cleared and stated on opening |
| V-TST-049 | Headless | [test-flows.js](../tests/test-flows.js) | A file the browser cannot read is told, not opened |
| V-TST-050 | Headless | [test-flows.js](../tests/test-flows.js) | Save asks every time, and cancel costs nothing |
| V-TST-051 | Headless | [test-flows.js](../tests/test-flows.js) | A changed record marked reviewed |
| V-TST-052 | Headless | [test-flows.js](../tests/test-flows.js) | Every deletion asks first |
| V-TST-053 | Headless | [test-flows.js](../tests/test-flows.js) | Cancel asks like Escape when the draft is dirty |
| V-TST-054 | Headless | [test-flows.js](../tests/test-flows.js) | A view opens over the workspace and keeps the way back |
| V-TST-055 | Headless | [test-flows.js](../tests/test-flows.js) | Saving the project sweeps what entities held under the old choice |
| V-TST-056 | Headless | [test-flows.js](../tests/test-flows.js) | A save that removes what a choice no longer shows asks first |
| V-TST-057 | Headless | [test-flows.js](../tests/test-flows.js) | An import clears what the copies hold under choices not in force, after a question |
| V-TST-058 | Headless | [test-flows.js](../tests/test-flows.js) | A creation past the filing depth says why |
| V-TST-059 | Headless | [test-flows.js](../tests/test-flows.js) | An import into a project the checks refuse says why it did nothing |
| V-TST-060 | Headless | [test-flows.js](../tests/test-flows.js) | Clear browser data asks, then forgets |
| V-TST-061 | Headless | [test-flows.js](../tests/test-flows.js) | The set-aside copy saves to a file and can be discarded |
| V-TST-062 | Headless | [test-history.js](../tests/test-history.js) | The line |
| V-TST-063 | Headless | [test-history.js](../tests/test-history.js) | Counters outside snapshots |
| V-TST-064 | Headless | [test-history.js](../tests/test-history.js) | Name and relationships travel with the snapshot |
| V-TST-065 | Headless | [test-history.js](../tests/test-history.js) | Truncation |
| V-TST-066 | Headless | [test-history.js](../tests/test-history.js) | The entries are nobody else's |
| V-TST-067 | Headless | [test-history.js](../tests/test-history.js) | Snapshots carry the project's attributes |
| V-TST-068 | Headless | [test-icons.js](../tests/test-icons.js) | One distinct glyph per entity type |
| V-TST-069 | Headless | [test-library.js](../tests/test-library.js) | The catalogues the software ships |
| V-TST-070 | Headless | [test-library.js](../tests/test-library.js) | The picks |
| V-TST-071 | Headless | [test-library.js](../tests/test-library.js) | The plan and the copy |
| V-TST-072 | Headless | [test-library.js](../tests/test-library.js) | A project structure, folders alone |
| V-TST-178 | Headless | [test-library.js](../tests/test-library.js) | The acts the library ships, as About names them |
| V-TST-073 | Headless | [test-markdown.js](../tests/test-markdown.js) | A cell and its text |
| V-TST-074 | Headless | [test-markdown.js](../tests/test-markdown.js) | A document of tables |
| V-TST-169 | Headless | [test-markdown.js](../tests/test-markdown.js) | What a renderer would autolink or restructure is escaped |
| V-TST-075 | Headless | [test-metamodel.js](../tests/test-metamodel.js) | Parse the diagram |
| V-TST-076 | Headless | [test-metamodel.js](../tests/test-metamodel.js) | Parse the schema |
| V-TST-077 | Headless | [test-metamodel.js](../tests/test-metamodel.js) | Entity types |
| V-TST-078 | Headless | [test-metamodel.js](../tests/test-metamodel.js) | Relationship types |
| V-TST-079 | Headless | [test-model.js](../tests/test-model.js) | Creation |
| V-TST-080 | Headless | [test-model.js](../tests/test-model.js) | Creation from a file |
| V-TST-081 | Headless | [test-model.js](../tests/test-model.js) | Folders |
| V-TST-082 | Headless | [test-model.js](../tests/test-model.js) | Updates |
| V-TST-083 | Headless | [test-model.js](../tests/test-model.js) | Removing keys |
| V-TST-084 | Headless | [test-model.js](../tests/test-model.js) | Filing |
| V-TST-085 | Headless | [test-model.js](../tests/test-model.js) | Filing stays within the depth a file may hold |
| V-TST-086 | Headless | [test-model.js](../tests/test-model.js) | The children index agrees with the node list after every change |
| V-TST-087 | Headless | [test-model.js](../tests/test-model.js) | Sibling order |
| V-TST-088 | Headless | [test-model.js](../tests/test-model.js) | Relationships |
| V-TST-089 | Headless | [test-model.js](../tests/test-model.js) | Folder deletion |
| V-TST-175 | Headless | [test-model.js](../tests/test-model.js) | The owner index keeps a long chain cheap and never stale |
| V-TST-177 | Headless | [test-model.js](../tests/test-model.js) | An identifier already in the model is never issued twice |
| V-TST-090 | Headless | [test-navigator.js](../tests/test-navigator.js) | The rows |
| V-TST-091 | Headless | [test-navigator.js](../tests/test-navigator.js) | The project row |
| V-TST-092 | Headless | [test-navigator.js](../tests/test-navigator.js) | The project row collapses over the whole tree |
| V-TST-093 | Headless | [test-navigator.js](../tests/test-navigator.js) | The filter |
| V-TST-094 | Headless | [test-navigator.js](../tests/test-navigator.js) | The labels |
| V-TST-095 | Headless | [test-overlay.js](../tests/test-overlay.js) | A dialog is known wherever it stands in the stack |
| V-TST-096 | Headless | [test-overlay.js](../tests/test-overlay.js) | Escape goes to the top entry |
| V-TST-097 | Headless | [test-overlay.js](../tests/test-overlay.js) | The opener rides with its entry |
| V-TST-098 | Headless | [test-project.js](../tests/test-project.js) | What saving the project sweeps |
| V-TST-099 | Headless | [test-project.js](../tests/test-project.js) | What a file holds under choices not in force |
| V-TST-100 | Headless | [test-project.js](../tests/test-project.js) | What no definition presents |
| V-TST-101 | Headless | [test-queries.js](../tests/test-queries.js) | The offer follows the metamodel and the model |
| V-TST-102 | Headless | [test-queries.js](../tests/test-queries.js) | Composition narrows the offer |
| V-TST-103 | Headless | [test-queries.js](../tests/test-queries.js) | The full surface |
| V-TST-104 | Headless | [test-queries.js](../tests/test-queries.js) | The new-related offer |
| V-TST-105 | Headless | [test-queries.js](../tests/test-queries.js) | The move predicates |
| V-TST-106 | Headless | [test-queries.js](../tests/test-queries.js) | Every legal destination |
| V-TST-107 | Headless | [test-queries.js](../tests/test-queries.js) | The cascade question counts what it takes |
| V-TST-108 | Headless | [test-queries.js](../tests/test-queries.js) | A filter's one rule |
| V-TST-109 | Headless | [test-records.js](../tests/test-records.js) | What a record is |
| V-TST-110 | Headless | [test-records.js](../tests/test-records.js) | Whether a record was written |
| V-TST-111 | Headless | [test-records.js](../tests/test-records.js) | Where a record stands |
| V-TST-112 | Headless | [test-records.js](../tests/test-records.js) | The findings |
| V-TST-113 | Headless | [test-relationships.js](../tests/test-relationships.js) | The union candidate set |
| V-TST-114 | Headless | [test-relationships.js](../tests/test-relationships.js) | What a pair means |
| V-TST-115 | Headless | [test-relationships.js](../tests/test-relationships.js) | The grouped list |
| V-TST-116 | Headless | [test-relationships.js](../tests/test-relationships.js) | The picks as the table lands them |
| V-TST-117 | Headless | [test-relationships.js](../tests/test-relationships.js) | The tables, real and provisional together |
| V-TST-118 | Headless | [test-relationships.js](../tests/test-relationships.js) | The presented rows, sort and filter over the grouped order |
| V-TST-119 | Headless | [test-relationships.js](../tests/test-relationships.js) | The picks as provisional neighbours |
| V-TST-120 | Headless | [test-relationships.js](../tests/test-relationships.js) | The neighbourhood |
| V-TST-121 | Headless | [test-relationships.js](../tests/test-relationships.js) | The graph narrows to a filter, the subject staying |
| V-TST-122 | Headless | [test-relationships.js](../tests/test-relationships.js) | The messages table |
| V-TST-123 | Headless | [test-risk.js](../tests/test-risk.js) | The methods and their source |
| V-TST-124 | Headless | [test-risk.js](../tests/test-risk.js) | Risk matrix, 6.2.2 Table 1 |
| V-TST-125 | Headless | [test-risk.js](../tests/test-risk.js) | Risk graph, 6.3.2 Figures 3 and 4 |
| V-TST-126 | Headless | [test-risk.js](../tests/test-risk.js) | Numerical scoring, 6.4.2 Table 2 |
| V-TST-127 | Headless | [test-risk.js](../tests/test-risk.js) | Every method names its source |
| V-TST-172 | Headless | [test-risk.js](../tests/test-risk.js) | A rating reads its parameters as own keys only |
| V-TST-128 | Headless | [test-shell.js](../tests/test-shell.js) | The notices |
| V-TST-129 | Headless | [test-shell.js](../tests/test-shell.js) | The leave-prompt fires exactly when leaving costs something |
| V-TST-130 | Headless | [test-store.js](../tests/test-store.js) | A fresh session has no project |
| V-TST-131 | Headless | [test-store.js](../tests/test-store.js) | Commit records, persists and notifies |
| V-TST-132 | Headless | [test-store.js](../tests/test-store.js) | A burst of changes costs one write |
| V-TST-133 | Headless | [test-store.js](../tests/test-store.js) | Session state beside model state |
| V-TST-134 | Headless | [test-store.js](../tests/test-store.js) | A theme web storage refuses is no persistence failure |
| V-TST-135 | Headless | [test-store.js](../tests/test-store.js) | The persistence loop |
| V-TST-136 | Headless | [test-store.js](../tests/test-store.js) | A dirty session restores dirty |
| V-TST-137 | Headless | [test-store.js](../tests/test-store.js) | A blob that fails to load is set aside |
| V-TST-138 | Headless | [test-store.js](../tests/test-store.js) | A well-formed blob that fails the gates |
| V-TST-139 | Headless | [test-store.js](../tests/test-store.js) | A stale selection in the blob |
| V-TST-140 | Headless | [test-store.js](../tests/test-store.js) | A blob the previous generation kept in web storage is moved over |
| V-TST-141 | Headless | [test-store.js](../tests/test-store.js) | Picker mode is never persisted |
| V-TST-142 | Headless | [test-store.js](../tests/test-store.js) | The open view is session state with a way back |
| V-TST-143 | Headless | [test-store.js](../tests/test-store.js) | A failing persist |
| V-TST-144 | Headless | [test-store.js](../tests/test-store.js) | A browser without IndexedDB |
| V-TST-145 | Headless | [test-store.js](../tests/test-store.js) | The storage nearly full is told |
| V-TST-146 | Headless | [test-store.js](../tests/test-store.js) | The project row's expansion is session state |
| V-TST-147 | Headless | [test-store.js](../tests/test-store.js) | The splitter layout is session state |
| V-TST-148 | Headless | [test-store.js](../tests/test-store.js) | The view survives a reload, never a new session, never the blob |
| V-TST-149 | Headless | [test-store.js](../tests/test-store.js) | The tab chosen per type is the session's |
| V-TST-150 | Headless | [test-store.js](../tests/test-store.js) | Clear browser data forgets everything |
| V-TST-151 | Headless | [test-store.js](../tests/test-store.js) | The set-aside copy can be read back and discarded |
| V-TST-152 | Headless | [test-validator.js](../tests/test-validator.js) | The fixtures |
| V-TST-153 | Headless | [test-validator.js](../tests/test-validator.js) | The filing depth |
| V-TST-154 | Headless | [test-validator.js](../tests/test-validator.js) | A prototype key pollutes nothing |
| V-TST-155 | Headless | [test-validator.js](../tests/test-validator.js) | Keyword mutations |
| V-TST-176 | Headless | [test-validator.js](../tests/test-validator.js) | A counter the software cannot issue from is refused |
| V-TST-156 | Headless | [test-validator.js](../tests/test-validator.js) | The enumerations, behaviourally |
| V-TST-157 | Headless | [test-validator.js](../tests/test-validator.js) | The project's attribute bag |
| V-TST-170 | Headless | [test-validator.js](../tests/test-validator.js) | A prototype key is refused as an attribute key |
| V-TST-158 | Headless | [test-views.js](../tests/test-views.js) | The registry |
| V-TST-159 | Headless | [test-views.js](../tests/test-views.js) | The risk assessment over the example |
| V-TST-160 | Headless | [test-views.js](../tests/test-views.js) | Rated scenarios spread over parameter columns |
| V-TST-161 | Headless | [test-views.js](../tests/test-views.js) | The renderer's pure parts |
| V-TST-162 | Headless | [test-views.js](../tests/test-views.js) | Saved as an Excel workbook |
| V-TST-163 | Headless | [test-views.js](../tests/test-views.js) | The safety function specification over the example |
| V-TST-174 | Headless | [test-views.js](../tests/test-views.js) | A section name is trimmed without backtracking |
| V-TST-164 | Headless | [test-xlsx.js](../tests/test-xlsx.js) | The text as XML takes it |
| V-TST-165 | Headless | [test-xlsx.js](../tests/test-xlsx.js) | The names Excel accepts |
| V-TST-166 | Headless | [test-xlsx.js](../tests/test-xlsx.js) | The bytes |
| V-TST-167 | Headless | [test-xlsx.js](../tests/test-xlsx.js) | A sheet |
| V-TST-168 | Headless | [test-xlsx.js](../tests/test-xlsx.js) | The workbook |
| V-TST-173 | Headless | [test-xlsx.js](../tests/test-xlsx.js) | Sheet names and column widths hold on hostile values |

### 2.2 Inspections

| Id | Technique | Where | What it checks |
|---|---|---|---|
| V-INS-001 | Pin | [test-pins.js](../tests/test-pins.js) | The page states its content security policy first |
| V-INS-002 | Pin | [test-pins.js](../tests/test-pins.js) | No module builds or parses markup from text |
| V-INS-003 | Pin | [test-pins.js](../tests/test-pins.js) | The one frame, sandboxed, on the editor's origin |
| V-INS-004 | Pin | [test-pins.js](../tests/test-pins.js) | The page's keys yield to what is open |
| V-INS-005 | Pin | [test-pins.js](../tests/test-pins.js) | Nothing leaves the page but by a link the user follows |
| V-INS-006 | Pin | [test-pins.js](../tests/test-pins.js) | A drawing reaches the page as an image from a data address |
| V-INS-007 | Pin | [test-pins.js](../tests/test-pins.js) | Nothing is read from the address |
| V-INS-008 | Pin | [test-pins.js](../tests/test-pins.js) | Only the model changes filing, so its children index stays true |
| V-INS-009 | Pin | [test-pins.js](../tests/test-pins.js) | A view leaves the software as a saved file, never as a print |
| V-INS-010 | Pin | [test-pins.js](../tests/test-pins.js) | The way to report a vulnerability is published where tools look |
| V-INS-011 | Pin | [test-pins.js](../tests/test-pins.js) | The host sends the policy and the headers the page cannot |
| V-INS-012 | Pin | [test-pins.js](../tests/test-pins.js) | The software is static files of the web platform |
| V-INS-013 | Pin | [test-pins.js](../tests/test-pins.js) | The file surface stays on the baseline |
| V-INS-014 | Pin | [test-pins.js](../tests/test-pins.js) | The shipped data opens without a question |
| V-INS-015 | Pin | [test-pins.js](../tests/test-pins.js) | The licences ride with the software |
| V-INS-016 | Pin | [test-pins.js](../tests/test-pins.js) | No standard's content is transcribed |
| V-INS-017 | Pin | [test-pins.js](../tests/test-pins.js) | Every glyph drawn is in the sprite, with its provenance |
| V-INS-018 | Pin | [test-pins.js](../tests/test-pins.js) | The ways into a project are the actions themselves |
| V-INS-019 | Pin | [test-pins.js](../tests/test-pins.js) | Pane headers are landmarks |
| V-INS-020 | Pin | [test-pins.js](../tests/test-pins.js) | The pre-paint theme script speaks the store's literals |
| V-INS-021 | Pin | [test-pins.js](../tests/test-pins.js) | The minimum viewport |
| V-INS-022 | Pin | [test-pins.js](../tests/test-pins.js) | Pointer targets |
| V-INS-023 | Pin | [test-pins.js](../tests/test-pins.js) | Text carries AA contrast in both themes |
| V-INS-024 | Pin | [test-pins.js](../tests/test-pins.js) | The typefaces, vendored and applied |

### 2.3 Demonstrations

| Id | Technique | Where | What it checks |
|---|---|---|---|
| V-DEM-001 | Drive | The software in a browser | Pane headers are landmarks. Open a project and find the shell bar, the navigator at full height, and the editor over the relationship pane |
| V-DEM-002 | Drive | The software in a browser | The minimum viewport. Narrow the window below 1000 pixels and find the notice |
| V-DEM-003 | Drive | The software in a browser | The tests use an in-memory stand-in for browser storage. Reload the page and find the project, the selection and the expansion |
| V-DEM-004 | Drive | The software in a browser | Make a change, reload, and find it kept |
| V-DEM-005 | Drive | The software in a browser | Clear browser data asks, then forgets. Clear browser data forgets everything. Clear stored data, then find no record in the database and no session key in the storage inspector |
| V-DEM-006 | Drive | The software in a browser | Select an entity in the tree and find its attributes in the editor pane |
| V-DEM-007 | Drive | The software in a browser | at , , , , , . at , , , , . Open each view, save it in every format it offers, and open the saved files |
| V-DEM-008 | Drive | The software in a browser | Create a drawing in the real editor, apply it, save the entity and edit it again. Press the editor's save shortcut once and find the drawing taken |
| V-DEM-009 | Drive | The software in a browser | The page states its content security policy first. Nothing leaves the page but by a link the user follows. With the network panel open, load and work, and find requests to the host only until the editor is opened |
| V-DEM-010 | Drive | The software in a browser | The tab chosen per type: the session's. Create a drawing and find the dialog naming the origin and the diagram |
| V-DEM-011 | Drive | The software in a browser | The tab chosen per type: the session's. Tick the box, open About, press Forget, and find the dialog on the next edit |
| V-DEM-012 | Drive | The software in a browser | Walk every row of `docs/shortcuts.md` with the pointer unused |
| V-DEM-013 | Drive | The software in a browser | The minimum viewport. Work at 1000 by 356 pixels and find every pane usable |
| V-DEM-014 | Drive | The software in a browser | The file surface stays on the baseline. The pre-paint theme script speaks the store's literals. A browser without IndexedDB. Run the example and a drawing in the current Chrome, Edge, Firefox and Safari |
| V-DEM-015 | Drive | The software in a browser | Open a project and select nothing. The relationship pane keeps its head, with the Graph and List tabs, the filter and Add relationship disabled and the collapse button working, over the empty state that asks for an entity |

### 2.4 Analyses

| Id | Technique | Where | What it checks |
|---|---|---|---|
| V-ANA-001 | Review | The repository on GitHub | The repository name, the page title and the wordmark read openconformity |
| V-ANA-002 | Review | The host's dashboard and its responses | The domain is registered, and the software and the site are served at its addresses |
| V-ANA-003 | Review | The repository on GitHub | The site, the software and the repository carry no advertising, paid feature or sponsorship |
| V-ANA-004 | Review | The files of the repository | No standard's content is transcribed. The methods and their source. Every method names its source. The pin catches known patterns only, so the attributes, the example and the catalogue are also read for clause text |
| V-ANA-005 | Review | The repository on GitHub | The way to report a vulnerability is published where tools look. `SECURITY.md` names the channel, the scope, the versions and the aim, and private vulnerability reporting is enabled in the repository settings |
| V-ANA-006 | Review | The repository on GitHub | The repository is public on GitHub |
| V-ANA-007 | Review | The host's dashboard and its responses | The host project is on Cloudflare Pages |
| V-ANA-008 | Review | The site and the page | `sources/visual-assets.fig` holds the wordmark and the marks |
| V-ANA-009 | Review | The host's dashboard and its responses | The host serves `app/` at `app.openconformity.org` |
| V-ANA-010 | Review | The repository on GitHub | Each merge to main follows a run with every test file passed and a clean console, and the release notes name the run |
| V-ANA-011 | Review | The host's dashboard and its responses | Each file under `app/` fetched from the host hashes as in the released commit. Rocket Loader, Auto Minify, Email Address Obfuscation and Web Analytics injection are off |
| V-ANA-012 | Review | The repository on GitHub | Every commit on main was reviewed by the maintainer before it was merged, read from the history at each release |
| V-ANA-013 | Review | The accounts | Both accounts show a second factor, read at each release |
| V-ANA-014 | Review | The host's dashboard and its responses | The host's branch control deploys main alone with previews off, read at each release |
| V-ANA-015 | Review | The host's dashboard and its responses | The host has no build command and serves `app/` as it is |
| V-ANA-016 | Review | The files of the repository | The licences ride with the software. Every glyph drawn is in the sprite, with its provenance. Each `ORIGIN.md` under `app/assets/` matches the files beside it |
| V-ANA-017 | Review | The files of the repository | The software is reached by an address and installs nothing |
| V-ANA-018 | Review | The host's dashboard and its responses | The software is static files of the web platform. The host settings run no functions |
| V-ANA-019 | Review | The site and the page | `app/assets/marks/wordmark.svg` against the properties the requirement lists |
| V-ANA-020 | Review | The files of the repository | `app/assets/marks/favicon.svg` in a light and a dark browser tab |
| V-ANA-021 | Review | The files of the repository | The tokens in `app/style.css` and the components against Carbon |
| V-ANA-022 | Review | The files of the repository | Every change to the structure of the file raises the schema version in `specs/project.schema.json` and `app/modules/files.js` |
| V-ANA-023 | Review | The accounts | No page, dialog or module asks for an account or a sign-in |
| V-ANA-024 | Review | The files of the repository | Every module runs in the page, and the pins of N-PRV-002 rule out sending |
| V-ANA-025 | Review | The files of the repository | No module counts, records or reports use |
| V-ANA-026 | Review | The files of the repository | The store writes to IndexedDB, web storage, session storage and downloaded files only |
| V-ANA-027 | Review | The host's dashboard and its responses | The responses from both hosts carry every header of the headers file, the policy, transport security, no sniffing, no referrer, no opener and no device feature, and an unknown path answers not found. A page on another origin that frames the software is refused by the browser |
| V-ANA-028 | Review | The host's dashboard and its responses | Pane headers are landmarks. Pointer targets. Text carries AA contrast in both themes. The other criteria of WCAG 2.2 AA need an audit in the browser with a screen reader |
| V-ANA-029 | Review | The files of the repository | One distinct glyph per entity type. Each entity type's icon in the sprite is a distinct shape |

## 3. Requirements

### 3.1 Constraints

| Requirement | Title | Activities | Coverage |
|---|---|---|---|
| C-PRJ-001 | Project name | V-ANA-001 | Manual |
| C-PRJ-002 | Domain name | V-ANA-002 | Manual |
| C-PRJ-003 | Project licence | V-INS-015 | Tested |
| C-PRJ-004 | Funding model | V-ANA-003 | Manual |
| C-PRJ-005 | Standards content | V-TST-178, V-INS-016, V-TST-123, V-TST-127, V-ANA-004 | Partly |
| C-PRJ-006 | Vulnerability reporting | V-INS-010, V-ANA-005 | Partly |
| C-DEV-001 | Source repository | V-ANA-006 | Manual |
| C-DEV-002 | Hosting platform | V-ANA-007 | Manual |
| C-DEV-003 | Metamodel source | V-TST-075, V-TST-077, V-TST-078 | Tested |
| C-DEV-004 | Identity source | V-ANA-008 | Manual |
| C-DEV-005 | Software address | V-ANA-009 | Manual |
| C-DEV-006 | Release verification | V-ANA-010 | Manual |
| C-DEV-007 | Deployment integrity | V-ANA-011 | Manual |
| C-DEV-008 | Change review | V-ANA-012 | Manual |
| C-DEV-009 | Account protection | V-ANA-013 | Manual |
| C-DEV-010 | Production deployment only | V-ANA-014 | Manual |
| C-TEC-001 | Technology stack | V-INS-012 | Tested |
| C-TEC-002 | No dependencies | V-INS-012 | Tested |
| C-TEC-003 | No build process | V-ANA-015 | Manual |
| C-TEC-004 | JavaScript modules | V-INS-012 | Tested |
| C-TEC-005 | Third-party assets | V-INS-015, V-INS-017, V-ANA-016 | Partly |
| C-TEC-006 | Browser-based | V-ANA-017 | Manual |
| C-TEC-007 | No server-side code | V-INS-012, V-ANA-018 | Partly |
| C-TEC-008 | External application | V-TST-016, V-INS-003 | Tested |

### 3.2 Graphical

| Requirement | Title | Activities | Coverage |
|---|---|---|---|
| G-IDN-001 | Wordmark | V-ANA-019 | Manual |
| G-IDN-002 | Favicon | V-ANA-020 | Manual |
| G-SYS-001 | Design system | V-ANA-021 | Manual |
| G-SYS-002 | Prose typeface | V-INS-024 | Tested |
| G-SYS-003 | Data typeface | V-INS-024 | Tested |
| G-SYS-004 | Iconography | V-TST-068, V-INS-017 | Tested |
| G-SYS-005 | Pane layout | V-INS-019, V-DEM-001 | Partly |

### 3.3 Functional

| Requirement | Title | Activities | Coverage |
|---|---|---|---|
| F-APP-001 | Small-viewport notice | V-INS-021, V-DEM-002 | Partly |
| F-APP-002 | Direct entry | V-TST-001, V-TST-040, V-INS-018 | Tested |
| F-SES-001 | Working state | V-TST-038, V-TST-130, V-TST-133, V-TST-135, V-TST-136, V-TST-137, V-TST-138, V-TST-139, V-TST-140, V-TST-141, V-TST-142, V-TST-146, V-TST-147, V-TST-148, V-DEM-003 | Partly |
| F-SES-002 | Model retention | V-TST-037, V-TST-128, V-TST-131, V-TST-132, V-TST-135, V-TST-143, V-DEM-004 | Partly |
| F-SES-003 | Browser removal | V-TST-060, V-TST-150, V-DEM-005 | Partly |
| F-SES-004 | Restoration failure | V-TST-061, V-TST-137, V-TST-151 | Tested |
| F-SES-005 | Persistence failure | V-TST-129, V-TST-134, V-TST-143 | Tested |
| F-SES-006 | Storage nearly full | V-TST-145 | Tested |
| F-WSP-001 | Model tree | V-TST-004, V-TST-086, V-TST-090, V-TST-091, V-TST-092, V-TST-093, V-TST-094, V-INS-008, V-TST-108 | Tested |
| F-WSP-002 | Entity attributes | V-DEM-006 | Manual |
| F-WSP-003 | Entity relationships | V-TST-115, V-TST-117, V-TST-118, V-TST-119, V-TST-120, V-TST-121, V-DEM-015 | Partly |
| F-WSP-004 | Free filing | V-TST-045, V-TST-058, V-TST-084, V-TST-085, V-TST-086, V-TST-087, V-INS-008, V-TST-105, V-TST-106 | Tested |
| F-WSP-005 | Neutral filing | V-TST-014, V-TST-084 | Tested |
| F-WSP-006 | Folder creation | V-TST-081 | Tested |
| F-WSP-007 | Folder deletion | V-TST-015, V-TST-052, V-TST-089, V-TST-107 | Tested |
| F-WSP-008 | Tree filter | V-TST-093, V-TST-108 | Tested |
| F-WSP-009 | Sibling order | V-TST-087 | Tested |
| F-MOD-001 | Entity creation | V-TST-002, V-TST-031, V-TST-041, V-TST-044, V-TST-077, V-TST-079, V-TST-177, V-TST-104, V-TST-156 | Tested |
| F-MOD-002 | Relationship creation | V-TST-010, V-TST-011, V-TST-031, V-TST-044, V-TST-078, V-TST-088, V-INS-004, V-TST-101, V-TST-102, V-TST-103, V-TST-104, V-TST-113, V-TST-114, V-TST-116, V-TST-156 | Tested |
| F-MOD-003 | Attribute definition | V-TST-005, V-TST-006, V-TST-007, V-TST-008, V-TST-009, V-TST-026, V-TST-031, V-TST-123, V-TST-124, V-TST-125, V-TST-126, V-TST-172 | Tested |
| F-MOD-004 | Edit confirmation | V-TST-024, V-TST-041, V-TST-042, V-TST-046, V-TST-047, V-TST-053, V-TST-082 | Tested |
| F-MOD-005 | Entity deletion | V-TST-002, V-TST-013, V-TST-052, V-TST-088 | Tested |
| F-MOD-006 | Composition deletion | V-TST-013, V-TST-014 | Tested |
| F-MOD-007 | Cascade confirmation | V-TST-012, V-TST-052, V-TST-095, V-INS-004, V-TST-107 | Tested |
| F-MOD-008 | Undo action | V-TST-002, V-TST-043, V-TST-062, V-TST-063, V-TST-064, V-TST-065, V-TST-066, V-TST-067, V-TST-131 | Tested |
| F-MOD-009 | Redo action | V-TST-002, V-TST-062, V-TST-063, V-TST-064, V-TST-067 | Tested |
| F-MOD-010 | Library import | V-TST-057, V-TST-059, V-TST-070, V-TST-071, V-TST-072 | Tested |
| F-MOD-011 | Record of related measures | V-TST-028, V-TST-051, V-TST-109, V-TST-110, V-TST-111, V-TST-112 | Tested |
| F-VIE-001 | Model views | V-TST-054, V-TST-073, V-TST-074, V-INS-009, V-TST-158, V-TST-159, V-TST-160, V-TST-161, V-TST-162, V-TST-163, V-TST-164, V-TST-165, V-TST-166, V-TST-167, V-TST-168, V-DEM-007 | Partly |
| F-VIE-002 | Messages | V-TST-112, V-TST-122 | Tested |
| F-VIE-003 | Risk assessment | V-TST-159, V-TST-160 | Tested |
| F-VIE-004 | Safety function specification | V-TST-163 | Tested |
| F-PER-001 | Project persistence | V-TST-029, V-TST-030, V-TST-032, V-TST-033, V-TST-034, V-TST-037, V-TST-039, V-TST-050, V-TST-076, V-INS-013, V-TST-157 | Tested |
| F-PER-002 | Library persistence | V-TST-069 | Tested |
| F-PER-003 | Schema version | V-TST-033 | Tested |
| F-PER-004 | Version migration | V-TST-035 | Tested |
| F-PER-005 | Unsupported version | V-TST-035 | Tested |
| F-PER-006 | Invalid file | V-TST-029, V-TST-035, V-TST-036, V-TST-058, V-TST-085, V-TST-175, V-TST-138, V-TST-152, V-TST-153, V-TST-154, V-TST-155, V-TST-176, V-TST-170 | Tested |
| F-PER-007 | Migration preservation | None | None |
| F-PER-008 | Version increment | V-ANA-022 | Manual |
| F-PER-009 | Migration notice | None | None |
| F-PER-010 | Attribute preservation | V-TST-032, V-TST-048, V-TST-080, V-TST-100 | Tested |
| F-PER-011 | Project templates | None | None |
| F-PER-012 | Shipped library | V-TST-069, V-TST-178 | Tested |
| F-DRW-001 | Drawing check | V-TST-020, V-TST-021, V-TST-022, V-TST-023, V-TST-171 | Tested |
| F-DRW-002 | Drawing storage | V-TST-019, V-TST-021 | Tested |
| F-DRW-003 | External drawing editor | V-TST-003, V-TST-016, V-TST-018, V-TST-019, V-DEM-008 | Partly |

### 3.4 Non-functional

| Requirement | Title | Activities | Coverage |
|---|---|---|---|
| N-OPS-001 | No user account | V-ANA-023 | Manual |
| N-OPS-002 | Self-contained | V-INS-001, V-INS-005, V-DEM-009 | Partly |
| N-OPS-003 | Fetch failure | V-TST-019 | Tested |
| N-PRV-001 | Local processing | V-ANA-024 | Manual |
| N-PRV-002 | No data transmission | V-INS-005, V-INS-007 | Tested |
| N-PRV-003 | No user tracking | V-ANA-025 | Manual |
| N-PRV-004 | On-device storage | V-ANA-026 | Manual |
| N-PRV-005 | Consent to hand over data | V-TST-149, V-DEM-010 | Partly |
| N-PRV-006 | Consent scope | V-TST-149, V-DEM-011 | Partly |
| N-PRV-007 | Data minimisation | V-TST-019, V-INS-003 | Tested |
| N-SEC-001 | Safe parsing | V-TST-020, V-INS-001, V-INS-002, V-TST-172, V-TST-154, V-TST-155, V-TST-176, V-TST-170 | Tested |
| N-SEC-002 | Safe rendering | V-TST-025, V-INS-001, V-INS-002 | Tested |
| N-SEC-003 | Drawing rendering | V-TST-023, V-TST-171, V-INS-006 | Tested |
| N-SEC-004 | External application isolation | V-TST-016, V-TST-017, V-INS-003 | Tested |
| N-SEC-005 | No hidden content | V-TST-027, V-TST-031, V-TST-048, V-TST-055, V-TST-056, V-TST-057, V-TST-083, V-INS-014, V-TST-098, V-TST-099 | Tested |
| N-SEC-006 | Content security policy | V-INS-001, V-INS-011, V-ANA-027 | Partly |
| N-SEC-007 | Framing | V-INS-011, V-ANA-027 | Partly |
| N-SEC-008 | Hyperlink presentation | V-TST-025 | Tested |
| N-SEC-009 | Failure on opening | V-TST-036, V-TST-049, V-TST-059, V-TST-175, V-TST-177 | Tested |
| N-SEC-010 | No input from the address | V-INS-007 | Tested |
| N-SEC-011 | Safe export | V-TST-073, V-TST-169, V-TST-174, V-TST-164, V-TST-167, V-TST-173 | Tested |
| N-ACC-001 | Standard conformance | V-INS-019, V-INS-022, V-INS-023, V-ANA-028, V-DEM-015 | Partly |
| N-ACC-002 | Colour independence | V-TST-068, V-ANA-029 | Partly |
| N-ACC-003 | Keyboard operability | V-TST-002, V-TST-045, V-TST-095, V-TST-096, V-TST-097, V-INS-004, V-DEM-012 | Partly |
| N-CMP-001 | Desktop viewport | V-INS-021, V-DEM-013 | Partly |
| N-CMP-002 | Browser support | V-INS-013, V-INS-020, V-TST-144, V-DEM-014 | Partly |

## 4. Summary

### 4.1 Coverage

| Class | Requirements | Tested | Partly | Manual | None |
|---|---|---|---|---|---|
| Constraints | 24 | 6 | 4 | 14 | 0 |
| Graphical | 7 | 3 | 1 | 3 | 0 |
| Functional | 47 | 35 | 7 | 2 | 3 |
| Non-functional | 26 | 12 | 10 | 4 | 0 |
| All | 104 | 56 | 22 | 23 | 3 |

Every other test block says in its header that it names no requirement, and pins a choice made within one.

### 4.2 Gaps

| Requirement | Why |
|---|---|
| F-PER-007 | Waits on the first migration |
| F-PER-009 | Waits on the first migration |
| F-PER-011 | Waits on the function |

## 5. References

| No. | Reference | Link |
|---|---|---|
| [1] | openconformity, Requirements | [requirements.md](../specs/requirements.md) |
| [2] | openconformity, Security | [security.md](security.md) |
| [3] | SEBoK System Verification | https://sebokwiki.org/wiki/System_Verification |
