import Image from 'next/image'
import { FramerIcon, StarIcon } from '@/components/icons.tsx'
import { ButtonLink } from '@/components/ui/button.tsx'
import { Eyebrow } from '@/components/ui/eyebrow.tsx'
import { media } from '@/lib/media'

/*
 * The hero (PRD 6.2). Every number here was measured off the live Reference at
 * 1440, 810 and 390 in #10.
 *
 * | | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
 * | padding | 160 40 60 | 160 40 60 | 120 20 40 |
 * | H1      | 68/81.6   | 60/72     | 44/52.8   |
 * | H1 max  | 1120      | 674       | full      |
 * | H1 gap  | 32        | 32        | 40        |
 * | CTA row | row, apart | row, apart | column, rating first |
 *
 * Two of those are the kind that get "corrected" back by instinct:
 *
 * 1. **The rating sits above the buttons on phone, below the H1 elsewhere.** It
 *    is one row that becomes `flex-col-reverse`, not two blocks: DOM order stays
 *    buttons-then-rating at every width, which is also the order a screen reader
 *    should hear them in.
 * 2. **The secondary CTA's short copy is the TABLET variant, not the phone one.**
 *    PRD 6.2 and #8 both had this the other way round, from reading the served
 *    markup rather than the render. Measured at ten widths in #10: 809 renders
 *    `the perfect one`, 810 renders `with one`, 1199 renders `with one`, 1200
 *    renders `the perfect one`. Shorter copy, not truncation, so it needs two
 *    nodes.
 */

/** The three faces over `RATED 4.92/5`, in Reference stacking order. */
const AVATARS = [media['avatar/hero-1'], media['avatar/hero-2'], media['avatar/hero-3']]

export function Hero() {
  return (
    <section className="px-5 pt-30 pb-10 tablet:px-10 tablet:pt-40 tablet:pb-15">
      <div className="mx-auto flex w-full max-w-rail flex-col items-start gap-11">
        <Eyebrow icon={<FramerIcon />}>Framer templates</Eyebrow>

        <div className="flex w-full flex-col gap-10 tablet:gap-8">
          {/* Balanced, like every prose block on the Reference (#9's census of
           * 204 of them). It is what breaks this line after `with` instead of
           * filling to `Pick, edit,` and leaving `publish.` alone. */}
          <h1 className="text-display-phone text-balance tablet:max-w-[674px] tablet:text-display-tablet desktop:max-w-[1120px] desktop:text-display">
            No back-and-forth with AI. Pick, edit, publish.
          </h1>

          {/* Reversed rather than reordered: see note 1 above. */}
          <div className="flex w-full flex-col-reverse gap-7 tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-8">
            <div className="flex w-full flex-col gap-4 tablet:w-auto tablet:flex-row tablet:gap-3">
              <ButtonLink href="/templates" className="w-full tablet:w-auto">
                Pick your template
              </ButtonLink>
              <ButtonLink
                href="https://browsersupply.typeform.com/template-quiz"
                variant="secondary"
                className="w-full tablet:w-auto"
              >
                {/* See note 2: tablet alone gets the shorter line. */}
                <span className="tablet:hidden desktop:inline">
                  Or get matched with the perfect one
                </span>
                <span className="hidden tablet:inline desktop:hidden">
                  Or get matched with one
                </span>
              </ButtonLink>
            </div>

            <Rating />
          </div>
        </div>
      </div>
    </section>
  )
}

/*
 * The avatar stack and the rating label.
 *
 * The stack is three 40px circles at a 24px step, so it measures 88px wide, and
 * the first is on top. Absolute positioning rather than negative margins,
 * because the Reference's z-order runs the other way to the DOM order.
 *
 * Faces are decorative: they are stock customer photographs beside a label that
 * already says what they are for, and naming them would invent facts (PRD 6.14).
 */
function Rating() {
  return (
    <div className="flex shrink-0 items-center gap-5">
      <div className="relative h-10 w-22">
        {AVATARS.map((avatar, index) => (
          <Image
            key={avatar.src}
            src={avatar.src}
            alt=""
            width={40}
            height={40}
            sizes="40px"
            priority
            className="absolute top-0 size-10 rounded-full object-cover"
            style={{ left: index * 24, zIndex: AVATARS.length - index }}
          />
        ))}
      </div>

      <p className="flex items-center gap-3 text-text-warm">
        <StarIcon />
        {/* 12px/18px at weight 700 with 0.07em of tracking, uppercased by CSS
         * from sentence case - measured in #10, and the one place on the page
         * that goes heavier than the Eyebrow's 600. */}
        <span className="text-[12px] leading-[18px] font-bold tracking-[0.84px] uppercase">
          Rated 4.92/5
        </span>
      </p>
    </div>
  )
}
