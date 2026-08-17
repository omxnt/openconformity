## Project

The project is named `openconformity`. It is a free, open-source, browser-based tool for CE marking of machinery under the Machinery Regulation (EU) 2023/1230, inspired by Model-Based Systems Engineering (MBSE).

## Stack

- Vanilla HTML, CSS, and JavaScript as ES modules
- No frameworks, libraries, or third-party code
- No build step, package manager, or server-side code
- No external network requests at runtime
- Third-party assets self-hosted and open-licensed

## Design

The interface follows the IBM Carbon Design System, its colour tokens, spacing scale, type scale, and component patterns. Token values are copied into the CSS. The Carbon packages are not used.

IBM Plex Sans is the typeface for prose and IBM Plex Mono for identifiers. Carbon Icons is the icon set. Both are vendored as files, nothing is imported or fetched.

## Structure

    app/            the published software
    site/           the published project site
    docs/           the project documentation
    schema/         the data model schema files
    sources/        the sources in editable formats
    sandbox/        the non-published work-in-progress
      app/          iterations of the software
      tests/        headless tests for the software
      site/         iterations of the project site
      demo/         frozen demonstration prototype
      poc/          frozen original proof of concept

## Publishing

    app/        →   app.openconformity.org
    site/       →   openconformity.org
    sandbox/    →   non-published

## Precedence

| # | Document | Authority | On disagreement |
|---|---|---|---|
| 1 | `docs/requirements.md` | Governs what the software does | The requirements are right |
| 2 | `docs/metamodel.md` | Governs what a model contains | The metamodel is right |
| 3 | `docs/attributes.md` | Derived from the metamodel | The attributes are wrong |
| 4 | `schema/project.schema.json` | Derived from the metamodel | The schema is wrong |
| 5 | `schema/library.schema.json` | Derived from the metamodel | The schema is wrong |
| 6 | `docs/decisions.md` | Reasoning behind the choices | The entry is out of date |

## Documents

| File | What it is | Read when |
|---|---|---|
| `docs/about.md` | Background, principles, and scope | Needing context on the project |
| `docs/requirements.md` | Requirements specification | Building or changing the software |
| `docs/metamodel.md` | Entity types and relationships | Working with entities or relationships |
| `docs/attributes.md` | Attributes per entity type | Working with entity attributes |
| `docs/decisions.md` | Decision log and rationale | Proposing something undiscussed |
| `docs/template.md` | Document form and structure | Writing or updating a document |
| `schema/project.schema.json` | Project file specification | Working with the project schema file |
| `schema/library.schema.json` | Library file specification | Working with the library schema file |

## Verification

There is no automated verification. Run a local server with `python3 -m http.server 8000` from the directory being tested, open the page, and check the browser console shows no errors or warnings.

## Rules

- **Never commit or push:** Propose the change and stop. The user reviews every change before it enters the repository.

- **Write only in the folder the task names:** Creating files counts as writing. Stop and ask before changing anything outside.

- **Never invent domain content:** Inferring intent from the request is fine. Filling gaps with hazards, requirements, standards content, or calculations nobody asked for is not.

- **Push back on bad instructions:** If the user is wrong, or a better approach exists, say so and wait for a go-ahead.

- **Keep rationale out of comments:** Comments say what the code does. The reasoning goes in the reply, where it can be reviewed.