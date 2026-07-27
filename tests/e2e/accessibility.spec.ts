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

/*
 * One violation is knowingly carried, and it is carried narrowly.
 *
 * `link-in-text-block` fires on the footer by-line's two prose links, which are
 * white inside `--color-text-muted` prose with nothing else to mark them - 1.7:1,
 * against the 3:1 the rule wants. That is the Reference's own drawing, restored
 * in #30 at the owner's direction (see the README's Deviations register and
 * `site-footer.tsx`).
 *
 * The rule stays **on**. What is accepted is those two links by name, so a third
 * prose link drawn the same way anywhere on the site fails this scan rather than
 * inheriting the exception - which is the difference between a decision and a
 * disabled rule.
 */
const ACCEPTED_RULE = 'link-in-text-block'
const ACCEPTED_LINKS = ['>Framer<', '>Ramish Aziz<']

/** Violation ids, with the accepted by-line links removed by name. */
function unaccepted(violations: Awaited<ReturnType<typeof scan>>['violations']) {
  return violations
    .filter((violation) => {
      if (violation.id !== ACCEPTED_RULE) return true
      return !violation.nodes.every((node) =>
        ACCEPTED_LINKS.some((label) => node.html.includes(label)),
      )
    })
    .map((violation) => violation.id)
}

for (const route of ['/', '/templates', '/blog', '/no-such-page']) {
  test(`${route} passes axe`, async ({ page }) => {
    await page.goto(route)
    const { violations } = await scan(page)

    expect(unaccepted(violations)).toEqual([])
  })
}

/*
 * The quiz modal (PRD 6.13), which is the second state on the site that can trap
 * a keyboard and the only one that opens by itself. It fires six seconds in
 * (measured in #12), which is why this one waits.
 */
test('the quiz modal passes axe while open', async ({ page }) => {
  await page.goto('/')
  const modal = page.getByRole('dialog', { name: /Get 30% off/ })
  await expect(modal).toBeVisible({ timeout: 12_000 })

  const { violations } = await scan(page)

  expect(unaccepted(violations)).toEqual([])
})

test('the phone menu passes axe while open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeVisible()

  const { violations } = await scan(page)

  expect(unaccepted(violations)).toEqual([])
})
