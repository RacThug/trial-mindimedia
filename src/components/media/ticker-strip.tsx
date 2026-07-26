import Image from 'next/image'

/*
 * One travelling column of stills, and the only thing the Quiz CTA's backdrop
 * (PRD 6.10) and the quiz modal's (6.13) have in common.
 *
 * The two look nothing alike - four upright columns of tiles at their own aspect
 * against two tilted columns of cropped screenshots - but the mechanism under
 * both is identical, and it is the part that is easy to get subtly wrong:
 *
 * - The list is rendered **twice** and translated by exactly half its own
 *   height, so one turn lands on itself with no pixel arithmetic and the wrap
 *   holds at every Breakpoint.
 * - The gaps are **margins, not `gap`**. With `gap` the doubled strip is one gap
 *   short of twice a copy, and the seam drifts by half a gap every cycle.
 * - The two directions are one keyframe run forwards and backwards, so they
 *   cannot drift apart in speed.
 *
 * A CSS animation rather than JS, which is what lets `motion-reduce` stop it
 * outright - and the columns are then simply a still arrangement of tiles.
 *
 * **The duration is anchored to desktop.** Both callers derive it from the width
 * their column is measured at, so the measured px/s holds there; at a narrower
 * Breakpoint the strip is shorter and the same duration carries it more slowly.
 * That is deliberate - the motion stays proportional to what is on screen - but
 * it does mean 29.1px/s is a desktop number rather than a constant.
 *
 * Not named for what it looks like. CONTEXT.md rules the word "marquee" out of
 * this vocabulary because the Template Wall is a static grid that reads as one.
 */

export type TickerDirection = 'up' | 'down'

/**
 * The least a tile has to be to travel in one of these.
 *
 * Deliberately not `Asset`: the Quiz CTA's tiles come from the content layer and
 * the modal's from the asset index directly, because no Collection carries a
 * decorative backdrop that appears once (ADR-0004). Both are structurally this,
 * and asking for less than `Asset` is what lets one component serve both.
 */
export type TickerTile = {
  readonly src: string
  readonly width: number
  readonly height: number
}

type TickerStripProps = {
  /** One copy. Rendered twice; the caller decides how long a copy is. */
  readonly tiles: readonly TickerTile[]
  readonly direction: TickerDirection
  /** One turn of the doubled strip, e.g. `27.78s`. */
  readonly duration: string
  /** The margin that stands in for the gap, e.g. `mb-2 tablet:mb-4`. */
  readonly gap: string
  /** The box each tile is drawn in: a fixed size, or nothing for its aspect. */
  readonly tile?: string
  /** `next/image`'s measured render widths. */
  readonly sizes: string
  /** Radius: 4px on the Quiz CTA's tiles, 5px on the modal's. Both measured. */
  readonly radius: string
}

const TRAVEL =
  'absolute inset-x-0 top-0 [animation-name:ticker-travel] [animation-timing-function:linear] ' +
  '[animation-iteration-count:infinite] motion-reduce:[animation-name:none]'

export function TickerStrip({
  tiles,
  direction,
  duration,
  gap,
  tile = '',
  sizes,
  radius,
}: TickerStripProps) {
  return (
    <ul
      className={TRAVEL}
      style={{
        animationDuration: duration,
        animationDirection: direction === 'up' ? 'normal' : 'reverse',
      }}
    >
      {[...tiles, ...tiles].map((asset, index) => (
        /* Keyed by source *and* position: a caller may repeat its tiles inside
         * one copy to fill a tall band, so the asset alone is not unique here
         * the way it is in `thumbnail-column.tsx`. Nothing in these lists ever
         * reorders, so the position is stable.
         *
         * The aspect is set unless the caller fixes the box, because a strip of
         * tiles that reflows as they load would spend the CLS budget twice over
         * (PRD section 8) - the modal's are cropped to a measured box instead. */
        <li
          key={`${asset.src}-${index}`}
          className={`overflow-hidden ${gap} ${radius} ${tile}`}
          style={tile ? undefined : { aspectRatio: asset.width / asset.height }}
        >
          <Image
            src={asset.src}
            alt=""
            width={asset.width}
            height={asset.height}
            sizes={sizes}
            className="size-full object-cover"
          />
        </li>
      ))}
    </ul>
  )
}
