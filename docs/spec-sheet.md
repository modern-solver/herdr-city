# Spec sheet — mastopia P1 console

| Field | Value |
|---|---|
| Document | Spec sheet |
| Product | mastopia |
| Phase | P1 — read-only console |
| Date | 2026-10-17 |
| Status | Approved by Shaunak 2026-10-18 (PRE-01); PR #2 merged as `538ba9d` |
| Author | builder-grok (`grok-4.6`) |
| Reviewer | reviewer-claude (`claude-opus-5-5`) |
| Lane | Backend lead (builder-grok); UI view specs (builder-gemini) |
| Approval | Approved by Shaunak (2026-10-18) |

This document is the API contract the console UI consumes. builder-grok implements
the backend against it. builder-gemini implements views against it.

## Acronyms

| Acronym | Definition |
|---|---|
| ANSI | American National Standards Institute |
| API | Application Programming Interface |
| CLI | Command-Line Interface |
| HTTP | Hypertext Transfer Protocol |
| JSON | JavaScript Object Notation |
| UI | User Interface |
| UTF-8 | 8-bit Unicode Transformation Format |
| JWT | JSON Web Token |
| PRD | Product Requirements Document |

## Purpose

Mastopia P1 adds a read-only console next to the P0 3D city. The console shows
herdr sessions, pane text, filters, an event log, the MAS rulebook, and a City Hall
ops-desk queue of "Needs you" prompts. The process never writes to herdr.

## Scope

In scope for this spec:

1. JSON HTTP API for the six console surfaces in `briefs/BRIEF-mastopia-build.md`.
2. Adapter extensions: session fields, pane screen cache, event log, filters,
   rulebook parse, district file checks, masking.
3. Demo bind rules for hosted preview (ENV-03).
4. Tests in `test/` that lock the contract.

Out of scope (P2, separate review):

- `herdr pane send-keys`, `send-text`, prompt injection, approve/deny controls.
- District gatekeeper agents with approve rights.
- Token-usage charts (P0 README open question; still out of P1).

## Actors and lanes

| Actor | Work |
|---|---|
| builder-grok | Adapter, local JSON API, logs, filters, masking, tests |
| builder-gemini | Console views in `web/` and `page/` |
| reviewer-claude | Reviews every builder PR |
| Shaunak | Approves PRE-01 docs, merges, spend, deploys |

## Current system (P0)

P0 is on `main` at commit `ce38de3`. It is read-only.

| Piece | Path | Behaviour |
|---|---|---|
| Live herdr client | `src/herdr-cli.js` | Allows only `agent list`, `workspace list`, `pane read` |
| Fixture client | `src/fixtures.js` | Reads `fixtures/`; `kind` is `fixture` |
| Adapter | `src/adapter.js` | Polls every 2000 ms; pane read only on fingerprint change |
| City map | `src/map.js` | Districts, robots, asks; masks pane text |
| HTTP server | `src/server.js` | Binds `127.0.0.1`; serves city page and JSON |
| CLI | `src/cli.js` | `--fixture`, `--port`; rejects non-loopback `--host` |
| Mask | `src/mask.js` | Replaces token-looking strings with `[redacted]` |

Live pane read uses:

```text
herdr pane read <paneId> --source recent-unwrapped --lines 80
```

Fingerprint fields: `pane_id`, `agent_status`, `revision`, `state_change_seq`,
`terminal_title_stripped` or `terminal_title`, `cwd`.

City "asleep" uses `IDLE_ASLEEP_MS` = 600000 in `src/map.js`. The console does not
use that visual. Console status is `working`, `idle`, or `blocked` only.

## P1 backend surfaces

| Console surface | Backend owner | HTTP |
|---|---|---|
| Sessions list | builder-grok | `GET /api/sessions` |
| Pane screen | builder-grok | `GET /api/screen` |
| Filters | builder-grok | query params on `GET /api/sessions` |
| Event log | builder-grok | `GET /api/logs` |
| MAS rulebook | builder-grok | `GET /api/rulebook` |
| Ops desk | builder-grok | `GET /api/ops-desk` |

P0 city endpoints stay. The city page keeps using them.

## Data model

### Session (console)

One herdr agent pane. `id` equals `paneId`.

