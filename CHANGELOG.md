# Changelog

Every release of openconformity is recorded here, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta.3] - 2026-10-07

The hazard checklist, and the hardening the October reviews asked for.

### Added

- FMV's checklist of hazards and hazardous conditions in the library, carried with permission.
- Every act in the library named under About.
- A not-found page for an unknown address.

### Changed

- The relationship pane keeps its head when nothing is selected.
- Selecting an entity from the graph, the list, the messages or a view opens the folders above it and scrolls its row into view.

### Fixed

- A large file no longer freezes the tab on opening.
- A counter the software cannot issue from is refused, so no two entities share an identifier.
- A saved specification escapes addresses and line breaks in cell text, and a sheet name can no longer collide with the workbook's own.

### Security

- The host sends the full content security policy, requires trusted types, and sends no referrer, no opener and no device feature.
- Links open without a referrer.
- A file with a prototype key as an attribute key is refused.
- A drawing that links to a data address is refused.

## [1.0.0-beta.2] - 2026-10-04

The library grows, and folders travel with it.

### Added

- The Low Voltage Directive in the library.
- The EMC Directive in the library.
- The RoHS Directive in the library.
- The Cyber Resilience Act in the library.
- A project structure in the library, to start a project from.
- The life phases of machinery in the library.
- Folders import from a catalogue, nested as the catalogue nests them.

### Changed

- Every act in the library names its reference, its title with the Commission's abbreviation, and the consolidated text it was copied from.

### Removed

- The pick-all checkbox in the library's head.

## [1.0.0-beta.1] - 2026-09-27

The first public beta, open to everyone at app.openconformity.org.

### Added

- A model of the CE marking work, from the entity types and relationships the metamodel defines.
- A tree that files the model in folders, an editor for each entity, and its relationships as a graph and a list.
- Risk estimation by the three methods of ISO/TR 14121-2, before and after protective measures.
- Safety functions with a required performance level or safety integrity level.
- A library holding the Machinery Regulation and its essential requirements.
- Diagrams drawn in draw.io, handed over only after the user consents.
- The risk assessment as a view, saved as Excel.
- The safety function specification as a view, saved as Markdown or Excel.
- Projects saved as local files, with the work kept in the browser between sessions.
- Undo and redo throughout.

[1.0.0-beta.3]: https://github.com/omxnt/openconformity/compare/v1.0.0-beta.2...v1.0.0-beta.3
[1.0.0-beta.2]: https://github.com/omxnt/openconformity/compare/v1.0.0-beta.1...v1.0.0-beta.2
[1.0.0-beta.1]: https://github.com/omxnt/openconformity/releases/tag/v1.0.0-beta.1
