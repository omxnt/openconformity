# Manual activities

The drives and the reviews that verify a requirement where no test can. Each row is one activity, written here once, as the test blocks write theirs in their headers. The generator reads this file.

| Id | Technique | Where | What it checks | Requirements |
|---|---|---|---|---|
| V-ANA-001 | Review | The repository on GitHub | The repository name, the page title and the wordmark read openconformity | C-PRJ-001 |
| V-ANA-002 | Review | The host's dashboard and its responses | The domain is registered, and the software and the site are served at its addresses | C-PRJ-002 |
| V-ANA-003 | Review | The repository on GitHub | The site, the software and the repository carry no advertising, paid feature or sponsorship | C-PRJ-004 |
| V-ANA-004 | Review | The files of the repository | No standard's content is transcribed. The methods and their source. Every method names its source. The pin catches known patterns only, so the attributes, the example and the catalogue are also read for clause text | C-PRJ-005 |
| V-ANA-005 | Review | The repository on GitHub | The way to report a vulnerability is published where tools look. `SECURITY.md` names the channel, the scope, the versions and the aim, and private vulnerability reporting is enabled in the repository settings | C-PRJ-006 |
| V-ANA-006 | Review | The repository on GitHub | The repository is public on GitHub | C-DEV-001 |
| V-ANA-007 | Review | The host's dashboard and its responses | The host project is on Cloudflare Pages | C-DEV-002 |
| V-ANA-008 | Review | The site and the page | `sources/visual-assets.fig` holds the wordmark and the marks | C-DEV-004 |
| V-ANA-009 | Review | The host's dashboard and its responses | The host serves `app/` at `app.openconformity.org` | C-DEV-005 |
| V-ANA-010 | Review | The repository on GitHub | Each merge to main follows a run with every test file passed and a clean console, and the release notes name the run | C-DEV-006 |
| V-ANA-011 | Review | The host's dashboard and its responses | Each file under `app/` fetched from the host hashes as in the released commit. Rocket Loader, Auto Minify, Email Address Obfuscation and Web Analytics injection are off | C-DEV-007 |
| V-ANA-012 | Review | The repository on GitHub | Every commit on main was reviewed by the maintainer before it was merged, read from the history at each release | C-DEV-008 |
| V-ANA-013 | Review | The accounts | Both accounts show a second factor, read at each release | C-DEV-009 |
| V-ANA-014 | Review | The host's dashboard and its responses | The host's branch control deploys main alone with previews off, read at each release | C-DEV-010 |
| V-ANA-015 | Review | The host's dashboard and its responses | The host has no build command and serves `app/` as it is | C-TEC-003 |
| V-ANA-016 | Review | The files of the repository | The licences ride with the software. Every glyph drawn is in the sprite, with its provenance. Each `ORIGIN.md` under `app/assets/` matches the files beside it | C-TEC-005 |
| V-ANA-017 | Review | The files of the repository | The software is reached by an address and installs nothing | C-TEC-006 |
| V-ANA-018 | Review | The host's dashboard and its responses | The software is static files of the web platform. The host settings run no functions | C-TEC-007 |
| V-ANA-019 | Review | The site and the page | `app/assets/marks/wordmark.svg` against the properties the requirement lists | G-IDN-001 |
| V-ANA-020 | Review | The files of the repository | `app/assets/marks/favicon.svg` in a light and a dark browser tab | G-IDN-002 |
| V-ANA-021 | Review | The files of the repository | The tokens in `app/style.css` and the components against Carbon | G-SYS-001 |
| V-DEM-001 | Drive | The software in a browser | Pane headers are landmarks. Open a project and find the shell bar, the navigator at full height, and the editor over the relationship pane | G-SYS-005 |
| V-DEM-002 | Drive | The software in a browser | The minimum viewport. Narrow the window below 1000 pixels and find the notice | F-APP-001 |
| V-DEM-003 | Drive | The software in a browser | The tests use an in-memory stand-in for browser storage. Reload the page and find the project, the selection and the expansion | F-SES-001 |
| V-DEM-004 | Drive | The software in a browser | Make a change, reload, and find it kept | F-SES-002 |
| V-DEM-005 | Drive | The software in a browser | Clear browser data asks, then forgets. Clear browser data forgets everything. Clear stored data, then find no record in the database and no session key in the storage inspector | F-SES-003 |
| V-DEM-006 | Drive | The software in a browser | Select an entity in the tree and find its attributes in the editor pane | F-WSP-002 |
| V-DEM-007 | Drive | The software in a browser | at , , , , , . at , , , , . Open each view, save it in every format it offers, and open the saved files | F-VIE-001 |
| V-ANA-022 | Review | The files of the repository | Every change to the structure of the file raises the schema version in `specs/project.schema.json` and `app/modules/files.js` | F-PER-008 |
| V-DEM-008 | Drive | The software in a browser | Create a drawing in the real editor, apply it, save the entity and edit it again. Press the editor's save shortcut once and find the drawing taken | F-DRW-003 |
| V-ANA-023 | Review | The accounts | No page, dialog or module asks for an account or a sign-in | N-OPS-001 |
| V-DEM-009 | Drive | The software in a browser | The page states its content security policy first. Nothing leaves the page but by a link the user follows. With the network panel open, load and work, and find requests to the host only until the editor is opened | N-OPS-002 |
| V-ANA-024 | Review | The files of the repository | Every module runs in the page, and the pins of N-PRV-002 rule out sending | N-PRV-001 |
| V-ANA-025 | Review | The files of the repository | No module counts, records or reports use | N-PRV-003 |
| V-ANA-026 | Review | The files of the repository | The store writes to IndexedDB, web storage, session storage and downloaded files only | N-PRV-004 |
| V-DEM-010 | Drive | The software in a browser | The tab chosen per type: the session's. Create a drawing and find the dialog naming the origin and the diagram | N-PRV-005 |
| V-DEM-011 | Drive | The software in a browser | The tab chosen per type: the session's. Tick the box, open About, press Forget, and find the dialog on the next edit | N-PRV-006 |
| V-ANA-027 | Review | The host's dashboard and its responses | The responses from both hosts carry every header of the headers file, the policy, transport security, no sniffing, no referrer, no opener and no device feature, and an unknown path answers not found. A page on another origin that frames the software is refused by the browser | N-SEC-006, N-SEC-007 |
| V-ANA-028 | Review | The host's dashboard and its responses | Pane headers are landmarks. Pointer targets. Text carries AA contrast in both themes. The other criteria of WCAG 2.2 AA need an audit in the browser with a screen reader | N-ACC-001 |
| V-ANA-029 | Review | The files of the repository | One distinct glyph per entity type. Each entity type's icon in the sprite is a distinct shape | N-ACC-002 |
| V-DEM-012 | Drive | The software in a browser | Walk every row of `docs/shortcuts.md` with the pointer unused | N-ACC-003 |
| V-DEM-013 | Drive | The software in a browser | The minimum viewport. Work at 1000 by 356 pixels and find every pane usable | N-CMP-001 |
| V-DEM-014 | Drive | The software in a browser | The file surface stays on the baseline. The pre-paint theme script speaks the store's literals. A browser without IndexedDB. Run the example and a drawing in the current Chrome, Edge, Firefox and Safari | N-CMP-002 |
| V-DEM-015 | Drive | The software in a browser | Open a project and select nothing. The relationship pane keeps its head, with the Graph and List tabs, the filter and Add relationship disabled and the collapse button working, over the empty state that asks for an entity | F-WSP-003, N-ACC-001 |
| V-DEM-016 | Drive | The software in a browser | Collapse a folder, then select one of its entities in the graph, and again from the risk assessment view. Each time the folder opens, the row is highlighted and the tree scrolls it into view | F-WSP-001, F-WSP-003 |
