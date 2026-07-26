import { ButtonLink } from './button.tsx'

/*
 * Every off-page link on the Reference points somewhere real, so every one of
 * them lands here rather than on a 404 or a dead `href="#"`. PRD section 12 puts
 * a real templates catalogue, quiz, blog and checkout out of scope, so what each
 * route owes a visitor is an honest statement of that plus a way back.
 *
 * Deliberately not the Reference's own type scale for a hero: these pages have
 * no Reference to match, so they use the measured tokens at the sizes that suit
 * a short page instead of pretending to a Fidelity they cannot be judged on.
 */

type PlaceholderPageProps = {
  readonly eyebrow: string
  readonly title: string
  readonly children: React.ReactNode
  /** Replaces the default "Back to the homepage" button when a page needs its own. */
  readonly action?: React.ReactNode
}

export function PlaceholderPage({
  eyebrow,
  title,
  children,
  action,
}: PlaceholderPageProps) {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-shell flex-col items-center justify-center gap-6 px-5 pt-[var(--nav-height-phone)] pb-20 text-center tablet:pt-[var(--nav-height)] desktop:px-10">
      <p className="text-eyebrow uppercase text-accent-blue">{eyebrow}</p>
      <h1 className="text-h3 text-text tablet:text-h2">{title}</h1>
      <p className="max-w-[520px] text-body text-text-muted">{children}</p>
      {action ?? <ButtonLink href="/">Back to the homepage</ButtonLink>}
    </main>
  )
}
