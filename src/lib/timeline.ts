/**
 * Data for the landing-page timeline.
 *
 * Structure follows the reframe strategy from the narrative analysis:
 * the centre stream carries THE PRACTICE, the unbroken record of
 * Americans organising care for each other, 1787 to now. The right
 * rail carries THE STORY, six phases of how the national narrative
 * evolved while the practice continued. The practice never breaks;
 * the story is the thing that changes. Displacement appears as
 * narrative evolution, never as a rival protagonist, and the copy
 * avoids activating eligibility / compliance / deserving frames.
 */

export interface TimelineEvent {
  /** Sort key and phase assignment */
  year: number;
  /** Displayed date, e.g. "April 1787" or "1930s" */
  dateLabel: string;
  title: string;
  blurb: string;
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
    range: '1787–1848',
    from: 0,
    to: 1848,
    narrative:
      'The official story records one founding: a convention, a constitution, a list of names. The other founding keeps no seat in that story. From the first decade of the Republic, showing up for each other is how excluded Americans practise citizenship, and the record of it lives in minute books, dues ledgers, and burial rolls rather than in the national telling.',
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
      'The Depression breaks the societies\u2019 finances, and the New Deal absorbs their work without their names. Help now arrives from Washington, and within a generation the memory of who built the first system transfers to the state. The practice continues in kitchens and church basements, off the books, as it always had.',
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
      'For the first time, the other story is built deliberately: memoranda, foundations, curricula, courts. Going it alone becomes the moral of American history by design rather than by memory. The constructed account comes to read as timeless, while the older tradition carries on mostly in the places the account does not reach.',
  },
  {
    id: 'record-returns',
    title: 'The Record Returns',
    range: '2017–now',
    from: 2017,
    to: 3000,
    narrative:
      'Each crisis reintroduces Americans to their own tradition: neighbours organise faster than agencies, and are surprised to learn they are not the first. The practice never needed recovering. The record did, and this archive is that recovery.',
  },
];

