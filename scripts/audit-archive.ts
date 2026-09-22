/**
 * Archive auditor — checks the argument map, attachments, and sources index
 * against the actual pages, and writes a report.
 *
 *   npx tsx scripts/audit-archive.ts          # mechanical checks only
 *   npx tsx scripts/audit-archive.ts --ai     # + model verification per page
 *
 * Mechanical checks (no model):
 *  - dangling attachments (node id not on the map, or block unrecoverable)
 *  - pages with no attachments / no claim attached
 *  - claims with no grounds, grounds with no linked sources
 *  - claims outside the spine (no parentId and no children)
 *  - map nodes never attached anywhere
 *  - ground source links pointing at missing source ids
 *
 * AI pass (--ai, needs ANTHROPIC_API_KEY in .env.local):
 *  - per page: verify attached nodes against the text, flag drift
 *
 * Output: content/taxonomy/audit.md
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { parseMdxBlocks } from '../src/lib/mdx-blocks';
import { resolveAttachmentBlock } from '../src/lib/taxonomy-derive';
import type { Attachment, SourceRecord, TaxonomyMap } from '../src/lib/taxonomy';

const ROOT = process.cwd();
const ARCHIVE = path.join(ROOT, 'content/archive');
const OUT = path.join(ROOT, 'content/taxonomy/audit.md');
const AI = process.argv.includes('--ai');

// ---- load everything ----
const map = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'content/taxonomy/map.json'), 'utf8'),
) as TaxonomyMap;
const attachments = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'content/taxonomy/attachments.json'), 'utf8'),
) as Attachment[];
const sources = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'content/taxonomy/sources.json'), 'utf8'),
) as SourceRecord[];

const pages = fs
  .readdirSync(ARCHIVE)
  .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
  .sort()
  .map((f) => {
    const slug = f.replace(/\.(mdx|md)$/, '');
    const parsed = matter(fs.readFileSync(path.join(ARCHIVE, f), 'utf8'));
    const panel = parsed.data.panel as { argument?: { grounds?: string[] } } | undefined;
    return {
      slug,
      title: (parsed.data.title as string) ?? slug,
      hasPanel: Boolean(panel),
      hasPanelGrounds: Boolean(panel?.argument?.grounds?.length),
      body: parsed.content,
      blocks: parseMdxBlocks(parsed.content),
    };
  });

const nodeById = new Map(map.nodes.map((n) => [n.id, n]));
const sourceIds = new Set(sources.map((s) => s.id));
const lines: string[] = [
  '# Archive audit',
  '',
  `Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · ${
    map.nodes.length
  } nodes · ${attachments.length} attachments · ${sources.length} sources · ${pages.length} pages${AI ? ' · AI pass on' : ''}`,
  '',
];
let issues = 0;
const flag = (section: string[], msg: string) => {
  section.push(`- ${msg}`);
  issues += 1;
};

// ---- 1. attachment integrity ----
const attIssues: string[] = [];
for (const a of attachments) {
  if (!nodeById.has(a.nodeId)) {
    flag(attIssues, `\`${a.slug}\` → **${a.nodeId}**: node id is not on the map`);
    continue;
  }
  if (a.blockId === 'page') continue;
  const page = pages.find((p) => p.slug === a.slug);
  if (!page) {
    flag(attIssues, `\`${a.slug}\` → ${a.nodeId}: page no longer exists`);
    continue;
  }
  if (!resolveAttachmentBlock(page.blocks, a)) {
    flag(
      attIssues,
      `\`${a.slug}\` → ${a.nodeId}: block \`${a.blockId}\` unrecoverable (id gone and excerpt not found)`,
    );
  }
}
lines.push('## Attachment integrity', '', ...(attIssues.length ? attIssues : ['- ✓ all attachments resolve']), '');

// ---- 2. page coverage ----
const covIssues: string[] = [];
for (const p of pages) {
  const atts = attachments.filter((a) => a.slug === p.slug);
  if (atts.length === 0) {
    flag(covIssues, `\`${p.slug}\` — no attachments at all${p.hasPanel ? ' (frontmatter panel only)' : ''}`);
    continue;
  }
  const hasClaim = atts.some((a) => nodeById.get(a.nodeId)?.kind === 'claim');
  if (!hasClaim) flag(covIssues, `\`${p.slug}\` — no claim attached (x-ray has no Argument tab)`);
}
lines.push('## Page coverage', '', ...(covIssues.length ? covIssues : ['- ✓ every page carries a claim']), '');

// ---- 3. claims: grounds & sources ----
const claimIssues: string[] = [];
const claims = map.nodes.filter((n) => n.kind === 'claim');
for (const c of claims) {
  const grounds = c.argument?.grounds ?? [];
  const gs = c.argument?.groundSources ?? [];
  if (grounds.length === 0) {
    const coveredByFrontmatter = attachments.some(
      (a) => a.nodeId === c.id && pages.find((p) => p.slug === a.slug)?.hasPanelGrounds,
    );
    flag(
      claimIssues,
      `**${c.id}** (${c.label}) — no grounds on the map node${
        coveredByFrontmatter ? ' (page frontmatter carries grounds, but they are unsourced)' : '; the claim is asserted, not argued'
      }`,
    );
    continue;
  }
  grounds.forEach((g, i) => {
    const linked = gs[i] ?? [];
    if (linked.length === 0) {
      flag(claimIssues, `**${c.id}** ground ${i + 1} — no sources linked: “${g.slice(0, 70)}…”`);
    }
    for (const id of linked) {
      if (!sourceIds.has(id)) {
        flag(claimIssues, `**${c.id}** ground ${i + 1} — links missing source id \`${id}\``);
      }
    }
  });
}
lines.push('## Claims: grounds & sources', '', ...(claimIssues.length ? claimIssues : ['- ✓ every claim has sourced grounds']), '');

// ---- 4. spine & usage ----
const spineIssues: string[] = [];
for (const c of claims) {
  const hasParent = Boolean(c.parentId && nodeById.has(c.parentId));
  const hasChildren = claims.some((k) => k.parentId === c.id);
  if (!hasParent && !hasChildren) {
    flag(spineIssues, `**${c.id}** (${c.label}) — floating claim, not in the spine tree`);
  }
}
const attachedNodeIds = new Set(attachments.map((a) => a.nodeId));
for (const n of map.nodes) {
  // Structural spine claims (claims with children) organise the tree and
  // need not be attached to a page themselves.
  const isSpine = n.kind === 'claim' && claims.some((k) => k.parentId === n.id);
  if (!attachedNodeIds.has(n.id) && !isSpine) {
    flag(spineIssues, `${n.id} [${n.kind}] — on the map but attached nowhere`);
  }
}
lines.push('## Spine & usage', '', ...(spineIssues.length ? spineIssues : ['- ✓ spine connected, all nodes in use']), '');

// ---- 5. AI verification pass ----
async function aiPass() {
  // read key from .env.local without extra deps
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  const key = env
    .match(/^ANTHROPIC_API_KEY=(.+)$/m)?.[1]
    ?.trim()
    .replace(/^["']|["']$/g, '');
  if (!key) {
    lines.push('## AI verification', '', '- skipped: no ANTHROPIC_API_KEY in .env.local', '');
    return;
  }
  process.env.ANTHROPIC_API_KEY = key;
  const { generateText, tool, stepCountIs, hasToolCall } = await import('ai');
  const { createAnthropic } = await import('@ai-sdk/anthropic');
  const { z } = await import('zod');
  const model = createAnthropic()('claude-haiku-4-5');

  const inventory = map.nodes
    .map((n) => `- ${n.id} [${n.kind}/${n.stance}] "${n.label}" — ${n.definition}`)
    .join('\n');

  lines.push('## AI verification (attached nodes vs. page text)', '');
  for (const p of pages) {
    const atts = attachments.filter((a) => a.slug === p.slug);
    if (atts.length === 0) continue;
    let verdicts: { nodeId: string; verdict: string; note: string }[] = [];
    const report = tool({
      description: 'Report one verdict per attached node. Call exactly once.',
      inputSchema: z.object({
        verifications: z.array(
          z.object({
            nodeId: z.string(),
            verdict: z.enum(['supported', 'weak', 'drift']),
            note: z.string(),
          }),
        ),
      }),
      execute: async (input: { verifications: typeof verdicts }) => {
        verdicts = input.verifications;
        return 'Recorded.';
      },
    });
    try {
      await generateText({
        model,
        system: [
          'You are a frame analyst. Verify each attached node id against the passage: supported / weak / drift. One short note each. Call report once.',
          'Read the role in parentheses carefully — it defines what "supported" means:',
          '- advances-reframe: supported when the passage instantiates the structure in its own voice. Drift when the prose actually activates the rival dominant system (Eligibility, Compliance, Deserving, accounting/scarcity language).',
          '- describes-dominant: supported when the passage DEPICTS, NAMES, or CONTESTS that structure as the prevailing account. A passage that rejects or reframes against the structure still supports a describes-dominant attachment — that is the attachment doing its job. Drift only if the structure is entirely absent, or the prose unwittingly adopts it as its own voice.',
          '- aims-catalytic: supported when the beat plausibly lands with readers at the edge of the discourse window.',
        ].join('\n'),
        messages: [
          {
            role: 'user',
            content: [
              '=== MAP ===',
              inventory,
              '',
              `=== ATTACHED === ${atts.map((a) => `${a.nodeId} (${a.role})`).join(', ')}`,
              '',
              '=== PAGE ===',
              p.body.slice(0, 14000),
            ].join('\n'),
          },
        ],
        tools: { report },
        stopWhen: [stepCountIs(3), hasToolCall('report')],
      });
    } catch (err) {
      lines.push(`### ${p.slug}`, '', `- ⚠ model error: ${err instanceof Error ? err.message : err}`, '');
      continue;
    }
    const bad = verdicts.filter((v) => v.verdict !== 'supported');
    lines.push(`### ${p.slug}`, '');
    if (bad.length === 0) {
      lines.push(`- ✓ all ${verdicts.length} attachments supported`, '');
    } else {
      for (const v of bad) {
        flag(lines, `**${v.nodeId}** — ${v.verdict}: ${v.note}`);
      }
      lines.push('');
    }
    process.stdout.write(`  ai: ${p.slug} — ${bad.length ? `${bad.length} flagged` : 'clean'}\n`);
  }
}

(async () => {
  if (AI) await aiPass();
  else lines.push('## AI verification', '', '- skipped (run with --ai)', '');
  fs.writeFileSync(OUT, `${lines.join('\n')}\n`);
  console.log(`\naudit complete — ${issues} issue(s) → content/taxonomy/audit.md`);
})();
