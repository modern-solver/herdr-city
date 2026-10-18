# Agent memory — builder-grok

| Field | Value |
|---|---|
| Agent | builder-grok |
| Model | grok-4.6 |
| Date | 2026-10-18 |
| Lane | P1 backend (read-only adapter, JavaScript Object Notation (JSON) Application Programming Interface (API), logs, filters, masking, tests) |
| Checkout | `C:\Users\shaun\mastopia-grok` branch `feat/grok-b6-ops-desk` |

## Acronyms

| Acronym | Definition |
|---|---|
| JSON | JavaScript Object Notation |
| API | Application Programming Interface |
| CI | Continuous Integration |

## Current task

PR #17 stacked on `feat/grok-b2-screen`. `GET /api/ops-desk` uses
`maskThenTruncate`. Keep as draft. Retarget to main after #15 merges.

## Files touched

Net vs `origin/feat/grok-b2-screen`:

- `CHANGELOG.md`
- `README.md`
- `docs/CODEMAP.md`
- `docs/agents/builder-grok.md`
- `src/README.md`
- `src/adapter.js`
- `src/ops-desk.js`
- `src/server.js`
- `test/leak.test.js`
- `test/ops-desk.test.js`

## Open questions

None. Spec Q1, Q2, Q5, Q6, Q7 approved as written.

## Last-session learnings

- Lead checkout `C:\Users\shaun\mastopia` is out of scope except appending
  `briefs/lead-escalations.md` and reading `briefs/`. Every git command uses
  `git -C C:\Users\shaun\mastopia-grok`.
- PR body files live in the worktree as `*.tmp`. Never git add them.
- Merge `origin/main` into feature branches (D3). Never rebase-force.
- Never `reset --hard`. Ask DevOps.
- `npm run lint` and `npm run format:check` must include `scripts/`.
- Purpose lines in module READMEs stay on one line for CODEMAP.
