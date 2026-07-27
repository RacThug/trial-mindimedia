/*
 * The arithmetic the Fidelity Harness reports: two rasters in, one percentage
 * out.
 *
 * Kept apart from the capture for one reason - this is the half that can be
 * wrong without anything looking wrong. A browser that fails to settle produces
 * an obviously silly picture; a comparison that quietly excludes the rows where
 * the two Sections disagree produces a flattering number, which is exactly what
 * ADR-0003 says this harness exists not to do.
 */

/** A decoded region: 8-bit RGB, row-major, no padding. */
export type Raster = {
  readonly raw: Uint8Array
  readonly width: number
  readonly height: number
}

export type RegionComparison = {
  /** Pixels matching within the tolerance. */
  readonly matched: number
  /** Pixels compared, counted against the **taller** of the two. */
  readonly total: number
  readonly percent: number
  readonly cloneHeight: number
  readonly referenceHeight: number
}

/**
 * Per-channel slack, in 8-bit levels.
 *
 * #9's hand comparison of the nav and the footer used 2, and every number in PRD
 * section 8 was produced at that setting, so this is a measured convention
 * rather than a preference: changing it silently rebases the table.
 *
 * It buys back antialiasing, not layout. A 1px positional offset - the residual
 * #9 found on the centred nav links - is nowhere near forgiven by it, which is
 * the property that makes the number worth reading.
 */
export const DEFAULT_TOLERANCE = 2

/**
 * Compare two regions of equal width.
 *
 * Rows past the shorter region's height count as misses rather than being
 * dropped. A Section that is 40px too tall but pixel-perfect where it overlaps
 * has a real Fidelity problem, and scoring only the overlap would hide it behind
 * a 100%.
 */
export function compareRegions(
  clone: Raster,
  reference: Raster,
  { tolerance = DEFAULT_TOLERANCE }: { readonly tolerance?: number } = {},
): RegionComparison {
  if (clone.width !== reference.width) {
    throw new Error(
      `Cannot compare regions of different width: ${clone.width} against ${reference.width}`,
    )
  }

  const width = clone.width
  const overlap = Math.min(clone.height, reference.height)
  const total = width * Math.max(clone.height, reference.height)

  let matched = 0
  for (let i = 0; i < width * overlap; i += 1) {
    const at = i * 3
    if (
      Math.abs((clone.raw[at] ?? 0) - (reference.raw[at] ?? 0)) <= tolerance &&
      Math.abs((clone.raw[at + 1] ?? 0) - (reference.raw[at + 1] ?? 0)) <= tolerance &&
      Math.abs((clone.raw[at + 2] ?? 0) - (reference.raw[at + 2] ?? 0)) <= tolerance
    ) {
      matched += 1
    }
  }

  return {
    matched,
    total,
    percent: total === 0 ? 100 : (matched / total) * 100,
    cloneHeight: clone.height,
    referenceHeight: reference.height,
  }
}

/**
 * One decimal, and never a rounded-up 100%.
 *
 * 99.96% is not 100%, and printing it as one would be the unbacked claim this
 * whole harness is here to replace. Only a genuine 100 prints as 100.
 */
export function formatPercent(percent: number): string {
  if (percent >= 100) return '100%'
  return `${(Math.floor(percent * 10) / 10).toFixed(1)}%`
}
