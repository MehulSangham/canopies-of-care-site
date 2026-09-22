'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type {
  Attachment,
  AttachmentRole,
  TaxonomyMap,
  TaxonomyNode,
} from '@/lib/taxonomy';
import {
  attachNode,
  detachNode,
  getTaxonomyBundle,
  saveTaxonomyNode,
  createTaxonomyNode,
  deleteTaxonomyNode,
} from '@/app/actions/taxonomy';

interface TaxonomyContextValue {
  map: TaxonomyMap;
  attachments: Attachment[];
  ready: boolean;
  attach: (input: {
    slug: string;
    blockId: string;
    excerpt?: string;
    nodeId: string;
    role: AttachmentRole;
  }) => Promise<void>;
  detach: (input: { slug: string; blockId: string; nodeId: string }) => Promise<void>;
  saveNode: (node: TaxonomyNode) => Promise<void>;
  createNode: typeof createTaxonomyNode;
  removeNode: (nodeId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const TaxonomyContext = createContext<TaxonomyContextValue | null>(null);

export function useTaxonomy() {
  const ctx = useContext(TaxonomyContext);
  if (!ctx) throw new Error('useTaxonomy must be used within TaxonomyProvider');
  return ctx;
}

export function useTaxonomyOptional() {
  return useContext(TaxonomyContext);
}

export function TaxonomyProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<TaxonomyMap>({ nodes: [] });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const bundle = await getTaxonomyBundle();
    setMap(bundle.map);
    setAttachments(bundle.attachments);
    setReady(true);
  }, []);

  useEffect(() => {
    refresh().catch(() => setReady(true));
  }, [refresh]);

  const value: TaxonomyContextValue = {
    map,
    attachments,
    ready,
    refresh,
    attach: async (input) => {
      const next = await attachNode(input);
      setAttachments(next);
    },
    detach: async (input) => {
      const next = await detachNode(input);
      setAttachments(next);
    },
    saveNode: async (node) => {
      setMap(await saveTaxonomyNode(node));
    },
    createNode: async (input) => {
      const node = await createTaxonomyNode(input);
      setMap((prev) => ({ nodes: [...prev.nodes, node] }));
      return node;
    },
    removeNode: async (nodeId) => {
      const next = await deleteTaxonomyNode(nodeId);
      setMap(next);
      setAttachments((prev) => prev.filter((a) => a.nodeId !== nodeId));
    },
  };

  return <TaxonomyContext.Provider value={value}>{children}</TaxonomyContext.Provider>;
}
