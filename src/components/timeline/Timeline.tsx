'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  TIMELINE_EVENTS,
  NARRATIVE_PHASES,
  phaseForYear,
  type TimelineEvent,
  type NarrativePhase,
} from '@/lib/timeline';
import {
  TexturedRail,
  TexturedDot,
} from '@/components/curriculum/TexturedRail';

/* ────────────────────────────────────────────────────────────────────
   Scroll model

   One scroll listener measures progress through the timeline section
   and feeds both rails: the left index (where you are) and the right
   narrative panel (what the story of America says at that moment).
   Positions are measured from the DOM and re-measured on resize, so
   image loading cannot desynchronise the rails from the stream.
──────────────────────────────────────────────────────────────────── */

interface RailItem {
  id: string;
  label: string;
  /** 'phase' items are always visible; 'event' labels appear on hover */
  kind: 'phase' | 'event';
  /** Position along the rail, 0–100 */
  pct: number;
  /** Absolute document offset, for click-to-jump */
  top: number;
}

function eventDomId(e: TimelineEvent): string {
  return `tl-${e.year}-${e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function phaseDomId(p: NarrativePhase): string {
  return `tl-phase-${p.id}`;
}

/** Reveal children when they enter the viewport (once). */
function Reveal({ children }: { children: ReactNode }) {
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
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`motion-safe:transition-all motion-safe:duration-700 ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'motion-safe:opacity-0 motion-safe:translate-y-5'
      }`}
    >
      {children}
    </div>
  );
}

/* ─── Event card (centre stream) ─── */

function EventCard({ event }: { event: TimelineEvent }) {
  return (
    <Link
      href={event.href}
      className="group block border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-white)] transition-all hover:border-[color:var(--color-nis-ink)] hover:shadow-[4px_4px_0_0_var(--color-nis-accent)]"
    >
      {event.image && (
        <div className="overflow-hidden border-b border-[color:var(--color-nis-soft)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image}
            alt={event.title}
            loading="lazy"
            className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      )}
      <div className="p-5">
        <p className="font-mono text-[11px] font-bold tracking-[0.08em] text-[color:var(--color-nis-earth)]">
          {event.dateLabel}
        </p>
        <h3 className="mt-1 font-sans text-[1.15rem] font-bold leading-snug text-[color:var(--color-nis-ink)] transition-colors group-hover:text-nis-hover">
          {event.title}
        </h3>
        <p className="mt-1.5 font-serif text-[0.95rem] leading-relaxed text-nis-muted">
          {event.blurb}
        </p>
      </div>
    </Link>
  );
}

/* ─── Left rail: the index ─── */

function IndexRail({
  items,
  activeId,
  fillPct,
  onJump,
}: {
  items: RailItem[];
  activeId: string;
  fillPct: number;
  onJump: (top: number) => void;
}) {
  return (
    <nav
      aria-label="Timeline index"
      className="group pointer-events-auto relative h-full w-28"
    >
      {/* Track and fill */}
      <div className="absolute left-0 top-6 bottom-10 w-[6px] overflow-hidden">
        <TexturedRail
          className="absolute inset-x-0 w-full"
          color="rgba(0, 0, 60, 0.16)"
          style={{ top: 0, height: '100%' }}
        />
        <TexturedRail
          className="absolute inset-x-0 w-full transition-all duration-75"
          color="var(--color-nis-deep-forest)"
          style={{ top: 0, height: `${fillPct}%` }}
        />
      </div>

      {/* Dots */}
      <div className="pointer-events-none absolute left-0 top-6 bottom-10 z-10 w-[10px]">
        {items.map((item) => (
          <TexturedDot
            key={`dot-${item.id}`}
            className={`absolute left-0 transition-opacity duration-200 ${
              item.kind === 'phase' ? 'h-2.5 w-2.5' : 'h-2 w-2'
            } ${activeId === item.id ? 'opacity-100' : 'opacity-70'}`}
            color={
              activeId === item.id
                ? 'var(--color-nis-ink)'
                : item.kind === 'phase'
                  ? 'rgba(0, 0, 60, 0.55)'
                  : 'rgba(0, 0, 60, 0.3)'
            }
            shadowColor={
              activeId === item.id ? 'rgba(246,243,234,1)' : 'transparent'
            }
            style={{ top: `${item.pct}%`, transform: 'translate(-1px, -50%)' }}
          />
        ))}
      </div>

      {/* Labels: phases always visible, events on hover */}
      <div className="absolute left-0 top-6 bottom-10 w-[230px] pl-6">
        <div className="relative h-full w-full">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onJump(item.top)}
              title={item.label}
              className={`pointer-events-auto absolute left-0 w-[204px] truncate py-0.5 pr-2 text-left font-sans text-[11px] leading-[1.2] transition-all duration-200 ${
                item.kind === 'phase'
                  ? 'font-bold uppercase tracking-[0.08em]'
                  : 'pl-4'
              } ${
                activeId === item.id
                  ? 'font-bold text-[color:var(--color-nis-ink)] opacity-100'
                  : item.kind === 'phase'
                    ? 'text-nis-muted opacity-90 hover:text-nis-hover'
                    : 'text-nis-muted opacity-55 hover:opacity-100 hover:text-nis-hover'
              }`}
              style={{ top: `${item.pct}%`, transform: 'translateY(-50%)' }}
            >
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

/* ─── Right rail: the story being told ─── */

function NarrativeRail({
  phases,
  activePhase,
  fillPct,
  onJump,
  phasePositions,
}: {
  phases: NarrativePhase[];
  activePhase: NarrativePhase;
  fillPct: number;
  onJump: (top: number) => void;
  phasePositions: Map<string, RailItem>;
}) {
  return (
    <div className="pointer-events-auto relative flex h-full w-full">
      {/* Narrative card, vertically centred beside the rail */}
      <div className="flex min-w-0 flex-1 flex-col justify-center pb-16 pr-6">
        <div key={activePhase.id} className="tl-narrative-swap">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-nis-muted">
            The story being told
          </p>
          <p className="mt-3 font-mono text-[11px] font-bold text-[color:var(--color-nis-earth)]">
            {activePhase.range}
          </p>
          <h3 className="mt-1 font-sans text-[1.05rem] font-bold leading-snug text-[color:var(--color-nis-ink)]">
            {activePhase.title}
          </h3>
          <p className="mt-2 font-serif text-[0.85rem] leading-relaxed text-nis-muted">
            {activePhase.narrative}
          </p>
        </div>
      </div>

      {/* Mirrored track on the right edge, phase dots only */}
      <div className="relative w-28 shrink-0">
        <div className="absolute right-6 top-6 bottom-10 w-[6px] overflow-hidden">
          <TexturedRail
            className="absolute inset-x-0 w-full"
            color="rgba(0, 0, 60, 0.16)"
            style={{ top: 0, height: '100%' }}
          />
          <TexturedRail
            className="absolute inset-x-0 w-full transition-all duration-75"
            color="var(--color-nis-earth)"
            style={{ top: 0, height: `${fillPct}%` }}
          />
        </div>
        <div className="absolute right-6 top-6 bottom-10 z-10 w-[10px]">
          {phases.map((p) => {
            const pos = phasePositions.get(phaseDomId(p));
            if (!pos) return null;
            const active = activePhase.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                title={`${p.title} (${p.range})`}
                aria-label={`Jump to ${p.title}`}
                onClick={() => onJump(pos.top)}
                className="absolute right-0 h-4 w-4 -translate-y-1/2"
                style={{ top: `${pos.pct}%` }}
              >
                <TexturedDot
                  className={`h-2.5 w-2.5 transition-opacity duration-200 ${
                    active ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                  }`}
                  color={
                    active
                      ? 'var(--color-nis-earth)'
                      : 'rgba(0, 0, 60, 0.35)'
                  }
                  shadowColor={active ? 'rgba(246,243,234,1)' : 'transparent'}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─── */

export function Timeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const [railItems, setRailItems] = useState<RailItem[]>([]);
  const [activeId, setActiveId] = useState('');
  const [activePhaseId, setActivePhaseId] = useState(NARRATIVE_PHASES[0].id);
  const [fillPct, setFillPct] = useState(0);

  const events = [...TIMELINE_EVENTS].sort((a, b) => a.year - b.year);

  // Measure positions of phase headers and event cards within the section
  const measure = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const sectionHeight = Math.max(1, section.offsetHeight);

    const items: RailItem[] = [];
    for (const el of section.querySelectorAll<HTMLElement>('[data-tl-item]')) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      items.push({
        id: el.id,
        label: el.dataset.tlLabel ?? '',
        kind: el.dataset.tlItem === 'phase' ? 'phase' : 'event',
        pct: Math.min(100, Math.max(0, ((top - sectionTop) / sectionHeight) * 100)),
        top,
      });
    }

    // Keep labels from overlapping on the left rail
    const MIN_GAP = 3.2;
    for (let i = 1; i < items.length; i++) {
      if (items[i].pct < items[i - 1].pct + MIN_GAP) {
        items[i].pct = items[i - 1].pct + MIN_GAP;
      }
    }
    if (items.length > 0 && items[items.length - 1].pct > 99) {
      const shift = items[items.length - 1].pct - 99;
      for (const item of items) item.pct = Math.max(0, item.pct - shift);
    }

    setRailItems(items);
  }, []);

  useEffect(() => {
    const timer = setTimeout(measure, 150);
    const section = sectionRef.current;
    const observer = section ? new ResizeObserver(() => measure()) : null;
    if (section && observer) observer.observe(section);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  // Scrollspy: focus line at 40% of the viewport
  useEffect(() => {
    const onScroll = () => {
      const section = sectionRef.current;
      if (!section || railItems.length === 0) return;
      const rect = section.getBoundingClientRect();
      const focusY = window.scrollY + window.innerHeight * 0.4;
      const sectionTop = rect.top + window.scrollY;
      const progress = Math.min(
        100,
        Math.max(0, ((focusY - sectionTop) / Math.max(1, section.offsetHeight)) * 100),
      );
      setFillPct(progress);

      let current: RailItem | null = null;
      let currentPhase: RailItem | null = null;
      for (const item of railItems) {
        if (item.top <= focusY + 20) {
          current = item;
          if (item.kind === 'phase') currentPhase = item;
        } else break;
      }
      setActiveId((current ?? railItems[0]).id);
      const phaseId = (currentPhase ?? railItems[0]).id.replace('tl-phase-', '');
      setActivePhaseId(
        NARRATIVE_PHASES.some((p) => p.id === phaseId)
          ? phaseId
          : NARRATIVE_PHASES[0].id,
      );
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [railItems]);

  const jump = useCallback((top: number) => {
    window.scrollTo({ top: top - window.innerHeight * 0.35, behavior: 'smooth' });
  }, []);

  const activePhase =
    NARRATIVE_PHASES.find((p) => p.id === activePhaseId) ?? NARRATIVE_PHASES[0];
  const phasePositions = new Map(
    railItems.filter((i) => i.kind === 'phase').map((i) => [i.id, i]),
  );

  return (
    <div className="relative">
      {/* Left rail: the index (like the article TOC) */}
      <aside className="pointer-events-none fixed left-0 top-[55px] z-20 hidden h-[calc(100vh-55px)] overflow-visible pt-10 lg:block lg:w-72 lg:pl-6 xl:pl-10">
        <IndexRail
          items={railItems}
          activeId={activeId}
          fillPct={fillPct}
          onJump={jump}
        />
      </aside>

      {/* Right rail: the story being told */}
      <aside className="pointer-events-none fixed right-0 top-[55px] z-20 hidden h-[calc(100vh-55px)] pt-10 xl:block xl:w-80 2xl:w-96 2xl:pr-6">
        <NarrativeRail
          phases={NARRATIVE_PHASES}
          activePhase={activePhase}
          fillPct={fillPct}
          onJump={jump}
          phasePositions={phasePositions}
        />
      </aside>

      {/* Centre stream: the practice */}
      <section ref={sectionRef} className="mx-auto max-w-[620px] px-6">
        {NARRATIVE_PHASES.map((phase) => {
          const phaseEvents = events.filter(
            (e) => phaseForYear(e.year).id === phase.id,
          );
          if (phaseEvents.length === 0) return null;
          return (
            <div key={phase.id}>
              {/* Phase header */}
              <div
                id={phaseDomId(phase)}
                data-tl-item="phase"
                data-tl-label={`${phase.title} · ${phase.range}`}
                className="pb-8 pt-14 first:pt-0"
              >
                <p className="text-center font-serif text-xs uppercase tracking-[0.2em] text-nis-muted">
                  {phase.title}
                  <span className="ml-3 font-mono normal-case tracking-normal">
                    {phase.range}
                  </span>
                </p>
                {/* Inline narrative where the right rail is hidden */}
                <div className="mx-auto mt-5 max-w-[480px] border-l-2 border-[color:var(--color-nis-earth)] pl-4 xl:hidden">
                  <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-nis-muted">
                    The story being told
                  </p>
                  <p className="mt-1 font-serif text-[0.85rem] leading-relaxed text-nis-muted">
                    {phase.narrative}
                  </p>
                </div>
              </div>

              {/* Events */}
              {phaseEvents.map((event) => (
                <div
                  key={eventDomId(event)}
                  id={eventDomId(event)}
                  data-tl-item="event"
                  data-tl-label={`${event.dateLabel} — ${event.title}`}
                  className="pb-8"
                >
                  <Reveal>
                    <EventCard event={event} />
                  </Reveal>
                </div>
              ))}
            </div>
          );
        })}
      </section>
    </div>
  );
}
