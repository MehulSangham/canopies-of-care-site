import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import matter from "gray-matter";
import Header from "@/components/Header";
import Prose from "@/components/Prose";
import SectionNav from "@/components/SectionNav";
import BackToTop from "@/components/BackToTop";
import { TableOfContents } from "@/components/content/TableOfContents";
import type { Metadata } from "next";

interface ClaimEntry {
  slug: string;
  title: string;
  subtitle?: string;
  section: string;
  order: number;
  body: string;
}

function getAllClaims(): ClaimEntry[] {
  const dir = path.join(process.cwd(), "content/archive");
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data, content } = matter(raw);
      return {
        slug: file.replace(/\.(mdx|md)$/, ""),
        title: data.title || "",
        subtitle: data.subtitle,
        section: data.section || "",
        order: data.order || 0,
        body: content,
      };
    })
    .sort((a, b) => {
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      return a.order - b.order;
    });
}

const sectionTitles: Record<string, string> = {
  A: "The Founding Tradition",
  B: "Through American Identity",
  C: "Transcendence Across Identities",
  D: "Displacement & Contestation",
};

export function generateStaticParams() {
  const claims = getAllClaims();
  return claims.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params;
  const claims = getAllClaims();
  const claim = claims.find((c) => c.slug === slug);
  if (!claim) return { title: "Not Found" };

  return {
    title: `${claim.section}${claim.order}: ${claim.title} — Canopies of Care`,
    description: claim.subtitle || claim.title,
  };
}

export default async function ClaimPage(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const claims = getAllClaims();
  const claimIndex = claims.findIndex((c) => c.slug === slug);

  if (claimIndex === -1) notFound();

  const claim = claims[claimIndex];
  const prev = claimIndex > 0 ? claims[claimIndex - 1] : null;
  const next = claimIndex < claims.length - 1 ? claims[claimIndex + 1] : null;
  const sectionClaims = claims.filter((c) => c.section === claim.section);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 flex gap-12">
          {/* Left sidebar: section nav */}
          <aside className="hidden lg:block w-52 shrink-0">
            <SectionNav
              claims={sectionClaims}
              currentSlug={slug}
              sectionTitle={sectionTitles[claim.section] || claim.section}
              sectionLetter={claim.section}
            />
          </aside>

          {/* Content */}
          <article className="flex-1 min-w-0 max-w-3xl">
            <div className="mb-12">
              <Link
                href="/archive"
                className="text-sm text-[var(--cream-subtle)] hover:text-[var(--accent)] transition-colors mb-6 inline-block"
              >
                ← Back to Archive
              </Link>

              <h4 className="mb-3">
                Section {claim.section} · Claim {claim.order}
              </h4>
              {claim.subtitle && (
                <p className="text-[1rem] text-[var(--cream-subtle)] mb-4">
                  {claim.subtitle}
                </p>
              )}
              <h1 className="text-[2.5rem] leading-tight">{claim.title}</h1>
            </div>

            {/* Mobile section nav */}
            <div className="lg:hidden mb-12">
              <SectionNav
                claims={sectionClaims}
                currentSlug={slug}
                sectionTitle={sectionTitles[claim.section] || claim.section}
                sectionLetter={claim.section}
                horizontal
              />
            </div>

            <Prose content={claim.body} />

            {/* Prev / Next navigation */}
            <nav className="mt-20 pt-8 border-t border-[var(--divider)] flex justify-between gap-4">
              {prev ? (
                <Link
                  href={`/archive/${prev.slug}`}
                  className="group flex flex-col gap-1 text-left"
                >
                  <span className="text-xs text-[var(--cream-subtle)] group-hover:text-[var(--accent)] transition-colors">
                    ← Previous
                  </span>
                  <span className="text-[1rem] font-[800] text-[var(--cream-muted)] group-hover:text-[var(--cream)] transition-colors">
                    {prev.section}{prev.order}: {prev.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  href={`/archive/${next.slug}`}
                  className="group flex flex-col gap-1 text-right"
                >
                  <span className="text-xs text-[var(--cream-subtle)] group-hover:text-[var(--accent)] transition-colors">
                    Next →
                  </span>
                  <span className="text-[1rem] font-[800] text-[var(--cream-muted)] group-hover:text-[var(--cream)] transition-colors">
                    {next.section}{next.order}: {next.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </nav>
          </article>

          {/* Right sidebar: table of contents (scroll-spy) */}
          <aside className="hidden xl:block w-48 shrink-0">
            <TableOfContents />
          </aside>
        </div>
      </main>
      <BackToTop />
    </>
  );
}
