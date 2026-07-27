/*
 * What one page load costs, measured the same way on the Clone and on the
 * Reference.
 *
 * "Initial load" is defined here rather than assumed, because every number in
 * PRD section 8's budget depends on where the line is drawn: **everything the
 * page fetches from navigation until the network has been quiet for two seconds,
 * with no scrolling and no interaction.** That is deliberately generous to the
 * Clone's own trick - deferred clips inside the first viewport's
 * IntersectionObserver margin start during that window and are counted - because
 * a budget that stopped at the `load` event would let a page hit it by moving
 * work half a second later.
 *
 * Counted off the wire through CDP rather than from `performance.getEntries()`,
 * which reports decoded sizes and misses anything a service worker or a
 * cross-origin response without Timing-Allow-Origin hides. `encodedDataLength`
 * is the bytes that actually crossed.
 */

import { chromium, type Browser } from '@playwright/test'

/**
 * Moto G Power, which is what Lighthouse's mobile preset emulates.
 *
 * The budget is a **mobile** budget (PRD section 8), so this is the viewport
 * every number in it is measured at. DPR 2.625 is not a detail: it decides which
 * rung of `next.config.ts`'s `deviceSizes` ladder every `next/image` picks, and
 * measuring at DPR 1 would report a page a phone never receives.
 */
export const MOBILE = { width: 412, height: 823, deviceScaleFactor: 2.625 } as const

/** Quiet for this long, with nothing in flight, and the load is over. */
const QUIET_MS = 2000

/** Even a page that never goes quiet has to stop being measured somewhere. */
const CEILING_MS = 30_000

export type Vitals = {
  readonly fcp: number | null
  readonly lcp: number | null
  readonly cls: number
  readonly ttfb: number | null
}

export type LoadMeasurement = {
  readonly requests: number
  readonly bytes: number
  readonly vitals: Vitals
  /** Bytes and requests per resource type, for reading a total that is too big. */
  readonly byType: Readonly<Record<string, { requests: number; bytes: number }>>
}

export async function measureLoad(
  browser: Browser,
  url: string,
): Promise<LoadMeasurement> {
  const context = await browser.newContext({
    viewport: { width: MOBILE.width, height: MOBILE.height },
    deviceScaleFactor: MOBILE.deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
  })

  try {
    const page = await context.newPage()
    const client = await context.newCDPSession(page)
    await client.send('Network.enable')

    const seen = new Map<string, { type: string | null; bytes: number }>()
    let inFlight = 0
    let lastActivity = Date.now()

    client.on('Network.requestWillBeSent', (event) => {
      seen.set(event.requestId, { type: null, bytes: 0 })
      inFlight += 1
      lastActivity = Date.now()
    })
    const settle = (requestId: string, bytes: number, type?: string) => {
      const record = seen.get(requestId)
      if (record) {
        record.bytes = bytes
        if (type) record.type = type
      }
      inFlight -= 1
      lastActivity = Date.now()
    }
    client.on('Network.responseReceived', (event) => {
      const record = seen.get(event.requestId)
      if (record) record.type = event.type
    })
    client.on('Network.loadingFinished', (event) =>
      settle(event.requestId, event.encodedDataLength),
    )
    client.on('Network.loadingFailed', (event) => settle(event.requestId, 0))

    await page.goto(url, { waitUntil: 'load', timeout: 120_000 })

    const deadline = Date.now() + CEILING_MS
    while (Date.now() < deadline) {
      if (inFlight <= 0 && Date.now() - lastActivity > QUIET_MS) break
      await page.waitForTimeout(200)
    }

    const vitals = await readVitals(page)

    const byType: Record<string, { requests: number; bytes: number }> = {}
    let requests = 0
    let bytes = 0
    for (const record of seen.values()) {
      /* A request that never got a response is not a resource the page loaded. */
      if (record.type === null) continue
      requests += 1
      bytes += record.bytes
      const bucket = (byType[record.type] ??= { requests: 0, bytes: 0 })
      bucket.requests += 1
      bucket.bytes += record.bytes
    }

    return { requests, bytes, vitals, byType }
  } finally {
    await context.close()
  }
}

/**
 * FCP, LCP, CLS and TTFB, read from the page's own performance timeline.
 *
 * `buffered: true` on both observers, because LCP's final entry and every layout
 * shift happened long before this runs - an observer registered now with no
 * buffer would report a page that never shifted and never painted.
 */
async function readVitals(page: import('@playwright/test').Page): Promise<Vitals> {
  return page.evaluate<Vitals>(
    () =>
      new Promise((resolve) => {
        let lcp: number | null = null
        let cls = 0

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) lcp = Math.round(entry.startTime)
        }).observe({ type: 'largest-contentful-paint', buffered: true })

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & {
              value: number
              hadRecentInput: boolean
            }
            if (!shift.hadRecentInput) cls += shift.value
          }
        }).observe({ type: 'layout-shift', buffered: true })

        const paint = performance
          .getEntriesByType('paint')
          .find((entry) => entry.name === 'first-contentful-paint')
        const navigation = performance.getEntriesByType('navigation')[0] as
          PerformanceNavigationTiming | undefined

        /* One task, so both buffered observers have delivered. */
        setTimeout(
          () =>
            resolve({
              fcp: paint ? Math.round(paint.startTime) : null,
              lcp,
              cls: Math.round(cls * 10000) / 10000,
              ttfb: navigation ? Math.round(navigation.responseStart) : null,
            }),
          300,
        )
      }),
  )
}

export async function launch(): Promise<Browser> {
  return chromium.launch()
}
