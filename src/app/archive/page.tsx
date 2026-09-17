import fs from "fs";
import path from "path";
import Link from "next/link";
import matter from "gray-matter";
import Header from "@/components/Header";

export interface ArchiveEntry {
  slug: string;
  title: string;
  subtitle?: string;
  section: string;
  order: number;
}

export function getArchiveEntries(): ArchiveEntry[] {
  const dir = path.join(process.cwd(), "content/archive");
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data } = matter(raw);
      return {
        slug: file.replace(/\.(mdx|md)$/, ""),
        title: data.title || "",
        subtitle: data.subtitle,
        section: data.section || "",
        order: data.order || 0,
      };
    })
    .sort((a, b) => {
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      return a.order - b.order;
    });
}

const sectionTitles: Record<string, string> = {
  A: "The Founding Tradition",
  B: "Mutual Aid Through the Evolution of American Identity",
  C: "The Transcendence Across Ethnicities and Identities",
  D: "Systematic Displacement and the Contest Over American Identity",
};

const sectionDescriptions: Record<string, string> = {
  A: "Mutual aid is real, it is old, and it reached massive scale.",
  B: "The tradition survived displacement, co-optation, and erasure across the 20th and 21st centuries.",
  C: "In crisis, in labour, and by design, mutual aid crossed the ethnic lines that structured everyday life.",
  D: "Why you don't know this history, who displaced it, and what the archival document does about it.",
};

export default function ArchivePage() {
  const entries = getArchiveEntries();
  const sections = [...new Set(entries.map((e) => e.section))].sort();

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-6 md:px-12 py-16 md:py-24">
          <h4 className="mb-4">Claims &amp; Sources</h4>
          <h1 className="mb-6">The Archive</h1>
          <p className="text-[1.25rem] leading-relaxed text-[var(--cream-muted)] max-w-2xl mb-16">
            Each claim is a distinct, provable assertion supported by primary
            and secondary sources. Together they form a chain: if all hold, the
            tradition is established as continuous.
          </p>

          {sections.map((section) => (
            <div
              key={section}
              id={`section-${section.toLowerCase()}`}
              className="mb-20"
            >
              <h4 className="mb-3">Section {section}</h4>
              <h2 className="mb-4">{sectionTitles[section] || section}</h2>
              <p className="text-[1.1rem] leading-relaxed text-[var(--cream-subtle)] mb-10">
                {sectionDescriptions[section]}
              </p>

              <div className="flex flex-col gap-4">
                {entries
                  .filter((e) => e.section === section)
                  .map((entry) => (
                    <Link
                      key={entry.slug}
                      href={`/archive/${entry.slug}`}
                      className="card flex flex-col gap-2 hover:border-[var(--accent)] transition-colors group"
                    >
                      {entry.subtitle && (
                        <h4 className="text-xs">{entry.subtitle}</h4>
                      )}
                      <h3 className="text-[1.25rem] group-hover:text-[var(--accent)] transition-colors">
                        {entry.section}{entry.order}: {entry.title}
                      </h3>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
