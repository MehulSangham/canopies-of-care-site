import { NextResponse } from 'next/server';
import { generateText, tool, stepCountIs, type ModelMessage } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { checkIsAdmin } from '@/lib/auth';
import { AI_MODELS, DEFAULT_MODEL_ID, isValidModelId } from '@/lib/ai/models';
import {
  searchNodes,
  searchSources,
  type ClaimArgument,
  type TaxonomyNode,
} from '@/lib/taxonomy';
import { loadAttachments, loadMap, loadSources, loadStyleGuide } from '@/lib/taxonomy-store';
import {
  createTaxonomyNode,
  deleteTaxonomyNode,
  getLibraries,
  saveTaxonomyNode,
} from '@/app/actions/taxonomy';
import type { LibraryId } from '@/lib/taxonomy-store';

export const maxDuration = 120;

/**
 * Conversational curator for the argument map. Has the same powers as the
 * map UI: read everything, edit any node field (including Toulmin argument
 * fields and ground→source links), create and delete nodes — both gated
 * behind an explicit editor confirmation, exactly like the buttons.
 */

function resolveModel(requestedId?: unknown) {
  const fallback = isValidModelId(process.env.AI_MODEL)
    ? process.env.AI_MODEL
    : DEFAULT_MODEL_ID;
  const id = isValidModelId(requestedId) ? requestedId : fallback;
  const entry = AI_MODELS.find((m) => m.id === id)!;

  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = createAnthropic({
      headers: process.env.ANTHROPIC_WORKSPACE_ID
        ? { 'anthropic-workspace-id': process.env.ANTHROPIC_WORKSPACE_ID }
        : undefined,
    });
    return anthropic(entry.id);
  }
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
    return entry.gateway;
  }
  return null;
}

const KIND = z.enum(['claim', 'frame', 'metaphor']);
const STANCE = z.enum(['reframe', 'dominant', 'catalytic']);
const ORIGIN = z.enum(['canonical', 'adapted', 'novel']);
const LIBRARY = z.enum(['metaphors', 'frames', 'argument']);

const ARGUMENT_PATCH = z
  .object({
    grounds: z.array(z.string()).optional(),
    groundSources: z
      .array(z.array(z.string()))
      .optional()
      .describe('Source ids per ground, index-aligned with grounds'),
    warrant: z.string().optional(),
    qualifier: z.string().optional(),
    rebuttal: z.string().optional(),
    answer: z.string().optional(),
  })
  .optional();

