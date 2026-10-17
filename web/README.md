# web

Compiled static assets and bundles served by the mastopia HTTP server.

- Purpose: Holds static web assets, vendor dependencies, and `index.html`.
- Interface: Built from `page/` via `npm run build:page`; served by `src/server.js`.
- Assets: `assets/` contains vendored three.js and font files (`inter`, `unbounded`, `jetbrains-mono`, `martian-mono`).
- Gotchas: `index.html` is generated from `page/src/page.html` and `page/src/*.js`.
  Do not commit local build artifacts that diverge from `page/build.js`.
