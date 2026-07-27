/*
 * Scroll-Appear, measured (#13, closing known unknown 1 of PRD section 10).
 *
 * PRD section 10 recorded the parameters as unmeasurable because Motion drives
 * the animation from its own rAF loop, where it does not surface in
 * `getAnimations()` or computed styles. On the Reference it surfaces in the DOM:
 * Framer's build of Motion writes an inline `style` attribute every frame, so a
 * MutationObserver on `style` records the whole curve.
 *
 * That is a fact about the Reference and **not** about this build. Motion has
 * two animation paths, and ours takes the other one: for plain opacity and
 * transform it hands the work to the Web Animations API, converting the spring
 * to a generated `linear()` easing, and WAAPI does not touch inline styles until
 * the animation ends. Anything measuring the Clone has to read
 * `getComputedStyle`; a probe reading `element.style.opacity` sees 0 for the
 * whole animation and then 1, and reports a spring as an instant cut.
 *
 * The full method, the fitted curves and the Clone-against-Reference comparison
 * are recorded in issue #13. The probe and fit scripts are in `docs/measure/`,
 * which is gitignored by `AGENTS.md` and therefore local to whoever ran them -
 * the issue is the durable record, not those paths.
 *
 * What the Reference does, measured at 1440x900:
 *
 * | | travel | opacity | spring (mass 1) | settles |
 * | Section        | 30px | 0 -> 1 | k 200, c 30 | y at ~570ms, opacity at ~755ms |
 * | nested block   | 10px | 0 -> 1 | k 86,  c 40 | ~2.3s |
 * | nested in place| none | 0 -> 1 | k 86,  c 40 | ~2.5s |
 *
 * A spring rather than a tween, and not a close call: the best-fitting duration
 * tween misses by 20x the RMS the spring achieves, and the two animated values
 * stop at different times (the 30px travel at ~570ms, the opacity at ~755ms),
 * which only a per-value rest threshold produces.
 *
 * The nested rows are the second finding. The Reference does not give every
 * Section the Section treatment - the quiz CTA's card and the case study's card
 * animate as blocks inside their Section, shorter and much slower. The nav, the
 * footer and the quiz modal do not animate at all.
 */

/** A spring in Motion's `stiffness`/`damping`/`mass` parameterisation. */
export type AppearSpring = {
  readonly type: 'spring'
  readonly stiffness: number
  readonly damping: number
  readonly mass: number
}

export type AppearPreset = {
  /** Pixels the element rises through, `translateY(travel) -> 0`. */
  readonly travel: number
  readonly spring: AppearSpring
  /**
   * Seconds each value takes to come to rest, measured per value.
   *
   * Two numbers rather than one because the Reference's two stop at different
   * times, which is the detail that says spring rather than tween. Motion reads
   * neither - it settles on its own rest thresholds - so this exists for the one
   * Section that runs the same spring from CSS (#14), where a duration has to be
   * stated rather than reached.
   */
  readonly settle: { readonly travel: number; readonly opacity: number }
}

/**
 * Sections: 30px, zeta ~ 1.06, so it settles without overshooting.
 *
 * Two independent dense captures put the least-squares argmin at (204, 30.5) and
 * (198, 29.75). (200, 30) lies between them and fits each within 0.0003 RMS,
 * which is well inside the noise of a 60fps capture - a round pair that the
 * measurements straddle rather than a round pair chosen because it looks tidy.
 */
const SECTION_SPRING: AppearSpring = {
  type: 'spring',
  stiffness: 200,
  damping: 30,
  mass: 1,
}

/**
 * Nested cards: zeta ~ 2.16, heavily overdamped, ~3x the Section's settle.
 *
 * Fitted jointly across five captures rather than per element. Fitting each on
 * its own gives stiffness 70 to 111 and damping 35 to 48, which is more spread
 * than five single captures can honestly separate; one spring holds all five to
 * a worst-case RMS of 0.013.
 */
const NESTED_SPRING: AppearSpring = {
  type: 'spring',
  stiffness: 86,
  damping: 40,
  mass: 1,
}

export const APPEAR = {
  /** A whole Section. Eight of the thirteen use this, the hero included. */
  section: {
    travel: 30,
    spring: SECTION_SPRING,
    settle: { travel: 0.57, opacity: 0.755 },
  },
  /** A card inside a Section, rising a third as far: the quiz CTA's. */
  block: { travel: 10, spring: NESTED_SPRING, settle: { travel: 2.3, opacity: 2.3 } },
  /** A card inside a Section that arrives without travelling: the case study's. */
  inPlace: { travel: 0, spring: NESTED_SPRING, settle: { travel: 2.5, opacity: 2.5 } },
} as const satisfies Record<string, AppearPreset>

export type AppearVariant = keyof typeof APPEAR

/**
 * How much of an element has to be visible before it appears: half of it.
 *
 * Measured by parking the Reference at successive scroll offsets and holding it
 * there - a probe that keeps scrolling while it samples reads a trigger point up
 * to a whole animation later than the real one.
 */
export const APPEAR_VISIBLE_FRACTION = 0.5

/**
 * The IntersectionObserver threshold that fires when half the element is
 * showing, or half the viewport for an element too tall to ever show half.
 *
 * The clamp is not a refinement of the measurement, it is the measurement:
 * Sections of 619, 692, 1008, 1317 and 1694px all fired at half of whichever was
 * smaller, themselves or the 900px viewport. It also happens to be what keeps
 * this safe, because `IntersectionObserver` reports a ratio against the
 * element's own height and Motion hands `viewport.amount` straight to it without
 * clamping - so a Section more than twice the viewport tall, which is ordinary
 * at phone widths, would sit at `opacity: 0` and never be seen.
 */
export function appearThreshold(elementHeight: number, viewportHeight: number): number {
  /* A hidden or not-yet-laid-out element: fire on any intersection at all. */
  if (!(elementHeight > 0) || !(viewportHeight > 0)) return Number.MIN_VALUE

  const visible = APPEAR_VISIBLE_FRACTION * Math.min(elementHeight, viewportHeight)
  return Math.min(1, Math.max(Number.MIN_VALUE, visible / elementHeight))
}
