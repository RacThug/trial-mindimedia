# Fidelity is two numbers and a coverage figure, because one number cannot answer the question

ADR-0003 chose a pixel diff and expected font rasterisation to be the residual. Building the
harness in #14 showed that holds for the Sections that are type - the nav reads 97.9% at
1440, within a tenth of what #9 measured by hand - and does not hold anywhere else. Seven of
the thirteen Sections carry video or screenshots, and there a strict pixel comparison reports
the re-encode rather than the layout: the Template Wall's tiles land on exactly the right
pixel and score in the sixties, because H.264 at a quarter of the Reference's bitrate puts
three levels of difference inside every one of them.

So each cell of the emitted table carries two numbers. The **pixel match** is the strict one
ADR-0003 asked for, unchanged and directly comparable with #9's readings, scored against the
taller of the two Sections so a height difference costs the percentage rather than hiding in
a footnote. Beside it is the **mean luma SSIM** that `npm run assets:verify` has gated the
image encode with since #7, from the same implementation, so a number means the same thing
wherever this repo prints it. Read together they separate two questions a single number
conflates: is it in the right place, and does it look the same. Neither is dropped for
reading badly.

## Frame 0, not poster frames

ADR-0003 says the harness freezes video "to poster frames on both sides". Measuring the
Reference showed that is not available: **not one of its thirteen `<video>` elements carries
a `poster` attribute or has an image behind it.** They autoplay at `preload="auto"` and there
is nothing else to show. Frame 0 is the one still both sides can be held on, and it is what
our own posters are cut from, so it is what the harness freezes to - on the Clone that means
loading the clips first, because they ship `preload="none"` by design and a bare `pause()`
would leave a transparent element over a poster while the Reference showed real video.

## A travelling backdrop is not measured, and how much of the band it covered is printed

Three decorative backdrops travel for as long as the page is open (PRD 6.6, 6.10, 6.13), and
no amount of settling stops them. Left running they were the largest distortion the harness
could produce: the quiz CTA scored **9.6%** with two identical column stacks photographed at
two phases of the same loop.

Parking them at the start of their own cycle was tried and does not work. Both sides stop,
but "the start of the cycle" is a different frame on each - a Framer ticker begins part-way in
so it looks populated - and the band still scored 18%. There is no shared frame to freeze a
loop to in the way `currentTime = 0` names one frame of a clip. So those regions are hidden
on both sides and not compared, and the fraction of the band that went unmeasured is printed
in the cell as `(-n%)`. A percentage measured over 61% of a band is worth reading; the same
percentage passed off as the whole band is not.

Detecting them is by observation rather than by selector, which is what lets one routine do
this to Framer's markup and to ours: sample every transform with the band **in view**, wait,
and whatever moved is travelling. In view is load-bearing. A first attempt sampled from the
top of the page, found every backdrop on the Clone and none on the Reference - Framer's
tickers pause off screen and ours are CSS animations that do not - and hiding what only one
side was running made the score worse than leaving both alone.

The one thing this does not yet catch deterministically is the Template Wall's Testimonial
rotation, which swaps quote on a timer rather than travelling on a transform. It is caught
when the sample lands mid-transition and missed when it does not, and the Wall at 810 reads
62.6% on a run that caught it against 72.7% on one that did not. Both are honest readings of
the same page; they are not comparable, and closing that is the first thing to do to this
harness.

## Both sides have to lay out at the same width, and that has to be checked

A page with a scroll lock still on it has no scrollbar, so it lays out about 15px wider than
the same page that does. Every centred element then sits half that difference away from its
twin, and the diff reads as a page that moved rather than a harness that photographed two
different widths. It cost a run: the nav read **86.3% at 810 against 96.1% on either side of
it**, and the only visible evidence was a doubled wordmark in the mask.

So the harness does two things about it. It forces `overflow: visible` on both roots after
dismissing the modal, rather than clearing an inline lock that may never have been inline;
and it compares `document.documentElement.clientWidth` across the two captures and says
plainly that the column is not comparable when they differ. A number that is wrong for a
reason nobody can see is worse than no number.

## Consequences

The table is wider and takes more explaining than ADR-0003 imagined, and it is still not a CI
gate for the reason given there. What it buys is a number a reviewer can act on. Every low
reading in it now points at something real: the Template Wall's 16.7% at 390 is the phone
column-fill Deviation already recorded in the README, drawn plainly in the diff mask the
harness writes beside the table.
