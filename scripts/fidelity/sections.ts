/*
 * What the Fidelity Harness measures, and how it finds each thing on two pages
 * that share no markup.
 *
 * A Section is a full-width horizontal band (CONTEXT.md), and the way to find
 * one on a page you did not build is to find something inside it and climb. Both
 * sides render the same copy, so a heading is an anchor that survives Framer's
 * class names and ours alike; from there the band is the outermost ancestor that
 * has not swallowed a neighbouring Section's anchor. That rule is the whole
 * mechanism, and it needs no knowledge of either DOM.
 *
 * Two Sections have no heading of their own and are found by their neighbours
 * instead: the Template Wall is the gap between the hero and the featured
 * Templates, and it is a gap rather than an element because the bands stack
 * flush - measured, `main`'s children run 0-533-1677 at 1440 with nothing
 * between them.
 *
 * Twelve rows for thirteen Sections. PRD 6.7 and 6.8 share one band and one
 * framed grid on **both** sides - the case study is that grid's last row, not a
 * band - so splitting them would mean inventing a boundary the Reference does
 * not draw. The quiz modal (6.13) is the other way round: it is not in the page
 * at all during the main pass, because the harness dismisses it, so it gets a
 * capture pass of its own.
 */

/** How a Section is located on a page. */
export type SectionAnchor =
  /** The first match for a CSS selector present on both sides. */
  | { readonly kind: 'selector'; readonly selector: string }
  /** The deepest heading whose text starts with this. */
  | { readonly kind: 'heading'; readonly text: string }
  /** The band has no anchor: it is the gap between two that do. */
  | { readonly kind: 'between'; readonly after: string; readonly before: string }

export type SectionSpec = {
  readonly id: string
  /** The row label in the emitted table. */
  readonly label: string
  /** The PRD subsection this Section is specified by. */
  readonly prd: string
  readonly anchor: SectionAnchor
}

/**
 * The eleven bands of the page, in document order.
 *
 * Order matters twice: `between` reads its neighbours from it, and the emitted
 * table is a walk down the page.
 */
export const SECTIONS: readonly SectionSpec[] = [
  /*
   * `header, nav` rather than either alone, because the two sides mark the same
   * bar up differently: the Clone's is a `<header>` inside a fixed div, the
   * Reference's a `<nav>` inside a fixed container. Both are the first of the
   * two in document order on their own page - the footer's `<nav>` comes far
   * later - and both climb to the same fixed bar.
   */
  {
    id: 'nav',
    label: 'Nav',
    prd: '6.1',
    anchor: { kind: 'selector', selector: 'header, nav' },
  },
  {
    id: 'hero',
    label: 'Hero',
    prd: '6.2',
    anchor: { kind: 'heading', text: 'No back-and-forth with AI' },
  },
  {
    id: 'wall',
    label: 'Template Wall',
    prd: '6.3',
    anchor: { kind: 'between', after: 'hero', before: 'featured' },
  },
  {
    id: 'featured',
    label: 'Featured templates',
    prd: '6.4',
    anchor: { kind: 'heading', text: 'Premium templates built to drive results' },
  },
  {
    id: 'bento',
    label: 'Feature bento',
    prd: '6.5',
    anchor: { kind: 'heading', text: 'Everything you need to launch' },
  },
  {
    id: 'steps',
    label: 'How it works',
    prd: '6.6',
    anchor: { kind: 'heading', text: 'Go live within 1 hour' },
  },
  {
    id: 'proof',
    label: 'Social proof + case study',
    prd: '6.7, 6.8',
    anchor: { kind: 'heading', text: 'Trusted by 2k+ customers' },
  },
  {
    id: 'pricing',
    label: 'Pricing',
    prd: '6.9',
    anchor: { kind: 'heading', text: 'Providing all website-solutions' },
  },
  {
    id: 'quiz-cta',
    label: 'Quiz CTA',
    prd: '6.10',
    anchor: { kind: 'heading', text: 'Not sure which template is for you' },
  },
  {
    id: 'founder',
    label: 'Founder',
    prd: '6.11',
    anchor: { kind: 'heading', text: 'Meet the creator behind the sites' },
  },
  {
    id: 'footer',
    label: 'Footer',
    prd: '6.12',
    anchor: { kind: 'selector', selector: 'footer' },
  },
]

/**
 * The quiz modal's card, per side.
 *
 * The one place the harness needs a side-specific selector, and it is unavoidable:
 * the modal is the Deviation recorded in the README - ours is a native `<dialog>`
 * where the Reference draws a fixed `div` - so there is no shared handle to climb
 * from. The card inside is the same on both, and that is what gets compared.
 */
export const MODAL = {
  label: 'Quiz modal',
  prd: '6.13',
  clone: 'dialog[open]',
  reference: '[data-framer-name="Banner"]',
} as const

/** The Breakpoints the harness captures at, one per PRD section 5 band. */
export const CAPTURE_WIDTHS = [1440, 810, 390] as const