export async function POST(req: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    messages?: { role: 'user' | 'assistant'; content: string }[];
    focusNodeId?: string;
    modelId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const history = Array.isArray(body.messages)
    ? body.messages.filter(
        (m) =>
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim(),
      )
    : [];
  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    return NextResponse.json({ ok: false, error: 'Missing user message' }, { status: 400 });
  }

  const model = resolveModel(body.modelId);
  if (!model) {
    return NextResponse.json(
      { ok: false, error: 'No AI credentials configured.' },
      { status: 503 },
    );
  }

  const [{ nodes }, sourceIndex, styleGuide] = await Promise.all([
    loadMap(),
    loadSources(),
    loadStyleGuide(),
  ]);
  const steps: string[] = [];
  let changed = false;

  const describe = (n: TaxonomyNode) => ({
    id: n.id,
    kind: n.kind,
    stance: n.stance,
    label: n.label,
    definition: n.definition,
    origin: n.origin,
    source: n.source,
    parentId: n.parentId,
    counters: n.counters,
    argument: n.argument,
  });

  const tools = {
    get_node: tool({
      description: 'Read one map node in full, including argument fields and ground→source links.',
      inputSchema: z.object({ nodeId: z.string() }),
      execute: async ({ nodeId }) => {
        steps.push(`Read ${nodeId}`);
        const { nodes: fresh } = await loadMap();
        const n = fresh.find((x) => x.id === nodeId);
        return n ? describe(n) : { error: 'not found' };
      },
    }),
    search_nodes: tool({
      description: 'Search the map by label, id, kind, stance, or definition fragment.',
      inputSchema: z.object({ query: z.string() }),
      execute: async ({ query }) => {
        steps.push(`Searched map: ${query}`);
        const { nodes: fresh } = await loadMap();
        return searchNodes(fresh, query)
          .slice(0, 20)
          .map((n) => ({ id: n.id, kind: n.kind, stance: n.stance, label: n.label, definition: n.definition }));
      },
    }),
    search_sources: tool({
      description: `Search the sources index (${sourceIndex.length} citation records built from page footnotes). Use before linking sources to grounds.`,
      inputSchema: z.object({ query: z.string() }),
      execute: async ({ query }) => {
        steps.push(`Searched sources: ${query}`);
        return searchSources(sourceIndex, query)
          .slice(0, 12)
          .map((s) => ({ id: s.id, citation: s.citation, type: s.type, citedOn: s.citedBy?.length ?? 0 }));
      },
    }),
    list_attachments: tool({
      description:
        'List where nodes are attached across the archive (page, block, role). Pass nodeId to filter to one node.',
      inputSchema: z.object({ nodeId: z.string().optional() }),
      execute: async ({ nodeId }) => {
        steps.push(`Listed attachments${nodeId ? ` for ${nodeId}` : ''}`);
        const atts = await loadAttachments();
        return (nodeId ? atts.filter((a) => a.nodeId === nodeId) : atts).map((a) => ({
          nodeId: a.nodeId,
          slug: a.slug,
          blockId: a.blockId,
          role: a.role,
        }));
      },
    }),
    lookup_library: tool({
      description: 'Read a reference library: conceptual metaphors, semantic frames, or Toulmin argument structure.',
      inputSchema: z.object({ library: LIBRARY }),
      execute: async ({ library }) => {
        steps.push(`Looked up library: ${library}`);
        const all = await getLibraries();
        return { library, text: all[library as LibraryId] || '' };
      },
    }),
    update_node: tool({
      description:
        'Update fields on an existing node. Only the fields you pass change; argument fields merge into the existing argument. Use for edits the editor asked for or approved in conversation.',
      inputSchema: z.object({
        nodeId: z.string(),
        label: z.string().optional(),
        definition: z.string().optional(),
        stance: STANCE.optional(),
        origin: ORIGIN.optional(),
        source: z.string().optional().describe('Citation for canonical/adapted origin'),
        parentId: z.string().optional().describe('Parent claim id (claims only). Empty string clears it.'),
        counters: z.array(z.string()).optional().describe('Node ids this one counters (frames/metaphors)'),
        argument: ARGUMENT_PATCH,
      }),
      execute: async ({ nodeId, argument, parentId, ...rest }) => {
        const { nodes: fresh } = await loadMap();
        const existing = fresh.find((n) => n.id === nodeId);
        if (!existing) return { error: `No node ${nodeId}` };
        const next: TaxonomyNode = { ...existing, ...rest };
        if (parentId !== undefined) next.parentId = parentId || undefined;
        if (argument) {
          const merged: ClaimArgument = { ...existing.argument, ...argument };
          next.argument = merged;
        }
        await saveTaxonomyNode(next);
        changed = true;
        steps.push(`Updated ${nodeId} (${Object.keys({ ...rest, ...(argument ? { argument: 1 } : {}), ...(parentId !== undefined ? { parentId: 1 } : {}) }).join(', ')})`);
        return { ok: true, node: describe(next) };
      },
    }),
    set_ground_sources: tool({
      description: 'Set the source ids backing one ground of a claim. Overwrites that ground\u2019s links only.',
      inputSchema: z.object({
        nodeId: z.string(),
        groundIndex: z.number().describe('0-based index into the claim\u2019s grounds'),
        sourceIds: z.array(z.string()).describe('Ids from search_sources'),
      }),
      execute: async ({ nodeId, groundIndex, sourceIds }) => {
        const { nodes: fresh } = await loadMap();
        const existing = fresh.find((n) => n.id === nodeId);
        if (!existing || existing.kind !== 'claim') return { error: 'Not a claim node' };
        const grounds = existing.argument?.grounds ?? [];
        if (groundIndex < 0 || groundIndex >= grounds.length) {
          return { error: `Ground index out of range (0–${grounds.length - 1})` };
        }
        const valid = new Set(sourceIndex.map((s) => s.id));
        const bad = sourceIds.filter((id) => !valid.has(id));
        if (bad.length) return { error: `Unknown source ids: ${bad.join(', ')}` };
        const gs = grounds.map((_, i) => existing.argument?.groundSources?.[i] ?? []);
        gs[groundIndex] = sourceIds;
        await saveTaxonomyNode({
          ...existing,
          argument: { ...existing.argument, groundSources: gs },
        });
        changed = true;
        steps.push(`Linked ${sourceIds.length} source(s) to ${nodeId} ground ${groundIndex + 1}`);
        return { ok: true };
      },
    }),
    create_node: tool({
      description:
        'Propose or create a map node. FIRST call with confirmed=false to show the draft. Call again with confirmed=true only after the editor explicitly says yes.',
      inputSchema: z.object({
        kind: KIND,
        label: z.string(),
        stance: STANCE,
        definition: z.string(),
        origin: ORIGIN.optional(),
        source: z.string().optional(),
        parentId: z.string().optional(),
        confirmed: z.boolean(),
      }),
      execute: async ({ confirmed, ...input }) => {
        if (!confirmed) {
          steps.push(`Proposed new ${input.kind}: ${input.label} (awaiting confirm)`);
          return {
            status: 'needs_confirm',
            preview: input,
            instruction: 'Show the draft and ask the editor to confirm before calling again with confirmed=true.',
          };
        }
        const node = await createTaxonomyNode(input);
        changed = true;
        steps.push(`Created ${node.id}`);
        return { status: 'created', node: describe(node) };
      },
    }),
    delete_node: tool({
      description:
        'Delete a node and all its attachments. FIRST call with confirmed=false to state what would be lost. Call again with confirmed=true only after the editor explicitly says yes.',
      inputSchema: z.object({ nodeId: z.string(), confirmed: z.boolean() }),
      execute: async ({ nodeId, confirmed }) => {
        const { nodes: fresh } = await loadMap();
        const n = fresh.find((x) => x.id === nodeId);
        if (!n) return { error: 'not found' };
        if (!confirmed) {
          steps.push(`Proposed deleting ${nodeId} (awaiting confirm)`);
          return {
            status: 'needs_confirm',
            node: { id: n.id, label: n.label, kind: n.kind },
            instruction: 'Warn that attachments will be dropped and ask the editor to confirm.',
          };
        }
        await deleteTaxonomyNode(nodeId);
        changed = true;
        steps.push(`Deleted ${nodeId}`);
        return { status: 'deleted' };
      },
    }),
  };

  const inventory = nodes
    .map(
      (n) =>
        `- ${n.id} [${n.kind}/${n.stance}${n.origin ? `/${n.origin}` : ''}] "${n.label}"` +
        (n.parentId ? ` → supports ${n.parentId}` : '') +
        (n.counters?.length ? ` (counters: ${n.counters.join(', ')})` : '') +
        (n.kind === 'claim'
          ? ` [grounds: ${n.argument?.grounds?.length ?? 0}, sourced: ${
              n.argument?.groundSources?.filter((g) => g.length).length ?? 0
            }]`
          : ''),
    )
    .join('\n');

  const focus = body.focusNodeId ? nodes.find((n) => n.id === body.focusNodeId) : null;

  const system = [
    'You are the curator of the argument map for an editorial archive on the American mutual-aid tradition.',
    'The map holds claims (a Toulmin tree: grounds, warrant, qualifier, rebuttal, answer, with sources linked per ground), semantic frames, and conceptual metaphors (reframe vs. dominant systems, linked by counter-relations).',
    'You have the same powers as the human editor: read, search, update any field, link sources to grounds, create, and delete.',
    '',
    'Rules:',
    '- Small, surgical edits the editor asked for: do them directly with update_node / set_ground_sources, then summarise what changed.',
    '- Creating or deleting nodes: always preview first (confirmed=false) and wait for an explicit yes in the conversation before confirming.',
    '- When drafting grounds, ground each one in what the archive can actually show, then link real sources from the index (search_sources). Never invent citations.',
    '- Keep definitions in the project voice: plain, declarative, one or two sentences.',
    '- If asked something the map already answers, answer from the inventory without tool calls.',
    ...(styleGuide.trim()
      ? ['', '=== PROSE STYLE GUIDE (follow when drafting any argument field) ===', styleGuide.trim()]
      : []),
    '',
    '=== MAP INVENTORY ===',
    inventory,
    focus ? `\n=== EDITOR IS LOOKING AT ===\n${JSON.stringify(describe(focus), null, 1)}` : '',
  ].join('\n');

  const messages: ModelMessage[] = history.map((m) => ({ role: m.role, content: m.content }));

  try {
    const result = await generateText({
      model,
      system,
      messages,
      tools,
      stopWhen: stepCountIs(12),
    });
    return NextResponse.json({ ok: true, reply: result.text, steps, changed });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Assistant failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
