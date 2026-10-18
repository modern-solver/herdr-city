# page

Purpose: source for the P0 3D city page and P1 console shell, built into `web/`.

Interface: `npm run build:page` runs `node page/build.js` and writes `web/index.html` plus copied assets.

Modules:
- `page/src/01-core.js` through `page/src/06-ui.js`: 3D city canvas and UI.
- `page/src/07-console.js`: P1 console shell and views.
- `page/src/console-router.js`: client-side hash routing and view lifecycles.
- `page/src/page.html`: main template containing both city and console layout.

Gotchas:
- Do not edit `web/index.html` directly; edits will be overwritten by `page/build.js`.
- The city frontend is derived from Skyborne. Do not reuse Skyborne marks (see `TRADEMARK.md`). Token placeholders
  `__MASTOPIA_TOKEN__` and `__SKYBORNE_TOKEN__` are replaced at serve time in `src/server.js`.

Owner: builder-gemini for views; builder-grok does not change city UI in P1.
