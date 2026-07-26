import type { Link as ContentLink } from '@/lib/content'
import { SOCIAL_ICONS } from '../icons.tsx'
import { SiteLink } from '../ui/site-link.tsx'

/*
 * The X and YouTube pair, which the Reference shows three times: in the nav, in
 * the open phone menu, and in the footer. Same 8px gap and same 5px hit-area
 * padding in all three (#9), so it is one component rather than three copies.
 *
 * The glyph is chosen by slug, and a social link whose slug has no glyph renders
 * nothing rather than an empty box - `getLinks().social` is content and can grow
 * without this file, and a hole in a row of icons is the wrong way to find out.
 * The lookup is `undefined` in the type system for exactly that reason.
 */
export function SocialLinks({ links }: { readonly links: readonly ContentLink[] }) {
  return (
    <div className="flex items-center gap-2">
      {links.map((link) => {
        const Icon = SOCIAL_ICONS[link.slug]
        return Icon ? (
          <SiteLink
            key={link.slug}
            href={link.href}
            aria-label={link.label}
            className="flex items-center justify-center p-[5px] text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          >
            <Icon />
          </SiteLink>
        ) : null
      })}
    </div>
  )
}
