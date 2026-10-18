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
| UI | User Interface |
| UTF-8 | 8-bit Unicode Transformation Format |

## Current task

- Phase: P1 implementation.
- Milestone: U2 (User Interface Milestone 2) — Sessions list view (`#sessions`), table rendering
  from `GET /api/sessions`, status badges, directory, activity preview, relative time, inspect links,
  empty/error/loading states, and responsive styling.
- Worktree: `C:\Users\shaun\mastopia-gemini` on branch `feat/gemini-u2-sessions` (stacked on `feat/gemini-u1-shell`).
- Status: Fixed reviewer findings on PR #10 (adapter error resilience, CHANGELOG link, README).
  48 passing tests. Preparing U4 stacked branch.

## Files touched

The builder-gemini agent touched and maintains the following files on `feat/gemini-u2-sessions`:

1. `page/src/sessions-view.js`:
   - Standalone sessions list table rendering, relative time, badges, error resilience, and fetch helpers.
2. `page/src/console-router.js`:
   - Single source for routing, tab switching, panel visibility, polling helpers, and `VALID_MODES`.
3. `page/src/07-console.js`:
   - Shipped console shell controller consuming `console-router.js` and `sessions-view.js`.
4. `page/src/page.html`:
   - Added `#view-sessions` table card, table styles, status badges, and empty/error/notice states.
5. `page/build.js`:
   - Bundles `console-router.js` and `sessions-view.js` before `07-console.js` into `web/index.html`.
6. `web/index.html`:
   - Generated client bundle containing 3D City, Console Shell, and Sessions list view.
7. `page/README.md`:
   - Documented `sessions-view.js` in the frontend modules list (CTX-10).
8. `test/sessions-ui.test.js`:
   - Unit tests for relative time, badges, rows, table, container states, contract fetcher, and error notices.
9. `test/console-ui.test.js`:
   - Unit and integration tests covering router, tabs, visibility, polling manager, and reduced-motion.
10. `CHANGELOG.md`:
    - Added dated entry for U2 sessions list view implementation linking PR #10 (CHG-04).
11. `docs/agents/builder-gemini.md`:
    - Updated agent memory tracking U2 implementation and review fixes.

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
