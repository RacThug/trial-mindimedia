import Image from 'next/image'
import type { Visual } from '@/lib/content'
import { LoopingVideo } from './looping-video.tsx'

/*
 * A visual that means something, drawn the way the Template Wall draws a tile:
 * a real `next/image` underneath, and - when the asset is a clip - a deferred
 * `<video>` over it that starts only once it is on screen.
 *
 * The difference from `wall-tile.tsx` is the text alternative. A wall tile is
 * backdrop and renders `alt=""` by design; these carry authored alt text from
 * the content layer (PRD 6.14), so the image below is the accessible one and the
 * clip above stays `aria-hidden` - a visitor who never sees a frame of video
 * still gets the poster and its description.
 *
 * `preload="none"` is what keeps five feature clips, two step clips and the case
 * study's out of the initial load (PRD section 8): none of them is above the
 * fold, and the Reference autoplays every one of them at `preload="auto"`.
 */

type CardVisualProps = {
  readonly visual: Visual
  /** The measured render width per Breakpoint, for `next/image`. */
  readonly sizes: string
  /**
   * Must place the box AND position it - `relative`, or `absolute` with insets
   * for a visual that bleeds past its card's padding. `next/image`'s `fill`
   * needs a positioned ancestor, and a `relative` baked in here would quietly
   * win over an `absolute` passed in: same specificity, and Tailwind emits
   * `.relative` after `.absolute`, so the box would collapse to nothing.
   */
  readonly className: string
  /** For the one caller that draws the box at the asset's intrinsic aspect. */
  readonly style?: React.CSSProperties
}

export function CardVisual({ visual, sizes, className, style }: CardVisualProps) {
  const still = visual.kind === 'video' ? (visual.poster?.src ?? visual.src) : visual.src

  return (
    <div className={`overflow-hidden ${className}`} style={style}>
      <Image src={still} alt={visual.alt} fill sizes={sizes} className="object-cover" />
      {visual.kind === 'video' && (
        <LoopingVideo
          src={visual.src}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </div>
  )
}
