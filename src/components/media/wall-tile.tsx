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
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </div>
  )
}
