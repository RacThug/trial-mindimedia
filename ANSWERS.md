# Answers to the seven questions

Short answers with the file or the number attached, so anything here can be checked in the
repo. Questions 1, 2, 5 and 7 describe what this build actually does; 3, 4 and 6 are the
hypothetical ones, answered as what I would choose.

The reasoning behind each decision is in [`PRD.md`](PRD.md) and the five ADRs under
[`docs/adr/`](docs/adr/), and I am happy to walk through any of it.

---

## 1. If you use JSON data, how would you structure it to support future scalability and maintainability?

Eight JSON files sit behind one module, [`src/lib/content/index.ts`](src/lib/content/index.ts).
Nothing else in the codebase imports a `.json` file, so the source can change without touching
a single Section.

- Zod validates every file on read in [`parse.ts`](src/lib/content/parse.ts), and the
  TypeScript types are derived from those schemas rather than written twice.
- References are stored as slugs and resolved in one place, so a Testimonial shown in two
  Sections cannot end up saying two different things.
- Every record has a stable slug. Nothing derived is stored: no `kind` or aspect ratio on wall
  tiles, no `features.span`, no `steps.number`. Prices are integer cents.
- The accessors are already `async`, so moving to a CMS changes those eight functions and no
  call site.

Full reasoning in [ADR-0004](docs/adr/0004-content-is-entities-and-references.md).

---

## 2. If you decide to create your own API, which technology or framework would you use and why?

