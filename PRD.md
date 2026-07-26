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

Geist and Geist Variable. The entire scale is **weight 400** with uniform **-0.02em**
tracking. Headings are large and light, never bold.

| Token | Size | Line height | Tracking |
| --- | --- | --- | --- |
| `display` (H1) | 68px | 81.6px | -1.36px |
| `h2` | 56px | 67.2px | -1.12px |
| `h3` | 44px | 57.2px | -0.88px |
| `h4` (stat) | 32px | 41.6px | -0.64px |
| `h5` (card title) | 24px | 33.6px | -0.48px |
| `body` | 16px | 25.6px | normal |
| `eyebrow` | 12px | 20.4px | normal, **weight 600**, uppercase |

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

### Shape

- Container: **1360px** max width, centred
- Button: height **46px**, radius **48px**, padding `10px 20px`, 12px label
  - primary: white background, black text
  - secondary: `#1c1c1c` background, white text
- Nav: `position: fixed`, top 0, height **86px**, **fully transparent**, no backdrop blur, `z-index: 8`

---

## 5. Breakpoints

Measured, and they are Framer's defaults. **Tailwind's stock breakpoints are wrong for this
job and must be overridden**, or layout will diverge at exactly the widths a reviewer tests.

| Name | Range | H1 size |
| --- | --- | --- |
| desktop | >= 1200px | 68px |
| tablet | 810px - 1199px | 60px |
| phone | <= 809px | 44px |

Nav collapses to a hamburger at the tablet-to-phone boundary: 6 visible links become 1
control.

---

## 6. Section specification

Thirteen sections, top to bottom. Copy is verbatim from the Reference.

### 6.1 Nav (fixed)

Logo `Browser.supply`, links `Templates / Live examples / Support / Blog`, X and YouTube
icons, white `Bundle` pill.

**Verified: the nav never changes on scroll.** Background, height, transform and opacity are
identical at every scroll position, scrolling both up and down. Do not add a scrolled state.

Phone: logo left, hamburger right.

### 6.2 Hero

- Eyebrow pill `FRAMER TEMPLATES` (blue)
- H1 `No back-and-forth with AI. Pick, edit, publish.`
- CTAs: `Pick your template` (primary), `Or get matched with the perfect one` (secondary)
- Avatar stack + star + `RATED 4.92/5`

Phone: rating block moves **above** the buttons, buttons stack full width.

### 6.3 Template Wall

Dense grid of Template thumbnails and looping videos as a decorative backdrop, with
Testimonial cards floating over it.

**Verified static.** All 50 tiles tracked for 3 seconds at a fixed scroll position: **0
moved**. This is not a marquee and must not be built as one. The perceived motion is the
looping videos inside the tiles. Testimonials likewise do not auto-advance: identical quotes
after 5 seconds. They do carry **prev/next chevron controls**, so the block is a manual
carousel, not a static row (measured in #7: two 40x40 SVG arrows in the markup).

Grid, measured from the Reference's own layout arithmetic in #7:

| | Columns | Tile width |
| --- | --- | --- |
| desktop 1440 | 4 | `(100vw - 48px) / 4` = 348px |
| tablet 810 | 4 | `(800px - 36px) / 4` = 191px |
| phone 390 | 3 | `(400px - 16px) / 3` = 128px |

**16 unique tiles**, 10 images and 6 videos, each placed three times: 48 of the 50 tracked
tiles above carry media, so two of them do not. Framer's
own `sizes` attribute collapses to `100vw` below 1200px, so the Reference ships tablet and
phone visitors an image roughly four times wider than it draws. Do not copy that.

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
the asset index.

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
`Book a discovery call`).

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

Logo, tagline `Launch your online business with a premium Framer website template.`, X and
YouTube icons, two link columns (`Templates / Live examples / Bundle / Blog` and
`Quiz / Support / Privacy`), `© 2026 browser.supply. Framer website templates`, and
`Created by Ramish Aziz`.

### 6.13 Quiz modal

Fires on load. 1016x616 centred, `z-index: 10`, over a full-viewport backdrop. Eyebrow
`60-SECOND QUIZ`, H2 `Get 30% off the perfect template for your business`, body copy,
`Take the quiz`. Must be dismissible.

---

## 7. Data layer

JSON in the repo, read by one typed data-access module that validates on read. Server
Components import that module directly. Route Handlers at `/api/*` wrap the same module. See
[ADR-0002](../blob/develop/docs/adr/0002-data-access-shape.md).

| Collection | Count | Fields |
| --- | --- | --- |
| templates | 3 featured | name, category, price, currency, badge, thumbnail, href |
| wallTiles | 16 unique, 48 placed | slug, kind (image/video), aspect |
| testimonials | 12 (9 grid, 6 wall, 3 shared) | quote, name, avatar, rating |
| features | 5 | title, media, span |
| steps | 3 | number, title, body, media |
| plans | 3 | eyebrow, name, price, compareAt, blurb, options[], included[], cta |
| stats | 4 | value, label |
| navLinks / footerLinks | 4 / 7 | label, href |

Endpoints: `/api/templates`, `/api/testimonials`, `/api/plans`.

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
reached through `src/lib/media`. Measured in #7:

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
recorded lower floor with the reasoning in `scripts/assets/verify.ts`.

### Fidelity

A local Playwright harness captures Clone and Reference at 1440/810/390, pixel-diffs per
Section, and emits a percentage table for the README.

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

---

## 10. Known unknowns

Honest gaps. Measure during the build, do not guess.

1. **Scroll-Appear parameters.** The animation is verified to exist: a Section is absent on
   entering the viewport and present 1.6s later. But its exact duration, easing and travel
   distance are unmeasured. Motion drives it via its own rAF loop, so it does not surface in
   `getAnimations()` or computed styles. Needs frame-by-frame capture.
2. **Hover states.** Probing the Selene card found no transform on the card element itself,
   so whatever hover treatment exists sits on inner elements not yet isolated.

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
