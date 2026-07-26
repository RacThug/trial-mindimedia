import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    /*
     * AVIF first, WebP behind it. Everything under `public/media` is already a
     * committed WebP, so this is the second pass: `next/image` re-encodes per
     * request width, and AVIF lands roughly 20% under WebP at the same quality.
     * A browser that supports neither still gets the original (PRD section 8).
     */
    formats: ['image/avif', 'image/webp'],
    /*
     * The Reference's layout, not Next's defaults. `next/image` serves the
     * smallest entry at or above the width a component's `sizes` resolves to, so
     * a ladder that does not line up with the layout ships every image a little
     * too large. Each rung below is a measured render width at DPR 2, recorded
     * as `rendered` in `scripts/assets/manifest.ts`:
     *
     *    256  Template Wall tile, phone       (128)
     *    382  Template Wall tile, tablet      (191)
     *    550  step thumbnail, all three       (275)
     *    634  feature bento, tablet           (317)
     *    702  featured Template card, phone   (351)
     *    774  featured Template card, desktop (387)
     *    696  Template Wall tile, desktop     (348)
     *   1104  feature bento, desktop          (552)
     *   1920  headroom, DPR 3 on the bento    (552 x 3 = 1656)
     *
     * `imageSizes` covers the fixed-size elements, which carry a width rather
     * than a `sizes`: the 18px nav logo, the 32px footer portrait and the 40 to
     * 42px avatars, each at DPR 1 to 3.
     */
    deviceSizes: [256, 382, 550, 634, 696, 702, 774, 1104, 1920],
    imageSizes: [36, 40, 64, 84, 96, 128],
  },
}

export default nextConfig
