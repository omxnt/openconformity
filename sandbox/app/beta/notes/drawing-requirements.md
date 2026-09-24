# Drawing requirements

**Proposed requirements, not issued.** The requirements a drawing attribute, an embedded draw.io editor and project templates fetched from the project's own origin would add to `docs/requirements.md`, drafted in the document's own form for the maintainer to rule on. They supersede the amendment texts in chapter 4 of `drawing-proposal.md`, which were written before the consent model settled. Identifiers are provisional until the document is issued. Delete when the requirements have been adopted or the feature dropped.

## 1. Shape of the set

- The ubiquitous requirements state the rule and the shape of any exception: a function the user invokes, which says what it fetches or hands over and from or to where, and which fails plainly. The functional requirements name the functions. So N-OPS-002, N-PRV-002 and N-SEC-002 gain one clause each, in words; the consent, scope, minimisation, isolation and failure rules are written once for any external service; and the two functions that fetch, the external editor and the project templates, each state their own what and where.
- As the document does throughout, a statement never names another requirement; a rationale may.
- The drawing is stored as the SVG text draw.io exports, one string in the attribute map, the editor's own model carried inside it. The storage form itself breaks no requirement.
- The editor is draw.io's hosted embed at its own origin, in a sandboxed frame. Nothing of it is vendored or bundled, so C-TEC-002 stays as written; C-TEC-008 states the boundary.
- Consent is asked on every edit, with a box not to be asked again for the browser session. Nothing is stored on the device beyond the session, and nothing in a file.
- Project templates are starter project files the maintainer publishes beside the software. Fetched from the project's own origin without user data, they need no consent; they are a fetch during use and so an exception to N-OPS-002, stated with the function. Bundled with the software instead, as the example project is, they would need no requirement at all.

## 2. Amendments to existing requirements

Three entries keep their statements and rationales and gain a clause naming the exception. Status stays `stable`, since what they require is unchanged.

---

#### N-OPS-002 Self-contained

`ubiquitous` `stable`

The software shall load all of its resources on initial load, and shall fetch nothing further during use, except for a function the user invokes that states what it fetches and from where.

> *Once loaded, the software runs from what the browser already holds, so work continues uninterrupted if the connection drops. A function that fetches is the exception, never the rule: it fetches only when the user invokes it, it says what it fetches and from where, and it fails plainly when the fetch fails (N-OPS-003). Which functions fetch, and what each may fetch, is stated with the function (F-DRW-003, F-PER-011).*

---

#### N-PRV-002 No data transmission

`ubiquitous` `stable`

The software shall not transmit user data to any external service, except what the user consents to hand to a named service for a function they invoke.

> *The confidential data a user enters, their model and its content, stays on their device and is never sent anywhere. Fetching the software itself is an ordinary web request to the host; the user's data is not part of it. The exception is the user's own act, with the service and the data named before it and bounded to what the function states (N-PRV-005 to N-PRV-007).*

---

#### N-SEC-002 Safe rendering

`ubiquitous` `stable`

The software shall render user-provided content as text, not as markup, drawings excepted.

> *Names, values, and descriptions a user enters are shown throughout the interface. They are rendered as text, never interpreted as markup, so content such as a tag or script in an entity name cannot alter or execute within the interface. A drawing is markup by nature and is shown as an image (N-SEC-003), which grants it the same: no script, no document, no network.*

## 3. Constraints

---

#### C-TEC-008 External application

`optional feature` `draft`

Where the software uses an external application, the application shall be separately hosted, neither included nor bundled with the software, and used only through a sandboxed frame.

> *C-TEC-002 keeps third-party code out of the software's files, and an external application stays out of them: it is another application the software talks to, not a library it runs. How the frame is sandboxed is a security requirement (N-SEC-004); stating the boundary here spares the next reader the argument.*

## 4. Functional

---

#### F-PER-011 Project templates

`event driven` `draft`

When the user chooses a project template, the software shall fetch it from the project's own origin, sending no user data, and shall open it as it opens a project file, subject to the same checks.

> *A template is a project file the maintainer wrote and published beside the software, so fetching it is what fetching the software already is, a request to the project's own host carrying nothing of the user's, and it needs no consent. It can be as stale or as malformed as any other file, so it passes the same gate, version, validity, migration, and can never bypass what a file cannot. The list of templates is fetched the same way, when the user opens the choice.*

---

#### F-DRW-001 Drawing import

`event driven` `draft`

When the user imports a drawing, the software shall accept it only as an SVG document within the drawing size limit that holds no script, event handler or executable reference, and shall otherwise refuse it and state why.

