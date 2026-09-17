import Link from "next/link";
import { Show, UserButton, SignInButton } from "@clerk/nextjs";

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
        <div className="flex items-center gap-8 text-sm font-medium text-nis-muted">
          <Link href="/archive" className="hover:text-[color:var(--color-nis-ink)] transition-colors">
            Archive
          </Link>
          <Link href="/about" className="hover:text-[color:var(--color-nis-ink)] transition-colors">
            About
          </Link>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="hover:text-[color:var(--color-nis-ink)] transition-colors">
                Sign in
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-7 w-7",
                },
              }}
            />
          </Show>
        </div>
      </nav>
    </header>
  );
}
