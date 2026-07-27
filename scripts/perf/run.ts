/*
 * The performance budget (PRD section 8).
 *
 *   npm run build && npm run start          # in one terminal
 *   npm run perf                            # in another
 *
 * Measures the Clone and the Reference the same way, prints a Markdown table for
 * the README, and exits non-zero if the Clone misses a target.
 *
 * The exit code is the one difference from the fidelity harness, and it is not a
 * contradiction of ADR-0003. Every target here is a fact about **our** page; the
 * Reference column is context, and its absence or slowness cannot fail the run.
 * It is still not a CI gate, for the ordinary reason nothing in this repo is -
 * there is no workflow - but a script that says "budget missed" and exits 0 is a
 * script nobody reads twice.
 *
 * Two runs of Lighthouse on the same machine differ by a point or two, so the
 * score is taken as the **median of three**. A budget decided by whichever run
 * happened to go first is not a budget.
 */

import { launch, measureLoad, MOBILE, type LoadMeasurement } from './measure.ts'
import { runLighthouse } from './lighthouse.ts'

const CLONE_URL = process.env.CLONE_URL ?? 'http://localhost:3000'
const REFERENCE_URL = process.env.REFERENCE_URL ?? 'https://browser.supply/'

/**
 * Odd, so there is a median, and five rather than three.
 *
 * Measured on the machine this was built on: the same page and build scored 88,
 * 90, 93, 94 and 95 across runs, because a Lighthouse score is a simulation
 * driven by a real CPU that is also doing other things. Three runs put the
 * median anywhere in a five-point band, which is wider than most of the
 * decisions anybody would make from it.
 */
const LIGHTHOUSE_RUNS = 5

/**
 * A pause between runs, because back-to-back runs measure the machine.
 *
 * A Lighthouse score is a simulation driven by a real CPU, and five runs in a
 * row leave it hotter and busier than the first one found it. Lighthouse's own
 * guidance is to measure on a quiet machine; this is the cheapest approximation
 * of one.
 */
const LIGHTHOUSE_SETTLE_MS = 8000

type Target = {
  readonly label: string
  readonly limit: number
  /** `atMost` for a ceiling, `atLeast` for a floor. Five of six are ceilings. */
  readonly direction: 'atMost' | 'atLeast'
  readonly format: (value: number) => string
}

/** PRD section 8's table, as the thing that decides the exit code. */
const TARGETS = {
  lighthouse: {
    label: 'Lighthouse Performance (mobile)',
    limit: 95,
    direction: 'atLeast',
    format: (v) => `${v}`,
  },
  fcp: {
    label: 'FCP',
    limit: 1200,
    direction: 'atMost',
    format: (v) => `${Math.round(v)} ms`,
  },
  lcp: {
    label: 'LCP',
    limit: 1500,
    direction: 'atMost',
    format: (v) => `${Math.round(v)} ms`,
  },
  bytes: {
    label: 'Initial transfer',
    limit: 1024 * 1024,
    direction: 'atMost',
    format: (v) => `${(v / 1024 / 1024).toFixed(2)} MB`,
  },
  requests: {
    label: 'Initial requests',
    limit: 40,
    direction: 'atMost',
    format: (v) => `${v}`,
  },
  cls: { label: 'CLS', limit: 0.02, direction: 'atMost', format: (v) => v.toFixed(4) },
} as const satisfies Record<string, Target>

type Metric = keyof typeof TARGETS

/**
 * Whether a measurement is inside its target.
 *
 * Strictly under a ceiling, because PRD section 8 writes them `< 40` and
 * `< 1.0 MB`: a fortieth request is a missed target, not a met one. At or above
 * a floor, because the one floor there is written `>= 95`.
 */
const meets = (metric: Metric, value: number | null): boolean => {
  if (value === null) return false
  const { limit, direction } = TARGETS[metric]
  return direction === 'atLeast' ? value >= limit : value < limit
}

