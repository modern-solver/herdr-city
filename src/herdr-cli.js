import { spawn } from 'node:child_process';

const FORBIDDEN = [
  'send-keys', 'send-text', 'send-input', 'server stop', 'server.stop',
  'prompt', 'close', 'run', 'start', 'focus', 'attach', 'rename',
];

const ALLOWED = new Set([
  'agent list',
  'pane read',
  'workspace list',
]);

export function assertReadOnly(args) {
  const joined = args.join(' ').toLowerCase();
  for (const bad of FORBIDDEN) {
    if (joined.includes(bad) && !joined.startsWith('pane read') && !joined.startsWith('agent list') && !joined.startsWith('workspace list')) {
      throw new Error(`refusing herdr write/control command: ${args.join(' ')}`);
    }
  }
  const key = args.slice(0, 2).join(' ');
  if (!ALLOWED.has(key)) {
    throw new Error(`herdr-city P0 only allows read commands; got: ${args.join(' ')}`);
  }
}

export function extractJson(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function extractAgents(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.agents)) return payload.agents;
  const result = payload.result;
  if (Array.isArray(result?.agents)) return result.agents;
  if (Array.isArray(payload.data?.agents)) return payload.data.agents;
  return [];
}

export function extractWorkspaces(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.workspaces)) return payload.workspaces;
  if (Array.isArray(payload.result?.workspaces)) return payload.result.workspaces;
  return [];
}

export function extractPaneText(stdout) {
  const raw = String(stdout ?? '');
  const json = extractJson(raw);
  const text = json?.result?.read?.text ?? json?.read?.text;
  if (typeof text === 'string') return text;
  return raw;
}

export function createLiveClient({ binary = 'herdr', timeoutMs = 8000 } = {}) {
  function run(args) {
    assertReadOnly(args);
    return new Promise((resolve, reject) => {
      const child = spawn(binary, args, {
        windowsHide: true,
        env: { ...process.env },
      });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error(`herdr ${args.join(' ')} timed out`));
      }, timeoutMs);
      child.stdout.on('data', (d) => { stdout += d.toString('utf8'); });
      child.stderr.on('data', (d) => { stderr += d.toString('utf8'); });
      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          reject(new Error(stderr.trim() || stdout.trim() || `herdr exited ${code}`));
          return;
        }
        resolve({ stdout, stderr });
      });
    });
  }

  return {
    kind: 'live',
    async agentList() {
      const { stdout } = await run(['agent', 'list']);
      const json = extractJson(stdout);
      if (!json) throw new Error('herdr agent list did not return JSON');
      return extractAgents(json);
    },
    async workspaceList() {
      try {
        const { stdout } = await run(['workspace', 'list']);
        return extractWorkspaces(extractJson(stdout));
      } catch {
        return [];
      }
    },
    async paneRead(paneId) {
      const { stdout } = await run([
        'pane', 'read', String(paneId),
        '--source', 'recent-unwrapped',
        '--lines', '80',
      ]);
      return extractPaneText(stdout);
    },
  };
}