| Field | Type | Source |
|---|---|---|
| `id` | string | `agent.pane_id` |
| `paneId` | string | `agent.pane_id` (example: `w8:p1`) |
| `districtId` | string | `agent.workspace_id` |
| `districtTitle` | string | workspace `label`, else cwd basename, else id |
| `name` | string | `agent.name` else `display_agent` else `agent` else `pane_id` |
| `cli` | string | `inferCliKind` in `src/prompt-detect.js` |
| `model` | string | `tokens.model` else `display_agent` else `agent` else `cli` |
| `status` | string | `working` \| `idle` \| `blocked` |
| `statusLabel` | string | `Needs you` when `blocked`; else `Working` / `Idle` |
| `cwd` | string \| null | `foreground_cwd` else `cwd` |
| `lastSeenAt` | number | Unix ms; last time status was working or blocked |
| `activity` | string | masked; prompt / error / terminal title; max 240 chars |
| `prompt` | string \| null | masked detected prompt; null if none |
| `error` | string \| null | masked error snippet; null if none |

Status mapping from herdr `agent_status`:

| herdr `agent_status` | Console `status` |
|---|---|
| `working` | `working` |
| `blocked` or `waiting` | `blocked` |
| `idle`, `done`, `unknown`, other | `idle` |

A non-null `error` does not change `status`. The sessions list still shows the row.
Text search can match `error`.

### Ops-desk item

| Field | Type | Meaning |
|---|---|---|
| `id` | string | `{paneId}:{state_change_seq or revision}` |
| `paneId` | string | pane |
| `districtId` | string | workspace |
| `districtTitle` | string | district title |
| `name` | string | agent name |
| `cli` | string | CLI kind |
| `model` | string | model badge |
| `prompt` | string | masked prompt text |
| `since` | number | Unix ms when blocked was first seen this episode |
| `waitMs` | number | `generatedAt - since` |
| `recommendation` | null | P1 placeholder only |

### Log event

| Field | Type | Meaning |
|---|---|---|
| `id` | string | `log-{n}` increasing from adapter start |
| `ts` | number | Unix ms |
| `type` | string | see types below |
| `paneId` | string \| null | pane if the event is about one session |
| `districtId` | string \| null | workspace |
| `districtTitle` | string \| null | title |
| `name` | string \| null | agent name |
| `fromStatus` | string \| null | previous console status |
| `toStatus` | string \| null | new console status |
| `text` | string | masked; max 800 chars |

Event types: `status_change`, `needs_you`, `needs_you_cleared`, `error`,
`adapter_error`.

### Rulebook rule

| Field | Type | Meaning |
|---|---|---|
| `id` | string | stable id such as `GOV-01` |
| `area` | string | prefix such as `GOV` |
| `text` | string | rule body |
| `check` | string \| null | check column, or null |

## API contract

### Conventions

- JSON, UTF-8, `Cache-Control: no-store`.
- Same origin as the page. Default listen: `127.0.0.1:7740`.
- Envelope version field `v` is `1` on every new P1 body.
- Timestamps are Unix milliseconds (number).
- Query values are UTF-8. `paneId` uses a query parameter because it contains `:`.
- Unknown query keys are ignored.
- Empty filter values are ignored.
- 404 JSON: `{ "ok": false, "error": "not_found" }`.
- 400 JSON: `{ "ok": false, "error": "bad_request", "message": "..." }`.
- The server never returns unmasked pane text, prompts, log text, or activity.

### P0 endpoints the city keeps

These stay. Console views do not depend on them.

| Method | Path | Status | Body |
|---|---|---|---|
| GET | `/health` | 200 | `{ "ok": true, "mode": "live"\|"fixture" }` |
| GET | `/api/city` | 200 | P0 snapshot (`docs`, `districts`, `asks`, `robots`, `mode`, `error`) |
| GET | `/api/snapshot` | 200 | alias of `/api/city` |
| GET | `/api/agents` | 200 | `{ "robots": [...] }` P0 robot list |
| GET | `/events` | 200 | Server-Sent Events for the city page |
| GET | `/api/session` | 200/403/404 | Skyborne session stub; token header required |
| GET | `/api/step` | 403/404 | unused stub |
| POST | `/api/names` | 200/403 | local display names for the city; not herdr |
| POST | `/api/answer` | 409 | read-only |

P1 extends `/health` with mode `demo` and `host` (bind address string) so tests
can assert demo bind. Mode `demo` is P1-only.

### GET /api/sessions

Sessions list. Filters are query parameters. The backend applies them.

Query:

