import { SiteLink, type SiteLinkProps } from '../ui/site-link.tsx'

/*
 * The shell's plain text link: nav, phone menu and footer all measure the same
 * `text-body` at `font-medium` in `--color-text` (#9).
 *
 * `SiteLink` underneath it owns the internal-or-external split, so this file is
 * only the styling.
 */

const CLASSES =
  'text-body font-medium text-text ' +
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text'

export function TextLink({ children, ...rest }: Omit<SiteLinkProps, 'className'>) {
  return (
    <SiteLink {...rest} className={CLASSES}>
      {children}
    </SiteLink>
  )
}
