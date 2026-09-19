import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import matter from "gray-matter";
import { ChevronLeft } from "lucide-react";
import { Show, UserButton, SignInButton } from "@clerk/nextjs";
import Prose from "@/components/Prose";
import { PageTableOfContents } from "@/components/curriculum/PageTableOfContents";
import { ClaimPageClient, ClaimContent } from "./client";
import { LeftRailSwitch } from "@/components/edit/LeftRailSwitch";
import { MetaPanel } from "@/components/curriculum/MetaPanel";
import { PageReader } from "@/components/curriculum/PageReader";
import { SECTION_TITLES, sectionRank } from "@/lib/sections";
import { checkIsAdmin } from "@/lib/auth";
import { parseMdxBlocks } from "@/lib/mdx-blocks";
import { splitFootnoteMarkdown } from "@/lib/footnote-sources";
import type { MetaPanelData, PanelSourceGroup } from "@/lib/meta-panel";
import type { Metadata } from "next";

type PageStatus = 'draft' | 'published';

interface ClaimEntry {
  slug: string;
  title: string;
  subtitle?: string;
  section: string;
  order: number;
  status: PageStatus;
  body: string;
  panel?: MetaPanelData;
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
        status: (data.status as PageStatus) || "draft",
        body: content,
        panel: data.panel as MetaPanelData | undefined,
      };
    })
    .sort((a, b) => {
      if (a.section !== b.section)
        return sectionRank(a.section) - sectionRank(b.section);
      return a.order - b.order;
    });
}

const sectionTitles = SECTION_TITLES;

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

  const isDevAdmin = await checkIsAdmin();

  // Draft pages are only accessible to admins
  if (claim.status === "draft" && !isDevAdmin) {
    notFound();
  }

  // Prev/next only includes published pages for public, all for admins
  const navClaims = isDevAdmin
    ? claims
    : claims.filter((c) => c.status === "published");
  const navIndex = navClaims.findIndex((c) => c.slug === slug);
  const prev = navIndex > 0 ? navClaims[navIndex - 1] : null;
  const next = navIndex < navClaims.length - 1 ? navClaims[navIndex + 1] : null;

  const renderedBody = <Prose content={claim.body} />;

  // Aggregate footnote sources for the meta panel's Sources tab
  const panelSources: PanelSourceGroup[] = parseMdxBlocks(claim.body)
    .filter((b) => b.type === "footnote" && b.meta?.footnoteId)
    .map((b) => {
      const body = b.raw.replace(/^\[\^\w+\]:\s?/, "");
      const { sources } = splitFootnoteMarkdown(body);
      return { id: b.meta!.footnoteId!, items: sources };
    })
    .filter((g) => g.items.length > 0);

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
            <span className="nis-breadcrumb__divider hidden sm:inline">
              ›
            </span>
            <span
              className="nis-breadcrumb__item hidden sm:inline font-bold"
              data-active="true"
            >
              {claim.section}
              {claim.order}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-nis-muted hover:text-[color:var(--color-nis-ink)] transition-colors">
                  Sign in
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: { avatarBox: "h-7 w-7" },
                }}
              />
            </Show>
          </div>
        </div>
      </header>

      {/* Draft banner */}
      {claim.status === "draft" && (
        <div className="bg-[color:var(--color-nis-earth)]/10 border-b border-[color:var(--color-nis-earth)]/30 px-4 py-2 text-center">
          <span className="font-sans text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--color-nis-earth)]">
            Draft — this page is not visible to the public
          </span>
        </div>
      )}

      <ClaimPageClient
        slug={slug}
        claim={claim}
        prev={prev}
        next={next}
        sectionTitles={sectionTitles}
        isAdmin={isDevAdmin}
        renderedBody={renderedBody}
      >
        {claim.panel && <MetaPanel data={claim.panel} sources={panelSources} />}
        <PageReader slug={slug} />

        <div className="flex w-full flex-col lg:flex-row">
          {/* Left rail */}
          <aside className="pointer-events-none hidden fixed left-0 top-[55px] z-20 h-[calc(100vh-55px)] overflow-hidden lg:block lg:w-72 lg:pl-6 xl:w-80 xl:pl-10 2xl:w-96 2xl:pl-14">
            <LeftRailSwitch
              tocContent={<PageTableOfContents title={claim.title} />}
            />
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 min-h-screen">
            <div className="mx-auto w-full px-6 pt-16 pb-10 lg:pt-24 lg:pb-16">
              <div className="mx-auto w-full max-w-[686px] mt-0 mb-[30px]">
                <Link
                  href="/archive"
                  className="group mb-8 inline-flex items-center text-sm font-bold text-[color:var(--color-nis-ink)] transition-colors hover:text-nis-hover lg:hidden"
                >
                  <ChevronLeft className="w-4 h-4 mr-1 transform group-hover:-translate-x-1 transition-transform" />
                  Back to Archive
                </Link>
              </div>

              <ClaimContent
                claim={claim}
                prev={prev}
                next={next}
                sectionTitles={sectionTitles}
                renderedBody={renderedBody}
              />

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
                        {prev.section}
                        {prev.order}: {prev.title}
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
                        {next.section}
                        {next.order}: {next.title}
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
      </ClaimPageClient>
    </div>
  );
}
