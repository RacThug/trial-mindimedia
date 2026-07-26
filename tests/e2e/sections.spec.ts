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

  /*
   * Scoped to the wall's own six rather than to every clip on the page: the
   * feature bento, two step cards and the case study brought six more in #11,
   * and a count that grows with the page is not asserting what it says. The
   * page-wide half of the claim is asserted once, below.
   */
  test('runs its clips lazily: no video byte is fetched for the first screen', async ({
    page,
  }) => {
    await page.goto('/')

    const preloads = await page.evaluate(() => {
      const wall = [...document.querySelectorAll('div[aria-hidden="true"]')].find(
        (element) => element.querySelectorAll('img, video').length > 8,
      )
      if (!wall) throw new Error('no Template Wall')
      return [...wall.querySelectorAll('video')].map((video) => video.preload)
    })

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

/*
 * The four Sections #11 added, and the claims about them that a later session
 * would otherwise re-derive from instinct and get wrong. Every number here is
 * measured off the Reference at 1440, 810 and 390 and stated in PRD 6.5 to 6.8.
 */

/** Each bento card's measured width, in Reference order. */
const bentoCardWidths = (page: Page) =>
  page.evaluate(() => {
    const band = [...document.querySelectorAll('main > section')].find((section) =>
      section.textContent?.includes('Everything you need to launch'),
    )
    if (!band) throw new Error('no feature bento')

    /* The card is the box that carries the hairline or the clip: walk out of the
     * title for as long as nothing else joins it. */
    return [...band.querySelectorAll('h3')].map((title) => {
      let card: Element = title
      while (
        card.parentElement &&
        card.parentElement.querySelectorAll('h3').length === 1
      ) {
        card = card.parentElement
      }
      return Math.round(card.getBoundingClientRect().width)
    })
  })

test.describe('the feature bento (PRD 6.5)', () => {
  /*
   * The spans are unequal at the two wider Breakpoints, and are the thing most
   * likely to be "tidied" into a 2x2 or an even three-across: 752 + 448 over
   * (576: 268 + 268) + 624 at desktop, and 365 + 365 over (341) + 389 at tablet.
   */
  for (const [name, viewport, widths] of [
    ['desktop', DESKTOP, [752, 448, 576, 576, 624]],
    ['tablet', TABLET, [365, 365, 341, 341, 389]],
    ['phone', PHONE, [350, 350, 350, 350, 350]],
  ] as const) {
    test(`spans its five cards as measured on ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')

      expect(await bentoCardWidths(page)).toEqual([...widths])
    })
  }

  /*
   * The stack's heights, which the spans do not pin: three of the five fall out
   * of their content and would drift with a font or a copy change without ever
   * failing a width assertion.
   */
  test('stacks to the measured heights on phone', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await page.goto('/')

    const heights = await page.evaluate(() => {
      const band = [...document.querySelectorAll('main > section')].find((section) =>
        section.textContent?.includes('Everything you need to launch'),
      )
      if (!band) throw new Error('no feature bento')

      return [...band.querySelectorAll('h3')].map((title) => {
        let card: Element = title
        while (
          card.parentElement &&
          card.parentElement.querySelectorAll('h3').length === 1
        ) {
          card = card.parentElement
        }
        return Math.round(card.getBoundingClientRect().height)
      })
    })

    expect(heights).toEqual([346, 332, 285, 285, 352])
  })

  test('defers every clip on the page, the bento included', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/')

    const preloads = await page.evaluate(() =>
      [...document.querySelectorAll('video')].map((video) => video.preload),
    )

    /* Six over the Wall, three in the bento, two in the steps, one in the case
     * study, and the founder's from #12. None of them is above the fold, and the
     * Reference autoplays every one at `preload="auto"` (PRD section 8). The
     * Quiz CTA's backdrop adds none: it is stills only. */
    expect(preloads.length).toBe(13)
    expect(preloads.every((preload) => preload === 'none')).toBe(true)
  })

  test('sets `real` in emphasis, invisibly, the way the Reference does', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/')

    const emphasis = page.locator('em', { hasText: 'real' })
    await expect(emphasis).toHaveText('real')
    await expect(emphasis).toHaveCSS('font-style', 'normal')
  })
})

/**
 * Where step 1's first thumbnail is right now.
 *
 * Scoped to its own band on purpose: the Wall's Testimonials are a `ul` of `li`
 * with an avatar in each too, they come first in the document, and they hold
 * still while off screen - so the loose selector finds them and reports that
 * nothing here moves.
 */
const thumbnailY = (page: Page) =>
  page.evaluate(() => {
    const band = [...document.querySelectorAll('main > section')].find((section) =>
      section.textContent?.includes('Go live within 1 hour'),
    )
    const tile = band?.querySelector('ul li img')
    if (!tile) throw new Error('no thumbnail column')
    return tile.getBoundingClientRect().y
  })

test.describe('how it works (PRD 6.6)', () => {
  test.use({ viewport: DESKTOP })

  /*
   * Two of the three step cards are their content plus the measured 28px
   * between their groups; only the first has a height of its own. Pinned for
   * the same reason as the bento's.
   */
  test('stacks to the measured heights on phone', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await page.goto('/')

    const heights = await page.evaluate(() => {
      const band = [...document.querySelectorAll('main > section')].find((section) =>
        section.textContent?.includes('Go live within 1 hour'),
      )
      const frame = [...(band?.querySelectorAll('div') ?? [])].find((element) =>
        element.className.includes('rounded-steps'),
      )
      if (!frame) throw new Error('no step cards')

      return [...frame.children].map((card) =>
        Math.round(card.getBoundingClientRect().height),
      )
    })

    expect(heights).toEqual([362, 439, 461])
  })

  test('numbers its badges from their position, not from a field', async ({ page }) => {
    await page.goto('/')

    const badges = await page.evaluate(() =>
      [...document.querySelectorAll('p')]
        .filter((badge) => /^Step \d$/.test(badge.textContent?.trim() ?? ''))
        .map((badge) => badge.textContent?.trim()),
    )

    expect(badges).toEqual(['Step 1', 'Step 2', 'Step 3'])
  })

  /*
   * PRD 6.6 called step 1's visual "a grid of eight Template thumbnails at a
   * flat 275px", and it is not a grid: measured in #11, it is two rotated
   * columns travelling upwards at 29px/s. The Template Wall is the static one
   * (6.3), and mixing those two up is the easiest mistake on this page.
   */
  test("travels step 1's thumbnails, which the Template Wall never does", async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByText('Pick a template.').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    const before = await thumbnailY(page)
    await expect.poll(() => thumbnailY(page), { timeout: 5000 }).not.toBe(before)
  })

  test('holds them still under prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.getByText('Pick a template.').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    const before = await thumbnailY(page)
    await page.waitForTimeout(2500)

    expect(await thumbnailY(page)).toBe(before)
  })
})

/** The Testimonial cards the grid is actually rendering, by name. */
const shownTestimonials = (page: Page) =>
  page.evaluate(() => {
    const band = [...document.querySelectorAll('main > section')].find((section) =>
      section.textContent?.includes('Trusted by 2k+ customers'),
    )
    if (!band) throw new Error('no social proof grid')

    return [...band.querySelectorAll('figure')]
      .filter((card) => card.getBoundingClientRect().width > 0)
      .map((card) => ({
        stars: card.querySelectorAll('svg').length,
        quote: card.querySelector('blockquote')?.textContent?.trim() ?? '',
        avatars: card.querySelectorAll('img').length,
        name: card.querySelector('figcaption span')?.textContent?.trim() ?? '',
      }))
  })

test.describe('the social proof grid (PRD 6.7)', () => {
  test('renders all nine with stars, quote, avatar and name at desktop', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/')

    const cards = await shownTestimonials(page)

    expect(cards.map((card) => card.name)).toEqual([
      'Nic',
      'Renan',
      'Emon',
      'Widya',
      'Dávid',
      'Mark',
      'Samar',
      'Aba',
      'Nonso',
    ])
    expect(cards.every((card) => card.stars === 5)).toBe(true)
    expect(cards.every((card) => card.avatars === 1)).toBe(true)
    expect(cards.every((card) => card.quote.length > 20)).toBe(true)
  })

  /*
   * The Reference drops cards as the grid loses a column rather than reflowing
   * all nine - Samar at tablet, and Emon, Samar and Nonso on phone - which is
   * what keeps it rectangular. Measured at all three widths in #11.
   */
  for (const [name, viewport, shown] of [
    ['tablet', TABLET, 8],
    ['phone', PHONE, 6],
  ] as const) {
    test(`shows ${shown} of the nine on ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')

      const cards = await shownTestimonials(page)

      expect(cards).toHaveLength(shown)
      expect(cards.map((card) => card.name)).not.toContain('Samar')
    })
  }

  /*
   * The Reference's own typos, and its accent. All three are content (PRD 6.7):
   * a spellchecker, an editor or a future session's tidying is what this exists
   * to catch, and `tests/content/reference-facts.test.ts` pins the same strings
   * one layer down.
   */
  test('reproduces the two typos verbatim, and keeps Dávid accented', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/')

    const grid = page.locator('main > section', { hasText: 'Trusted by 2k+ customers' })

    /* Mark is one of the three people the Wall reuses, so his quote is on the
     * page twice: the typo is asserted where the grid renders it. */
    await expect(grid.getByText('easy to custmize', { exact: false })).toBeVisible()
    await expect(
      grid.getByText('The templates is so well designed', { exact: false }),
    ).toBeVisible()
    await expect(grid.getByText('Dávid', { exact: true })).toBeVisible()
  })
})

