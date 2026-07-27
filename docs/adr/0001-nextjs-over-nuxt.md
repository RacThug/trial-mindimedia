# Next.js over Nuxt

> **The framework choice stands. The consequence below does not: Motion was removed in #14
> and is no longer a dependency of this build.** It is left as written because it is what was
> decided and why, and the record is worth more than a tidy page. What replaced it is in
> [Superseded consequence](#superseded-consequence-14) at the foot of this file.

The brief permitted either Nuxt or Next. We chose Next.js with the App Router because the
Reference is built in Framer, whose runtime animation engine is Motion, and Motion's React
package is the direct descendant of that same engine. Since the brief grades animation
fidelity explicitly and measurement showed the Reference's motion is entirely JS-driven
rather than CSS, aligning with the original's own animation lineage is the shortest path to
parity. Vercel being Next's first-party host was a secondary, smaller factor.

## Consequences

Motion for React is a required dependency rather than an optional one. The brief warns
against "overly complex external libraries without clear reasons", so the reason is recorded
here: it is the same engine the Reference runs on.

## Superseded consequence (#14)

Motion for React was a dependency from #13 to #14 and is not one now. `package.json` carries
no `motion`, and nothing under `src/` imports it.

It was removed for two reasons, the second of which is the real one:

- **39 kB gzipped** on a page whose remaining Lighthouse gap was an LCP queued behind its
  JavaScript.
- **It wrote Scroll-Appear's resting state into the server markup.** The hero shipped at
  `opacity: 0` and stayed there until 270 kB had hydrated: LCP 3.9s against an FCP of 0.9s on
  a throttled mobile profile. The one Section that is on screen at load was waiting for the
  JavaScript that would tell it there had been no scroll.

The animation is unchanged, not approximated.
[`src/components/motion/spring-easing.ts`](../../src/components/motion/spring-easing.ts)
emits the same `linear()` easing Motion itself hands the Web Animations API for opacity and
transform, from the closed form of the spring #13 fitted against the Reference. Every
measured parameter and both settle times survive; `scroll-appear.tsx` sets `data-appeared` on
the same IntersectionObserver and `globals.css` runs the keyframes.

So the reasoning above did its job and then expired. Aligning with the Reference's own
animation lineage is what got the spring measured correctly in #13; once it was measured, the
engine that measured it was 39 kB of dead weight. The framework decision never depended on
keeping it - Next.js is still the choice, and the App Router's static prerendering is now
what the performance argument rests on.

Measured in PRD [6.15](../../PRD.md#615-scroll-appear---measured) and
[8](../../PRD.md#8-budgets-and-verification), and recorded as a reversal of #13 in PRD
[section 3](../../PRD.md#3-decisions).
