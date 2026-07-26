import Image from 'next/image'
import { ArrowRightIcon } from '@/components/icons.tsx'
import { ButtonLink } from '@/components/ui/button.tsx'
import { SectionBand } from '@/components/ui/section-band.tsx'
import { Stars } from '@/components/ui/stars.tsx'
import { getTestimonials, type Testimonial } from '@/lib/content'
import { CaseStudy } from './case-study.tsx'

/*
 * The social proof grid (PRD 6.7), measured in #11 at 1440, 810 and 390.
 *
 * One framed grid - 1px `--color-surface-3`, 16px radius, cells dividing
 * themselves with a right and a bottom edge each - and **the case study is its
 * last row**, spanning every column (6.8). They are one band on the Reference,
 * not two Sections that happen to touch.
 *
 * | | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
 * | grid  | 3 across, 400x284 | 2 across, 365x284 | 1 across, 350x284 |
 * | shown | all nine | eight | six |
 * | name  | 16/25.6 | 16/25.6 | 14/22.4 |
 *
 * **The Reference drops Testimonials as the grid narrows**, rather than reflowing
 * all nine: Samar goes at tablet, and Emon, Samar and Nonso at phone, which is
 * what keeps the grid rectangular at two and one column. Measured at all three
 * widths by counting the cards that render. Nine is the number in the content and
 * the number the grid shows at desktop; the two narrow layouts show a subset of
 * that Placement rather than a different one, so the rule lives here in layout.
 *
 * A cell is 32px of padding top and bottom, 24 either side, and three rows 28
 * apart: five 21px stars, the quote at `--text-h5`, then a 42px avatar beside the
 * name. Avatars are decorative - the name is right there in text (PRD 6.14).
 *
 * Two of the quotes carry the Reference's own typos, `custmize` and `The
 * templates is so well designed`. They are content, they are pinned by
 * `tests/content/reference-facts.test.ts`, and they are not to be corrected.
 */

/** Cards the Reference stops rendering as the grid loses a column. */
const DROPPED_AT_TABLET = new Set(['samar'])
const DROPPED_AT_PHONE = new Set(['emon', 'samar', 'nonso'])

export async function SocialProof() {
  const { grid } = await getTestimonials()

  return (
    <SectionBand
      eyebrow="Has anyone else tried it?"
      heading="Trusted by 2k+ customers around the globe."
      headingWidth="tablet:w-[368px] desktop:w-[718px]"
      action={
        <ButtonLink href="/live-examples" className="w-full tablet:w-auto">
          See real customer websites
          <ArrowRightIcon />
        </ButtonLink>
      }
    >
      <div className="grid overflow-clip rounded-frame rule-ring tablet:grid-cols-2 desktop:grid-cols-3">
        {grid.map((person) => (
          <TestimonialCard key={person.slug} person={person} />
        ))}

        <div className="tablet:col-span-2 desktop:col-span-3">
          <CaseStudy />
        </div>
      </div>
    </SectionBand>
  )
}

function TestimonialCard({ person }: { readonly person: Testimonial }) {
  /* Tablet first: Samar is dropped at both widths, and asking about phone first
   * would bring the card back at 810. */
  const visibility = DROPPED_AT_TABLET.has(person.slug)
    ? 'hidden desktop:flex'
    : DROPPED_AT_PHONE.has(person.slug)
      ? 'hidden tablet:flex'
      : 'flex'

  return (
    <figure className={`${visibility} flex-col gap-7 px-6 py-8 rule-rb`}>
      <Stars rating={person.rating} />

      <blockquote className="text-h5 text-balance">{person.quote}</blockquote>

      <figcaption className="flex items-center gap-3">
        <Image
          src={person.avatar.src}
          alt=""
          width={42}
          height={42}
          sizes="42px"
          className="size-[42px] rounded-full object-cover"
        />
        <span className="text-body-sm text-text-muted tablet:text-body">
          {person.name}
        </span>
      </figcaption>
    </figure>
  )
}
