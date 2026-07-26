import type { Metadata } from 'next'
import { TemplateCatalogue } from './template-catalogue'

export const metadata: Metadata = { title: 'Templates' }

/*
 * A placeholder route like the other six, with one difference that is the whole
 * point of it: the list below arrives over HTTP from our own `/api/templates`
 * rather than from an import. See `template-catalogue.tsx` and ADR-0002.
 *
 * The gutter-then-rail nesting is the shell's, so the first card lines up with
 * the logo above it at every Breakpoint.
 */
export default function TemplatesPage() {
  return (
    <main className="px-5 pt-[calc(var(--nav-height)+40px)] pb-24 desktop:px-10">
      <div className="mx-auto flex max-w-shell flex-col gap-10">
        <div className="flex flex-col gap-6">
          <p className="text-eyebrow uppercase text-accent-blue">Templates</p>
          <h1 className="text-h3 text-text tablet:text-h2">The three on the homepage.</h1>
          <p className="max-w-[560px] text-body text-text-muted">
            Fetched in the browser from /api/templates, which is prerendered into the
            build and served as a static file. The full catalogue is out of scope for this
            exercise; these are the Templates the homepage features.
          </p>
        </div>

        <TemplateCatalogue />
      </div>
    </main>
  )
}
