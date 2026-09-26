## Project

The project is named `openconformity`. It is a free, open-source, browser-based tool for CE marking of machinery under the Machinery Regulation (EU) 2023/1230, inspired by Model-Based Systems Engineering (MBSE).

## Stack

- Vanilla HTML, CSS, and JavaScript as ES modules
- No frameworks, libraries, or third-party code
- No build step, package manager, or server-side code
- No network requests at runtime unless the user consents
- Third-party assets self-hosted and open-licensed

## Design

The interface follows the IBM Carbon Design System, its colour tokens, spacing scale, type scale, and component patterns. Token values are copied into the CSS. The Carbon packages are not used.

IBM Plex Sans is the typeface for prose and IBM Plex Mono for identifiers. Carbon Icons is the icon set. Both are vendored as files, nothing is imported or fetched.

## Structure

    app/            the published software
    site/           the published project site
    specs/          the specification and the schema
    sources/        the sources in editable formats
    tests/          headless tests for the software
    notes/          the decisions and the working notes

## Publishing

    app/        →   app.openconformity.org
    site/       →   openconformity.org

## Precedence

| # | Document | Authority | On disagreement |
|---|---|---|---|
| 1 | `specs/requirements.md` | Governs what the software does | The requirements are right |
| 2 | `specs/metamodel.md` | Governs what a model contains | The metamodel is right |
| 3 | `specs/project.schema.json` | Derived from the metamodel | The schema is wrong |
| 4 | `notes/attributes.md` | Derived from the metamodel | The attributes are wrong |
| 5 | `notes/decisions.md` | Reasoning behind the choices | The entry is out of date |

## Documents

| File | What it is | Read when |
|---|---|---|
| `notes/about.md` | Background, principles, and scope | Needing context on the project |
| `specs/requirements.md` | Requirements specification | Building or changing the software |
| `specs/metamodel.md` | Entity types and relationships | Working with entities or relationships |
| `notes/attributes.md` | Attributes per entity type | Working with entity attributes |
| `notes/decisions.md` | Decision log and rationale | Proposing something undiscussed |
| `notes/template.md` | Document form and structure | Writing or updating a document |
| `specs/project.schema.json` | Project file specification | Working with the project schema file |

## Verification

Run the test suite with `./run.sh` from `tests`; every file must report all checks passed. Then run a local server with `python3 -m http.server 8000` from `app`, open the page, and check the browser console shows no errors or warnings.

## Rules

- **Present, then ask:** Summarise what would change, file by file and sized to one commit, and wait for a go. Only an unambiguous instruction to act, such as "implement X now", skips the asking. A question, a maybe, or a what do you think is presented and asked about, and when in doubt, ask.

- **Change exactly what was agreed:** After the go, make that change and nothing more, then give the commit line. The protected documents are never edited, their text is proposed for the user to paste.

- **Never commit or push:** The user runs every git command and reviews every change before it enters the repository. A proposed commit line is one subject in the user's voice, with no body and no trailer.

- **Never invent domain content:** Inferring intent from the request is fine. Filling gaps with hazards, requirements, standards content, or calculations nobody asked for is not.

- **Push back on bad instructions:** If the user is wrong, or a better approach exists, say so and wait for a go.

- **Keep rationale out of comments:** Comments say what the code does. The reasoning goes in the reply, where it can be reviewed.

- **Write plain prose:** Short sentences, one claim each. No em dashes, and no colons or semicolons as joints, in documents, in the interface and in the reply. Help text is one plain sentence.

- **One word for one thing:** Use the vocabulary the requirements and the interface already use, and never introduce a synonym for a concept that has a name.