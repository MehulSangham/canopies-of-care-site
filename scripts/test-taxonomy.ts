/**
 * Pure-function checks for the argument map + x-ray derivation.
 * Run: npx tsx scripts/test-taxonomy.ts
 */
import fs from 'fs';
import path from 'path';
import {
  claimTree,
  counterLinks,
  excerptOf,
  extractLibraryEntry,
  formatMapIndex,
  searchNodes,
  slugifyNodeId,
  type Attachment,
  type TaxonomyMap,
} from '../src/lib/taxonomy';
import { derivePanel, resolveAttachmentBlock } from '../src/lib/taxonomy-derive';
import type { MdxBlock } from '../src/lib/mdx-blocks';

const root = path.join(process.cwd());
const map = JSON.parse(
  fs.readFileSync(path.join(root, 'content/taxonomy/map.json'), 'utf8'),
) as TaxonomyMap;
const attachments = JSON.parse(
  fs.readFileSync(path.join(root, 'content/taxonomy/attachments.json'), 'utf8'),
) as Attachment[];

const titles: Record<string, string> = {
  'a0-elder-tradition': 'A0: The Elder Tradition',
  'a1-founding-era': 'A1: Founding Era',
  'a2-parallel-infrastructure': 'A2: Parallel civic infrastructure',
  'c1-crisis': 'C1: Crisis expansion',
  introduction: 'Introduction',
};

let failed = 0;
function assert(cond: unknown, msg: string) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
  } else {
    console.log(`ok    ${msg}`);
  }
}

assert(map.nodes.length >= 20, `map has structures (${map.nodes.length})`);
assert(
  map.nodes.every((n) => n.id && n.kind && n.label && n.stance && n.definition),
  'every node has required fields',
);

const slugs = [...new Set(attachments.map((a) => a.slug))];
const expected = [
  'a0-elder-tradition',
  'a1-founding-era',
  'a2-parallel-infrastructure',
  'a3-fraternal-scale',
  'b1-new-deal-displacement',
  'b2-civil-rights-care',
  'b3-black-panthers',
  'b4-aids-mutual-aid',
  'b5-maternal-networks',
  'c1-crisis',
  'c2-labor',
  'c3-intentional-institutions',
  'c4-exclusion-not-principle',
  'd1-legal-institutional',
  'd2-competing-tradition',
  'd3-project-2025',
  'd4-contestation',
  'two-accounts',
  'introduction',
];
for (const slug of expected) {
  assert(slugs.includes(slug), `attachments cover ${slug}`);
}

const unknown = attachments.filter((a) => !map.nodes.some((n) => n.id === a.nodeId));
assert(unknown.length === 0, `no dangling attachments (${unknown.length})`);

const a0 = derivePanel(map, attachments, 'a0-elder-tradition', titles, {
  claim: 'RICH FALLBACK CLAIM',
  argument: { grounds: ['primary source'] },
});
assert(a0?.claim === 'RICH FALLBACK CLAIM', 'A0 keeps page-specific claim over map definition');
assert(a0?.argument?.grounds?.[0] === 'primary source', 'A0 keeps page-specific grounds');
assert(
  a0?.frames?.proposes?.some((f) => f.name === 'BELONGING IS SHOWING UP'),
  'A0 proposes BELONGING IS SHOWING UP',
);
assert(
  a0?.frames?.counters?.some((f) => f.name === 'CARE IS CHARITY'),
  'A0 counters CARE IS CHARITY',
);
const also = a0?.frames?.proposes?.find((f) => f.name === 'BELONGING IS SHOWING UP')?.alsoOn;
assert(
  also?.some((p) => p.slug === 'a1-founding-era'),
  'A0 fabric/belonging alsoOn includes A1',
);

const a2 = derivePanel(map, attachments, 'a2-parallel-infrastructure', titles);
assert(
  a2?.claim?.includes('Excluded communities'),
  'A2 (no frontmatter panel) derives claim from map',
);
assert((a2?.frames?.proposes?.length ?? 0) > 0, 'A2 has proposed frames');
assert((a2?.frames?.counters?.length ?? 0) > 0, 'A2 has countered frames');

const c1 = derivePanel(map, attachments, 'c1-crisis', titles);
assert(
  c1?.frames?.proposes?.some((f) => f.name === 'Crisis response'),
  'C1 catalytic frame lands in Proposed',
);

const empty = derivePanel(map, attachments, 'no-such-page', titles, { claim: 'fallback only' });
assert(empty?.claim === 'fallback only', 'unknown slug returns fallback');

const hits = searchNodes(map.nodes, 'fabric');
assert(hits.some((n) => n.id === 'metaphor-community-is-fabric'), 'search finds COMMUNITY IS FABRIC');
assert(searchNodes(map.nodes, 'claim').every((n) => n.kind === 'claim' || n.label.toLowerCase().includes('claim') || n.definition.toLowerCase().includes('claim') || n.id.includes('claim')), 'search by kind');