| Param | Match |
|---|---|
| `district` | case-insensitive substring of `districtId` or `districtTitle` |
| `cli` | exact, case-insensitive, against `cli` |
| `model` | case-insensitive substring of `model` |
| `status` | exact `working`, `idle`, or `blocked` |
| `q` | case-insensitive substring of name, districtTitle, districtId, cwd, activity, cli, model |

Combine params with AND. `q` ORs across the listed fields, then AND with the others.

Example:

```http
GET /api/sessions?district=atlas&status=blocked&cli=grok
```

200 body:

```json
{
  "v": 1,
  "generatedAt": 1760700000000,
  "mode": "fixture",
  "error": null,
  "filters": {
    "district": "atlas",
    "cli": "grok",
    "model": null,
    "status": "blocked",
    "q": null
  },
  "sessions": [
    {
      "id": "w8:p1",
      "paneId": "w8:p1",
      "districtId": "w8",
      "districtTitle": "atlas-api",
      "name": "grok-api",
      "cli": "grok",
      "model": "grok-4",
      "status": "blocked",
      "statusLabel": "Needs you",
      "cwd": "C:\\Users\\Shaunak\\src\\atlas-api",
      "lastSeenAt": 1760700000000,
      "activity": "Allow this action?",
      "prompt": "Allow this action?",
      "error": null
    }
  ]
}
```

`filters` echoes applied values. Unused params are `null`.

`error` is the last adapter herdr/list error string, or `null`. Sessions may still
be the previous successful tick.

Sort: `districtTitle` ascending, then `paneId` ascending.

### GET /api/screen

Masked recent pane output from the adapter cache (last successful `pane read`).

```http
GET /api/screen?paneId=w8:p1
```

Missing or blank `paneId`: 400. Unknown pane: 404.

200 body:

```json
{
  "v": 1,
  "paneId": "w8:p1",
  "updatedAt": 1760700000000,
  "lineCount": 80,
  "truncated": false,
  "text": "masked pane text",
  "session": {
    "id": "w8:p1",
    "paneId": "w8:p1",
    "districtId": "w8",
    "districtTitle": "atlas-api",
    "name": "grok-api",
    "cli": "grok",
    "model": "grok-4",
    "status": "blocked",
    "statusLabel": "Needs you",
    "cwd": "C:\\Users\\Shaunak\\src\\atlas-api",
    "lastSeenAt": 1760700000000,
    "activity": "Allow this action?",
    "prompt": "Allow this action?",
    "error": null
  }
}
```

`text` is the full cached pane string after `maskSecrets`. Live herdr reads 80
lines. `lineCount` counts newline-separated lines in `text`. `truncated` is true
when the cache was cut to the log/screen cap (80000 characters). The cap is a
spec limit, not a measurement of current panes.

The UI renders `text` as preformatted text. The backend does not convert ANSI
in P1.

### GET /api/logs

Mastopia event log. Newest first.

Query:

| Param | Meaning |
|---|---|
| `after` | optional Unix ms; only events with `ts` greater than this |
| `limit` | optional integer 1–200; default 100 |

Invalid `limit`: 400.

200 body:

```json
{
  "v": 1,
  "generatedAt": 1760700000000,
  "bounded": {
    "maxEvents": 500,
    "maxChars": 262144,
    "count": 1,
    "chars": 18
  },
  "events": [
    {
      "id": "log-12",
      "ts": 1760700000000,
      "type": "needs_you",
      "paneId": "w8:p1",
      "districtId": "w8",
      "districtTitle": "atlas-api",
      "name": "grok-api",
      "fromStatus": "working",
      "toStatus": "blocked",
      "text": "Allow this action?"
    }
  ]
}
```

Ring buffer: keep at most 500 events. If the sum of `text` lengths exceeds 262144
characters, drop oldest events until under the cap. Spec constants: 500 and 262144.
Units are characters, never bytes.

`bounded.count` is the number of events in the ring buffer.
`bounded.chars` is the sum of `text` character lengths in that buffer.
Both describe buffer occupancy. They are not the `limit` page size in `events`.

The adapter appends events on tick:

| Change | `type` |
|---|---|
| Console status changes | `status_change` |
| Enters `blocked` with a prompt | `needs_you` (in addition to `status_change`) |
| Leaves `blocked` | `needs_you_cleared` |
| `error` becomes non-null | `error` |
| `herdr agent list` / `workspace list` throws | `adapter_error` (`paneId` null) |

