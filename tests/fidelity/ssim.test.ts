import { describe, expect, it } from 'vitest'
import { meanSsim, WINDOW } from '../../scripts/lib/ssim.ts'

/*
 * The metric two gates share - the asset encode's 0.98 floor (#7) and the
 * Fidelity Harness's per-Section score (#14) - and until #14 it had no test at
 * all. These pin the properties both callers rely on, not the implementation:
 * that identical images score 1, that noise costs less than structure, and that
 * it refuses rather than guesses when there is nothing to compare.
 */

const SIZE = 32

const fill = (value: (x: number, y: number) => number) => {
  const plane = new Uint8Array(SIZE * SIZE)
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1)
      plane[y * SIZE + x] = Math.max(0, Math.min(255, value(x, y)))
  }
  return plane
}

/* Deterministic, and unrelated to the gradient, so it reads as noise. */
const jitter = (x: number, y: number) => ((x * 37 + y * 101) % 7) - 3

describe('meanSsim', () => {
  it('scores an image against itself at 1', () => {
    const plane = fill((x, y) => x * 4 + y * 2)
    expect(meanSsim(plane, plane.slice(), SIZE, SIZE)).toBeCloseTo(1, 10)
  })

  it('barely notices low-amplitude noise, which is what an encode leaves behind', () => {
    const plane = fill((x, y) => x * 4 + y * 2)
    const noisy = fill((x, y) => x * 4 + y * 2 + jitter(x, y))
    expect(meanSsim(plane, noisy, SIZE, SIZE)).toBeGreaterThan(0.9)
  })

  /*
   * The property that makes it the right metric for a Section carrying video: a
   * few levels of encode noise everywhere has to cost less than a feature in the
   * wrong place, or the harness would report the encode instead of the layout.
   */
  it('punishes displaced structure far harder than noise of the same magnitude', () => {
    const bars = fill((x) => (Math.floor(x / 4) % 2 === 0 ? 40 : 200))
    const shifted = fill((x) => (Math.floor((x + 4) / 4) % 2 === 0 ? 40 : 200))
    const noisy = fill(
      (x, y) => (Math.floor(x / 4) % 2 === 0 ? 40 : 200) + jitter(x, y) * 20,
    )

    expect(meanSsim(bars, shifted, SIZE, SIZE)).toBeLessThan(
      meanSsim(bars, noisy, SIZE, SIZE),
    )
  })

  it('refuses an image smaller than one window rather than reporting a confident 1', () => {
    const tiny = new Uint8Array((WINDOW - 1) * (WINDOW - 1))
    expect(() => meanSsim(tiny, tiny.slice(), WINDOW - 1, WINDOW - 1)).toThrow(/window/i)
  })
})
