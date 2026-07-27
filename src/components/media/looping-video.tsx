'use client'

import { useEffect, useRef } from 'react'
import { prefersReducedMotion, useOnScreen } from './use-on-screen.ts'

/*
 * A decorative clip that plays only while it is on screen.
 *
 * This is PRD section 8's first performance lever, which is worth 2.43 MB of the
 * Reference's 4.0 MB initial load: the Reference autoplays every wall clip at
 * `preload="auto"`, one of them 839 KB, none of it above the fold.
 *
 * The trick is that nothing here loads until it has to. The element carries
 * `preload="none"` and no `autoplay`, so the browser fetches not one byte of
 * video on load; an IntersectionObserver calls `play()` when the tile comes near
 * the viewport, which is what starts the fetch, and pauses it again on the way
 * out. Until a frame paints the element is transparent, and what a visitor sees
 * is the poster underneath it - a real `next/image`, lazily loaded and served as
 * AVIF, rather than the raw poster attribute a `<video>` would take.
 *
 * Under `prefers-reduced-motion` it never plays at all and the poster is the
 * whole tile, which is also what a visitor gets if video decoding fails.
 */

type LoopingVideoProps = {
  readonly src: string
  readonly className?: string
}

/** Start a clip this far before it reaches the viewport, so it is already running. */
const ROOT_MARGIN = '200px'

export function LoopingVideo({ src, className = '' }: LoopingVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const onScreen = useOnScreen(ref, ROOT_MARGIN)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (prefersReducedMotion()) return

    if (onScreen) {
      /* Autoplay can still be refused - a browser setting, a battery saver. The
       * poster stays underneath either way, so there is nothing to do about the
       * rejection but not crash on it. */
      void video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [onScreen])

  return (
    <video
      ref={ref}
      src={src}
      preload="none"
      muted
      loop
      playsInline
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
      className={className}
    />
  )
}