> *A drawing arrives from a file or an editor and is the first attribute whose content is not typed text. Refusing rather than repairing keeps the stored drawing exactly what its author made, and a diagram never legitimately holds a script.*

---

#### F-DRW-002 Drawing export

`event driven` `draft`

When the user exports a drawing, the software shall write the drawing as stored, unchanged.

> *The stored SVG carries the editor's own model inside it. Written unchanged, the file opens in the editor again with nothing lost, which is what makes the round trip through a file possible.*

---

#### F-DRW-003 External drawing editor

`complex` `draft`

Where the user has consented, when the user opens a drawing for editing, the software shall hand the drawing to the external drawing editor at the origin the software designates, and shall take back what the editor returns as the drawing, subject to the checks an imported drawing passes.

> *This is the function that fetches and hands data over, so it is the one that states what and where: the drawing being edited, nothing else, to one designated origin, draw.io's embed at the time of writing. Viewing a drawing never loads the editor; only an edit the user asks for does, and only after consent (N-PRV-005). What comes back is a drawing from outside and is checked as one (F-DRW-001).*

## 5. Non-functional

---

#### N-OPS-003 Fetch failure

`unwanted behaviour` `draft`

If a fetch a function makes does not succeed within its period, then the software shall state that the function is unavailable and shall leave the model unchanged.

> *Offline, blocked, or the resource gone, the software says so and the user loses nothing: an editor that never signals readiness is handed no drawing, and a template that never arrives replaces no project.*

---

#### N-PRV-005 Consent to hand over data

`event driven` `draft`

When the user invokes a function that hands data to an external service, the software shall obtain the user's consent first, stating the service's origin and the data handed over, unless the user has chosen during the browser session not to be asked again.

> *The choice is the user's to make, with the facts in front of them: which origin, and what it receives. Asking on every invocation keeps the choice deliberate; the session box lets a user who invokes the function all afternoon make it once, with the text in front of them.*

---

#### N-PRV-006 Consent scope

`ubiquitous` `draft`

The software shall keep a user's choice not to be asked again in browser session storage only, never in a project or library file, and shall offer a way to withdraw it.

> *Consent belongs to a person at a browser for a sitting, not to a project. A file that carried it would enable the function on every device it reached, and a choice that outlived the tab would be one the user could not remember making.*

---

#### N-PRV-007 Data minimisation

`state driven` `draft`

While an external service is in use, the software shall hand it the data the function states and nothing else.

> *The project, the other attributes and the device's storage stay out of reach even if the service is not what it claims to be.*

---

#### N-SEC-003 Drawing rendering

`optional feature` `draft`

Where an attribute holds a drawing, the software shall render it as an image that can neither execute code nor load a resource.

> *A drawing is markup by nature, so the text rule cannot apply to it. Shown as an image, the browser grants it no script, no document and no network, the same guarantee text has. A drawing that fails the software's own check is not shown and is preserved unchanged.*

---

#### N-SEC-004 External application isolation

`optional feature` `draft`

Where the software hosts an external application in its page, it shall host it in a sandboxed frame on an origin other than its own, permitting scripts and the application's own origin only, and shall accept messages only from that frame and origin, as data.

> *The frame cannot navigate the page, open windows, submit forms or reach the software's storage. The origin rule is what makes the sandbox hold: on the software's own origin the same permissions would let the application read the project.*

## 6. Scenarios the consent model is tested against

- **A customer's strict network, months after the user last drew.** Nothing outlasts a session, so the first edit that day asks, and the user can read the origin and decline. If they continue and the network blocks the request, the editor never signals readiness, nothing is handed over, and the notice says the function is unavailable. The one trace is a blocked request to the editor's origin in the network's logs, which the consent text names.
- **A file arrives holding a draw.io drawing, and the user has never consented.** The drawing renders as an image, exports to a file and can be replaced from a file. Only pressing Edit asks the question. Viewing fetches nothing.
- **The user cannot remember whether they ticked the box.** Nothing outlasts the tab, the button reads "Edit in draw.io" wherever it stands, and Help, About shows the session's choice with a way to withdraw it.

## 7. References

| No. | Reference | Link |
|---|---|---|
| [1] | Easy Approach to Requirements Syntax (EARS) | https://alistairmavin.com/ears/ |
| [2] | draw.io embed mode | https://www.drawio.com/doc/faq/embed-mode |
| [3] | Fetch Standard, CORS | https://fetch.spec.whatwg.org/#http-cors-protocol |
