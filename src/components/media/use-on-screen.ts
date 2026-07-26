'use client'

import { useEffect, useState, type RefObject } from 'react'

/*
 * The two questions everything that moves on this page has to ask: is it being
 * looked at, and does the visitor want motion at all.
 *
 * Both the Template Wall's clips and its Testimonials need them, and the pair
 * travels together: motion that runs off screen is wasted, and motion a visitor
 * has asked not to see should not run at all.
 */

/** True while `ref`'s element is within `rootMargin` of the viewport. */
export function useOnScreen(
  ref: RefObject<Element | null>,
  rootMargin?: string,
): boolean {
  const [onScreen, setOnScreen] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry?.isIntersecting ?? false),
      rootMargin === undefined ? undefined : { rootMargin },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, rootMargin])

  return onScreen
}

/**
 * Read at the moment motion would start rather than subscribed to.
 *
 * Someone who changes the system setting mid-visit gets the new answer at the
 * next advance, and nothing on this page moves for long enough that waiting one
 * beat is worse than a listener on every clip and every quote.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
