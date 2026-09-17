'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Pencil, ChevronUp, ChevronDown, Copy, Trash2, Upload, Maximize2 } from 'lucide-react';
import { RichTextBlock } from './RichTextBlock';
import { ExpandedBlockEditor } from './ExpandedBlockEditor';
import { useBlocksOptional } from './BlocksContext';
import { uploadImage } from '@/app/actions/upload-image';
import type { MdxBlock, BlockType } from '@/lib/mdx-blocks';

const BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Heading',
  paragraph: 'Paragraph',
  callout: 'Callout',
  image: 'Image',
  video: 'Video',
  footnote: 'Footnote',
  blockquote: 'Quote',
  list: 'List',
  hr: 'Divider',
  empty: '',
};

interface BlockEditorProps {
  block: MdxBlock;
  rendered: React.ReactNode;
  onUpdate: (blockId: string, newRaw: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onFocus?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isDirty?: boolean;
  isFocused?: boolean;
}

export function BlockEditor({
  block,
  rendered,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onFocus,
  isFirst = false,
  isLast = false,
  isDirty = false,
  isFocused = false,
}: BlockEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [draft, setDraft] = useState(block.raw);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const blocksCtx = useBlocksOptional();

  // Collect existing footnote IDs for the footnote insertion menu
  const footnoteIds = useMemo(() => {
    if (!blocksCtx) return [];
    return blocksCtx.blocks
      .filter((b) => b.type === 'footnote' && b.meta?.footnoteId)
      .map((b) => b.meta!.footnoteId!);
  }, [blocksCtx]);

  const handleAddFootnote = useCallback(
    (id: string, text: string) => {
      if (!blocksCtx) return;
      // Find the last footnote block index, or the end of the document
      let insertAfter = blocksCtx.blocks.length - 1;
      for (let i = blocksCtx.blocks.length - 1; i >= 0; i--) {
        if (blocksCtx.blocks[i].type === 'footnote') {
          insertAfter = i;
          break;
        }
      }
      blocksCtx.addBlock(insertAfter, `[^${id}]: ${text}`);
    },
    [blocksCtx],
  );

  const label =
    block.type === 'callout' && block.meta?.calloutType
      ? `${block.meta.calloutType}`
      : BLOCK_LABELS[block.type];

  const isRichEditable = block.type === 'paragraph' || block.type === 'heading';

  useEffect(() => {
    if (isEditing && !isRichEditable && textareaRef.current) {
      textareaRef.current.focus();
      autoResize(textareaRef.current);
    }
  }, [isEditing, isRichEditable]);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleEdit = useCallback(() => {
    setDraft(block.raw);
    setIsEditing(true);
    onFocus?.();
  }, [block.raw, onFocus]);

  const handleConfirm = useCallback(
    (value?: string) => {
      const finalValue = value ?? draft;
      if (finalValue !== block.raw) {
        onUpdate(block.id, finalValue);
      }
      setIsEditing(false);
    },
    [draft, block.raw, block.id, onUpdate],
  );

  const handleCancel = useCallback(() => {
    setDraft(block.raw);
    setIsEditing(false);
  }, [block.raw]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
      if (e.key === 'Enter' && e.metaKey) {
        e.preventDefault();
        handleConfirm();
      }
    },
    [handleCancel, handleConfirm],
  );

  const handleExpand = useCallback(() => {
    setDraft(block.raw);
    setIsExpanded(true);
    onFocus?.();
  }, [block.raw, onFocus]);

  // Expanded overlay editor
  if (isExpanded) {
    return (
      <ExpandedBlockEditor
        block={{ ...block, raw: draft }}
        onConfirm={(newRaw) => {
          if (newRaw !== block.raw) {
            onUpdate(block.id, newRaw);
          }
          setIsExpanded(false);
          setIsEditing(false);
        }}
        onCancel={() => {
          setDraft(block.raw);
          setIsExpanded(false);
          setIsEditing(false);
        }}
        footnoteIds={footnoteIds}
        onAddFootnote={handleAddFootnote}
      />
    );
  }

  // Non-editable blocks (hr, empty)
  if (block.type === 'hr' || block.type === 'empty') {
    return (
      <div className="group/block relative -mx-4">
        <BlockActions
          label={label}
          onEdit={handleEdit}
          onMoveUp={isFirst ? undefined : onMoveUp}
          onMoveDown={isLast ? undefined : onMoveDown}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          minimal
        />
        <div className="pl-4">{rendered}</div>
      </div>
    );
  }

  // Editing: rich text for paragraphs/headings
  if (isEditing && isRichEditable) {
    return (
      <div className="relative my-2 -mx-4">
        <RichTextBlock
          markdown={block.raw}
          isHeading={block.type === 'heading'}
          headingLevel={block.meta?.level ?? 2}
          onConfirm={(md) => handleConfirm(md)}
          onCancel={handleCancel}
          onExpand={handleExpand}
          footnoteIds={footnoteIds}
          onAddFootnote={handleAddFootnote}
        />
      </div>
    );
  }

