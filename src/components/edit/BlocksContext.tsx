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
import { parseMdxBlocks, blocksToMarkdown, type MdxBlock } from '@/lib/mdx-blocks';
import { useEditMode } from './EditModeProvider';

interface BlocksContextValue {
  blocks: MdxBlock[];
  updateBlock: (blockId: string, newRaw: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  duplicateBlock: (index: number) => void;
  deleteBlock: (index: number) => void;
  addBlock: (afterIndex: number, raw: string) => void;
  activeBlockId: string | null;
  setActiveBlockId: (id: string | null) => void;
  focusedIndex: number;
  setFocusedIndex: (i: number) => void;
  scrollToBlock: (blockId: string) => void;
  dirtyBlockIds: Set<string>;
  isPreviewMode: boolean;
  togglePreviewMode: () => void;
}

const BlocksContext = createContext<BlocksContextValue | null>(null);

export function useBlocks() {
  const ctx = useContext(BlocksContext);
  if (!ctx) throw new Error('useBlocks must be used within BlocksProvider');
  return ctx;
}

export function useBlocksOptional() {
  return useContext(BlocksContext);
}

let nextId = 2000;

function detectBlockType(raw: string): MdxBlock['type'] {
  if (/^#{1,6}\s/.test(raw)) return 'heading';
  if (/^<Callout/.test(raw)) return 'callout';
  if (/^!\[/.test(raw)) return 'image';
  if (/^\[\^\w+\]:/.test(raw)) return 'footnote';
  if (/^>\s/.test(raw)) return 'blockquote';
  if (/^---\s*$/.test(raw)) return 'hr';
  if (/^(\s*[-*+]|\s*\d+\.)\s/.test(raw)) return 'list';
  return 'paragraph';
}

export function BlocksProvider({
  markdown,
  children,
}: {
  markdown: string;
  children: ReactNode;
}) {
  const { setField } = useEditMode();
  const [blocks, setBlocks] = useState<MdxBlock[]>(() => parseMdxBlocks(markdown));
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [dirtyBlockIds, setDirtyBlockIds] = useState<Set<string>>(new Set());
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const originalBlocksRef = useRef<Map<string, string>>(new Map());

  // Store original block content for dirty tracking
  useEffect(() => {
    const map = new Map<string, string>();
    parseMdxBlocks(markdown).forEach((b) => map.set(b.id, b.raw));
    originalBlocksRef.current = map;
  }, [markdown]);

  const sync = useCallback(
    (newBlocks: MdxBlock[]) => {
      setField('body', blocksToMarkdown(newBlocks));
    },
    [setField],
  );

  const markDirty = useCallback((blockId: string, newRaw: string) => {
    const original = originalBlocksRef.current.get(blockId);
    setDirtyBlockIds((prev) => {
      const next = new Set(prev);
      if (original !== undefined && newRaw !== original) {
        next.add(blockId);
      } else {
        next.delete(blockId);
      }
      return next;
    });
  }, []);

  const updateBlock = useCallback(
    (blockId: string, newRaw: string) => {
      setBlocks((prev) => {
        const next = prev.map((b) =>
          b.id === blockId ? { ...b, raw: newRaw } : b,
        );
        sync(next);
        return next;
      });
      markDirty(blockId, newRaw);
    },
    [sync, markDirty],
  );

  const moveBlock = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      setBlocks((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        sync(next);
        return next;
      });
      // All blocks are dirty after a move (order changed)
      setDirtyBlockIds((prev) => {
        const next = new Set(prev);
        next.add('__moved__');
        return next;
      });
    },
    [sync],
  );

  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      moveBlock(index, index - 1);
      setFocusedIndex(index - 1);
    },
    [moveBlock],
  );

  const moveDown = useCallback(
    (index: number) => {
      setBlocks((prev) => {
        if (index >= prev.length - 1) return prev;
        const next = [...prev];
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        sync(next);
        setFocusedIndex(index + 1);
        return next;
      });
      setDirtyBlockIds((prev) => new Set([...prev, '__moved__']));
    },
    [sync],
  );

  const duplicateBlock = useCallback(
    (index: number) => {
      setBlocks((prev) => {
        const newId = `block-${nextId++}`;
        const copy: MdxBlock = { ...prev[index], id: newId };
        const next = [...prev];
        next.splice(index + 1, 0, copy);
        sync(next);
        return next;
      });
      setDirtyBlockIds((prev) => new Set([...prev, '__added__']));
    },
    [sync],
  );

  const deleteBlock = useCallback(
    (index: number) => {
      setBlocks((prev) => {
        const next = prev.filter((_, i) => i !== index);
        sync(next);
        return next;
      });
      setDirtyBlockIds((prev) => new Set([...prev, '__deleted__']));
    },
    [sync],
  );

  const addBlock = useCallback(
    (afterIndex: number, raw: string) => {
      const newBlock: MdxBlock = {
        id: `block-${nextId++}`,
        type: detectBlockType(raw),
        raw,
      };
      setBlocks((prev) => {
        const next = [...prev];
        next.splice(afterIndex + 1, 0, newBlock);
        sync(next);
        return next;
      });
      setDirtyBlockIds((prev) => new Set([...prev, newBlock.id]));
    },
    [sync],
  );

  const scrollToBlock = useCallback((blockId: string) => {
    const el = document.querySelector(`[data-block-id="${blockId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode((prev) => !prev);
  }, []);

  // Keyboard navigation: arrow keys to move focus between blocks
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture when editing (textarea/input/contenteditable focused)
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditing =
        tag === 'TEXTAREA' ||
        tag === 'INPUT' ||
        (e.target as HTMLElement)?.isContentEditable;
      if (isEditing) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, blocks.length - 1));
      }
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      }
      if (e.key === 'Escape') {
        setActiveBlockId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [blocks.length]);

  // Scroll to focused block
  useEffect(() => {
    if (blocks[focusedIndex]) {
      const el = document.querySelector(
        `[data-block-id="${blocks[focusedIndex].id}"]`,
      );
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      setActiveBlockId(blocks[focusedIndex].id);
    }
  }, [focusedIndex, blocks]);

  return (
    <BlocksContext.Provider
      value={{
        blocks,
        updateBlock,
        moveBlock,
        moveUp,
        moveDown,
        duplicateBlock,
        deleteBlock,
        addBlock,
        activeBlockId,
        setActiveBlockId,
        focusedIndex,
        setFocusedIndex,
        scrollToBlock,
        dirtyBlockIds,
        isPreviewMode,
        togglePreviewMode,
      }}
    >
      {children}
    </BlocksContext.Provider>
  );
}
