import fs from "fs";
import path from "path";
import Link from "next/link";
import matter from "gray-matter";
import Header from "@/components/Header";
import { NewPageButton } from "@/components/edit/NewPageDialog";
import { SECTION_TITLES, SECTION_DESCRIPTIONS, sectionRank } from "@/lib/sections";
import { checkIsAdmin } from "@/lib/auth";

export type PageStatus = 'draft' | 'published';

export interface ArchiveEntry {
  slug: string;
  title: string;
  subtitle?: string;
  section: string;
  order: number;
  status: PageStatus;
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
        status: (data.status as PageStatus) || "draft",
      };
    })
    .sort((a, b) => {
      if (a.section !== b.section)
        return sectionRank(a.section) - sectionRank(b.section);
      return a.order - b.order;
    });
}

const sectionTitles = SECTION_TITLES;
const sectionDescriptions = SECTION_DESCRIPTIONS;

export default async function ArchivePage() {
  const isDevAdmin = await checkIsAdmin();

  const allEntries = getArchiveEntries();
  // Public visitors only see published pages; admins see everything
  const entries = isDevAdmin
    ? allEntries
    : allEntries.filter((e) => e.status === "published");
  const intro = entries.find((e) => e.section === "INTRO");
  const sections = [...new Set(entries.map((e) => e.section))]
    .filter((s) => s !== "INTRO")
    .sort((a, b) => sectionRank(a) - sectionRank(b));

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-6 md:px-12 py-16 md:py-24">
          <p className="font-serif text-sm uppercase tracking-[0.16em] text-nis-muted mb-4">
            Claims &amp; Sources
          </p>
          <div className="flex items-start justify-between gap-4 mb-6">
            <h1 className="text-[color:var(--color-nis-ink)] font-sans font-bold text-[3rem] leading-[1.05] tracking-tight">
              The Archive
            </h1>
            {isDevAdmin && <NewPageButton />}
          </div>
          <p className="text-[1.25rem] leading-relaxed text-nis-muted max-w-2xl mb-6">
            Mutual aid is a founding American tradition, as old as the Republic
            itself, through which excluded communities built the infrastructure
            of civic life. Its absence from the national story is structural,
            and this archive assembles the record: sixteen pages, each a
            provable claim with named sources, together one continuous
            argument.
          </p>

          {intro && (
            <Link
              href={`/archive/${intro.slug}`}
              className="nis-card group mb-16 block border-[color:var(--color-nis-ink)] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-xs uppercase tracking-[0.12em] text-nis-muted mb-2">
                    Start here
                  </p>
                  <h3 className="text-[1.25rem] font-bold text-[color:var(--color-nis-ink)] group-hover:text-nis-hover transition-colors">
                    {intro.title}
                  </h3>
                  <p className="mt-1 text-[0.95rem] text-nis-muted">
                    The argument of the whole archive, stated plainly, and how
                    to read it.
                  </p>
                </div>
                {intro.status === "draft" && (
                  <span className="shrink-0 mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] border border-[color:var(--color-nis-earth)] text-[color:var(--color-nis-earth)]">
                    Draft
                  </span>
                )}
              </div>
            </Link>
          )}

          {sections.map((section) => (
            <div
              key={section}
              id={`section-${section.toLowerCase()}`}
              className="mb-20"
            >
              <p className="font-serif text-xs uppercase tracking-[0.16em] text-nis-muted mb-3">
                Section {section}
              </p>
              <h2 className="mb-4 font-sans font-bold text-[2rem] text-[color:var(--color-nis-ink)]">
                {sectionTitles[section] || section}
              </h2>
              <p className="text-[1.1rem] leading-relaxed text-nis-muted mb-10">
                {sectionDescriptions[section]}
              </p>

              <div className="flex flex-col gap-4">
                {entries
                  .filter((e) => e.section === section)
                  .map((entry) => (
                    <Link
                      key={entry.slug}
                      href={`/archive/${entry.slug}`}
                      className="nis-card group p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          {entry.subtitle && (
                            <p className="font-serif text-xs uppercase tracking-[0.12em] text-nis-muted mb-2">
                              {entry.subtitle}
                            </p>
                          )}
                          <h3 className="text-[1.25rem] font-bold text-[color:var(--color-nis-ink)] group-hover:text-nis-hover transition-colors">
                            {entry.section}{entry.order}: {entry.title}
                          </h3>
                        </div>
                        {entry.status === "draft" && (
                          <span className="shrink-0 mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] border border-[color:var(--color-nis-earth)] text-[color:var(--color-nis-earth)]">
                            Draft
                          </span>
                        )}
                      </div>
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
