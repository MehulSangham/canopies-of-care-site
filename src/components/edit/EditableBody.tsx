'use client';

import { useEditMode } from './EditModeProvider';
import { useBlocksOptional } from './BlocksContext';
import { BlockEditor } from './BlockEditor';
import { BlockPreview } from './BlockPreview';
import { AddBlockButton } from './AddBlockMenu';
import { AttachmentChips } from './AttachmentChips';
import { Eye, Pencil } from 'lucide-react';

interface EditableBodyProps {
  markdown: string;
  children: React.ReactNode;
}

export function EditableBody({ markdown, children }: EditableBodyProps) {
  const { isEditMode } = useEditMode();

  if (!isEditMode) {
    return <>{children}</>;
  }

  return <EditableBodyInner renderedContent={children} />;
}

function EditableBodyInner({ renderedContent }: { renderedContent: React.ReactNode }) {
  const ctx = useBlocksOptional();

  if (!ctx) {
    return <p className="text-nis-muted text-sm">Block context not available.</p>;
  }

  const {
    blocks,
    updateBlock,
    moveUp,
    moveDown,
    duplicateBlock,
    deleteBlock,
    addBlock,
    setActiveBlockId,
    focusedIndex,
    setFocusedIndex,
    dirtyBlockIds,
    isPreviewMode,
    togglePreviewMode,
  } = ctx;

  // Preview mode — show the full rendered content
  if (isPreviewMode) {
    return (
      <div className="relative mx-auto w-full max-w-[686px]">
        <div className="sticky top-[56px] z-30 flex items-center justify-end mb-4">
          <button
            type="button"
            onClick={togglePreviewMode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] text-[color:var(--color-nis-ink)] hover:bg-[color:var(--color-nis-accent-soft)] shadow-[2px_2px_0_0_var(--color-nis-accent)] transition-all"
          >
            <Pencil className="h-3 w-3" />
            Back to editing
          </button>
        </div>
        {renderedContent}
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[686px] py-4">
      {/* Preview toggle */}
      <div className="flex items-center justify-end mb-2">
        <button
          type="button"
          onClick={togglePreviewMode}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-nis-muted hover:text-[color:var(--color-nis-ink)] transition-colors"
        >
          <Eye className="h-3 w-3" />
          Preview
        </button>
      </div>

      <AttachmentChips blockId="page" raw="" />
      <AddBlockButton onAdd={(raw) => addBlock(-1, raw)} />

      {blocks.map((block, index) => {
        const isDirty = dirtyBlockIds.has(block.id);
        const isFocused = index === focusedIndex;

        return (
          <div
            key={block.id}
            data-block-id={block.id}
            className={isFocused ? 'relative z-10' : ''}
          >
            <BlockEditor
              block={block}
              rendered={<BlockPreview block={block} />}
              onUpdate={updateBlock}
              onMoveUp={() => moveUp(index)}
              onMoveDown={() => moveDown(index)}
              onDuplicate={() => duplicateBlock(index)}
              onDelete={() => deleteBlock(index)}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
              onFocus={() => {
                setActiveBlockId(block.id);
                setFocusedIndex(index);
              }}
              isDirty={isDirty}
              isFocused={isFocused}
            />
            <AttachmentChips blockId={block.id} raw={block.raw} />
            <AddBlockButton onAdd={(raw) => addBlock(index, raw)} />
          </div>
        );
      })}
    </div>
  );
}
