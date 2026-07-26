import { describe, expect, it } from 'vitest'
import * as plans from '../../src/app/api/plans/route.ts'
import * as templates from '../../src/app/api/templates/route.ts'
import * as testimonials from '../../src/app/api/testimonials/route.ts'
import { getPlans, getTemplates, getTestimonials } from '../../src/lib/content/index.ts'

/*
 * The handlers are called directly rather than fetched from a running server:
 * the E2E stage in #14 owns real requests, and what matters here is the contract
 * - status, content type, and that the body is exactly what the data layer
 * exports. That last assertion is the property ADR-0002 leans on. The homepage
 * imports the module while `/templates` fetches this endpoint, and the whole
 * asymmetry is only safe while both paths return the same thing.
 */

const ROUTES = [
  { name: '/api/templates', route: templates },
  { name: '/api/testimonials', route: testimonials },
  { name: '/api/plans', route: plans },
]

describe.each(ROUTES)('$name', ({ route }) => {
  it('answers 200 with JSON', async () => {
    const response = await route.GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('is prerendered into the build rather than computed per request', () => {
    expect(route.dynamic).toBe('force-static')
  })

  it('exports GET only, leaving other methods to Next’s own 405', () => {
    expect(Object.keys(route).filter((key) => key === key.toUpperCase())).toEqual(['GET'])
  })
})

describe('/api/templates', () => {
  it('returns the collection the data layer exports', async () => {
    const body = await (await templates.GET()).json()
    expect(body).toEqual(JSON.parse(JSON.stringify(await getTemplates())))
  })

  it('resolves media, so a client needs no asset index', async () => {
    const [selene] = await (await templates.GET()).json()

    expect(selene.screenshots[0].src).toMatch(/^\/media\/template\/selene-a\./)
    expect(selene.screenshots[0].width).toBeGreaterThan(0)
    expect(selene.screenshots[0].height).toBeGreaterThan(0)
  })
})

describe('/api/testimonials', () => {
  it('returns the twelve people flat, each once', async () => {
    const body = await (await testimonials.GET()).json()
    const { all } = await getTestimonials()

    expect(body).toHaveLength(12)
    expect(body).toEqual(JSON.parse(JSON.stringify(all)))
    expect(new Set(body.map((person: { slug: string }) => person.slug)).size).toBe(12)
  })

  it('states Placement rather than duplicating the shared three', async () => {
    const body: { slug: string; placements: { block: string; index: number }[] }[] =
      await (await testimonials.GET()).json()

    const nic = body.find((person) => person.slug === 'nic')
    expect(nic?.placements).toEqual([
      { block: 'grid', index: 0 },
      { block: 'wall', index: 4 },
    ])

    const jacob = body.find((person) => person.slug === 'jacob')
    expect(jacob?.placements).toEqual([{ block: 'wall', index: 0 }])
  })
})

describe('/api/plans', () => {
  it('returns prices in minor units with the Option deltas', async () => {
    const body = await (await plans.GET()).json()

    expect(body).toEqual(JSON.parse(JSON.stringify(await getPlans())))
    expect(body[0].price).toBe(12900)
    expect(body[0].options[1]).toEqual({
      label: 'Add Figma designs',
      priceDelta: 3900,
      default: false,
    })
  })
})
