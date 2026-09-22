'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Check, Send } from 'lucide-react';
import { useBlocksOptional } from './BlocksContext';
import { useEditModeOptional } from './EditModeProvider';
import { blocksToMarkdown } from '@/lib/mdx-blocks';
import { AI_MODELS, DEFAULT_MODEL_ID, isValidModelId, MODEL_STORAGE_KEY, type AiModelId } from '@/lib/ai/models';
import { ChatMarkdown } from './ChatMarkdown';

interface EditProposal {
  kind: 'edit';
  newMarkdown: string;
  rationale: string;
}

interface FootnoteProposal {
  kind: 'footnote';
  id: string;
  note: string;
  sources: string[];
  rationale: string;
}

type Proposal = EditProposal | FootnoteProposal;

interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
  proposal?: Proposal;
  steps?: string[];
  applied?: boolean;
}

interface AiAssistProps {
  /** Current draft markdown of the block being edited */
  draft: string;
  /** Replace the block draft with the proposed markdown */
  onApplyEdit: (newMarkdown: string) => void;
  /** Add a new footnote definition to the document (id, note, sources) */
  onAddFootnote?: (id: string, note: string, sources: string[]) => void;
}

const PRESETS = [
  { label: 'Verify claims', message: 'Check every factual claim in this block against the citation file and the web. Tell me which are supported, unsupported, or contradicted.' },
];

/** Serialize an assistant entry (incl. proposal) back into plain text for the model's history. */
function entryToContent(e: ChatEntry): string {
  if (!e.proposal) return e.content;
  if (e.proposal.kind === 'edit') {
    return [e.content, `[Proposed edit${e.applied ? ' — APPLIED by editor' : ''}]`, e.proposal.newMarkdown, `Rationale: ${e.proposal.rationale}`]
      .filter(Boolean)
      .join('\n');
  }
  return [
    e.content,
    `[Proposed footnote ^${e.proposal.id}${e.applied ? ' — APPLIED by editor' : ''}]`,
    e.proposal.note,
    `Sources: ${e.proposal.sources.join(' | ')}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function AiAssist({ draft, onApplyEdit, onAddFootnote }: AiAssistProps) {
  const blocksCtx = useBlocksOptional();
  const editCtx = useEditModeOptional();
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelId, setModelId] = useState<AiModelId>(DEFAULT_MODEL_ID);

  // Restore the last-used model
  useEffect(() => {
    const stored = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (isValidModelId(stored)) setModelId(stored);
  }, []);

  const changeModel = (id: AiModelId) => {
    setModelId(id);
    window.localStorage.setItem(MODEL_STORAGE_KEY, id);
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const slug = editCtx?.slug ?? '';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [entries, loading]);

  const send = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setError(null);
    setInput('');
    const nextEntries: ChatEntry[] = [...entries, { role: 'user', content: trimmed }];
    setEntries(nextEntries);
    setLoading(true);
    try {
      const pageMarkdown = blocksCtx ? blocksToMarkdown(blocksCtx.blocks) : draftRef.current;
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug,
          blockRaw: draftRef.current,
          pageMarkdown,
          modelId,
          messages: nextEntries.map((e) => ({ role: e.role, content: entryToContent(e) })),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? 'Request failed');
        return;
      }
      setEntries((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.text ?? '',
          proposal: data.proposal ?? undefined,
          steps: data.steps?.length ? data.steps : undefined,
        },
      ]);
    } catch {
      setError('Network error — is the dev server running?');
    } finally {
      setLoading(false);
    }
  };

  const applyProposal = (index: number) => {
    const entry = entries[index];
    if (!entry?.proposal || entry.applied) return;
    if (entry.proposal.kind === 'edit') {
      onApplyEdit(entry.proposal.newMarkdown);
    } else if (onAddFootnote) {
      const { id, note, sources } = entry.proposal;
      onAddFootnote(id, note, sources);
      onApplyEdit(draftRef.current.replace(/\s*$/, '') + `[^${id}]`);
    }
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, applied: true } : e)));
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Panel header */}
      <div className="flex items-center gap-1.5 border-b border-[color:var(--color-nis-soft)] px-4 py-2.5 shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-nis-muted" />
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
          Assistant
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

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {entries.length === 0 && !loading && (
          <p className="font-sans text-[11px] leading-relaxed text-nis-muted">
            Ask for a revision, a footnote, or a fact check on this block. Proposals appear
            as cards you can apply to the draft; nothing is saved until you save the page.
          </p>
        )}

        {entries.map((entry, i) => (
          <div key={i}>
            {entry.role === 'user' ? (
              <p className="font-sans text-[12px] leading-relaxed text-nis-muted">
                {entry.content}
              </p>
            ) : (
              <div className="space-y-2">
                {entry.steps && (
                  <div className="space-y-0.5">
                    {entry.steps.map((s, j) => (
                      <p key={j} className="font-mono text-[10px] text-nis-muted">
                        {s}
                      </p>
                    ))}
                  </div>
                )}
                {entry.content && <ChatMarkdown text={entry.content} />}
                {entry.proposal && (
                  <div className="border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)]">
                    <div className="px-3 py-2">
                      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-nis-muted">
                        {entry.proposal.kind === 'edit'
                          ? 'Proposed revision'
                          : `Proposed footnote [^${entry.proposal.id}]`}
                      </p>
                      {entry.proposal.kind === 'edit' ? (
                        <p className="mt-1 whitespace-pre-wrap font-serif text-[13px] leading-relaxed">
                          {entry.proposal.newMarkdown}
                        </p>
                      ) : (
                        <>
                          <p className="mt-1 whitespace-pre-wrap font-serif text-[13px] leading-relaxed">
                            {entry.proposal.note}
                          </p>
                          <ul className="mt-1 list-disc pl-4">
                            {entry.proposal.sources.map((s, j) => (
                              <li key={j} className="font-sans text-[11px] text-nis-muted">
                                {s}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      <p className="mt-2 font-sans text-[11px] italic text-nis-muted">
                        {entry.proposal.rationale}
                      </p>
                    </div>
                    <div className="flex justify-end border-t border-[color:var(--color-nis-soft)] px-3 py-1.5">
                      {entry.applied ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-nis-muted">
                          <Check className="h-3 w-3" />
                          Applied
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => applyProposal(i)}
                          className="inline-flex items-center gap-1 border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-accent)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--color-nis-ink)]"
                        >
                          <Check className="h-3 w-3" />
                          Apply to draft
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <p className="inline-flex items-center gap-1.5 font-sans text-[11px] text-nis-muted">
            <Loader2 className="h-3 w-3 animate-spin" />
            Reading page, style guide, and sources…
          </p>
        )}

        {error && <p className="font-sans text-[11px] text-red-700">{error}</p>}
      </div>

      {/* Presets + input */}
      <div className="shrink-0 border-t border-[color:var(--color-nis-soft)] px-4 py-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              disabled={loading}
              onClick={() => send(p.message)}
              className="border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-white)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-nis-muted transition-colors hover:border-[color:var(--color-nis-ink)] hover:text-[color:var(--color-nis-ink)] disabled:opacity-40"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask the assistant… (Enter to send)"
            rows={2}
            className="min-h-0 w-full resize-none border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-white)] px-2 py-1.5 font-sans text-[12px] leading-relaxed focus:border-[color:var(--color-nis-ink)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)] transition-opacity disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
