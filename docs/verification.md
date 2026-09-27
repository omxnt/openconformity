# Verification

This document states how each requirement in `specs/requirements.md` is verified. It maps every requirement to the test blocks that verify it, and names the drive or review that stands in where no test can. It then lists the test blocks that name no requirement, so the mapping reads in both directions. It describes the repository on 27 September 2026, after the security review's changes. The security model in `docs/security.md` maps its controls to requirement ids, and the audit in `reviews/security-2026-09.md` plans and records the checks of its own findings.

## 1. Method

### 1.1 Kinds of verification

| Kind | What it is |
|---|---|
| Headless | A test in `tests/` that exercises behaviour, run by `./run.sh` in the JavaScriptCore shell. |
| Pin | A block of `tests/test-pins.js` that reads the source, the page or the file list for a fact no behaviour test can reach. |
| Drive | The software opened in a browser and driven by hand or by the headless Chrome driver. |
| Review | A document, a file or a host setting read against the requirement. |

### 1.2 Status

| Status | Meaning |
|---|---|
| Tested | Headless tests or pins settle the requirement. |
| Partly | Tests settle part, and a drive or a review settles the rest. |
| Manual | Only a drive or a review settles it. |
| None | No check exists yet. |

### 1.3 How the mapping is made

| Term | Meaning |
|---|---|
| Block | A comment line `// --- Title (ID, ID) ---` in a test file. |
| Counted | A block counts for a requirement when its title names the id. |
| Links | Each points at the line of a block title. A line moves when its file changes, and the links are then updated. |

## 2. Requirements to verification

### 2.1 Constraints

