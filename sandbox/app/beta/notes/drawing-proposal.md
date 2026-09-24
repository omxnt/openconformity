# Drawings in the app

**Assessment, not a plan.** A Drawing tab on three entity types, holding a diagram as a string attribute, previewed in view mode and edited through an external diagramming editor. This note records the question as it was put on 2026-09-24, the investigation that answered it, and the recommendation the maintainer rules on. Nothing here is built. Delete when the work has landed or been dropped.

## 1. The question

Investigation, not implementation: diagram attributes with an embedded diagram editor. Report only. The output is a written strategy to rule on.

The idea: a "Drawing" tab on Safety Function (SAF), System Element (ELM), and Protective Measure (PRM), holding a diagram attribute stored as text in the existing string-valued attribute map, rendered as a preview in view mode, and edited through an external diagramming editor. draw.io's embed mode (an iframe to embed.diagrams.net, the postMessage protocol, SVG with embedded XML as the storage form) is the obvious candidate. Evaluate it, but find the best solution rather than confirming this one: alternatives, self-hosted against hosted, or a reason not to build it at all are all legitimate outcomes.

Two things are non-negotiable and shape everything else.

**Security.** Treat this as the first external code the tool would ever load, and as the first attribute whose content is not human-typed text. Enumerate the threat model: a compromised or malicious editor origin; hostile SVG returned by the editor or arriving in a shared project file; postMessage spoofing; iframe escape, whether navigation, forms or top-level access; exposure of the diagram content to a third party; storage exhaustion through large or bitmap-laden diagrams. For each vector, what it can and cannot reach in this architecture, the mitigation, and how the mitigation is pinned by a test so it cannot regress. Be concrete about rendering, stored SVG must never execute, and weigh rendering through an image element with a data URI against sanitisation; about message origin verification; about iframe sandboxing, with the exact minimum permission set the protocol needs and why each; about what is posted, only the diagram being edited; and about whether the editor's wiring can be structurally absent from the page until the user enables it, verifying whether a dynamic import achieves that and how to pin it. State which rules ship with the storage kind regardless of any editor, because shared files carry SVG the moment the kind exists.

**Requirements.** Read `docs/requirements.md` in full. For every requirement the feature touches, state complies, needs interpretation, or violates, quoting the clause. Known suspects: N-OPS-002 on external fetching, the N-PRV group on data leaving the browser, N-SEC-001 and N-SEC-002 on untrusted content and text-only construction, C-TEC-005 on self-containment, F-PER-010 on attribute preservation, the schema's strings-only rule. Do not soften a violation into an interpretation. For each violation, draft the minimal amendment that would permit the feature under explicit conditions, in the requirements' own style; the conditions should encode the recommended consent model: where the setting lives, that files carry no setting, that viewing never fetches, how consent is obtained and renewed, how network refusal fails.

More briefly: storage and format, fitting the string map, verbatim and byte-stable, diffable, size estimates and the browser storage ceiling, whether the audit's blob-split watch item should be pulled forward; integration shape, the kind in `attributes.js` and `attributes.md` as one definition reused by the three types, view and edit rendering of the Drawing tab, draft semantics under the existing guard machinery, the overlay owner hosting the editor, the protocol sequence with its failure paths; and effort per layer.

End with the requirement amendments needed before any code, the security rules that ship with the storage kind regardless of the editor, the recommended solution with reasons, and a build order with estimates. Settled design is settled. If the feature should not be built, say so with the failure scenario.

## 2. Verdict

Build the drawing kind with import, preview and export now. It touches one requirement and needs no consent model. Do not build the embedded editor now. It turns the product's by-construction privacy into a by-consent promise, breaks four stable requirements and one decision, and buys convenience rather than capability, since draw.io desktop edits the same file offline for free. If it is wanted anyway, the design in chapters 3 to 5 is complete and bounded, and it sits on top of the kind without rework.

## 3. Security

### 3.1 Threat model

