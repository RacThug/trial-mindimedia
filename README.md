# browser.supply, cloned

A pixel-faithful rebuild of [browser.supply](https://browser.supply) in Next.js. The build is
specified by [`PRD.md`](PRD.md), which mirrors
[issue #5](https://github.com/RacThug/trial-mindimedia/issues/5); the Reference site, not the
document, is the authority (see [ADR-0003](docs/adr/0003-fidelity-measured-not-asserted.md)).

> This file is a stub. Issue #15 writes the rest of it - the live URL, setup, the measured
> fidelity table and the measured performance table against the Reference. What is here is
> the Deviations register, which several work packages are told to write into the README as
> they land, and which is easier to keep honest if it is never empty.

> **The page is indexable, and its copy is the Reference's.** `noindex, nofollow` was set in
> #6 so a verbatim lookalike could not compete with a live commercial site in its owner's own
> search results; it was removed at the owner's direction, which took Lighthouse SEO from 63
> to 100. If this is ever deployed somewhere a crawler can reach, that is the line to put
> back - `robots: { index: false, follow: false }` in `src/app/layout.tsx`.

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

### Four on the Wall's Testimonial rotation (PRD 6.3)

The Reference honours none of these, and each is a WCAG obligation rather than a preference:
the rotation stops under `prefers-reduced-motion`, it pauses while off screen, it pauses on
hover and on focus, and it has a keyboard-reachable pause control that is invisible until
focused - which is what WCAG 2.2.2 actually asks for, where the Reference's own prev/next
chevrons are `display: none` at every Breakpoint.

The page's three **decorative** travelling backdrops - Step 1's thumbnail columns (6.6) and
the two ticker backdrops (6.10, 6.13) - stop under `prefers-reduced-motion` and have **no
pause control**. That is a known gap rather than a decision: 2.2.2 covers them too. It is one
mechanism across three Sections in two work packages, so it is recorded in PRD section 10
rather than fitted to one of them.

### Two prose links are underlined (PRD 6.12, 6.14)

`Framer` and `Ramish Aziz` in the footer are white inside grey text with no other
distinction, which is colour alone at 1.4:1 and fails the axe scan. We underline them.

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

### The hero's Scroll-Appear runs in CSS, not in Motion (PRD 6.15, section 8)

Motion writes Scroll-Appear's resting state into the server markup, so the hero shipped at
`opacity: 0` and stayed there until 270 kB of JavaScript had arrived and hydrated: **LCP 3.9s
against an FCP of 0.9s** on Lighthouse's throttled mobile profile, three seconds of blank
page on a page whose HTML was complete in one.

The hero is the one Section on screen at load at every Breakpoint, so its appear never waited
for a scroll. It now runs the same measured spring as a CSS animation, converted to the same
`linear()` easing Motion itself hands the Web Animations API, and both measured settle times
survive. It is a Deviation only in mechanism: the motion is identical, and the hero paints at
a couple of hundred milliseconds with no JavaScript involved.

### The encode (PRD section 8)

Every committed asset is re-encoded rather than copied: WebP for stills, H.264 for clips,
capped at twice the largest measured render width. The Reference serves 73.6 MB of originals;
the Clone commits 5.2 MB. Clips carry `preload="none"` and start only once on screen, where
the Reference autoplays all thirteen at `preload="auto"`.
