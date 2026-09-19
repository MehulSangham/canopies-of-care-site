# Canopies of Care — Site Workplan & Specification

## What This Project Is

A public-facing website that hosts the mutual aid archive as credible, citable civic knowledge, carries the Canopies of Care reframe campaign, and provides the destination that PSA videos and partner outreach point back to.

**Live site:** https://canopies-of-care-site.vercel.app
**Repo:** https://github.com/MehulSangham/canopies-of-care-site

---

## Source Material

The content and design for this site draw from three existing projects:

| Source | Location | What It Provides |
|--------|----------|-----------------|
| **Narrative Analysis 2025** | `/Users/mehulsangham/Repositories/Narrative_Analysis_2025/archive_project/outline/` | The 14 claims (A1–D4), Toulmin argument structure, 16 citation files, chapter outline, and implications |
| **Canopies of Care** | `/Users/mehulsangham/Repositories/canopiesOfCare/` | The proposal, Phase 2 budget, point of view, project objectives |
| **NLSC Curriculum** | `/Users/mehulsangham/Repositories/NLSC_curriculum/` | Design system (colors, typography, cards), page layout pattern (prose + footnotes + tables), style guide |

### Key Source Files

**Content spine:**
- [`00_SPINE.md`](../Narrative_Analysis_2025/archive_project/outline/00_SPINE.md) — the logical structure (4 sections, 14 claims, how they connect)
- [`03_CLAIMS.md`](../Narrative_Analysis_2025/archive_project/outline/03_CLAIMS.md) — 10 claims in narrative form with "what must be shown" and evidence status
- [`04_SOURCES.md`](../Narrative_Analysis_2025/archive_project/outline/04_SOURCES.md) — 14 claims in Toulmin structure (Claim, Warrant, Qualifier, Rebuttal) with source tiers
- [`05_IMPLICATIONS.md`](../Narrative_Analysis_2025/archive_project/outline/05_IMPLICATIONS.md) — "What It Changes" (three implications + future use table)
- [`OUTLINE.md`](../Narrative_Analysis_2025/archive_project/outline/OUTLINE.md) — full 10-chapter book outline

**Citation files** (one per claim, carrying all evidence):
- [`citations/A1_founding_era.md`](../Narrative_Analysis_2025/archive_project/outline/citations/A1_founding_era.md) through [`citations/D4_contestation.md`](../Narrative_Analysis_2025/archive_project/outline/citations/D4_contestation.md)

**Design reference:**
- [`ni-design.css`](../NLSC_curriculum/admin/planning/slides-html/ni-design.css) — design tokens (colors, typography, cards)
- [`slide-01.html`](../NLSC_curriculum/admin/planning/slides-html/slide-01.html) through `slide-13.html` — layout patterns
- [`module-design-pattern.md`](../NLSC_curriculum/admin/planning/module-design-pattern.md) — page structure (theory/practice rhythm, Toulmin per section)
- [`module-4-style-guide.md`](../NLSC_curriculum/04-change/module-4-style-guide.md) — writing style, footnote conventions, table usage, prose structure

**Proposal & framing:**
- [`Canopies_of_Care_Proposal.md`](../canopiesOfCare/Canopies_of_Care_Proposal.md) — project objectives, narrative strategy scope
- [`Canopies_of_Care_Phase2_Budget.md`](../canopiesOfCare/Canopies_of_Care_Phase2_Budget.md) — Phase 2 structure (archive, activation, PSA production)
- [`CoC_inital_pov.txt`](../canopiesOfCare/CoC_inital_pov.txt) — original point of view

---

## Current State

