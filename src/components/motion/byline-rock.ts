import type { AppearSpring } from './appear.ts'
import { linearEasing } from './spring-easing.ts'

/*
 * The footer by-line portrait rocks, for ever, and #15 measured it.
 *
 * It is the one thing on the page that never comes to rest. Framer drives it
 * from Motion's rAF loop, writing `transform: rotate(-10.3286deg)` into the
 * inline style every frame - so `getAnimations()` returns nothing and the only
 * way to read it is to sample `getComputedStyle` over several seconds with the
 * page held still. Sampled at 60fps for 9s, with the quiz modal dismissed and
 * headless backgrounding disabled:
 *
 * | rest angles | swing  | hold   | spring (mass 1) | rms |
 * | +8deg and -12deg | 800ms | 617ms | k 110, c 16.5 | 0.19deg over a 20deg swing |
 *
 * Six consecutive swings measured 748, 796, 800, 799, 802 and 800ms, and five
 * holds 621, 616, 617, 617 and 614 - so the cycle is 2834ms and both halves are
 * the same. The spring is the same parameterisation the Scroll-Appear uses and
 * is fitted the same way, which is why `linearEasing` can play it: this file
 * derives the curve rather than typing a `linear()` out, for the reason
 * `appear-style.ts` gives.
 *
 * -12deg is the resting angle in the sense that matters here - it is where the
 * portrait sits on a first paint, before Motion has run a frame - so it is what
 * a visitor who has asked for reduced motion is left looking at.
 */

/** The two angles it swings between. */
export const ROCK_FROM = 8
export const ROCK_TO = -12

/** Milliseconds of travel, and of stillness at each end. */
const SWING_MS = 800
const HOLD_MS = 617

/** One full there-and-back. `globals.css` splits it at the measured stops. */
export const ROCK_CYCLE_MS = 2 * (SWING_MS + HOLD_MS)

/**
 * Where the swing starts and ends, as a percentage of the cycle.
 *
 * Exported because `@keyframes` cannot read a custom property for a stop, so
 * `globals.css` has the same two numbers written out - and a test asserts the
 * stylesheet agrees with these rather than trusting the comment beside them.
 */
export const ROCK_SWING_START_PERCENT = (HOLD_MS / ROCK_CYCLE_MS) * 100
export const ROCK_SWING_END_PERCENT = ((HOLD_MS + SWING_MS) / ROCK_CYCLE_MS) * 100

const ROCK_SPRING: AppearSpring = {
  type: 'spring',
  stiffness: 110,
  damping: 16.5,
  mass: 1,
}

/**
 * The cycle and its easing, for the element the keyframes run on.
 *
 * The easing is sampled over the swing rather than over the cycle: the two
 * holds are keyframe stops, so what `linear()` has to describe is the 800ms of
 * travel between them and nothing else.
 */
export function bylineRockStyle(): React.CSSProperties {
  return {
    '--byline-rock-duration': `${ROCK_CYCLE_MS}ms`,
    '--byline-rock-ease': linearEasing(ROCK_SPRING, SWING_MS / 1000),
  } as React.CSSProperties
}
