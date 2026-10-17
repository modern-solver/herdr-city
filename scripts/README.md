# scripts

Purpose: repository maintenance scripts that use Node built-ins only.

Interface: `npm run codemap` runs `node scripts/codemap.js` and writes
`docs/CODEMAP.md`. `generateCodemapText` and `writeCodemap` are exported for tests.

Gotchas: the script omits vendor binaries under `web/assets/`, `docs/images/`
and `page/src/icons/`. If the tree changes, regenerate the map or `npm test`
fails the staleness check.

Owner: builder-grok.
