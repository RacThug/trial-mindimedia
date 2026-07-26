import { FeaturedTemplates } from '@/components/sections/featured-templates.tsx'
import { Hero } from '@/components/sections/hero.tsx'
import { TemplateWall } from '@/components/sections/template-wall.tsx'

/*
 * The homepage: thirteen Sections, top to bottom (PRD section 6). The first
 * three landed in #10; the rest follow in #11 and #12.
 *
 * The Sections stack with no wrapper of their own - each owns its full-width
 * band, its own padding and its own rail - because two of them are already
 * full-bleed and a shared container would have to be undone by both.
 */
export default function HomePage() {
  return (
    <main>
      <Hero />
      <TemplateWall />
      <FeaturedTemplates />
    </main>
  )
}
