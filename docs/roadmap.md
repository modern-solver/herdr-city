# Roadmap — mastopia

| Field | Value |
|---|---|
| Document | Roadmap |
| Product | mastopia |
| Date | 2026-10-17 |
| Status | Draft — waiting for Shaunak approval (PRE-01) |
| Author (backend sequencing) | builder-grok (`grok-4.6`) |
| Author (P1 → P2 → P3 product) | `TODO(builder-gemini)` |
| Reviewer | reviewer-claude (`claude-opus-5-5`) |
| Approval | WAITING |

builder-gemini is not running yet. Backend sequencing below is the check
builder-grok owns. Phase narrative for P2 and P3 UI/product is
`TODO(builder-gemini)`.

## Gates

PRE-01: Shaunak approves at least this spec sheet, this PRD, and this roadmap
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
| P3 | `TODO(builder-gemini)` | `TODO(builder-gemini)` |

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

TODO(builder-gemini): order the console views against B1–B8. Suggested coupling
(backend view only; UI lead may change):

| View | Earliest backend |
|---|---|
| Sessions list | B1 |
| Filters UI | B4 (can mock on B1) |
| Pane screen | B2 |
| Logs | B3 |
| Rulebook | B5 |
| Ops desk | B6 or B1 |

TODO(builder-gemini): city page vs console navigation.

## P2

From `briefs/BRIEF-mastopia-build.md`: write paths into panes, and district
gatekeeper agents with approve rights. P1 may show a recommendation slot only
(`recommendation: null`).

TODO(builder-gemini): draft P2 product sequencing, views, and acceptance.

Backend note for P2 (not work now): any send path needs a new brief, an ADR if
it changes the public API (SDLC-08), and tests that live mode still cannot send
without that flag. P1 409 handlers are the compatibility floor.

## P3

TODO(builder-gemini): define P3. No backend commitment until that draft exists.

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
- Brief: `briefs/BRIEF-mastopia-build.md`
