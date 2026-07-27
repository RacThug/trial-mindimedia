/*
 * `/api/testimonials` - the twelve people, once each, with the Placements that
 * say where they appear.
 *
 * It deliberately does not return the page's two blocks. `{ grid, wall }` would
 * be readier to render, but it would key an HTTP resource to one page's layout
 * and ship Mark, Aba and Nic twice with nothing saying they are the same person.
 * Sections get their ordered blocks from the data layer instead, which is where
 * page structure belongs.
 */

import { getTestimonials } from '@/lib/content'

export const dynamic = 'force-static'

export async function GET(): Promise<Response> {
  const { all } = await getTestimonials()
  return Response.json(all)
}
