import { SiteLink, type SiteLinkProps } from './site-link.tsx'

/*
 * The Reference's one button, measured in #9: radius 48px, padding 10px 20px,
 * label `text-body` at `font-medium`.
 *
 * The height is **not** set. #9 read it as 46px and pinned it there, having
 * noticed that 10 + 25.6 + 10 is 45.6; #10 re-measured it unrounded at 45.59,
 * so the 46 was the rounding and the padding was right all along. It is worth
 * the correction because the error is not local: every button sets the height
 * of the row it is in, so the hero's stacked pair pushed the whole page 0.82px
 * down the phone layout, and a diff cannot tell that from a layout mistake.
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
  'inline-flex items-center justify-center gap-2 rounded-button px-5 py-2.5 ' +
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
