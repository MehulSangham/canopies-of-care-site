'use client';

import { useState } from 'react';
import { Pencil, X, LayoutList } from 'lucide-react';
import { useEditMode } from './EditModeProvider';
import { useBlocksOptional } from './BlocksContext';
import { BlockOutlinePanel } from './BlockOutlinePanel';

export function EditButton() {
  const { isAdmin, isEditMode, toggleEditMode } = useEditMode();
  const blocksCtx = useBlocksOptional();
  const [showMobileOutline, setShowMobileOutline] = useState(false);

  if (!isAdmin) return null;

  return (
    <>
      {/* Edit toggle button */}
      <button
        type="button"
        onClick={toggleEditMode}
        className={`
          fixed bottom-6 right-6 z-[100]
          inline-flex h-12 w-12 items-center justify-center
          border border-[color:var(--color-nis-ink)]
          text-[color:var(--color-nis-ink)]
          transition-all duration-160
          ${isEditMode
            ? 'bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)] shadow-none'
            : 'bg-[color:var(--color-nis-white)] shadow-[4px_4px_0_0_var(--color-nis-accent)] hover:shadow-[6px_6px_0_0_var(--color-nis-accent)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
          }
        `}
        aria-label={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
        title={isEditMode ? 'Exit edit mode' : 'Edit this page'}
      >
        {isEditMode ? <X className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
      </button>

      {/* Mobile structure button — only in edit mode, only on small screens */}
      {isEditMode && blocksCtx && (
        <button
          type="button"
          onClick={() => setShowMobileOutline(true)}
          className="fixed bottom-6 right-20 z-[100] lg:hidden inline-flex h-12 w-12 items-center justify-center border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] text-[color:var(--color-nis-ink)] shadow-[4px_4px_0_0_var(--color-nis-accent)]"
          aria-label="Show structure"
          title="Page structure"
        >
          <LayoutList className="h-5 w-5" />
        </button>
      )}

      {/* Mobile outline drawer */}
      {showMobileOutline && blocksCtx && (
        <div className="fixed inset-0 z-[150] lg:hidden">
          <div
            className="absolute inset-0 bg-[color:var(--color-nis-ink)]/30 backdrop-blur-sm"
            onClick={() => setShowMobileOutline(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto border-t border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--color-nis-soft)]">
              <span className="font-sans text-sm font-bold text-[color:var(--color-nis-ink)]">
                Structure
              </span>
              <button
                type="button"
                onClick={() => setShowMobileOutline(false)}
                className="text-nis-muted hover:text-[color:var(--color-nis-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <BlockOutlinePanel />
          </div>
        </div>
      )}
    </>
  );
}
