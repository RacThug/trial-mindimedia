import { describe, expect, it } from 'vitest'
import { MEDIA_GROUPS, SOURCE_ASSETS } from '../../scripts/assets/manifest.ts'

/*
 * The manifest is hand-written from a census of the Reference, so the failure
 * mode is a typo rather than a bug: two slugs that collide silently overwrite
 * each other in `public/media`, and a duplicated `id` commits the same bytes
 * twice. Neither breaks a build. Both are caught here.
 *
 * The counts are the census itself (PRD section 1, issue #7): 60 unique media
 * files, of which 13 are video.
 */

describe('the source manifest', () => {
  it('covers all 60 unique media files on the Reference', () => {
    expect(SOURCE_ASSETS).toHaveLength(60)
  })

  it('covers all 13 unique videos', () => {
    expect(SOURCE_ASSETS.filter((a) => a.kind === 'video')).toHaveLength(13)
  })

  it('gives every asset a unique slug', () => {
    const slugs = SOURCE_ASSETS.map((a) => a.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('downloads every Framer asset exactly once', () => {
    const ids = SOURCE_ASSETS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(SOURCE_ASSETS)('$slug points at the Reference CDN', (asset) => {
    expect(asset.url).toBe(`https://framerusercontent.com/${asset.id}`)
  })

  it.each(SOURCE_ASSETS)('$slug is named `group/name` in kebab case', (asset) => {
    const [group, name, ...rest] = asset.slug.split('/')
    expect(rest).toHaveLength(0)
    expect(MEDIA_GROUPS).toContain(group)
    expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it.each(SOURCE_ASSETS.filter((a) => a.kind !== 'verbatim'))(
    '$slug caps its committed width',
    (asset) => {
      expect(asset.maxWidth).toBeGreaterThan(0)
      /* Nothing on the Reference renders wider than the 1360px container. */
      expect(asset.maxWidth).toBeLessThanOrEqual(1360)
    },
  )

  it.each(SOURCE_ASSETS.filter((a) => a.kind === 'video'))(
    '$slug re-encodes at a sane rate',
    (asset) => {
      /* Below 18 the file stops shrinking; above 34 the artefacts show. */
      expect(asset.crf).toBeGreaterThanOrEqual(18)
      expect(asset.crf).toBeLessThanOrEqual(34)
      expect(asset.fps).toBeLessThanOrEqual(30)
    },
  )

  it.each(SOURCE_ASSETS.filter((a) => a.kind === 'image'))(
    '$slug re-encodes at a quality that survives a second pass',
    (asset) => {
      /* `next/image` re-encodes on top of this, so the source stays generous. */
      expect(asset.quality).toBeGreaterThanOrEqual(85)
      expect(asset.quality).toBeLessThanOrEqual(95)
    },
  )

  it('copies only formats that re-encoding cannot improve', () => {
    const verbatim = SOURCE_ASSETS.filter((a) => a.kind === 'verbatim')
    expect(verbatim.map((a) => a.slug).sort()).toEqual([
      'brand/chevron-left',
      'brand/chevron-right',
      'brand/favicon-dark',
      'brand/favicon-light',
    ])
    for (const asset of verbatim) expect(asset.id.endsWith(`.${asset.ext}`)).toBe(true)
  })

  it('keeps the Template Wall in one numbered run, whatever the tile kind', () => {
    const wall = SOURCE_ASSETS.filter((a) => a.slug.startsWith('wall/'))
    expect(wall.map((a) => a.slug)).toEqual(
      Array.from({ length: 16 }, (_, i) => `wall/tile-${String(i + 1).padStart(2, '0')}`),
    )
  })
})
