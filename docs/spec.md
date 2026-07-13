# Requirements Specification

## Non-Functional Requirements

### Technical Stack

#### NFR-TS-01 Programming language

The tool shall be implemented with




# OLD

#### NFR-TS-01: Browser-based tool

The tool shall run in a web browser.

> *Users access the tool by visiting a URL, with no installation or setup required.*

---

#### NFR-TS-02: No user accounts

The tool shall not require user accounts.

> *Users access the tool instantly without friction, keeping the experience simple. The tool itself collects no personal data.*

---

#### NFR-TS-03: No external communication

The tool shall not communicate with any external service.

> *All resources are served from the tool's own origin. No external fonts, analytics, CDNs, or third-party services. User data cannot leak; the tool has no runtime dependency on external services.*

---

#### NFR-TS-04: Static file deployment

The tool shall consist of static files served as-is, with no server-side processing.

> *Files are deployed unchanged from source. No backend, no server-side rendering, no edge functions, no build-time transformation. All logic runs in the user's browser. Any static file host can serve the tool; anyone can self-host by copying the folder and serving it with any static file server.*

---

#### NFR-TS-05: Vanilla web technology

The tool shall be built using HTML, CSS, and JavaScript only.

> *Native browser languages, understood directly by every modern browser. No transpilation, no compilation, no intermediate languages.*

---

#### NFR-TS-06: No third-party dependencies

The tool shall not depend on any third-party JavaScript or CSS code.

> *No external codebases are incorporated — no libraries, frameworks, or copied-in code from other projects. Minimizes attack surface, avoids dependency rot, and supports long-term stability.*

---

#### NFR-TS-07: Module system

The tool shall organize JavaScript code using ES modules.

> *Native standard for JavaScript modules in modern browsers, providing clear imports and exports without requiring a bundler.*

---

#### NFR-TS-08: No toolchain

The tool shall not require any build step, package manager, or development toolchain to run.

> *Source files in the repository are what runs in the browser. No compilation, bundling, or dependency installation required. Contributors may use personal development tools (linters, formatters, editors) but nothing in the repository shall require them.*

---
