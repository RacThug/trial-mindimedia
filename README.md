# browser.supply, cloned

A pixel-faithful rebuild of [browser.supply](https://browser.supply) in Next.js.

| | |
| --- | --- |
| **Live** | **https://trial-mindimedia.vercel.app** |
| **Source** | https://github.com/RacThug/trial-mindimedia |
| **The seven questions** | **[`ANSWERS.md`](ANSWERS.md)** |

The brief's seven additional questions are answered in **[`ANSWERS.md`](ANSWERS.md)**. Four of
them are about decisions this build already made, so they cite files and measured numbers
rather than describing intentions; three are hypothetical and are labelled as proposals.

The build is specified by [`PRD.md`](PRD.md), which mirrors
[issue #5](https://github.com/RacThug/trial-mindimedia/issues/5). Vocabulary is in
[`CONTEXT.md`](CONTEXT.md). **The Reference site, not the document, is the authority** - see
[ADR-0003](docs/adr/0003-fidelity-measured-not-asserted.md), and every value in the PRD is
measured from the live site rather than estimated.

> **The page is indexable, and its copy is the Reference's.** `noindex, nofollow` was set in
> #6 so a verbatim lookalike could not compete with a live commercial site in its owner's own
> search results; it was removed at the owner's direction, which took Lighthouse SEO from 63
> to 100. If this is ever deployed somewhere a crawler can reach, that is the line to put
> back - `robots: { index: false, follow: false }` in `src/app/layout.tsx`.

---

## Setup

Node 24 or newer.

```sh
npm install
npm run dev          # http://localhost:3000
```

Production build:

```sh
npm run build
npm run start
```

`next/font` downloads Geist from `fonts.googleapis.com` during `npm run build` and serves it
from our own origin, so nothing is fetched from Google at runtime - but a build on a machine
with no network fails. That is a Deviation, recorded below.

### Checks

```sh
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run format:check # prettier
npm test             # vitest, 776 tests
npm run test:e2e     # playwright, needs a running server
```

There is **no CI workflow**: these run locally before a PR. The two measurement harnesses are
deliberately not gates either, for the reasons in [PRD section 8](PRD.md#8-budgets-and-verification).

### Measurement

Both harnesses run against a production build, with the server already up:

```sh
npm run build && npm run start     # one terminal
npm run fidelity                   # another: Clone vs Reference, per Section
npm run perf                       # another: load cost and Lighthouse, both sides
```

`CLONE_URL` defaults to `http://localhost:3000` and `REFERENCE_URL` to `https://browser.supply/`.

The asset pipeline is separate and needs its download cache, so it is not part of a normal
run:

```sh
npm run assets         # download and re-encode into public/media
npm run assets:verify  # luma SSIM of every committed image against the Framer original
```

---

## What is in the repo

```
src/app/          routes. page.tsx is the homepage's thirteen Sections; api/* are three
                  force-static Route Handlers; templates/ is the one page that reads its
                  content over HTTP rather than importing it; the other six are
                  placeholder routes, so no link on the page dead-ends
src/components/   sections/ one file per Section, ui/ the shared primitives, media/ the
                  deferred-video and Travelling backdrop machinery, shell/ nav and footer,
                  motion/ scroll-appear and smooth scroll
src/lib/content/  the eight JSON Collections, their Zod schemas, and the one typed module
                  every consumer imports (ADR-0004)
src/lib/media/    the generated asset index: every committed asset by slug, with its
                  intrinsic size
scripts/          assets/ the encode pipeline, fidelity/ the harness, perf/ the budget
tests/            vitest for units and contracts, playwright for E2E and the axe scan
docs/adr/         five architecture decision records
```

Everything else under `docs/` is gitignored local reference material: probe scripts,
captures, and the diff masks the fidelity harness writes.

---

## Measurements and decisions

Both are kept where they can be reproduced rather than summarised here.

- **[PRD section 8](PRD.md#8-budgets-and-verification)** carries the measured fidelity table
  per Section per Breakpoint, the performance table against the Reference, and the
  methodology behind each. `npm run fidelity` and `npm run perf` regenerate them.
- **[PRD section 6](PRD.md#6-section-specification)** specifies each Section against measured
  values, and records where the Clone deliberately differs from the Reference and why.
- **[`docs/adr/`](docs/adr/)** holds five architecture decision records.

Headline figures, all measured: the deployed page scores a **Lighthouse mobile median of 98**
and loads **0.48 MB over 39 requests**, against the Reference's 4.0 MB over 141. Fidelity is
reported as a real per-Section number with the script that produced it rather than as a claim
([ADR-0003](docs/adr/0003-fidelity-measured-not-asserted.md)).
