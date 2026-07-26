import type { Link } from '@/lib/content'

/** Where the Reference breaks its footer links: four in the first column. */
const FIRST_COLUMN = 4

/**
 * The footer's two columns.
 *
 * `links.json` stores seven footer links in one ordered list, because which
 * column a link sits in is layout and not content (ADR-0004) - the same seven
 * stack into a single centred column on phone, where the split does not exist at
 * all. The grouping is measured, so it is asserted in a test rather than assumed
 * here.
 */
export function footerColumns(
  links: readonly Link[],
): readonly [readonly Link[], readonly Link[]] {
  return [links.slice(0, FIRST_COLUMN), links.slice(FIRST_COLUMN)]
}
