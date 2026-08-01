## Project

The project is named `openconformity`. It is a free, open-source, browser-based tool for CE marking of machinery under the Machinery Regulation (EU) 2023/1230, inspired by Model-Based Systems Engineering (MBSE).

## Stack

- Vanilla HTML, CSS, and JavaScript as ES modules
- No frameworks, libraries, or third-party code
- No build step, package manager, or server-side code
- No external network requests at runtime
- Third-party assets self-hosted and open-licensed
- Runs from `file://`, so data loads as ES module imports
- No `fetch()` of local files, browsers block it under that scheme

## Structure

    app/            the published software
    site/           the published project site
    docs/           the project documentation
    schema/         the data model schema files
    sources/        the sources in editable formats
    sandbox/        the non-published work-in-progress
      app/          iterations of the software
      site/         iterations of the project site
      poc/          frozen original proof of concept

## Publishing

    app/        →   app.openconformity.org
    site/       →   openconformity.org
    sandbox/    →   non-published

## Documents

| File | What it is | Read when |
|---|---|---|
| `docs/about.md` | Background, principles, and scope | Needing context on the project |
| `docs/requirements.md` | Requirements specification | Building or changing the software |
| `docs/metamodel.md` | Entity types and relationships | Working with entities or relationships |
| `docs/user-interface.md` | Layout and interaction concept | Working on the user interface |
| `docs/decisions.md` | Decision log and rationale | Proposing something undiscussed |
| `docs/template.md` | Document form and structure | Writing or updating a document |
| `schema/project.schema.json` | Project file specification | Working with the project schema file |
| `schema/library.schema.json` | Library file specification | Working with the library schema file |

## Verification

There is no automated verification. Run a local server with `python3 -m http.server 8000` from the directory being tested, open the page, and check the browser console shows no errors or warnings. Then open the page directly via `file://` and confirm it still works, since `http://localhost` allows things that `file://` blocks.

## Rules

- **Never invent what wasn't specified:** Inferring intent from the request is fine. Filling gaps with content nobody asked for is not.

- **Ask when it's unclear:** If the answer isn't in the request, the code, or the documentation, it's the user's to decide.

- **Push back on bad instructions:** If the user is wrong, or a better approach exists, say so and wait for a go-ahead.

- **Never commit or push:** Propose the change and stop. The user reviews every change before it enters the repository.

- **Write only in the folder the task names:** Creating files counts as writing. Stop and ask before changing anything outside.

- **Add nothing the task doesn't need:** If something more is genuinely needed, stop and say so.

- **Keep rationale out of comments:** Comments say what the code does. The reasoning goes in the reply, where it can be reviewed.

- **Don't invent conventions:** None exist yet for code style. When one is needed, ask.