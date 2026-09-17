import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import matter from "gray-matter";
import { ChevronLeft } from "lucide-react";
import Prose from "@/components/Prose";
import { ArticleContent } from "@/components/curriculum/ArticleContent";
import { HeaderFrame } from "@/components/curriculum/HeaderFrame";
import { PageTableOfContents } from "@/components/curriculum/PageTableOfContents";
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
  return getAllClaims().map((c) => ({ slug: c.slug }));
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

  const sectionLabel = `Section ${claim.section}: ${sectionTitles[claim.section] || claim.section}`;

  return (
    <div className="min-h-screen bg-[color:var(--color-nis-bg)]">
      {/* Top navigation bar */}
      <header
        data-context-bar
        className="sticky top-0 z-50 border-b border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)]/96 backdrop-blur-md"
      >
        <div className="flex min-h-[55px] w-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="font-sans font-bold text-[color:var(--color-nis-ink)] transition-colors hover:text-nis-hover"
            >
              Canopies of Care
            </Link>
            <span className="nis-breadcrumb__divider">|</span>
            <Link
              href="/archive"
              className="nis-breadcrumb__item transition-colors hover:text-nis-hover"
            >
              Archive
            </Link>
            <span className="nis-breadcrumb__divider hidden sm:inline">›</span>
            <span className="nis-breadcrumb__item hidden sm:inline font-bold" data-active="true">
              {claim.section}{claim.order}
            </span>
          </div>
        </div>
      </header>

      <div className="flex w-full flex-col lg:flex-row">
        {/* Left rail: Table of Contents */}
        <aside className="pointer-events-none hidden fixed left-0 top-[55px] z-20 h-[calc(100vh-55px)] overflow-hidden lg:block lg:w-72 lg:pl-6 xl:w-80 xl:pl-10 2xl:w-96 2xl:pl-14">
          <PageTableOfContents title={claim.title} />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 min-h-screen">
          <div className="mx-auto w-full px-6 pt-16 pb-10 lg:pt-24 lg:pb-16">
            {/* Header with prev/next navigation */}
            <div className="mx-auto w-full max-w-[686px] mt-0 mb-[30px]">
              <Link
                href="/archive"
                className="group mb-8 inline-flex items-center text-sm font-bold text-[color:var(--color-nis-ink)] transition-colors hover:text-nis-hover lg:hidden"
              >
                <ChevronLeft className="w-4 h-4 mr-1 transform group-hover:-translate-x-1 transition-transform" />
                Back to Archive
              </Link>

              <HeaderFrame
                kicker={sectionLabel}
                title={claim.title}
                prev={
                  prev
                    ? {
                        href: `/archive/${prev.slug}`,
                        title: `${prev.section}${prev.order}: ${prev.title}`,
                      }
                    : undefined
                }
                next={
                  next
                    ? {
                        href: `/archive/${next.slug}`,
                        title: `${next.section}${next.order}: ${next.title}`,
                      }
                    : undefined
                }
              />
            </div>

            {/* Article with sidenotes */}
            <ArticleContent>
              <Prose content={claim.body} />
            </ArticleContent>

            {/* Footer navigation */}
            <div className="mx-auto w-full max-w-[686px]">
              <nav className="footer-nav flex justify-between gap-4">
                {prev ? (
                  <Link
                    href={`/archive/${prev.slug}`}
                    className="footer-nav-link text-left"
                  >
                    <span className="footer-nav-label">← Previous</span>
                    <span className="footer-nav-title">
                      {prev.section}{prev.order}: {prev.title}
                    </span>
                  </Link>
                ) : (
                  <div />
                )}
                {next ? (
                  <Link
                    href={`/archive/${next.slug}`}
                    className="footer-nav-link text-right"
                  >
                    <span className="footer-nav-label">Next →</span>
                    <span className="footer-nav-title">
                      {next.section}{next.order}: {next.title}
                    </span>
                  </Link>
                ) : (
                  <Link
                    href="/archive"
                    className="footer-nav-link text-right"
                  >
                    <span className="footer-nav-label">Back to</span>
                    <span className="footer-nav-title">Archive Overview</span>
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