"Reach" is what the vector can touch in this architecture. The rules marked K ship with the storage kind whatever the editor decision, because a shared project file can carry SVG the day the kind exists.

| Vector | Reach | Mitigation | Pin |
|---|---|---|---|
| Hostile SVG in a shared file or pasted in | Nothing, if rendered as an image. Inline SVG would give it script, DOM and network. | K1: render only through an `img` element with a `data:image/svg+xml` source. Never inline, never innerHTML, never object, embed or srcdoc. K2: check before accepting and before rendering; refuse script elements, event-handler attributes, `javascript:` and `data:text/html` references, stylesheet instructions, a non-SVG root, and anything over the size cap. A stored drawing that fails the check shows a placeholder and stays exportable raw. | Unit tests on the check with fixtures: a real draw.io export accepted, each refusal case refused. A pin that no module holds innerHTML, insertAdjacentHTML, outerHTML or srcdoc, and that DOMParser appears only in the drawing check with the result never inserted. A pin on the `img` construction. |
| SVG loading external resources or tracking pixels | None in image mode: the browser fetches nothing for an SVG shown as an image. | K1, plus K3: a content security policy on the page with `img-src 'self' data:` and `connect-src 'none'`. | Pin on `index.html` holding the exact policy string. |
| Storage exhaustion, bitmap-laden diagrams | Browser storage, about 5 MB in Safari and about 10 MB in Chromium and Firefox per origin. The file save is unaffected. | K4: a cap per drawing; 256 KB is enough for any vector diagram and blocks pasted screenshots. The existing persist failure flag already warns before unload when storage refuses. | Unit test on the cap. Existing pin on the persist failure path. |
| Compromised or malicious editor origin | Only the one drawing handed to it, plus the user's IP and user agent from the page request. Not the project, not the app's storage, not the parent DOM, not the file system. It can exfiltrate that drawing, show a phishing surface inside its frame, return a hostile SVG, or refuse to work. | Data minimisation: post only the drawing being edited, never the project. The returned SVG passes K2 before it enters the draft. The dialog chrome is the software's and names the origin. The editor runs on an origin other than the app's, always. | Pin on the load message built from the one drawing. Pin on the origin constant not being the app's. |
| Message spoofing | A message from any window reaching the handler. | Accept a message only when `event.source` is the editor frame's window and `event.origin` equals the editor origin. Parse as JSON in a try, check the shape, cap the payload, ignore unknown events. Post with the explicit target origin, never `*`. | Unit test of the filter with fake events. Pin on `postMessage(message, EDITOR_ORIGIN)`. |
| Frame escape | Top navigation, forms, popups, modal prompts, downloads. | `sandbox="allow-scripts allow-same-origin"` and nothing else. Scripts because the editor is one. Same-origin because the editor fetches its own stencils and templates over XHR from its origin, which an opaque origin turns into a refused cross-origin request, and because without it every message arrives with origin `null` and the origin check weakens. The pairing is safe only because the editor is cross-origin; on the app's own origin it would let the frame shed its sandbox and read the project blob, which is why the origin rule is absolute. No popups: the editor's own `openLink` event hands links to the software, which opens them noopener as the shell already does. Add `referrerpolicy="no-referrer"` and an empty `allow` list. | Pin on the exact sandbox string, the referrer policy and the allow attribute. |
| Exposure to a third party | The editor origin's operator sees the page request and runs code that holds the drawing. | Consent before the first load, off by default, the setting on the device only. Modern browsers partition the editor origin's storage per embedding site, so another site's frame of the same editor cannot read a draft left behind. | Pin that the consent key is a store session key and never in the file object. |
| Wiring present before enabling | A frame or a request existing when nothing was enabled. | No `iframe` in `index.html`, the element created only inside the enable path, `frame-src` in the policy naming the editor origin only. A dynamic import would keep the module out until enabling, but it is itself a fetch during use and so breaks N-OPS-002's letter. Import the wiring statically, it is the software's own small module, and keep the frame element absent until consent. | Pin on `index.html` having no frame. Headless check that no frame exists before enabling. |

