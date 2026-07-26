/*
 * The fourteen glyphs the Plan cards draw beside their Options and their
 * INCLUDED lines (PRD 6.9), lifted path for path from the Reference's sprite in
 * #12 - the same treatment `icons.tsx` gives the six the shell uses.
 *
 * Framer ships each of these as a duotone pair: a filled shape at
 * `fill-opacity: 0` under a stroked one. Only the stroked half ever renders, so
 * only the stroked half is here. Every one is a 24x24 viewBox with a 1.5px
 * stroke, and each path carries its own `translate` inside that box - which is
 * why they are data rather than fourteen hand-written components, and why the
 * translates are kept as measured instead of folded into the `d`.
 *
 * There is no tick repeated down the list: the Reference picks a different glyph
 * for every line of copy, and the same line of copy carries the same glyph on
 * every card. That pairing is content, so it lives in `plans.json` as a name;
 * this file is what a name resolves to.
 *
 * It sits under `src/lib` rather than beside `plan-icon.tsx`, and the reason is
 * the direction of the arrow: `content/schema.ts` cross-references a glyph name
 * the way it cross-references a media slug against the generated asset index, so
 * a name that resolves to nothing fails validation with a message rather than
 * throwing at render. The content module is the leaf (ADR-0002), so it cannot
 * reach into `src/components` to find out what a name means - this is the same
 * shape as `lib/media`, one directory holding what a slug resolves to. Nothing
 * here imports React; `ui/plan-icon.tsx` is what draws it.
 *
 * Two of the fourteen carry the Reference's own linecap and linejoin rather than
 * the round default: `play-circle`'s ring is butt/miter, and is drawn that way.
 */

export type Glyph = {
  readonly d: string
  /** The path's own offset inside the 24x24 box, as the sprite writes it. */
  readonly transform: string
  /** Only where the Reference departs from the round default. */
  readonly linecap?: 'butt'
  readonly linejoin?: 'miter'
}

