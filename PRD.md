# PRD: browser.supply homepage clone

> Mirror of [issue #5](https://github.com/RacThug/trial-mindimedia/issues/5), which is the
> canonical source per `AGENTS.md`. If the two disagree, the issue wins.

Rebuild the [browser.supply](https://browser.supply/) homepage as a Next.js application,
matching it closely enough to satisfy the brief's "at least 99% similarity in layout,
design, and animation effects", while loading materially faster than the original.

This PRD is the spec. Work is tracked in the child issues listed at the bottom.

---

## 1. Source of truth

**Reference**: the live browser.supply homepage, captured 2026-07-26 via Playwright
(Chromium 151) at 1440x900, 810x1080 and 390x844.

Every number in this document is measured from that capture, not estimated. Where a value
could not be measured it is listed in [Known unknowns](#10-known-unknowns) rather than
guessed.

The Reference is a Framer-generated site (`<meta name="generator" content="Framer">`) served
from `framerusercontent.com`. It is a single scrolling page with no routing: **9944px** tall
on desktop, **14064px** on phone.

Vocabulary for this project is defined in `CONTEXT.md`. Use those terms.

---

## 2. Requirements from the brief

| # | Criterion | How this PRD addresses it |
| --- | --- | --- |
| 1 | UI/UX similarity | Sections 4-6, verified by the harness in section 8 |
| 2 | Responsiveness | Three measured breakpoints, section 5 |
| 3 | Code quality and structure | Sections 7, 9 and the ADRs |
| 4 | Data handling | Section 7 |
| 5 | Deployment | Vercel, section 11 |
| 6 | Performance | Budget in section 8 |

Also required: source on GitHub, deployed on Vercel, both links submitted, and the seven
written questions answered.

---

## 3. Decisions

Recorded here so nothing is re-litigated mid-build. Two have ADRs.

| Decision | Choice | Rationale |
| --- | --- | --- |
| Framework | Next.js App Router, TypeScript | [ADR-0001](../blob/develop/docs/adr/0001-nextjs-over-nuxt.md). Motion for React shares its lineage with Framer's own animation engine. |
| Animation | Motion for React | Same engine family as the Reference. |
| Styling | Tailwind v4, `@theme` tokens | Reference's design system is small and regular; tokens beat scattered magic numbers. |
| Data | JSON + typed data layer + Route Handlers | [ADR-0002](../blob/develop/docs/adr/0002-data-access-shape.md). Homepage imports directly to stay static; `/templates` proves the API over HTTP. |
| Assets | Downloaded, re-encoded, committed | Needed to beat the Reference on performance and to remove a third-party dependency mid-review. |
| Content | Verbatim, plus `noindex, nofollow` | Maximum fidelity; the robots directive keeps a lookalike out of search results. |
| Off-page links | Real placeholder routes | Nothing 404s or dead-ends; demonstrates the App Router layout model. |
| Fonts | Geist, self-hosted via `next/font` | Removes the render-blocking `fonts.gstatic.com` round-trip the Reference pays. |

---

## 4. Design tokens

All measured. These become the Tailwind `@theme` block.

### Type

Geist and Geist Variable, with uniform **-0.02em** tracking - large and light, never bold.
Every heading step is **weight 450**, not 400: measured in #11 as
`font-variation-settings: "wght" 450` on the variable face, with body copy on the static
face at 400. Interactive text is **500** and the Eyebrow is **600**.

| Token | Size | Line height | Tracking | Weight |
| --- | --- | --- | --- | --- |
| `display` (H1) | 68px | 81.6px | -1.36px | 450 |
| `display-tablet` | 60px | 72px | -1.2px | 450 |
| `display-phone` | 44px | 52.8px | -0.88px | 450 |
| `h2` | 56px | 67.2px | -1.12px | 450 |
| `h2-tablet` | 48px | 57.6px | -0.96px | 450 |
| `h2-phone` | 36px | 43.2px | -0.72px | 450 |
| `h3` | 44px | 57.2px | -0.88px | 450 |
| `h3-tablet` | 36px | 46.8px | -0.72px | 450 |
| `h3-phone` | 28px | 36.4px | -0.56px | 450 |
| `h4` (stat) | 32px | 41.6px | -0.64px | 450 |
| `h5` (card title, Testimonial quote, step title) | 24px | 33.6px | -0.48px | 450 |
| `feature` (bento card title) | 24px | **36px** | -0.48px | **400** |
| `body` | 16px | 25.6px | normal | 400, or **500** for a link or button label |
| `body-sm` | 14px | 22.4px | normal | 400 |
| `eyebrow` | 12px | 20.4px | normal | **600**, uppercase |

**The 450 is a layout number, not a nicety.** It is 2% of width, which is the difference
between a Testimonial's quote taking three lines in its 352px cell and fitting on two, so a
page built at 400 has a different grid. The same holds wherever a heading sits near a break.

**Geist's OpenType features are set too, and they are worth another 0.8% of width.**
Measured in #11: prose runs `"blwf", "cv03", "cv04", "cv09", "cv11", "ss02"`, headings run
`"ss02", "ss03"`, and button labels run `"ss01"`. With the weight and the features both
right, the Clone's line boxes match the Reference's to the hundredth of a pixel; with either
missing, quotes wrap differently.

**There are two 24px steps** (#11). A step card's title and a Testimonial's quote are
24/33.6; every feature bento title is 24/36 at weight 400 - same size, same tracking, and
the one heading on the page that is not 450. `h3` steps down twice as well, keeping a 1.3
line height at each step where the H1 and H2 keep 1.2.

`body-sm` is the phone step of body copy, measured in #9 on the footer (6.12). Only the
footer is measured so far - a Section wanting it elsewhere should measure its own case.

**Both display steps were measured in #10**, at 810 and 390 on the hero's H1 and the
featured Templates' H2. Section 5 had the tablet H1's size with no line height and called
inventing one forbidden; it is 72px. Every step keeps the 1.2 line height and the -0.02em
tracking, so only the size moves.

One step sits outside the scale: the hero's `RATED 4.92/5` label is **12px/18px at weight
700 with 0.07em of tracking**, in `#fffbf7` rather than white, and in **Inter Display**
rather than Geist. It is the only Inter Display on the page. We render it in Geist at the
same metrics - a Deviation worth about 5px of width on one label, against a second font
family for twelve characters.

**`text-wrap: balance` is a site-wide setting**, found by pixel-diffing the shell in #9 and
easy to miss because it changes nothing but where a line breaks. A census of the Reference's
204 headings and paragraphs:

| `text-wrap` | Count | What it is |
| --- | --- | --- |
| `balance` | 140 | every prose block, **including the H1** |
| `nowrap` | 60 | every link and short label |
| `wrap` | 4 | stat labels |

Greedy wrapping is visibly wrong: the phone tagline read `...with a premium / Framer website
template.` against the Reference's balanced `...with a / premium Framer website template.`,
two lines of 225px and 224px. **Every Section in #10 to #12 inherits this** - a balanced H2
breaks nothing like a greedy one.

### Colour

| Token | Value | Use |
| --- | --- | --- |
| `bg` | `#000000` | page |
| `surface-1` | `#141414` | cards |
| `surface-2` | `#1c1c1c` | secondary button, nested rows |
| `surface-3` | `#2e2e2e` | borders, dividers, hover |
| `text` | `#ffffff` | headings, primary body |
| `text-muted` | `#c9c9c9` | body copy, struck price |
| `accent-blue` | `#8ea9fa` | section eyebrows |
| `accent-orange` | `#ff8800` | FOUNDER badge, add-on prices, step badges |
| `accent-green` | `#33d478` | NEW badge |
| `text-warm` | `#fffbf7` | stars and the hero's rating label (#10) |

Both tinted pills are **radial gradients, not flat fills** (#10). The Eyebrow is
`radial-gradient(86% 150% at 47% 50%, rgba(102,140,255,0) 0%, rgba(102,140,255,0.5) 100%)`
- note the wash is `#668cff` while the text on it is `#8ea9fa` - and the NEW badge is
`radial-gradient(50% 50%, rgba(51,212,120,0) 0%, rgba(51,212,120,0.2) 100%)`.

### Shape

- Container: **one rail of 1200px**, centred, at every Breakpoint that has one. Measured in
  #10 on the hero and the featured Templates at 1440: both are 1200, the same rail the nav
  and footer run on, so the 1360 figure is gone rather than corrected. Gutters are 40px at
  desktop and tablet and 20px on phone.
- Button: radius **48px**, padding `10px 20px`, label `body` at **weight 500**, and **no
  set height**. #9 read the height as 46px; #10 re-measured it unrounded at **45.59px**,
  which is exactly `10 + 25.6 + 10`. The 46 is the height of the nav's row, not the
  button's own, and forcing it pushed the phone layout 0.82px down the page.
- Radii, all measured in #10: Template card screenshot **12px**, Template Wall tile
  **4px**, Eyebrow pill **8px**, NEW badge **4px**.
  - primary: white background, black text
  - secondary: `#1c1c1c` background, white text
- Nav: `position: fixed`, top 0, height **86px** (**76px** on phone), `z-index: 8`.
  Surface **`rgba(0, 0, 0, 0.7)` under `backdrop-filter: blur(12px)`**

Three of those are corrections made in #9 against the live Reference, all of them from
re-reading the element the styles are actually on:

- **The nav is not transparent and is not unblurred.** The `position: fixed` wrapper is
  transparent; the `<header>` inside it carries the tint and the blur. Over the black hero
  the two are indistinguishable, which is how the first measurement went wrong - the
  difference only appears once the Template Wall scrolls underneath. Sampled at scrollY 0,
  400, 1200 and 5000 in both directions and unchanged at every one, so **"never changes on
  scroll" still holds**.
- **There is no 12px button label.** The nav's Bundle pill and both hero buttons measure
  16px/25.6px at weight 500 - the `body` step, in a weight the scale did not have. The
  `--text-button` token is gone rather than corrected.
- **The scale is not weight 400 throughout.** Nav links, footer links and button labels are
  all **500**; `--font-weight-medium` joins the token layer.

---

## 5. Breakpoints

Measured, and they are Framer's defaults. **Tailwind's stock breakpoints are wrong for this
job and must be overridden**, or layout will diverge at exactly the widths a reviewer tests.

| Name | Range | H1 | H2 |
| --- | --- | --- | --- |
| desktop | >= 1200px | 68/81.6 | 56/67.2 |
| tablet | 810px - 1199px | 60/72 | 48/57.6 |
| phone | <= 809px | 44/52.8 | 36/43.2 |

Nav collapses to a hamburger at the tablet-to-phone boundary: 6 visible links become 1
control.

Both boundaries were re-checked in #10 by rendering at 809, 810, 1199 and 1200 and reading
the H1 back: the steps land exactly on 810 and 1200, and **tablet is a layout of its own
rather than a stretched phone** - it is the only Breakpoint that shortens the hero's
secondary CTA (6.2).

---

## 6. Section specification

Thirteen sections, top to bottom. Copy is verbatim from the Reference.

### 6.1 Nav (fixed)

Logo `Browser.supply`, links `Templates / Live examples / Support / Blog`, X and YouTube
icons, white `Bundle` pill.

**Verified twice, in #5 and again in #9: the nav never changes on scroll.** Background,
blur, height, transform and opacity are identical at every scroll position, scrolling both
up and down. Do not add a scrolled state.

Measured in #9, all three Breakpoints:

| | desktop (>= 1200) | tablet (810-1199) | phone (<= 809) |
| --- | --- | --- | --- |
| Height | 86px | 86px | **76px** |
| Gutter | 40px | 20px | 12px |
| Rail | 1200px | full | full |
| Row | 46px (the button) | 46px | 36px (the control) |

Logo 18px + 12px gap + wordmark; links centred **on the viewport** rather than spaced
between logo and actions, 16px gaps; actions 12px gap, social pair 8px.

Phone: logo left, menu control right - **two bars, not three**. Open, the same header fills
the viewport at `rgba(0, 0, 0, 0.2)` under `blur(20px)`, holding a 36px-gap column of
[row, links (28px gaps, social last), full-width `Bundle` pill].

The Reference's control is a `div` with no accessible name, no `aria-expanded` and no focus
trap, and its open menu lets the page behind it scroll. We deviate on all four (#9).

### 6.2 Hero

- Eyebrow pill `FRAMER TEMPLATES` (blue)
- H1 `No back-and-forth with AI. Pick, edit, publish.`
- CTAs: `Pick your template` (primary), `Or get matched with the perfect one` (secondary)
- Avatar stack + star + `RATED 4.92/5`

Phone: rating block moves **above** the buttons, buttons stack full width. It is one row
that reverses, not two blocks: DOM order stays buttons-then-rating at every width.

**The secondary CTA has a second copy variant, and it belongs to tablet.** #8 read the
served markup and recorded phone as the short one; #10 measured the render at 390, 500,
700, 809, 810, 900, 1100, 1199, 1200 and 1440, and it is **810-1199 alone** that renders
`Or get matched with one`. Phone and desktop both render
`Or get matched with the perfect one`. Both link to the Typeform quiz. It is shorter copy,
not truncation, so it cannot be reproduced with CSS - the Clone ships both nodes and hides
one, which is why an assertion on it has to read the accessible name rather than the text.

Measured in #10, all three Breakpoints:

| | desktop (>= 1200) | tablet (810-1199) | phone (<= 809) |
| --- | --- | --- | --- |
| Section padding | `160 40 60` | `160 40 60` | `120 20 40` |
| Section height | 533 | 514 | 606 |
| Eyebrow to body | 44 | 44 | 44 |
| H1 width | 1120 | 674 | full |
| H1 to CTA row | 32 | 32 | 40 |
| CTA row | row, spread | row, spread | column-reverse, 28 apart |
| Buttons | row, 12 apart | row, 12 apart | stacked, 16 apart, full width |

The Eyebrow pill is 28px tall, `4px 12px` of padding, an 8px gap, and carries Framer's own
logo at 20px in `#8ea9fa` - drawn from an inline data URI rather than the icon sprite, so
it never went through the asset pipeline. The rating block is 229x40: three 40px avatars at
a 24px step with the first on top, then 20px, then a 21px star 12px from its label.

**Casing throughout this Section is CSS, not content.** The markup ships
`Framer templates` and `Rated 4.92/5` in sentence case and uppercases them with
`text-transform`. Reproduce that rather than typing capitals, or a screen reader reads
spelled-out capitals where the Reference does not.

### 6.3 Template Wall

Dense grid of Template thumbnails and looping videos as a decorative backdrop, with
Testimonial cards floating over it.

**Verified static.** All 50 tiles tracked for 3 seconds at a fixed scroll position: **0
moved**. This is not a marquee and must not be built as one. The perceived motion is the
looping videos inside the tiles.

**The Testimonials over it do auto-advance, and this document said they did not.** Measured
in #10 with the block in view at 1440: Jacob, Mark, Aba, Roni, Nic, Seyed, Jacob, one every
**3.2s**, over a ~1.4s ease that carries most of its distance in the first third. The
earlier "identical quotes after 5 seconds" is reproducible and is not a bad reading - it is
what the Reference does with the block **off screen**, because it pauses when it is not
being looked at, and the Wall is below the fold at scrollY 0. Sample it in view or not at
all. The prev/next chevron controls #7 found in the markup are real but `display: none` at
every Breakpoint, so nothing advances it by hand either.

Grid, measured in #7 from the Reference's own layout arithmetic and again in #10 from the
render:

| | Columns | Tile width | Column gap |
| --- | --- | --- | --- |
| desktop 1440 | 4 | `(100vw - 48px) / 4` = 348px | 16px |
| tablet 810 | 4 | `(min(100vw, 800px) - 36px) / 4` = 191px | 12px |
| phone 390 | 3 | `(min(100vw, 400px) - 16px) / 3` = 125px | 8px |

The wall is **full width at desktop, 800px centred at tablet, and capped at 400px on
phone**, and its height is its tallest column: 1144, 637 and 652. Tiles carry a 4px radius
and `object-fit: cover`.

**16 unique tiles**, 10 images and 6 videos. The Reference ships its column split three
times over, once per Breakpoint - which is where the "48 placed" count comes from, since
only 16 are ever visible - and its desktop and tablet splits are exactly what a balanced
column fill produces: tiles 1-4, 5-8, 9-12, 13-16. So #10 builds one flat list under CSS
`columns` and lets the browser split it, which matches at both those widths and is the only
shape that can serve three Breakpoints without shipping the media three times. Phone is a
Deviation: the Reference hand-arranges its three columns round-robin into a taller wall than
a balanced fill gives, so the Clone sets the height and fills into it. Which tile lands in
which column differs there, under a fade that hides the difference.

Three treatments make it read as a backdrop rather than a gallery, all measured in #10:

- The grid is masked by `linear-gradient(#000 51%, transparent 102%)`, so the tiles fade out
  over the bottom half and a short column's ragged edge never shows.
- The Testimonial block is 298px tall, centred on the wall's **bottom edge**, and masked
  transparent-black-black-transparent at 0/25/75/100%.
- A **progressive blur** sits over the bottom: eight layers of `backdrop-filter`, each
  double the last from 0.40625px to 52px, each masked to its own eighth of a 346px band
  that ends 85px below the wall. The Reference writes those masks `to top` and then flips
  the whole stack with `matrix(-1, 0, 0, -1, 0, 0)`; read without the rotation they put the
  heavy blur at the top of the band, which is a hard seam and visibly wrong.

Framer's own `sizes` attribute collapses to `100vw` below 1200px, so the Reference ships
tablet and phone visitors an image roughly four times wider than it draws. Do not copy that.
Nor its clips: the Reference autoplays all six at `preload="auto"`, which is most of the
2.43 MB in section 8. The Clone paints the poster through `next/image` and starts the clip
from an IntersectionObserver, so nothing above the fold costs a video byte.

**Four Deviations on the motion**, none of which the Reference honours: the rotation stops
under `prefers-reduced-motion`, can be stopped by a control, pauses on hover and on focus,
and only runs on screen.

The control is what WCAG 2.2.2 actually asks for - a mechanism to stop moving content -
and hover and focus alone do not provide one, since a keyboard visitor cannot hover and
nothing inside the block is otherwise focusable. It is `sr-only` until focused and then
appears below the quote, so an at-rest capture is byte-identical and a keyboard visitor
still finds it: the bargain a skip link makes. The Reference offers nothing here at all -
its own prev/next chevrons are in the markup but `display: none` at every Breakpoint.

**Ten** of these images, and none of the six clips, form the Quiz CTA backdrop (6.10) - one
of them in two columns, for eleven placements. Measured in #12, where they are also four
columns that **travel**, rather than a second copy of this static grid. See 6.10.

### 6.4 Featured templates

Eyebrow `WHICH TEMPLATE IS FOR ME?`, H2 `Premium templates built to drive results.`,
`View all` button, three Template cards:

| Name | Category | Price | Badge |
| --- | --- | --- | --- |
| Selene | AI SAAS | $129 USD | NEW |
| Zenna | YOGA STUDIO | $129 USD | |
| Traction | SMMA | $129 USD | |

Each card carries **two** screenshots, not one: `template/{selene,zenna,traction}-{a,b}` in
the asset index. Both sit in the same box, stacked, which is what the second one is for -
the Clone crossfades to it on hover in 300ms. The Reference's own hover treatment was never
isolated (section 10), so the crossfade is ours and the second screenshot is measured.

Measured in #10, all three Breakpoints:

| | desktop (>= 1200) | tablet (810-1199) | phone (<= 809) |
| --- | --- | --- | --- |
| Section padding | `160 40 60` | `160 40 40` | `140 20 40` |
| Heading to cards | 44 | 44 | 44 |
| H2 width | 616 | 674 | full |
| Header row | row, bottom-aligned, `View all` right | as desktop | column, 36 apart, button full width |
| Cards | 3 x 387, 20 apart | 3 x 230, 20 apart | stacked, 20 apart |

The H2's width is a width and not a maximum: at tablet it is 674 inside a 632 column, wider
than what holds it, and a `max-width` would quietly resolve to 632 and balance the text
against the wrong measure. Card internals: a 4:3 screenshot at a 12px radius, 20px down to
a 70px block of title row over meta row 16px apart, the badge 12px from the name and the
price 4px from its currency.

As above, the table shows rendered text. **The markup is `New`, `AI SAAS`, `Yoga Studio`
and `SMMA`** (measured in #8), so `src/lib/content/data/templates.json` stores those and
the card uppercases in CSS. Card links are `/templates/{slug}`; the case study's primary
CTA points at `/templates/reformr`, a template that has no card on this page.

### 6.5 Feature bento

Eyebrow `WHY CHOOSE A TEMPLATE?`, H2 `Everything you need to launch. All in one place, not a stack.`

Five unequal cards, each with a video or image visual:

1. `Responsive straight out of the box. No coding or design required.`
2. `Step-by-step video tutorials included by a real human.`
3. `Automatic SEO, sitemaps and full-control all ready in your site.`
4. `Easily create and manage content with a built-in CMS.`
5. `Pro hosting included for fast and secure global sites.`

Measured in #11 at 1440, 810 and 390. The five sit in **one framed block**, not as loose
cards: a single 1px `--color-surface-3` outline at a 16px radius, with the cells dividing
themselves by their own edges. No gap at desktop or tablet; on phone the block becomes a
column with 16px between cards and the dividing lines stay, so a hairline sits at the top of
each gap.

| | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
| --- | --- | --- | --- |
| row 1 | 752 + 448, 542 tall | 365 + 365, 340 tall | stacked, 346 and 332 |
| row 2 | (576: 268 + 268) + 624, 536 tall | (341: 268 + 268) + 389, 536 tall | stacked, 285, 285, 352 |
| card padding | 24 | 24 | 24 |

Three card shapes, and which card gets which is layout rather than content:

- **framed** (1): the visual on top in a 704x406 box with its own 8px radius and outline,
  the title under it.
- **bleed** (2, 5): the clip fills the card edge to edge and the title sits over its
  bottom-left corner.
- **clipped** (3, 4): the title on top, then the still at its own intrinsic aspect - taller
  than the card, and cut off by it. The overflow is the point.

Two details that read as mistakes and are not. Row heights are **set** at the two wider
Breakpoints with the contents centred inside them, so tablet row 1 crops a few pixels off the
framed card (183 + 16 + 108 of content in 292 of room). And two of the five titles carry a
**measure of their own at desktop** - 427 on card 1, 314 on card 5, against the 704 and 576
their cards give them - so both break over two lines where they would otherwise fit on one.

Card 2's title has inline emphasis on the Reference: `... included by a <em>real</em> human.`
The `<em>` is reset to upright, so it is semantic and invisible. The content file stores the
plain sentence and the component adds the markup (ADR-0004).

### 6.6 How it works

Eyebrow `HOW DOES IT WORK?`, H2 `Go live within 1 hour, not months, weeks or even days.`

Three step cards with orange `STEP 1/2/3` badges:

1. `Pick a template.` / `Browse the collection of expert-crafted templates and select one best for you.`
2. `Make it yours.` / `Change text, customize colors, and swap images with ease.`
3. `Go live instantly.` / `Launch your site in seconds with just one click, all in one platform.`

The badge pill is the Eyebrow's radial wash in `--color-accent-orange` - same stops, same 8px
radius, same `4px 12px` - and the number is the card's position, not a field (ADR-0004).

Measured in #11. One framed block again, and at a **20px radius** rather than the bento's 16.
The middle card carries an outline of its own and that is where the two dividing lines come
from; on phone the same outline becomes the two horizontal ones.

| | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
| --- | --- | --- | --- |
| block | 1200x453, 3 across | 730x500, 3 across | stacked, 362 / 439 / 461 |
| card | 400 wide, 24 padding | 243 wide | full width |
| visual | step 2 216 tall, step 3 238 | the same | the same |

Each card is one column parted by `space-between`, and what sits at which end is the layout:
step 1 puts the badge at the top and the text at the bottom, step 2 leads with its clip, step
3 ends with one. The visual heights are fixed at every Breakpoint, so the clips crop rather
than scale and the card height is what moves.

**Step 1's visual is not a grid.** PRD 6.6 called it "a grid of eight Template thumbnails at a
flat 275px" until #11 measured it: it is **two 275px columns of eight 275x199 tiles**, 16px
apart, 28px between the columns, each column **rotated 16deg** and **travelling upwards at
29px/s**, clipped by the card and running under the badge and the text. The Template Wall
(6.3) is the static one; this is the only thing on the page that travels. The eight tiles are
the Traction card's own screenshot reused plus `step/pick-02..08`, and their alt text carries
the other Templates' names.

### 6.7 Social proof grid

Eyebrow `HAS ANYONE ELSE TRIED IT?`, H2 `Trusted by 2k+ customers around the globe.`,
`See real customer websites` button, 3x3 Testimonial grid.

Nine Testimonials: Nic, Renan, Emon, Widya, Dávid, Mark, Samar, Aba, Nonso. Each has 5
stars, quote, avatar, name. Note `Dávid` carries an acute accent, and the Reference contains
two genuine typos in quotes (`custmize`, and `The templates is so well designed`). **Reproduce
them verbatim.** They are content, not defects.

Measured in #11: one framed grid at a 16px radius, cells dividing themselves with a right and
a bottom edge each, and **the case study (6.8) is its last row**, spanning every column. A
cell is `32px 24px` of padding and three rows 28 apart - five 21px stars, the quote at the H5
step, then a 42px avatar 12px from the name. Rows are content-sized, and at desktop every
quote runs to three lines, which is what makes them 283.78 tall.

| | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
| --- | --- | --- | --- |
| grid | 3 across, 400 wide | 2 across, 365 | 1 across, 350 |
| shown | all nine | eight | six |
| name | 16/25.6 | 16/25.6 | 14/22.4 |

**The Reference drops Testimonials as the grid loses a column** rather than reflowing all
nine - Samar at tablet, and Emon, Samar and Nonso on phone - which is what keeps the grid
rectangular. Nine is the number in the content and the number the grid shows at desktop; the
two narrow layouts show a subset of that Placement, so the rule is layout and lives in the
component.

The `See real customer websites` button is one of the three on the page that carry an arrow
(the others are `Take the quiz` and `Book a coaching call with me`); it is 20x20 with an 8px
gap, and every other button is label-only.

The Template Wall (6.3) carries **six more** Testimonials: Jacob, Roni and Seyed, plus Mark,
Aba and Nic reused from this grid. **Twelve** unique people appear on the page, not nine
(measured in #7; slugs are `avatar/<first-name>`).

**The Wall's sequence order is `Jacob, Mark, Aba, Roni, Nic, Seyed`** - measured in #8 from
DOM order, and confirmed independently by the order of the avatars' own `alt` attributes.
The sentence above groups the three new people before the three reused ones and is not an
order. The grid order is as listed: Nic, Renan, Emon, Widya, Dávid, Mark, Samar, Aba, Nonso.

Two character-level details, both easy to normalise away by accident:

- The quotes use the **straight** apostrophe `'` (U+0027) in `it's` and `I've`. The founder's
  prose in 6.11 uses the **curly** `’` (U+2019), and the case study has `café`. Do not let an
  editor or a formatter unify them.
- `Dávid` is spelled with an acute accent in the visible text but a **grave** (`Dàvid`) in the
  Reference's own `alt` attribute. The visible spelling is the content; the alt is a defect
  we do not copy (see 6.14).

### 6.8 Case study

H3 `Matt launched his new site in less than 1 hour.` **Video** left (not a still - measured in
#7, `story/case-study`), copy right, four paragraphs, one with a left border rule. CTAs
`View template Matt used` (primary) and `View other customers' sites` (secondary).

**It is not a band of its own**: measured in #11, it is the last row of 6.7's grid, inside the
same frame and rounding off the same bottom corners. Thirteen Sections in this spec are twelve
bands on the page.

| | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
| --- | --- | --- | --- |
| layout | clip left 568, copy right 632, 604 tall | copy over a 461-tall clip | a 219-tall clip over the copy |
| copy | 32 padding, ends parted | 32 padding, 48 between | 24 padding, 32 between |
| H3 | 44/57.2 | 36/46.8 | 28/36.4 |
| prose | 16/25.6 | 16/25.6 | 14/22.4 |
| CTAs | half the measure each | half each | full width, stacked |

The clip leads on phone and follows on tablet - measured, not a guess at what a stack should
do. The paragraphs are 16px apart, the fourth is white behind a **1px white** rule 20px out
(every other hairline on these Sections is `--color-surface-3`), and the prose contains `café`
and a straight apostrophe in `Didn't`.

The copy and the clip are prose and single-use media in a single layout, so both are markup
rather than content, and the clip's text alternative is written in the component (ADR-0004).

### 6.9 Pricing

Eyebrow `DO YOU SELL ANYTHING ELSE?`, H2 `Providing all website-solutions for your needs.`

Three Plans. Note the Reference's own typo `ONE-TIME PAYEMNT` on the first card only, the
other two read `ONE-TIME PAYMENT`. Reproduce verbatim.

| Plan | Price | Compare-at | Options |
| --- | --- | --- | --- |
| Single template | $129 | | Framer template (default), Add Figma designs (+$39), Add Done-for you (+$370) |
| Bundle | $399 | $1,881 | |
| Custom project | $2,495 | | Landing page (default), Multi-page site |

Each has an `INCLUDED:` icon list and a bottom CTA (`Browse templates`, `Get the bundle`,
`Book a discovery call`). The lists are **5, 7 and 3 items** (measured in #8); the Bundle's
is the long one, repeating four of the Single template's items before `Priority support`.

Measured in #12 at 1440, 810 and 390:

| | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
| --- | --- | --- | --- |
| band | 60 40 20 | 40 40 20 | 40 20 |
| rail | 1200, 44 gap | 730, 44 gap | 350, 36 gap |
| H2 | 56/67.2, 896 wide | 48/57.6 | 36/43.2 |
| block | 3 across, 400 each | stacked | stacked, 16 apart |
| copy | 16/25.6 | 16/25.6 | 14/22.4 |

The band's padding is its own - 60 above and 20 below at desktop, against the even 60 that
6.5 to 6.8 share - which is why `SectionBand` takes one.

The three sit in one framed block, 1px `--color-surface-3` at a 16px radius, dividing
themselves with their own edges: vertical rules while they sit across, horizontal once they
stack. On phone they are **16px apart and keep those rules**, so a hairline lands inside each
gap and the frame outlines all three - the same look the bento has at that width.

Inside a card: 24 padding, 52 between the content and the CTA, 36 between the card's three
blocks, 32 from the eyebrow to the heading, 12 to the blurb, 32 between the name and its
price, 16 down the INCLUDED list. At desktop the three stretch to the tallest of them, so
the CTAs line up; at the two narrower Breakpoints each is its own content. The first card's
CTA is primary and the other two secondary - position, not a field.

Two details a diff finds and a reading does not. The struck compare-at price is **24/26.4**,
the one place the page's 24px H5 step and its line height part company. And the blurb is
`text-wrap: balance`: at 352px `Pick a template best suited for you, customize` fits on one
line and the Reference breaks after `for`.

**Every row carries its own glyph**, and there is no repeated tick: fourteen distinct
20x20 marks over the eighteen rows the three cards hold, each a 24-viewBox path at a 1.5px
stroke, and the same line of copy takes the same glyph wherever it appears. That pairing is
content and lives in `plans.json`; the paths are markup, in `plan-glyphs.ts`.

The Option row is 58px tall at every Breakpoint - a 26px control inside 16px of padding -
on `--color-surface-1` inside a 12px-radius block with its own outline, with a 20px glyph,
a 12px gap, the label, an 8px gap and the orange `(+$39)`. The control is a 26px track in
`--color-surface-3` holding an 18px white knob that appears when the row is chosen. The
Reference draws the chosen row **at half opacity on the first card and at full on the
third** - Framer's `Disabled` variant, which is what its inert rows are. Ours are live and
take the third card's look on every card, which is the one pixel the Deviation costs at rest.

Measured in #8, from the markup rather than the render:

- The eyebrows are `One-time payemnt`, `one-time payment`, `one-time payment` - the first
  carries both the typo **and** a capital `O`. All three are uppercased by CSS.
- **`Multi-page site` carries no `+$` label**, so its price delta is 0. That is read off the
  copy, not assumed: every other priced Option states its delta in its own text node, which
  is also why the label and the `(+$39)` beside it are separate elements.
- Option rows are **radio**, not additive checkboxes, in both Plans that have them.
- The `Book a discovery call` CTA leaves the site, for `cal.com/ramish-design/landing-page`.

**Option behaviour is a deliberate Deviation.** On the Reference these rows are inert: clicking
`Add Figma designs` leaves the price at $129, verified. In the Clone they recalculate, **but
the default selection matches the Reference**, so an at-rest screenshot diff stays identical
and the Deviation only appears if the reviewer clicks. Document this in the README.

### 6.10 Quiz CTA

Eyebrow `60-SECOND QUIZ`, H2 `Not sure which template is for you?`, a paragraph, and
`Take the quiz`, over a dimmed backdrop of Template stills.

**The backdrop travels.** This section first called it "a dimmed Template Wall backdrop", and
the images are indeed ten of the Wall's sixteen with none of its six clips, one placed twice
for eleven placements - but they are four columns going up and down at **29.1px/s**, columns
1 and 3 rising and 2 and 4 falling.
Measured in #12 by sampling the columns' transforms twice, two seconds apart, with the band
in view. The Template Wall (6.3) is the static grid that looks like a marquee; this is the
marquee that looks like the Wall, and mixing the two up is the easiest mistake on this page.

| | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
| --- | --- | --- | --- |
| band | 900 tall, 0 40 80 | 200 20 40 | 40 20 |
| copy | row, button right and bottom | as desktop | column, button full width |
| H2 | 56/67.2, 715 wide | 48/57.6 | 36/43.2 |
| body | 16/25.6, 476 wide | 16/25.6, 476 | 14/22.4, balanced |
| columns | 4 x (100vw-48)/4, 16 gap | 3 x (100vw-48)/3, 16 gap | 3 x 239, 8 gap |

The desktop band's 900px is a height and not the viewport's; the copy is pinned to its bottom
edge, and the tablet's 200px of top padding is the only room the columns get there.

The dimming is a **mask** rather than an opacity: `linear-gradient(#000 53%, transparent
100%)` intersected with `linear-gradient(transparent 0%, #000 121%)`, which peaks at about
44% alpha a little past the middle of the band and reaches zero at both ends.

This is the one Eyebrow on the page with a picture behind it, and the only one carrying a
`backdrop-filter: blur(8px)` - measured against the hero's, which has none.

### 6.11 Founder

Eyebrow `WHO IS THE DESIGNER?`, H2 `Meet the creator behind the sites.`,
`Book a coaching call with me`.

Looping founder video left; orange `FOUNDER` badge and H3 `Hey, I'm Ramish / Designer & Creator`
right, with five paragraphs. Then four stat tiles in a 2x2: `6+` Years building sites,
`100+` Websites made, `$100k+` Revenue made in Framer, `2,000+` Templates sold.

Measured in #12 at 1440, 810 and 390:

| | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
| --- | --- | --- | --- |
| band | 20 40 60 | 20 40 40 | 40 20 |
| frame | 1120, clip left 560 | 100vw - 40, clip 461 tall above | 100vw - 24, clip 217 tall above |
| gap | 0, the two are columns | 32 | 24 |
| H2 | 56/67.2, 718 wide | 48/57.6, 674 wide | 36/43.2 |
| H3 | 44/57.2 | 36/46.8 | 28/36.4 |
| stat | 32/41.6 | **36/46.8** | 32/41.6 |
| prose | 16/25.6 | 16/25.6 | 14/22.4 |

Two of those need reading twice.

**The frame is not the rail.** At desktop it is 1120 inside a 1200 rail, and at both narrower
Breakpoints it is *wider* than the rail it sits in - 770 in a 730 at tablet, 366 in a 350 on
phone. A `max-w-rail` here is right at none of the three.

**The stat's number is larger at tablet than at desktop**, 36 against 32, which is the sort
of step that gets tidied into a monotonic scale. Measured twice: off the computed style, and
off a 164.39px cell that only adds up with a 46.8px line in it.

The block is framed at a 16px radius like 6.5 to 6.9. Inside: 32 of padding round the copy,
32 from the badge to the H3, 12 between paragraphs, and stat tiles of `40px 0` padding with a
12px gap, dividing themselves with their own edges so the 2x2 has one cross in it.

Character-level, and both the Reference's own: the H3 says `Hey, I'm Ramish` with a
**straight** apostrophe and the fourth paragraph says `I’m sharing` with a **curly** one, in
the same block. The second paragraph ends on a non-breaking space, which renders as nothing.

### 6.12 Footer

Wordmark - text, not the nav's logo image - tagline `Launch your online business with a
premium Framer website template.`, X and YouTube icons, two link columns
(`Templates / Live examples / Bundle / Blog` and `Quiz / Support / Privacy`),
`© 2026 browser.supply. Framer website templates`, and `Created by Ramish Aziz`.

Measured in #9: 40px gutters at every width over the same 1200px rail as the nav - plus a
further 20px inside each row on phone, so phone copy starts at x=60 - then two
rows - a 254px block (`40px 0` padding) above a 72px by-line bar (`20px 0`), divided by a
1px `--color-surface-3` rule that overlaps rather than adding to either. Left column 16px
gaps, tagline fixed at 292px; link columns 56px apart with 24px
between links. Wordmark is `h5`; tagline, copyright and by-line are `text-muted`, dropping
to **14px/22.4px on phone**, where everything centres and the two columns become one.
The 38px portrait overflows its 32px row rather than growing it.

Both prose links (`Framer`, `Ramish Aziz`) are white inside grey text with no other
distinction, which is colour alone at 1.4:1 and fails the axe scan. We underline them - the
same reasoning as 6.14.

### 6.13 Quiz modal

1016x616 centred, `z-index: 10`, over a full-viewport backdrop. Eyebrow `60-SECOND QUIZ`, H2
`Get 30% off the perfect template for your business`, body copy, `Take the quiz`. Must be
dismissible.

**It does not fire on load.** Measured in #12 by sampling once a second from
`domcontentloaded`: nothing at five seconds, up at six. That is a deliberate delay rather
than a slow render - the page is idle long before - and it is what keeps ten screenshots out
of the initial load that section 8 budgets.

| | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
| --- | --- | --- | --- |
| panel | 1016 x 616 | 680 x 616 | 100vw - 84 x 660 |
| padding | 60 32 32 | 60 32 32 | 60 20 20 |
| H2 | 44/57.2 | 36/46.8 | 28/36.4 |
| body | 16/25.6, 476 wide | 16/25.6, 476 | 14/22.4, balanced |
| tiles | 476 x 369 | 476 x 369 | 319 x 247 |

12px radius, a 1px `--color-surface-3` outline, and a `rgba(0, 0, 0, 0.9)` scrim. Behind the
copy, **two columns of Template screenshots tilted 16deg and travelling in opposite
directions at 30.4px/s**, dimmed by the same two-gradient mask 6.10 uses at a 54% stop. The
ten are a set of their own: none of the Template Wall's tiles appears here, which is why
`quiz/*` exists in the asset manifest and why the census in `tests/assets/manifest.test.ts`
went from 47 stills to 57.

Its Eyebrow is the page's third pill: 4px radius rather than 8, a plain white wash at a fifth
of the Eyebrow's strength, and a `--color-text-muted` label rather than a tint of its own
colour.

The Reference's own modal *is* dismissible - Escape and an outside click both close it,
measured - but it offers no visible control and reopens on every navigation. Three
Deviations follow, all accessibility, all in the README: ours adds a close button, it traps
focus and returns it (a `<dialog>` does both, which is also where the scrim and the top layer
come from), and it stays shut for the session once dismissed.

### 6.14 Alt text is authored, not copied - a Deviation

Measured in #8: the Reference ships **106 `<img>` of which 72 have no `alt` attribute at
all**, and three of the 34 that do are defective - `JMBG, Browser.supply customer` on Jacob's
avatar, `Nic, , Browser.supply customer` and `Widya, , Browser.supply customer` with doubled
commas, and `Selene Framer Template for AI SAAS companie` truncated mid-word.

We write our own. Alt text is invisible, so this costs nothing in Fidelity, and copying the
Reference here would fail the axe scan in section 9 and contradict the brief's
"reliable, production-ready" instruction. Record it in the README as a Deviation.

Decorative media gets **no** alt text rather than invented description: the 48 Template Wall
tiles are a backdrop, and a Testimonial avatar sits beside the person's name in text, so both
render `alt=""`. The nav's 18px logo is the same case and #9 renders it `alt=""` too: the
wordmark `Browser.supply` sits inside the same link, so the site is named either way, and
alt text on the mark would announce it twice. The rule is that the site must be identifiable,
not that the image must carry the identification. The Reference's own alt on the eight Step 1 thumbnails is correct and useful,
and it is where the names of the other templates come from: Cora, Funnelz, Editr, Partnr,
Meraas, Reformr, Influence, plus Traction reused.

### 6.15 Scroll-Appear - measured

Every band rises and fades in once as it enters the viewport. Measured in #13, which closed
known unknowns 1 and 2; the numbers below are captures of the Reference, not choices.

Section 10 recorded these as unmeasurable because Motion drives them from its own rAF loop
where they do not surface in `getAnimations()` or computed styles. That is true of those two
APIs and not of the DOM: Motion writes an inline `style` attribute every frame, so a
`MutationObserver` on `style` records the entire curve. `docs/measure/probe-13-dense.mjs`
captures it, `docs/measure/fit-13-spring.mjs` fits it against Motion's own `spring()` solver.

| | travel | opacity | spring (mass 1) | settles |
| --- | --- | --- | --- | --- |
| Section | 30px | 0 -> 1 | stiffness 200, damping 30 | travel ~570ms, opacity ~755ms |
| nested block | 10px | 0 -> 1 | stiffness 86, damping 40 | ~2.3s |
| nested fade | none | 0 -> 1 | stiffness 86, damping 40 | ~2.5s |

**A spring, not a tween, and not a close call.** The best-fitting duration tween misses by
20x the RMS the spring achieves (0.0255 against 0.0012), and the two animated values stop at
different times - the 30px travel at ~570ms, the opacity at ~755ms - which only a per-value
rest threshold produces. Two independent dense captures put the least-squares argmin at
(204, 30.5) and (198, 29.75), which straddle the (200, 30) that ships.

**Ten of the thirteen Sections animate, and not all in the same way.** Eight take the Section
row above: the hero (6.2), the Template Wall (6.3), the featured Templates (6.4), the feature
bento (6.5), how it works (6.6), the social proof grid (6.7), pricing (6.9) and the founder
(6.11). The hero and the Wall are on that list despite #10 recording them as having no appear
at all - they are simply in the viewport on load, where it runs immediately, and a probe that
attaches after the page settles has already missed it.

The other two animate as blocks *inside* their band: the quiz CTA's card (6.10) at 10px and
the case study's card (6.8) as a fade. Their bands do not move. That distinction is the
Reference's, not a simplification - putting Scroll-Appear on the quiz CTA's band would carry
its ticker backdrop up with it, which the Reference never does.

The remaining three never animate: the nav (6.1) is fixed, the footer (6.12) stays put, and
the quiz modal (6.13) has an entrance of its own.

**The trigger is half the element, or half the viewport, whichever is smaller.** Sections of
619, 692, 1008, 1317 and 1694px all fired at half of whichever was smaller, themselves or the
900px viewport. That clamp is the measurement and it is also what keeps the page safe: Motion
hands `viewport.amount` straight to `IntersectionObserver`, which reports a ratio against the
element's *own* height, so a literal `amount: 0.5` on a band more than twice the viewport
tall - ordinary at phone widths - can never reach that ratio and the band stays at
`opacity: 0` for good. The Clone therefore drives the trigger itself rather than through
`whileInView`.

**Hover, known unknown 2.** Also a spring, also nothing that `transition` reports - every
hoverable element computes `transition-duration: 0s`. Links and buttons fade
`opacity: 1 -> 0.7` on a spring of stiffness ~535, damping ~37.5 (zeta ~0.80), settling in
~400ms through a ~1.3% undershoot. A Template card has no hover treatment on the card itself,
which is what #10 found; what moves is one of the two stacked screenshots, the top one fading
`opacity: 1 -> 0` over ~600ms on a spring of stiffness ~248, damping ~32. That confirms #10's
crossfade reading. Measuring any of it needs the quiz modal stripped repeatedly rather than
once - it reopens six seconds in, sits over the page, and makes every element report
`:hover=false`.

**Two Deviations.** `prefers-reduced-motion: reduce` removes the movement, arriving at the
same end state with no travel and no fade; the Reference honours no such thing. And the
resting state - `opacity: 0`, 30px down - is server-rendered, so without JavaScript nothing
would ever ask a Section to appear and the page would be blank below the nav. The Reference
has exactly that hole. A `<noscript>` rule in `layout.tsx` closes it.

---

## 7. Data layer

JSON in the repo, read by one typed data-access module that validates on read. Server
Components import that module directly. Route Handlers at `/api/*` wrap the same module. See
[ADR-0002](../blob/develop/docs/adr/0002-data-access-shape.md) for that asymmetry and
[ADR-0004](../blob/develop/docs/adr/0004-content-is-entities-and-references.md) for what
counts as content.

Built in #8 as eight files under `src/lib/content/data/`, one per Collection, validated by
Zod with the types derived from the schemas.

| Collection | Count | Fields |
| --- | --- | --- |
| templates | 3 featured | slug, name, category, price, currency, badge, href, screenshots[] |
| wallTiles | 16 unique, 48 placed | ordered media slugs only |
| testimonials | 12 (9 grid, 6 wall, 3 shared) | people{quote, name, avatar, rating} + grid[] + wall[] |
| features | 5 | slug, title, media |
| steps | 3 | slug, title, body, media[] |
| plans | 3 | slug, eyebrow, name, price, compareAt, currency, blurb, options[], included[], cta |
| stats | 4 | slug, value, label |
| links | 4 nav / 7 footer / 2 social | slug, label, href |

Six deliberate departures from the table as first written, all covered by ADR-0004:

- **No `kind` or `aspect` on wall tiles, and no `thumbnail` field.** Media is referenced by
  slug and resolved against the generated asset index, which already owns kind and intrinsic
  size. A committed copy of a generated value is a copy that goes stale.
- **No `features.span`, no `steps.number`, no footer column grouping.** Layout is not
  content; `span` changes per Breakpoint and `number` is the index.
- **`alt` is a content field** on every meaningful visual, and absent by design on
  decorative media (6.14).
- **Prices are integer minor units** with a currency code, so the Option recalculation in 6.9
  is integer arithmetic. Founder stats stay strings: `$100k+` is a marketing figure, not a
  price.
- **Every entity carries a stable slug.** Array order means Placement order only for
  Collections that appear exactly once on the page.
- **A Plan's Options and INCLUDED lines each carry an `icon` name** (added in #12). The
  Reference pairs a different glyph with every line of copy and reuses the same glyph
  wherever the same line appears, so the pairing is content; the paths are markup, in
  `plan-glyphs.ts`, and the schema cross-references the name against them the way it
  cross-references a media slug against the asset index. `included` is objects rather than
  strings for that reason alone.

Endpoints: `/api/templates`, `/api/testimonials`, `/api/plans`, all `force-static` and
verified prerendered in the build output. `/api/testimonials` returns the twelve people flat,
each carrying its Placements, rather than the page's two blocks - the blocks come from the
data layer, because layout does not belong in an HTTP contract.

---

## 8. Budgets and verification

### Performance

The Reference is slow, which makes this winnable. Measured: **FCP 3040ms**, load 3818ms,
**4.0 MB** transfer over **141** requests, of which **video alone is 2.43 MB (61%)**. One
hero-wall video is 839 KB.

| Metric | Reference | Target |
| --- | --- | --- |
| Lighthouse Performance (mobile) | not measured | **>= 95** |
| FCP | 3040 ms | **< 1200 ms** |
| LCP | not measured | **< 1500 ms** |
| Initial transfer | 4.0 MB | **< 1.0 MB** |
| Initial requests | 141 | **< 40** |
| CLS | not measured | **< 0.02** |

Levers, in order of payoff:

1. **Video deferral.** `preload="none"` + poster + IntersectionObserver play/pause removes
   all 2.43 MB from initial load. Nothing above the fold needs video.
2. **SSG.** Static HTML from Vercel's CDN.
3. **AVIF/WebP** via `next/image` with correct `sizes`.
4. **`next/font`** self-hosting Geist.
5. **Explicit aspect ratios on every wall tile**, or the grid will wreck CLS.

### Assets

Built by `npm run assets` from `scripts/assets/manifest.ts`, committed under `public/media`,
reached through `src/lib/media`.

Section 1 counts **106 `<img>` and 12 videos** from the element census. Deduplicated by
source URL those are **57 unique stills and 13 clips**. Most of the gap is the Template Wall,
whose 16 tiles are each placed three times and then reused - ten of them, moving - behind the
Quiz CTA, plus the Testimonial avatars shared between the Wall and the social proof grid. The
extra clip is the case study (6.8).

**Ten of the 57 the census missed**, and the reason is worth keeping: it was taken from the
loaded page, and the quiz modal (6.13) does not render for six seconds. Its backdrop is ten
screenshots that appear nowhere else on the page, added in #12 as `quiz/*`. Anything else
that only exists after a delay is still uncounted.

Measured in #7, and again in #12 with those ten:

| | Framer originals | Committed |
| --- | --- | --- |
| Video, 13 clips | 49.50 MB | 3.42 MB |
| Stills, 57 files | 22.94 MB | 1.50 MB, plus 13 generated poster frames |
| **Total** | **73.63 MB over 70 files** | **5.19 MB over 83 files**, 93.0% saved |

The modal's ten are the one group whose weight is not in the initial load at all: it mounts
on a timer, so they are fetched after everything the budget above covers.

Every entry carries width and height, so nothing renders without an aspect ratio (lever 5).
`next/image` re-encodes the stills again per request: `wall/tile-02` is 43 kB committed and
**18 kB** of AVIF at its 696px DPR-2 render width, 4.6 kB at phone width.

Four Deviations, all in the encode:

- Video is capped at its rendered size rather than served at source resolution. The founder
  clip is 4K on the Reference for a half-column player.
- Three 60fps clips are re-encoded at 30. All are decorative loops.
- `feature/hosting` is HEVC with an AAC track on the Reference, which several browsers
  cannot decode at all. It becomes H.264, muted, like the other twelve.
- `feature/hosting`'s poster is not its first frame, which is black - it fades up. See
  `scripts/assets/build.ts`.

Image fidelity is gated by `npm run assets:verify`: luma SSIM against the Framer original,
budget >= 0.98, worst graded asset 0.9840. Two dark, film-grained screenshots sit on a
recorded lower floor with the reasoning in `scripts/assets/verify.ts`. It needs the download
cache, so it runs beside `npm run assets` and is not a CI gate.

Each asset's measured render width per Breakpoint is recorded as `rendered` in the manifest,
and `next.config.ts` builds its `deviceSizes` ladder from those numbers. Sections #10 to #12
write each component's `sizes` against them.

### Fidelity

A local Playwright harness captures Clone and Reference at 1440/810/390, pixel-diffs per
Section, and emits a percentage table for the README.

#9 ran that comparison by hand over the two Sections that exist so far, and it earned its
keep: it is what found the footer's divider rule and `text-wrap: balance`, neither of which
a computed-style probe had reported. Measured after both fixes, pixels within a delta of 2,
with the Reference's quiz modal held out of the DOM:

| | nav | footer |
| --- | --- | --- |
| 1440 | 97.9% | 96.4% |
| 810 | 96.2% | 95.5% |
| 390 | 99.3% | 96.5% |

Every region's height matches the Reference to the pixel, and the wordmark and the Bundle
pill are byte-identical. The residual is a **1px rasterization offset** on the centred nav
links and the social icons: realigned by one pixel they match at 97.3%, so it is subpixel
positioning rather than layout. Worth knowing before #14 sets a threshold - a per-Section
gate gets no higher than about 97% on text-heavy bands without allowing a 1px tolerance.

It must, on **both** sides: freeze all video to poster frames, dismiss the quiz modal, and
let Scroll-Appear settle. Otherwise it measures video frames and animation timing rather than
layout.

Not a CI gate: it depends on a live third-party site.

Report the real number with its methodology. A measured "94% at 1440px, videos frozen, here
is the script" is worth more than an unbacked claim of 99%.

---

## 9. Testing

Component and snapshot tests are deliberately out of scope. They assert on markup, which the
fidelity harness already checks against the Reference itself rather than against a snapshot
of our own output.

- **Vitest**: data layer parsing and schema validation; Route Handler responses
- **Playwright E2E**: quiz modal open/dismiss, mobile menu, pricing Option selection
  recalculating, placeholder routing
- **axe**: accessibility scan inside the E2E run

The Playwright side arrived in #9 (`npm run test:e2e`, `playwright.config.ts`, specs in
`tests/e2e/`). It runs against a production build rather than `next dev`, because half of
what it asserts is about the build: that `/api/templates` is a prerendered file a browser
can fetch, and that the placeholder routes are static pages. Sections #12 and #13 add the
quiz modal and Option specs to it.

Model rules live in the schema, so a broken reference cannot reach a page. Measured Reference
facts live in `tests/content/reference-facts.test.ts` instead, so growing the content fails a
named test rather than the build - see ADR-0004.

### Checks

Five commands gate a PR, run before pushing: `typecheck`, `lint`, `format:check`, `test`,
`build`. `test:e2e` runs beside them and builds the app itself, so it is a sixth check
rather than a sixth gate. `build` is last of the five and is not redundant - content that no
test happens to read still fails there, because the data layer validates lazily (ADR-0004).

`format:check` could not pass on a Windows clone until #8. Prettier writes and checks LF while
`core.autocrlf=true` leaves a CRLF working tree, so every committed file failed locally and
would pass anywhere else; `.gitattributes` now pins LF in the working tree on every platform.

---

## 10. Known unknowns

Honest gaps. Measure during the build, do not guess.

1. ~~**Scroll-Appear parameters.**~~ **Closed in #13**, and built. Measured and specified in
   6.15: 30px of travel, opacity 0 to 1, on a spring of stiffness 200 and damping 30. The
   premise that it could not be measured was wrong in one specific way worth keeping - it is
   `getAnimations()` and computed styles that miss a Motion animation, not the DOM, because
   Motion writes an inline `style` attribute on every frame.
2. ~~**Hover states.**~~ **Closed in #13**, measured but *not* built, because the Reference's
   hover treatment is not part of any Section this build has shipped as animated. See 6.15:
   links and buttons fade to `opacity: 0.7` on a spring, and a Template card crossfades the
   top of its two stacked screenshots over ~600ms - which is what #10 suspected they were
   for. Nothing here is guesswork any more; it is a decision waiting to be taken.
3. ~~**Scroll-Appear is not yet built.**~~ **Closed in #13.** Ten of the thirteen Sections
   now carry it, which is every Section that carries it on the Reference - the nav, the
   footer and the quiz modal do not, and 6.15 lists which band gets which treatment. The
   hero and the Wall are among the ten: they were never missing it, they were simply in the
   viewport on load, where it runs immediately. A Fidelity capture
   now needs settling time on every Section: see `tests/e2e/settle.ts`, which triggers each
   island rather than waiting for one, because an island one pixel into view is below the
   trigger and will never settle on its own.
4. **Step 1's thumbnail speed is measured, its phase is not.** #11 timed the columns at
   29px/s over three samples and read the 816px between them off one capture. The speed is a
   measurement; the phase is a constant that depends on when you look, so the Clone reproduces
   the offset it measured rather than claiming the Reference starts there.
5. **No pause control on the three decorative travelling backdrops.** Step 1's thumbnail
   columns (6.6) and the two ticker backdrops (6.10, 6.13) stop under
   `prefers-reduced-motion` and offer nothing else. WCAG 2.2.2 wants a mechanism to stop
   moving content that runs past five seconds, and the Wall's Testimonials (6.3) have one; an
   axe scan cannot see the difference, which is why this is written down rather than left to
   be noticed. It is one mechanism across three Sections in two work packages - a page-level
   control, or one per band - and the choice belongs to whoever builds it rather than to
   whichever Section lands next.
6. **The tickers' speed is a desktop measurement.** 29.1px/s on the Quiz CTA and 30.4px/s in
   the modal are the columns' rate at the width they were measured at. Both strips wrap on
   half their own height, so a narrower Breakpoint carries a shorter strip at the same
   duration and therefore travels proportionally slower. Whether the Reference holds px/s or
   holds the proportion below 1200px is unmeasured.
7. **The Testimonial slide easing is approximated.** Sampling the Reference's transform
   every 40ms gives 3.2s between advances and ~1.4s of travel that is 52% done at 130ms and
   90% at 570ms. That is a spring; the Clone runs
   `cubic-bezier(0.16, 1, 0.3, 1)` over 1400ms, which tracks it closely but is a fit rather
   than a measurement.

---

## 11. Deliverables

- [ ] GitHub repository, work landed through `feature/*` to `develop` per `AGENTS.md`
- [ ] Deployed on Vercel, URL in the README
- [ ] `README.md`: live URL, setup, measured fidelity table, measured performance table vs
      the Reference, and every Deviation stated
- [ ] `ANSWERS.md`: the seven brief questions. Four are answered by this build (JSON
      structure, own API, slow connections, image optimization) and should cite files and
      measured numbers rather than describe intentions. Three are hypothetical (custom
      domain, admin panel, secure forms) and get concise design proposals.

## 12. Out of scope

- Any page other than the homepage and the placeholder routes
- A real quiz flow, checkout, blog, or CMS
- The Reference's analytics (GTM, Google Ads, `events.framer.com`)
- Dark/light theming: the Reference is dark only

---

## 13. Work breakdown

Each child issue lands on its own `feature/*` branch and opens a PR into `develop`, per
`AGENTS.md`. Roughly in dependency order.

- [ ] #6 Scaffold: Next.js, TypeScript, Tailwind theme tokens
- [ ] #7 Asset pipeline: download and re-encode images and video
- [ ] #8 Data layer: JSON store, typed access module, `/api` routes
- [ ] #9 Shell: nav, footer, mobile menu, placeholder routes
- [ ] #10 Sections: hero, template wall, featured templates
- [ ] #11 Sections: feature bento, how it works, social proof, case study
- [ ] #12 Sections: pricing, quiz CTA, founder, quiz modal
- [x] #13 Motion: scroll-appear across all sections
- [ ] #14 Fidelity harness and performance budget
- [ ] #15 Docs: README and ANSWERS.md

#6 and #7 unblock everything. #8 unblocks #9 through #12. #13 needs the sections in place.
#14 needs a complete page. #15 needs #14's numbers.
