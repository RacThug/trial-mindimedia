'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRightIcon, CloseIcon } from '@/components/icons.tsx'
import { TickerStrip } from '@/components/media/ticker-strip.tsx'
import { QUIZ_BLURB, QUIZ_HREF } from '@/components/sections/quiz-copy.ts'
import { ButtonLink } from '@/components/ui/button.tsx'
import { media } from '@/lib/media'

/*
 * The quiz modal (PRD 6.13), measured in #12 at 1440, 810 and 390.
 *
 * | | desktop >= 1200 | tablet 810-1199 | phone <= 809 |
 * | panel   | 1016 x 616 | 680 x 616 | 100vw - 84 x 660 |
 * | padding | 60 32 32 | 60 32 32 | 60 20 20 |
 * | H2      | 44/57.2 | 36/46.8 | 28/36.4 |
 * | body    | 16/25.6, 476 wide | 16/25.6, 476 | 14/22.4 |
 *
 * Centred over a `rgba(0, 0, 0, 0.9)` scrim at `z-index: 10`, with two tilted
 * columns of Template screenshots travelling behind its copy - a set of ten the
 * Reference uses nowhere else, which is why `quiz/*` exists in the asset
 * manifest.
 *
 * **PRD 6.13 says it "fires on load" and it does not.** Measured in #12 by
 * sampling once a second from `domcontentloaded`: nothing at 5s, up at 6s. That
 * is a deliberate delay rather than a slow render - the page is idle long
 * before - and it is the whole reason the modal costs nothing in PRD section 8's
 * initial-load budget. Ours does the same, and the PRD is corrected to match.
 *
 * Three Deviations, all of them accessibility, all recorded in the README:
 *
 * - **It can be dismissed.** The Reference's own can be too - Escape and an
 *   outside click both close it, measured - but it has no visible control, so
 *   ours adds a close button. A dialog a pointer user cannot see their way out
 *   of is not something to reproduce.
 * - **It traps focus and returns it.** A `<dialog>` element does both, and the
 *   scrim, the top layer and the Escape handling come with it rather than being
 *   rebuilt - which is also why there is no `role="dialog"` written here.
 * - **It stays shut once it is closed**, for the session. The Reference reopens
 *   on every navigation, which is the behaviour of something that has never been
 *   dismissed on purpose.
 */

/** Measured: nothing at 5s from `domcontentloaded`, up at 6s. */
const DELAY_MS = 6000

/** Set once the visitor closes it, so a client-side navigation does not reopen. */
const DISMISSED = 'quiz-modal-dismissed'

/** The two tilted columns, in the order each runs them (#12). */
const TICKER = [
  {
    direction: 'down',
    shots: [
      media['quiz/shot-a1'],
      media['quiz/shot-a2'],
      media['quiz/shot-a3'],
      media['quiz/shot-a4'],
      media['quiz/shot-a5'],
    ],
  },
  {
    direction: 'up',
    shots: [
      media['quiz/shot-b1'],
      media['quiz/shot-b2'],
      media['quiz/shot-b3'],
      media['quiz/shot-b4'],
      media['quiz/shot-b5'],
    ],
  },
] as const

/*
 * Measured: 476x369 tiles 32px apart, travelling at 30.4px/s. The tiles are
 * cropped to that box rather than drawn at their own aspect - the sources are
 * all 1.59 wide and the Reference shows them at 1.29 - so the cycle is a
 * straight multiplication rather than the aspect sum the Quiz CTA's columns
 * need, and both columns run five tiles, so both take the same time.
 */
const TILE_HEIGHT = 369
const TILE_GAP = 32
const PIXELS_PER_SECOND = 30.44
const TICKER_DURATION = `${((5 * (TILE_HEIGHT + TILE_GAP)) / PIXELS_PER_SECOND).toFixed(2)}s`

