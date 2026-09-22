/**
 * The shared notation for the argument system. One mark per dimension,
 * used identically in the editor, the argument map, the public x-ray,
 * and the margin markers — so the language never forks:
 *
 *   role   → glyph      ▲ advances the reframe · ▽ describes the dominant
 *                        account · ◇ catalytic beat
 *   stance → color      reframe = accent · dominant = earth ·
 *                        catalytic = deep forest
 *   origin → dot        ● canonical · ◐ adapted · ○ novel (editor only)
 *   verdict → mark      ✓ supported · ~ weak · ✕ drift (editor only)
 *
 * Text shorthand composes them: `▲ FABRIC @block-3 ✓`.
 */
import type { AttachmentRole, NodeOrigin, NodeStance } from '@/lib/taxonomy';

export const ROLE_GLYPHS: Record<AttachmentRole, string> = {
  'advances-reframe': '▲',
  'describes-dominant': '▽',
  'aims-catalytic': '◇',
};

export const ROLE_SHORT_LABELS: Record<AttachmentRole, string> = {
  'advances-reframe': 'advances the reframe',
  'describes-dominant': 'describes the dominant account',
  'aims-catalytic': 'catalytic beat',
};

export const STANCE_COLORS: Record<NodeStance, string> = {
  reframe: 'var(--color-nis-accent)',
  dominant: 'var(--color-nis-earth)',
  catalytic: 'var(--color-nis-deep-forest)',
};

/** Ink-legible variants for text on light paper (accent lime is too pale). */
export const STANCE_TEXT_COLORS: Record<NodeStance, string> = {
  reframe: '#7a8500',
  dominant: 'var(--color-nis-earth)',
  catalytic: 'var(--color-nis-deep-forest)',
};

export const ORIGIN_DOTS: Record<NodeOrigin, string> = {
  canonical: '●',
  adapted: '◐',
  novel: '○',
};

export const VERDICT_MARKS: Record<string, string> = {
  supported: '✓',
  weak: '~',
  drift: '✕',
  unsourced: '~',
  mismatch: '✕',
};

/** One-line text shorthand, e.g. `▲ COMMUNITY IS FABRIC @block-3`. */
export function shorthand(opts: {
  role: AttachmentRole;
  label: string;
  blockId?: string;
  verdict?: string;
}): string {
  const parts = [ROLE_GLYPHS[opts.role], opts.label];
  if (opts.blockId && opts.blockId !== 'page') parts.push(`@${opts.blockId}`);
  if (opts.verdict && VERDICT_MARKS[opts.verdict]) parts.push(VERDICT_MARKS[opts.verdict]);
  return parts.join(' ');
}

/**
 * Normalize text for anchor matching: strips markdown syntax and collapses
 * whitespace so a raw-markdown excerpt can be compared with rendered
 * DOM textContent.
 */
export function normalizeForMatch(text: string): string {
  return text
    .replace(/\[\^[^\]]+\]/g, '') // footnote refs
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links/images → label
    .replace(/[*_`#>]+/g, '') // emphasis, headings, quotes
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .slice(0, 48);
}
