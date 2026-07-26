import { expect, test, type Page } from '@playwright/test'

/*
 * The claims issue #12 makes about pricing (PRD 6.9), the Quiz CTA (6.10), the
 * founder (6.11) and the quiz modal (6.13). Every number here is measured off
 * the Reference at 1440, 810 and 390.
 *
 * Three of them exist because the thing they pin is counter-intuitive:
 *
 * - the Options recalculate, which the Reference's do not, **and their defaults
 *   still match it** - which is the whole reason an at-rest capture is a valid
 *   Fidelity diff;
 * - the Quiz CTA's backdrop travels, where the Template Wall that looks like a
 *   marquee does not (6.3);
 * - the modal does not fire on load. It fires six seconds in, which PRD 6.13
 *   had wrong and which is what keeps ten screenshots out of the initial load.
 */

const DESKTOP = { width: 1440, height: 900 }
const TABLET = { width: 810, height: 900 }
const PHONE = { width: 390, height: 844 }

/** Long enough for the modal's measured six-second delay, with room to spare. */
const MODAL_TIMEOUT = 12_000

/**
 * Open the page with the modal suppressed.
 *
 * Everything below the fold is measured at rest, and a dialog in the top layer
 * six seconds in would cover it. The flag is the same one the modal writes when
 * a visitor dismisses it, so this exercises the real path rather than a test
 * hook - and the modal's own tests below do not use it.
 */
async function openPast(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport)
  await page.addInitScript(() => sessionStorage.setItem('quiz-modal-dismissed', 'true'))
  await page.goto('/')
}

const pricing = (page: Page) =>
  page.locator('main > section', { hasText: 'Providing all website-solutions' })

/**
 * One Option row, by its visible label.
 *
 * The row's own radio is `sr-only` and so out of the viewport, which is exactly
 * what a click on the label is for - and it is what a visitor does. Scoped to
 * the band because `Framer template` also names an Eyebrow and two Testimonials.
 */
const option = (page: Page, label: string) =>
  pricing(page).getByText(label, { exact: true })

/** The three Plan prices as the cards currently render them. */
const shownPrices = (page: Page) =>
  page.evaluate(() => {
    const band = [...document.querySelectorAll('main > section')].find((section) =>
      section.textContent?.includes('Providing all website-solutions'),
    )
    if (!band) throw new Error('no pricing band')

    return [...band.querySelectorAll('h3')].map(
      (name) => name.parentElement?.querySelector('p span')?.textContent ?? '',
    )
  })

test.describe('pricing (PRD 6.9)', () => {
  test('reproduces ONE-TIME PAYEMNT on the first card only, uppercased in CSS', async ({
    page,
  }) => {
    await openPast(page, DESKTOP)

    const typo = page.getByText('One-time payemnt')
    await expect(typo).toBeVisible()
    await expect(typo).toHaveCSS('text-transform', 'uppercase')
    /* The markup is sentence case and carries a capital O; the render is
     * ONE-TIME PAYEMNT (PRD 6.9). */
    expect(await typo.textContent()).toBe('One-time payemnt')
    await expect(page.getByText('one-time payment')).toHaveCount(2)
  })

  test('shows the Bundle at $399 with $1,881 struck through in muted text', async ({
    page,
  }) => {
    await openPast(page, DESKTOP)

    const struck = page.getByText('$1,881')
    await expect(struck).toHaveCSS('text-decoration-line', 'line-through')
    await expect(struck).toHaveCSS('color', 'rgb(201, 201, 201)')
    await expect(page.getByText('$399')).toBeVisible()
  })

  /*
   * The Deviation, both halves of it. At rest the prices are the Reference's
   * own - which is what makes a screenshot diff of this band meaningful - and a
   * click moves one, which the Reference's inert rows never do.
   */
  test('starts at the Reference prices and recalculates on a click', async ({ page }) => {
    await openPast(page, DESKTOP)

    expect(await shownPrices(page)).toEqual(['$129', '$399', '$2,495'])

    /* Five radios over the two Plans that have Options - the other half of the
     * measurement, and the reason picking one drops the last. */
    await expect(pricing(page).getByRole('radio')).toHaveCount(5)

    await option(page, 'Add Figma designs').click()
    expect(await shownPrices(page)).toEqual(['$168', '$399', '$2,495'])

    /* Radio, not additive: picking the third replaces the second. */
    await option(page, 'Add Done-for you').click()
    expect(await shownPrices(page)).toEqual(['$499', '$399', '$2,495'])

    await option(page, 'Framer template').click()
    expect(await shownPrices(page)).toEqual(['$129', '$399', '$2,495'])
  })

  /*
   * `Multi-page site` carries no `+$` label on the Reference, so its delta is 0
   * and the Custom project recalculates to the same number either way. Read off
   * the copy rather than assumed, and pinned here because it looks like a bug.
   */
  test('leaves the Custom project at $2,495 whichever Option is chosen', async ({
    page,
  }) => {
    await openPast(page, DESKTOP)

    await option(page, 'Multi-page site').click()
    expect(await shownPrices(page)).toEqual(['$129', '$399', '$2,495'])
  })

  test('turns the dividers with the block: vertical across, horizontal stacked', async ({
    page,
  }) => {
    const firstCardEdge = () =>
      page.evaluate(() => {
        const band = [...document.querySelectorAll('main > section')].find((section) =>
          section.textContent?.includes('Providing all website-solutions'),
        )
        const frame = [...(band?.querySelectorAll('div') ?? [])].find((element) =>
          element.className.includes('rounded-frame'),
        )
        if (!frame) throw new Error('no pricing frame')
        return getComputedStyle(frame.children[0]!).boxShadow
      })

    await openPast(page, DESKTOP)
    expect(await firstCardEdge()).toContain('-1px 0px 0px')

    await openPast(page, PHONE)
    expect(await firstCardEdge()).toContain('0px -1px 0px')
  })
})

