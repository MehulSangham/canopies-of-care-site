import { NextResponse } from 'next/server';
import { generateText, tool, stepCountIs, hasToolCall } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { checkIsAdmin } from '@/lib/auth';
import { loadMap, loadSources } from '@/lib/taxonomy-store';
import type { AttachmentRole } from '@/lib/taxonomy';

export const maxDuration = 60;

/**
 * Small, fast analysis agent for the x-ray editor.
 *
 * Two modes:
 *  - default: given a passage and its attachments, ANTICIPATES nodes that
 *    apply (never auto-attaches) and VERIFIES attached ones, flagging drift.
 *  - mode "grounds": given a claim node id, checks each Toulmin ground
 *    against its linked sources from the sources index — supported,
 *    unsourced, or mismatch.
 */

const FAST_MODEL = 'claude-haiku-4-5';
const FAST_GATEWAY = 'anthropic/claude-haiku-4.5';

function resolveModel() {
  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = createAnthropic({
      headers: process.env.ANTHROPIC_WORKSPACE_ID
        ? { 'anthropic-workspace-id': process.env.ANTHROPIC_WORKSPACE_ID }
        : undefined,
    });
    return anthropic(FAST_MODEL);
  }
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
    return FAST_GATEWAY;
  }
  return null;
}

interface Suggestion {
  nodeId: string;
  role: AttachmentRole;
  confidence: 'high' | 'medium';
  reason: string;
}

interface Verification {
  nodeId: string;
  verdict: 'supported' | 'weak' | 'drift';
  note: string;
}

interface GroundVerdict {
  index: number;
  verdict: 'supported' | 'unsourced' | 'mismatch';
  note: string;
}

