# Answers to the seven questions

The brief's additional questions. Four of them - 1, 2, 5 and 7 - are about decisions this
build already made, so they are answered by citing the files that made them and the numbers
that came out. Three - 3, 4 and 6 - are about things this project does not contain, so they
are answered as design proposals and labelled as such.

Every measured figure below comes from `npm run perf`, `npm run fidelity` or
`npm run assets:verify`, and the methodology behind each is in
[`README.md`](README.md#verification) and [PRD section 8](PRD.md#8-budgets-and-verification).

| | Question | Kind |
| --- | --- | --- |
| [1](#1-if-you-use-json-data-how-would-you-structure-it-to-support-future-scalability-and-maintainability) | JSON structure for scalability and maintainability | Built |
| [2](#2-if-you-decide-to-create-your-own-api-which-technology-or-framework-would-you-use-and-why) | Which technology for your own API | Built |
| [3](#3-how-would-you-configure-a-custom-domain-to-point-to-your-deployed-project-on-vercel) | Custom domain on Vercel | Proposal |
| [4](#4-if-your-project-requires-an-admin-panel-to-manage-the-website-content-what-technologies-and-approaches-would-you-choose) | Admin panel | Proposal |
| [5](#5-what-techniques-would-you-use-to-ensure-the-website-loads-quickly-even-on-slow-internet-connections) | Loading quickly on slow connections | Built |
| [6](#6-if-you-implement-a-form-how-would-you-securely-send-the-data-to-the-backend-server) | Sending form data securely | Proposal |
| [7](#7-what-strategies-do-you-use-to-optimize-images-for-performance-without-sacrificing-quality) | Image optimization without sacrificing quality | Built |

---

## 1. If you use JSON data, how would you structure it to support future scalability and maintainability?

**The answer is not the file layout. It is the seam.** A JSON file can be reshaped in an
afternoon; what cannot be undone cheaply is fifty components that each know where content
lives. So the structural decision here was to give content exactly one door, and then to be
strict about what is allowed through it. That decision is
[ADR-0004](docs/adr/0004-content-is-entities-and-references.md); the door is
[`src/lib/content/index.ts`](src/lib/content/index.ts).

Five rules hold it up.

**One typed access module, which every consumer imports.** Nothing outside
`src/lib/content/` knows that JSON exists - Sections call `getTemplates()`, `getPlans()`,
`getTestimonials()` and get typed objects back. Eight files, one per Collection, and not one
`import ... from './data/*.json'` anywhere else in the tree.

**Validation at the boundary, with the types derived from the schemas.** Every file goes
through [`parseCollection`](src/lib/content/parse.ts) against a Zod schema in
[`schema.ts`](src/lib/content/schema.ts), and the TypeScript types come *from* those schemas
rather than being maintained beside them, so the two cannot drift. All issues are reported at
once rather than one per run, and each names its own file, path and expectation, because
fixing content one error at a time is how a five-minute edit becomes an afternoon.

**References are stored as slugs and resolved centrally, never duplicated.** A wall tile is
the string `wall/tile-01`; its `kind`, its width and its height come from the generated asset
index at read time. A Testimonial exists once under `people` and is pointed at by two ordered
Placement lists (`grid` and `wall`), so the three quotes that appear in both Sections cannot
diverge between them - including the Reference's own typos, which we reproduce verbatim and
therefore have to reproduce *consistently*.

**A stable slug on every entity.** Array position means Placement order, and it means that
only for Collections that appear exactly once on the page. Nothing else is allowed to depend
on where a record sits in a file.

**No derived data in the files at all.** This is the rule that gets broken first and costs
the most, so it is worth naming the four values PRD section 7 originally listed and that the
files deliberately do not carry: `wallTiles.kind` and `wallTiles.aspect` (the asset index owns
them, and re-encoding an asset must not silently invalidate a number sitting in JSON),
`features.span` (a bento cell size, and it changes per Breakpoint - that is layout, not
content), `steps.number` (the array index), and the footer's two-column grouping (a grouping
of one links Collection). Prices are stored as **integer minor units** with a currency code,
so the pricing Option recalculation is integer arithmetic rather than floating-point money.

### How it scales past the repo

The accessors are already `async`, and they are async for exactly one reason: **a CMS-backed
adapter changes what happens inside those eight functions and nothing at any call site.**

- **Stage 1, today.** JSON in the repo, imported and parsed once per process. A bad edit is a
  build failure.
- **Stage 2.** The same eight accessors fetch a CMS. The Zod schemas stay exactly where they
  are and keep validating at the same boundary, so a bad *remote* edit fails the same way a
  bad local one does today. What changes is the source and the failure policy - stale-while-
  revalidate, a cache tag, what to serve when the CMS is down - not the schemas, not the
  types, and not one call site.

This costs nothing in performance: an async Server Component still prerenders when its data
does not depend on the request, which is why the homepage is static HTML today despite every
accessor being a promise. It does have one real cost, and it is recorded rather than hidden:
validation became **lazy**, so a Collection no page reads is not parsed during `next build`.
[`loadAllContent()`](src/lib/content/index.ts) plus the Vitest suite parse all eight files to
put that guarantee back.

### The rule a greenfield build should invert

Prose that appears exactly once in exactly one layout - the H1, every Section heading, the
case study's four paragraphs - **stays in the component**, and is not content. For this
project that is correct: the copy is the Reference's, it is frozen, and lifting it into JSON
would add indirection for text nobody will ever edit. For a real product with an editorial
team it is the wrong call, and it is the first thing question 4 has to fix.

---

## 2. If you decide to create your own API, which technology or framework would you use and why?

**Next.js Route Handlers, and the reason is that the API is not a separate service.** Three
endpoints exist and are live:

| Endpoint | What it returns |
| --- | --- |
| [`/api/templates`](https://trial-mindimedia.vercel.app/api/templates) | The three featured Templates, media resolved |
| [`/api/testimonials`](https://trial-mindimedia.vercel.app/api/testimonials) | The twelve people flat, each carrying its Placements |
| [`/api/plans`](https://trial-mindimedia.vercel.app/api/plans) | The three Plans with Options and Included lines |

A standalone Express or Fastify service would have meant a second deployment, a second
dependency tree, CORS between the two, and - the part that actually matters - **a second
definition of what a Template is**. Route Handlers share the content module, the Zod schemas
and the TypeScript types with the pages that render the same data, so an endpoint cannot
drift from what the page shows. That is not an aspiration:
[`tests/api/routes.test.ts`](tests/api/routes.test.ts) asserts each response body is exactly
what the data layer exports, which is the property
[ADR-0002](docs/adr/0002-data-access-shape.md) leans on when it lets the homepage import the
module directly while `/templates` fetches over HTTP.

**`export const dynamic = 'force-static'`** prerenders all three into the build, so they are
served from the CDN with no function invocation and no cold start. The build output marks
them `○ (Static)`, and the deployment confirms it - the responses come back with
`x-vercel-cache: HIT`. Content that ships in the repo has nothing to compute per request, so
computing it per request would be a cost with no matching benefit.

`/templates` consumes the endpoint from the browser rather than importing the module,
deliberately, so that the API is demonstrably consumable rather than merely present. It
handles the failure too - [`template-catalogue.tsx`](src/app/templates/template-catalogue.tsx)
renders a `role="alert"` with a retry, and says plainly that nothing else on the site depends
on it.

### What was deliberately left out

The brief asks for reasons rather than libraries, and that cuts both ways: these three
endpoints are **read-only prerendered GETs with no origin compute**, and so they have no
versioning, no rate limiting, no auth and no CORS policy.

- **No versioning.** There is one consumer and it ships in the same build. A `/api/v1/`
  prefix is a promise to somebody who does not exist.
- **No rate limiting.** There is nothing to exhaust. The response is a static file on a CDN;
  a flood costs Vercel's edge, not our origin.
- **No CORS policy.** Vercel already serves these with `access-control-allow-origin: *`, which
  is the right answer for public read-only content.
- **No auth.** The data is the copy on a public marketing page.

Every one of those becomes wrong the moment an endpoint accepts a write, returns anything
personalised, or gains a second consumer on a release cycle of its own. That is the line, and
it is worth writing down so the next person can see they have crossed it.

---

## 3. How would you configure a custom domain to point to your deployed project on Vercel?

*Proposal - this project is on `trial-mindimedia.vercel.app` and has no custom domain.*

**1. Add the domain to the project**, in Vercel's Project Settings under Domains. Add both
`clientwebsite.com` and `www.clientwebsite.com`, and pick one as canonical - Vercel will
issue a permanent redirect from the other. Which one is a business decision, not a technical
one; the technical part is only that you must choose, because two hosts serving the same page
splits your search ranking and your analytics.

**2. Create the DNS records Vercel prints.** It gives you the exact values - do not copy them
from a blog post, because they change.

- `www` takes a **CNAME** to Vercel's DNS target.
- The apex cannot take a CNAME - DNS forbids it at a zone apex alongside the SOA and NS
  records - so it takes either the **A record** Vercel gives you, or an **ALIAS/ANAME/flattened
  CNAME** if the registrar supports one. Prefer the flattened form where it exists: an A
  record pins you to an address, and an alias follows Vercel if the address moves.
- If the zone has a **CAA record**, it must permit `letsencrypt.org`, or certificate issuance
  will fail silently and the domain will simply never go green.

The lowest-friction path is to move the nameservers to Vercel and let it manage the zone, but
that is usually the wrong ask for a client who already runs mail on that domain. Adding two
records to their existing zone is the safer default.

**3. TLS is automatic.** Vercel provisions and renews a Let's Encrypt certificate once the
records resolve. Nothing to install; the only thing to watch is that DNS propagation can make
the domain look broken for up to the old record's TTL, so **drop the TTL to 300s a day before
the cutover** and put it back afterwards.

**4. One thing worth checking before you point a client's apex at it.** This deployment
already responds with `strict-transport-security: max-age=63072000; includeSubDomains;
preload`. That header instructs the browser to refuse plain HTTP for the domain *and every
subdomain of it* for two years. On a fresh `.vercel.app` that is free. On a client's apex it
is not: if `mail.clientwebsite.com` or an old `staging.` host cannot serve HTTPS, a visitor
who lands on the site once can no longer reach them. Inventory the subdomains first, and only
then decide whether `includeSubDomains` stays.

**5. After the switch**, production traffic serves from the custom domain while preview
deployments keep their generated `.vercel.app` URLs - which is the behaviour you want, since
preview builds should never be indexable.

---

## 4. If your project requires an admin panel to manage the website content, what technologies and approaches would you choose?

*Proposal - this project has no admin panel. It does have the seam one would attach to.*

**The important decision was already made, in question 1.** Every Section reads content
through eight `async` accessors in [`src/lib/content/index.ts`](src/lib/content/index.ts) and
nothing outside that module knows the source is JSON. An admin panel changes what happens
inside those eight functions. It touches no Section.

### What I would choose

**A headless CMS, not a hand-built admin panel.** Sanity or Payload; Payload if the content
model wants to live in the same repo and the same TypeScript, Sanity if non-technical editors
are the priority and hosting the CMS is not something anyone wants to own. What you get for
free is the entire boring half of the problem, and it is the half that takes the time:
authentication, roles, media upload and cropping, draft versus published, revision history,
and an audit trail of who changed what. Building that yourself is weeks of work to arrive at
a worse version of a solved problem, and the brief's second note - avoid complex libraries
without a clear reason - cuts *toward* the CMS here rather than against it.

### The approach

**Keep the Zod schemas as the contract.** This is the part most CMS integrations get wrong.
The schemas in [`schema.ts`](src/lib/content/schema.ts) stay exactly where they are and keep
validating at the same boundary, so a malformed *remote* document fails as loudly as a
malformed local file does today, with the same error naming the same path. A CMS's own types
are generated from its schema and describe what it *can* store; ours describe what this site
can *render*. Those are different questions and both need asking.

**The failure policy is what actually changes**, and it is where the design work is. Today a
bad file is a build error and there is no third state. With a network source there is:

- **ISR with on-demand revalidation.** Pages stay static and CDN-served; the CMS fires a
  webhook on publish, the webhook calls `revalidateTag`, and the affected pages regenerate.
  Editors see changes in seconds without the site giving up prerendering, which is the whole
  performance argument in question 5.
- **Serve stale on failure.** If the CMS is unreachable, the last good render stays up.
  A marketing page must not go down because a third-party API had a bad minute.
- **Draft mode** for preview, so editors see unpublished work at a URL search engines never
  reach.

**Invert the one rule question 1 admitted to.** Single-use prose currently lives in
components, which is correct for a frozen clone and wrong the moment there is an editorial
team - an editor cannot change a heading that is JSX. That migration comes first, before the
CMS, because it changes what the schemas need to describe.

**What I would not do:** write a custom CRUD UI, or let anything mutate content at request
time. The site's performance comes from being static, and an admin panel that makes pages
dynamic has traded the product's main quality for the convenience of whoever built the panel.

---

## 5. What techniques would you use to ensure the website loads quickly even on slow internet connections?

The Reference is the control, and it is a fair one - same page, same content, same day,
measured by the same script:

| | Reference | Clone | |
| --- | --- | --- | --- |
| First Contentful Paint | 3040 ms | **132 ms** | 23x |
| Initial transfer | 4.0 MB | **0.51 MB** | 87% less |
| Initial requests | 141 | **39** | 72% fewer |
| Cumulative Layout Shift | 0.340 | **0.000** | - |

Nine techniques got it there, in order of what they were actually worth. Each number below is
measured, and several of them are smaller than expected - which is the point of measuring.

**1. Prerender everything and serve it from a CDN.** The homepage is static HTML with no
function invocation; verified on the deployment by `x-nextjs-prerender: 1` and
`x-vercel-cache: HIT`. On a slow connection the round-trip you avoid is worth more than the
kilobytes you save, and origin compute is a round-trip.

**2. Do not load video until it is on screen.** Thirteen clips, all `preload="none"` with a
poster frame, started and paused by an IntersectionObserver
([`looping-video.tsx`](src/components/media/looping-video.tsx)). This removes all **2.43 MB**
of video from initial load. The Reference autoplays thirteen at `preload="auto"`, and one of
its hero-wall clips alone is 839 KB.

**3. Do not load video at all where it cannot be seen.** At phone widths the Template Wall's
clips are `display: none`, worth **520 kB - 45% of the whole budget** - for a backdrop drawn
120px wide under a fade. `display: none` rather than `opacity: 0` is the mechanism, not a
shortcut: an element with no box never intersects, so the observer never fires and not one
byte is requested.

**4. Turn off link prefetching.** `next/link` was fetching the payload of all seven
placeholder routes as they scrolled into view: **7 of 55 requests** to make a navigation
nobody reviewing this page will perform feel instant.

**5. Subset the font.** Geist ships latin, latin-ext and cyrillic in one 68 kB file; this page
uses three characters past ASCII and all three are in latin. Asking `next/font` for that
subset gives **29 kB**, and those 39 kB off the font took **LCP from 3.9s to 2.9s** under
Lighthouse's throttled mobile profile. It does not look like the biggest lever on the list,
and it was the most valuable one left, because of *what* waits for it: every
largest-contentful-paint candidate above the fold is text, and `font-display: swap` repaints
each one when the face lands. (Technique 7 below saves the same 39 kB and buys nothing, which
is the point of measuring rather than reasoning about payload size.)

**6. Keep the render path off JavaScript.** One real defect was found here and it is the most
instructive thing in this section. Scroll-Appear originally ran in Motion, which writes its
resting state into the *server* markup - so the hero shipped at `opacity: 0` and stayed there
until 270 kB of JavaScript had arrived and hydrated. **LCP 3.9s against an FCP of 0.9s:**
three seconds of blank page on a page whose HTML was complete in one. The same measured spring
now runs as a CSS animation via
[`spring-easing.ts`](src/components/motion/spring-easing.ts), and needs no JavaScript at all.

**7. Ship less JavaScript.** Removing Motion took the initial transfer from 0.54 MB to
0.50 MB. **It did not move the Lighthouse score**, and that is recorded here rather than
quietly dropped, because it was predicted to: the LCP on this page is bound by the font on the
critical path, not by the size of the JavaScript queued behind it. It was still worth doing -
one animation mechanism instead of two - but the next person should not pull that lever
expecting points.

**8. Give every image and video an intrinsic size.** Every entry in the asset index carries
width and height, so nothing reserves its space late. **CLS 0.000 against the Reference's
0.340**, and on a slow connection this is the difference a visitor actually feels, because
layout shift is *caused* by slowness - a fast connection hides the same bug.

**9. Do not download what a device cannot reach.** A Template card's hover screenshot is
`display: none` where there is no pointer: 59 kB and 3 requests a phone was fetching for an
interaction it has no way to perform.

### Methodology, and one honest miss

Every number above comes from `npm run perf`, which measures both sides the same way and
exits non-zero on a miss. How "initial load" is defined, why both a throttled and an
unthrottled regime are printed, and why the Lighthouse score is a median of five are in
[the README](README.md#performance) rather than restated here.

**The Lighthouse Performance target was `>= 95` and the median of five runs is 93. That is a
miss.** Every other audit is perfect - FCP 0.9s, TBT 10-30ms, CLS 0, Speed Index 1.3s - and
the entire gap is the simulated LCP. The LCP element is the nav wordmark, a 115x26px span, and
what it waits for is the font. The same build has read 88 through 95 across runs on a
developer machine, so this sits short on the median and inside the noise band, which is the
honest way to state it.

### One thing the Reference does that this does not

Its own `sizes` attribute collapses to `100vw` below 1200px, so every tablet and phone visitor
is served an image roughly **four times wider than it draws**. On the connection where it
matters most, it ships the most. See question 7.

---

## 6. If you implement a form, how would you securely send the data to the backend server?

*Proposal - and the honest version first: **this build has no form that submits anywhere.***
The only `<input>` on the site is the one each pricing Option is drawn as
([`plan-card.tsx`](src/components/sections/plan-card.tsx)), and selecting one recalculates a
price in the browser and posts nothing. The Reference's quiz is a link to a page that does not exist. So
this is a design answer, not a citation, and it is labelled that way rather than dressed up.

**The transport is the least interesting part of this question**, and it is where most answers
stop. HTTPS, obviously - it is not optional and Vercel gives it to you with no configuration.
Everything that actually protects the submission happens on either side of the wire.

**Submit to a Server Action, not to a client-side `fetch` you wrote.** The function runs on
the server, the browser never sees its body, and Next generates the endpoint and its identifier.
Two things follow for free: no API key or webhook URL can leak into the bundle, because the
code holding it is never sent; and Next performs an **Origin check on every Server Action
invocation**, which is CSRF protection you did not have to remember to add. A hand-rolled
`POST` Route Handler needs that check written explicitly, plus `SameSite=Lax` cookies, and it
is exactly the sort of thing that gets left out.

**Validate on the server with the same schema the client uses, and treat only the server copy
as real.** The client-side validation is a courtesy to the person filling the form; the server
copy is the boundary. This project already has the pattern -
[`parse.ts`](src/lib/content/parse.ts) is the one place content stops being untrusted, and a
submission handler would share its shape: parse, reject with every issue named, never let an
unvalidated value reach anything downstream.

**Keep secrets on the server.** Anything in `process.env` without the `NEXT_PUBLIC_` prefix
stays out of the bundle. If the form's destination is a third party - a CRM, an email API -
the Server Action calls it; the browser never learns the endpoint exists, so nobody can post
to it directly.

**Rate-limit and gate the bots.** A public form is a public spam target and an unmetered form
is a public billing target. Rate limit per IP at the edge, and put a privacy-respecting
challenge in front of it - Cloudflare Turnstile rather than reCAPTCHA, which does not send
your visitors to an ad network. A honeypot field costs nothing and catches the low end.

**Store the minimum, and log none of it.** Do not write the payload to logs, do not attach it
to error reports, and do not keep fields nobody reads. Personal data that was never collected
cannot leak, and this is the control that survives every mistake made downstream of it.

**Say as little as possible in the response.** "If that address is registered, we have sent an
email" rather than "no such account". Success and failure should take the same shape and,
where it matters, roughly the same time.

**Set the headers.** The deployment already sends HSTS. A form would want a Content-Security-
Policy with a nonce as well - the strongest single mitigation against a script injected
anywhere on the page reading what somebody is typing into it.

---

## 7. What strategies do you use to optimize images for performance without sacrificing quality?

**"Without sacrificing quality" is the half of this question that needs a measurement rather
than an assertion**, so it is worth saying up front how this build knows: `npm run assets:verify`
compares every committed image against the Framer original at the committed file's own width
and gates on **luma SSIM >= 0.98**. The worst graded asset scores **0.9840**. Four dark,
film-grained screenshots sit on individually recorded lower floors, with the reasoning written
into [`verify.ts`](scripts/assets/verify.ts) rather than the global budget being quietly
loosened - and those floors still gate, so a genuine regression in any of them fails the run.

The result of that discipline:

| | Framer originals | Committed | |
| --- | --- | --- | --- |
| Video, 13 clips | 49.50 MB | 3.42 MB | |
| Stills, 57 files | 22.94 MB | 1.50 MB | plus 13 generated posters |
| **Total** | **73.63 MB over 70 files** | **5.19 MB over 83 files** | **93.0% saved** |

### The strategies

**Two passes, not one.** `npm run assets` re-encodes every source once at build time into
committed WebP; `next/image` then re-encodes again per request width, AVIF first with WebP
behind it. AVIF lands roughly 20% under WebP at the same quality, and a browser supporting
neither still gets the committed file. Concretely: `wall/tile-02` is 43 kB committed, **18 kB**
of AVIF at its 696px DPR-2 desktop render width, and **4.6 kB** at phone width.

**Cap the source at twice the largest width it is ever drawn at.** Every manifest entry
records its measured `rendered` width per Breakpoint. Nothing is stored at a resolution no
device will ask for - the Reference serves the founder's clip in 4K for a half-column player.

**Build the `deviceSizes` ladder from measured render widths, not the framework's defaults.**
This is the one that is easy to skip and quietly expensive.
[`next.config.ts`](next.config.ts) lists nine rungs, each a real render width at DPR 2: 256 is
a wall tile on a phone, 550 a step thumbnail, 774 a featured Template card on desktop, 1104
the desktop bento. `next/image` serves the smallest rung **at or above** what a component's
`sizes` resolves to, so a ladder that does not line up with the layout ships every image on
the page a little too large, forever, and nothing ever reports it.

**Write a real `sizes` on every image**, against those measured widths per Breakpoint. This is
where the Reference loses most of its weight: **its own `sizes` collapses to `100vw` below
1200px**, so a tablet or phone visitor receives an image about four times wider than the box
it draws into. The device on the worst connection gets the largest file.

**Intrinsic dimensions on everything.** Every asset-index entry carries width and height, so
no image reserves its space late. The Template Wall alone is 48 tiles; a grid that reflowed as
they loaded would spend the entire CLS budget on the first screen. **CLS 0.000 against the
Reference's 0.340.**

**Defer, and skip entirely where the pixels cannot be seen.** Below-the-fold images are lazy;
clips are `preload="none"` behind a poster and start on intersection; the Wall's clips do not
load at all on a phone, and a Template card's hover screenshot is not rendered where there is
no pointer to hover with. Question 5 has the byte counts.

**Choose the metric that matches the eye.** The gate is luma SSIM, and two alternatives were
tried and rejected with the reasons recorded: **RGB RMSE** measures WebP's 4:2:0 chroma
subsampling rather than the encode - one avatar sits at 4.8 at quality 85 and still 3.9 at 98,
and one tile scores *worse* at 90 than at 85 - and **peak error** is dominated by single pixels
on hard edges, so it says nothing about whether a person would notice. Luma SSIM tracks the
channel the eye resolves detail in and responds monotonically to quality.

**Know where to stop.** Manifest quality is pinned to the 85-95 band. Past 95, `next/image`
re-encodes on top of the result anyway, so the extra bytes buy nothing: one tile reaches just
0.9825 at quality 98, for 129 kB against 61 kB.

### The same thinking, applied to video

Video was 61% of the Reference's transfer, so the strategies above are worth as much again
one media type over. Clips are capped at their rendered size rather than served at source
resolution; three 60fps decorative loops are re-encoded at 30; and one clip the Reference
serves as HEVC with an AAC audio track - which several browsers cannot decode at all - becomes
muted H.264 like the other twelve. All four are recorded as Deviations in the
[README](README.md#deviations-from-the-reference).
