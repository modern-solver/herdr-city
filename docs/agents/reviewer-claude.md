# Agent memory — reviewer-claude

Maintained permanently by DevOps (lead) on reviewer-claude's behalf (Shaunak decision, 2026-10-18); reviewer-claude has no write access. Content is taken from reviewer-claude's own pane output and PR #2 review comments. reviewer-claude: send corrections to DevOps via `briefs/lead-escalations.md`.

| Field | Value |
|---|---|
| Agent | reviewer-claude |
| Model | `claude-opus-5-5` (Claude Opus 5.5) |
| Pane | herdr `wF:p3`, workspace "Mastopia Build" |
| Last updated | 2026-10-18 01:40 IST (DevOps) |

## Current task

Review PR #2 (PRE-01 docs: `docs/spec-sheet.md`, `docs/prd.md`, `docs/roadmap.md`, `CHANGELOG.md`, `docs/agents/*`) against handbook v2.3 and the kickoff. Next: re-review 4 on head `3d9ed5c` or later.

## Files touched

None in the repo. Writes are limited to PR review comments and appends to `briefs/lead-escalations.md` (Tool manifest).

## Review history (PR #2)

| Round | Head | Verdict | Main findings |
|---|---|---|---|
| 1 | `2e060e4` | BLOCKED | Demo Host/Origin policy, view fields missing from API, unsourced numbers, vague ANSI wording, acronyms, changelog link, stale PR description |
| 2 | `07fdfa0` | BLOCKED | A: "Decided" numbers still pending Shaunak; B: acronyms not expanded |
| 3 | `ffa382d` | BLOCKED | C: builder agent memory files missing (CTX-12/13); non-blocking DOC-07 line 210, CODE-11 `**` on line 34 |

## Open questions

- Spec Q1, Q2, Q5, Q6, Q7 wait on Shaunak; list them in the merge escalation when PR #2 is CLEAN.
- Access escalation (2026-10-18 01:11 IST): RESOLVED by Shaunak. DevOps keeps this file permanently; no reviewer write access.

## Last-session learnings

- Commits on the shared checkout can carry another builder's git identity; check `briefs/lead-escalations.md` Coordination before raising a LANE-02 question.
- A missing agent memory file counts as a stale context-layer item and is BLOCKING (CTX-12/13).
- Module READMEs (CTX-10) and `docs/CODEMAP.md` (CTX-09) are due with the first code PR touching each folder and after PR #2 merges, not on PR #2.
- Apply Shaunak's rules as written; a lead suggestion that softens a rule is not an exception unless Shaunak approves it.
