import { CardVisual } from '@/components/media/card-visual.tsx'
import { ScrollAppear } from '@/components/motion/scroll-appear.tsx'
import { ButtonLink } from '@/components/ui/button.tsx'
import { resolveVisual } from '@/lib/content'

/*
 * The case study (PRD 6.8), measured in #11 at 1440, 810 and 390.
 *
 * It is not a Section of its own: it is the last row of the social proof grid,
 * inside the same frame and rounding off the same bottom corners - measured as
 * `grid-column: span 3` in the very grid that holds the nine Testimonials, which
 * is why it lives here as a component and not as a band. PRD 6.7 and 6.8 are one
 * band on the Reference.
 *
 * | | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
 * | layout | clip left 568, copy right 632, 604 tall | copy over a 461-tall clip | a 219-tall clip over the copy |
 * | copy   | 32 padding, ends apart | 32 padding, 48 between | 24 padding, 32 between |
 * | H3     | 44/57.2 | 36/46.8 | 28/36.4 |
 * | prose  | 16/25.6 | 16/25.6 | 14/22.4 |
 *
 * The clip leads on phone and follows on tablet. That is measured, not a guess
 * at what a stack should do, and it is why the order is set per Breakpoint from
 * one DOM order rather than by moving the markup.
 *
 * Everything here is prose in a single layout, so it is markup rather than
 * content (ADR-0004), and the clip is single-use media that no Collection
 * carries. Its text alternative is written here, once.
 *
 * Two character-level details that a formatter would happily "fix": `café`, and
 * a straight apostrophe in `Didn't` where the founder's own prose in 6.11 uses a
 * curly one. Both are the Reference's.
 */

const VIDEO_SIZES = '(min-width: 1200px) 568px, (min-width: 810px) 730px, 100vw'

const CLIP = resolveVisual(
  'story/case-study',
  'Matt editing his site on a laptop at a café table',
)

export function CaseStudy() {
  return (
    <ScrollAppear
      variant="inPlace"
      className="grid gap-6 tablet:gap-8 desktop:h-[604px] desktop:grid-cols-[568fr_632fr] desktop:gap-0"
    >
      <CardVisual
        visual={CLIP}
        sizes={VIDEO_SIZES}
        className="relative h-[219px] w-full tablet:order-last tablet:h-[461px] desktop:order-first desktop:h-full"
      />

      <div className="flex flex-col gap-8 p-6 tablet:gap-12 tablet:p-8 desktop:justify-between desktop:gap-0">
        <div className="flex flex-col gap-4">
          <h3 className="text-h3-phone text-balance tablet:text-h3-tablet desktop:text-h3">
            Matt launched his new site in less than 1 hour.
          </h3>

          <p className="text-body-sm text-balance text-text-muted tablet:text-body">
            From burning out on 12-hour gym shifts to running his own online coaching
            business, on his own terms.
          </p>
          <p className="text-body-sm text-balance text-text-muted tablet:text-body">
            Matt had tried the agency route before. Thousands of dollars later, he had a
            terrible site and zero control over it.
          </p>
          <p className="text-body-sm text-balance text-text-muted tablet:text-body">
            I showed him the right template. We sat in a café, he made the edits himself,
            and launched in 1 hour.
          </p>

          {/* The one paragraph in white, behind a 1px white rule 20px out. */}
          <p className="pl-5 text-body-sm text-balance shadow-[inset_1px_0_0_var(--color-text)] tablet:text-body">
            No design skills. No coding. Barely any laptop experience. Didn&#39;t need
            any.
          </p>
        </div>

        {/* Both CTAs take half the measure at tablet and desktop, whatever their
         * labels are worth, and the full width stacked on phone. */}
        <div className="flex flex-col gap-3 tablet:flex-row">
          <ButtonLink href="/templates/reformr" className="tablet:flex-1">
            View template Matt used
          </ButtonLink>
          <ButtonLink href="/live-examples" variant="secondary" className="tablet:flex-1">
            View other customers&#39; sites
          </ButtonLink>
        </div>
      </div>
    </ScrollAppear>
  )
}
