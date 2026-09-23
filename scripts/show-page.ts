/**
 * Print a page's block structure and its available sources — working view
 * for hand-mapping. Usage: npx tsx scripts/show-page.ts <slug> [--full]
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { parseMdxBlocks } from '../src/lib/mdx-blocks';
import type { SourceRecord } from '../src/lib/taxonomy';

const slug = process.argv[2];
const full = process.argv.includes('--full');
const ROOT = process.cwd();
const file = path.join(ROOT, 'content/archive', `${slug}.mdx`);
if (!slug || !fs.existsSync(file)) {
  console.error('usage: npx tsx scripts/show-page.ts <slug> [--full]');
  process.exit(1);
}
const parsed = matter(fs.readFileSync(file, 'utf8'));
const blocks = parseMdxBlocks(parsed.content);

console.log(`=== ${slug} — "${parsed.data.title}" ===\n`);
for (const b of blocks) {
  if (b.type === 'footnote' || b.type === 'hr' || b.type === 'empty') continue;
  const text = b.raw.replace(/\s+/g, ' ').trim();
  console.log(`${b.id} [${b.type}] ${full ? text : text.slice(0, 110)}`);
  if (!full) console.log('');
}

const sources = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'content/taxonomy/sources.json'), 'utf8'),
) as SourceRecord[];
console.log('\n=== SOURCES CITED ON THIS PAGE ===');
for (const s of sources) {
  if (s.citedBy?.some((c) => c.slug === slug)) {
    console.log(`[${s.id}] ${s.citation.slice(0, 130)}`);
  }
}
