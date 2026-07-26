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

type IconProps = { readonly className?: string }

/** X, formerly Twitter. Measured 13.632 x 14.25. */
export function XIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 13.632 14.25"
      width="13.632"
      height="14.25"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M 8.113 6.034 L 13.188 0 L 11.985 0 L 7.579 5.239 L 4.059 0 L 0 0 L 5.322 7.923 L 0 14.25 L 1.203 14.25 L 5.856 8.717 L 9.573 14.25 L 13.632 14.25 L 8.113 6.034 Z M 6.466 7.992 L 5.927 7.204 L 1.636 0.926 L 3.483 0.926 L 6.946 5.992 L 7.485 6.781 L 11.986 13.366 L 10.139 13.366 L 6.466 7.993 Z" />
    </svg>
  )
}

/** YouTube. Measured 21.682 x 14.874. */
export function YouTubeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 21.682 14.874"
      width="21.682"
      height="14.874"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M 8.623 10.574 L 8.623 4.302 L 14.29 7.438 Z M 21.228 2.327 C 20.978 1.421 20.257 0.709 19.33 0.454 L 19.311 0.449 C 17.002 0.164 14.333 0 11.623 0 C 11.348 0 11.073 0.002 10.799 0.005 L 10.841 0.005 C 7.905 -0.03 4.97 0.128 2.056 0.479 L 2.37 0.448 C 1.441 0.697 0.715 1.403 0.458 2.307 L 0.454 2.325 C 0.165 3.809 0 5.516 0 7.261 L 0.001 7.446 L 0.001 7.436 L 0 7.612 C 0 9.357 0.166 11.063 0.481 12.719 L 0.454 12.547 C 0.704 13.453 1.424 14.164 2.352 14.42 L 2.371 14.425 C 4.679 14.71 7.349 14.873 10.059 14.873 C 10.333 14.873 10.608 14.872 10.883 14.868 L 10.841 14.869 C 13.777 14.904 16.712 14.746 19.626 14.395 L 19.312 14.426 C 20.242 14.177 20.968 13.471 21.225 12.567 L 21.229 12.548 C 21.518 11.065 21.682 9.357 21.682 7.613 L 21.682 7.428 L 21.682 7.438 L 21.682 7.262 C 21.682 5.517 21.517 3.811 21.201 2.155 L 21.228 2.327 Z" />
    </svg>
  )
}

/** The phone menu control, closed. Two bars, not three, in a 36px box. */
export function MenuIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 36 36"
      width="36"
      height="36"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
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
export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 36 36"
      width="36"
      height="36"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
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

/** The two social glyphs, by the slug `getLinks().social` stores. */
export const SOCIAL_ICONS = {
  x: XIcon,
  youtube: YouTubeIcon,
} as const satisfies Record<string, (props: IconProps) => React.ReactElement>
