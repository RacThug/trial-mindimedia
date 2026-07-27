import { ScrollAppear } from '@/components/motion/scroll-appear.tsx'
import { Eyebrow } from './eyebrow.tsx'

/*
 * The band the middle Sections share: full-width, its own padding, one rail,
 * and a header of [Eyebrow, H2] with an optional button opposite (PRD 6.5-6.8).
 *
 * Measured in #11 on the feature bento, how it works and the social proof grid,
 * and identical on all three:
 *
 * | | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
 * | padding | 60 40 | 40 | 40 20 |
 * | rail    | 1200  | 730 | 350 |
 * | rail gap| 44    | 44  | 36  |
 * | header  | row, action right and bottom-aligned | as desktop when there is an action, else a column | column, action full width |
 * | eyebrow gap | 32 | 32 | 32 |
 *
 * The featured Templates (6.4) deliberately do NOT use this. Its band is
 * `160 40 60`, not `60 40`, and its header stays a row at tablet whether or not
 * anything sits opposite - both measured in #10. Folding it in here would mean
 * one component with two of everything, which is how a measured number becomes a
 * default that the next Section quietly inherits.
 *
 * The heading's width is a prop because it is measured per Section rather than
 * derived: 896, 747 and 718 at desktop for the three, and 368 at tablet for the
 * one that shares its row with a button. It is a width and not a max-width for
 * the reason 6.4 records - a `max-w` collapses to whatever holds it, and where a
 * line breaks is the visible part of this.
 */

/**
 * The band's own padding, measured per Section: `60 40` on 6.5-6.8.
 *
 * A prop rather than a variant name, for the reason the note above gives - what
 * differs between these Sections is a padding and nothing else, and pricing
 * (6.9) and the founder (6.11) each measure their own. Naming them `pricing` and
 * `founder` here would put three Sections' measurements in one file and leave
 * the next one to pick which it resembles.
 */
const DEFAULT_PADDING = 'px-5 py-10 tablet:px-10 desktop:py-15'

type SectionBandProps = {
  /** Sentence case; the Eyebrow uppercases it in CSS (PRD 6.2). */
  readonly eyebrow: string
  readonly heading: string
  /** The measured `w-[...]` steps for this Section's H2. */
  readonly headingWidth?: string
  /** This Section's measured band padding, where it is not 6.5-6.8's. */
  readonly padding?: string
  /** The button that shares the header's row, bottom-aligned (6.7 has one). */
  readonly action?: React.ReactNode
  readonly children: React.ReactNode
}

export function SectionBand({
  eyebrow,
  heading,
  headingWidth = '',
  padding = DEFAULT_PADDING,
  action,
  children,
}: SectionBandProps) {
  return (
    <ScrollAppear className={padding}>
      <div className="mx-auto flex w-full max-w-rail flex-col gap-9 tablet:gap-11">
        <div
          className={
            'flex flex-col gap-9 ' +
            (action
              ? 'tablet:flex-row tablet:items-end tablet:justify-between tablet:gap-0'
              : '')
          }
        >
          <div className="flex flex-col items-start gap-8">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2
              className={`text-h2-phone text-balance tablet:text-h2-tablet desktop:text-h2 ${headingWidth}`}
            >
              {heading}
            </h2>
          </div>

          {action}
        </div>

        {children}
      </div>
    </ScrollAppear>
  )
}
