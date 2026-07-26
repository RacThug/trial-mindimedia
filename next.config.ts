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
     * The Reference's Breakpoints, not Next's defaults. `next/image` picks a
     * variant from these against each component's `sizes`, so widths that do not
     * line up with the layout mean every image is a little too large or a little
     * too small. Measured renders: Template Wall tiles 128/191/348, step
     * thumbnails 275, featured Template cards 351/387, feature bento 552 - each
     * doubled here for DPR 2, plus 1920 for the widest still on the page.
     */
    deviceSizes: [256, 382, 550, 696, 774, 1104, 1360, 1920],
    imageSizes: [32, 40, 64, 84, 128, 200],
  },
}

export default nextConfig