| Component | Status | Notes |
|-----------|--------|-------|
| Repo & framework | ✅ Done | Next.js 16, TypeScript, Tailwind |
| Vercel deployment | ✅ Done | Auto-deploys on push to `main` |
| Design tokens in CSS | ✅ Done | Colors, fonts loaded, but layout needs iteration |
| TinaCMS schema | ✅ Done | Custom blocks defined (Footnote, CaptionedImage, DataTable, Callout) |
| TinaCMS cloud connection | 🔴 Not done | Needs app.tina.io project + credentials in Vercel env vars |
| Design fidelity | 🟡 Rough | Tokens are in but page layout doesn't match curriculum editorial feel |
| Page structure | 🟡 Partial | Landing + archive page exist, but structure not finalised |
| Content | 🟡 Sample only | One entry (A1) — remaining 13 claims not populated |
| About page | 🔴 Not started | |
| Mobile responsiveness | 🟡 Basic | Needs design attention |

---

## Workplan

### Phase 1: Design Fidelity

**Goal:** Make the site look and feel like the curriculum — editorial, dignified, scholarly.

#### 1.1 Typography Rhythm
- [ ] Tune heading sizes and spacing to match `ni-design.css` proportions
- [ ] Body prose: 22px / 32px line-height (curriculum spec) — currently close but needs verification
- [ ] Headings: Sharp Earth ExtraBold at correct sizes (h1: 64px, h2: 44px, h3: 28px) — scale for web (these are slide sizes at 1920px)
- [ ] Labels: Redaction 20, uppercase, letter-spaced — verify rendering
- [ ] Ensure font files are loading correctly (check network tab)

#### 1.2 Page Layout
- [ ] Container: generous padding (80px vertical, 120px horizontal on desktop) — adapt for web
- [ ] Max content width: ~48rem for prose, allowing comfortable reading line length
- [ ] Section spacing: clear visual separation between claims (dividers, whitespace)
- [ ] Mobile: stack gracefully, reduce padding, scale type

#### 1.3 Component Styling
- [ ] **Cards**: glass-morphism background (`rgba(246,243,234,0.06)`), subtle border (`rgba(246,243,234,0.1)`), 12px radius — verify against curriculum slides
- [ ] **Tables**: minimal, with `var(--divider)` row borders, no cell borders, generous padding
- [ ] **Footnotes**: visually separated from body (top border), smaller type, muted color, superscript references in accent color
- [ ] **Blockquotes**: left accent border, indented, italic
- [ ] **Callout cards** (Claim/Warrant/Qualifier/Rebuttal): left border colored by type, Redaction 20 label, card background

#### 1.4 Header & Navigation
- [ ] Refine header: site title left, nav links right, subtle bottom border
- [ ] Consider adding section nav on archive page (sticky sidebar or top tabs for A/B/C/D)
- [ ] Footer: minimal, with project attribution

**Reference:** Compare every element against the curriculum slides (`slide-01.html` through `slide-13.html`) and the CSS (`ni-design.css`).

---

### Phase 2: Page Structure

**Goal:** Decide and build the full page architecture.

#### 2.1 Decide Structure

The 14 claims need a reading structure. Options:

| Option | Description | Best For |
|--------|-------------|----------|
| **Long scroll per section** | 4 pages (A, B, C, D), each containing its claims as sections | Reading the argument as a narrative flow |
| **One page per claim** | 14 individual pages with prev/next navigation | Deep reading + citation checking |
| **Single page** | One very long page for the entire argument | Maximum impact, but may be too long |
| **Hybrid** | Landing → 4 section pages → expandable claims within each | Balance of overview and depth |

**Recommendation:** Hybrid — the landing page shows the four sections as cards (already built), each section page shows its claims as scrollable prose with a sticky section nav.

#### 2.2 Build Pages

- [ ] **Home** (`/`) — hero + four section cards + brief thesis statement (exists, needs design refinement)
- [ ] **Archive landing** (`/archive`) — introduction to the argument + links to all four sections
- [ ] **Section A** (`/archive/founding-tradition`) — Claims A1, A2, A3 as continuous prose with footnotes
- [ ] **Section B** (`/archive/through-american-identity`) — Claims B1–B5
- [ ] **Section C** (`/archive/transcendence`) — Claims C1–C4
- [ ] **Section D** (`/archive/displacement`) — Claims D1–D4
- [ ] **What It Changes** (`/archive/implications`) — from `05_IMPLICATIONS.md`
- [ ] **About** (`/about`) — project description, team, methodology note
- [ ] **Sources** (`/sources`) — full bibliography (optional, may be integrated into sections)

