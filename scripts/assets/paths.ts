/*
 * Where the asset pipeline puts things. Shared by `build.ts`, `verify.ts` and
 * the tests, all three of which need to agree on them or they will pass while
 * looking at different files.
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = fileURLToPath(new URL('../..', import.meta.url))

/** Downloaded Framer originals. Gitignored; `npm run assets` refills it. */
export const CACHE = path.join(REPO, '.cache/framer')

export const PUBLIC_DIR = path.join(REPO, 'public')
export const PUBLIC_MEDIA = path.join(PUBLIC_DIR, 'media')
export const INDEX_FILE = path.join(REPO, 'src/lib/media/asset-index.json')

/**
 * A file's identity within the media tree: its path under `public/media`, with
 * forward slashes on every platform so a Windows build writes the same index a
 * Linux one does.
 */
export const mediaKey = (absolute: string) =>
  path.relative(PUBLIC_MEDIA, absolute).replaceAll('\\', '/')

/** The URL that same file is served from. */
export const publicUrl = (absolute: string) => `/media/${mediaKey(absolute)}`
