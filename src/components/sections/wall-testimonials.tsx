'use client'

import Image from 'next/image'
import { Stars } from '@/components/ui/stars.tsx'
import type { MediaImage } from '@/lib/media'
import { useCarousel } from './use-carousel.ts'

/*
 * The six Testimonials that float over the Template Wall (PRD 6.3, 6.7).
 *
 * Measured in #10 at 1440: a 298px band centred on the Wall's bottom edge,
 * masked away at its own top and bottom, holding one quote at a time - stars,
 * a 24px quote on a 570px measure, then a 42px avatar beside the name. The
 * order is the Wall's own, which is not the order PRD 6.7's sentence lists;
 * `getTestimonials().wall` already returns it correctly.
 *
 * Only two slides ever move. The active one sits at 0 and the one leaving
 * travels up and out; every other slide is parked below the window, which is
 * where the next one is already waiting. That is what makes the wrap from the
 * last quote back to the first look like every other advance instead of a
 * five-slide rewind - and it is why `leaving` exists, since a parked slide
 * jumping from above to below must not animate on the way.
 */

export type WallTestimonial = {
  readonly slug: string
  readonly name: string
  readonly quote: string
  readonly rating: number
  readonly avatar: MediaImage
}

/* Measured in #10 by sampling the Reference's own transform every 40ms: about
 * 1.4s, most of it spent in the first third. A single ease rather than the
 * spring Framer runs, which is close enough that the two are hard to tell apart
 * side by side and does not cost a physics loop on the main thread. */
const SLIDE_TRANSITION = 'transform 1400ms cubic-bezier(0.16, 1, 0.3, 1)'

export function WallTestimonials({
  items,
}: {
  readonly items: readonly WallTestimonial[]
}) {
  const { active, leaving, containerRef, pauseProps } = useCarousel(items.length)

  return (
    <div
      ref={containerRef}
      {...pauseProps}
      className="absolute inset-x-0 bottom-[calc(var(--wall-testimonial-height)/-2)] z-1 h-[var(--wall-testimonial-height)] overflow-hidden [-webkit-mask-image:var(--wall-testimonial-mask)] [mask-image:var(--wall-testimonial-mask)]"
    >
      <ul aria-label="What customers say" className="size-full">
        {items.map((item, index) => (
          <li
            key={item.slug}
            className="absolute inset-0 flex flex-col items-center justify-center px-5"
            style={{
              transform: `translateY(${index === active ? '0%' : index === leaving ? '-100%' : '100%'})`,
              transition:
                index === active || index === leaving ? SLIDE_TRANSITION : 'none',
            }}
          >
            {/* 24px from the stars to the quote, then 28px to the name: two
             * different measured gaps, so two stacked columns. */}
            <figure className="flex flex-col items-center gap-7">
              <div className="flex flex-col items-center gap-6">
                <Stars rating={item.rating} />
                <blockquote className="max-w-[570px] text-center text-h5 text-balance">
                  {item.quote}
                </blockquote>
              </div>
              <figcaption className="flex items-center gap-3">
                {/* Decorative: the name is right beside it (PRD 6.14). */}
                <Image
                  src={item.avatar.src}
                  alt=""
                  width={42}
                  height={42}
                  sizes="42px"
                  className="size-[42px] rounded-full object-cover"
                />
                <span className="text-body text-text-muted">{item.name}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  )
}
