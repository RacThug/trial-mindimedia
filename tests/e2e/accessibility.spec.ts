import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/*
 * The axe scan PRD section 9 asks for, over the shell as it stands: every page
 * this work package adds, plus the phone menu open, which is the one state on
 * the site that can trap a keyboard.
 *
 * It runs on what exists today. As Sections land the page list grows, and the
 * scan is the thing that will notice the Reference's own habits arriving with
 * them - 72 images with no `alt` attribute, a menu control with no accessible
 * name - which PRD 6.14 already records as Deviations we take deliberately.
 */

const scan = (page: import('@playwright/test').Page) =>
  new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

for (const route of ['/', '/templates', '/blog', '/no-such-page']) {
  test(`${route} passes axe`, async ({ page }) => {
    await page.goto(route)
    const { violations } = await scan(page)

    expect(violations.map((violation) => violation.id)).toEqual([])
  })
}

test('the phone menu passes axe while open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeVisible()

  const { violations } = await scan(page)

  expect(violations.map((violation) => violation.id)).toEqual([])
})
