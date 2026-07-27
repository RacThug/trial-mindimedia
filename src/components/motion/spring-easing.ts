import type { AppearSpring } from './appear.ts'

/*
 * The measured Scroll-Appear spring as a CSS `linear()` easing, so the one
 * Section that is always above the fold can animate without waiting for
 * JavaScript.
 *
 * #14 found why this is needed, and it is a real problem rather than a score:
 * Motion writes the resting state into the server markup, so the hero shipped at
 * `opacity: 0` and stayed there until 270 kB of JavaScript had arrived and
 * hydrated. On Lighthouse's throttled mobile profile that put **LCP at 3.9s
 * against an FCP of 0.9s** - three seconds of a visitor looking at a blank page
 * on a page whose HTML was complete in one. Everything else in PRD section 8's
 * budget passed, and fixing this took the Performance score from 88 to 91. The
 * remaining gap is a second LCP - the nav wordmark waiting on the 68 kB Geist
 * swap - which PRD section 8 records rather than this file.
 *
 * Converting rather than approximating. Motion does the same thing internally -
 * for plain opacity and transform it hands the animation to the Web Animations
 * API as a generated `linear()` easing (`appear.ts`) - so this is the same
 * translation done at a different moment, not a second kind of motion. The
 * physics below is the closed-form solution of the damped oscillator #13 fitted,
 * which is what both are approximations of.
 */

/** How many stops the emitted `linear()` carries. Fine enough to be invisible. */
const STOPS = 32

/**
 * How far a spring has travelled from 1 to 0 at time `t` seconds, as 0 to 1.
 *
 * The closed form of `m x'' + c x' + k x = 0` released from rest at unit
 * displacement, in all three damping regimes. The Section spring is
 * zeta ~ 1.06 and the nested one ~ 2.16, so only the overdamped branch is used
 * by this build - the other two are here because a spring parameter is a
 * measurement that can change, and a curve that silently returns `NaN` for an
 * underdamped one would be a very quiet way to break.
 */
export function springProgress(spring: AppearSpring, t: number): number {
  const { stiffness, damping, mass } = spring
  const undamped = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  if (t <= 0) return 0

  const decay = Math.exp(-zeta * undamped * t)

  if (zeta < 1) {
    const damped = undamped * Math.sqrt(1 - zeta * zeta)
    const displacement =
      decay * (Math.cos(damped * t) + ((zeta * undamped) / damped) * Math.sin(damped * t))
    return 1 - displacement
  }

  if (zeta === 1) return 1 - decay * (1 + undamped * t)

  const damped = undamped * Math.sqrt(zeta * zeta - 1)
  const displacement =
    decay * (Math.cosh(damped * t) + ((zeta * undamped) / damped) * Math.sinh(damped * t))
  return 1 - displacement
}

/**
 * The same spring as a CSS `linear()` easing over `durationSeconds`.
 *
 * Sampled over the window the animation actually runs for, rather than sampled
 * once and stretched. The travel settles at 570ms and the opacity at 755ms
 * (#13); those are the same spring seen for different lengths of time, and
 * playing one curve slower would make the opacity arrive late.
 *
 * Both ends are pinned to 0 and 1 exactly. Floating point leaves the last sample
 * a fraction short, and a `linear()` that ends at 0.9994 leaves an element a
 * fraction of its travel from where it was sent.
 */
export function linearEasing(spring: AppearSpring, durationSeconds: number): string {
  const stops: number[] = []
  for (let step = 0; step <= STOPS; step += 1) {
    const at = (step / STOPS) * durationSeconds
    stops.push(Math.round(springProgress(spring, at) * 10000) / 10000)
  }
  stops[0] = 0
  stops[stops.length - 1] = 1
  return `linear(${stops.join(', ')})`
}
