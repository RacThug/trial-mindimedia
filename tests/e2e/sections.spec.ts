import { expect, test, type Page } from '@playwright/test'

/*
 * The claims issue #10 makes about the hero, the Template Wall and the featured
 * Templates - the ones a later session would otherwise re-derive from instinct
 * and get wrong. Each is measured off the Reference and stated in PRD 6.2-6.4.
 *
 * Two of them exist because the wall is the most likely fidelity mistake on the
 * page: it looks like a marquee and is not one, and its Testimonials look
 * static from the top of the page and are not.
 */

const DESKTOP = { width: 1440, height: 900 }
const TABLET = { width: 810, height: 900 }
const PHONE = { width: 390, height: 844 }

/**
 * Every wall tile's position, as the wall renders it right now.
 *
 * Scoped to the wall itself rather than to every `alt=""` image on the page:
 * the featured cards carry a decorative second screenshot each, and a static-
 * grid assertion that counts those is not asserting what it says it is.
 */
const tilePositions = (page: Page) =>
  page.evaluate(() => {
    const wall = [...document.querySelectorAll('div[aria-hidden="true"]')].find(
      (element) => element.querySelectorAll('img, video').length > 8,
    )
    if (!wall) throw new Error('no Template Wall')

    return [...wall.children]
      .map((tile) => tile.getBoundingClientRect())
      .map((box) => `${Math.round(box.x)},${Math.round(box.y)}`)
  })

/** The quote on screen inside the Wall's Testimonial block. */
const visibleQuote = (page: Page) =>
  page.evaluate(() => {
    const list = document.querySelector('ul[aria-label="What customers say"]')
    if (!list) throw new Error('no Testimonial block')
    const window_ = list.getBoundingClientRect()

    return [...list.querySelectorAll('blockquote')]
      .filter((quote) => {
        const box = quote.getBoundingClientRect()
        return box.top >= window_.top && box.bottom <= window_.bottom
      })
      .map((quote) => quote.textContent?.trim())
      .join('')
  })

/** Scrolls the Wall's Testimonials into view, which is what starts them. */
async function showTestimonials(page: Page) {
  await page.locator('ul[aria-label="What customers say"]').scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
}

test.describe('the Template Wall (PRD 6.3)', () => {
  test.use({ viewport: DESKTOP })

  test('is a static grid: nothing moves over 3 seconds at a fixed scroll', async ({
    page,
  }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, 700))
    await page.waitForTimeout(500)

    const before = await tilePositions(page)
    expect(before.length).toBeGreaterThanOrEqual(16)

    await page.waitForTimeout(3000)

    expect(await tilePositions(page)).toEqual(before)
  })

  test('gives every tile an explicit aspect ratio, so the grid costs no CLS', async ({
    page,
  }) => {
    await page.goto('/')

    const ratios = await page.evaluate(() => {
      const wall = [...document.querySelectorAll('div[aria-hidden="true"]')].find(
        (element) => element.querySelectorAll('img, video').length > 8,
      )
      if (!wall) throw new Error('no Template Wall')

      return [...wall.children].map((tile) => getComputedStyle(tile).aspectRatio)
    })

    expect(ratios.length).toBeGreaterThanOrEqual(16)
    expect(ratios.every((ratio) => ratio !== 'auto')).toBe(true)
  })

  test('runs its clips lazily: no video byte is fetched for the first screen', async ({
    page,
  }) => {
    await page.goto('/')

    const preloads = await page.evaluate(() =>
      [...document.querySelectorAll('video')].map((video) => video.preload),
    )

    expect(preloads.length).toBe(6)
    expect(preloads.every((preload) => preload === 'none')).toBe(true)
  })
})

test.describe("the Wall's Testimonials (PRD 6.3)", () => {
  test.use({ viewport: DESKTOP })

  /*
   * PRD 6.3 and issue #10 both said these do not auto-advance, on a measurement
   * that is reproducible and misread: the block pauses when it is off screen, so
   * sampling it from the top of the page finds identical quotes for as long as
   * you care to wait. Measured in #10 with the block in view, it advances every
   * 3.2s in the Wall's own order. Both halves are asserted here, because the
   * pause is what makes the original reading look right.
   */
  test('advance on their own while in view', async ({ page }) => {
    await page.goto('/')
    await showTestimonials(page)

    const first = await visibleQuote(page)
    expect(first).not.toBe('')

    await expect.poll(() => visibleQuote(page), { timeout: 8000 }).not.toBe(first)
  })

  test('hold still while the block is off screen', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)

    const before = await visibleQuote(page)
    await page.waitForTimeout(5000)

    expect(await visibleQuote(page)).toBe(before)
  })

  /*
   * WCAG 2.2.2 wants a mechanism to stop moving content, and the Reference has
   * none: its own prev/next chevrons are `display: none` at every Breakpoint.
   * The control is invisible until focused, so it costs nothing in an at-rest
   * capture and a keyboard visitor can still reach it (PRD 6.3).
   */
  test('can be stopped from the keyboard, by a control that is out of the way', async ({
    page,
  }) => {
    await page.goto('/')
    await showTestimonials(page)

    const pause = page.getByRole('button', { name: 'Pause the quotes' })
    await expect(pause).toBeAttached()
    /* Reachable, and invisible until it is. */
    expect((await pause.boundingBox())?.width ?? 0).toBeLessThan(2)

    await pause.focus()
    expect((await pause.boundingBox())!.width).toBeGreaterThan(100)

    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'Resume the quotes' })).toBeFocused()

    const before = await visibleQuote(page)
    await page.waitForTimeout(5000)

    expect(await visibleQuote(page)).toBe(before)
  })

  test('hold still under prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await showTestimonials(page)

    const before = await visibleQuote(page)
    await page.waitForTimeout(5000)

    expect(await visibleQuote(page)).toBe(before)
  })

  test('start with Jacob, whose quote is the Wall order and not the grid one', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page.getByText('Brilliant template. Super well')).toBeAttached()
    const names = await page.evaluate(() =>
      [
        ...document.querySelectorAll('ul[aria-label="What customers say"] figcaption'),
      ].map((caption) => caption.textContent?.trim()),
    )

    expect(names).toEqual(['Jacob', 'Mark', 'Aba', 'Roni', 'Nic', 'Seyed'])
  })
})

