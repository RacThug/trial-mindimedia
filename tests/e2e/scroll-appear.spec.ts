import { expect, test, type Page } from '@playwright/test'

/*
 * Scroll-Appear (#13), the animation every Section on the page now runs.
 *
 * These assert behaviour, not parameters - the measured numbers are pinned in
 * `tests/motion/appear.test.ts`, which is a cheaper place to notice that
 * somebody rounded the spring off. What is left here is the part that only a
 * real browser can answer: that it fires, that it fires once, that reduced
 * motion stops the movement, and that none of it moves the layout.
 *
 * Read `[data-appear]` state through `getComputedStyle`, never through the
 * inline `style` attribute. Motion runs opacity and transform through the Web
 * Animations API, which does not touch inline styles until the animation ends -
 * a probe that reads `element.style.opacity` sees 0 for the whole animation and
 * then 1, and reports a spring as an instant cut.
 */

const DESKTOP = { width: 1440, height: 900 }
const PHONE = { width: 390, height: 844 }

/** Sections taking the 30px Section treatment, per PRD 6.15. */
const SECTION_ISLANDS = 8
/** Those, plus the quiz CTA's card and the case study's card. */
const ALL_ISLANDS = 10

/** Opacity and vertical offset of every appear island, as rendered right now. */
const appearState = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[data-appear]')].map((element) => {
      const style = getComputedStyle(element)
      const matrix = new DOMMatrixReadOnly(
        style.transform === 'none' ? undefined : style.transform,
      )
      return { opacity: Number(style.opacity), y: Math.round(matrix.m42 * 100) / 100 }
    }),
  )

/** Walk the whole page down, pausing long enough for each band to finish. */
async function scrollThrough(page: Page, pause = 350) {
  const height = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < height; y += 400) {
    await page.evaluate((to) => window.scrollTo(0, to), y)
    await page.waitForTimeout(pause)
  }
  await page.waitForTimeout(900)
}

test.describe('Scroll-Appear', () => {
  test('every Section is hidden in the server markup and shown after scrolling', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP)

    /*
     * The resting state is server-rendered, which is what stops a Section
     * painting before it is asked to appear. Assert it on the HTML itself
     * rather than on the DOM, because by the time the DOM is queryable the
     * islands above the fold have already run.
     */
    const response = await page.goto('/')
    const html = (await response?.text()) ?? ''
    const resting = html.match(/opacity:0;transform:translateY\(30px\)/g) ?? []
    /*
     * Exactly the eight Sections that take the 30px treatment on the Reference
     * (PRD 6.15): hero, Template Wall, featured Templates, feature bento, how it
     * works, social proof, pricing, founder. Exact rather than "at least",
     * because the claim this issue makes is that Scroll-Appear is applied
     * consistently - and a `>=` lets a Section quietly lose it and still pass.
     */
    expect(resting.length).toBe(SECTION_ISLANDS)

    await scrollThrough(page)

    const state = await appearState(page)
    /* Those eight plus the quiz CTA's card and the case study's card. */
    expect(state.length).toBe(ALL_ISLANDS)
    for (const island of state) {
      expect(island.opacity).toBe(1)
      expect(island.y).toBe(0)
    }
  })

  test('plays once and does not replay on the way back up', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/')
    await scrollThrough(page)

    /* Back to the top, then down again at speed. Nothing may fade a second time. */
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(600)
    expect((await appearState(page)).every((island) => island.opacity === 1)).toBe(true)

    const height = await page.evaluate(() => document.body.scrollHeight)
    for (let y = 0; y < height; y += 300) {
      await page.evaluate((to) => window.scrollTo(0, to), y)
      const state = await appearState(page)
      for (const island of state) {
        expect(island.opacity).toBe(1)
        expect(island.y).toBe(0)
      }
    }
  })

  test('prefers-reduced-motion: reduce disables the movement', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: DESKTOP,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    await page.goto('/')

    /*
     * Sample hard while scrolling. A Section may be at rest (opacity 0, 30px
     * down) or arrived (opacity 1, 0) - what reduced motion forbids is any frame
     * in between, which is the only thing "movement" can mean here. Asserting
     * instead that nothing is ever offset would fail on the resting state, which
     * every Section still starts in.
     */
    const height = await page.evaluate(() => document.body.scrollHeight)
    const midTravel: { opacity: number; y: number }[] = []
    for (let y = 0; y < height; y += 200) {
      await page.evaluate((to) => window.scrollTo(0, to), y)
      for (const island of await appearState(page)) {
        const atRest = island.opacity === 0
        const arrived = island.opacity === 1 && island.y === 0
        if (!atRest && !arrived) midTravel.push(island)
      }
    }
    expect(midTravel).toEqual([])

    await scrollThrough(page, 120)
    for (const island of await appearState(page)) {
      expect(island.opacity).toBe(1)
      expect(island.y).toBe(0)
    }

    await context.close()
  })

  test('causes no layout shift', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/')

    /*
     * Two claims in one: that the animation only touches compositor properties,
     * and that the page is the same height before and after it has all run. A
     * Section animated with `height` or `margin` would pass neither.
     */
    await page.evaluate(() => {
      const win = window as unknown as { __shift: number }
      win.__shift = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number
          hadRecentInput: boolean
        })[]) {
          if (!entry.hadRecentInput) win.__shift += entry.value
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })

    const before = await page.evaluate(() => document.body.scrollHeight)
    await scrollThrough(page)
    const after = await page.evaluate(() => document.body.scrollHeight)

    expect(after).toBe(before)

    const shift = await page.evaluate(
      () => (window as unknown as { __shift: number }).__shift,
    )
    expect(shift).toBeLessThan(0.1)
  })

  test('fires on a Section far taller than the viewport', async ({ page }) => {
    /*
     * The regression this exists for: Motion hands `viewport.amount` straight to
     * IntersectionObserver, so a literal `amount: 0.5` on a Section more than twice
     * the viewport tall can never reach that ratio and it stays invisible
     * for good. At 390x844 several bands are exactly that.
     */
    await page.setViewportSize(PHONE)
    await page.goto('/')

    const tall = await page.evaluate(
      () =>
        [...document.querySelectorAll('[data-appear]')].filter(
          (element) => element.getBoundingClientRect().height > window.innerHeight * 2,
        ).length,
    )
    expect(tall).toBeGreaterThan(0)

    await scrollThrough(page)
    for (const island of await appearState(page)) {
      expect(island.opacity).toBe(1)
    }
  })

  test('keeps the Sections themselves server-rendered', async ({ page }) => {
    /*
     * Scroll-Appear is a client island; the Section bodies inside it are not.
     * If a Section's own content stops being server-rendered this fails, which
     * is the only cheap way to notice `'use client'` spreading up the tree.
     */
    const response = await page.goto('/')
    const html = (await response?.text()) ?? ''

    for (const copy of [
      'Everything you need to launch',
      'Go live within 1 hour',
      'Trusted by 2k+ customers',
      'Not sure which template is for you?',
    ]) {
      expect(html).toContain(copy)
    }
  })
})
