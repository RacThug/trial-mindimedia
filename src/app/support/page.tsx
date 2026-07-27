import type { Metadata } from 'next'
import { PlaceholderPage } from '@/components/ui/placeholder-page.tsx'

export const metadata: Metadata = { title: 'Support' }

export default function SupportPage() {
  return (
    <PlaceholderPage eyebrow="Support" title="Help would live here.">
      Support on the Reference is a real inbox behind a real product. This clone sells
      nothing, so the route exists to keep the nav link working rather than to promise an
      answer.
    </PlaceholderPage>
  )
}
