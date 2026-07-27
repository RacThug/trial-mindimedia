import Image from 'next/image'
import { bylineRockStyle } from '@/components/motion/byline-rock.ts'
import { getLinks, type Link as ContentLink } from '@/lib/content'
import { media } from '@/lib/media'
import { SiteLink } from '../ui/site-link.tsx'
import { footerColumns } from './footer-columns.ts'
import { SocialLinks } from './social-links.tsx'
import { TextLink } from './text-link.tsx'

/*
 * The footer, measured in #9 at 1440, 810 and 390.
 *
 * Its shape is one rail (`max-w-rail`, the same 1200px the nav runs on) holding
 * two rows: the brand-and-links block, then the by-line bar. On phone every part
 * of it centres and the two link columns become one.
 *
 * Only the links are content. The tagline, the copyright and the by-line are
 * prose that appears once in one layout, which ADR-0004 calls markup rather than
 * a Collection - so they live here, verbatim from the Reference, rather than in
 * `links.json`.
 */
/*
 * The two prose links, drawn the Reference's way: white inside
 * `--color-text-muted` prose, no underline and no weight change, fading to 60%
 * white over 200ms on hover. All four values measured in #30.
 *
 * **This was underlined until #30 and the underline was a Deviation**, taken
 * because white against `--color-text-muted` is colour alone at 1.4:1 and a
 * reader who cannot tell those two greys apart cannot find the link. That
 * reasoning has not changed; the owner asked for the Reference's look here, and
 * a fidelity clone is the owner's call to make. What is kept is everything that
 * costs nothing at rest: the hover fade the Reference itself has, and a
 * focus-visible ring, so a keyboard user still sees where they are. The
 * Deviations register in the README records the removal rather than quietly
 * dropping the entry.
 *
 * Only prose links. The nav and the footer's own columns are standalone links
 * in a row of links, which is not the case this rule is about.
 */
const INLINE_LINK =
  'text-text transition-colors duration-200 ease-[cubic-bezier(0.44,0,0.56,1)] ' +
  'hover:text-text-hover ' +
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text'

/*
 * `text-wrap: balance`, measured on the Reference and easy to miss because it
 * only shows in where a line breaks.
 *
 * A census of its 204 headings and paragraphs found 140 balanced, 60 nowrap and
 * 4 plain - the balanced ones being every prose block including the H1, and the
 * nowrap ones every link and short label. Greedy wrapping put "premium" on the
 * first line of the phone tagline where the Reference reads
 * "Launch your online business with a / premium Framer website template.", with
 * its two lines 225px and 224px wide.
 *
 * It applies to every Section, not just here: a balanced H2 breaks nothing like
 * a greedy one, so #10 to #12 inherit this.
 */
const PROSE = 'text-balance'

export async function SiteFooter() {
  const links = await getLinks()
  const [firstColumn, secondColumn] = footerColumns(links.footer)

  return (
    <footer className="px-10">
      <div className="mx-auto w-full max-w-rail">
        <div className="flex flex-col items-center gap-8 px-5 py-10 tablet:flex-row tablet:items-start tablet:justify-between tablet:gap-0 tablet:px-0">
          <div className="flex flex-col items-center gap-4 tablet:flex-1 tablet:items-start">
            {/* The wordmark alone: the Reference drops the 18px logo here and
             * sets the name at the h5 step, so this is text rather than the
             * nav's image-plus-label pair.
             *
             * A `<p>`, not a heading. The Reference uses `<h5>`, but the
             * wordmark introduces no section - a heading element here would put
             * a contentless entry in the outline of every page on the site, and
             * the h5 in the token is a size. */}
            <p className={`text-h5 text-text ${PROSE}`}>Browser.supply</p>
            <p
              className={`w-[292px] text-center text-body-sm text-text-muted tablet:text-left tablet:text-body ${PROSE}`}
            >
              Launch your online business with a premium Framer website template.
            </p>
            <SocialLinks links={links.social} />
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-col items-center gap-6 tablet:flex-row tablet:items-start tablet:gap-14"
          >
            <FooterColumn links={firstColumn} />
            <FooterColumn links={secondColumn} />
          </nav>
        </div>

        {/* A 1px rule in `--color-surface-3` divides the two rows. `-mt-px`
         * because the Reference's own two blocks measure 254 and 72 against a
         * 326px footer - the line overlaps rather than adding to them. */}
        <div className="-mt-px flex flex-col items-center gap-7 border-t border-surface-3 p-5 text-body-sm text-text-muted tablet:flex-row tablet:justify-between tablet:px-0 tablet:py-5 tablet:text-body">
          <p className={`text-center tablet:text-left ${PROSE}`}>
            © 2026 browser.supply.{' '}
            <SiteLink href="https://framer.link/ramishdesign" className={INLINE_LINK}>
              Framer
            </SiteLink>{' '}
            website templates
          </p>

          {/* The row is 32px tall and the portrait is 38px, so it overflows by
           * 3px top and bottom. That is the Reference's own layout, and holding
           * the row to 32 is what keeps the bar at its measured 72. */}
          <p className="flex h-8 items-center gap-2">
            Created by
            <span className="flex items-center gap-2">
              {/* Decorative: the name is right beside it (PRD 6.14).
               *
               * It rocks, and never stops - see `byline-rock.ts` for the
               * measurement. The wrapper carries the animation rather than the
               * image so that `next/image` is free to write whatever it likes
               * into the `<img>`, and `-rotate-12` is what a visitor who has
               * asked for reduced motion is left with. */}
              <span
                className="-rotate-12 [animation:byline-rock_var(--byline-rock-duration)_var(--byline-rock-ease)_infinite] motion-reduce:[animation:none]"
                style={bylineRockStyle()}
              >
                <Image
                  src={media['avatar/ramish'].src}
                  alt=""
                  width={38}
                  height={38}
                  className="block size-[38px] rounded-[6px] object-cover"
                />
              </span>
              <SiteLink href="https://x.com/ramishdotdesign" className={INLINE_LINK}>
                Ramish Aziz
              </SiteLink>
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ links }: { readonly links: readonly ContentLink[] }) {
  return (
    <ul className="flex flex-col items-center gap-6 tablet:items-start">
      {links.map((link) => (
        <li key={link.slug}>
          <TextLink href={link.href}>{link.label}</TextLink>
        </li>
      ))}
    </ul>
  )
}
