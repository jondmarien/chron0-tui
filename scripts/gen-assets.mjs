#!/usr/bin/env node
// Build-time asset generator.
//
// Inputs:
//   assets/source/me.jpg   portrait photo
//
// Outputs:
//   assets/portrait.txt    ANSI-colored ASCII of the portrait
//   assets/banner.txt      figlet banner of "JON MARIEN"
//   assets/banner-alt/*    a handful of alternative figlet fonts for easy swapping
//
// Runtime only reads the .txt files, so swap fonts by editing this script and
// rerunning `npm run gen-assets`.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import asciify from 'asciify-image';
import figlet from 'figlet';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'source', 'me.jpg');
const OUT_DIR = path.join(ROOT, 'assets');
const ALT_DIR = path.join(OUT_DIR, 'banner-alt');

// ──────────────────────────────────────────────────────────────
// Portrait
// ──────────────────────────────────────────────────────────────

const PORTRAIT_OPTS = {
  fit: 'box',
  width: 40,      // chars wide — tuned to sit alongside banner in 100-col terms
  height: 20,     // lines tall
  color: true,    // emit ANSI color escapes
  c1: ' ',        // darkest
  format: 'string',
};

async function genPortrait() {
  console.log(`[portrait] reading ${path.relative(ROOT, SRC)}`);
  const ascii = await asciify(SRC, PORTRAIT_OPTS);
  const out = path.join(OUT_DIR, 'portrait.txt');
  await fs.writeFile(out, ascii, 'utf8');
  console.log(`[portrait] wrote ${path.relative(ROOT, out)} (${ascii.length} bytes)`);
}

// ──────────────────────────────────────────────────────────────
// Figlet banner
// ──────────────────────────────────────────────────────────────

const BANNER_TEXT = 'JON MARIEN';
const PRIMARY_FONT = 'ANSI Shadow';
// A few cyber-ish alternatives dumped into banner-alt/ for easy swapping.
const ALT_FONTS = ['Bloody', 'Elite', 'Cyberlarge', 'Doom', 'Big Money-se'];

function figletAsync(text, font) {
  return new Promise((resolve, reject) => {
    figlet.text(text, { font, horizontalLayout: 'default', verticalLayout: 'default' }, (err, data) => {
      if (err) reject(err);
      else resolve(data ?? '');
    });
  });
}

async function genBanner() {
  console.log(`[banner] primary font: ${PRIMARY_FONT}`);
  const primary = await figletAsync(BANNER_TEXT, PRIMARY_FONT);
  const out = path.join(OUT_DIR, 'banner.txt');
  await fs.writeFile(out, primary, 'utf8');
  console.log(`[banner] wrote ${path.relative(ROOT, out)}`);

  await fs.mkdir(ALT_DIR, { recursive: true });
  for (const font of ALT_FONTS) {
    try {
      const art = await figletAsync(BANNER_TEXT, font);
      const slug = font.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const altOut = path.join(ALT_DIR, `${slug}.txt`);
      await fs.writeFile(altOut, art, 'utf8');
      console.log(`[banner]   alt: ${path.relative(ROOT, altOut)}`);
    } catch (err) {
      console.warn(`[banner]   skipped ${font}: ${err.message}`);
    }
  }
}

// ──────────────────────────────────────────────────────────────

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await genBanner();
  await genPortrait();
  console.log('[done]');
}

main().catch((err) => {
  console.error('[gen-assets] failed:', err);
  process.exit(1);
});
