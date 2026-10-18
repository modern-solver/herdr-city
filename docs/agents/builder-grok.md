# Agent memory — builder-grok

| Field | Value |
|---|---|
| Agent | builder-grok |
| Model | grok-4.6 |
| Date | 2026-10-18 |
| Lane | P1 backend (read-only adapter, JavaScript Object Notation (JSON) Application Programming Interface (API), logs, filters, masking, tests) |
| Checkout | `C:\Users\shaun\mastopia-grok` branch `feat/grok-lint-ci` (from `origin/main`) |

## Acronyms

| Acronym | Definition |
|---|---|
| JSON | JavaScript Object Notation |
| API | Application Programming Interface |
| CI | Continuous Integration |

## Current task

Lint PR on `feat/grok-lint-ci`: Prettier, ESLint, CI `npm run lint` and
`npm run format:check`. Then B1 on `feat/grok-b1-sessions`.
`npm run codemap` lives on PR #5 (`p1/grok-backend`); this branch is from
`origin/main` which does not have the generator yet.

## Files touched

- `package.json`
- `package-lock.json`
- `eslint.config.js`
- `.prettierrc.json`
- `.prettierignore`
- `.github/workflows/ci.yml`
- `src/adapter.js`
- `src/map.js`
- `src/server.js`
- `src/*.js` and `test/*.js` (Prettier)
- `CHANGELOG.md`
- `docs/agents/builder-grok.md`

## Open questions

None for this PR. CODEMAP regen waits on PR #5 merge, then D3 merge of
`origin/main`.

## Last-session learnings

- Shaunak 04:25: `feat/grok-*` branches allowed. `npm install -D` in this
  worktree only. Merge `origin/main` into feature branches. Never rebase-force.
- PR body files live in the worktree as `pr5-body.tmp`. Never git add them.
  Never write AppData or TEMP.
- G1 CODEMAP script is not on `main` until PR #5 merges.