| Id | Requirement | Method | Verification | Status |
|---|---|---|---|---|
| C-PRJ-001 | Project name | Review | The repository name, the page title and the wordmark read openconformity. | Manual |
| C-PRJ-002 | Domain name | Review | The domain is registered, and the software and the site are served at its addresses. | Manual |
| C-PRJ-003 | Project licence | Pin | [test-pins.js:170](../tests/test-pins.js#L170) The licences ride with the software. | Tested |
| C-PRJ-004 | Funding model | Review | The site, the software and the repository carry no advertising, paid feature or sponsorship. | Manual |
| C-PRJ-005 | Standards content | Headless, pin, review | [test-pins.js:178](../tests/test-pins.js#L178) No standard's content is transcribed. [test-risk.js:17](../tests/test-risk.js#L17) The methods and their source. [test-risk.js:175](../tests/test-risk.js#L175) Every method names its source. The pin catches known patterns only, so the attributes, the example and the catalogue are also read for clause text. | Partly |
| C-PRJ-006 | Vulnerability reporting | Review | `SECURITY.md` names the channel, the scope, the versions and the aim, and private vulnerability reporting is enabled in the repository settings. | Manual |
| C-DEV-001 | Source repository | Review | The repository is public on GitHub. | Manual |
| C-DEV-002 | Hosting platform | Review | The host project is on Cloudflare Pages. | Manual |
| C-DEV-003 | Metamodel source | Headless | [test-metamodel.js:16](../tests/test-metamodel.js#L16) Parse the diagram. [test-metamodel.js:48](../tests/test-metamodel.js#L48) Entity types. [test-metamodel.js:71](../tests/test-metamodel.js#L71) Relationship types. | Tested |
| C-DEV-004 | Identity source | Review | `sources/visual-assets.fig` holds the wordmark and the marks. | Manual |
| C-DEV-005 | Software address | Review | The host serves `app/` at `app.openconformity.org`. | Manual |
| C-DEV-006 | Release verification | Review | Each merge to main follows a run with every test file passed and a clean console, and the release notes name the run. | Manual |
| C-DEV-007 | Deployment integrity | Review | Each file under `app/` fetched from the host hashes as in the released commit. Rocket Loader, Auto Minify, Email Address Obfuscation and Web Analytics injection are off. | Manual |
| C-TEC-001 | Technology stack | Pin | [test-pins.js:138](../tests/test-pins.js#L138) The software is static files of the web platform. | Tested |
| C-TEC-002 | No dependencies | Pin | [test-pins.js:138](../tests/test-pins.js#L138) The software is static files of the web platform. | Tested |
| C-TEC-003 | No build process | Review | The host has no build command and serves `app/` as it is. | Manual |
| C-TEC-004 | JavaScript modules | Pin | [test-pins.js:138](../tests/test-pins.js#L138) The software is static files of the web platform. | Tested |
| C-TEC-005 | Third-party assets | Pin, review | [test-pins.js:170](../tests/test-pins.js#L170) The licences ride with the software. [test-pins.js:187](../tests/test-pins.js#L187) Every glyph drawn is in the sprite, with its provenance. Each `ORIGIN.md` under `app/assets/` matches the files beside it. | Partly |
| C-TEC-006 | Browser-based | Review | The software is reached by an address and installs nothing. | Manual |
| C-TEC-007 | No server-side code | Pin, review | [test-pins.js:138](../tests/test-pins.js#L138) The software is static files of the web platform. The host settings run no functions. | Partly |
| C-TEC-008 | External application | Headless, pin | [test-drawing-editor.js:51](../tests/test-drawing-editor.js#L51) The origin and the frame. [test-pins.js:66](../tests/test-pins.js#L66) The one frame, sandboxed, on the editor's origin. | Tested |

### 2.2 Graphical

| Id | Requirement | Method | Verification | Status |
|---|---|---|---|---|
| G-IDN-001 | Wordmark | Review | `app/assets/marks/wordmark.svg` against the properties the requirement lists. | Manual |
| G-IDN-002 | Favicon | Review | `app/assets/marks/favicon.svg` in a light and a dark browser tab. | Manual |
| G-SYS-001 | Design system | Review | The tokens in `app/style.css` and the components against Carbon. | Manual |
| G-SYS-002 | Prose typeface | Pin | [test-pins.js:299](../tests/test-pins.js#L299) The typefaces, vendored and applied. | Tested |
| G-SYS-003 | Data typeface | Pin | [test-pins.js:299](../tests/test-pins.js#L299) The typefaces, vendored and applied. | Tested |
| G-SYS-004 | Iconography | Headless, pin | [test-icons.js:12](../tests/test-icons.js#L12) One distinct glyph per entity type. [test-pins.js:187](../tests/test-pins.js#L187) Every glyph drawn is in the sprite, with its provenance. | Tested |
| G-SYS-005 | Pane layout | Pin, drive | [test-pins.js:214](../tests/test-pins.js#L214) Pane headers are landmarks. Open a project and find the shell bar, the navigator at full height, and the editor over the relationship pane. | Partly |

### 2.3 Functional

| Id | Requirement | Method | Verification | Status |
|---|---|---|---|---|
| F-APP-001 | Small-viewport notice | Pin, drive | [test-pins.js:241](../tests/test-pins.js#L241) The minimum viewport. Narrow the window below 1000 pixels and find the notice. | Partly |
| F-APP-002 | Direct entry | Headless, pin | [test-actions.js:20](../tests/test-actions.js#L20) The landing offers the three ways in and the help surface. [test-flows.js:45](../tests/test-flows.js#L45) The landing: one action to a project. [test-pins.js:203](../tests/test-pins.js#L203) The ways into a project are the actions themselves. | Tested |
| F-SES-001 | Working state | Headless, drive | [test-files.js:167](../tests/test-files.js#L167). [test-store.js](../tests/test-store.js) at [43](../tests/test-store.js#L43), [201](../tests/test-store.js#L201), [232](../tests/test-store.js#L232), [263](../tests/test-store.js#L263), [279](../tests/test-store.js#L279), [302](../tests/test-store.js#L302), [314](../tests/test-store.js#L314), [329](../tests/test-store.js#L329), [482](../tests/test-store.js#L482), [557](../tests/test-store.js#L557), [675](../tests/test-store.js#L675), [711](../tests/test-store.js#L711), [747](../tests/test-store.js#L747). The tests use an in-memory stand-in for browser storage. Reload the page and find the project, the selection and the expansion. | Partly |
| F-SES-002 | Model retention | Headless, drive | [test-files.js:142](../tests/test-files.js#L142). [test-shell.js:42](../tests/test-shell.js#L42). [test-store.js](../tests/test-store.js) at [77](../tests/test-store.js#L77), [107](../tests/test-store.js#L107), [232](../tests/test-store.js#L232), [607](../tests/test-store.js#L607). Make a change, reload, and find it kept. | Partly |
| F-SES-003 | Browser removal | Headless, drive | [test-flows.js:695](../tests/test-flows.js#L695) Clear browser data asks, then forgets. [test-store.js:820](../tests/test-store.js#L820) Clear browser data forgets everything. Clear stored data, then find no record in the database and no session key in the storage inspector. | Partly |
| F-SES-004 | Restoration failure | Headless | [test-flows.js:728](../tests/test-flows.js#L728) The set-aside copy saves to a file and can be discarded. [test-store.js:279](../tests/test-store.js#L279) A blob that fails to load is set aside. [test-store.js:851](../tests/test-store.js#L851) The set-aside copy can be read back and discarded. | Tested |
| F-SES-005 | Persistence failure | Headless | [test-shell.js:57](../tests/test-shell.js#L57) The leave-prompt fires exactly when leaving costs something. [test-store.js:607](../tests/test-store.js#L607) A failing persist. | Tested |
| F-SES-006 | Storage nearly full | Headless | [test-store.js:648](../tests/test-store.js#L648) The storage nearly full is told. | Tested |
| F-WSP-001 | Model tree | Headless, pin | [test-actions.js:218](../tests/test-actions.js#L218). [test-model.js:190](../tests/test-model.js#L190). [test-navigator.js](../tests/test-navigator.js) at [16](../tests/test-navigator.js#L16), [52](../tests/test-navigator.js#L52), [70](../tests/test-navigator.js#L70), [94](../tests/test-navigator.js#L94), [165](../tests/test-navigator.js#L165). [test-pins.js:116](../tests/test-pins.js#L116). [test-queries.js:349](../tests/test-queries.js#L349). | Tested |
| F-WSP-002 | Entity attributes | Drive | Select an entity in the tree and find its attributes in the editor pane. | Manual |
| F-WSP-003 | Entity relationships | Headless | [test-relationships.js](../tests/test-relationships.js) at [81](../tests/test-relationships.js#L81), [164](../tests/test-relationships.js#L164), [220](../tests/test-relationships.js#L220), [277](../tests/test-relationships.js#L277), [310](../tests/test-relationships.js#L310), [452](../tests/test-relationships.js#L452). | Tested |
| F-WSP-004 | Free filing | Headless, pin | [test-flows.js](../tests/test-flows.js) at [143](../tests/test-flows.js#L143), [661](../tests/test-flows.js#L661). [test-model.js](../tests/test-model.js) at [128](../tests/test-model.js#L128), [169](../tests/test-model.js#L169), [190](../tests/test-model.js#L190), [236](../tests/test-model.js#L236). [test-pins.js:116](../tests/test-pins.js#L116). [test-queries.js](../tests/test-queries.js) at [199](../tests/test-queries.js#L199), [220](../tests/test-queries.js#L220). | Tested |
| F-WSP-005 | Neutral filing | Headless | [test-cascade.js:116](../tests/test-cascade.js#L116) Deletion against filing. [test-model.js:128](../tests/test-model.js#L128) Filing. | Tested |
| F-WSP-006 | Folder creation | Headless | [test-model.js:81](../tests/test-model.js#L81) Folders. | Tested |
| F-WSP-007 | Folder deletion | Headless | [test-cascade.js:141](../tests/test-cascade.js#L141). [test-flows.js:417](../tests/test-flows.js#L417). [test-model.js:309](../tests/test-model.js#L309). [test-queries.js:253](../tests/test-queries.js#L253). | Tested |
| F-MOD-001 | Entity creation | Headless | [test-actions.js:32](../tests/test-actions.js#L32). [test-example.js:158](../tests/test-example.js#L158). [test-flows.js](../tests/test-flows.js) at [57](../tests/test-flows.js#L57), [109](../tests/test-flows.js#L109). [test-metamodel.js:48](../tests/test-metamodel.js#L48). [test-model.js:38](../tests/test-model.js#L38). [test-queries.js:162](../tests/test-queries.js#L162). [test-validator.js:123](../tests/test-validator.js#L123). | Tested |
| F-MOD-002 | Relationship creation | Headless | [test-cascade.js](../tests/test-cascade.js) at [22](../tests/test-cascade.js#L22), [43](../tests/test-cascade.js#L43). [test-example.js:158](../tests/test-example.js#L158). [test-flows.js:109](../tests/test-flows.js#L109). [test-metamodel.js:71](../tests/test-metamodel.js#L71). [test-model.js:271](../tests/test-model.js#L271). [test-queries.js](../tests/test-queries.js) at [37](../tests/test-queries.js#L37), [75](../tests/test-queries.js#L75), [119](../tests/test-queries.js#L119), [162](../tests/test-queries.js#L162). [test-relationships.js](../tests/test-relationships.js) at [31](../tests/test-relationships.js#L31), [55](../tests/test-relationships.js#L55), [124](../tests/test-relationships.js#L124). [test-validator.js:123](../tests/test-validator.js#L123). | Tested |
| F-MOD-003 | Attribute definition | Headless | [test-attributes.js](../tests/test-attributes.js) at [22](../tests/test-attributes.js#L22), [168](../tests/test-attributes.js#L168), [180](../tests/test-attributes.js#L180), [201](../tests/test-attributes.js#L201), [270](../tests/test-attributes.js#L270). [test-editor.js:41](../tests/test-editor.js#L41). [test-example.js:158](../tests/test-example.js#L158). [test-risk.js](../tests/test-risk.js) at [17](../tests/test-risk.js#L17), [62](../tests/test-risk.js#L62), [85](../tests/test-risk.js#L85), [111](../tests/test-risk.js#L111). | Tested |
| F-MOD-004 | Edit confirmation | Headless | [test-editor.js:13](../tests/test-editor.js#L13). [test-flows.js](../tests/test-flows.js) at [57](../tests/test-flows.js#L57), [79](../tests/test-flows.js#L79), [246](../tests/test-flows.js#L246), [260](../tests/test-flows.js#L260), [493](../tests/test-flows.js#L493). [test-model.js:101](../tests/test-model.js#L101). | Tested |
| F-MOD-005 | Entity deletion | Headless | [test-actions.js:32](../tests/test-actions.js#L32). [test-cascade.js:93](../tests/test-cascade.js#L93). [test-flows.js:417](../tests/test-flows.js#L417). [test-model.js:271](../tests/test-model.js#L271). | Tested |
| F-MOD-006 | Composition deletion | Headless | [test-cascade.js:93](../tests/test-cascade.js#L93) Nested cascade. [test-cascade.js:116](../tests/test-cascade.js#L116) Deletion against filing. | Tested |
| F-MOD-007 | Cascade confirmation | Headless | [test-cascade.js:61](../tests/test-cascade.js#L61) The deletion preview. [test-flows.js:417](../tests/test-flows.js#L417) Every deletion asks first. [test-queries.js:253](../tests/test-queries.js#L253) The cascade question counts what it takes. | Tested |
| F-MOD-008 | Undo action | Headless | [test-actions.js:32](../tests/test-actions.js#L32). [test-flows.js:93](../tests/test-flows.js#L93). [test-history.js](../tests/test-history.js) at [13](../tests/test-history.js#L13), [39](../tests/test-history.js#L39), [59](../tests/test-history.js#L59), [80](../tests/test-history.js#L80), [171](../tests/test-history.js#L171), [194](../tests/test-history.js#L194). [test-store.js:77](../tests/test-store.js#L77). | Tested |
| F-MOD-009 | Redo action | Headless | [test-actions.js:32](../tests/test-actions.js#L32). [test-history.js](../tests/test-history.js) at [13](../tests/test-history.js#L13), [39](../tests/test-history.js#L39), [59](../tests/test-history.js#L59), [194](../tests/test-history.js#L194). | Tested |
| F-MOD-010 | Library import | Headless | [test-flows.js](../tests/test-flows.js) at [622](../tests/test-flows.js#L622), [678](../tests/test-flows.js#L678). [test-library.js](../tests/test-library.js) at [50](../tests/test-library.js#L50), [100](../tests/test-library.js#L100). | Tested |
| F-MOD-011 | Record of related measures | Headless | [test-editor.js:133](../tests/test-editor.js#L133). [test-flows.js:396](../tests/test-flows.js#L396). [test-records.js](../tests/test-records.js) at [16](../tests/test-records.js#L16), [25](../tests/test-records.js#L25), [34](../tests/test-records.js#L34), [40](../tests/test-records.js#L40). | Tested |
| F-VIE-001 | Model views | Headless, pin, drive | [test-flows.js:517](../tests/test-flows.js#L517). [test-markdown.js](../tests/test-markdown.js) at [10](../tests/test-markdown.js#L10), [23](../tests/test-markdown.js#L23). [test-pins.js:123](../tests/test-pins.js#L123). [test-views.js](../tests/test-views.js) at [33](../tests/test-views.js#L33), [38](../tests/test-views.js#L38), [81](../tests/test-views.js#L81), [126](../tests/test-views.js#L126), [161](../tests/test-views.js#L161), [181](../tests/test-views.js#L181). [test-xlsx.js](../tests/test-xlsx.js) at [36](../tests/test-xlsx.js#L36), [46](../tests/test-xlsx.js#L46), [58](../tests/test-xlsx.js#L58), [69](../tests/test-xlsx.js#L69), [89](../tests/test-xlsx.js#L89). Open a view and print it. | Partly |
| F-VIE-002 | Messages | Headless | [test-records.js:40](../tests/test-records.js#L40) The findings. [test-relationships.js:474](../tests/test-relationships.js#L474) The messages table. | Tested |
| F-PER-001 | Project persistence | Headless, pin | [test-example.js](../tests/test-example.js) at [22](../tests/test-example.js#L22), [32](../tests/test-example.js#L32). [test-files.js](../tests/test-files.js) at [17](../tests/test-files.js#L17), [37](../tests/test-files.js#L37), [65](../tests/test-files.js#L65), [142](../tests/test-files.js#L142), [175](../tests/test-files.js#L175). [test-flows.js:347](../tests/test-flows.js#L347). [test-metamodel.js:40](../tests/test-metamodel.js#L40). [test-pins.js:153](../tests/test-pins.js#L153). [test-validator.js:215](../tests/test-validator.js#L215). | Tested |
| F-PER-002 | Library persistence | Headless | [test-library.js:15](../tests/test-library.js#L15) The catalogues the software ships. | Tested |
| F-PER-003 | Schema version | Headless | [test-files.js:37](../tests/test-files.js#L37) Round-trip stability. | Tested |
| F-PER-004 | Version migration | Headless | [test-files.js:85](../tests/test-files.js#L85) The gates, in order. The chain is empty until schema version 2 exists. A test of a real migration comes with it. | Partly |
| F-PER-005 | Unsupported version | Headless | [test-files.js:85](../tests/test-files.js#L85) The gates, in order. | Tested |
| F-PER-006 | Invalid file | Headless | [test-example.js:22](../tests/test-example.js#L22). [test-files.js](../tests/test-files.js) at [85](../tests/test-files.js#L85), [109](../tests/test-files.js#L109). [test-flows.js:661](../tests/test-flows.js#L661). [test-model.js:169](../tests/test-model.js#L169). [test-store.js:302](../tests/test-store.js#L302). [test-validator.js](../tests/test-validator.js) at [39](../tests/test-validator.js#L39), [57](../tests/test-validator.js#L57), [74](../tests/test-validator.js#L74), [83](../tests/test-validator.js#L83). | Tested |
| F-PER-007 | Migration preservation | Headless, to write | With the first migration, every key of a source fixture carried into the migrated file. | None |
| F-PER-008 | Version increment | Review | Every change to the structure of the file raises the schema version in `specs/project.schema.json` and `app/modules/files.js`. | Manual |
| F-PER-009 | Migration notice | Headless, to write | With the first migration that keeps content as legacy, the notice. | None |
| F-PER-010 | Attribute preservation | Headless | [test-files.js:17](../tests/test-files.js#L17). [test-flows.js:303](../tests/test-flows.js#L303). [test-model.js:63](../tests/test-model.js#L63). [test-project.js:71](../tests/test-project.js#L71). | Tested |
| F-PER-011 | Project templates | None | The function is not built. | None |
| F-DRW-001 | Drawing check | Headless | [test-drawing.js](../tests/test-drawing.js) at [20](../tests/test-drawing.js#L20), [47](../tests/test-drawing.js#L47), [62](../tests/test-drawing.js#L62), [72](../tests/test-drawing.js#L72). | Tested |
| F-DRW-002 | Drawing storage | Headless | [test-drawing-editor.js:110](../tests/test-drawing-editor.js#L110) The session, against a fake frame. [test-drawing.js:47](../tests/test-drawing.js#L47) A real export is accepted, and carries its model. | Tested |
| F-DRW-003 | External drawing editor | Headless, drive | [test-actions.js:190](../tests/test-actions.js#L190). [test-drawing-editor.js](../tests/test-drawing-editor.js) at [51](../tests/test-drawing-editor.js#L51), [86](../tests/test-drawing-editor.js#L86), [110](../tests/test-drawing-editor.js#L110). Create a drawing in the real editor, apply it, save the entity and edit it again. Press the editor's save shortcut once and find the drawing taken. | Partly |

### 2.4 Non-functional

| Id | Requirement | Method | Verification | Status |
|---|---|---|---|---|
| N-OPS-001 | No user account | Review | No page, dialog or module asks for an account or a sign-in. | Manual |
| N-OPS-002 | Self-contained | Pin, drive | [test-pins.js:50](../tests/test-pins.js#L50) The page states its content security policy first. [test-pins.js:80](../tests/test-pins.js#L80) Nothing leaves the page but by a link the user follows. With the network panel open, load and work, and find requests to the host only until the editor is opened. | Partly |
| N-OPS-003 | Fetch failure | Headless | [test-drawing-editor.js:110](../tests/test-drawing-editor.js#L110) The session, against a fake frame. | Tested |
| N-PRV-001 | Local processing | Review | Every module runs in the page, and the pins of N-PRV-002 rule out sending. | Manual |
| N-PRV-002 | No data transmission | Pin | [test-pins.js:80](../tests/test-pins.js#L80) Nothing leaves the page but by a link the user follows. [test-pins.js:109](../tests/test-pins.js#L109) Nothing is read from the address. | Tested |
| N-PRV-003 | No user tracking | Review | No module counts, records or reports use. | Manual |
| N-PRV-004 | On-device storage | Review | The store writes to IndexedDB, web storage, session storage and downloaded files only. | Manual |
| N-PRV-005 | Consent to hand over data | Headless, drive | [test-store.js:769](../tests/test-store.js#L769) The tab chosen per type: the session's. Create a drawing and find the dialog naming the origin and the diagram. | Partly |
| N-PRV-006 | Consent scope | Headless, drive | [test-store.js:769](../tests/test-store.js#L769) The tab chosen per type: the session's. Tick the box, open About, press Forget, and find the dialog on the next edit. | Partly |
| N-PRV-007 | Data minimisation | Headless, pin | [test-drawing-editor.js:110](../tests/test-drawing-editor.js#L110) The session, against a fake frame. [test-pins.js:66](../tests/test-pins.js#L66) The one frame, sandboxed, on the editor's origin. | Tested |
| N-SEC-001 | Safe parsing | Headless, pin | [test-drawing.js:20](../tests/test-drawing.js#L20). [test-pins.js](../tests/test-pins.js) at [50](../tests/test-pins.js#L50), [58](../tests/test-pins.js#L58). [test-validator.js](../tests/test-validator.js) at [74](../tests/test-validator.js#L74), [83](../tests/test-validator.js#L83). | Tested |
| N-SEC-002 | Safe rendering | Headless, pin | [test-editor.js:31](../tests/test-editor.js#L31) A hyperlink is presented as a link only when it is a web address. [test-pins.js:50](../tests/test-pins.js#L50) The page states its content security policy first. [test-pins.js:58](../tests/test-pins.js#L58) No module builds or parses markup from text. | Tested |
| N-SEC-003 | Drawing rendering | Headless, pin | [test-drawing.js:72](../tests/test-drawing.js#L72) What is refused, and why. [test-pins.js:97](../tests/test-pins.js#L97) A drawing reaches the page as an image from a data address. | Tested |
| N-SEC-004 | External application isolation | Headless, pin | [test-drawing-editor.js:51](../tests/test-drawing-editor.js#L51) The origin and the frame. [test-drawing-editor.js:69](../tests/test-drawing-editor.js#L69) What is heard. [test-pins.js:66](../tests/test-pins.js#L66) The one frame, sandboxed, on the editor's origin. | Tested |
| N-SEC-005 | No hidden content | Headless, pin | [test-editor.js:123](../tests/test-editor.js#L123). [test-example.js:158](../tests/test-example.js#L158). [test-flows.js](../tests/test-flows.js) at [303](../tests/test-flows.js#L303), [564](../tests/test-flows.js#L564), [601](../tests/test-flows.js#L601), [622](../tests/test-flows.js#L622). [test-model.js:118](../tests/test-model.js#L118). [test-pins.js:161](../tests/test-pins.js#L161). [test-project.js](../tests/test-project.js) at [16](../tests/test-project.js#L16), [50](../tests/test-project.js#L50). | Tested |
| N-SEC-006 | Content security policy | Pin | [test-pins.js:50](../tests/test-pins.js#L50) The page states its content security policy first. | Tested |
| N-SEC-007 | Framing | Pin, review | [test-pins.js:130](../tests/test-pins.js#L130) The host is told to refuse framing. The page from the host carries the header. A page on another origin that frames the software is refused by the browser. | Partly |
| N-SEC-008 | Hyperlink presentation | Headless | [test-editor.js:31](../tests/test-editor.js#L31) A hyperlink is presented as a link only when it is a web address. | Tested |
| N-SEC-009 | Failure on opening | Headless | [test-files.js:109](../tests/test-files.js#L109) A file too deep is refused, and an error on opening is a refusal. [test-flows.js:678](../tests/test-flows.js#L678) An import into a project the checks refuse says why it did nothing. | Tested |
| N-SEC-010 | No input from the address | Pin | [test-pins.js:109](../tests/test-pins.js#L109) Nothing is read from the address. | Tested |
| N-ACC-001 | Standard conformance | Pin, review | [test-pins.js:214](../tests/test-pins.js#L214) Pane headers are landmarks. [test-pins.js:248](../tests/test-pins.js#L248) Pointer targets. [test-pins.js:254](../tests/test-pins.js#L254) Text carries AA contrast in both themes. The other criteria of WCAG 2.2 AA need an audit in the browser with a screen reader. | Partly |
| N-ACC-002 | Colour independence | Headless, review | [test-icons.js:12](../tests/test-icons.js#L12) One distinct glyph per entity type. Each entity type's icon in the sprite is a distinct shape. | Partly |
| N-ACC-003 | Keyboard operability | Headless, drive | [test-actions.js:32](../tests/test-actions.js#L32). [test-flows.js:143](../tests/test-flows.js#L143). [test-overlay.js](../tests/test-overlay.js) at [76](../tests/test-overlay.js#L76), [105](../tests/test-overlay.js#L105). Walk every row of `docs/shortcuts.md` with the pointer unused. | Partly |
| N-CMP-001 | Desktop viewport | Pin, drive | [test-pins.js:241](../tests/test-pins.js#L241) The minimum viewport. Work at 1000 by 356 pixels and find every pane usable. | Partly |
| N-CMP-002 | Browser support | Headless, pin, drive | [test-pins.js:153](../tests/test-pins.js#L153) The file surface stays on the baseline. [test-pins.js:224](../tests/test-pins.js#L224) The pre-paint theme script speaks the store's literals. [test-store.js:636](../tests/test-store.js#L636) A browser without IndexedDB. Run the example and a drawing in the current Chrome, Edge, Firefox and Safari. | Partly |

### 2.5 Summary

| Class | Requirements | Tested | Partly | Manual | None |
|---|---|---|---|---|---|
| Constraints | 21 | 6 | 3 | 12 | 0 |
| Graphical | 7 | 3 | 1 | 3 | 0 |
| Functional | 42 | 30 | 7 | 2 | 3 |
| Non-functional | 25 | 12 | 9 | 4 | 0 |
| All | 95 | 51 | 20 | 21 | 3 |

| Open | Requirements |
|---|---|
| Wait on the first migration | F-PER-007, F-PER-009 |
| Wait on the function | F-PER-011 |

## 3. Verification to requirements

Every block below says in its title that it names no requirement. Each pins a choice made within a requirement that governs it more broadly.

| Blocks | What they cover |
|---|---|
| [test-actions.js](../tests/test-actions.js) at [160](../tests/test-actions.js#L160), [203](../tests/test-actions.js#L203) | The menus and the toolbar as laid out. |
| [test-example.js](../tests/test-example.js) at [42](../tests/test-example.js#L42), [72](../tests/test-example.js#L72), [100](../tests/test-example.js#L100), [112](../tests/test-example.js#L112) | The example's own content. |
| [test-files.js:156](../tests/test-files.js#L156) | The file name offered on saving. |
| [test-flows.js](../tests/test-flows.js) at [195](../tests/test-flows.js#L195), [464](../tests/test-flows.js#L464) | How refusals and removals are told. |
| [test-history.js](../tests/test-history.js) at [98](../tests/test-history.js#L98), [118](../tests/test-history.js#L118), [141](../tests/test-history.js#L141), [156](../tests/test-history.js#L156) | The history's mechanics under F-MOD-008 and F-MOD-009. |
| [test-library.js](../tests/test-library.js) at [31](../tests/test-library.js#L31), [157](../tests/test-library.js#L157) | The picker's presentation. |
| [test-metamodel.js:92](../tests/test-metamodel.js#L92) | The metamodel's lookups. |
| [test-model.js:333](../tests/test-model.js#L333) | The project's attributes under F-MOD-003. |
| [test-navigator.js:146](../tests/test-navigator.js#L146) | The tree's presentation. |
| [test-overlay.js](../tests/test-overlay.js) at [26](../tests/test-overlay.js#L26), [38](../tests/test-overlay.js#L38), [58](../tests/test-overlay.js#L58), [91](../tests/test-overlay.js#L91) | The overlay's mechanics. |
| [test-pins.js:310](../tests/test-pins.js#L310) | The version constants. |
| [test-queries.js](../tests/test-queries.js) at [139](../tests/test-queries.js#L139), [306](../tests/test-queries.js#L306), [358](../tests/test-queries.js#L358) | Labels and exclusions. |
| [test-relationships.js](../tests/test-relationships.js) at [338](../tests/test-relationships.js#L338), [375](../tests/test-relationships.js#L375), [388](../tests/test-relationships.js#L388), [411](../tests/test-relationships.js#L411) | The graph's presentation. |
| [test-risk.js](../tests/test-risk.js) at [132](../tests/test-risk.js#L132), [165](../tests/test-risk.js#L165) | The risk methods under F-MOD-003. |
| [test-shell.js](../tests/test-shell.js) at [20](../tests/test-shell.js#L20), [29](../tests/test-shell.js#L29), [49](../tests/test-shell.js#L49) | The theme and the tab title. |
| [test-store.js](../tests/test-store.js) at [128](../tests/test-store.js#L128), [150](../tests/test-store.js#L150), [175](../tests/test-store.js#L175), [373](../tests/test-store.js#L373), [394](../tests/test-store.js#L394), [462](../tests/test-store.js#L462), [503](../tests/test-store.js#L503), [726](../tests/test-store.js#L726), [885](../tests/test-store.js#L885) | The store's mechanics and the session's presentation state. |
| [test-text.js:9](../tests/test-text.js#L9) | The wording helpers. |

## 4. References

| No. | Reference | Link |
|---|---|---|
| [1] | openconformity, Requirements | ../specs/requirements.md |
| [2] | openconformity, Security audit of September 2026 | ../reviews/security-2026-09.md |
| [3] | openconformity, Security model | security.md |
