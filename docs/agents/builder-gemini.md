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
| PRE | Pre-build Requirements Gate |
| SSE | Server-Sent Events |
| U1 | User Interface Milestone 1 |
| UI | User Interface |
| UTF-8 | 8-bit Unicode Transformation Format |

## Current task

- Phase: P1 implementation.
- Milestone: U1 (User Interface Milestone 1) — Console shell, navigation header, route switcher
  (`/` and `/console`), and tab router (`#sessions`, `#screen`, `#logs`, `#rulebook`, `#ops-desk`).
- Worktree: `C:\Users\shaun\mastopia-gemini` on branch `p1/gemini-console-ui`.
- Status: Implementing and testing U1 frontend foundation and opening PR #4.

## Files touched

The builder-gemini agent touched and maintains the following files on `p1/gemini-console-ui`:

1. `page/src/console-router.js`:
   - Pure client-side routing utilities: `parseHash`, `parseRoute`, and `getPollInterval`.
2. `page/src/07-console.js`:
   - Console shell controller, navigation header, route switcher, tab router, mode badge,
     and active/hidden polling lifecycle.
3. `page/src/page.html`:
   - Added `#consoleShell` container with header, mode badge, tab navigation, and placeholder cards.
   - Added `[Console →]` route switcher link in 3D City HUD toolbar.
   - Added responsive console styling.
4. `page/build.js`:
   - Added `07-console.js` to bundle order.
5. `web/index.html`:
   - Generated client bundle containing 3D City and Console Shell.
6. `src/server.js`:
   - Routed `/console` to `index.html` to support direct browser navigation and refresh.
7. `test/console-ui.test.js`:
   - Unit and integration tests covering route parsing, tab routing, lifecycle intervals,
     and HTTP serving of `/` and `/console`.
8. `page/README.md` and `web/README.md`:
   - Module documentation satisfying CTX-10.
9. `CHANGELOG.md`:
   - Added dated entry for U1 console shell, navigation, and tab router.
10. `docs/agents/builder-gemini.md`:
    - Updated agent memory tracking current task, touched files, and learnings.

## Open questions

All PRE-01 open questions (Q1, Q2, Q5, Q6, Q7) approved by Shaunak as written on 2026-10-18.
Q3 and Q4 decided. No open questions blocking P1.
Standing preference (Shaunak, 2026-10-18): routine values are stated as defaults Shaunak
can veto, not asked as open questions.

## Last-session learnings

1. UI architecture in mastopia:
   - `page/build.js` concatenates scripts into `web/index.html`. Always rebuild after editing `page/src/`.
   - The route switcher toggles between `/` (3D City) and `/console` (Console dashboard) without page reload.
   - Tab switching uses client-side hash routing (`#sessions`, `#screen`, `#logs`, `#rulebook`, `#ops-desk`).
2. Polling lifecycle:
   - Polling runs at 2,000 ms during active use and backs off to 10,000 ms when `document.hidden` is true.
3. Code alignment:
   - Follow CODE-01 to CODE-15: single responsibility, short functions, early returns, no new packages.
