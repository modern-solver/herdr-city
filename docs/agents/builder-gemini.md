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
- Worktree: `C:\Users\shaun\mastopia-gemini` on branch `feat/gemini-u4-screen` (stacked on `feat/gemini-u2-sessions`).
- Status: Implemented U4 pane screen viewer with 54 passing unit/integration tests; prepared draft PR.

## Files touched

The builder-gemini agent touched and maintains the following files on `feat/gemini-u4-screen`:

1. `page/src/screen-view.js`:
   - Standalone pane screen viewer rendering, metadata ribbon, toolbar, viewport, and fetch helpers.
2. `page/src/sessions-view.js`:
   - Standalone sessions list table rendering, relative time, badges, error resilience, and fetch helpers.
3. `page/src/console-router.js`:
   - Single source for routing, tab switching, panel visibility, polling helpers, and `VALID_MODES`.
4. `page/src/07-console.js`:
   - Shipped console shell controller consuming `console-router.js`, `sessions-view.js`, and `screen-view.js`.
5. `page/src/page.html`:
   - Added `#view-screen` card layout, pre/code styles, autoscroll controls, and truncation alerts.
6. `page/build.js`:
   - Bundles modules before `07-console.js` into `web/index.html`.
7. `web/index.html`:
   - Generated client bundle containing 3D City, Console Shell, Sessions list view, and Screen viewer.
8. `page/README.md`:
   - Documented `screen-view.js` and `sessions-view.js` in frontend modules list (CTX-10).
9. `test/screen-ui.test.js`:
   - Unit tests for ribbon, toolbar, viewport, ANSI pass-through, error states, and contract fetcher.
10. `test/sessions-ui.test.js`:
    - Unit tests for relative time, badges, rows, table, container states, contract fetcher, and error notices.
11. `test/console-ui.test.js`:
    - Unit and integration tests covering router, tabs, visibility, polling manager, and reduced-motion.
12. `CHANGELOG.md`:
    - Added dated entry for U4 pane screen viewer implementation.
13. `docs/agents/builder-gemini.md`:
    - Updated agent memory tracking U4 implementation.

## Open questions

Decisions and standing approvals from Shaunak (2026-10-18):

| ID | Item | Owner | Status |
|---|---|---|---|
| Q1 | District files: `CHANGELOG.md`, `briefs/`, `briefs/lead-escalations.md` | Shaunak | Approved (as written) |
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
   - When base PRs are pending review/merges, building features on stacked branches preserves momentum.
   - Draft PRs clearly document dependencies (e.g. "stacked on #6, needs #8 for live data").
