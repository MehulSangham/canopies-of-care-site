import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-[color:var(--color-nis-ink)]">
      <nav className="max-w-5xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="font-sans font-bold text-lg tracking-tight text-[color:var(--color-nis-ink)] hover:text-nis-hover transition-colors"
        >
          Canopies of Care
        </Link>
        <div className="flex gap-8 text-sm font-medium text-nis-muted">
          <Link href="/archive" className="hover:text-[color:var(--color-nis-ink)] transition-colors">
            Archive
          </Link>
          <Link href="/about" className="hover:text-[color:var(--color-nis-ink)] transition-colors">
            About
          </Link>
        </div>
      </nav>
    </header>
  );
}
