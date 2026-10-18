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
| U6 | User Interface Milestone 6 |
| UI | User Interface |
| UTF-8 | 8-bit Unicode Transformation Format |

## Current task

- Phase: P1 implementation.
- Milestone: U6 (User Interface Milestone 6) — Ops desk queue view (`#ops-desk`),
  rendering blocked prompts from `GET /api/ops-desk` sorted by wait time, wait timer badges,
  prompt quotes, recommendation placeholders, inspect links, and adapter error resilience.
- Worktree: `C:\Users\shaun\mastopia-gemini` on branch `feat/gemini-u6-ops-desk` (stacked on `feat/gemini-u4-screen`).
- Status: Merged `origin/feat/gemini-u4-screen` (including upstream main merges); leak rule verified;
  lint, format:check and test green.

## Files touched

Net diff vs `main` on `feat/gemini-u6-ops-desk`:

1. `.prettierignore`
2. `CHANGELOG.md`
3. `docs/agents/builder-gemini.md`
4. `eslint.config.js`
5. `page/README.md`
6. `page/build.js`
7. `page/src/07-console.js`
8. `page/src/console-router.js`
9. `page/src/ops-desk-view.js`
10. `page/src/page.html`
11. `page/src/screen-view.js`
12. `page/src/sessions-view.js`
13. `test/ops-desk-ui.test.js`
14. `test/screen-ui.test.js`
15. `test/sessions-ui.test.js`
16. `web/index.html`

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
