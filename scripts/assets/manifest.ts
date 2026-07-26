/*
 * The Reference's media, as measured on 2026-07-26.
 *
 * Every entry names one file on `framerusercontent.com` and the slug it is
 * committed under in `public/media`. This file is the only place the Reference's
 * CDN is written down; once `npm run assets` has run, nothing in `src/` knows
 * that Framer ever existed (issue #7, "zero runtime requests").
 *
 * The Framer `id` is the CDN path. It is opaque but stable, and it is the only
 * thread back from a committed file to the Reference, so it is recorded rather
 * than discarded.
 *
 * The encode caps are measured, not chosen. Each image's `sizes` attribute on
 * the Reference was evaluated at 1440, 810 and 390 to get its true rendered
 * width, and the cap here is twice the largest of those - enough for a DPR-2
 * screen, with `next/image` free to serve something smaller. Where Framer's own
 * `sizes` was degenerate the layout arithmetic is quoted in the group comment.
 */

/** Groups exist to keep `public/media` navigable; they are the first slug segment. */
export const MEDIA_GROUPS = [
  'brand',
  'wall',
  'template',
  'feature',
  'step',
  'avatar',
  'story',
] as const

export type MediaGroup = (typeof MEDIA_GROUPS)[number]

type Common = {
  /** CDN path, e.g. `images/kOpVvLnlcYTuD2pThrVguDtn0.png`. */
  readonly id: string
  /** Path under `public/media`, without extension, e.g. `wall/tile-02`. */
  readonly slug: string
  readonly url: string
}

export type SourceImage = Common & {
  readonly kind: 'image'
  /** Longest committed width in px. Never upscales past the original. */
  readonly maxWidth: number
  readonly format: 'webp' | 'jpeg'
  readonly quality: number
}

export type SourceVideo = Common & {
  readonly kind: 'video'
  readonly maxWidth: number
  /** x264 constant rate factor. Lower is better and larger. */
  readonly crf: number
  /** Frames per second ceiling. Three sources are 60fps; none needs to be. */
  readonly fps: number
}

/** Copied byte-for-byte: already minimal, and re-encoding would only cost bytes. */
export type SourceVerbatim = Common & {
  readonly kind: 'verbatim'
  readonly ext: string
}

export type SourceAsset = SourceImage | SourceVideo | SourceVerbatim

const CDN = 'https://framerusercontent.com'

const url = (id: string) => `${CDN}/${id}`

type ImagePreset = Pick<SourceImage, 'maxWidth' | 'format' | 'quality'>
type VideoPreset = Pick<SourceVideo, 'maxWidth' | 'crf' | 'fps'>

function image(slug: string, id: string, preset: ImagePreset): SourceImage {
  return { kind: 'image', slug, id, url: url(id), ...preset }
}

function video(slug: string, id: string, preset: VideoPreset): SourceVideo {
  return { kind: 'video', slug, id, url: url(id), ...preset }
}

function verbatim(slug: string, id: string): SourceVerbatim {
  const ext = id.slice(id.lastIndexOf('.') + 1)
  return { kind: 'verbatim', slug, id, url: url(id), ext }
}

/*
 * Encode presets.
 *
 * Content images sit at quality 90 rather than the usual 80: they are the source
 * `next/image` re-encodes from, so a second lossy pass runs on top of this one.
 * Avatars need 92 despite being the smallest thing on the page - most arrive as
 * already-lossy JPEGs, and re-encoding one is a second generation of loss.
 * Both numbers are the lowest that clear `npm run assets:verify`.
 */
const WALL_TILE: ImagePreset = { maxWidth: 800, format: 'webp', quality: 90 }
const TEMPLATE_SHOT: ImagePreset = { maxWidth: 800, format: 'webp', quality: 90 }
const BENTO_SHOT: ImagePreset = { maxWidth: 1120, format: 'webp', quality: 90 }
const STEP_THUMB: ImagePreset = { maxWidth: 640, format: 'webp', quality: 90 }
const AVATAR: ImagePreset = { maxWidth: 200, format: 'webp', quality: 92 }
const LOGO: ImagePreset = { maxWidth: 128, format: 'webp', quality: 95 }
/* JPEG, not WebP: link unfurlers are the one consumer that still fails on WebP. */
const OG_CARD: ImagePreset = { maxWidth: 1200, format: 'jpeg', quality: 85 }

const WALL_CLIP: VideoPreset = { maxWidth: 720, crf: 30, fps: 30 }
const BENTO_CLIP: VideoPreset = { maxWidth: 1120, crf: 27, fps: 30 }
const STEP_CLIP: VideoPreset = { maxWidth: 900, crf: 27, fps: 30 }
const STORY_CLIP: VideoPreset = { maxWidth: 1280, crf: 27, fps: 30 }

