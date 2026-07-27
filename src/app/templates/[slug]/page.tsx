import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CASE_STUDY_TEMPLATE } from '@/components/sections/case-study-copy.ts'
import { ButtonLink } from '@/components/ui/button.tsx'
import { PlaceholderPage } from '@/components/ui/placeholder-page.tsx'
import { getTemplates } from '@/lib/content'

/*
 * `/templates/<slug>` - the four Template detail links the page draws.
 *
 * The Reference points at all four of these itself, and until #34 none of them
 * had a route: three come from `templates.json`'s own `href` field and the
 * fourth is the case study's. They 404ed for four work packages while
 * `tests/e2e/routes.spec.ts` claimed "no link 404s or dead-ends", because that
 * crawl selected `header a, footer a` and every one of these lives in a Section.
 *
 * A real Template detail page is out of scope (PRD section 12), so this is a
 * placeholder like `/blog` and `/bundle` - it names what the visitor followed
 * and offers the way on. What it must not be is a route that quietly answers
 * 200 for any slug at all: `dynamicParams = false` means the four below are
 * prerendered and everything else 404s at the CDN with no function invocation,
 * so `/templates/anything` stays as wrong as it should be.
 *
 * That flag makes `next start` log `Internal: NoFallbackError` for every
 * unmatched slug. It is Next's own signal that there is no fallback to render
 * and it has already served the 404; the visitor gets `not-found.tsx` inside the
 * shell, which `tests/e2e/routes.spec.ts` asserts. Nothing to fix - noted
 * because a stack trace in a passing test run is worth explaining once.
 */

export const dynamicParams = false

/** What one of these pages needs to name itself. */
type TemplateDetail = {
  readonly slug: string
  readonly name: string
  readonly eyebrow: string
}

/**
 * The three featured Templates plus the case study's, which is the whole set of
 * `/templates/<slug>` links the page can render. Both the params and the page
 * body read this, so a Template added to the Collection gets a route without
 * anybody remembering to add one.
 */
async function detailPages(): Promise<readonly TemplateDetail[]> {
  const templates = await getTemplates()
  return [
    ...templates.map(({ slug, name, category }) => ({ slug, name, eyebrow: category })),
    CASE_STUDY_TEMPLATE,
  ]
}

const find = async (slug: string) =>
  (await detailPages()).find((page) => page.slug === slug)

export async function generateStaticParams() {
  return (await detailPages()).map(({ slug }) => ({ slug }))
}

type PageProps = { readonly params: Promise<{ readonly slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await find((await params).slug)
  return { title: page?.name ?? 'Template' }
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const page = await find((await params).slug)
  /* Unreachable while `dynamicParams` is false - Next answers 404 before this
   * renders. It is here so that turning that flag on cannot silently start
   * serving a page for a Template that does not exist. */
  if (!page) notFound()

  return (
    <PlaceholderPage
      eyebrow={page.eyebrow}
      title={`${page.name} would open here.`}
      action={<ButtonLink href="/templates">Browse all templates</ButtonLink>}
    >
      The Reference links every Template to its own detail and checkout page. Those are
      out of scope for this build, so this route says so rather than dead-ending the link
      that brought you here.
    </PlaceholderPage>
  )
}
