# openconformity

The openconformity project, short for open-source conformity assessment, is an initiative to develop a free, open-source tool for CE marking of machinery according to the Machinery Regulation (EU) 2023/1230. The tool is browser-based and runs entirely client-side, with no installation or account required.

*This is a personal hobby project maintained by [omxnt](https://github.com/omxnt), with no company and no commercial interests behind it. The project is updated when time allows.*

## Status

In beta. The software is built and open to try at app.openconformity.org. The documentation is kept in step with it. The proof of concept and the demonstration prototype that preceded the software are kept as the tags `poc` and `demo`.

## What it is

The tool offers an approach to CE marking using concepts borrowed from the domain of Systems Engineering (SE). The CE marking work itself is modelled using entities with semantic relationships between them, where each entity carries its own attributes. The semantic relationships represent the connections between the different types of entities, defining how they interact and relate to each other.

Artefacts can be generated as views of the model, exported and intended as input to the engineering documents that the user assembles under their own quality system. The idea behind the tool is to aid the user in producing the meaningful artefacts of the CE marking work, rather than to generate reports.

## Technology

Built with vanilla HTML, CSS, and JavaScript using ES modules. No framework, no build step, no package manager. Projects are saved as a single local file, and views of the model are exported from the tool.

## Structure

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

## Specification

| Document | Contents |
|---|---|
| [requirements.md](specs/requirements.md) | What it shall be and do |
| [metamodel.md](specs/metamodel.md) | What a model may contain |
| [attributes.md](specs/attributes.md) | What each entity type carries |
| [references.md](specs/references.md) | How a reference is written |
| [project.schema.json](specs/project.schema.json) | What a project file holds |

## Documentation

| Document | Contents |
|---|---|
| [about.md](docs/about.md) | Why it exists and what it is |
| [decisions.md](docs/decisions.md) | What was chosen and why |
| [architecture.md](docs/architecture.md) | How the software is built |
| [security.md](docs/security.md) | How the software is kept secure |
| [verification.md](docs/verification.md) | How each requirement is verified |
| [shortcuts.md](docs/shortcuts.md) | Every keyboard path through the software |

## Disclaimer

Provided as-is, without warranty of any kind. Outputs may contain errors and should be verified by the user. The manufacturer is responsible for the conformity assessment and for the compliance of their product.

## License

© 2026 omxnt, licensed under the [EUPL-1.2](LICENSE).

## Security

Vulnerabilities go by GitHub's private vulnerability reporting or to the address below, as [SECURITY.md](SECURITY.md) describes.

## Contact

[info@openconformity.org](mailto:info@openconformity.org)

How to give feedback is in [CONTRIBUTING.md](CONTRIBUTING.md).

## Links

- [The project site](https://openconformity.org)
- [The beta software](https://app.openconformity.org)
- [Follow on LinkedIn](https://www.linkedin.com/company/openconformity)