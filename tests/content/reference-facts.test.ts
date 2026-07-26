import { describe, expect, it } from 'vitest'
import {
  formatMoney,
  getFeatures,
  getLinks,
  getPlans,
  getStats,
  getSteps,
  getTemplates,
  getTestimonials,
  getWallTiles,
} from '../../src/lib/content/index.ts'

/*
 * These assert facts about the *Reference*, not rules of the model - which is why
 * they live apart from `schema.test.ts` and why the file is named for what it
 * pins. Adding a tenth Testimonial or a fourth Template is allowed by the schema
 * and will fail here, and that is the intended behaviour: it means someone is
 * moving away from the measured Reference, which is a decision that should be
 * deliberate rather than silent. Update the number and the Deviation together.
 *
 * The typos are the sharp edge. `custmize`, `The templates is so well designed`
 * and `One-time payemnt` are the Reference's own and are content, not defects
 * (PRD 6.7, 6.9). A spellchecker, an editor's good intentions, or a future
 * session's tidying would otherwise quietly cost fidelity.
 */

/** Index into a collection, failing the assertion rather than the type checker. */
function at<T>(items: readonly T[], index: number): T {
  const item = items[index]
  if (item === undefined) throw new Error(`nothing at index ${index}`)
  return item
}

describe('Templates (PRD 6.4)', () => {
  it('are the measured three, at $129 each, with NEW on Selene only', async () => {
    const templates = await getTemplates()

    expect(templates.map((t) => t.name)).toEqual(['Selene', 'Zenna', 'Traction'])
    expect(templates.map((t) => t.category)).toEqual(['AI SAAS', 'Yoga Studio', 'SMMA'])
    expect(templates.every((t) => t.price === 12900 && t.currency === 'USD')).toBe(true)
    expect(templates.map((t) => t.badge)).toEqual(['New', null, null])
  })

  it('each carry two screenshots, not one', async () => {
    const templates = await getTemplates()
    expect(templates.map((t) => t.screenshots.length)).toEqual([2, 2, 2])
  })

  it('store DOM casing, so CSS does the uppercasing', async () => {
    const selene = at(await getTemplates(), 0)
    expect(selene.badge).toBe('New')
    expect(selene.badge).not.toBe('NEW')
  })
})

describe('Testimonials (PRD 6.7)', () => {
  it('are twelve people, nine in the grid and six over the Wall', async () => {
    const { all, grid, wall } = await getTestimonials()

    expect(all).toHaveLength(12)
    expect(grid).toHaveLength(9)
    expect(wall).toHaveLength(6)
  })

  it('share exactly three people between the two blocks', async () => {
    const { all } = await getTestimonials()
    const shared = all.filter((person) => person.placements.length === 2)

    expect(shared.map((person) => person.slug).sort()).toEqual(['aba', 'mark', 'nic'])
  })

  it('keep the measured grid order', async () => {
    const { grid } = await getTestimonials()

    expect(grid.map((person) => person.name)).toEqual([
      'Nic',
      'Renan',
      'Emon',
      'Widya',
      'Dávid',
      'Mark',
      'Samar',
      'Aba',
      'Nonso',
    ])
  })

  it('keep the measured Wall order, which is not the order the PRD lists', async () => {
    const { wall } = await getTestimonials()

    expect(wall.map((person) => person.name)).toEqual([
      'Jacob',
      'Mark',
      'Aba',
      'Roni',
      'Nic',
      'Seyed',
    ])
  })

  it('reproduce the Reference typos verbatim - these are content, not defects', async () => {
    const { all } = await getTestimonials()
    const quote = (slug: string) => all.find((person) => person.slug === slug)?.quote

    expect(quote('mark')).toBe(
      'The design is clean, easy to custmize, professional, and versatile.',
    )
    expect(quote('samar')).toBe(
      'The templates is so well designed and has a unique look to them.',
    )
  })

  it('keep the accent on Dávid and a straight apostrophe in the quotes', async () => {
    const { all } = await getTestimonials()
    const person = (slug: string) => all.find((entry) => entry.slug === slug)

    expect(person('david')?.name).toBe('Dávid')
    expect(person('emon')?.quote).toContain("it's")
    expect(person('nonso')?.quote).toContain("I've")
  })

  it('are all five stars', async () => {
    const { all } = await getTestimonials()
    expect(all.every((person) => person.rating === 5)).toBe(true)
  })
})

