import Image from 'next/image'
import type { Visual } from '@/lib/content'

/*
 * Step 1's visual (PRD 6.6): two columns of Template thumbnails, tilted and
 * travelling upwards behind the card's own text.
 *
 * PRD 6.6 called this "a grid of eight Template thumbnails at a flat 275px" and
 * it is not a grid. Measured in #11 off the live Reference at all three
 * Breakpoints: two 275px columns of eight 275x199 tiles, 16px apart, 28px
 * between the columns, each column rotated 16deg, drifting up at 29px/s and
 * clipped by the card. The Template Wall is the static one (6.3); this is the
 * only thing on the page that travels.
 *
 * The list is rendered twice and shifted by exactly one copy's height, so the
 * wrap is invisible. Only the first copy is in the accessibility tree: the alt
 * text names eight Templates, which is worth reading once and not twice.
 *
 * A CSS animation rather than JS, which is what lets `motion-reduce` stop it
 * outright - and the tiles are then simply eight stills at their measured tilt.
 *
 * Not named for what it looks like. CONTEXT.md rules the word "marquee" out of
 * this vocabulary because the Template Wall is a static grid that reads as one,
 * and borrowing it here would put the banned word back into the codebase for
 * the one thing it would be true of.
 */

const COLUMN = 'relative h-full w-[275px] shrink-0 rotate-[16deg]'
const TILE =
  'h-[var(--thumbnails-tile-height)] w-[275px] shrink-0 overflow-hidden rounded-visual'

export function ThumbnailColumns({ media }: { readonly media: readonly Visual[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-7 overflow-hidden">
      <Column media={media} />
      {/* The second column runs the same tiles, 816px further along - measured,
       * and a constant, since both travel at one speed. */}
      <Column media={media} style={{ animationDelay: 'var(--thumbnails-offset)' }} />
    </div>
  )
}

function Column({
  media,
  style,
}: {
  readonly media: readonly Visual[]
  readonly style?: React.CSSProperties
}) {
  return (
    <div className={COLUMN}>
      {/* The strip is hung a full cycle above the column's middle, so that one
       * copy sits above the window and one below it: the tilt means the corners
       * of the card look past the strip's ends otherwise, and at the far end of
       * the travel there would be nothing there to see. */}
      <ul
        className="absolute inset-x-0 top-[calc(50%-var(--thumbnails-cycle))] flex flex-col gap-4 [animation:thumbnails-travel_var(--thumbnails-duration)_linear_infinite] motion-reduce:[animation:none]"
        style={style}
      >
        {media.map((item) => (
          <Tile key={item.slug} visual={item} />
        ))}
        {media.map((item) => (
          <Tile key={`${item.slug}-repeat`} visual={item} repeat />
        ))}
      </ul>
    </div>
  )
}

/** One thumbnail. The repeat is the same picture with nothing left to say. */
function Tile({
  visual,
  repeat = false,
}: {
  readonly visual: Visual
  readonly repeat?: boolean
}) {
  return (
    <li className={TILE} aria-hidden={repeat || undefined}>
      <Image
        src={visual.src}
        alt={repeat ? '' : visual.alt}
        width={275}
        height={199}
        sizes="275px"
        className="size-full object-cover"
      />
    </li>
  )
}
