import 'server-only';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * Assembles the context an editing agent needs for a given page:
 * - the content style guide (hard editorial rules)
 * - the source outline / citation file for this page, when available locally
 * - a short overview of every page in the archive (for cross-references)
 */

const CONTENT_DIR = path.join(process.cwd(), 'content', 'archive');

/** Local research corpus (exists in local dev only; guarded by existsSync). */
const CITATIONS_DIR =
  process.env.CITATIONS_DIR ||
  path.join(
    process.cwd(),
    '..',
    'Narrative_Analysis_2025',
    'archive_project',
    'outline',
    'citations',
  );

export function getStyleGuide(): string {
  const p = path.join(process.cwd(), 'CONTENT_STYLE.md');
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf8');
}

/** Maps a page slug like `b2-civil-rights-care` to `B2_civil_rights_care.md`. */
export function getCitationFile(slug: string): string | null {
  if (!fs.existsSync(CITATIONS_DIR)) return null;
  const stem = slug.replace(/-/g, '_');
  const fileName = stem.charAt(0).toUpperCase() + stem.slice(1) + '.md';
  const p = path.join(CITATIONS_DIR, fileName);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

export function getArchiveOverview(): string {
  if (!fs.existsSync(CONTENT_DIR)) return '';
  const lines: string[] = [];
  for (const file of fs.readdirSync(CONTENT_DIR)) {
    if (!file.endsWith('.mdx')) continue;
    try {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
      const { data } = matter(raw);
      const slug = file.replace(/\.mdx$/, '');
      lines.push(
        `- ${slug}: "${data.title ?? ''}" — ${data.subtitle ?? ''} (section: ${data.section ?? ''})`,
      );
    } catch {
      // skip unparseable files
    }
  }
  return lines.join('\n');
}
