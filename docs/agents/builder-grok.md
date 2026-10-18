# Agent memory — builder-grok

| Field | Value |
|---|---|
| Agent | builder-grok |
| Model | grok-4.6 |
| Date | 2026-10-18 |
| Lane | P1 backend (read-only adapter, JavaScript Object Notation (JSON) Application Programming Interface (API), logs, filters, masking, tests) |
| Checkout | `C:\Users\shaun\mastopia-grok` branch `feat/grok-context-layer` |

## Acronyms

| Acronym | Definition |
|---|---|
| JSON | JavaScript Object Notation |
| API | Application Programming Interface |
| CI | Continuous Integration |

## Current task

PR #9 on `feat/grok-context-layer`. Merged `origin/main` (PR #7 `c1b0ccd`).
`npm run lint` and `npm run format:check` cover `scripts/`. Resume task-1810
on `feat/grok-b7-demo` after this push.

## Files touched

- `scripts/codemap.js`
- `scripts/README.md`
- `src/README.md`
- `test/README.md`
- `page/README.md`
- `fixtures/README.md`
- `config/README.md`
- `web/README.md`
- `package.json`
- `test/codemap.test.js`
- `docs/CODEMAP.md`
- `CHANGELOG.md`
- `docs/agents/builder-grok.md`
- `.gitattributes`
- `eslint.config.js`
- `.prettierrc.json`
- `.prettierignore`
- `.github/workflows/ci.yml`

## Open questions

None for G1. Spec Q1, Q2, Q5, Q6, Q7 are approved as written (defaults Shaunak
may veto). CODE-12 landed on main via PR #7.

## Last-session learnings

- Lead checkout `C:\Users\shaun\mastopia` is out of scope except appending
  `briefs/lead-escalations.md` and reading `briefs/`. Every git command uses
  `git -C C:\Users\shaun\mastopia-grok`.
- PR body files live in the worktree as `*.tmp`. Never git add them.
  Never write AppData or TEMP.
- `npm run lint` and `npm run format:check` must include `scripts/`.
- `npm run codemap` regenerates `docs/CODEMAP.md` from `git ls-files`.
- Merge `origin/main` into feature branches (D3). Never rebase-force.
- Independent P1 items branch from `origin/main` as `feat/grok-*`.
