'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { appearThreshold, type AppearVariant } from './appear.ts'
import { appearStyle } from './appear-style.ts'

/*
 * Scroll-Appear: the animation that plays once as a Section first enters the
 * viewport (CONTEXT.md), to the parameters measured in `./appear.ts`.
 *
 * **This ran on Motion until #14 and now runs on CSS**, which is a performance
 * decision and a reversal of #13's. Motion cost 39 kB gzipped on a homepage
 * whose entire remaining Lighthouse gap was a simulated LCP queued behind the
 * JavaScript; what it was buying was a spring solver, and `spring-easing.ts`
 * converts the same measured spring into the same `linear()` easing Motion
 * itself hands the Web Animations API for opacity and transform. The parameters,
 * the trigger and both settle times are unchanged - what left is the library.
 *
 * So all this component does now is answer one question: has the Section entered
 * far enough yet. When it has, it sets `data-appeared` and `globals.css` runs the
 * keyframes. The resting state is inline and server-rendered, so nothing paints
 * before it is asked to.
 *
 * The trigger stays a plain IntersectionObserver, which is what it was under
 * Motion too and for the same reason. `whileInView`'s `viewport.amount` is handed
 * to the observer unclamped, and the Reference's rule is half the element *or
 * half the viewport*, whichever is smaller; expressed as a bare `amount: 0.5` a
 * Section more than twice the viewport tall would never reach that ratio and
 * would stay invisible. See `appearThreshold`.
 *
 * Reduced motion is handled in CSS rather than here. `useReducedMotion` had to
 * be read after hydration to avoid the server disagreeing with the visitor's
 * setting; a media query has no such problem and needs no JavaScript at all.
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
  const [element, setElement] = useState<HTMLElement | null>(null)
  const appeared = useAppeared(element)
  const Component = as === 'div' ? 'div' : 'section'

  return (
    <Component
      ref={setElement}
      data-appear={variant}
      data-appeared={appeared ? '' : undefined}
      className={className}
      style={appearStyle(variant)}
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
