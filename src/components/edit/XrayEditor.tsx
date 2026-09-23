'use client';

import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, ChevronsRight, Loader2, Network, Plus, Scale, Sparkles, X } from 'lucide-react';
import { useTaxonomyOptional } from './TaxonomyProvider';
import { useEditModeOptional } from './EditModeProvider';
import { useBlocksOptional } from './BlocksContext';
import { ArgumentMap } from './ArgumentMap';
import { ROLE_GLYPHS, STANCE_TEXT_COLORS } from '@/lib/taxonomy-glyphs';
import {
  ATTACHMENT_ROLES,
  excerptOf,
  searchNodes,
  type Attachment,
  type AttachmentRole,
  type TaxonomyNode,
} from '@/lib/taxonomy';

const ATTACHMENT_ROLE_LABELS = Object.fromEntries(
  ATTACHMENT_ROLES.map((r) => [r.id, r.label]),
) as Record<AttachmentRole, string>;

/**
 * Editable x-ray panel — lives where the public MetaPanel sits, but in edit
 * mode. Shows the page's argument structure as editable sections; each
 * section has its own search box, so the role is implied by where you add.
 */

type SectionId = 'claim' | 'proposes' | 'counters' | 'catalytic';

const SECTIONS: {
  id: SectionId;
  label: string;
  hint: string;
  role: AttachmentRole | null; // null = inferred from node stance (claims)
  claimsOnly: boolean;
}[] = [
  {
    id: 'claim',
    label: 'Claim',
    hint: 'The page’s claim in the Argument tab',
    role: null,
    claimsOnly: true,
  },
  {
    id: 'proposes',
    label: 'Proposed',
    hint: 'Frames & metaphors this page advances',
    role: 'advances-reframe',
    claimsOnly: false,
  },
  {
    id: 'counters',
    label: 'Countered',
    hint: 'The dominant account this page describes',
    role: 'describes-dominant',
    claimsOnly: false,
  },
  {
    id: 'catalytic',
    label: 'Catalytic',
    hint: 'Openings aimed at a catalytic community',
    role: 'aims-catalytic',
    claimsOnly: false,
  },
];

const SECTION_GLYPH_COLORS: Record<AttachmentRole, string> = {
  'advances-reframe': STANCE_TEXT_COLORS.reframe,
  'describes-dominant': STANCE_TEXT_COLORS.dominant,
  'aims-catalytic': STANCE_TEXT_COLORS.catalytic,
};

function roleForClaim(node: TaxonomyNode): AttachmentRole {
  if (node.stance === 'dominant') return 'describes-dominant';
  if (node.stance === 'catalytic') return 'aims-catalytic';
  return 'advances-reframe';
}

interface Suggestion {
  nodeId: string;
  role: AttachmentRole;
  confidence: 'high' | 'medium';
  reason: string;
}

interface Verification {
  nodeId: string;
  verdict: 'supported' | 'weak' | 'drift';
  note: string;
}

interface Analysis {
  suggestions: Suggestion[];
  verifications: Verification[];
}

function bucketOf(att: Attachment, node: TaxonomyNode | undefined): SectionId {
  if (node?.kind === 'claim') return 'claim';
  if (att.role === 'describes-dominant') return 'counters';
  if (att.role === 'aims-catalytic') return 'catalytic';
  return 'proposes';
}

