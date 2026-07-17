# openconformity

The openconformity project, short for open-source conformity assessment, is an initiative to develop a free, open-source tool for CE marking of machinery according to the Machinery Regulation (EU) 2023/1230. The tool is browser-based and runs entirely client-side, with no installation or account required.

*Personal hobby project maintained by [omxnt](https://github.com/omxnt), with no company and no commercial interests behind it. Updated when time allows.*

## Status

In design phase, not yet usable.

## What it is

The tool offers an approach to CE marking using concepts borrowed from the domain of Systems Engineering (SE). The CE marking work itself is modeled using entities with semantic relationships between them, where each entity carries its own attributes. The semantic relationships represent the meaningful connection between the different types of entities, defining how they interact and relate to each other.

Artefacts can be generated as views of the model, exported and intended as input to the engineering documents that the user assembles under their own quality system. The idea behind the tool is to aid the user in producing the meaningful artefacts of the CE marking work, rather than to generate reports.

## Technology

Built with vanilla HTML, CSS, and JavaScript using ES modules. No framework, no build step, no package manager. Projects are saved as a single local JSON file. Artefacts can be exported as CSV files.

## Documentation

| Document | Contents |
|---|---|
| [design.md](docs/design.md) | What the tool is and why |
| [spec.md](docs/spec.md) | What it shall do |
| [decisions.md](docs/decisions.md) | What was chosen and why |
| [brand.md](docs/brand.md) | What it looks like |
| [meta.svg](assets/meta.svg) | The metamodel |

The design document is in progress and the specification is not yet written.

## Disclaimer

Provided as-is, without warranty of any kind. Outputs may contain errors and should be verified by the user. The manufacturer is responsible for the conformity assessment and for the compliance of their product.

## License

[EUPL-1.2](LICENSE). © 2026 omxnt

## Contact

[info@openconformity.org](mailto:info@openconformity.org)

## Links

* [openconformity.org](https://openconformity.org)
* [LinkedIn](https://www.linkedin.com/company/openconformity)