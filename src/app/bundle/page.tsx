import type { Metadata } from 'next'
import { PlaceholderPage } from '@/components/ui/placeholder-page.tsx'

export const metadata: Metadata = { title: 'Bundle' }

export default function BundlePage() {
  return (
    <PlaceholderPage eyebrow="Bundle" title="Checkout would start here.">
      The Bundle pill in the nav is the Reference&apos;s main call to action, and on the
      Reference it opens a real checkout. Payments are out of scope, so this route ends
      the journey honestly instead of dead-ending it.
    </PlaceholderPage>
  )
}
