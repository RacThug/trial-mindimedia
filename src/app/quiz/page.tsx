import type { Metadata } from 'next'
import { PlaceholderPage } from '@/components/ui/placeholder-page'

export const metadata: Metadata = { title: 'Quiz' }

export default function QuizPage() {
  return (
    <PlaceholderPage eyebrow="60-second quiz" title="The quiz would run here.">
      The Reference hands its quiz to a third-party form, and the footer link still points
      there. This route backs the on-page calls to action that arrive with the quiz CTA
      and modal in a later work package.
    </PlaceholderPage>
  )
}
