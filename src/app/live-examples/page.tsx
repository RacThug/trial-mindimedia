import type { Metadata } from 'next'
import { PlaceholderPage } from '@/components/ui/placeholder-page.tsx'

export const metadata: Metadata = { title: 'Live examples' }

export default function LiveExamplesPage() {
  return (
    <PlaceholderPage eyebrow="Live examples" title="Customer sites live here.">
      The Reference links every template to a published customer site. Building those out
      is beyond the homepage this exercise rebuilds, so this route exists to keep the link
      honest rather than send you to a 404.
    </PlaceholderPage>
  )
}