async function main(): Promise<void> {
  const browser = await launch()
  let clone: LoadMeasurement
  let reference: LoadMeasurement | null = null

  try {
    process.stderr.write(`measuring the Clone at ${MOBILE.width}x${MOBILE.height}...\n`)
    clone = await measureLoad(browser, CLONE_URL)

    process.stderr.write('measuring the Reference...\n')
    try {
      reference = await measureLoad(browser, REFERENCE_URL)
    } catch (error) {
      process.stderr.write(`  the Reference could not be measured: ${String(error)}\n`)
    }
  } finally {
    await browser.close()
  }

  process.stderr.write(`running Lighthouse ${LIGHTHOUSE_RUNS} times...\n`)
  const scores: number[] = []
  const throttled: Readonly<Record<string, number>>[] = []
  for (let run = 0; run < LIGHTHOUSE_RUNS; run += 1) {
    if (run > 0) await new Promise((resolve) => setTimeout(resolve, LIGHTHOUSE_SETTLE_MS))
    const result = await runLighthouse(CLONE_URL)
    scores.push(result.performance)
    throttled.push(result.metrics)
    process.stderr.write(`  run ${run + 1}: ${result.performance}\n`)
  }
  const lighthouseScore = median(scores)
  /* The metrics from the run whose score is the median, not an average of three
   * runs' metrics - an average of metrics is not the run anybody scored. */
  const medianRun = throttled[scores.indexOf(lighthouseScore)] ?? {}

  const values: Record<Metric, { clone: number | null; reference: number | null }> = {
    lighthouse: { clone: lighthouseScore, reference: null },
    fcp: { clone: clone.vitals.fcp, reference: reference?.vitals.fcp ?? null },
    lcp: { clone: clone.vitals.lcp, reference: reference?.vitals.lcp ?? null },
    bytes: { clone: clone.bytes, reference: reference?.bytes ?? null },
    requests: { clone: clone.requests, reference: reference?.requests ?? null },
    cls: { clone: clone.vitals.cls, reference: reference?.vitals.cls ?? null },
  }

  process.stdout.write(render(values, clone, reference, scores, medianRun))

  const missed = (Object.keys(TARGETS) as Metric[]).filter(
    (metric) => !meets(metric, values[metric].clone),
  )
  if (missed.length > 0) {
    process.stderr.write(
      `\nbudget missed: ${missed.map((m) => TARGETS[m].label).join(', ')}\n`,
    )
    process.exitCode = 1
  }
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

function render(
  values: Record<Metric, { clone: number | null; reference: number | null }>,
  clone: LoadMeasurement,
  reference: LoadMeasurement | null,
  scores: readonly number[],
  throttled: Readonly<Record<string, number>>,
): string {
  const lines: string[] = []
  lines.push('| Metric | Reference | Target | Clone | |')
  lines.push('| --- | --- | --- | --- | --- |')

  for (const metric of Object.keys(TARGETS) as Metric[]) {
    const target = TARGETS[metric]
    const { clone: measured, reference: theirs } = values[metric]
    const limit =
      target.direction === 'atLeast'
        ? `>= ${target.format(target.limit)}`
        : `< ${target.format(target.limit)}`
    lines.push(
      `| ${target.label} | ${theirs === null ? 'not measured' : target.format(theirs)} | **${limit}** |` +
        ` ${measured === null ? 'not measured' : target.format(measured)} |` +
        ` ${meets(metric, measured) ? 'pass' : 'MISS'} |`,
    )
  }

  lines.push('')
  lines.push(
    `Measured at ${MOBILE.width}x${MOBILE.height} DPR ${MOBILE.deviceScaleFactor}, the device Lighthouse's mobile preset emulates.`,
  )
  lines.push(
    'Initial load is everything fetched from navigation until the network has been quiet',
  )
  lines.push('for two seconds, with no scrolling - so a clip that a first-viewport')
  lines.push(
    'IntersectionObserver starts is counted, and deferring work by half a second buys',
  )
  lines.push('nothing. Bytes are `encodedDataLength` off the wire, not decoded sizes.')
  lines.push(
    `Lighthouse Performance is the median of ${scores.length}: ${scores.join(', ')}. It moves`,
  )
  lines.push(
    'several points with whatever else the machine is doing, so read the spread rather than',
  )
  lines.push('the median alone.')
  lines.push('')
  /*
   * The table above and the Lighthouse row are two throttling regimes, and
   * printing only the first would put the flattering number in the pass column.
   * Every row but the Lighthouse one is measured on an unthrottled connection
   * and CPU, which is what the Reference's own numbers in PRD section 1 were
   * taken on; Lighthouse simulates slow 4G and a CPU four times slower. Both
   * belong here, side by side, or the budget reads better than the page is.
   */
  lines.push('**Every row above except the Lighthouse one is unthrottled**, on the same')
  lines.push("connection and CPU the Reference's own numbers were taken on. Under")
  lines.push("Lighthouse's simulated slow 4G and 4x CPU, the same page reports:")
  lines.push('')
  for (const [id, value] of Object.entries(throttled)) {
    const unit = id === 'cumulative-layout-shift' ? '' : ' ms'
    lines.push(`- ${id}: ${Math.round(value * 1000) / 1000}${unit}`)
  }
  lines.push('')
  lines.push('Where the bytes go:')
  lines.push('')
  lines.push(
    '| Type | Clone requests | Clone bytes | Reference requests | Reference bytes |',
  )
  lines.push('| --- | --- | --- | --- | --- |')

  const types = new Set([
    ...Object.keys(clone.byType),
    ...Object.keys(reference?.byType ?? {}),
  ])
  for (const type of [...types].sort()) {
    const ours = clone.byType[type]
    const theirs = reference?.byType[type]
    lines.push(
      `| ${type} | ${ours?.requests ?? 0} | ${kb(ours?.bytes ?? 0)} |` +
        ` ${theirs?.requests ?? 0} | ${kb(theirs?.bytes ?? 0)} |`,
    )
  }

  return `${lines.join('\n')}\n`
}

const kb = (bytes: number) => `${Math.round(bytes / 1024)} kB`

await main()
