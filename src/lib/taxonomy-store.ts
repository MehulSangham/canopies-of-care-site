import 'server-only';
import fs from 'fs';
import path from 'path';
import { isGitHubMode, readFile, writeFile } from '@/lib/github';
import type { Attachment, SourceRecord, TaxonomyMap, TaxonomyNode } from '@/lib/taxonomy';

const MAP_PATH = 'content/taxonomy/map.json';
const ATTACH_PATH = 'content/taxonomy/attachments.json';
const SOURCES_PATH = 'content/taxonomy/sources.json';
const LIB_DIR = 'content/taxonomy/libraries';

export type LibraryId = 'metaphors' | 'frames' | 'argument';

export const LIBRARY_FILES: Record<LibraryId, string> = {
  metaphors: `${LIB_DIR}/metaphors.md`,
  frames: `${LIB_DIR}/frames.md`,
  argument: `${LIB_DIR}/argument.md`,
};

async function readText(rel: string): Promise<string> {
  if (isGitHubMode()) {
    const existing = await readFile(rel);
    if (existing) return existing.content;
  }
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '';
}

async function writeText(rel: string, content: string, message: string) {
  if (isGitHubMode()) {
    await writeFile(rel, content, message);
    return;
  }
  const p = path.join(process.cwd(), rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf-8');
}

export async function loadMap(): Promise<TaxonomyMap> {
  const raw = await readText(MAP_PATH);
  if (!raw.trim()) return { nodes: [] };
  try {
    const parsed = JSON.parse(raw) as TaxonomyMap;
    return { nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [] };
  } catch {
    return { nodes: [] };
  }
}

export async function saveMap(map: TaxonomyMap): Promise<void> {
  await writeText(MAP_PATH, `${JSON.stringify(map, null, 2)}\n`, 'content: update argument map');
}

export async function loadAttachments(): Promise<Attachment[]> {
  const raw = await readText(ATTACH_PATH);
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as Attachment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveAttachments(list: Attachment[]): Promise<void> {
  await writeText(
    ATTACH_PATH,
    `${JSON.stringify(list, null, 2)}\n`,
    'content: update argument attachments',
  );
}

export async function loadSources(): Promise<SourceRecord[]> {
  const raw = await readText(SOURCES_PATH);
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as SourceRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveSources(list: SourceRecord[]): Promise<void> {
  await writeText(
    SOURCES_PATH,
    `${JSON.stringify(list, null, 2)}\n`,
    'content: update sources index',
  );
}

export async function loadLibrary(id: LibraryId): Promise<string> {
  return readText(LIBRARY_FILES[id]);
}

export async function loadAllLibraries(): Promise<Record<LibraryId, string>> {
  const [metaphors, frames, argument] = await Promise.all([
    loadLibrary('metaphors'),
    loadLibrary('frames'),
    loadLibrary('argument'),
  ]);
  return { metaphors, frames, argument };
}

export function upsertNode(map: TaxonomyMap, node: TaxonomyNode): TaxonomyMap {
  const i = map.nodes.findIndex((n) => n.id === node.id);
  const nodes = [...map.nodes];
  if (i >= 0) nodes[i] = node;
  else nodes.push(node);
  return { nodes };
}
