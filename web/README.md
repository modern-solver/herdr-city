# web

Purpose: built static city GUI served by `src/server.js`.

Interface: `GET /` serves `web/index.html`. `npm run build:page` regenerates
it from `page/`. Other routes under `/` are files in this folder.

Gotchas: `web/assets/` holds vendor fonts, Three.js and licenses. Do not
hand-edit `index.html`. The server refuses Host names other than loopback
in P0. Demo Host/Origin policy is specified for P1 and is not in this tree
yet.

Owner: builder-gemini for the page; builder-grok owns how it is served.
