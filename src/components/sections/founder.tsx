import { ArrowRightIcon } from '@/components/icons.tsx'
import { CardVisual } from '@/components/media/card-visual.tsx'
import { ButtonLink } from '@/components/ui/button.tsx'
import { SectionBand } from '@/components/ui/section-band.tsx'
import { getStats, resolveVisual, type Stat } from '@/lib/content'

/*
 * The founder (PRD 6.11), measured in #12 at 1440, 810 and 390.
 *
 * One framed block - 1px `--color-surface-3` at a 16px radius, like 6.5 to 6.9 -
 * holding a looping clip, a badge, five paragraphs and four stat tiles.
 *
 * | | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
 * | band  | 20 40 60 | 20 40 40 | 40 20 |
 * | frame | 1120, clip left 560, copy right 560 | 100vw - 40, clip 461 tall above | 100vw - 24, clip 217 tall above |
 * | gap   | 0, the two are columns | 32 | 24 |
 * | H3    | 44/57.2 | 36/46.8 | 28/36.4 |
 * | stat  | 32/41.6 | **36/46.8** | 32/41.6 |
 *
 * Two of those are worth reading twice.
 *
 * **The frame is not the rail.** At desktop it is 1120 inside a 1200 rail, and
 * at both narrower Breakpoints it is *wider* than the rail it sits in - 770 in a
 * 730 at tablet, 366 in a 350 on phone. Measured at all three; a `max-w-rail`
 * here would be right at none of them.
 *
 * **The stat's number is larger at tablet than at desktop**, 36 against 32,
 * which is the sort of step that gets "corrected" into a monotonic scale. It is
 * measured twice over - off the computed style, and off a 164.39px cell that
 * only adds up with a 46.8px line in it.
 *
 * The stat tiles divide themselves with their own edges rather than sitting
 * apart, the way every framed grid on this page does: the block carries a top
 * rule and each cell carries the edges it needs, so the 2x2 has one cross in it
 * and nothing doubled.
 *
 * The clip is single-use media in a single layout, so no Collection carries it
 * and its text alternative is written here (ADR-0004). The four stats are a
 * Collection: they are four of the same thing with a slug each, and their values
 * stay strings - `$100k+` is a marketing figure, not a price.
 *
 * Character-level detail, and the Reference's own: the H3 says `Hey, I'm Ramish`
 * with a **straight** apostrophe and the fourth paragraph says `I'm sharing`
 * with a **curly** one, in the same block. Do not let a formatter unify them.
 */

const VIDEO_SIZES = '(min-width: 1200px) 560px, 100vw'

const CLIP = resolveVisual('story/founder', 'Ramish talking to camera at his desk')

export async function Founder() {
  const stats = await getStats()

  return (
    <SectionBand
      eyebrow="Who is the designer?"
      heading="Meet the creator behind the sites."
      headingWidth="tablet:w-[674px] desktop:w-[718px]"
      padding="px-5 py-10 tablet:px-10 tablet:pt-5 desktop:pb-15"
      action={
        <ButtonLink
          href="https://cal.com/ramish-design/mentoring"
          className="w-full shrink-0 tablet:w-auto"
        >
          Book a coaching call with me
          <ArrowRightIcon />
        </ButtonLink>
      }
    >
      {/* Wider than the rail at the two narrow Breakpoints and narrower at
       * desktop, so the width is set at each rather than inherited. */}
      <div className="mx-auto flex w-[calc(100vw-24px)] flex-col gap-6 overflow-clip rounded-frame rule-ring tablet:w-[calc(100vw-40px)] tablet:gap-8 desktop:w-[1120px] desktop:flex-row desktop:gap-0">
        <CardVisual
          visual={CLIP}
          sizes={VIDEO_SIZES}
          className="relative h-[217px] w-full shrink-0 tablet:h-[461px] desktop:h-auto desktop:w-[560px]"
        />

        <div className="flex flex-col justify-center desktop:flex-1">
          <div className="flex flex-col items-start gap-8 p-8">
            <p className="rounded-eyebrow bg-[image:var(--badge-surface-orange)] px-3 py-1 text-eyebrow text-accent-orange uppercase">
              Founder
            </p>

            <div className="flex flex-col gap-3">
              <h3 className="text-h3-phone tablet:text-h3-tablet desktop:text-h3">
                Hey, I&#39;m Ramish
                <br />
                Designer &amp; Creator
              </h3>

              <p className="text-body-sm text-text-muted tablet:text-body">
                When I started my business, I realized speed was everything. Getting a
                website live meant getting customers through the door.
              </p>
              <p className="text-body-sm text-text-muted tablet:text-body">
                Luckily, I knew how to design and build sites, so what could have taken
                weeks only took me hours.
              </p>
              <p className="text-body-sm text-text-muted tablet:text-body">
                That first week, I had my website live, and sales rolling in.
              </p>
              <p className="text-body-sm text-text-muted tablet:text-body">
                Now, I&#8217;m sharing my unfair advantage with other creative
                entrepreneurs so they can do the same.
              </p>
              <p className="text-body-sm text-text-muted tablet:text-body">
                Launch faster without the cost or complexity.
              </p>
            </div>
          </div>

          <StatTiles stats={stats} />
        </div>
      </div>
    </SectionBand>
  )
}

/**
 * The 2x2, whose rules are per cell: the first carries a right and a bottom
 * edge, the second a bottom, the third a right, and the fourth none - which
 * draws the cross once. The block's own top rule parts it from the prose.
 */
const CELL_RULES = ['rule-rb', 'rule-b', 'rule-r', ''] as const

function StatTiles({ stats }: { readonly stats: readonly Stat[] }) {
  return (
    <dl className="grid grid-cols-2 rule-t">
      {stats.map((stat, index) => (
        <div
          key={stat.slug}
          className={`flex flex-col-reverse items-center gap-3 py-10 ${CELL_RULES[index] ?? ''}`}
        >
          {/* Reversed in CSS rather than in the markup: the number sits above
           * its label, and a `<dd>` before its `<dt>` is not a description
           * list. The tablet step is `--text-h3-tablet` because 36/46.8 is the
           * same measurement - a `--text-stat-tablet` holding it again is a
           * second name that drifts (see `globals.css`). */}
          <dt className="text-body-sm text-text-muted tablet:text-body">{stat.label}</dt>
          <dd className="text-h4 tablet:text-h3-tablet desktop:text-h4">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}
