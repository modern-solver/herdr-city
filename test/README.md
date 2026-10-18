# test

Purpose: Node built-in tests for the adapter, server, map, mask, parsers, console sessions and leak tests.

Interface: `npm test` runs `node --test test/*.test.js`. Tests use fixture
data under `fixtures/` and do not need herdr. Leak tests live in
`test/leak.test.js`; new text endpoints must reuse `test/helpers/leak.js`.

Gotchas: GitHub Actions runs the same command on Ubuntu without herdr.
P0 city snapshot tests must stay green in every PR. New P1 endpoints get
tests in this folder alongside the code.

Owner: builder-grok.
