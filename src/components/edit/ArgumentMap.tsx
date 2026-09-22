'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Sparkles, Loader2 } from 'lucide-react';
import { MODEL_STORAGE_KEY } from '@/lib/ai/models';
import { useTaxonomy } from './TaxonomyProvider';
import {
  ATTACHMENT_ROLES,
  NODE_KINDS,
  NODE_ORIGINS,
  NODE_STANCES,
  claimTree,
  counterLinks,
  extractLibraryEntry,
  searchNodes,
  slugifyNodeId,
  type ClaimArgument,
  type NodeKind,
  type NodeOrigin,
  type NodeStance,
  type TaxonomyNode,
} from '@/lib/taxonomy';
import { getLibraries, getSources } from '@/app/actions/taxonomy';
import type { LibraryId } from '@/lib/taxonomy-store';
import { searchSources, type SourceRecord } from '@/lib/taxonomy';
import { compactUrlLabel } from '@/lib/footnote-sources';

export function ArgumentMap({
  onClose,
  initialNodeId,
}: {
  onClose: () => void;
  /** Open with this node selected (e.g. from an x-ray chip). */
  initialNodeId?: string;
}) {
  const { map, attachments, saveNode, createNode, removeNode, refresh } = useTaxonomy();
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<NodeKind | 'all' | 'sources'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(
    initialNodeId ?? map.nodes[0]?.id ?? null,
  );
  const [creating, setCreating] = useState(false);
  const [libraries, setLibraries] = useState<Record<LibraryId, string> | null>(null);
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [showAssistant, setShowAssistant] = useState(false);

  useEffect(() => {
    getLibraries()
      .then(setLibraries)
      .catch(() => setLibraries(null));
    getSources()
      .then(setSources)
      .catch(() => setSources([]));
  }, []);

  // Claims render as an indented tree when browsing (no search text)
  const filtered = useMemo((): { node: TaxonomyNode; depth: number }[] => {
    if (kindFilter === 'claim' && !query.trim()) {
      return claimTree(map.nodes);
    }
    let list = searchNodes(map.nodes, query);
    if (kindFilter !== 'all') list = list.filter((n) => n.kind === kindFilter);
    return list.map((node) => ({ node, depth: 0 }));
  }, [map.nodes, query, kindFilter]);

  const browsingSources = kindFilter === 'sources';
  const filteredSources = useMemo(
    () => (browsingSources ? searchSources(sources, query) : []),
    [browsingSources, sources, query],
  );
  const selectedSource = browsingSources
    ? (sources.find((s) => s.id === selectedId) ?? null)
    : null;

  const selected = map.nodes.find((n) => n.id === selectedId) ?? null;
  const uses = attachments.filter((a) => a.nodeId === selectedId);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('[data-overlay="style-guide"]')) return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onClose]);

  return createPortal(
    <div data-overlay="argument-map" className="fixed inset-0 z-[220] flex flex-col bg-[color:var(--color-nis-white)]">
      <div className="flex items-center justify-between border-b border-[color:var(--color-nis-soft)] px-6 py-3 shrink-0">
        <div className="flex items-baseline gap-3">
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
            Argument map
          </span>
          <span className="font-mono text-[9px] text-nis-muted">
            Editor only · never published
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowAssistant((v) => !v)}
            className={`inline-flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.08em] ${
              showAssistant
                ? 'text-[color:var(--color-nis-ink)]'
                : 'text-nis-muted hover:text-[color:var(--color-nis-ink)]'
            }`}
            title="Chat with the map curator — it can edit, link sources, create and delete (with your confirmation)"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Assistant
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-nis-muted hover:text-[color:var(--color-nis-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-[340px] shrink-0 border-r border-[color:var(--color-nis-soft)] flex flex-col min-h-0">
          <div className="px-4 py-3 space-y-2 shrink-0">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search claims, frames, metaphors…"
              className="w-full border-0 border-b border-[color:var(--color-nis-soft)] bg-transparent py-1 font-sans text-[13px] outline-none focus:border-[color:var(--color-nis-ink)]"
            />
            <div className="flex flex-wrap gap-1">
              {(['all', ...NODE_KINDS, 'sources'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKindFilter(k)}
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                    kindFilter === k
                      ? 'bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)]'
                      : 'text-nis-muted hover:text-[color:var(--color-nis-ink)]'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {browsingSources &&
              filteredSources.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(s.id);
                    setCreating(false);
                  }}
                  className={`flex w-full flex-col items-start px-3 py-2 text-left ${
                    selectedId === s.id && !creating
                      ? 'bg-[color:var(--color-nis-paper)]'
                      : 'hover:bg-[color:var(--color-nis-paper)]/60'
                  }`}
                >
                  <span className="font-sans text-[12px] leading-snug text-[color:var(--color-nis-ink)]">
                    {s.citation.replace(/https?:\/\/\S+/g, '').slice(0, 80)}
                  </span>
                  <span className="font-mono text-[9px] text-nis-muted">
                    {s.type ?? 'source'} · cited on {s.citedBy?.length ?? 0} footnote
                    {(s.citedBy?.length ?? 0) === 1 ? '' : 's'}
                  </span>
                </button>
              ))}
            {!browsingSources && filtered.map(({ node: n, depth }) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setSelectedId(n.id);
                  setCreating(false);
                }}
                style={depth > 0 ? { paddingLeft: `${12 + depth * 16}px` } : undefined}
                className={`flex w-full flex-col items-start px-3 py-2 text-left ${
                  selectedId === n.id && !creating
                    ? 'bg-[color:var(--color-nis-paper)]'
                    : 'hover:bg-[color:var(--color-nis-paper)]/60'
                }`}
              >
                <span className="font-sans text-[12px] font-medium text-[color:var(--color-nis-ink)]">
                  {depth > 0 && <span className="mr-1 text-nis-muted">└</span>}
                  {n.label}
                </span>
                <span className="font-mono text-[9px] text-nis-muted">
                  {n.kind} · {n.stance}
                  {n.origin ? ` · ${n.origin}` : ''}
                </span>
              </button>
            ))}
          </div>
          <div className="border-t border-[color:var(--color-nis-soft)] px-4 py-2">
            <button
              type="button"
              onClick={() => {
                setCreating(true);
                setSelectedId(null);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-nis-muted hover:text-[color:var(--color-nis-ink)]"
            >
              <Plus className="h-3 w-3" />
              New structure
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0 overflow-y-auto px-8 py-6">
          {selectedSource ? (
            <SourceDetail
              source={selectedSource}
              claims={map.nodes.filter((n) => n.kind === 'claim')}
              onNavigate={(id) => {
                setKindFilter('claim');
                setSelectedId(id);
              }}
            />
          ) : creating ? (
            <NodeForm
              key="new"
              claims={map.nodes.filter((n) => n.kind === 'claim')}
              onSave={async (draft) => {
                const node = await createNode(draft);
                setCreating(false);
                setSelectedId(node.id);
              }}
              onCancel={() => setCreating(false)}
            />
          ) : selected ? (
            <>
              <NodeForm
                key={selected.id}
                node={selected}
                claims={map.nodes.filter(
                  (n) => n.kind === 'claim' && n.id !== selected.id,
                )}
                onSave={async (draft) => {
                  const { argument, ...rest } = draft;
                  await saveNode({
                    ...selected,
                    ...rest,
                    argument: rest.kind === 'claim' ? argument : undefined,
                    parentId: rest.kind === 'claim' ? rest.parentId : undefined,
                  });
                }}
                onDelete={async () => {
                  if (!window.confirm('Remove this structure from the map? Attachments will be dropped.')) return;
                  await removeNode(selected.id);
                  setSelectedId(map.nodes.find((n) => n.id !== selected.id)?.id ?? null);
                }}
              />
              <SourceEntry node={selected} libraries={libraries} />
              {selected.kind === 'claim' &&
                (selected.argument?.grounds?.length ?? 0) > 0 && (
                  <GroundsEvidence
                    node={selected}
                    sources={sources}
                    onSave={async (groundSources) => {
                      await saveNode({
                        ...selected,
                        argument: { ...selected.argument, groundSources },
                      });
                    }}
                  />
                )}
              <Relations
                node={selected}
                nodes={map.nodes}
                onNavigate={setSelectedId}
                onSaveCounters={async (counters) => {
                  await saveNode({ ...selected, counters });
                }}
              />
              <div className="mt-8">
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted mb-2">
                  Attached on {uses.length} block{uses.length === 1 ? '' : 's'}
                </p>
                {uses.length === 0 ? (
                  <p className="text-[12px] text-nis-muted">Nothing attached yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {uses.map((a, i) => (
                      <li key={i} className="font-mono text-[11px] text-nis-muted">
                        {a.slug}
                        {a.blockId !== 'page' ? ` · ${a.blockId}` : ' · page'}
                        {' · '}
                        {ATTACHMENT_ROLES.find((r) => r.id === a.role)?.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <p className="text-[13px] text-nis-muted">Select a structure, or create one.</p>
          )}
        </div>

        {showAssistant && (
          <MapAssistant
            focusNodeId={selected?.id}
            onChanged={async () => {
              await refresh();
              getSources().then(setSources).catch(() => undefined);
            }}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}

interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  steps?: string[];
}

/**
 * Chat rail for the map: a curator with the same powers as the UI —
 * edit nodes, draft Toulmin fields, link sources to grounds, create and
 * delete (both preview-then-confirm). Mutations refresh the map in place.
 */
function MapAssistant({
  focusNodeId,
  onChanged,
}: {
  focusNodeId?: string;
  onChanged: () => Promise<void>;
}) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const history = [...messages, { role: 'user' as const, content: text }];
    setMessages(history);
    setInput('');
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/map-agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          focusNodeId,
          modelId: window.localStorage.getItem(MODEL_STORAGE_KEY) ?? undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? 'Assistant failed');
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || '(no reply)', steps: data.steps },
      ]);
      if (data.changed) await onChanged();
    } catch {
      setError('Network error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside
      data-map-assistant
      aria-label="Map assistant"
      className="flex w-[360px] shrink-0 flex-col border-l border-[color:var(--color-nis-soft)]"
    >
      <div className="border-b border-[color:var(--color-nis-soft)] px-4 py-2.5">
        <p className="m-0 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
          Map assistant
        </p>
        <p className="m-0 mt-0.5 text-[10px] leading-[1.4] text-nis-muted">
          Can edit nodes, draft arguments, and link sources. Creating or deleting
          always asks you first.
        </p>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !busy && (
          <p className="m-0 text-[12px] leading-[1.6] text-nis-muted">
            Try: &ldquo;draft grounds for this claim and link real sources&rdquo;,
            &ldquo;what counters ELIGIBILITY?&rdquo;, or &ldquo;tighten this
            definition&rdquo;.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className="mb-3">
            <p className="m-0 font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-nis-muted">
              {m.role === 'user' ? 'You' : 'Curator'}
            </p>
            <p className="m-0 mt-0.5 whitespace-pre-wrap text-[12px] leading-[1.6]">
              {m.content}
            </p>
            {m.steps && m.steps.length > 0 && (
              <ul className="m-0 mt-1 list-none space-y-0.5 p-0">
                {m.steps.map((s, j) => (
                  <li key={j} className="font-mono text-[9px] text-nis-muted">
                    · {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {busy && (
          <p className="m-0 flex items-center gap-1.5 text-[11px] text-nis-muted">
            <Loader2 className="h-3 w-3 animate-spin" />
            Working…
          </p>
        )}
        {error && <p className="m-0 mt-2 text-[11px] text-[#b0483c]">{error}</p>}
      </div>
      <div className="border-t border-[color:var(--color-nis-soft)] px-3 py-2.5">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Ask, or ask for an edit…"
          rows={2}
          className="w-full resize-none border border-[color:var(--color-nis-soft)] bg-transparent px-2 py-1.5 font-sans text-[12px] leading-[1.5] outline-none focus:border-[color:var(--color-nis-ink)]"
        />
        <div className="mt-1.5 flex items-center justify-between">
          <span className="font-mono text-[9px] text-nis-muted">
            {focusNodeId ? `context: ${focusNodeId}` : 'context: whole map'}
          </span>
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy || !input.trim()}
            className="font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-nis-muted hover:text-[color:var(--color-nis-ink)] disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </aside>
  );
}

/**
 * Read view for one record in the sources index: full citation, where the
 * archive cites it (page/footnote), and which claim grounds lean on it.
 */
function SourceDetail({
  source,
  claims,
  onNavigate,
}: {
  source: SourceRecord;
  claims: TaxonomyNode[];
  onNavigate: (nodeId: string) => void;
}) {
  const backing = claims.filter((c) =>
    (c.argument?.groundSources ?? []).some((ids) => ids.includes(source.id)),
  );
  return (
    <div className="max-w-[620px]">
      <p className="m-0 font-mono text-[10px] text-nis-muted">{source.id}</p>
      <p className="mb-2 mt-2 font-sans text-[15px] leading-[1.5]">
        {source.citation.replace(/https?:\/\/\S+/g, '').trim()}
      </p>
      <p className="m-0 mb-6 flex flex-wrap items-center gap-3 text-[11px] text-nis-muted">
        <span className="border border-[color:var(--color-nis-soft)] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase">
          {source.type ?? 'source'}
        </span>
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-nis-hover no-underline hover:underline"
          >
            {compactUrlLabel(source.url)} ↗
          </a>
        )}
      </p>

      <p className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
        Cited on {source.citedBy?.length ?? 0} footnote{(source.citedBy?.length ?? 0) === 1 ? '' : 's'}
      </p>
      <ul className="m-0 mb-6 list-none space-y-1 p-0">
        {(source.citedBy ?? []).map((c, i) => (
          <li key={i} className="font-mono text-[11px] text-nis-muted">
            {c.slug} · [^{c.footnoteId}]
          </li>
        ))}
      </ul>

      <p className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
        Backs grounds on
      </p>
      {backing.length === 0 ? (
        <p className="m-0 text-[12px] text-nis-muted">
          No claim grounds link this source yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {backing.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onNavigate(c.id)}
              className="inline-block border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-paper)] px-2 py-0.5 font-mono text-[10px] hover:border-[color:var(--color-nis-ink)]"
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface GroundVerdict {
  index: number;
  verdict: 'supported' | 'unsourced' | 'mismatch';
  note: string;
}

/**
 * Evidence panel for a claim: each Toulmin ground with its linked sources
 * (chips + search-add from the sources index) and an AI verify pass that
 * checks whether the linked sources plausibly back each ground.
 */
function GroundsEvidence({
  node,
  sources,
  onSave,
}: {
  node: TaxonomyNode;
  sources: SourceRecord[];
  onSave: (groundSources: string[][]) => Promise<void>;
}) {
  const grounds = node.argument?.grounds ?? [];
  const groundSources = node.argument?.groundSources ?? [];
  const sourceById = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);
  const [addingFor, setAddingFor] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verdicts, setVerdicts] = useState<GroundVerdict[] | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const setForGround = async (index: number, ids: string[]) => {
    const next = grounds.map((_, i) => groundSources[i] ?? []);
    next[index] = ids;
    await onSave(next);
  };

  const results =
    addingFor !== null && query.trim()
      ? searchSources(sources, query)
          .filter((s) => !(groundSources[addingFor] ?? []).includes(s.id))
          .slice(0, 8)
      : [];

  const verify = async () => {
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch('/api/taxonomy-agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'grounds', nodeId: node.id }),
      });
      const data = await res.json();
      if (!data.ok) {
        setVerifyError(data.error ?? 'Verification failed');
        return;
      }
      setVerdicts(data.grounds);
    } catch {
      setVerifyError('Network error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="mt-8 max-w-[560px]">
      <div className="mb-2 flex items-center justify-between">
        <p className="m-0 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
          Evidence — grounds &amp; sources
        </p>
        <button
          type="button"
          onClick={verify}
          disabled={verifying}
          className="inline-flex items-center gap-1 font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-nis-muted hover:text-[color:var(--color-nis-ink)] disabled:opacity-50"
          title="Check each ground against its linked sources"
        >
          {verifying ? 'Verifying…' : 'Verify grounds'}
        </button>
      </div>
      {verifyError && <p className="mb-2 mt-0 text-[11px] text-[#b0483c]">{verifyError}</p>}
      <ol className="m-0 list-none space-y-3 p-0">
        {grounds.map((g, i) => {
          const linked = (groundSources[i] ?? [])
            .map((id) => sourceById.get(id))
            .filter((s): s is SourceRecord => Boolean(s));
          const verdict = verdicts?.find((v) => v.index === i);
          return (
            <li key={i} className="border-l-2 border-[color:var(--color-nis-soft)] pl-3">
              <p className="m-0 text-[12px] leading-[1.5]">
                {g}
                {verdict && (
                  <span
                    title={verdict.note}
                    className={`ml-2 font-mono text-[9px] font-bold uppercase ${
                      verdict.verdict === 'supported'
                        ? 'text-[#3d7a4f]'
                        : verdict.verdict === 'unsourced'
                          ? 'text-nis-muted'
                          : 'text-[#b0483c]'
                    }`}
                  >
                    {verdict.verdict}
                  </span>
                )}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {linked.map((s) => (
                  <span
                    key={s.id}
                    title={s.citation}
                    className="inline-flex items-center gap-1 border border-[color:var(--color-nis-soft)] px-1.5 py-0.5 font-mono text-[9px] text-nis-muted"
                  >
                    {s.url ? compactUrlLabel(s.url) : s.citation.slice(0, 36)}
                    <button
                      type="button"
                      aria-label={`Unlink ${s.id}`}
                      onClick={() =>
                        setForGround(i, (groundSources[i] ?? []).filter((id) => id !== s.id))
                      }
                      className="hover:text-[#b0483c]"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
                <span className="relative">
                  <input
                    value={addingFor === i ? query : ''}
                    onFocus={() => {
                      setAddingFor(i);
                      setQuery('');
                    }}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="+ source…"
                    className="w-24 border-b border-[color:var(--color-nis-soft)] bg-transparent py-0.5 font-sans text-[10px] outline-none focus:border-[color:var(--color-nis-ink)]"
                  />
                  {addingFor === i && results.length > 0 && (
                    <span className="absolute left-0 top-full z-20 mt-0.5 flex w-[340px] flex-col border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-white)] shadow-lg">
                      {results.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={async () => {
                            await setForGround(i, [...(groundSources[i] ?? []), s.id]);
                            setQuery('');
                            setAddingFor(null);
                          }}
                          className="px-2 py-1 text-left font-sans text-[11px] leading-snug hover:bg-[color:var(--color-nis-paper)]"
                        >
                          {s.citation.slice(0, 90)}
                        </button>
                      ))}
                    </span>
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * The node's place in the wider structure: parent/children for claims (the
 * argument tree), counter-links between the rival systems for frames and
 * metaphors. All links navigate; counters are editable.
 */
function Relations({
  node,
  nodes,
  onNavigate,
  onSaveCounters,
}: {
  node: TaxonomyNode;
  nodes: TaxonomyNode[];
  onNavigate: (id: string) => void;
  onSaveCounters: (counters: string[]) => Promise<void>;
}) {
  const [counterQuery, setCounterQuery] = useState('');
  const parent = node.parentId ? nodes.find((n) => n.id === node.parentId) : null;
  const children = nodes.filter((n) => n.parentId === node.id);
  const { counters, counteredBy } = counterLinks(nodes, node.id);

  const isClaim = node.kind === 'claim';
  const hasAnything =
    parent || children.length || counters.length || counteredBy.length || !isClaim;
  if (!hasAnything) return null;

  const counterCandidates = counterQuery.trim()
    ? searchNodes(
        nodes.filter(
          (n) =>
            n.kind !== 'claim' &&
            n.id !== node.id &&
            !(node.counters ?? []).includes(n.id),
        ),
        counterQuery,
      ).slice(0, 6)
    : [];

  const LinkChip = ({ n }: { n: TaxonomyNode }) => (
    <button
      type="button"
      onClick={() => onNavigate(n.id)}
      className="inline-block border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-paper)] px-2 py-0.5 font-mono text-[10px] hover:border-[color:var(--color-nis-ink)]"
      title={n.definition}
    >
      {n.label}
    </button>
  );

  return (
    <div className="mt-8 max-w-[560px] space-y-4">
      {isClaim && (parent || children.length > 0) && (
        <div>
          <p className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
            Argument tree
          </p>
          {parent && (
            <p className="m-0 mb-1.5 text-[12px] text-nis-muted">
              Supports <LinkChip n={parent} />
            </p>
          )}
          {children.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-nis-muted">
              Supported by{' '}
              {children.map((c) => (
                <LinkChip key={c.id} n={c} />
              ))}
            </div>
          )}
        </div>
      )}

      {!isClaim && (
        <div>
          <p className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
            System links
          </p>
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-nis-muted">
            Counters
            {counters.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-0.5">
                <LinkChip n={c} />
                <button
                  type="button"
                  aria-label={`Remove counter link to ${c.label}`}
                  onClick={() =>
                    onSaveCounters((node.counters ?? []).filter((id) => id !== c.id))
                  }
                  className="text-nis-muted hover:text-[#b0483c]"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            <span className="relative">
              <input
                value={counterQuery}
                onChange={(e) => setCounterQuery(e.target.value)}
                placeholder="+ add…"
                className="w-24 border-b border-[color:var(--color-nis-soft)] bg-transparent py-0.5 font-sans text-[11px] outline-none focus:border-[color:var(--color-nis-ink)]"
              />
              {counterCandidates.length > 0 && (
                <span className="absolute left-0 top-full z-20 mt-0.5 flex w-[260px] flex-col border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-white)] shadow-lg">
                  {counterCandidates.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={async () => {
                        await onSaveCounters([...(node.counters ?? []), c.id]);
                        setCounterQuery('');
                      }}
                      className="px-2 py-1 text-left font-sans text-[11px] hover:bg-[color:var(--color-nis-paper)]"
                    >
                      {c.label}
                      <span className="ml-1 font-mono text-[9px] text-nis-muted">
                        {c.kind}
                      </span>
                    </button>
                  ))}
                </span>
              )}
            </span>
          </div>
          {counteredBy.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-nis-muted">
              Countered by{' '}
              {counteredBy.map((c) => (
                <LinkChip key={c.id} n={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Read-only provenance: the reference-library entry this structure was drawn
 * from (metaphor/frame libraries from the Phase 1 analysis).
 */
function SourceEntry({
  node,
  libraries,
}: {
  node: TaxonomyNode;
  libraries: Record<LibraryId, string> | null;
}) {
  if (!libraries) return null;

  const libId = (node.libraryRef as LibraryId | undefined) ?? null;
  const searchOrder: LibraryId[] = libId
    ? [libId]
    : node.kind === 'metaphor'
      ? ['metaphors']
      : node.kind === 'frame'
        ? ['frames']
        : [];

  let entry: string | null = null;
  let from: LibraryId | null = null;
  for (const id of searchOrder) {
    entry = extractLibraryEntry(libraries[id] ?? '', node.label);
    if (entry) {
      from = id;
      break;
    }
  }

  const originLine = (node.origin || node.source) && (
    <p className="m-0 mb-2 text-[12px] text-nis-muted">
      {node.origin && (
        <span
          className={`mr-2 inline-block border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
            node.origin === 'canonical'
              ? 'border-[color:var(--color-nis-ink)] text-[color:var(--color-nis-ink)]'
              : node.origin === 'adapted'
                ? 'border-[color:var(--color-nis-soft)] text-nis-muted'
                : 'border-[color:var(--color-nis-accent)] text-[color:var(--color-nis-ink)]'
          }`}
        >
          {node.origin}
        </span>
      )}
      {node.source}
    </p>
  );

  if (!entry || !from) {
    if (node.kind === 'claim' && !originLine) return null;
    return (
      <div className="mt-8 max-w-[560px]">
        <p className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted mb-1">
          Source
        </p>
        {originLine}
        {node.kind !== 'claim' && (
          <p className="m-0 text-[12px] text-nis-muted">
            Not in the reference libraries — this structure was created on the map.
          </p>
        )}
      </div>
    );
  }

  const [heading, ...body] = entry.split('\n');
  return (
    <div className="mt-8 max-w-[560px]">
      <p className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted mb-2">
        Source · {from} library
      </p>
      {originLine}
      <div className="border-l-2 border-[color:var(--color-nis-accent)] pl-3">
        <p className="m-0 font-mono text-[11px] font-bold">{heading}</p>
        <p className="mb-0 mt-1 text-[12px] leading-[1.6] text-nis-muted whitespace-pre-wrap">
          {body.join('\n').trim()}
        </p>
      </div>
    </div>
  );
}

function NodeForm({
  node,
  claims,
  onSave,
  onCancel,
  onDelete,
}: {
  node?: TaxonomyNode;
  /** Candidate parents for the argument tree (claims only, excluding self) */
  claims: TaxonomyNode[];
  onSave: (draft: {
    kind: NodeKind;
    label: string;
    stance: NodeStance;
    definition: string;
    argument?: ClaimArgument;
    origin?: NodeOrigin;
    source?: string;
    parentId?: string;
  }) => Promise<void>;
  onCancel?: () => void;
  onDelete?: () => void;
}) {
  const [kind, setKind] = useState<NodeKind>(node?.kind ?? 'metaphor');
  const [label, setLabel] = useState(node?.label ?? '');
  const [stance, setStance] = useState<NodeStance>(node?.stance ?? 'reframe');
  const [definition, setDefinition] = useState(node?.definition ?? '');
  const [origin, setOrigin] = useState<NodeOrigin>(node?.origin ?? 'novel');
  const [source, setSource] = useState(node?.source ?? '');
  const [parentId, setParentId] = useState(node?.parentId ?? '');
  const [grounds, setGrounds] = useState((node?.argument?.grounds ?? []).join('\n'));
  const [warrant, setWarrant] = useState(node?.argument?.warrant ?? '');
  const [qualifier, setQualifier] = useState(node?.argument?.qualifier ?? '');
  const [rebuttal, setRebuttal] = useState(node?.argument?.rebuttal ?? '');
  const [answer, setAnswer] = useState(node?.argument?.answer ?? '');
  const [saving, setSaving] = useState(false);

  const argumentFromForm = (): ClaimArgument | undefined => {
    const next: ClaimArgument = {
      grounds: grounds
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      warrant: warrant.trim() || undefined,
      qualifier: qualifier.trim() || undefined,
      rebuttal: rebuttal.trim() || undefined,
      answer: answer.trim() || undefined,
    };
    if (
      !next.grounds?.length &&
      !next.warrant &&
      !next.qualifier &&
      !next.rebuttal &&
      !next.answer
    ) {
      return undefined;
    }
    return next;
  };

  return (
    <div className="max-w-[560px] space-y-4">
      <div className="flex gap-4">
        <label className="block flex-1">
          <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
            Kind
          </span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as NodeKind)}
            className="w-full border-b border-[color:var(--color-nis-soft)] bg-transparent py-1 text-[13px] outline-none"
          >
            {NODE_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="block flex-1">
          <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
            Stance
          </span>
          <select
            value={stance}
            onChange={(e) => setStance(e.target.value as NodeStance)}
            className="w-full border-b border-[color:var(--color-nis-soft)] bg-transparent py-1 text-[13px] outline-none"
          >
            {NODE_STANCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
          Name
        </span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full border-b border-[color:var(--color-nis-soft)] bg-transparent py-1 font-sans text-[16px] outline-none focus:border-[color:var(--color-nis-ink)]"
        />
        {node && (
          <span className="mt-1 block font-mono text-[10px] text-nis-muted">
            {node.id}
            {node.id !== slugifyNodeId(kind, label) && ' · id stays stable when renamed'}
          </span>
        )}
      </label>
      <label className="block">
        <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
          Definition
        </span>
        <textarea
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          rows={5}
          className="w-full resize-y border border-[color:var(--color-nis-soft)] bg-transparent px-3 py-2 font-sans text-[13px] leading-relaxed outline-none focus:border-[color:var(--color-nis-ink)]"
        />
      </label>
      <div className="flex gap-4">
        <label className="block flex-1">
          <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
            Origin
          </span>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value as NodeOrigin)}
            className="w-full border-b border-[color:var(--color-nis-soft)] bg-transparent py-1 text-[13px] outline-none"
          >
            {NODE_ORIGINS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block flex-1">
          <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
            Source citation
          </span>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. Lakoff & Johnson 1980 · FrameNet: Compliance"
            className="w-full border-b border-[color:var(--color-nis-soft)] bg-transparent py-1 font-sans text-[12px] outline-none focus:border-[color:var(--color-nis-ink)] placeholder:text-nis-muted/50"
          />
        </label>
      </div>
      {kind === 'claim' && (
        <label className="block">
          <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
            Supports (parent claim in the argument tree)
          </span>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full border-b border-[color:var(--color-nis-soft)] bg-transparent py-1 text-[13px] outline-none"
          >
            <option value="">— root claim (no parent)</option>
            {claims.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {kind === 'claim' && (
        <div className="space-y-3 border-t border-[color:var(--color-nis-soft)] pt-4">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
            Toulmin (x-ray Argument tab)
          </p>
          <label className="block">
            <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
              Grounds — one per line
            </span>
            <textarea
              value={grounds}
              onChange={(e) => setGrounds(e.target.value)}
              rows={3}
              className="w-full resize-y border border-[color:var(--color-nis-soft)] bg-transparent px-3 py-2 font-sans text-[13px] outline-none"
            />
          </label>
          {(
            [
              ['Warrant', warrant, setWarrant],
              ['Qualifier', qualifier, setQualifier],
              ['Rebuttal', rebuttal, setRebuttal],
              ['Answer', answer, setAnswer],
            ] as const
          ).map(([label, value, set]) => (
            <label key={label} className="block">
              <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
                {label}
              </span>
              <textarea
                value={value}
                onChange={(e) => set(e.target.value)}
                rows={2}
                className="w-full resize-y border border-[color:var(--color-nis-soft)] bg-transparent px-3 py-2 font-sans text-[13px] outline-none"
              />
            </label>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={saving || !label.trim() || !definition.trim()}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave({
                kind,
                label: label.trim(),
                stance,
                definition: definition.trim(),
                argument: kind === 'claim' ? argumentFromForm() : undefined,
                origin,
                source: source.trim() || undefined,
                parentId: kind === 'claim' && parentId ? parentId : undefined,
              });
            } finally {
              setSaving(false);
            }
          }}
          className="px-4 py-1.5 text-[11px] font-bold bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)] disabled:opacity-40"
        >
          {saving ? 'Saving…' : node ? 'Save' : 'Create'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-[11px] font-bold text-nis-muted">
            Cancel
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto text-[11px] font-bold text-[#b0483c]"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
