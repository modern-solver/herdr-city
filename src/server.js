import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { WEB_DIR } from './paths.js';
import { parseSessionFilters, filterSessions } from './sessions.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function originOk(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const u = new URL(origin);
    return u.hostname === '127.0.0.1' || u.hostname === 'localhost';
  } catch {
    return false;
  }
}

function tokenOk(req, token) {
  const got = req.headers['x-mastopia-token'] || req.headers['x-skyborne-token'];
  return got === token;
}

export function createServer({ adapter, host = '127.0.0.1', port = 7740, webDir = WEB_DIR }) {
  const token = crypto.randomBytes(16).toString('hex');
  const sseClients = new Set();
  let askV = 1;
  const names = {};

  adapter.onChange((snap) => {
    askV += 1;
    for (const res of sseClients) {
      writeSse(res, 'asks', { v: askV, asks: snap.asks || [] });
      for (const doc of snap.docs || []) writeSse(res, 'state', { id: doc.id, doc });
    }
  });

  function writeSse(res, event, data) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  function sendSnapshot(res) {
    const snap = adapter.getSnapshot();
    writeSse(res, 'names', { names });
    for (const doc of snap.docs || []) writeSse(res, 'state', { id: doc.id, doc });
    writeSse(res, 'ready', { token });
    writeSse(res, 'asks', { v: askV, asks: snap.asks || [] });
  }

  const server = http.createServer(async (req, res) => {
    const hostHdr = String(req.headers.host || '');
    const hostname = hostHdr.split(':')[0];
    if (hostname && hostname !== '127.0.0.1' && hostname !== 'localhost') {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('mastopia binds 127.0.0.1 only');
      return;
    }
    const url = new URL(req.url || '/', `http://${hostHdr || '127.0.0.1'}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      json(res, 200, { ok: true, mode: adapter.getSnapshot().mode });
      return;
    }
    if (req.method === 'GET' && (url.pathname === '/api/city' || url.pathname === '/api/snapshot')) {
      json(res, 200, adapter.getSnapshot());
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/agents') {
      json(res, 200, { robots: adapter.getSnapshot().robots || [] });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/sessions') {
      const parsed = parseSessionFilters(url.searchParams);
      if (!parsed.ok) {
        json(res, 400, { ok: false, error: 'bad_request', message: parsed.message });
        return;
      }
      const payload = adapter.getSessions();
      json(res, 200, {
        v: 1,
        generatedAt: payload.generatedAt,
        mode: payload.mode,
        error: payload.error,
        filters: parsed.filters,
        sessions: filterSessions(payload.sessions, parsed.filters),
      });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
        Connection: 'keep-alive',
      });
      sseClients.add(res);
      sendSnapshot(res);
      const beat = setInterval(() => res.write(': heartbeat\n\n'), 15000);
      req.on('close', () => {
        clearInterval(beat);
        sseClients.delete(res);
      });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/session') {
      if (!tokenOk(req, token) || !originOk(req)) {
        json(res, 403, { ok: false });
        return;
      }
      const id = url.searchParams.get('id');
      const doc = (adapter.getSnapshot().docs || []).find((d) => d.id === id);
      if (!doc) {
        json(res, 404, { ok: false });
        return;
      }
      json(res, 200, {
        id: doc.id,
        updatedAt: doc.updatedAt,
        agents: doc.agents.map((a) => ({
          id: a.id,
          name: a.name,
          role: a.role,
          type: a.type,
          parent: a.parent,
          start: doc.startedAt,
          end: null,
        })),
        steps: [],
        conversation: [],
        files: [],
        approvals: [],
      });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/step') {
      if (!tokenOk(req, token)) {
        json(res, 403, { ok: false });
        return;
      }
      json(res, 404, { ok: false });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/names') {
      if (!tokenOk(req, token) || !originOk(req)) {
        json(res, 403, { ok: false });
        return;
      }
      const body = await readJson(req);
      if (body?.id) {
        if (body.name) names[body.id] = String(body.name).slice(0, 40);
        else delete names[body.id];
      }
      json(res, 200, { ok: true });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/answer') {
      json(res, 409, {
        ok: false,
        reason: 'readonly',
        message: 'P0 is read-only; answer the prompt in the herdr pane.',
      });
      return;
    }

    const isIndex = url.pathname === '/' || url.pathname === '/console';
    let filePath = path.join(webDir, isIndex ? 'index.html' : url.pathname);
    if (!filePath.startsWith(webDir)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    let buf = fs.readFileSync(filePath);
    if (filePath.endsWith('index.html')) {
      buf = Buffer.from(
        buf.toString('utf8').replaceAll('__MASTOPIA_TOKEN__', token).replaceAll('__SKYBORNE_TOKEN__', token),
      );
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(buf);
  });

  return {
    token,
    listen() {
      return new Promise((resolve) => {
        server.listen(port, host, () => resolve({ host, port, url: `http://${host}:${port}/` }));
      });
    },
    close() {
      return new Promise((resolve) => server.close(() => resolve()));
    },
    raw: server,
  };
}

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function readJson(req) {
  return new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => {
      d += c;
      if (d.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(d || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}
