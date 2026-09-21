import Link from "next/link";
import Header from "@/components/Header";
import { Timeline } from "@/components/timeline/Timeline";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero — centred on the timeline's axis */}
        <section className="mx-auto max-w-[760px] px-6 py-24 text-center md:py-32">
          <p className="font-serif text-sm uppercase tracking-[0.16em] text-nis-muted mb-6">
            Archive
          </p>
          <h1 className="mb-6 text-[color:var(--color-nis-ink)] font-sans font-bold text-[3.5rem] leading-[1.05] tracking-tight">
            A History of Mutual Aid
          </h1>
          <p className="mx-auto max-w-xl font-serif text-[1.35rem] leading-relaxed text-nis-muted">
            An American Civic Tradition
          </p>
          <p className="mx-auto mt-8 max-w-2xl text-[1.25rem] leading-relaxed text-nis-muted">
            Americans show up for each other. We always have. In 1787, in the
            same city where the Constitutional Convention met, the Free African
            Society organised burial, sickness benefits, and care for widows
            and orphans, and every generation since has rebuilt that design.
            Belonging, in this tradition, is something people do, because you
            are part of the community you show up for.
          </p>
          <p className="mx-auto mt-6 max-w-xl text-[1.05rem] leading-relaxed text-nis-muted">
            Below is the record of that practice, generation by generation,
            with the pressures it outlasted beside it, and, alongside both,
            the story the country told about itself while the practice
            carried on.
          </p>
        </section>

        {/* Hero images: the practice, the people it carries, the ethic today */}
        <figure className="mx-auto mb-20 max-w-[1100px] px-6 md:-mt-8">
          <div className="grid gap-4 md:grid-cols-3 md:gap-5">
            <div>
              <div className="border border-[color:var(--color-nis-ink)] shadow-[5px_5px_0_0_var(--color-nis-accent)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/home/pie-town-barbeque-color-1940.jpg"
                  alt="Neighbours serving each other plates of barbeque under a pine tree at the Pie Town, New Mexico fair, 1940, in colour"
                  className="block h-[220px] w-full object-cover md:h-[280px]"
                />
              </div>
              <p className="mt-3 font-serif text-[0.8rem] italic leading-relaxed text-nis-muted">
                Serving up the barbeque at the community fair. Pie Town, New
                Mexico, 1940. Russell Lee, Farm Security Administration.
              </p>
            </div>
            <div>
              <div className="border border-[color:var(--color-nis-ink)] shadow-[5px_5px_0_0_var(--color-nis-accent)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/home/chicago-talent-show-1973.jpg"
                  alt="Three children with their arms around each other, smiling into the camera at a community talent show on Chicago's South Side, 1973"
                  className="block h-[220px] w-full object-cover md:h-[280px]"
                />
              </div>
              <p className="mt-3 font-serif text-[0.8rem] italic leading-relaxed text-nis-muted">
                A community talent show on Chicago&rsquo;s South Side, 1973.
                John H. White, National Archives.
              </p>
            </div>
            <div>
              <div className="border border-[color:var(--color-nis-ink)] shadow-[5px_5px_0_0_var(--color-nis-accent)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/home/community-fridge-nola-2020.jpg"
                  alt="A community fridge in New Orleans painted with the words: take what you need, leave what you can, 2020"
                  className="block h-[220px] w-full object-cover object-[center_72%] md:h-[280px]"
                />
              </div>
              <p className="mt-3 font-serif text-[0.8rem] italic leading-relaxed text-nis-muted">
                &ldquo;Take what you need, leave what you can.&rdquo; A
                community fridge in Mid-City New Orleans, December 2020.
                Photograph by Infrogmation, CC BY.
              </p>
            </div>
          </div>
        </figure>

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