Do not log a duplicate `needs_you` for the same pane while it stays blocked with
the same prompt text.

### GET /api/rulebook

Handbook rules plus per-district file presence.

HTTP status is 200 when the handbook is present and when it is missing. Missing
handbook is not 404. Body field `error` is `null` or `"handbook_missing"`.

200 body:

```json
{
  "v": 1,
  "error": null,
  "handbook": {
    "version": "2.0",
    "date": "2026-10-17",
    "title": "Modern Age Solutions (MAS) House Rules Handbook"
  },
  "rules": [
    {
      "id": "GOV-01",
      "area": "GOV",
      "text": "Every change to a repository MUST go through a PR.",
      "check": "branch protection"
    }
  ],
  "districts": [
    {
      "id": "w1",
      "title": "mastopia",
      "cwd": "C:\\Users\\Shaunak\\src\\mastopia",
      "readable": true,
      "files": [
        { "path": "CHANGELOG.md", "present": true },
        { "path": "briefs/", "present": true },
        { "path": "briefs/lead-escalations.md", "present": true },
        { "path": "docs/MAS-House-Rules-Handbook.md", "present": true }
      ],
      "missing": []
    }
  ]
}
```

Parser:

1. Read `docs/MAS-House-Rules-Handbook.md` from the mastopia process cwd (this
   repo). If the file is absent, HTTP status is still 200, `handbook` is null,
   `rules` is `[]`, and `error` is `"handbook_missing"`. If the file is present,
   HTTP status is 200 and `error` is `null`.
2. Parse markdown tables whose header row is `ID`, `Rule`, `Check` (any column
   order). Each data row becomes one rule.
3. Strip a leading markdown list prefix (`- ` or `* `) from each line, then
   parse lines that match `^[A-Z]+-\d+:` (example: `SDLC-01:`) as rules with
   `check` null. The `- ` prefix is stripped before matching.
4. `handbook.version` and `handbook.date` come from the metadata table at the
   top of the handbook (`Version`, `Date`).

Expected files per district cwd:

| Path | Required |
|---|---|
| `CHANGELOG.md` | yes (CHG-01) |
| `briefs/` | yes (LOG-01) |
| `briefs/lead-escalations.md` | yes (LOG-02) |
| `docs/MAS-House-Rules-Handbook.md` | no; report presence |

`missing` lists required paths with `present` false. The UI highlights those.

If cwd is null, missing on disk, or unreadable: `readable` is false, each file
`present` is null, `missing` is `[]`. Do not follow cwd outside the machine.
Do not send file contents, only presence.

Fixture mode: use each fixture agent's `cwd` the same way. If those paths do not
exist on the machine, `readable` is false. Tests MAY pass a test cwd map; the
public JSON shape does not change.

### GET /api/ops-desk

One queue of current "Needs you" items. Display only.

```http
GET /api/ops-desk
```

200 body:

```json
{
  "v": 1,
  "generatedAt": 1760700000000,
  "items": [
    {
      "id": "w8:p1:21",
      "paneId": "w8:p1",
      "districtId": "w8",
      "districtTitle": "atlas-api",
      "name": "grok-api",
      "cli": "grok",
      "model": "grok-4",
      "prompt": "Allow this action?",
      "since": 1760699990000,
      "waitMs": 10000,
      "recommendation": null
    }
  ]
}
```

Include a session only when console `status` is `blocked` and `prompt` is
non-null. Sort by `since` ascending (longest wait first).
`recommendation` is always null in P1.

No POST, no approve, no deny, no send.

### Write paths

| Method | Path | P1 status | Body |
|---|---|---|---|
| POST | `/api/answer` | 409 | `{ "ok": false, "reason": "readonly", "message": "..." }` |
| POST | `/api/send-keys` | 409 | same shape (`reason`: `readonly`) |
| POST | `/api/send-text` | 409 | same shape |
| POST | `/api/prompt` | 409 | same shape |

`src/herdr-cli.js` continues to refuse those herdr commands. P1 adds tests that
the new HTTP paths also return 409.

## Masking

`src/mask.js` `maskSecrets` runs on pane text before prompt detection, before
screen, logs, activity, and ops-desk prompt fields.

Replacement string: `[redacted]` (export `MASK`).

