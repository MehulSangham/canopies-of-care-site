import { tool } from 'ai';
import { z } from 'zod';
import { formatMapIndex, searchNodes } from '@/lib/taxonomy';
import {
  attachNode,
  createTaxonomyNode,
  detachNode,
  getLibraries,
} from '@/app/actions/taxonomy';
import { loadAttachments, loadMap } from '@/lib/taxonomy-store';
import type { LibraryId } from '@/lib/taxonomy-store';

const ROLE = z.enum(['advances-reframe', 'describes-dominant', 'aims-catalytic']);
const KIND = z.enum(['claim', 'frame', 'metaphor']);
const STANCE = z.enum(['reframe', 'dominant', 'catalytic']);
const LIBRARY = z.enum(['metaphors', 'frames', 'argument']);

export async function getTaxonomySystemContext(slug: string): Promise<string> {
  const [map, attachments] = await Promise.all([loadMap(), loadAttachments()]);
  const here = attachments
    .filter((a) => a.slug === slug)
    .map((a) => `- ${a.nodeId} @ ${a.blockId} (${a.role})`)
    .join('\n');

  return [
    '=== ARGUMENT MAP (editor inventory — ids, not published as a page) ===',
    formatMapIndex(map.nodes) || '(empty map)',
    '',
    'Reference libraries (metaphors / frames / argument) are available via lookup_library.',
    'Do not invent new structures. Search the map first. Create a node only after the editor confirms.',
    '',
    '=== ATTACHMENTS ON THIS PAGE ===',
    here || '(none yet)',
  ].join('\n');
}

export function taxonomyAgentTools(opts: {
  slug: string;
  blockId?: string;
  steps: string[];
}) {
  const defaultBlock = opts.blockId || 'page';

  return {
    search_nodes: tool({
      description:
        'Search the project argument map for claims, frames, and conceptual metaphors. Use before attaching or creating.',
      inputSchema: z.object({
        query: z.string().describe('Label, id, kind, stance, or definition fragment'),
      }),
      execute: async ({ query }) => {
        opts.steps.push(`Searched map: ${query}`);
        const { nodes } = await loadMap();
        return searchNodes(nodes, query).slice(0, 20).map((n) => ({
          id: n.id,
          kind: n.kind,
          stance: n.stance,
          label: n.label,
          definition: n.definition,
        }));
      },
    }),
    attach_node: tool({
      description:
        'Attach an existing map node to this page or a block. Use an id from search_nodes. Does not create new nodes.',
      inputSchema: z.object({
        nodeId: z.string(),
        blockId: z
          .string()
          .optional()
          .describe(`Block id (block-N) or "page". Defaults to ${defaultBlock}.`),
        role: ROLE,
        excerpt: z.string().optional().describe('First characters of the target block, for recovery'),
      }),
      execute: async ({ nodeId, blockId, role, excerpt }) => {
        const target = blockId || defaultBlock;
        const next = await attachNode({
          slug: opts.slug,
          blockId: target,
          nodeId,
          role,
          excerpt,
        });
        opts.steps.push(`Attached ${nodeId} → ${opts.slug}/${target}`);
        return {
          ok: true,
          attached: next.filter((a) => a.slug === opts.slug && a.blockId === target),
        };
      },
    }),
    detach_node: tool({
      description: 'Remove an attachment from this page or a block.',
      inputSchema: z.object({
        nodeId: z.string(),
        blockId: z.string().optional(),
      }),
      execute: async ({ nodeId, blockId }) => {
        const target = blockId || defaultBlock;
        await detachNode({ slug: opts.slug, blockId: target, nodeId });
        opts.steps.push(`Detached ${nodeId} from ${opts.slug}/${target}`);
        return { ok: true };
      },
    }),
    create_node: tool({
      description:
        'Propose or create a map node. FIRST call with confirmed=false and show the draft. Only call again with confirmed=true after the editor explicitly says yes. Never invent a structure behind their back.',
      inputSchema: z.object({
        kind: KIND,
        label: z.string(),
        stance: STANCE,
        definition: z.string(),
        confirmed: z
          .boolean()
          .describe('false = preview only. true = write, and only after the editor said yes.'),
      }),
      execute: async ({ kind, label, stance, definition, confirmed }) => {
        const preview = { kind, label, stance, definition };
        if (!confirmed) {
          opts.steps.push(`Proposed new ${kind}: ${label} (awaiting confirm)`);
          return {
            status: 'needs_confirm',
            preview,
            instruction:
              'Ask the editor to confirm. Call again with confirmed=true only after they say yes.',
          };
        }
        const node = await createTaxonomyNode({ kind, label, stance, definition });
        opts.steps.push(`Created ${node.id}`);
        return { status: 'created', node };
      },
    }),
    lookup_library: tool({
      description:
        'Read a reference library: conceptual metaphors, semantic frames, or Toulmin argument structure. These are not the project map.',
      inputSchema: z.object({ library: LIBRARY }),
      execute: async ({ library }) => {
        opts.steps.push(`Looked up library: ${library}`);
        const all = await getLibraries();
        return { library, text: all[library as LibraryId] || '' };
      },
    }),
  };
}
