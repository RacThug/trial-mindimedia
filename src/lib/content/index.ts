/*
 * The one way to reach content. Consumers import from here and never learn that
 * JSON exists - which is the property that lets the source change later without
 * a single Section being touched (ADR-0004).
 *
 * The accessors are `async` although today they resolve files that ship in the
 * build. That is deliberate: a CMS-backed adapter changes what happens inside
 * these functions and nothing at any call site, and it costs no performance,
 * because an async Server Component still prerenders when its data does not
 * depend on the request. The price is that validation is lazy - a collection no
 * page reads is not parsed during `next build` - which is why the Vitest suite
 * parses all eight files.
 *
 * Resolution happens here too. Content stores a media slug; the caller gets the
 * asset with its intrinsic size, because nothing on this page may render without
 * width and height (PRD section 8), and an HTTP client of `/api/*` has no asset
 * index to look one up in.
 */

import { isVideo, media, type MediaImage } from '../media/index.ts'
import { ContentError, parseCollection } from './parse.ts'
import {
  featuresSchema,
  linksSchema,
  plansSchema,
  statsSchema,
  stepsSchema,
  templatesSchema,
  testimonialsSchema,
  wallTilesSchema,
} from './schema.ts'
import featuresJson from './data/features.json'
import linksJson from './data/links.json'
import plansJson from './data/plans.json'
import statsJson from './data/stats.json'
import stepsJson from './data/steps.json'
import templatesJson from './data/templates.json'
import testimonialsJson from './data/testimonials.json'
import wallTilesJson from './data/wall-tiles.json'

export { ContentError }

/* --- public types ------------------------------------------------------- */

export type MediaKind = 'image' | 'video'

/** A resolved asset: everything a renderer needs, nothing it has to look up. */
export type Asset = {
  readonly slug: string
  readonly kind: MediaKind
  readonly src: string
  readonly width: number
  readonly height: number
  /** width / height, so a tile can hold its space before it loads. */
  readonly aspect: number
  /** Clips only. With `preload="none"` this is what a visitor actually sees. */
  readonly poster?: MediaImage
}

/** An Asset that carries meaning, and therefore a text alternative. */
export type Visual = Asset & { readonly alt: string }

/** A Template Wall tile: backdrop, so it has no `alt` by design. */
export type WallTile = Asset

export type Template = {
  readonly slug: string
  readonly name: string
  readonly category: string
  /** Minor units. Format with `formatMoney`. */
  readonly price: number
  readonly currency: 'USD'
  readonly badge: string | null
  readonly href: string
  readonly screenshots: readonly Visual[]
}

export type Placement = { readonly block: 'grid' | 'wall'; readonly index: number }

export type Testimonial = {
  readonly slug: string
  readonly name: string
  readonly quote: string
  readonly rating: number
  /** Decorative: the person's name sits beside it as text, so it renders `alt=""`. */
  readonly avatar: MediaImage
  readonly placements: readonly Placement[]
}

export type Testimonials = {
  /** All twelve, once each, in authored order. */
  readonly all: readonly Testimonial[]
  /** The social proof grid, in Reference grid order. */
  readonly grid: readonly Testimonial[]
  /** The Template Wall's sequence, in Reference DOM order. */
  readonly wall: readonly Testimonial[]
}

export type Feature = {
  readonly slug: string
  readonly title: string
  readonly media: Visual
}

export type Step = {
  readonly slug: string
  readonly title: string
  readonly body: string
  readonly media: readonly Visual[]
}

export type PlanOption = {
  readonly label: string
  /** Minor units added to the Plan price when selected. */
  readonly priceDelta: number
  readonly default: boolean
}

export type Plan = {
  readonly slug: string
  readonly eyebrow: string
  readonly name: string
  readonly price: number
  readonly compareAt: number | null
  readonly currency: 'USD'
  readonly blurb: string
  readonly options: readonly PlanOption[]
  readonly included: readonly string[]
  readonly cta: { readonly label: string; readonly href: string }
}

export type Stat = {
  readonly slug: string
  readonly value: string
  readonly label: string
}

