import type { Page } from '@playwright/test'

/**
 * Play every Scroll-Appear island out, then return to the top.
 *
 * Any test that measures geometry has to call this after navigating. Sections
 * animate in over ~750ms from a 30px offset (#13), so two `boundingBox()` calls
 * awaited one after the other during that window read the same element at two
 * different heights - which is how the hero's rating test started failing by
 * 20px against a layout that had not changed.
 *
 * It triggers rather than waits. Waiting for what is on screen to settle
 * deadlocks on the island peeking over the bottom edge: Scroll-Appear fires at
 * half the element, so something one pixel into view is not animating and never
 * will until it is scrolled to. Centring each island in turn fires all of them -
 * centred, an element shows either all of itself or a full viewport of itself,
 * and either satisfies the threshold - and because the animation plays once,
 * nothing moves again for the rest of the test.
 *
 * PRD section 8 asks the same of the fidelity harness, for the same reason.
 */
export async function settleAppear(page: Page): Promise<void> {
  const restore = await page.evaluate(async () => {
    const arrived = (element: Element) => {
      const style = getComputedStyle(element)
      return Number(style.opacity) === 1 && style.transform === 'none'
    }

    const start = window.scrollY
    const islands = [...document.querySelectorAll('[data-appear]')]

    /*
     * Give each scroll a task to land in, and sweep more than once. An
     * IntersectionObserver reports on a task of its own rather than in the frame
     * that moved the page, so centring the islands back-to-back on consecutive
     * frames scrolls past some of them before they are ever reported - they then
     * never animate, and waiting on them below would hang until the test times
     * out. Re-sweeping whatever is still at rest converges instead of assuming.
     */
    for (let pass = 0; pass < 3; pass += 1) {
      const pending = islands.filter((element) => !arrived(element))
      if (pending.length === 0) break

      for (const element of pending) {
        element.scrollIntoView({ block: 'center' })
        await new Promise((resolve) => setTimeout(resolve, 60))
      }
      /* Long enough for the last one started to finish its ~750ms spring. */
      await new Promise((resolve) => setTimeout(resolve, 900))
    }

    return start
  })

  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-appear]')].every((element) => {
      const style = getComputedStyle(element)
      return Number(style.opacity) === 1 && style.transform === 'none'
    }),
  )

  await page.evaluate((to) => window.scrollTo(0, to), restore)
}
