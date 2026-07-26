import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { SiteFooter } from '@/components/shell/site-footer.tsx'
import { SiteNav } from '@/components/shell/site-nav.tsx'
import './globals.css'

/*
 * `geist` ships the Geist variable font file and wires it up through
 * `next/font/local`, so the face is served from our own origin. The Reference
 * pays a render-blocking round-trip to fonts.gstatic.com; we must not.
 *
 * Sans only. The Reference's type is Geist and Geist Variable throughout
 * (PRD.md section 4); no Section calls for a monospace face. Importing Geist
 * Mono costs a preload of a font that never paints, which the section 8 budget
 * cannot spare. Add it back the day a Section actually needs it.
 */

export const metadata: Metadata = {
  /* The template names the placeholder routes; the homepage keeps the bare
   * default, which is what the Reference's own `<title>` is. */
  title: {
    default: 'Browser.supply',
    template: '%s - Browser.supply',
  },
  description: 'Launch your online business with a premium Framer website template.',
  /*
   * This is a faithful clone of a real, live commercial site, built as a trial
   * exercise. Keeping it out of search results is not optional - see PRD.md
   * section 3, "Content".
   */
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  /*
   * The shell wraps every route, which is what makes the placeholder pages
   * cheap: each one renders its own `<main>` and gets the nav and footer for
   * free. Both halves read content, and both stay static - an async Server
   * Component still prerenders when its data does not depend on the request.
   */
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
