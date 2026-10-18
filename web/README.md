# web

Purpose: built static city GUI and P1 console shell served by `src/server.js`.

Interface:
- `GET /` and `GET /console` serve `web/index.html`.
- Other routes under `/` serve static files from this folder.
- `npm run build:page` regenerates `web/index.html` from `page/`.

Assets:
- `web/assets/` holds vendor fonts (`inter`, `unbounded`, `jetbrains-mono`, `martian-mono`), Three.js, and licenses.

Gotchas:
- Do not hand-edit `index.html`; edits are overwritten by `page/build.js`.
- The server refuses Host names other than loopback in P0. Demo Host/Origin policy is specified for P1 and is not in
  this tree yet.

Owner: builder-gemini for the page; builder-grok owns how it is served.
