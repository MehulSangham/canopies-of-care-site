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
    id: 'two-foundings',
    title: 'Two Foundings',
    range: '1784–1848',
    from: 0,
    to: 1848,
    narrative:
      'The official story records one founding: a convention, a constitution, a list of names. The other founding keeps no seat in that story, yet from the first decade of the Republic, showing up for each other is how excluded Americans practise citizenship. Belonging, in this tradition, is what you do rather than what you are, and the proof of it fills minute books, dues ledgers, and burial rolls the national telling never opens.',
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
      'The Depression breaks the societies\u2019 finances, and the New Deal absorbs their work without their names. Help now arrives from Washington, and within a generation the memory of who built the first system transfers to the state. What the societies knew, the new story forgets: help is not a transaction between a giver and a taker. It is the reinforcement that keeps a structure standing, and the structure keeps being kept, in kitchens and church basements, off the books.',
  },
  {
    id: 'care-as-citizenship',
    title: 'Care as Citizenship',
    range: '1955–1970',
    from: 1955,
    to: 1970,
    narrative:
      'The movement runs on the tradition: cooks fund the boycott, schools meet in beauty parlours, breakfast is served before the bell. The official account calls this radical. It is the oldest practice in the Republic doing what it has always done, now in front of cameras.',
  },
  {
    id: 'rival-account',
    title: 'A Rival Account',
    range: '1971–2016',
    from: 1971,
    to: 2016,
    narrative:
      'For the first time, the other story is built deliberately: memoranda, foundations, curricula, courts, infrastructure raised to make one account of the country feel like what the Founders intended. Going it alone becomes the moral of American history by design rather than by memory. The constructed account comes to read as timeless, while the older tradition carries on in the places the account does not reach.',
  },
  {
    id: 'record-returns',
    title: 'The Record Returns',
    range: '2017–now',
    from: 2017,
    to: 3000,
    narrative:
      'Each crisis reintroduces Americans to their own tradition: neighbours organise faster than agencies, and are surprised to learn they are not the first. What the country does in hurricanes is what it has always done everywhere. The practice never needed recovering. The record did, and this archive is that recovery.',
  },
];

