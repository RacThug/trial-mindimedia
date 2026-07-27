/*
 * The Playwright half of the Fidelity Harness: drive one page to a state worth
 * photographing, then photograph it.
 *
 * Both sides go through this same function. That is not tidiness - it is the
 * only way the number means anything. If the Clone were settled by one routine
 * and the Reference by another, the harness would be reporting the difference
 * between two routines as often as the difference between two pages.
 */

import { chromium, type Browser, type Page } from '@playwright/test'
import {
  awaitImages,
  BAND_ATTRIBUTE,
  dismissQuizModal,
  freezeVideo,
  hideTravelling,
  pendingIslands,
  resolveBands,
  sweepOffsets,
  visitOffsets,
  type BandRequest,
  type Box,
  type ResolvedBand,
} from './page-script.ts'
import { MODAL, SECTIONS } from './sections.ts'

/** Measured in #12: nothing at 5s from `domcontentloaded`, the modal up at 6s. */
const MODAL_DELAY_MS = 6000

/** A second past the modal's own delay, so it is there to be dismissed. */
const MODAL_WAIT_MS = MODAL_DELAY_MS + 1000

/** An IntersectionObserver reports on its own task; this is time for it to. */
const OBSERVER_DELIVERY_MS = 80

/** The slowest measured appear: the nested cards, on their overdamped spring. */
const SLOWEST_APPEAR_MS = 2500

/** Enough sweeps to converge; `tests/e2e/settle.ts` uses the same number. */
const SWEEPS = 4

/** A clip that has not decoded a frame in this long is not going to. */
const VIDEO_TIMEOUT_MS = 8000

/** Rounds of pause-and-seek. The Reference restarts its clips between them. */
const VIDEO_ATTEMPTS = 4

/** An image that has not decoded in this long is not going to before the shot. */
const IMAGE_TIMEOUT_MS = 10_000

/** Long enough that a column travelling at 29px/s has visibly moved. */
const TRAVEL_SAMPLE_MS = 500

export type Capture = {
  /** Full-page PNG, one CSS pixel per image pixel. */
  readonly png: Buffer
  readonly bands: readonly ResolvedBand[]
  /** Page-coordinate boxes of the travelling backdrops, which are not compared. */
  readonly excluded: readonly Box[]
  readonly warnings: readonly string[]
}

/**
 * Which page is being captured.
 *
 * Passed rather than sniffed out of the URL. The modal is the one place the
 * harness needs a side-specific selector - ours is a native `<dialog>` where the
 * Reference draws a fixed `div`, which is the Deviation the README records - and
 * a `url.includes('browser.supply')` test would quietly pick the Clone's
 * selector for anyone who pointed `REFERENCE_URL` at a mirror.
 */
export type Side = 'clone' | 'reference'

const BAND_REQUESTS: readonly BandRequest[] = SECTIONS.map((section) => ({
  id: section.id,
  anchor: section.anchor,
}))

export async function launch(): Promise<Browser> {
  return chromium.launch()
}

/**
 * Capture one page at one width, prepared the way ADR-0003 requires.
 *
 * The order is load-bearing. The modal has to be waited out before it can be
 * dismissed, or the Reference's arrives mid-sweep and locks the page's scroll;
 * the bands have to be tagged before the settle check, which watches them; and
 * the video is frozen last, because a sweep that runs after it would let the
 * Clone's IntersectionObserver start playing the clips again.
 */
export async function capturePage(
  browser: Browser,
  url: string,
  width: number,
  height: number,
): Promise<Capture> {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  })
  const warnings: string[] = []

  try {
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'load', timeout: 180_000 })
    await page.waitForTimeout(MODAL_WAIT_MS)

    const removed = await page.evaluate(dismissQuizModal)
    if (removed === 0) warnings.push('no quiz modal was found to dismiss')

    await page.evaluate(resolveBands, {
      specs: BAND_REQUESTS,
      bandAttribute: BAND_ATTRIBUTE,
    })
    await settleAppear(page, warnings)

    const video = await page.evaluate(freezeVideo, {
      timeoutMs: VIDEO_TIMEOUT_MS,
      attempts: VIDEO_ATTEMPTS,
    })
    if (video.total === 0) warnings.push('no video was found to freeze')
    else if (video.frozen < video.total) {
      warnings.push(`only ${video.frozen} of ${video.total} clips reached frame 0`)
    }

    const travel = await page.evaluate(hideTravelling, {
      offsets: await page.evaluate(sweepOffsets),
      sampleMs: TRAVEL_SAMPLE_MS,
      bandAttribute: BAND_ATTRIBUTE,
    })
    if (travel.count === 0) warnings.push('no travelling backdrop was found to exclude')
    else if (travel.boxes.length === 0) {
      warnings.push(
        `${travel.count} travelling backdrops hidden, none with a visible box`,
      )
    }
    const excluded = travel.boxes

    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(400)

    const undecoded = await page.evaluate(awaitImages, IMAGE_TIMEOUT_MS)
    if (undecoded > 0) warnings.push(`${undecoded} images never decoded`)

    const bands = await page.evaluate(resolveBands, {
      specs: BAND_REQUESTS,
      bandAttribute: BAND_ATTRIBUTE,
    })
    for (const band of bands) {
      if (band.box === null) warnings.push(`${band.id}: ${band.note ?? 'not resolved'}`)
      else if (band.note) warnings.push(`${band.id}: ${band.note}`)
    }

    const png = await page.screenshot({
      fullPage: true,
      animations: 'disabled',
      scale: 'css',
    })
    return { png, bands, excluded, warnings }
  } finally {
    await context.close()
  }
}

