# Agent memory — builder-grok

| Field | Value |
|---|---|
| Agent | builder-grok |
| Model | grok-4.6 |
| Date | 2026-10-18 |
| Lane | P1 backend (read-only adapter, JavaScript Object Notation (JSON) Application Programming Interface (API), logs, filters, masking, tests) |
| Checkout | `C:\Users\shaun\mastopia-grok` branch `feat/grok-b5-rulebook` (from `origin/main`) |

## Acronyms

| Acronym | Definition |
|---|---|
| JSON | JavaScript Object Notation |
| API | Application Programming Interface |

## Current task

B5 `GET /api/rulebook`: parse `docs/MAS-House-Rules-Handbook.md` from process cwd
and report per-district presence of `CHANGELOG.md`, `briefs/`, and
`briefs/lead-escalations.md` (Q1). Tests use a fixture handbook.

## Files touched

- `src/rulebook.js`
- `src/server.js`
- `src/adapter.js`
- `test/rulebook.test.js`
- `test/fixtures/rulebook-handbook.md`
- `CHANGELOG.md`
- `docs/agents/builder-grok.md`

## Open questions

None for B5. Spec Q1, Q2, Q5, Q6, Q7 approved as written (defaults Shaunak may
veto).

## Last-session learnings

- Independent P1 items branch from `origin/main` as `feat/grok-*`.
- PR bodies live as `*.tmp` in the worktree. Never git add them.
- Tests MAY pass a `cwdMap` into `createServer`; the public JSON shape does not
  change.
- B7 is PR #11. B8 is PR #12. This branch contains neither.
