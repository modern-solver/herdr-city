# src

Purpose: read-only herdr adapter, city mapping, HTTP server and CLI.

Interface: `createAdapter`, `createServer`, `createLiveClient`,
`createFixtureClient`, `maskSecrets`, `maskThenTruncate`, `mapSessions`.
CLI entry is `cli.js`. `paths.js` exports `ROOT`, `WEB_DIR`, `FIXTURES_DIR`.
`output-filter.js` masks full text then truncates. `sessions.js` maps panes
to console sessions and applies district/cli/model/status/`q` filters.
HTTP server serves `/` (city) and `/console` (console shell) routes, and
`GET /api/sessions` for the console session list. `screen.js` builds
`GET /api/screen` via `maskThenTruncate`. `logs.js` is the event ring;
`GET /api/logs` uses `maskThenTruncate`. `ops-desk.js` builds
`GET /api/ops-desk`; prompt text uses `maskThenTruncate`.

Gotchas: live herdr allows only `agent list`, `workspace list`, `pane read`.
Binds `127.0.0.1` in every mode; `0.0.0.0` only with `--demo` plus
`--host 0.0.0.0` / `MASTOPIA_HOST` (LAN exposure); demo relaxes the loopback
Host and Origin checks. Adapter poll is 2000 ms. Pane text is masked before
it leaves the API. Session `activity` is masked (SEC-03). Prompt and error
caps in `prompt-detect.js` use `maskThenTruncate` (no local char slice).
Write routes (`/api/answer`, `/api/send-keys`, `/api/send-text`, `/api/prompt`)
always return 409 readonly; no write path.

Owner: builder-grok.
