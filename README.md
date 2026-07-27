# browser.supply, cloned

A pixel-faithful rebuild of [browser.supply](https://browser.supply) in Next.js.

| | |
| --- | --- |
| **Live** | **https://trial-mindimedia.vercel.app** |
| **Source** | https://github.com/RacThug/trial-mindimedia |
| **The seven questions** | **[`ANSWERS.md`](ANSWERS.md)** |

The brief's seven additional questions are answered in **[`ANSWERS.md`](ANSWERS.md)**. Four of
them are about decisions this build already made, so they cite files and measured numbers
rather than describing intentions; three are hypothetical and are labelled as proposals.

The build is specified by [`PRD.md`](PRD.md), which mirrors
[issue #5](https://github.com/RacThug/trial-mindimedia/issues/5). Vocabulary is in
[`CONTEXT.md`](CONTEXT.md). **The Reference site, not the document, is the authority** - see
[ADR-0003](docs/adr/0003-fidelity-measured-not-asserted.md), and every value in the PRD is
measured from the live site rather than estimated.

> **The page is indexable, and its copy is the Reference's.** `noindex, nofollow` was set in
> #6 so a verbatim lookalike could not compete with a live commercial site in its owner's own
> search results; it was removed at the owner's direction, which took Lighthouse SEO from 63
> to 100. If this is ever deployed somewhere a crawler can reach, that is the line to put
> back - `robots: { index: false, follow: false }` in `src/app/layout.tsx`.

---

## Setup

Node 24 or newer.

```sh
npm install
npm run dev          # http://localhost:3000
```

Production build:

```sh
npm run build
npm run start
```

`next/font` downloads Geist from `fonts.googleapis.com` during `npm run build` and serves it
from our own origin, so nothing is fetched from Google at runtime - but a build on a machine
with no network fails. That is a Deviation, recorded below.

### Checks

```sh
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run format:check # prettier
npm test             # vitest, 776 tests
npm run test:e2e     # playwright, needs a running server
```

There is **no CI workflow**: these run locally before a PR. The two measurement harnesses are
deliberately not gates either, for the reasons under [Verification](#verification).

### Measurement

Both harnesses run against a production build, with the server already up:

```sh
npm run build && npm run start     # one terminal
npm run fidelity                   # another: Clone vs Reference, per Section
npm run perf                       # another: load cost and Lighthouse, both sides
```

`CLONE_URL` defaults to `http://localhost:3000` and `REFERENCE_URL` to `https://browser.supply/`.

The asset pipeline is separate and needs its download cache, so it is not part of a normal
run:

```sh
npm run assets         # download and re-encode into public/media
npm run assets:verify  # luma SSIM of every committed image against the Framer original
```

---

## What is in the repo

```
src/app/          routes. page.tsx is the homepage's thirteen Sections; api/* are three
                  force-static Route Handlers; templates/ is the one page that reads its
                  content over HTTP rather than importing it; the other six are
                  placeholder routes, so most off-page links land somewhere real
src/components/   sections/ one file per Section, ui/ the shared primitives, media/ the
                  deferred-video and Travelling backdrop machinery, shell/ nav and footer,
                  motion/ scroll-appear and smooth scroll
src/lib/content/  the eight JSON Collections, their Zod schemas, and the one typed module
                  every consumer imports (ADR-0004)
src/lib/media/    the generated asset index: every committed asset by slug, with its
                  intrinsic size
scripts/          assets/ the encode pipeline, fidelity/ the harness, perf/ the budget
tests/            vitest for units and contracts, playwright for E2E and the axe scan
docs/adr/         five architecture decision records
```

Everything else under `docs/` is gitignored local reference material: probe scripts,
captures, and the diff masks the fidelity harness writes.

---

## Verification

Both tables below are produced by scripts in this repo, and both are reproducible. Neither is
a CI gate, and the reasons differ: the fidelity harness depends on a live third-party site, so
as a merge gate it would fail for reasons that have nothing to do with this repo; the
performance budget *does* exit non-zero on a miss, but there is no workflow to run it in.

### Fidelity

`npm run fidelity` captures the Clone and the Reference at 1440/810/390, finds each Section on
both sides by anchoring on a heading and climbing to the outermost ancestor that has not
swallowed a neighbour's anchor, and pixel-diffs them band by band. It freezes all video to
frame 0 on **both** sides, dismisses the quiz modal, and lets Scroll-Appear settle - otherwise
it measures video frames and animation timing rather than layout.

**Each cell is two numbers: a strict pixel match and a luma SSIM.** One number cannot separate
"is it in the right place" from "does it look the same", and on the seven Sections carrying
video a strict pixel comparison measures the re-encode rather than the layout. See
[ADR-0005](docs/adr/0005-fidelity-is-two-numbers-and-a-coverage-figure.md).

Measured against the Reference on 2026-07-27. **Median of three consecutive runs on one
build**, because two cells wobble.

| Section | PRD | 1440 | 810 | 390 |
| --- | --- | --- | --- | --- |
| Nav | 6.1 | 97.8% / 0.971 | 96.1% / 0.948 | 99.2% / 0.995 |
| Hero | 6.2 | 97.0% / 0.958 | 95.3% / 0.934 | 96.4% / 0.979 |
| Template Wall | 6.3 | 48.2% / 0.796 | 39.0% / 0.777 | 15.9% / 0.212 |
| Featured templates | 6.4 | 84.9% / 0.957 | 80.9% / 0.906 | 78.5% / 0.946 |
| Feature bento | 6.5 | 80.7% / 0.882 | 82.4% / 0.873 | 76.2% / 0.829 |
| How it works | 6.6 | 95.1% / 0.981 | 92.6% / 0.939 | 90.0% / 0.919 |
| Social proof + case study | 6.7, 6.8 | 82.9% / 0.920 | 81.8% / 0.948 | 91.9% / 0.939 |
| Pricing | 6.9 | 98.3% / 0.979 | 97.8% / 0.970 | 95.5% / 0.931 |
| Quiz CTA | 6.10 | 98.9% / 0.986 | 96.2% / 0.947 | 93.4% / 0.923 |
| Founder | 6.11 | 80.6% / 0.917 | 69.4% / 0.740 | 77.5% / 0.680 |
| Footer | 6.12 | 96.7% / 0.944 | 94.1% / 0.946 | 95.5% / 0.972 |
| Quiz modal | 6.13 | 99.0% / 0.990 | 98.6% / 0.985 | 95.6% / 0.940 |

Twelve rows for thirteen Sections: 6.7 and 6.8 share one band and one framed grid on both
sides, so splitting them would mean inventing a boundary the Reference does not draw. 6.13
gets a capture pass of its own, because the main pass dismisses it.

**This is not the brief's 99%, and every low reading points at something already known.**
Reporting the real number with its methodology is worth more than an unbacked claim, which is
what ADR-0003 decided before any of it was measured.

- **The Sections in the nineties are the ones made of type. The ones in the sixties and
  seventies are the ones made of video**, where the diff masks show tile edges landing on the
  right pixel and the re-encode filling the inside. That is the same encode
  `npm run assets:verify` gates at SSIM 0.98, measured from the other direction - which is why
  those cells read far better on SSIM than on pixel match.
- **The Template Wall's 15.9% at 390 is the phone column-fill Deviation** recorded below: the
  Reference hand-arranges its three phone columns, the Clone fills into the measured height, so
  a different tile lands in each slot and every one of them differs.
- **Every band's height matches the Reference to the pixel or to two**, at every Breakpoint.
- **A cell moves a point or two between runs, and one thing makes it move more.** The Wall's
  Testimonial rotation swaps quote on a timer, so twenty seconds into a capture the two sides
  can be on different quotes; whether the harness catches that as travelling and excludes the
  band depends on when it sampled. The Wall at 810 read 72.7% on a run that missed it and 62.6%
  on one that caught it. Making that detection deterministic is the first thing to fix here.

Two corroborations worth keeping. The harness reads the nav at 97.8 / 96.1 / 99.2 against the
by-hand comparison #9 ran at 97.9 / 96.2 / 99.3, so it reproduces a measurement taken a
different way. And it is what caught the quiz CTA's `90vh`, the one height defect on the page.

### Performance

`npm run perf` measures both sides the same way and exits non-zero if the Clone misses a
target. **Initial load is everything fetched from navigation until the network has been quiet
for two seconds, with no scrolling** - deliberately generous to our own video-deferral trick,
since a clip an above-the-fold observer starts falls inside that window and is counted. Bytes
are `encodedDataLength` off the wire rather than decoded sizes. Viewport is 412x823 at DPR
2.625, the device Lighthouse's mobile preset emulates.

| Metric | Reference | Target | Clone | |
| --- | --- | --- | --- | --- |
| Lighthouse Performance (mobile) | not measured | >= 95 | 93 | **MISS** |
| First Contentful Paint | 3040 ms | < 1200 ms | 132 ms | pass |
| Largest Contentful Paint | not measured | < 1500 ms | 132 ms | pass |
| Initial transfer | 4.0 MB | < 1.0 MB | 0.51 MB | pass |
| Initial requests | 141 | < 40 | 39 | pass |
| Cumulative Layout Shift | not measured | < 0.02 | 0.000 | pass |

The Reference column is the reading taken during the original capture. The same script
re-measures the Reference at 412x823 as **3.20 MB over 111 requests, FCP and LCP 3160 ms, CLS
0.340**, which corroborates it at a narrower viewport.

**The Reference's own numbers move between runs and ours barely do**, which matters before
anyone re-measures and finds different figures: three runs read it at 2.38, 2.37 and 3.20 MB
with an FCP between 284 ms and 3160 ms, because it is a live site over the open internet with
a CDN cache that may or may not be warm. Ours is a local production build and reads the same
every time. Take the Reference column as an order of magnitude and the Clone column as a
measurement.

Every row except the Lighthouse one is **unthrottled**, on the connection and CPU the
Reference numbers were taken on. Under Lighthouse's simulated slow 4G and 4x CPU the same page
reports FCP 909 ms, LCP 3474 ms, TBT 20 ms and CLS 0. Both regimes are printed by
`npm run perf`, because a budget quoting one regime and scoring in the other reads better than
the page is.

**The Lighthouse line is a miss at a median 93, and the reason belongs here rather than
rounded off.** Every other audit is perfect - FCP 0.9s, TBT 10-30 ms, CLS 0, Speed Index 1.3s -
and the whole gap is a simulated LCP of 2.9s. The LCP element is the nav wordmark, a 115x26px
span, and what it waits for is the font; it makes no difference that it is the smallest text on
the page, because every candidate above the fold is text and `font-display: swap` repaints all
of them when the face lands. The same build has scored 88, 90, 91, 92, 93, 94 and 95 on a
developer machine, so `npm run perf` takes the median of five with a pause between runs and
prints every one. Against a `>= 95` target this is **short on the median and inside the noise
band**. `/blog`, a placeholder on the same shell, scores 98 - so what remains is the shell
rather than this page's content.

The nine techniques that produced these numbers, and what each one was actually worth, are
[question 5 in `ANSWERS.md`][q5].

[q5]: ANSWERS.md#5-what-techniques-would-you-use-to-ensure-the-website-loads-quickly-even-on-slow-internet-connections

### Assets

Every committed asset is re-encoded rather than copied, and the encode is gated on measured
quality rather than asserted: `npm run assets:verify` compares each image against the Framer
original at the committed file's own width and holds it to **luma SSIM >= 0.98**, worst graded
asset 0.9840.

| | Framer originals | Committed |
| --- | --- | --- |
| Video, 13 clips | 49.50 MB | 3.42 MB |
| Stills, 57 files | 22.94 MB | 1.47 MB, plus 0.17 MB of generated poster frames |
| **Total** | **73.63 MB over 70 files** | **5.07 MB over 83 files**, 93.1% saved |

---

## Deviations from the Reference

Places where the Clone deliberately differs. Each is a decision, and each says why.

### Alt text is authored, not copied (PRD 6.14)

The Reference ships 106 `<img>` of which **72 carry no `alt` attribute at all**, and three of
the 34 that do are defective: `JMBG, Browser.supply customer` on Jacob's avatar, doubled
commas on Nic's and Widya's, and `Selene Framer Template for AI SAAS companie` truncated
mid-word. We write our own.

Alt text is invisible, so this costs nothing in fidelity, and copying it would fail the axe
scan and contradict the brief's "reliable, production-ready" instruction. Decorative media
gets **no** alt rather than an invented description: the Template Wall's tiles, the Quiz
CTA's backdrop, a Testimonial avatar sitting beside the person's name, and the nav's logo
mark all render `alt=""`.

### Plan Options recalculate the price (PRD 6.9)

On the Reference these rows are inert - clicking `Add Figma designs` leaves the price at
$129, verified - and they are drawn in Framer's `Disabled` variant to match. In the Clone
they are live radios and the price follows: $129, $168, $499.

**The default selection is the Reference's own**, so an at-rest capture of the pricing band
is identical and the Deviation only appears once a reviewer clicks. The one pixel it costs at
rest is the chosen row's control, which the Reference draws at half opacity on the first card
and at full on the third; ours is live everywhere, so it takes the third card's look. A
control that responds to a click has no business rendering as disabled.

`Multi-page site` carries no `+$` label on the Reference, so its delta is 0 and the Custom
project recalculates to $2,495 either way. That is read off the copy, not assumed.

### The quiz modal is dismissible, traps focus, and stays shut (PRD 6.13)

The Reference's modal can be dismissed - Escape and an outside click both close it, measured -
but it offers **no visible control**, and it reopens on every navigation.

Ours is a native `<dialog>`, which brings the scrim, the top layer, Escape and a real focus
trap with it, plus a close button in the corner and a session flag so a dismissal sticks. A
dialog a pointer user cannot see their way out of is not something to reproduce.

Its six-second delay is *not* a Deviation: the Reference waits too, measured by sampling once
a second from `domcontentloaded` - nothing at five, up at six.

### The Template Wall's phone columns (PRD 6.3)

The Reference hand-arranges its three phone columns into a taller wall than a balanced fill
produces. The Clone sets the measured height and lets the columns fill into it, so which tile
lands in which column differs there. The wall reads the same, and the half where the
difference shows is under the fade anyway.

This is the single largest cell in the fidelity table above: **15.9% at 390**.

### Four on the Wall's Testimonial rotation (PRD 6.3)

The Reference honours none of these, and each is a WCAG obligation rather than a preference:
the rotation stops under `prefers-reduced-motion`, it pauses while off screen, it pauses on
hover and on focus, and it has a keyboard-reachable pause control that is invisible until
focused - which is what WCAG 2.2.2 actually asks for, where the Reference's own prev/next
chevrons are `display: none` at every Breakpoint.

The page's three **decorative** Travelling backdrops - Step 1's thumbnail columns (6.6) and
the Quiz CTA's and quiz modal's columns (6.10, 6.13) - stop under `prefers-reduced-motion`
and have **no
pause control**. That is a known gap rather than a decision: 2.2.2 covers them too. It is one
mechanism across three Sections in two work packages, so it is recorded in PRD section 10
rather than fitted to one of them.

### Two prose links are **not** underlined, and that is knowingly a defect (PRD 6.12, 6.14)

`Framer` and `Ramish Aziz` in the footer are white inside grey text with no other
distinction, which is colour alone at 1.7:1 against the prose around them - short of the 3:1
that would let colour carry it - so a reader who cannot tell those two greys apart cannot
find either link.

They were underlined from #9 to #14, as a Deviation of ours. #30 took the underline back out
at the owner's direction: this is a fidelity clone, the Reference draws them plain, and which
side of that trade to take is the owner's call rather than the implementer's.

What is kept is everything that costs nothing at rest - the Reference's own hover fade to 60%
white, and a focus-visible ring the Reference has no equivalent of. And the axe scan still
runs the rule: `tests/e2e/accessibility.spec.ts` accepts `link-in-text-block` **for these two
links by name**, so a third prose link drawn this way anywhere on the site fails the scan
rather than inheriting the exception. Putting it back is one line in `site-footer.tsx`.

### Geist is served as its latin subset (PRD section 3, section 8)

The `geist` npm package ships one file carrying latin, latin-ext and cyrillic together -
68 kB - and this page uses three characters past ASCII: the copyright sign and the acutes in
`Dávid` and `café`, all inside `latin`. Asking `next/font` for that subset gives 29 kB, and
the other two stay in the build unpreloaded.

It is a Deviation only in what reaches the browser; the typeface, its metrics and its
OpenType features are unchanged, and the fidelity table in PRD section 8 was re-measured
after the switch. The reason it was worth doing is what waits for the font: every largest-
contentful-paint candidate above the fold is text, and `font-display: swap` repaints each one
when the face lands, so 39 kB off the font took LCP from 3.9s to 2.9s on Lighthouse's
throttled mobile profile.

The cost is a build-time dependency on `fonts.googleapis.com`. Nothing is fetched from Google
at runtime - the face is downloaded during `next build` and served from our own origin - but
a build with no network now fails where it used to pass.

### The rating label is Geist, not Inter Display (PRD section 4)

The hero's `RATED 4.92/5` is the one step on the Reference that is not Geist. We render it in
Geist at the same 12/18/700/0.07em metrics rather than load a second family for twelve
characters. It costs about 5px of width on one label.

### The Template Wall's clips do not run on a phone (PRD 6.3, section 8)

At 412px the Wall's top edge sits 217px into the first viewport, so five of its six clips
start on load and cost **520 kB of a 1.0 MB budget** - 45% of it - for a backdrop that draws
each tile 120px wide under a fade. Below the tablet Breakpoint the `<video>` is
`display: none`, which is the mechanism rather than a shortcut: an element with no box never
intersects, so the IntersectionObserver never fires and not one byte of video is requested.

The poster underneath is the frame the clip opens on, so the Wall still reads as the
Reference's. What a phone loses is movement inside tiles too small to see it in - and what it
gets back is half the page's weight and six fewer video decoders.

### Nothing is prefetched (PRD section 8)

`next/link` fetches the payload of every internal link that scrolls into view, which on this
page was **seven requests** of a forty-request budget. Seven of the eight destinations are
the placeholder routes, which are a heading and a sentence; the eighth is `/templates`.
Spending a seventh of the budget to make a navigation nobody reviewing this page will perform
feel instant is the wrong trade.

### A Template card's hover screenshot is drawn only where a pointer can hover (PRD 6.4)

Each card carries two stacked screenshots and reveals the second on hover. A phone has no way
to reach it and downloaded all three anyway - 59 kB and 3 requests - because an image is lazy,
not conditional, and Chrome starts a lazy image well before it is on screen. `opacity: 0`
never stopped the fetch; `display: none` does.

### Scroll-Appear runs in CSS, not in Motion (PRD 6.15, section 8)

Not a Deviation from the Reference - the animation is the one #13 measured off it, to the
same spring and both the same settle times. What changed is what runs it, and it is here
because it reverses a decision the PRD recorded.

Motion writes Scroll-Appear's resting state into the server markup, so the hero shipped at
`opacity: 0` and stayed there until the page's JavaScript had arrived and hydrated: **LCP
3.9s against an FCP of 0.9s** on Lighthouse's throttled mobile profile, three seconds of
blank page on a page whose HTML was complete in one. The hero is on screen at load at every
Breakpoint, so its appear never waited for a scroll - only for the JavaScript that would tell
it there had not been one. It now paints with the first frame.

The rest of the page followed, and Motion left the build: 39 kB gzipped, and
`src/components/motion/spring-easing.ts` emits the same `linear()` easing Motion itself
generated for opacity and transform. **It did not move the Lighthouse score**, which is
recorded in PRD section 8 as a prediction that did not hold - the LCP here is bound by the
font, not by the JavaScript behind it. What it did buy is 40 kB and one animation mechanism
where there were two.

### The encode (PRD section 8)

Every committed asset is re-encoded rather than copied: WebP for stills, H.264 for clips,
capped at twice the largest measured render width. The Reference serves 73.6 MB of originals;
the Clone commits 5.07 MB. Clips carry `preload="none"` and start only once on screen, where
the Reference autoplays all thirteen at `preload="auto"`.

Four of those choices are Deviations in their own right, all in the encode: video is capped at
its rendered size rather than served at source resolution (the founder's clip is 4K on the
Reference for a half-column player); three 60fps decorative loops are re-encoded at 30; the
`feature/hosting` clip is HEVC with an AAC track on the Reference, which several browsers
cannot decode at all, and becomes muted H.264 like the other twelve; and its poster is not its
first frame, which is black.
