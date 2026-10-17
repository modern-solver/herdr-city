# Agent memory — reviewer-claude

Maintained permanently by DevOps (lead) on reviewer-claude's behalf (Shaunak decision, 2026-10-18).
reviewer-claude has no write access. Content comes from reviewer-claude's own pane output and its PR #2 reviews.
reviewer-claude sends corrections to DevOps via `briefs/lead-escalations.md`.

| Field | Value |
|---|---|
| Agent | reviewer-claude |
| Model | `claude-opus-5-5` (Claude Opus 5.5) |
| Pane | herdr `wF:p3`, workspace "Mastopia Build" |
| Last updated | 2026-10-18 03:35 India Standard Time (IST), by DevOps |

## Acronyms

| Acronym | Meaning |
|---|---|
| ANSI | American National Standards Institute (terminal escape sequences) |
| API | Application Programming Interface |
| IST | India Standard Time (UTC+5:30) |
| PR | Pull Request |
| UTC | Coordinated Universal Time |

## Current task

PR #2 (PRE-01 docs) is CLEAN at `89a2ff2` and was merged by Shaunak as `538ba9d` (2026-10-18 03:29 IST).
Next: review each P1 implementation PR from builder-grok and builder-gemini against handbook v2.3 and the kickoff.

## Files touched

None in the repo. Writes are limited to PR review comments and appends to `briefs/lead-escalations.md`
(Tool manifest).

## Review history (PR #2)

| Round | Head | Verdict | Main findings |
|---|---|---|---|
| 1 | `2e060e4` | BLOCKED | Demo Host/Origin policy, view fields missing from the API, unsourced numbers, vague ANSI wording, acronyms, changelog link, stale PR description |
| 2 | `07fdfa0` | BLOCKED | A: "Decided" numbers still pending Shaunak; B: acronyms not expanded |
| 3 | `ffa382d` | BLOCKED | C: builder agent memory files missing (CTX-12/13); non-blocking DOC-07 line 210, CODE-11 `**` on line 34 |
| 4 | `e139b03` | BLOCKED | D: acronyms in memory files (DOC-13); E: `CHANGELOG.md` has no 2026-10-18 entry (CHG-02, CHG-04) |
| 5 | `7525acd` | BLOCKED | F: `docs/agents/builder-gemini.md` stale after `a83a257`/`efe396b` (CTX-12/13); G: `UTC` not expanded (DOC-13) |
| 6 | `89a2ff2` | CLEAN | F and G fixed; all findings from rounds 1-5 closed; merged by Shaunak as `538ba9d` |

## Open questions

- Spec Q1, Q2, Q5, Q6, Q7: approved by Shaunak as written on 2026-10-18. No open spec questions.
- Access request (2026-10-18 01:11 IST): resolved by Shaunak. DevOps keeps this file permanently.
  No reviewer write access.

## Last-session learnings

- Commits on the shared checkout can carry another builder's git identity.
  Check the Coordination section of `briefs/lead-escalations.md` before raising a LANE-02 question.
- A missing agent memory file is a stale context-layer item and is BLOCKING (CTX-12/13).
- Module READMEs (CTX-10) are due with the first code PR touching each folder.
  `docs/CODEMAP.md` (CTX-09) is due after PR #2 merges.
- Apply Shaunak's rules as written. A lead suggestion that softens a rule is not an exception.
- New memory files and decisions need a dated `CHANGELOG.md` entry with links (CHG-02, CHG-04).
- Shaunak preference (2026-10-18): routine values are stated as defaults he can veto, not asked as questions.
