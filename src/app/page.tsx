import { FeatureBento } from '@/components/sections/feature-bento.tsx'
import { FeaturedTemplates } from '@/components/sections/featured-templates.tsx'
import { Hero } from '@/components/sections/hero.tsx'
import { HowItWorks } from '@/components/sections/how-it-works.tsx'
import { SocialProof } from '@/components/sections/social-proof.tsx'
import { TemplateWall } from '@/components/sections/template-wall.tsx'

/*
 * The homepage: thirteen Sections, top to bottom (PRD section 6). The first
 * three landed in #10; the rest follow in #11 and #12.
 *
 * The Sections stack with no wrapper of their own - each owns its full-width
 * band, its own padding and its own rail - because two of them are already
 * full-bleed and a shared container would have to be undone by both.
 *
 * `SocialProof` carries the case study (6.8) inside it. Measured in #11: the two
 * share one band and one framed grid, and the case study is that grid's last
 * row - so there are thirteen Sections in the spec and twelve bands on the page.
 */
export default function HomePage() {
  return (
    <main>
      <Hero />
      <TemplateWall />
      <FeaturedTemplates />
      <FeatureBento />
      <HowItWorks />
      <SocialProof />
    </main>
  )
}