/**
 * The quiz modal, in a page of its own.
 *
 * Its own page because the two things it needs cannot both happen in the main
 * pass. It has to be photographed *before* it is dismissed, and the travelling
 * columns behind its copy can only be removed by neutering `requestAnimationFrame`
 * - which is also what Motion drives Scroll-Appear with, so doing it early would
 * leave every Section on the page below stuck at `opacity: 0`. A fresh context
 * rather than a fresh tab, because the Clone records a dismissal in
 * `sessionStorage` (PRD 6.13) and a shared context would never show it twice.
 *
 * The modal itself does not animate in on either side - measured in #13, along
 * with the nav and the footer - so this needs no settle, only the six-second
 * wait both sides make a visitor sit through.
 */
export async function captureModal(
  browser: Browser,
  side: Side,
  url: string,
  width: number,
  height: number,
): Promise<{ box: Box | null; png: Buffer | null; warnings: readonly string[] }> {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  })
  const warnings: string[] = []

  try {
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'load', timeout: 180_000 })
    await page.waitForTimeout(MODAL_WAIT_MS)

    const selector = MODAL[side]
    const element = page.locator(selector).first()
    if ((await element.count()) === 0) {
      warnings.push('the quiz modal never opened')
      return { box: null, png: null, warnings }
    }

    await page.evaluate(freezeVideo, {
      timeoutMs: VIDEO_TIMEOUT_MS,
      attempts: VIDEO_ATTEMPTS,
    })
    /* One offset: the modal is fixed over the viewport, so its ticker is in
     * view wherever the page happens to be. */
    const travel = await page.evaluate(hideTravelling, {
      offsets: [0],
      sampleMs: TRAVEL_SAMPLE_MS,
      bandAttribute: BAND_ATTRIBUTE,
    })
    if (travel.count === 0) warnings.push('the modal ticker was not found to exclude')

    const box = await element.evaluate((node) => {
      const rect = node.getBoundingClientRect()
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      }
    })
    const png = await element.screenshot({ animations: 'disabled', scale: 'css' })
    return { box, png, warnings }
  } finally {
    await context.close()
  }
}

/**
 * Play every Scroll-Appear island out, then leave the page where it started.
 *
 * The same shape as `tests/e2e/settle.ts` and for the same reason: waiting for
 * what happens to be on screen deadlocks on the island peeking over the bottom
 * edge, because Scroll-Appear fires at half the element and something one pixel
 * into view will never reach that on its own.
 */
async function settleAppear(page: Page, warnings: string[]): Promise<void> {
  for (let sweep = 0; sweep < SWEEPS; sweep += 1) {
    const offsets =
      sweep === 0
        ? await page.evaluate(sweepOffsets)
        : await page.evaluate(pendingIslands, [`[${BAND_ATTRIBUTE}]`])
    if (offsets.length === 0) break

    await page.evaluate(visitOffsets, { offsets, dwellMs: OBSERVER_DELIVERY_MS })

    const deadline = Date.now() + SLOWEST_APPEAR_MS
    while (Date.now() < deadline) {
      if ((await page.evaluate(pendingIslands, [`[${BAND_ATTRIBUTE}]`])).length === 0)
        break
      await page.waitForTimeout(100)
    }
  }

  const stuck = await page.evaluate(pendingIslands, [`[${BAND_ATTRIBUTE}]`])
  if (stuck.length > 0) {
    warnings.push(`Scroll-Appear never landed at y = ${stuck.join(', ')}`)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
}
