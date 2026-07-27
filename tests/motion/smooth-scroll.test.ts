import { describe, expect, it } from 'vitest'
import {
  SCROLL_MULTIPLIER,
  SCROLL_TAU_MS,
  scrollDelta,
  scrollStep,
} from '@/components/motion/smooth-scroll.ts'

/*
 * The follow #15 measured off the Reference. These pin the two properties that
 * make it the Reference's curve rather than a plausible one: it arrives where
 * the wheel asked and it takes the measured time getting there, whatever frame
 * rate it is played at.
 */

const wheel = (deltaY: number, deltaMode = 0) => ({ deltaY, deltaMode }) as WheelEvent

describe('scrollDelta', () => {
  it('is one page pixel per wheel pixel, which is what was measured', () => {
    expect(scrollDelta(wheel(120), 16, 900)).toBe(120)
    expect(SCROLL_MULTIPLIER).toBe(1)
  })

  it('reads a line as a line and a page as a viewport', () => {
    /* Firefox sends lines. A build that treated the number as pixels would
     * scroll it about a twentieth of the distance. */
    expect(scrollDelta(wheel(3, 1), 16, 900)).toBe(48)
    expect(scrollDelta(wheel(1, 2), 16, 900)).toBe(900)
  })

  it('keeps the sign, so a wheel up is a page up', () => {
    expect(scrollDelta(wheel(-120), 16, 900)).toBe(-120)
  })
})

describe('scrollStep', () => {
  it('has covered 1 - 1/e of the distance after one time constant', () => {
    const at = scrollStep(0, 100, SCROLL_TAU_MS)
    expect(at).toBeCloseTo(100 * (1 - Math.exp(-1)), 6)
  })

  it('lands where a whole frame would after two half frames', () => {
    /* The reason the curve is a time constant rather than a per-frame lerp: a
     * dropped frame has to leave the page where an on-time one would. */
    const whole = scrollStep(0, 500, 32)
    const halves = scrollStep(scrollStep(0, 500, 16), 500, 16)
    expect(halves).toBeCloseTo(whole, 9)
  })

  it('approaches the target without passing it', () => {
    let at = 0
    for (let elapsed = 0; elapsed < 3000; elapsed += 16) {
      const next = scrollStep(at, 400, 16)
      expect(next).toBeGreaterThanOrEqual(at)
      expect(next).toBeLessThanOrEqual(400)
      at = next
    }
    expect(at).toBeGreaterThan(399.9)
  })

  it('matches the Reference trace it was fitted to', () => {
    /*
     * Three frames of the measured 120px notch (issue #15), to the pixel the
     * sampling could resolve: 49px at 160.8ms, 88px at 396.4ms, 116px at
     * 976.8ms.
     *
     * `DELAY_MS` is the fitted gap between the sampler starting and the notch
     * landing - 12ms on this trace, and a free parameter of the fit rather than
     * a fudge. Leaving it out is what makes a clean exponential look like it
     * drifts, and is how a first pass at this reading talked itself into a
     * duration-and-easing curve.
     */
    const DELAY_MS = 12

    /* Within a pixel, which is all the trace has: the Reference reports
     * `scrollY` rounded, and the fit is 287ms against the 288 shipped. */
    const TRACE: readonly (readonly [number, number])[] = [
      [160.8, 49],
      [396.4, 88],
      [976.8, 116],
    ]

    for (const [at, measured] of TRACE) {
      expect(Math.abs(scrollStep(0, 120, at - DELAY_MS) - measured)).toBeLessThan(1)
    }
  })
})