export const PLAN_GLYPHS = {
  /** The Framer mark. `Framer template`, and `3 months Framer Pro`. */
  framer: [
    {
      d: 'M 0 6 L 0 12 L 6.75 18.75 L 6.75 12 L 13.5 12 L 0 0 L 13.5 0 L 13.5 6 Z',
      transform: 'translate(5.25 3.75)',
    },
  ],
  /** The Figma mark. `Add Figma designs`. */
  figma: [
    {
      d: 'M 0 3 C 0 1.343 1.343 0 3 0 C 4.657 0 6 1.343 6 3 C 6 4.657 4.657 6 3 6 C 1.343 6 0 4.657 0 3 Z',
      transform: 'translate(12.75 9)',
    },
    {
      d: 'M 0 6 L 3 6 C 4.657 6 6 4.657 6 3 C 6 1.343 4.657 0 3 0 L 0 0',
      transform: 'translate(12.75 3)',
    },
    {
      d: 'M 6.75 0 L 3 0 C 1.343 0 0 1.343 0 3 C 0 4.657 1.343 6 3 6 L 6.75 6 Z',
      transform: 'translate(6 3)',
    },
    {
      d: 'M 6.75 0 L 3 0 C 1.343 0 0 1.343 0 3 C 0 4.657 1.343 6 3 6 L 6.75 6 Z',
      transform: 'translate(6 9)',
    },
    {
      d: 'M 6.75 0 L 3.375 0 C 1.511 0 0 1.511 0 3.375 C 0 5.239 1.511 6.75 3.375 6.75 C 5.239 6.75 6.75 5.239 6.75 3.375 Z',
      transform: 'translate(6 15)',
    },
  ],
  /** A tick in a ring. `Add Done-for you`. */
  'check-circle': [
    { d: 'M 0 3 L 2.25 5.25 L 7.5 0', transform: 'translate(8.25 9.75)' },
    {
      d: 'M 0 9 C 0 4.029 4.029 0 9 0 C 13.971 0 18 4.029 18 9 C 18 13.971 13.971 18 9 18 C 4.029 18 0 13.971 0 9 Z',
      transform: 'translate(3 3)',
    },
  ],
  /** A bolt. `Instant access to chosen template`. */
  lightning: [
    {
      d: 'M 10.5 0 L 9 7.5 L 15 9.75 L 4.5 21 L 6 13.5 L 0 11.25 Z',
      transform: 'translate(4.5 1.5)',
    },
  ],
  /** Two arrows round a circle. `Lifetime template updates`, `Two revision rounds`. */
  'arrows-clockwise': [
    { d: 'M 0 4.5 L 4.5 4.5 L 4.5 0', transform: 'translate(15.75 4.5)' },
    {
      d: 'M 14.25 5.068 L 11.599 2.416 C 8.403 -0.779 3.232 -0.809 0 2.349',
      transform: 'translate(6 3.932)',
    },
    { d: 'M 4.5 0 L 0 0 L 0 4.5', transform: 'translate(3.75 15)' },
    {
      d: 'M 0 0 L 2.651 2.651 C 5.847 5.846 11.018 5.877 14.25 2.719',
      transform: 'translate(3.75 15)',
    },
  ],
  /** A play triangle in a ring. `Step-by-step video tutorials`. */
  'play-circle': [
    {
      d: 'M 0 9 C 0 4.029 4.029 0 9 0 C 13.971 0 18 4.029 18 9 C 18 13.971 13.971 18 9 18 C 4.029 18 0 13.971 0 9 Z',
      transform: 'translate(3 3)',
      linecap: 'butt',
      linejoin: 'miter',
    },
    { d: 'M 6 3.75 L 0 0 L 0 7.5 Z', transform: 'translate(10.125 8.25)' },
  ],
  /** `Use on unlimited sites`. */
  infinity: [
    {
      d: 'M 8.497 6.762 L 7.682 7.682 C 6.395 8.969 4.46 9.354 2.778 8.658 C 1.096 7.961 0 6.32 0 4.5 C 0 2.68 1.096 1.039 2.778 0.343 C 4.46 -0.354 6.395 0.031 7.682 1.318 L 13.318 7.682 C 14.605 8.969 16.541 9.354 18.222 8.658 C 19.904 7.961 21 6.32 21 4.5 C 21 2.68 19.904 1.039 18.222 0.343 C 16.541 -0.354 14.605 0.031 13.318 1.318 L 12.504 2.238',
      transform: 'translate(1.5 7.5)',
    },
  ],
  /** Three stacked plates. `All current templates`. */
  stack: [
    { d: 'M 0 0 L 9 5.25 L 18 0', transform: 'translate(3 16.5)' },
    { d: 'M 0 0 L 9 5.25 L 18 0', transform: 'translate(3 12)' },
    { d: 'M 0 5.25 L 9 10.5 L 18 5.25 L 9 0 Z', transform: 'translate(3 2.25)' },
  ],
  /** A four-pointed star with two smaller ones. `Early access to all future templates`. */
  sparkle: [
    {
      d: 'M 5.65 10.849 L 0.485 8.946 C 0.194 8.839 0 8.561 0 8.25 C 0 7.939 0.194 7.661 0.485 7.553 L 5.65 5.65 L 7.553 0.485 C 7.661 0.194 7.939 0 8.25 0 C 8.561 0 8.839 0.194 8.946 0.485 L 10.849 5.65 L 16.014 7.553 C 16.306 7.661 16.5 7.939 16.5 8.25 C 16.5 8.561 16.306 8.839 16.014 8.946 L 10.849 10.849 L 8.946 16.014 C 8.839 16.306 8.561 16.5 8.25 16.5 C 7.939 16.5 7.661 16.306 7.553 16.014 Z',
      transform: 'translate(2.25 5.25)',
    },
    { d: 'M 0 0 L 0 4.5', transform: 'translate(16.5 1.5)' },
    { d: 'M 0 0 L 0 3', transform: 'translate(21 6.75)' },
    { d: 'M 0 0 L 4.5 0', transform: 'translate(14.25 3.75)' },
    { d: 'M 0 0 L 3 0', transform: 'translate(19.5 8.25)' },
  ],
  /** A support headset. `Priority support`. */
  headset: [
    {
      d: 'M 8.25 0 L 8.25 0.75 C 8.25 2.407 6.907 3.75 5.25 3.75 L 0 3.75',
      transform: 'translate(12.75 18.75)',
    },
    {
      d: 'M 18 9 L 15 9 C 14.172 9 13.5 9.672 13.5 10.5 L 13.5 14.25 C 13.5 15.078 14.172 15.75 15 15.75 L 18 15.75 L 18 9 C 18 4.029 13.971 0 9 0 C 4.029 0 0 4.029 0 9 L 0 14.25 C 0 15.078 0.672 15.75 1.5 15.75 L 3 15.75 C 3.828 15.75 4.5 15.078 4.5 14.25 L 4.5 10.5 C 4.5 9.672 3.828 9 3 9 L 0 9',
      transform: 'translate(3 3)',
    },
  ],
  /** One browser window. `Landing page`. */
  browser: [
    {
      d: 'M 0.75 15 C 0.336 15 0 14.664 0 14.25 L 0 0.75 C 0 0.336 0.336 0 0.75 0 L 17.25 0 C 17.664 0 18 0.336 18 0.75 L 18 14.25 C 18 14.664 17.664 15 17.25 15 Z',
      transform: 'translate(3 4.5)',
    },
    { d: 'M 0 0 L 18 0', transform: 'translate(3 9)' },
  ],
  /** Two of them, overlapping. `Multi-page site`. */
  browsers: [
    {
      d: 'M 0.75 12 C 0.336 12 0 11.664 0 11.25 L 0 0.75 C 0 0.336 0.336 0 0.75 0 L 14.25 0 C 14.664 0 15 0.336 15 0.75 L 15 11.25 C 15 11.664 14.664 12 14.25 12 Z',
      transform: 'translate(3 7.5)',
    },
    {
      d: 'M 0 3 L 0 0.75 C 0 0.336 0.336 0 0.75 0 L 14.25 0 C 14.664 0 15 0.336 15 0.75 L 15 11.25 C 15 11.664 14.664 12 14.25 12 L 12 12',
      transform: 'translate(6 4.5)',
    },
    { d: 'M 0 0 L 15 0', transform: 'translate(3 10.5)' },
  ],
  /** A leaf. `Custom design, no template`. */
  leaf: [
    {
      d: 'M 0 9.75 L 7.125 9.75 C 9.817 9.75 12 7.567 12 4.875 C 12 2.183 9.817 0 7.125 0 C 4.433 0 2.25 2.183 2.25 4.875 C 2.25 8.25 0 9.75 0 9.75 Z',
      transform: 'translate(1.5 10.5)',
    },
    {
      d: 'M 0 7.89 C 1.799 5.465 6.286 0 10.462 0 C 10.462 4.176 4.997 8.663 2.572 10.462',
      transform: 'translate(10.538 3)',
    },
    {
      d: 'M 0 0 C 1.274 0.713 2.325 1.765 3.038 3.038',
      transform: 'translate(12.469 8.498)',
    },
  ],
  /** A rocket on the launch pad. `CMS, SEO and launch included`. */
  rocket: [
    {
      d: 'M 10.417 6.833 C 12.667 4.583 12.807 1.907 12.737 0.713 C 12.713 0.337 12.413 0.037 12.037 0.013 C 10.843 -0.057 8.168 0.082 5.917 2.333 L 0 8.25 L 4.5 12.75 Z',
      transform: 'translate(7.5 3.75)',
    },
    {
      d: 'M 9.749 0 L 3.969 0 C 3.77 0 3.58 0.079 3.439 0.219 L 0.219 3.44 C 0.019 3.641 -0.051 3.938 0.039 4.207 C 0.129 4.476 0.363 4.672 0.644 4.712 L 4.499 5.25',
      transform: 'translate(3.001 6.75)',
    },
    {
      d: 'M 5.25 0 L 5.25 5.78 C 5.25 5.978 5.171 6.169 5.031 6.309 L 1.81 9.53 C 1.609 9.73 1.312 9.8 1.043 9.71 C 0.774 9.62 0.578 9.386 0.538 9.105 L 0 5.25',
      transform: 'translate(12 11.25)',
    },
    {
      d: 'M 5.115 2.473 C 4.752 3.269 3.53 5.115 0 5.115 C 0 1.585 1.846 0.363 2.642 0',
      transform: 'translate(3.75 15.135)',
    },
  ],
} as const satisfies Record<string, readonly Glyph[]>

export type PlanGlyphName = keyof typeof PLAN_GLYPHS

/**
 * The same names as a tuple, which is what `z.enum` needs to narrow `icon` from
 * `string` to one of the fourteen. Derived from the map rather than typed out
 * again, so a glyph cannot be added without becoming valid content; the cast is
 * the one thing `Object.keys` cannot tell TypeScript, and the `satisfies` above
 * is what makes the keys trustworthy in the first place.
 */
export const PLAN_GLYPH_NAMES = Object.keys(PLAN_GLYPHS) as [
  PlanGlyphName,
  ...PlanGlyphName[],
]
