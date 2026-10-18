# Agent memory — builder-grok

| Field | Value |
|---|---|
| Agent | builder-grok |
| Model | grok-4.6 |
| Date | 2026-10-18 |
| Lane | P1 backend (read-only adapter, JavaScript Object Notation (JSON) Application Programming Interface (API), logs, filters, masking, tests) |
| Checkout | `C:\Users\shaun\mastopia-grok` branch `feat/grok-b1-sessions` |

## Acronyms

| Acronym | Definition |
|---|---|
| JSON | JavaScript Object Notation |
| API | Application Programming Interface |
| CI | Continuous Integration |

## Current task

PR #8 (`feat/grok-b1-sessions`): merged `origin/main` after #9. `GET /api/sessions`
with filters. Do not touch stacked B2/B6/B3 until #8 merges.

## Files touched

Net vs `origin/main`:

- `CHANGELOG.md`
- `README.md`
- `docs/CODEMAP.md`
- `docs/agents/builder-grok.md`
- `src/README.md`
- `src/adapter.js`
- `src/map.js`
- `src/server.js`
- `src/sessions.js`
- `test/README.md`
- `test/sessions.test.js`

## Open questions

None. Spec Q1, Q2, Q5, Q6, Q7 approved as written.

## Last-session learnings

- Lead checkout `C:\Users\shaun\mastopia` is out of scope except appending
  `briefs/lead-escalations.md` and reading `briefs/`. Every git command uses
  `git -C C:\Users\shaun\mastopia-grok`.
- PR body files live in the worktree as `*.tmp`. Never git add them.
- Merge `origin/main` into feature branches (D3). Never rebase-force.
- `npm run lint` and `npm run format:check` must include `scripts/`.
- `npm run codemap` regenerates `docs/CODEMAP.md` from `git ls-files`.
- Stacked B2/B6/B3 wait until #8 merges.
