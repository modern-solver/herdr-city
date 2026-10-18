# page

Purpose: source for the P0 3D city page, built into `web/`.

Interface: `npm run build:page` runs `node page/build.js` and writes
`web/index.html` plus copied assets. City modules live in `page/src/`.

Gotchas: the city frontend is derived from Skyborne. Do not reuse Skyborne
marks (see `TRADEMARK.md`). Token placeholders `__MASTOPIA_TOKEN__` are
replaced at serve time in `src/server.js`.

Owner: builder-gemini for views; builder-grok does not change city UI in P1.
