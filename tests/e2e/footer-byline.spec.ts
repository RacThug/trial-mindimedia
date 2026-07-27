import { expect, test } from '@playwright/test'

/*
 * The footer by-line (PRD 6.12), re-measured in #15: two prose links drawn the
 * Reference's way, and a portrait that rocks and never stops.
 *
 * The underline these two links carried from #9 to #14 was ours, not the
 * Reference's, and taking it back out is a decision recorded in the README's
 * Deviations register. These pin it, so that nobody restores it by reflex.
 */

const LINKS = ['Framer', 'Ramish Aziz']

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('quiz-modal-dismissed', 'true'))
  await page.goto('/')
  await page.locator('footer').scrollIntoViewIfNeeded()
})

for (const label of LINKS) {
  test(`${label} is white, unmarked, and fades to 60% on hover`, async ({ page }) => {
    const link = page.locator('footer a').filter({ hasText: label }).first()

    await expect(link).toHaveCSS('text-decoration-line', 'none')
    await expect(link).toHaveCSS('color', 'rgb(255, 255, 255)')

    await link.hover()
    /* The measured 200ms `cubic-bezier(0.44, 0, 0.56, 1)`, plus room. */
    await page.waitForTimeout(400)
    await expect(link).toHaveCSS('color', 'rgba(255, 255, 255, 0.6)')
  })
}

test('the portrait rocks between the two measured angles', async ({ page }) => {
  const portrait = page.locator('footer [style*="--byline-rock-duration"]').first()
  await expect(portrait).toHaveCount(1)

  /*
   * Sampled rather than asserted once: the angle at any given moment is
   * whatever the cycle has reached, and what makes it the measured animation is
   * the pair of ends it visits. Just over one 2834ms cycle, so both are seen
   * whichever phase this lands in.
   */
  const angles = await portrait.evaluate(async (node) => {
    const seen: number[] = []
    const t0 = performance.now()
    while (performance.now() - t0 < 3000) {
      await new Promise((resolve) => requestAnimationFrame(resolve))
      seen.push(Number.parseFloat(getComputedStyle(node).rotate))
    }
    return seen
  })

  /* The spring overshoots by about 0.36deg at each end before settling. */
  expect(Math.max(...angles)).toBeGreaterThan(8)
  expect(Math.max(...angles)).toBeLessThan(9)
  expect(Math.min(...angles)).toBeLessThan(-12)
  expect(Math.min(...angles)).toBeGreaterThan(-13)
})

test.describe('under prefers-reduced-motion', () => {
  test('the portrait holds still at the angle it is served at', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.locator('footer').scrollIntoViewIfNeeded()

    const portrait = page.locator('footer [style*="--byline-rock-duration"]').first()
    await expect(portrait).toHaveCSS('animation-name', 'none')
    await expect(portrait).toHaveCSS('rotate', '-12deg')
  })
})
