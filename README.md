<p align="center">
  <img src="app/assets/marks/lockup.svg" height="48" alt="openconformity">
</p>

## About

The openconformity project, short for open-source conformity assessment, is a free, open-source tool for CE marking of machinery under the Machinery Regulation (EU) 2023/1230. It runs in the browser, with nothing to install and no account, and keeps every project as a file on the user's own machine.

The tool borrows from Systems Engineering. The CE marking work is built as a model of the machinery product, the legislation and standards it falls under, the hazards it exhibits, the measures that reduce the risks, the requirements that follow, and the activities that verify them. Everything in the model is an entity with its own attributes, connected to the others by typed relationships, and every fact is stated once.

Artefacts such as the risk assessment and the safety function specification are generated as views of the model and exported, intended as input to the engineering documents the user assembles under their own quality system. The tool helps produce the meaningful artefacts of the CE marking work. It does not write reports.

The project is maintained by [omxnt](https://github.com/omxnt), one person with no company and no commercial interest behind it, and it moves when time allows.

## Status

In beta. The software is built and open to try at [app.openconformity.org](https://app.openconformity.org), and each release is listed with what changed on the [releases page](https://github.com/omxnt/openconformity/releases). The proof of concept and the demonstration prototype that preceded the software are kept as the tags `poc` and `demo`.

## Principles

The project rests on the following principles:

1. **Open source:** The software is free to use, and its source code is open. Anyone can inspect how it works, verify its claims, contribute to it, or adapt it to their own needs. There is no commercial interest behind the project.

2. **Minimal barriers:** The software runs entirely client-side, with no installation, no account, and no server required. The user opens the page and starts working.

3. **Privacy by design:** There is no tracking, no analytics, and no data collection of any kind. All processing happens in the user's browser. User data leaves it only when the user consents to edit a diagram in draw.io, and then only that diagram.

4. **User-owned data:** Projects are saved as local files, owned and controlled by the user. Data can be moved, backed up, or deleted at the user's sole discretion.

5. **Meaningful output:** The software generates raw engineering artefacts, such as applicable essential requirements, identified hazards, and requirements. These are exportable, intended as input to the engineering documents that the user assembles under their own quality system.

6. **Avoid conclusions:** The software never states any conclusion about the safety or conformity of the product, and does not generate reports. The responsibility for the CE marking remains with the manufacturer.

7. **Engineering work:** The software treats CE marking as engineering work, requiring competence, judgement, and knowledge of the applicable legislation and standards. It provides structure rather than shortcuts, with no checklists or wizards that promise conformity without understanding. The software cannot replace competence, it only makes competent work traceable, consistent, and reusable.

## Technology

Plain web platform, nothing added. The software is static files served as they are in the repository, and everything it does happens in the browser.

| Aspect | What |
|---|---|
| Stack | Vanilla HTML, CSS and JavaScript as ES modules. No framework, no build step, no package manager, no third-party code. |
| Design | IBM's Carbon Design System, its tokens copied into the stylesheet by value. IBM Plex for the type and Carbon Icons for the glyphs, both vendored with the software. |
| Network | Nothing is fetched at runtime. The one external application is the draw.io editor a diagram opens in, loaded only when the user consents, in a sandboxed frame. |
| Project | Kept in the browser between sessions and saved as a single local file in a versioned schema. |
| Views | Exported as Excel workbooks and Markdown bundles, written by the software itself. |
| Types | JSDoc comments, checked by TypeScript's checker over the plain files, with no build. |
| Tests | Headless tests under JavaScriptCore or Node, and browser drives in headless Chrome, run on GitHub before a change reaches the published branch. |
| Hosting | Static files on Cloudflare Pages, straight from the repository, with the security headers sent by the host. |

## Development

The specification comes first. The requirements and the metamodel say what the software does and what a model holds, and everything else follows them. Work is planned as GitHub issues under milestones, one issue to a change, and every design choice is written down with its reasoning in the decision log. The documents are kept current with the software, and a review of the code or a release is kept as a dated record.

The software is developed with an AI assistant, Claude Code. The assistant proposes changes and tests, and the maintainer decides what is made, runs every git command and signs every commit, so nothing enters the repository without that decision. Rulings on how the code is written are pinned by tests that read the source, and the suite, the verification document and the browser drives run on GitHub before a change reaches the published branch.

## Repository

```
openconformity/
├── app/            the published software
├── site/           the published project site
├── specs/          the specification and the schema
├── docs/           the formal documents, kept current
├── reviews/        the reviews, each against a state of the code
├── sources/        the sources in editable formats
├── tests/          headless tests for the software
└── temp/           the working material, meant to go
```

## Policies

| Document | Contents |
|---|---|
| [CHANGELOG.md](CHANGELOG.md) | What changed in each release |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to give feedback, and what is not taken |
| [SECURITY.md](SECURITY.md) | How to report a vulnerability |
| [LICENSE](LICENSE) | The EUPL-1.2 |
| [CLAUDE.md](CLAUDE.md) | The rules the assistant works under |

## Specification

| Document | Contents |
|---|---|
| [requirements.md](specs/requirements.md) | What it shall be and do |
| [metamodel.md](specs/metamodel.md) | What a model may contain |
| [attributes.md](specs/attributes.md) | What each entity type carries |
| [references.md](specs/references.md) | How a reference is written |
| [shortcuts.md](specs/shortcuts.md) | Every keyboard path through the software |
| [template.md](specs/template.md) | How a document is written |

## Documentation

| Document | Contents |
|---|---|
| [about.md](docs/about.md) | Why it exists and what it is |
| [decisions.md](docs/decisions.md) | What was chosen and why |
| [architecture.md](docs/architecture.md) | How the software is built |
| [security.md](docs/security.md) | How the software is kept secure |
| [verification.md](docs/verification.md) | How each requirement is verified |

## Disclaimer

The software is provided as is, under the terms of the EUPL-1.2, whose disclaimers of warranty and of liability apply. It is a work in progress, and it may hold defects, errors or gaps in what it knows of the legislation and the standards. Nothing in it is advice. Outputs may contain errors and are the user's to verify, against the sources themselves, before anything rests on them.

A fool with a tool is still a fool. CE marking is engineering work, and the software gives that work structure, not judgement. It cannot stand in for competence, or for knowledge of the legislation and the standards that apply, and it makes no finding about the safety or the conformity of a product. The manufacturer is responsible for the conformity assessment and for the compliance of their product.

## Security

The software keeps the user's data on the user's device, sends nothing to a server of its own, and reaches an external service only when the user consents. A vulnerability is reported privately, by GitHub's private vulnerability reporting or by email, never as a public issue. The scope, the known risks and what to expect of a report are in [SECURITY.md](SECURITY.md).

## Contribution

The project is one person's work and does not take code contributions for now, while feedback is welcome and shapes what comes next. Bugs and ideas go as GitHub issues, and anything not for the public eye goes by email, never a project file that holds confidential work. What to include in a report and how to take part beyond feedback are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Contact

[info@openconformity.org](mailto:info@openconformity.org)

## License

© 2026 omxnt, licensed under the [EUPL-1.2](LICENSE).

## Links

- [The project site](https://openconformity.org)
- [The beta software](https://app.openconformity.org)
- [The releases](https://github.com/omxnt/openconformity/releases)
- [Follow on LinkedIn](https://www.linkedin.com/company/openconformity)