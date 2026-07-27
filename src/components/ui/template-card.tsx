import Image from 'next/image'
import type { Template } from '@/lib/content'
import { formatMoney } from '@/lib/content/money.ts'
import { SiteLink } from './site-link.tsx'

/*
 * A Template card (PRD 6.4), measured in #10 at all three Breakpoints.
 *
 * The screenshot sits in a 4:3 box with a 12px radius, then 20px down to a
 * 70px block of [title row, meta row] 16px apart. The title row is the name
 * beside its badge; the meta row is category, a bullet, then the price and its
 * currency 4px apart. Everything below the screenshot is the Eyebrow step in
 * `--color-text-muted`, uppercased by CSS from the sentence case the content
 * stores - `New`, `Yoga Studio` (PRD 6.4).
 *
 * **Each card carries two screenshots, not one.** Both are in the Reference's
 * markup, stacked in the same box, which is what the second one is for: it is
 * revealed on hover. The Reference's own hover treatment was never isolated
 * (PRD section 10), so the crossfade is ours - the second image is measured,
 * the 300ms is not.
 *
 * The second one is drawn only where a pointer can hover. A phone has no way to
 * reach it and downloaded all three anyway - 59 kB and 3 requests of PRD section
 * 8's budget, measured at 412px - because an image is lazy, not conditional, and
 * Chrome starts a lazy image well before it is on screen. `display: none` is
 * what actually stops the fetch; `opacity: 0` never did.
 *
 * Shared with `/templates`, which renders the same card from what the API
 * returns. It takes `sizes` rather than assuming one, because the same card is
 * 387px wide in the featured row and 45vw in that catalogue.
 */

type TemplateCardProps = {
  readonly template: Template
  /** The card's measured render width per Breakpoint, for `next/image`. */
  readonly sizes: string
  /**
   * The name's heading level. It is a prop because the level depends on what is
   * above the card on the page, not on the card: `h3` under the featured
   * Section's `h2`, `h2` on `/templates` where the page heading is the `h1`.
   * The Reference marks every one of these `h5` regardless, which skips two
   * levels and is exactly what the axe scan in section 9 exists to catch.
   */
  readonly headingLevel?: 'h2' | 'h3'
}

export function TemplateCard({ template, sizes, headingLevel }: TemplateCardProps) {
  const [front, back] = template.screenshots
  const Heading = headingLevel ?? 'h3'

  return (
    <SiteLink
      href={template.href}
      className="group flex flex-col gap-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface-1">
        {front && (
          <Image
            src={front.src}
            alt={front.alt}
            fill
            sizes={sizes}
            className="object-cover"
          />
        )}
        {back && (
          <Image
            src={back.src}
            alt=""
            fill
            sizes={sizes}
            className="hidden object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 [@media(hover:hover)]:block"
          />
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Heading className="text-h5">{template.name}</Heading>
          {template.badge && (
            <span className="rounded-badge bg-[image:var(--badge-surface-green)] px-2 py-1 text-eyebrow text-accent-green uppercase">
              {template.badge}
            </span>
          )}
        </div>

        <p className="flex items-center gap-4 text-eyebrow text-text-muted uppercase">
          <span>{template.category}</span>
          <span aria-hidden="true">&bull;</span>
          <span className="flex items-center gap-1">
            <span>{formatMoney(template.price, template.currency)}</span>
            <span>{template.currency}</span>
          </span>
        </p>
      </div>
    </SiteLink>
  )
}
