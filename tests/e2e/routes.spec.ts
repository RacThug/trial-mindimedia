import { expect, test, type Page } from '@playwright/test'

/*
 * "No link 404s or dead-ends" is the acceptance criterion this file owns, and it
 * is checked by following the page's own links rather than by listing the
 * routes we happen to remember writing. A link added to `links.json` tomorrow
 * fails here until its route exists.
 *
 * External links are checked for shape only. Hitting x.com, YouTube and Typeform
 * from a test suite makes the suite depend on three third parties to stay green,
 * which is the same reason the Fidelity harness in #14 is not a gate.
 *
 * **This file made that claim for four work packages while four links 404ed**,
 * and the reason is worth keeping, because it is the ordinary way a green suite
 * covers less than its header says. The crawl below used to select
 * `header a, footer a` - the shell - so every Section's own CTAs went unchecked,
 * and the four `/templates/<slug>` links live in Sections. A crawl scoped to
 * where the bug is not will pass forever. It now walks `main` as well, and the
 * two share one assertion so neither can drift into checking less than the
 * other.
 */

/**
 * Follow every link `selector` finds and insist each one lands somewhere.
 * `least` guards the crawl itself: a selector that has quietly stopped matching
 * anything passes a loop over an empty list, which is the failure mode that let
 * four dead links through.
 */
async function expectEveryLinkResolves(page: Page, selector: string, least: number) {
  const hrefs = await page.evaluate(
    (query) =>
      [...document.querySelectorAll(query)].map((link) => link.getAttribute('href')),
    selector,
  )
  expect(hrefs.length, `${selector} matched nothing`).toBeGreaterThan(least)

  for (const href of hrefs) {
    expect(href, 'a link with no href is a dead end').toBeTruthy()
    if (href?.startsWith('/')) {
      expect((await page.request.get(href)).status(), href).toBe(200)
    } else {
      expect(href, 'an off-site link must be absolute https').toMatch(/^https:\/\//)
    }
  }
}

const ROUTES = [
  '/',
  '/templates',
  '/live-examples',
  '/support',
  '/blog',
  '/bundle',
  '/quiz',
  '/privacy',
]

test.describe('the placeholder routes', () => {
  for (const route of ROUTES) {
    test(`${route} answers 200 inside the shell`, async ({ page }) => {
      const response = await page.goto(route)

      expect(response?.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('header')).toBeVisible()
      await expect(page.locator('footer')).toBeVisible()
    })
  }

  test('an unrouted path renders the not-found page, still inside the shell', async ({
    page,
  }) => {
    const response = await page.goto('/no-such-page')

    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole('heading', { name: 'That page is not here.' }),
    ).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })

  test('every link the shell renders resolves', async ({ page }) => {
    await page.goto('/')
    /* Open the phone menu too, so the four links only it renders are covered. */
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: 'Open menu' }).click()

    await expectEveryLinkResolves(page, 'header a, footer a', 10)
  })

  test("every link the homepage's own Sections render resolves", async ({ page }) => {
    await page.goto('/')

    await expectEveryLinkResolves(page, 'main a', 5)
  })
})

test.describe('/templates/<slug>', () => {
  /* The three from `templates.json` and the case study's fourth, which is the
   * whole set of Template links the page draws (#34). */
  const DETAIL = ['selene', 'zenna', 'traction', 'reformr']

  for (const slug of DETAIL) {
    test(`/templates/${slug} answers 200 and names the Template`, async ({ page }) => {
      const response = await page.goto(`/templates/${slug}`)

      expect(response?.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/\w/)
      await expect(page.getByRole('link', { name: 'Browse all templates' })).toBeVisible()
    })
  }

  test('a slug no Template owns still 404s', async ({ page }) => {
    /* `dynamicParams = false` is what holds this: the four above are
     * prerendered and nothing else gets a page. A route that answered 200 for
     * any slug would pass the crawl above while inventing products. */
    const response = await page.goto('/templates/no-such-template')

    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole('heading', { name: 'That page is not here.' }),
    ).toBeVisible()
  })
})

test.describe('/templates', () => {
  test('renders what it fetched from /api/templates', async ({ page }) => {
    const calls: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/templates')) calls.push(request.url())
    })

    await page.goto('/templates')

    /* The three the Reference features, with their measured prices, having
     * arrived over HTTP rather than through an import (ADR-0002). */
    await expect(page.getByRole('heading', { name: 'Selene', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Zenna', exact: true })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Traction', exact: true }),
    ).toBeVisible()
    await expect(page.getByText('$129').first()).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: 'Selene' })).toContainText(
      'AI SAAS',
    )

    expect(calls).toHaveLength(1)
  })

  test('says so rather than showing an empty page when the API is unreachable', async ({
    page,
  }) => {
    await page.route('**/api/templates', (route) => route.abort())

    await page.goto('/templates')

    /* Scoped to `main`: Next's own route announcer is also `role="alert"`. */
    await expect(page.locator('main [role="alert"]')).toContainText('/api/templates')
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  })
})
