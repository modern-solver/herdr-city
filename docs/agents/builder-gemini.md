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
| U5 | User Interface Milestone 5 |
| U6 | User Interface Milestone 6 |
| U7 | User Interface Milestone 7 |
| UI | User Interface |
| UTF-8 | 8-bit Unicode Transformation Format |

## Current task

- Phase: P1 implementation.
- Milestone: U5 (User Interface Milestone 5) — Event logs view (`#logs`),
  rendering bounded ring buffer telemetry and reverse-chronological event stream from `GET /api/logs`,
  with type and keyword filtering, millisecond timestamps, type badges, transitions, and adapter resilience.
- Worktree: `C:\Users\shaun\mastopia-gemini` on branch `feat/gemini-u5-logs` (stacked on `feat/gemini-u7-rulebook`).
- Status: Implemented U5 event logs view with 82 passing unit/integration tests; prepared draft PR.

## Files touched

The builder-gemini agent touched and maintains the following files on `feat/gemini-u5-logs`:

1. `page/src/logs-view.js`:
   - Standalone event logs rendering, ring buffer telemetry, filtering, and fetch helpers.
2. `page/src/rulebook-view.js`:
   - Standalone rulebook and district compliance rendering, rules table, filtering, and fetch helpers.
3. `page/src/ops-desk-view.js`:
   - Standalone ops desk queue view rendering, card layout, wait timers, and fetch helpers.
4. `page/src/screen-view.js`:
   - Standalone pane screen viewer rendering, metadata ribbon, toolbar, viewport, and fetch helpers.
5. `page/src/sessions-view.js`:
   - Standalone sessions list table rendering, relative time, badges, error resilience, and fetch helpers.
6. `page/src/console-router.js`:
   - Single source for routing, tab switching, panel visibility, polling helpers, and `VALID_MODES`.
7. `page/src/07-console.js`:
   - Shipped console shell controller consuming router and all view modules.
8. `page/src/page.html`:
   - Added `#view-logs` and `#view-rulebook` card layouts, styles, and filter bars.
9. `page/build.js`:
   - Bundles all modules before `07-console.js` into `web/index.html`.
10. `web/index.html`:
    - Generated client bundle containing 3D City, Console Shell, and all dashboard views.
11. `page/README.md`:
    - Documented all view modules in frontend modules list (CTX-10).
12. `test/logs-ui.test.js`:
    - Unit tests for timestamp formatting, event badges, transitions, filtering, and fetch contract.
13. `test/rulebook-ui.test.js`:
    - Unit tests for district cards, rules table, filtering, error cards, and contract fetcher.
14. `test/ops-desk-ui.test.js`:
    - Unit tests for wait duration, card rendering, queue sorting, error cards, and contract fetcher.
15. `test/screen-ui.test.js`:
    - Unit tests for ribbon, toolbar, viewport, ANSI pass-through, error states, and contract fetcher.
16. `test/sessions-ui.test.js`:
    - Unit tests for relative time, badges, rows, table, container states, contract fetcher, and error notices.
17. `test/console-ui.test.js`:
    - Unit and integration tests covering router, tabs, visibility, polling manager, and reduced-motion.
18. `CHANGELOG.md`:
    - Added dated entry for U5 event logs view linking PR #20 (CHG-04).
19. `docs/agents/builder-gemini.md`:
    - Updated agent memory tracking U5 implementation.

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
