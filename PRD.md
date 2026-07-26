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

Geist and Geist Variable. Every heading is **weight 400** with uniform **-0.02em** tracking -
large and light, never bold. Interactive text is **500** and the Eyebrow is **600**; those
two are the whole of the rest of the scale.

| Token | Size | Line height | Tracking | Weight |
| --- | --- | --- | --- | --- |
| `display` (H1) | 68px | 81.6px | -1.36px | 400 |
| `display-tablet` | 60px | 72px | -1.2px | 400 |
| `display-phone` | 44px | 52.8px | -0.88px | 400 |
| `h2` | 56px | 67.2px | -1.12px | 400 |
| `h2-tablet` | 48px | 57.6px | -0.96px | 400 |
| `h2-phone` | 36px | 43.2px | -0.72px | 400 |
| `h3` | 44px | 57.2px | -0.88px | 400 |
| `h4` (stat) | 32px | 41.6px | -0.64px | 400 |
| `h5` (card title) | 24px | 33.6px | -0.48px | 400 |
| `body` | 16px | 25.6px | normal | 400, or **500** for a link or button label |
| `body-sm` | 14px | 22.4px | normal | 400 |
| `eyebrow` | 12px | 20.4px | normal | **600**, uppercase |

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

**Three Deviations on the motion**, none of which the Reference honours: the rotation stops
under `prefers-reduced-motion`, pauses on hover and on focus, and only runs on screen. The
first is WCAG 2.2.2 - moving content a visitor cannot stop - and the second keeps a quote
from sliding out from under someone reading it.

The same 10 images, without the videos, form the Quiz CTA backdrop (6.10).

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

### 6.6 How it works

Eyebrow `HOW DOES IT WORK?`, H2 `Go live within 1 hour, not months, weeks or even days.`

Three step cards with orange `STEP 1/2/3` badges:

1. `Pick a template.` / `Browse the collection of expert-crafted templates and select one best for you.`
2. `Make it yours.` / `Change text, customize colors, and swap images with ease.`
3. `Go live instantly.` / `Launch your site in seconds with just one click, all in one platform.`

Step 1's visual is a grid of **eight** Template thumbnails at a flat 275px, one of which is
the Traction card's own screenshot reused. Steps 2 and 3 are videos of the Framer editor and
its publish button.

### 6.7 Social proof grid

Eyebrow `HAS ANYONE ELSE TRIED IT?`, H2 `Trusted by 2k+ customers around the globe.`,
`See real customer websites` button, 3x3 Testimonial grid.

Nine Testimonials: Nic, Renan, Emon, Widya, Dávid, Mark, Samar, Aba, Nonso. Each has 5
stars, quote, avatar, name. Note `Dávid` carries an acute accent, and the Reference contains
two genuine typos in quotes (`custmize`, and `The templates is so well designed`). **Reproduce
them verbatim.** They are content, not defects.

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

H2 `Not sure which template is for you?` over a dimmed Template Wall backdrop, plus
`Take the quiz`.

### 6.11 Founder

Eyebrow `WHO IS THE DESIGNER?`, H2 `Meet the creator behind the sites.`,
`Book a coaching call with me`.

Looping founder video left; orange `FOUNDER` badge and H3 `Hey, I'm Ramish / Designer & Creator`
right, with five paragraphs. Then four stat tiles in a 2x2: `6+` Years building sites,
`100+` Websites made, `$100k+` Revenue made in Framer, `2,000+` Templates sold.

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

Fires on load. 1016x616 centred, `z-index: 10`, over a full-viewport backdrop. Eyebrow
`60-SECOND QUIZ`, H2 `Get 30% off the perfect template for your business`, body copy,
`Take the quiz`. Must be dismissible.

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

Five deliberate departures from the table as first written, all covered by ADR-0004:

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
source URL those are **47 unique stills and 13 clips**. Most of the gap is the Template Wall,
whose 16 tiles are each placed three times and then repeated wholesale behind the Quiz CTA,
plus the Testimonial avatars shared between the Wall and the social proof grid. The extra
clip is the case study (6.8).

Measured in #7:

| | Framer originals | Committed |
| --- | --- | --- |
| Video, 13 clips | 49.50 MB | 3.42 MB |
| Stills, 47 files | 12.70 MB | 1.28 MB, plus 13 generated poster frames |
| **Total** | **62.20 MB over 60 files** | **4.70 MB over 73 files**, 92.4% saved |

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

1. **Scroll-Appear parameters.** The animation is verified to exist: a Section is absent on
   entering the viewport and present 1.6s later. But its exact duration, easing and travel
   distance are unmeasured. Motion drives it via its own rAF loop, so it does not surface in
   `getAnimations()` or computed styles. Needs frame-by-frame capture.
2. **Hover states.** Probing the Selene card found no transform on the card element itself,
   so whatever hover treatment exists sits on inner elements not yet isolated. #10 narrowed
   it without closing it: both screenshots are stacked in the same box, so a crossfade is
   what they are for, but its duration and easing are still ours.
3. **Scroll-Appear is not yet built.** #10 shipped the first three Sections without it; the
   hero, the Wall and the featured Templates are present on load. It lands with the
   parameters in item 1, and is the reason a Fidelity capture of these Sections needs no
   settling time yet.
4. **The Testimonial slide easing is approximated.** Sampling the Reference's transform
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
- [ ] #13 Motion: scroll-appear across all sections
- [ ] #14 Fidelity harness and performance budget
- [ ] #15 Docs: README and ANSWERS.md

#6 and #7 unblock everything. #8 unblocks #9 through #12. #13 needs the sections in place.
#14 needs a complete page. #15 needs #14's numbers.
