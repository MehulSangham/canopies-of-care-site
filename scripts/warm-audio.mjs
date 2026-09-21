#!/usr/bin/env node
/**
 * Pre-generate page-reader audio for every content page by walking the
 * running site's /api/tts endpoint segment by segment. Each segment is
 * synthesized (and paid for) at most once; cached segments return instantly
 * from the Blob store or local disk cache.
 *
 * Usage:
 *   node scripts/warm-audio.mjs                     # against localhost:3000
 *   node scripts/warm-audio.mjs https://example.com # against production
 *   node scripts/warm-audio.mjs -- a0-elder-tradition   # one page only
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith('http')) ?? 'http://localhost:3000';
const only = args.filter((a) => !a.startsWith('http') && a !== '--');

const contentDir = path.join(process.cwd(), 'content', 'archive');
const slugs = fs
  .readdirSync(contentDir)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => f.replace(/\.mdx$/, ''))
  .filter((s) => only.length === 0 || only.includes(s));

async function tts(body) {
  const res = await fetch(`${base}/api/tts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

let synthesized = 0;
let failed = 0;

for (const slug of slugs) {
  const manifest = await tts({ slug });
  if (!manifest.ok) {
    console.error(`✗ ${slug}: ${manifest.error}`);
    failed++;
    continue;
  }
  process.stdout.write(`${slug} (${manifest.total} segments) `);
  for (let i = 0; i < manifest.total; i++) {
    const seg = await tts({ slug, index: i });
    if (seg.ok) {
      synthesized++;
      process.stdout.write('.');
    } else {
      failed++;
      process.stdout.write('!');
      console.error(`\n  segment ${i}: ${seg.error}`);
    }
  }
  process.stdout.write('\n');
}

console.log(`\nDone: ${synthesized} segments ready, ${failed} failed.`);
if (failed > 0) process.exit(1);
