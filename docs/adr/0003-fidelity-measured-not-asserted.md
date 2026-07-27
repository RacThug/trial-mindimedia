# Fidelity is measured by a local harness, and deliberately not a CI gate

> **Both decisions stand. Three details of how the harness does it turned out to be wrong,
> and [ADR-0005](0005-fidelity-is-two-numbers-and-a-coverage-figure.md) records why.** They
> are left as written below - each was arrived at by trying the obvious thing first, and what
> the obvious thing did when measured is the useful part. See
> [What building it changed](#what-building-it-changed-14) at the foot of this file.

The brief asks for "at least 99% similarity", which as written is unfalsifiable. Rather than
assert it, a Playwright harness captures both the Clone and the Reference at all three
breakpoints and pixel-diffs them per Section, producing a real percentage that ships in the
README alongside the methodology that produced it.

Two constraints make the number meaningful rather than noise, and both are deliberate: the
harness freezes all video to poster frames on **both** sides, and settles Scroll-Appear and
dismisses the quiz modal on both sides. Without those it would measure video frames and
animation timing instead of layout.

## Consequences

The reported figure will be honest rather than flattering, and it will not be 99%. Font
rasterisation alone guarantees a residual diff. A measured "94% at 1440px, videos frozen,
here is the script" is worth more to a reviewer than an unbacked claim of 99%.

The harness is explicitly **not** wired into CI. It depends on a live third-party site, so as
a merge gate it would fail for reasons unrelated to our code, and a gate that cries wolf gets
ignored or disabled.

## What building it changed (#14)

Both decisions above survive: the number is measured rather than asserted, and it is still
not a CI gate. Three assumptions about how did not, and all three failed the same way - the
obvious thing was tried, measured, and found to be measuring something other than layout.
[ADR-0005](0005-fidelity-is-two-numbers-and-a-coverage-figure.md) is the full account.

**"A real percentage" is two numbers and a coverage figure.** A single strict pixel diff
holds for the Sections that are type - the nav reads 97.9% at 1440, within a tenth of what #9
measured by hand - and reports the video re-encode rather than the layout everywhere else.
The Template Wall's tiles land on exactly the right pixel and score in the sixties. So each
cell carries the strict pixel match beside the mean luma SSIM, because one number cannot
separate *is it in the right place* from *does it look the same*.

**"Poster frames" was not available.** Not one of the Reference's thirteen `<video>` elements
carries a `poster` attribute or has an image behind it; they autoplay at `preload="auto"` and
there is nothing else to show. Frame 0 is the one still both sides can hold, and it is what
our own posters are cut from, so it is what the harness freezes to.

**Two constraints were not enough.** Three travelling backdrops never settle, and left
running they were the largest distortion the harness could produce - the quiz CTA scored
**9.6%** on two identical column stacks photographed at two phases of one loop. They are
hidden on both sides and the unmeasured fraction of the band is printed in the cell.
A fourth constraint joined them: both sides must lay out at the same width, or a page with a
scroll lock still on it measures ~15px wider than its twin and every centred element reads as
having moved. That one cost a run - the nav read 86.3% at 810 against 96.1% either side of
it.

**The table ships in [PRD section 8](../../PRD.md#8-budgets-and-verification), not the
README.** The README was cut to what a reviewer opens it for in #39 and points there; the
diff masks land in `docs/measure/fidelity/` beside it.
