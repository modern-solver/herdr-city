# page

Source files for the mastopia frontend application.

- Purpose: Composable HTML and JavaScript modules assembled into `web/index.html`.
- Interface: Built via `node page/build.js` (`npm run build:page`).
- Modules: `01-core.js` through `06-ui.js` (3D city), `07-console.js` (P1 console shell),
  `console-router.js` (client routing and lifecycle helpers), and `sessions-view.js` (sessions list table).
- Gotchas: Do not edit `web/index.html` directly; edits will be overwritten by `page/build.js`.
