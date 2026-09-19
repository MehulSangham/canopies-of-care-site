'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  TIMELINE_EVENTS,
  ERAS,
  type TimelineEvent,
  type Strand,
} from '@/lib/timeline';

/** Reveal children when they enter the viewport (once). */
function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} motion-safe:transition-all motion-safe:duration-700 ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'motion-safe:opacity-0 motion-safe:translate-y-6'
      }`}
    >
      {children}
    </div>
  );
}

const STRAND_STYLE: Record<
  Strand,
  { border: string; dot: string; label: string; labelColor: string }
> = {
  care: {
    border: 'border-[color:var(--color-nis-accent)]',
    dot: 'bg-[color:var(--color-nis-accent)]',
    label: 'The care tradition',
    labelColor: 'text-[color:var(--color-nis-ink)]',
  },
  displacement: {
    border: 'border-[color:var(--color-nis-earth)]',
    dot: 'bg-[color:var(--color-nis-earth)]',
    label: 'The displacement',
    labelColor: 'text-[color:var(--color-nis-earth)]',
  },
};

function EventCard({ event }: { event: TimelineEvent }) {
  const style = STRAND_STYLE[event.strand];
  return (
    <Link
      href={event.href}
      className={`group block border bg-[color:var(--color-nis-white)] transition-shadow hover:shadow-[4px_4px_0_0_var(--color-nis-soft)] ${style.border}`}
    >
      {event.image && (
        <div className="overflow-hidden border-b border-[color:var(--color-nis-soft)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image}
            alt={event.title}
            loading="lazy"
            className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      )}
      <div className="p-4">
        <p className={`font-mono text-[11px] font-bold tracking-[0.08em] ${style.labelColor}`}>
          {event.dateLabel}
        </p>
        <h3 className="mt-1 font-sans text-[1.05rem] font-bold leading-snug text-[color:var(--color-nis-ink)] group-hover:text-nis-hover transition-colors">
          {event.title}
        </h3>
        <p className="mt-1.5 font-serif text-[0.9rem] leading-relaxed text-nis-muted">
          {event.blurb}
        </p>
      </div>
    </Link>
  );
}

function EventRow({ event }: { event: TimelineEvent }) {
  const style = STRAND_STYLE[event.strand];
  const isCare = event.strand === 'care';

  return (
    <div className="relative">
      {/* Desktop: three columns, spine in the middle */}
      <div className="hidden md:grid md:grid-cols-[1fr_56px_1fr] md:items-start">
        <div className={isCare ? 'pb-10' : ''}>
          {isCare && (
            <Reveal>
              <EventCard event={event} />
            </Reveal>
          )}
        </div>
        <div className="relative flex h-full justify-center">
          <span
            className={`relative top-6 z-10 h-3 w-3 rounded-full border-2 border-[color:var(--color-nis-white)] ${style.dot}`}
          />
        </div>
        <div className={!isCare ? 'pb-10' : ''}>
          {!isCare && (
            <Reveal>
              <EventCard event={event} />
            </Reveal>
          )}
        </div>
      </div>

      {/* Mobile: single column, spine on the left */}
      <div className="grid grid-cols-[24px_1fr] gap-3 pb-8 md:hidden">
        <div className="relative flex justify-center">
          <span
            className={`relative top-5 z-10 h-2.5 w-2.5 rounded-full border-2 border-[color:var(--color-nis-white)] ${style.dot}`}
          />
        </div>
        <Reveal>
          <p className={`mb-1 font-sans text-[10px] font-bold uppercase tracking-[0.12em] ${style.labelColor}`}>
            {style.label}
          </p>
          <EventCard event={event} />
        </Reveal>
      </div>
    </div>
  );
}

export function Timeline() {
  const sorted = [...TIMELINE_EVENTS].sort((a, b) => a.year - b.year);

  return (
    <section className="relative mx-auto max-w-5xl px-6 md:px-12">
      {/* Strand legend */}
      <div className="mb-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        {(['care', 'displacement'] as Strand[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${STRAND_STYLE[s].dot}`} />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-nis-muted">
              {STRAND_STYLE[s].label}
            </span>
          </span>
        ))}
      </div>

      <div className="relative">
        {/* The spine */}
        <div className="absolute bottom-0 top-0 left-[11px] w-px bg-[color:var(--color-nis-soft)] md:left-1/2 md:-translate-x-1/2" />

        {ERAS.map((era) => {
          const eraEvents = sorted.filter(
            (e) => e.year >= era.from && e.year <= era.to,
          );
          if (eraEvents.length === 0) return null;
          return (
            <div key={era.label}>
              <div className="sticky top-[55px] z-20 -mx-6 mb-10 bg-[color:var(--color-nis-bg)]/95 px-6 py-3 backdrop-blur-sm md:-mx-12 md:px-12">
                <p className="text-center font-serif text-xs uppercase tracking-[0.2em] text-nis-muted">
                  {era.label}
                  <span className="ml-3 font-mono normal-case tracking-normal">
                    {era.range}
                  </span>
                </p>
              </div>
              {eraEvents.map((event) => (
                <EventRow key={`${event.year}-${event.title}`} event={event} />
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
