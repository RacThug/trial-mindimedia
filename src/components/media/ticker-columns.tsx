import type { Asset } from '@/lib/content'
import { TickerStrip, type TickerDirection } from './ticker-strip.tsx'

/*
 * The Quiz CTA's backdrop (PRD 6.10): columns of Template stills travelling in
 * alternate directions behind the copy.
 *
 * **This one really does move**, and it is the exception that the Template Wall
 * (6.3) is not. PRD 6.10 called it "a dimmed Template Wall backdrop" and section
 * 5 called it "the same 10 images, without the videos" - the images are indeed
 * ten of the Wall's sixteen and none of its six clips, one of them placed twice
 * for eleven placements over four columns, but those columns travel: measured in
 * #12 at 29.1px/s with columns 1 and 3 going up and 2 and 4 going down. Sampled
 * twice, two seconds apart, with the band in view; PRD 6.10 records it.
 *
 * | | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
 * | columns | 4 | 3 | 3 |
 * | width   | (100vw - 48) / 4 | (100vw - 48) / 3 | 239 |
 * | gap     | 16 | 16 | 8 |
 *
 * The dimming is a mask rather than an opacity - see `--quiz-ticker-mask` - and
 * it is what lets the tiles sit behind readable copy with no scrim over them.
 *
 * `ticker-strip.tsx` owns the travel itself, including why the gaps are margins
 * and why the measured speed is a desktop number.
 */

/** One column: the tiles it runs, and which way it goes. */
export type TickerColumn = {
  readonly tiles: readonly Asset[]
  readonly direction: TickerDirection
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
 * which is measured and is what keeps the tiles the size a phone shows
 * everywhere else on the page.
 */
const COLUMN =
  'relative h-full w-[239px] shrink-0 overflow-hidden tablet:w-[calc((100vw-48px)/3)] desktop:w-[calc((100vw-48px)/4)]'

/** The measured render width per Breakpoint: a quarter of the rail, then a third. */
const TILE_SIZES = '(min-width: 1200px) 25vw, 33vw'

/**
 * How many times a column's tiles repeat before the strip is doubled, and how
 * long one turn of the doubled strip takes at the measured speed.
 *
 * Both fall out of the assets' own aspect ratios at the desktop column width, so
 * a tile swapped in `wall-tiles.json` re-times its column instead of drifting
 * away from a number typed here. The repeat exists because the shortest column
 * is 623px of tiles against a 900px band, and half a doubled strip has to cover
 * the band or the seam shows.
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
      className="pointer-events-none absolute inset-0 flex justify-center gap-2 overflow-hidden quiz-ticker-mask tablet:gap-4"
    >
      {columns.map((column, index) => {
        const { repeats, duration } = timing(column.tiles)

        return (
          <div
            key={index}
            /* The fourth column only exists at desktop: three across at both
             * narrower Breakpoints, measured. */
            className={`${COLUMN} ${index === 3 ? 'hidden desktop:block' : ''}`}
          >
            <TickerStrip
              tiles={Array.from({ length: repeats }, () => column.tiles).flat()}
              direction={column.direction}
              duration={duration}
              gap="mb-2 tablet:mb-4"
              sizes={TILE_SIZES}
              radius="rounded-tile"
            />
          </div>
        )
      })}
    </div>
  )
}
