# fixtures

Purpose: checked-in herdr-shaped JSON and pane text for demo and tests.

Interface: `src/fixtures.js` `loadFixtureBundle` and `createFixtureClient`
read `agent-list.json`, `workspace-list.json` and `panes/*.txt`.
CLI `--fixture` uses this bundle. Pane ids in filenames use `_` for `:`.

Gotchas: panes include fake token-looking strings so masking tests fail if
`maskSecrets` regresses. Live herdr is never required for `npm test`.

Owner: builder-grok.
