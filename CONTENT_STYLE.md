# Content Style Guide — Canopies of Care

How to write the archive pages. This governs all content in `content/archive/`.

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
- Oxford comma; no em dashes or en dashes (use commas, colons, parentheses)
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
