# Answers to the seven questions

Four of these questions are about things I actually built, so I have pointed at the file and
the number instead of describing what I would do. The other three are about things this
project does not have, and I have said so at the top of each one.

Where I quote a measurement, how it was taken is in [`README.md`](README.md#verification) and
the full tables are in [PRD section 8](PRD.md#8-budgets-and-verification).

---

## 1. If you use JSON data, how would you structure it to support future scalability and maintainability?

The shape of the files matters less than how the rest of the code reaches them. If every
component imports JSON directly, then moving that content anywhere later means editing every
component. So I put all eight files behind a single module,
[`src/lib/content/index.ts`](src/lib/content/index.ts), and nothing outside that folder
imports a `.json` file. A Section calls `getTemplates()` and gets typed objects back. It has
no idea where they came from.

Four rules keep the files themselves clean:

Everything is validated on the way in. Each file is parsed against a Zod schema by
[`parse.ts`](src/lib/content/parse.ts), and I derive the TypeScript types from those schemas
rather than writing them twice, so they cannot disagree. When a file is wrong you get every
problem at once, each naming its own path, because fixing content one error per run wastes an
afternoon.

Anything referenced is stored as a slug and looked up in one place. A wall tile is just the
string `wall/tile-01`, and its dimensions come from the generated asset index. A Testimonial
is written once under `people`, and the two Sections that show it point at it by slug. That
way a quote appearing twice on the page cannot end up saying two different things.

Every record has a stable slug, so nothing depends on its position in the array except the
one thing that should: the order it appears on the page.

Nothing derived is stored. Wall tiles carry no `kind` or aspect ratio, because the asset index
already knows both and a copy goes stale. `features.span` is a layout value that changes
between breakpoints, and `steps.number` is just the array index. Prices are integers in cents
with a currency code, which is why the pricing options can add up without floating-point
rounding.

**Moving to a CMS later.** The eight accessors are already `async`, even though today they
just read files that ship in the build. That is the whole point: swapping in a CMS changes
what happens inside those eight functions and nothing at any call site. The schemas stay
exactly where they are and keep validating, so a bad edit in a CMS fails the same way a bad
edit in a file does now. The cost of making them async is that validation got lazy, so
`loadAllContent()` and the test suite parse all eight files to cover that.

**One thing I would do differently on a normal project.** Text that appears once in one place,
like a heading, lives in the component rather than in JSON. That is right here because the
copy is fixed and nobody will ever edit it. On a project with people writing copy it would be
wrong, and it is the first thing I would change before adding the admin panel in question 4.

---

## 2. If you decide to create your own API, which technology or framework would you use and why?

I used Next.js Route Handlers, and there are three endpoints running right now:
[`/api/templates`](https://trial-mindimedia.vercel.app/api/templates),
[`/api/testimonials`](https://trial-mindimedia.vercel.app/api/testimonials) and
[`/api/plans`](https://trial-mindimedia.vercel.app/api/plans).

The reason is that this API is not really a separate service. It reads the same content
module, the same schemas and the same types the pages do. That means an endpoint cannot start
returning something different from what the page shows, and
[`tests/api/routes.test.ts`](tests/api/routes.test.ts) checks exactly that: each response body
has to equal what the data layer exports. A separate Express service would have meant a second
deployment, a second set of dependencies, and a second definition of what a Template is,
which is the one that eventually drifts.

All three are marked `force-static`, so they are generated during the build and served from
the CDN with no server running behind them. You can see it in the build output, where they
print as `○ (Static)`, and in the response headers, which come back with
`x-vercel-cache: HIT`.

The `/templates` page fetches the endpoint over HTTP rather than importing the module. That is
deliberate, so the API is something you can actually consume rather than something that merely
exists. It also handles the endpoint being unreachable, with a message and a retry button.

I left several things out on purpose, since these are read-only GETs that are already static
files. There is no versioning, because there is one consumer and it ships in the same build.
No rate limiting, because there is nothing to exhaust. No auth, because the data is the text
on a public marketing page. All of that changes the moment one of these accepts a write or
gains a consumer on a different release schedule, and that is the line I would watch for.

---

## 3. How would you configure a custom domain to point to your deployed project on Vercel?

This project is running on `trial-mindimedia.vercel.app` and has no custom domain, so here is
how I would set one up.

First, add both `clientwebsite.com` and `www.clientwebsite.com` in the project's domain
settings and choose one as the real address. Vercel will redirect the other permanently. It
does not matter much which you pick, but you do have to pick, because two addresses serving
the same page splits your search ranking and your analytics.

Then create the DNS records Vercel gives you. Use the values it prints rather than ones from
an article, because they change. The `www` name takes a CNAME. The bare domain cannot, since
DNS does not allow a CNAME next to the records that already sit at the top of a zone, so it
takes either the A record Vercel provides or an ALIAS record if the registrar supports one. I
would prefer the ALIAS, because an A record ties you to a specific address that may move. One
thing that catches people out: if the domain has a CAA record, it has to allow
`letsencrypt.org`, otherwise the certificate silently never gets issued and the domain just
sits there looking broken.

The certificate is automatic once DNS resolves. I would lower the TTL to five minutes the day
before, so a mistake takes minutes to undo rather than hours.

The thing I would check before pointing a client's domain anywhere: this deployment sends
`strict-transport-security` with `includeSubDomains` and a two-year lifetime, which tells
browsers to refuse plain HTTP for the domain and everything under it. On a `vercel.app`
address that is free. On a client's real domain it means any subdomain that cannot serve
HTTPS, an old staging box or a mail interface, stops working for anyone who has visited the
site once. So I would list the subdomains first and decide whether that header stays.

Preview deployments keep their generated addresses through all of this, which is what you
want, since they should never show up in search results.

---

## 4. If your project requires an admin panel to manage the website content, what technologies and approaches would you choose?

There is no admin panel here, but the part that would be expensive to add later is already
done. Every Section reads content through the eight `async` functions from question 1, and
none of them knows where the content comes from. An admin panel changes what those eight
functions do and touches no Section at all.

I would use a headless CMS rather than build the panel. Payload if the content model should
live in this repo and this TypeScript; Sanity if the priority is non-technical editors and
nobody wants to host it. Either way you get the unglamorous half for free, and it is the half
that takes the weeks: logins, permissions, image uploads, drafts against published versions,
revision history, and a record of who changed what. Writing that yourself gets you a worse
version of a solved problem.

I would keep the Zod schemas as the contract. A CMS generates types describing what it is able
to store, which is not the same question as what this site is able to render. So content coming
back from the network would be validated at the same place file content is validated today,
and a broken document would fail as loudly as a broken file does now.

The real design work is deciding what happens when the CMS is slow or down, because right now
there is no such state. I would keep pages static and regenerate them on demand: the CMS calls
a webhook when someone publishes, the webhook revalidates just the affected pages, and editors
see their change in seconds without the site giving up being prerendered. If the CMS cannot be
reached, the last good version stays up. A marketing page should not go down because someone
else's API had a bad minute.

Before any of that, I would move the single-use text out of the components. An editor cannot
change a heading that only exists as JSX.

What I would avoid is a hand-written CRUD screen, and anything that fetches content at request
time. This site is fast because it is static, and an admin panel that makes pages dynamic
trades away the product's best quality for the convenience of whoever is building the panel.

---

## 5. What techniques would you use to ensure the website loads quickly even on slow internet connections?

The original site is a fair control here, since it is the same page with the same content,
measured by the same script:

| | Original | This build |
| --- | --- | --- |
| First Contentful Paint | 3040 ms | **132 ms** |
| Initial transfer | 4.0 MB | **0.51 MB** |
| Initial requests | 141 | **39** |
| Cumulative Layout Shift | 0.340 | **0.000** |

Nine things got it there. Roughly in order of what each was worth:

**Prerender everything and serve it from a CDN.** The page is static HTML with nothing
computed per request. On a slow connection, a round trip you avoid is worth more than the
kilobytes you save.

**Do not load video until it is on screen.** All thirteen clips use `preload="none"` with a
poster image, started by an IntersectionObserver in
[`looping-video.tsx`](src/components/media/looping-video.tsx). That keeps 2.43 MB out of the
initial load. The original plays all thirteen with `preload="auto"`.

**Do not load video that nobody can see.** On a phone the template wall's clips are set to
`display: none`, which saves 520 kB, about 45% of the whole budget, for decoration drawn 120px
wide behind a fade. Using `display: none` rather than `opacity: 0` is the point: an element
with no box never intersects anything, so the observer never fires and nothing is requested.

**Turn off link prefetching.** Next was quietly fetching all seven placeholder pages as their
links scrolled into view, seven requests out of fifty-five, to speed up a navigation that
nobody reviewing this page is going to make.

**Subset the font.** Geist ships latin, latin-ext and cyrillic in one 68 kB file, and this page
uses three characters beyond ASCII, all of them latin. Asking for just that subset gives 29 kB,
and those 39 kB took the largest contentful paint from 3.9s to 2.9s. That is out of proportion
to the file size, and the reason is what waits for it: everything visible above the fold is
text, and each piece of it repaints when the font arrives.

**Keep the first paint off JavaScript.** This is where I found a real bug. The scroll
animation library wrote its starting state into the server-rendered HTML, so the hero shipped
at `opacity: 0` and stayed invisible until 270 kB of JavaScript had downloaded and run. The
page was blank for three seconds despite its HTML being complete in one. The same animation
now runs as a CSS keyframe from
[`spring-easing.ts`](src/components/motion/spring-easing.ts) and needs no JavaScript at all.

**Ship less JavaScript.** Removing that library took the transfer from 0.54 to 0.50 MB, and
the score did not move at all. I am including it because I expected it to, and it is worth
knowing why it did not: the delay here is the font sitting on the critical path, not the size
of the JavaScript queued behind it. The same 39 kB in the previous point bought a whole
second. Payload size on its own does not tell you which kind you are holding.

**Give every image and video its real dimensions**, so nothing on the page moves as it loads.
That is the difference between 0.000 and the original's 0.340. It matters most here because
layout shift is caused by slowness, so a fast connection hides the problem rather than
solving it.

**Do not download things a device cannot use.** Each template card has a second screenshot
shown on hover. A phone has no way to reach it and was downloading it anyway, 59 kB across
three requests.

**The one target I missed.** I aimed for a Lighthouse performance score of 95 and the median
of five runs is 93. Every other part of the audit is clean, and the entire gap is the
simulated paint time of the nav wordmark waiting for the font. The same build has scored
anywhere from 88 to 95 depending on what else the machine was doing, so it is short on the
median and inside the noise, which seemed worth saying plainly rather than quoting the best
run.

One thing the original does that this does not: its `sizes` attribute falls back to `100vw`
below 1200px, so phones and tablets get an image roughly four times wider than the space it
is drawn in. The visitors on the worst connections are sent the most data. More on that next.

---

## 6. If you implement a form, how would you securely send the data to the backend server?

There is no form in this build that sends anything anywhere. The only `<input>` on the site is
the pricing option selector in
[`plan-card.tsx`](src/components/sections/plan-card.tsx), and choosing one just recalculates
a price in the browser. So this is what I would do rather than what I did.

The transport is the least interesting part of the question, and it is where a lot of answers
stop. HTTPS is not optional and Vercel gives it to you without configuration. The things that
actually protect a submission happen at each end of it.

I would submit to a Server Action rather than write my own POST endpoint. The function runs on
the server and its body is never sent to the browser, so an API key or a webhook URL cannot
end up in the bundle. Next also checks the request origin on every one of these, which is
CSRF protection you get without having to remember it. A hand-written endpoint needs that
added explicitly, and it is exactly the sort of thing that gets forgotten.

I would validate on the server with the same schema the form uses, and treat only the server's
result as real. Validation in the browser is a courtesy to the person filling the form in;
it is not a control, because anyone can skip it. This project already has the pattern in
[`parse.ts`](src/lib/content/parse.ts), which is the single place input stops being untrusted.

Secrets stay on the server. Anything without a `NEXT_PUBLIC_` prefix never reaches the
browser, and if the form's destination is a third party, the Server Action calls it so the
browser never learns that endpoint exists.

A public form needs a rate limit and something to slow bots down, because an unmetered form is
somebody's spam target and your bill. I would limit per IP at the edge and add a challenge
that does not hand your visitors to an ad network, so Turnstile rather than reCAPTCHA. A
hidden honeypot field costs nothing and catches the crude end of it.

I would store as little as possible and log none of it. Not into application logs, not into
error reports. Personal data you never collected cannot leak, and that is the only control
that still works after somebody downstream makes a mistake.

The response should not tell an attacker anything. "If that address is registered we have sent
an email" rather than "no such account", with success and failure looking the same and taking
about the same time.

Finally, headers. HSTS is already set. A form would also want a Content-Security-Policy with a
nonce, which is the single most effective thing against a script injected somewhere else on
the page reading what someone is typing.

---

## 7. What strategies do you use to optimize images for performance without sacrificing quality?

The second half of that question is the part that needs measuring rather than claiming, so
that is where I started. `npm run assets:verify` compares every image I committed against the
original at the same width and fails if the structural similarity drops below 0.98. The worst
one scores 0.9840. Four dark, grainy screenshots sit on their own lower limits with the
reasoning written into [`verify.ts`](scripts/assets/verify.ts), rather than lowering the
limit for everything, and those still fail if they get worse.

With that in place, the compression is aggressive:

| | Originals | Committed |
| --- | --- | --- |
| Video, 13 clips | 49.50 MB | 3.42 MB |
| Images, 57 files | 22.94 MB | 1.50 MB, plus 13 poster frames |
| **Total** | **73.63 MB over 70 files** | **5.19 MB over 83 files**, 93.0% saved |

Everything is encoded twice. Once when I build the assets into WebP, and again by `next/image`
per request, which serves AVIF where the browser supports it. A wall tile that is 43 kB in the
repo arrives as 18 kB on a desktop and 4.6 kB on a phone.

Nothing is stored larger than twice the biggest size it is ever displayed at. The original
site serves the founder's video in 4K into a half-column player.

The list of widths `next/image` is allowed to generate comes from measuring the layout, not
from the framework's defaults. [`next.config.ts`](next.config.ts) has nine of them, each one a
real width something is drawn at on a retina screen. This is worth the effort because
`next/image` picks the smallest width at or above what your `sizes` attribute works out to, so
if that list does not line up with your layout, every image on the page ships slightly too
large forever and nothing ever tells you.

Every image has a real `sizes` attribute written against those measured widths. That is the
difference described at the end of question 5, and it is where the original site loses most of
its weight.

Every image also has its real width and height, so the page does not move while it loads. The
template wall alone is 48 tiles, and a grid reflowing as those arrive would use up the entire
layout-shift budget on the first screen.

Beyond that it is about not sending things at all: images below the fold load lazily, videos
wait until they are on screen, the wall's videos never load on a phone, and the hover
screenshot is not rendered where there is no mouse.

Two smaller decisions worth mentioning. I compare brightness rather than colour, because WebP
compresses colour more aggressively than brightness, which puts a floor under the colour error
that quality cannot move: one avatar only goes from 4.8 to 3.9 between quality 85 and 98, and
one tile actually scores worse at 90 than at 85. Comparing colour would mostly measure the
file format rather than how well I encoded. And I kept quality in the 85 to 95 range, because
`next/image` re-encodes on top of my file anyway, so going higher buys bytes and very little
else. One tile only climbs from its usual score to 0.9825 at quality 98, and doubles from
61 kB to 129 kB to get there.

The same thinking applies to video, which was 61% of the original's page weight: clips capped
at the size they are displayed, three 60fps decorative loops re-encoded at 30, and one clip
the original serves in a format several browsers cannot decode at all converted to H.264. All
of those are listed as deliberate differences in the
[README](README.md#deviations-from-the-reference).
