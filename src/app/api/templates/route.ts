/*
 * `/api/templates` - the one endpoint a page actually fetches. `/templates`
 * consumes it over HTTP to prove the API is genuinely consumable, while the
 * homepage imports the data layer directly; see ADR-0002 for why that asymmetry
 * is deliberate rather than an oversight.
 *
 * `force-static` prerenders the response into the build, so it is served from the
 * CDN with no function invocation. It also means invalid content fails the build
 * here as well as on the pages - there is no request-time path where this can
 * return anything but the collection, which is why there is no error branch to
 * write. The only other status this route produces is Next's own 405 for methods
 * it does not export.
 */

import { getTemplates } from '@/lib/content'

export const dynamic = 'force-static'

export async function GET(): Promise<Response> {
  return Response.json(await getTemplates())
}
