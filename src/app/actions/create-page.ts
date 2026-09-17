'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { checkIsAdmin } from '@/lib/auth';
import { isGitHubMode, readFile, writeFile } from '@/lib/github';

interface CreatePageInput {
  title: string;
  section: string;
  order: number;
  subtitle?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildContent(input: CreatePageInput): string {
  const subtitle = input.subtitle
    ? `subtitle: "${input.subtitle.replace(/"/g, '\\"')}"\n`
    : '';

  return `---
title: "${input.title.replace(/"/g, '\\"')}"
${subtitle}section: "${input.section}"
order: ${input.order}
status: "draft"
---

## ${input.title}

Start writing here...
`;
}

export async function createPage(input: CreatePageInput) {
  if (!(await checkIsAdmin())) {
    throw new Error('Unauthorized: admin access required');
  }

  const slug = `${input.section.toLowerCase()}${input.order}-${slugify(input.title)}`;
  const content = buildContent(input);

  if (isGitHubMode()) {
    const filePath = `content/archive/${slug}.mdx`;
    const existing = await readFile(filePath);
    if (existing) {
      throw new Error(`A page with slug "${slug}" already exists.`);
    }
    await writeFile(filePath, content, `content: create ${slug}`);
  } else {
    const dir = path.join(process.cwd(), 'content/archive');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, `${slug}.mdx`);
    if (fs.existsSync(filePath)) {
      throw new Error(`A page with slug "${slug}" already exists.`);
    }
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  revalidatePath('/archive');
  revalidatePath(`/archive/${slug}`);

  return { success: true, slug };
}
