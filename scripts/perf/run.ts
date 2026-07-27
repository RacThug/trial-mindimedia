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

/** Odd, so there is a median. */
const LIGHTHOUSE_RUNS = 3

type Target = {
  readonly label: string
  /** Lower is better for every one of these, so one comparison covers them all. */
  readonly limit: number
  readonly format: (value: number) => string
}

/** PRD section 8's table, as the thing that decides the exit code. */
const TARGETS = {
  lighthouse: {
    label: 'Lighthouse Performance (mobile)',
    limit: -95,
    format: (v) => `${v}`,
  },
  fcp: { label: 'FCP', limit: 1200, format: (v) => `${Math.round(v)} ms` },
  lcp: { label: 'LCP', limit: 1500, format: (v) => `${Math.round(v)} ms` },
  bytes: {
    label: 'Initial transfer',
    limit: 1024 * 1024,
    format: (v) => `${(v / 1024 / 1024).toFixed(2)} MB`,
  },
  requests: { label: 'Initial requests', limit: 40, format: (v) => `${v}` },
  cls: { label: 'CLS', limit: 0.02, format: (v) => v.toFixed(4) },
} as const satisfies Record<string, Target>

type Metric = keyof typeof TARGETS

/**
 * Whether a measurement is inside its target.
 *
 * A negative limit means "at least this much", which is how the one
 * higher-is-better row in PRD section 8 - the Lighthouse score - lives in the
 * same table as five lower-is-better ones without a second comparison to keep in
 * step with the first.
 */
const meets = (metric: Metric, value: number | null): boolean => {
  if (value === null) return false
  const { limit } = TARGETS[metric]
  return limit < 0 ? value >= -limit : value <= limit
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
  for (let run = 0; run < LIGHTHOUSE_RUNS; run += 1) {
    const result = await runLighthouse(CLONE_URL)
    scores.push(result.performance)
    process.stderr.write(`  run ${run + 1}: ${result.performance}\n`)
  }
  const lighthouseScore = median(scores)

  const values: Record<Metric, { clone: number | null; reference: number | null }> = {
    lighthouse: { clone: lighthouseScore, reference: null },
    fcp: { clone: clone.vitals.fcp, reference: reference?.vitals.fcp ?? null },
    lcp: { clone: clone.vitals.lcp, reference: reference?.vitals.lcp ?? null },
    bytes: { clone: clone.bytes, reference: reference?.bytes ?? null },
    requests: { clone: clone.requests, reference: reference?.requests ?? null },
    cls: { clone: clone.vitals.cls, reference: reference?.vitals.cls ?? null },
  }

  process.stdout.write(render(values, clone, reference, scores))

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
): string {
  const lines: string[] = []
  lines.push('| Metric | Reference | Target | Clone | |')
  lines.push('| --- | --- | --- | --- | --- |')

  for (const metric of Object.keys(TARGETS) as Metric[]) {
    const target = TARGETS[metric]
    const { clone: measured, reference: theirs } = values[metric]
    const limit =
      target.limit < 0 ? `>= ${-target.limit}` : `< ${target.format(target.limit)}`
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
    `Lighthouse Performance is the median of ${scores.length}: ${scores.join(', ')}.`,
  )
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
