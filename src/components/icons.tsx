/*
 * The Reference's own glyphs, path for path.
 *
 * Framer renders these from an inline `<symbol>` sprite referenced by `<use>`,
 * so they are markup rather than assets and never went through the #7 pipeline.
 * They were lifted out of the live sprite in #9 - including the viewBoxes,
 * which are the glyphs' natural sizes and not a round 24x24, and are what makes
 * the icons land on the measured 13.632 x 14.25 and 21.682 x 14.874 boxes.
 *
 * Every icon is decorative here: each one sits inside a control that carries its
 * own accessible name, so they are hidden from assistive technology rather than
 * labelled twice.
 */

/** X, formerly Twitter. Measured 13.632 x 14.25. */
export function XIcon() {
  return (
    <svg
      viewBox="0 0 13.632 14.25"
      width="13.632"
      height="14.25"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M 8.113 6.034 L 13.188 0 L 11.985 0 L 7.579 5.239 L 4.059 0 L 0 0 L 5.322 7.923 L 0 14.25 L 1.203 14.25 L 5.856 8.717 L 9.573 14.25 L 13.632 14.25 L 8.113 6.034 Z M 6.466 7.992 L 5.927 7.204 L 1.636 0.926 L 3.483 0.926 L 6.946 5.992 L 7.485 6.781 L 11.986 13.366 L 10.139 13.366 L 6.466 7.993 Z" />
    </svg>
  )
}

/** YouTube. Measured 21.682 x 14.874. */
export function YouTubeIcon() {
  return (
    <svg
      viewBox="0 0 21.682 14.874"
      width="21.682"
      height="14.874"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M 8.623 10.574 L 8.623 4.302 L 14.29 7.438 Z M 21.228 2.327 C 20.978 1.421 20.257 0.709 19.33 0.454 L 19.311 0.449 C 17.002 0.164 14.333 0 11.623 0 C 11.348 0 11.073 0.002 10.799 0.005 L 10.841 0.005 C 7.905 -0.03 4.97 0.128 2.056 0.479 L 2.37 0.448 C 1.441 0.697 0.715 1.403 0.458 2.307 L 0.454 2.325 C 0.165 3.809 0 5.516 0 7.261 L 0.001 7.446 L 0.001 7.436 L 0 7.612 C 0 9.357 0.166 11.063 0.481 12.719 L 0.454 12.547 C 0.704 13.453 1.424 14.164 2.352 14.42 L 2.371 14.425 C 4.679 14.71 7.349 14.873 10.059 14.873 C 10.333 14.873 10.608 14.872 10.883 14.868 L 10.841 14.869 C 13.777 14.904 16.712 14.746 19.626 14.395 L 19.312 14.426 C 20.242 14.177 20.968 13.471 21.225 12.567 L 21.229 12.548 C 21.518 11.065 21.682 9.357 21.682 7.613 L 21.682 7.428 L 21.682 7.438 L 21.682 7.262 C 21.682 5.517 21.517 3.811 21.201 2.155 L 21.228 2.327 Z" />
    </svg>
  )
}

/** The phone menu control, closed. Two bars, not three, in a 36px box. */
export function MenuIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true" focusable="false">
      <path
        d="M 4.219 10.969 L 31.969 10.969 M 4.219 25.219 L 31.969 25.219"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** The same control, open. */
export function CloseIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true" focusable="false">
      <path
        d="M 5.615 5.615 L 27.365 27.365 M 27.365 5.615 L 5.615 27.365"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * The five-pointed star, on the hero's rating and on every Testimonial.
 *
 * Lifted from the sprite in #10, where it is one symbol referenced by `<use>`
 * eleven times over. Measured 21x21 with the fill the Reference's own "Primary"
 * token carries - a warm off-white, not the page's `--color-text`. It is
 * `currentColor` here so a caller can say so once on the row.
 */
export function StarIcon() {
  return (
    <svg
      viewBox="0 0 21 21"
      width="21"
      height="21"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M 11.289 1.372 C 11.144 1.068 10.837 0.875 10.5 0.875 C 10.163 0.875 9.856 1.068 9.711 1.372 L 7.398 6.2 L 2.074 6.899 C 1.739 6.943 1.459 7.175 1.355 7.496 C 1.251 7.818 1.341 8.17 1.586 8.402 L 5.48 12.083 L 4.503 17.34 C 4.441 17.671 4.575 18.009 4.847 18.207 C 5.12 18.406 5.482 18.43 5.778 18.27 L 10.5 15.717 L 15.221 18.27 C 15.518 18.431 15.881 18.407 16.153 18.208 C 16.426 18.009 16.56 17.672 16.498 17.34 L 15.521 12.083 L 19.414 8.402 C 19.66 8.17 19.75 7.817 19.645 7.496 C 19.541 7.175 19.261 6.942 18.926 6.899 L 13.602 6.199 Z" />
    </svg>
  )
}

/**
 * The mark inside the hero's Eyebrow: Framer's own logo, 20x20.
 *
 * The Reference draws it as a background image from an inline data URI rather
 * than from the sprite, which is why it never went through the asset pipeline.
 * Its viewBox is 19.5, not 20 - the glyph's natural size (#10).
 */
export function FramerIcon() {
  return (
    <svg
      viewBox="0 0 19.5 19.5"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M 4.659 2.665 L 15.375 2.665 L 15.375 7.868 L 10.017 7.868 Z M 4.659 7.868 L 10.017 7.868 L 15.375 13.072 L 4.659 13.072 Z M 4.659 13.072 L 10.017 13.072 L 10.017 18.275 Z" />
    </svg>
  )
}

/**
 * The arrow on the three buttons that carry one, drawn at 20x20 (#11).
 *
 * Three of the page's thirteen buttons have it - `See real customer websites`
 * (6.7), `Take the quiz` and `Book a coaching call with me` - and the rest are
 * label-only, which is why this is not part of `ButtonLink`. Lifted from the
 * sprite: a 1.5px stroke with round caps in a 24 viewBox, whose two remaining
 * paths are a square translated to y 27.75 and so never render.
 */
export function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M 8.25 12 L 15.75 12" />
      <path d="M 12.75 9 L 15.75 12 L 12.75 15" />
    </svg>
  )
}

/**
 * The two social glyphs, by the slug `getLinks().social` stores.
 *
 * Typed by `string` rather than by the two keys it happens to hold, so that a
 * lookup for a slug with no glyph is `undefined` in the type system and the
 * caller has to say what it does about that. Narrowing this to `'x' | 'youtube'`
 * would only move the problem to a cast at the call site.
 */
export const SOCIAL_ICONS: Record<string, () => React.ReactElement> = {
  x: XIcon,
  youtube: YouTubeIcon,
}
