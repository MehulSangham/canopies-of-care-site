import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--color-nis-bg)]">
      <Link
        href="/"
        className="mb-8 font-sans font-bold text-lg tracking-tight text-[color:var(--color-nis-ink)] hover:text-nis-hover transition-colors"
      >
        Canopies of Care
      </Link>
      <SignUp />
    </div>
  );
}
