# Agent memory — builder-grok

| Field | Value |
|---|---|
| Agent | builder-grok |
| Model | grok-4.6 |
| Date | 2026-10-18 |
| Lane | P1 backend (read-only adapter, JavaScript Object Notation (JSON) Application Programming Interface (API), logs, filters, masking, tests) |
| Checkout | `C:\Users\shaun\mastopia-grok` branch `feat/grok-b3-logs` (from `feat/grok-b1-sessions`) |

## Acronyms

| Acronym | Definition |
|---|---|
| JSON | JavaScript Object Notation |
| API | Application Programming Interface |

## Current task

B3 PR #18: one `adapter_error` per outage episode; reset on recover.
Drop for #8 main merge when #9 merges.

## Files touched

- `src/logs.js`
- `src/adapter.js`
- `src/server.js`
- `src/README.md`
- `test/logs.test.js`
- `CHANGELOG.md`
- `docs/agents/builder-grok.md`

## Open questions

None. Spec Q1, Q2, Q5, Q6, Q7 approved as written.

## Last-session learnings

- Stacked drafts allowed (Shaunak 18:11). Base is the parent branch.
- Every git command uses `git -C C:\Users\shaun\mastopia-grok`.
- PR body files are `*.tmp` in the worktree. Never git add them.
- Interrupt: when #9 merges, commit WIP and merge `origin/main` into #8 first.
- SEC-03: mask full text, then cap; keep the tail.
