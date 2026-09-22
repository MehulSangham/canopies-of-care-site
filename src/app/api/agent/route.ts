import { NextResponse } from 'next/server';
import { generateText, streamText, tool, stepCountIs, hasToolCall, type ModelMessage } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { checkIsAdmin } from '@/lib/auth';
import {
  getStyleGuide,
  getCitationFile,
  getArchiveOverview,
} from '@/lib/ai/agent-context';
import { AI_MODELS, DEFAULT_MODEL_ID, isValidModelId } from '@/lib/ai/models';

export const maxDuration = 120;

/**
 * Model resolution:
 * - ANTHROPIC_API_KEY set → call Anthropic directly.
 * - Otherwise, with AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN present, route
 *   through Vercel AI Gateway (federated identity; billed to the Vercel team).
 *
 * The editor's model selector sends a `modelId`; it is validated against the
 * shared whitelist. AI_MODEL in the environment overrides the default only.
 */
function resolveModel(requestedId?: unknown) {
  const fallback = isValidModelId(process.env.AI_MODEL)
    ? process.env.AI_MODEL
    : DEFAULT_MODEL_ID;
  const id = isValidModelId(requestedId) ? requestedId : fallback;
  const entry = AI_MODELS.find((m) => m.id === id)!;

  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = createAnthropic({
      // Some Anthropic orgs require requests to name a workspace when the
      // key is not scoped to one.
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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BlockDescriptor {
  id: string;
  type: string;
  raw: string;
}

interface AgentRequest {
  slug: string;
  /** 'block' (default): edit one block. 'page': propose changes across blocks. */
  mode?: 'block' | 'page';
  blockRaw?: string;
  pageMarkdown?: string;
  blocks?: BlockDescriptor[];
  messages: ChatMessage[];
  modelId?: string;
  stream?: boolean;
}

interface EditProposal {
  kind: 'edit';
  newMarkdown: string;
  rationale: string;
}

interface FootnoteProposal {
  kind: 'footnote';
  id: string;
  note: string;
  sources: string[];
  rationale: string;
}

interface PageChange {
  blockId: string;
  op: 'replace' | 'insert_after' | 'delete';
  newMarkdown?: string;
  rationale: string;
}

interface PageProposal {
  kind: 'page';
  summary: string;
  changes: PageChange[];
}

export async function POST(req: Request) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: AgentRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const model = resolveModel(body.modelId);
  if (!model) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'No AI credentials configured. Add ANTHROPIC_API_KEY to .env.local, or run `vercel env pull` to refresh the Vercel AI Gateway token.',
      },
      { status: 503 },
    );
  }

  const { slug, blockRaw, pageMarkdown, blocks, messages } = body;
  const wantStream = Boolean(body.stream);
  const mode = body.mode === 'page' ? 'page' : 'block';
  const validMessages =
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'user';
  const validPayload =
    mode === 'page'
      ? Array.isArray(blocks) && blocks.length > 0
      : Boolean(blockRaw);
  if (!slug || !validMessages || !validPayload) {
    return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
  }

  const styleGuide = getStyleGuide();
  const citations = getCitationFile(slug);
  const overview = getArchiveOverview();
  const searchEnabled = Boolean(process.env.EXA_API_KEY);

  const steps: string[] = [];
  let proposal: EditProposal | FootnoteProposal | PageProposal | null = null;
  const blockIds = new Set((blocks ?? []).map((b) => b.id));

  const tools = {
    ...(searchEnabled
      ? {
          web_search: tool({
            description:
              'Search the web. Returns titles, URLs, and text excerpts. Use for verifying facts or finding sources.',
            inputSchema: z.object({ query: z.string() }),
            execute: async ({ query }) => {
              steps.push(`Searched: ${query}`);
              const res = await fetch('https://api.exa.ai/search', {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                  'x-api-key': process.env.EXA_API_KEY!,
                },
                body: JSON.stringify({
                  query,
                  numResults: 5,
                  contents: { text: { maxCharacters: 1500 } },
                }),
              });
              if (!res.ok) return `Search failed (${res.status})`;
              const data = await res.json();
              return (data.results ?? []).map(
                (r: { title: string; url: string; publishedDate?: string; text?: string }) => ({
                  title: r.title,
                  url: r.url,
                  published: r.publishedDate,
                  excerpt: r.text,
                }),
              );
            },
          }),
          fetch_url: tool({
            description: 'Fetch the readable text content of a specific URL.',
            inputSchema: z.object({ url: z.string() }),
            execute: async ({ url }) => {
              steps.push(`Fetched: ${url}`);
              const res = await fetch('https://api.exa.ai/contents', {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                  'x-api-key': process.env.EXA_API_KEY!,
                },
                body: JSON.stringify({ urls: [url], text: { maxCharacters: 6000 } }),
              });
              if (!res.ok) return `Fetch failed (${res.status})`;
              const data = await res.json();
              return data.results?.[0]?.text ?? 'No content extracted.';
            },
          }),
        }
      : {}),
    ...(mode === 'block'
      ? {
          propose_edit: tool({
            description:
              'Submit revised markdown for the target block. Call this whenever the editor asks for a revision, rewrite, or improvement of the block. Call at most once per reply.',
            inputSchema: z.object({
              newMarkdown: z.string().describe('The complete revised block markdown'),
              rationale: z
                .string()
                .describe('One or two sentences on what changed and why'),
            }),
            execute: async ({ newMarkdown, rationale }) => {
              proposal = { kind: 'edit', newMarkdown, rationale };
              return 'Proposal recorded and shown to the editor with an Apply button.';
            },
          }),
          propose_footnote: tool({
            description:
              'Submit a suggested footnote: an id, an interpretive note, and source lines. Call when the editor asks for a footnote or citation. Call at most once per reply.',
            inputSchema: z.object({
              id: z
                .string()
                .describe('Short kebab-case footnote id, e.g. fas-articles'),
              note: z.string().describe('The interpretive note text (1-3 sentences)'),
              sources: z
                .array(z.string())
                .describe('Source lines, e.g. "Author, *Title* (Year), page." or a URL'),
              rationale: z.string(),
            }),
            execute: async ({ id, note, sources, rationale }) => {
              proposal = { kind: 'footnote', id, note, sources, rationale };
              return 'Proposal recorded and shown to the editor with an Apply button.';
            },
          }),
        }
      : {
          propose_page_edits: tool({
            description:
              'Submit a set of block-level changes to the page. Each change targets one block by its id. Only include blocks that actually need to change; leave compliant blocks alone. Call at most once per reply, with every change in one call.',
            inputSchema: z.object({
              summary: z
                .string()
                .describe('One or two sentences describing the overall pass'),
              changes: z
                .array(
                  z.object({
                    blockId: z.string().describe('The id of the block this change targets'),
                    op: z
                      .enum(['replace', 'insert_after', 'delete'])
                      .describe(
                        'replace: new markdown for this block. insert_after: add a new block after this one. delete: remove this block.',
                      ),
                    newMarkdown: z
                      .string()
                      .optional()
                      .describe('Required for replace and insert_after'),
                    rationale: z
                      .string()
                      .describe('One sentence on why this block changes'),
                  }),
                )
                .min(1),
            }),
            execute: async ({ summary, changes }) => {
              const bad = changes.filter(
                (c) =>
                  !blockIds.has(c.blockId) ||
                  (c.op !== 'delete' && !c.newMarkdown?.trim()),
              );
              if (bad.length > 0) {
                return `Rejected: ${bad
                  .map(
                    (c) =>
                      `${c.blockId} (${blockIds.has(c.blockId) ? 'missing newMarkdown' : 'unknown block id'})`,
                  )
                  .join(', ')}. Fix these and call propose_page_edits again with the full change set.`;
              }
              proposal = { kind: 'page', summary, changes };
              steps.push(`Proposed ${changes.length} change${changes.length === 1 ? '' : 's'}`);
              return 'Proposal recorded. The editor reviews each change with accept/reject controls.';
            },
          }),
        }),
  };

  const roleLine =
    mode === 'page'
      ? 'You are the resident editor for "Canopies of Care", an editorial archive about the American mutual-aid tradition. You work with a human editor on a whole page at a time, in conversation. You are precise, conservative, and you never invent facts or sources.'
      : 'You are the resident editor for "Canopies of Care", an editorial archive about the American mutual-aid tradition. You work with a human editor on one block of a page at a time, in conversation. You are precise, conservative, and you never invent facts or sources.';

  const howToRespond =
    mode === 'page'
      ? [
          'HOW TO RESPOND:',
          '- When asked to revise, tighten, restructure, or improve the page: decide which blocks need to change and call propose_page_edits once with every change. Keep your accompanying text brief.',
          '- Change ONLY the blocks the instruction requires. If a block already complies, leave it out of the change set. A pass that touches every block is almost always wrong.',
          '- When asked to verify claims, answer questions, or discuss approach: reply in plain text; do not call the proposal tool.',
          '- The editor reviews each change with accept/reject controls; nothing applies automatically.',
          '- Block ids are stable handles; never invent ids that are not in the block list below.',
        ]
      : [
          'HOW TO RESPOND:',
          '- When asked to revise, rewrite, tighten, or improve the block: produce the revision and call propose_edit. Keep your accompanying text brief.',
          '- When asked for a footnote or citation: ground it in the citation file or web search, then call propose_footnote.',
          '- When asked to verify claims, answer questions, or discuss approach: reply in plain text; do not call a proposal tool.',
          '- The editor sees proposals as cards with an Apply button; the current draft in the context below is always the latest state of the block.',
        ];

  const system = [
    roleLine,
    '',
    ...howToRespond,
    '',
    'HARD RULES:',
    '- Never invent citations. Cite only sources present in the citation file, already in the page footnotes, or URLs you actually received from web_search / fetch_url in this conversation.',
    '- Preserve footnote reference markers like [^some-id] exactly where they appear unless explicitly asked to move them.',
    '- Keep each block the same markdown type it already is (a paragraph stays a paragraph, a heading stays a heading) unless the instruction explicitly asks for a structural change.',
    '- Never add em dashes, contrastive "not X but Y" constructions, or meta-discourse about the argument.',
    searchEnabled
      ? ''
      : '- Web search is unavailable in this session; rely on the citation file and page content only.',
    '',
    '=== STYLE GUIDE ===',
    styleGuide || '(style guide unavailable)',
    '',
    '=== ARCHIVE OVERVIEW (all pages) ===',
    overview,
    '',
    citations
      ? `=== CITATION FILE FOR THIS PAGE ===\n${citations}`
      : '(No citation file available for this page.)',
  ].join('\n');

  const contextMessage: ModelMessage =
    mode === 'page'
      ? {
          role: 'user',
          content: [
            `[CONTEXT — refreshed each turn]`,
            `PAGE (${slug}) AS AN ID-ANNOTATED BLOCK LIST (current draft):`,
            ...(blocks ?? []).map(
              (b) => `\n[${b.id}] (${b.type})\n"""\n${b.raw}\n"""`,
            ),
          ].join('\n'),
        }
      : {
          role: 'user',
          content: [
            `[CONTEXT — refreshed each turn]`,
            `PAGE (${slug}) FULL MARKDOWN:`,
            '"""',
            pageMarkdown,
            '"""',
            '',
            'TARGET BLOCK (current draft):',
            '"""',
            blockRaw,
            '"""',
          ].join('\n'),
        };

  const history: ModelMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const generation = {
    model,
    system,
    messages: [
      contextMessage,
      {
        role: 'assistant' as const,
        content:
          mode === 'page'
            ? 'Understood. I have the page as a block list, the style guide, and the sources.'
            : 'Understood. I have the page, the target block, the style guide, and the sources.',
      },
      ...history,
    ],
    tools,
    stopWhen: [
      stepCountIs(mode === 'page' ? 14 : 10),
      hasToolCall('propose_edit'),
      hasToolCall('propose_footnote'),
      // Page proposals stop the loop only once one is actually recorded,
      // so a rejected change set (bad block id) lets the model retry.
      () => proposal !== null && proposal.kind === 'page',
    ],
  };

  try {
    if (wantStream) {
      const result = streamText(generation);
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const send = (data: unknown) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };
          try {
            for await (const part of result.fullStream) {
              if (part.type === 'text-delta' && part.text) {
                send({ type: 'text', delta: part.text });
              }
            }
            send({ type: 'proposal', proposal });
            send({ type: 'steps', steps });
            send({ type: 'done' });
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Agent request failed';
            send({ type: 'error', error: message });
          } finally {
            controller.close();
          }
        },
      });
      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    const result = await generateText(generation);
    return NextResponse.json({
      ok: true,
      text: result.text,
      proposal,
      steps,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Agent request failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
