'use client';

import { Save, XCircle, Loader2, Undo2, Redo2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useEditMode } from './EditModeProvider';
import { useToast } from './Toast';

interface EditToolbarProps {
  onSave: () => Promise<void>;
}

export function EditToolbar({ onSave }: EditToolbarProps) {
  const { isEditMode, exitEditMode, hasPendingChanges, undo, redo, canUndo, canRedo } =
    useEditMode();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditMode || !hasPendingChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isEditMode, hasPendingChanges]);

  if (!isEditMode) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
      toast('success', 'Changes saved');
      exitEditMode();
    } catch (error) {
      console.error('Save failed:', error);
      toast('error', 'Save failed — check the console');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasPendingChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to discard them?',
      );
      if (!confirmed) return;
    }
    exitEditMode();
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] px-3 py-2 shadow-[4px_4px_0_0_var(--color-nis-accent)]">
      <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted mr-1">
        {hasPendingChanges ? 'Unsaved changes' : 'Edit mode'}
      </span>

      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        className="inline-flex h-7 w-7 items-center justify-center text-nis-muted hover:text-[color:var(--color-nis-ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Undo (⌘Z)"
      >
        <Undo2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        className="inline-flex h-7 w-7 items-center justify-center text-nis-muted hover:text-[color:var(--color-nis-ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Redo (⌘⇧Z)"
      >
        <Redo2 className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-5 bg-[color:var(--color-nis-soft)] mx-1" />

      <button
        type="button"
        onClick={handleSave}
        disabled={!hasPendingChanges || isSaving}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)] hover:bg-[color:var(--color-nis-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {isSaving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Save className="h-3.5 w-3.5" />
        )}
        Save
      </button>

      <button
        type="button"
        onClick={handleCancel}
        disabled={isSaving}
        className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-nis-muted hover:text-[color:var(--color-nis-ink)] transition-colors"
      >
        <XCircle className="h-3.5 w-3.5" />
        Cancel
      </button>
    </div>
  );
}
