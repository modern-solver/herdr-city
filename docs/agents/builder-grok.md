# Agent memory — builder-grok

| Field | Value |
|---|---|
| Agent | builder-grok |
| Model | grok-4.6 |
| Date | 2026-10-18 |
| Lane | P1 backend (read-only adapter, JavaScript Object Notation (JSON) Application Programming Interface (API), logs, filters, masking, tests) |
| Checkout | `C:\Users\shaun\mastopia-grok` branch `p1/grok-backend` (rebased on `538ba9d`) |

## Acronyms

| Acronym | Definition |
|---|---|
| JSON | JavaScript Object Notation |
| API | Application Programming Interface |
| CI | Continuous Integration |

## Current task

PR G1 review fixes on `p1/grok-backend` (https://github.com/modern-solver/herdr-city/pull/5).
Staleness test uses `git ls-files` and CRLF normalize. CODEMAP lists exports
and dependents. Changelog links PR #5. CODE-12 and SDLC-12 wait on Shaunak.
Stop after this push. Then B1 after G1 merges and branch-scope is APPROVED.

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

## Open questions

None for G1. Spec Q1, Q2, Q5, Q6, Q7 are approved as written (defaults Shaunak
may veto). Prettier and ESLint install waits on Shaunak. Extra branches wait on
Shaunak.

## Last-session learnings

- Lead checkout `C:\Users\shaun\mastopia` is out of scope except appending
  `briefs/lead-escalations.md` and reading `briefs/`.
- Do not `npm install` new packages. Do not fetch Prettier or ESLint with npx.
- CODE-12 linters in CI stay blocked until Shaunak approves the install.
- `npm run codemap` is an npm script; generate with `node scripts/codemap.js`
  when the tool manifest does not list `npm run codemap`.
- One logical change per PR. Stop after G1 is open.
