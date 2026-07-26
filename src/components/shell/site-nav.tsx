import { getLinks } from '@/lib/content'
import { media } from '@/lib/media'
import { NavBar } from './nav-bar'

/*
 * The server half of the nav: it reads content and the asset index, and hands
 * the interactive half only the values it renders.
 *
 * That split is the point. `@/lib/content` pulls in eight JSON files and Zod,
 * and `@/lib/media` the whole generated asset index; importing either from the
 * Client Component would ship all of it to the browser to render four links and
 * an 18px logo.
 */
export async function SiteNav() {
  const links = await getLinks()

  return <NavBar links={links.nav} social={links.social} logo={media['brand/logo']} />
}
