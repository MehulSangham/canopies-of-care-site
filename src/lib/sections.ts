/**
 * Central definition of all archive sections.
 * This is the single source of truth — every other file imports from here.
 */

export interface SectionDef {
  key: string;
  title: string;
  description: string;
}

export const SECTIONS: SectionDef[] = [
  {
    key: 'A',
    title: 'The Founding Tradition',
    description:
      'Mutual aid is real, it is old, and it reached massive scale.',
  },
  {
    key: 'B',
    title: 'Mutual Aid Through the Evolution of American Identity',
    description:
      'The tradition survived displacement, co-optation, and erasure across the 20th and 21st centuries.',
  },
  {
    key: 'C',
    title: 'The Transcendence Across Ethnicities and Identities',
    description:
      'In crisis, in labour, and by design, mutual aid crossed the ethnic lines that structured everyday life.',
  },
  {
    key: 'D',
    title: 'Systematic Displacement and the Contest Over American Identity',
    description:
      'Why you don\'t know this history, who displaced it, and what the archival document does about it.',
  },
];

/** Lookup map: key → title */
export const SECTION_TITLES: Record<string, string> = Object.fromEntries(
  SECTIONS.map((s) => [s.key, s.title]),
);

/** Lookup map: key → description */
export const SECTION_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  SECTIONS.map((s) => [s.key, s.description]),
);