### 3.2 Rendering

Decided: an `img` element with a data URI, not sanitisation. Sanitising means writing an allowlist parser, keeping it right as browsers change, and then still inserting the result live. Image mode is the browser's own sandbox and costs one line. Its price is no interaction inside the preview, which the Drawing tab does not need. The check K2 stays as defence in depth and as a file hygiene rule, not as the thing safety rests on.

### 3.3 Rules that ship with the kind

These hold whether or not an editor is ever built.

1. K1. A drawing is rendered only as an image from a data URI. No inline SVG, no innerHTML, no object, embed or srcdoc anywhere in the software.
2. K2. A drawing is checked before it is accepted and before it is rendered: well-formed XML with an `svg` root, no script elements, no event-handler attributes, no `javascript:` or `data:text/html` references, no stylesheet instructions, within the size cap. A stored drawing that fails is shown as a placeholder and remains exportable unchanged.
3. K3. The page carries a content security policy: `img-src 'self' data:`, `connect-src 'none'`, `frame-src 'none'` until an editor is enabled by requirement, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`. The inline theme script moves to a file so the policy needs no hash.
4. K4. A drawing is at most 256 KB. The persist failure path stays as the storage backstop.
5. The stored string is the editor's output verbatim, never re-serialised; the preview derives from it.

## 4. Requirements

### 4.1 Compliance

Every requirement the feature touches, with the kind alone and with the embedded editor.

| Requirement | Kind alone | With the editor |
|---|---|---|
| C-DEV-005, self-contained so it can be served from anywhere | Complies | Needs interpretation: served elsewhere, the editor still points at its fixed origin, and the feature degrades to import without it |
| C-TEC-002, "shall not include third-party code" | Complies | Violates in intent: the rationale is "no supply chain to secure and no dependency to rot, which a solo maintainer can neither audit nor keep current", and an editor running inside the page is exactly that. The letter is met only because the code is not in the files |
| C-TEC-005, third-party assets self-hosted | Not touched | A self-hosted editor is code, and the rationale says code is allowed nowhere assets are |
| C-TEC-007, no server-side code | Complies | Complies |
| F-SES-002, persist on change | Complies, within the cap | Same |
| F-MOD-003, only defined attributes | Complies once the kind is in `attributes.md` | Same |
| F-MOD-004, no change until confirmed | Complies: the drawing enters the draft, the model changes on Save | Complies only if editor autosave writes to the draft and never to the model |
| F-PER-001 and the schema, strings only | Complies: the drawing is a string attribute, no structure change, no version bump | Same |
| F-PER-008, version speaks for structure | Complies | Same |
| F-PER-010, preserve unpresented content | Complies: an older build carries the string unchanged, and the new build stores the editor's output verbatim | Same |
| N-OPS-002, "shall fetch nothing further during use" | Complies | Violates: opening the editor fetches a page and its resources during use |
| N-PRV-001, processing on the device | Complies | Needs interpretation: the editor runs on the device, but its code comes from elsewhere |
| N-PRV-002, "shall not transmit user data to any external service" | Complies | Violates: the drawing is handed to code the external service controls. No byte leaves by design, but the rationale promises the data "is never sent anywhere" by construction, and this architecture cannot make that promise once the drawing is inside that frame |
| N-PRV-003, no tracking | Complies | Needs interpretation: the software tracks nothing, but the editor origin sees a request per session |
| N-PRV-004, data on the device | Complies | Needs interpretation: the editor may keep a draft in its own origin's storage, still on the device |
| N-SEC-001, no execution of imported data | Complies with K1 | Complies with K1 and the message shape check |
| N-SEC-002, "render user-provided content as text, not as markup" | Violates: a preview renders the content as image markup, inert but markup | Same |
| N-ACC-001, WCAG AA | Complies with alt text on the preview | Needs interpretation: the editor's conformance is the third party's |
| D-011, "No third-party assets are loaded at runtime" | Complies | Superseded, needs an entry |

The kind alone needs one amendment. The editor needs five more, a companion to C-TEC-002, and a decision entry.

### 4.2 Amendment for the kind

```markdown
#### N-SEC-003 Drawing rendering