Next.js Route Handlers. Three endpoints are live:
[`/api/templates`](https://trial-mindimedia.vercel.app/api/templates),
[`/api/testimonials`](https://trial-mindimedia.vercel.app/api/testimonials),
[`/api/plans`](https://trial-mindimedia.vercel.app/api/plans).

- They share the content module, schemas and types with the pages, so an endpoint cannot drift
  from what the page renders. [`tests/api/routes.test.ts`](tests/api/routes.test.ts) asserts
  each response body equals what the data layer exports.
- All three are `force-static`, so they are built into the CDN with no server behind them.
- `/templates` consumes the API over HTTP rather than importing the module, which proves it is
  genuinely consumable, and handles the failure case.
- No versioning, rate limiting or auth, deliberately: these are read-only static files with
  one consumer. That changes the moment one accepts a write.

Full reasoning in [ADR-0002](docs/adr/0002-data-access-shape.md).

---

## 3. How would you configure a custom domain to point to your deployed project on Vercel?

- Add the apex and `www` in the project's domain settings, and pick one as canonical so the
  other redirects.
- `www` takes a CNAME. The apex cannot, since DNS does not allow one at the top of a zone, so
  it takes Vercel's A record or an ALIAS if the registrar offers one.
- If a CAA record exists it must allow `letsencrypt.org`, or the certificate silently never
  issues.
- Lower the TTL to five minutes the day before, so a mistake is quick to undo.
- Before pointing a client's apex anywhere, check the HSTS header. This deployment sends
  `includeSubDomains` with a two-year lifetime, which breaks any subdomain that cannot serve
  HTTPS.

The site currently runs on the `trial-mindimedia.vercel.app` address, so none of this is set
up yet.

---

## 4. If your project requires an admin panel to manage the website content, what technologies and approaches would you choose?

A headless CMS rather than a hand-built panel. Payload to keep the content model in this repo
and this TypeScript, Sanity if hosting it is not worth owning. Either way, logins, roles,
media uploads, drafts and revision history are already solved problems, and that is the half
that takes the weeks.

- Keep the Zod schemas as the contract, so a bad CMS document fails like a bad file does now.
  A CMS generates types for what it can store, which is not the same as what this site can
  render.
- Keep pages static and regenerate on publish via webhook, so editors see changes in seconds
  without giving up prerendering. Serve the last good version if the CMS is unreachable.
- Move single-use copy out of the components first. An editor cannot change a heading that
  only exists as JSX.

This build is already shaped for it: every Section reads through the eight `async` accessors
from question 1, so the CMS changes those eight functions and no Section at all.

---

## 5. What techniques would you use to ensure the website loads quickly even on slow internet connections?

Measured against the original site with the same script:

| | Original | This build |
| --- | --- | --- |
| First Contentful Paint | 3040 ms | **132 ms** |
| Initial transfer | 4.0 MB | **0.51 MB** |
| Initial requests | 141 | **39** |
| Cumulative Layout Shift | 0.340 | **0.000** |

What got it there, in order of what each was worth:

- **Prerender everything to the CDN.** No origin compute, so no round trip to wait on.
- **Video loads on intersection**, `preload="none"` behind a poster: 2.43 MB out of the
  initial load. The original autoplays thirteen clips at `preload="auto"`.
- **The template wall's video does not load on a phone at all**, via `display: none`: 520 kB,
  45% of the budget, for decoration drawn 120px wide.
- **No link prefetching**: 7 requests of 55.
- **Font subset to latin**, 68 kB to 29 kB, which took LCP from 3.9s to 2.9s. Everything above
  the fold is text, so it all waits on the font.
- **The first paint needs no JavaScript.** The animation library was writing `opacity: 0` into
  the server HTML, leaving the hero blank until 270 kB had hydrated: LCP 3.9s against FCP 0.9s.
  It now runs as a CSS keyframe.
- **Real dimensions on every image and video**, which is the 0.000 layout shift.
- **Nothing downloaded that a device cannot use**, such as a hover screenshot on a phone.

**The one target I missed:** Lighthouse performance, 93 against a target of 95. The whole gap
is the nav wordmark waiting for the font; the same build scores 88 to 95 between runs, so it
is short on the median and inside the noise.

Method and the full table are in [`README.md`](README.md#performance).

---

## 6. If you implement a form, how would you securely send the data to the backend server?

Over HTTPS, which Vercel gives you without configuration. That is the least interesting part
though; what actually protects a submission happens at each end of it.

- Submit to a Server Action rather than a hand-written endpoint. Its body never reaches the
  browser, so keys cannot leak into the bundle, and Next checks the request origin, which is
  CSRF protection by default.
- Validate on the server with the same schema the form uses, and treat only that result as
  real. Browser validation is a courtesy, not a control.
- Keep secrets server-side; anything without `NEXT_PUBLIC_` stays out of the bundle.
- Rate limit per IP and add a challenge such as Turnstile, since an unmetered public form is a
  spam target and a billing risk.
- Store the minimum and log none of it, including in error reports.
- Keep responses uninformative: "if that address is registered we have sent an email", with
  success and failure the same shape.
- Add a CSP with a nonce, which is the strongest single control against an injected script
  reading what someone types.

Nothing on this site submits today. The only `<input>` is the pricing option selector in
[`plan-card.tsx`](src/components/sections/plan-card.tsx), which recalculates a price in the
browser and posts nothing.

---

## 7. What strategies do you use to optimize images for performance without sacrificing quality?

Quality is gated rather than claimed. `npm run assets:verify` compares every committed image
against the original at the same width and fails below **0.98 luma SSIM**; the worst is
**0.9840**.

| | Originals | Committed |
| --- | --- | --- |
| Video, 13 clips | 49.50 MB | 3.42 MB |
| Images, 57 files | 22.94 MB | 1.47 MB, plus 0.17 MB of posters |
| **Total** | **73.63 MB over 70 files** | **5.07 MB over 83 files**, 93.1% saved |

- **Encoded twice**: WebP at build time, then AVIF per request by `next/image`. A wall tile is
  43 kB in the repo, 18 kB on desktop, 4.6 kB on a phone.
- **Nothing stored above twice its largest display size.** The original serves a 4K video into
  a half-column player.
- **The `deviceSizes` list is measured from the layout**, not the framework default.
  `next/image` picks the smallest width at or above what `sizes` resolves to, so a list that
  does not match the layout ships every image slightly too large.
- **A real `sizes` on every image.** The original falls back to `100vw` below 1200px, so phones
  get an image about four times wider than it draws.
- **Real width and height everywhere**, so the page does not reflow as images arrive.
- **Lazy below the fold, and not loaded at all where the pixels cannot be seen.**

Same approach for video, which was 61% of the original's weight: capped at display size, three
decorative 60fps loops re-encoded at 30, and one clip several browsers cannot decode converted
to H.264. Listed as deliberate differences in the
[README](README.md#deviations-from-the-reference).
