import { expect, test } from '@playwright/test'

/*
 * The visual fades (PRD 6.17), measured in #30.
 *
 * A census of the Reference found eighteen masked boxes; this build had twelve
 * of them and the six that were missing are the bento's five visuals and step
 * 1's thumbnail strip. The tutorials card is the one that showed it: white copy
 * across the bottom of a lit clip, with nothing behind it.
 *
 * These pin the six by their measured stops and their measured boxes, at every
 * Breakpoint, because the percentages are of the box - a card that changed size
 * without the mask being re-measured would fade in the wrong place while still
 * looking masked.
 */

const BREAKPOINTS = [
  { name: 'desktop', size: { width: 1440, height: 900 } },
  { name: 'tablet', size: { width: 810, height: 1080 } },
  { name: 'phone', size: { width: 390, height: 844 } },
]

/** Every fade the Reference draws, keyed by the copy nearest it. */
const FADES = [
  {
    near: 'Responsive straight out',
    mask:
      'linear-gradient(rgb(0, 0, 0) 38%, rgba(0, 0, 0, 0) 100%), ' +
      'linear-gradient(90deg, rgba(0, 0, 0, 0) -7%, rgb(0, 0, 0) 35%)',
    composite: 'intersect, add',
  },
  {
    near: 'Step-by-step video',
    mask: 'linear-gradient(rgb(0, 0, 0) 35%, rgba(0, 0, 0, 0) 86%)',
  },
  {
    near: 'Pro hosting included',
    mask: 'linear-gradient(rgb(0, 0, 0) 35%, rgba(0, 0, 0, 0) 91%)',
  },
  {
    near: 'Automatic SEO',
    mask: 'linear-gradient(rgb(0, 0, 0) 6%, rgba(0, 0, 0, 0) 29%)',
  },
  {
    near: 'Easily create and manage',
    mask: 'linear-gradient(rgb(0, 0, 0) 9%, rgba(0, 0, 0, 0) 52%)',
  },
  {
    near: 'Pick a template',
    mask: 'linear-gradient(rgb(0, 0, 0) -15%, rgba(0, 0, 0, 0) 100%)',
  },
]

/** How many boxes the Reference masks, and therefore how many the Clone must. */
const REFERENCE_MASKED_BOXES = 18

for (const breakpoint of BREAKPOINTS) {
  test(`every measured fade is on its box at ${breakpoint.name}`, async ({ page }) => {
    await page.setViewportSize(breakpoint.size)
    await page.addInitScript(() => sessionStorage.setItem('quiz-modal-dismissed', 'true'))
    await page.goto('/')

    const masked = await page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .map((element) => ({ element, style: getComputedStyle(element) }))
        .filter(({ style }) => style.maskImage !== 'none')
        .map(({ element, style }) => ({
          mask: style.maskImage,
          composite: style.maskComposite,
          /* The nearest ancestor carrying copy, which is how a fade is named. */
          text: (element.closest('section, div')?.textContent ?? '')
            .replace(/\s+/g, ' ')
            .slice(0, 400),
        })),
    )

    expect(masked).toHaveLength(REFERENCE_MASKED_BOXES)

    for (const fade of FADES) {
      const found = masked.find((box) => box.mask === fade.mask)
      expect(found, `no box carries the fade measured near "${fade.near}"`).toBeDefined()
      if (fade.composite) expect(found?.composite).toBe(fade.composite)
    }
  })
}

test('the tutorials card really is dark where its title sits', async ({ page }) => {
  /*
   * The reading that started #30, and the one a stop percentage cannot make:
   * the fade exists to be read *through*, so this measures the pixels rather
   * than the declaration.
   *
   * Mean luma of the card's bottom quarter, off a screenshot with the clip
   * frozen on frame 0: **29.6 with the fade and 51.9 without it**, both measured
   * on this build by taking the mask off and putting it back. The threshold sits
   * between them rather than at either, because the clip is a lit scene and a
   * few points of it move with the frame.
   *
   * Freezing matters. A threshold against a live frame is a threshold against
   * whichever frame the shutter caught.
   */
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => sessionStorage.setItem('quiz-modal-dismissed', 'true'))
  await page.goto('/')

  const found = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('div')].filter((element) => {
      const text = (element.textContent ?? '').trim()
      return (
        text.startsWith('Step-by-step video tutorials included') &&
        text.length < 90 &&
        element.querySelector('video, img') !== null
      )
    })
    const card = cards.sort(
      (a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height,
    )[0]
    if (!card) return false
    card.setAttribute('data-test-card', 'tutorials')
    for (const video of card.querySelectorAll('video')) {
      video.pause()
      video.currentTime = 0
    }
    return true
  })
  expect(found).toBe(true)

  const card = page.locator('[data-test-card="tutorials"]')
  await card.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)

  const shot = await card.screenshot()
  const { default: sharp } = await import('sharp')
  const image = sharp(shot)
  const { width = 0, height = 0 } = await image.metadata()
  const band = await image
    .extract({
      left: 0,
      top: Math.floor(height * 0.75),
      width,
      height: height - Math.floor(height * 0.75),
    })
    .stats()

  const luma =
    0.2126 * (band.channels[0]?.mean ?? 0) +
    0.7152 * (band.channels[1]?.mean ?? 0) +
    0.0722 * (band.channels[2]?.mean ?? 0)

  expect(luma).toBeLessThan(40)
})
