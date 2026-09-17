'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { checkIsAdmin } from '@/lib/auth';
import { isGitHubMode, readFile, writeFile } from '@/lib/github';

interface SaveContentInput {
  slug: string;
  title?: string;
  subtitle?: string;
  section?: string;
  order?: number;
  status?: string;
  body?: string;
}

export async function saveContent(input: SaveContentInput) {
  if (!(await checkIsAdmin())) {
    throw new Error('Unauthorized: admin access required');
  }

  const { slug, ...changes } = input;

  if (isGitHubMode()) {
    return saveViaGitHub(slug, changes);
  }
  return saveViaFS(slug, changes);
}

/* ─── GitHub API persistence ─── */

async function saveViaGitHub(slug: string, changes: Omit<SaveContentInput, 'slug'>) {
  const filePath = `content/archive/${slug}.mdx`;
  const existing = await readFile(filePath);

  if (!existing) {
    // Try .md extension
    const mdPath = `content/archive/${slug}.md`;
    const mdExisting = await readFile(mdPath);
    if (!mdExisting) throw new Error(`Content file not found for slug: ${slug}`);
    return saveGitHubFile(mdPath, mdExisting.content, changes, slug);
  }

  return saveGitHubFile(filePath, existing.content, changes, slug);
}

async function saveGitHubFile(
  filePath: string,
  raw: string,
  changes: Omit<SaveContentInput, 'slug'>,
  slug: string,
) {
  const { frontmatterBlock, bodyContent } = applyChanges(raw, changes);
  const output = `---\n${frontmatterBlock}\n---\n${bodyContent}`;

  // Save version backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await writeFile(
    `.versions/${slug}/${timestamp}.mdx`,
    raw,
    `chore: backup ${slug} before edit`,
  );

  await writeFile(filePath, output, `content: update ${slug}`);

  revalidatePath(`/archive/${slug}`);
  revalidatePath('/archive');

  return { success: true };
}

/* ─── Local filesystem persistence ─── */

async function saveViaFS(slug: string, changes: Omit<SaveContentInput, 'slug'>) {
  const dir = path.join(process.cwd(), 'content/archive');
  const mdxPath = path.join(dir, `${slug}.mdx`);
  const mdPath = path.join(dir, `${slug}.md`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : fs.existsSync(mdPath) ? mdPath : null;

  if (!filePath) {
    throw new Error(`Content file not found for slug: ${slug}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');

  // Save a version backup before overwriting
  const versionsDir = path.join(process.cwd(), '.versions', slug);
  if (!fs.existsSync(versionsDir)) {
    fs.mkdirSync(versionsDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(versionsDir, `${timestamp}.mdx`), raw, 'utf-8');

  // Keep only last 20 versions
  const versions = fs.readdirSync(versionsDir).sort();
  if (versions.length > 20) {
    for (const old of versions.slice(0, versions.length - 20)) {
      fs.unlinkSync(path.join(versionsDir, old));
    }
  }

  const { frontmatterBlock, bodyContent } = applyChanges(raw, changes);
  const output = `---\n${frontmatterBlock}\n---\n${bodyContent}`;

  fs.writeFileSync(filePath, output, 'utf-8');

  revalidatePath(`/archive/${slug}`);
  revalidatePath('/archive');

  return { success: true };
}

/* ─── Shared helpers ─── */

function applyChanges(raw: string, changes: Omit<SaveContentInput, 'slug'>) {
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!fmMatch) {
    throw new Error('Could not parse frontmatter');
  }

  let frontmatterBlock = fmMatch[1];
  let bodyContent = fmMatch[2];

  if (changes.title !== undefined) {
    frontmatterBlock = replaceFrontmatterField(frontmatterBlock, 'title', changes.title);
  }
  if (changes.subtitle !== undefined) {
    frontmatterBlock = replaceFrontmatterField(frontmatterBlock, 'subtitle', changes.subtitle);
  }
  if (changes.section !== undefined) {
    frontmatterBlock = replaceFrontmatterField(frontmatterBlock, 'section', changes.section);
  }
  if (changes.order !== undefined) {
    frontmatterBlock = frontmatterBlock.replace(
      /^order:\s*.+$/m,
      `order: ${changes.order}`,
    );
  }
  if (changes.status !== undefined) {
    frontmatterBlock = replaceFrontmatterField(frontmatterBlock, 'status', changes.status);
  }
  if (changes.body !== undefined) {
    bodyContent = changes.body.trimEnd() + '\n';
  }

  return { frontmatterBlock, bodyContent };
}

function replaceFrontmatterField(fm: string, field: string, value: string): string {
  const escaped = value.replace(/"/g, '\\"');
  const regex = new RegExp(`^${field}:\\s*.+$`, 'm');
  if (regex.test(fm)) {
    return fm.replace(regex, `${field}: "${escaped}"`);
  }
  return fm + `\n${field}: "${escaped}"`;
}