export const SOURCE_ASSETS: readonly SourceAsset[] = [
  /* --- brand -------------------------------------------------------------
   * The logo mark renders at 18px in the nav. The two favicons are 112px PNGs
   * of about 700 bytes each; WebP cannot beat that, so they are copied. The
   * chevrons are the prev/next controls on the Template Wall's Testimonials -
   * the Reference has no image for the X or YouTube icons, which are inline SVG.
   */
  image('brand/logo', 'images/IJzpbfJQNym0HsznaxMArf71yI.png', LOGO),
  verbatim('brand/favicon-light', 'images/7U4nnWQania15MuCxpUcnftbgN8.png'),
  verbatim('brand/favicon-dark', 'images/3lHNrIUX2kOFaK6XVWAoBAk2Ns4.png'),
  image('brand/og-card', 'assets/3mdy0zW2PDB84bi2xvxH2MMws.png', OG_CARD),
  verbatim('brand/chevron-left', 'images/6tTbkXggWgQCAJ4DO2QEdXXmgM.svg'),
  verbatim('brand/chevron-right', 'images/11KSGbIZoRSg4pjdnUoif6MKHI.svg'),

  /* --- Template Wall -----------------------------------------------------
   * Sixteen unique tiles, each rendered three times, in DOM order. Framer's own
   * `sizes` collapses to `100vw` below 1200px, which is why it ships oversized
   * images there; the real grid arithmetic is
   *   desktop >=1200px  (100vw - 48px) / 4  -> 348px at 1440
   *   tablet   810px    (800px  - 36px) / 4 -> 191px
   *   phone    390px    (400px  - 16px) / 3 -> 128px
   * so 348 x 2 = 696, rounded to 800. Note this is DOM order, not necessarily
   * grid order - the column split is still unmeasured (see issue #10).
   */
  video('wall/tile-01', 'assets/osUExPL9UcTjCaR5WkGpZ9umgMo.mp4', WALL_CLIP),
  image('wall/tile-02', 'images/kOpVvLnlcYTuD2pThrVguDtn0.png', WALL_TILE),
  video('wall/tile-03', 'assets/40WEamKWqH9xsMsZpiZpHtVkJQ.mp4', WALL_CLIP),
  image('wall/tile-04', 'images/OfLEZ3GCmoahuvfGfrmWzslY.png', WALL_TILE),
  video('wall/tile-05', 'assets/hVhehREGIYYPdmoPGf9wcIs1Czw.mp4', WALL_CLIP),
  image('wall/tile-06', 'images/jjyvoD2lBxTE7jZuPMvxvyhD2k.png', WALL_TILE),
  image('wall/tile-07', 'images/0f6PkaqiLZfN1bsbnPHZ2f4uLI.png', WALL_TILE),
  image('wall/tile-08', 'images/B2ytiq7HEegjgOAi39MdrRcyA.png', WALL_TILE),
  image('wall/tile-09', 'images/7SyOlg60eFZvlzHMfIl0PF8hxU.png', WALL_TILE),
  video('wall/tile-10', 'assets/atmOB2SHxf8tWksSQytNDBN9pRg.mp4', WALL_CLIP),
  image('wall/tile-11', 'images/Dh9oVpP7C4bmTV8uaLsvXO9g.png', WALL_TILE),
  image('wall/tile-12', 'images/Uqnf1PgPkwidxgvwWdOhxPFHM8.png', WALL_TILE),
  video('wall/tile-13', 'assets/RymEgougpypndvYc172lT0cO61A.mp4', WALL_CLIP),
  image('wall/tile-14', 'images/Qm7mnxFcLW6S48QyE7EqMjNMtLw.png', WALL_TILE),
  video('wall/tile-15', 'assets/yxMKAJM1r1yEkoNhpdlaVJj8R0.mp4', WALL_CLIP),
  image('wall/tile-16', 'images/fDnhhjNDTWzcqF3Z2xqMhuftWw.png', WALL_TILE),

  /* --- featured Templates (PRD 6.4) --------------------------------------
   * Two screenshots per card, identified by their content: Selene is the AI
   * SAAS dashboard, Zenna the yoga studio, Traction the SMMA site. Rendered at
   * 387px on desktop, 351px on phone.
   */
  image('template/selene-a', 'images/3uvfDsqIPM7q8rSaOGFyYwBlxTY.png', TEMPLATE_SHOT),
  image('template/selene-b', 'images/TzManwO1oS8EHBOwOvbrTzOhFLA.png', TEMPLATE_SHOT),
  image('template/zenna-a', 'images/vXvAWjYIGWTlsxGMwYYKkruTc.png', TEMPLATE_SHOT),
  image('template/zenna-b', 'images/PTkpXmjI5Fl5GWCBDVIer4EGX4.png', TEMPLATE_SHOT),
  image('template/traction-a', 'images/zuJG6kXhxRnIhU5dJ0eP451O5sk.png', TEMPLATE_SHOT),
  image('template/traction-b', 'images/6TxjcFEBshZPXv5qbU2AFTwhg.png', TEMPLATE_SHOT),

  /* --- feature bento (PRD 6.5) -------------------------------------------
   * One visual per card, in the PRD's card order. `feature/hosting` is the only
   * HEVC source on the Reference, and it carries an audio track no one hears;
   * re-encoding to H.264 also fixes the browsers that cannot decode it at all.
   * Images render at 552px on desktop.
   */
  video('feature/responsive', 'assets/jAEFGrxvDEsNVix8CRAWNtNslGc.mp4', BENTO_CLIP),
  video('feature/tutorials', 'assets/giZNSxxsU70FwAyC41BzhRuSKU.mp4', BENTO_CLIP),
  image('feature/seo', 'images/ImCLl9j8eQa9s1YaEDAHiV4mak.png', BENTO_SHOT),
  image('feature/cms', 'images/KYxadfiXMm0HJjrgXHzG4FOLN6w.png', BENTO_SHOT),
  video('feature/hosting', 'assets/JJOJjt6a4FXkQggD1CfcIrMTQBs.mp4', BENTO_CLIP),

  /* --- how it works (PRD 6.6) --------------------------------------------
   * Step 1 shows a grid of eight Template thumbnails at a flat 275px. The first
   * of the eight is `template/traction-a`, reused - it is committed once, under
   * the featured-card slug, so the numbering below starts at 02 rather than
   * duplicating a megabyte to make a sequence look tidy.
   */
  image('step/pick-02', 'images/GKE7fSPUyq7ufjERpMf1PI1tw.png', STEP_THUMB),
  image('step/pick-03', 'images/qzntGnD12s4MC5fupuhMZzGk.png', STEP_THUMB),
  image('step/pick-04', 'images/g66HggktmMUlCjXcFLtXKHD18.png', STEP_THUMB),
  image('step/pick-05', 'images/OWnQGlfUJaeyytfwmQBl34wLtE4.png', STEP_THUMB),
  image('step/pick-06', 'images/73SMnSf3pBluwJ5h9gwKxW5734.png', STEP_THUMB),
  image('step/pick-07', 'images/Z0CRrrxwTPqsPbGCyJX2maYBmEs.png', STEP_THUMB),
  image('step/pick-08', 'images/Tc6BToUalAJLVjjJQlNJl5LEhNE.png', STEP_THUMB),
  video('step/customise', 'assets/YSbF8OESHSbh608eBQqp8msHA.mp4', STEP_CLIP),
  video('step/publish', 'assets/jiZ1xo9EVg3oZV9MN9NY8TLl3E.mp4', STEP_CLIP),

  /* --- people ------------------------------------------------------------
   * The hero's avatar stack carries no names on the Reference. The rest are
   * Testimonial avatars, named from the markup: nine appear in the social proof
   * grid (PRD 6.7) and six over the Template Wall, sharing Mark, Aba and Nic,
   * for twelve people rather than the nine the PRD lists. `avatar/ramish` is the
   * footer's "Created by" portrait.
   */
  image('avatar/hero-1', 'images/NO2n5VWQN9B8C02q8GAweTKXg.png', AVATAR),
  image('avatar/hero-2', 'images/p95MazKXIovZxRGEEpNLYorR2c.png', AVATAR),
  image('avatar/hero-3', 'images/a3F8QKnFEFPdezQ4MKzIo7Pu4.jpeg', AVATAR),
  image('avatar/nic', 'images/s6RQSl8WNjkFUdewFboEMXUCFc.jpeg', AVATAR),
  image('avatar/renan', 'images/flqpdQpj9Gss07NyUdR3qJoW2z8.png', AVATAR),
  image('avatar/emon', 'images/rsOwxoPLJMmdBsj0DXv3jPk0M.png', AVATAR),
  image('avatar/widya', 'images/o1NWynU4QcnyXE8Dud3iaK1D8I4.jpeg', AVATAR),
  image('avatar/david', 'images/5ZPScgrf8boeeUumBEjvCS4cU.jpeg', AVATAR),
  image('avatar/mark', 'images/7sPRiHDgnTZ2iVSNNc3vu2XLijk.png', AVATAR),
  image('avatar/samar', 'images/xymVKq1jwIhJcW4e2p3nfXgLgfQ.jpeg', AVATAR),
  image('avatar/aba', 'images/AJoSfbK1YMtwHAOA1JpzbjYkA.jpg', AVATAR),
  image('avatar/nonso', 'images/exXAgAZjVJKJfIWx7hSduJjd81I.jpeg', AVATAR),
  image('avatar/jacob', 'images/YDuXdXmHE1x1nsQb116QvW6D4M.png', AVATAR),
  image('avatar/roni', 'images/t4C5dfaNAJLi3QITY3WhM9JYudk.png', AVATAR),
  image('avatar/seyed', 'images/84a619TPnpLVfRQawB1hy4ADHcM.jpeg', AVATAR),
  image('avatar/ramish', 'images/8Q3wD9sC3p4rB8rfGijPKdgNiRw.jpeg', AVATAR),

  /* --- case study and founder (PRD 6.8, 6.11) ----------------------------
   * The case study visual is a video, not the still image the PRD describes.
   * The founder clip is the Reference's single heaviest asset at 17.0 MB of
   * 4K source for a half-column player.
   */
  video('story/case-study', 'assets/AaTTiVz5ijj8cnTBnwbSPydb0.mp4', STORY_CLIP),
  video('story/founder', 'assets/UhHrKhcrhV3BqnKIX98HSwfDds.mp4', STORY_CLIP),
]
