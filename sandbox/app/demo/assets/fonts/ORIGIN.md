# Origin

IBM Plex, vendored from the official IBM Plex repository.

| Family | Version | Files | Source |
|---|---|---|---|
| IBM Plex Sans | @ibm/plex-sans 1.1.0 | IBMPlexSans-Regular.woff2, IBMPlexSans-SemiBold.woff2 | https://github.com/IBM/plex/releases/tag/%40ibm%2Fplex-sans%401.1.0 |
| IBM Plex Mono | @ibm/plex-mono 2.5.0 | IBMPlexMono-Regular.woff2 | https://github.com/IBM/plex/releases/tag/%40ibm%2Fplex-mono%402.5.0 |

Carbon's type scale uses three weights: Light 300 for the display and fluid
heading styles, Regular 400 for the body and label styles, and SemiBold 600 for
the heading styles. The interface reaches no further up the scale than
`$heading-03`, which is Regular, so Light is not vendored. Medium 500 is not a
weight the scale uses, and is not vendored either.

License: SIL Open Font License 1.1, see LICENSE.txt. Applies to both families.
