/**
 * Standalone grounds verifier — checks each Toulmin ground of a claim
 * against its linked sources, without needing the dev server.
 *
 *   npx tsx scripts/verify-grounds.ts claim-a1 claim-a2 …
 *   npx tsx scripts/verify-grounds.ts --all     # every claim that has grounds
 *
 * Same semantics as /api/taxonomy-agent mode "grounds":
 * supported / unsourced / mismatch per ground.
 */
import fs from 'fs';
import path from 'path';
import type { SourceRecord, TaxonomyMap } from '../src/lib/taxonomy';

const ROOT = process.cwd();
const map = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'content/taxonomy/map.json'), 'utf8'),
) as TaxonomyMap;
const sources = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'content/taxonomy/sources.json'), 'utf8'),
) as SourceRecord[];
const sourceById = new Map(sources.map((s) => [s.id, s]));

const args = process.argv.slice(2);
const ids = args.includes('--all')
  ? map.nodes.filter((n) => n.kind === 'claim' && n.argument?.grounds?.length).map((n) => n.id)
  : args;

if (ids.length === 0) {
  console.error('usage: npx tsx scripts/verify-grounds.ts <claim-id>… | --all');
  process.exit(1);
}

(async () => {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  const key = env
    .match(/^ANTHROPIC_API_KEY=(.+)$/m)?.[1]
    ?.trim()
    .replace(/^["']|["']$/g, '');
  if (!key) {
    console.error('no ANTHROPIC_API_KEY in .env.local');
    process.exit(1);
  }
  process.env.ANTHROPIC_API_KEY = key;
  const { generateText, tool, stepCountIs, hasToolCall } = await import('ai');
  const { createAnthropic } = await import('@ai-sdk/anthropic');
  const { z } = await import('zod');
  const model = createAnthropic()('claude-haiku-4-5');

  let flagged = 0;
  for (const id of ids) {
    const node = map.nodes.find((n) => n.id === id);
    if (!node || node.kind !== 'claim' || !node.argument?.grounds?.length) {
      console.log(`${id}: skipped (not a claim with grounds)`);
      continue;
    }
    const grounds = node.argument.grounds;
    const gs = node.argument.groundSources ?? [];
    const groundsBlock = grounds
      .map((g, i) => {
        const linked = (gs[i] ?? [])
          .map((sid) => sourceById.get(sid))
          .filter(Boolean)
          .map((s) => `    · [${s!.id}] ${s!.citation}`)
          .join('\n');
        return `GROUND ${i}: ${g}\n${linked || '    · (no sources linked)'}`;
      })
      .join('\n\n');

    let verdicts: { index: number; verdict: string; note: string }[] = [];
    const report = tool({
      description: 'Report the verdict for every ground. Call exactly once.',
      inputSchema: z.object({
        grounds: z.array(
          z.object({
            index: z.number(),
            verdict: z.enum(['supported', 'unsourced', 'mismatch']),
            note: z.string(),
          }),
        ),
      }),
      execute: async (input: { grounds: typeof verdicts }) => {
        verdicts = input.grounds;
        return 'Recorded.';
      },
    });

    try {
      await generateText({
        model,
        system: [
          'You are a fact-checking assistant for an editorial archive on the American mutual-aid tradition.',
          'You receive one claim, its Toulmin grounds, and the sources linked to each ground (citation lines from the archive sources index).',
          'For every ground return exactly one verdict:',
          '- supported: the linked sources, taken at face value, plausibly establish what the ground asserts (right subject, right period, right kind of evidence).',
          '- unsourced: no sources are linked, or the linked sources do not cover the assertion.',
          '- mismatch: a linked source is about something else, or the ground overstates what such a source could show (wrong era, wrong population, wrong magnitude).',
          'Judge coverage and fit from the citations; you cannot read the works themselves, so flag only clear mismatches. Then call report once.',
        ].join('\n'),
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
      console.log(`${id}: model error — ${err instanceof Error ? err.message : err}`);
      flagged += 1;
      continue;
    }

    const bad = verdicts.filter((v) => v.verdict !== 'supported');
    if (bad.length === 0) {
      console.log(`${id}: ✓ all ${verdicts.length} grounds supported`);
    } else {
      flagged += bad.length;
      console.log(`${id}:`);
      for (const v of verdicts) {
        const mark = v.verdict === 'supported' ? '✓' : v.verdict === 'unsourced' ? '∅' : '✕';
        console.log(`  ${mark} ground ${v.index}: ${v.verdict} — ${v.note}`);
      }
    }
  }
  process.exit(flagged ? 2 : 0);
})();
