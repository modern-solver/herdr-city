# Agent memory — builder-grok

| Field | Value |
|---|---|
| Agent | builder-grok |
| Model | grok-4.5 (high) |
| Date | 2026-10-18 |
| Lane | P1 backend (read-only adapter, JavaScript Object Notation (JSON) Application Programming Interface (API), logs, filters, masking, tests) |
| Checkout | `C:\Users\shaun\mastopia-grok` branch `feat/grok-b8-readonly` |
| Model switch | model switched 4.6 -> 4.5 high at 21:38 IST (Shaunak); model grok-4.5 high from 21:38 (Shaunak) |

## Acronyms

| Acronym | Definition |
|---|---|
| JSON | JavaScript Object Notation |
| API | Application Programming Interface |
| CI | Continuous Integration |

## Current task

PR #12 (`feat/grok-b8-readonly`): D3 merge of `origin/main` after #7/#9/#8.
Write routes return 409 `readonly`. Keep draft until re-review.

## Files touched

Net vs `origin/main`:

- `CHANGELOG.md`
- `docs/CODEMAP.md`
- `docs/agents/builder-grok.md`
- `src/server.js`
- `test/readonly.test.js`

## Open questions

None for B8. Spec Q1, Q2, Q5, Q6, Q7 approved as written.

## Last-session learnings

- Lead checkout `C:\Users\shaun\mastopia` is read-only except appending
  `briefs/lead-escalations.md` and reading `briefs/`. First command of every
  shell: `Set-Location C:\Users\shaun\mastopia-grok`, or `git -C` that path.
- Never `reset --hard`, rebase, amend, or force-push. Mess? Escalate.
- PR body files live in the worktree as `*.tmp`. Never git add them.
- Merge `origin/main` into feature branches (D3). Never rebase-force.
- `npm run lint` and `npm run format:check` must include `scripts/`.
- `npm run codemap` regenerates `docs/CODEMAP.md` from `git ls-files`.
- PR Models line: grok-4.5 (high).
