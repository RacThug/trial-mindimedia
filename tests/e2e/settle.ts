import type { Page } from '@playwright/test'

/**
 * Long enough for an IntersectionObserver to report before the page moves on.
 *
 * An observer reports on a task of its own rather than in the frame that moved
 * the page, so centring the islands back-to-back on consecutive frames scrolls
 * past some of them before they are ever reported. A missed island never
 * animates, and no amount of waiting afterwards will start it - which is why the
 * sweep below converges rather than trusting one pass. Under a parallel test run
 * this is not hypothetical: a single-pass sweep failed on a loaded machine and
 * passed on an idle one.
 */
const OBSERVER_DELIVERY_MS = 60

/** The slowest measured appear: the nested cards, on their overdamped spring. */
const SLOWEST_APPEAR_MS = 2400

const SWEEPS = 4

/**
 * Which appear islands have not arrived yet, by index.
 *
 * The one reading of "arrived" in this file. Returning indices rather than a
 * boolean is what lets the sweep re-centre exactly the stragglers, and lets a
 * failure name them instead of timing out anonymously.
 */
async function pendingIslands(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-appear]')]
      .map((element, index) => {
        const style = getComputedStyle(element)
        /*
         * The identity matrix counts as untransformed, and has to since #14
         * moved Scroll-Appear from Motion to a CSS animation. A `both`-filled
         * animation whose last keyframe is `transform: none` still reports
         * `matrix(1, 0, 0, 1, 0, 0)` rather than the string `none`, because an
         * animation is applying a value either way. The element is exactly where
         * it belongs; only the string differs, and reading it strictly failed
         * three specs on a page where nothing had moved.
         */
        const still =
          style.transform === 'none' || style.transform === 'matrix(1, 0, 0, 1, 0, 0)'
        const arrived = Number(style.opacity) === 1 && still
        return arrived ? -1 : index
      })
      .filter((index) => index >= 0),
  )
}

/**
 * Play every Scroll-Appear island out, then return to where the page was.
 *
 * Any test that measures geometry has to call this after navigating. Sections
 * animate in over ~750ms from a 30px offset, and the nested cards over ~2.3s
 * (PRD 6.15), so two `boundingBox()` calls awaited one after the other during
 * that window read the same element at two different heights - which is how the
 * hero's rating test started failing by 20px against a layout that had not
 * moved at all.
 *
 * It triggers rather than waits. Waiting for whatever is on screen to settle
 * deadlocks on the island peeking over the bottom edge: Scroll-Appear fires at
 * half the element, so something one pixel into view is not animating and never
 * will until it is scrolled to. Centring an island fires it - centred, an
 * element shows either all of itself or a full viewport of itself, and either
 * satisfies the threshold - and because the animation plays once, nothing moves
 * again for the rest of the test.
 *
 * PRD section 8 asks the same of the fidelity harness, for the same reason.
 */
export async function settleAppear(page: Page): Promise<void> {
  const restore = await page.evaluate(() => window.scrollY)

  for (let sweep = 0; sweep < SWEEPS; sweep += 1) {
    const pending = await pendingIslands(page)
    if (pending.length === 0) break

    await page.evaluate(
      async ({ indices, deliveryMs }) => {
        const islands = [...document.querySelectorAll('[data-appear]')]
        for (const index of indices) {
          islands[index]?.scrollIntoView({ block: 'center' })
          await new Promise((resolve) => setTimeout(resolve, deliveryMs))
        }
      },
      { indices: pending, deliveryMs: OBSERVER_DELIVERY_MS },
    )

    /* Let the springs run, but stop as soon as they have all landed. */
    const deadline = Date.now() + SLOWEST_APPEAR_MS
    while (Date.now() < deadline) {
      if ((await pendingIslands(page)).length === 0) break
      await page.waitForTimeout(100)
    }
  }

  const stuck = await pendingIslands(page)
  if (stuck.length > 0) {
    throw new Error(
      `Scroll-Appear islands never arrived after ${SWEEPS} sweeps: ${stuck.join(', ')}`,
    )
  }

  await page.evaluate((to) => window.scrollTo(0, to), restore)
}
