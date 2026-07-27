'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/*
 * Everything the phone menu does that is not markup: open state, the scroll
 * lock, the focus trap, and closing itself when the viewport stops being a
 * phone. It sits apart from `nav-bar.tsx` so that the nav file reads as the
 * Reference's layout and this one reads as the four behaviours - none of which
 * the Reference has, since its control is a `div`.
 */

/** Everything the trap can land on. Filtered for what is actually rendered. */
const FOCUSABLE = 'a[href], button:not([disabled])'

export type Menu = {
  readonly open: boolean
  readonly close: () => void
  readonly toggle: () => void
  /** The element that is the menu when open: the trap's boundary. */
  readonly surfaceRef: React.RefObject<HTMLElement | null>
  /** The control that opens and closes it, and takes focus back on Escape. */
  readonly controlRef: React.RefObject<HTMLButtonElement | null>
  readonly onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void
}

export function useMenu(): Menu {
  const [open, setOpen] = useState(false)
  const surfaceRef = useRef<HTMLElement>(null)
  const controlRef = useRef<HTMLButtonElement>(null)

  /* Every link inside the menu closes it on the way out. Client-side navigation
   * leaves the header mounted, so without this the menu would cover the page it
   * had just opened - and closing on the click beats reacting to the route
   * afterwards, which is a render caused by a render. */
  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((wasOpen) => !wasOpen), [])

  /* Above the tablet Breakpoint the menu is display:none. Left open across a
   * resize it would hold the scroll lock and the focus trap over a nav that is
   * visibly a row of links. The Breakpoint is read from the token rather than
   * repeated here, because a second copy of 810 is a second thing to correct. */
  useEffect(() => {
    const width =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--breakpoint-tablet')
        .trim() || '810px'
    const wide = window.matchMedia(`(min-width: ${width})`)
    const closeIfWide = () => {
      if (wide.matches) setOpen(false)
    }

    wide.addEventListener('change', closeIfWide)
    return () => wide.removeEventListener('change', closeIfWide)
  }, [])

  /* A Deviation, recorded: the Reference lets the page scroll behind its open
   * menu. A full-viewport dialog that scrolls its own backdrop is a bug
   * everywhere else, and no Fidelity measurement can see the difference. */
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (!open) return

      if (event.key === 'Escape') {
        setOpen(false)
        /* Escape can be pressed from any link in the menu, and those links are
         * about to unmount. Without this, focus falls back to the body and a
         * keyboard visitor starts again from the top of the document. */
        controlRef.current?.focus()
        return
      }
      if (event.key !== 'Tab') return

      /* `getClientRects()` rather than a visibility flag: the desktop links and
       * the menu's own links are both in the DOM at every width, and which set
       * is real is decided by CSS. */
      const items = [
        ...(surfaceRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
      ].filter((element) => element.getClientRects().length > 0)

      const first = items.at(0)
      const last = items.at(-1)
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [open],
  )

  return { open, close, toggle, surfaceRef, controlRef, onKeyDown }
}
