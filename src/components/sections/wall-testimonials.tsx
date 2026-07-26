'use client'

import Image from 'next/image'
import { Stars } from '@/components/ui/stars.tsx'
import type { Testimonial } from '@/lib/content'
import { useTestimonialRotation } from './use-testimonial-rotation.ts'

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
 *
 * All six stay in the accessibility tree rather than only the one on screen.
 * Hiding the other five would put four quotes out of reach of a screen reader
 * for 3.2s each and leave the sixth arriving unannounced; six short quotes read
 * in the Wall's order is the better listening, and the visible one is a matter
 * of which is scrolled into view.
 */

/* Measured in #10 by sampling the Reference's own transform every 40ms: about
 * 1.4s, most of it spent in the first third. A single ease rather than the
 * spring Framer runs, which is close enough that the two are hard to tell apart
 * side by side and does not cost a physics loop on the main thread. */
const SLIDE_TRANSITION = 'transform 1400ms cubic-bezier(0.16, 1, 0.3, 1)'

export function WallTestimonials({ items }: { readonly items: readonly Testimonial[] }) {
  const { active, leaving, paused, togglePaused, containerRef, holdProps } =
    useTestimonialRotation(items.length)

  return (
    <div
      ref={containerRef}
      {...holdProps}
      className="absolute inset-x-0 bottom-[calc(var(--wall-testimonial-height)/-2)] z-1 h-[var(--wall-testimonial-height)]"
    >
      {/* The mask is on the window, not on the block, so that the control below
       * it is not faded out by the same gradient that hides a slide's edges. */}
      <ul
        aria-label="What customers say"
        className="relative size-full overflow-hidden [-webkit-mask-image:var(--wall-testimonial-mask)] [mask-image:var(--wall-testimonial-mask)]"
      >
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

      {/*
       * The pause control, and a Deviation the Reference has no answer to: its
       * own chevrons are `display: none`, so quotes move with no way to stop
       * them. Invisible until focused, so an at-rest capture is unchanged and a
       * keyboard visitor still finds it - the same bargain a skip link makes.
       */}
      <button
        type="button"
        onClick={togglePaused}
        className="sr-only focus:not-sr-only focus:absolute focus:bottom-0 focus:left-1/2 focus:-translate-x-1/2 focus:rounded-button focus:bg-surface-2 focus:px-5 focus:py-2.5 focus:text-body focus:font-medium focus:text-text focus:outline-2 focus:outline-offset-4 focus:outline-text"
      >
        {paused ? 'Resume the quotes' : 'Pause the quotes'}
      </button>
    </div>
  )
}
