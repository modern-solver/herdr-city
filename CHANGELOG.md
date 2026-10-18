# Changelog

District changelog for mastopia (CHG-01). Dated entries use `YYYY-MM-DD`.
Each item links the PR, commit, or file it describes (CHG-04).

## 2026-10-18

- Security: `src/output-filter.js` `maskThenTruncate` masks full text then
  truncates. Screen, sessions and city pane/activity fields use it (SEC-03).
  PR: https://github.com/modern-solver/herdr-city/pull/15
- Fix: `GET /api/screen` runs `maskSecrets` on the full pane, then keeps the
  newest 80000 characters (SEC-03). A token that straddled the old head cut
  no longer leaks a `ghp_` prefix.
  PR: https://github.com/modern-solver/herdr-city/pull/15
- Feature: `GET /api/screen` returns the last pane read after `maskSecrets`,
  with `lineCount`, 80000-character `truncated` cap, and the session object.
  Missing `paneId` is 400; unknown pane is 404.
  PR: https://github.com/modern-solver/herdr-city/pull/15
- Feature: `GET /api/sessions` console session list with district, cli, model,
  status and `q` filters (`src/sessions.js`). P0 `/api/city` is unchanged.
  Session `activity` is masked (SEC-03). PR: https://github.com/modern-solver/herdr-city/pull/8
- Docs: Context-layer CODEMAP (`docs/CODEMAP.md`), regen script
  (`scripts/codemap.js`, `npm run codemap`), staleness test
  (`test/codemap.test.js`), and module READMEs under `src/`, `test/`, `page/`,
  `fixtures/`, `config/`, `web/`, `scripts/` (CTX-09, CTX-10).
  PR: https://github.com/modern-solver/herdr-city/pull/9
- Tooling: Prettier and ESLint in CI (`npm run lint`, `npm run format:check`,
  `npm ci`). Unused locals removed in `src/adapter.js`, `src/map.js`,
  `src/server.js`. PR: https://github.com/modern-solver/herdr-city/pull/7
- Approval: Shaunak approved Phase 1 (P1) read-only console pre-build (PRE-01) documentation
  (`docs/spec-sheet.md`, `docs/prd.md`, `docs/roadmap.md`) and merged PR #2 as commit `538ba9d`.
  Open questions Q1, Q2, Q5, Q6, and Q7 approved as written.
  Commit: `538ba9d`.
  PR: https://github.com/modern-solver/herdr-city/pull/2
- Preference: Shaunak established a standing preference that routine values (bounds, caps,
  intervals, debounce) are stated as defaults he can veto rather than asked as open questions.
  File: `docs/spec-sheet.md`.
  PR: https://github.com/modern-solver/herdr-city/pull/3
- Docs: Follow-up approvals documentation updating status rows to approved by Shaunak,
  renaming Open questions to Decisions, and recording the defaults-not-questions preference.
  Files: `docs/spec-sheet.md`, `docs/prd.md`, `docs/roadmap.md`.
  PR: https://github.com/modern-solver/herdr-city/pull/3
- Reviewer: DevOps updated `docs/agents/reviewer-claude.md` with round-6 review history row,
  recording CLEAN verdict on commit `89a2ff2` and merge by Shaunak as `538ba9d`.
  File: `docs/agents/reviewer-claude.md`.
  PR: https://github.com/modern-solver/herdr-city/pull/3

- Docs: Added agent memory files under `docs/agents/` for builder-gemini (`docs/agents/builder-gemini.md`),
  builder-grok (`docs/agents/builder-grok.md`), and reviewer-claude (`docs/agents/reviewer-claude.md`)
  satisfying Context layer rule CTX-12 on Pull Request (PR) #2.
  Commits: `e52eda3`, `3d9ed5c`, `0ba8a4b`.
  PR: https://github.com/modern-solver/herdr-city/pull/2
- Decision: Shaunak decided that DevOps permanently maintains `docs/agents/reviewer-claude.md` on the
  reviewer agent's behalf; reviewer-claude retains no repository write access.
  Commit: `e139b03`.
  PR: https://github.com/modern-solver/herdr-city/pull/2

## 2026-10-17

- Decision: P1 is a read-only console. No send-keys, send-text, or prompt path.
  PR: https://github.com/modern-solver/herdr-city/pull/2
- Docs: PRE-01 drafts completed on branch `docs/p1-prebuild` — builder-grok drafted
  `docs/spec-sheet.md` (Application Programming Interface (API) contract),
  `docs/prd.md` (backend requirements), and `docs/roadmap.md` (backend
  sequencing); builder-gemini added User Interface (UI) requirements,
  view specifications, UI sequencing, navigation integration, and P2/P3 roadmap.
  PR: https://github.com/modern-solver/herdr-city/pull/2
