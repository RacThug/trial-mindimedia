import Image from 'next/image'
import type { Asset } from '@/lib/content'

/*
 * The Quiz CTA's backdrop (PRD 6.10): columns of Template stills travelling in
 * alternate directions behind the copy.
 *
 * **This one really does move**, and it is the exception that the Template Wall
 * (6.3) is not. PRD 6.10 called it "a dimmed Template Wall backdrop" and section
 * 5 called it "the same 10 images, without the videos" - the images are indeed
 * eleven of the Wall's sixteen and none of its six clips, but they are arranged
 * into four columns that travel, measured in #12 at 29.1px/s with columns 1 and
 * 3 going up and 2 and 4 going down. Sampled twice, two seconds apart, with the
 * band in view; both PRD sections are corrected to match.
 *
 * | | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
 * | columns | 4 | 3 | 3 |
 * | width   | (100vw - 48) / 4 | (100vw - 48) / 3 | 239 |
 * | gap     | 16 | 16 | 8 |
 *
 * The dimming is the mask rather than an opacity: two gradients composited
 * `intersect, add`, which peaks at about 44% alpha a little past the middle of
 * the band and reaches zero at both ends. That is the whole reason the tiles sit
 * behind readable copy without a scrim over them.
 *
 * Each column's list is repeated until one copy clears the tallest band, then
 * rendered twice and translated by exactly half its own height - so the wrap
 * needs no pixel arithmetic and holds at every Breakpoint. The gaps are margins
 * rather than a `gap` for that reason alone: with `gap` the doubled strip is one
 * gap short of twice a copy, and the seam drifts by half of it every cycle.
 *
 * Under `prefers-reduced-motion` the columns stand still, which is what the
 * Reference should have done.
 */

/** One column: the tiles it runs, and which way it goes. */
export type TickerColumn = {
  readonly tiles: readonly Asset[]
  readonly direction: 'up' | 'down'
}

/** Measured: the desktop column, its gap, and the speed every column travels. */
const DESKTOP_COLUMN = 348
const DESKTOP_GAP = 16
const PIXELS_PER_SECOND = 29.14
/** The tallest the band gets (desktop, PRD 6.10), so one copy always covers it. */
const BAND_HEIGHT = 900

/*
 * Phone is the one width the columns are not a share of the viewport: three
 * 239px columns come to 733 in a 390 rail, so the row overflows and is clipped,
 * which is measured and is what keeps the tiles the same size a phone shows
 * everywhere else on the page.
 */
const COLUMN =
  'relative h-full w-[239px] shrink-0 overflow-hidden tablet:w-[calc((100vw-48px)/3)] desktop:w-[calc((100vw-48px)/4)]'

/** Split out so `motion-reduce` has one name to switch off. */
const TRAVEL =
  'absolute inset-x-0 top-0 [animation-name:ticker-travel] [animation-timing-function:linear] ' +
  '[animation-iteration-count:infinite] motion-reduce:[animation-name:none]'

/**
 * How many times a column's tiles repeat before the strip is doubled, and how
 * long one turn of the doubled strip takes at the measured speed.
 *
 * Both fall out of the assets' own aspect ratios at the desktop column width, so
 * a tile swapped in `wall-tiles.json` re-times its column instead of drifting
 * away from a number typed here.
 */
function timing(tiles: readonly Asset[]): { repeats: number; duration: string } {
  const cycle = tiles.reduce(
    (total, tile) => total + DESKTOP_COLUMN / tile.aspect + DESKTOP_GAP,
    0,
  )
  const repeats = Math.max(1, Math.ceil(BAND_HEIGHT / cycle))
  return { repeats, duration: `${((cycle * repeats) / PIXELS_PER_SECOND).toFixed(2)}s` }
}

export function TickerColumns({
  columns,
}: {
  readonly columns: readonly TickerColumn[]
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex justify-center gap-2 overflow-hidden tablet:gap-4"
      style={{
        maskImage:
          'linear-gradient(#000000 53%, rgba(0, 0, 0, 0) 100%), linear-gradient(rgba(0, 0, 0, 0) 0%, #000000 121%)',
        maskComposite: 'intersect, add',
        WebkitMaskImage:
          'linear-gradient(#000000 53%, rgba(0, 0, 0, 0) 100%), linear-gradient(rgba(0, 0, 0, 0) 0%, #000000 121%)',
        WebkitMaskComposite: 'intersect, add',
      }}
    >
      {columns.map((column, index) => (
        <Column
          key={index}
          column={column}
          /* The fourth column only exists at desktop: three across at both
           * narrower Breakpoints, measured. */
          className={index === 3 ? 'hidden desktop:block' : ''}
        />
      ))}
    </div>
  )
}

function Column({
  column,
  className,
}: {
  readonly column: TickerColumn
  readonly className: string
}) {
  const { repeats, duration } = timing(column.tiles)
  const copy = Array.from({ length: repeats }, () => column.tiles).flat()

  return (
    <div className={`${COLUMN} ${className}`}>
      <ul
        className={TRAVEL}
        style={{
          animationDuration: duration,
          /* One keyframe, run backwards for the columns that rise the other
           * way - so the two directions cannot drift apart in speed. */
          animationDirection: column.direction === 'up' ? 'normal' : 'reverse',
        }}
      >
        {[...copy, ...copy].map((tile, index) => (
          <li
            key={index}
            /* The gap as a margin, so the doubled strip is exactly twice a copy
             * and `-50%` lands on itself. See the note above. */
            className="mb-2 overflow-hidden rounded-tile tablet:mb-4"
            style={{ aspectRatio: tile.aspect }}
          >
            <Image
              src={tile.src}
              alt=""
              width={tile.width}
              height={tile.height}
              sizes="(min-width: 1200px) 25vw, 33vw"
              className="size-full object-cover"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
