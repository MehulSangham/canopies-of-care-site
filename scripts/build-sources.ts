/**
 * Build / refresh the sources index from page footnotes.
 *
 *   npx tsx scripts/build-sources.ts
 *
 * - Scans every archive page's footnotes for source lines.
 * - Deduplicates by normalized citation text.
 * - Preserves existing records (id, type, manual edits to citation/url);
 *   only `citedBy` is regenerated and new sources appended.
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { parseMdxBlocks } from '../src/lib/mdx-blocks';
import { splitFootnoteMarkdown } from '../src/lib/footnote-sources';
import { slugifySourceId, type SourceRecord, type SourceType } from '../src/lib/taxonomy';

const ROOT = process.cwd();
const ARCHIVE = path.join(ROOT, 'content/archive');
const OUT = path.join(ROOT, 'content/taxonomy/sources.json');

function normalize(citation: string): string {
  return citation
    .replace(/https?:\/\/\S+/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extractUrl(citation: string): string | undefined {
  return citation.match(/https?:\/\/[^\s)]+/)?.[0];
}

function guessType(citation: string): SourceType {
  const c = citation.toLowerCase();
  if (/(press|university|journal|quarterly|review\b|historian|oxford|cambridge|unc\b)/.test(c)) return 'scholarship';
  if (/(times|post|tribune|guardian|npr|magazine|herald|news)/.test(c)) return 'journalism';
  if (/(act of|statute|congress|code of|annual report|census|hearing|proceedings|library of congress|national archives|\b18\d\d\b.*(letter|speech|report))/.test(c)) return 'primary';
  if (/(encyclopedia|wikipedia|eh\.net|britannica)/.test(c)) return 'reference';
  return 'scholarship';
}

// ---- load existing index ----
let existing: SourceRecord[] = [];
if (fs.existsSync(OUT)) {
  existing = JSON.parse(fs.readFileSync(OUT, 'utf8')) as SourceRecord[];
}
const byNorm = new Map(existing.map((s) => [normalize(s.citation), s]));
const usedIds = new Set(existing.map((s) => s.id));
for (const s of existing) s.citedBy = [];

// ---- scan pages ----
let scanned = 0;
let added = 0;
for (const file of fs.readdirSync(ARCHIVE).sort()) {
  if (!file.endsWith('.mdx') && !file.endsWith('.md')) continue;
  const slug = file.replace(/\.(mdx|md)$/, '');
  const { content } = matter(fs.readFileSync(path.join(ARCHIVE, file), 'utf8'));
  for (const block of parseMdxBlocks(content)) {
    if (block.type !== 'footnote' || !block.meta?.footnoteId) continue;
    const body = block.raw.replace(/^\[\^\w+\]:\s?/, '');
    const { sources } = splitFootnoteMarkdown(body);
    for (const line of sources) {
      scanned += 1;
      const norm = normalize(line);
      if (!norm) continue;
      let rec = byNorm.get(norm);
      if (!rec) {
        let id = slugifySourceId(line);
        while (usedIds.has(id)) id = `${id}-x`;
        usedIds.add(id);
        rec = {
          id,
          citation: line,
          url: extractUrl(line),
          type: guessType(line),
          citedBy: [],
        };
        byNorm.set(norm, rec);
        existing.push(rec);
        added += 1;
      }
      const cite = { slug, footnoteId: block.meta.footnoteId };
      if (!rec.citedBy!.some((c) => c.slug === cite.slug && c.footnoteId === cite.footnoteId)) {
        rec.citedBy!.push(cite);
      }
    }
  }
}

existing.sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync(OUT, `${JSON.stringify(existing, null, 2)}\n`);
console.log(
  `scanned ${scanned} source lines · index now ${existing.length} records (${added} new)`,
);
