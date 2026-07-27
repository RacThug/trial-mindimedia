# Answers to the seven questions

Questions 1, 2, 5 and 7 are decisions this build already made, so they cite the file and the
measured number rather than describing an intention. Questions 3, 4 and 6 are about things
this project does not contain, so they are proposals and say so.

Methodology for every figure below is in [`README.md`](README.md#verification); the full
tables are in [PRD section 8](PRD.md#8-budgets-and-verification).

---

## 1. If you use JSON data, how would you structure it to support future scalability and maintainability?

**The structure that matters is the seam, not the file layout.** A JSON file can be reshaped
in an afternoon; fifty components that each know where content lives cannot.
[ADR-0004](docs/adr/0004-content-is-entities-and-references.md) sets five rules, and
[`src/lib/content/index.ts`](src/lib/content/index.ts) is the only door.

- **One typed access module.** Eight Collections, and nothing outside `src/lib/content/`
  imports the JSON - Sections call `getTemplates()` and get typed objects back.
- **Validation at the boundary.** Every file passes through
  [`parse.ts`](src/lib/content/parse.ts) against a Zod schema, and the types are derived
  *from* the schemas, so the two cannot drift. All issues are reported at once, each naming
  its own file and path.
- **References are slugs, resolved centrally.** A wall tile is `wall/tile-01`; its kind and
  intrinsic size come from the generated asset index. A Testimonial exists once under
  `people` and is pointed at by two ordered Placement lists, so a quote shown in two Sections
  cannot diverge between them.
- **A stable slug on every entity.** Array position means Placement order and nothing else.
- **No derived data in the files.** No `kind` or `aspect` on wall tiles, no `features.span`
  (layout, and it changes per Breakpoint), no `steps.number` (the array index). Prices are
  integer minor units, so the pricing Option recalculation is integer arithmetic.

**How it scales past the repo:** the accessors are already `async`, so a CMS-backed adapter
changes what happens inside those eight functions and nothing at any call site. The schemas
stay where they are and keep validating; what changes is the source and the failure policy.
This costs no performance - an async Server Component still prerenders - but validation became
lazy, so `loadAllContent()` and the Vitest suite parse all eight files to put that back.

**The rule a greenfield build should invert:** single-use prose stays in components. Correct
for a clone with frozen copy, wrong for a product with an editorial team, and the first thing
question 4 has to fix.

---

## 2. If you decide to create your own API, which technology or framework would you use and why?

**Next.js Route Handlers, because the API is not a separate service.** Three live endpoints:
[`/api/templates`](https://trial-mindimedia.vercel.app/api/templates),
[`/api/testimonials`](https://trial-mindimedia.vercel.app/api/testimonials),
[`/api/plans`](https://trial-mindimedia.vercel.app/api/plans).

- **It shares the content module, the schemas and the types with the pages**, so an endpoint
  cannot drift from what the page renders.
  [`tests/api/routes.test.ts`](tests/api/routes.test.ts) asserts each body is exactly what the
  data layer exports - the property [ADR-0002](docs/adr/0002-data-access-shape.md) leans on. A
  separate Express service would have meant a second deployment, a second dependency tree, and
  a second definition of what a Template is.
- **`dynamic = 'force-static'`** prerenders all three into the build: served from the CDN with
  no function invocation, marked `○ (Static)` in the build output, and answering with
  `x-vercel-cache: HIT` on the deployment.
- **`/templates` consumes it over HTTP** rather than importing the module, so the endpoint is
  demonstrably consumable - and handles the failure, with a `role="alert"` and a retry.

**Deliberately left out**, since these are read-only prerendered GETs with no origin compute:
no versioning (one consumer, same build), no rate limiting (nothing to exhaust - it is a
static file on a CDN), no auth (the data is public marketing copy), no CORS policy. Every one
of those becomes wrong the moment an endpoint accepts a write, returns anything personalised,
or gains a second consumer on its own release cycle.

---

## 3. How would you configure a custom domain to point to your deployed project on Vercel?

*Proposal - this project runs on `trial-mindimedia.vercel.app` with no custom domain.*

1. **Add both `clientwebsite.com` and `www.clientwebsite.com`** in Project Settings, and pick
   one as canonical; Vercel permanently redirects the other. Two hosts serving one page splits
   your ranking and your analytics.
2. **Create the records Vercel prints** - not ones copied from a blog post, because they
   change. `www` takes a CNAME. The apex cannot (DNS forbids a CNAME alongside the zone's SOA
   and NS records), so it takes Vercel's A record, or an ALIAS/flattened CNAME where the
   registrar offers one - preferable, since an A record pins you to an address. If a **CAA**
   record exists it must permit `letsencrypt.org`, or issuance fails silently.
3. **TLS is automatic** once the records resolve. Drop the TTL to 300s the day before the
   cutover so a mistake is cheap to undo.
4. **Check the subdomains first.** This deployment already sends
   `strict-transport-security: max-age=63072000; includeSubDomains; preload`, which tells
   browsers to refuse plain HTTP for the domain *and everything under it* for two years. Free
   on a `.vercel.app`; not free on a client apex where `mail.` or an old `staging.` host may
   not serve HTTPS.

Preview deployments keep their generated URLs, which is what you want - preview builds should
never be indexable.

---

## 4. If your project requires an admin panel to manage the website content, what technologies and approaches would you choose?

*Proposal - this project has no admin panel, but it has the seam one attaches to.*

**The important decision was already made in question 1.** Every Section reads through eight
`async` accessors and nothing outside that module knows the source is JSON. An admin panel
changes those eight functions and touches no Section.

- **A headless CMS, not a hand-built panel.** Payload if the content model should live in the
  same repo and TypeScript, Sanity if non-technical editors matter more than owning the
  hosting. Either way you get the boring half - auth, roles, media handling, draft versus
  published, revision history, an audit trail - which is the half that takes the weeks.
- **Keep the Zod schemas as the contract.** A CMS's generated types describe what it *can*
  store; ours describe what this site can *render*. Different questions, both worth asking, so
  remote documents validate at the same boundary local files do today.
- **The failure policy is the actual design work.** ISR with on-demand revalidation
  (`revalidateTag` from a publish webhook) keeps pages static and CDN-served while editors see
  changes in seconds; serve stale if the CMS is unreachable; draft mode for preview.
- **Invert question 1's admitted rule first** - an editor cannot change a heading that is JSX.

**What I would not do:** write a custom CRUD UI, or let anything mutate content at request
time. The performance comes from being static, and a panel that makes pages dynamic trades the
product's main quality for the convenience of whoever built the panel.

---

## 5. What techniques would you use to ensure the website loads quickly even on slow internet connections?

The Reference is the control - same page, same content, measured by the same script:

| | Reference | Clone |
| --- | --- | --- |
| First Contentful Paint | 3040 ms | **132 ms** |
| Initial transfer | 4.0 MB | **0.51 MB** |
| Initial requests | 141 | **39** |
| Cumulative Layout Shift | 0.340 | **0.000** |

Nine techniques got it there, in order of what each was actually worth:

1. **Prerender everything, serve from a CDN.** Static HTML, no function invocation, confirmed
   on the deployment by `x-nextjs-prerender: 1`. On a slow connection an avoided round-trip
   beats saved kilobytes.
2. **Defer video.** Thirteen clips at `preload="none"` behind a poster, started by an
   IntersectionObserver ([`looping-video.tsx`](src/components/media/looping-video.tsx)):
   **2.43 MB** out of initial load. The Reference autoplays thirteen at `preload="auto"`.
3. **Skip video that cannot be seen.** The Template Wall's clips are `display: none` on a
   phone - **520 kB, 45% of the budget**. An element with no box never intersects, so nothing
   is requested; `opacity: 0` would still have fetched.
4. **Turn off prefetching.** `next/link` was fetching all seven placeholder routes on scroll:
   **7 of 55 requests** for a navigation nobody will perform.
5. **Subset the font.** Geist ships latin, latin-ext and cyrillic in one 68 kB file; this page
   uses three characters past ASCII, all latin. The subset is **29 kB**, and those 39 kB took
   **LCP from 3.9s to 2.9s** - every LCP candidate above the fold is text, and `swap` repaints
   each one when the face lands.
6. **Keep the render path off JavaScript.** The real defect found here: Motion writes
   Scroll-Appear's resting state into the *server* markup, so the hero shipped at `opacity: 0`
   until 270 kB of JavaScript hydrated - **LCP 3.9s against FCP 0.9s**, three seconds of blank
   page on HTML that was complete in one. The same measured spring now runs as a CSS animation
   ([`spring-easing.ts`](src/components/motion/spring-easing.ts)) and needs no JavaScript.
7. **Ship less JavaScript.** Dropping Motion took transfer from 0.54 to 0.50 MB and **did not
   move the score** - the LCP is bound by the font on the critical path, not the JavaScript
   behind it. Recorded because it was predicted to, and because the same 39 kB in technique 5
   bought a full second. Payload size alone does not tell you which you have.
8. **Intrinsic size on every image and video**, so nothing reserves space late. **CLS 0.000
   against 0.340** - and layout shift is *caused* by slowness, so a fast connection hides it.
9. **Do not fetch what a device cannot reach.** A card's hover screenshot is `display: none`
   where there is no pointer: 59 kB and 3 requests.

**The honest miss:** the Lighthouse Performance target was `>= 95` and the median of five is
**93**. Every other audit is perfect - FCP 0.9s, TBT 10-30ms, CLS 0, Speed Index 1.3s - and the
whole gap is the simulated LCP on the nav wordmark waiting for the font. The same build has
read 88 through 95 across runs, so this is short on the median and inside the noise band.

**One thing the Reference does that this does not:** its own `sizes` collapses to `100vw`
below 1200px, so tablet and phone visitors get an image about four times wider than it draws.
The device on the worst connection is served the most.

---

## 6. If you implement a form, how would you securely send the data to the backend server?

*Proposal, and the honest version first: **this build has no form that submits anywhere.***
The only `<input>` is the one each pricing Option is drawn as
([`plan-card.tsx`](src/components/sections/plan-card.tsx)), and selecting one recalculates a
price in the browser and posts nothing.

**The transport is the least interesting part of the question**, and it is where most answers
stop. HTTPS is not optional and Vercel gives it to you. What protects a submission happens on
either side of the wire.

- **Submit to a Server Action.** The function runs on the server and its body never reaches
  the browser, so no key or webhook URL can leak into the bundle - and Next performs an Origin
  check on every invocation, which is CSRF protection you did not have to remember. A
  hand-rolled `POST` handler needs that written explicitly.
- **Validate on the server with the same schema**, and treat only the server copy as real. The
  client's is a courtesy to the person typing; [`parse.ts`](src/lib/content/parse.ts) is
  already this pattern - one place where input stops being untrusted.
- **Keep secrets server-side.** Anything without `NEXT_PUBLIC_` stays out of the bundle; the
  Server Action calls the third party, so the browser never learns the endpoint exists.
- **Rate-limit and gate the bots.** An unmetered public form is a billing target. Per-IP limit
  at the edge, plus a privacy-respecting challenge (Turnstile over reCAPTCHA) and a honeypot.
- **Store the minimum, log none of it.** Not to logs, not to error reports. Data never
  collected cannot leak, and that control survives every mistake downstream.
- **Say little in the response.** "If that address is registered, we have sent an email"
  rather than "no such account", with success and failure the same shape.
- **Set the headers.** HSTS is already on; a form would want a CSP with a nonce, the strongest
  single mitigation against a script injected elsewhere on the page reading what is typed.

---

## 7. What strategies do you use to optimize images for performance without sacrificing quality?

**"Without sacrificing quality" is the half that needs a measurement rather than an
assertion.** `npm run assets:verify` compares every committed image against the Framer
original at the committed file's own width and gates on **luma SSIM >= 0.98**; the worst
graded asset is **0.9840**. Four dark, film-grained screenshots sit on individually recorded
lower floors, with the reasoning in [`verify.ts`](scripts/assets/verify.ts) rather than the
global budget being loosened - and those floors still gate.

| | Framer originals | Committed |
| --- | --- | --- |
| Video, 13 clips | 49.50 MB | 3.42 MB |
| Stills, 57 files | 22.94 MB | 1.50 MB, plus 13 posters |
| **Total** | **73.63 MB over 70 files** | **5.19 MB over 83 files**, 93.0% saved |

- **Two passes.** `npm run assets` re-encodes to WebP at build time; `next/image` re-encodes
  again per request width, AVIF first. `wall/tile-02` is 43 kB committed, **18 kB** of AVIF at
  its 696px desktop render width, **4.6 kB** at phone width.
- **Cap the source at twice the largest width it is ever drawn at.** The Reference serves the
  founder's clip in 4K for a half-column player.
- **Build the `deviceSizes` ladder from measured render widths.**
  [`next.config.ts`](next.config.ts) lists nine rungs, each a real render width at DPR 2.
  `next/image` serves the smallest rung at or above what `sizes` resolves to, so a ladder that
  does not match the layout ships every image slightly too large, forever, and nothing reports
  it.
- **Write a real `sizes` on every image.** This is where the Reference loses most of its
  weight - see question 5.
- **Intrinsic dimensions on everything.** The Template Wall alone is 48 tiles; a grid
  reflowing as they load would spend the whole CLS budget on the first screen.
- **Defer, and skip where the pixels cannot be seen** - lazy below the fold, clips on
  intersection, and nothing at all for the Wall's phone clips or an unreachable hover image.
- **Choose the metric that matches the eye.** Luma SSIM tracks the channel the eye resolves
  detail in. RGB RMSE was rejected because it measures WebP's 4:2:0 chroma subsampling rather
  than the encode - one avatar sits at 4.8 at quality 85 and still 3.9 at 98 - and peak error
  because single pixels on hard edges say nothing about what a person notices.
- **Know where to stop.** Quality is pinned to 85-95; past that `next/image` re-encodes on top
  anyway, so one tile reaches just 0.9825 at quality 98 for 129 kB against 61 kB.

**The same thinking on video**, which was 61% of the Reference's transfer: clips capped at
rendered size, three 60fps decorative loops re-encoded at 30, and one HEVC-with-AAC clip
several browsers cannot decode becoming muted H.264. All recorded as Deviations in the
[README](README.md#deviations-from-the-reference).
