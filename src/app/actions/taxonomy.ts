'use server';

import { revalidatePath } from 'next/cache';
import { checkIsAdmin } from '@/lib/auth';
import type {
  Attachment,
  AttachmentRole,
  ClaimArgument,
  NodeKind,
  NodeOrigin,
  NodeStance,
  TaxonomyMap,
  TaxonomyNode,
} from '@/lib/taxonomy';
import { excerptOf, slugifyNodeId } from '@/lib/taxonomy';
import type { SourceRecord } from '@/lib/taxonomy';
import {
  loadAllLibraries,
  loadAttachments,
  loadMap,
  loadSources,
  saveAttachments,
  saveMap,
  saveSources,
  upsertNode,
  type LibraryId,
} from '@/lib/taxonomy-store';

function revalidateArchive(slug?: string) {
  if (slug) revalidatePath(`/archive/${slug}`);
  revalidatePath('/archive');
  revalidatePath('/archive/[slug]', 'page');
}

async function requireAdmin() {
  if (!(await checkIsAdmin())) {
    throw new Error('Unauthorized: admin access required');
  }
}

export async function getTaxonomyBundle(): Promise<{
  map: TaxonomyMap;
  attachments: Attachment[];
}> {
  await requireAdmin();
  const [map, attachments] = await Promise.all([loadMap(), loadAttachments()]);
  return { map, attachments };
}

export async function getLibraries(): Promise<Record<LibraryId, string>> {
  await requireAdmin();
  return loadAllLibraries();
}

export async function getSources(): Promise<SourceRecord[]> {
  await requireAdmin();
  return loadSources();
}

export async function saveSourceRecord(record: SourceRecord): Promise<SourceRecord[]> {
  await requireAdmin();
  const list = await loadSources();
  const i = list.findIndex((s) => s.id === record.id);
  if (i >= 0) list[i] = record;
  else list.push(record);
  await saveSources(list);
  return list;
}

export async function saveTaxonomyNode(node: TaxonomyNode): Promise<TaxonomyMap> {
  await requireAdmin();
  const map = await loadMap();
  const next = upsertNode(map, node);
  await saveMap(next);
  revalidateArchive();
  return next;
}

export async function createTaxonomyNode(input: {
  kind: NodeKind;
  label: string;
  stance: NodeStance;
  definition: string;
  libraryRef?: string;
  argument?: ClaimArgument;
  origin?: NodeOrigin;
  source?: string;
  parentId?: string;
  counters?: string[];
}): Promise<TaxonomyNode> {
  await requireAdmin();
  const map = await loadMap();
  let id = slugifyNodeId(input.kind, input.label);
  if (map.nodes.some((n) => n.id === id)) {
    id = `${id}-${Date.now().toString(36)}`;
  }
  const node: TaxonomyNode = { id, ...input };
  await saveMap(upsertNode(map, node));
  revalidateArchive();
  return node;
}

export async function deleteTaxonomyNode(nodeId: string): Promise<TaxonomyMap> {
  await requireAdmin();
  const map = await loadMap();
  const next = { nodes: map.nodes.filter((n) => n.id !== nodeId) };
  await saveMap(next);
  const atts = await loadAttachments();
  await saveAttachments(atts.filter((a) => a.nodeId !== nodeId));
  revalidateArchive();
  return next;
}

export async function attachNode(input: {
  slug: string;
  blockId: string;
  excerpt?: string;
  nodeId: string;
  role: AttachmentRole;
}): Promise<Attachment[]> {
  await requireAdmin();
  const atts = await loadAttachments();
  const excerpt = input.excerpt ?? '';
  const exists = atts.some(
    (a) =>
      a.slug === input.slug &&
      a.blockId === input.blockId &&
      a.nodeId === input.nodeId,
  );
  if (exists) return atts;
  const next = [
    ...atts,
    {
      slug: input.slug,
      blockId: input.blockId,
      excerpt: excerpt || excerptOf(input.excerpt ?? ''),
      nodeId: input.nodeId,
      role: input.role,
    },
  ];
  await saveAttachments(next);
  revalidateArchive(input.slug);
  return next;
}

export async function detachNode(input: {
  slug: string;
  blockId: string;
  nodeId: string;
}): Promise<Attachment[]> {
  await requireAdmin();
  const atts = await loadAttachments();
  const next = atts.filter(
    (a) =>
      !(
        a.slug === input.slug &&
        a.blockId === input.blockId &&
        a.nodeId === input.nodeId
      ),
  );
  await saveAttachments(next);
  revalidateArchive(input.slug);
  return next;
}
