# scripts

Purpose: repository maintenance scripts that use Node built-ins only.

Interface: `npm run codemap` runs `node scripts/codemap.js` and writes
`docs/CODEMAP.md`. The tree comes from `git ls-files`. Tests import
`generateCodemapText`, `entriesFromGit`, `walk` and `normalizeEol`.

Gotchas: untracked files are omitted. Compare maps after normalizing CRLF
to LF. Vendor binaries under `web/assets/`, `docs/images/` and
`page/src/icons/` are omitted. If tracked files change, regenerate the map
or `npm test` fails the staleness check.

Owner: builder-grok.
