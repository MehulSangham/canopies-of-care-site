'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TIMELINE_EVENTS, eventDomId } from '@/lib/timeline';

/**
 * Shown when the reader arrives from a landing-timeline event card
 * (`?tl=<node id>`). Names the node they came from and links back to
 * that exact spot on the timeline.
 */
function TimelineOriginInner() {
  const params = useSearchParams();
  const tl = params.get('tl');
  if (!tl) return null;

  const event = TIMELINE_EVENTS.find((e) => eventDomId(e) === tl);
  if (!event) return null;

  const strandColor =
    event.strand === 'aid'
      ? 'var(--color-nis-deep-forest)'
      : 'var(--color-nis-earth)';

  return (
    <div className="sticky top-[55px] z-40 border-b border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-paper)]/95 px-4 py-2 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[686px] flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5 text-center">
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-nis-muted">
          From the timeline
        </span>
        <span
          className="font-mono text-[11px] font-bold tracking-[0.06em]"
          style={{ color: strandColor }}
        >
          {event.dateLabel}
        </span>
        <span className="font-serif text-[0.85rem] italic text-[color:var(--color-nis-ink)]">
          {event.title}
        </span>
        <Link
          href={`/#${tl}`}
          className="font-sans text-[11px] font-bold text-nis-hover underline decoration-[color:var(--color-nis-soft)] underline-offset-2 hover:decoration-current"
        >
          Back to the timeline ↩
        </Link>
      </div>
    </div>
  );
}

export function TimelineOrigin() {
  return (
    <Suspense fallback={null}>
      <TimelineOriginInner />
    </Suspense>
  );
}
