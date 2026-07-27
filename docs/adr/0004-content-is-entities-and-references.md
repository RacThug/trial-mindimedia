# Content files hold entities and references; everything else is markup

The eight Collections under `src/lib/content/data` hold only content that repeats, is
rendered as a list, or is served over the API. Prose that appears exactly once in exactly
one layout - the H1, every Section heading, the case study's four paragraphs, the founder's
five - stays in the component that lays it out, and layout never appears in content at all.
That last rule is why the files lack three fields PRD section 7 lists: `features.span` is a
bento cell size that changes per Breakpoint, `steps.number` is the array index, and the
footer's two columns are a grouping of one links Collection. Storing a derived value is how
it comes to disagree with what it was derived from.

References are stored as slugs and resolved by the data access module, never duplicated.
A wall tile is the string `wall/tile-01`, and its `kind` and aspect ratio come from the
generated asset index rather than from the content file, so re-encoding an asset cannot
silently invalidate a number sitting in JSON. A Testimonial exists once in `people` and is
referenced by the ordered `grid` and `wall` Placement lists, so the Reference's deliberate
typos cannot diverge between the two Sections that show the same quote. Every entity carries
a stable slug; array order means Placement order only for Collections that appear exactly
once on the page.

Alt text is authored by us, not copied. The Reference ships 106 `<img>` of which 72 have no
`alt` attribute at all, and three of the 34 that do are defective: `JMBG, Browser.supply
customer` on Jacob's avatar, `Nic, , Browser.supply customer` with a doubled comma, and
`Selene Framer Template for AI SAAS companie` truncated mid-word. Copying that would fail
the axe scan in PRD section 9 and contradict the brief's "reliable, production-ready"
instruction, and alt text costs no pixels, so the Deviation is free. Media that is genuinely
decorative gets no alt field: the 48 Template Wall tiles are a backdrop, and a Testimonial
avatar sits beside the person's name in text, so both render `alt=""` rather than making a
screen reader recite them.

## Consequences

Accessors are `async` even though today they resolve imported JSON, so that moving content
to a CMS changes the source and the failure policy without touching a single call site. This
costs nothing in performance - an async Server Component still prerenders, because the data
does not depend on the request - and it is the seam the admin-panel answer depends on. The
cost it does carry is that validation is now lazy: a Collection no page reads is no longer
parsed during `next build`, so the Vitest suite parses all eight files to keep that guarantee
in CI rather than in the build.

The trade this accepts is that changing a heading means editing a component. For a Clone with
frozen, verbatim copy that is correct; for a product with an editorial team it would be
wrong, and it is the one rule here that a greenfield build should invert.
