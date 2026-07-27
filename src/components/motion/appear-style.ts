import { APPEAR, type AppearVariant } from './appear.ts'
import { linearEasing } from './spring-easing.ts'

/*
 * The measured Scroll-Appear presets as something CSS can run.
 *
 * One module because there are two triggers and one animation. The hero starts
 * on load (`appear-on-load.tsx`); everything below the fold starts when an
 * IntersectionObserver says so (`scroll-appear.tsx`). What they play is the same
 * pair of keyframes in `globals.css`, driven by the custom properties below, so
 * a Section cannot end up moving differently from the one above it because two
 * files each did their own conversion.
 *
 * These are derived, never typed out. A `linear()` with 33 stops copied into a
 * stylesheet is a measurement that has been retyped, and the next session to
 * refit a spring would change `appear.ts` and leave the copy behind.
 */

/**
 * The resting state plus both curves, for one variant.
 *
 * The resting state is inline and **in the server markup**, which is what stops
 * a Section painting before it is asked to appear. A CSS animation overrides an
 * inline declaration that carries no `!important`, so the keyframes still win
 * when the trigger fires - and `layout.tsx`'s `<noscript>` rule is what rescues
 * the page when the trigger never arrives at all.
 */
export function appearStyle(variant: AppearVariant): React.CSSProperties {
  const { travel, spring, settle } = APPEAR[variant]

  return {
    opacity: 0,
    transform: `translateY(${travel}px)`,
    '--appear-travel': `${travel}px`,
    '--appear-travel-duration': `${settle.travel}s`,
    '--appear-travel-ease': linearEasing(spring, settle.travel),
    '--appear-opacity-duration': `${settle.opacity}s`,
    '--appear-opacity-ease': linearEasing(spring, settle.opacity),
  } as React.CSSProperties
}

/**
 * The same, for the one Section that is already on screen when the page loads.
 *
 * No resting state: the hero has nothing to wait for, and rendering it hidden is
 * exactly the defect #14 removed - it cost LCP 3.9s against an FCP of 0.9s while
 * the page waited for JavaScript that had nothing left to decide.
 */
export function appearOnLoadStyle(): React.CSSProperties {
  const { opacity, transform, ...rest } = appearStyle('section') as Record<
    string,
    unknown
  >
  void opacity
  void transform
  return rest as React.CSSProperties
}
