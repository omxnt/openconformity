# openconformity

The openconformity project, short for open-source conformity assessment, is an initiative to develop a free, open-source tool for CE marking of machinery according to the Machinery Regulation (EU) 2023/1230. The tool is browser-based and runs entirely client-side, with no installation or account required.

*This is a personal hobby project maintained by [omxnt](https://github.com/omxnt), with no company and no commercial interests behind it. The project is updated when time allows.*

## Status

In design phase. The documentation is being written and the software is not yet built, apart from a preview that shows the intended interface with fixed example content.

## What it is

The tool offers an approach to CE marking using concepts borrowed from the domain of Systems Engineering (SE). The CE marking work itself is modelled using entities with semantic relationships between them, where each entity carries its own attributes. The semantic relationships represent the connections between the different types of entities, defining how they interact and relate to each other.

Artefacts can be generated as views of the model, exported and intended as input to the engineering documents that the user assembles under their own quality system. The idea behind the tool is to aid the user in producing the meaningful artefacts of the CE marking work, rather than to generate reports.

## Technology

Built with vanilla HTML, CSS, and JavaScript using ES modules. No framework, no build step, no package manager. Projects are saved as a single local JSON file. Artefacts can be exported as CSV files.

## Structure

```
openconformity/
├── app/            the published software
├── site/           the published project site
├── docs/           the project documentation
├── schema/         the data model schema files
├── sources/        the sources in editable formats
└── sandbox/        the non-published work-in-progress
    ├── app/        iterations of the software
    ├── site/       iterations of the project site
    ├── demo/       frozen demonstration prototype
    └── poc/        frozen original proof of concept
```

## Documentation

| Document | Contents |
|---|---|
| [about.md](docs/about.md) | Why it exists and what it is |
| [decisions.md](docs/decisions.md) | What was chosen and why |
| [requirements.md](docs/requirements.md) | What it shall be and do |
| [metamodel.md](docs/metamodel.md) | What a model may contain |
| [attributes.md](docs/attributes.md) | What each entity type carries |

## Disclaimer

Provided as-is, without warranty of any kind. Outputs may contain errors and should be verified by the user. The manufacturer is responsible for the conformity assessment and for the compliance of their product.

## License

© 2026 omxnt, licensed under the [EUPL-1.2](LICENSE).

## Contact

[info@openconformity.org](mailto:info@openconformity.org)

## Links

- [The project site](https://openconformity.org)
- [The demo software](https://app.openconformity.org)
- [Follow on LinkedIn](https://www.linkedin.com/company/openconformity)