# PRD — mastopia P1 console

| Field | Value |
|---|---|
| Document | Product requirements document (PRD) |
| Product | mastopia |
| Phase | P1 — read-only console |
| Date | 2026-10-17 |
| Status | Approved by Shaunak 2026-10-18 (PRE-01); PR #2 merged as `538ba9d` |
| Author (backend) | builder-grok (`grok-4.6`) |
| Author (product/UI) | builder-gemini (`gemini-3.8-flash-high`) |
| Reviewer | reviewer-claude (`claude-opus-5-5`) |
| Approval | Approved by Shaunak (2026-10-18) |

This file records backend and UI product requirements in full. builder-grok owns
the backend requirements; builder-gemini owns the UI requirements and view specifications.

## Acronyms

| Acronym | Definition |
|---|---|
| API | Application Programming Interface |
| CLI | Command-Line Interface |
| GUI | Graphical User Interface |
| HTTP | Hypertext Transfer Protocol |
| JSON | JavaScript Object Notation |
| PC | Personal Computer |
| SSE | Server-Sent Events |
| UI | User Interface |

## Problem

Shaunak runs a multi-model agent fleet in herdr. P0 mastopia shows that fleet as
a 3D city on `127.0.0.1`. Operators still need a console: a list of every pane,
the pane text, filters, an event log, a rulebook check, and one queue of
"Needs you" prompts. None of that may send keys into a pane.

## Goal

A local, read-only console that answers: which agents are running, what they
last showed, who is blocked, whether a district has the required MAS files, and
what mastopia logged.

Success is: an operator on Shaunak's Personal Computer (PC) can open the console, see live or
fixture data, and never find a send/approve control.

## Users

| User | Need |
|---|---|
| Shaunak | See the fleet and "Needs you" queue without touching herdr from the Graphical User Interface (GUI) |
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

Owner: builder-gemini. Contract: `docs/spec-sheet.md`.

UR-01. Route and navigation. The process serves the P0 3D city on `/` and the
console dashboard on `/console`. Both pages display a persistent navigation bar
with a one-click switcher between the 3D City view (`/`) and the Console (`/console`).
The console uses client-side hash routes for tab views: `#sessions`, `#screen`,
`#logs`, `#rulebook`, and `#ops-desk`.

UR-02. Sessions list view (`#sessions`).
- Renders the session rows returned by `GET /api/sessions`.
- Columns display District (`districtTitle`), Agent Name (`name`), Tool/Model
  (`cli` and `model` badges), Status (`statusLabel`), Working Directory (`cwd`),
  Last Seen (`lastSeenAt` formatted as relative time), and Inspect Action.
- Visual status badges: `working` renders green/blue; `idle` renders neutral gray;
  `blocked` ("Needs you") renders amber/red with an alert indicator.
- Clicking an Inspect link navigates to `#screen?paneId={paneId}`.
- Displays an empty state message if no sessions match the applied filters.

UR-03. Pane screen view (`#screen`).
- Renders masked recent pane output from `GET /api/screen?paneId={paneId}`.
- Header displays pane metadata: `paneId`, `name`, `districtTitle`, `model`,
  `status`, and `updatedAt`.
- The terminal screen displays `text` in a monospace block with fixed-width styling.
- The view shows a truncation banner if `truncated` is true.
- If `text` is empty, displays "No recent output recorded for this pane."
- If the pane is not found (404) or unavailable (400/500), displays an error banner.
- Contains no input boxes, send buttons, prompt fields, or interactive keystroke paths.

UR-04. Filters UI.
- Filter controls map directly to `GET /api/sessions` query parameters:
  `district`, `cli`, `model`, `status`, and `q`.
- District control provides text or select filtering for `district`.
- CLI control filters exact CLI kind (`claude`, `grok`, `gemini`, `cursor`).
- Model control filters model substring.
- Status control toggles between `all`, `working`, `idle`, and `blocked`.
- Search input `q` filters text with a 300 ms debounce (pending spec Q6) before issuing requests.
- A "Reset filters" button clears all inputs back to empty defaults.

UR-05. Event logs view (`#logs`).
- Displays event log entries from `GET /api/logs` in reverse chronological order.
- Each row displays timestamp (`ts` formatted in local time with ms), event `type`
  badge, agent and district identity (`name`, `districtTitle`, `paneId`),
  status transition (`fromStatus` -> `toStatus` if present), and masked `text`.
