/*
 * `/api/plans` - the three Plans, prices in minor units.
 *
 * Option `priceDelta` values travel with the response because the Clone's Option
 * rows recalculate the price, which is the one deliberate functional Deviation in
 * the build (PRD 6.9). A client that wants the Reference's at-rest behaviour
 * simply renders the default Option and ignores the deltas.
 */

import { getPlans } from '@/lib/content'

export const dynamic = 'force-static'

export async function GET(): Promise<Response> {
  return Response.json(await getPlans())
}
