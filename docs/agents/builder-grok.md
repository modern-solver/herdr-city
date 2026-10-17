# Agent memory — builder-grok

| Field | Value |
|---|---|
| Agent | builder-grok |
| Model | grok-4.6 |
| Date | 2026-10-18 |
| Lane | P1 backend (read-only adapter, JSON API, logs, filters, masking, tests) |
| Checkout | PR #2: `C:\Users\shaun\mastopia` branch `docs/p1-prebuild`. After merge: `C:\Users\shaun\mastopia-grok` branch `p1/grok-backend`. |

## Current task

PRE-01 docs, PR #2 (https://github.com/modern-solver/herdr-city/pull/2).
Waiting on reviewer-claude after adding this memory file (CTX-12 / CTX-13).
No P1 code until Shaunak approves PRE-01.

## Files touched

- `docs/spec-sheet.md`
- `docs/prd.md`
- `docs/roadmap.md`
- `CHANGELOG.md`
- `docs/agents/builder-grok.md`

## Open questions

| ID | Question | Owner |
|---|---|---|
| Q1 | Expected files per district (`CHANGELOG.md`, `briefs/`, `briefs/lead-escalations.md`). | Shaunak |
| Q2 | Log bounds 500 events and 262144 characters. | Shaunak |
| Q5 | Screen text cap 80000 characters. | Shaunak |
| Q6 | Search debounce 300 ms. | Shaunak |
| Q7 | Hidden-tab poll interval 10000 ms. | Shaunak |

## Last-session learnings

- PR #2 remaining docs fixes stay on `docs/p1-prebuild` in `C:\Users\shaun\mastopia`. Later work is `C:\Users\shaun\mastopia-grok` on `p1/grok-backend`.
- Shared checkout once committed grok spec-sheet hunks under builder-gemini. Separate worktrees are now the rule.
- Escalations and Coordination append to `C:\Users\shaun\mastopia\briefs\lead-escalations.md` and are not committed.
- `gh pr edit` is allowed for titles and descriptions on `modern-solver/herdr-city` only.
- Temp deletes outside the repo are held for Shaunak. Leave scratch files.
- More access goes to Shaunak via `briefs/lead-escalations.md`. Reviewer BLOCKED/CHANGES stays binding.
- First code PR after PR #2: add Prettier and ESLint to CI. CODEMAP regen is after PR #2 merges.