- Header displays buffer capacity metrics from `bounded.maxEvents` and `bounded.maxChars`.
- Controls allow filtering the displayed log events by type and free-text search.

UR-06. Rulebook view (`#rulebook`).
- Displays parsed MAS House Rules from `GET /api/rulebook`, listing rule `id`,
  `area`, `text`, and `check`.
- Includes a search filter to look up rules by ID or keyword.
- Displays the district compliance overview from `districts`.
- For each district, displays `title`, `cwd`, and status of expected files:
  `CHANGELOG.md`, `briefs/`, `briefs/lead-escalations.md`, and
  `docs/MAS-House-Rules-Handbook.md`.
- Required files that are missing (`missing` array) render with a red alert badge.
- If `readable` is false, displays a warning that the district directory is inaccessible.

UR-07. Ops-desk queue (`#ops-desk`).
- Displays current blocked sessions from `GET /api/ops-desk` sorted by `since`
  ascending (longest waiting prompt first).
- Each card displays `paneId`, `districtTitle`, `name`, `cli`, `model`, the masked
  prompt text, and elapsed wait duration computed from `waitMs`.
- `recommendation` displays as null or "None (P1 placeholder)".
- Prominently displays notice: "Ops Desk is read-only in P1. Respond directly inside herdr terminal."
- Provides an Inspect button linking to the pane screen view.
- Provides no approve, deny, input, or response submission controls.
- Displays an empty state banner when `items` is empty: "All agent queues clear. No items require attention."

UR-08. Polling and refresh lifecycle.
- The console client polls the active view endpoint every 2000 ms during active use.
- When the document becomes hidden (`document.hidden` is true), polling backs off
  to 10000 ms (pending spec Q7) to conserve system resources.
- A manual "Refresh" button triggers an immediate reload of the active view data.

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
9. City and console navigation.
   - Step: Operator loads `http://127.0.0.1:7740/`, clicks `[Console ->]`, then clicks `[<- 3D City]`.
   - Expected: Browser transitions from 3D city to console dashboard, then returns to 3D city.
10. Sessions list display.
   - Step: Operator navigates to `http://127.0.0.1:7740/console#sessions`.
   - Expected: Table renders all fixture agent rows with name, district, status badge, cwd, and last-seen time.
11. Sessions filtering.
   - Step: Operator selects status `blocked` in the filters toolbar.
   - Expected: Table updates to show only blocked sessions (`w8:p1` grok row).
12. Read-only pane screen view.
   - Step: Operator clicks `[Inspect]` on the `w8:p1` session row.
   - Expected: Browser displays `/console#screen?paneId=w8:p1` with masked terminal output and zero input fields.
13. Event log stream display.
   - Step: Operator navigates to `http://127.0.0.1:7740/console#logs`.
   - Expected: Reverse-chronological event stream renders with event type tags and buffer capacity indicators.
14. Rulebook and compliance display.
   - Step: Operator navigates to `http://127.0.0.1:7740/console#rulebook`.
   - Expected: Table displays parsed house rules and district file check matrix with missing files flagged red.
15. Ops-desk queue display.
   - Step: Operator navigates to `http://127.0.0.1:7740/console#ops-desk`.
   - Expected: Queue renders blocked agent prompt cards sorted by wait duration with no action buttons.

## Decisions

| ID | Question | Owner | Status |
|---|---|---|---|
| Q1 | Expected files per district (see spec sheet Q1) | Shaunak | Approved by Shaunak 2026-10-18 (as written) |
| Q2 | Log bounds (see spec sheet Q2) | Shaunak | Approved by Shaunak 2026-10-18 (as written) |
| Q3 | Console route vs city page | builder-gemini | Decided: `/` serves 3D City canvas; `/console` serves Console dashboard; persistent top navigation bar switches between them. |
| Q4 | Polling vs Server-Sent Events (SSE) for console | builder-gemini | Decided: 2000 ms; hidden tab 10000 ms (Q7 approved). HTTP polling used; P0 SSE remains on `/events` for city. |

Routine values are stated as defaults Shaunak can veto, not asked as questions (Shaunak, 2026-10-18).

## Links

- Spec sheet: `docs/spec-sheet.md`
- Roadmap: `docs/roadmap.md`
- Brief: `briefs/BRIEF-mastopia-build.md` (local, not committed)
- Handbook: `docs/MAS-House-Rules-Handbook.md` (local, not committed)
