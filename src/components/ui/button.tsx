import Link from 'next/link'

/*
 * The Reference's one button, measured in #9: height 46px, radius 48px, padding
 * 10px 20px, label `text-body` at `font-medium`. Height is set rather than left
 * to the padding because 10 + 25.6 + 10 is 45.6 and the Reference draws 46.
 *
 * Two variants, both measured: white on black text, and `--color-surface-2` on
 * white text. `bg-text` for a white button reads oddly, and it is deliberate -
 * the palette has exactly one white and one black, and minting `--color-white`
 * as a second name for `--color-text` is how two tokens drift apart later.
 */

export type ButtonVariant = 'primary' | 'secondary'

const SURFACE: Record<ButtonVariant, string> = {
  primary: 'bg-text text-bg',
  secondary: 'bg-surface-2 text-text',
}

const BASE =
  'inline-flex h-[var(--button-height)] items-center justify-center gap-2 rounded-button px-5 ' +
  'text-body font-medium whitespace-nowrap ' +
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text'

/** For the places that need the look on an element that is not a link. */
export function buttonClasses(variant: ButtonVariant = 'primary', extra = ''): string {
  return `${BASE} ${SURFACE[variant]} ${extra}`.trim()
}

type ButtonLinkProps = {
  readonly href: string
  readonly children: React.ReactNode
  readonly variant?: ButtonVariant
  readonly className?: string
  readonly onClick?: () => void
}

/**
 * A link that looks like a button. Internal hrefs are root-relative and go
 * through `next/link`; anything else leaves the site and gets a plain anchor,
 * which is the same split `href` enforces in the content schema.
 */
export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className = '',
  onClick,
}: ButtonLinkProps) {
  const classes = buttonClasses(variant, className)

  return href.startsWith('/') ? (
    <Link href={href} className={classes} onClick={onClick}>
      {children}
    </Link>
  ) : (
    <a href={href} className={classes} onClick={onClick}>
      {children}
    </a>
  )
}
