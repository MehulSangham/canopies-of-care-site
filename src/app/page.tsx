import Link from "next/link";
import Header from "@/components/Header";

const sections = [
  {
    id: "A",
    label: "Section A",
    title: "The Founding Tradition",
    description:
      "Mutual aid is real, it is old, and it reached massive scale.",
  },
  {
    id: "B",
    label: "Section B",
    title: "Through American Identity",
    description:
      "The tradition survived displacement, co-optation, and erasure across the 20th and 21st centuries.",
  },
  {
    id: "C",
    label: "Section C",
    title: "Transcendence Across Identities",
    description:
      "In crisis, in labour, and by design, mutual aid crossed the ethnic lines that structured everyday life.",
  },
  {
    id: "D",
    label: "Section D",
    title: "Displacement & Contestation",
    description:
      "Why you don't know this history, who displaced it, and what the archival document does about it.",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 md:px-12 py-24 md:py-36">
          <h4 className="mb-6">Archive</h4>
          <h1 className="max-w-3xl mb-8">
            Canopies of Care
          </h1>
          <p className="text-[1.75rem] leading-relaxed font-[500] text-[var(--cream-muted)] max-w-2xl">
            A History of Mutual Aid as American Civic Tradition
          </p>
          <p className="mt-8 text-[1.25rem] leading-relaxed text-[var(--cream-subtle)] max-w-2xl">
            In 1787, two things happened in Philadelphia: the Constitutional
            Convention wrote the rules for who would be recognised as American,
            and the Free African Society built the infrastructure for those the
            rules excluded. Both are founding traditions. Only one is remembered.
          </p>
        </section>

        {/* Section cards */}
        <section className="max-w-5xl mx-auto px-6 md:px-12 pb-24">
          <div className="grid md:grid-cols-2 gap-6">
            {sections.map((s) => (
              <Link
                key={s.id}
                href={`/archive#section-${s.id.toLowerCase()}`}
                className="card flex flex-col gap-4 hover:border-[var(--accent)] transition-colors group"
              >
                <h4>{s.label}</h4>
                <h3 className="group-hover:text-[var(--accent)] transition-colors">
                  {s.title}
                </h3>
                <p className="text-[1rem] leading-relaxed text-[var(--cream-muted)]">
                  {s.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
