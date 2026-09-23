/**
 * Apply a mapping plan to the taxonomy files.
 *
 *   npx tsx scripts/apply-mapping.ts scripts/mapping-plan.json
 *
 * The plan lists, per page, the complete set of attachments (replacing that
 * page's current ones), and per claim, the argument fields to set. Excerpts
 * are computed here from the live block text (excerptOf), so anchors always
 * match the page. Everything is validated before anything is written:
 * node ids against the map, block ids against the parsed page, source ids
 * against the sources index. Writes only content/taxonomy/*.json.
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { parseMdxBlocks } from '../src/lib/mdx-blocks';
import { excerptOf } from '../src/lib/taxonomy';
import type {
  Attachment,
  AttachmentRole,
  ClaimArgument,
  SourceRecord,
  TaxonomyMap,
} from '../src/lib/taxonomy';

interface PlanAttachment {
  nodeId: string;
  blockId: string; // 'page' or 'block-N'
  role: AttachmentRole;
}

interface Plan {
  pages: Record<string, { attachments: PlanAttachment[] }>;
  arguments: Record<string, ClaimArgument>;
}

const ROOT = process.cwd();
const planPath = process.argv[2];
if (!planPath || !fs.existsSync(planPath)) {
  console.error('usage: npx tsx scripts/apply-mapping.ts <plan.json>');
  process.exit(1);
}
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8')) as Plan;

const mapPath = path.join(ROOT, 'content/taxonomy/map.json');
const attPath = path.join(ROOT, 'content/taxonomy/attachments.json');
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8')) as TaxonomyMap;
const attachments = JSON.parse(fs.readFileSync(attPath, 'utf8')) as Attachment[];
const sources = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'content/taxonomy/sources.json'), 'utf8'),
) as SourceRecord[];

const nodeIds = new Set(map.nodes.map((n) => n.id));
const sourceIds = new Set(sources.map((s) => s.id));
const errors: string[] = [];

// ---- validate + build new attachments ----
const newAtts = new Map<string, Attachment[]>();
for (const [slug, page] of Object.entries(plan.pages)) {
  const file = path.join(ROOT, 'content/archive', `${slug}.mdx`);
  if (!fs.existsSync(file)) {
    errors.push(`${slug}: page file missing`);
    continue;
  }
  const blocks = parseMdxBlocks(matter(fs.readFileSync(file, 'utf8')).content);
  const blockById = new Map(blocks.map((b) => [b.id, b]));
  const rows: Attachment[] = [];
  for (const a of page.attachments) {
    if (!nodeIds.has(a.nodeId)) {
      errors.push(`${slug}: unknown node ${a.nodeId}`);
      continue;
    }
    if (a.blockId === 'page') {
      rows.push({ slug, blockId: 'page', excerpt: '', nodeId: a.nodeId, role: a.role });
      continue;
    }
    const block = blockById.get(a.blockId);
    if (!block) {
      errors.push(`${slug}: block ${a.blockId} not found (has ${blocks.length} blocks)`);
      continue;
    }
    rows.push({
      slug,
      blockId: a.blockId,
      excerpt: excerptOf(block.raw),
      nodeId: a.nodeId,
      role: a.role,
    });
  }
  newAtts.set(slug, rows);
}

// ---- validate arguments ----
for (const [claimId, arg] of Object.entries(plan.arguments)) {
  const node = map.nodes.find((n) => n.id === claimId);
  if (!node || node.kind !== 'claim') {
    errors.push(`argument for ${claimId}: not a claim on the map`);
    continue;
  }
  const g = arg.grounds ?? [];
  const gs = arg.groundSources ?? [];
  if (gs.length !== g.length) {
    errors.push(`argument for ${claimId}: groundSources length ${gs.length} != grounds ${g.length}`);
  }
  for (const row of gs) {
    for (const id of row) {
      if (!sourceIds.has(id)) errors.push(`argument for ${claimId}: unknown source ${id}`);
    }
  }
}

if (errors.length) {
  console.error('PLAN INVALID — nothing written:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

// ---- write ----
const untouched = attachments.filter((a) => !newAtts.has(a.slug));
const finalAtts = [...untouched, ...[...newAtts.values()].flat()];
fs.writeFileSync(attPath, `${JSON.stringify(finalAtts, null, 2)}\n`);

for (const [claimId, arg] of Object.entries(plan.arguments)) {
  const node = map.nodes.find((n) => n.id === claimId)!;
  node.argument = { ...node.argument, ...arg };
}
fs.writeFileSync(mapPath, `${JSON.stringify(map, null, 2)}\n`);

console.log(
  `applied: ${newAtts.size} page(s), ${Object.keys(plan.arguments).length} argument(s); ` +
    `attachments ${attachments.length} → ${finalAtts.length}`,
);
