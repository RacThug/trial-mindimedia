/*
 * Mean luma SSIM: this repo's one answer to "do these two pictures look the
 * same".
 *
 * It arrived in #7 as the gate for the asset encode, where two other candidates
 * were tried and rejected - RGB RMSE measures WebP's 4:2:0 chroma subsampling
 * more than it measures the encode, and peak error is decided by single pixels
 * on hard edges. The reasoning is recorded in full in `scripts/assets/verify.ts`.
 *
 * #14 gave it a second caller. The Fidelity Harness has the same problem from
 * the other end: a strict pixel comparison of a Section carrying video reports
 * the re-encode rather than the layout, because every pixel inside a tile is a
 * level or three off even where the tile is in exactly the right place. Rather
 * than invent a second metric for that, both callers ask this one question, and
 * a number here means the same thing wherever it is printed.
 */

/* Wang et al.'s stabilisers for an 8-bit range: (0.01 * 255)^2, (0.03 * 255)^2. */
const C1 = 6.5025
const C2 = 58.5225

/** Window geometry: the 8x8 blocks WebP itself works in, stepped by half. */
export const WINDOW = 8
const STRIDE = 4

/**
 * Mean SSIM over the luma plane. Both buffers are single-channel, `width` wide.
 *
 * Throws rather than returning 1 for an image smaller than one window: a
 * comparison with nothing to compare is a caller's mistake, and a confident 1.0
 * is the worst possible way to report it.
 */
export function meanSsim(
  a: Uint8Array,
  b: Uint8Array,
  width: number,
  height: number,
): number {
  let total = 0
  let windows = 0

  for (let top = 0; top + WINDOW <= height; top += STRIDE) {
    for (let left = 0; left + WINDOW <= width; left += STRIDE) {
      let meanA = 0
      let meanB = 0
      for (let y = 0; y < WINDOW; y++) {
        for (let x = 0; x < WINDOW; x++) {
          const i = (top + y) * width + left + x
          meanA += a[i]!
          meanB += b[i]!
        }
      }
      const n = WINDOW * WINDOW
      meanA /= n
      meanB /= n

      let varianceA = 0
      let varianceB = 0
      let covariance = 0
      for (let y = 0; y < WINDOW; y++) {
        for (let x = 0; x < WINDOW; x++) {
          const i = (top + y) * width + left + x
          const deltaA = a[i]! - meanA
          const deltaB = b[i]! - meanB
          varianceA += deltaA * deltaA
          varianceB += deltaB * deltaB
          covariance += deltaA * deltaB
        }
      }
      /* Sample variance, so n - 1. */
      varianceA /= n - 1
      varianceB /= n - 1
      covariance /= n - 1

      total +=
        ((2 * meanA * meanB + C1) * (2 * covariance + C2)) /
        ((meanA * meanA + meanB * meanB + C1) * (varianceA + varianceB + C2))
      windows++
    }
  }

  if (windows === 0) throw new Error('image is smaller than one SSIM window')
  return total / windows
}
