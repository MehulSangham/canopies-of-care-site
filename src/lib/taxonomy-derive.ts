import type { MdxBlock } from '@/lib/mdx-blocks';
import type { MetaPanelData, PanelFrame } from '@/lib/meta-panel';
import type { Attachment, SourceRecord, TaxonomyMap, TaxonomyNode } from '@/lib/taxonomy';

export function resolveAttachmentBlock(
  blocks: MdxBlock[],
  att: Attachment,
): MdxBlock | undefined {
  if (att.blockId === 'page') return undefined;
  const byId = blocks.find((b) => b.id === att.blockId);
  if (byId) {
    if (!att.excerpt || byId.raw.replace(/\s+/g, ' ').includes(att.excerpt.slice(0, 40))) {
      return byId;
    }
  }
  if (att.excerpt) {
    const needle = att.excerpt.slice(0, 40);
    return blocks.find((b) => b.raw.replace(/\s+/g, ' ').includes(needle));
  }
  return byId;
}

export function attachmentsForPage(
  all: Attachment[],
  slug: string,
  blocks?: MdxBlock[],
): Attachment[] {
  return all.filter((a) => {
    if (a.slug !== slug) return false;
    if (a.blockId === 'page') return true;
    if (!blocks) return true;
    return Boolean(resolveAttachmentBlock(blocks, a));
  });
}

function alsoOn(
  all: Attachment[],
  nodeId: string,
  slug: string,
  titles: Record<string, string>,
): PanelFrame['alsoOn'] {
  const slugs = [...new Set(all.filter((a) => a.nodeId === nodeId && a.slug !== slug).map((a) => a.slug))];
  if (slugs.length === 0) return undefined;
  return slugs.map((s) => ({ slug: s, title: titles[s] || s }));
}

export function derivePanel(
  map: TaxonomyMap,
  allAttachments: Attachment[],
  slug: string,
  titles: Record<string, string>,
  fallback?: MetaPanelData,
  sources?: SourceRecord[],
): MetaPanelData | undefined {
  const pageAtts = allAttachments.filter((a) => a.slug === slug);
  if (pageAtts.length === 0) return fallback;

  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  const claimAtt = pageAtts.find((a) => byId.get(a.nodeId)?.kind === 'claim');
  const claimNode = claimAtt ? byId.get(claimAtt.nodeId) : undefined;

  const toFrame = (n: TaxonomyNode): PanelFrame => ({
    name: n.label,
    note: n.definition,
    alsoOn: alsoOn(allAttachments, n.id, slug, titles),
  });

  const proposes = pageAtts
    .filter((a) => a.role === 'advances-reframe')
    .map((a) => byId.get(a.nodeId))
    .filter((n): n is TaxonomyNode => Boolean(n && n.kind !== 'claim'))
    .map(toFrame);

  const counters = pageAtts
    .filter((a) => a.role === 'describes-dominant')
    .map((a) => byId.get(a.nodeId))
    .filter((n): n is TaxonomyNode => Boolean(n && n.kind !== 'claim'))
    .map(toFrame);

  const catalytic = pageAtts
    .filter((a) => a.role === 'aims-catalytic')
    .map((a) => byId.get(a.nodeId))
    .filter((n): n is TaxonomyNode => Boolean(n && n.kind !== 'claim'))
    .map(toFrame);

  const nodeArg = claimNode?.argument;
  // Ground source citations apply only when the grounds themselves come from
  // the map node (fallback grounds have no source links to align with).
  const usingNodeGrounds = !fallback?.argument?.grounds?.length && Boolean(nodeArg?.grounds?.length);
  const sourceById = new Map((sources ?? []).map((s) => [s.id, s]));
  const groundSources =
    usingNodeGrounds && nodeArg?.groundSources?.length
      ? nodeArg.grounds!.map((_, i) =>
          (nodeArg.groundSources?.[i] ?? [])
            .map((id) => sourceById.get(id)?.citation)
            .filter((c): c is string => Boolean(c)),
        )
      : undefined;
  const argument = {
    grounds: fallback?.argument?.grounds ?? nodeArg?.grounds,
    groundSources: groundSources?.some((g) => g.length) ? groundSources : undefined,
    warrant: fallback?.argument?.warrant ?? nodeArg?.warrant,
    qualifier: fallback?.argument?.qualifier ?? nodeArg?.qualifier,
    rebuttal: fallback?.argument?.rebuttal ?? nodeArg?.rebuttal,
    answer: fallback?.argument?.answer ?? nodeArg?.answer,
  };
  const hasArgument = Boolean(
    argument.grounds?.length ||
      argument.warrant ||
      argument.qualifier ||
      argument.rebuttal ||
      argument.answer,
  );

  const unique = (list: PanelFrame[]) => {
    const seen = new Set<string>();
    return list.filter((f) => {
      if (seen.has(f.name)) return false;
      seen.add(f.name);
      return true;
    });
  };

  const parentClaim = claimNode?.parentId ? byId.get(claimNode.parentId) : undefined;

  const derived: MetaPanelData = {
    claim: fallback?.claim || claimNode?.definition,
    spine: parentClaim?.label,
    argument: hasArgument ? argument : fallback?.argument,
    frames: {
      proposes: proposes.length ? unique(proposes) : fallback?.frames?.proposes,
      counters: counters.length ? unique(counters) : fallback?.frames?.counters,
    },
    logic: fallback?.logic ?? {
      problematic: counters[0]?.note,
      alternative: proposes[0]?.note,
    },
  };

  if (catalytic.length) {
    derived.frames = {
      ...derived.frames,
      proposes: unique([...(derived.frames?.proposes ?? []), ...catalytic]),
    };
  }

  const hasAnything =
    derived.claim ||
    derived.argument ||
    (derived.frames?.proposes && derived.frames.proposes.length) ||
    (derived.frames?.counters && derived.frames.counters.length);
  return hasAnything ? derived : fallback;
}
