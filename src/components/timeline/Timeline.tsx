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
  type Strand,
} from '@/lib/timeline';
import {
  TexturedRail,
  TexturedDot,
} from '@/components/curriculum/TexturedRail';

/* ────────────────────────────────────────────────────────────────────
   Layout model

   Centre stream: dual spine. Mutual aid events sit left of a central
   textured line, exclusion events right, as compact index-style cards.
   Left rail (wide screens): scroll-synced index of phases and events.
   Right rail (widest screens): "the story being told", six narrative
   phases that crossfade with scroll; shown inline at phase breaks on
   smaller screens. One scroll listener feeds everything.
──────────────────────────────────────────────────────────────────── */

interface RailItem {
  id: string;
  label: string;
  kind: 'phase' | 'event';
  strand?: Strand;
  /** Position along the rail, 0–100 */
  pct: number;
  /** Absolute document offset, for click-to-jump */
  top: number;
}

const STRAND_STYLE: Record<
  Strand,
  { edge: string; date: string; dot: string; label: string }
> = {
  aid: {
    edge: 'border-l-[3px] border-l-[color:var(--color-nis-deep-forest)]',
    date: 'text-[color:var(--color-nis-deep-forest)]',
    dot: 'var(--color-nis-deep-forest)',
    label: 'Mutual aid',
  },
  exclusion: {
    edge: 'border-l-[3px] border-l-[color:var(--color-nis-earth)]',
    date: 'text-[color:var(--color-nis-earth)]',
    dot: 'var(--color-nis-earth)',
    label: 'Exclusion & displacement',
  },
};

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
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' },
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
          : 'motion-safe:opacity-0 motion-safe:translate-y-4'
      }`}
    >
      {children}
    </div>
  );
}

/* ─── Compact event card ─── */

function EventCard({ event }: { event: TimelineEvent }) {
  const style = STRAND_STYLE[event.strand];
  return (
    <Link
      href={event.href}
      className={`group flex border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-white)] transition-all hover:border-[color:var(--color-nis-ink)] hover:shadow-[3px_3px_0_0_var(--color-nis-accent)] ${style.edge}`}
    >
      {event.image && (
        <div className="w-[88px] shrink-0 self-stretch overflow-hidden border-r border-[color:var(--color-nis-soft)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image}
            alt={event.title}
            loading="lazy"
            className="h-full min-h-[96px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
      )}
      <div className="min-w-0 px-3.5 py-3">
        <p className={`font-mono text-[10px] font-bold tracking-[0.08em] ${style.date}`}>
          {event.dateLabel}
        </p>
        <h3 className="mt-0.5 font-sans text-[0.95rem] font-bold leading-snug text-[color:var(--color-nis-ink)] transition-colors group-hover:text-nis-hover">
          {event.title}
        </h3>
        <p className="mt-1 font-serif text-[0.8rem] leading-[1.5] text-nis-muted">
          {event.blurb}
        </p>
      </div>
    </Link>
  );
}

/* ─── One event row on the dual spine ─── */

function EventRow({ event }: { event: TimelineEvent }) {
  const style = STRAND_STYLE[event.strand];
  const isAid = event.strand === 'aid';

  return (
    <div>
      {/* Desktop: dual columns around the spine */}
      <div className="hidden md:grid md:grid-cols-[1fr_44px_1fr] md:items-start">
        <div className={isAid ? 'pb-5' : ''}>
          {isAid && (
            <Reveal>
              <EventCard event={event} />
            </Reveal>
          )}
        </div>
        <div className="relative flex h-full justify-center">
          <TexturedDot
            className="relative top-4 z-10 h-2.5 w-2.5"
            color={style.dot}
            shadowColor="rgba(246,243,234,1)"
          />
        </div>
        <div className={!isAid ? 'pb-5' : ''}>
          {!isAid && (
            <Reveal>
              <EventCard event={event} />
            </Reveal>
          )}
        </div>
      </div>

      {/* Mobile: single column with strand chip */}
      <div className="grid grid-cols-[20px_1fr] gap-2.5 pb-5 md:hidden">
        <div className="relative flex justify-center">
          <TexturedDot
            className="relative top-4 z-10 h-2 w-2"
            color={style.dot}
            shadowColor="rgba(246,243,234,1)"
          />
        </div>
        <Reveal>
          <p className={`mb-1 font-sans text-[9px] font-bold uppercase tracking-[0.12em] ${style.date}`}>
            {style.label}
          </p>
          <EventCard event={event} />
        </Reveal>
      </div>
    </div>
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
      className="pointer-events-auto relative h-full w-28"
    >
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
                  : item.strand
                    ? STRAND_STYLE[item.strand].dot
                    : 'rgba(0, 0, 60, 0.3)'
            }
            shadowColor={
              activeId === item.id ? 'rgba(246,243,234,1)' : 'transparent'
            }
            style={{ top: `${item.pct}%`, transform: 'translate(-1px, -50%)' }}
          />
        ))}
      </div>

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

      <div className="relative w-24 shrink-0">
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
                    active ? 'var(--color-nis-earth)' : 'rgba(0, 0, 60, 0.35)'
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
        strand: (el.dataset.tlStrand as Strand | undefined) ?? undefined,
        pct: Math.min(100, Math.max(0, ((top - sectionTop) / sectionHeight) * 100)),
        top,
      });
    }

    // Keep labels from overlapping: enforce a minimum gap sized so the
    // full list always fits the rail, then cascade forwards.
    if (items.length > 1) {
      const minGap = Math.min(3.2, 97 / (items.length - 1));
      for (let i = 1; i < items.length; i++) {
        if (items[i].pct < items[i - 1].pct + minGap) {
          items[i].pct = items[i - 1].pct + minGap;
        }
      }
      // If the cascade ran past the end, walk it back without collapsing gaps
      if (items[items.length - 1].pct > 99) {
        items[items.length - 1].pct = 99;
        for (let i = items.length - 2; i >= 0; i--) {
          if (items[i].pct > items[i + 1].pct - minGap) {
            items[i].pct = Math.max(0, items[i + 1].pct - minGap);
          }
        }
      }
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
      {/* Left rail: the index */}
      <aside className="pointer-events-none fixed left-0 top-[55px] z-20 hidden h-[calc(100vh-55px)] w-72 overflow-visible pl-6 pt-10 min-[1240px]:block">
        <IndexRail
          items={railItems}
          activeId={activeId}
          fillPct={fillPct}
          onJump={jump}
        />
      </aside>

      {/* Right rail: the story being told */}
      <aside className="pointer-events-none fixed right-0 top-[55px] z-20 hidden h-[calc(100vh-55px)] w-80 pt-10 min-[1400px]:block">
        <NarrativeRail
          phases={NARRATIVE_PHASES}
          activePhase={activePhase}
          fillPct={fillPct}
          onJump={jump}
          phasePositions={phasePositions}
        />
      </aside>

      {/* Centre stream: dual spine */}
      <section ref={sectionRef} className="relative mx-auto max-w-[760px] px-5">
        {/* Column legend */}
        <div className="mb-10 hidden md:grid md:grid-cols-[1fr_44px_1fr]">
          <p className="text-center font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-nis-deep-forest)]">
            {STRAND_STYLE.aid.label}
          </p>
          <span />
          <p className="text-center font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-nis-earth)]">
            {STRAND_STYLE.exclusion.label}
          </p>
        </div>

        {/* The central spine (desktop) and left spine (mobile) */}
        <div className="pointer-events-none absolute bottom-0 top-0 left-[29px] w-px bg-[color:var(--color-nis-soft)] md:left-1/2 md:-translate-x-1/2" />

        {NARRATIVE_PHASES.map((phase) => {
          const phaseEvents = events.filter(
            (e) => phaseForYear(e.year).id === phase.id,
          );
          if (phaseEvents.length === 0) return null;
          return (
            <div key={phase.id}>
              <div
                id={phaseDomId(phase)}
                data-tl-item="phase"
                data-tl-label={`${phase.title} · ${phase.range}`}
                className="relative pb-7 pt-10 first:pt-0"
              >
                <p className="bg-[color:var(--color-nis-bg)] py-1 text-center font-serif text-xs uppercase tracking-[0.2em] text-nis-muted">
                  {phase.title}
                  <span className="ml-3 font-mono normal-case tracking-normal">
                    {phase.range}
                  </span>
                </p>
                {/* Inline narrative where the right rail is hidden */}
                <div className="mx-auto mt-4 max-w-[480px] border-l-2 border-[color:var(--color-nis-earth)] bg-[color:var(--color-nis-bg)] pl-4 min-[1400px]:hidden">
                  <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-nis-muted">
                    The story being told
                  </p>
                  <p className="mt-1 font-serif text-[0.85rem] leading-relaxed text-nis-muted">
                    {phase.narrative}
                  </p>
                </div>
              </div>

              {phaseEvents.map((event) => (
                <div
                  key={eventDomId(event)}
                  id={eventDomId(event)}
                  data-tl-item="event"
                  data-tl-strand={event.strand}
                  data-tl-label={`${event.dateLabel} — ${event.title}`}
                >
                  <EventRow event={event} />
                </div>
              ))}
            </div>
          );
        })}
      </section>
    </div>
  );
}
