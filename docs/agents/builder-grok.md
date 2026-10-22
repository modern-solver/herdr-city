# Agent memory — builder-grok

| Field | Value |
|---|---|
| Agent | builder-grok |
| Model | grok-4.5 (high) |
| Date | 2026-10-19 |
| Lane | P1 backend (read-only adapter, JavaScript Object Notation (JSON) Application Programming Interface (API), logs, filters, masking, tests) |
| Checkout | `C:\Users\shaun\mastopia-grok` branch `feat/grok-b7-demo` |
| Model switch | model switched 4.6 -> 4.5 high at 21:38 IST (Shaunak); model grok-4.5 high from 21:38 (Shaunak) |

## Acronyms

| Acronym | Definition |
|---|---|
| JSON | JavaScript Object Notation |
| API | Application Programming Interface |
| CI | Continuous Integration |

## Current task

PR #11: D3 merged origin/main (`e7e13fa`, PR #6) into `feat/grok-b7-demo`.
README bind/demo Host-Origin policy kept. PR is ready for merge.

## Files touched

Net vs `origin/main`:

- `CHANGELOG.md`
- `README.md`
- `docs/CODEMAP.md`
- `docs/agents/builder-grok.md`
- `docs/prd.md`
- `docs/roadmap.md`
- `docs/spec-sheet.md`
- `src/README.md`
- `src/cli.js`
- `src/server.js`
- `test/demo.test.js`
- `web/README.md`

## Open questions

None for B7. Spec Q1, Q2, Q5, Q6, Q7 approved as written.

## Last-session learnings

- Lead checkout `C:\Users\shaun\mastopia` is read-only except appending
  `briefs/lead-escalations.md` and reading `briefs/`. First command of every
  shell: `Set-Location C:\Users\shaun\mastopia-grok`, or `git -C` that path.
- Never `reset --hard`, rebase, amend, or force-push. Mess? Escalate.
- PR body files live in the worktree as `*.tmp`. Never git add them.
- Write commit msg file in its own step before commit.
- No `>` redirection into tracked files.
- PR Models line: grok-4.5 (high).
