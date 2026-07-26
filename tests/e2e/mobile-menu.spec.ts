import { expect, test } from '@playwright/test'

/*
 * The phone menu: opens, closes, and holds focus while it is open.
 *
 * Focus is the part worth testing rather than eyeballing. A full-viewport
 * overlay that lets Tab wander into the page behind it looks perfect in a
 * screenshot and is unusable with a keyboard or a screen reader, and the
 * Reference - which renders its control as a `div` with no name, no
 * `aria-expanded` and no trap - is no help as a specification here.
 */

test.use({ viewport: { width: 390, height: 844 } })

const openMenu = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeVisible()
}

test.describe('the phone menu', () => {
  test('opens and closes from the same control', async ({ page }) => {
    await page.goto('/')
    const menu = page.getByRole('dialog', { name: 'Site menu' })

    await expect(menu).toBeHidden()
    await openMenu(page)
    await expect(menu.getByRole('link', { name: 'Live examples' })).toBeVisible()

    await page.getByRole('button', { name: 'Close menu' }).click()
    await expect(menu).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible()
  })

  test('closes on Escape and hands focus back to the control', async ({ page }) => {
    await page.goto('/')
    await openMenu(page)

    await page.keyboard.press('Escape')

    await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()
  })

  test('traps Tab inside itself', async ({ page }) => {
    await page.goto('/')
    await openMenu(page)

    /* Forwards from the last stop wraps to the first, and backwards from the
     * first wraps to the last. Anything else means Tab has escaped into the page
     * underneath, which is the failure this test exists for. */
    const focused = () =>
      page.evaluate(() => {
        const element = document.activeElement
        return {
          inMenu: !!element?.closest('[role="dialog"]'),
          name: element?.getAttribute('aria-label') ?? element?.textContent?.trim() ?? '',
        }
      })

    const menu = page.getByRole('dialog', { name: 'Site menu' })
    await menu.getByRole('link', { name: 'Bundle' }).focus()
    await page.keyboard.press('Tab')
    expect(await focused()).toEqual({ inMenu: true, name: 'Browser.supply' })

    await page.keyboard.press('Shift+Tab')
    expect(await focused()).toEqual({ inMenu: true, name: 'Bundle' })

    /* And a full lap never leaves. */
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('Tab')
      expect((await focused()).inMenu, `after ${step + 1} tabs`).toBe(true)
    }
  })

  test('holds the page still while it is open', async ({ page }) => {
    await page.goto('/templates')
    await openMenu(page)

    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')

    await page.getByRole('button', { name: 'Close menu' }).click()
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
  })

  test('closes itself on the way to another page', async ({ page }) => {
    await page.goto('/')
    await openMenu(page)

    await page.getByRole('dialog').getByRole('link', { name: 'Support' }).click()

    await expect(page).toHaveURL('/support')
    await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('closes itself when the viewport grows past the tablet Breakpoint', async ({
    page,
  }) => {
    await page.goto('/')
    await openMenu(page)

    await page.setViewportSize({ width: 810, height: 1080 })

    await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeHidden()
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
  })
})
