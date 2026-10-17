import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const WEB_DIR = path.join(ROOT, 'web');
export const FIXTURES_DIR = path.join(ROOT, 'fixtures');
export const CONFIG_DIR = path.join(ROOT, 'config');
export const DEFAULT_PATTERNS_PATH = path.join(CONFIG_DIR, 'prompt-patterns.json');
