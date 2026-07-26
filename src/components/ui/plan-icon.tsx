import { PLAN_GLYPHS, type PlanGlyphName } from './plan-glyphs.ts'

/*
 * One Plan-card glyph, drawn at the measured 20x20 (PRD 6.9).
 *
 * Decorative in every position it appears: an Option's glyph sits inside a row
 * whose label is the control's accessible name, and an INCLUDED glyph sits
 * beside its own line of text. Naming either one would say the same thing twice.
 */

export function PlanIcon({ name }: { readonly name: string }) {
  const glyph = PLAN_GLYPHS[name as PlanGlyphName]
  /* The same bargain `asset()` strikes with a media slug: saying which name is
   * missing beats rendering an empty box that a diff reports as a layout bug.
   * `tests/content/reference-facts.test.ts` catches it long before this does. */
  if (!glyph) throw new Error(`plan glyph "${name}" is not in the set`)

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
      {glyph.map((path) => (
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
