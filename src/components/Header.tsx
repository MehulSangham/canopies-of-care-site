import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-[var(--divider)]">
      <nav className="max-w-5xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="font-[800] text-lg tracking-tight text-[var(--cream)] hover:text-[var(--accent)] transition-colors"
        >
          Canopies of Care
        </Link>
        <div className="flex gap-8 text-sm font-[500] text-[var(--cream-muted)]">
          <Link href="/archive" className="hover:text-[var(--cream)] transition-colors">
            Archive
          </Link>
          <Link href="/about" className="hover:text-[var(--cream)] transition-colors">
            About
          </Link>
        </div>
      </nav>
    </header>
  );
}
