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

B5 PR #13 r2: refuse UNC and mapped-network district cwds before any `fs`
call; async district checks so `GET /api/rulebook` does not block on SMB;
one table-walk in the handbook parser (CODE-03, CODE-05); handbook cache by
mtime.

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
- District cwd `\\host\share`, `//host`, and `\\?\UNC` are remote. Mapped
  drive letters come from `net use` when detectable.
