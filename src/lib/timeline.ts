/**
 * Data for the landing-page timeline: the two traditions, 1784–2026.
 *
 * Every event links into an archive page. The `care` strand carries the
 * mutual aid tradition; the `displacement` strand carries the legal,
 * commercial, and institutional machinery that worked against it. The
 * timeline renders them on opposite sides of one spine, so the argument
 * of the archive is visible before it is read: the care strand never
 * breaks, and the displacement strand keeps reappearing beside it.
 */

export type Strand = 'care' | 'displacement';

export interface TimelineEvent {
  year: number;
  /** Displayed date, e.g. "April 1787" or "1930s" */
  dateLabel: string;
  title: string;
  blurb: string;
  strand: Strand;
  image?: string;
  href: string;
}

export interface TimelineEra {
  label: string;
  range: string;
  /** Events with year >= from and year <= to belong to this era */
  from: number;
  to: number;
}

export const ERAS: TimelineEra[] = [
  { label: 'The Founding Tradition', range: '1784–1920', from: 0, to: 1928 },
  { label: 'Through Every Era', range: '1929–1969', from: 1929, to: 1970 },
  { label: 'The Contest', range: '1971–2026', from: 1971, to: 3000 },
];

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    year: 1784,
    dateLabel: '1784',
    title: 'A charter crosses the Atlantic',
    blurb:
      'No American lodge will charter Black Masons, so Prince Hall obtains one from England. The boundedness of the societies begins as a wall built by others.',
    strand: 'displacement',
    image: '/images/c4/prince-hall.jpg',
    href: '/archive/c4-exclusion-not-principle',
  },
  {
    year: 1787,
    dateLabel: 'April 1787',
    title: 'The Free African Society',
    blurb:
      'Richard Allen and Absalom Jones found the first organised mutual aid network in the country, in the same city and year as the Constitutional Convention.',
    strand: 'care',
    image: '/images/a1/fas-preamble-1787.jpg',
    href: '/archive/a1-founding-era',
  },
  {
    year: 1793,
    dateLabel: '1793–94',
    title: 'The fever year',
    blurb:
      'Yellow fever kills a tenth of Philadelphia. The society nurses and buries the city that excluded it, then publishes the record when it is slandered.',
    strand: 'care',
    image: '/images/a1/narrative-1794-title.jpg',
    href: '/archive/c1-crisis',
  },
  {
    year: 1808,
    dateLabel: '1790–1838',
    title: 'The design repeats',
    blurb:
      'Charleston, New York, Boston: within fifty years, more than a hundred societies are built on the Philadelphia pattern of dues, benefits, and burial.',
    strand: 'care',
    href: '/archive/a2-parallel-infrastructure',
  },
  {
    year: 1843,
    dateLabel: '1843',
    title: 'The Grand United Order',
    blurb:
      'Refused by the white Odd Fellows, Peter Ogden charters a Black order from England. A complete parallel fraternal world follows.',
    strand: 'care',
    image: '/images/a3/guoof-member-1890s.jpg',
    href: '/archive/a3-fraternal-scale',
  },
  {
    year: 1849,
    dateLabel: 'from 1849',
    title: 'Huiguan of San Francisco',
    blurb:
      'Chinese district associations provide lodging, work, medicine, and the return of remains home, under a state legislating against their members.',
    strand: 'care',
    image: '/images/a2/six-companies-dignitary.jpg',
    href: '/archive/a2-parallel-infrastructure',
  },
  {
    year: 1882,
    dateLabel: '1882',
    title: 'The Chinese Exclusion Act',
    blurb:
      'Federal law singles out one community by name. Its benevolent associations spend the next sixty years doing their work underneath it.',
    strand: 'displacement',
    image: '/images/c4/chinese-exclusion-act-1882.jpg',
    href: '/archive/c4-exclusion-not-principle',
  },
  {
    year: 1889,
    dateLabel: '1889',
    title: 'Everyone in the ward',
    blurb:
      'Hull House opens its doors to whoever lives on Halsted Street, in the most ethnically mixed neighbourhood on the continent. The membership rule is the address.',
    strand: 'care',
    image: '/images/c3/hull-house-postcard.jpg',
    href: '/archive/c3-intentional-institutions',
  },
  {
    year: 1896,
    dateLabel: '1890s',
    title: 'The colour bars go up',
    blurb:
      'The white orders write whites-only clauses into their constitutions. Every excluded community is forced to form its own.',
    strand: 'displacement',
    href: '/archive/c4-exclusion-not-principle',
  },
  {
    year: 1903,
    dateLabel: '1880s–1920s',
    title: 'In every language',
    blurb:
      'Landsmanshaftn, società di mutuo soccorso, sociedades mutualistas, tanomoshi-kō: every immigrant community independently builds the same institution.',
    strand: 'care',
    image: '/images/a2/hester-street-1903.jpg',
    href: '/archive/a2-parallel-infrastructure',
  },
  {
    year: 1906,
    dateLabel: '1904–06',
    title: '"The Lodge Practice Evil"',
    blurb:
      'Organised medicine campaigns against the lodge doctor, whose collective bargaining drives fees down. The first organised attack on mutual provision at scale.',
    strand: 'displacement',
    href: '/archive/a3-fraternal-scale',
  },
  {
    year: 1907,
    dateLabel: '1907',
    title: 'Du Bois counts the societies',
    blurb:
      'The first systematic survey finds thousands of Black mutual aid organisations: for over a century, the principal provider of insurance, education, and burial.',
    strand: 'care',
    href: '/archive/a2-parallel-infrastructure',
  },
  {
    year: 1913,
    dateLabel: '1913',
    title: 'One big union on the docks',
    blurb:
      'IWW Local 8, a third Black, a third Irish, a third immigrant, integrates Philadelphia\u2019s waterfront and pools the machinery of survival across race.',
    strand: 'care',
    image: '/images/c2/ben-fletcher-1918.jpg',
    href: '/archive/c2-labor',
  },
  {
    year: 1920,
    dateLabel: 'by 1920',
    title: 'One in three',
    blurb:
      'On the most conservative estimate, a third of adult American men belong to a fraternal order. Two dollars a year buys a family the lodge doctor.',
    strand: 'care',
    image: '/images/a3/ioof-parade-1890.jpg',
    href: '/archive/a3-fraternal-scale',
  },
  {
    year: 1932,
    dateLabel: 'early 1930s',
    title: 'Self-help in the collapse',
    blurb:
      'Before federal relief arrives, the unemployed build labour exchanges, cooperative farms, and barter networks. The Bureau of Labor Statistics surveys them.',
    strand: 'care',
    image: '/images/b1/breadline-1932.jpg',
    href: '/archive/b1-new-deal-displacement',
  },
  {
    year: 1935,
    dateLabel: 'August 1935',
    title: 'The state enters a crowded room',
    blurb:
      'Social Security absorbs the societies\u2019 core functions, funded by taxes their members pay regardless. The lodges empty over a generation, and the memory follows.',
    strand: 'displacement',
    image: '/images/b1/ssa-signing-1935.jpg',
    href: '/archive/b1-new-deal-displacement',
  },
  {
    year: 1941,
    dateLabel: '1785–present',
    title: 'The uncounted economy',
    blurb:
      'Midwives, meal circuits, sitting up with the sick: the largest mutual aid system in the country runs continuously and leaves almost no paper, because nobody files it.',
    strand: 'care',
    image: '/images/b5/midwife-delano-1941.jpg',
    href: '/archive/b5-maternal-networks',
  },
  {
    year: 1955,
    dateLabel: '1955–56',
    title: 'The Club From Nowhere',
    blurb:
      'Georgia Gilmore\u2019s cooks fund the Montgomery boycott; a parallel transit system moves tens of thousands to work for 381 days without the buses.',
    strand: 'care',
    image: '/images/b2/mia-flyer-1956.jpg',
    href: '/archive/b2-civil-rights-care',
  },
  {
    year: 1962,
    dateLabel: 'winter 1962–63',
    title: 'Food as a weapon, food as a front',
    blurb:
      'Leflore County cuts off surplus food to punish voter registration. SNCC answers with tons of donated food, distributed alongside the canvass.',
    strand: 'displacement',
    href: '/archive/b2-civil-rights-care',
  },
  {
    year: 1964,
    dateLabel: '1957–64',
    title: 'Schools in kitchens',
    blurb:
      'Citizenship schools and Freedom Schools teach literacy and the machinery of civic life, in church basements and beauty parlours across the South.',
    strand: 'care',
    image: '/images/b2/sncc-freedom-summer-flyer-1964.jpg',
    href: '/archive/b2-civil-rights-care',
  },
  {
    year: 1969,
    dateLabel: 'January 1969',
    title: 'Free breakfast before the bell',
    blurb:
      'The Black Panther survival programmes feed thousands of children every school morning, run clinics, and make sickle cell anaemia a national issue.',
    strand: 'care',
    image: '/images/b3/free-breakfast-1970.jpg',
    href: '/archive/b3-black-panthers',
  },
  {
    year: 1970,
    dateLabel: '1969–75',
    title: 'Taken and erased',
    blurb:
      'Hoover names breakfast the party\u2019s greatest threat; COINTELPRO raids the kitchens while the federal government writes their model into law without credit.',
    strand: 'displacement',
    image: '/images/b3/black-panther-paper-1967.jpg',
    href: '/archive/b3-black-panthers',
  },
  {
    year: 1971,
    dateLabel: 'August 1971',
    title: 'The Powell Memorandum',
    blurb:
      'A confidential memo to the Chamber of Commerce lays out the plan: build durable infrastructure in the places where public meaning is made.',
    strand: 'displacement',
    image: '/images/d2/lewis-powell-1976.jpg',
    href: '/archive/d2-competing-tradition',
  },
  {
    year: 1973,
    dateLabel: '1973–82',
    title: 'The machinery is built',
    blurb:
      'Heritage is founded with 250,000 dollars; the Federalist Society follows from one student conference. Forty years later, the account they circulate is common sense.',
    strand: 'displacement',
    image: '/images/d3/heritage-foundation-building.jpg',
    href: '/archive/d4-contestation',
  },
  {
    year: 1982,
    dateLabel: 'January 1982',
    title: 'The buddy system',
    blurb:
      'Six men and an answering machine become GMHC. The care networks of the AIDS crisis run for years before the famous protests grow out of them.',
    strand: 'care',
    image: '/images/b4/act-up-nih.jpg',
    href: '/archive/b4-aids-mutual-aid',
  },
  {
    year: 1996,
    dateLabel: '1996',
    title: 'Self-reliance, by statute',
    blurb:
      'Welfare reform writes immigrant exclusion into federal aid, the rule that later bars disaster relief by status. The networks become the only provision left.',
    strand: 'displacement',
    href: '/archive/d1-legal-institutional',
  },
  {
    year: 2012,
    dateLabel: '2005–12',
    title: 'Where the agencies fell short',
    blurb:
      'Common Ground after Katrina, Occupy Sandy after the storm: relief that crosses every line, organised by presence, faster than the state.',
    strand: 'care',
    image: '/images/c1/occupy-sandy-2012.jpg',
    href: '/archive/c1-crisis',
  },
  {
    year: 2014,
    dateLabel: '2014–26',
    title: 'Feeding people becomes a charge',
    blurb:
      'A ninety-year-old veteran is arrested for serving meals in a park. Cities keep passing food-sharing ordinances after the courts strike them down.',
    strand: 'displacement',
    image: '/images/d1/food-not-bombs.jpg',
    href: '/archive/d1-legal-institutional',
  },
  {
    year: 2020,
    dateLabel: 'spring 2020',
    title: 'The block organises',
    blurb:
      'Hundreds of COVID networks assemble in weeks, organised by building and zip code. Most pandemic giving moves outside formal charity entirely.',
    strand: 'care',
    href: '/archive/c1-crisis',
  },
  {
    year: 2023,
    dateLabel: '2023–26',
    title: 'Project 2025',
    blurb:
      'Nine hundred pages of bounded care, translated into government. By its author\u2019s own count, more than half implemented within three years.',
    strand: 'displacement',
    href: '/archive/d3-project-2025',
  },
  {
    year: 2026,
    dateLabel: 'now',
    title: 'The record, assembled',
    blurb:
      'The tradition\u2019s oldest act of self-defence is writing itself down. This archive is that act, performed for the whole tradition at once.',
    strand: 'care',
    href: '/archive/d4-contestation',
  },
];
