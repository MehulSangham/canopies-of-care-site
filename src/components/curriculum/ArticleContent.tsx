'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Pin, X } from 'lucide-react';
import { TexturedRail } from './TexturedRail';
import { decorateOutboundLinksHtml } from '@/lib/link-behavior';
import { splitFootnoteHtml } from '@/lib/footnote-sources';

interface ArticleContentProps {
  children: React.ReactNode;
}

interface Sidenote {
  id: string;
  number: string;
  noteHtml: string;
  sourcesHtml: string | null;
  refTop: number;
  adjustedTop: number;
  refElementId: string;
}

const COLLAPSED_HEIGHT = 56;
const SIDENOTE_GAP = 8;

function resolveOverlaps(notes: Sidenote[]): Sidenote[] {
  if (notes.length === 0) return notes;
  const sorted = [...notes].sort((a, b) => a.refTop - b.refTop);
  sorted[0].adjustedTop = sorted[0].refTop;
  for (let i = 1; i < sorted.length; i++) {
    const prevBottom = sorted[i - 1].adjustedTop + COLLAPSED_HEIGHT + SIDENOTE_GAP;
    sorted[i].adjustedTop = Math.max(sorted[i].refTop, prevBottom);
  }
  return sorted;
}

export function ArticleContent({ children }: ArticleContentProps) {
  const pathname = usePathname();
  const articleRef = useRef<HTMLDivElement>(null);
  const [sidenotes, setSidenotes] = useState<Sidenote[]>([]);
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);
  const [pinnedNote, setPinnedNote] = useState<string | null>(null);

  const activeNote = sidenotes.find((note) => note.id === (hoveredNote ?? pinnedNote)) ?? null;
  const mobilePinnedNote = sidenotes.find((note) => note.id === pinnedNote) ?? null;

  const extractSidenotes = useCallback(() => {
    if (!articleRef.current) return [] as Sidenote[];

    const container = articleRef.current;
    const extractedNotes: Sidenote[] = [];
    const footnoteSection = container.querySelector('section[data-footnotes]') ||
      container.querySelector('.footnotes');

    if (!footnoteSection) return extractedNotes;

    (footnoteSection as HTMLElement).style.display = '';

    const items = footnoteSection.querySelectorAll('li');
    items.forEach((li) => {
      const id = li.id;
      if (!id) return;

      const clone = li.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('[data-footnote-backref]').forEach(br => br.remove());

      const noteNum = id.replace(/^user-content-fn-/, '');
      const refElementId = `user-content-fnref-${noteNum}`;
      const refElement = container.querySelector(`#${CSS.escape(refElementId)}`);
      const refSup = refElement?.closest('sup') || refElement;

      let refTop = 0;
      if (refSup) {
        const rect = refSup.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        refTop = rect.top - containerRect.top;
      }

      const { noteHtml, sourcesHtml } = splitFootnoteHtml(clone.innerHTML);

      extractedNotes.push({
        id,
        number: noteNum,
        noteHtml: decorateOutboundLinksHtml(noteHtml),
        sourcesHtml: sourcesHtml ? decorateOutboundLinksHtml(sourcesHtml) : null,
        refTop,
        adjustedTop: refTop,
        refElementId,
      });
    });

    (footnoteSection as HTMLElement).style.display = 'none';

    return resolveOverlaps(extractedNotes);
  }, []);

  useEffect(() => {
    if (!articleRef.current) return;
    const container = articleRef.current;

    const resetSelectionFrame = window.requestAnimationFrame(() => {
      setHoveredNote(null);
      setPinnedNote(null);
    });
    let updateSidenotesFrame: number | null = null;

    const updateSidenotes = () => {
      if (updateSidenotesFrame !== null) {
        window.cancelAnimationFrame(updateSidenotesFrame);
      }
      updateSidenotesFrame = window.requestAnimationFrame(() => {
        const resolved = extractSidenotes();
        setSidenotes(resolved);
      });
    };

    updateSidenotes();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => updateSidenotes()) : null;
    resizeObserver?.observe(container);

    const mutationObserver = new MutationObserver(() => updateSidenotes());
    mutationObserver.observe(container, { childList: true, subtree: true });

    const mediaElements = Array.from(container.querySelectorAll('img, iframe, video'));
    const handleMediaLoad = () => updateSidenotes();
    mediaElements.forEach((element) => {
      element.addEventListener('load', handleMediaLoad);
    });

    window.addEventListener('resize', updateSidenotes);

    return () => {
      window.cancelAnimationFrame(resetSelectionFrame);
      if (updateSidenotesFrame !== null) window.cancelAnimationFrame(updateSidenotesFrame);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
      mediaElements.forEach((element) => {
        element.removeEventListener('load', handleMediaLoad);
      });
      window.removeEventListener('resize', updateSidenotes);
    };
  }, [extractSidenotes, pathname]);

  // Lock body scroll on mobile when a note is pinned
  useEffect(() => {
    if (!pinnedNote || typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 1099px)').matches) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPinnedNote(null);
        setHoveredNote(null);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pinnedNote]);

  // Close pinned note on outside click
  useEffect(() => {
    if (!pinnedNote) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-sidenote-card="true"]')) return;
      if (target.closest('sup')) return;
      setPinnedNote(null);
      setHoveredNote(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [pinnedNote]);

  // Highlight the inline ref when its sidenote is hovered or pinned
  useEffect(() => {
    if (!articleRef.current) return;
    const container = articleRef.current;

    container.querySelectorAll('.sidenote-ref-highlight').forEach(el => {
      (el as HTMLElement).style.backgroundColor = '';
      (el as HTMLElement).style.outline = '';
      el.classList.remove('sidenote-ref-highlight');
    });

    if (activeNote) {
      const noteNum = activeNote.id.replace(/^user-content-fn-/, '');
      const refId = `user-content-fnref-${noteNum}`;
      const refEl = container.querySelector(`#${CSS.escape(refId)}`);
      const targetEl = (refEl?.closest('sup') || refEl) as HTMLElement | null;

      if (targetEl) {
        const isPinnedActive = activeNote.id === pinnedNote;
        targetEl.style.backgroundColor = isPinnedActive ? 'rgba(0, 0, 60, 0.08)' : 'rgba(193, 209, 0, 0.18)';
        targetEl.style.outline = isPinnedActive ? '2px solid rgba(0, 0, 60, 0.45)' : '2px solid rgba(193, 209, 0, 0.55)';
        targetEl.style.borderRadius = '3px';
        targetEl.classList.add('sidenote-ref-highlight');
      }
    }
  }, [activeNote, pinnedNote]);

  // Shared timer ref for debouncing hover off
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleArticleMouseOver = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const sup = (e.target as HTMLElement).closest('sup');
    if (!sup) return;

    const anchor = sup.querySelector<HTMLElement>('[id^="user-content-fnref-"]');
    if (!anchor) return;

    const noteNum = anchor.id.replace('user-content-fnref-', '');
    const noteId = `user-content-fn-${noteNum}`;

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredNote(noteId);
  }, []);

  const handleArticleMouseOut = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const sup = (e.target as HTMLElement).closest('sup');
    if (!sup) return;

    const anchor = sup.querySelector<HTMLElement>('[id^="user-content-fnref-"]');
    if (!anchor) return;

    const related = e.relatedTarget as HTMLElement | null;
    if (related && sup.contains(related)) return;

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setHoveredNote(null);
    }, 300);
  }, []);

  const handleArticleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const sup = (e.target as HTMLElement).closest('sup');
    if (!sup) return;

    const anchor = sup.querySelector<HTMLElement>('[id^="user-content-fnref-"]');
    if (!anchor) return;

    e.preventDefault();
    e.stopPropagation();

    const noteNum = anchor.id.replace('user-content-fnref-', '');
    const noteId = `user-content-fn-${noteNum}`;

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    setPinnedNote((prevPinned) => {
      const nextPinned = prevPinned === noteId ? null : noteId;
      setHoveredNote(nextPinned);
      return nextPinned;
    });
  }, []);

  const handleSidenoteEnter = useCallback((id: string) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredNote(id);
  }, []);

  const handleSidenoteLeave = useCallback((id: string) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setHoveredNote(prev => prev === id ? null : prev);
    }, 300);
  }, []);

  const handleSidenoteClick = useCallback((note: Sidenote) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setPinnedNote((prevPinned) => {
      const nextPinned = prevPinned === note.id ? null : note.id;
      setHoveredNote(nextPinned);
      return nextPinned;
    });
  }, []);

  return (
    <>
      <div className="relative mx-auto w-full max-w-[686px] nis-wide:grid nis-wide:grid-cols-[686px_260px] nis-wide:gap-8 nis-wide:overflow-visible">
        <article
          ref={articleRef}
          onMouseOver={handleArticleMouseOver}
          onMouseOut={handleArticleMouseOut}
          onClickCapture={handleArticleClick}
          className="
            prose prose-base nis-prose-body-scale w-full max-w-[686px] nis-wide:w-[686px] min-w-0
            [&>*:first-child]:!mt-0 [&>p:first-child]:!m-0
            prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-[color:var(--color-nis-ink)] prose-headings:scroll-mt-28
            prose-h1:text-3xl prose-h1:leading-tight prose-h1:mb-6 prose-h1:mt-0 [&>h1:first-child]:hidden
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-[1.25rem] prose-p:leading-7 prose-p:font-medium prose-p:text-[color:var(--color-nis-ink)] prose-p:text-left
            prose-a:text-[color:var(--color-nis-ink)] prose-a:font-medium prose-a:no-underline [&_a:hover]:text-nis-hover [&_a:hover]:underline
            prose-blockquote:not-italic prose-blockquote:my-8 prose-blockquote:border prose-blockquote:border-[color:var(--color-nis-ink)] prose-blockquote:bg-[color:var(--color-nis-white)] prose-blockquote:px-5 prose-blockquote:py-5 prose-blockquote:font-sans prose-blockquote:text-[1rem] prose-blockquote:font-medium prose-blockquote:leading-[1.55] prose-blockquote:text-[color:var(--color-nis-ink)]
            prose-strong:font-semibold prose-strong:text-[color:var(--color-nis-ink)]
            prose-code:bg-[color:var(--color-nis-paper)] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
            prose-hr:border-[color:var(--color-nis-soft2)]
            prose-table:text-sm prose-li:text-[color:var(--color-nis-ink)]
            [&_sup_a]:text-[color:var(--color-nis-ink)] hover:[&_sup_a]:text-nis-hover
            [&_section[data-footnotes]]:!hidden
            [&_.footnotes]:!hidden
          "
        >
          {children}
        </article>

        {/* Desktop sidenotes */}
        {sidenotes.length > 0 ? (
          <aside className="hidden nis-wide:block relative" aria-label="Sidenotes">
            {sidenotes.map((note) => {
              const isPinned = pinnedNote === note.id;
              const isHovered = hoveredNote === note.id;
              const isExpanded = isHovered || isPinned;
              return (
                <div
                  key={note.id}
                  onMouseEnter={() => handleSidenoteEnter(note.id)}
                  onMouseLeave={() => handleSidenoteLeave(note.id)}
                  onClick={() => handleSidenoteClick(note)}
                  data-sidenote-card="true"
                  className={`
                    text-[13px] leading-[1.55] transition-all duration-200 ease-out cursor-default
                    ${isExpanded
                      ? `absolute z-40 w-[calc(100%-0.25rem)] -translate-x-[2px] -translate-y-[2px] border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] px-4 py-3 ${isPinned && !isHovered ? 'shadow-[6px_6px_0_0_var(--color-nis-ink)]' : 'shadow-[6px_6px_0_0_var(--color-nis-accent)]'}`
                      : 'absolute z-10 w-3 border-0 bg-transparent px-0 py-0 shadow-none'
                    }
                  `}
                  style={{
                    top: `${note.adjustedTop}px`,
                    maxHeight: isExpanded ? '800px' : `${COLLAPSED_HEIGHT}px`,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'h-0 opacity-0' : 'h-[56px] opacity-100'}`}
                    aria-hidden={isExpanded}
                  >
                    <TexturedRail
                      className="mx-auto h-[56px] w-[6px]"
                      color="rgba(0, 0, 60, 0.24)"
                    />
                  </div>
                  <div className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-sans text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--color-nis-ink)]">
                        {note.number}.
                      </span>
                      {isPinned && !isHovered && (
                        <span
                          className="inline-flex items-center rounded-full bg-[color:var(--color-nis-ink)] px-2 py-1 text-[color:var(--color-nis-bg)]"
                          aria-label="Pinned"
                        >
                          <Pin className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    {note.noteHtml && (
                      <span
                        dangerouslySetInnerHTML={{ __html: note.noteHtml }}
                        className="[&_a]:font-bold [&_a]:text-nis-hover [&_a]:no-underline [&_a:hover]:underline [&_p]:text-nis-muted"
                      />
                    )}
                    {note.sourcesHtml && (
                      <div className={note.noteHtml ? 'mt-2.5 border-t border-[color:var(--color-nis-soft2)] pt-2' : ''}>
                        <div className="mb-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-nis-muted">
                          Sources
                        </div>
                        <div
                          dangerouslySetInnerHTML={{ __html: note.sourcesHtml }}
                          className="text-[12px] leading-[1.5] text-nis-muted [&_ul]:m-0 [&_ul]:list-none [&_ul]:p-0 [&_li]:m-0 [&_li]:mb-1.5 [&_li]:p-0 [&_p]:m-0 [&_a]:font-bold [&_a]:text-nis-hover [&_a]:no-underline [&_a:hover]:underline [&_a]:whitespace-nowrap"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </aside>
        ) : (
          <aside className="hidden nis-wide:block relative" aria-label="Sidenotes"></aside>
        )}
      </div>

      {/* Mobile bottom drawer for pinned note */}
      {mobilePinnedNote && (
        <div
          className="fixed inset-0 z-[120] flex items-end bg-[color:var(--color-nis-ink)]/40 nis-wide:hidden"
          onClick={() => {
            setPinnedNote(null);
            setHoveredNote(null);
          }}
        >
          <div
            className="max-h-[88vh] w-full overflow-hidden border-t border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] shadow-[0_-6px_0_0_var(--color-nis-accent)]"
            onClick={(event) => event.stopPropagation()}
            data-sidenote-card="true"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[color:var(--color-nis-ink)] px-5 py-4">
              <span className="font-sans text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--color-nis-ink)]">
                {mobilePinnedNote.number}.
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center rounded-full bg-[color:var(--color-nis-ink)] px-2 py-1 text-[color:var(--color-nis-bg)]"
                  aria-label="Pinned"
                >
                  <Pin className="h-3 w-3" />
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPinnedNote(null);
                    setHoveredNote(null);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-nis-ink)] text-[color:var(--color-nis-ink)] transition-colors hover:border-nis-hover hover:text-nis-hover"
                  aria-label="Close reference"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              {mobilePinnedNote.noteHtml && (
                <span
                  dangerouslySetInnerHTML={{ __html: mobilePinnedNote.noteHtml }}
                  className="text-[13px] leading-[1.55] [&_a]:font-bold [&_a]:text-nis-hover [&_a]:no-underline [&_a:hover]:underline [&_p]:text-[color:var(--color-nis-ink)]"
                />
              )}
              {mobilePinnedNote.sourcesHtml && (
                <div className={mobilePinnedNote.noteHtml ? 'mt-3 border-t border-[color:var(--color-nis-soft2)] pt-2.5' : ''}>
                  <div className="mb-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-nis-muted">
                    Sources
                  </div>
                  <div
                    dangerouslySetInnerHTML={{ __html: mobilePinnedNote.sourcesHtml }}
                    className="text-[12px] leading-[1.5] text-nis-muted [&_ul]:m-0 [&_ul]:list-none [&_ul]:p-0 [&_li]:m-0 [&_li]:mb-1.5 [&_li]:p-0 [&_p]:m-0 [&_a]:font-bold [&_a]:text-nis-hover [&_a]:no-underline [&_a:hover]:underline [&_a]:whitespace-nowrap"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
