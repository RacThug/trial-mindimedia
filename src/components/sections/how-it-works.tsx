import { CardVisual } from '@/components/media/card-visual.tsx'
import { ThumbnailColumns } from '@/components/media/thumbnail-column.tsx'
import { SectionBand } from '@/components/ui/section-band.tsx'
import { getSteps, type Step, type Visual } from '@/lib/content'

/*
 * How it works (PRD 6.6), measured in #11 at 1440, 810 and 390.
 *
 * Three cards in one framed block, 1px `--color-surface-3` at a 20px radius -
 * five more than the bento's and the social proof grid's 16, which is the sort
 * of difference only a diff finds. The middle card carries an outline of its own
 * and that is where the two dividing lines come from; at phone the same outline
 * becomes the two horizontal ones.
 *
 * | | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
 * | block  | 1200x453, 3 across | 730x500, 3 across | stacked, 362 / 439 / 461 |
 * | card   | 400 wide, 24 padding | 243 wide | full width |
 * | visual | step 2 216 tall, step 3 238 | the same | the same |
 *
 * Each card is one column pushed apart by `space-between`, and what sits at
 * which end is the whole layout:
 *
 * - **step 1**: badge at the top, title and body at the bottom, and the tilted
 *   thumbnail column travelling behind both (`ThumbnailColumns`).
 * - **step 2**: the clip at the top, badge and text below it.
 * - **step 3**: badge and text at the top, the clip below them.
 *
 * The visual heights are fixed at every Breakpoint - 216 and 238 - so the clips
 * crop rather than scale, and the card height is what moves. At phone nothing is
 * set except step 1, which needs the room for its thumbnails; the other two are
 * their content plus the measured 28px between the two groups.
 *
 * The badge is `STEP {index + 1}`: the number is the position, not a field, so a
 * content file cannot say `Step 3` in the second slot (ADR-0004). Its pill is
 * the Eyebrow's radial wash in `--color-accent-orange` rather than a flat fill.
 */

/** The measured render width per Breakpoint: the card, less its 24px padding. */
const VISUAL_SIZES =
  '(min-width: 1200px) 352px, (min-width: 810px) 195px, calc(100vw - 88px)'

export async function HowItWorks() {
  const steps = await getSteps()

  return (
    <SectionBand
      eyebrow="How does it work?"
      heading="Go live within 1 hour, not months, weeks or even days."
      headingWidth="desktop:w-[747px]"
    >
      <div className="flex flex-col overflow-clip rounded-steps rule-ring tablet:h-[500px] tablet:flex-row desktop:h-[453px]">
        {steps.map((step, index) => {
          const placement = placementOf(step, index)

          return (
            <div
              key={step.slug}
              className={
                'relative overflow-clip tablet:h-full tablet:flex-1 ' +
                /* The card behind its thumbnails is the only one whose height is
                 * set on phone: they have no height of their own to give it
                 * one. */
                (placement === 'behind' ? 'h-[362px] ' : '') +
                (index === 1 ? 'rule-y tablet:rule-x' : '')
              }
            >
              {/* The card carries no padding of its own - its content column
               * does - so that this `inset-0` is the card's own edge. The
               * thumbnails run under the badge and the text and are cut off by
               * the card, which is what the Reference does. */}
              {placement === 'behind' && <ThumbnailColumns media={step.media} />}
              <StepCard step={step} index={index} placement={placement} />
            </div>
          )
        })}
      </div>
    </SectionBand>
  )
}

/**
 * Where the card's visual sits, which is the only thing that differs between the
 * three: `behind` the text and pushing badge and text to opposite ends of the
 * card, above it, or below it.
 */
type VisualPlacement = 'behind' | 'top' | 'bottom'

/** One step's shape, read once and then passed around rather than re-derived. */
function placementOf(step: Step, index: number): VisualPlacement {
  /* The step with a list of thumbnails rather than a single clip is the one
   * they sit behind; of the other two, the middle card leads with its clip. */
  if (step.media.length > 1) return 'behind'
  return index === 1 ? 'top' : 'bottom'
}

function StepCard({
  step,
  index,
  placement,
}: {
  readonly step: Step
  readonly index: number
  readonly placement: VisualPlacement
}) {
  const [visual] = step.media

  const badge = <StepBadge index={index} />
  const text = (
    <div className="relative flex flex-col gap-3">
      <h3 className="text-h5 text-balance">{step.title}</h3>
      <p className="text-body-sm text-balance text-text-muted tablet:text-body">
        {step.body}
      </p>
    </div>
  )

  return (
    <div className="relative flex h-full flex-col justify-between gap-7 p-6 desktop:gap-0">
      {placement === 'top' && visual && (
        <StepVisual visual={visual} className="h-[216px]" />
      )}

      {placement === 'behind' ? (
        /* The card's two ends, so `space-between` can part them. */
        <>
          {badge}
          {text}
        </>
      ) : (
        <div className="flex flex-col gap-7">
          {badge}
          {text}
        </div>
      )}

      {placement === 'bottom' && visual && (
        <StepVisual visual={visual} className="h-[238px]" />
      )}
    </div>
  )
}

function StepBadge({ index }: { readonly index: number }) {
  return (
    <p className="relative w-fit rounded-eyebrow bg-[image:var(--badge-surface-orange)] px-3 py-1 text-eyebrow whitespace-nowrap text-accent-orange uppercase">
      Step {index + 1}
    </p>
  )
}

function StepVisual({
  visual,
  className,
}: {
  readonly visual: Visual
  readonly className: string
}) {
  return (
    <CardVisual
      visual={visual}
      sizes={VISUAL_SIZES}
      className={`relative w-full shrink-0 rounded-visual rule-ring ${className}`}
    />
  )
}
