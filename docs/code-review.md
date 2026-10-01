# Code review and redesign — September 30, 2026

Reviewed all tracked source, configuration, generated-output scripts, scheduling workflow, and Shortcut documentation. The initial working tree was clean.

## Findings addressed

| Priority | Finding | Resolution |
| --- | --- | --- |
| Medium | Browser, email and terminal each carried separate date arithmetic, and email/browser duplicated configuration. A fix could silently diverge across outputs. | Shared `age-core.mjs` and `shortcut-data.json` now drive all three. |
| Medium | Email generator dereferenced a null age before birth. | Explicit pre-birth output; regression coverage. |
| Medium | Completed age-18 milestones continued to be labeled “next,” and the browser said “right now until 18” forever afterward. | Completion states replace expired countdowns; age and birthdays continue. |
| Medium | Month calculations could shift the day anchor for leap-day births after an intervening non-leap year. | Every calendar month is anchored to the original birth instant; month-end/leap tests. This was a latent generic-helper issue, not a July 24 error. |
| Medium | `innerHTML` replaced the entire milestone list every second, with unnecessary allocation and an unsafe pattern if names later became editable. | Nodes built once using `textContent`; only changing values/statuses updated. |
| Medium | No regression tests or CI checks protected date arithmetic or snapshot generation. | Node's built-in test runner plus a read-only CI workflow; no added runtime dependencies. |
| Low | Hidden tabs kept scheduling updates. | Pause scheduling while hidden; render immediately when visible again. |
| Low | The page claimed “local time” and a permanent UTC−05:00 reference, although that offset only describes the birth instant. | Explicit Chicago birth-time copy and documented UTC/elapsed-time semantics. |
| Low | Live-data initialization had no recoverable visible failure state. | HTTP/configuration errors display a reload message while the static page remains usable. |
| Low | Progress was decorative-only; initial zeroes resembled real values. | Accessible progress semantics, placeholder dashes, timer semantics, focus styles and reduced-motion handling. |
| Low | Terminal clock detail could exceed the intended 78-column layout. | Shortened detail text; generated-output width assertions across boundary dates. |

## Design implementation

The design handoff replaced the dark glass dashboard with a cream editorial keepsake: forest green and terracotta, large age figures, an original inline orbital illustration, a birthday ticket, milestone timeline, and a numerical ledger. It uses system fonts and has no external asset requests. Navigation links work as page anchors; all live statistics and existing snapshot endpoints remain.

## Verification and boundaries

- Eight automated tests cover birth, exact birthdays, month ends, leap day, DST offsets, adulthood completion, invalid configuration, generator output, terminal width, and daily updater idempotence/force behavior.
- Safari desktop and 390px responsive previews were visually inspected; live ticks, section links, timeline and accessible progress were checked. Mobile inspection caught a wrapped total-minute value, corrected with responsive number sizing.
- Browser and generated outputs use the same tested engine. JavaScript syntax and whitespace checks pass.
- The browser clock remains dependent on the visitor's device time. No server time synchronization is implied.
- Daily snapshots retain their existing scheduling and push behavior. A concurrent external push can still reject an automation push; later scheduled slots retry on the latest checkout. No destructive git retry was introduced.
- Changes are local; hosted deployment and GitHub Actions execution were not part of this verification.
