# PRD — mastopia P1 console

| Field | Value |
|---|---|
| Document | Product requirements document (PRD) |
| Product | mastopia |
| Phase | P1 — read-only console |
| Date | 2026-10-17 |
| Status | Draft — waiting for Shaunak approval (PRE-01) |
| Author (backend) | builder-grok (`grok-4.6`) |
| Author (product/UI) | `TODO(builder-gemini)` lead draft |
| Reviewer | reviewer-claude (`claude-opus-5-5`) |
| Approval | WAITING |

builder-gemini is not running yet. This file records backend requirements in full.
UI product copy, view-level requirements, and interaction notes are marked
`TODO(builder-gemini)`.

## Problem

Shaunak runs a multi-model agent fleet in herdr. P0 mastopia shows that fleet as
a 3D city on `127.0.0.1`. Operators still need a console: a list of every pane,
the pane text, filters, an event log, a rulebook check, and one queue of
"Needs you" prompts. None of that may send keys into a pane.

## Goal

A local, read-only console that answers: which agents are running, what they
last showed, who is blocked, whether a district has the required MAS files, and
what mastopia logged.

Success is: an operator on Shaunak's PC can open the console, see live or
fixture data, and never find a send/approve control.

## Users

| User | Need |
|---|---|
| Shaunak | See the fleet and "Needs you" queue without touching herdr from the GUI |
| Reviewer / lead agents | Read pane output and rulebook presence; no write |

## Scope

In scope (P1):

1. Sessions list for every herdr agent pane.
2. Read-only pane screen (recent output, masked).
3. Filters: district, model/CLI, status, text search.
4. Mastopia event log (status changes and "Needs you"), masked, bounded.
5. MAS rulebook view: rule id, text, check; per-district expected files.
6. City Hall ops desk: one display queue of "Needs you" items.
7. Demo mode with fixture data and bind rules for hosted preview (ENV-03).

Out of scope (P2):

- Send-keys, send-text, prompt, approve/deny buttons.
- Gatekeeper agents with approve rights (P1 may show `recommendation: null` only).

## Backend requirements

Owner: builder-grok. Contract: `docs/spec-sheet.md`.

BR-01. The process exposes the JSON endpoints in the spec sheet:
`GET /api/sessions`, `GET /api/screen`, `GET /api/logs`, `GET /api/rulebook`,
`GET /api/ops-desk`. P0 city routes stay.

BR-02. Every session object includes district (id + title), name, `cli`, `model`,
`status` (`working` \| `idle` \| `blocked`), `cwd`, and `lastSeenAt`.

BR-03. `GET /api/screen` returns the adapter's last pane read for that `paneId`,
after `maskSecrets`. Live herdr continues to read 80 lines.

BR-04. `GET /api/sessions` applies `district`, `cli`, `model`, `status`, and `q`
on the server as defined in the spec sheet.

BR-05. The adapter appends masked log events for status changes, "Needs you"
enter/clear, pane errors, and adapter errors. The buffer holds at most 500
events and at most 262144 characters of `text`. Oldest events drop first.

BR-06. `GET /api/rulebook` parses `docs/MAS-House-Rules-Handbook.md` in the
mastopia cwd and reports per-district presence of `CHANGELOG.md`, `briefs/`,
and `briefs/lead-escalations.md`. Missing required files appear in `missing`.

BR-07. `GET /api/ops-desk` lists current blocked sessions that have a prompt.
The body has no approve or deny action. `recommendation` is always null.

BR-08. `POST /api/answer`, `POST /api/send-keys`, `POST /api/send-text`, and
`POST /api/prompt` return 409 with `reason: "readonly"`.
`src/herdr-cli.js` still refuses write/control herdr commands.

BR-09. Token-looking strings never leave the API unmasked (SEC-03). Tests cover
fixture pane secrets on screen and logs.

BR-10. Default bind is `127.0.0.1`. `--demo` or `MASTOPIA_DEMO=1` uses fixture
data, binds `0.0.0.0`, and reads `PORT` then `MASTOPIA_PORT` then 7740.
Without the demo flag the process does not read `PORT` and does not bind
`0.0.0.0`.

BR-11. Adapter poll stays 2000 ms. Pane read runs only when the fingerprint
changes.

BR-12. Tests in `test/` cover the spec sheet test list. `npm test` stays green.
No new runtime dependencies unless a later PR lists them with a reason
(SDLC-18).

BR-13. Demo and fixture data come from `fixtures/` only (ENV-03). Live mode
talks to local herdr. No telemetry and no cloud calls from this process.

## UI requirements

TODO(builder-gemini): lead-draft the console views and interaction requirements
for:

- Sessions list (columns, badges, "Needs you" treatment, last-seen display)
- Pane screen view (read-only render, empty/error)
- Filters UI (controls that call `GET /api/sessions` query params)
- Logs view
- Rulebook view (highlight missing district files)
- Ops-desk queue (display only; no approve/deny)
- How the console sits next to the P0 city page (route or toggle)

Do not specify write controls. Follow `docs/spec-sheet.md` JSON shapes.

## Non-functional

| ID | Requirement |
|---|---|
| NF-01 | Read-only against herdr (RES-03, P1 scope) |
| NF-02 | Secrets masked in UI payloads and logs (SEC-03) |
| NF-03 | No paid spend from this process (SPEND-01) |
| NF-04 | Node.js 20+ as in `package.json` `engines` |
| NF-05 | CI: GitHub Actions workflow `.github/workflows/ci.yml` runs `npm test` |

## Acceptance criteria

Each criterion is testable after implementation PRs (not this docs PR).

1. `GET /api/sessions` on fixture mode returns at least the four fixture
   districts and includes `cwd`, `cli`, `model`, `status` on each row.
   Command: `npm test` (new sessions test).
2. Filter `status=blocked` returns the `w8:p1` grok row.
   Command: `npm test`.
3. `GET /api/screen?paneId=w8:p1` body `text` does not contain `ghp_` or
   `sk-thisIs`. Command: `npm test`.
4. After a fixture tick, `GET /api/logs` contains a `needs_you` event for
   `w8:p1`. Command: `npm test`.
5. `GET /api/rulebook` includes rule id `GOV-01` when the handbook file is in
   the process cwd. Command: `npm test`.
6. `GET /api/ops-desk` lists the blocked atlas-api prompt and has
   `recommendation: null`. Command: `npm test`.
7. `POST /api/answer` returns 409. Command: `npm test` (existing plus new send
   paths).
8. Process with `--demo` listens on `0.0.0.0`; default listens on `127.0.0.1`.
   Command: `npm test`.
9. TODO(builder-gemini): UI acceptance — operator can open each console view
   and see fixture data without a write control.

## Open questions

| ID | Question | Owner |
|---|---|---|
| Q1 | Expected files per district (see spec sheet Q1) | Shaunak |
| Q2 | Log bounds (see spec sheet Q2) | Shaunak |
| Q3 | Console route vs city page | TODO(builder-gemini) |
| Q4 | Polling vs Server-Sent Events for console | TODO(builder-gemini) |

## Links

- Spec sheet: `docs/spec-sheet.md`
- Roadmap: `docs/roadmap.md`
- Brief: `briefs/BRIEF-mastopia-build.md`
- Handbook: `docs/MAS-House-Rules-Handbook.md`