/** mode "grounds": verify a claim's Toulmin grounds against linked sources. */
async function verifyGrounds(nodeId: string): Promise<NextResponse> {
  const model = resolveModel();
  if (!model) {
    return NextResponse.json(
      { ok: false, error: 'No AI credentials configured.' },
      { status: 503 },
    );
  }

  const [{ nodes }, sources] = await Promise.all([loadMap(), loadSources()]);
  const node = nodes.find((n) => n.id === nodeId);
  if (!node || node.kind !== 'claim') {
    return NextResponse.json({ ok: false, error: 'Unknown claim node' }, { status: 400 });
  }
  const grounds = node.argument?.grounds ?? [];
  if (grounds.length === 0) {
    return NextResponse.json({ ok: false, error: 'This claim has no grounds' }, { status: 400 });
  }
  const groundSources = node.argument?.groundSources ?? [];
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  const groundsBlock = grounds
    .map((g, i) => {
      const linked = (groundSources[i] ?? [])
        .map((id) => sourceById.get(id))
        .filter(Boolean)
        .map((s) => `    · [${s!.id}] ${s!.citation}`)
        .join('\n');
      return `GROUND ${i}: ${g}\n${linked || '    · (no sources linked)'}`;
    })
    .join('\n\n');

  let verdicts: GroundVerdict[] | null = null;

  const report = tool({
    description: 'Report the verdict for every ground. Call exactly once.',
    inputSchema: z.object({
      grounds: z.array(
        z.object({
          index: z.number().describe('The GROUND number'),
          verdict: z.enum(['supported', 'unsourced', 'mismatch']),
          note: z.string().describe('One short sentence explaining the verdict'),
        }),
      ),
    }),
    execute: async (input) => {
      verdicts = input.grounds.filter((g) => g.index >= 0 && g.index < grounds.length);
      return 'Recorded.';
    },
  });

  const system = [
    'You are a fact-checking assistant for an editorial archive on the American mutual-aid tradition.',
    'You receive one claim, its Toulmin grounds, and the sources linked to each ground (citation lines from the archive sources index).',
    'For every ground return exactly one verdict:',
    '- supported: the linked sources, taken at face value, plausibly establish what the ground asserts (right subject, right period, right kind of evidence).',
    '- unsourced: no sources are linked, or the linked sources do not cover the assertion.',
    '- mismatch: a linked source is about something else, or the ground overstates what such a source could show (wrong era, wrong population, wrong magnitude).',
    'Judge coverage and fit from the citations; you cannot read the works themselves, so flag only clear mismatches. Then call report once.',
  ].join('\n');

  try {
    await generateText({
      model,
      system,
      messages: [
        {
          role: 'user',
          content: [
            `=== CLAIM === ${node.label}`,
            node.definition,
            '',
            '=== GROUNDS AND LINKED SOURCES ===',
            groundsBlock,
          ].join('\n'),
        },
      ],
      tools: { report },
      stopWhen: [stepCountIs(3), hasToolCall('report')],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  if (!verdicts) {
    return NextResponse.json(
      { ok: false, error: 'The model did not return a structured verdict.' },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true, grounds: verdicts });
}

export async function POST(req: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { text?: string; attachedNodeIds?: string[]; mode?: string; nodeId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.mode === 'grounds') {
    return verifyGrounds(typeof body.nodeId === 'string' ? body.nodeId : '');
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const attachedIds = Array.isArray(body.attachedNodeIds) ? body.attachedNodeIds : [];
  if (!text) {
    return NextResponse.json({ ok: false, error: 'Missing text' }, { status: 400 });
  }

  const model = resolveModel();
  if (!model) {
    return NextResponse.json(
      { ok: false, error: 'No AI credentials configured.' },
      { status: 503 },
    );
  }

  const { nodes } = await loadMap();
  const validIds = new Set(nodes.map((n) => n.id));
  const inventory = nodes
    .map(
      (n) =>
        `- ${n.id} [${n.kind}/${n.stance}] "${n.label}" — ${n.definition}` +
        (n.counters?.length ? ` (counters: ${n.counters.join(', ')})` : ''),
    )
    .join('\n');
  const attachedList = attachedIds.filter((id) => validIds.has(id));

  let result: { suggestions: Suggestion[]; verifications: Verification[] } | null =
    null;

  const report = tool({
    description:
      'Report the analysis. Call exactly once with every suggestion and verification.',
    inputSchema: z.object({
      suggestions: z
        .array(
          z.object({
            nodeId: z.string(),
            role: z.enum(['advances-reframe', 'describes-dominant', 'aims-catalytic']),
            confidence: z.enum(['high', 'medium']),
            reason: z.string().describe('One short sentence grounded in the passage'),
          }),
        )
        .max(4)
        .describe('Nodes from the inventory that apply but are NOT yet attached'),
      verifications: z
        .array(
          z.object({
            nodeId: z.string(),
            verdict: z.enum(['supported', 'weak', 'drift']),
            note: z.string().describe('One short sentence: why, citing the passage'),
          }),
        )
        .describe('One entry per currently-attached node'),
    }),
    execute: async (input) => {
      result = {
        suggestions: input.suggestions.filter((s) => validIds.has(s.nodeId)),
        verifications: input.verifications.filter((v) => validIds.has(v.nodeId)),
      };
      return 'Recorded.';
    },
  });

  const system = [
    'You are a frame analyst for an editorial archive about the American mutual-aid tradition.',
    'You receive one passage, the project argument map (claims, frames, conceptual metaphors), and the ids currently attached to the passage.',
    '',
    'Do BOTH of the following, then call report once:',
    '1. SUGGEST up to 4 unattached nodes that genuinely operate in the passage. Role: advances-reframe if the passage instantiates the structure; describes-dominant if the passage depicts that structure as the prevailing account; aims-catalytic for hinge beats (crisis kitchen, lodge, testimony, tradition) aimed at readers at the edge of the discourse window. High confidence only when the passage clearly instantiates the structure in its own wording.',
    '2. VERIFY every attached id: supported = the passage clearly does what the attachment says; weak = plausible but thin; drift = the passage undercuts it — the classic failure is prose marked as advancing the reframe while actually activating Eligibility, Compliance, Deserving, or accounting/scarcity language.',
    '',
    'Be conservative. Fewer, better suggestions. Never suggest an id that is not in the inventory.',
    '',
    'Scope convention: claims belong to the whole page; frames and metaphors belong on the specific passages where they operate; catalytic beats are always specific passages. When the passage under analysis is a single block, prefer suggesting the structures that operate in that block itself.',
  ].join('\n');

  try {
    await generateText({
      model,
      system,
      messages: [
        {
          role: 'user',
          content: [
            '=== ARGUMENT MAP INVENTORY ===',
            inventory,
            '',
            `=== CURRENTLY ATTACHED === ${attachedList.length ? attachedList.join(', ') : '(none)'}`,
            '',
            '=== PASSAGE ===',
            text.slice(0, 12000),
          ].join('\n'),
        },
      ],
      tools: { report },
      stopWhen: [stepCountIs(3), hasToolCall('report')],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  if (!result) {
    return NextResponse.json(
      { ok: false, error: 'The model did not return a structured analysis.' },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true, ...(result as object) });
}