export type Link = {
  readonly slug: string
  readonly label: string
  readonly href: string
}

export type Links = {
  readonly nav: readonly Link[]
  readonly footer: readonly Link[]
  readonly social: readonly Link[]
}

/* --- resolution --------------------------------------------------------- */

function asset(slug: string): Asset {
  /* The schema already refused any slug absent from the index, so this cannot
   * miss - and if it somehow does, saying so beats handing `undefined` to
   * `next/image`. */
  const entry = media[slug as keyof typeof media]
  if (!entry) throw new Error(`media slug "${slug}" is not in the asset index`)
  const base = {
    slug,
    src: entry.src,
    width: entry.width,
    height: entry.height,
    aspect: entry.width / entry.height,
  }
  return isVideo(entry)
    ? { ...base, kind: 'video', poster: entry.poster }
    : { ...base, kind: 'image' }
}

function visual(ref: { slug: string; alt: string }): Visual {
  return { ...asset(ref.slug), alt: ref.alt }
}

/** Parse once per process. Replaced wholesale by a fetch when content moves. */
function collection<T>(load: () => T): () => Promise<T> {
  let cached: T | undefined
  return async () => (cached ??= load())
}

/* --- accessors ---------------------------------------------------------- */

export const getTemplates = collection((): readonly Template[] =>
  parseCollection('templates.json', templatesSchema, templatesJson).map((template) => ({
    ...template,
    screenshots: template.screenshots.map(visual),
  })),
)

export const getWallTiles = collection((): readonly WallTile[] =>
  parseCollection('wall-tiles.json', wallTilesSchema, wallTilesJson).map(asset),
)

export const getTestimonials = collection((): Testimonials => {
  const file = parseCollection('testimonials.json', testimonialsSchema, testimonialsJson)

  const placements = new Map<string, Placement[]>()
  for (const block of ['grid', 'wall'] as const) {
    file[block].forEach((slug, index) => {
      const found = placements.get(slug) ?? []
      found.push({ block, index })
      placements.set(slug, found)
    })
  }

  const all = Object.entries(file.people).map(([slug, person]) => ({
    slug,
    name: person.name,
    quote: person.quote,
    rating: person.rating,
    avatar: media[person.avatar as keyof typeof media],
    placements: placements.get(slug) ?? [],
  }))

  const bySlug = new Map(all.map((person) => [person.slug, person]))
  const block = (slugs: readonly string[]): readonly Testimonial[] =>
    slugs.map((slug) => bySlug.get(slug)!)

  return { all, grid: block(file.grid), wall: block(file.wall) }
})

export const getFeatures = collection((): readonly Feature[] =>
  parseCollection('features.json', featuresSchema, featuresJson).map((feature) => ({
    ...feature,
    media: visual(feature.media),
  })),
)

export const getSteps = collection((): readonly Step[] =>
  parseCollection('steps.json', stepsSchema, stepsJson).map((step) => ({
    ...step,
    media: step.media.map(visual),
  })),
)

export const getPlans = collection((): readonly Plan[] =>
  parseCollection('plans.json', plansSchema, plansJson),
)

export const getStats = collection((): readonly Stat[] =>
  parseCollection('stats.json', statsSchema, statsJson),
)

export const getLinks = collection((): Links =>
  parseCollection('links.json', linksSchema, linksJson),
)

/**
 * Parse every collection. The build only touches what a page reads, so this is
 * what keeps an unused-but-broken file from reaching `develop`; the Vitest suite
 * calls it.
 */
export async function loadAllContent(): Promise<void> {
  await Promise.all([
    getTemplates(),
    getWallTiles(),
    getTestimonials(),
    getFeatures(),
    getSteps(),
    getPlans(),
    getStats(),
    getLinks(),
  ])
}

/**
 * Minor units to the Reference's own display form: `$129`, `$1,881`. No cents,
 * because no price on the page has any - `maximumFractionDigits: 0` rather than
 * trimming a `.00` afterwards.
 */
export function formatMoney(minorUnits: number, currency: 'USD' = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(minorUnits / 100)
}
