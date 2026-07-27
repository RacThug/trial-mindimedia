'use client'

import { useEffect } from 'react'
import { SCROLL_EPSILON_PX, scrollDelta, scrollStep } from './smooth-scroll.ts'

/*
 * Smooth scrolling, to the curve #15 measured off the Reference. The numbers and
 * the method are in `smooth-scroll.ts`; this file is the loop that plays them.
 *
 * It renders nothing and it hijacks exactly one thing: the wheel. Everything
 * else that scrolls a page - a drag on the bar, a swipe, Page Down, an anchor,
 * `scrollIntoView` from our own tests - is left alone and simply moves the page,
 * and the loop notices and re-aims. That is the Reference's shape too: Lenis
 * defaults to leaving touch native, and the swipe on a phone is the one gesture
 * where a follow this long feels like lag rather than weight.
 *
 * Four things it refuses to touch, each of which is a way a hijacked wheel
 * becomes a bug rather than a feel:
 *
 * - **A pinch-zoom.** Ctrl-wheel is the browser's, not the page's.
 * - **A scrollable thing under the pointer.** A wheel inside a box that can
 *   scroll itself belongs to that box.
 * - **An open dialog.** The Reference stops Lenis while its own modal is up,
 *   and ours would otherwise scroll the page behind a `<dialog>`.
 * - **A visitor who asked for less motion.** Smoothing is motion the visitor did
 *   not ask for, and the honest answer to `prefers-reduced-motion` here is to
 *   hand the wheel back rather than to shorten the curve.
 *
 * The listener has to be non-passive, since the whole point is cancelling the
 * native scroll. That is a real cost - Chrome cannot scroll such a page off the
 * main thread - and it is the cost the Reference pays too.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduced.matches) return

    /*
     * Our own copy of where the page is, because the follow lands on fractions
     * and `scrollY` may not report them. `applied` is what we last asked for,
     * and is how a scroll someone else caused is told apart from our own.
     */
    let current = window.scrollY
    let target = current
    let applied = current
    let frame = 0

    /*
     * Stamped when the loop is *scheduled*, not on its first frame. A sentinel
     * that made the first frame a no-op cost a whole frame at the start of
     * every notch, and it showed: measured against the Reference the Clone's
     * curve was the right shape 27ms late, where the Reference is 10ms late.
     */
    let last = 0

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

    const tick = (now: number) => {
      const elapsed = now - last
      last = now

      current = scrollStep(current, target, elapsed)
      if (Math.abs(target - current) < SCROLL_EPSILON_PX) current = target

      applied = current
      window.scrollTo(0, current)

      if (current === target) {
        frame = 0
        return
      }
      frame = requestAnimationFrame(tick)
    }

    /* Someone else moved the page: take their position as the new truth. */
    const onScroll = () => {
      if (Math.abs(window.scrollY - applied) < 1) return
      current = window.scrollY
      target = current
      applied = current
      if (frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || !event.cancelable) return
      if (scrollsItself(event.target)) return

      /*
       * A modal locks the page, rather than the wheel simply being handed back:
       * the Reference stops Lenis while its own modal is up, and Lenis's stop
       * puts `overflow: hidden` on `<html>` with it. Handing the wheel back
       * instead would scroll the page behind an open `<dialog>`, which is what
       * this build did before #15 and is nobody's intention. A scrollable box
       * *inside* the dialog is checked above and still wins.
       */
      if (document.querySelector('dialog[open]')) {
        event.preventDefault()
        return
      }

      const limit = maxScroll()
      if (limit === 0) return

      event.preventDefault()

      const lineHeight = Number.parseFloat(
        getComputedStyle(document.documentElement).lineHeight,
      )
      const delta = scrollDelta(
        event,
        Number.isFinite(lineHeight) ? lineHeight : 16,
        window.innerHeight,
      )

      target = Math.min(Math.max(target + delta, 0), limit)
      if (!frame) {
        /*
         * Now, not `event.timeStamp`. A wheel event delivered late carries a
         * stamp from before the page was ready to act on it, and starting the
         * clock there spends that whole delay on the first frame - measured at
         * half the notch in one step, where the curve wants an eighth.
         */
        last = performance.now()
        frame = requestAnimationFrame(tick)
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return null
}

/**
 * Whether the wheel landed inside something that scrolls on its own.
 *
 * Walks up from the event target, because the pointer is usually over a leaf -
 * a word of text inside the box that scrolls. A box counts only if it both
 * overflows and is allowed to show it, which is what keeps `overflow: hidden`
 * carousels and the page's own `overflow-clip` cards out of it.
 */
function scrollsItself(target: EventTarget | null): boolean {
  let node = target instanceof Element ? target : null

  while (node && node !== document.body && node !== document.documentElement) {
    const overflow = getComputedStyle(node).overflowY
    const scrollable = overflow === 'auto' || overflow === 'scroll'
    if (scrollable && node.scrollHeight > node.clientHeight) return true
    node = node.parentElement
  }

  return false
}
