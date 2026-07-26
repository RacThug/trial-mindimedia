import type { Metadata } from 'next'
import { PlaceholderPage } from '@/components/ui/placeholder-page.tsx'

export const metadata: Metadata = { title: 'Privacy' }

export default function PrivacyPage() {
  return (
    <PlaceholderPage eyebrow="Privacy" title="A policy would live here.">
      This clone collects nothing: no analytics, no forms, no cookies. The Reference ships
      Google Tag Manager, Google Ads and Framer&apos;s own events endpoint, and PRD
      section 12 leaves all three out.
    </PlaceholderPage>
  )
}
