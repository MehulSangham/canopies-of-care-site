'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Scale, Layers, Network, BookOpen, X } from 'lucide-react';
import type { MetaPanelData, PanelFrame, PanelSourceGroup } from '@/lib/meta-panel';
import { compactUrlLabel } from '@/lib/footnote-sources';
import { useEditModeOptional } from '@/components/edit/EditModeProvider';

type TabId = 'argument' | 'frames' | 'logic' | 'sources';

interface MetaPanelProps {
  data: MetaPanelData;
  sources: PanelSourceGroup[];
}

/** Escape HTML, then render *italics* and compact bare URLs into links. */
function richText(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(
    /https?:\/\/[^\s)]+/g,
    (url) =>
      `<a href="${url}" target="_blank" rel="noreferrer" class="font-bold text-nis-hover no-underline hover:underline whitespace-nowrap">${compactUrlLabel(url)} ↗</a>`,
  );
  return html;
}

function Rich({ text }: { text: string }) {
  return <span dangerouslySetInnerHTML={{ __html: richText(text) }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-nis-muted">
      {children}
    </div>
  );
}

function FrameList({ frames }: { frames: PanelFrame[] }) {
  return (
    <ul className="m-0 list-none p-0">
      {frames.map((f) => (
        <li key={f.name} className="mb-3">
          <div className="inline-block border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-paper)] px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide text-[color:var(--color-nis-ink)]">
            {f.name}
          </div>
          {f.note && (
            <p className="mb-0 mt-1 text-[13px] leading-[1.55] text-nis-muted">
              <Rich text={f.note} />
            </p>
          )}
          {f.alsoOn && f.alsoOn.length > 0 && (
            <p className="mb-0 mt-1 font-sans text-[11px] text-nis-muted">
              Also on{' '}
              {f.alsoOn.map((p, i) => (
                <span key={p.slug}>
                  {i > 0 && ', '}
                  <Link
                    href={`/archive/${p.slug}`}
                    className="font-bold text-[color:var(--color-nis-ink)] underline underline-offset-2 hover:text-nis-hover"
                  >
                    {p.title}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ─── Main component ─── */

const TABS: { id: TabId; label: string; icon: typeof Scale }[] = [
  { id: 'argument', label: 'Argument', icon: Scale },
  { id: 'frames', label: 'Frames', icon: Layers },
  { id: 'logic', label: 'Logic', icon: Network },
  { id: 'sources', label: 'Sources', icon: BookOpen },
];

export function MetaPanel({ data, sources }: MetaPanelProps) {
  const [openTab, setOpenTab] = useState<TabId | null>(null);
  const editCtx = useEditModeOptional();

  // Close on Escape
  useEffect(() => {
    if (!openTab) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenTab(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openTab]);

  // Hide entirely while editing — the edit UI owns the page
  if (editCtx?.isEditMode) return null;

  const availableTabs = TABS.filter((t) => {
    if (t.id === 'argument') return !!(data.claim || data.argument);
    if (t.id === 'frames') return !!(data.frames?.counters?.length || data.frames?.proposes?.length);
    if (t.id === 'logic') return !!(data.logic?.problematic || data.logic?.alternative);
    return sources.length > 0;
  });

  if (availableTabs.length === 0) return null;

  return (
    <>
      {/* Collapsed icon rail */}
      <div className="fixed right-4 top-1/2 z-[60] hidden -translate-y-1/2 flex-col gap-1.5 nis-wide:flex">
        {availableTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={`Open ${label} panel`}
            onClick={() => setOpenTab(openTab === id ? null : id)}
            className={`inline-flex h-9 w-9 items-center justify-center border transition-colors ${
              openTab === id
                ? 'border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)]'
                : 'border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] text-[color:var(--color-nis-ink)] hover:bg-[color:var(--color-nis-accent-soft)]'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}

      </div>

      {/* Expanded panel */}
      {openTab && (
        <aside
          aria-label="Page analysis panel"
          className="fixed bottom-0 right-0 top-[55px] z-[59] hidden w-[400px] flex-col border-l border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] shadow-[-6px_0_0_0_var(--color-nis-accent)] nis-wide:flex"
        >
          {/* Tab header */}
          <div className="flex items-center justify-between border-b border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-paper)] pl-4 pr-2">
            <div className="flex items-center gap-0.5">
              {availableTabs.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOpenTab(id)}
                  className={`px-2.5 py-3 font-sans text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                    openTab === id
                      ? 'text-[color:var(--color-nis-ink)] shadow-[inset_0_-3px_0_0_var(--color-nis-accent)]'
                      : 'text-nis-muted hover:text-[color:var(--color-nis-ink)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOpenTab(null)}
              aria-label="Close panel"
              className="inline-flex h-8 w-8 items-center justify-center text-nis-muted hover:text-[color:var(--color-nis-ink)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tab body */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {openTab === 'argument' && (
              <div>
                {data.claim && (
                  <div className="mb-5 border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-paper)] px-4 py-3">
                    <SectionLabel>Claim</SectionLabel>
                    <p className="m-0 font-sans text-[14px] font-semibold leading-[1.5] text-[color:var(--color-nis-ink)]">
                      <Rich text={data.claim} />
                    </p>
                    {data.spine && (
                      <p className="mb-0 mt-2 border-t border-[color:var(--color-nis-soft)] pt-2 font-sans text-[11px] text-nis-muted">
                        Part of the archive&rsquo;s argument — supports{' '}
                        <span className="font-mono text-[10px] font-bold text-[color:var(--color-nis-ink)]">
                          {data.spine}
                        </span>
                      </p>
                    )}
                  </div>
                )}
                {data.argument?.grounds && data.argument.grounds.length > 0 && (
                  <div className="mb-5">
                    <SectionLabel>What must be shown</SectionLabel>
                    <ul className="m-0 list-none p-0">
                      {data.argument.grounds.map((g, i) => {
                        const cites = data.argument?.groundSources?.[i] ?? [];
                        return (
                          <li key={i} className="mb-2.5 flex gap-2 text-[13px] leading-[1.55] text-[color:var(--color-nis-ink)]">
                            <span className="text-nis-muted">—</span>
                            <span>
                              <Rich text={g} />
                              {cites.length > 0 && (
                                <span className="mt-0.5 block text-[11px] leading-[1.5] text-nis-muted">
                                  {cites.map((c, j) => (
                                    <span key={j} className="block">
                                      <Rich text={c} />
                                    </span>
                                  ))}
                                </span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {data.argument?.warrant && (
                  <div className="mb-5">
                    <SectionLabel>Warrant</SectionLabel>
                    <p className="m-0 text-[13px] leading-[1.55] text-[color:var(--color-nis-ink)]">
                      <Rich text={data.argument.warrant} />
                    </p>
                  </div>
                )}
                {data.argument?.qualifier && (
                  <div className="mb-5">
                    <SectionLabel>Strength &amp; limits</SectionLabel>
                    <p className="m-0 text-[13px] leading-[1.55] text-[color:var(--color-nis-ink)]">
                      <Rich text={data.argument.qualifier} />
                    </p>
                  </div>
                )}
                {data.argument?.rebuttal && (
                  <div className="mb-2">
                    <SectionLabel>The strongest objection</SectionLabel>
                    <p className="m-0 text-[13px] italic leading-[1.55] text-nis-muted">
                      &ldquo;<Rich text={data.argument.rebuttal} />&rdquo;
                    </p>
                    {data.argument.answer && (
                      <p className="mb-0 mt-2 border-l-2 border-[color:var(--color-nis-accent)] pl-3 text-[13px] leading-[1.55] text-[color:var(--color-nis-ink)]">
                        <Rich text={data.argument.answer} />
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {openTab === 'frames' && (
              <div>
                <p className="mb-5 mt-0 text-[12px] leading-[1.5] text-nis-muted">
                  The semantic frames and conceptual metaphors this page engages — the ones it
                  works to displace, and the ones it advances.
                </p>
                {data.frames?.counters && data.frames.counters.length > 0 && (
                  <div className="mb-6">
                    <SectionLabel>Countered</SectionLabel>
                    <FrameList frames={data.frames.counters} />
                  </div>
                )}
                {data.frames?.proposes && data.frames.proposes.length > 0 && (
                  <div>
                    <SectionLabel>Proposed</SectionLabel>
                    <FrameList frames={data.frames.proposes} />
                  </div>
                )}
              </div>
            )}

            {openTab === 'logic' && (
              <div>
                {data.logic?.problematic && (
                  <div className="mb-6">
                    <SectionLabel>The structure disclosed as problematic</SectionLabel>
                    <p className="m-0 border-l-2 border-[color:var(--color-nis-earth)] pl-3 text-[13px] leading-[1.6] text-[color:var(--color-nis-ink)]">
                      <Rich text={data.logic.problematic} />
                    </p>
                  </div>
                )}
                {data.logic?.alternative && (
                  <div>
                    <SectionLabel>The alternative proposed</SectionLabel>
                    <p className="m-0 border-l-2 border-[color:var(--color-nis-accent)] pl-3 text-[13px] leading-[1.6] text-[color:var(--color-nis-ink)]">
                      <Rich text={data.logic.alternative} />
                    </p>
                  </div>
                )}
              </div>
            )}

            {openTab === 'sources' && (
              <div>
                <p className="mb-5 mt-0 text-[12px] leading-[1.5] text-nis-muted">
                  Every source cited on this page, grouped by footnote.
                </p>
                {sources.map((group) => (
                  <div key={group.id} className="mb-4 border-b border-[color:var(--color-nis-soft2)] pb-3 last:border-b-0">
                    <div className="mb-1 font-mono text-[11px] font-bold text-nis-muted">[{group.id}]</div>
                    <ul className="m-0 list-none p-0">
                      {group.items.map((s, i) => (
                        <li key={i} className="mb-1.5 text-[13px] leading-[1.5] text-[color:var(--color-nis-ink)]">
                          <Rich text={s} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
