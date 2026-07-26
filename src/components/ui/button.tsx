import { SiteLink, type SiteLinkProps } from './site-link.tsx'

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

type ButtonLinkProps = SiteLinkProps & { readonly variant?: ButtonVariant }

/** A link that looks like a button. */
export function ButtonLink({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: ButtonLinkProps) {
  return (
    <SiteLink {...rest} className={buttonClasses(variant, className)}>
      {children}
    </SiteLink>
  )
}
