import { CardVisual } from '@/components/media/card-visual.tsx'
import { SectionBand } from '@/components/ui/section-band.tsx'
import { getFeatures, type Feature } from '@/lib/content'

/*
 * The feature bento (PRD 6.5), measured in #11 at 1440, 810 and 390.
 *
 * Five cards in one framed block - a single 1px `--color-surface-3` outline with
 * a 16px radius, and cells that divide themselves with their own edges rather
 * than sitting apart. There is no gap at desktop or tablet; on phone the block
 * becomes a column with 16px between cards, and the dividing lines stay, so a
 * hairline sits at the top of each gap. That is the Reference's own look.
 *
 * | | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
 * | row 1  | 752 + 448, 542 tall | 365 + 365, 340 tall | stacked, 346 and 332 |
 * | row 2  | (576: 268+268) + 624, 536 tall | (341: 268+268) + 389, 536 | stacked, 285, 285, 352 |
 *
 * Three card shapes, and which card gets which is layout rather than content:
 *
 * - **framed** (responsive): the visual on top in a 704x406 box with its own
 *   8px radius and outline, the title under it.
 * - **bleed** (tutorials, hosting): the clip fills the card edge to edge and the
 *   title sits over its bottom-left corner.
 * - **clipped** (SEO, CMS): the title on top, then the still at its own
 *   intrinsic aspect - taller than the card, and cut off by it. The overflow is
 *   the point, so the height is set and the image is not allowed to shrink.
 *
 * Row heights are set at the two wider Breakpoints and the contents are centred
 * inside them, which is why the tablet row 1 crops a few pixels off the framed
 * card: 183 + 16 + 108 of content in 292 of room. Measured, not a mistake.
 *
 * Two of the five titles carry a measure of their own at desktop - 427 on the
 * framed card and 314 on hosting, against the 704 and 576 their cards give them.
 * Both sentences fit on one line in the room available and the Reference sets
 * them over two anyway, the same way it sets an explicit width on every H2. The
 * measure is what puts the break where the Reference has it.
 *
 * Card titles are `text-feature`, the page's second 24px step - 24/36 here
 * against the 24/33.6 a step card and a Testimonial use (see `globals.css`).
 */

/** Measured render widths per Breakpoint, per card. */
const SIZES = {
  responsive: '(min-width: 1200px) 704px, (min-width: 810px) 317px, calc(100vw - 88px)',
  tutorials: '(min-width: 1200px) 448px, (min-width: 810px) 365px, calc(100vw - 40px)',
  panel: '(min-width: 1200px) 528px, (min-width: 810px) 293px, calc(100vw - 88px)',
  hosting: '(min-width: 1200px) 624px, (min-width: 810px) 389px, calc(100vw - 40px)',
}

/*
 * `--text-feature` is the bento's own 24px step, and it is the one heading on
 * the page that stays at 400: every other - including the step titles beside it
 * at the same size - is the variable face at 450 (measured in #11, and carried
 * by the step itself, see `globals.css`).
 */
const TITLE = 'relative text-feature text-balance'

export async function FeatureBento() {
  const features = await getFeatures()
  const feature = (slug: string) => bySlug(features, slug)

  return (
    <SectionBand
      eyebrow="Why choose a template?"
      heading="Everything you need to launch. All in one place, not a stack."
      headingWidth="desktop:w-[896px]"
    >
      <div className="flex flex-col gap-4 overflow-clip rounded-frame rule-ring tablet:gap-0">
        <div className="flex flex-col gap-4 rule-b tablet:grid tablet:grid-cols-2 tablet:gap-0 desktop:grid-cols-[752fr_448fr]">
          <FramedCard feature={feature('responsive')} />
          <BleedCard
            feature={feature('tutorials')}
            sizes={SIZES.tutorials}
            className="h-[332px] tablet:h-auto"
            fade="visual-fade-tutorials"
          />
        </div>

        <div className="flex flex-col gap-4 tablet:grid tablet:h-[536px] tablet:grid-cols-[341fr_389fr] tablet:gap-0 desktop:grid-cols-[576fr_624fr]">
          <div className="flex flex-col tablet:rule-r">
            <ClippedCard
              feature={feature('seo')}
              className="rule-b"
              fade="visual-fade-seo"
            />
            <ClippedCard
              feature={feature('cms')}
              className="rule-b tablet:rule-none"
              fade="visual-fade-cms"
            />
          </div>

          <BleedCard
            feature={feature('hosting')}
            sizes={SIZES.hosting}
            className="h-[352px] tablet:h-auto"
            titleWidth="desktop:max-w-[314px]"
            fade="visual-fade-hosting"
          />
        </div>
      </div>
    </SectionBand>
  )
}

