import { PLAN_GLYPHS, type PlanGlyphName } from '@/lib/glyphs/plans.ts'

/*
 * One Plan-card glyph, drawn at the measured 20x20 (PRD 6.9).
 *
 * There is no lookup failure to handle: the content schema parses `icon` as one
 * of the fourteen, so a name that resolves to nothing is a validation error in
 * `plans.json` rather than anything this can be handed. `lib/glyphs/plans.ts`
 * says why the paths live under `lib`.
 *
 * Decorative in every position it appears: an Option's glyph sits inside a row
 * whose label is the control's accessible name, and an INCLUDED glyph sits
 * beside its own line of text. Naming either one would say the same thing twice.
 */

export function PlanIcon({ name }: { readonly name: PlanGlyphName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {PLAN_GLYPHS[name].map((path) => (
        <path
          key={`${path.transform}${path.d}`}
          d={path.d}
          transform={path.transform}
          strokeLinecap={'linecap' in path ? path.linecap : undefined}
          strokeLinejoin={'linejoin' in path ? path.linejoin : undefined}
        />
      ))}
    </svg>
  )
}
