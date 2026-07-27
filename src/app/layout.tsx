import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { SiteFooter } from '@/components/shell/site-footer.tsx'
import { SiteNav } from '@/components/shell/site-nav.tsx'
import './globals.css'

/*
 * Geist, self-hosted. `next/font` downloads the face at build time and serves it
 * from our own origin, so there is no runtime round-trip to fonts.gstatic.com -
 * which the Reference pays and PRD section 8 will not.
 *
 * **Latin only, which is a #14 performance change worth its own paragraph.** The
 * `geist` npm package ships one file carrying latin, latin-ext and cyrillic
 * together and `next/font/local` serves whatever it is given: **68 kB**, of which
 * this page uses three characters past ASCII - the copyright sign and the acutes
 * in `Dávid` and `café`, all inside `latin`. Asking for the subset gives
 * **29 kB**, and the other two subsets stay in the build unpreloaded for anything
 * that needs them.
 *
 * 39 kB does not look like the biggest lever in PRD section 8's budget and it was
 * the most valuable one left, because of *what* waits for it: the largest
 * contentful paint on this page is text, every candidate above the fold is text,
 * and `font-display: swap` means each one repaints when the face lands. Measured
 * on Lighthouse's throttled mobile profile, LCP went from **3.9s to 2.9s** and
 * the Performance score from 88 to a median 92.
 *
 * The cost is a build-time dependency on `fonts.googleapis.com`, where the
 * `geist` package needed no network at all. Nothing is fetched from Google at
 * runtime - `next/font` downloads the face during `next build` and serves it from
 * our own origin - but a build on a machine with no network now fails where it
 * used to pass.
 *
 * Sans only. The Reference's type is Geist and Geist Variable throughout
 * (PRD.md section 4); no Section calls for a monospace face. Importing Geist
 * Mono costs a preload of a font that never paints. Add it back the day a
 * Section actually needs it.
 */
const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  /* The template names the placeholder routes; the homepage keeps the bare
   * default, which is what the Reference's own `<title>` is. */
  title: {
    default: 'Browser.supply',
    template: '%s - Browser.supply',
  },
  description: 'Launch your online business with a premium Framer website template.',
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
    <html lang="en" className={geistSans.variable}>
      <body>
        {/*
         * Scroll-Appear renders its resting state - `opacity: 0` and a 30px
         * offset - into the server markup, so that a Section cannot paint before
         * it is asked to appear. Without JavaScript nothing ever asks, and the
         * page would be blank below the nav. The Reference has exactly that
         * hole; a Deviation this cheap is worth taking (CONTEXT.md).
         */}
        <noscript>
          <style>{'[data-appear]{opacity:1!important;transform:none!important}'}</style>
        </noscript>

        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
