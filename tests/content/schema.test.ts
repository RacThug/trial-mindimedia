import { describe, expect, it } from 'vitest'
import { ContentError, loadAllContent } from '../../src/lib/content/index.ts'
import { parseCollection } from '../../src/lib/content/parse.ts'
import {
  plansSchema,
  templatesSchema,
  testimonialsSchema,
  wallTilesSchema,
} from '../../src/lib/content/schema.ts'

/*
 * Issue #8's acceptance criterion is not "validation exists" but "invalid JSON
 * fails loudly with a useful message, rather than rendering undefined". A test
 * that only asserted `toThrow()` would pass against an error nobody can act on,
 * so these assert the *content* of the message: which file, which path, and what
 * was wrong - and that every problem is reported, not only the first.
 *
 * The accessors are lazy by design (see the module header), so a collection no
 * page happens to read would never be parsed during `next build`. That is the
 * one guarantee the build gives up and this file takes over: `loadAllContent`
 * parses all eight.
 */

const template = {
  slug: 'selene',
  name: 'Selene',
  category: 'AI SAAS',
  price: 12900,
  currency: 'USD',
  badge: null,
  href: '/templates/selene',
  screenshots: [{ slug: 'template/selene-a', alt: 'Selene' }],
}

describe('the real content files', () => {
  it('all parse, including the ones no page reads yet', async () => {
    await expect(loadAllContent()).resolves.toBeUndefined()
  })
})

describe('a failed parse', () => {
  it('names the file it came from', () => {
    expect(() =>
      parseCollection('templates.json', templatesSchema, [{ ...template, price: '129' }]),
    ).toThrowError(ContentError)

    try {
      parseCollection('templates.json', templatesSchema, [{ ...template, price: '129' }])
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as ContentError).message).toContain('templates.json')
      expect((error as ContentError).file).toBe('templates.json')
    }
  })

  it('reports every problem, not just the first', () => {
    const broken = [{ ...template, price: '129', name: '', href: 'templates/selene' }]

    try {
      parseCollection('templates.json', templatesSchema, broken)
      expect.unreachable('should have thrown')
    } catch (error) {
      const { issues, message } = error as ContentError
      expect(issues.length).toBeGreaterThanOrEqual(3)
      expect(message).toContain('[0].price')
      expect(message).toContain('[0].name')
      expect(message).toContain('[0].href')
    }
  })

  it('quotes an unknown media slug so it can be searched for', () => {
    try {
      parseCollection('wall-tiles.json', wallTilesSchema, ['wall/tile-99'])
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as ContentError).message).toContain(
        'unknown media slug "wall/tile-99"',
      )
    }
  })

  it('rejects a Placement naming someone absent from people', () => {
    const broken = {
      people: {
        nic: { name: 'Nic', quote: 'Good.', avatar: 'avatar/nic', rating: 5 },
      },
      grid: ['nic', 'davids'],
      wall: ['nic'],
    }

    try {
      parseCollection('testimonials.json', testimonialsSchema, broken)
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as ContentError).message).toContain('grid[1]')
      expect((error as ContentError).message).toContain('"davids" is not a key of people')
    }
  })

  it('rejects a rating outside 1 to 5', () => {
    const broken = {
      people: { nic: { name: 'Nic', quote: 'Good.', avatar: 'avatar/nic', rating: 6 } },
      grid: ['nic'],
      wall: ['nic'],
    }

    expect(() =>
      parseCollection('testimonials.json', testimonialsSchema, broken),
    ).toThrowError(/people\.nic\.rating/)
  })

  it('rejects a Plan whose Options have no single default', () => {
    const plan = {
      slug: 'single-template',
      eyebrow: 'One-time payemnt',
      name: 'Single template',
      price: 12900,
      compareAt: null,
      currency: 'USD',
      blurb: 'Pick one.',
      options: [
        { label: 'Framer template', priceDelta: 0, default: true, icon: 'framer' },
        { label: 'Add Figma designs', priceDelta: 3900, default: true, icon: 'figma' },
      ],
      included: [{ label: 'Instant access', icon: 'lightning' }],
      cta: { label: 'Browse templates', href: '/templates' },
    }

    expect(() => parseCollection('plans.json', plansSchema, [plan])).toThrowError(
      /exactly one Option must be default, found 2/,
    )
  })

  it('rejects a lone Option, which is not a choice', () => {
    const plan = {
      slug: 'bundle',
      eyebrow: 'one-time payment',
      name: 'Bundle',
      price: 39900,
      compareAt: null,
      currency: 'USD',
      blurb: 'Everything.',
      options: [{ label: 'Only one', priceDelta: 0, default: true, icon: 'framer' }],
      included: [{ label: 'All templates', icon: 'stack' }],
      cta: { label: 'Get the bundle', href: '/bundle' },
    }

    expect(() => parseCollection('plans.json', plansSchema, [plan])).toThrowError(
      /at least two/,
    )
  })

  it('rejects duplicate entity slugs', () => {
    expect(() =>
      parseCollection('templates.json', templatesSchema, [template, { ...template }]),
    ).toThrowError(/duplicate slug "selene"/)
  })

  it('rejects an empty collection', () => {
    expect(() => parseCollection('templates.json', templatesSchema, [])).toThrowError(
      ContentError,
    )
  })
})
