'use client'

import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion, useOnScreen } from '../media/use-on-screen.ts'

/*
 * The Template Wall's Testimonials advance on their own. Everything about when
 * they do - and when they must not - lives here, apart from the markup.
 *
 * Rotation, not the word CONTEXT.md tells us to avoid: the Wall is a static
 * grid, and calling the block over it a carousel is how a later session talks
 * itself into building the grid as one too.
 *
 * **They do advance, and PRD 6.3 said they did not.** Measured in #10 at 1440:
 * Jacob, Mark, Aba, Roni, Nic, Seyed, Jacob, on a 3.2s cycle, in the same order
 * `getTestimonials().wall` returns. The earlier "identical quotes after 5s" is
 * reproducible and is not wrong - it is what the Reference does with the block
 * off screen, because it pauses when it is not being looked at. Sampling it at
 * scrollY 0, where the Wall is below the fold, is how a static reading happens.
 *
 * Four Deviations, all of them about not trapping a visitor in motion they did
 * not ask for. The Reference honours none of them:
 *
 * - `prefers-reduced-motion` stops it outright, leaving the first quote in
 *   place, for a visitor who has already said so system-wide.
 * - A control pauses and resumes it. WCAG 2.2.2 wants a mechanism to stop
 *   moving content, and the visitor who most needs one cannot hover: the
 *   Reference's own prev/next chevrons are `display: none` at every
 *   Breakpoint, so it offers nothing at all.
 * - Hovering or focusing the block pauses it too, so a quote cannot slide away
 *   from under someone reading it.
 * - It only runs while on screen. That one the Reference does too.
 */

/** Measured in #10: 3.2s between advances, over a ~1.4s ease. */
const INTERVAL_MS = 3200

export type TestimonialRotation = {
  /** The slide on screen. */
  readonly active: number
  /** The one leaving, so the markup knows which two slides may animate. */
  readonly leaving: number | null
  /** True while the visitor has stopped it, rather than the page having. */
  readonly paused: boolean
  readonly togglePaused: () => void
  readonly containerRef: React.RefObject<HTMLDivElement | null>
  /** Spread onto the block: pausing is also a property of pointer and focus. */
  readonly holdProps: {
    readonly onPointerEnter: () => void
    readonly onPointerLeave: () => void
    readonly onFocusCapture: () => void
    readonly onBlurCapture: () => void
  }
}

export function useTestimonialRotation(count: number): TestimonialRotation {
  /* One state, not two. Which slide is leaving is only ever the one that was
   * active a moment ago, so deriving it in the same update keeps the pair from
   * being briefly inconsistent - and keeps the advance out of an updater that
   * React is free to call twice. */
  const [slide, setSlide] = useState<{ active: number; leaving: number | null }>({
    active: 0,
    leaving: null,
  })
  /* Held is the pointer or focus, which resumes by itself; paused is the
   * control, which does not until it is pressed again. */
  const [held, setHeld] = useState(false)
  const [paused, setPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const onScreen = useOnScreen(containerRef)

  useEffect(() => {
    if (!onScreen || held || paused || count < 2) return
    if (prefersReducedMotion()) return

    const timer = window.setInterval(() => {
      setSlide((current) => ({
        active: (current.active + 1) % count,
        leaving: current.active,
      }))
    }, INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [onScreen, held, paused, count])

  return {
    active: slide.active,
    leaving: slide.leaving,
    paused,
    togglePaused: () => setPaused((wasPaused) => !wasPaused),
    containerRef,
    holdProps: {
      onPointerEnter: () => setHeld(true),
      onPointerLeave: () => setHeld(false),
      onFocusCapture: () => setHeld(true),
      onBlurCapture: () => setHeld(false),
    },
  }
}
