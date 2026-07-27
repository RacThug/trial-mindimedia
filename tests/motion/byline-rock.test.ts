import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  bylineRockStyle,
  ROCK_CYCLE_MS,
  ROCK_FROM,
  ROCK_SWING_END_PERCENT,
  ROCK_SWING_START_PERCENT,
  ROCK_TO,
} from '@/components/motion/byline-rock.ts'

/*
 * The by-line portrait's rock (#30), split across two files that cannot import
 * each other: the measurement is in `byline-rock.ts` and the keyframes are in
 * `globals.css`, because `@keyframes` cannot read a custom property for a stop.
 *
 * So this file is the join. If a later session re-measures the swing or the hold
 * and changes only the module, these fail rather than the portrait quietly
 * pausing for the wrong length of time - which is the kind of thing nobody sees
 * in a screenshot.
 */

const CSS = readFileSync(new URL('../../src/app/globals.css', import.meta.url), 'utf8')

/** The `@keyframes byline-rock { ... }` body, stops and all. */
const KEYFRAMES = CSS.match(/@keyframes byline-rock \{([\s\S]*?)\n\}/)?.[1] ?? ''

describe('the by-line rock keyframes', () => {
  it('are in the stylesheet', () => {
    expect(KEYFRAMES).not.toBe('')
  })

  it('swing between the two measured angles', () => {
    expect(KEYFRAMES).toContain(`rotate: ${ROCK_FROM}deg`)
    expect(KEYFRAMES).toContain(`rotate: ${ROCK_TO}deg`)
  })

  it('hold and swing for the measured share of the cycle', () => {
    const stops = [...KEYFRAMES.matchAll(/([\d.]+)%/g)].map((match) => Number(match[1]))

    /* 0, hold-ends, 50, second-hold-ends, 100 - in that order. */
    expect(stops[0]).toBe(0)
    expect(stops[1]).toBeCloseTo(ROCK_SWING_START_PERCENT, 2)
    expect(stops[2]).toBeCloseTo(ROCK_SWING_END_PERCENT, 2)
    expect(stops[3]).toBeCloseTo(50 + ROCK_SWING_START_PERCENT, 2)
    expect(stops[4]).toBe(100)
  })

  it('leave the easing to the shorthand', () => {
    /*
     * Deliberately not a keyframe's own timing function: Chromium does not
     * resolve `animation-timing-function: var(...)` inside a keyframe, and
     * silently plays `ease` instead - which drops the spring's overshoot and
     * looks close enough to pass a glance. Measured, the same curve peaks at
     * 100.0deg through a keyframe var and 101.82 through the shorthand.
     */
    expect(KEYFRAMES).not.toContain('animation-timing-function')
  })
})

describe('bylineRockStyle', () => {
  it('publishes the measured cycle', () => {
    const style = bylineRockStyle() as Record<string, string>
    expect(style['--byline-rock-duration']).toBe(`${ROCK_CYCLE_MS}ms`)
    expect(ROCK_CYCLE_MS).toBe(2834)
  })

  it('derives the easing rather than carrying a copy of one', () => {
    const style = bylineRockStyle() as Record<string, string>
    const easing = style['--byline-rock-ease'] ?? ''

    expect(easing).toMatch(/^linear\(0, /)
    expect(easing).toMatch(/1\)$/)

    /* The spring overshoots: it was fitted at zeta ~0.79, and the portrait
     * measurably swings past each angle before settling back onto it. A curve
     * with no stop above 1 would be a different animation. */
    const stops = easing.slice('linear('.length, -1).split(', ').map(Number)
    expect(Math.max(...stops)).toBeGreaterThan(1)
  })
})
