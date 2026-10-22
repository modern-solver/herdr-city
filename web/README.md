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
- Binds 127.0.0.1 in every mode; 0.0.0.0 only with --demo plus --host 0.0.0.0 /
  MASTOPIA_HOST (LAN exposure); demo relaxes the loopback Host and Origin checks.

Owner: builder-gemini for the page; builder-grok owns how it is served.