#### 2.3 Navigation

- [ ] Section navigation on archive pages (which section you're in, links to others)
- [ ] Within-page navigation for long section pages (claim anchors)
- [ ] Previous/next links at bottom of each section page
- [ ] Back-to-top on long pages

---

### Phase 3: Content Population

**Goal:** Port all 14 claims from the Narrative Analysis outline into the site.

#### 3.1 Content Format

Each claim becomes a markdown file in `content/archive/` with this frontmatter:

```yaml
---
title: "Claim title"
subtitle: "Time period or key reference"
section: "A"  # A, B, C, or D
order: 1      # position within section
---
```

The body follows the editorial pattern defined in `CONTENT_STYLE.md`:
1. **Opening prose** — lands the claim in a concrete scene or fact
2. **Development** — historical narrative carrying the reasoning inside it
3. **Honest limits** — qualifications woven into the prose
4. **The objection** — anticipated and answered in the narrative flow
5. **Footnotes** — full citations at bottom after `---`

The Toulmin structure (Claim/Warrant/Qualifier/Rebuttal) is the analytical skeleton
in the source documents only. It is never rendered as labelled callouts on the page.
See `CONTENT_STYLE.md` for the full rules.

#### 3.2 Claims to Port

All sixteen pages drafted (September 2026), status `draft`, awaiting editorial review.
Each page has images (public domain / CC, credits in `public/images/*/CREDITS.md`)
and two-part footnotes per `CONTENT_STYLE.md`.

**Section A — The Founding Tradition:**
- [x] A1: "The Parallel Founding" — `a1-founding-era.mdx` (also carries the meta-panel prototype)
- [x] A2: "The Same Design" — `a2-parallel-infrastructure.mdx`
- [x] A3: Fraternal scale — `a3-fraternal-scale.mdx`

**Section B — Through American Identity:**
- [x] B1: New Deal displacement — `b1-new-deal-displacement.mdx`
- [x] B2: "The Club From Nowhere" — `b2-civil-rights-care.mdx`
- [x] B3: "Survival Pending Revolution" — `b3-black-panthers.mdx`
- [x] B4: "The Buddy System" — `b4-aids-mutual-aid.mdx`
- [x] B5: "Women's Work" — `b5-maternal-networks.mdx`

**Section C — Transcendence Across Identities:**
- [x] C1: "A Community of Sufferers" — `c1-crisis.mdx`
- [x] C2: "One Big Union" — `c2-labor.mdx`
- [x] C3: "Everyone in the Ward" — `c3-intentional-institutions.mdx`
- [x] C4: "Forced to Form Their Own" — `c4-exclusion-not-principle.mdx`

**Section D — Displacement & Contestation:**
- [x] D1: "Share No More" — `d1-legal-institutional.mdx`
- [x] D2: "The Infrastructure of Meaning" — `d2-competing-tradition.mdx`
- [x] D3: "Upstream of Politics" — `d3-project-2025.mdx`
- [x] D4: "What This Archive Is For" — `d4-contestation.mdx`

#### 3.3 Source Material Mapping

Each claim maps to specific files:

| Claim | Narrative Source | Toulmin Source | Citations |
|-------|-----------------|---------------|-----------|
| A1 | `03_CLAIMS.md` §1 | `04_SOURCES.md` §A1 | `citations/A1_founding_era.md` |
| A2 | `03_CLAIMS.md` §2 | `04_SOURCES.md` §A2 | `citations/A2_parallel_infrastructure.md` |
| A3 | `03_CLAIMS.md` §3 | `04_SOURCES.md` §A3 | `citations/A3_fraternal_scale.md` |
| B1 | `03_CLAIMS.md` §4 | `04_SOURCES.md` §B1 | `citations/B1_new_deal_displacement.md` |
| B2 | `03_CLAIMS.md` §5 | `04_SOURCES.md` §B2 | `citations/B2_civil_rights_care.md` |
| B3 | `03_CLAIMS.md` §6 | `04_SOURCES.md` §B3 | `citations/B3_black_panthers.md` |
| B4 | `03_CLAIMS.md` §7 | `04_SOURCES.md` §B4 | `citations/B4_aids_mutual_aid.md` |
| B5 | `03_CLAIMS.md` §8 | `04_SOURCES.md` §B5 | `citations/B5_maternal_networks.md` |
| C1 | `03_CLAIMS.md` §9 | `04_SOURCES.md` §C1 | `citations/C1_crisis.md` |
| C2 | — | `04_SOURCES.md` §C2 | `citations/C2_labor.md` |
| C3 | — | `04_SOURCES.md` §C3 | `citations/C3_intentional_institutions.md` |
| C4 | — | `04_SOURCES.md` §C4 | `citations/C4_exclusion_not_principle.md` |
| D1 | `03_CLAIMS.md` §10 | `04_SOURCES.md` §D1 | `citations/D1_legal_institutional.md` |
| D2 | — | `04_SOURCES.md` §D2 | `citations/D2_competing_tradition.md` |
| D3 | — | `04_SOURCES.md` §D3 | `citations/D3_project_2025.md` |
| D4 | — | `04_SOURCES.md` §D4 | `citations/D4_contestation.md` |

---

### Phase 4: TinaCMS Admin

**Goal:** Connect TinaCMS so an admin can edit content visually on the site.

- [ ] Create a project at [app.tina.io](https://app.tina.io)
- [ ] Point it to the `canopies-of-care-site` GitHub repo
- [ ] Copy Client ID and Token
- [ ] Add to Vercel environment variables: `NEXT_PUBLIC_TINA_CLIENT_ID` and `TINA_TOKEN`
- [ ] Update build script to `tinacms build && next build`
- [ ] Test admin at `yoursite.vercel.app/admin`
- [ ] Verify custom components work in the rich text editor:
  - [ ] Footnote (inline reference + citation block)
  - [ ] CaptionedImage (upload + alt + caption + credit)
  - [ ] DataTable (column/row editor)
  - [ ] Callout (Claim/Warrant/Qualifier/Rebuttal cards)

---

### Phase 5: Polish & Launch

- [ ] Mobile responsive testing (iPhone, iPad, Android)
- [ ] Favicon and Open Graph meta (social sharing preview)
- [ ] Custom domain (if applicable)
- [ ] Accessibility audit (heading hierarchy, alt text, contrast ratios, keyboard nav)
- [ ] Performance check (Lighthouse score, font loading, image optimisation)
- [ ] SEO: page titles, descriptions, canonical URLs
- [ ] 404 page styled to match
- [ ] Analytics (optional — Vercel Analytics or Plausible)

---

## Design Specification

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--dark-sky` | `#00003c` | Page background |
| `--cream` | `#f6f3ea` | Primary text, headings |
| `--cream-muted` | `#c8c5b8` | Body prose, secondary text |
| `--cream-subtle` | `#8a8878` | Tertiary text, footnotes, labels |
| `--accent` | `#c850c0` | Links, footnote refs, hover states, callout borders |
| `--card-bg` | `rgba(246,243,234,0.06)` | Card backgrounds |
| `--card-border` | `rgba(246,243,234,0.1)` | Card borders |
| `--divider` | `rgba(246,243,234,0.08)` | Table row borders, section dividers |

### Typography

| Element | Font | Weight | Size (web) | Line Height |
|---------|------|--------|------------|-------------|
| h1 | Sharp Earth | 800 | 3.5rem | 1.1 |
| h2 | Sharp Earth | 800 | 2.5rem | 1.2 |
| h3 | Sharp Earth | 800 | 1.5rem | 1.35 |
| h4 / labels | Redaction 20 | 400 | 0.875rem | 1.5 |
| Body prose | Sharp Earth | 500 | 1.25rem | 1.8 |
| Body small | Sharp Earth | 500 | 1rem | 1.5 |
| Footnotes | Sharp Earth | 500 | 0.95rem | 1.7 |

### Fonts

Located in `public/fonts/`:
- `SharpEarthPanEuro-ExtraBold.otf` (weight 800)
- `SharpEarthPanEuro-Medium.otf` (weight 500)
- `Redaction20-Regular.otf` (weight 400)

### Page Layout Pattern

From the curriculum style guide:

1. **Continuous prose paragraphs** — no bullet points in main argument sections
2. **Key terms in bold** on first introduction
3. **Tables** for comparative or analytical content — supplement the prose, never replace it
4. **Footnotes** (`[^n]`) collected at the bottom after `---` — carry the scholarly weight (full citations, multiple sources per footnote, expanded context)
5. **The body makes the argument; the footnotes show the evidence base** — a reader who ignores all footnotes should still understand the section completely
6. **Blockquotes** for direct quotations — left accent border
7. **Callout cards** for Toulmin components (Claim, Warrant, Qualifier, Rebuttal) — card background, left border by type, Redaction 20 label

### Writing Conventions

From the curriculum style guide (`module-4-style-guide.md`):
- British English spelling (analysing, organisation, behaviour)
- Oxford comma
- No em dashes — use commas, colons, parentheses, or split into two sentences
- No emoji, no colloquialisms, no exclamation marks
- Key terms bold on first introduction, plain text thereafter
- Book titles in *italics*, article titles in "quotation marks"
- Concrete before abstract — land it in a recognisable example before developing theory

---

## File Structure

```
canopies-of-care-site/
├── content/
│   ├── archive/           ← one .md file per claim (A1–D4)
│   │   ├── a1-founding-era.md
│   │   ├── a2-parallel-infrastructure.md
│   │   ├── ...
│   │   └── d4-contestation.md
│   └── pages/             ← static pages (home, about)
│       ├── home.mdx
│       └── about.mdx
├── public/
│   ├── fonts/             ← Sharp Earth + Redaction 20
│   └── uploads/           ← images uploaded via TinaCMS
├── src/
│   ├── app/
│   │   ├── page.tsx       ← landing page
│   │   ├── archive/
│   │   │   └── page.tsx   ← archive main page
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── layout.tsx     ← root layout
│   │   └── globals.css    ← design system
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Prose.tsx      ← markdown renderer
│   │   ├── SectionLabel.tsx
│   │   └── tina/          ← custom CMS components
│   │       ├── Footnote.tsx
│   │       ├── FootnoteRef.tsx
│   │       ├── CaptionedImage.tsx
│   │       ├── DataTable.tsx
│   │       ├── Callout.tsx
│   │       └── components.ts
│   └── lib/
│       └── markdown.ts    ← content loading utilities
├── tina/
│   └── config.ts          ← TinaCMS schema
├── .nvmrc                 ← Node 20
├── package.json
└── WORKPLAN.md            ← this file
```

---

## Running Locally

```bash
# Use Node 20
nvm use 20

# Install dependencies
npm install

# Run dev server (without TinaCMS cloud)
npm run dev:local

# Run dev server (with TinaCMS cloud — needs credentials)
npm run dev

# Build for production
npm run build
```

---

## Order of Work

When opening this repo to continue, work in this order:

1. **Phase 1 first** — get the design right before adding content
2. **Phase 2 next** — build the page structure
3. **Phase 3** — populate content (this is the bulk of the work)
4. **Phase 4** — connect CMS for admin editing
5. **Phase 5** — polish and launch
