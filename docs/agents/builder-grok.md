# Agent memory — builder-grok

| Field | Value |
|---|---|
| Agent | builder-grok |
| Model | grok-4.6 |
| Date | 2026-10-18 |
| Lane | P1 backend (read-only adapter, JavaScript Object Notation (JSON) Application Programming Interface (API), logs, filters, masking, tests) |
| Checkout | `C:\Users\shaun\mastopia-grok` branch `feat/grok-b2-screen` |

## Acronyms

| Acronym | Definition |
|---|---|
| JSON | JavaScript Object Notation |
| API | Application Programming Interface |
| CI | Continuous Integration |

## Current task

PR #15 (`feat/grok-b2-screen`): shared `maskThenTruncate`. Screen, sessions
and city use it. Then stack #17/#18 on this branch. Keep as draft.

## Files touched

Net vs `origin/main`:

- `CHANGELOG.md`
- `README.md`
- `docs/CODEMAP.md`
- `docs/agents/builder-grok.md`
- `src/README.md`
- `src/adapter.js`
- `src/map.js`
- `src/output-filter.js`
- `src/screen.js`
- `src/server.js`
- `src/sessions.js`
- `test/leak.test.js`
- `test/screen.test.js`

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
- Purpose lines in module READMEs stay on one line for CODEMAP.
