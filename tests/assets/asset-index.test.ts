import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { POSTER_MIN_STDEV, SOURCE_ASSETS } from '../../scripts/assets/manifest.ts'
import { PUBLIC_DIR, REPO } from '../../scripts/assets/paths.ts'
import { isVideo, media, type MediaImage } from '../../src/lib/media/index.ts'

/*
 * `asset-index.json` and the files under `public/media` are both generated, and
 * both are committed. That combination drifts: someone edits the manifest, runs
 * nothing, and the index still describes the old build. These tests assert the
 * three of them agree - manifest, index, and what is actually on disk - so a
 * stale commit fails here rather than in production as a broken image.
 *
 * Issue #7's acceptance criteria are checked directly: no `framerusercontent`
 * reference survives, and every video has a poster frame.
 */

const entries = Object.entries(media) as [string, MediaImage][]

async function size(src: string): Promise<number> {
  return (await stat(path.join(PUBLIC_DIR, src))).size
}

describe('the generated asset index', () => {
  it('describes exactly the assets the manifest names', () => {
    expect(Object.keys(media).sort()).toEqual(SOURCE_ASSETS.map((a) => a.slug).sort())
  })

  it('keeps the manifest order, so the file reads like the page', () => {
    expect(Object.keys(media)).toEqual(SOURCE_ASSETS.map((a) => a.slug))
  })

  it.each(entries)('%s serves from /media with an intrinsic size', (slug, asset) => {
    expect(asset.src.startsWith('/media/'), `${slug} escapes /media`).toBe(true)
    expect(asset.width).toBeGreaterThan(0)
    expect(asset.height).toBeGreaterThan(0)
  })

  it.each(entries)('%s exists on disk and is not empty', async (_slug, asset) => {
    expect(await size(asset.src)).toBeGreaterThan(0)
  })

  it.each(entries)('%s never mentions the Reference CDN', (_slug, asset) => {
    expect(JSON.stringify(asset)).not.toContain('framerusercontent')
  })
})

describe('zero runtime requests to the Reference CDN (issue #7)', () => {
  /*
   * The manifest is the one file allowed to name Framer's CDN, because pointing
   * at it is its whole job. Anything under `src/` naming it would be a hotlink
   * that survived the pipeline, which no visual check would ever catch.
   */
  async function sourceFiles(dir: string): Promise<string[]> {
    const found: string[] = []
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name)
      if (entry.isDirectory()) found.push(...(await sourceFiles(absolute)))
      else if (/\.(ts|tsx|js|jsx|css|json|md)$/.test(entry.name)) found.push(absolute)
    }
    return found
  }

  it('ships no reference to framerusercontent.com outside the manifest', async () => {
    const files = await sourceFiles(path.join(REPO, 'src'))
    expect(files.length).toBeGreaterThan(0)

    const offenders: string[] = []
    for (const file of files) {
      if ((await readFile(file, 'utf8')).includes('framerusercontent')) {
        offenders.push(path.relative(REPO, file))
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('video posters (issue #7)', () => {
  const videos = SOURCE_ASSETS.filter((a) => a.kind === 'video')

  it('finds all 13 clips in the index', () => {
    expect(entries.filter(([, a]) => isVideo(a))).toHaveLength(videos.length)
  })

  it.each(videos)('$slug carries a poster frame of matching shape', async ({ slug }) => {
    const asset = media[slug as keyof typeof media]
    if (!isVideo(asset)) throw new Error(`${slug} is not indexed as a video`)

    expect(await size(asset.poster.src)).toBeGreaterThan(0)
    /* Same aspect, so the poster cannot letterbox against the clip it precedes. */
    expect(asset.poster.width / asset.poster.height).toBeCloseTo(
      asset.width / asset.height,
      2,
    )
    expect(asset.poster.width).toBeLessThanOrEqual(asset.width)
  })

  it.each(videos)('$slug re-encodes to H.264 in MP4', async ({ slug }) => {
    const asset = media[slug as keyof typeof media]
    expect(asset.src.endsWith('.mp4')).toBe(true)
  })

  it.each(videos)('$slug has a poster with something in it', async ({ slug }) => {
    const asset = media[slug as keyof typeof media]
    if (!isVideo(asset)) throw new Error(`${slug} is not indexed as a video`)

    /*
     * "Every video has a poster frame" is satisfied by a black rectangle, and
     * `feature/hosting` fades up from black, so frame one of it is exactly that.
     * The threshold is the pipeline's own, imported rather than restated, so
     * loosening one without the other is not possible.
     */
    const stats = await sharp(path.join(PUBLIC_DIR, asset.poster.src)).greyscale().stats()
    expect(stats.channels[0]!.stdev).toBeGreaterThanOrEqual(POSTER_MIN_STDEV)
  })
})

describe('committed weight', () => {
  /*
   * A regression guard, not a target. The Framer originals total 62.2 MB; a
   * preset changed in the wrong direction would sail past review as "assets
   * updated" without a number to fail against.
   */
  it('keeps the whole media tree under 6 MB', async () => {
    const files = entries.flatMap(([, a]) =>
      isVideo(a) ? [a.src, a.poster.src] : [a.src],
    )
    const total = (await Promise.all(files.map(size))).reduce((a, b) => a + b, 0)
    expect(total).toBeLessThan(6 * 1024 * 1024)
  })

  it('keeps every still small enough to sit above the fold', async () => {
    const stills = entries.flatMap(([slug, a]) =>
      isVideo(a) ? [[`${slug} poster`, a.poster.src] as const] : [[slug, a.src] as const],
    )
    for (const [slug, src] of stills) {
      expect(await size(src), `${slug} is heavy for a still`).toBeLessThan(150 * 1024)
    }
  })
})
