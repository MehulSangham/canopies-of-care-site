'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Headphones,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Loader2,
} from 'lucide-react';
import { useEditModeOptional } from '@/components/edit/EditModeProvider';

interface WordTiming {
  word: string;
  charStart: number;
  start: number;
  end: number;
}

interface ManifestSegment {
  index: number;
  kind: 'title' | 'heading' | 'paragraph' | 'blockquote';
  text: string;
}

interface LoadedSegment {
  /** Audio source: a remote (Blob store) URL or a local object URL */
  url: string;
  words: WordTiming[];
  text: string;
}

const SPEEDS = [1, 1.25, 1.5];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Normalize a single token for word-level alignment. */
function normToken(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function base64ToUrl(b64: string): string {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
}

/**
 * Wrap the words of a block element in spans, leaving all element nodes
 * (bold, links, footnote sups) untouched so React-managed children keep
 * their listeners. Returns the spans in document order.
 */
function wrapWords(el: Element): HTMLSpanElement[] {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      // Skip footnote markers and anything already inside our own spans
      if ((node.parentElement)?.closest('sup, .reader-w')) {
        return NodeFilter.FILTER_REJECT;
      }
      return /\S/.test(node.textContent || '')
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  const spans: HTMLSpanElement[] = [];
  for (const node of textNodes) {
    const parts = (node.textContent || '').split(/(\s+)/);
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
      } else {
        const span = document.createElement('span');
        span.className = 'reader-w';
        span.textContent = part;
        frag.appendChild(span);
        spans.push(span);
      }
    }
    node.replaceWith(frag);
  }
  return spans;
}

/** Undo wrapWords: replace each span with its text and re-merge text nodes. */
function unwrapWords(el: Element, spans: HTMLSpanElement[]) {
  for (const span of spans) {
    if (span.isConnected) {
      span.replaceWith(document.createTextNode(span.textContent || ''));
    }
  }
  el.normalize();
}

/**
 * Align timing words to DOM word spans with a greedy two-pointer walk.
 * Small mismatches (tokens present on only one side) are skipped with a
 * bounded lookahead.
 */
function alignTimings(
  words: WordTiming[],
  spans: HTMLSpanElement[],
): (HTMLSpanElement | null)[] {
  const map: (HTMLSpanElement | null)[] = new Array(words.length).fill(null);
  let si = 0;
  for (let wi = 0; wi < words.length; wi++) {
    const target = normToken(words[wi].word);
    if (!target) continue;
    let found = -1;
    for (let k = si; k < Math.min(si + 4, spans.length); k++) {
      if (normToken(spans[k].textContent || '') === target) {
        found = k;
        break;
      }
    }
    if (found >= 0) {
      map[wi] = spans[found];
      si = found + 1;
    }
  }
  return map;
}

