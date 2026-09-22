'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Loader2, Send, X, Check, Ban } from 'lucide-react';
import { useBlocks } from './BlocksContext';
import { useEditModeOptional } from './EditModeProvider';
import { BlockEditor } from './BlockEditor';
import { BlockPreview } from './BlockPreview';
import { AddBlockButton } from './AddBlockMenu';
import { ChatMarkdown } from './ChatMarkdown';
import { ChatTurn } from './ChatTurn';
import {
  AI_MODELS,
  DEFAULT_MODEL_ID,
  isValidModelId,
  MODEL_STORAGE_KEY,
  type AiModelId,
} from '@/lib/ai/models';

interface PageChange {
  blockId: string;
  op: 'replace' | 'insert_after' | 'delete';
  newMarkdown?: string;
  rationale: string;
}

type ChangeStatus = 'pending' | 'accepted' | 'rejected';

interface ReviewChange extends PageChange {
  /** Snapshot of the block text at proposal time, for the diff display */
  oldRaw: string;
  status: ChangeStatus;
}

interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
  steps?: string[];
  /** Summary line when this reply carried a proposal */
  proposalSummary?: string;
  proposalCount?: number;
}

/** Serialize an entry back into plain text for the model's history. */
function entryToContent(e: ChatEntry): string {
  if (!e.proposalSummary) return e.content;
  return [e.content, `[Proposed ${e.proposalCount} change(s)] ${e.proposalSummary}`]
    .filter(Boolean)
    .join('\n');
}