test.describe('the hero (PRD 6.2)', () => {
  for (const [name, viewport, size] of [
    ['desktop', DESKTOP, '68px'],
    ['tablet', TABLET, '60px'],
    ['phone', PHONE, '44px'],
  ] as const) {
    test(`renders the H1 at ${size} on ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')

      await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-size', size)
    })
  }

  test('puts the rating above the buttons on phone, with both full width', async ({
    page,
  }) => {
    await page.setViewportSize(PHONE)
    await page.goto('/')

    const rating = page.getByText('Rated 4.92/5')
    const primary = page.getByRole('link', { name: 'Pick your template' })
    const secondary = page.getByRole('link', { name: /Or get matched/ })

    const [ratingBox, primaryBox, secondaryBox] = await Promise.all([
      rating.boundingBox(),
      primary.boundingBox(),
      secondary.boundingBox(),
    ])

    expect(ratingBox!.y).toBeLessThan(primaryBox!.y)
    /* The rail is 350 wide at 390: both buttons fill it, stacked. */
    expect(Math.round(primaryBox!.width)).toBe(350)
    expect(Math.round(secondaryBox!.width)).toBe(350)
    expect(secondaryBox!.y).toBeGreaterThan(primaryBox!.y)
  })

  test('keeps the rating beside the buttons above phone', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/')

    const rating = await page.getByText('Rated 4.92/5').boundingBox()
    const primary = await page
      .getByRole('link', { name: 'Pick your template' })
      .boundingBox()

    expect(Math.abs(rating!.y - primary!.y)).toBeLessThan(20)
    expect(rating!.x).toBeGreaterThan(primary!.x)
  })

  /*
   * The secondary CTA's short copy belongs to tablet, not to phone. PRD 6.2 and
   * #8 both had it the other way round from reading the served markup; #10
   * measured the render at ten widths, including both sides of each Breakpoint.
   */
  for (const [name, viewport, copy] of [
    ['desktop', DESKTOP, 'Or get matched with the perfect one'],
    ['tablet', TABLET, 'Or get matched with one'],
    ['phone', PHONE, 'Or get matched with the perfect one'],
  ] as const) {
    test(`renders "${copy}" on ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')

      const link = page.getByRole('link', { name: /Or get matched/ })
      /* The accessible name rather than the text: both variants are in the
       * markup and CSS decides which one renders, so `textContent` would return
       * the pair of them concatenated. */
      await expect(link).toHaveAccessibleName(copy)
      await expect(link).toHaveAttribute(
        'href',
        'https://browsersupply.typeform.com/template-quiz',
      )
    })
  }
})

test.describe('the featured Templates (PRD 6.4)', () => {
  test.use({ viewport: DESKTOP })

  test('are the measured three, each linking to its own page', async ({ page }) => {
    await page.goto('/')

    /* Located by href rather than by name: the card's accessible name starts
     * with its screenshot's alt text, which is content and may be reworded. */
    for (const [name, category, slug] of [
      ['Selene', 'AI SAAS', 'selene'],
      ['Zenna', 'Yoga Studio', 'zenna'],
      ['Traction', 'SMMA', 'traction'],
    ] as const) {
      const card = page.locator(`a[href="/templates/${slug}"]`)
      await expect(card).toContainText(name)
      /* Sentence case in the markup, uppercased by CSS (PRD 6.4). */
      await expect(card).toContainText(category)
      await expect(card).toContainText('$129')
      await expect(card).toContainText('USD')
    }

    await expect(page.getByRole('link', { name: 'View all' })).toHaveAttribute(
      'href',
      '/templates',
    )
  })

  /*
   * The H2's measure, which decides where its two lines break. At tablet the
   * Reference draws it 674 wide inside a 632 column - wider than what holds it -
   * so a `max-width` would silently resolve to 632 and balance against a
   * different measure. Nothing else would report that.
   */
  for (const [name, viewport, width] of [
    ['desktop', DESKTOP, 616],
    ['tablet', TABLET, 674],
    ['phone', PHONE, 350],
  ] as const) {
    test(`sets the H2 measure to ${width}px on ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')

      const box = await page
        .getByRole('heading', { name: 'Premium templates built to drive results.' })
        .boundingBox()

      expect(Math.round(box!.width)).toBe(width)
    })
  }

  test('uppercase the badge and categories in CSS, not in the content', async ({
    page,
  }) => {
    await page.goto('/')

    const badge = page.getByText('New', { exact: true })
    await expect(badge).toHaveCSS('text-transform', 'uppercase')
    /* The markup says `New`; the render says NEW (PRD 6.4). */
    expect(await badge.textContent()).toBe('New')
  })
})
