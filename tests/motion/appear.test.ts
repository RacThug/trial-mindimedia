import { describe, expect, it } from 'vitest'
import {
  APPEAR,
  APPEAR_VISIBLE_FRACTION,
  appearThreshold,
} from '@/components/motion/appear.ts'

/*
 * These numbers are measurements of the Reference, not preferences (#13). They
 * are pinned here for the reason ADR-0003 gives: a measured value that lives
 * only in a component is one refactor away from being replaced by a plausible
 * default, and nothing would fail.
 *
 * Method, so a future session can re-run rather than re-derive: a
 * MutationObserver on `style` catches every frame Motion writes, which is what
 * PRD section 10 item 1 assumed was impossible - it is `getAnimations()` and
 * computed styles that miss it, not the DOM. The captured curves were then fitted
 * against Motion's own `spring()` solver over a parameter grid
 * (`docs/measure/fit-13-spring.mjs`).
 */
describe('Scroll-Appear parameters', () => {
  it('moves a Section 30px and fades it in', () => {
    expect(APPEAR.section.travel).toBe(30)
  })

  it('drives a Section with the measured spring', () => {
    /*
     * Two independent dense captures put the least-squares argmin at
     * (204, 30.5) and (198, 29.75); (200, 30) sits between them and is within
     * 0.0003 RMS of each, which is far inside the noise of a 60fps capture.
     */
    expect(APPEAR.section.spring).toEqual({
      type: 'spring',
      stiffness: 200,
      damping: 30,
      mass: 1,
    })
  })

  it('gives nested blocks their own shorter, slower appear', () => {
    /*
     * The Reference does not give every Section the Section treatment: the quiz
     * CTA card and the case study card animate as cards inside one, at 10px
     * and 0px, on a heavily overdamped spring (zeta ~ 2.16). One spring fitted
     * jointly across five captures, worst-case RMS 0.013.
     */
    expect(APPEAR.block.travel).toBe(10)
    expect(APPEAR.inPlace.travel).toBe(0)
    expect(APPEAR.block.spring).toEqual(APPEAR.inPlace.spring)
    expect(APPEAR.block.spring.stiffness).toBe(86)
    expect(APPEAR.block.spring.damping).toBe(40)
  })
})

/*
 * The trigger rule matters more than it looks. Motion passes `viewport.amount`
 * straight to IntersectionObserver without clamping it, so `amount: 0.5` on a
 * Section more than twice the viewport tall can never reach a ratio of 0.5 and
 * the Section stays at `opacity: 0` for good. Measured, the Reference fires at
 * half of whichever is smaller, the element or the viewport - which is the same
 * rule, expressed so that it survives a tall Section.
 */
describe('appearThreshold', () => {
  it('is half the element when the element fits in the viewport', () => {
    expect(appearThreshold(600, 900)).toBeCloseTo(0.5)
    expect(appearThreshold(900, 900)).toBeCloseTo(0.5)
  })

  it('falls back to half the viewport once the element is taller', () => {
    /*
     * A 1317px Section in a 900px viewport fires at half the viewport, 450px.
     * The capture read 475px because the probe crept up on the trigger 25px at
     * a time and stopped at the first step past it, so the measurement is one
     * step high; 450 is the value that measurement is of.
     */
    expect(appearThreshold(1317, 900)).toBeCloseTo(450 / 1317, 4)
    expect(appearThreshold(1694, 900)).toBeCloseTo(450 / 1694, 4)
  })

  it('stays reachable however tall the element gets', () => {
    /* A 4000px band on a 390px phone still has to be able to fire. */
    for (const height of [1000, 2000, 4000, 12_000]) {
      const threshold = appearThreshold(height, 844)
      expect(threshold).toBeGreaterThan(0)
      expect(threshold).toBeLessThanOrEqual(844 / height)
    }
  })

  it('never returns a threshold IntersectionObserver would reject', () => {
    for (const height of [0, -1, Number.NaN, 1, 50_000]) {
      const threshold = appearThreshold(height, 900)
      expect(threshold).toBeGreaterThan(0)
      expect(threshold).toBeLessThanOrEqual(1)
    }
  })

  it('is expressed as a fraction of the visible half', () => {
    expect(APPEAR_VISIBLE_FRACTION).toBe(0.5)
  })
})
