/*
 * The shape of every content file, and the single source of truth for the types
 * that fall out of it - `z.infer` means a field cannot be added to the type
 * without being validated, or validated without appearing in the type.
 *
 * Zod is here for the two things TypeScript cannot do for JSON that ships in the
 * repo: cross-reference a slug against the generated asset index, and produce an
 * error naming the file and path when a hand edit is wrong. It is also the seam
 * that keeps working when content arrives from somewhere other than this repo
 * (see ADR-0004); a `satisfies` check does not survive that move.
 *
 * What lives here are rules of the *model*: a slug resolves, a Plan has exactly
 * one default Option, a rating is 1 to 5. Facts about *this Reference* - nine in
 * the grid, sixteen wall tiles - are asserted in `tests/content/reference-facts`
 * instead, so that adding a tenth Testimonial fails a test with a reason rather
 * than crashing a build with a type error.
 */

import { z } from 'zod'
import { PLAN_GLYPH_NAMES } from '../glyphs/plans.ts'
import { media } from '../media/index.ts'

const MEDIA_SLUGS: ReadonlySet<string> = new Set(Object.keys(media))

const nonEmpty = z.string().min(1)

/** `template/selene-a` - must exist in the generated asset index. */
const mediaSlug = nonEmpty.superRefine((value, ctx) => {
  if (!MEDIA_SLUGS.has(value)) {
    ctx.addIssue({
      code: 'custom',
      input: value,
      message: `unknown media slug "${value}"`,
    })
  }
})

/**
 * `lightning` - one of the Plan cards' fourteen glyphs (PRD 6.9).
 *
 * Cross-referenced for the same reason a media slug is: the pairing of a line of
 * copy with a glyph is content, the glyph itself is markup, and a name that
 * resolves to neither should fail with a message rather than throw at render.
 *
 * An enum rather than the `superRefine` a media slug needs, because the glyph
 * set is a literal the compiler already knows: the parsed type is one of the
 * fourteen and not `string`, so `PlanIcon` looks a name up without a cast and
 * without a runtime guard. `lib/glyphs` carries no React, so the content
 * module stays the leaf it is in ADR-0002.
 */
const glyphName = z.enum(PLAN_GLYPH_NAMES)

/** `custom-project` - stable identity, and safe in a URL or a React key. */
const entitySlug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be lowercase kebab-case')

/** Internal routes are root-relative; anything else must be absolute https. */
const href = nonEmpty.refine(
  (value) => value.startsWith('/') || value.startsWith('https://'),
  {
    message: 'must start with "/" or "https://"',
  },
)

/** Minor units, so Option arithmetic is integer addition. See ADR-0004. */
const money = z.number().int().positive()
const currency = z.literal('USD')

/**
 * An image or clip plus its text alternative. Decorative media has no `alt`
 * field at all rather than an empty one, so "no alternative text" is a
 * statement in the type instead of a value someone forgot to fill in.
 */
const mediaRef = z.object({ slug: mediaSlug, alt: nonEmpty })

/** Duplicate identity is a content bug that would otherwise surface as a React key warning. */
function uniqueSlugs<T extends { slug: string }>(
  items: readonly T[],
  ctx: z.RefinementCtx,
): void {
  const seen = new Set<string>()
  items.forEach((item, index) => {
    if (seen.has(item.slug)) {
      ctx.addIssue({
        code: 'custom',
        input: item.slug,
        path: [index, 'slug'],
        message: `duplicate slug "${item.slug}"`,
      })
    }
    seen.add(item.slug)
  })
}

/* --- collections -------------------------------------------------------- */

export const templatesSchema = z
  .array(
    z.object({
      slug: entitySlug,
      name: nonEmpty,
      category: nonEmpty,
      price: money,
      currency,
      badge: nonEmpty.nullable(),
      href,
      screenshots: z.array(mediaRef).min(1),
    }),
  )
  .nonempty()
  .superRefine(uniqueSlugs)

export const wallTilesSchema = z.array(mediaSlug).nonempty()

export const testimonialsSchema = z
  .object({
    people: z.record(
      entitySlug,
      z.object({
        name: nonEmpty,
        quote: nonEmpty,
        avatar: mediaSlug,
        rating: z.number().int().min(1).max(5),
      }),
    ),
    grid: z.array(entitySlug).nonempty(),
    wall: z.array(entitySlug).nonempty(),
  })
  .superRefine((value, ctx) => {
    for (const block of ['grid', 'wall'] as const) {
      value[block].forEach((slug, index) => {
        if (!(slug in value.people)) {
          ctx.addIssue({
            code: 'custom',
            input: slug,
            path: [block, index],
            message: `"${slug}" is not a key of people`,
          })
        }
      })
    }
  })

export const featuresSchema = z
  .array(z.object({ slug: entitySlug, title: nonEmpty, media: mediaRef }))
  .nonempty()
  .superRefine(uniqueSlugs)

export const stepsSchema = z
  .array(
    z.object({
      slug: entitySlug,
      title: nonEmpty,
      body: nonEmpty,
      media: z.array(mediaRef).min(1),
    }),
  )
  .nonempty()
  .superRefine(uniqueSlugs)

export const plansSchema = z
  .array(
    z
      .object({
        slug: entitySlug,
        eyebrow: nonEmpty,
        name: nonEmpty,
        price: money,
        compareAt: money.nullable(),
        currency,
        blurb: nonEmpty,
        options: z.array(
          z.object({
            label: nonEmpty,
            priceDelta: z.number().int().nonnegative(),
            default: z.boolean(),
            icon: glyphName,
          }),
        ),
        included: z.array(z.object({ label: nonEmpty, icon: glyphName })).nonempty(),
        cta: z.object({ label: nonEmpty, href }),
      })
      .superRefine((plan, ctx) => {
        if (plan.options.length === 0) return
        if (plan.options.length === 1) {
          ctx.addIssue({
            code: 'custom',
            input: plan.options,
            path: ['options'],
            message: 'a Plan with Options needs at least two; one is not a choice',
          })
        }
        const defaults = plan.options.filter((option) => option.default).length
        if (defaults !== 1) {
          ctx.addIssue({
            code: 'custom',
            input: plan.options,
            path: ['options'],
            message: `exactly one Option must be default, found ${defaults}`,
          })
        }
      }),
  )
  .nonempty()
  .superRefine(uniqueSlugs)

export const statsSchema = z
  .array(z.object({ slug: entitySlug, value: nonEmpty, label: nonEmpty }))
  .nonempty()
  .superRefine(uniqueSlugs)

const linkSchema = z.object({ slug: entitySlug, label: nonEmpty, href })

export const linksSchema = z.object({
  nav: z.array(linkSchema).nonempty(),
  footer: z.array(linkSchema).nonempty(),
  social: z.array(linkSchema).nonempty(),
})

/* --- file-level types --------------------------------------------------- */

export type TemplatesFile = z.infer<typeof templatesSchema>
export type WallTilesFile = z.infer<typeof wallTilesSchema>
export type TestimonialsFile = z.infer<typeof testimonialsSchema>
export type FeaturesFile = z.infer<typeof featuresSchema>
export type StepsFile = z.infer<typeof stepsSchema>
export type PlansFile = z.infer<typeof plansSchema>
export type StatsFile = z.infer<typeof statsSchema>
export type LinksFile = z.infer<typeof linksSchema>
