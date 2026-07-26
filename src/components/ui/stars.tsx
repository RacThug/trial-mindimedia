import { StarIcon } from '../icons.tsx'

/*
 * A Testimonial's rating, drawn as stars.
 *
 * Measured in #10 over the Template Wall: five 21px stars with an 8px gap, in
 * the warm off-white the Reference calls Primary. Every Testimonial on the page
 * is five stars (`tests/content/reference-facts.test.ts` pins that), but the
 * count is the content's to state rather than this component's to assume.
 *
 * The row carries the accessible name and the stars are decorative inside it:
 * eleven identical glyphs would otherwise be announced eleven times, and "5 out
 * of 5" is what a listener actually wants.
 */
export function Stars({ rating }: { readonly rating: number }) {
  return (
    <p
      className="flex items-center gap-2 text-text-warm"
      aria-label={`Rated ${rating} out of 5`}
      role="img"
    >
      {Array.from({ length: rating }, (_, index) => (
        <StarIcon key={index} />
      ))}
    </p>
  )
}
