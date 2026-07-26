'use client'

import { useEffect, useRef, useState } from 'react'

/*
 * The Template Wall's Testimonials advance on their own. Everything about when
 * they do - and when they must not - lives here, apart from the markup.
 *
 * **They do advance, and PRD 6.3 said they did not.** Measured in #10 at 1440:
 * Jacob, Mark, Aba, Roni, Nic, Seyed, Jacob, on a 3.2s cycle, in the same order
 * `getTestimonials().wall` returns. The earlier "identical quotes after 5s" is
 * reproducible and is not wrong - it is what the Reference does with the block
 * off screen, because it pauses when it is not being looked at. Sampling it at
 * scrollY 0, where the Wall is below the fold, is how a static reading happens.
 *
 * Three Deviations, all of them about not trapping a visitor in motion they did
 * not ask for. The Reference honours none of them:
 *
 * - `prefers-reduced-motion` stops the rotation outright, leaving the first
 *   quote in place. WCAG 2.2.2 wants a way to stop moving content, and a
 *   visitor who has already said so system-wide should not have to ask twice.
 * - Hovering or focusing the block pauses it, so a quote cannot slide away from
 *   under someone reading it.
 * - It only runs while on screen. That one the Reference does too.
 */

/** Measured in #10: 3.2s between advances, over a ~1.4s ease. */
export const CAROUSEL_INTERVAL_MS = 3200

export type Carousel = {
  /** The slide on screen. */
  readonly active: number
  /** The one leaving, so the markup knows which two slides may animate. */
  readonly leaving: number | null
  readonly containerRef: React.RefObject<HTMLDivElement | null>
  /** Spread onto the block: pausing is a property of pointer and focus. */
  readonly pauseProps: {
    readonly onPointerEnter: () => void
    readonly onPointerLeave: () => void
    readonly onFocusCapture: () => void
    readonly onBlurCapture: () => void
  }
}

export function useCarousel(count: number): Carousel {
  const [active, setActive] = useState(0)
  const [leaving, setLeaving] = useState<number | null>(null)
  const [onScreen, setOnScreen] = useState(false)
  const [held, setHeld] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry?.isIntersecting ?? false),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!onScreen || held || count < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = window.setInterval(() => {
      setActive((current) => {
        setLeaving(current)
        return (current + 1) % count
      })
    }, CAROUSEL_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [onScreen, held, count])

  return {
    active,
    leaving,
    containerRef,
    pauseProps: {
      onPointerEnter: () => setHeld(true),
      onPointerLeave: () => setHeld(false),
      onFocusCapture: () => setHeld(true),
      onBlurCapture: () => setHeld(false),
    },
  }
}
