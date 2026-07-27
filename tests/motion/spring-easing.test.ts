import { describe, expect, it } from 'vitest'
import { APPEAR } from '@/components/motion/appear.ts'
import { linearEasing, springProgress } from '@/components/motion/spring-easing.ts'

/*
 * The measured spring, expressed as something CSS can run without JavaScript
 * (#14). The physics is the same physics #13 fitted; what is new is that it has
 * to produce a curve rather than drive one, so these pin the properties that
 * make the CSS version and the Motion version the same animation.
 */

const SECTION = APPEAR.section.spring

describe('springProgress', () => {
  it('starts at rest', () => {
    expect(springProgress(SECTION, 0)).toBe(0)
  })

  it('has effectively arrived by the measured settle of 570ms', () => {
    /* #13 measured the Reference's travel stopping at ~570ms. A curve that was
     * still visibly moving there would be a different spring, not a rounding. */
    expect(springProgress(SECTION, 0.57)).toBeGreaterThan(0.99)
  })

  it('rises monotonically, because zeta 1.06 does not overshoot', () => {
    /* The Section spring is just past critical damping (`appear.ts`), so the
     * curve never goes above 1 - which is what a reviewer sees as "it settles
     * without bouncing". */
    let previous = -1
    for (let t = 0; t <= 0.8; t += 0.01) {
      const value = springProgress(SECTION, t)
      expect(value).toBeGreaterThanOrEqual(previous)
      expect(value).toBeLessThanOrEqual(1.0001)
      previous = value
    }
  })

  it('reaches halfway faster than a linear ramp would', () => {
    /* A spring front-loads its travel. If this ever failed, the curve would have
     * become an ease-in and the Section would look like it was being pushed. */
    expect(springProgress(SECTION, 0.285)).toBeGreaterThan(0.5)
  })

  it('is slower to arrive on the nested cards, which are heavily overdamped', () => {
    expect(springProgress(APPEAR.block.spring, 0.57)).toBeLessThan(
      springProgress(SECTION, 0.57),
    )
  })
})

describe('linearEasing', () => {
  const easing = linearEasing(SECTION, 0.57)

  it('is a CSS linear() function', () => {
    expect(easing).toMatch(/^linear\([\d., ]+\)$/)
  })

  it('pins both ends exactly, so the element lands where it was sent', () => {
    const stops = easing.slice('linear('.length, -1).split(', ').map(Number)
    expect(stops[0]).toBe(0)
    expect(stops.at(-1)).toBe(1)
  })

  it('samples finely enough that no step is a visible jump', () => {
    const stops = easing.slice('linear('.length, -1).split(', ').map(Number)
    const biggest = Math.max(...stops.slice(1).map((stop, i) => stop - stops[i]!))
    expect(biggest).toBeLessThan(0.1)
  })

  it('gives a longer duration its own curve rather than stretching the shorter one', () => {
    /*
     * The travel settles at 570ms and the opacity at 755ms (#13), and they are
     * the same spring sampled over different windows - not one curve played
     * slower. Stretching would make the opacity arrive late in a way the
     * Reference's does not.
     */
    expect(linearEasing(SECTION, 0.755)).not.toBe(easing)
  })
})
