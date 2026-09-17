'use client';

import { useState, useCallback, useRef } from 'react';
import {
  GripVertical,
  Type,
  Heading2,
  MessageSquareQuote,
  Image,
  Film,
  Hash,
  List,
  Minus,
  Quote,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
} from 'lucide-react';
import { useBlocks } from './BlocksContext';
import type { MdxBlock, BlockType } from '@/lib/mdx-blocks';

const BLOCK_ICONS: Record<BlockType, typeof Type> = {
  heading: Heading2,
  paragraph: Type,
  callout: MessageSquareQuote,
  image: Image,
  video: Film,
  footnote: Hash,
  blockquote: Quote,
  list: List,
  hr: Minus,
  empty: Type,
};

const BLOCK_COLORS: Record<string, string> = {
  heading: 'var(--color-nis-ink)',
  paragraph: 'var(--color-nis-muted)',
  callout: 'var(--color-nis-accent)',
  claim: 'var(--color-nis-accent)',
  warrant: 'var(--color-nis-deep-forest)',
  qualifier: 'var(--color-nis-earth)',
  rebuttal: 'var(--color-nis-digital-pink)',
  image: 'var(--color-nis-muted)',
  footnote: 'var(--color-nis-muted)',
  blockquote: 'var(--color-nis-ink)',
  list: 'var(--color-nis-muted)',
  hr: 'var(--color-nis-soft)',
};

function getBlockLabel(block: MdxBlock): string {
  if (block.type === 'heading') {
    return block.raw.replace(/^#{1,6}\s+/, '').slice(0, 40);
  }
  if (block.type === 'callout') {
    return block.meta?.calloutType?.toUpperCase() || 'CALLOUT';
  }
  if (block.type === 'footnote') {
    return `Footnote ${block.meta?.footnoteId || ''}`;
  }
  if (block.type === 'paragraph') {
    return block.raw.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').slice(0, 50);
  }
  if (block.type === 'image') {
    return block.meta?.alt || 'Image';
  }
  if (block.type === 'hr') return '—';
  if (block.type === 'list') return 'List';
  if (block.type === 'blockquote') return 'Quote';
  return block.type;
}

function getAccentColor(block: MdxBlock): string {
  if (block.type === 'callout' && block.meta?.calloutType) {
    return BLOCK_COLORS[block.meta.calloutType] || BLOCK_COLORS.callout;
  }
  return BLOCK_COLORS[block.type] || 'var(--color-nis-muted)';
}

export function BlockOutlinePanel() {
  const { blocks, moveBlock, moveUp, moveDown, deleteBlock, activeBlockId, scrollToBlock, dirtyBlockIds, focusedIndex, setFocusedIndex } =
    useBlocks();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropTarget(index);
    },
    [],
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      dragCounter.current++;
      setDropTarget(index);
    },
    [],
  );

  const handleDragLeave = useCallback(() => {
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      setDropTarget(null);
      dragCounter.current = 0;
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (!isNaN(fromIndex) && fromIndex !== toIndex) {
        moveBlock(fromIndex, toIndex);
      }
      setDragIndex(null);
      setDropTarget(null);
      dragCounter.current = 0;
    },
    [moveBlock],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDropTarget(null);
    dragCounter.current = 0;
  }, []);

  return (
    <nav className="pointer-events-auto h-full overflow-y-auto pb-12 pt-4 pr-3">
      <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-nis-muted mb-3 pl-2">
        Structure
      </p>

      <div className="flex flex-col gap-0.5">
        {blocks.map((block, index) => {
          const Icon = BLOCK_ICONS[block.type];
          const label = getBlockLabel(block);
          const accent = getAccentColor(block);
          const isActive = activeBlockId === block.id;
          const isDragging = dragIndex === index;
          const isDropTarget = dropTarget === index && dragIndex !== index;
          const isDirty = dirtyBlockIds.has(block.id);

          return (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => {
                setFocusedIndex(index);
                scrollToBlock(block.id);
              }}
              className={`
                group/item flex items-center gap-1.5 pl-1 pr-1 py-1.5 cursor-pointer select-none
                transition-all duration-100
                ${isDragging ? 'opacity-40' : ''}
                ${isDropTarget ? 'bg-[color:var(--color-nis-accent-soft)] border-t-2 border-[color:var(--color-nis-accent)]' : 'border-t-2 border-transparent'}
                ${isActive
                  ? 'bg-[color:var(--color-nis-accent-soft)]/60'
                  : 'hover:bg-[color:var(--color-nis-paper)]'
                }
              `}
            >
              {/* Drag handle */}
              <GripVertical className="h-3 w-3 text-[color:var(--color-nis-soft)] group-hover/item:text-nis-muted shrink-0 cursor-grab active:cursor-grabbing" />

              {/* Type accent bar */}
              <div
                className="w-[3px] h-4 shrink-0 rounded-full"
                style={{ backgroundColor: accent }}
              />

              {/* Icon */}
              <Icon className="h-3 w-3 shrink-0 text-nis-muted" />

              {/* Dirty dot */}
              {isDirty && (
                <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-nis-accent)] shrink-0" />
              )}

              {/* Label */}
              <span
                className={`text-[11px] leading-tight truncate flex-1 min-w-0 ${
                  block.type === 'heading'
                    ? 'font-bold text-[color:var(--color-nis-ink)]'
                    : 'text-nis-muted'
                } ${isActive ? 'text-[color:var(--color-nis-ink)]' : ''}`}
              >
                {label}
              </span>

              {/* Quick actions on hover */}
              <div className="flex items-center gap-0 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                <MiniBtn
                  onClick={(e) => { e.stopPropagation(); moveUp(index); }}
                  disabled={index === 0}
                  title="Move up"
                >
                  <ChevronUp className="h-2.5 w-2.5" />
                </MiniBtn>
                <MiniBtn
                  onClick={(e) => { e.stopPropagation(); moveDown(index); }}
                  disabled={index === blocks.length - 1}
                  title="Move down"
                >
                  <ChevronDown className="h-2.5 w-2.5" />
                </MiniBtn>
                <MiniBtn
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this block?')) deleteBlock(index);
                  }}
                  title="Delete"
                  danger
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </MiniBtn>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function MiniBtn({
  onClick,
  disabled = false,
  danger = false,
  title,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  danger?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        inline-flex h-5 w-5 items-center justify-center transition-colors
        ${disabled
          ? 'text-[color:var(--color-nis-soft)] cursor-not-allowed'
          : danger
            ? 'text-nis-muted hover:text-[color:var(--color-nis-earth)]'
            : 'text-nis-muted hover:text-[color:var(--color-nis-ink)]'
        }
      `}
    >
      {children}
    </button>
  );
}
