/**
 * Meta panel ("X-ray view") data, stored as structured `panel:` frontmatter
 * on archive pages. Every field is optional — tabs render only when their
 * data exists, and the panel itself renders only when `panel:` is present.
 */

export interface PanelAnchor {
  /** Block id at derive time (may drift; excerpt is the stable key) */
  blockId: string;
  /** Raw-markdown excerpt of the passage, for client-side DOM matching */
  excerpt: string;
}

export interface PanelFrame {
  /** Frame or conceptual metaphor name, e.g. "COMMUNITY IS FABRIC" */
  name: string;
  /** One-line explanation of how it operates on this page */
  note?: string;
  /** Other archive pages that attach the same node */
  alsoOn?: { slug: string; title: string }[];
  /** Stance drives the notation color */
  stance?: 'reframe' | 'dominant' | 'catalytic';
  /** Role drives the notation glyph */
  role?: 'advances-reframe' | 'describes-dominant' | 'aims-catalytic';
  /** Passages this structure is anchored to (block-level attachments) */
  anchors?: PanelAnchor[];
}

export interface MetaPanelData {
  /** The page's claim, stated plainly */
  claim?: string;
  /** The parent claim in the archive's argument tree, if this claim supports one */
  spine?: string;
  argument?: {
    /** What must be shown for the claim to hold */
    grounds?: string[];
    /** Resolved source citations backing each ground, index-aligned with grounds */
    groundSources?: string[][];
    /** The inferential bridge from grounds to claim */
    warrant?: string;
    /** Strength and limits of the claim */
    qualifier?: string;
    /** The strongest objection */
    rebuttal?: string;
    /** The answer to the objection */
    answer?: string;
  };
  frames?: {
    /** Frames and metaphors this page counters or displaces */
    counters?: PanelFrame[];
    /** Frames and metaphors this page advances */
    proposes?: PanelFrame[];
  };
  logic?: {
    /** The deep structure disclosed as problematic */
    problematic?: string;
    /** The alternative structure proposed */
    alternative?: string;
  };
}

export interface PanelSourceGroup {
  /** Footnote id the sources belong to */
  id: string;
  /** Source lines (markdown-ish: *italics*, bare URLs) */
  items: string[];
}
