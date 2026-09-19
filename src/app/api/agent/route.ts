import { NextResponse } from 'next/server';
import { generateText, tool, stepCountIs, hasToolCall, type ModelMessage } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { checkIsAdmin } from '@/lib/auth';
import {
  getStyleGuide,
  getCitationFile,
  getArchiveOverview,
} from '@/lib/ai/agent-context';

export const maxDuration = 120;

/**
 * Model resolution:
 * - ANTHROPIC_API_KEY set → call Anthropic directly.
 * - Otherwise, with AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN present, route
 *   through Vercel AI Gateway (federated identity; billed to the Vercel team).
 */
function resolveModel() {
  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = createAnthropic({
      // Some Anthropic orgs require requests to name a workspace when the
      // key is not scoped to one.
      headers: process.env.ANTHROPIC_WORKSPACE_ID
        ? { 'anthropic-workspace-id': process.env.ANTHROPIC_WORKSPACE_ID }
        : undefined,
    });
    return anthropic(process.env.AI_MODEL || 'claude-sonnet-4-5');
  }
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
    return process.env.AI_MODEL || 'anthropic/claude-sonnet-4.5';
  }
  return null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentRequest {
  slug: string;
  blockRaw: string;
  pageMarkdown: string;
  messages: ChatMessage[];
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

export async function POST(req: Request) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const model = resolveModel();
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

  let body: AgentRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { slug, blockRaw, pageMarkdown, messages } = body;
  if (
    !slug ||
    !blockRaw ||
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages[messages.length - 1].role !== 'user'
  ) {
    return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
  }

  const styleGuide = getStyleGuide();
  const citations = getCitationFile(slug);
  const overview = getArchiveOverview();
  const searchEnabled = Boolean(process.env.EXA_API_KEY);

  const steps: string[] = [];
  let proposal: EditProposal | FootnoteProposal | null = null;

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
  };

  const system = [
    'You are the resident editor for "Canopies of Care", an editorial archive about the American mutual-aid tradition. You work with a human editor on one block of a page at a time, in conversation. You are precise, conservative, and you never invent facts or sources.',
    '',
    'HOW TO RESPOND:',
    '- When asked to revise, rewrite, tighten, or improve the block: produce the revision and call propose_edit. Keep your accompanying text brief.',
    '- When asked for a footnote or citation: ground it in the citation file or web search, then call propose_footnote.',
    '- When asked to verify claims, answer questions, or discuss approach: reply in plain text; do not call a proposal tool.',
    '- The editor sees proposals as cards with an Apply button; the current draft in the context below is always the latest state of the block.',
    '',
    'HARD RULES:',
    '- Never invent citations. Cite only sources present in the citation file, already in the page footnotes, or URLs you actually received from web_search / fetch_url in this conversation.',
    '- Preserve footnote reference markers like [^some-id] exactly where they appear unless explicitly asked to move them.',
    '- Keep the block the same markdown type it already is (a paragraph stays a paragraph, a heading stays a heading).',
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

  const contextMessage: ModelMessage = {
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

  try {
    const result = await generateText({
      model,
      system,
      messages: [
        contextMessage,
        { role: 'assistant', content: 'Understood. I have the page, the target block, the style guide, and the sources.' },
        ...history,
      ],
      tools,
      stopWhen: [
        stepCountIs(10),
        hasToolCall('propose_edit'),
        hasToolCall('propose_footnote'),
      ],
    });

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
