import { SiteLink, type SiteLinkProps } from '../ui/site-link.tsx'

/*
 * The shell's plain text link: nav, phone menu and footer all measure the same
 * `text-body` at `font-medium` in `--color-text` (#9).
 *
 * `SiteLink` underneath it owns the internal-or-external split, so this file is
 * only the styling.
 */

/* `text-nowrap` is measured, not defensive: every link and short label in the
 * Reference's nav and footer computes `text-wrap: nowrap`, so `Live examples`
 * never becomes two lines however narrow the column gets. See the note on
 * `text-wrap` in `site-footer.tsx`. */
const CLASSES =
  'text-body font-medium text-nowrap text-text ' +
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text'

export function TextLink({ children, ...rest }: Omit<SiteLinkProps, 'className'>) {
  return (
    <SiteLink {...rest} className={CLASSES}>
      {children}
    </SiteLink>
  )
}
