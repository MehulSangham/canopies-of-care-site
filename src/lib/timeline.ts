/**
 * Data for the landing-page timeline.
 *
 * Structure follows the reframe strategy from the narrative analysis,
 * with a dual spine: the centre stream carries THE PRACTICE (mutual
 * aid, left of the spine) and THE PRESSURE (exclusion and
 * displacement, right of the spine) as dated events, while the right
 * rail carries THE STORY, six phases of how the national narrative
 * evolved. The visual argument: the aid strand never breaks; the
 * exclusion strand keeps reappearing beside it; the story is the
 * thing that changes.
 */

export type Strand = 'aid' | 'exclusion';

export interface TimelineEvent {
  /** Sort key and phase assignment */
  year: number;
  /** Displayed date, e.g. "April 1787" or "1930s" */
  dateLabel: string;
  title: string;
  blurb: string;
  /** 'aid' renders left of the spine, 'exclusion' right */
  strand: Strand;
  image?: string;
  href: string;
  /**
   * Heading id on the destination page (rehype-slug) for events whose
   * story sits mid-page. Omitted when the event is the page's opening
   * story, in which case the top of the page is the right landing spot.
   */
  anchor?: string;
}

/** Stable DOM id for an event node on the landing timeline. */
export function eventDomId(e: TimelineEvent): string {
  return `tl-${e.year}-${e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/** Href for an event card: page, origin marker, and section anchor. */
export function eventLink(e: TimelineEvent): string {
  return `${e.href}?tl=${eventDomId(e)}${e.anchor ? `#${e.anchor}` : ''}`;
}

export interface NarrativePhase {
  id: string;
  title: string;
  range: string;
  /** Events with year >= from and year <= to belong to this phase */
  from: number;
  to: number;
  /** How the story being told about America stands during this phase */
  narrative: string;
}

export const NARRATIVE_PHASES: NarrativePhase[] = [
  {
    id: 'elder-tradition',
    title: 'The Elder Tradition',
    range: 'before 1784',
    from: 0,
    to: 1783,
    narrative:
      'Before there is a Republic to tell stories about itself, the continent already runs on reciprocity. The potlatch, the giveaway, and the kinship economies of Indigenous nations feed the hungry, insure the unlucky, and keep their records in witnesses rather than ledgers. Everything that follows in this timeline has an elder, and the elder is still practising.',
  },
  {
    id: 'two-foundings',
    title: 'Two Foundings',
    range: '1784–1848',
    from: 1784,
    to: 1848,
    narrative:
      'The official story records one founding, with a convention, a constitution, and a list of names. The other founding keeps no seat in that story, yet from the first decade of the Republic, showing up for each other is how excluded Americans practise citizenship. Belonging, in this tradition, is what you do rather than what you are, and the proof of it fills minute books, dues ledgers, and burial rolls the national telling never opens.',
  },
  {
    id: 'practice-at-scale',
    title: 'The Practice at Scale',
    range: '1849–1928',
    from: 1849,
    to: 1928,
    narrative:
      'The age names itself after the self-made man. While that story hardens into common sense, a third of adult American men carry a lodge card, and their families see a doctor because of it. The largest civic institution in the country never makes it into the story the country tells about itself.',
  },
  {
    id: 'state-arrives',
    title: 'The State Arrives',
    range: '1929–1954',
    from: 1929,
    to: 1954,
    narrative:
      'The Depression breaks the societies\u2019 finances, and the New Deal absorbs their work without their names. Help now arrives from Washington, and within a generation the memory of who built the first system transfers to the state. The new story forgets what the societies knew, which is that help is the reinforcement that keeps a structure standing rather than a transaction between a giver and a taker. And the structure keeps being kept, in kitchens and church basements, off the books.',
  },
  {
    id: 'care-as-citizenship',
    title: 'Care as Citizenship',
    range: '1955–1970',
    from: 1955,
    to: 1970,
    narrative:
      'The movement runs on the tradition, as cooks fund the boycott, schools meet in beauty parlours, and breakfast is served before the bell. The official account calls this radical. It is the oldest practice in the Republic doing what it has always done, now in front of cameras.',
  },
  {
    id: 'rival-account',
    title: 'A Rival Account',
    range: '1971–2016',
    from: 1971,
    to: 2016,
    narrative:
      'For the first time, the other story is built deliberately, through memoranda, foundations, curricula, and courts, an infrastructure raised to make one account of the country feel like what the Founders intended. Going it alone becomes the moral of American history by design rather than by memory. The constructed account comes to read as timeless, while the older tradition carries on in the places the account does not reach.',
  },
  {
    id: 'record-returns',
    title: 'The Record Returns',
    range: '2017–now',
    from: 2017,
    to: 3000,
    narrative:
      'Each crisis reintroduces Americans to their own tradition, as neighbours organise faster than agencies and are surprised to learn they are not the first. What the country does in hurricanes is what it has always done everywhere. The practice never needed recovering. The record did, and this archive is that recovery.',
  },
];

export function phaseForYear(year: number): NarrativePhase {
  return (
    NARRATIVE_PHASES.find((p) => year >= p.from && year <= p.to) ??
    NARRATIVE_PHASES[NARRATIVE_PHASES.length - 1]
  );
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
  /* ── The Elder Tradition, before 1784 ── */
  {
    year: 1750,
    dateLabel: 'before the Republic',
    title: 'The Elder Tradition',
    strand: 'aid',
    blurb:
      'The potlatch, the giveaway, and the Diné ethic of k\u2019é run complete economies of mutual obligation across the continent. Wealth confers standing when it is given away, and the witnesses at the feast are the record. Everything that follows has an elder.',
    image: '/images/a0/klukwan-canoes-1898.jpg',
    href: '/archive/a0-elder-tradition',
  },

  /* ── Two Foundings, 1784–1848 ── */
  {
    year: 1784,
    dateLabel: '1784',
    title: 'African Lodge No. 1',
    strand: 'aid',
    blurb:
      'Prince Hall and fourteen free Black men found their own lodge in Boston, and when no American charter is offered they obtain one from England. The lodge collects dues, pays benefits, and keeps its own records, performing the duties that citizenship was supposed to guarantee.',
    image: '/images/c4/prince-hall.jpg',
    href: '/archive/c4-exclusion-not-principle',
  },
  {
    year: 1787,
    dateLabel: 'April 1787',
    title: 'The Parallel Founding of 1787',
    strand: 'aid',
    blurb:
      'Richard Allen and Absalom Jones found the Free African Society, the Republic\u2019s first organised mutual aid network, in the same city and year as the Constitutional Convention. Monthly dues carry the sick, bury the dead, and support widows and orphans, and every excluded community will rebuild this design.',
    image: '/images/a1/richard-allen.jpg',
    href: '/archive/a1-founding-era',
  },
  {
    year: 1793,
    dateLabel: '1793–94',
    title: 'The Fever Year of 1793',
    strand: 'aid',
    blurb:
      'Yellow fever kills a tenth of Philadelphia. The society nurses and buries the whole city, member and stranger alike, and then it publishes its own account of the year.',
    image: '/images/a1/absalom-jones-peale.jpg',
    href: '/archive/c1-crisis',
  },
  {
    year: 1808,
    dateLabel: '1790–1838',
    title: 'The Same Design in Every Community',
    strand: 'aid',
    blurb:
      'Within fifty years, more than a hundred societies in Charleston, New York, Boston, and beyond stand on the Philadelphia pattern, and each one is founded independently.',
    href: '/archive/a2-parallel-infrastructure',
  },
  {
    year: 1843,
    dateLabel: '1843',
    title: 'The Grand United Order',
    strand: 'aid',
    blurb:
      'Refused at home, Black Odd Fellows charter their own order from England, and a complete fraternal world follows, with lodges, benefits, burial funds, and a place to be somebody.',
    image: '/images/a3/guoof-member-1890s.jpg',
    href: '/archive/a3-fraternal-scale',
    anchor: 'lodges-on-both-sides-of-the-colour-line',
  },

  {
    year: 1847,
    dateLabel: 'March 1847',
    title: 'The Choctaw Gift to Ireland',
    strand: 'aid',
    blurb:
      'Sixteen years after the Trail of Tears, the Choctaw at Skullyville take up a collection for the starving poor of Ireland. A nation that has just survived dispossession and famine recognises both under a different empire, and it gives.',
    href: '/archive/a0-elder-tradition',
    anchor: 'the-choctaw-gift-to-ireland-1847',
  },

  /* ── The Practice at Scale, 1849–1928 ── */
  {
    year: 1849,
    dateLabel: 'from 1849',
    title: 'Huiguan of San Francisco',
    strand: 'aid',
    blurb:
      'Chinese district associations organise lodging, work, medicine, dispute resolution, and the return of remains to ancestral villages, which amounts to the whole of civic life for the people they serve.',
    image: '/images/a2/six-companies-dignitary.jpg',
    href: '/archive/a2-parallel-infrastructure',
    anchor: 'the-same-institution-in-every-language',
  },
  {
    year: 1882,
    dateLabel: '1882',
    title: 'The Chinese Exclusion Act',
    strand: 'exclusion',
    blurb:
      'Federal law singles out one community by name. Its benevolent associations spend the next sixty years doing their work underneath it.',
    image: '/images/c4/chinese-exclusion-act-1882.jpg',
    href: '/archive/c4-exclusion-not-principle',
  },
  {
    year: 1883,
    dateLabel: '1883–87',
    title: 'A Law Against Giving',
    strand: 'exclusion',
    blurb:
      'The Code of Indian Offenses makes the feasts through which wealth changes hands punishable by withheld rations and jail. Senator Dawes states the reasoning at Lake Mohonk: \u201cThere is no selfishness, which is at the bottom of civilization.\u201d Allotment follows.',
    href: '/archive/a0-elder-tradition',
    anchor: 'the-law-against-giving-1883',
  },
  {
    year: 1889,
    dateLabel: '1889',
    title: 'Built for Everyone in the Ward',
    strand: 'aid',
    blurb:
      'Hull House opens to whoever lives on Halsted Street, in the most ethnically mixed neighbourhood on the continent. The membership rule is the address.',
    image: '/images/c3/hull-house-kindergarten.jpg',
    href: '/archive/c3-intentional-institutions',
  },
  {
    year: 1896,
    dateLabel: '1890s',
    title: 'The Boundary Drawn by Exclusion',
    strand: 'exclusion',
    blurb:
      'The white orders write whites-only clauses into their constitutions, and every community shut out answers the same way, by building a complete world of its own.',
    href: '/archive/c4-exclusion-not-principle',
    anchor: 'the-mechanism-stated-plainly',
  },
  {
    year: 1903,
    dateLabel: '1880s–1920s',
    title: 'The Same Institution in Every Language',
    strand: 'aid',
    blurb:
      'Jewish landsmanshaftn, Italian società di mutuo soccorso, Mexican American sociedades mutualistas, and Japanese tanomoshi-kō appear in the same decades, because every immigrant community independently builds the same institution.',
    image: '/images/a2/hester-street-1903.jpg',
    href: '/archive/a2-parallel-infrastructure',
    anchor: 'the-same-institution-in-every-language',
  },
  {
    year: 1906,
    dateLabel: '1904–06',
    title: '"The Lodge Practice Evil"',
    strand: 'exclusion',
    blurb:
      'Organised medicine campaigns against the lodge doctor, whose collective contracts keep fees within reach of working families.',
    href: '/archive/a3-fraternal-scale',
    anchor: 'the-lodge-doctor',
  },
  {
    year: 1907,
    dateLabel: '1907',
    title: 'Du Bois Counts the Societies',
    strand: 'aid',
    blurb:
      'The first systematic survey finds thousands of Black mutual aid organisations, which have been the principal provider of insurance, education, and burial for over a century.',
    href: '/archive/a2-parallel-infrastructure',
  },
  {
    year: 1913,
    dateLabel: '1913',
    title: 'Solidarity Across the Colour Line',
    strand: 'aid',
    blurb:
      'IWW Local 8, a third Black, a third Irish, a third immigrant, runs Philadelphia\u2019s waterfront for a decade and pools survival across every line the city drew.',
    image: '/images/c2/ben-fletcher-1918.jpg',
    href: '/archive/c2-labor',
  },
  {
    year: 1920,
    dateLabel: 'by 1920',
    title: 'One in Three American Men',
    strand: 'aid',
    blurb:
      'A third of adult American men belong to a fraternal order. Two dollars a year buys a family the lodge doctor, hired by the members and answerable to them.',
    image: '/images/a3/ioof-parade-1890.jpg',
    href: '/archive/a3-fraternal-scale',
  },

  /* ── The State Arrives, 1929–1954 ── */
  {
    year: 1932,
    dateLabel: 'early 1930s',
    title: 'What Was Already There',
    strand: 'aid',
    blurb:
      'Before federal relief exists, the unemployed build labour exchanges, cooperative farms, and barter networks, enough that the Bureau of Labor Statistics sends surveyors.',
    image: '/images/b1/breadline-1932.jpg',
    href: '/archive/b1-new-deal-displacement',
    anchor: 'what-was-already-there',
  },
  {
    year: 1935,
    dateLabel: 'August 1935',
    title: 'The Quiet Displacement',
    strand: 'exclusion',
    blurb:
      'Social Security takes over the societies\u2019 core functions. The lodges empty over a generation, and the memory of who built the first system follows.',
    image: '/images/b1/ssa-signing-1935.jpg',
    href: '/archive/b1-new-deal-displacement',
    anchor: 'the-quiet-displacement',
  },
  {
    year: 1941,
    dateLabel: '1785–present',
    title: 'Dismissed as Women\u2019s Work',
    strand: 'aid',
    blurb:
      'Midwives, meal circuits, and neighbours sitting up with the sick form the largest care system in the country, and it runs continuously from before the Republic while leaving almost no paper.',
    image: '/images/b5/midwife-delano-1941.jpg',
    href: '/archive/b5-maternal-networks',
  },

  /* ── Care as Citizenship, 1955–1970 ── */
  {
    year: 1955,
    dateLabel: '1955–56',
    title: 'The Club From Nowhere',
    strand: 'aid',
    blurb:
      'Georgia Gilmore\u2019s cooks bake the Montgomery boycott\u2019s budget into pound cakes, and a parallel transit system moves tens of thousands to work for 381 days without the buses.',
    image: '/images/b2/mia-flyer-1956.jpg',
    href: '/archive/b2-civil-rights-care',
  },
  {
    year: 1962,
    dateLabel: 'winter 1962–63',
    title: 'The Food Cutoff',
    strand: 'exclusion',
    blurb:
      'Leflore County halts surplus food distribution to punish voter registration. SNCC answers with tons of donated food, moved alongside the canvass.',
    href: '/archive/b2-civil-rights-care',
    anchor: 'turning-food-into-organising',
  },
  {
    year: 1964,
    dateLabel: '1957–64',
    title: 'Citizenship Schools in Kitchens',
    strand: 'aid',
    blurb:
      'Citizenship schools and Freedom Schools teach reading and the machinery of civic life in church basements and beauty parlours across the South.',
    image: '/images/b2/sncc-freedom-summer-flyer-1964.jpg',
    href: '/archive/b2-civil-rights-care',
    anchor: 'citizenship-schools-in-kitchens',
  },
  {
    year: 1969,
    dateLabel: 'January 1969',
    title: 'The Panther Survival Programmes',
    strand: 'aid',
    blurb:
      'The survival programmes feed thousands of children every school morning, run clinics in a dozen cities, and make sickle cell anaemia a national issue.',
    image: '/images/b3/free-breakfast-1970.jpg',
    href: '/archive/b3-black-panthers',
  },
  {
    year: 1970,
    dateLabel: '1969–75',
    title: 'The Model Taken, the Authors Erased',
    strand: 'exclusion',
    blurb:
      'Hoover names breakfast the party\u2019s greatest threat and COINTELPRO raids the kitchens, while federal school breakfast expands on the model without credit.',
    image: '/images/b3/black-panther-paper-1967.jpg',
    href: '/archive/b3-black-panthers',
    anchor: 'the-model-taken-the-authors-erased',
  },

  /* ── A Rival Account, 1971–2016 ── */
  {
    year: 1971,
    dateLabel: 'August 1971',
    title: 'The Powell Memorandum',
    strand: 'exclusion',
    blurb:
      'A confidential memo to the Chamber of Commerce lays out a plan to build durable infrastructure in the places where public meaning is made.',
    image: '/images/d2/lewis-powell-1976.jpg',
    href: '/archive/d2-competing-tradition',
  },
  {
    year: 1973,
    dateLabel: '1973–82',
    title: 'Who Built the Story on the Shelf',
    strand: 'exclusion',
    blurb:
      'Heritage is founded with 250,000 dollars, and the Federalist Society follows from a single student conference. The infrastructure is built patiently, until one account of America reads as common sense.',
    image: '/images/d3/heritage-foundation-building.jpg',
    href: '/archive/d2-competing-tradition',
  },
  {
    year: 1982,
    dateLabel: 'January 1982',
    title: 'The Buddy System of the AIDS Years',
    strand: 'aid',
    blurb:
      'Six men and an answering machine become Gay Men\u2019s Health Crisis. The buddy networks carry meals, medicine, and company for years before the famous protests grow out of them.',
    image: '/images/b4/act-up-nih.jpg',
    href: '/archive/b4-aids-mutual-aid',
  },
  {
    year: 1996,
    dateLabel: '1996',
    title: 'How the Law Excludes',
    strand: 'exclusion',
    blurb:
      'Welfare reform writes immigrant exclusions into federal aid, and the same rule later bars disaster relief by status. The community networks become the only provision left.',
    href: '/archive/d1-legal-institutional',
    anchor: 'taxed-unrecognised-excluded',
  },
  {
    year: 2012,
    dateLabel: '2005–12',
    title: 'Faster Than the Agencies',
    strand: 'aid',
    blurb:
      'Common Ground forms after Katrina and Occupy Sandy after the storm, and both organise relief by whoever shows up, for whoever is there, moving supplies while the official paperwork is still being drafted.',
    image: '/images/c1/occupy-sandy-2012.jpg',
    href: '/archive/c1-crisis',
    anchor: 'the-pattern-in-every-disaster',
  },
  {
    year: 2014,
    dateLabel: '2014–26',
    title: 'Feeding People Becomes a Charge',
    strand: 'exclusion',
    blurb:
      'A ninety-year-old veteran is arrested for serving meals in a park. Cities keep passing food-sharing ordinances after courts strike them down.',
    image: '/images/d1/food-not-bombs.jpg',
    href: '/archive/d1-legal-institutional',
  },

  /* ── The Record Returns, 2017–now ── */
  {
    year: 2020,
    dateLabel: 'spring 2020',
    title: 'The Block Organises',
    strand: 'aid',
    blurb:
      'Hundreds of neighbourhood networks assemble in weeks, organised by building and zip code. Most pandemic giving moves through neighbours.',
    image: '/images/c1/community-fridge-nola-2020.jpg',
    href: '/archive/c1-crisis',
    anchor: 'the-pattern-in-every-disaster',
  },
  {
    year: 2020,
    dateLabel: 'May 2020',
    title: 'The Gift Returns',
    strand: 'aid',
    blurb:
      'Twenty thousand Irish donors flood the Navajo & Hopi relief fund, citing the Choctaw gift of 1847 by name. Aid organised on k\u2019é is answered across an ocean and seven generations.',
    image: '/images/a0/kindred-spirits-midleton.jpg',
    href: '/archive/a0-elder-tradition',
    anchor: 'the-gift-returns-2020',
  },
  {
    year: 2023,
    dateLabel: '2023–26',
    title: 'Project 2025 and Bounded Care',
    strand: 'exclusion',
    blurb:
      'Nine hundred pages translate the account of bounded care into plans for government, and by the author\u2019s own count more than half are implemented within three years.',
    href: '/archive/d3-project-2025',
  },
  {
    year: 2026,
    dateLabel: 'now',
    title: 'What This Archive Is For',
    strand: 'aid',
    blurb:
      'The tradition\u2019s oldest act of self-defence is writing itself down, as the Free African Society did in 1794. This archive performs that act for the whole tradition at once.',
    href: '/archive/d4-contestation',
  },
];