assert(slugifyNodeId('metaphor', 'CARE IS BUILDING') === 'metaphor-care-is-building', 'slugify is stable');
assert(excerptOf('  hello   world  ').length <= 80, 'excerpt is capped');

const blocks: MdxBlock[] = [
  { id: 'block-0', type: 'heading', raw: '# Title' },
  { id: 'block-1', type: 'paragraph', raw: 'The potlatch wove wealth through the community.' },
];
const recovered = resolveAttachmentBlock(blocks, {
  slug: 'a0-elder-tradition',
  blockId: 'block-9',
  excerpt: 'The potlatch wove wealth through the community.',
  nodeId: 'metaphor-community-is-fabric',
  role: 'advances-reframe',
});
assert(recovered?.id === 'block-1', 'attachment recovers after block id shift via excerpt');

const index = formatMapIndex(map.nodes);
assert(index.includes('claim-a0'), 'map index lists claim-a0');

for (const id of ['metaphors', 'frames', 'argument'] as const) {
  const p = path.join(root, `content/taxonomy/libraries/${id}.md`);
  assert(fs.existsSync(p) && fs.statSync(p).size > 200, `library ${id}.md present`);
}

// Source-entry extraction (chip → map provenance)
const metaphorsLib = fs.readFileSync(
  path.join(root, 'content/taxonomy/libraries/metaphors.md'),
  'utf8',
);
const framesLib = fs.readFileSync(
  path.join(root, 'content/taxonomy/libraries/frames.md'),
  'utf8',
);
const fabricEntry = extractLibraryEntry(metaphorsLib, 'COMMUNITY IS FABRIC');
assert(
  Boolean(fabricEntry && fabricEntry.includes('woven, not bounded')),
  'extracts COMMUNITY IS FABRIC entry from metaphors library',
);
const crisisEntry = extractLibraryEntry(framesLib, 'Crisis response');
assert(
  Boolean(crisisEntry && crisisEntry.includes('official system lags')),
  'label "Crisis response" matches heading "Crisis_response"',
);
assert(
  extractLibraryEntry(metaphorsLib, 'NOT A REAL METAPHOR') === null,
  'unknown label returns null',
);
// Every non-claim map node with a libraryRef resolves to a source entry
const libText: Record<string, string> = { metaphors: metaphorsLib, frames: framesLib };
for (const n of map.nodes) {
  if (!n.libraryRef || !(n.libraryRef in libText)) continue;
  assert(
    extractLibraryEntry(libText[n.libraryRef], n.label) !== null,
    `map node ${n.id} resolves in ${n.libraryRef} library`,
  );
}

// ---- relations: claim tree + counter-links + origins ----
const nodeIds = new Set(map.nodes.map((n) => n.id));
for (const n of map.nodes) {
  if (n.parentId) assert(nodeIds.has(n.parentId), `${n.id} parent exists`);
  for (const c of n.counters ?? []) {
    assert(nodeIds.has(c), `${n.id} counter ${c} exists`);
  }
}
assert(
  map.nodes.every((n) => n.origin && n.source),
  'every node has origin + source citation',
);

const tree = claimTree(map.nodes);
const claims = map.nodes.filter((n) => n.kind === 'claim');
assert(tree.length === claims.length, 'claim tree covers every claim exactly once');
assert(tree[0].node.id === 'claim-two-accounts' && tree[0].depth === 0, 'two-accounts is the root');
const treeSpineA = tree.find((t) => t.node.id === 'claim-spine-a');
const treeA0 = tree.find((t) => t.node.id === 'claim-a0');
assert(treeSpineA?.depth === 1, 'spine A sits under the root');
assert(treeA0?.depth === 2, 'A0 sits under spine A');

const fabricLinks = counterLinks(map.nodes, 'metaphor-community-is-fabric');
assert(
  fabricLinks.counters.some((n) => n.id === 'metaphor-nation-is-container'),
  'FABRIC counters NATION IS CONTAINER',
);
const containerLinks = counterLinks(map.nodes, 'metaphor-nation-is-container');
assert(
  containerLinks.counteredBy.some((n) => n.id === 'metaphor-community-is-fabric'),
  'CONTAINER is countered-by FABRIC (reverse direction)',
);
assert(
  map.nodes.find((n) => n.id === 'metaphor-nation-is-container')?.origin === 'canonical',
  'NATION IS CONTAINER marked canonical (Lakoff)',
);
assert(
  map.nodes.find((n) => n.id === 'metaphor-community-is-fabric')?.origin === 'novel',
  'COMMUNITY IS FABRIC marked novel (project-coined)',
);

// ---- sources index + grounds↔sources ----
import type { SourceRecord } from '../src/lib/taxonomy';
import { searchSources, slugifySourceId } from '../src/lib/taxonomy';

const sourceIndex = JSON.parse(
  fs.readFileSync(path.join(root, 'content/taxonomy/sources.json'), 'utf8'),
) as SourceRecord[];

