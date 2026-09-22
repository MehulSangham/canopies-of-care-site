'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PanelFrame } from '@/lib/meta-panel';
import {
  ROLE_GLYPHS,
  ROLE_SHORT_LABELS,
  STANCE_TEXT_COLORS,
  normalizeForMatch,
} from '@/lib/taxonomy-glyphs';
import { useEditModeOptional } from '@/components/edit/EditModeProvider';

/** Event the MetaPanel dispatches to scroll to an anchored passage. */
export const XRAY_SCROLL_EVENT = 'nis-xray-scroll';

interface MarkerSpot {
  key: string;
  top: number;
  left: number;
  glyph: string;
  color: string;
  title: string;
  el: HTMLElement;
}

function flash(el: HTMLElement) {
  el.style.transition = 'background-color 0.4s ease';
  el.style.backgroundColor = 'var(--color-nis-accent-soft)';
  window.setTimeout(() => {
    el.style.backgroundColor = '';
  }, 1400);
}

/**
 * Margin notation for the public page: for every block-level anchor in the
 * derived x-ray, finds the rendered passage (by normalized excerpt — the
 * same recovery idea the editor uses), stamps a stable `data-xray-block`,
 * and draws the role glyph in the article margin. Clicking a glyph flashes
 * the passage; the MetaPanel's anchor links scroll here via a custom event.
 *
 * Hidden in edit mode — the editor has its own rail.
 */
export function XrayMarkers({ frames }: { frames: PanelFrame[] }) {
  const edit = useEditModeOptional();
  const [spots, setSpots] = useState<MarkerSpot[]>([]);
  const [ready, setReady] = useState(false);

  const locate = useCallback(() => {
    const article = document.querySelector<HTMLElement>('main article');
    if (!article) return;
    const elements = Array.from(article.children) as HTMLElement[];
    const normalized = elements.map((el) => normalizeForMatch(el.textContent ?? ''));

    const found: MarkerSpot[] = [];
    for (const frame of frames) {
      for (const anchor of frame.anchors ?? []) {
        const needle = normalizeForMatch(anchor.excerpt);
        if (!needle) continue;
        const idx = normalized.findIndex(
          (t) => t && (t.startsWith(needle.slice(0, 40)) || t.includes(needle.slice(0, 32))),
        );
        if (idx === -1) continue;
        const el = elements[idx];
        el.dataset.xrayBlock = anchor.blockId;
        const rect = el.getBoundingClientRect();
        found.push({
          key: `${frame.name}-${anchor.blockId}`,
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          glyph: frame.role ? ROLE_GLYPHS[frame.role] : '▲',
          color: frame.stance ? STANCE_TEXT_COLORS[frame.stance] : 'currentColor',
          title: `${frame.name} — ${frame.role ? ROLE_SHORT_LABELS[frame.role] : ''}`,
          el,
        });
      }
    }
    setSpots(found);
    setReady(true);
  }, [frames]);

  useEffect(() => {
    // Wait a beat for hydration/layout, then locate; re-locate on resize.
    const t = window.setTimeout(locate, 400);
    const onResize = () => locate();
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, [locate]);

  // MetaPanel anchor links scroll to a marked passage
  useEffect(() => {
    const onScrollTo = (e: Event) => {
      const { excerpt } = (e as CustomEvent<{ excerpt: string }>).detail ?? {};
      if (!excerpt) return;
      const needle = normalizeForMatch(excerpt);
      const article = document.querySelector<HTMLElement>('main article');
      if (!article) return;
      const el = (Array.from(article.children) as HTMLElement[]).find((c) =>
        normalizeForMatch(c.textContent ?? '').startsWith(needle.slice(0, 40)),
      );
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      flash(el);
    };
    window.addEventListener(XRAY_SCROLL_EVENT, onScrollTo);
    return () => window.removeEventListener(XRAY_SCROLL_EVENT, onScrollTo);
  }, []);

  if (edit?.isEditMode || !ready || spots.length === 0) return null;

  return createPortal(
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {spots.map((s) => (
        <button
          key={s.key}
          type="button"
          title={s.title}
          onClick={() => {
            s.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            flash(s.el);
          }}
          className="pointer-events-auto absolute -translate-x-full cursor-pointer bg-transparent pr-3 font-mono text-[13px] leading-none opacity-60 transition-opacity hover:opacity-100"
          style={{ top: s.top + 4, left: s.left, color: s.color }}
          data-xray-marker
        >
          {s.glyph}
        </button>
      ))}
    </div>,
    document.body,
  );
}
