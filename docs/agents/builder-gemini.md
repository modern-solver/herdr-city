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
- Status: PR #6 (replacing PR #4 for SDLC-12); merged `origin/main` (PR #3, #7, #9):
  1. Restored `prefers-reduced-motion` media query in `page/src/page.html` and `web/index.html`.
  2. Single source for router and lifecycle helpers in `page/src/console-router.js` (CODE-05/14).
  3. Extracted `closeCityConsolePanel()` and set timestamp to 'No data yet' (CODE-04).
  4. Expanded tests in `test/console-ui.test.js` to 35 passing tests.
  5. Updated CHANGELOG.md U1 links to PR #6 per CHG-04.
  6. Merged `origin/main` (PR #7 tooling, PR #9 codemap) into `feat/gemini-u1-shell`.
  7. Regenerated `docs/CODEMAP.md` and updated module READMEs (`page/README.md`, `web/README.md`).

## Files touched

Net diff vs `main` on `feat/gemini-u1-shell`:

1. `CHANGELOG.md`
2. `docs/CODEMAP.md`
3. `docs/agents/builder-gemini.md`
4. `page/README.md`
5. `page/build.js`
6. `page/src/07-console.js`
7. `page/src/console-router.js`
8. `page/src/page.html`
9. `src/server.js`
10. `test/console-ui.test.js`
11. `web/README.md`
12. `web/index.html`

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
   - Move cross-component mutations (like closing P0 console) into explicit named functions.
3. Accessibility and regressions:
   - Verify that media queries like `prefers-reduced-motion` remain intact when introducing new styles.
4. Coordination and branch management (D1, D3):
   - Merging `origin/main` via normal merge commits (no rebase-and-force-push) keeps PR history clean.
   - Reconcile `CHANGELOG.md` carefully to preserve all items across concurrently developed branches.