assert(sourceIndex.length > 200, `sources index populated (${sourceIndex.length} records)`);
assert(
  new Set(sourceIndex.map((s) => s.id)).size === sourceIndex.length,
  'source ids are unique',
);
assert(
  sourceIndex.every((s) => s.citation.trim().length > 0),
  'every source has a citation',
);
assert(
  sourceIndex.every((s) => (s.citedBy ?? []).length > 0),
  'every source is cited by at least one footnote',
);
assert(
  slugifySourceId('David T. Beito, *From Mutual Aid…* https://x.org') ===
    'src-david-t-beito-from-mutual-aid',
  'slugifySourceId strips urls and truncates',
);
assert(
  searchSources(sourceIndex, 'beito').some((s) => /beito/i.test(s.citation)),
  'searchSources finds Beito',
);

// claim-a2 grounds are index-aligned with source links that all resolve
const srcIds = new Set(sourceIndex.map((s) => s.id));
const a2Node = map.nodes.find((n) => n.id === 'claim-a2');
assert(Boolean(a2Node?.argument?.grounds?.length), 'claim-a2 has grounds');
assert(
  a2Node?.argument?.groundSources?.length === a2Node?.argument?.grounds?.length,
  'claim-a2 groundSources aligned with grounds',
);
for (const ids of a2Node?.argument?.groundSources ?? []) {
  assert(ids.length > 0 && ids.every((id) => srcIds.has(id)), `a2 ground sources resolve: ${ids.join(',')}`);
}

// derivePanel resolves spine + ground citations for the reader x-ray
const a2Panel = derivePanel(map, attachments, 'a2-parallel-infrastructure', titles, undefined, sourceIndex);
assert(a2Panel?.spine === 'A · Founding tradition', 'a2 x-ray shows spine position');
assert(
  (a2Panel?.argument?.groundSources?.length ?? 0) === (a2Panel?.argument?.grounds?.length ?? -1),
  'a2 x-ray ground sources aligned',
);
assert(
  Boolean(a2Panel?.argument?.groundSources?.[2]?.[0]?.includes('Du Bois')),
  'a2 ground 3 leads with the Du Bois 1907 primary source',
);

// fallback grounds (frontmatter) never get groundSources bolted on
const a0Fallback = derivePanel(
  map,
  attachments,
  'a0-elder-tradition',
  titles,
  { argument: { grounds: ['frontmatter ground'] } },
  sourceIndex,
);
assert(
  a0Fallback?.argument?.groundSources === undefined,
  'fallback grounds carry no source links',
);

// ---- anchors + notation ----
import matter from 'gray-matter';
import { parseMdxBlocks } from '../src/lib/mdx-blocks';
import { ROLE_GLYPHS, normalizeForMatch, shorthand } from '../src/lib/taxonomy-glyphs';

const a2Body = matter(
  fs.readFileSync(path.join(root, 'content/archive/a2-parallel-infrastructure.mdx'), 'utf8'),
).content;
const a2Blocks = parseMdxBlocks(a2Body);
const a2Anchored = derivePanel(
  map,
  attachments,
  'a2-parallel-infrastructure',
  titles,
  undefined,
  sourceIndex,
  a2Blocks,
);
const allA2Frames = [
  ...(a2Anchored?.frames?.proposes ?? []),
  ...(a2Anchored?.frames?.counters ?? []),
];
const anchored = allA2Frames.filter((f) => f.anchors?.length);
assert(anchored.length >= 3, `a2 frames carry anchors (${anchored.length} anchored)`);
assert(
  allA2Frames.every((f) => f.stance && f.role),
  'every derived frame carries stance + role for the notation',
);
const charity = allA2Frames.find((f) => f.name === 'CARE IS CHARITY');
assert(
  Boolean(charity?.anchors?.[0]?.excerpt.includes('ethnic colour')),
  'CARE IS CHARITY anchored to the "remembered as ethnic colour" passage',
);
// anchors survive block-id drift: derive with excerpt-only recovery
const shifted = attachments.map((a) =>
  a.slug === 'a2-parallel-infrastructure' && a.blockId !== 'page'
    ? { ...a, blockId: 'block-999' }
    : a,
);
const panelRecovered = derivePanel(
  map,
  shifted,
  'a2-parallel-infrastructure',
  titles,
  undefined,
  sourceIndex,
  a2Blocks,
);
const recoveredAnchors = [
  ...(panelRecovered?.frames?.proposes ?? []),
  ...(panelRecovered?.frames?.counters ?? []),
].filter((f) => f.anchors?.length);
assert(recoveredAnchors.length >= 3, 'anchors recover via excerpt when block ids drift');

assert(ROLE_GLYPHS['describes-dominant'] === '▽', 'dominant role glyph is ▽');
assert(
  normalizeForMatch('**Bold** [link](https://x.org) text[^3]') === 'bold link text',
  'normalizeForMatch strips markdown for DOM comparison',
);
assert(
  shorthand({ role: 'advances-reframe', label: 'FABRIC', blockId: 'block-3', verdict: 'supported' }) ===
    '▲ FABRIC @block-3 ✓',
  'text shorthand composes',
);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall taxonomy checks passed');
