'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Type, Heading2, MessageSquareQuote, Image, Film, Hash, List, Minus, Quote } from 'lucide-react';
import type { BlockType } from '@/lib/mdx-blocks';

const BLOCK_TEMPLATES: { type: BlockType; label: string; icon: typeof Type; raw: string }[] = [
  { type: 'paragraph', label: 'Paragraph', icon: Type, raw: 'New paragraph text...' },
  { type: 'heading', label: 'Heading', icon: Heading2, raw: '## New Heading' },
  {
    type: 'callout',
    label: 'Callout',
    icon: MessageSquareQuote,
    raw: '<Callout type="claim">\nYour claim or note here.\n</Callout>',
  },
  { type: 'image', label: 'Image', icon: Image, raw: '![Alt text](/images/placeholder.jpg "Caption here")' },
  { type: 'video', label: 'Video', icon: Film, raw: '<Video url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" caption="Video caption" />' },
  { type: 'blockquote', label: 'Quote', icon: Quote, raw: '> Your quote here.' },
  { type: 'footnote', label: 'Footnote', icon: Hash, raw: '[^n]: Footnote text here.' },
  { type: 'list', label: 'List', icon: List, raw: '- Item one\n- Item two\n- Item three' },
  { type: 'hr', label: 'Divider', icon: Minus, raw: '---' },
];

interface AddBlockMenuProps {
  onAdd: (raw: string) => void;
}

export function AddBlockButton({ onAdd }: AddBlockMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
          group flex w-full items-center justify-center gap-2 py-1
          text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted
          opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity
          border-y border-dashed border-transparent hover:border-[color:var(--color-nis-soft)]
        "
        aria-label="Add block"
      >
        <Plus className="h-3 w-3" />
        <span>Add block</span>
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 mt-1 border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] shadow-[4px_4px_0_0_var(--color-nis-accent)] min-w-[180px]">
          {BLOCK_TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <button
                key={tmpl.type}
                type="button"
                onClick={() => {
                  onAdd(tmpl.raw);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-[color:var(--color-nis-ink)] hover:bg-[color:var(--color-nis-accent-soft)] transition-colors"
              >
                <Icon className="h-3.5 w-3.5 text-nis-muted shrink-0" />
                {tmpl.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
