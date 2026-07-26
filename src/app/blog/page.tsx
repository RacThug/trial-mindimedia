import type { Metadata } from 'next'
import { PlaceholderPage } from '@/components/ui/placeholder-page.tsx'

export const metadata: Metadata = { title: 'Blog' }

export default function BlogPage() {
  return (
    <PlaceholderPage eyebrow="Blog" title="Posts would live here.">
      A blog needs a CMS, and PRD section 12 puts one out of scope for this exercise. The
      route is here so the nav link resolves inside the same shell as every other page.
    </PlaceholderPage>
  )
}
