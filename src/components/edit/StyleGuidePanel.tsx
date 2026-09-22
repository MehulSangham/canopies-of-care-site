'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Pencil } from 'lucide-react';
import { loadStyleGuide, saveStyleGuide } from '@/app/actions/style-guide';

/**
 * Slide-over for viewing and editing CONTENT_STYLE.md without leaving the
 * editor. The same file is injected into every AI assistant conversation,
 * so saving here changes what the assistant enforces from the next request.
 */
export function StyleGuidePanel({ onClose }: { onClose: () => void }) {
  const [content, setContent] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStyleGuide()
      .then(setContent)
      .catch(() => setError('Could not load the style guide.'));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Both this and the expanded editor listen on window, so stop the
        // event entirely or Escape would close both at once.
        e.stopImmediatePropagation();
        onClose();
      }
    };
    // Capture phase so this handler runs before the expanded editor's
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onClose]);

  const startEditing = useCallback(() => {
    setDraft(content ?? '');
    setEditing(true);
  }, [content]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await saveStyleGuide(draft);
      setContent(draft.trimEnd() + '\n');
      setEditing(false);
    } catch {
      setError('Save failed.');
    } finally {
      setSaving(false);
    }
  }, [draft]);

  return createPortal(
    <div data-overlay="style-guide" className="fixed inset-0 z-[240] flex justify-end">
      <div className="absolute inset-0 bg-[color:var(--color-nis-ink)]/20" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-[680px] flex-col border-l border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-white)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[color:var(--color-nis-soft)] px-6 py-3 shrink-0">
          <div className="flex items-baseline gap-3">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
              Style guide
            </span>
            <span className="font-mono text-[9px] text-nis-muted">
              CONTENT_STYLE.md · also read by the assistant
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!editing && content !== null && (
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-nis-muted transition-colors hover:text-[color:var(--color-nis-ink)]"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-nis-muted transition-colors hover:text-[color:var(--color-nis-ink)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {content === null && !error && (
            <p className="inline-flex items-center gap-1.5 px-6 py-4 font-sans text-[11px] text-nis-muted">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading…
            </p>
          )}
          {error && <p className="px-6 py-4 font-sans text-[11px] text-red-700">{error}</p>}
          {content !== null && !editing && (
            <pre className="whitespace-pre-wrap px-6 py-5 font-mono text-[12px] leading-[1.7] text-[color:var(--color-nis-ink)]">
              {content}
            </pre>
          )}
          {editing && (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck
              className="h-full w-full resize-none border-0 bg-transparent px-6 py-5 font-mono text-[12px] leading-[1.7] text-[color:var(--color-nis-ink)] outline-none"
            />
          )}
        </div>

        {/* Footer (edit mode only) */}
        {editing && (
          <div className="flex items-center justify-between border-t border-[color:var(--color-nis-soft)] px-6 py-2.5 shrink-0">
            <span className="font-mono text-[10px] text-nis-muted">
              Saving updates the assistant's rules immediately
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-[11px] font-bold text-nis-muted transition-colors hover:text-[color:var(--color-nis-ink)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="px-4 py-1.5 text-[11px] font-bold bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)] transition-colors hover:bg-[color:var(--color-nis-hover)] disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
