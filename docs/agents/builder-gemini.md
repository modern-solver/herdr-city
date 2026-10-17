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
| GUI | Graphical User Interface |
| HTTP | Hypertext Transfer Protocol |
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

- Phase: P1 implementation kickoff and documentation follow-up.
- Task: Open documentation follow-up PR on `docs/p1-approvals` recording Shaunak's PRE-01 approval,
  then implement UI milestone U1 on branch `p1/gemini-console-ui` in worktree
  `C:\Users\shaun\mastopia-gemini`.
- Scope: Approvals follow-up docs (`docs/spec-sheet.md`, `docs/prd.md`, `docs/roadmap.md`, `CHANGELOG.md`,
  `docs/agents/*`), then console shell, navigation header, route switcher, and tab router with tests for U1.
- Status: Preparing `docs/p1-approvals` commit and PR #3.

## Files touched

The builder-gemini agent touched and maintains the following files on `docs/p1-approvals`:

1. `docs/spec-sheet.md`:
   - Updated Status row to approved by Shaunak 2026-10-18 (PRE-01, PR #2 merged as 538ba9d).
   - Renamed Open questions section to Decisions; set Q1, Q2, Q5, Q6, Q7 to approved as written.
   - Updated Q3 status to decided: 2000 ms; hidden tab 10000 ms (Q7 approved).
   - Added standing preference note: routine values are defaults Shaunak can veto.
2. `docs/prd.md`:
   - Updated Status row to approved by Shaunak 2026-10-18 (PRE-01, PR #2 merged as 538ba9d).
   - Aligned Decisions section with spec sheet decisions and added defaults preference note.
3. `docs/roadmap.md`:
   - Updated Status row to approved by Shaunak 2026-10-18 (PRE-01, PR #2 merged as 538ba9d).
   - Updated P1 section to note PRE-01 approved and P1 is open.
4. `CHANGELOG.md`:
   - Added entries under 2026-10-18 for Shaunak's PRE-01 approval, Q1/Q2/Q5-Q7 approval,
     defaults-not-questions standing preference, and reviewer round-6 row.
5. `docs/agents/reviewer-claude.md`:
   - Committed on behalf of DevOps (who maintains reviewer memory per Shaunak decision).
6. `docs/agents/builder-gemini.md`:
   - Agent memory file tracking active task, touched files, open questions, and learnings.

## Open questions

Decisions and standing approvals from Shaunak (2026-10-18):

| ID | Item | Owner | Status |
|---|---|---|---|
| Q1 | Expected files per district: `CHANGELOG.md`, `briefs/`, `briefs/lead-escalations.md` | Shaunak | Approved (as written) |
| Q2 | Log bounds: 500 events and 262,144 characters | Shaunak | Approved (as written) |
| Q3 | Console polling interval: 2,000 ms; hidden tab 10,000 ms | builder-gemini | Decided |
| Q4 | ANSI in pane screen: pass through cleanly in preformatted code block | builder-gemini | Decided |
| Q5 | Screen text cap: 80,000 characters | Shaunak | Approved (as written) |
| Q6 | Search input debounce: 300 ms | Shaunak | Approved (as written) |
| Q7 | Hidden-tab poll interval: 10,000 ms | Shaunak | Approved (as written) |

Standing preference (Shaunak, 2026-10-18): routine values are stated as defaults Shaunak
can veto, not asked as open questions.

## Last-session learnings

1. Documentation strictness:
   - Acronyms MUST be defined in an Acronyms table or expanded on first use per document.
   - All lines outside tables and URLs MUST remain under 120 characters (DOC-07).
   - Use active voice and name specific actors (e.g., "The builder-gemini agent implements...").
   - Routine values are defaults Shaunak can veto, not open questions.
2. Coordination in shared checkouts:
   - Always log coordination lines in `briefs/lead-escalations.md` before starting edits.
   - Edit only files assigned to the agent's lane; never touch files owned by other builders.
   - Stage specific files using `git add <file>` and never use blanket adds (`git add -A`).
   - Run `git pull --rebase` before committing and pushing to prevent merge commits.
   - Record pushed commit hashes under `## Coordination` upon completing a task.
3. Worktree separation:
   - Docs follow-up PR is completed on `docs/p1-approvals` in `C:\Users\shaun\mastopia`.
   - All P1 UI implementation code happens in `C:\Users\shaun\mastopia-gemini` on `p1/gemini-console-ui`.
