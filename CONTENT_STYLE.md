# Content Style Guide — Canopies of Care

How to write the archive pages. This governs all content in `content/archive/`.

## The Register (read this first)

The pages sit between a New York Times explanatory feature and a well-edited
Wikipedia article. They tell the story of mutual aid in America. The writing is
patient, systematic, and fully explanatory, and it is evocative only through
concrete detail, never through figurative language or rhetorical compression.

Three rules govern every sentence, in this order:

### 1. Explain fully rather than compress

Never carry a concept in a metaphor, an epigram, or a summarising phrase before
the literal explanation has been given in full. If a mechanism matters (how a
benefit fund worked, how a gift economy provided insurance, what a lodge did for
its members), walk through it step by step, in order, so that a reader with no
background understands how it actually worked. Once the literal account is on
the page, the metaphor is almost always unnecessary, so cut it. The
significance of a fact is something the reader should arrive at by
understanding it, never something a phrase gestures toward.

### 2. Every sentence is complete and carries one idea

No fragments, and no fragments disguised as style ("Dues, sickness benefits,
burial: the design every community will rebuild"). No colon followed by a list
standing in for an explanation. No semicolon chains holding unrelated clauses
together. Each sentence has a subject and a verb and does one job.

### 3. Bind sentences with explicit conjunctions

The logical relationship between every sentence and its neighbour is written
down, never implied by adjacency. Use *and*, *because*, *when*, *although*,
*nevertheless*, *therefore*, *in this way*, *as a result*, *rather than*. The
reader must always know whether they are reading a cause, a consequence, a
contrast, or a continuation. A passage should read as one continuous line of
reasoning, not a list of facts in sequence.

### Calibration: the same passage at four stages

The failure modes, in the order they were diagnosed. Only the final version is
acceptable.

**Compressed (wrong — metaphor instead of explanation):**

> Wealth that accumulated in one house was sent around the community on a fixed
> loom of obligation, and every gift created a claim that would return when the
> giver's own luck turned.

**Choppy (wrong — explained, but unlinked declaratives):**

> The society's structure was simple. Members paid a shilling a month into a
> common fund. When a member fell sick, the fund paid them a weekly benefit.
> When a member died, the fund covered the burial.

**Colon-spliced (wrong — connectives replaced by punctuation):**

> The society ran on a simple mechanism: each member paid a shilling a month
> into a common fund, so that when any member fell sick, the fund could pay
> them a weekly benefit; because the same fund also covered burial costs, a
> single payment protected a member against the great disasters of working life.

**Correct — complete sentences, one idea each, joined by stated conjunctions:**

> The society ran on a simple arrangement. Each member paid a shilling every
> month into a common fund, and that fund was used to support any member who
> could no longer support himself. When a member became too sick to work, he
> received a weekly payment from the fund until he recovered. When a member
> died, the fund paid for his burial and continued to make payments to his
> widow and his children. In this way, a single monthly contribution protected
> a member against the three financial disasters that most threatened a working
> family, which were illness, death, and the poverty of those left behind.
> Over the following fifty years, immigrant and Black communities across the
> country founded hundreds of similar societies. Although nearly all of these
> societies were organised independently of one another, they arrived at the
> same basic design, because the needs they were answering were the same
> everywhere.

**A second worked pair, for the slogan failure mode.** Slogans assert what the
prose should demonstrate:

> *Wrong:* From the start, belonging is something practised, not granted.

> *Right:* Prince Hall and the fourteen other founders could not vote, and in
> most courts they could not testify. When they applied to join the established
> American lodges, they were turned away because they were Black. Nevertheless,
> the lodge that they built for themselves performed many of the duties that
> citizenship was supposed to guarantee. It collected monthly dues from its
> members and used that money to pay benefits when a member fell sick or died.
> It kept its own records of births, marriages, and deaths, and it represented
> its members in disputes that the courts would not hear. The standing of these
> men in civic life therefore did not rest on a legal status, which they had
> been denied. It rested on an institution that they had built with their own
> money and governed under their own rules.

## The Governing Principle

The site is an **editorial essay**, not an argument diagram. The Toulmin structure
(Claim, Warrant, Qualifier, Rebuttal) lives in the source documents
(`Narrative_Analysis_2025/archive_project/outline/04_SOURCES.md`) as the analytical
skeleton. On the page, that skeleton must be invisible: the reader experiences a
flowing, scholarly historical narrative, never labelled argumentative machinery.

| Toulmin component | How it appears on the page |
|---|---|
| Claim | Carried by the strongest sentence of the narrative, inside the flow |
| Warrant | Woven in as the reasoning of the prose ("this matters because…") |
| Qualifier | Stated as historical fact, part of the story ("older traditions ran beneath it…") |
| Rebuttal | Answered by what the narrative shows; the objection is never staged |

Do **not** render Callout blocks of any type on archive pages. No
`<Callout type="claim">`, no exceptions. The argument lives entirely in prose.

## No Meta-Discourse

The page tells the history. It never talks about its own argumentation.

- Never refer to "the claim", "the argument", "the evidence", "the reader",
  "this page", or "this document" in the body text.
- Headings name historical content ("The Fever Year", "One Shilling in Silver"),
  never argumentative moves ("The Claim", "Limits of the Claim", "What the Claim
  Covers", "The Objection Answered").
- Qualifications are delivered as history: "The Free African Union Society of
  Newport preceded it in 1780" rather than "the claim should be stated no more
  strongly than the record supports".
- Objections are answered by the story itself. Never write "a reader might
  object" or "one could argue". If the objection is about scale, show the scale.
- Forward references to other pages are woven naturally ("a tradition that would
  grow to encompass…") rather than announced ("the next section covers…").

## Page Shape

1. **Opening**: land the claim in a concrete scene or fact (concrete before abstract)
2. **Development**: the historical narrative, carrying the reasoning inside it
3. **Honest limits**: qualifications woven into the prose where they arise
4. **The objection**: raised and answered as part of the narrative flow
5. **Footnotes**: after `---`, carrying the full scholarly weight

The body makes the argument; the footnotes show the evidence base. A reader who
ignores every footnote must still understand the page completely.

## Sources

Citation files live in `Narrative_Analysis_2025/archive_project/outline/citations/`
(one per claim, A1–D4). Source tier discipline is strict:

- **Citable** (primary documents, peer-reviewed scholarship, university-press
  monographs, government records): these carry claims.
- **Corroborating** (quality journalism, institutional reference sites): support
  only, never carry a claim alone.
- **Lead-only** (Wikipedia, blogs, community sites): never cited on the site.

### Footnote structure: note + sources

Every footnote has two parts, rendered as separate sections of the sidenote card:

1. **Note** (optional): the substantive point — a clarification, caveat, or the
   interesting extra fact. Short; readable at a glance.
2. **Sources**: the citations, one per line as a markdown list after a `Sources:`
   marker. Full citation (author, title, publisher, year); append a bare URL for
   digitised copies — the renderer compacts it to `hostname ↗`.

```markdown
[^3]: The one-in-three figure is Beito's conservative estimate, and it counts
adult men only.

    Sources:
    - Beito, *From Mutual Aid to the Welfare State* (UNC Press, 2000). https://archive.org/details/frommutualaidtow0000beit
    - "Fraternal Sickness Insurance," *EH.net Encyclopedia*. https://eh.net/encyclopedia/fraternal-sickness-insurance/
```

Citation-only footnotes start directly with the marker: `[^5]: Sources:` followed
by the indented list. Continuation lines are indented four spaces; a blank line
separates the note from the `Sources:` block.

## Reference Exemplar

The target voice in action:
`NLSC_curriculum/04-change/04.b-from-map-to-strategy/chapter-sections/4.6-narrative-gravity.md`

Study how it handles what we need:
- Definitions arrive inside flowing sentences, never as labelled apparatus
- Qualifications are carried in the prose ("this is an analytical shorthand rather
  than a complete formula, because…")
- Objections are answered without being framed as rebuttals ("None of these
  dimensions is sufficient on its own. Attention without centrality may produce
  visibility without influence…")
- Contrasts use "rather than" and "although", never "not X; it is Y"
- One footnote at the end carries the methodological grounding

## Prose Style

From the curriculum style guide (`NLSC_curriculum/04-change/module-4-style-guide.md`):

- British English spelling (organised, recognised, labour, defence)
- Oxford comma; no em dashes or en dashes. Restructure the sentence with a
  conjunction instead. A colon may introduce a quotation or a genuine list of
  items, and never a clause that should have been its own sentence
- No exclamation marks, no emoji, no colloquialisms
- **Avoid the "not X, but Y" contrastive pattern**: in headings and body. Prefer
  connected prose: "The FAS operated on reciprocal obligation" rather than
  "The FAS was not a charity; it was mutual aid."
- Connect short sentences with conjunctions; prose should flow rather than march.
  Short sentences are for deliberate emphasis at key beats only.
- Key terms **bold** on first introduction, plain thereafter
- Book titles in *italics*, article titles in "quotation marks"
- Concrete before abstract: open with the scene, the document, the person, the year
- Calm, precise, editorial voice; never promotional, never motivational

### Worked example (rewriting the old A1 draft)

Old draft (violates the rules):

> The FAS was not a charity. Its preamble required members to contribute "one
> shilling in silver a currency a month" in exchange for collective provision.
> This was a reciprocal obligation, not benevolence.

Target style:

> The Free African Society operated on reciprocal obligation. Its preamble
> required members to contribute "one shilling in silver" each month in exchange
> for collective provision: support during sickness, burial services, and care
> for orphans, with members paying in and drawing out according to need.

## Titles

Titles are display headings, and they render large. Keep them short enough to sit
on one line: two to five words, roughly 30 characters at most. The title is
editorial and evocative; the subtitle carries the context (period, place, key
institution). The full claim statement stays in the source outline and never
becomes the page title.

| Claim (source outline) | Page title | Subtitle |
|---|---|---|
| Mutual aid is a founding-era American practice | The Parallel Founding | The Free African Society, Philadelphia, 1787 |
| Fraternal mutual aid reached massive scale | One in Three | Fraternal orders and lodge practice, 1870–1920 |
| The New Deal displaced mutual aid without acknowledging it | The Quiet Replacement | Social Security and the fraternal decline, 1930s |

## The Editorial Pass (systematic rewrite workflow)

To bring an existing page up to this standard, use this exact prompt, replacing
only the slug:

> Rewrite the prose of `content/archive/<slug>.mdx` to conform to
> CONTENT_STYLE.md, applying the Register rules above all others. Hard
> constraints: do not change any fact, date, name, figure, or quotation; keep
> every footnote marker attached to the claim it supports; keep all images,
> captions, and frontmatter (including the panel block) exactly as they are;
> keep the heading structure unless a heading names an argumentative move.
> Self-reference to "this archive" or "this page" is banned (the introduction
> and two-accounts pages are the only exceptions). Expect the prose to get
> longer, because explanation replaces compression. After rewriting, read the
> page once as a sceptical copy editor and fix what you catch.

Process discipline:

1. **One page per pass.** Never batch pages in a single rewrite, because
   quality degrades and tics repeat.
2. **Reading order.** Edit in section order (A → B → C → D) so recurring
   concepts are introduced patiently once, in the earliest page where they
   appear, and referred to briefly afterwards.
3. **Consistency sweep at the end.** After all pages are done, one pass across
   the whole set for: repeated sentence openers, overused conjunctions,
   terminology drift (the same institution named differently on different
   pages), and page-opening sameness. Then verify the build renders and every
   footnote resolves.
4. **The reader test.** The final check for every page: a reader who knows
   nothing about the subject can explain the mechanism back to you after one
   reading, and a reader who knows the subject well finds nothing overstated.

## Frontmatter

```yaml
---
title: "Short editorial title, one line"
subtitle: "Time period or key reference"
section: "A"        # A, B, C, or D
order: 1            # position within section
status: "draft"     # draft until reviewed, then published
---
```
