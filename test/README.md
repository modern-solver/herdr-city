# test

Purpose: Node built-in tests for the adapter, server, map, mask, parsers and console UI.

Interface: `npm test` runs `node --test test/*.test.js`. Tests use fixture
data under `fixtures/` and do not need herdr.

Gotchas: GitHub Actions runs the same command on Ubuntu without herdr.
P0 city snapshot tests must stay green in every PR. New P1 endpoints get
tests in this folder alongside the code.

Owner: builder-grok.
