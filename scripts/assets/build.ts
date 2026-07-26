/*
 * The asset pipeline (issue #7).
 *
 *   npm run assets
 *
 * Downloads every file the Reference serves from `framerusercontent.com`,
 * re-encodes it, writes it under `public/media`, and regenerates
 * `src/lib/media/asset-index.json` so the rest of the app can reach an asset by
 * slug with its intrinsic size attached.
 *
 * Downloads are cached in `.cache/framer` (gitignored). Re-running is cheap and
 * deterministic: the same manifest produces the same bytes, so a clean tree
 * after a run means the committed assets match the manifest.
 *
 * The originals total 62.2 MB, which is why nothing here is a straight copy of
 * what Framer serves.
 */

import { execFile } from 'node:child_process'
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import ffmpegPath from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'
import sharp from 'sharp'
import type { MediaAsset, MediaImage } from '../../src/lib/media/types.ts'
import {
  POSTER_MIN_STDEV,
  SOURCE_ASSETS,
  type SourceAsset,
  type SourceImage,
  type SourceVerbatim,
  type SourceVideo,
} from './manifest.ts'
import { CACHE, INDEX_FILE, PUBLIC_MEDIA, mediaKey, publicUrl } from './paths.ts'

const run = promisify(execFile)

/** Every file this run wrote, keyed by path under `public/media`, with its size. */
const written = new Map<string, number>()

async function recordWritten(absolute: string): Promise<void> {
  const { size } = await stat(absolute)
  written.set(mediaKey(absolute), size)
}

/* -------------------------------------------------------------------------- */
/* download                                                                    */
/* -------------------------------------------------------------------------- */

async function download(asset: SourceAsset): Promise<string> {
  const cached = path.join(CACHE, asset.id)
  try {
    await stat(cached)
    return cached
  } catch {
    /* Not cached yet. */
  }

  const response = await fetch(asset.url)
  if (!response.ok) {
    throw new Error(`${asset.slug}: ${asset.url} returned ${response.status}`)
  }
  const body = Buffer.from(await response.arrayBuffer())

  const declared = Number(response.headers.get('content-length'))
  if (declared && declared !== body.byteLength) {
    throw new Error(
      `${asset.slug}: got ${body.byteLength} bytes of a declared ${declared}`,
    )
  }

  /*
   * Written beside the target and renamed, because the cache is trusted on
   * existence alone. A fetch that dies mid-body would otherwise leave a
   * truncated file that every later run happily reuses, and the damage would
   * surface as an image that decodes short rather than as a failure.
   */
  await mkdir(path.dirname(cached), { recursive: true })
  const partial = `${cached}.partial`
  await writeFile(partial, body)
  await rename(partial, cached)
  return cached
}

/* -------------------------------------------------------------------------- */
/* images                                                                      */
/* -------------------------------------------------------------------------- */

async function encodeImage(asset: SourceImage, source: string): Promise<MediaImage> {
  const out = path.join(PUBLIC_MEDIA, `${asset.slug}.${asset.format}`)
  await mkdir(path.dirname(out), { recursive: true })

  const pipeline = sharp(source).resize({
    width: asset.maxWidth,
    /* The cap is a ceiling, never a target: upscaling would invent detail. */
    withoutEnlargement: true,
  })
  const info =
    asset.format === 'webp'
      ? await pipeline.webp({ quality: asset.quality, effort: 6 }).toFile(out)
      : await pipeline.jpeg({ quality: asset.quality, mozjpeg: true }).toFile(out)

  await recordWritten(out)
  return { src: publicUrl(out), width: info.width, height: info.height }
}

/* -------------------------------------------------------------------------- */
/* video                                                                       */
/* -------------------------------------------------------------------------- */

/*
 * `ffmpeg-static` resolves to null on a platform it has no build for. Failing
 * here names the reason; letting it through would surface as `spawn null`.
 */
if (!ffmpegPath) throw new Error('ffmpeg-static has no binary for this platform')
const ffmpeg = ffmpegPath
const ffprobe = ffprobeStatic.path

type Probe = { width: number; height: number; duration: number }

async function probe(file: string): Promise<Probe> {
  const { stdout } = await run(ffprobe, [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height',
    '-show_entries',
    'format=duration',
    '-of',
    'json',
    file,
  ])
  const parsed = JSON.parse(stdout)
  const stream = parsed.streams?.[0]
  if (!stream?.width || !stream?.height) throw new Error(`no video stream in ${file}`)
  return {
    width: stream.width,
    height: stream.height,
    duration: Number(parsed.format?.duration) || 0,
  }
}

/** Rounds down to an even number: yuv420p cannot represent odd dimensions. */
const even = (n: number) => Math.max(2, Math.floor(n / 2) * 2)

async function encodeVideo(asset: SourceVideo, source: string): Promise<MediaAsset> {
  const out = path.join(PUBLIC_MEDIA, `${asset.slug}.mp4`)
  await mkdir(path.dirname(out), { recursive: true })

  const original = await probe(source)
  const width = even(Math.min(asset.maxWidth, original.width))

  /*
   * `-an` on every clip: all thirteen are muted on the Reference, and two ship
   * an audio track no one ever hears. `+faststart` moves the moov atom to the
   * front so playback can begin before the file has finished arriving.
   */
  await run(ffmpeg, [
    '-y',
    '-i',
    source,
    '-an',
    '-vf',
    `scale=${width}:-2:flags=lanczos,fps=${asset.fps}`,
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    String(asset.crf),
    '-profile:v',
    'high',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    out,
  ])
  await recordWritten(out)

  const encoded = await probe(out)
  const still = await posterFrame(asset.slug, out, encoded.duration)
  const poster = path.join(PUBLIC_MEDIA, `${asset.slug}.poster.webp`)
  const posterInfo = await sharp(still)
    .resize({ width: Math.min(width, POSTER_MAX_WIDTH), withoutEnlargement: true })
    .webp({ quality: 72, effort: 6 })
    .toFile(poster)
  await recordWritten(poster)

  return {
    src: publicUrl(out),
    width: encoded.width,
    height: encoded.height,
    poster: {
      src: publicUrl(poster),
      width: posterInfo.width,
      height: posterInfo.height,
    },
  }
}

