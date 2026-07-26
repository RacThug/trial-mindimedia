'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { buttonClasses } from '@/components/ui/button.tsx'
import type { Template } from '@/lib/content'
import { formatMoney } from '@/lib/content/money.ts'

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

  return (
    <ul className="grid gap-10 tablet:grid-cols-2 desktop:grid-cols-3">
      {state.templates.map((template) => (
        <TemplateCard key={template.slug} template={template} />
      ))}
    </ul>
  )
}

function TemplateCard({ template }: { readonly template: Template }) {
  const [screenshot] = template.screenshots

  return (
    <li className="flex flex-col gap-4">
      {screenshot && (
        <div className="relative overflow-hidden rounded-[12px] bg-surface-1">
          <Image
            src={screenshot.src}
            alt={screenshot.alt}
            width={screenshot.width}
            height={screenshot.height}
            sizes="(min-width: 1200px) 387px, (min-width: 810px) 45vw, 90vw"
            className="h-auto w-full"
          />
          {template.badge && (
            <span className="absolute top-4 left-4 rounded-button bg-surface-2 px-3 py-1 text-eyebrow uppercase text-accent-green">
              {template.badge}
            </span>
          )}
        </div>
      )}

      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-h5 text-text">{template.name}</h2>
        <p className="text-body text-text-muted">
          {formatMoney(template.price, template.currency)}
        </p>
      </div>
      <p className="text-eyebrow uppercase text-text-muted">{template.category}</p>
    </li>
  )
}
