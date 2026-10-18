# web

Purpose: built static city GUI served by `src/server.js`.

Interface: `GET /` serves `web/index.html`. `npm run build:page` regenerates
it from `page/`. Other routes under `/` are files in this folder.

Gotchas: `web/assets/` holds vendor fonts, Three.js and licenses. Do not
hand-edit `index.html`. Binds 127.0.0.1 in every mode; 0.0.0.0 only with
--demo plus --host 0.0.0.0 / MASTOPIA_HOST (LAN exposure); demo relaxes
the loopback Host and Origin checks.

Owner: builder-gemini for the page; builder-grok owns how it is served.