P1 does not add new token shapes unless a test fixture needs one. Existing
shapes stay: `sk-`, `xai-`, `AIza`, `ghp_`, `gho_`, `github_pat_`, Slack `xox*`,
`AKIA`, JSON Web Token (JWT) `eyJ…`, `Bearer …`, and `token|secret|password|api_key=value`.

A test MUST fail if `GET /api/screen` or `GET /api/logs` returns a string that
contains `ghp_` from the fixture pane.

## Filters

Filters run in the backend on `GET /api/sessions`. The UI does not need a
separate `/api/filters` endpoint. Distinct `district`, `cli`, and `model` values
for dropdowns come from an unfiltered `GET /api/sessions` (no query).

## Event log pipeline

1. Adapter tick loads agents and workspaces.
2. Compare each pane's previous console status and prompt to the new ones.
3. Append log events (masked).
4. Enforce 500 / 262144 bounds.
5. `GET /api/logs` reads the buffer. No disk write in P1.

## Demo and bind

| Mode | How | Data | Bind | Port |
|---|---|---|---|---|
| live | default | herdr | `127.0.0.1` | `MASTOPIA_PORT` else 7740 |
| fixture | `--fixture` or `MASTOPIA_MODE=fixture` | `fixtures/` | `127.0.0.1` | same |
| demo | `--demo` or `MASTOPIA_DEMO=1` | `fixtures/` (ENV-03) | `0.0.0.0` | `PORT` else `MASTOPIA_PORT` else 7740 |

Without `--demo` / `MASTOPIA_DEMO=1` the process MUST bind `127.0.0.1`. It MUST
NOT read `PORT`. `--host` other than loopback exits 2, as in P0.

Hosted Cursor preview uses demo mode only. Agents do not launch Cursor cloud
agents (project brief section 6).

`/health` in demo: `{ "ok": true, "mode": "demo", "host": "0.0.0.0" }`.

Host and Origin (P0 code: `src/server.js` Host check at line 63, `originOk` at
line 18):

Live and fixture (unchanged from P0):
- Host: if the Host hostname is set and is not `127.0.0.1` or `localhost`, the
  server responds 403 with body `mastopia binds 127.0.0.1 only`.
- Origin: `originOk` allows a missing Origin, or an Origin whose hostname is
  `127.0.0.1` or `localhost`. Other Origins fail. Routes that call `originOk`
  (`GET /api/session`, `POST /api/names`) respond 403 when the check fails.

Demo (`--demo` or `MASTOPIA_DEMO=1` only):
- Host check is skipped. Any Host is accepted.
- Origin check is skipped. Any Origin is accepted.
- `tokenOk` is unchanged.

Live and fixture never relax Host or Origin. Demo never applies the P0 loopback
Host or Origin checks.

## Tests

P1 backend tests live in `test/` and run with `npm test`. Commands:

```powershell
npm test
```

Expected: all `test/*.test.js` files pass (exit 0).

New tests MUST cover:

1. `GET /api/sessions` returns fixture panes with `cwd`, `cli`, `model`, `status`.
2. `status=blocked` returns the atlas-api grok row and hides working rows.
3. `q` matches name or district title.
4. `GET /api/screen?paneId=w8:p1` text is masked; no `ghp_` / `sk-thisIs`.
5. `GET /api/logs` includes a `needs_you` event after a fixture tick.
6. After 501 status changes, the log length is 500.
7. `GET /api/rulebook` includes `GOV-01` when the handbook file is present.
8. A district missing `CHANGELOG.md` has that path in `missing`.
9. `GET /api/ops-desk` lists the blocked grok prompt; no approve field besides
   `recommendation: null`.
10. `POST /api/answer` and `POST /api/send-keys` return 409.
11. Demo flag binds `0.0.0.0`; default binds `127.0.0.1`.
12. `assertReadOnly` still rejects `send-keys` / `server stop`.
13. Without demo: `GET /health` with `Host: example.com` returns 403.
14. With demo: `GET /health` with `Host: example.com` returns 200.
15. Without demo: `GET /api/session` with `Origin: http://example.com` returns 403.
16. With demo: `GET /api/session` with `Origin: http://example.com` does not fail
    the Origin check.
17. `GET /api/logs` `bounded` includes `count` and `chars` (characters, not bytes)
    matching ring-buffer occupancy.
18. `GET /api/rulebook` returns HTTP 200 with `error` null when the handbook is
    present, and HTTP 200 with `error` `"handbook_missing"` when it is absent.

