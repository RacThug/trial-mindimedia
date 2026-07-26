# browser.supply, cloned

A pixel-faithful rebuild of [browser.supply](https://browser.supply) in Next.js. The build is
specified by [`PRD.md`](PRD.md), which mirrors
[issue #5](https://github.com/RacThug/trial-mindimedia/issues/5); the Reference site, not the
document, is the authority (see [ADR-0003](docs/adr/0003-fidelity-measured-not-asserted.md)).

> This file is a stub. Issue #15 writes the rest of it - the live URL, setup, the measured
> fidelity table and the measured performance table against the Reference. What is here is
> the Deviations register, which several work packages are told to write into the README as
> they land, and which is easier to keep honest if it is never empty.

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

### The encode (PRD section 8)

Every committed asset is re-encoded rather than copied: WebP for stills, H.264 for clips,
capped at twice the largest measured render width. The Reference serves 73.6 MB of originals;
the Clone commits 5.2 MB. Clips carry `preload="none"` and start only once on screen, where
the Reference autoplays all thirteen at `preload="auto"`.
