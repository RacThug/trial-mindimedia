import { ButtonLink } from '@/components/ui/button.tsx'
import { Eyebrow } from '@/components/ui/eyebrow.tsx'
import { TemplateCard } from '@/components/ui/template-card.tsx'
import { getTemplates } from '@/lib/content'

/*
 * The featured Templates (PRD 6.4). Measured in #10 at all three Breakpoints.
 *
 * | | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
 * | padding | 160 40 60 | 160 40 40 | 140 20 40 |
 * | H2      | 56/67.2   | 48/57.6   | 36/43.2   |
 * | H2 max  | 616       | 674       | full      |
 * | header  | row, `View all` right and bottom-aligned | as desktop | column, 36 apart, button full width |
 * | cards   | 3 across, 20 apart | 3 across, 20 apart | stacked, 20 apart |
 *
 * The heading block and the button share a row that aligns on its bottom edge,
 * not its centre: the button's baseline sits with the last line of the H2.
 */

/** Measured card widths: 387 at 1440, 230 at 810, and the full rail on phone. */
const CARD_SIZES = [
  '(min-width: 1200px) 387px',
  '(min-width: 810px) 230px',
  'calc(100vw - 40px)',
].join(', ')

export async function FeaturedTemplates() {
  const templates = await getTemplates()

  return (
    <section className="px-5 pt-35 pb-10 tablet:px-10 tablet:pt-40 desktop:pb-15">
      <div className="mx-auto flex w-full max-w-rail flex-col gap-11">
        {/* No gap between the heading block and the button: the Reference lets
         * the block run right up to it, 40..672 against a button at 672 on the
         * tablet rail. The heading's own width is what holds them apart. */}
        <div className="flex flex-col gap-9 tablet:flex-row tablet:items-end tablet:justify-between tablet:gap-0">
          <div className="flex flex-col items-start gap-8 tablet:flex-1">
            <Eyebrow>Which template is for me?</Eyebrow>
            {/* The measured width, not a max: the heading is 674 inside a 632
             * column at tablet - wider than what holds it - and a `max-w` would
             * quietly become 632 and balance against the wrong measure. Where a
             * line breaks is the visible part of this. */}
            <h2 className="text-h2-phone text-balance tablet:w-[674px] tablet:text-h2-tablet desktop:w-[616px] desktop:text-h2">
              Premium templates built to drive results.
            </h2>
          </div>

          <ButtonLink href="/templates" className="w-full tablet:w-auto">
            View all
          </ButtonLink>
        </div>

        <ul className="grid gap-5 tablet:grid-cols-3">
          {templates.map((template) => (
            <li key={template.slug}>
              <TemplateCard template={template} sizes={CARD_SIZES} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
