import Link from "next/link";
import Header from "@/components/Header";
import { Timeline } from "@/components/timeline/Timeline";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 md:px-12 py-24 md:py-32">
          <p className="font-serif text-sm uppercase tracking-[0.16em] text-nis-muted mb-6">
            Archive
          </p>
          <h1 className="max-w-3xl mb-8 text-[color:var(--color-nis-ink)] font-sans font-bold text-[3.5rem] leading-[1.05] tracking-tight">
            Canopies of Care
          </h1>
          <p className="text-[1.75rem] leading-relaxed font-medium text-nis-muted max-w-2xl">
            A History of Mutual Aid as American Civic Tradition
          </p>
          <p className="mt-8 text-[1.25rem] leading-relaxed text-nis-muted max-w-2xl">
            Americans show up for each other. We always have. In 1787, in the
            same city where the Constitutional Convention met, the Free African
            Society organised burial, sickness benefits, and care for widows
            and orphans, and every generation since has rebuilt that design.
            Belonging, in this tradition, is something people do: you are part
            of the community you show up for.
          </p>
          <p className="mt-6 text-[1.05rem] leading-relaxed text-nis-muted max-w-2xl">
            Below is the record of that practice, generation by generation,
            with the pressures it outlasted beside it, and, alongside both,
            the story the country told about itself while the practice
            carried on.
          </p>
        </section>

        {/* The timeline: practice in the stream, narrative on the rail */}
        <Timeline />

        {/* Closing panel */}
        <section className="max-w-5xl mx-auto px-6 md:px-12 py-24 text-center">
          <p className="mx-auto max-w-xl font-serif text-[1.35rem] leading-relaxed text-[color:var(--color-nis-ink)]">
            Community in America was woven, not bounded. The practice never
            broke; only the story about it changed. This archive is the
            record catching up.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/archive/introduction"
              className="border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-ink)] px-6 py-3 font-sans text-sm font-bold uppercase tracking-[0.1em] text-[color:var(--color-nis-bg)] transition-colors hover:bg-[color:var(--color-nis-hover)]"
            >
              Read the argument
            </Link>
            <Link
              href="/archive"
              className="border border-[color:var(--color-nis-ink)] px-6 py-3 font-sans text-sm font-bold uppercase tracking-[0.1em] text-[color:var(--color-nis-ink)] transition-colors hover:bg-[color:var(--color-nis-accent-soft)]"
            >
              Browse the archive
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