test.describe('the Quiz CTA (PRD 6.10)', () => {
  /** Where the first ticker column's first tile is right now. */
  const tileY = (page: Page) =>
    page.evaluate(() => {
      const band = [...document.querySelectorAll('main > section')].find((section) =>
        section.textContent?.includes('Not sure which template'),
      )
      const tile = band?.querySelector('ul li img')
      if (!tile) throw new Error('no ticker column')
      return tile.getBoundingClientRect().y
    })

  /*
   * The Template Wall (6.3) looks like a marquee and is a static grid; this one
   * looks like the Wall and travels. PRD 6.10 called it "a dimmed Template Wall
   * backdrop", and the images are eleven of the Wall's own - but they are four
   * columns going up and down at 29px/s, measured in #12.
   */
  test('travels, which the Template Wall it borrows from never does', async ({
    page,
  }) => {
    await openPast(page, DESKTOP)
    await page.getByText('Not sure which template').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    const before = await tileY(page)
    await expect.poll(() => tileY(page), { timeout: 5000 }).not.toBe(before)
  })

  test('holds still under prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openPast(page, DESKTOP)
    await page.getByText('Not sure which template').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    const before = await tileY(page)
    await page.waitForTimeout(2500)

    expect(await tileY(page)).toBe(before)
  })

  test('carries no clip: the backdrop is the Wall stills without its videos', async ({
    page,
  }) => {
    await openPast(page, DESKTOP)

    const clips = await page.evaluate(() => {
      const band = [...document.querySelectorAll('main > section')].find((section) =>
        section.textContent?.includes('Not sure which template'),
      )
      return band?.querySelectorAll('video').length ?? -1
    })

    expect(clips).toBe(0)
  })
})

test.describe('the founder (PRD 6.11)', () => {
  test('keeps a straight apostrophe in the H3 and a curly one in the prose', async ({
    page,
  }) => {
    await openPast(page, DESKTOP)

    const band = page.locator('main > section', { hasText: 'Meet the creator' })
    await expect(band.getByRole('heading', { level: 3 })).toContainText("Hey, I'm Ramish")
    await expect(band.getByText('Now, I’m sharing', { exact: false })).toBeVisible()
  })

  /*
   * The stat's number is bigger at tablet than at desktop - 36 against 32 -
   * which is the sort of step that gets tidied into a monotonic scale. Measured
   * twice: off the computed style, and off a 164.39px cell that only adds up
   * with a 46.8px line in it.
   */
  for (const [name, viewport, size] of [
    ['desktop', DESKTOP, '32px'],
    ['tablet', TABLET, '36px'],
    ['phone', PHONE, '32px'],
  ] as const) {
    test(`sets the stat number to ${size} on ${name}`, async ({ page }) => {
      await openPast(page, viewport)

      const band = page.locator('main > section', { hasText: 'Meet the creator' })
      await expect(band.getByText('$100k+')).toHaveCSS('font-size', size)
    })
  }

  test('lists the four stats as display strings, not money', async ({ page }) => {
    await openPast(page, DESKTOP)

    const band = page.locator('main > section', { hasText: 'Meet the creator' })
    for (const value of ['6+', '100+', '$100k+', '2,000+']) {
      await expect(band.getByText(value, { exact: true })).toBeVisible()
    }
  })
})