Keep existing city snapshot tests green.

## View specs

Owner: builder-gemini. Consumes the API shapes defined in this specification.
Strictly read-only: no view contains send-keys, send-text, prompt, or approve controls.

### Shell and navigation

1. Same-origin routing:
   - Root `/` serves the 3D City canvas (P0).
   - Route `/console` serves the console dashboard (P1).
   - Both routes share the origin `http://127.0.0.1:7740` (or demo host/port).
2. Header navigation:
   - Persistent top bar displays the mastopia wordmark, active mode badge (`live`, `fixture`, or `demo`),
     a link to the 3D City (`/`), and tab navigation links:
     `Sessions` (`#sessions`), `Pane Screen` (`#screen`), `Event Logs` (`#logs`),
     `Rulebook` (`#rulebook`), and `Ops Desk` (`#ops-desk`).
   - The 3D City page (`/`) displays a corresponding `[Console ->]` link in its top bar.
3. Hash router:
   - Client router parses `window.location.hash` to switch views without reloading the page.
   - Default route is `#sessions`.
4. Shared lifecycle:
   - Active view polls its endpoint every 2000 ms.
   - When `document.hidden` is true, poll interval extends to 10000 ms.
   - A manual `[Refresh]` button triggers an immediate fetch.

### Sessions list view (`#sessions`)

Consumes `GET /api/sessions`.

1. Layout:
   - Top toolbar contains filter summary and search inputs (see Filters UI spec below).
   - Main area displays the agent sessions table.
2. Columns:
   - District: displays `districtTitle` with `districtId` in a secondary caption.
   - Agent: displays `name`.
   - Tool & Model: displays `cli` icon/tag and `model` badge.
   - Status: displays `statusLabel` badge.
     - `working`: blue/green badge.
     - `idle`: gray badge.
     - `blocked`: amber/red alert badge showing "Needs you" and previewing `prompt`.
   - Directory: displays `cwd` truncated with tooltip showing full path.
   - Last Seen: displays relative duration computed from `lastSeenAt`.
   - Action: displays `[Inspect]` link navigating to `#screen?paneId={paneId}`.
3. States:
   - Loading: displays table skeleton rows with animated pulse.
   - Empty: displays "No agent sessions found matching current filters."
   - Error: displays error banner "Failed to load sessions from server: {error}".

### Pane screen view (`#screen`)

Consumes `GET /api/screen?paneId={paneId}`.

1. Layout:
   - Top metadata ribbon displays `paneId`, `name`, `districtTitle`, `model`,
     `statusLabel`, and `updatedAt`.
   - Main viewport displays the pane text inside a styled `<pre><code>` container.
2. Viewport behaviour:
   - Output font: monospace, dark background, high contrast text.
   - Auto-scroll toggle: checkbox to automatically scroll to the bottom on refresh (enabled by default).
   - ANSI handling: P1 passes ANSI escape sequences through unchanged; the viewport renders them as raw text.
   - Truncation notice: if `truncated` is true, displays warning banner:
     "Output truncated at 80,000 characters."
3. States:
   - Loading: displays "Reading pane output for {paneId}..."
   - Empty: displays "No recent output recorded for this pane."
   - Error: on 400, 404, or 500, displays:
     "Unable to read pane {paneId}. Pane may have closed or herdr returned an error."
4. Read-only constraint:
   - View contains zero text input fields, send buttons, or keyboard capture handlers.

### Filters UI

Controls that construct query parameters for `GET /api/sessions`.

1. Controls:
   - Search (`q`): text input, 300 ms debounce before issuing query.
   - District (`district`): text match on district ID or title.
   - CLI (`cli`): dropdown with options: `All`, `claude`, `grok`, `gemini`, `cursor`.
   - Status (`status`): segmented button group: `All`, `working`, `idle`, `blocked`.
   - Model (`model`): text substring filter.
   - Reset: button clearing all inputs to default empty values.
2. Interaction:
   - Changing any filter updates the URL query params and triggers a fetch to `GET /api/sessions`.
   - Applied filters echo back in the response `filters` object and display as dismissible chips.

### Event logs view (`#logs`)

Consumes `GET /api/logs?after={ts}&limit={limit}`.

1. Layout:
   - Header displays ring buffer limits: max 500 events and max 262,144 characters.
   - Event filter toolbar: filter by event type dropdown (`All`, `status_change`, `needs_you`,
     `needs_you_cleared`, `error`, `adapter_error`) and text filter.
   - Main area displays reverse-chronological list of log events.
