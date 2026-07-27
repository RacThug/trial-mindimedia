/*
 * The Lighthouse mobile Performance score, run against Playwright's own
 * Chromium.
 *
 * PRD section 8 asks for >= 95 on mobile, and that is a number produced by one
 * specific tool under one specific set of throttling assumptions - a slow 4G
 * connection and a CPU four times slower than the machine running it. Nothing in
 * `measure.ts` reproduces that, and nothing should try: the two answer different
 * questions, and a hand-rolled approximation of a Lighthouse score would be
 * exactly the "plausible-looking default" `AGENTS.md` warns against.
 *
 * It borrows Playwright's browser rather than looking for an installed Chrome,
 * so the score does not depend on what a given machine happens to have in its
 * Applications folder - and so it works on a clone that has only ever run
 * `npx playwright install`.
 */

import { chromium } from '@playwright/test'
import lighthouse from 'lighthouse'

/** Chosen because it is unlikely to be in use, and fixed so a stuck run is findable. */
const DEBUG_PORT = 9333

export type LighthouseResult = {
  readonly performance: number
  /** The metric audits behind the score, in milliseconds or unitless. */
  readonly metrics: Readonly<Record<string, number>>
}

export async function runLighthouse(url: string): Promise<LighthouseResult> {
  const browser = await chromium.launch({
    args: [`--remote-debugging-port=${DEBUG_PORT}`],
  })

  try {
    const run = await lighthouse(url, {
      port: DEBUG_PORT,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance'],
    })
    if (!run) throw new Error('Lighthouse returned nothing')

    const { categories, audits } = run.lhr
    const metrics: Record<string, number> = {}
    for (const id of [
      'first-contentful-paint',
      'largest-contentful-paint',
      'total-blocking-time',
      'cumulative-layout-shift',
      'speed-index',
    ]) {
      const value = audits[id]?.numericValue
      if (typeof value === 'number') metrics[id] = Math.round(value * 1000) / 1000
    }

    return {
      /* Lighthouse reports 0-1; the budget is written out of 100. */
      performance: Math.round((categories.performance?.score ?? 0) * 100),
      metrics,
    }
  } finally {
    await browser.close()
  }
}
