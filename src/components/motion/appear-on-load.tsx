import { appearOnLoadStyle } from './appear-style.ts'

/*
 * Scroll-Appear for the one Section that is always already on screen.
 *
 * The hero fires the moment the page loads at every Breakpoint - there is no
 * scrolling involved and never was - so nothing about it needs an
 * IntersectionObserver, a client island, or Motion. It needs an animation that
 * starts when the element is parsed, which is what a CSS animation is.
 *
 * **This is a performance fix, and the size of it is the argument for it.**
 * Scroll-Appear writes its resting state into the server markup, so the hero
 * shipped at `opacity: 0` and stayed there until the page's JavaScript had
 * arrived and hydrated: measured on Lighthouse's throttled mobile profile as
 * **LCP 3.9s against FCP 0.9s**, three seconds of blank page on a page whose
 * HTML was finished in one.
 *
 * It is the same animation as every other Section's, from the same keyframes and
 * the same converted spring (`appear-style.ts`). The only difference is what
 * starts it - being parsed, rather than an observer - which is why this needs no
 * client island where `scroll-appear.tsx` does.
 *
 * Everything below the fold stays on `ScrollAppear`. It has to: those Sections
 * genuinely wait for a scroll, and a CSS animation has no way to know about one.
 */

const STYLE = appearOnLoadStyle()

export function AppearOnLoad({
  className,
  children,
}: {
  readonly className?: string
  readonly children: React.ReactNode
}) {
  return (
    <section data-appear-on-load="" className={className} style={STYLE}>
      {children}
    </section>
  )
}
