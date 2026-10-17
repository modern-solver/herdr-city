#!/usr/bin/env node
// Concatenate the city page into web/index.html. three.js and fonts are already vendored in web/assets.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.join(here, '..', 'web');
const ORDER = [
  '01-core.js', '02-world.js', '03a-blocks.js', '03-district.js', '03b-transit.js',
  '04-robot.js', '05-city.js', '05b-detail.js', '06-ui.js',
];

const app = ORDER.map((f) => fs.readFileSync(path.join(here, 'src', f), 'utf8')).join('\n');
const body = fs.readFileSync(path.join(here, 'src', 'page.html'), 'utf8').replace('/*APP*/', () => app);
const faces = [
  "@font-face{font-family:'Inter';font-style:normal;font-display:swap;font-weight:100 900;src:url(./assets/fonts/inter-latin-wght-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}",
  "@font-face{font-family:'Inter';font-style:normal;font-display:swap;font-weight:100 900;src:url(./assets/fonts/inter-latin-ext-wght-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}",
  "@font-face{font-family:'Unbounded';font-style:normal;font-display:swap;font-weight:200 900;src:url(./assets/fonts/unbounded-latin-wght-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}",
  "@font-face{font-family:'Unbounded';font-style:normal;font-display:swap;font-weight:200 900;src:url(./assets/fonts/unbounded-latin-ext-wght-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}",
  "@font-face{font-family:'JetBrains Mono';font-style:normal;font-display:swap;font-weight:100 800;src:url(./assets/fonts/jetbrains-mono-latin-wght-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}",
  "@font-face{font-family:'JetBrains Mono';font-style:normal;font-display:swap;font-weight:100 800;src:url(./assets/fonts/jetbrains-mono-latin-ext-wght-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}",
  "@font-face{font-family:'Martian Mono';font-style:normal;font-display:swap;font-weight:100 800;src:url(./assets/fonts/martian-mono-latin-wght-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}",
  "@font-face{font-family:'Martian Mono';font-style:normal;font-display:swap;font-weight:100 800;src:url(./assets/fonts/martian-mono-latin-ext-wght-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}",
];
const importMap = JSON.stringify({ imports: { three: './assets/three/three.module.min.js', 'three/addons/': './assets/three/addons/' } });
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link rel="icon" href="./assets/icons/icon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="./assets/icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="./assets/icons/apple-touch-icon.png">
<meta name="herdrcity-token" content="__HERDRCITY_TOKEN__">
<title>herdr-city</title>
<style>
${faces.join('\n')}
body{margin:0;background:#9fc3dd}[hidden]{display:none!important}
</style>
<script type="importmap">${importMap}</script>
</head><body>
${body}
</body></html>
`;
fs.mkdirSync(WEB, { recursive: true });
fs.writeFileSync(path.join(WEB, 'index.html'), html);
for (const f of ['icon.svg', 'icon-32.png', 'apple-touch-icon.png']) {
  fs.copyFileSync(path.join(here, 'src', 'icons', f), path.join(WEB, 'assets', 'icons', f));
}
console.log(`built web/index.html (${(html.length / 1024).toFixed(0)} KB)`);
