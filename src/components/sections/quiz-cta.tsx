import { ArrowRightIcon } from '@/components/icons.tsx'
import { TickerColumns, type TickerColumn } from '@/components/media/ticker-columns.tsx'
import { ScrollAppear } from '@/components/motion/scroll-appear.tsx'
import { ButtonLink } from '@/components/ui/button.tsx'
import { Eyebrow } from '@/components/ui/eyebrow.tsx'
import { getWallTiles, type WallTile } from '@/lib/content'
import { QUIZ_BLURB, QUIZ_HREF } from './quiz-copy.ts'

/*
 * The Quiz CTA (PRD 6.10), measured in #12 at 1440, 810 and 390.
 *
 * A band with nothing in it but a headline, a paragraph and a button, sitting at
 * the bottom of a tall well of travelling Template stills.
 *
 * | | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
 * | band    | 90vh, 0 40 80 | 200 20 40 | 40 20 |
 * | copy    | row, button right and bottom | as desktop | column, button full width |
 * | H2      | 56/67.2, 715 wide | 48/57.6 | 36/43.2 |
 * | body    | 16/25.6, 476 wide | 16/25.6, 476 | 14/22.4 |
 *
 * **The desktop band is `90vh`, and PRD 6.10 said 900px until #14 caught it.**
 * The fidelity harness put the Clone's band at 900 and the Reference's at 810,
 * with every band below shifted by the same 90px and no other Section out by a
 * pixel; measured again at three window heights, the Reference reads 648 at 720,
 * 810 at 900 and 1080 at 1200. 900px was a true measurement taken at one window
 * height that happened to be 1000, which is the failure mode a single reading of
 * a viewport-relative length always has.
 *
 * The copy is pinned to the band's bottom edge, so the whole well grows upwards.
 * The two narrower Breakpoints are their content plus the padding, which is
 * where the tablet's 200px of top padding comes from - it is the only room the
 * tickers get there.
 *
 * The Eyebrow here carries an 8px backdrop blur that the hero's does not (#12).
 * That is not decoration: this is the one Eyebrow on the page with a picture
 * behind it, and without the blur the pill reads as a rectangle of noise.
 *
 * The tickers are ten of the Template Wall's sixteen tiles and none of its six
 * clips, in the four columns the Reference runs them in - see
 * `ticker-columns.tsx` for why they move and the Wall does not.
 */

/*
 * Which of the Wall's tiles lands in which column, in the Reference's own order,
 * measured in #12. **Ten** of the sixteen appear and none of the six clips does;
 * `wall/tile-14` is in two of the four columns, so there are eleven placements
 * and it is named twice. Columns 1 and 3 travel up, 2 and 4 down.
 *
 * By slug rather than by index into `wall-tiles.json`: this is a selection of
 * ten from sixteen in an order of its own, which reads as a list of names and
 * does not read at all as `[8, 13, 6]`.
 */
const COLUMN_TILES = [
  { slugs: ['wall/tile-09', 'wall/tile-14', 'wall/tile-07'], direction: 'up' },
  { slugs: ['wall/tile-02', 'wall/tile-06', 'wall/tile-14'], direction: 'down' },
  { slugs: ['wall/tile-08', 'wall/tile-12', 'wall/tile-16'], direction: 'up' },
  { slugs: ['wall/tile-11', 'wall/tile-04'], direction: 'down' },
] as const satisfies readonly {
  readonly slugs: readonly string[]
  readonly direction: 'up' | 'down'
}[]

function columnsOf(tiles: readonly WallTile[]): readonly TickerColumn[] {
  const bySlug = new Map(tiles.map((tile) => [tile.slug, tile]))

  return COLUMN_TILES.map(({ slugs, direction }) => ({
    direction,
    tiles: slugs.map((slug) => {
      const tile = bySlug.get(slug)
      /* The Wall is content and could lose a tile; saying which one went beats
       * a column that quietly renders one image short. */
      if (!tile) throw new Error(`the Template Wall no longer carries "${slug}"`)
      return tile
    }),
  }))
}

export async function QuizCta() {
  const tiles = await getWallTiles()

  return (
    <section className="relative flex items-end px-5 py-10 tablet:px-5 tablet:pt-50 tablet:pb-10 desktop:h-[90vh] desktop:px-10 desktop:py-0 desktop:pb-20">
      <TickerColumns columns={columnsOf(tiles)} />

      {/*
       * Above the tickers, which follow it in the DOM and are absolute.
       *
       * Scroll-Appear sits on the card and not on the band, which is where the
       * Reference puts it: the band itself never animates, and the card rises
       * 10px rather than a Section's 30 (#13). Putting it on the band would
       * carry the ticker backdrop up with it, which the Reference does not do.
       */}
      <ScrollAppear
        as="div"
        variant="block"
        className="relative z-1 mx-auto flex w-full max-w-rail flex-col items-start gap-8 tablet:flex-row tablet:items-end tablet:gap-8"
      >
        <div className="flex flex-col items-start gap-8">
          <Eyebrow blurred>60-second quiz</Eyebrow>

          <div className="flex flex-col gap-3">
            <h2 className="text-h2-phone text-balance tablet:text-h2-tablet desktop:text-h2 desktop:w-[715px]">
              Not sure which template is for you?
            </h2>
            {/* Balanced, which is where the Reference breaks it: at 350px on
             * phone it sets three short lines rather than filling two and a
             * half, and at 476 the balanced split is the one it already has. */}
            <p className="text-body-sm text-balance tablet:w-[476px] tablet:text-body">
              {QUIZ_BLURB}
            </p>
          </div>
        </div>

        <ButtonLink
          href={QUIZ_HREF}
          className="w-full shrink-0 tablet:ml-auto tablet:w-auto"
        >
          Take the quiz
          <ArrowRightIcon />
        </ButtonLink>
      </ScrollAppear>
    </section>
  )
}