export function XrayEditor() {
  const tax = useTaxonomyOptional();
  const edit = useEditModeOptional();
  const blocksCtx = useBlocksOptional();
  const [open, setOpen] = useState(true);
  const [scope, setScope] = useState('page');
  const [showMap, setShowMap] = useState(false);
  const [mapNodeId, setMapNodeId] = useState<string | undefined>(undefined);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const slug = edit?.slug ?? '';

  const scoped = useMemo(
    () => tax?.attachments.filter((a) => a.slug === slug && a.blockId === scope) ?? [],
    [tax?.attachments, slug, scope],
  );

  if (!tax || !edit?.isEditMode) return null;

  const nodeById = new Map(tax.map.nodes.map((n) => [n.id, n]));
  const scopeBlock = blocksCtx?.blocks.find((b) => b.id === scope);
  const verdictByNode = new Map(
    (analysis?.verifications ?? []).map((v) => [v.nodeId, v]),
  );
  const attachedIds = new Set(scoped.map((a) => a.nodeId));
  const openSuggestions = (analysis?.suggestions ?? []).filter(
    (s) => !attachedIds.has(s.nodeId) && nodeById.has(s.nodeId),
  );

  const runAnalysis = async () => {
    const text =
      scope === 'page'
        ? (blocksCtx?.blocks ?? []).map((b) => b.raw).join('\n\n')
        : (scopeBlock?.raw ?? '');
    if (!text.trim()) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/taxonomy-agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text,
          attached: scoped.map((a) => ({ nodeId: a.nodeId, role: a.role })),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setAnalysisError(data.error ?? 'Analysis failed');
        return;
      }
      setAnalysis({ suggestions: data.suggestions, verifications: data.verifications });
    } catch {
      setAnalysisError('Network error');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      {/* Collapsed tab */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-0 top-1/2 z-[90] hidden -translate-y-1/2 items-center gap-1.5 border border-r-0 border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] px-2 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--color-nis-ink)] shadow-[-3px_3px_0_0_var(--color-nis-accent)] nis-wide:flex"
          style={{ writingMode: 'vertical-rl' }}
          title="Open the x-ray editor"
        >
          <Scale className="h-3.5 w-3.5 rotate-90" />
          X-ray
        </button>
      )}

      {/* Panel */}
      {open && (
        <aside
          data-xray-editor
          aria-label="X-ray editor"
          className="fixed bottom-0 right-0 top-[55px] z-[90] hidden w-[380px] flex-col border-l border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] shadow-[-6px_0_0_0_var(--color-nis-accent)] nis-wide:flex"
        >
          <div className="flex items-center justify-between border-b border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-paper)] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Scale className="h-3.5 w-3.5" />
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.1em]">
                X-ray
              </span>
              <span className="font-mono text-[9px] text-nis-muted">
                what readers see
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Collapse x-ray editor"
              className="inline-flex h-7 w-7 items-center justify-center text-nis-muted hover:text-[color:var(--color-nis-ink)]"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>

          {/* Scope */}
          <div className="border-b border-[color:var(--color-nis-soft)] px-4 py-2">
            <div className="flex items-center gap-2">
              <label className="flex min-w-0 flex-1 items-center gap-2">
                <span className="font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-nis-muted">
                  Attach to
                </span>
                <select
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value);
                    setAnalysis(null);
                    setAnalysisError(null);
                  }}
                  className="min-w-0 flex-1 truncate bg-transparent font-sans text-[12px] outline-none"
                >
                  <option value="page">Whole page</option>
                  {(blocksCtx?.blocks ?? [])
                    .filter((b) => b.type !== 'empty' && b.type !== 'hr')
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.type} · {excerptOf(b.raw).slice(0, 44)}
                      </option>
                    ))}
                </select>
              </label>
              <button
                type="button"
                onClick={runAnalysis}
                disabled={analyzing}
                className="inline-flex shrink-0 items-center gap-1 font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-nis-muted hover:text-[color:var(--color-nis-ink)] disabled:opacity-50"
                title="Suggest structures for this text and verify the attached ones"
              >
                {analyzing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Analyze
              </button>
            </div>
            {scope !== 'page' && !scopeBlock && (
              <p className="mb-0 mt-1 text-[10px] text-[#b0483c]">
                That block no longer exists — pick another.
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {analysisError && (
              <p className="mb-3 mt-0 text-[11px] text-[#b0483c]">{analysisError}</p>
            )}
            {openSuggestions.length > 0 && (
              <div className="mb-5 border border-[color:var(--color-nis-accent)] bg-[color:var(--color-nis-accent-soft)]/40 px-3 py-2.5">
                <p className="mb-2 mt-0 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
                  Suggested — click to attach
                </p>
                <ul className="m-0 list-none space-y-2 p-0">
                  {openSuggestions.map((s) => {
                    const node = nodeById.get(s.nodeId)!;
                    return (
                      <li key={s.nodeId}>
                        <button
                          type="button"
                          onClick={async () => {
                            await tax.attach({
                              slug,
                              blockId: scope,
                              excerpt: scopeBlock ? excerptOf(scopeBlock.raw) : '',
                              nodeId: s.nodeId,
                              role: s.role,
                            });
                          }}
                          className="inline-flex items-center gap-1 border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] px-2 py-0.5 font-mono text-[10px] font-bold hover:bg-[color:var(--color-nis-paper)]"
                          title={`${ATTACHMENT_ROLE_LABELS[s.role]} · ${s.confidence} confidence`}
                        >
                          <Plus className="h-2.5 w-2.5" />
                          {node.label}
                        </button>
                        <p className="mb-0 mt-0.5 text-[10px] leading-[1.4] text-nis-muted">
                          {ATTACHMENT_ROLE_LABELS[s.role]} · {s.reason}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {SECTIONS.map((section) => (
              <Section
                key={section.id}
                section={section}
                attachments={scoped.filter(
                  (a) => bucketOf(a, nodeById.get(a.nodeId)) === section.id,
                )}
                nodes={tax.map.nodes}
                nodeById={nodeById}
                onAttach={async (node) => {
                  await tax.attach({
                    slug,
                    blockId: scope,
                    excerpt: scopeBlock ? excerptOf(scopeBlock.raw) : '',
                    nodeId: node.id,
                    role:
                      section.role ??
                      (node.kind === 'claim' ? roleForClaim(node) : 'advances-reframe'),
                  });
                }}
                onDetach={(nodeId) => tax.detach({ slug, blockId: scope, nodeId })}
                onInspect={(nodeId) => {
                  setMapNodeId(nodeId);
                  setShowMap(true);
                }}
                verdictByNode={verdictByNode}
              />
            ))}
          </div>

          <div className="border-t border-[color:var(--color-nis-soft)] px-4 py-2.5">
            <button
              type="button"
              onClick={() => {
                setMapNodeId(undefined);
                setShowMap(true);
              }}
              className="inline-flex items-center gap-1.5 font-sans text-[11px] font-bold text-nis-muted hover:text-[color:var(--color-nis-ink)]"
              title="Create or edit structures — editor only, never published"
            >
              <Network className="h-3.5 w-3.5" />
              Open argument map
            </button>
          </div>
        </aside>
      )}

      {showMap && (
        <ArgumentMap initialNodeId={mapNodeId} onClose={() => setShowMap(false)} />
      )}
    </>
  );
}

function Section({
  section,
  attachments,
  nodes,
  nodeById,
  onAttach,
  onDetach,
  onInspect,
  verdictByNode,
}: {
  section: (typeof SECTIONS)[number];
  attachments: Attachment[];
  nodes: TaxonomyNode[];
  nodeById: Map<string, TaxonomyNode>;
  onAttach: (node: TaxonomyNode) => Promise<void>;
  onDetach: (nodeId: string) => void;
  onInspect: (nodeId: string) => void;
  verdictByNode: Map<string, Verification>;
}) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const attachedIds = new Set(attachments.map((a) => a.nodeId));
  const pool = nodes.filter((n) =>
    section.claimsOnly ? n.kind === 'claim' : n.kind !== 'claim',
  );
  const results = searchNodes(pool, query)
    .filter((n) => !attachedIds.has(n.id))
    .slice(0, 8);
  const showResults = focused && (query.trim().length > 0 || attachments.length === 0);

  return (
    <div className="mb-5">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-nis-muted">
          {section.role && (
            <span
              aria-hidden
              className="mr-1 font-mono"
              style={{ color: SECTION_GLYPH_COLORS[section.role] }}
            >
              {ROLE_GLYPHS[section.role]}
            </span>
          )}
          {section.label}
        </span>
        <span className="font-mono text-[8px] text-nis-muted">{section.hint}</span>
      </div>

      {attachments.length > 0 && (
        <ul className="m-0 mb-1.5 list-none space-y-1.5 p-0">
          {attachments.map((a) => {
            const node = nodeById.get(a.nodeId);
            const verdict = verdictByNode.get(a.nodeId);
            return (
              <li key={a.nodeId} className="group">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onInspect(a.nodeId)}
                      title="Open in the argument map — definition, source library, and every page it appears on"
                      className="inline-block border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-paper)] px-2 py-0.5 text-left font-mono text-[10px] font-bold tracking-wide hover:bg-[color:var(--color-nis-accent-soft)]"
                    >
                      {node?.label ?? a.nodeId}
                    </button>
                    {verdict && (
                      <span
                        title={verdict.note}
                        aria-label={`Verification: ${verdict.verdict} — ${verdict.note}`}
                        className={`inline-flex items-center gap-0.5 font-mono text-[9px] font-bold ${
                          verdict.verdict === 'supported'
                            ? 'text-[#3d7a4f]'
                            : verdict.verdict === 'weak'
                              ? 'text-nis-muted'
                              : 'text-[#b0483c]'
                        }`}
                      >
                        {verdict.verdict === 'supported' ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {verdict.verdict}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDetach(a.nodeId)}
                    aria-label={`Detach ${node?.label ?? a.nodeId}`}
                    className="mt-0.5 text-nis-muted opacity-0 transition-opacity hover:text-[#b0483c] group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                {node?.definition && (
                  <p className="mb-0 mt-0.5 line-clamp-2 text-[11px] leading-[1.45] text-nis-muted">
                    {node.definition}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
            setFocused(true);
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setFocused(false), 150);
          }}
          placeholder={
            attachments.length === 0
              ? `Search to add a ${section.claimsOnly ? 'claim' : 'frame or metaphor'}…`
              : 'Add another…'
          }
          className="w-full border-b border-[color:var(--color-nis-soft)] bg-transparent py-1 font-sans text-[12px] outline-none placeholder:text-nis-muted/60 focus:border-[color:var(--color-nis-ink)]"
        />
        {showResults && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 max-h-52 overflow-y-auto border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-white)] shadow-lg">
            {results.map((n) => (
              <button
                key={n.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={async () => {
                  await onAttach(n);
                  setQuery('');
                }}
                className="flex w-full flex-col items-start px-2 py-1.5 text-left hover:bg-[color:var(--color-nis-paper)]"
              >
                <span className="font-sans text-[12px]">{n.label}</span>
                <span className="font-mono text-[9px] text-nis-muted">
                  {n.kind} · {n.stance}
                </span>
              </button>
            ))}
          </div>
        )}
        {showResults && query.trim() && results.length === 0 && (
          <div className="absolute left-0 right-0 top-full z-20 border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-white)] px-2 py-2 shadow-lg">
            <p className="m-0 text-[11px] text-nis-muted">
              No match in the map. Use “Open argument map” below to create one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