/*
 * A poster is a placeholder, not the artwork: it is on screen only until the
 * clip decodes. 720px covers the widest player on the page at DPR 1 and every
 * Template Wall tile at DPR 2.
 */
const POSTER_MAX_WIDTH = 720

/*
 * Where to look for a poster, as a fraction of the clip. Frame one comes first
 * and wins for twelve of the thirteen: a poster that is not frame one shows a
 * jump the moment playback starts, so it is a fallback, not a default.
 *
 * `feature/hosting` is why the fallback exists. It fades up from black, so its
 * first frame is a flat black rectangle - a poster that renders as a hole in the
 * bento until the clip loads, which with `preload="none"` is until the card
 * scrolls into view.
 */
const POSTER_SEEKS = [0, 0.06, 0.15, 0.3, 0.5]

/** Picks the first frame with something in it, falling back to the least blank. */
async function posterFrame(
  slug: string,
  video: string,
  duration: number,
): Promise<string> {
  const scratch = path.join(CACHE, 'posters')
  await mkdir(scratch, { recursive: true })

  let best: { file: string; stdev: number } | undefined
  for (const [seek, fraction] of POSTER_SEEKS.entries()) {
    const file = path.join(scratch, `${slug.replaceAll('/', '-')}-${seek}.png`)
    /* `-ss` after `-i` decodes to the timestamp rather than the nearest keyframe. */
    await run(ffmpeg, [
      '-y',
      '-i',
      video,
      '-ss',
      String(duration * fraction),
      '-frames:v',
      '1',
      file,
    ])
    const { stdev } = (await sharp(file).greyscale().stats()).channels[0]!
    if (stdev >= POSTER_MIN_STDEV) return file
    if (!best || stdev > best.stdev) best = { file, stdev }
  }

  process.stdout.write(`  ${slug}: no frame above the blank threshold, using the best\n`)
  return best!.file
}

/* -------------------------------------------------------------------------- */
/* verbatim                                                                    */
/* -------------------------------------------------------------------------- */

async function copyVerbatim(asset: SourceVerbatim, source: string): Promise<MediaImage> {
  const out = path.join(PUBLIC_MEDIA, `${asset.slug}.${asset.ext}`)
  await mkdir(path.dirname(out), { recursive: true })
  const bytes = await readFile(source)
  await writeFile(out, bytes)
  await recordWritten(out)

  const { width, height } = await sharp(bytes).metadata()
  return { src: publicUrl(out), width: width ?? 0, height: height ?? 0 }
}

/* -------------------------------------------------------------------------- */
/* orphans                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Deletes anything under `public/media` this run did not write.
 *
 * `public/media` belongs to this script and to nothing else: a slug renamed in
 * the manifest has to take its old file with it, or the tree fills with assets
 * no one can trace and no one dares delete. Anything hand-authored goes
 * elsewhere under `public/`, which is never touched here.
 */
async function pruneOrphans(): Promise<string[]> {
  const removed: string[] = []
  async function walk(dir: string): Promise<void> {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(absolute)
        if ((await readdir(absolute)).length === 0)
          await rm(absolute, { recursive: true })
        continue
      }
      const key = mediaKey(absolute)
      if (!written.has(key)) {
        await rm(absolute)
        removed.push(key)
      }
    }
  }
  await walk(PUBLIC_MEDIA)
  return removed
}

/* -------------------------------------------------------------------------- */
/* main                                                                        */
/* -------------------------------------------------------------------------- */

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} kB`

async function main(): Promise<void> {
  await mkdir(PUBLIC_MEDIA, { recursive: true })
  await mkdir(path.dirname(INDEX_FILE), { recursive: true })

  const index: Record<string, MediaAsset> = {}
  let originalBytes = 0

  for (const asset of SOURCE_ASSETS) {
    const source = await download(asset)
    originalBytes += (await stat(source)).size

    index[asset.slug] =
      asset.kind === 'image'
        ? await encodeImage(asset, source)
        : asset.kind === 'video'
          ? await encodeVideo(asset, source)
          : await copyVerbatim(asset, source)

    process.stdout.write(`  ${asset.slug.padEnd(24)} ${index[asset.slug]!.src}\n`)
  }

  await writeFile(
    INDEX_FILE,
    `${JSON.stringify(
      {
        $comment:
          'Generated by `npm run assets` from scripts/assets/manifest.ts. Do not edit by hand.',
        assets: index,
      },
      null,
      2,
    )}\n`,
  )

  const removed = await pruneOrphans()
  for (const file of removed) process.stdout.write(`  pruned  ${file}\n`)

  const committed = [...written.values()].reduce((a, b) => a + b, 0)
  const video = [...written]
    .filter(([f]) => f.endsWith('.mp4'))
    .reduce((a, [, n]) => a + n, 0)

  process.stdout.write(
    [
      '',
      `  files committed   ${written.size}`,
      `  Framer originals  ${kb(originalBytes)}`,
      `  committed weight  ${kb(committed)}  (video ${kb(video)}, still ${kb(committed - video)})`,
      `  saved             ${(100 - (committed / originalBytes) * 100).toFixed(1)}%`,
      '',
    ].join('\n'),
  )
}

await main()
