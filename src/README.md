# src

Purpose: read-only herdr adapter, city mapping, HTTP server and CLI.

Interface: `createAdapter`, `createServer`, `createLiveClient`,
`createFixtureClient`, `maskSecrets`, `maskThenTruncate`, `mapSessions`.
CLI entry is `cli.js`. `paths.js` exports `ROOT`, `WEB_DIR`, `FIXTURES_DIR`.
`output-filter.js` masks full text then truncates. `sessions.js` maps panes
to console sessions and applies district/cli/model/status/`q` filters.
`GET /api/sessions` is the console session list. `screen.js` builds
`GET /api/screen` via `maskThenTruncate`. `logs.js` is the event ring;
`GET /api/logs` uses `maskThenTruncate`.

Gotchas: live herdr allows only `agent list`, `workspace list`, `pane read`.
The process binds `127.0.0.1`. Adapter poll is 2000 ms. Pane text is masked
before it leaves the API. Session `activity` is masked (SEC-03).

Owner: builder-grok.