`optional feature` `draft`

Where an attribute holds a drawing, the software shall render it as an image that can neither execute code nor load a resource.

> *A drawing is markup by nature, so N-SEC-002's text rule cannot apply to it. Shown as an image, the browser grants it no script, no document and no network, which is the same guarantee N-SEC-002 gives text. A drawing that fails the software's own check is not shown, and is preserved unchanged.*
```

### 4.3 Amendments for the editor

```markdown
#### N-OPS-003 External editor loading

`optional feature` `draft`

Where the user has enabled the external drawing editor on the device, when the user opens a drawing for editing, the software shall load the editor from its designated origin, and at no other time.

> *The sole exception to N-OPS-002. Viewing a drawing never loads anything; only an edit the user asks for does, and only after enabling. The origin is fixed in the software, so the user can know it.*

#### N-OPS-004 External editor unavailable

`unwanted behaviour` `draft`

If the external drawing editor does not signal readiness within the loading period, then the software shall state that the editor could not be loaded and shall leave the drawing unchanged.

> *Offline or blocked, the software fails plainly and loses nothing; the drawing can still be imported from a file.*

#### N-PRV-005 External editor consent

`event driven` `draft`

When the user first opens a drawing for editing on a device, the software shall obtain the user's consent before loading the external drawing editor, stating the editor's origin and that the drawing being edited is handed to it.

> *The sole exception to N-PRV-002, and it is the user's to make, per device, with the facts in front of them: which origin, and what it receives.*

#### N-PRV-006 Consent on the device

`ubiquitous` `draft`

The software shall record the enabling of the external drawing editor in browser storage on the device only, never in a project or library file, and shall ask again when the designated origin changes or the browser's site data has been cleared.

> *Consent is a property of a person and a device, not of a project. A file that carried it would enable the editor on every device it reached. A new origin is a new party, and consent given to the old one does not transfer.*

#### N-PRV-007 Editor data minimisation

`state driven` `draft`

While the external drawing editor is open, the software shall hand it the drawing being edited and nothing else.

> *The project, the other drawings and the device's storage stay out of reach even if the editor is not what it claims to be.*

#### N-SEC-004 External editor isolation

`optional feature` `draft`

Where the software loads the external drawing editor, it shall host it in a sandboxed frame on an origin other than its own, permitting scripts and the editor's own origin only, and shall accept messages only from that frame and origin, as data.

