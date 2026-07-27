import Link from 'next/link'

/*
 * One rule, in one place: a root-relative href is ours and goes through
 * `next/link`; anything else leaves the site and gets a plain anchor.
 *
 * It is the same rule the content schema enforces on the data - `href` must
 * start with `/` or `https://` - which is why this is a shared seam rather than
 * a branch repeated in the text link and the button. `/templates` is a route;
 * the footer's Quiz and both social links are somebody else's.
 *
 * **Nothing is prefetched.** `next/link` fetches the payload of every internal
 * link that scrolls into view, which on this page is **seven requests** of the
 * initial load's budget (PRD section 8) - measured at 412px, where they were 7
 * of 55. Seven of the eight destinations are the placeholder routes #9 built,
 * which are a heading and a sentence; the eighth is `/templates`. Spending a
 * seventh of a 40-request budget to make a navigation nobody reviewing this page
 * will make feel instant is the wrong trade, and it is one line rather than a
 * per-caller decision because there is no link here it is right for.
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
    <Link href={href} prefetch={false} {...rest}>
      {children}
    </Link>
  ) : (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}
