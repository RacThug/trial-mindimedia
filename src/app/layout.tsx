import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
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
  title: 'Browser.supply',
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
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>{children}</body>
    </html>
  )
}
