import Link from 'next/link'

/*
 * The shell's plain text link: nav, phone menu and footer all measure the same
 * `text-body` at `font-medium` in `--color-text`.
 *
 * It also owns the internal-or-external split. Root-relative hrefs go through
 * `next/link` and anything else gets a plain anchor, mirroring the rule the
 * content schema enforces on the data - `/templates` is ours, the footer's Quiz
 * and both social links are not.
 */

type TextLinkProps = {
  readonly href: string
  readonly children: React.ReactNode
  readonly className?: string
  readonly onClick?: () => void
}

const CLASSES =
  'text-body font-medium text-text ' +
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text'

export function TextLink({ href, children, className = '', onClick }: TextLinkProps) {
  const classes = `${CLASSES} ${className}`.trim()

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
