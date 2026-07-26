'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Link as ContentLink } from '@/lib/content'
import type { MediaImage } from '@/lib/media'
import { CloseIcon, MenuIcon } from '../icons'
import { ButtonLink } from '../ui/button'
import { SocialLinks } from './social-links'
import { TextLink } from './text-link'

/*
 * The fixed nav, and on phone the menu it becomes.
 *
 * All of it is measured (#9). The two facts worth stating outright, because both
 * are the kind a later session re-derives from instinct and gets wrong:
 *
 * 1. Nothing here reacts to scroll. Background, blur, height, transform and
 *    opacity were sampled at scrollY 0, 400, 1200 and 5000, scrolling both ways,
 *    and never moved. There is no scrolled or condensed state to add.
 * 2. The surface is `--nav-surface` over `--nav-blur`, not transparent. The
 *    fixed wrapper is the transparent part. See the note in `globals.css`.
 *
 * It is a Client Component because the phone menu is stateful and the header
 * itself is what changes when it opens - the same element grows to fill the
 * viewport and swaps its tint. Splitting the open state into a separate overlay
 * would mean rendering the brand row twice and keeping two surfaces in step.
 */

/** Everything the trap can land on. Filtered for what is actually rendered. */
const FOCUSABLE = 'a[href], button:not([disabled])'

type NavBarProps = {
  readonly links: readonly ContentLink[]
  readonly social: readonly ContentLink[]
  readonly logo: MediaImage
}

export function NavBar({ links, social, logo }: NavBarProps) {
  const [open, setOpen] = useState(false)
  const surface = useRef<HTMLElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)

  /* Every link inside the menu closes it on the way out. Client-side navigation
   * leaves the header mounted, so without this the menu would cover the page it
   * had just opened - and closing on the click beats reacting to the route
   * afterwards, which is a render caused by a render. */
  const close = useCallback(() => setOpen(false), [])

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
    const close = () => {
      if (wide.matches) setOpen(false)
    }

    wide.addEventListener('change', close)
    return () => wide.removeEventListener('change', close)
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
        toggle.current?.focus()
        return
      }
      if (event.key !== 'Tab') return

      /* `getClientRects()` rather than a visibility flag: the desktop links and
       * the menu's own links are both in the DOM at every width, and which set
       * is real is decided by CSS. */
      const items = [
        ...(surface.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
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

  return (
    <div className="fixed inset-x-0 top-0 z-[var(--nav-z-index)]">
      <header
        ref={surface}
        onKeyDown={onKeyDown}
        {...(open
          ? { role: 'dialog' as const, 'aria-modal': true, 'aria-label': 'Site menu' }
          : {})}
        className={
          open
            ? 'h-dvh overflow-y-auto bg-[var(--menu-surface)] backdrop-blur-[var(--menu-blur)]'
            : 'bg-[var(--nav-surface)] backdrop-blur-[var(--nav-blur)]'
        }
      >
        {/* Padding outside the rail, not inside it: the Reference measures 40px
         * of gutter and then a 1200px row, so a 1440px viewport puts the logo
         * at x=120. Nesting these the other way round costs 40px a side. */}
        <div className="px-3 py-5 tablet:px-5 desktop:px-10">
          <div className="mx-auto flex w-full max-w-shell flex-col gap-9">
            <div className="relative flex h-9 items-center justify-between tablet:h-[var(--button-height)]">
              <BrandLink logo={logo} onClick={close} />

              {/* Absolutely centred on the row, not spaced between the brand and
               * the actions: the Reference centres these on the viewport. */}
              <ul className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-4 tablet:flex">
                {links.map((link) => (
                  <li key={link.slug}>
                    <TextLink href={link.href}>{link.label}</TextLink>
                  </li>
                ))}
              </ul>

              <div className="hidden items-center gap-3 tablet:flex">
                <SocialLinks links={social} />
                <ButtonLink href="/bundle">Bundle</ButtonLink>
              </div>

              <button
                ref={toggle}
                type="button"
                aria-expanded={open}
                aria-label={open ? 'Close menu' : 'Open menu'}
                onClick={() => setOpen((wasOpen) => !wasOpen)}
                className="flex size-9 items-center justify-center text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text tablet:hidden"
              >
                {open ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>

            {open && (
              <>
                <ul className="flex flex-col items-start gap-7">
                  {links.map((link) => (
                    <li key={link.slug}>
                      <TextLink href={link.href} onClick={close}>
                        {link.label}
                      </TextLink>
                    </li>
                  ))}
                  <li>
                    <SocialLinks links={social} />
                  </li>
                </ul>
                <ButtonLink href="/bundle" className="w-full" onClick={close}>
                  Bundle
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>
    </div>
  )
}

function BrandLink({
  logo,
  onClick,
}: {
  readonly logo: MediaImage
  readonly onClick: () => void
}) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
    >
      {/* Decorative: the wordmark beside it already names the site, so alt text
       * here would announce it twice. PRD 6.14 covers why we author alt at all
       * rather than copy the Reference, which ships none. */}
      <Image
        src={logo.src}
        alt=""
        width={18}
        height={18}
        priority
        className="size-[18px] object-contain"
      />
      <span className="text-body font-medium text-text">Browser.supply</span>
    </Link>
  )
}
