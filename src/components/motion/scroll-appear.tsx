'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { APPEAR, appearThreshold, type AppearVariant } from './appear.ts'

/*
 * Scroll-Appear: the animation that plays once as a Section first enters the
 * viewport (CONTEXT.md), to the parameters measured in `./appear.ts`.
 *
 * This is the only client island the Sections need. It takes its content as
 * `children`, so everything inside stays a Server Component - the Section
 * bodies, their content reads, and their markup all still render on the server,
 * and what ships to the browser is this wrapper and Motion.
 *
 * The trigger is a plain IntersectionObserver rather than Motion's `whileInView`
 * on purpose. `whileInView`'s `viewport.amount` is handed to the observer
 * unclamped, and the Reference's rule is half the element *or half the
 * viewport*, whichever is smaller; expressed as a bare `amount: 0.5` a Section
 * more than twice the viewport tall would never reach that ratio and would stay
 * invisible. See `appearThreshold`.
 */

type ScrollAppearProps = {
  /** The tag to render. Matches the element the Reference puts the transform on. */
  readonly as?: 'section' | 'div'
  readonly variant?: AppearVariant
  readonly className?: string
  readonly children: React.ReactNode
}

export function ScrollAppear({
  as = 'section',
  variant = 'section',
  className,
  children,
}: ScrollAppearProps) {
  const { travel, spring } = APPEAR[variant]
  const [element, setElement] = useState<HTMLElement | null>(null)
  const appeared = useAppeared(element)

  /*
   * Read once, at the first render that matters. `useReducedMotion` samples the
   * media query rather than subscribing, and on the server it can only answer
   * "no" - so it must not reach the markup, or hydration would disagree with
   * whatever the visitor actually prefers. It does not: the resting state below
   * is the same either way, and this only chooses how the element leaves it.
   */
  const reduced = useReducedMotion()

  const Component = as === 'div' ? motion.div : motion.section

  return (
    <Component
      ref={setElement}
      data-appear=""
      className={className}
      /*
       * Rendered inline by Motion on the server, which is what stops the flash
       * of a Section that paints before it is asked to appear. It is also why
       * `layout.tsx` carries a `<noscript>` rule: with the animation never
       * arriving, this alone would leave the page blank.
       */
      initial={{ opacity: 0, y: travel }}
      animate={appeared ? { opacity: 1, y: 0 } : { opacity: 0, y: travel }}
      /* Reduced motion: same end state, no travel and no fade to get there. */
      transition={reduced ? { duration: 0 } : spring}
    >
      {children}
    </Component>
  )
}

/**
 * Whether the element has entered far enough to appear, latched on first entry.
 *
 * Latched, so that scrolling back up does not replay it - the Reference plays it
 * once. The observer is rebuilt on resize because the threshold is derived from
 * the element's height against the viewport's, and both change with the
 * Breakpoint.
 */
function useAppeared(element: HTMLElement | null): boolean {
  const [appeared, setAppeared] = useState(false)

  /* Latched in a ref as well as in state: the resize handler reads it. */
  const hasAppeared = useRef(false)

  const appear = useCallback(() => {
    if (hasAppeared.current) return
    hasAppeared.current = true
    setAppeared(true)
  }, [])

  useEffect(() => {
    if (!element || hasAppeared.current) return

    /* No IntersectionObserver: show the content rather than hide it for good. */
    if (typeof IntersectionObserver === 'undefined') {
      appear()
      return
    }

    let observer: IntersectionObserver | null = null

    const observe = () => {
      observer?.disconnect()
      if (hasAppeared.current) return

      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect()
            appear()
          }
        },
        { threshold: appearThreshold(element.offsetHeight, window.innerHeight) },
      )
      observer.observe(element)
    }

    observe()
    window.addEventListener('resize', observe)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', observe)
    }
  }, [element, appear])

  return appeared
}
