# Changelog

District changelog for mastopia (CHG-01). Dated entries use `YYYY-MM-DD`.
Each item links the PR, commit, or file it describes (CHG-04).

## 2026-10-18

- Feature: demo mode (`--demo` / `MASTOPIA_DEMO=1`) uses fixture data, binds
  `0.0.0.0`, and reads `PORT` then `MASTOPIA_PORT` then 7740. Without demo the
  process binds `127.0.0.1` and does not read `PORT`. `/health` reports
  `mode` `demo` and `host`. Host and Origin loopback checks are skipped in demo
  only.
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
