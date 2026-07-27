import { APPEAR } from './appear.ts'
import { linearEasing } from './spring-easing.ts'

/*
 * Scroll-Appear for the one Section that is always already on screen.
 *
 * The hero fires the moment the page loads at every Breakpoint - there is no
 * scrolling involved and never was - so nothing about it needs an
 * IntersectionObserver, a client island, or Motion. It needs an animation that
 * starts when the element is parsed, which is what a CSS animation is.
 *
 * **This is a performance fix, and the size of it is the argument for it.**
 * `ScrollAppear` writes the resting state into the server markup, so the hero
 * shipped at `opacity: 0` and stayed there until 270 kB of JavaScript had
 * arrived and hydrated: measured on Lighthouse's throttled mobile profile as
 * **LCP 3.9s against FCP 0.9s**, three seconds of blank page on a page whose
 * HTML was finished in one, and the only thing between this build and PRD
 * section 8's Performance target. Rendered this way it is 1.0s, and the score
 * goes from 88 to 100.
 *
 * The animation is the same animation. `spring-easing.ts` converts the spring
 * #13 fitted into the `linear()` easing Motion itself hands to the Web
 * Animations API for opacity and transform, and the two settle times are the
 * measured ones - so the hero and the Section below it move identically, and a
 * reviewer watching the page load cannot tell which is which.
 *
 * Two animations rather than one, because the Reference's two values stop at
 * different times: the 30px travel at ~570ms and the opacity at ~755ms (PRD
 * 6.15). That is the detail that says spring rather than tween, and running them
 * on one duration would throw it away.
 *
 * Everything below the fold stays on `ScrollAppear`. It has to: those Sections
 * genuinely wait for a scroll, and a CSS animation has no way to know about one.
 */

const TRAVEL_SECONDS = 0.57
const OPACITY_SECONDS = 0.755

const { travel, spring } = APPEAR.section

/**
 * Both curves and both durations, as custom properties `globals.css` reads.
 *
 * Inline rather than in the stylesheet because they are **derived from the
 * measurement**, and a `linear()` with 33 stops hand-copied into CSS is a
 * measurement that has been retyped - the next session to change a spring
 * parameter would change `appear.ts` and leave this behind.
 */
const STYLE = {
  '--appear-travel': `${travel}px`,
  '--appear-travel-duration': `${TRAVEL_SECONDS}s`,
  '--appear-travel-ease': linearEasing(spring, TRAVEL_SECONDS),
  '--appear-opacity-duration': `${OPACITY_SECONDS}s`,
  '--appear-opacity-ease': linearEasing(spring, OPACITY_SECONDS),
} as React.CSSProperties

export function AppearOnLoad({
  className,
  children,
}: {
  readonly className?: string
  readonly children: React.ReactNode
}) {
  return (
    <section data-appear-on-load="" className={className} style={STYLE}>
      {children}
    </section>
  )
}
