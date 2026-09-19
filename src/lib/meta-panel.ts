/**
 * Meta panel ("X-ray view") data, stored as structured `panel:` frontmatter
 * on archive pages. Every field is optional — tabs render only when their
 * data exists, and the panel itself renders only when `panel:` is present.
 */

export interface PanelFrame {
  /** Frame or conceptual metaphor name, e.g. "COMMUNITY IS FABRIC" */
  name: string;
  /** One-line explanation of how it operates on this page */
  note?: string;
}

export interface MetaPanelData {
  /** The page's claim, stated plainly */
  claim?: string;
  argument?: {
    /** What must be shown for the claim to hold */
    grounds?: string[];
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