export function PageReader({ slug }: { slug: string }) {
  const editCtx = useEditModeOptional();
  const [open, setOpen] = useState(false);
  const [segments, setSegments] = useState<ManifestSegment[]>([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speedIdx, setSpeedIdx] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<number, LoadedSegment>>(new Map());
  const wordsRef = useRef<WordTiming[]>([]);
  const currentRef = useRef(0);
  const segmentsRef = useRef<ManifestSegment[]>([]);

  // In-page karaoke state (all direct DOM, no React re-renders per word)
  const blockRef = useRef<Element | null>(null);
  const spansRef = useRef<HTMLSpanElement[]>([]);
  const timingMapRef = useRef<(HTMLSpanElement | null)[]>([]);
  const activeSpanRef = useRef<HTMLSpanElement | null>(null);
  const lastScrollAtRef = useRef(0);

  const clearHighlight = useCallback(() => {
    activeSpanRef.current?.classList.remove('reader-word-active');
    activeSpanRef.current = null;
    if (blockRef.current) {
      blockRef.current.classList.remove('reader-active-block');
      unwrapWords(blockRef.current, spansRef.current);
    }
    blockRef.current = null;
    spansRef.current = [];
    timingMapRef.current = [];
  }, []);

  /**
   * Find the block on the page for a segment, tint it, wrap its words,
   * and align the word timings to the wrapped spans.
   */
  const highlightSegment = useCallback(
    (index: number, words: WordTiming[]) => {
      clearHighlight();
      const seg = segmentsRef.current[index];
      if (!seg || seg.kind === 'title') return;
      const article = document.querySelector('article');
      if (!article) return;
      const prefix = normalize(seg.text).slice(0, 60);
      const candidates = article.querySelectorAll('p, h2, h3, h4, blockquote');
      for (const el of candidates) {
        if (normalize(el.textContent || '').startsWith(prefix)) {
          el.classList.add('reader-active-block');
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          blockRef.current = el;
          spansRef.current = wrapWords(el);
          timingMapRef.current = alignTimings(words, spansRef.current);
          return;
        }
      }
    },
    [clearHighlight],
  );

  const fetchSegment = useCallback(
    async (index: number): Promise<LoadedSegment | null> => {
      const cached = cacheRef.current.get(index);
      if (cached) return cached;
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, index }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? 'Audio failed');
        return null;
      }
      const loaded: LoadedSegment = {
        url: data.audioUrl ?? base64ToUrl(data.audioBase64),
        words: data.words ?? [],
        text: data.text,
      };
      cacheRef.current.set(index, loaded);
      return loaded;
    },
    [slug],
  );

  const playSegment = useCallback(
    async (index: number) => {
      const audio = audioRef.current;
      if (!audio || index < 0 || index >= segmentsRef.current.length) return;
      setLoading(true);
      setError(null);
      setCurrent(index);
      currentRef.current = index;
      const seg = await fetchSegment(index);
      setLoading(false);
      if (!seg || currentRef.current !== index) return;
      wordsRef.current = seg.words;
      highlightSegment(index, seg.words);
      audio.src = seg.url;
      audio.playbackRate = SPEEDS[speedIdx];
      try {
        await audio.play();
        setPlaying(true);
        // Prefetch the next segment while this one plays
        if (index + 1 < segmentsRef.current.length) void fetchSegment(index + 1);
      } catch {
        setPlaying(false);
      }
    },
    [fetchSegment, highlightSegment, speedIdx],
  );

  // Audio element lifecycle: drive the in-page highlight from timeupdate
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTime = () => {
      const t = audio.currentTime;
      const ws = wordsRef.current;
      let idx = -1;
      for (let i = 0; i < ws.length; i++) {
        if (t >= ws[i].start) idx = i;
        else break;
      }
      if (idx < 0) return;
      // Nearest mapped span at or before the active timing word
      const map = timingMapRef.current;
      let span: HTMLSpanElement | null = null;
      for (let i = idx; i >= 0 && !span; i--) span = map[i];
      if (!span || span === activeSpanRef.current) return;
      activeSpanRef.current?.classList.remove('reader-word-active');
      span.classList.add('reader-word-active');
      activeSpanRef.current = span;
      // Keep the reading position on screen without constant scrolling
      const now = Date.now();
      if (now - lastScrollAtRef.current > 400) {
        const rect = span.getBoundingClientRect();
        if (rect.top < 90 || rect.bottom > window.innerHeight - 130) {
          span.scrollIntoView({ behavior: 'smooth', block: 'center' });
          lastScrollAtRef.current = now;
        }
      }
    };
    const onEnded = () => {
      const next = currentRef.current + 1;
      if (next < segmentsRef.current.length) {
        void playSegment(next);
      } else {
        setPlaying(false);
        clearHighlight();
      }
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, [playSegment, clearHighlight]);

  const start = useCallback(async () => {
    setOpen(true);
    setError(null);
    if (segmentsRef.current.length === 0) {
      setLoading(true);
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ slug }),
        });
        const data = await res.json();
        if (!data.ok) {
          setError(data.error ?? 'Could not load page audio');
          setLoading(false);
          return;
        }
        segmentsRef.current = data.segments;
        setSegments(data.segments);
      } catch {
        setError('Network error');
        setLoading(false);
        return;
      }
    }
    void playSegment(0);
  }, [slug, playSegment]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else if (audio.src) {
      void audio.play().then(() => setPlaying(true));
    } else {
      void playSegment(currentRef.current);
    }
  }, [playing, playSegment]);

  const close = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
    setOpen(false);
    clearHighlight();
  }, [clearHighlight]);

  const cycleSpeed = useCallback(() => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  }, [speedIdx]);

  // Hide while editing — the edit UI owns the page
  if (editCtx?.isEditMode) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={start}
        title="Listen to this page"
        aria-label="Listen to this page"
        className="fixed bottom-6 left-6 z-[70] inline-flex h-11 w-11 items-center justify-center border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] text-[color:var(--color-nis-ink)] shadow-[3px_3px_0_0_var(--color-nis-accent)] transition-colors hover:bg-[color:var(--color-nis-accent-soft)]"
      >
        <Headphones className="h-5 w-5" />
      </button>
    );
  }

  const kind = segments[current]?.kind;
  const status = error
    ? null
    : loading
      ? 'Preparing audio…'
      : kind === 'title'
        ? 'Reading the title'
        : 'Reading along on the page';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] border-t border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] shadow-[0_-4px_0_0_var(--color-nis-accent)]">
      <div className="mx-auto flex max-w-[700px] items-center gap-4 px-4 py-2.5">
        {/* Controls */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => void playSegment(Math.max(0, current - 1))}
            disabled={current === 0 || loading}
            aria-label="Previous paragraph"
            className="inline-flex h-8 w-8 items-center justify-center text-[color:var(--color-nis-ink)] transition-opacity hover:bg-[color:var(--color-nis-accent-soft)] disabled:opacity-30"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            disabled={loading}
            aria-label={playing ? 'Pause' : 'Play'}
            className="inline-flex h-9 w-9 items-center justify-center border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)] disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => void playSegment(current + 1)}
            disabled={current >= segments.length - 1 || loading}
            aria-label="Next paragraph"
            className="inline-flex h-8 w-8 items-center justify-center text-[color:var(--color-nis-ink)] transition-opacity hover:bg-[color:var(--color-nis-accent-soft)] disabled:opacity-30"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Status — the page itself is the transcript */}
        <div className="min-w-0 flex-1">
          {error ? (
            <p className="truncate font-sans text-[12px] text-red-700">{error}</p>
          ) : (
            <p className="truncate font-sans text-[11px] uppercase tracking-[0.12em] text-nis-muted">
              {status}
            </p>
          )}
        </div>

        {/* Meta + speed + close */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-[10px] text-nis-muted">
            {segments.length > 0 ? `${current + 1}/${segments.length}` : '…'}
          </span>
          <button
            type="button"
            onClick={cycleSpeed}
            aria-label="Playback speed"
            className="border border-[color:var(--color-nis-soft)] px-2 py-1 font-mono text-[10px] font-bold text-[color:var(--color-nis-ink)] hover:border-[color:var(--color-nis-ink)]"
          >
            {SPEEDS[speedIdx]}×
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Close reader"
            className="inline-flex h-8 w-8 items-center justify-center text-nis-muted hover:text-[color:var(--color-nis-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