export function phaseForYear(year: number): NarrativePhase {
  return (
    NARRATIVE_PHASES.find((p) => year >= p.from && year <= p.to) ??
    NARRATIVE_PHASES[NARRATIVE_PHASES.length - 1]
  );
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    year: 1787,
    dateLabel: 'April 1787',
    title: 'The Free African Society',
    blurb:
      'Richard Allen and Absalom Jones found the first organised mutual aid network in the country, in the same city and year as the Constitutional Convention. Dues, sickness benefits, burial, widows and orphans: the design every community will rebuild.',
    image: '/images/a1/fas-preamble-1787.jpg',
    href: '/archive/a1-founding-era',
  },
  {
    year: 1793,
    dateLabel: '1793–94',
    title: 'The fever year',
    blurb:
      'Yellow fever kills a tenth of Philadelphia. The society nurses and buries the whole city, member and stranger alike, then publishes its own account of the year, the tradition\u2019s first act of keeping its own record.',
    image: '/images/a1/narrative-1794-title.jpg',
    href: '/archive/c1-crisis',
  },
  {
    year: 1808,
    dateLabel: '1790–1838',
    title: 'The design repeats',
    blurb:
      'Charleston, New York, Boston: within fifty years, more than a hundred societies stand on the Philadelphia pattern. Each one is founded independently, and each one arrives at the same institution.',
    href: '/archive/a2-parallel-infrastructure',
  },
  {
    year: 1843,
    dateLabel: '1843',
    title: 'The Grand United Order',
    blurb:
      'When no lodge at home will seat them, Black Odd Fellows charter their own order from England. A complete fraternal world follows: lodges, benefits, burial funds, and a place to be somebody.',
    image: '/images/a3/guoof-member-1890s.jpg',
    href: '/archive/a3-fraternal-scale',
  },
  {
    year: 1849,
    dateLabel: 'from 1849',
    title: 'Huiguan of San Francisco',
    blurb:
      'Chinese district associations organise lodging, work, medicine, dispute resolution, and the return of remains home. For sixty years they are the whole of civic life for the people they serve.',
    image: '/images/a2/six-companies-dignitary.jpg',
    href: '/archive/a2-parallel-infrastructure',
  },
  {
    year: 1889,
    dateLabel: '1889',
    title: 'Everyone in the ward',
    blurb:
      'Hull House opens its doors to whoever lives on Halsted Street, in the most ethnically mixed neighbourhood on the continent. The membership rule is the address.',
    image: '/images/c3/hull-house-postcard.jpg',
    href: '/archive/c3-intentional-institutions',
  },
  {
    year: 1903,
    dateLabel: '1880s–1920s',
    title: 'In every language',
    blurb:
      'Landsmanshaftn, società di mutuo soccorso, sociedades mutualistas, tanomoshi-kō: every immigrant community independently builds the same institution, in its own tongue, on the same design.',
    image: '/images/a2/hester-street-1903.jpg',
    href: '/archive/a2-parallel-infrastructure',
  },
  {
    year: 1907,
    dateLabel: '1907',
    title: 'Du Bois counts the societies',
    blurb:
      'The first systematic survey finds thousands of Black mutual aid organisations: for over a century, the principal provider of insurance, education, and burial for their communities.',
    href: '/archive/a2-parallel-infrastructure',
  },
  {
    year: 1913,
    dateLabel: '1913',
    title: 'One big union on the docks',
    blurb:
      'IWW Local 8, a third Black, a third Irish, a third immigrant, runs Philadelphia\u2019s waterfront for a decade and pools the machinery of survival across every line the city drew.',
    image: '/images/c2/ben-fletcher-1918.jpg',
    href: '/archive/c2-labor',
  },
  {
    year: 1920,
    dateLabel: 'by 1920',
    title: 'One in three',
    blurb:
      'On the most conservative estimate, a third of adult American men belong to a fraternal order. Two dollars a year buys a family the lodge doctor. It is the largest civic institution in the country.',
    image: '/images/a3/ioof-parade-1890.jpg',
    href: '/archive/a3-fraternal-scale',
  },
  {
    year: 1932,
    dateLabel: 'early 1930s',
    title: 'Self-help in the collapse',
    blurb:
      'Before federal relief exists, the unemployed build labour exchanges, cooperative farms, and barter networks, enough of them that the Bureau of Labor Statistics sends surveyors.',
    image: '/images/b1/breadline-1932.jpg',
    href: '/archive/b1-new-deal-displacement',
  },
  {
    year: 1941,
    dateLabel: '1785–present',
    title: 'The uncounted economy',
    blurb:
      'Midwives, meal circuits, sitting up with the sick: the largest care system in the country runs continuously from before the Republic, and leaves almost no paper, because nobody files it.',
    image: '/images/b5/midwife-delano-1941.jpg',
    href: '/archive/b5-maternal-networks',
  },
  {
    year: 1955,
    dateLabel: '1955–56',
    title: 'The Club From Nowhere',
    blurb:
      'Georgia Gilmore\u2019s cooks bake the Montgomery boycott\u2019s budget into pound cakes, and a parallel transit system moves tens of thousands to work for 381 days without the buses.',
    image: '/images/b2/mia-flyer-1956.jpg',
    href: '/archive/b2-civil-rights-care',
  },
  {
    year: 1964,
    dateLabel: '1957–64',
    title: 'Schools in kitchens',
    blurb:
      'Citizenship schools and Freedom Schools teach reading and the machinery of civic life in church basements and beauty parlours across the South, staffed by neighbours.',
    image: '/images/b2/sncc-freedom-summer-flyer-1964.jpg',
    href: '/archive/b2-civil-rights-care',
  },
  {
    year: 1969,
    dateLabel: 'January 1969',
    title: 'Free breakfast before the bell',
    blurb:
      'The survival programmes feed thousands of children every school morning, run clinics in a dozen cities, and make sickle cell anaemia a national issue. Federal school breakfast follows their model.',
    image: '/images/b3/free-breakfast-1970.jpg',
    href: '/archive/b3-black-panthers',
  },
  {
    year: 1982,
    dateLabel: 'January 1982',
    title: 'The buddy system',
    blurb:
      'Six men and an answering machine become Gay Men\u2019s Health Crisis. The buddy networks carry meals, medicine, and company for years before the famous protests grow out of them.',
    image: '/images/b4/act-up-nih.jpg',
    href: '/archive/b4-aids-mutual-aid',
  },
  {
    year: 2012,
    dateLabel: '2005–12',
    title: 'Faster than the agencies',
    blurb:
      'Common Ground after Katrina, Occupy Sandy after the storm: relief organised by whoever shows up, for whoever is there, moving supplies while the paperwork is still being drafted.',
    image: '/images/c1/occupy-sandy-2012.jpg',
    href: '/archive/c1-crisis',
  },
  {
    year: 2020,
    dateLabel: 'spring 2020',
    title: 'The block organises',
    blurb:
      'Hundreds of neighbourhood networks assemble in weeks, organised by building and zip code, matching groceries and prescriptions to doors. Most pandemic giving moves through neighbours.',
    href: '/archive/c1-crisis',
  },
  {
    year: 2026,
    dateLabel: 'now',
    title: 'The record, assembled',
    blurb:
      'The tradition\u2019s oldest act of self-defence is writing itself down, as the Free African Society did in 1794. This archive performs that act for the whole tradition at once.',
    href: '/archive/d4-contestation',
  },
];