2. Event card / row fields:
   - Timestamp: `ts` formatted in local operator time with millisecond precision (`HH:mm:ss.SSS`).
   - Type badge: color-coded tag matching event `type` (`needs_you` in red, `status_change` in blue,
     `needs_you_cleared` in green, `error` / `adapter_error` in amber).
   - Scope: displays `paneId`, `name`, and `districtTitle` if present.
   - Status transition: if `fromStatus` and `toStatus` exist, displays `{fromStatus} -> {toStatus}`.
   - Message: displays masked `text`.
3. States:
   - Loading: skeleton log list.
   - Empty: "No log events recorded in buffer."
   - Error: error alert banner.

### Rulebook view (`#rulebook`)

Consumes `GET /api/rulebook`.

1. Layout:
   - Top section: District Compliance Overview.
   - Bottom section: MAS House Rules Reference.
2. District compliance section:
   - Grid of cards for each entry in `districts`.
   - Card displays district `title`, `id`, `cwd`, and readability badge (`readable` true/false).
   - Expected files list: displays each file path with a status checkmark (`present: true`)
     or cross (`present: false`).
   - Missing required files: prominent red warning chips listing items from `missing`.
3. House rules table:
   - Filter input to search rules by ID (e.g. `GOV-`, `LANE-`, `SEC-`) or keyword.
   - Table columns: Rule ID (`id`), Area (`area`), Rule Text (`text`), Check Column (`check`).
4. States:
   - Loading: skeleton loader.
   - Error: displays error banner if request fails. If `handbook` is null or `error === "handbook_missing"`,
     displays "Handbook file `docs/MAS-House-Rules-Handbook.md` not found in process working directory."

### Ops-desk queue view (`#ops-desk`)

Consumes `GET /api/ops-desk`.

1. Layout:
   - Header banner: "City Hall Ops Desk — Display Only (P1). Respond directly in herdr terminal."
   - Queue of cards sorted by `since` ascending (longest waiting prompt at the top).
2. Card fields:
   - Header: Agent name, model badge, district title, and pane ID.
   - Wait timer: badge calculating elapsed time from `waitMs` (e.g. "Waiting 3m 24s").
   - Prompt text: high-contrast quoted text block displaying masked `prompt`.
   - Recommendation slot: badge displaying "Recommendation: null (P1 placeholder)".
   - Inspect link: `[Inspect Pane Screen]` pointing to `#screen?paneId={paneId}`.
3. Constraints:
   - Strictly no approve, deny, text, or keyboard input elements.
4. States:
   - Loading: skeleton card list.
   - Empty: green check banner "All agent queues clear. No items require attention."
   - Error: error notification banner.

## Decisions

| ID | Question | Owner | Status |
|---|---|---|---|
| Q1 | Confirm expected files per district: `CHANGELOG.md`, `briefs/`, `briefs/lead-escalations.md`. | Shaunak | Approved by Shaunak 2026-10-18 (as written) |
| Q2 | Confirm log bounds 500 events and 262144 characters. | Shaunak | Approved by Shaunak 2026-10-18 (as written) |
| Q3 | Console polling interval: reuse 2000 ms, or a different value. | builder-gemini | Decided: 2000 ms; hidden tab 10000 ms (Q7 approved) |
| Q4 | ANSI in pane screen: strip, pass through, or later. P1 passes through. | builder-gemini | Decided: P1 passes through text cleanly in preformatted code block; no client-side script execution. |
| Q5 | Confirm screen text cap 80000 characters. | Shaunak | Approved by Shaunak 2026-10-18 (as written) |
| Q6 | Confirm search debounce 300 ms. | Shaunak | Approved by Shaunak 2026-10-18 (as written) |
| Q7 | Confirm hidden-tab poll interval 10000 ms. | Shaunak | Approved by Shaunak 2026-10-18 (as written) |

Routine values are stated as defaults Shaunak can veto, not asked as questions (Shaunak, 2026-10-18).

## Links

- Brief: `briefs/BRIEF-mastopia-build.md` (local, not committed)
- Handbook: `docs/MAS-House-Rules-Handbook.md` (local, not committed)
- Product Requirements Document (PRD): `docs/prd.md`
- Roadmap: `docs/roadmap.md`
- P0 README JSON API: `README.md`
