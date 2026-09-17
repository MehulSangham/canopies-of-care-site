import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content");

export interface ContentMeta {
  title: string;
  subtitle?: string;
  section?: string;
  order?: number;
  [key: string]: unknown;
}

export interface ContentFile {
  slug: string;
  meta: ContentMeta;
  content: string;
}

export function getContentBySlug(slug: string): ContentFile {
  const filePath = path.join(contentDir, `${slug}.md`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    meta: data as ContentMeta,
    content,
  };
}

export function getAllContent(): ContentFile[] {
  const files = fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  return files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    return getContentBySlug(slug);
  });
}

export function getContentBySection(section: string): ContentFile[] {
  return getAllContent()
    .filter((c) => c.meta.section === section)
    .sort((a, b) => (a.meta.order ?? 0) - (b.meta.order ?? 0));
}
