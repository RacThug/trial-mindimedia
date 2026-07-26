import { expect, test } from '@playwright/test'

/*
 * The nav's one behavioural claim, and the one most likely to be "fixed" by a
 * later session acting on instinct: it does not react to scroll.
 *
 * PRD 6.1 states it, `globals.css` states it, and this is what happens if
 * someone adds the condensed-on-scroll state anyway. The surface values are
 * asserted alongside it because they are the other half of the same measurement
 * - the nav is tinted and blurred at every scroll position, not transparent, and
 * over the black hero the two are indistinguishable by eye.
 */

/** Everything about the nav that could plausibly animate on scroll. */
const sample = () => {
  const header = document.querySelector('header')
  if (!header) throw new Error('no nav')
  const style = getComputedStyle(header)
  const box = header.getBoundingClientRect()
  return {
    background: style.backgroundColor,
    backdrop: style.backdropFilter,
    transform: style.transform,
    opacity: style.opacity,
    top: Math.round(box.top),
    height: Math.round(box.height),
  }
}

test.describe('the fixed nav', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('does not change on scroll, in either direction', async ({ page }) => {
    /* A page with something to scroll, and one that is static all the way down:
     * the homepage is a placeholder until the Sections land, and `/templates`
     * only reaches its full height once its fetch resolves. A scroll test on a
     * page that cannot scroll yet passes for the wrong reason. */
    await page.goto('/blog')
    expect(
      await page.evaluate(() => document.body.scrollHeight > window.innerHeight),
    ).toBe(true)

    const atRest = await page.evaluate(sample)

    for (const y of [200, 600, 1000, 600, 0]) {
      await page.evaluate((to) => window.scrollTo(0, to), y)
      await page.waitForTimeout(150)
      expect(await page.evaluate(sample), `at scrollY ${y}`).toEqual(atRest)
    }
  })

  test('is 86px tall, tinted, blurred, and at z-index 8', async ({ page }) => {
    await page.goto('/')

    const measured = await page.evaluate(() => {
      const header = document.querySelector('header')!
      const style = getComputedStyle(header)
      const wrapper = getComputedStyle(header.parentElement!)
      return {
        height: Math.round(header.getBoundingClientRect().height),
        background: style.backgroundColor,
        backdrop: style.backdropFilter,
        position: wrapper.position,
        zIndex: wrapper.zIndex,
      }
    })

    expect(measured).toEqual({
      height: 86,
      background: 'rgba(0, 0, 0, 0.7)',
      backdrop: 'blur(12px)',
      position: 'fixed',
      zIndex: '8',
    })
  })

  test('shows the four links and the Bundle pill, and no menu control', async ({
    page,
  }) => {
    await page.goto('/')
    const nav = page.locator('header')

    for (const label of ['Templates', 'Live examples', 'Support', 'Blog']) {
      await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible()
    }
    await expect(nav.getByRole('link', { name: 'Bundle' })).toBeVisible()
    await expect(nav.getByRole('button', { name: 'Open menu' })).toBeHidden()
  })

  test('is 76px tall on phone, where the links become one control', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await expect(page.locator('header')).toHaveCSS('height', '76px')
    await expect(page.locator('header').getByRole('link', { name: 'Blog' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible()
  })
})