/**
 * The layout names each card, so a missing one is a broken layout rather than a
 * hole in the page - and saying which beats rendering four cards and a gap.
 */
function bySlug(features: readonly Feature[], slug: string): Feature {
  const found = features.find((feature) => feature.slug === slug)
  if (!found) throw new Error(`the feature bento has no "${slug}" feature`)
  return found
}

/** Visual over title, both inside the padding. */
function FramedCard({ feature }: { readonly feature: Feature }) {
  return (
    <div className="flex flex-col justify-center gap-4 overflow-clip p-6 rule-b tablet:h-[340px] tablet:rule-r desktop:h-[542px]">
      {/* The fade takes the card's own 1px edge with it, which is the
       * Reference's own behaviour: there the edge is a `::after` inside the
       * masked box, and here it is an inset shadow on it - either way the
       * bottom corners soften away rather than outlining a clip that has
       * stopped being drawn. */}
      <CardVisual
        visual={feature.media}
        sizes={SIZES.responsive}
        className="relative aspect-[704/406] w-full shrink-0 rounded-visual rule-ring visual-fade-framed"
      />
      <h3 className={`${TITLE} desktop:max-w-[427px]`}>{feature.title}</h3>
    </div>
  )
}

/** Clip edge to edge, title over its bottom-left corner. */
function BleedCard({
  feature,
  sizes,
  className,
  fade,
  titleWidth = '',
}: {
  readonly feature: Feature
  readonly sizes: string
  readonly className: string
  /** The card's measured `visual-fade-*` utility (#30). */
  readonly fade: string
  readonly titleWidth?: string
}) {
  return (
    <div className={`relative flex flex-col justify-end overflow-clip ${className}`}>
      {/* The padding is on the title rather than on the card, so that `inset-0`
       * is the card's own edge: an absolutely positioned box is placed against
       * its ancestor's padding box, and a padded card would crop and rescale
       * the clip by 24px on every side.
       *
       * The fade is what makes the title readable. Both these clips are lit
       * scenes and the title sits across the bottom of one, so the clip is
       * masked out from 35% of the card's height down and the black page shows
       * through - which is the Reference's own answer, and better than a scrim
       * because there is nothing to see the edge of. */}
      <CardVisual
        visual={feature.media}
        sizes={sizes}
        className={`absolute inset-0 ${fade}`}
      />
      <div className="relative p-6">
        <h3 className={`${TITLE} ${titleWidth}`}>{withEmphasis(feature.title)}</h3>
      </div>
    </div>
  )
}

/** Title on top, the still below it and cut off by the card's own edge. */
function ClippedCard({
  feature,
  className,
  fade,
}: {
  readonly feature: Feature
  readonly className: string
  /** The card's measured `visual-fade-*` utility (#30). */
  readonly fade: string
}) {
  return (
    <div
      className={`flex h-[285px] flex-col gap-6 overflow-clip p-6 tablet:h-[268px] ${className}`}
    >
      <h3 className={TITLE}>{feature.title}</h3>
      {/* These two fade fastest of the six - out by 29% of the still on the SEO
       * card and by 52% on the CMS one - because the fade is measured against
       * the whole still and the card only ever shows its top. The screenshot
       * stops being drawn a little above the card's own edge, so what reads as
       * the card cutting the picture off is the picture going out. */}
      <CardVisual
        visual={feature.media}
        sizes={SIZES.panel}
        className={`relative w-full shrink-0 rounded-visual rule-ring ${fade}`}
        style={{ aspectRatio: feature.media.aspect }}
      />
    </div>
  )
}

/*
 * The one place markup has to know something about the copy: the Reference sets
 * `real` in an `<em>` inside feature 2's title, and the content file stores the
 * plain sentence (ADR-0004 - inline emphasis is not a field). The Reference also
 * resets the italic, so the emphasis is semantic and invisible, which is exactly
 * how it is reproduced here.
 */
function withEmphasis(title: string): React.ReactNode {
  const [before, after] = title.split(' real ')
  if (after === undefined) return title

  return (
    <>
      {before} <em className="not-italic">real</em> {after}
    </>
  )
}
