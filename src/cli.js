#!/usr/bin/env node
import { createLiveClient } from './herdr-cli.js';
import { createFixtureClient } from './fixtures.js';
import { createAdapter } from './adapter.js';
import { createServer } from './server.js';

function parseArgs(argv) {
  const out = { fixture: false, port: Number(process.env.HERDR_CITY_PORT || 7740), host: '127.0.0.1', herdr: process.env.HERDR_BIN || 'herdr' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--fixture' || a === '--fake') out.fixture = true;
    else if (a === '--port') out.port = Number(argv[++i]);
    else if (a === '--host') {
      const h = argv[++i];
      if (h !== '127.0.0.1' && h !== 'localhost') {
        console.error('herdr-city only binds 127.0.0.1');
        process.exit(2);
      }
      out.host = '127.0.0.1';
    } else if (a === '--herdr') out.herdr = argv[++i];
    else if (a === '--help' || a === '-h') out.help = true;
  }
  if (process.env.HERDR_CITY_MODE === 'fixture') out.fixture = true;
  return out;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    console.log(`herdr-city — local city GUI for herdr agents (read-only)

Usage:
  node src/cli.js [--fixture] [--port 7740]

  --fixture     demo with checked-in pane/agent fixtures (no herdr required)
  --port N      listen on 127.0.0.1:N (default 7740)

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
  const server = createServer({ adapter, host: opts.host, port: opts.port });
  const info = await server.listen();
  console.log(`herdr-city ${opts.fixture ? 'fixture' : 'live'} on ${info.url} (127.0.0.1 only, no telemetry)`);
  console.log('Read-only: never sends keys and never runs herdr server stop.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
