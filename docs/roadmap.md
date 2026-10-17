# Roadmap — mastopia

| Field | Value |
|---|---|
| Document | Roadmap |
| Product | mastopia |
| Date | 2026-10-17 |
| Status | Draft — waiting for Shaunak approval (PRE-01) |
| Author (backend sequencing) | builder-grok (`grok-4.6`) |
| Author (P1 → P2 → P3 product) | builder-gemini (`gemini-3.8-flash-high`) |
| Reviewer | reviewer-claude (`claude-opus-5-5`) |
| Approval | WAITING |

This file records backend sequencing and product roadmap in full. builder-grok owns
backend sequencing; builder-gemini owns UI sequencing, navigation, and P2/P3 product roadmap.

## Acronyms

| Acronym | Definition |
|---|---|
| API | Application Programming Interface |
| CLI | Command-Line Interface |
| JSON | JavaScript Object Notation |
| PRD | Product Requirements Document |
| UI | User Interface |

## Gates

PRE-01: Shaunak approves at least this spec sheet, this Product Requirements Document (PRD), and this roadmap
before any P1 implementation PR. Reviewer marks an implementation PR BLOCKED
until that approval line exists (PRE-03).

PRE-02: the chosen three docs are `docs/spec-sheet.md`, `docs/prd.md`,
`docs/roadmap.md`.

Flow after approval: builder PR → CI green → reviewer-claude CLEAN → Shaunak
merges. Agents never merge.

## Phase overview

| Phase | Intent | Write to herdr? |
|---|---|---|
| P0 | Read-only adapter + 3D city. On `main` at `ce38de3`. | no |
| P1 | Read-only console: sessions, screen, filters, logs, rulebook, ops desk | no |
| P2 | Optional write path and gatekeeper recommend/approve | yes, later |
| P3 | Fleet analytics, multi-district orchestration overview, rulebook compliance history | no |

## P1

P1 starts only after PRE-01 approval.

### Backend sequencing

Owner: builder-grok. Each row is one implementation PR unless a later brief
says to combine. Order is required where "Needs" is set.

| Seq | ID | Work | Needs | Notes |
|---|---|---|---|---|
| 1 | B1 | Session model + `GET /api/sessions` (cwd, cli, model, status, lastSeenAt) | PRE-01 | Unblocks filters and ops desk |
| 2 | B2 | `GET /api/screen` + masking tests on full pane text | B1 | Pane view cannot ship without this |
| 3 | B3 | Event log pipeline + `GET /api/logs` + 500/262144 bounds | B1 | Uses status transitions from B1 |
| 4 | B4 | Filter query params on `GET /api/sessions` | B1 | Server-side AND filters |
| 5 | B5 | `GET /api/rulebook` parse + district file presence | PRE-01 | Independent of B1–B4; may run parallel after PRE-01 |
| 6 | B6 | `GET /api/ops-desk` | B1 | Thin; may merge into the B1 PR if the diff stays one logical change |
| 7 | B7 | `--demo` / `MASTOPIA_DEMO=1`, bind `0.0.0.0`, `PORT` | PRE-01 | Independent; required before hosted preview |
| 8 | B8 | 409 on `/api/send-keys`, `/api/send-text`, `/api/prompt` | PRE-01 | Keep `/api/answer` 409 |

Backend check (this lane):

- Do not start B2 before B1: screen embeds the session object.
- Do not start B3 before B1: log types need console status.
- Do not start B4 before B1: filters run on the session list.
- B5 and B7 may proceed in parallel with B1 after PRE-01.
- B6 may sit in the B1 PR if SDLC-14 still holds (one logical change). If the
  B1 diff is already large, B6 is its own PR after B1.
- City P0 endpoints stay green in every PR (`GET /api/city`, `/events`, 409 on
  `/api/answer`).
- No send-keys PR in P1.

### UI sequencing

Owner: builder-gemini.

The builder-gemini agent implements each UI view after Shaunak merges the
corresponding backend PR from builder-grok into `main`.

| Seq | ID | Work | Needs backend | Description |
|---|---|---|---|---|
| 1 | U1 | Console shell, navigation header, route switcher (`/` <-> `/console`), and tab router | PRE-01 | Foundation for all console views |
| 2 | U2 | Sessions list view (`#sessions`) | B1 | Renders agent table, status badges, and inspect links |
| 3 | U3 | Filters UI on sessions view | B4 | Input controls for district, cli, model, status, and query `q` |
| 4 | U4 | Pane screen viewer (`#screen?paneId=...`) | B2 | Read-only preformatted terminal screen with secret masking |
| 5 | U5 | Event logs view (`#logs`) | B3 | Reverse-chronological event stream with buffer boundary indicator |
| 6 | U6 | Ops-desk queue view (`#ops-desk`) | B6 | Blocked sessions sorted by wait time, read-only notice, inspect links |
| 7 | U7 | Rulebook and district compliance view (`#rulebook`) | B5 | Rules table search and district missing file alerts |

Navigation integration:
- Root `/` serves the 3D City canvas (P0).
- Route `/console` serves the full-screen Console dashboard (P1).
- Persistent top navigation bar on both pages allows one-click switching.
- City page agent detail cards include a "View Screen in Console" link pointing
  directly to `/console#screen?paneId={paneId}`.

## P2

Phase P2 introduces write paths and gatekeeper recommendation workflows.
Work begins only after Shaunak approves a P2 brief and ADR.

### P2 sequencing and views

| Seq | Work | Description | Write to herdr? |
|---|---|---|---|
| P2-1 | Write path gating and permissions ADR | Architecture decision record specifying authentication, audit logging, and flags for write operations | no |
| P2-2 | Gatekeeper recommendation engine | Backend service analyzing blocked prompts and suggesting safe answers (`recommendation` payload) | no |
| P2-3 | Ops desk approval UI | Interactive action buttons (Approve / Reject / Answer) on ops-desk cards with confirmation modals | yes |
| P2-4 | Pane interaction view | Optional terminal send-keys and send-text panel for authorized operators | yes |

### P2 acceptance

1. All write operations require an explicit configuration flag (`--enable-writes`)
   and Shaunak's confirmation.
2. Ops desk displays gatekeeper recommendations alongside blocked prompts.
3. Operator can submit approved responses into herdr panes from the ops desk UI.
4. Every write action is logged to the mastopia event log with operator identity.

Backend note for P2 (not work now): any send path needs a new brief, an ADR if
it changes the public API (SDLC-08), and tests that live mode still cannot send
without that flag. P1 409 handlers are the compatibility floor.

## P3

Phase P3 expands mastopia to display fleet metrics and rule compliance checks
across districts.

### P3 capabilities

1. Fleet metrics view: agent token consumption, run durations, failure rates,
   and model utilization counts over time.
2. Rule compliance history: periodic checks verifying handbook rule compliance
   across local district repositories.
3. Cross-district status view: visual status of cross-district handoffs and PR
   state.
4. Compliance export: summary reports of rule compliance and lead escalations.

## Dependencies

| Dependency | P1 use |
|---|---|
| herdr 0.9.x on PATH | live mode only |
| Node.js 20+ | runtime |
| `fixtures/` | fixture and demo modes |
| `docs/MAS-House-Rules-Handbook.md` in process cwd | rulebook parse |
| Cursor cloud agents | hosted demo; DevOps triggers only, after Shaunak OK |

## Links

- Spec sheet: `docs/spec-sheet.md`
- PRD: `docs/prd.md`
- Brief: `briefs/BRIEF-mastopia-build.md` (local, not committed)
- Handbook: `docs/MAS-House-Rules-Handbook.md` (local, not committed)
