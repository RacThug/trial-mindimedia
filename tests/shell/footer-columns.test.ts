import { describe, expect, it } from 'vitest'
import { footerColumns } from '../../src/components/shell/footer-columns.ts'
import { getLinks } from '../../src/lib/content/index.ts'

/*
 * The one seam in the shell that is logic rather than markup, and the reason it
 * exists: the footer's two columns are a layout grouping, so ADR-0004 keeps them
 * out of `links.json` and the component does the splitting. That leaves a rule -
 * four then three, in authored order - which is a measured fact about the
 * Reference and belongs in a test rather than in a comment above a `.slice(4)`.
 *
 * Component and snapshot tests stay out of scope (PRD section 9). This asserts
 * the grouping, not the markup that renders it.
 */

describe('the footer columns (PRD 6.12)', () => {
  it('splits the measured seven into four then three, in authored order', async () => {
    const { footer } = await getLinks()
    const [first, second] = footerColumns(footer)

    expect(first.map((link) => link.label)).toEqual([
      'Templates',
      'Live examples',
      'Bundle',
      'Blog',
    ])
    expect(second.map((link) => link.label)).toEqual(['Quiz', 'Support', 'Privacy'])
  })

  it('places every link exactly once, whatever the content grows to', () => {
    const links = Array.from({ length: 9 }, (_, index) => ({
      slug: `link-${index}`,
      label: `Link ${index}`,
      href: `/link-${index}`,
    }))

    const [first, second] = footerColumns(links)

    expect([...first, ...second]).toEqual(links)
    expect(first).toHaveLength(4)
    expect(second).toHaveLength(5)
  })

  it('leaves the second column empty rather than failing on short content', () => {
    const [first, second] = footerColumns([
      { slug: 'a', label: 'A', href: '/a' },
      { slug: 'b', label: 'B', href: '/b' },
    ])

    expect(first).toHaveLength(2)
    expect(second).toEqual([])
  })
})