export function QuizModal() {
  const ref = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)

  /* Everything closes through the element, so Escape - which the browser
   * handles on its own - and the two controls all end in the same `onClose`. */
  const close = useCallback(() => ref.current?.close(), [])

  useEffect(() => {
    if (sessionStorage.getItem(DISMISSED)) return
    const timer = setTimeout(() => setOpen(true), DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  /* `showModal()` rather than the `open` attribute: only the method puts the
   * dialog in the top layer, which is what gives it the scrim, the focus trap
   * and Escape without any of the three being written here. */
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      /* `showModal()` focuses the first control inside, which paints a focus
       * ring on a CTA nobody reached for - the Reference has none, and neither
       * does any other dialog that opens by itself. Focus lands on the panel
       * instead: a screen reader still announces the dialog and its heading, and
       * the first Tab moves to a real control with its own ring. */
      dialog.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  /* Where every dismissal lands: this records it, so a client-side navigation
   * does not bring the modal back. */
  const onClose = useCallback(() => {
    sessionStorage.setItem(DISMISSED, 'true')
    setOpen(false)
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      /* The backdrop is the scrim, at the measured 90% black, and clicking it
       * lands on the dialog itself - the panel inside stops the click, so this
       * is an outside click and nothing else. */
      onClick={(event) => {
        if (event.target === ref.current) close()
      }}
      aria-labelledby="quiz-modal-heading"
      tabIndex={-1}
      className="inset-0 m-auto h-[660px] w-[calc(100vw-84px)] max-w-none overflow-clip rounded-card bg-bg p-0 text-text rule-ring backdrop:bg-[var(--modal-scrim)] focus:outline-none tablet:h-[616px] tablet:w-[680px] desktop:w-[1016px]"
    >
      <Ticker />

      <div className="relative z-1 flex h-full flex-col justify-between px-5 pt-15 pb-5 tablet:px-8 tablet:pb-8">
        <div className="flex flex-col items-start gap-8">
          <p className="inline-flex items-center rounded-badge bg-[image:var(--badge-surface-white)] px-3 py-1 text-eyebrow text-text-muted uppercase backdrop-blur-[8px]">
            60-second quiz
          </p>

          <div className="flex flex-col gap-3">
            <h2
              id="quiz-modal-heading"
              className="text-h3-phone text-balance tablet:text-h3-tablet desktop:text-h3"
            >
              Get 30% off the perfect template for your business
            </h2>
            <p className="text-body-sm text-balance tablet:w-[476px] tablet:text-body">
              {QUIZ_BLURB}
            </p>
          </div>
        </div>

        <ButtonLink href={QUIZ_HREF} className="w-fit">
          Take the quiz
          <ArrowRightIcon />
        </ButtonLink>
      </div>

      {/* The Reference has no way out that a pointer can see. Ours does, in the
       * corner its padding leaves free. */}
      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className="absolute top-3 right-3 z-1 flex size-9 items-center justify-center text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
      >
        <CloseIcon />
      </button>
    </dialog>
  )
}

/**
 * The panel's backdrop: two columns of screenshots tilted 16deg and travelling
 * in opposite directions, on the strip `ticker-strip.tsx` owns.
 *
 * Each column is twice the panel tall and hung half a panel above it, the way
 * `ThumbnailColumns` hangs its strip: rotated, a column's corners look past the
 * ends of a strip that starts at the panel's own top edge, and at the far end of
 * the travel there would be nothing there to see.
 *
 * The tiles are 5px-rounded, not the 4 of `--radius-tile`. One measurement each,
 * and one pixel apart, so neither borrows the other's token.
 */
function Ticker() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-start justify-center gap-16 overflow-hidden modal-ticker-mask"
    >
      {TICKER.map((column) => (
        <div
          key={column.direction}
          className="relative h-[200%] w-[319px] shrink-0 -translate-y-1/4 rotate-[16deg] tablet:w-[476px]"
        >
          <TickerStrip
            tiles={column.shots}
            direction={column.direction}
            duration={TICKER_DURATION}
            gap="mb-8"
            tile="h-[247px] w-[319px] tablet:h-[369px] tablet:w-[476px]"
            sizes="(min-width: 810px) 476px, 319px"
            radius="rounded-[5px]"
          />
        </div>
      ))}
    </div>
  )
}
