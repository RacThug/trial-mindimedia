import { PlaceholderPage } from '@/components/ui/placeholder-page.tsx'

/*
 * #8 left this out of scope on the grounds that content is validated at build
 * time, so a broken Section is not the risk. An unrouted path is, and the shell
 * is where that answer belongs - this renders inside the same nav and footer as
 * every other page, so a wrong URL is a page rather than a dead end.
 */
export default function NotFound() {
  return (
    <PlaceholderPage eyebrow="404" title="That page is not here.">
      Every link on this site points somewhere real, so if you arrived from one of them,
      something is wrong and it is ours. The homepage is one click away.
    </PlaceholderPage>
  )
}
