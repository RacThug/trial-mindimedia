'use client'

import Image from 'next/image'
import type { Link as ContentLink } from '@/lib/content'
import type { MediaImage } from '@/lib/media'
import { CloseIcon, MenuIcon } from '../icons.tsx'
import { ButtonLink } from '../ui/button.tsx'
import { SiteLink } from '../ui/site-link.tsx'
import { SocialLinks } from './social-links.tsx'
import { TextLink } from './text-link.tsx'
import { useMenu } from './use-menu.ts'

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
 * The behaviour behind that state lives in `use-menu.ts`.
 */

type NavBarProps = {
  readonly links: readonly ContentLink[]
  readonly social: readonly ContentLink[]
  readonly logo: MediaImage
}

export function NavBar({ links, social, logo }: NavBarProps) {
  const { open, close, toggle, surfaceRef, controlRef, onKeyDown } = useMenu()

  return (
    <div className="fixed inset-x-0 top-0 z-[var(--nav-z-index)]">
      <header
        ref={surfaceRef}
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
          <div className="mx-auto flex w-full max-w-rail flex-col gap-9">
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
                ref={controlRef}
                type="button"
                aria-expanded={open}
                aria-label={open ? 'Close menu' : 'Open menu'}
                onClick={toggle}
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
    <SiteLink
      href="/"
      onClick={onClick}
      className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
    >
      {/* Decorative: the wordmark beside it already names the site, so alt text
       * here would announce it twice. PRD 6.14 records the reasoning. */}
      <Image
        src={logo.src}
        alt=""
        width={18}
        height={18}
        priority
        className="size-[18px] object-contain"
      />
      <span className="text-body font-medium text-text">Browser.supply</span>
    </SiteLink>
  )
}
