# Agent memory — builder-grok

| Field | Value |
|---|---|
| Agent | builder-grok |
| Model | grok-4.6 |
| Date | 2026-10-18 |
| Lane | P1 backend (read-only adapter, JavaScript Object Notation (JSON) Application Programming Interface (API), logs, filters, masking, tests) |
| Checkout | `C:\Users\shaun\mastopia-grok` branch `feat/grok-b7-demo` (from `origin/main`) |

## Acronyms

| Acronym | Definition |
|---|---|
| JSON | JavaScript Object Notation |
| API | Application Programming Interface |

## Current task

B7 PR #11 r2: README documents `--demo`, `MASTOPIA_DEMO=1`, `PORT` (demo only),
and the `127.0.0.1` default. Demo still binds `0.0.0.0` and skips Host/Origin
loopback checks.

## Files touched

- `src/cli.js`
- `src/server.js`
- `test/demo.test.js`
- `CHANGELOG.md`
- `README.md`
- `docs/agents/builder-grok.md`

## Open questions

None for B7. Spec Q1, Q2, Q5, Q6, Q7 approved as written (defaults Shaunak may
veto).

## Last-session learnings

- Independent P1 items branch from `origin/main` as `feat/grok-*`. Never merge
  `#7` into this branch; lint lands after Shaunak merges `#7`.
- PR bodies live as `*.tmp` in the worktree. Never git add them.
- `parseArgs` takes an `env` object so tests can prove `PORT` is unread unless
  demo.
