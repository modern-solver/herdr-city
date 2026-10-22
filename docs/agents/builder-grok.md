# Agent memory — builder-grok

| Field | Value |
|---|---|
| Agent | builder-grok |
| Model | grok-4.5 (high) |
| Date | 2026-10-23 |
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

PR #11: D3 merged `origin/main` (`e354d5a`, PR #16) into
`feat/grok-b7-demo` as `f695df1`. PR is ready for merge.

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
- Per-commit identity: `git -c user.name=builder-grok -c
  user.email=modernagesales@gmail.com`. Never `git config user.name` (shared
  `.git/config` with gemini and lead).
- Merge `origin/main` into feature branches (D3). Never rebase-force.
- `npm run lint` and `npm run format:check` must include `scripts/`.
- `npm run codemap` regenerates `docs/CODEMAP.md` from `git ls-files`.
- Purpose lines in module READMEs stay on one line for CODEMAP.
- PR Models line: grok-4.5 (high).
