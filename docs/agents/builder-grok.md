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
`npm run format:check`. Prettier `endOfLine` is `auto` so Windows CRLF
checkouts pass `format:check`. D3 merged `origin/main` as `44cf6c3`.
CODEMAP regen lives on PR #9 (`feat/grok-context-layer`). B1 is PR #8.

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
- `README.md`
- `docs/agents/builder-grok.md`

## Open questions

None for this PR.

## Last-session learnings

- Shaunak 04:25: `feat/grok-*` branches allowed. `npm install -D` in this
  worktree only. Merge `origin/main` into feature branches. Never rebase-force.
- PR body files live in the worktree as `pr5-body.tmp`. Never git add them.
  Never write AppData or TEMP.
- G1 CODEMAP script lives on PR #9 (`feat/grok-context-layer`).
- D3 merged `origin/main` into this branch as `44cf6c3`.
