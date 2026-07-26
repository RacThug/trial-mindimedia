'use client'

import { useEffect, useState } from 'react'
import { buttonClasses } from '@/components/ui/button.tsx'
import { TemplateCard } from '@/components/ui/template-card.tsx'
import type { Template } from '@/lib/content'

/*
 * The one place in the build that reads content over HTTP.
 *
 * Everything else imports the data layer directly so it can prerender; this page
 * fetches `/api/templates` from the browser instead, which is what makes the
 * endpoint demonstrably consumable rather than merely present (ADR-0002). It has
 * to happen client-side: a Server Component cannot fetch its own origin during
 * `next build`, because no server is listening yet, and forcing this page
 * dynamic to work around that would trade a real property for a fake one.
 *
 * The type comes from the data layer and is erased at build time. The values
 * arrive as JSON, so `Template` here is a claim about the endpoint's contract,
 * which `tests/api/routes.test.ts` is what actually holds it to.
 */

type State =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly templates: readonly Template[] }
  | { readonly status: 'failed'; readonly reason: string }

export function TemplateCatalogue() {
  const [state, setState] = useState<State>({ status: 'loading' })
  /* The retry trigger. The click sets `loading` and bumps this; the effect below
   * only ever subscribes to the request and answers it, so nothing here sets
   * state during a render. */
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/templates', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`answered ${response.status}`)
        return response.json() as Promise<Template[]>
      })
      .then((templates) => setState({ status: 'ready', templates }))
      .catch((error: unknown) => {
        /* Strict Mode's second pass aborts the first request. That is not a
         * failure and must not paint one. */
        if (controller.signal.aborted) return
        setState({
          status: 'failed',
          reason: error instanceof Error ? error.message : 'did not answer',
        })
      })

    return () => controller.abort()
  }, [attempt])

  if (state.status === 'loading') {
    return (
      <p role="status" className="text-body text-text-muted">
        Loading templates from /api/templates
      </p>
    )
  }

  if (state.status === 'failed') {
    return (
      <div role="alert" className="flex flex-col items-start gap-6">
        <p className="text-body text-text-muted">
          /api/templates {state.reason}. Nothing else on the site depends on it - the
          homepage reads the same content directly.
        </p>
        <button
          type="button"
          onClick={() => {
            setState({ status: 'loading' })
            setAttempt((previous) => previous + 1)
          }}
          className={buttonClasses()}
        >
          Try again
        </button>
      </div>
    )
  }

  /* The same card the homepage's featured Section renders (PRD 6.4), from the
   * same values - here they have been over the wire first. */
  return (
    <ul className="grid gap-10 tablet:grid-cols-2 desktop:grid-cols-3">
      {state.templates.map((template) => (
        <li key={template.slug}>
          <TemplateCard
            template={template}
            headingLevel="h2"
            sizes="(min-width: 1200px) 387px, (min-width: 810px) 45vw, calc(100vw - 40px)"
          />
        </li>
      ))}
    </ul>
  )
}
