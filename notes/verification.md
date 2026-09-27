# Verification

This document states how each requirement in `specs/requirements.md` is verified. It takes the requirements one by one and names the test blocks that verify each, or the review, browser drive or manual check that must stand in where no test can. It then lists the test blocks that name no requirement, so the mapping can be read in both directions. It describes the working tree on top of commit `240edc7` on 27 September 2026, with the test changes of that day not yet committed, when every test file reported all checks passed. The security review in `notes/reviews/security.md` plans the checks for its own findings, and this document covers every requirement.

## 1. Method

### 1.1 Kinds of verification

| Kind | What it is |
|---|---|
| Headless | A test in `tests/` that exercises behaviour, run by `./run.sh` in the JavaScriptCore shell. |
| Pin | A block of `tests/test-pins.js` that reads the source, the page or an asset for a fact no behaviour test can reach. |
| Drive | The software opened in a browser and driven by hand or by the headless Chrome driver, with what is done and what is looked for. |
| Review | A document, a file or a host setting read against the requirement. |

### 1.2 Status

| Status | Meaning |
|---|---|
| Tested | Headless tests or pins settle the requirement as it is written. |
| Partly | Tests settle part, and the rest needs a drive or a review, as the row says. |
| Review | Only a review can settle it, and the row says what is read. |
| None | A check could be written and none exists, or the function is not built. |

### 1.3 How the mapping was made

A test block is a comment line of the form `// --- Title (ID, ID) ---` in a test file. The ids in each title were read and matched to the ids in the specification. A block that covers a requirement without naming it in its title does not count here. The link on each block points at its line in the working tree, and a line moves when the file changes.

## 2. Requirements to verification

### 2.1 Constraints