> *The frame cannot navigate the page, open windows, submit forms or reach the software's storage. The origin rule is what makes the sandbox hold: on the software's own origin the same permissions would let the editor read the project.*
```

C-TEC-002 stays as written. It needs a companion, a new C-TEC-008 stating that the external editor is a separately hosted application the software neither includes nor bundles, used only through the frame N-SEC-004 describes. D-011 needs a superseding entry saying the editor is the one runtime load, under consent.

## 5. Solution

### 5.1 Alternatives weighed

- **The hosted embed at embed.diagrams.net.** The protocol is made for this: the frame posts `init`, the software posts `load` with the diagram XML, posts `export` with format `xmlsvg` on Apply and receives the SVG as a data URI in the `export` event, and `openLink` lets it keep popups closed. Best editor, nothing to maintain, but a third-party origin running live code in the page and the six amendments above.
- **A self-hosted copy on a second origin.** It removes the third party at runtime, which is the version consistent with D-011's stance. It also puts tens of megabytes of code the maintainer cannot audit into the deployments, makes the maintainer the one shipping its security fixes, still needs the frame and the protocol, and still breaks N-OPS-002 and C-TEC-002, now literally. Worst of both. Rejected.
- **A built-in editor.** Thousands of lines for a poor editor. Rejected.
- **The kind with import, preview and export.** The user draws in draw.io desktop, offline and free, exports SVG, and imports it on the Drawing tab. draw.io keeps its diagram XML inside the SVG, so the exported file opens in draw.io again and the round trip is lossless. Two clicks each way. No external code, no consent, one amendment.

The last is the recommendation. The by-construction privacy is the product's distinguishing property and the reason a manufacturer can put confidential data in it; the embed's marginal value is convenience, since the same editor exists offline; and the embed adds a consent surface, a protocol layer and a third party's uptime to a solo maintainer's watch list. If the ruling is for the embed anyway, take the hosted one with consent, not self-hosting, and build it after the kind.

### 5.2 Storage and format

One string attribute holding the editor's SVG with its embedded XML, stored exactly as accepted, never re-serialised. It fits the string map, needs no schema change, and an older build carries it untouched. Sizes: a ten-shape block diagram exports at about 15 to 30 KB with the XML inside, a forty-shape architecture at 60 to 120 KB, a pasted screenshot adds 300 KB to 2 MB. The 256 KB cap admits every vector diagram and refuses screenshots. Thirty drawings at 50 KB add 1.5 MB to a project that is otherwise under half a megabyte, inside every browser's ceiling with room. Diffs in git show the attribute's one line changed, not the shapes; pretty-printing would break byte stability, so it is left alone. The blob-split watch item from the audit stays where it is: the cap and the existing persist failure flag cover beta, and a project size figure in the file dialog is a cheap early warning. Revisit when a real project passes about 3 MB.

### 5.3 Integration shape

One definition, `{ key: 'drawing', name: 'Drawing', kind: 'drawing', help }`, in a Drawing tab before Notes on SAF, ELM and PRM. View mode: the `img` scaled to the cell width with the attribute name as alt text, the size beneath, an Export button that downloads the SVG, and a placeholder where there is no drawing or the check fails. Edit mode: the same preview, Import opening the file picker and reading the file as text through the check into a hidden control carrying the key, and Remove clearing it. The hidden control is what the set and the table already do, so the draft, Save, Cancel and the discard guard work unchanged and the model changes on Save alone.

With the editor: an Edit button on the tab, the consent dialog on first use, then a dialog sized to the pane hosting the frame as an overlay entry, Apply disabled until `init`, Apply posting `export` and closing on the `export` event after the check, Cancel posting nothing and closing, a loading period of ten seconds before the unavailable notice, and the editor's `exit` with modified handled by the software's own discard question. The mxfile for `load` is read from the stored SVG's `content` attribute; an SVG from another tool opens the editor empty with a notice that Apply will replace it.

### 5.4 Effort

| Layer | Lines | Rounds |
|---|---|---|
| Kind in `attributes.js` and the draft, three tabs | 40 | |
| Check module with fixtures and tests | 200 | |
| View and edit rendering, styles | 180 | |
| Policy on the page, theme script moved to a file for it, pins | 40 | |
| Kind in total | about 460 | 1 |
| Consent dialog and device setting | 60 | |
| Frame dialog, protocol, failure paths, tests | 350 | |
| Editor in total | about 410 | 2 |

### 5.5 Build order

1. Rule on N-SEC-003, since the kind cannot ship under N-SEC-002 as written.
2. One round for the kind: the check module and its tests, the kind and the tabs, the rendering, the policy and the pins, a headless drive importing a real draw.io export and a hostile fixture.
3. Only after a ruling on the six editor amendments, C-TEC-008 and the D-011 entry: two rounds for the editor, the consent and the frame with the filter and sandbox pins, then the protocol with its failure paths and a headless drive against the real origin.

## 6. References

| No. | Reference | Link |
|---|---|---|
| [1] | draw.io embed mode | https://www.drawio.com/doc/faq/embed-mode |
| [2] | Content Security Policy Level 3 | https://www.w3.org/TR/CSP3/ |
| [3] | HTML Living Standard, the iframe sandbox attribute | https://html.spec.whatwg.org/multipage/iframe-embed-object.html#attr-iframe-sandbox |
