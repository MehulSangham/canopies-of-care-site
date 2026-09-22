'use server';

import fs from 'fs';
import path from 'path';
import { checkIsAdmin } from '@/lib/auth';
import { isGitHubMode, readFile, writeFile } from '@/lib/github';

const STYLE_GUIDE_PATH = 'CONTENT_STYLE.md';

/**
 * The style guide doubles as the assistant's editorial rulebook: the agent
 * route reads it into every conversation, so edits here change how the AI
 * revises every page from the next request onward.
 */
export async function loadStyleGuide(): Promise<string> {
  if (!(await checkIsAdmin())) {
    throw new Error('Unauthorized: admin access required');
  }
  if (isGitHubMode()) {
    const existing = await readFile(STYLE_GUIDE_PATH);
    if (existing) return existing.content;
  }
  const p = path.join(process.cwd(), STYLE_GUIDE_PATH);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '';
}

export async function saveStyleGuide(content: string): Promise<{ success: true }> {
  if (!(await checkIsAdmin())) {
    throw new Error('Unauthorized: admin access required');
  }
  const normalized = content.trimEnd() + '\n';
  if (isGitHubMode()) {
    await writeFile(STYLE_GUIDE_PATH, normalized, 'docs: update content style guide');
  } else {
    fs.writeFileSync(path.join(process.cwd(), STYLE_GUIDE_PATH), normalized, 'utf-8');
  }
  return { success: true };
}
