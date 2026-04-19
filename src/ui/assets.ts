import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve to <repo>/assets/<name>. The source lives at src/ui/assets.ts;
// when compiled it lands at dist/ui/assets.js — both two directories deep
// from the project root, so ../../assets works in dev AND after tsc.
const here = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(here, '..', '..', 'assets');

function readOrFallback(name: string, fallback: string): string {
  try {
    return readFileSync(path.join(ASSETS_DIR, name), 'utf8');
  } catch {
    return fallback;
  }
}

export const banner = readOrFallback(
  'banner.txt',
  // minimal fallback so the app still boots if gen-assets hasn't run
  'JON MARIEN\n'
);

export const portrait = readOrFallback(
  'portrait.txt',
  '[portrait missing — run `bun run gen-assets`]\n'
);
