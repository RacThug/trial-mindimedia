'use client'

import { useEffect } from 'react'
import { ButtonLink, buttonClasses } from '@/components/ui/button'
import { PlaceholderPage } from '@/components/ui/placeholder-page'

/*
 * The route-level error boundary. It renders inside the root layout, so a
 * failure anywhere below it still arrives wearing the nav and the footer.
 *
 * `reset()` re-renders the segment rather than reloading the page, which is
 * worth offering: everything here is static, so the overwhelmingly likely cause
 * is a transient client-side failure that a second attempt clears.
 */
export default function RouteError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <PlaceholderPage
      eyebrow="Error"
      title="Something went wrong."
      action={
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={reset} className={buttonClasses()}>
            Try again
          </button>
          <ButtonLink href="/" variant="secondary">
            Back to the homepage
          </ButtonLink>
        </div>
      }
    >
      This page failed to render. Nothing was lost - the site is static, and every page is
      built from content that is validated before it ships.
    </PlaceholderPage>
  )
}
