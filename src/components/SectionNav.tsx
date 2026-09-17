import Link from "next/link";

interface NavClaim {
  slug: string;
  title: string;
  section: string;
  order: number;
}

interface SectionNavProps {
  claims: NavClaim[];
  currentSlug: string;
  sectionTitle: string;
  sectionLetter: string;
  horizontal?: boolean;
}

export default function SectionNav({
  claims,
  currentSlug,
  sectionTitle,
  sectionLetter,
  horizontal,
}: SectionNavProps) {
  if (horizontal) {
    return (
      <nav className="flex flex-wrap gap-2">
        {claims.map((c) => {
          const isActive = c.slug === currentSlug;
          return (
            <Link
              key={c.slug}
              href={`/archive/${c.slug}`}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-[var(--accent)] text-[var(--dark-sky)] font-[800]"
                  : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--cream-muted)] hover:border-[var(--accent)] hover:text-[var(--cream)]"
              }`}
            >
              {c.section}{c.order}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="sticky top-24">
      <h4 className="mb-1">Section {sectionLetter}</h4>
      <p className="text-sm font-[800] text-[var(--cream)] mb-6">
        {sectionTitle}
      </p>
      <ul className="flex flex-col gap-1">
        {claims.map((c) => {
          const isActive = c.slug === currentSlug;
          return (
            <li key={c.slug}>
              <Link
                href={`/archive/${c.slug}`}
                className={`block px-3 py-2 rounded-md text-sm leading-snug transition-colors ${
                  isActive
                    ? "bg-[var(--card-bg)] border border-[var(--accent)] text-[var(--cream)] font-[800]"
                    : "text-[var(--cream-muted)] hover:text-[var(--cream)] hover:bg-[var(--card-bg)]"
                }`}
              >
                <span className="text-[var(--cream-subtle)] mr-1">
                  {c.section}{c.order}
                </span>{" "}
                {c.title}
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href="/archive"
        className="block mt-8 text-xs text-[var(--cream-subtle)] hover:text-[var(--accent)] transition-colors"
      >
        ← All sections
      </Link>
    </nav>
  );
}
