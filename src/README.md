# src

Purpose: read-only herdr adapter, city mapping, HTTP server and CLI.

Interface: `createAdapter`, `createServer`, `createLiveClient`,
`createFixtureClient`, `maskSecrets`, `mapSessions`. CLI entry is `cli.js`.
`paths.js` exports `ROOT`, `WEB_DIR`, `FIXTURES_DIR`. `sessions.js` maps panes
to console sessions and applies district/cli/model/status/`q` filters.
HTTP server serves `/` (city) and `/console` (console shell) routes, and
`GET /api/sessions` for the console session list.

Gotchas: live herdr allows only `agent list`, `workspace list`, `pane read`.
The process binds `127.0.0.1`. Adapter poll is 2000 ms. Pane text is masked
before it leaves the API. Session `activity` is masked (SEC-03).

Owner: builder-grok.