| Id | Requirement | Method | Verification | Status |
|---|---|---|---|---|
| C-PRJ-001 | Project name | Review | The repository name, the page title and the wordmark read openconformity. | Review |
| C-PRJ-002 | Domain name | Review | The domain's registration and the addresses the software and the site are served at. | Review |
| C-PRJ-003 | Project licence | Pin | [test-pins.js:129](../tests/test-pins.js#L129) The licences ride with the software. | Tested |
| C-PRJ-004 | Funding model | Review | The site, the software and the repository carry no advertising, paid feature or sponsorship. | Review |
| C-PRJ-005 | Standards content | Pin, headless, review | [test-pins.js:137](../tests/test-pins.js#L137) No standard's content is transcribed. [test-risk.js:17](../tests/test-risk.js#L17) The methods and their source. [test-risk.js:175](../tests/test-risk.js#L175) Every method names its source. The pin catches known patterns only, so the attributes, the example and the catalogue are also read for clause text. | Partly |
| C-DEV-001 | Source repository | Review | The repository is public on GitHub. | Review |
| C-DEV-002 | Hosting platform | Review | The host's project settings name Cloudflare Pages. | Review |
| C-DEV-003 | Metamodel source | Headless | [test-metamodel.js:16](../tests/test-metamodel.js#L16) Parse the diagram. [test-metamodel.js:48](../tests/test-metamodel.js#L48) Entity types. [test-metamodel.js:71](../tests/test-metamodel.js#L71) Relationship types. | Tested |
| C-DEV-004 | Identity source | Review | `sources/visual-assets.fig` holds the wordmark and the marks. | Review |
| C-DEV-005 | Software address | Review | The host serves `app/` at `app.openconformity.org`. | Review |
| C-TEC-001 | Technology stack | Pin, to write | A pin that every file under `app/` is HTML, CSS, JavaScript or an asset. | None |
| C-TEC-002 | No dependencies | Pin | [test-pins.js:58](../tests/test-pins.js#L58) and [test-pins.js:80](../tests/test-pins.js#L80) scan every module the page loads. No pin checks that every import is relative and every script source local, which would settle the rest. | Partly |
| C-TEC-003 | No build process | Review | The host's build command is empty and its output folder is `app`. | Review |
| C-TEC-004 | JavaScript modules | Pin, to write | A pin that every script tag on the page is a module but `theme.js`. | None |
| C-TEC-005 | Third-party assets | Pin | [test-pins.js:129](../tests/test-pins.js#L129) The licences ride with the software. [test-pins.js:146](../tests/test-pins.js#L146) Every glyph drawn is in the sprite, with its provenance. | Tested |
| C-TEC-006 | Browser-based | Review | The software is reached by an address and installs nothing. | Review |
| C-TEC-007 | No server-side code | Pin, to write, and review | A pin that no `functions` folder and no worker file stands under `app/`. The host's settings run no functions. | None |
| C-TEC-008 | External application | Headless, pin | [test-drawing-editor.js:51](../tests/test-drawing-editor.js#L51) The origin and the frame. [test-pins.js:66](../tests/test-pins.js#L66) The one frame, sandboxed, on the editor's origin. | Tested |

### 2.2 Graphical

| Id | Requirement | Method | Verification | Status |
|---|---|---|---|---|
| G-IDN-001 | Wordmark | Review | `app/assets/marks/wordmark.svg` against the properties the requirement lists. | Review |
| G-IDN-002 | Favicon | Review | `app/assets/marks/favicon.svg` in a light and a dark browser tab. | Review |
| G-SYS-001 | Design system | Review | The tokens in `app/style.css` and the components against Carbon. | Review |
| G-SYS-002 | Prose typeface | Pin | [test-pins.js:258](../tests/test-pins.js#L258) The typefaces, vendored and applied. | Tested |
| G-SYS-003 | Data typeface | Pin | [test-pins.js:258](../tests/test-pins.js#L258) The typefaces, vendored and applied. | Tested |
| G-SYS-004 | Iconography | Pin | [test-pins.js:146](../tests/test-pins.js#L146) Every glyph drawn is in the sprite, with its provenance. | Tested |
| G-SYS-005 | Pane layout | Pin, drive | [test-pins.js:173](../tests/test-pins.js#L173) Pane headers are landmarks. Drive, open a project and look for the shell bar, the navigator at full height, and the editor over the relationship pane. | Partly |

### 2.3 Functional

| Id | Requirement | Method | Verification | Status |
|---|---|---|---|---|
| F-APP-001 | Small-viewport notice | Pin, drive | [test-pins.js:200](../tests/test-pins.js#L200) The minimum viewport. Drive, narrow the window below 1000 pixels and look for the notice. | Partly |
| F-APP-002 | Direct entry | Headless, pin | [test-actions.js:20](../tests/test-actions.js#L20) The landing offers the three ways in and the help surface. [test-flows.js:45](../tests/test-flows.js#L45) The landing, one action to a project. [test-pins.js:162](../tests/test-pins.js#L162) The ways into a project are the actions themselves. | Tested |
| F-SES-001 | Working state | Headless, drive | [test-store.js](../tests/test-store.js) blocks at [43](../tests/test-store.js#L43), [201](../tests/test-store.js#L201), [232](../tests/test-store.js#L232), [263](../tests/test-store.js#L263), [279](../tests/test-store.js#L279), [302](../tests/test-store.js#L302), [314](../tests/test-store.js#L314), [329](../tests/test-store.js#L329), [482](../tests/test-store.js#L482), [557](../tests/test-store.js#L557), [675](../tests/test-store.js#L675), [711](../tests/test-store.js#L711), [747](../tests/test-store.js#L747) and [851](../tests/test-store.js#L851). [test-files.js:148](../tests/test-files.js#L148) The blob path. [test-flows.js:694](../tests/test-flows.js#L694) The set-aside copy saves to a file and can be discarded. The tests use the in-memory retention, so a drive reloads the page and looks for the project, the selection and the expansion. | Tested |
| F-SES-002 | Model retention | Headless | [test-store.js:77](../tests/test-store.js#L77) Commit, record, persist, notify. [test-store.js:107](../tests/test-store.js#L107) A burst of changes costs one write. [test-store.js:232](../tests/test-store.js#L232) The persistence loop. [test-store.js:607](../tests/test-store.js#L607) A failing persist. [test-store.js:648](../tests/test-store.js#L648) The storage nearly full is told. [test-shell.js:42](../tests/test-shell.js#L42) The notices. [test-shell.js:57](../tests/test-shell.js#L57) The leave-prompt fires exactly when leaving costs something. | Tested |
| F-SES-003 | Browser removal | Headless, drive | [test-store.js:820](../tests/test-store.js#L820) Clear browser data forgets everything. [test-flows.js:661](../tests/test-flows.js#L661) Clear browser data asks, then forgets. Drive, clear, then open the storage inspector and look for no record in the database and no session key. | Tested |
| F-WSP-001 | Model tree | Headless | [test-navigator.js](../tests/test-navigator.js) blocks at [16](../tests/test-navigator.js#L16), [52](../tests/test-navigator.js#L52), [70](../tests/test-navigator.js#L70), [94](../tests/test-navigator.js#L94) and [165](../tests/test-navigator.js#L165). [test-queries.js:349](../tests/test-queries.js#L349) A filter's one rule. [test-actions.js:214](../tests/test-actions.js#L214) Reorder stands down while the tree is filtered. | Tested |
| F-WSP-002 | Entity attributes | Drive | Select an entity in the tree and look for its attributes in the editor pane. The editor needs a page, so no headless test reaches it. | None |
| F-WSP-003 | Entity relationships | Headless | [test-relationships.js](../tests/test-relationships.js) blocks at [81](../tests/test-relationships.js#L81), [164](../tests/test-relationships.js#L164), [220](../tests/test-relationships.js#L220), [277](../tests/test-relationships.js#L277), [310](../tests/test-relationships.js#L310) and [452](../tests/test-relationships.js#L452). | Tested |
| F-WSP-004 | Free filing | Headless | [test-model.js:124](../tests/test-model.js#L124) Filing. [test-model.js:165](../tests/test-model.js#L165) Sibling order. [test-queries.js:199](../tests/test-queries.js#L199) The move predicates. [test-queries.js:220](../tests/test-queries.js#L220) Every legal destination. [test-flows.js:143](../tests/test-flows.js#L143) Activation and the pointerless filing path. | Tested |
| F-WSP-005 | Neutral filing | Headless | [test-model.js:124](../tests/test-model.js#L124) Filing. [test-cascade.js:116](../tests/test-cascade.js#L116) Deletion against filing. | Tested |
| F-WSP-006 | Folder creation | Headless | [test-model.js:77](../tests/test-model.js#L77) Folders. | Tested |
| F-WSP-007 | Folder deletion | Headless | [test-model.js:238](../tests/test-model.js#L238) Folder deletion. [test-cascade.js:141](../tests/test-cascade.js#L141) A folder takes what is filed in it. [test-queries.js:253](../tests/test-queries.js#L253) The cascade question counts what it takes. [test-flows.js:417](../tests/test-flows.js#L417) Every deletion asks first. | Tested |
| F-MOD-001 | Entity creation | Headless | [test-model.js:34](../tests/test-model.js#L34) Creation. [test-metamodel.js:48](../tests/test-metamodel.js#L48) Entity types. [test-validator.js:106](../tests/test-validator.js#L106) The enumerations, behaviourally. [test-queries.js:162](../tests/test-queries.js#L162) The new-related offer. [test-actions.js:32](../tests/test-actions.js#L32) The action list against a live store. [test-flows.js:57](../tests/test-flows.js#L57) and [test-flows.js:109](../tests/test-flows.js#L109). [test-example.js:158](../tests/test-example.js#L158) The example is complete against the metamodel. | Tested |
| F-MOD-002 | Relationship creation | Headless | [test-model.js:200](../tests/test-model.js#L200) Relationships. [test-metamodel.js:71](../tests/test-metamodel.js#L71) Relationship types. [test-cascade.js:22](../tests/test-cascade.js#L22) Single owner. [test-cascade.js:43](../tests/test-cascade.js#L43) Ownership acyclicity. [test-queries.js](../tests/test-queries.js) blocks at [37](../tests/test-queries.js#L37), [75](../tests/test-queries.js#L75), [119](../tests/test-queries.js#L119) and [162](../tests/test-queries.js#L162). [test-relationships.js](../tests/test-relationships.js) blocks at [31](../tests/test-relationships.js#L31), [55](../tests/test-relationships.js#L55) and [124](../tests/test-relationships.js#L124). [test-validator.js:106](../tests/test-validator.js#L106). [test-flows.js:109](../tests/test-flows.js#L109). [test-example.js:158](../tests/test-example.js#L158). | Tested |
| F-MOD-003 | Attribute definition | Headless | [test-attributes.js](../tests/test-attributes.js) blocks at [22](../tests/test-attributes.js#L22), [168](../tests/test-attributes.js#L168), [180](../tests/test-attributes.js#L180), [201](../tests/test-attributes.js#L201) and [270](../tests/test-attributes.js#L270). [test-editor.js:41](../tests/test-editor.js#L41) The field helpers over the definitions. [test-risk.js](../tests/test-risk.js) blocks at [17](../tests/test-risk.js#L17), [62](../tests/test-risk.js#L62), [85](../tests/test-risk.js#L85) and [111](../tests/test-risk.js#L111). [test-example.js:158](../tests/test-example.js#L158). | Tested |
| F-MOD-004 | Edit confirmation | Headless | [test-editor.js:13](../tests/test-editor.js#L13) The draft against the entity. [test-model.js:97](../tests/test-model.js#L97) Updates. [test-flows.js](../tests/test-flows.js) blocks at [57](../tests/test-flows.js#L57), [79](../tests/test-flows.js#L79), [246](../tests/test-flows.js#L246), [260](../tests/test-flows.js#L260) and [493](../tests/test-flows.js#L493). | Tested |
| F-MOD-005 | Entity deletion | Headless | [test-model.js:200](../tests/test-model.js#L200) Relationships. [test-cascade.js:93](../tests/test-cascade.js#L93) Nested cascade. [test-flows.js:417](../tests/test-flows.js#L417) Every deletion asks first. [test-actions.js:32](../tests/test-actions.js#L32). | Tested |
| F-MOD-006 | Composition deletion | Headless | [test-cascade.js:93](../tests/test-cascade.js#L93) Nested cascade. [test-cascade.js:116](../tests/test-cascade.js#L116) Deletion against filing. | Tested |
| F-MOD-007 | Cascade confirmation | Headless | [test-cascade.js:61](../tests/test-cascade.js#L61) The deletion preview. [test-queries.js:253](../tests/test-queries.js#L253) The cascade question counts what it takes. [test-flows.js:417](../tests/test-flows.js#L417) Every deletion asks first. | Tested |
| F-MOD-008 | Undo action | Headless | [test-history.js](../tests/test-history.js) blocks at [13](../tests/test-history.js#L13), [39](../tests/test-history.js#L39), [59](../tests/test-history.js#L59), [80](../tests/test-history.js#L80), [171](../tests/test-history.js#L171) and [194](../tests/test-history.js#L194). [test-store.js:77](../tests/test-store.js#L77). [test-flows.js:93](../tests/test-flows.js#L93). [test-actions.js:32](../tests/test-actions.js#L32). | Tested |
| F-MOD-009 | Redo action | Headless | [test-history.js](../tests/test-history.js) blocks at [13](../tests/test-history.js#L13), [39](../tests/test-history.js#L39), [59](../tests/test-history.js#L59) and [194](../tests/test-history.js#L194). [test-actions.js:32](../tests/test-actions.js#L32). | Tested |
| F-MOD-010 | Library import | Headless | [test-library.js:50](../tests/test-library.js#L50) The picks. [test-library.js:100](../tests/test-library.js#L100) The plan and the copy. [test-flows.js:622](../tests/test-flows.js#L622) An import clears what the copies hold under choices not in force, after a question. | Tested |
| F-MOD-011 | Record of related measures | Headless | [test-records.js](../tests/test-records.js) blocks at [16](../tests/test-records.js#L16), [25](../tests/test-records.js#L25), [34](../tests/test-records.js#L34) and [40](../tests/test-records.js#L40). [test-editor.js:133](../tests/test-editor.js#L133). [test-flows.js:396](../tests/test-flows.js#L396) A changed record marked reviewed. | Tested |
| F-VIE-001 | Model views | Headless, drive | [test-views.js](../tests/test-views.js) blocks at [31](../tests/test-views.js#L31), [36](../tests/test-views.js#L36), [79](../tests/test-views.js#L79) and [125](../tests/test-views.js#L125). [test-flows.js:517](../tests/test-flows.js#L517). Export is not defined beyond Print, so a drive opens a view, prints it and looks at the output. | Partly |
| F-VIE-002 | Messages | Headless | [test-records.js:40](../tests/test-records.js#L40) The findings. [test-relationships.js:474](../tests/test-relationships.js#L474) The messages table. | Tested |
| F-PER-001 | Project persistence | Headless, pin | [test-files.js](../tests/test-files.js) blocks at [17](../tests/test-files.js#L17), [37](../tests/test-files.js#L37), [65](../tests/test-files.js#L65) and [156](../tests/test-files.js#L156). [test-example.js:22](../tests/test-example.js#L22) and [test-example.js:32](../tests/test-example.js#L32). [test-metamodel.js:40](../tests/test-metamodel.js#L40) Parse the schema. [test-validator.js:198](../tests/test-validator.js#L198). [test-flows.js:347](../tests/test-flows.js#L347) Save asks every time. [test-pins.js:112](../tests/test-pins.js#L112) The file surface stays on the baseline. | Tested |
| F-PER-002 | Library persistence | Headless | [test-library.js:15](../tests/test-library.js#L15) The catalogues the software ships. | Tested |
| F-PER-003 | Schema version | Headless | [test-files.js:37](../tests/test-files.js#L37) Round-trip stability. | Tested |
| F-PER-004 | Version migration | Headless | [test-files.js:85](../tests/test-files.js#L85) The gates, in order, refuses a version with no step. The chain is empty until schema version 2 exists, and a test of a real migration comes with it. | Partly |
| F-PER-005 | Unsupported version | Headless | [test-files.js:85](../tests/test-files.js#L85) The gates, in order. | Tested |
| F-PER-006 | Invalid file | Headless | [test-validator.js:39](../tests/test-validator.js#L39) The fixtures. [test-validator.js:57](../tests/test-validator.js#L57) A prototype key pollutes nothing. [test-validator.js:66](../tests/test-validator.js#L66) Keyword mutations. [test-files.js:85](../tests/test-files.js#L85) The gates, in order. [test-files.js:109](../tests/test-files.js#L109) A file the browser cannot hold is refused, never thrown. [test-store.js:302](../tests/test-store.js#L302). [test-example.js:22](../tests/test-example.js#L22). | Tested |
| F-PER-007 | Migration preservation | Headless, to write | A test with the first migration, carrying every key of a source fixture into the migrated file. | None |
| F-PER-008 | Version increment | Review | Every change to the file's structure raises the schema version in `specs/project.schema.json` and `app/modules/files.js`. | Review |
| F-PER-009 | Migration notice | Headless, to write | A test with the first migration that preserves content as legacy, looking for the notice. | None |
| F-PER-010 | Attribute preservation | Headless | [test-files.js:17](../tests/test-files.js#L17) Loading the valid fixture. [test-model.js:59](../tests/test-model.js#L59) Creation from a file. [test-project.js:71](../tests/test-project.js#L71) What no definition presents. [test-flows.js:303](../tests/test-flows.js#L303) A file holding hidden or unknown content is cleared and stated on opening. | Tested |
| F-PER-011 | Project templates | None | The function is not built. | None |
| F-DRW-001 | Drawing check | Headless | [test-drawing.js](../tests/test-drawing.js) blocks at [20](../tests/test-drawing.js#L20), [47](../tests/test-drawing.js#L47), [62](../tests/test-drawing.js#L62) and [72](../tests/test-drawing.js#L72). | Tested |
| F-DRW-002 | Drawing storage | Headless | [test-drawing.js:47](../tests/test-drawing.js#L47) A real export is accepted, and carries its model. [test-drawing-editor.js:110](../tests/test-drawing-editor.js#L110) The session, against a fake frame. | Tested |
| F-DRW-003 | External drawing editor | Headless, drive | [test-drawing-editor.js:51](../tests/test-drawing-editor.js#L51) The origin and the frame. [test-drawing-editor.js:110](../tests/test-drawing-editor.js#L110) The session, against a fake frame. [test-actions.js:189](../tests/test-actions.js#L189) Nothing acts while a diagram is open. The fake frame stands in for draw.io, so a drive creates a drawing in the real editor, applies it, saves the entity and edits it again. | Partly |

### 2.4 Non-functional

| Id | Requirement | Method | Verification | Status |
|---|---|---|---|---|
| N-OPS-001 | No user account | Review | No page, dialog or module asks for an account or a sign-in. The beta gate stands in front of the software and is the host's. | Review |
| N-OPS-002 | Self-contained | Pin, drive | [test-pins.js:50](../tests/test-pins.js#L50) The page states its content security policy first. [test-pins.js:80](../tests/test-pins.js#L80) Nothing leaves the page but by a link the user follows. Drive with the network panel open, load, work, and look for requests to the host only until the editor is opened. | Partly |
| N-OPS-003 | Fetch failure | Headless | [test-drawing-editor.js:110](../tests/test-drawing-editor.js#L110) The session, against a fake frame, for the readiness and export periods. The editor is the only function that fetches. | Tested |
| N-PRV-001 | Local processing | Review | Every module runs in the page, and no module sends anything away, as the pin under N-PRV-002 shows. | Review |
| N-PRV-002 | No data transmission | Pin, drive | [test-pins.js:80](../tests/test-pins.js#L80) Nothing leaves the page but by a link the user follows. [test-pins.js:106](../tests/test-pins.js#L106) Nothing is read from the address. The drive of N-OPS-002 confirms it in the browser. | Tested |
| N-PRV-003 | No user tracking | Review | No module counts, records or reports use. The pin under N-PRV-002 rules out sending. | Review |
| N-PRV-004 | On-device storage | Review | The store writes to IndexedDB, web storage, session storage and downloaded files only. | Review |
| N-PRV-005 | Consent to hand over data | Headless, pin, drive | [test-store.js:769](../tests/test-store.js#L769) The tab chosen per type, the session's. The consent text is pinned inside [test-pins.js:66](../tests/test-pins.js#L66). Drive, create a drawing, look for the dialog naming the origin and the diagram, and continue. | Partly |
| N-PRV-006 | Consent scope | Headless, drive | [test-store.js:769](../tests/test-store.js#L769) The tab chosen per type, the session's. Drive, tick the box, open About, press Forget, and look for the dialog on the next edit. | Tested |
| N-PRV-007 | Data minimisation | Headless, pin | [test-drawing-editor.js:110](../tests/test-drawing-editor.js#L110) The session, against a fake frame. [test-pins.js:66](../tests/test-pins.js#L66) The one frame, sandboxed, on the editor's origin. | Tested |
| N-SEC-001 | Safe parsing | Headless, pin | [test-pins.js:58](../tests/test-pins.js#L58) No module builds or parses markup from text. [test-pins.js:50](../tests/test-pins.js#L50). [test-pins.js:106](../tests/test-pins.js#L106). [test-validator.js:57](../tests/test-validator.js#L57) A prototype key pollutes nothing. [test-validator.js:66](../tests/test-validator.js#L66) Keyword mutations. [test-drawing.js:20](../tests/test-drawing.js#L20) The parser. | Tested |
| N-SEC-002 | Safe rendering | Headless, pin | [test-pins.js:58](../tests/test-pins.js#L58) No module builds or parses markup from text. [test-pins.js:50](../tests/test-pins.js#L50). [test-editor.js:31](../tests/test-editor.js#L31) A hyperlink is presented as a link only when it is a web address. | Tested |
| N-SEC-003 | Drawing rendering | Headless, pin | [test-drawing.js:72](../tests/test-drawing.js#L72) What is refused, and why. [test-pins.js:97](../tests/test-pins.js#L97) A drawing reaches the page as an image from a data address. | Tested |
| N-SEC-004 | External application isolation | Headless, pin | [test-drawing-editor.js:51](../tests/test-drawing-editor.js#L51) The origin and the frame. [test-drawing-editor.js:69](../tests/test-drawing-editor.js#L69) What is heard. [test-pins.js:66](../tests/test-pins.js#L66) The one frame, sandboxed, on the editor's origin. | Tested |
| N-SEC-005 | No hidden content | Headless, pin | [test-project.js:16](../tests/test-project.js#L16) and [test-project.js:50](../tests/test-project.js#L50). [test-model.js:114](../tests/test-model.js#L114) Removing keys. [test-editor.js:123](../tests/test-editor.js#L123). [test-flows.js](../tests/test-flows.js) blocks at [303](../tests/test-flows.js#L303), [564](../tests/test-flows.js#L564), [601](../tests/test-flows.js#L601) and [622](../tests/test-flows.js#L622). [test-example.js:158](../tests/test-example.js#L158). [test-pins.js:120](../tests/test-pins.js#L120) The shipped data opens without a question. | Tested |
| N-ACC-001 | Standard conformance | Pin, review | [test-pins.js:173](../tests/test-pins.js#L173) Pane headers are landmarks. [test-pins.js:207](../tests/test-pins.js#L207) Pointer targets. [test-pins.js:213](../tests/test-pins.js#L213) Text carries AA contrast in both themes. The other criteria of WCAG 2.2 AA need an audit in the browser with a screen reader. | Partly |
| N-ACC-002 | Colour independence | Review | Each entity type's icon in the sprite of `app/index.html` is a distinct shape. | Review |
| N-ACC-003 | Keyboard operability | Headless, drive | [test-actions.js:32](../tests/test-actions.js#L32) The action list against a live store. [test-flows.js:143](../tests/test-flows.js#L143) Activation and the pointerless filing path. [test-overlay.js:76](../tests/test-overlay.js#L76) Escape goes to the top entry. [test-overlay.js:105](../tests/test-overlay.js#L105) The opener rides with its entry. Drive, walk every row of `docs/shortcuts.md` with the pointer unused. | Partly |
| N-CMP-001 | Desktop viewport | Pin, drive | [test-pins.js:200](../tests/test-pins.js#L200) The minimum viewport. Drive, work at 1000 by 356 pixels and look for every pane usable. | Partly |
| N-CMP-002 | Browser support | Pin, headless, drive | [test-pins.js:112](../tests/test-pins.js#L112) The file surface stays on the baseline. [test-pins.js:183](../tests/test-pins.js#L183) The pre-paint theme script speaks the store's literals. [test-store.js:636](../tests/test-store.js#L636) A browser without IndexedDB. Drive the example and a drawing in the current Chrome, Edge, Firefox and Safari. | Partly |

### 2.5 Summary

| Class | Requirements | Tested | Partly | Review | None |
|---|---|---|---|---|---|
| Constraints | 18 | 4 | 2 | 9 | 3 |
| Graphical | 7 | 3 | 1 | 3 | 0 |
| Functional | 39 | 30 | 4 | 1 | 4 |
| Non-functional | 20 | 9 | 6 | 5 | 0 |
| All | 84 | 46 | 13 | 18 | 7 |

Of the seven with no verification, three can be closed by a pin today, C-TEC-001, C-TEC-004 and C-TEC-007. One can be closed by a drive, F-WSP-002. Two wait on the first migration, F-PER-007 and F-PER-009. One waits on the function it governs, F-PER-011.

## 3. Verification to requirements

### 3.1 Blocks that name no requirement

Every block below says in its title that it names no requirement. Most pin a behaviour the interface chose within a requirement that governs it more broadly. Three verify a control that a requirement proposed in the security review would claim.

| Block | Would be claimed by |
|---|---|
| [test-files.js:137](../tests/test-files.js#L137) The filename | A requirement on the saved file's name, not yet proposed. |
| [test-drawing-editor.js:86](../tests/test-drawing-editor.js#L86) Decoding an export | F-DRW-003, whose check runs on what is decoded. |
| [test-shell.js:49](../tests/test-shell.js#L49) The tab title | Nothing. The title carries the project name into the browser's history, a fact the security review records. |
| [test-actions.js:159](../tests/test-actions.js#L159) Menu grouping, [202](../tests/test-actions.js#L202) The toolbar's shape | Interface choices. |
| [test-example.js](../tests/test-example.js) blocks at [42](../tests/test-example.js#L42), [72](../tests/test-example.js#L72), [100](../tests/test-example.js#L100) and [112](../tests/test-example.js#L112) | The example's own content. |
| [test-flows.js:195](../tests/test-flows.js#L195) Refusals are told in passing, [464](../tests/test-flows.js#L464) Removing a relationship asks first | Interface choices. |
| [test-history.js](../tests/test-history.js) blocks at [98](../tests/test-history.js#L98), [118](../tests/test-history.js#L118), [141](../tests/test-history.js#L141) and [156](../tests/test-history.js#L156) | The history's mechanics under F-MOD-008 and F-MOD-009. |
| [test-library.js:31](../tests/test-library.js#L31) The rows, [157](../tests/test-library.js#L157) The preview | The picker's presentation. |
| [test-metamodel.js:92](../tests/test-metamodel.js#L92) Directional lookups | The metamodel's lookups. |
| [test-model.js:262](../tests/test-model.js#L262) The project's own attributes | The project's attributes under F-MOD-003. |
| [test-navigator.js:146](../tests/test-navigator.js#L146) The transient reveal | The tree's presentation. |
| [test-overlay.js](../tests/test-overlay.js) blocks at [26](../tests/test-overlay.js#L26), [38](../tests/test-overlay.js#L38), [58](../tests/test-overlay.js#L58) and [91](../tests/test-overlay.js#L91) | The overlay's mechanics. |
| [test-pins.js:269](../tests/test-pins.js#L269) The release line | The version constants. |
| [test-queries.js](../tests/test-queries.js) blocks at [139](../tests/test-queries.js#L139), [306](../tests/test-queries.js#L306) and [358](../tests/test-queries.js#L358) | Labels and exclusions in queries. |
| [test-relationships.js](../tests/test-relationships.js) blocks at [338](../tests/test-relationships.js#L338), [375](../tests/test-relationships.js#L375), [388](../tests/test-relationships.js#L388) and [411](../tests/test-relationships.js#L411) | The graph's presentation. |
| [test-risk.js:132](../tests/test-risk.js#L132) The graph as drawn agrees with the graph as tabled, [165](../tests/test-risk.js#L165) A level's tone | The risk methods under F-MOD-003. |
| [test-shell.js:20](../tests/test-shell.js#L20) The effective theme, [29](../tests/test-shell.js#L29) The one-click flip | The theme. |
| [test-store.js](../tests/test-store.js) blocks at [128](../tests/test-store.js#L128), [150](../tests/test-store.js#L150), [175](../tests/test-store.js#L175), [373](../tests/test-store.js#L373), [394](../tests/test-store.js#L394), [462](../tests/test-store.js#L462), [503](../tests/test-store.js#L503), [726](../tests/test-store.js#L726) and [885](../tests/test-store.js#L885) | The store's mechanics and presentation state. |
| [test-text.js:9](../tests/test-text.js#L9) Counts and lists | The wording helpers. |

### 3.2 Files without blocks

`tests/test-icons.js` holds four checks under no block header, so it names no requirement. The icons it checks fall under G-SYS-004, and a header naming it would count them.

## 4. References

| No. | Reference | Link |
|---|---|---|
| [1] | openconformity, Requirements | ../specs/requirements.md |
| [2] | openconformity, Security review | reviews/security.md |
