# Fidelity is measured by a local harness, and deliberately not a CI gate

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
