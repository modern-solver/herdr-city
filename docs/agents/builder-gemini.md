# Agent memory — builder-gemini

| Field | Value |
|---|---|
| Document | Agent memory file (CTX-12) |
| Agent | builder-gemini |
| Model | `gemini-3.8-flash-high` via `agy` |
| Role | Builder — UI / console views |
| Date | 2026-10-18 |
| Status | Active |

## Acronyms

| Acronym | Definition |
|---|---|
| ANSI | American National Standards Institute |
| API | Application Programming Interface |
| CLI | Command-Line Interface |
| CTX | Context Layer Rule |
| DOC | Documentation Rule |
| DOM | Document Object Model |
| GUI | Graphical User Interface |
| HTTP | Hypertext Transfer Protocol |
| HUD | Heads-Up Display |
| IST | India Standard Time |
| JSON | JavaScript Object Notation |
| MAS | Modern Age Solutions |
| P1 | Phase 1 |
| P2 | Phase 2 |
| P3 | Phase 3 |
| PC | Personal Computer |
| PR | Pull Request |
| PRD | Product Requirements Document |
| SSE | Server-Sent Events |
| U1 | User Interface Milestone 1 |
| U2 | User Interface Milestone 2 |
| U4 | User Interface Milestone 4 |
| UI | User Interface |
| UTF-8 | 8-bit Unicode Transformation Format |

## Current task

- Phase: P1 implementation.
- Milestone: U4 (User Interface Milestone 4) — Pane screen viewer (`#screen?paneId=...`),
  reading terminal screens from `GET /api/screen`, metadata ribbon, auto-scroll toggle,
  raw ANSI pass-through, truncation warning banner, unselected/loading/error states.
- Worktree: `C:\Users\shaun\mastopia-gemini` on branch `feat/gemini-u4-screen` (PR #14 retargeted to `main`).
- Status: Merged `origin/main` at `3c31b0f` into `feat/gemini-u4-screen` (merge head `f1faef1`);
  resolved `CHANGELOG.md` and `docs/agents/builder-gemini.md` conflicts keeping both sides;
  leak rule verified; 88/88 tests pass; lint and format:check green. Ready for review.

## Files touched

Net diff vs `main` on `feat/gemini-u4-screen`:

1. `.prettierignore`
2. `CHANGELOG.md`
3. `docs/agents/builder-gemini.md`
4. `eslint.config.js`
5. `page/README.md`
6. `page/build.js`
7. `page/src/07-console.js`
8. `page/src/page.html`
9. `page/src/screen-view.js`
10. `test/screen-ui.test.js`
11. `web/index.html`

## Open questions

Decisions and standing approvals from Shaunak (2026-10-18):

| ID | Item | Owner | Status |
|---|---|---|---|
| Q1 | Expected files: `CHANGELOG.md`, `briefs/`, escalations | Shaunak | Approved (as written) |
| Q2 | Log bounds: 500 events and 262,144 characters | Shaunak | Approved (as written) |
| Q3 | Console polling interval: 2,000 ms; hidden tab 10,000 ms | builder-gemini | Decided |
| Q4 | ANSI in pane screen: pass through cleanly in preformatted code block | builder-gemini | Decided |
| Q5 | Screen text cap: 80,000 characters | Shaunak | Approved (as written) |
| Q6 | Search input debounce: 300 ms | Shaunak | Approved (as written) |
| Q7 | Hidden-tab poll interval: 10,000 ms | Shaunak | Approved (as written) |

Standing preference (Shaunak, 2026-10-18): routine values are stated as defaults Shaunak
can veto, not asked as open questions.

## Last-session learnings

1. UI architecture in mastopia:
   - `page/build.js` concatenates scripts into `web/index.html`. Always rebuild after editing `page/src/`.
   - The route switcher toggles between `/` (3D City) and `/console` (Console dashboard) without page reload.
   - Tab switching uses client-side hash routing (`#sessions`, `#screen`, `#logs`, `#rulebook`, `#ops-desk`).
2. Code alignment and testing (CODE-04, CODE-05, CODE-14):
   - Keep a single source of truth for routing helpers; avoid duplicating constants in controller scripts.
   - Test shipped functions with minimal stubs rather than testing isolated mock copies.
   - Decouple view rendering into pure functions that can be tested in isolation with contract mocks.
3. Stacked branches and workflow:
   - Retargeting PRs to main after base PR merges allows clean integration of upstream tooling and tests.
   - All endpoint text rendered must strictly pass through the shared `escapeHtml` filter (Leak rule).
