'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface PendingChanges {
  title?: string;
  subtitle?: string;
  section?: string;
  order?: number;
  status?: string;
  body?: string;
}

interface EditModeContextValue {
  isAdmin: boolean;
  isEditMode: boolean;
  toggleEditMode: () => void;
  exitEditMode: () => void;
  pendingChanges: PendingChanges;
  setField: <K extends keyof PendingChanges>(key: K, value: PendingChanges[K]) => void;
  clearChanges: () => void;
  hasPendingChanges: boolean;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  slug: string;
}

const EditModeContext = createContext<EditModeContextValue | null>(null);

export function useEditMode() {
  const ctx = useContext(EditModeContext);
  if (!ctx) {
    throw new Error('useEditMode must be used within EditModeProvider');
  }
  return ctx;
}

export function useEditModeOptional() {
  return useContext(EditModeContext);
}

interface EditModeProviderProps {
  isAdmin: boolean;
  slug: string;
  children: ReactNode;
}

const DRAFT_STORAGE_KEY = (slug: string) => `canopies-draft-${slug}`;
const MAX_UNDO = 50;

export function EditModeProvider({ isAdmin, slug, children }: EditModeProviderProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});

  // Undo/redo stacks
  const undoStack = useRef<PendingChanges[]>([]);
  const redoStack = useRef<PendingChanges[]>([]);
  const [undoLen, setUndoLen] = useState(0);
  const [redoLen, setRedoLen] = useState(0);

  // Load draft from localStorage on entering edit mode
  useEffect(() => {
    if (isEditMode) {
      try {
        const stored = localStorage.getItem(DRAFT_STORAGE_KEY(slug));
        if (stored) {
          const parsed = JSON.parse(stored) as PendingChanges;
          if (Object.keys(parsed).length > 0) {
            setPendingChanges(parsed);
          }
        }
      } catch {
        // ignore
      }
    }
  }, [isEditMode, slug]);

  // Autosave draft to localStorage whenever pending changes update
  useEffect(() => {
    if (!isEditMode) return;
    try {
      if (Object.keys(pendingChanges).length > 0) {
        localStorage.setItem(DRAFT_STORAGE_KEY(slug), JSON.stringify(pendingChanges));
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY(slug));
      }
    } catch {
      // ignore
    }
  }, [pendingChanges, isEditMode, slug]);

  const pushUndo = useCallback((changes: PendingChanges) => {
    undoStack.current = [...undoStack.current.slice(-MAX_UNDO + 1), changes];
    redoStack.current = [];
    setUndoLen(undoStack.current.length);
    setRedoLen(0);
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => {
      if (prev) {
        // Exiting edit mode — clear everything
        setPendingChanges({});
        undoStack.current = [];
        redoStack.current = [];
        setUndoLen(0);
        setRedoLen(0);
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY(slug));
        } catch {}
      }
      return !prev;
    });
  }, [slug]);

  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
    setPendingChanges({});
    undoStack.current = [];
    redoStack.current = [];
    setUndoLen(0);
    setRedoLen(0);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY(slug));
    } catch {}
  }, [slug]);

  const setField = useCallback(
    <K extends keyof PendingChanges>(key: K, value: PendingChanges[K]) => {
      setPendingChanges((prev) => {
        pushUndo(prev);
        return { ...prev, [key]: value };
      });
    },
    [pushUndo],
  );

  const clearChanges = useCallback(() => {
    setPendingChanges({});
    undoStack.current = [];
    redoStack.current = [];
    setUndoLen(0);
    setRedoLen(0);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current[undoStack.current.length - 1];
    undoStack.current = undoStack.current.slice(0, -1);
    setPendingChanges((current) => {
      redoStack.current = [...redoStack.current, current];
      setUndoLen(undoStack.current.length);
      setRedoLen(redoStack.current.length);
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current[redoStack.current.length - 1];
    redoStack.current = redoStack.current.slice(0, -1);
    setPendingChanges((current) => {
      undoStack.current = [...undoStack.current, current];
      setUndoLen(undoStack.current.length);
      setRedoLen(redoStack.current.length);
      return next;
    });
  }, []);

  // Global keyboard shortcuts for undo/redo
  useEffect(() => {
    if (!isEditMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (e.metaKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isEditMode, undo, redo]);

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  return (
    <EditModeContext.Provider
      value={{
        isAdmin,
        isEditMode,
        toggleEditMode,
        exitEditMode,
        pendingChanges,
        setField,
        clearChanges,
        hasPendingChanges,
        undo,
        redo,
        canUndo: undoLen > 0,
        canRedo: redoLen > 0,
        slug,
      }}
    >
      {children}
    </EditModeContext.Provider>
  );
}
