import Link from 'next/link'

/*
 * One rule, in one place: a root-relative href is ours and goes through
 * `next/link`; anything else leaves the site and gets a plain anchor.
 *
 * It is the same rule the content schema enforces on the data - `href` must
 * start with `/` or `https://` - which is why this is a shared seam rather than
 * a branch repeated in the text link and the button. `/templates` is a route;
 * the footer's Quiz and both social links are somebody else's.
 */

export type SiteLinkProps = {
  readonly href: string
  readonly children: React.ReactNode
  readonly className?: string
  readonly onClick?: () => void
  /** Labels a control whose children are a glyph rather than text. */
  readonly 'aria-label'?: string
}

export function SiteLink({ href, children, ...rest }: SiteLinkProps) {
  return href.startsWith('/') ? (
    <Link href={href} {...rest}>
      {children}
    </Link>
  ) : (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}