export function phaseForYear(year: number): NarrativePhase {
  return (
    NARRATIVE_PHASES.find((p) => year >= p.from && year <= p.to) ??
    NARRATIVE_PHASES[NARRATIVE_PHASES.length - 1]
  );
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
  /* ── Two Foundings, 1784–1848 ── */
  {
    year: 1784,
    dateLabel: '1784',
    title: 'African Lodge No. 1',
    strand: 'aid',
    blurb:
      'Prince Hall and fourteen free Black men found their own lodge in Boston, and when no American charter is offered they obtain one from England. From the start, belonging is something practised, not granted.',
    image: '/images/c4/prince-hall.jpg',
    href: '/archive/c4-exclusion-not-principle',
  },
  {
    year: 1787,
    dateLabel: 'April 1787',
    title: 'The Free African Society',
    strand: 'aid',
    blurb:
      'Richard Allen and Absalom Jones found the first organised mutual aid network in the country, in the same city and year as the Constitutional Convention. Dues, sickness benefits, burial, widows and orphans: the design every community will rebuild.',
    image: '/images/a1/fas-preamble-1787.jpg',
    href: '/archive/a1-founding-era',
  },
  {
    year: 1793,
    dateLabel: '1793–94',
    title: 'The fever year',
    strand: 'aid',
    blurb:
      'Yellow fever kills a tenth of Philadelphia. The society nurses and buries the whole city, member and stranger alike, then publishes its own account of the year.',
    image: '/images/a1/narrative-1794-title.jpg',
    href: '/archive/c1-crisis',
  },
  {
    year: 1808,
    dateLabel: '1790–1838',
    title: 'The design repeats',
    strand: 'aid',
    blurb:
      'Charleston, New York, Boston: within fifty years, more than a hundred societies stand on the Philadelphia pattern, each founded independently.',
    href: '/archive/a2-parallel-infrastructure',
  },
  {
    year: 1843,
    dateLabel: '1843',
    title: 'The Grand United Order',
    strand: 'aid',
    blurb:
      'Refused at home, Black Odd Fellows charter their own order from England. A complete fraternal world follows: lodges, benefits, burial funds, a place to be somebody.',
    image: '/images/a3/guoof-member-1890s.jpg',
    href: '/archive/a3-fraternal-scale',
  },

  /* ── The Practice at Scale, 1849–1928 ── */
  {
    year: 1849,
    dateLabel: 'from 1849',
    title: 'Huiguan of San Francisco',
    strand: 'aid',
    blurb:
      'Chinese district associations organise lodging, work, medicine, dispute resolution, and the return of remains home: the whole of civic life for the people they serve.',
    image: '/images/a2/six-companies-dignitary.jpg',
    href: '/archive/a2-parallel-infrastructure',
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
    year: 1889,
    dateLabel: '1889',
    title: 'Everyone in the ward',
    strand: 'aid',
    blurb:
      'Hull House opens to whoever lives on Halsted Street, in the most ethnically mixed neighbourhood on the continent. The membership rule is the address.',
    image: '/images/c3/hull-house-kindergarten.jpg',
    href: '/archive/c3-intentional-institutions',
  },
  {
    year: 1896,
    dateLabel: '1890s',
    title: 'The colour bars go up',
    strand: 'exclusion',
    blurb:
      'The white orders write whites-only clauses into their constitutions. Every community shut out answers the same way: it builds a complete world of its own.',
    href: '/archive/c4-exclusion-not-principle',
  },
  {
    year: 1903,
    dateLabel: '1880s–1920s',
    title: 'In every language',
    strand: 'aid',
    blurb:
      'Landsmanshaftn, società di mutuo soccorso, sociedades mutualistas, tanomoshi-kō: every immigrant community independently builds the same institution.',
    image: '/images/a2/hester-street-1903.jpg',
    href: '/archive/a2-parallel-infrastructure',
  },
  {
    year: 1906,
    dateLabel: '1904–06',
    title: '"The Lodge Practice Evil"',
    strand: 'exclusion',
    blurb:
      'Organised medicine campaigns against the lodge doctor, whose collective contracts keep fees within reach of working families.',
    href: '/archive/a3-fraternal-scale',
  },
  {
    year: 1907,
    dateLabel: '1907',
    title: 'Du Bois counts the societies',
    strand: 'aid',
    blurb:
      'The first systematic survey finds thousands of Black mutual aid organisations: for over a century, the principal provider of insurance, education, and burial.',
    href: '/archive/a2-parallel-infrastructure',
  },
  {
    year: 1913,
    dateLabel: '1913',
    title: 'One big union on the docks',
    strand: 'aid',
    blurb:
      'IWW Local 8, a third Black, a third Irish, a third immigrant, runs Philadelphia\u2019s waterfront for a decade and pools survival across every line the city drew.',
    image: '/images/c2/ben-fletcher-1918.jpg',
    href: '/archive/c2-labor',
  },
  {
    year: 1920,
    dateLabel: 'by 1920',
    title: 'One in three',
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
    title: 'Self-help in the collapse',
    strand: 'aid',
    blurb:
      'Before federal relief exists, the unemployed build labour exchanges, cooperative farms, and barter networks, enough that the Bureau of Labor Statistics sends surveyors.',
    image: '/images/b1/breadline-1932.jpg',
    href: '/archive/b1-new-deal-displacement',
  },
  {
    year: 1935,
    dateLabel: 'August 1935',
    title: 'Absorbed without credit',
    strand: 'exclusion',
    blurb:
      'Social Security takes over the societies\u2019 core functions. The lodges empty over a generation, and the memory of who built the first system follows.',
    image: '/images/b1/ssa-signing-1935.jpg',
    href: '/archive/b1-new-deal-displacement',
  },
  {
    year: 1941,
    dateLabel: '1785–present',
    title: 'The uncounted economy',
    strand: 'aid',
    blurb:
      'Midwives, meal circuits, sitting up with the sick: the largest care system in the country runs continuously from before the Republic and leaves almost no paper.',
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
      'Georgia Gilmore\u2019s cooks bake the Montgomery boycott\u2019s budget into pound cakes; a parallel transit system moves tens of thousands for 381 days without the buses.',
    image: '/images/b2/mia-flyer-1956.jpg',
    href: '/archive/b2-civil-rights-care',
  },
  {
    year: 1962,
    dateLabel: 'winter 1962–63',
    title: 'The food cutoff',
    strand: 'exclusion',
    blurb:
      'Leflore County halts surplus food distribution to punish voter registration. SNCC answers with tons of donated food, moved alongside the canvass.',
    href: '/archive/b2-civil-rights-care',
  },
  {
    year: 1964,
    dateLabel: '1957–64',
    title: 'Schools in kitchens',
    strand: 'aid',
    blurb:
      'Citizenship schools and Freedom Schools teach reading and the machinery of civic life in church basements and beauty parlours across the South.',
    image: '/images/b2/sncc-freedom-summer-flyer-1964.jpg',
    href: '/archive/b2-civil-rights-care',
  },
  {
    year: 1969,
    dateLabel: 'January 1969',
    title: 'Free breakfast before the bell',
    strand: 'aid',
    blurb:
      'The survival programmes feed thousands of children every school morning, run clinics in a dozen cities, and make sickle cell anaemia a national issue.',
    image: '/images/b3/free-breakfast-1970.jpg',
    href: '/archive/b3-black-panthers',
  },
  {
    year: 1970,
    dateLabel: '1969–75',
    title: 'Raided, then imitated',
    strand: 'exclusion',
    blurb:
      'Hoover names breakfast the party\u2019s greatest threat and COINTELPRO raids the kitchens, while federal school breakfast expands on the model without credit.',
    image: '/images/b3/black-panther-paper-1967.jpg',
    href: '/archive/b3-black-panthers',
  },

  /* ── A Rival Account, 1971–2016 ── */
  {
    year: 1971,
    dateLabel: 'August 1971',
    title: 'The Powell Memorandum',
    strand: 'exclusion',
    blurb:
      'A confidential memo to the Chamber of Commerce lays out the plan: build durable infrastructure in the places where public meaning is made.',
    image: '/images/d2/lewis-powell-1976.jpg',
    href: '/archive/d2-competing-tradition',
  },
  {
    year: 1973,
    dateLabel: '1973–82',
    title: 'The machinery is built',
    strand: 'exclusion',
    blurb:
      'Heritage is founded with 250,000 dollars; the Federalist Society follows from one student conference. Infrastructure built patiently, until one account of America reads as common sense.',
    image: '/images/d3/heritage-foundation-building.jpg',
    href: '/archive/d4-contestation',
  },
  {
    year: 1982,
    dateLabel: 'January 1982',
    title: 'The buddy system',
    strand: 'aid',
    blurb:
      'Six men and an answering machine become Gay Men\u2019s Health Crisis. The buddy networks carry meals, medicine, and company for years before the famous protests grow out of them.',
    image: '/images/b4/act-up-nih.jpg',
    href: '/archive/b4-aids-mutual-aid',
  },
  {
    year: 1996,
    dateLabel: '1996',
    title: 'Exclusion by statute',
    strand: 'exclusion',
    blurb:
      'Welfare reform writes immigrant exclusions into federal aid, the rule that later bars disaster relief by status. The networks become the only provision left.',
    href: '/archive/d1-legal-institutional',
  },
  {
    year: 2012,
    dateLabel: '2005–12',
    title: 'Faster than the agencies',
    strand: 'aid',
    blurb:
      'Common Ground after Katrina, Occupy Sandy after the storm: relief organised by whoever shows up, for whoever is there, moving supplies while the paperwork is drafted.',
    image: '/images/c1/occupy-sandy-2012.jpg',
    href: '/archive/c1-crisis',
  },
  {
    year: 2014,
    dateLabel: '2014–26',
    title: 'Feeding people becomes a charge',
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
    title: 'The block organises',
    strand: 'aid',
    blurb:
      'Hundreds of neighbourhood networks assemble in weeks, organised by building and zip code. Most pandemic giving moves through neighbours.',
    href: '/archive/c1-crisis',
  },
  {
    year: 2023,
    dateLabel: '2023–26',
    title: 'Project 2025',
    strand: 'exclusion',
    blurb:
      'Nine hundred pages translating the rival account into government. By its author\u2019s own count, more than half implemented within three years.',
    href: '/archive/d3-project-2025',
  },
  {
    year: 2026,
    dateLabel: 'now',
    title: 'The record, assembled',
    strand: 'aid',
    blurb:
      'The tradition\u2019s oldest act of self-defence is writing itself down, as the Free African Society did in 1794. This archive performs that act for the whole tradition at once.',
    href: '/archive/d4-contestation',
  },
];
