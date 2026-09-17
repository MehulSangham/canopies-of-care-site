'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TexturedDot, TexturedRail } from './TexturedRail';

interface TocItem {
  id: string;
  text: string;
  level: number;
  logicPercentTop: number;
  percentTop: number;
}

interface PageTableOfContentsProps {
  title: string;
}

export function PageTableOfContents({ title }: PageTableOfContentsProps) {
  const TITLE_DOT_INSET_PERCENT = 2.5;
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const pathname = usePathname();
  const titleAnchorId = 'page-title-anchor';
  const reachOffsetRef = useRef(55);
  const firstReachScrollRef = useRef(0);

  const getReachOffset = () => {
    const contextBar = document.querySelector('[data-context-bar]') as HTMLElement | null;
    return Math.max(0, contextBar?.getBoundingClientRect().height ?? 55);
  };

  const getAnchoredScrollTop = (element: HTMLElement) => {
    const scrollRange = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const absoluteTop = element.getBoundingClientRect().top + window.scrollY;
    return Math.min(scrollRange, Math.max(0, absoluteTop - reachOffsetRef.current));
  };

  const getTrackDimensions = () => {
    const remainingTrackPercent = 100 - TITLE_DOT_INSET_PERCENT;
    return {
      top: `${TITLE_DOT_INSET_PERCENT}%`,
      height: `${remainingTrackPercent}%`,
      remainingTrackPercent,
    };
  };

  const getRenderedPercentTop = (item: TocItem) => {
    const { remainingTrackPercent } = getTrackDimensions();
    return TITLE_DOT_INSET_PERCENT + (item.percentTop * remainingTrackPercent) / 100;
  };

  const getRenderedFillStyle = () => {
    const { remainingTrackPercent } = getTrackDimensions();
    return {
      top: `${TITLE_DOT_INSET_PERCENT}%`,
      height: `${(remainingTrackPercent * scrollPercent) / 100}%`,
    };
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollRange <= 0) {
        setScrollPercent(0);
        setActiveId(items[0]?.id ?? '');
        return;
      }
      reachOffsetRef.current = getReachOffset();
      const adjustedRange = Math.max(1, scrollRange - firstReachScrollRef.current);
      const adjustedScroll = Math.max(0, window.scrollY - firstReachScrollRef.current);
      const percent = Math.min(100, Math.max(0, (adjustedScroll / adjustedRange) * 100));
      setScrollPercent(percent);

      if (items.length > 0) {
        const currentItem = [...items]
          .reverse()
          .find((item) => percent >= item.logicPercentTop - 0.1) ?? items[0];
        setActiveId(currentItem.id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    setTimeout(handleScroll, 100);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [items, pathname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const titleElement = document.querySelector('.nis-header-frame__title') as HTMLElement | null;

      if (titleElement && !titleElement.id) {
        titleElement.id = titleAnchorId;
      }

      const contentElements = Array.from(
        document.querySelectorAll('article h2, article h3, article h4')
      ).filter((elem) => {
        if (!(elem instanceof HTMLElement)) return false;
        return !elem.hasAttribute('data-toc-skip');
      }) as HTMLElement[];

      const elements = [titleElement, ...contentElements].filter(
        (elem): elem is HTMLElement => Boolean(elem)
      );

      const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const reachOffset = getReachOffset();
      reachOffsetRef.current = reachOffset;
      const titleAbsoluteTop = titleElement
        ? titleElement.getBoundingClientRect().top + window.scrollY
        : 0;
      const firstReachScroll = Math.max(0, titleAbsoluteTop - reachOffset);
      firstReachScrollRef.current = firstReachScroll;
      const adjustedRange = Math.max(1, scrollRange - firstReachScroll);
      const adjustedScroll = Math.max(0, window.scrollY - firstReachScroll);
      setScrollPercent(
        Math.min(100, Math.max(0, (adjustedScroll / adjustedRange) * 100))
      );

      let currentHeadingLevel = 2;
      const tocItems = elements
        .map((elem) => {
          if (!elem.id) {
            elem.id = `toc-${Math.random().toString(36).substr(2, 9)}`;
          }

          let text = '';
          let level = 2;
          let logicPercentTop = 0;

          if (elem.id === titleAnchorId) {
            text = title;
            level = 1;
            logicPercentTop = 0;
          } else if (elem.tagName === 'H2') {
            text = elem.textContent || '';
            level = 2;
            currentHeadingLevel = 2;
          } else if (elem.tagName === 'H3') {
            text = elem.textContent || '';
            level = 3;
            currentHeadingLevel = 3;
          } else if (elem.tagName === 'H4') {
            text = elem.textContent || '';
            level = 4;
            currentHeadingLevel = 4;
          }

          if (elem.id !== titleAnchorId) {
            const rect = elem.getBoundingClientRect();
            const absoluteTop = rect.top + window.scrollY;
            const anchoredTop = Math.max(0, absoluteTop - reachOffset - firstReachScroll);
            logicPercentTop = Math.min(
              100,
              Math.max(0, (anchoredTop / adjustedRange) * 100)
            );
          }

          return { id: elem.id, text: text.trim(), level, logicPercentTop, percentTop: logicPercentTop };
        })
        .filter((item) => {
          if (!item.text) return false;
          if (item.text.toLowerCase() === 'footnotes') return false;
          return true;
        });

      // Enforce minimum visual gap to prevent overlap
      const MIN_GAP_PERCENT = 3.5;
      for (let i = 1; i < tocItems.length; i++) {
        if (tocItems[i].percentTop < tocItems[i - 1].percentTop + MIN_GAP_PERCENT) {
          tocItems[i].percentTop = tocItems[i - 1].percentTop + MIN_GAP_PERCENT;
        }
      }
      if (tocItems.length > 0 && tocItems[tocItems.length - 1].percentTop > 98) {
        const shift = tocItems[tocItems.length - 1].percentTop - 98;
        for (let i = tocItems.length - 1; i >= 0; i--) {
          tocItems[i].percentTop -= shift;
          if (
            i < tocItems.length - 1 &&
            tocItems[i].percentTop > tocItems[i + 1].percentTop - MIN_GAP_PERCENT
          ) {
            tocItems[i].percentTop = Math.max(
              0,
              tocItems[i + 1].percentTop - MIN_GAP_PERCENT
            );
          }
        }
      }

      setItems(tocItems);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, title]);

  if (items.length === 0) return null;

  return (
    <nav className="group pointer-events-auto relative h-full w-28 overflow-visible pb-12 transition-all duration-300 ease-in-out flex flex-col">
      <div className="flex-1 relative w-full">
        {/* The line map */}
        <div className="absolute left-0 top-3 bottom-4 w-[6px] overflow-hidden">
          <TexturedRail
            className="absolute inset-x-0 w-full"
            color="rgba(0, 0, 60, 0.16)"
            style={getTrackDimensions()}
          />
          <TexturedRail
            className="absolute inset-x-0 w-full transition-all duration-75"
            color="var(--color-nis-deep-forest)"
            style={getRenderedFillStyle()}
          />
        </div>
        {/* The dots */}
        <div className="absolute left-0 top-3 bottom-4 w-[10px] z-10 pointer-events-none">
          {items.map((item) => {
            const renderedTop = getRenderedPercentTop(item);
            return (
              <TexturedDot
                key={`dot-${item.id}`}
                className={`absolute left-0 h-2 w-2 transition-opacity duration-200 ${
                  activeId === item.id ? 'opacity-100' : 'opacity-72'
                }`}
                color={
                  activeId === item.id
                    ? 'var(--color-nis-ink)'
                    : 'rgba(0, 0, 60, 0.35)'
                }
                shadowColor={
                  activeId === item.id ? 'rgba(246,243,234,1)' : 'transparent'
                }
                style={{
                  top: `${renderedTop}%`,
                  transform: 'translate(-1px, -50%)',
                }}
              />
            );
          })}
        </div>

        {/* The labels (visible on hover) */}
        <div className="pl-6 absolute left-0 top-3 bottom-4 w-[224px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
          <div className="relative w-full h-full">
            {items.map((item) => {
              const renderedTop = getRenderedPercentTop(item);
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const target = document.querySelector(
                      `#${item.id}`
                    ) as HTMLElement | null;
                    if (!target) return;
                    window.scrollTo({
                      top: getAnchoredScrollTop(target),
                      behavior: 'smooth',
                    });
                  }}
                  className={`absolute left-0 w-[200px] text-[11px] leading-[1.2] font-sans transition-all duration-200 py-0.5 pr-4 truncate ${
                    item.level === 1 ? 'text-sm font-bold' : ''
                  } ${
                    item.level === 3
                      ? 'pl-4'
                      : item.level >= 4
                        ? 'pl-8'
                        : ''
                  } ${
                    activeId === item.id
                      ? 'font-bold text-[color:var(--color-nis-ink)] opacity-100'
                      : 'text-nis-muted hover:text-nis-hover opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    top: `${renderedTop}%`,
                    transform: 'translateY(-50%)',
                  }}
                  title={item.text}
                >
                  <span className="truncate">{item.text}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
