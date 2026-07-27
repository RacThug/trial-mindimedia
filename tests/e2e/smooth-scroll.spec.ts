import { expect, test } from '@playwright/test'

/*
 * Smooth scrolling (PRD 6.16), measured off the Reference in #30: the wheel does
 * not move the page, it moves a target the page then follows over about a third
 * of a second, one page pixel per wheel pixel.
 *
 * These are the behaviours a curve constant cannot pin - that the wheel is
 * actually intercepted, that it arrives where it was sent, that it stands down
 * where the Reference's own does, and that a visitor who asked for less motion
 * gets the wheel back. The curve itself is unit-tested in
 * `tests/motion/smooth-scroll.test.ts` against the measured trace.
 */

/** Where the follow starts from, clear of the hero and of the modal's timer. */
const START = 1200

/** One notch, in the pixels a trackpad or a mouse sends. */
const NOTCH = 120

/** Well past the ~1.5s the measured curve needs to have effectively arrived. */
const SETTLED_MS = 2000

async function park(page: import('@playwright/test').Page) {
  await page.addInitScript(() => sessionStorage.setItem('quiz-modal-dismissed', 'true'))
  await page.goto('/')
  await page.mouse.move(400, 400)
  await page.evaluate((to) => window.scrollTo(0, to), START)
  /* Long enough for the page to stop moving on its own: images decoding above
   * the parked position nudge the scroll offset, and a follow that starts from
   * one of those nudges is a fraction of a pixel out. */
  await page.waitForTimeout(800)
}

test('a wheel notch lands one page pixel per wheel pixel', async ({ page }) => {
  await park(page)

  await page.mouse.wheel(0, NOTCH)
  await page.waitForTimeout(SETTLED_MS)

  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(START + NOTCH, 0)
})

test('takes the measured time getting there, rather than jumping', async ({ page }) => {
  await park(page)

  /*
   * Sampled in the page rather than read once at a wall-clock moment, and timed
   * from the wheel rather than from the test. Both matter under a parallel run:
   * this page plays a dozen clips, frames come 100ms apart on a loaded machine,
   * and a single reading at 150ms caught a run that had not had a frame yet -
   * and caught it 4px *above* where it parked, because images decoding above
   * the viewport nudge the scroll offset while the page settles.
   *
   * What is asserted is the shape rather than any one position: the follow needs
   * more than 400ms to come within 2px of the target. Chromium's own animated
   * wheel scroll - the thing this would degrade into if the interception were
   * dropped - lands inside 150ms.
   */
  const sampling = page.evaluate(async (notch) => {
    const start = window.scrollY
    const target = start + notch
    const t0 = performance.now()
    let arrived = -1

    while (performance.now() - t0 < 2500 && arrived < 0) {
      await new Promise((resolve) => requestAnimationFrame(resolve))
      if (Math.abs(window.scrollY - target) < 2) arrived = performance.now() - t0
    }
    return arrived
  }, NOTCH)

  /* Deliberately not awaited above: the sampler has to be running before the
   * wheel lands, or the first frames of the follow are missed. It waits on
   * `requestAnimationFrame`, so the page is free to handle the event. */
  await page.mouse.wheel(0, NOTCH)

  expect(await sampling).toBeGreaterThan(400)
})

test('stands down while the quiz modal is open, as the Reference does', async ({
  page,
}) => {
  /* No dismissal flag here: this is the one test that wants the modal up. */
  await page.goto('/')
  await page.mouse.move(400, 400)
  await expect(page.getByRole('dialog', { name: /Get 30% off/ })).toBeVisible({
    timeout: 12_000,
  })

  const before = await page.evaluate(() => window.scrollY)
  await page.mouse.wheel(0, 600)
  await page.waitForTimeout(SETTLED_MS)

  expect(await page.evaluate(() => window.scrollY)).toBe(before)
})

test('re-aims when something else moves the page', async ({ page }) => {
  await park(page)

  /* A wheel, then a jump somewhere else mid-follow: the next notch has to
   * continue from where the jump left the page, not from the target it was
   * chasing before. This is the failure a naive follow ships with. */
  await page.mouse.wheel(0, 600)
  await page.waitForTimeout(100)
  await page.evaluate(() => window.scrollTo(0, 4000))
  await page.waitForTimeout(300)

  await page.mouse.wheel(0, NOTCH)
  await page.waitForTimeout(SETTLED_MS)

  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(4000 + NOTCH, 0)
})

test.describe('under prefers-reduced-motion', () => {
  test('hands the wheel straight back', async ({ page }) => {
    /*
     * `emulateMedia` rather than `test.use({ reducedMotion })`, which does not
     * take inside a `describe` on this Playwright: measured, `matchMedia` still
     * reported `false` in the page, so the test was asserting against a build
     * that had never been told anything. Called before `park` navigates,
     * because the component reads the query once, on mount.
     */
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await park(page)

    expect(
      await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    ).toBe(true)

    /*
     * The contract is that the event is not cancelled, which is checked
     * directly: Chromium animates a native wheel scroll itself over ~150ms, so
     * "did it land instantly" cannot tell a handed-back wheel from a very short
     * follow. This listener is registered after ours and on the same phase, so
     * it sees whatever ours did to the event.
     */
    await page.evaluate(() => {
      window.addEventListener(
        'wheel',
        (event) => {
          Object.assign(window, { __prevented: event.defaultPrevented })
        },
        { passive: true },
      )
    })

    await page.mouse.wheel(0, NOTCH)
    await page.waitForTimeout(400)

    expect(await page.evaluate(() => Reflect.get(window, '__prevented'))).toBe(false)
    expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(START + NOTCH, 0)
  })
})
