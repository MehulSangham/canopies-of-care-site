'use client';

import { useMemo, useState } from 'react';
import { Link2, Plus, X } from 'lucide-react';
import { useTaxonomyOptional } from './TaxonomyProvider';
import { useEditModeOptional } from './EditModeProvider';
import {
  ATTACHMENT_ROLES,
  searchNodes,
  type AttachmentRole,
} from '@/lib/taxonomy';
import { excerptOf } from '@/lib/taxonomy';

export function AttachmentChips({
  blockId,
  raw,
}: {
  blockId: string;
  raw: string;
}) {
  const tax = useTaxonomyOptional();
  const edit = useEditModeOptional();
  const slug = edit?.slug ?? '';
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<AttachmentRole>('advances-reframe');

  const mine = useMemo(
    () =>
      tax?.attachments.filter((a) => a.slug === slug && a.blockId === blockId) ?? [],
    [tax?.attachments, slug, blockId],
  );

  if (!tax || !edit?.isEditMode) return null;

  const results = searchNodes(tax.map.nodes, query).slice(0, 12);

  return (
    <div className="relative mt-1 mb-2 pl-4">
      <div className="flex flex-wrap items-center gap-1">
        {mine.map((a) => {
          const node = tax.map.nodes.find((n) => n.id === a.nodeId);
          return (
            <span
              key={`${a.nodeId}-${a.role}`}
              className="inline-flex items-center gap-1 border border-[color:var(--color-nis-soft)] px-1.5 py-0.5 font-mono text-[9px] text-nis-muted"
              title={node?.definition}
            >
              {node?.label ?? a.nodeId}
              <button
                type="button"
                onClick={() => tax.detach({ slug, blockId, nodeId: a.nodeId })}
                className="hover:text-[#b0483c]"
                aria-label="Detach"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 px-1 py-0.5 font-sans text-[9px] font-bold uppercase tracking-[0.08em] text-nis-muted hover:text-[color:var(--color-nis-ink)]"
        >
          {mine.length === 0 ? <Link2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {mine.length === 0 ? 'Attach' : 'Add'}
        </button>
      </div>

      {open && (
        <div className="absolute left-4 top-full z-30 mt-1 w-[320px] border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-white)] p-3 shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the map…"
            className="mb-2 w-full border-b border-[color:var(--color-nis-soft)] bg-transparent py-1 font-sans text-[12px] outline-none"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AttachmentRole)}
            className="mb-2 w-full bg-transparent font-sans text-[11px] text-nis-muted outline-none"
          >
            {ATTACHMENT_ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="max-h-48 overflow-y-auto">
            {results.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={async () => {
                  await tax.attach({
                    slug,
                    blockId,
                    excerpt: excerptOf(raw),
                    nodeId: n.id,
                    role,
                  });
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full flex-col items-start px-1 py-1.5 text-left hover:bg-[color:var(--color-nis-paper)]"
              >
                <span className="font-sans text-[12px]">{n.label}</span>
                <span className="font-mono text-[9px] text-nis-muted">
                  {n.kind} · {n.stance}
                </span>
              </button>
            ))}
            {results.length === 0 && (
              <p className="px-1 py-2 text-[11px] text-nis-muted">No matches. Open the argument map to create one.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
