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
| PC | Personal Computer |
| PR | Pull Request |
| PRD | Product Requirements Document |
| SSE | Server-Sent Events |
| UI | User Interface |
| UTF-8 | 8-bit Unicode Transformation Format |

## Current task

- Phase: PRE-01 documentation before implementation code.
- Task: Complete and maintain User Interface (UI) sections and address review findings
  for Pull Request (PR) #2 on branch `docs/p1-prebuild`.
- Scope: UI view specifications, UI product requirements, UI milestones (P1 to P3),
  acceptance criteria steps, agent memory file maintenance (CTX-12), and coordination.
- Status: Resolving round 5 review findings (F and G) to unblock PR #2.

## Files touched

The builder-gemini agent touched and maintains the following files on `docs/p1-prebuild`:

1. `docs/prd.md`:
   - Drafted UI requirements UR-01 through UR-08 (sessions list, pane screen, filters,
     logs, rulebook, ops desk, route navigation, polling lifecycle).
   - Added detailed operator steps and expected results for acceptance criteria 9 to 15.
   - Clarified open questions Q3 (route `/` vs `/console`) and Q4 (polling vs SSE).
2. `docs/roadmap.md`:
   - Ordered UI view milestones U1 through U7 against backend sequence B1 through B6.
   - Defined navigation integration between the 3D city canvas and console dashboard.
   - Drafted P2 write path sequencing/acceptance and P3 fleet analytics narrative.
3. `docs/spec-sheet.md` (UI view specs section only):
   - Defined view specifications for shell, sessions list, pane screen, filters UI,
     event logs, rulebook view, and ops-desk queue.
   - Specified ANSI pass-through behavior for pane screen view.
   - Added demo mode badge to the shell navigation header.
   - Formatted empty, loading, and error states across all views.
4. `CHANGELOG.md`:
   - Added dated entry `## 2026-10-18` documenting the addition of agent memory files and
     the decision that DevOps permanently maintains `docs/agents/reviewer-claude.md`.
5. `docs/agents/reviewer-claude.md`:
   - Committed on behalf of DevOps (who maintains reviewer memory per Shaunak decision).
6. `docs/agents/builder-gemini.md`:
   - Agent memory file tracking active task, touched files, open questions, and learnings.

## Open questions

Tracking open questions recorded in `docs/spec-sheet.md` and `docs/prd.md`:

| ID | Question | Owner | Status |
|---|---|---|---|
| Q1 | Confirm expected files per district: `CHANGELOG.md`, `briefs/`, `briefs/lead-escalations.md`. | Shaunak | WAITING |
| Q2 | Confirm log bounds 500 events and 262,144 characters. | Shaunak | WAITING |
| Q5 | Confirm screen text cap 80,000 characters. | Shaunak | WAITING |
| Q6 | Confirm search input debounce 300 ms. | Shaunak | WAITING |
| Q7 | Confirm hidden-tab poll interval 10,000 ms. | Shaunak | WAITING |

Note: Q3 (route `/` for 3D City and `/console` for Console) and Q4 (2,000 ms polling
during active use) were resolved by builder-gemini in the PRE-01 drafts.

## Last-session learnings

1. Documentation strictness:
   - Acronyms MUST be defined in an Acronyms table or expanded on first use per document.
   - All lines outside tables and URLs MUST remain under 120 characters (DOC-07).
   - Use active voice and name specific actors (e.g., "The builder-gemini agent implements...").
   - Avoid vague dual-state descriptions; specify concrete technical behaviors (e.g., ANSI pass-through).
2. Coordination in shared checkouts:
   - Always log coordination lines in `briefs/lead-escalations.md` before starting edits.
   - Edit only files assigned to the agent's lane; never touch files owned by other builders.
   - Stage specific files using `git add <file>` and never use blanket adds (`git add -A`).
   - Run `git pull --rebase` before committing and pushing to prevent merge commits.
   - Record pushed commit hashes under `## Coordination` upon completing a task.
3. Worktree separation:
   - PR #2 pre-build documentation edits remain on `docs/p1-prebuild` in `C:\Users\shaun\mastopia`.
   - Post-PR #2 implementation work moves to `C:\Users\shaun\mastopia-gemini` on `p1/gemini-console-ui`.
