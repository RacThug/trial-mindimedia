import { WallTile } from '@/components/media/wall-tile.tsx'
import { getTestimonials, getWallTiles } from '@/lib/content'
import { WallTestimonials } from './wall-testimonials.tsx'

/*
 * The Template Wall (PRD 6.3): a dense grid of stills and looping clips, with
 * Testimonials floating over its bottom edge.
 *
 * **It is a static grid and must not be built as a marquee.** Verified twice on
 * the Reference - 50 tiles tracked for 3 seconds at a fixed scroll position, 0
 * moved - and it is the single most likely fidelity mistake on this page. The
 * motion a visitor perceives is the clips playing inside stationary tiles.
 *
 * Measured in #10, per Breakpoint:
 *
 * | | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
 * | width   | full     | 800 centred | 400 centred |
 * | columns | 4 x 348  | 4 x 191     | 3 x 125     |
 * | gap     | 16       | 12          | 8           |
 *
 * It is a **column layout**, not a grid of rows: tiles keep their own aspect
 * ratios and stack, which is why `columns` rather than `grid-template-columns`.
 * The Reference hand-splits its sixteen tiles into four column elements, one
 * per Breakpoint, and its desktop and tablet splits are exactly what a balanced
 * fill produces - tiles 1-4, 5-8, 9-12, 13-16, each column landing within a few
 * pixels of the same height. So the split is left to the browser and the DOM
 * stays one flat list, which is the only shape that can serve three Breakpoints
 * without shipping the media three times.
 *
 * Phone is the Deviation: the Reference arranges its three columns by hand into
 * a taller wall than a balanced fill gives, so the height is set (see
 * `--wall-height-phone`) and the columns fill into it. Which tile lands in which
 * column differs from the Reference there; the wall reads the same, and the
 * bottom half where the difference shows is under `--wall-fade` anyway.
 */
export async function TemplateWall() {
  const [tiles, testimonials] = await Promise.all([getWallTiles(), getTestimonials()])

  return (
    <section className="relative">
      {/* Decorative in full: sixteen backdrop tiles carrying no alt text by
       * design (PRD 6.14), so the whole wall is one thing to skip. */}
      <div
        aria-hidden="true"
        className="mx-auto h-[var(--wall-height-phone)] max-w-[var(--wall-width-phone)] columns-3 gap-2 [column-fill:auto] [-webkit-mask-image:var(--wall-fade)] [mask-image:var(--wall-fade)] tablet:h-auto tablet:max-w-200 tablet:columns-4 tablet:gap-3 tablet:[column-fill:balance] desktop:max-w-none desktop:gap-4"
      >
        {tiles.map((tile) => (
          <WallTile key={tile.slug} tile={tile} />
        ))}
      </div>

      <ProgressiveBlur />
      <WallTestimonials items={testimonials.wall} />
    </section>
  )
}

/*
 * The band that blurs the bottom of the wall out from under the quote.
 *
 * Eight layers, each blurring twice as hard as the one before through a window
 * that slides an eighth of the band upwards - Framer's progressive blur, and
 * the radii and mask stops are its own, read off the Reference in #10. One
 * layer at 52px would smear the whole band evenly; stacking them is what makes
 * the tiles go soft gradually rather than at a line.
 */
const BLUR_LAYERS = [0.40625, 0.8125, 1.625, 3.25, 6.5, 13, 26, 52]

/**
 * One layer's window: opaque from `from + 12.5%` to `from + 25%` of the band,
 * measured down from its top, fading either side. The last layers lose the
 * stops that would fall outside the band.
 *
 * The Reference writes these `to top` and then flips the whole stack with a
 * `matrix(-1, 0, 0, -1, 0, 0)` on the container, which is the same thing said
 * twice: read off the page as-is, its heaviest blur appears to sit at the top
 * of the band, and it is the rotation that puts it at the bottom where the
 * quote needs it. Reproducing the rotation would only invite the next reader to
 * make the same mistake, so the direction is reversed here instead.
 */
function maskWindow(from: number): string {
  const stops: readonly (readonly [number, string])[] = [
    [from, 'rgba(0, 0, 0, 0)'],
    [from + 12.5, '#000000'],
    [from + 25, '#000000'],
    [from + 37.5, 'rgba(0, 0, 0, 0)'],
  ]
  const within = stops
    .filter(([at]) => at <= 100)
    .map(([at, colour]) => `${colour} ${at}%`)
    .join(', ')

  return `linear-gradient(to bottom, ${within})`
}

function ProgressiveBlur() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-[calc(-1*var(--wall-blur-offset))] h-[var(--wall-blur-height)]"
    >
      {BLUR_LAYERS.map((radius, index) => {
        const from = index * 12.5
        const mask = maskWindow(from)

        /* No z-index on the layers, deliberately. They stack in DOM order as
         * they are, and a stacking context here would cut each layer off from
         * the tiles it is supposed to be blurring. */
        return (
          <div
            key={radius}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${radius}px)`,
              WebkitBackdropFilter: `blur(${radius}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        )
      })}
    </div>
  )
}