export function PageAssistant({ onClose }: { onClose: () => void }) {
  const ctx = useBlocks();
  const editCtx = useEditModeOptional();
  const slug = editCtx?.slug ?? '';

  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<ReviewChange[]>([]);
  const [modelId, setModelId] = useState<AiModelId>(DEFAULT_MODEL_ID);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (isValidModelId(stored)) setModelId(stored);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const pendingCount = changes.filter((c) => c.status === 'pending').length;

  const requestClose = useCallback(() => {
    if (pendingCount > 0) {
      const confirmed = window.confirm(
        `${pendingCount} proposed change${pendingCount === 1 ? '' : 's'} still pending. Close without reviewing them?`,
      );
      if (!confirmed) return;
    }
    onClose();
  }, [onClose, pendingCount]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Nested overlays (expanded block, style guide) and in-progress
      // typing handle Escape themselves; do not close the page editor.
      if (document.querySelector('[data-overlay]')) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest('textarea, input, [contenteditable="true"]')) return;
      e.preventDefault();
      requestClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [requestClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [entries, loading]);

  const changeModel = (id: AiModelId) => {
    setModelId(id);
    window.localStorage.setItem(MODEL_STORAGE_KEY, id);
  };

  const send = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    if (pendingCount > 0) {
      const confirmed = window.confirm(
        `${pendingCount} proposed change${pendingCount === 1 ? '' : 's'} still pending. A new request will replace them.`,
      );
      if (!confirmed) return;
    }
    setError(null);
    setInput('');
    const history = [...entries, { role: 'user' as const, content: trimmed }];
    setEntries([...history, { role: 'assistant', content: '' }]);
    setLoading(true);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'page',
          stream: true,
          slug,
          modelId,
          blocks: ctx.blocks.map((b) => ({ id: b.id, type: b.type, raw: b.raw })),
          messages: history.map((e) => ({ role: e.role, content: entryToContent(e) })),
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Request failed');
        setEntries(history);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let proposal: { kind: 'page'; summary: string; changes: PageChange[] } | null = null;
      let steps: string[] = [];

      const patchAssistant = (partial: Partial<ChatEntry>) => {
        setEntries((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === 'assistant') next[next.length - 1] = { ...last, ...partial };
          return next;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';
        for (const chunk of chunks) {
          const line = chunk.split('\n').find((l) => l.startsWith('data: '));
          if (!line) continue;
          let ev: { type: string; delta?: string; proposal?: typeof proposal; steps?: string[]; error?: string };
          try {
            ev = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (ev.type === 'text' && ev.delta) {
            fullText += ev.delta;
            patchAssistant({ content: fullText });
          } else if (ev.type === 'proposal' && ev.proposal?.kind === 'page') {
            proposal = ev.proposal;
          } else if (ev.type === 'steps' && ev.steps) {
            steps = ev.steps;
          } else if (ev.type === 'error') {
            setError(ev.error ?? 'Request failed');
          }
        }
      }

      patchAssistant({
        content: fullText,
        steps: steps.length ? steps : undefined,
        proposalSummary: proposal?.summary,
        proposalCount: proposal?.changes.length,
      });

      if (proposal?.kind === 'page') {
        const snapshot = ctx.blocks;
        const blockById = new Map(snapshot.map((b) => [b.id, b]));
        setChanges(
          proposal.changes
            .filter((c) => blockById.has(c.blockId))
            .map((c) => ({
              ...c,
              oldRaw: blockById.get(c.blockId)!.raw,
              status: 'pending' as const,
            })),
        );
        setTimeout(() => {
          reviewRef.current
            ?.querySelector('[data-change]')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    } catch {
      setError('Network error — is the dev server running?');
    } finally {
      setLoading(false);
    }
  };

  const blockHasDiverged = useCallback(
    (change: ReviewChange) => {
      if (change.op === 'insert_after') return false;
      const live = ctx.blocks.find((b) => b.id === change.blockId);
      return Boolean(live && live.raw !== change.oldRaw);
    },
    [ctx.blocks],
  );

  const resolveChange = useCallback(
    (index: number, accept: boolean) => {
      const change = changes[index];
      if (!change || change.status !== 'pending') return;
      if (accept) {
        if (blockHasDiverged(change)) {
          const confirmed = window.confirm(
            'You edited this block after the proposal. Accepting will overwrite your edit.',
          );
          if (!confirmed) return;
        }
        ctx.applyPageEdits([
          {
            blockId: change.blockId,
            op: change.op,
            newMarkdown: change.newMarkdown,
          },
        ]);
      }
      setChanges((prev) =>
        prev.map((c, i) =>
          i === index ? { ...c, status: accept ? 'accepted' : 'rejected' } : c,
        ),
      );
    },
    [blockHasDiverged, changes, ctx],
  );

  const acceptAll = useCallback(() => {
    const pending = changes.filter((c) => c.status === 'pending');
    if (pending.length === 0) return;
    const diverged = pending.filter(blockHasDiverged);
    if (diverged.length > 0) {
      const confirmed = window.confirm(
        `You edited ${diverged.length} of these blocks after the proposal. Accepting all will overwrite those edits.`,
      );
      if (!confirmed) return;
    }
    ctx.applyPageEdits(
      pending.map((c) => ({
        blockId: c.blockId,
        op: c.op,
        newMarkdown: c.newMarkdown,
      })),
    );
    setChanges((prev) =>
      prev.map((c) => (c.status === 'pending' ? { ...c, status: 'accepted' as const } : c)),
    );
  }, [blockHasDiverged, changes, ctx]);

  // Index changes by target block for the review column
  const changesByBlock = new Map<string, { change: ReviewChange; index: number }[]>();
  changes.forEach((change, index) => {
    const list = changesByBlock.get(change.blockId) ?? [];
    list.push({ change, index });
    changesByBlock.set(change.blockId, list);
  });
  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-[color:var(--color-nis-white)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[color:var(--color-nis-soft)] px-6 py-3 shrink-0">
        <div className="flex items-baseline gap-3">
          <span className="inline-flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
            <Sparkles className="h-3.5 w-3.5" />
            Page assistant
          </span>
          <span className="font-mono text-[9px] text-nis-muted">{slug}</span>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <>
              <span className="font-mono text-[10px] text-nis-muted">
                {pendingCount} pending change{pendingCount === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={acceptAll}
                className="inline-flex items-center gap-1 bg-[color:var(--color-nis-ink)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--color-nis-bg)] transition-colors hover:bg-[color:var(--color-nis-hover)]"
              >
                <Check className="h-3 w-3" />
                Accept all
              </button>
            </>
          )}
          <button
            type="button"
            onClick={requestClose}
            className="text-nis-muted transition-colors hover:text-[color:var(--color-nis-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Live page — click any unlocked block to edit */}
        <div ref={reviewRef} className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-[760px] px-10 py-6">
            <AddBlockButton onAdd={(raw) => ctx.addBlock(-1, raw)} />
            {ctx.blocks.map((block, index) => {
              const pending = (changesByBlock.get(block.id) ?? []).filter(
                ({ change }) => change.status === 'pending',
              );
              const replaceOrDelete = pending.find(
                ({ change }) => change.op !== 'insert_after',
              );
              const inserts = pending.filter(
                ({ change }) => change.op === 'insert_after',
              );
              return (
                <div key={block.id} data-block-id={block.id}>
                  {replaceOrDelete ? (
                    <ChangeCard
                      change={replaceOrDelete.change}
                      onResolve={(accept) => resolveChange(replaceOrDelete.index, accept)}
                    />
                  ) : (
                    <BlockEditor
                      block={block}
                      rendered={<BlockPreview block={block} />}
                      onUpdate={ctx.updateBlock}
                      onMoveUp={() => ctx.moveUp(index)}
                      onMoveDown={() => ctx.moveDown(index)}
                      onDuplicate={() => ctx.duplicateBlock(index)}
                      onDelete={() => ctx.deleteBlock(index)}
                      isFirst={index === 0}
                      isLast={index === ctx.blocks.length - 1}
                      onFocus={() => ctx.setActiveBlockId(block.id)}
                      isDirty={ctx.dirtyBlockIds.has(block.id)}
                      isFocused={block.id === ctx.activeBlockId}
                    />
                  )}
                  {inserts.map(({ change, index: changeIndex }) => (
                    <ChangeCard
                      key={changeIndex}
                      change={change}
                      onResolve={(accept) => resolveChange(changeIndex, accept)}
                    />
                  ))}
                  <AddBlockButton onAdd={(raw) => ctx.addBlock(index, raw)} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversation rail */}
        <div className="flex w-[420px] shrink-0 min-h-0 flex-col border-l border-[color:var(--color-nis-soft)]">
          <div className="flex items-center gap-1.5 border-b border-[color:var(--color-nis-soft)] px-4 py-2.5 shrink-0">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
              Conversation
            </span>
            <select
              value={modelId}
              onChange={(e) => changeModel(e.target.value as AiModelId)}
              title="Model used for this conversation"
              className="ml-auto max-w-[150px] cursor-pointer appearance-none border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-white)] px-1.5 py-0.5 font-mono text-[9px] text-nis-muted outline-none hover:border-[color:var(--color-nis-ink)] hover:text-[color:var(--color-nis-ink)]"
            >
              {AI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
            {entries.length === 0 && !loading && (
              <p className="font-sans text-[12px] leading-relaxed text-nis-muted">
                The left column is the page — click any block to edit it. Give a
                page-level instruction here and proposed changes lock their
                blocks until you accept or reject them. Nothing is saved until
                you save the page.
              </p>
            )}
            {entries.map((entry, i) => (
              <ChatTurn key={i} role={entry.role}>
                {entry.role === 'user' ? (
                  entry.content
                ) : (
                  <>
                    {entry.steps && (
                      <div className="space-y-0.5">
                        {entry.steps.map((s, j) => (
                          <p key={j} className="font-mono text-[10px] text-nis-muted">
                            {s}
                          </p>
                        ))}
                      </div>
                    )}
                    {entry.content ? (
                      <ChatMarkdown text={entry.content} />
                    ) : loading && i === entries.length - 1 ? (
                      <span className="inline-block h-3 w-1.5 animate-pulse bg-[color:var(--color-nis-ink)]" />
                    ) : null}
                    {entry.proposalSummary && (
                      <p className="font-sans text-[11px] italic text-nis-muted">
                        {entry.proposalCount} change{entry.proposalCount === 1 ? '' : 's'} proposed.
                        {' '}{entry.proposalSummary}
                      </p>
                    )}
                  </>
                )}
              </ChatTurn>
            ))}
            {error && <p className="font-sans text-[11px] text-red-700">{error}</p>}
          </div>

          <div className="shrink-0 px-5 py-3">
            <div className="flex items-end gap-2 border-t border-[color:var(--color-nis-soft)] pt-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Instruct the assistant…"
                rows={2}
                className="min-h-0 w-full resize-none border-0 bg-transparent px-0 py-0.5 font-sans text-[13px] leading-relaxed text-[color:var(--color-nis-ink)] outline-none placeholder:text-nis-muted"
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-[color:var(--color-nis-ink)] transition-opacity disabled:opacity-30"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[color:var(--color-nis-soft)] px-6 py-2.5 shrink-0">
        <span className="font-mono text-[10px] text-nis-muted">
          Click a block to edit · proposals lock that block until you decide · esc close
        </span>
        <button
          type="button"
          onClick={requestClose}
          className="px-4 py-1.5 text-[11px] font-bold bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)] transition-colors hover:bg-[color:var(--color-nis-hover)]"
        >
          Done
        </button>
      </div>
    </div>,
    document.body,
  );
}

/* ─── Review column pieces ─── */

function ChangeCard({
  change,
  onResolve,
}: {
  change: ReviewChange;
  onResolve: (accept: boolean) => void;
}) {
  const resolved = change.status !== 'pending';
  const opLabel =
    change.op === 'replace' ? 'Revision' : change.op === 'delete' ? 'Deletion' : 'New block';

  return (
    <div
      data-change
      className={`my-2 border-l-2 px-3 py-2 ${
        resolved
          ? 'border-[color:var(--color-nis-soft)] opacity-50'
          : change.op === 'delete'
            ? 'border-[#b0483c] bg-[#fdf1ef]'
            : 'border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-accent-soft)]/40'
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-nis-muted">
          {opLabel}
          {resolved && ` — ${change.status}`}
        </span>
        {!resolved && (
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onResolve(false)}
              title="Reject this change"
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-nis-muted transition-colors hover:text-[#b0483c]"
            >
              <Ban className="h-3 w-3" />
              Reject
            </button>
            <button
              type="button"
              onClick={() => onResolve(true)}
              title="Accept this change"
              className="inline-flex items-center gap-1 bg-[color:var(--color-nis-ink)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--color-nis-bg)] transition-colors hover:bg-[color:var(--color-nis-hover)]"
            >
              <Check className="h-3 w-3" />
              Accept
            </button>
          </span>
        )}
      </div>

      {(change.op === 'replace' || change.op === 'delete') && (
        <p className="whitespace-pre-wrap font-serif text-[13px] leading-[1.6] text-[#8a3a33] line-through decoration-[#b0483c]/60">
          {change.oldRaw}
        </p>
      )}
      {(change.op === 'replace' || change.op === 'insert_after') && (
        <p className="mt-1 whitespace-pre-wrap font-serif text-[13.5px] leading-[1.65] text-[color:var(--color-nis-ink)]">
          {change.newMarkdown}
        </p>
      )}
      <p className="mt-1.5 font-sans text-[10.5px] italic text-nis-muted">{change.rationale}</p>
    </div>
  );
}
