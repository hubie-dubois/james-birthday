# James Right Now

A dependency-free birthday keepsake, served as a static site. The browser clock updates once per second; email and terminal editions are daily snapshots.

## Local development

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Visit http://127.0.0.1:4173. Use HTTP, rather than opening the HTML file directly: the browser imports a module and fetches the shared configuration.

```sh
node --test tests/*.test.mjs
node scripts/generate-shortcut-message.mjs
node scripts/generate-terminal-page.mjs
```

No package install or build step is needed. CI uses Node 24; the tests also run on Node 22.

## Where things live

- `index.html` and `styles.css`: responsive page and inline decorative illustration.
- `script.js`: rendering, configuration loading, and visibility-aware clock.
- `age-core.mjs`: shared date calculations and configuration validation.
- `shortcut-data.json`: name, birth instant, time zone, adulthood, and milestone configuration for all three outputs. Keep its public Shortcut fields compatible when editing; matching milestone records supply exact dates.
- `scripts/`: daily email/terminal generation and idempotent update wrappers.
- `tests/`: date boundaries, generated output, terminal width, and updater behavior.

## Date conventions

The birth instant is July 24, 2024 at 11:41 AM in Chicago, with the explicit offset −05:00. Calendar years/months use UTC anniversaries anchored to that instant. Days, weeks, hours, minutes, and seconds measure elapsed time; a day is 24 hours. This deliberately preserves the original clock's behavior rather than changing monthly anniversaries when Chicago enters winter time. Display dates and generated timestamps use `America/Chicago`.

Completed totals round down. A standalone number of days remaining rounds up so it does not show zero before the event; detailed countdowns show complete days plus hours. After age 18, the journey remains complete while age and birthdays continue. Before birth, totals stay at zero and the page shows an arrival message.

## Automation and deployment

The scheduled workflow refreshes the generated snapshots once per Chicago date, with multiple recovery slots. Manual workflow dispatch forces regeneration. The page itself always calculates live values locally and does not depend on the scheduled snapshots.

GitHub Pages serves the repository root and the existing `CNAME`. The check workflow runs the regression tests on code changes and pull requests. Generated commits may advance `main`; fetch/rebase before pushing local work. No deployment is performed by the test commands.
