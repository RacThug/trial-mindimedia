import Image from 'next/image'
import type { WallTile as Tile } from '@/lib/content'
import { LoopingVideo } from './looping-video.tsx'

/*
 * One tile of the Template Wall: a still, or a clip over its own poster.
 *
 * Both branches draw at the tile's intrinsic aspect ratio, which is what keeps
 * the wall out of the CLS budget (PRD section 8, lever 5). Nothing here is
 * meaningful - the wall is a backdrop, and PRD 6.14 is explicit that decorative
 * media gets `alt=""` rather than an invented description.
 *
 * `break-inside-avoid` is load-bearing: the wall is a column layout, and without
 * it a tile would be split down the middle across two columns.
 *
 * **The clips do not run at phone widths.** A Deviation, and the largest single
 * item in PRD section 8's budget: at 412px the wall's top edge sits 217px into
 * the first viewport, so five of its six clips start on load and cost **520 kB
 * of a 1.0 MB budget** - 45% of it, for a backdrop that renders each tile 120px
 * wide under a fade. The poster underneath is the same frame the clip opens on,
 * so the wall still reads as the Reference's; what a phone loses is the movement
 * inside tiles too small to see it in.
 *
 * `hidden` rather than a prop, and that is the mechanism rather than a shortcut:
 * an element with no layout box never intersects, so the IntersectionObserver in
 * `LoopingVideo` never fires and not one byte of video is requested. A prop
 * would have to be read on the client, after the markup had already shipped.
 */

/** The measured render width per Breakpoint, as the arithmetic that produced it. */
const SIZES = [
  '(min-width: 1200px) calc((100vw - 48px) / 4)',
  '(min-width: 810px) calc((min(100vw, 800px) - 36px) / 4)',
  'calc((min(100vw, 400px) - 16px) / 3)',
].join(', ')

export function WallTile({ tile }: { readonly tile: Tile }) {
  return (
    <div
      className="relative mb-2 break-inside-avoid overflow-hidden rounded-tile tablet:mb-3 desktop:mb-4"
      style={{ aspectRatio: tile.aspect }}
    >
      <Image
        src={tile.kind === 'video' ? (tile.poster?.src ?? tile.src) : tile.src}
        alt=""
        fill
        sizes={SIZES}
        className="object-cover"
      />
      {tile.kind === 'video' && (
        <LoopingVideo
          src={tile.src}
          className="absolute inset-0 hidden size-full object-cover tablet:block"
        />
      )}
    </div>
  )
}
