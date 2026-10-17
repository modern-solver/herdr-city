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
| UI | User Interface |
| UTF-8 | 8-bit Unicode Transformation Format |

## Current task

- Phase: P1 implementation.
- Milestone: U1 (User Interface Milestone 1) — Console shell, navigation header, route switcher
  (`/` and `/console`), and tab router (`#sessions`, `#screen`, `#logs`, `#rulebook`, `#ops-desk`).
- Worktree: `C:\Users\shaun\mastopia-gemini` on branch `feat/gemini-u1-shell`.
- Status: Opened PR #6 (replacing PR #4 for SDLC-12) with round 1 fixes:
  1. Restored `prefers-reduced-motion` media query in `page/src/page.html` and `web/index.html`.
  2. Single source for router and lifecycle helpers in `page/src/console-router.js` (CODE-05/14).
  3. Extracted `closeCityConsolePanel()` and set timestamp to 'No data yet' (CODE-04).
  4. Expanded tests in `test/console-ui.test.js` to 35 passing tests.

## Files touched

The builder-gemini agent touched and maintains the following files on `feat/gemini-u1-shell`:

1. `page/src/console-router.js`:
   - Single source for routing, tab switching, panel visibility, and polling helpers.
2. `page/src/07-console.js`:
   - Shipped console shell controller consuming `console-router.js` without duplicate definitions.
3. `page/src/page.html`:
   - Restored `prefers-reduced-motion` CSS rule.
   - Added `#consoleShell` container and distinct dashboard icon for `#btnGoConsole`.
4. `page/build.js`:
   - Bundles `console-router.js` before `07-console.js` into `web/index.html`.
5. `web/index.html`:
   - Generated client bundle containing 3D City and Console Shell.
6. `src/server.js`:
   - Routes `/console` to `index.html` to support direct browser navigation and refresh.
7. `test/console-ui.test.js`:
   - 35 unit/integration tests covering router, tabs, visibility, polling manager, and reduced-motion.
8. `page/README.md` and `web/README.md`:
   - Module documentation satisfying CTX-10.
9. `CHANGELOG.md`:
   - Added dated entry for U1 console shell, navigation, tab router, and round-1 fixes.
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
2. Code alignment and testing (CODE-04, CODE-05, CODE-14):
   - Keep a single source of truth for routing helpers; avoid duplicating constants in controller scripts.
   - Test shipped functions with minimal stubs rather than testing isolated mock copies.
   - Move cross-component mutations (like closing P0 console) into explicit named functions.
3. Accessibility and regressions:
   - Verify that media queries like `prefers-reduced-motion` remain intact when introducing new styles.