test.describe('the case study (PRD 6.8)', () => {
  test.use({ viewport: DESKTOP })

  test('is the last row of the social proof grid, not a band of its own', async ({
    page,
  }) => {
    await page.goto('/')

    const grid = page.locator('main > section', { hasText: 'Trusted by 2k+ customers' })
    const story = grid.getByRole('heading', {
      name: 'Matt launched his new site in less than 1 hour.',
    })

    /* One band holds both, and the story sits below and to the right of the
     * first quote because it is that grid's own last row. */
    const [storyBox, quoteBox] = await Promise.all([
      story.boundingBox(),
      grid.locator('blockquote').first().boundingBox(),
    ])

    expect(storyBox!.x).toBeGreaterThan(quoteBox!.x)
    expect(storyBox!.y).toBeGreaterThan(quoteBox!.y)
  })

  test('points its CTAs at the Template Matt used and at the customer sites', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(
      page.getByRole('link', { name: 'View template Matt used' }),
    ).toHaveAttribute('href', '/templates/reformr')
    await expect(
      page.getByRole('link', { name: "View other customers' sites" }),
    ).toHaveAttribute('href', '/live-examples')
  })

  test('keeps café, and the straight apostrophe the Reference uses here', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page.getByText('We sat in a café', { exact: false })).toBeVisible()
    await expect(page.getByText("Didn't need any.", { exact: false })).toBeVisible()
  })
})
