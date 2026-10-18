#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLiveClient } from './herdr-cli.js';
import { createFixtureClient } from './fixtures.js';
import { createAdapter } from './adapter.js';
import { createServer } from './server.js';

export function parseArgs(argv = process.argv, env = process.env) {
  const out = {
    fixture: false,
    demo: env.MASTOPIA_DEMO === '1',
    port: null,
    host: '127.0.0.1',
    herdr: env.HERDR_BIN || 'herdr',
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--fixture' || a === '--fake') out.fixture = true;
    else if (a === '--demo') out.demo = true;
    else if (a === '--port') out.port = Number(argv[++i]);
    else if (a === '--host') {
      const h = argv[++i];
      if (h !== '127.0.0.1' && h !== 'localhost') {
        console.error('mastopia only binds 127.0.0.1');
        process.exit(2);
      }
      out.host = '127.0.0.1';
    } else if (a === '--herdr') out.herdr = argv[++i];
    else if (a === '--help' || a === '-h') out.help = true;
  }
  if (env.MASTOPIA_MODE === 'fixture') out.fixture = true;
  if (out.demo) {
    out.fixture = true;
    out.host = '0.0.0.0';
    if (out.port == null) out.port = Number(env.PORT || env.MASTOPIA_PORT || 7740);
  } else if (out.port == null) {
    out.port = Number(env.MASTOPIA_PORT || 7740);
  }
  return out;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    console.log(`mastopia — local city GUI for herdr agents (read-only)

Usage:
  node src/cli.js [--fixture] [--demo] [--port 7740]

  --fixture     checked-in pane/agent fixtures (no herdr required); bind 127.0.0.1
  --demo        fixtures, bind 0.0.0.0, read PORT then MASTOPIA_PORT then 7740
  --port N      listen port (default 7740)

Windows (PowerShell), against a running herdr 0.9.x session:
  npm install
  npm run build:page
  node .\\src\\cli.js
  # then open http://127.0.0.1:7740/

Fixture demo:
  node .\\src\\cli.js --fixture
`);
    return;
  }

  const client = opts.fixture ? createFixtureClient() : createLiveClient({ binary: opts.herdr });
  const adapter = createAdapter({ client });
  await adapter.start();
  const server = createServer({ adapter, host: opts.host, port: opts.port, demo: opts.demo });
  const info = await server.listen();
  const mode = opts.demo ? 'demo' : opts.fixture ? 'fixture' : 'live';
  const bindNote = opts.demo ? '0.0.0.0 (demo)' : '127.0.0.1 only';
  console.log(`mastopia ${mode} on ${info.url} (${bindNote}, no telemetry)`);
  console.log('Read-only: never sends keys and never runs herdr server stop.');
}

function isDirectRun() {
  const here = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] && path.resolve(process.argv[1]);
  return Boolean(invoked && path.normalize(here).toLowerCase() === path.normalize(invoked).toLowerCase());
}

if (isDirectRun()) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
