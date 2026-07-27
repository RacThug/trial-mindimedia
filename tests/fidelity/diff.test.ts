import { describe, expect, it } from 'vitest'
import { compareRegions, formatPercent } from '../../scripts/fidelity/diff.ts'

/*
 * The arithmetic behind every number the harness prints, tested away from a
 * browser. What the harness itself adds is two screenshots; the rule for turning
 * two rasters into a percentage is here, and it is the part that can be wrong
 * quietly.
 */

/** An `h`-row, `w`-column RGB raster filled with one colour. */
const solid = (w: number, h: number, [r, g, b]: readonly [number, number, number]) => {
  const raw = new Uint8Array(w * h * 3)
  for (let i = 0; i < w * h; i += 1) {
    raw[i * 3] = r
    raw[i * 3 + 1] = g
    raw[i * 3 + 2] = b
  }
  return raw
}

describe('compareRegions', () => {
  it('scores identical rasters at 100%', () => {
    const raster = solid(4, 3, [10, 20, 30])
    const result = compareRegions(
      { raw: raster, width: 4, height: 3 },
      { raw: raster.slice(), width: 4, height: 3 },
    )
    expect(result).toMatchObject({ matched: 12, total: 12, percent: 100 })
  })

  it('forgives a channel drift inside the tolerance', () => {
    /*
     * The tolerance is not a fudge factor. Both sides are rasterised by the same
     * Chromium from the same fonts, but subpixel antialiasing puts a channel or
     * two of difference on every glyph edge even where the layout is identical -
     * #9 measured the residual on the nav as a 1px offset, not a colour shift.
     */
    const result = compareRegions(
      { raw: solid(2, 1, [100, 100, 100]), width: 2, height: 1 },
      { raw: solid(2, 1, [102, 100, 98]), width: 2, height: 1 },
      { tolerance: 2 },
    )
    expect(result.percent).toBe(100)
  })

  it('counts a pixel one channel past the tolerance as a miss', () => {
    const result = compareRegions(
      { raw: solid(2, 1, [100, 100, 100]), width: 2, height: 1 },
      { raw: solid(2, 1, [100, 103, 100]), width: 2, height: 1 },
      { tolerance: 2 },
    )
    expect(result).toMatchObject({ matched: 0, total: 2, percent: 0 })
  })

  it('scores a half-wrong raster at 50%', () => {
    const clone = solid(2, 1, [0, 0, 0])
    const reference = solid(2, 1, [0, 0, 0])
    reference[3] = 255
    const result = compareRegions(
      { raw: clone, width: 2, height: 1 },
      { raw: reference, width: 2, height: 1 },
    )
    expect(result.percent).toBe(50)
  })

  /*
   * Height drift is the failure this harness exists to catch, so it must reach
   * the percentage rather than sit in a footnote. A Section 10% too tall that
   * matches perfectly where the two overlap is not a 100% match.
   */
  describe('when the two Sections are different heights', () => {
    const clone = { raw: solid(2, 6, [7, 7, 7]), width: 2, height: 6 }
    const reference = { raw: solid(2, 4, [7, 7, 7]), width: 2, height: 4 }

    it('scores the overlap against the taller of the two', () => {
      const result = compareRegions(clone, reference)
      expect(result).toMatchObject({ matched: 8, total: 12 })
      expect(result.percent).toBeCloseTo(66.67, 2)
    })

    it('reports both heights so the drift is visible, not just its cost', () => {
      expect(compareRegions(clone, reference)).toMatchObject({
        cloneHeight: 6,
        referenceHeight: 4,
      })
    })

    it('is symmetric: which side is taller does not change the score', () => {
      expect(compareRegions(reference, clone).percent).toBeCloseTo(
        compareRegions(clone, reference).percent,
        10,
      )
    })
  })

  it('rejects rasters of different widths rather than guessing an alignment', () => {
    expect(() =>
      compareRegions(
        { raw: solid(2, 1, [0, 0, 0]), width: 2, height: 1 },
        { raw: solid(3, 1, [0, 0, 0]), width: 3, height: 1 },
      ),
    ).toThrow(/width/i)
  })

  it('scores an empty region as 100% rather than dividing by zero', () => {
    const empty = { raw: new Uint8Array(0), width: 0, height: 0 }
    expect(compareRegions(empty, empty).percent).toBe(100)
  })
})

describe('formatPercent', () => {
  it('keeps one decimal, which is the precision the table reports', () => {
    expect(formatPercent(97.94)).toBe('97.9%')
  })

  /*
   * A rounded 100.0% on a region that is not byte-identical is the one number
   * this harness must never print - it is the unbacked claim ADR-0003 exists to
   * avoid. Short of a true 100, it floors.
   */
  it('never rounds up to 100%', () => {
    expect(formatPercent(99.99)).toBe('99.9%')
    expect(formatPercent(100)).toBe('100%')
  })
})
