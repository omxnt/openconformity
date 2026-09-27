# After the beta

This note holds the work left open at the release of v1.0.0-beta.1 on 27 September 2026, in the order it is recommended. Each item was deferred to keep the release to what users would meet. The findings are those of the release review, where each has its place in the code and its fix.

## 1. The work

| No. | Item | Why it waited | What it takes |
|---|---|---|---|
| 1 | SC-13's verdict reads Mitigated beside a Closed residual | Left out of the release commit | The verdict set to Blocked in `docs/security.md` |
| 2 | SC-19 rests on a check that refuses known patterns | A list of permitted elements and attributes could refuse real diagrams if drawn wrong, a risk not taken on release day | The drawing check rebuilt on what draw.io writes, proven against real exports and the 54 hostile drawings |
| 3 | The browser drives live outside the repository | Test tooling, not the software, and a day's work | The drives moved into `tests/` and run from there, so anyone can rerun the release check |
| 4 | Findings 14 to 26 of the release review | Low severity, mostly tidying, and every change before a release risks what was tested | A few small commits |

## 2. The findings

| No. | Finding |
|---|---|
| 14 | A listener is added to the diagram pane on every edit and never removed |
| 15 | A double click on a column handle collapses the column instead of returning it to its default |
| 16 | The library preview never shows a table attribute |
| 17 | A relate refused part way gives the same reason whatever refused it |
| 18 | Three flows change the live model and may return a refusal after a part of it |
| 19 | Two shell buttons run their action without asking whether it is enabled |
| 20 | A workbook cell over Excel's limit of 32,767 characters is written as it is |
| 21 | A bad numeric character reference in a drawing is refused with the text "NaN" |
| 22 | The Markdown writer's comment says a bare address never becomes a link, which a viewer does |
| 23 | The shortcuts document has two smaller mismatches and is missing from CLAUDE.md's table |
| 24 | Writing-rule breaches in code comments, four interface strings and older decisions |
| 25 | Dead code, the mark cell kind and an unused icon symbol, and a stale module header |
| 26 | The browser drives live outside the repository, the same as item 3 |

Clear stored data also leaves the relationship pane's collapse state in memory, a one-line fix found during the release round and left outside it.

## 3. References

| No. | Reference | Link |
|---|---|---|
| [1] | openconformity, Release review | ../reviews/2026-09-27-release.md |
| [2] | openconformity, Security | ../docs/security.md |