  // Editing: textarea for structural blocks
  if (isEditing) {
    return (
      <div className="relative my-2 -mx-4">
        <div className="border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] shadow-[4px_4px_0_0_var(--color-nis-accent)]">
          <div className="flex items-center justify-between border-b border-[color:var(--color-nis-soft)] px-3 py-1.5 bg-[color:var(--color-nis-paper)]">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
              {label}
            </span>
            {block.type === 'image' && (
              <ImageUploadBtn
                onUploaded={(url) => {
                  const altMatch = draft.match(/!\[([^\]]*)\]/);
                  const alt = altMatch ? altMatch[1] : 'Image';
                  setDraft(`![${alt}](${url})`);
                }}
              />
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              autoResize(e.target);
            }}
            onKeyDown={handleKeyDown}
            className="
              w-full resize-none overflow-hidden
              bg-[color:var(--color-nis-white)] px-4 py-3
              font-mono text-[13px] leading-[1.6] text-[color:var(--color-nis-ink)]
              border-0 outline-none
            "
            spellCheck
          />

          <div className="flex items-center justify-between border-t border-[color:var(--color-nis-soft)] px-3 py-1.5 bg-[color:var(--color-nis-paper)]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-nis-muted">⌘⏎ save · esc cancel</span>
              <button
                type="button"
                onClick={handleExpand}
                title="Expand editor"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-nis-muted hover:text-[color:var(--color-nis-ink)] transition-colors"
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCancel}
                className="px-2.5 py-1 text-[11px] font-bold text-nis-muted hover:text-[color:var(--color-nis-ink)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirm()}
                className="px-2.5 py-1 text-[11px] font-bold bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)] hover:bg-[color:var(--color-nis-hover)] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Read state — hover to reveal edit affordance + actions
  return (
    <div
      className={`group/block relative -mx-4 ${isFocused ? 'ring-1 ring-[color:var(--color-nis-accent)]/40 rounded-sm' : ''}`}
    >
      {/* Left accent line — always visible if dirty, on hover otherwise */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] transition-colors duration-100 ${
        isDirty
          ? 'bg-[color:var(--color-nis-accent)]'
          : 'bg-transparent group-hover/block:bg-[color:var(--color-nis-accent)]'
      }`} />

      {/* Dirty dot */}
      {isDirty && (
        <div className="absolute left-[-6px] top-2 h-2 w-2 rounded-full bg-[color:var(--color-nis-accent)]" title="Modified" />
      )}

      {/* Action bar */}
      <BlockActions
        label={label}
        onEdit={handleEdit}
        onExpand={handleExpand}
        onMoveUp={isFirst ? undefined : onMoveUp}
        onMoveDown={isLast ? undefined : onMoveDown}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />

      {/* Content — click to edit */}
      <div
        className="pl-4 cursor-pointer transition-colors duration-100 group-hover/block:bg-[color:var(--color-nis-accent-soft)]/30"
        onClick={handleEdit}
        role="button"
        tabIndex={0}
        aria-label={`Edit ${label}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleEdit();
        }}
      >
        {rendered}
      </div>
    </div>
  );
}

function BlockActions({
  label,
  onEdit,
  onExpand,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  minimal = false,
}: {
  label: string;
  onEdit: () => void;
  onExpand?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  minimal?: boolean;
}) {
  return (
    <div className="absolute -right-2 top-0 z-10 flex items-center gap-0.5 opacity-0 transition-opacity duration-100 group-hover/block:opacity-100 translate-x-full">
      {!minimal && (
        <>
          <ActionBtn onClick={onEdit} title={`Edit ${label}`}>
            <Pencil className="h-3 w-3" />
          </ActionBtn>
          {onExpand && (
            <ActionBtn onClick={onExpand} title="Expand editor">
              <Maximize2 className="h-3 w-3" />
            </ActionBtn>
          )}
        </>
      )}
      <ActionBtn onClick={onMoveUp} title="Move up" disabled={!onMoveUp}>
        <ChevronUp className="h-3 w-3" />
      </ActionBtn>
      <ActionBtn onClick={onMoveDown} title="Move down" disabled={!onMoveDown}>
        <ChevronDown className="h-3 w-3" />
      </ActionBtn>
      <ActionBtn onClick={onDuplicate} title="Duplicate">
        <Copy className="h-3 w-3" />
      </ActionBtn>
      <ActionBtn
        onClick={() => {
          if (window.confirm('Delete this block? This can be undone with ⌘Z.')) {
            onDelete?.();
          }
        }}
        title="Delete"
        danger
      >
        <Trash2 className="h-3 w-3" />
      </ActionBtn>
    </div>
  );
}

function ActionBtn({
  onClick,
  title,
  disabled = false,
  danger = false,
  children,
}: {
  onClick?: () => void;
  title: string;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={title}
      disabled={disabled}
      className={`
        inline-flex h-6 w-6 items-center justify-center transition-colors
        ${disabled
          ? 'text-[color:var(--color-nis-soft)] cursor-not-allowed'
          : danger
            ? 'text-nis-muted hover:text-[color:var(--color-nis-earth)] hover:bg-[color:var(--color-nis-earth)]/10'
            : 'text-nis-muted hover:text-[color:var(--color-nis-ink)] hover:bg-[color:var(--color-nis-accent-soft)]'
        }
      `}
    >
      {children}
    </button>
  );
}

function ImageUploadBtn({ onUploaded }: { onUploaded: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await uploadImage(fd);
      onUploaded(result.url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-nis-muted hover:text-[color:var(--color-nis-ink)] transition-colors disabled:opacity-40"
      >
        <Upload className="h-3 w-3" />
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </>
  );
}