test.describe('the quiz modal (PRD 6.13)', () => {
  const modal = (page: Page) => page.getByRole('dialog', { name: /Get 30% off/ })

  /*
   * PRD 6.13 says it fires on load. Measured in #12 by sampling once a second
   * from `domcontentloaded`: nothing at five seconds, up at six. Both halves are
   * asserted, because the delay is what keeps its ten screenshots out of the
   * initial load.
   */
  test('stays down for the first few seconds, then opens', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/')

    await page.waitForTimeout(3000)
    await expect(modal(page)).toBeHidden()

    await expect(modal(page)).toBeVisible({ timeout: MODAL_TIMEOUT })
  })

  test('is 1016x616, centred over a full-viewport backdrop, at desktop', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/')
    await expect(modal(page)).toBeVisible({ timeout: MODAL_TIMEOUT })

    const box = (await modal(page).boundingBox())!
    expect([Math.round(box.width), Math.round(box.height)]).toEqual([1016, 616])
    expect(Math.round(box.x)).toBe((DESKTOP.width - 1016) / 2)
    expect(Math.round(box.y)).toBe((DESKTOP.height - 616) / 2)

    /* The scrim is the dialog's own `::backdrop`, at the measured 90% black,
     * and it covers the viewport because the top layer does. Read through
     * `getComputedStyle`, which is the only way to reach a pseudo-element. */
    const scrim = await page.evaluate(() => {
      const dialog = document.querySelector('dialog[open]')
      if (!dialog) throw new Error('no open dialog')
      return getComputedStyle(dialog, '::backdrop').backgroundColor
    })
    expect(scrim).toBe('rgba(0, 0, 0, 0.9)')
  })

  for (const [how, dismiss] of [
    [
      'its close button',
      (page: Page) => page.getByRole('button', { name: 'Close' }).click(),
    ],
    ['Escape', (page: Page) => page.keyboard.press('Escape')],
    ['a click on the backdrop', (page: Page) => page.mouse.click(8, 8)],
  ] as const) {
    test(`is dismissed by ${how}`, async ({ page }) => {
      await page.setViewportSize(DESKTOP)
      await page.goto('/')
      await expect(modal(page)).toBeVisible({ timeout: MODAL_TIMEOUT })

      await dismiss(page)
      await expect(modal(page)).toBeHidden()
    })
  }

  /*
   * The focus trap comes from `showModal()` rather than from a handler, so what
   * is worth asserting is that the dialog really is modal: nothing on the page
   * behind it can be tabbed to. Focus can still pass through the document root
   * on its way round - that is the browser's own cycle, and it is not the nav.
   */
  test('traps focus while it is open', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/')
    await expect(modal(page)).toBeVisible({ timeout: MODAL_TIMEOUT })

    const focused = () =>
      page.evaluate(() => {
        const active = document.activeElement
        const dialog = document.querySelector('dialog[open]')
        if (!active || active === document.body || active === document.documentElement)
          return 'root'
        return dialog?.contains(active) ? 'inside' : `outside: ${active.textContent}`
      })

    /* Twice round: two controls in the panel, plus the root the cycle passes
     * through. Nothing outside may appear. */
    for (let step = 0; step < 8; step += 1) {
      await page.keyboard.press('Tab')
      expect(await focused()).not.toContain('outside')
    }

    /* And the trap is real rather than an empty dialog: both controls are
     * reachable. */
    await expect(page.getByRole('button', { name: 'Close' })).toBeVisible()
    await expect(modal(page).getByRole('link', { name: 'Take the quiz' })).toBeVisible()
  })

  test('stays shut once dismissed, where the Reference reopens', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/')
    await expect(modal(page)).toBeVisible({ timeout: MODAL_TIMEOUT })
    await page.keyboard.press('Escape')
    await expect(modal(page)).toBeHidden()

    await page.getByRole('link', { name: 'Templates', exact: true }).first().click()
    await page.waitForTimeout(MODAL_TIMEOUT)

    await expect(modal(page)).toBeHidden()
  })
})
