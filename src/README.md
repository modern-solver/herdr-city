# src

Purpose: read-only herdr adapter, city mapping, HTTP server and CLI.

Interface: `createAdapter`, `createServer`, `createLiveClient`,
`createFixtureClient`, `maskSecrets`. CLI entry is `cli.js`.
`paths.js` exports `ROOT`, `WEB_DIR`, `FIXTURES_DIR`.
HTTP server serves `/` (city) and `/console` (console shell) routes.

Gotchas: live herdr allows only `agent list`, `workspace list`, `pane read`.
The process binds `127.0.0.1`. Adapter poll is 2000 ms. Pane text is masked
before it leaves the API.

Owner: builder-grok.
