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
  url: string;
  words: WordTiming[];
  text: string;
}

const SPEEDS = [1, 1.25, 1.5];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function base64ToUrl(b64: string): string {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
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
  const [activeWord, setActiveWord] = useState(-1);
  const [words, setWords] = useState<WordTiming[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<number, LoadedSegment>>(new Map());
  const highlightedRef = useRef<Element | null>(null);
  const wordsRef = useRef<WordTiming[]>([]);
  const currentRef = useRef(0);
  const segmentsRef = useRef<ManifestSegment[]>([]);
  const activeWordElRef = useRef<HTMLSpanElement | null>(null);

  const clearHighlight = useCallback(() => {
    highlightedRef.current?.classList.remove('reader-active-block');
    highlightedRef.current = null;
  }, []);

  const highlightSegment = useCallback(
    (index: number) => {
      clearHighlight();
      const seg = segmentsRef.current[index];
      if (!seg || seg.kind === 'title') return;
      const article = document.querySelector('article');
      if (!article) return;
      const prefix = normalize(seg.text).slice(0, 50);
      const candidates = article.querySelectorAll('p, h2, h3, h4, blockquote');
      for (const el of candidates) {
        if (normalize(el.textContent || '').startsWith(prefix)) {
          el.classList.add('reader-active-block');
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          highlightedRef.current = el;
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
        url: base64ToUrl(data.audioBase64),
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
      setActiveWord(-1);
      const seg = await fetchSegment(index);
      setLoading(false);
      if (!seg || currentRef.current !== index) return;
      wordsRef.current = seg.words;
      setWords(seg.words);
      highlightSegment(index);
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

  // Audio element lifecycle
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
      setActiveWord(idx);
    };
    const onEnded = () => {
      const next = currentRef.current + 1;
      if (next < segmentsRef.current.length) {
        void playSegment(next);
      } else {
        setPlaying(false);
        setActiveWord(-1);
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

  // Keep the active word visible inside the transcript strip
  useEffect(() => {
    activeWordElRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeWord]);

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
    setActiveWord(-1);
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

  const segText = words.length > 0 ? null : segments[current]?.text;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] border-t border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] shadow-[0_-4px_0_0_var(--color-nis-accent)]">
      <div className="mx-auto flex max-w-[900px] items-center gap-4 px-4 py-3">
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

        {/* Transcript with karaoke highlight */}
        <div className="min-w-0 flex-1">
          {error ? (
            <p className="font-sans text-[12px] text-red-700">{error}</p>
          ) : (
            <div className="max-h-[72px] overflow-y-auto font-serif text-[14px] leading-relaxed text-[color:var(--color-nis-ink)]">
              {words.length > 0
                ? words.map((w, i) => (
                    <span
                      key={i}
                      ref={i === activeWord ? activeWordElRef : undefined}
                      className={
                        i === activeWord
                          ? 'bg-[color:var(--color-nis-accent)] text-[color:var(--color-nis-ink)]'
                          : i < activeWord
                            ? 'text-nis-muted'
                            : undefined
                      }
                    >
                      {w.word}{' '}
                    </span>
                  ))
                : segText}
            </div>
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
