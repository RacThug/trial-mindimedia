import { SectionBand } from '@/components/ui/section-band.tsx'
import { getPlans } from '@/lib/content'
import { PlanCard } from './plan-card.tsx'

/*
 * Pricing (PRD 6.9), measured in #12 at 1440, 810 and 390.
 *
 * Three Plans in one framed block, the same way the bento and the social proof
 * grid are framed (6.5, 6.7): a single 1px `--color-surface-3` outline at a 16px
 * radius, and cards that divide themselves with their own edges. The dividers
 * turn with the block - vertical while the three sit across, horizontal once
 * they stack.
 *
 * | | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
 * | band    | 60 40 20 | 40 40 20 | 40 20 |
 * | rail    | 1200 | 730 | 350 |
 * | H2      | 56/67.2, 896 wide | 48/57.6 | 36/43.2 |
 * | block   | 3 across, 400 each | stacked | stacked, 16 apart |
 *
 * The band's padding is its own: 60 above and 20 below at desktop, against the
 * even 60 that 6.5 to 6.8 share. That is why `SectionBand` takes a padding.
 *
 * On phone the cards sit 16px apart **and keep their dividers**, so a hairline
 * lands inside each gap and the frame outlines all three - identical to what the
 * bento does at the same width, and the Reference's own look rather than a
 * border that was meant to be turned off.
 *
 * The first card carries the primary CTA and the other two the secondary. That
 * is position, not a field: no Plan on the Reference says it is the featured one
 * and a `featured: true` in `plans.json` would be layout wearing content's
 * clothes (ADR-0004).
 */
export async function Pricing() {
  const plans = await getPlans()

  return (
    <SectionBand
      eyebrow="Do you sell anything else?"
      heading="Providing all website-solutions for your needs."
      headingWidth="desktop:w-[896px]"
      padding="px-5 py-10 tablet:px-10 tablet:pb-5 desktop:pt-15"
    >
      <div className="flex flex-col gap-4 overflow-clip rounded-frame rule-ring tablet:gap-0 desktop:flex-row">
        {plans.map((plan, index) => (
          <div
            key={plan.slug}
            className={
              'flex desktop:flex-1 ' +
              (index < plans.length - 1 ? 'rule-b desktop:rule-r' : '')
            }
          >
            <PlanCard plan={plan} featured={index === 0} />
          </div>
        ))}
      </div>
    </SectionBand>
  )
}
