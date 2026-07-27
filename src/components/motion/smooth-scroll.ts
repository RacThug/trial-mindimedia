/*
 * The Reference does not scroll natively, and #30 measured what it does instead.
 *
 * `<html>` carries a `lenis` class: Framer's smooth-scrolling page setting ships
 * Lenis, which cancels the wheel event and moves the page from its own rAF loop.
 * Three readings, at 1440x900 with the quiz modal dismissed and headless
 * backgrounding disabled, sampling `scrollY` every frame:
 *
 * | input        | travelled | shape |
 * | 1 x 120      | 120px | exponential, tau 287ms, rms 0.34px over 96 frames |
 * | 1 x 600      | 600px | exponential, tau 290ms, rms 1.20px |
 * | 3 x 120/40ms | 360px | the same, restarted by each notch |
 *
 * So: **one wheel pixel is one page pixel** - no multiplier, which is the first
 * thing to check and the easiest to get wrong by feel - and the page takes about
 * a third of a second to catch up with where the wheel has already put it.
 *
 * A duration-and-easing fit is indistinguishable from the exponential one on
 * this data (Lenis can be configured either way; expo-out over ~2.0s fits to the
 * same 0.34px). The exponential is the one implemented, because it is what a
 * damped follow *is*: an interrupted swing has no duration to restart, and the
 * three-notch reading is a stream of interruptions. Fitting both and picking is
 * `docs/measure/fit-15-scroll.mjs`.
 *
 * Three traps cost a reading each on the way to those numbers, all recorded in
 * issue #30: the quiz modal stops Lenis outright, headless throttles rAF to
 * ~9fps unless backgrounding is disabled, and a wheel event goes nowhere unless
 * the pointer has been moved over the page first.
 */

/**
 * The time constant of the follow, in milliseconds.
 *
 * `tau` rather than a per-frame lerp on purpose. A lerp is a fraction of the
 * remaining distance *per frame*, so the same number scrolls a 120Hz display
 * twice as fast; the same curve expressed as a time constant is what the two
 * fitted readings above actually agree on, at 287 and 290ms.
 */
export const SCROLL_TAU_MS = 288

/** Wheel pixels to page pixels. Measured at exactly 1. */
export const SCROLL_MULTIPLIER = 1

/**
 * Below this, the follow has arrived and the loop stops.
 *
 * Half a device pixel at 2x: any less and the page is still repainting for
 * movement no display can show.
 */
export const SCROLL_EPSILON_PX = 0.25

/**
 * A wheel delta in the event's own units, as pixels.
 *
 * Chromium and WebKit send pixels, so this is the identity for most visitors.
 * Firefox sends lines, and pages send `DOM_DELTA_PAGE` from a few assistive
 * setups. The Reference's own line constant is inside a minified closure and
 * could not be read, so a line is one root line-height here - which is what the
 * value means - rather than a number copied from a library.
 */
export function scrollDelta(event: WheelEvent, lineHeightPx: number, viewportPx: number) {
  if (event.deltaMode === 1) return event.deltaY * lineHeightPx * SCROLL_MULTIPLIER
  if (event.deltaMode === 2) return event.deltaY * viewportPx * SCROLL_MULTIPLIER
  return event.deltaY * SCROLL_MULTIPLIER
}

/**
 * One frame of the follow: where the page should be, `elapsedMs` after being at
 * `from` and aiming at `to`.
 *
 * Frame-rate independent by construction - `exp(-dt/tau)` composes over any
 * split of the same interval - so a dropped frame lands in the same place as
 * two on time, and a 120Hz display scrolls at the speed a 60Hz one does.
 */
export function scrollStep(from: number, to: number, elapsedMs: number): number {
  return to + (from - to) * Math.exp(-elapsedMs / SCROLL_TAU_MS)
}
