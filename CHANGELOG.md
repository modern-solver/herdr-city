# Changelog

District changelog for mastopia (CHG-01). Dated entries use `YYYY-MM-DD`.
Each item links the PR, commit, or file it describes (CHG-04).

## 2026-10-18

- Feature: Implemented Milestone U1 (User Interface Milestone 1) console shell, navigation
  header, route switcher (`/` and `/console`), and client-side tab router (`#sessions`,
  `#screen`, `#logs`, `#rulebook`, `#ops-desk`) with active and hidden-tab polling lifecycle.
  Files: `page/src/console-router.js`, `page/src/07-console.js`, `page/src/page.html`,
  `page/build.js`, `web/index.html`, `src/server.js`, `test/console-ui.test.js`.
  PR: https://github.com/modern-solver/herdr-city/pull/4
- Fix: Restored prefers-reduced-motion media query in `page/src/page.html` and rebuilt `web/index.html`.
  Unified router and UI lifecycle helpers in `page/src/console-router.js`, extracted `closeCityConsolePanel()`
  to prevent hidden side effects (CODE-04), and expanded unit tests in `test/console-ui.test.js` (CODE-14).
  PR: https://github.com/modern-solver/herdr-city/pull/4
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
