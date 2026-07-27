# browser.supply clone

A single-page marketing site rebuilt to match a reference site as closely as possible,
produced as a front-end trial exercise. The product being described *on* the page
(Framer templates) is not the product being built. The thing being built is the page.

## Language

### The exercise

**Reference**:
The live browser.supply homepage, as captured on 2026-07-26. The single source of
truth for every visual and behavioural question.
_Avoid_: original, source site, the real site

**Clone**:
The page we are building. Judged against the Reference, not against a design of our own.
_Avoid_: our version, the copy, the replica

**Fidelity**:
How closely the Clone matches the Reference in layout, type, colour, and motion.
The brief's "99% similarity" is a Fidelity target.
_Avoid_: accuracy, similarity score, parity

**Deviation**:
A place where the Clone deliberately differs from the Reference. Every Deviation is a
decision that must be recorded and justified, never an accident.
_Avoid_: difference, change, improvement

### The content

**Collection**:
One of the eight named sets of content the page is built from: Templates, wall tiles,
Testimonials, features, steps, Plans, stats, links. A Collection is content that repeats,
is rendered as a list, or is served over the API. Prose appearing once in one layout is
not a Collection; it is markup.
_Avoid_: dataset, model, table, entity

**Placement**:
Where a piece of content appears on the page and in what order - the nine Testimonials of
the social proof grid in grid order, the six over the Template Wall in sequence order, the
sixteen wall tiles in Reference DOM order. Placement is content, and a Testimonial may hold
more than one. How that Placement is then arranged on screen is layout, not Placement.
_Avoid_: position, slot, ordering, arrangement

### The page

**Section**:
One of the thirteen full-width horizontal bands of the page, from the fixed nav down
to the footer. Sections stack; they never sit side by side.
_Avoid_: block, band, module, row

**Template**:
A product sold on the Reference (Selene, Zenna, Traction). Has a name, category,
price, and thumbnail. Note this is a *content* concept, not a code template.
_Avoid_: theme, product, item

**Template Wall**:
A dense static grid of Template thumbnails and looping videos used as a decorative
backdrop. Measured as static: the tiles do not travel. Any perceived movement is the
videos playing inside them.
_Avoid_: marquee, carousel, ticker, slider

**Plan**:
One of the three purchase options in the pricing Section (Single template, Bundle,
Custom project). Has a price, an optional compare-at price, a set of Options, and an
Included list.
_Avoid_: tier, package, pricing card

**Option**:
A selectable row inside a Plan (for example "Add Figma designs (+$39)"). On the
Reference these are inert; on the Clone they adjust the Plan price while defaulting to
the Reference's selection.
_Avoid_: add-on, extra, upsell, radio

**Testimonial**:
A customer quote with a star rating, name, and avatar. Nine unique Testimonials appear,
reused across two Sections.
_Avoid_: review, quote, social proof

**Eyebrow**:
The small uppercase label above a Section heading ("WHY CHOOSE A TEMPLATE?").
12px, weight 600, in a tinted pill.
_Avoid_: kicker, label, tag, pill

### Behaviour

**Scroll-Appear**:
The animation that plays once as a Section first enters the viewport. Verified present
on the Reference. The dominant motion on the page.
_Avoid_: reveal, fade-in, scroll animation, AOS

**Breakpoint**:
One of exactly three layout widths inherited from the Reference: desktop (≥1200px),
tablet (810-1199px), phone (≤809px).
_Avoid_: viewport, screen size, device

**Travelling backdrop**:
Decorative media that moves on a loop behind a Section's copy, for as long as the page is
open: Step 1's thumbnail columns, the Quiz CTA's four Template columns, and the quiz modal's
two. Distinct from the Template Wall, which looks like one and is static. A Travelling
backdrop has no canonical frame - two implementations start the same loop at different
offsets - which is why the Fidelity Harness hides one rather than comparing it.
_Avoid_: marquee, ticker, carousel

**Visual Fade**:
A `mask-image` that takes a box's own media out towards one edge, so the black page shows
through. Eighteen of them on the Reference (PRD 6.17), and they are what gives a title set
over a clip its contrast - nothing is ever laid *over* the media. Say Visual Fade for the
mask and reserve "scrim" for the quiz modal's backdrop, which really is a box drawn on top.
_Avoid_: scrim, overlay, gradient overlay, shadow

**Smooth Scroll**:
The wheel does not move the page; it moves a target the page then follows, over about a third
of a second (PRD 6.16). The Reference runs Lenis under Framer's page setting, the Clone its
own loop to the same measured curve. A Section is still where it always was - this is about
how the viewport gets there.
_Avoid_: scrolljacking, inertia, momentum, easing the page

**Fidelity Harness**:
The script that captures Clone and Reference side by side and reports a measured
Fidelity figure per Section. The only authority on whether a Fidelity claim is true.
Each figure is a pair - a strict pixel match and an SSIM - because one number cannot
separate "is it in the right place" from "does it look the same" (ADR-0005).
_Avoid_: visual regression, screenshot test, diff tool