describe('the Template Wall (PRD 6.3)', () => {
  it('is sixteen unique tiles, ten images and six clips', async () => {
    const tiles = await getWallTiles()

    expect(tiles).toHaveLength(16)
    expect(tiles.filter((tile) => tile.kind === 'image')).toHaveLength(10)
    expect(tiles.filter((tile) => tile.kind === 'video')).toHaveLength(6)
  })

  it('carries an aspect ratio on every tile, or the grid wrecks CLS', async () => {
    const tiles = await getWallTiles()
    expect(tiles.every((tile) => Number.isFinite(tile.aspect) && tile.aspect > 0)).toBe(
      true,
    )
  })

  it('is decorative, so no tile carries alt text', async () => {
    const tiles = await getWallTiles()
    expect(tiles.every((tile) => !('alt' in tile))).toBe(true)
  })

  it('gives every clip a poster, since preload is none', async () => {
    const tiles = await getWallTiles()
    const clips = tiles.filter((tile) => tile.kind === 'video')
    expect(clips.every((clip) => clip.poster !== undefined)).toBe(true)
  })
})

describe('Plans (PRD 6.9)', () => {
  it('are the measured three prices', async () => {
    const plans = await getPlans()

    expect(plans.map((plan) => plan.name)).toEqual([
      'Single template',
      'Bundle',
      'Custom project',
    ])
    expect(plans.map((plan) => plan.price)).toEqual([12900, 39900, 249500])
    expect(plans.map((plan) => plan.compareAt)).toEqual([null, 188100, null])
  })

  it('render as the Reference shows them, commas and all', async () => {
    const plans = await getPlans()

    expect(formatMoney(at(plans, 0).price)).toBe('$129')
    expect(formatMoney(at(plans, 1).compareAt ?? 0)).toBe('$1,881')
    expect(formatMoney(at(plans, 2).price)).toBe('$2,495')
  })

  it('reproduce ONE-TIME PAYEMNT on the first card only, in DOM casing', async () => {
    const plans = await getPlans()

    expect(plans.map((plan) => plan.eyebrow)).toEqual([
      'One-time payemnt',
      'one-time payment',
      'one-time payment',
    ])
  })

  it('carry the measured Option deltas, with Multi-page site unpriced', async () => {
    const plans = await getPlans()

    expect(
      at(plans, 0).options.map((option) => [option.label, option.priceDelta]),
    ).toEqual([
      ['Framer template', 0],
      ['Add Figma designs', 3900],
      ['Add Done-for you', 37000],
    ])
    expect(at(plans, 1).options).toEqual([])
    expect(at(plans, 2).options.map((option) => option.priceDelta)).toEqual([0, 0])
  })

  it('default to the Reference selection, so an at-rest diff is identical', async () => {
    const plans = await getPlans()

    for (const plan of plans.filter((entry) => entry.options.length > 0)) {
      expect(plan.options.findIndex((option) => option.default)).toBe(0)
    }
  })

  it('list the INCLUDED items measured on each card', async () => {
    const plans = await getPlans()
    expect(plans.map((plan) => plan.included.length)).toEqual([5, 7, 3])
  })
})

describe('the rest of the page', () => {
  it('has five feature cards, three steps, and eight thumbnails in step one', async () => {
    const [features, steps] = await Promise.all([getFeatures(), getSteps()])

    expect(features).toHaveLength(5)
    expect(steps).toHaveLength(3)
    expect(at(steps, 0).media).toHaveLength(8)
    expect(steps.slice(1).map((step) => step.media.length)).toEqual([1, 1])
  })

  it('gives every meaningful visual a text alternative', async () => {
    const [features, steps, templates] = await Promise.all([
      getFeatures(),
      getSteps(),
      getTemplates(),
    ])

    const alts = [
      ...features.map((feature) => feature.media.alt),
      ...steps.flatMap((step) => step.media.map((item) => item.alt)),
      ...templates.flatMap((template) => template.screenshots.map((shot) => shot.alt)),
    ]

    expect(alts).toHaveLength(5 + 10 + 6)
    expect(alts.every((alt) => alt.trim().length > 0)).toBe(true)
  })

  it('has the four founder stats as display strings, not money', async () => {
    const stats = await getStats()

    expect(stats.map((stat) => stat.value)).toEqual(['6+', '100+', '$100k+', '2,000+'])
    expect(stats.map((stat) => stat.label)).toEqual([
      'Years building sites',
      'Websites made',
      'Revenue made in Framer',
      'Templates sold',
    ])
  })

  it('has four nav links, seven footer links and two social links', async () => {
    const links = await getLinks()

    expect(links.nav).toHaveLength(4)
    expect(links.footer).toHaveLength(7)
    expect(links.social).toHaveLength(2)
    expect(links.nav.map((link) => link.label)).toEqual([
      'Templates',
      'Live examples',
      'Support',
      'Blog',
    ])
  })
})
